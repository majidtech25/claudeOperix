"""
Billing router — M-Pesa STK Push + Stripe Checkout
Handles plan upgrades for Basic and Pro subscriptions.
"""
import base64
import hashlib
import hmac
import httpx
import stripe
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Literal

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus, PlanType
from app.dependencies import get_current_active_user, get_organization_id
from app.utils.audit import log_audit_event
from app.models.payment import Payment, PaymentMethod, PaymentStatus

import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["Billing"])

stripe.api_key = settings.STRIPE_SECRET_KEY

# ── Plan config ───────────────────────────────────────────────
PLANS = {
    "basic": {
        "name":      "Basic",
        "price_kes": settings.PLAN_BASIC_PRICE_KES,
        "max_users": settings.BASIC_MAX_USERS,
        "days":      30,
    },
    "pro": {
        "name":      "Pro",
        "price_kes": settings.PLAN_PRO_PRICE_KES,
        "max_users": settings.PRO_MAX_USERS,
        "days":      30,
    },
}


# ── Helpers ───────────────────────────────────────────────────
def get_mpesa_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")


def get_mpesa_password(timestamp: str) -> str:
    raw = settings.MPESA_SHORTCODE + settings.MPESA_PASSKEY + timestamp
    return base64.b64encode(raw.encode()).decode()


async def get_mpesa_token() -> str:
    url = (
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        if settings.MPESA_ENV == "sandbox"
        else "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET),
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def upgrade_subscription(
    db: AsyncSession,
    org_id: str,
    plan: str,
    payment_method: str,
    transaction_ref: str,
):

    """Upgrade org subscription after confirmed payment."""
    result = await db.execute(
        select(Subscription).where(Subscription.organization_id == org_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    plan_cfg = PLANS[plan]
    now = datetime.now(timezone.utc)

    sub.plan          = PlanType(plan)
    sub.status        = SubscriptionStatus.ACTIVE
    sub.max_users     = plan_cfg["max_users"]
    sub.expires_at    = now + timedelta(days=plan_cfg["days"])
    sub.updated_at    = now

    await db.commit()
    await db.refresh(sub)

    log_audit_event(
        action="SUBSCRIPTION_UPGRADED",
        performed_by_id=org_id,
        organization_id=org_id,
        target_resource="subscription",
        target_id=sub.id,
        metadata={
            "plan": plan,
            "payment_method": payment_method,
            "transaction_ref": transaction_ref,
            "expires_at": sub.expires_at.isoformat(),
        },
    )
    return sub

async def record_payment(
    db: AsyncSession,
    org_id: str,
    amount: float,
    method: str,
    reference: str,
    status: str = "success",
):
    """Store a payment record after confirmed payment."""
    payment = Payment(
        organization_id=org_id,
        amount=amount,
        method=PaymentMethod(method),
        status=PaymentStatus(status),
        transaction_reference=reference,
    )
    db.add(payment)
    await db.commit()
    return payment


# ══════════════════════════════════════════════════════════════
# M-PESA STK PUSH
# ══════════════════════════════════════════════════════════════

class MpesaPayRequest(BaseModel):
    phone:  str                          # 2547XXXXXXXX
    plan:   Literal["basic", "pro"]


class MpesaPayResponse(BaseModel):
    checkout_request_id: str
    merchant_request_id: str
    message:             str


@router.post("/mpesa/pay", response_model=MpesaPayResponse)
async def mpesa_stk_push(
    data: MpesaPayRequest,
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger M-Pesa STK push to merchant's phone."""
    plan_cfg = PLANS.get(data.plan)
    if not plan_cfg:
        raise HTTPException(status_code=400, detail="Invalid plan")

    # Normalize phone — strip leading 0 or +254, ensure 2547...
    phone = data.phone.strip().replace("+", "").replace(" ", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    if not phone.startswith("254"):
        raise HTTPException(status_code=400, detail="Invalid phone. Use format: 0712345678 or 254712345678")

    timestamp = get_mpesa_timestamp()
    password  = get_mpesa_password(timestamp)
    token     = await get_mpesa_token()

    stk_url = (
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        if settings.MPESA_ENV == "sandbox"
        else "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    )

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password":          password,
        "Timestamp":         timestamp,
        "TransactionType":   "CustomerPayBillOnline",
        "Amount":            plan_cfg["price_kes"],
        "PartyA":            phone,
        "PartyB":            settings.MPESA_SHORTCODE,
        "PhoneNumber":       phone,
        "CallBackURL":       settings.MPESA_CALLBACK_URL,
        "AccountReference":  f"OPERIX-{org_id[:8].upper()}",
        "TransactionDesc":   f"Operix {plan_cfg['name']} Plan - 30 days",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            stk_url,
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"M-Pesa error: {resp.text}")

    result = resp.json()
    if result.get("ResponseCode") != "0":
        raise HTTPException(
            status_code=400,
            detail=result.get("ResponseDescription", "STK push failed"),
        )

    # Store pending payment context in subscription metadata for callback matching
    sub_result = await db.execute(
        select(Subscription).where(Subscription.organization_id == org_id)
    )
    sub = sub_result.scalar_one_or_none()
    if sub:
        sub.updated_at = datetime.now(timezone.utc)
        # Store checkout_request_id in notes for callback matching
        # In production use a payments table — for MVP store in sub
        await db.commit()

    log_audit_event(
        action="MPESA_STK_PUSH_INITIATED",
        performed_by_id=current_user.id,
        organization_id=org_id,
        target_resource="subscription",
        metadata={
            "plan": data.plan,
            "phone": phone,
            "checkout_request_id": result.get("CheckoutRequestID"),
        },
    )

    return MpesaPayResponse(
        checkout_request_id=result["CheckoutRequestID"],
        merchant_request_id=result["MerchantRequestID"],
        message="STK push sent. Enter your M-Pesa PIN on your phone.",
    )


@router.post("/mpesa/callback")
async def mpesa_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Safaricom calls this URL after payment completes or fails.
    Upgrades subscription on success.
    """
    body = await request.json()
    logger.info(f"[MPESA CALLBACK] Received: {body}")

    stk = body.get("Body", {}).get("stkCallback", {})
    result_code = stk.get("ResultCode")
    logger.info(f"[MPESA CALLBACK] ResultCode={result_code}, CheckoutRequestID={stk.get('CheckoutRequestID')}")

    stk = body.get("Body", {}).get("stkCallback", {})
    result_code = stk.get("ResultCode")
    checkout_request_id = stk.get("CheckoutRequestID", "")
    merchant_request_id = stk.get("MerchantRequestID", "")

    if result_code != 0:
        # Payment failed or cancelled
        log_audit_event(
            action="MPESA_PAYMENT_FAILED",
            performed_by_id="system",
            organization_id=None,
            target_resource="payment",
            metadata={
                "result_code": result_code,
                "result_desc": stk.get("ResultDesc"),
                "checkout_request_id": checkout_request_id,
            },
        )
        return {"ResultCode": 0, "ResultDesc": "Accepted"}

    # Extract payment details from callback metadata
    items = stk.get("CallbackMetadata", {}).get("Item", [])
    meta  = {item["Name"]: item.get("Value") for item in items}

    amount        = meta.get("Amount")
    phone         = str(meta.get("PhoneNumber", ""))
    mpesa_receipt = meta.get("MpesaReceiptNumber", "")
    account_ref   = meta.get("AccountReference", "")

    # Extract org_id from AccountReference: OPERIX-{org_id[:8]}
    org_prefix = account_ref.replace("OPERIX-", "").lower() if account_ref else ""

    # Determine plan from amount
    plan = None
    if amount == settings.PLAN_BASIC_PRICE_KES:
        plan = "basic"
    elif amount == settings.PLAN_PRO_PRICE_KES:
        plan = "pro"

    if plan and org_prefix:
        # Find org by partial id match
        from app.models.organization import Organization
        from sqlalchemy import func
        result = await db.execute(
            select(Organization).where(
                func.lower(func.substr(Organization.id, 1, 8)) == org_prefix
            )
        )
        org = result.scalar_one_or_none()
        if org:
            await upgrade_subscription(
                db=db,
                org_id=org.id,
                plan=plan,
                payment_method="mpesa",
                transaction_ref=mpesa_receipt,
            )
            await record_payment(
                db=db,
                org_id=org.id,
                amount=float(amount),
                method="mpesa",
                reference=mpesa_receipt,
            )

    log_audit_event(
        action="MPESA_PAYMENT_SUCCESS",
        performed_by_id="system",
        organization_id=None,
        target_resource="payment",
        metadata={
            "amount": amount,
            "phone": phone,
            "mpesa_receipt": mpesa_receipt,
            "account_ref": account_ref,
            "plan": plan,
        },
    )

    return {"ResultCode": 0, "ResultDesc": "Accepted"}


@router.post("/mpesa/query")
async def mpesa_query_status(
    checkout_request_id: str,
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(get_current_active_user),
):
    """Poll M-Pesa to check if STK push was completed."""
    timestamp = get_mpesa_timestamp()
    password  = get_mpesa_password(timestamp)
    token     = await get_mpesa_token()

    url = (
        "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query"
        if settings.MPESA_ENV == "sandbox"
        else "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query"
    )

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password":          password,
        "Timestamp":         timestamp,
        "CheckoutRequestID": checkout_request_id,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )

    return resp.json()


# ══════════════════════════════════════════════════════════════
# STRIPE CHECKOUT
# ══════════════════════════════════════════════════════════════

class StripeCheckoutRequest(BaseModel):
    plan: Literal["basic", "pro"]


class StripeCheckoutResponse(BaseModel):
    checkout_url: str
    session_id:   str


@router.post("/stripe/checkout", response_model=StripeCheckoutResponse)
async def stripe_checkout(
    data: StripeCheckoutRequest,
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(get_current_active_user),
):
    """Create a Stripe Checkout session and return the URL."""
    plan_cfg = PLANS.get(data.plan)
    if not plan_cfg:
        raise HTTPException(status_code=400, detail="Invalid plan")

    # Convert KES to smallest unit — Stripe uses cents/smallest unit
    # KES does not have sub-units so multiply by 100 for Stripe
    amount_cents = plan_cfg["price_kes"] * 100

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency":     "kes",
                    "unit_amount":  amount_cents,
                    "product_data": {
                        "name":        f"Operix {plan_cfg['name']} Plan",
                        "description": f"30-day subscription — up to {plan_cfg['max_users']} users",
                    },
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{settings.STRIPE_SUCCESS_URL}?session_id={{CHECKOUT_SESSION_ID}}&plan={data.plan}&org_id={org_id}",
            cancel_url=settings.STRIPE_CANCEL_URL,
            metadata={
                "org_id": org_id,
                "plan":   data.plan,
                "user_id": current_user.id,
            },
            customer_email=current_user.email,
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(e)}")

    log_audit_event(
        action="STRIPE_CHECKOUT_CREATED",
        performed_by_id=current_user.id,
        organization_id=org_id,
        target_resource="subscription",
        metadata={"plan": data.plan, "session_id": session.id},
    )

    return StripeCheckoutResponse(
        checkout_url=session.url,
        session_id=session.id,
    )


@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Stripe calls this after checkout.session.completed.
    Upgrades subscription on success.
    """
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        logger.info(f"[STRIPE WEBHOOK] Event type: {event['type']}")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    if event["type"] == "checkout.session.completed":
        session  = event["data"]["object"]
        meta     = session.get("metadata", {})
        org_id   = meta.get("org_id")
        plan     = meta.get("plan")
        session_id = session.get("id")

        if org_id and plan:
            await upgrade_subscription(
                db=db,
                org_id=org_id,
                plan=plan,
                payment_method="stripe",
                transaction_ref=session_id,
            )
        amount_total = session.get("amount_total", 0) / 100  # convert from cents
        await record_payment(
            db=db,
            org_id=org_id,
            amount=amount_total,
            method="stripe",
            reference=session_id,
        )

        log_audit_event(
            action="STRIPE_PAYMENT_SUCCESS",
            performed_by_id=meta.get("user_id", "system"),
            organization_id=org_id,
            target_resource="subscription",
            metadata={"plan": plan, "session_id": session_id},
        )

    return {"status": "ok"}


@router.get("/stripe/verify")
async def stripe_verify_session(
    session_id: str,
    org_id: str = Depends(get_organization_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Called from the success page to verify payment and upgrade subscription.
    Fallback in case webhook hasn't fired yet.
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        logger.info(f"[STRIPE VERIFY] session_id={session_id} payment_status={session.payment_status}")
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    if session.payment_status == "paid":
        meta = session.get("metadata", {})
        plan = meta.get("plan")
        if plan and meta.get("org_id") == org_id:
            sub = await upgrade_subscription(
                db=db,
                org_id=org_id,
                plan=plan,
                payment_method="stripe",
                transaction_ref=session_id,
            )
            return {"status": "success", "plan": plan, "expires_at": sub.expires_at.isoformat()}

    return {"status": session.payment_status}


# ── Current subscription status ───────────────────────────────
@router.get("/status")
async def billing_status(
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns current subscription info for the billing page."""
    result = await db.execute(
        select(Subscription).where(Subscription.organization_id == org_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found")

    now = datetime.now(timezone.utc)
    expires_at = sub.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    days_left = max(0, (expires_at - now).days)

    return {
        "plan":          sub.plan,
        "status":        sub.status,
        "expires_at":    expires_at.isoformat(),
        "days_left":     days_left,
        "max_users":     sub.max_users,
        "plans":         PLANS,
        "stripe_pub_key": settings.STRIPE_PUBLISHABLE_KEY,
    }

from app.schemas.payment import PaymentRead  # add after creating schema below

@router.get("/history", response_model=list[PaymentRead])
async def payment_history(
    org_id: str = Depends(get_organization_id),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return payment history for the org."""
    result = await db.execute(
        select(Payment)
        .where(Payment.organization_id == org_id)
        .order_by(Payment.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()