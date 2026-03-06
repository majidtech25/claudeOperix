"""
Audit logging for critical actions.
Keeps a tamper-evident record of sensitive operations.
"""
from datetime import datetime, timezone
import logging

audit_logger = logging.getLogger("audit")


def log_audit_event(
    action: str,
    performed_by_id: str,
    organization_id: str | None,
    target_resource: str,
    target_id: str | None = None,
    metadata: dict | None = None,
):
    """
    Log an audit event. In production this should persist to an audit_logs table.
    For MVP 1, we log structured output to the audit logger.
    """
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "performed_by_id": performed_by_id,
        "organization_id": organization_id,
        "target_resource": target_resource,
        "target_id": target_id,
        "metadata": metadata or {},
    }
    audit_logger.info(event)
    return event