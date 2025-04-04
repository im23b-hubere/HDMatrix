import datetime
from enum import Enum
from typing import List, Optional, Dict, Any

# Enumeration für Benutzerrollen
class UserRole(Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    HR = "hr" 
    EMPLOYEE = "employee"
    GUEST = "guest"

class User:
    def __init__(
        self,
        id: int = None,
        tenant_id: int = None,
        email: str = "",
        password_hash: str = "",
        first_name: str = "",
        last_name: str = "",
        role_id: int = None,
        is_active: bool = True,
        is_email_verified: bool = False,
        last_login: datetime.datetime = None,
        created_at: datetime.datetime = None,
        updated_at: datetime.datetime = None,
        employee_id: Optional[int] = None,
        profile_image: Optional[str] = None,
        phone: Optional[str] = None,
        language: str = "de",
        timezone: str = "Europe/Berlin",
        failed_login_attempts: int = 0,
        account_locked_until: Optional[datetime.datetime] = None,
        reset_password_token: Optional[str] = None,
        reset_password_expires: Optional[datetime.datetime] = None,
        email_verification_token: Optional[str] = None,
        email_verification_expires: Optional[datetime.datetime] = None
    ):
        self.id = id
        self.tenant_id = tenant_id
        self.email = email
        self.password_hash = password_hash
        self.first_name = first_name
        self.last_name = last_name
        self.role_id = role_id
        self.is_active = is_active
        self.is_email_verified = is_email_verified
        self.last_login = last_login
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()
        self.employee_id = employee_id
        self.profile_image = profile_image
        self.phone = phone
        self.language = language
        self.timezone = timezone
        self.failed_login_attempts = failed_login_attempts
        self.account_locked_until = account_locked_until
        self.reset_password_token = reset_password_token
        self.reset_password_expires = reset_password_expires
        self.email_verification_token = email_verification_token
        self.email_verification_expires = email_verification_expires
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self, with_sensitive_data: bool = False) -> Dict[str, Any]:
        result = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "role_id": self.role_id,
            "is_active": self.is_active,
            "is_email_verified": self.is_email_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "employee_id": self.employee_id,
            "profile_image": self.profile_image,
            "phone": self.phone,
            "language": self.language,
            "timezone": self.timezone
        }
        
        # Sensible Daten nur hinzufügen, wenn explizit angefordert (z.B. für interne API-Aufrufe)
        if with_sensitive_data:
            result.update({
                "failed_login_attempts": self.failed_login_attempts,
                "account_locked_until": self.account_locked_until.isoformat() if self.account_locked_until else None,
                "has_reset_token": self.reset_password_token is not None,
                "has_verification_token": self.email_verification_token is not None
            })
        
        return result

class Tenant:
    def __init__(
        self,
        id: int = None,
        name: str = "",
        subdomain: str = "",
        is_active: bool = True,
        created_at: datetime.datetime = None,
        updated_at: datetime.datetime = None,
        max_users: int = 0,
        logo_url: Optional[str] = None,
        primary_color: Optional[str] = None,
        secondary_color: Optional[str] = None,
        subscription_plan: str = "free",
        subscription_expires: Optional[datetime.datetime] = None,
        custom_domain: Optional[str] = None,
        contact_email: Optional[str] = None,
        contact_phone: Optional[str] = None,
        address: Optional[str] = None,
        city: Optional[str] = None,
        postal_code: Optional[str] = None,
        country: Optional[str] = None,
        tax_id: Optional[str] = None
    ):
        self.id = id
        self.name = name
        self.subdomain = subdomain
        self.is_active = is_active
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()
        self.max_users = max_users
        self.logo_url = logo_url
        self.primary_color = primary_color
        self.secondary_color = secondary_color
        self.subscription_plan = subscription_plan
        self.subscription_expires = subscription_expires
        self.custom_domain = custom_domain
        self.contact_email = contact_email
        self.contact_phone = contact_phone
        self.address = address
        self.city = city
        self.postal_code = postal_code
        self.country = country
        self.tax_id = tax_id
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "subdomain": self.subdomain,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "max_users": self.max_users,
            "logo_url": self.logo_url,
            "primary_color": self.primary_color,
            "secondary_color": self.secondary_color,
            "subscription_plan": self.subscription_plan,
            "subscription_expires": self.subscription_expires.isoformat() if self.subscription_expires else None,
            "custom_domain": self.custom_domain,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "address": self.address,
            "city": self.city,
            "postal_code": self.postal_code,
            "country": self.country,
            "tax_id": self.tax_id
        }

class Role:
    def __init__(
        self,
        id: int = None,
        name: str = "",
        description: str = "",
        is_system_role: bool = False
    ):
        self.id = id
        self.name = name
        self.description = description
        self.is_system_role = is_system_role
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_system_role": self.is_system_role
        }

class Permission:
    def __init__(
        self,
        id: int = None,
        name: str = "",
        description: str = "",
        module: str = ""
    ):
        self.id = id
        self.name = name
        self.description = description
        self.module = module
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "module": self.module
        }

class RolePermission:
    def __init__(
        self,
        id: int = None,
        role_id: int = None,
        permission_id: int = None
    ):
        self.id = id
        self.role_id = role_id
        self.permission_id = permission_id

class LoginAttempt:
    def __init__(
        self,
        id: int = None,
        user_id: Optional[int] = None,
        email: str = "",
        ip_address: str = "",
        user_agent: str = "",
        success: bool = False,
        timestamp: datetime.datetime = None,
        reason: Optional[str] = None
    ):
        self.id = id
        self.user_id = user_id
        self.email = email
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.success = success
        self.timestamp = timestamp or datetime.datetime.now()
        self.reason = reason

class TokenBlacklist:
    def __init__(
        self,
        id: int = None,
        token: str = "",
        expires_at: datetime.datetime = None,
        revoked_by_user_id: int = None,
        revoked_at: datetime.datetime = None,
        reason: str = "logout"
    ):
        self.id = id
        self.token = token
        self.expires_at = expires_at
        self.revoked_by_user_id = revoked_by_user_id
        self.revoked_at = revoked_at or datetime.datetime.now()
        self.reason = reason

class AuditLog:
    def __init__(
        self,
        id: int = None,
        user_id: Optional[int] = None,
        tenant_id: Optional[int] = None,
        action: str = "",
        entity_type: str = "",
        entity_id: Optional[int] = None,
        changes: Optional[Dict[str, Any]] = None,
        ip_address: str = "",
        user_agent: str = "",
        timestamp: datetime.datetime = None
    ):
        self.id = id
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.action = action
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.changes = changes or {}
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.timestamp = timestamp or datetime.datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "tenant_id": self.tenant_id,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "changes": self.changes,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        } 