from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
import re


class OrganizationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    owner_full_name: str
    owner_email: EmailStr
    owner_password: str

    @field_validator("owner_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("name")
    @classmethod
    def generate_slug_check(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Organization name too short")
        return v.strip()


class OrganizationRead(BaseModel):
    id: str
    name: str
    slug: str
    email: str
    phone: str | None
    address: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class OrganizationUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None