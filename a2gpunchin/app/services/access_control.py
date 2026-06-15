from __future__ import annotations

from app.core.security import hash_password
from app.models.employee import Employee
from app.models.rbac import Permission, Role
from app.models.user import User


ACCESS_LEVEL_LABELS = {
    "admin": "Admin",
    "manager": "Manager",
    "tl": "TL",
    "employee": "Employee Self",
}

ROLE_PERMISSIONS = {
    "admin": [
        "branches:create", "branches:read", "branches:update", "branches:delete",
        "departments:create", "departments:read", "departments:update", "departments:delete",
        "employees:create", "employees:read", "employees:update", "employees:delete",
        "shifts:create", "shifts:read", "shifts:update", "shifts:delete",
        "attendance:create", "attendance:read", "attendance:update", "attendance:delete",
        "leaves:create", "leaves:read", "leaves:update", "leaves:delete", "leaves:approve",
        "reports:read",
    ],
    "manager": [
        "employees:read",
        "attendance:read",
        "leaves:create", "leaves:read", "leaves:approve",
        "reports:read",
    ],
    "tl": [
        "employees:read",
        "attendance:read",
        "leaves:create", "leaves:read", "leaves:approve",
        "reports:read",
    ],
    "employee": [
        "employees:read",
        "attendance:read",
        "leaves:create", "leaves:read",
    ],
}


def normalize_access_level(value: str | None) -> str:
    normalized = (value or "employee").strip().lower().replace("-", "_")
    aliases = {
        "company_admin": "admin",
        "branch_manager": "manager",
        "hr_manager": "manager",
        "team_lead": "tl",
        "team_leader": "tl",
        "self": "employee",
    }
    normalized = aliases.get(normalized, normalized)
    return normalized if normalized in ACCESS_LEVEL_LABELS else "employee"


def _permission(code: str, tenant_id: str, company_id: str | None) -> Permission:
    permission = Permission.objects(code=code).first()
    if permission:
        return permission
    return Permission(
        tenant_id=tenant_id,
        company_id=company_id,
        code=code,
        name=code.replace(":", " ").title(),
        module=code.split(":")[0],
    ).save()


def role_for_access_level(access_level: str, tenant_id: str, company_id: str | None) -> Role:
    access_level = normalize_access_level(access_level)
    slug = f"dashboard-{access_level}-{company_id or tenant_id}"
    role = Role.objects(slug=slug, tenant_id=tenant_id, company_id=company_id).first()
    permissions = [_permission(code, tenant_id, company_id) for code in ROLE_PERMISSIONS[access_level]]
    if role:
        role.permissions = permissions
        role.name = ACCESS_LEVEL_LABELS[access_level]
        role.save()
        return role
    return Role(
        tenant_id=tenant_id,
        company_id=company_id,
        name=ACCESS_LEVEL_LABELS[access_level],
        slug=slug,
        permissions=permissions,
    ).save()


def access_level_for_user(user: User) -> str:
    if user.is_super_admin:
        return "admin"
    raw = normalize_access_level(getattr(user, "access_level", None))
    role_names = {((role.slug or role.name or "").lower().replace("-", "_")) for role in user.roles}
    if raw == "admin" or any("admin" in role for role in role_names):
        return "admin"
    if raw in {"manager", "tl"}:
        return raw
    return "employee"


def linked_employee_for_user(user: User) -> Employee | None:
    return (
        Employee.objects.visible().filter(user_id=user).first()
        or Employee.objects.visible().filter(email=user.email).first()
        or Employee.objects.visible().filter(office_email=user.email).first()
    )


def scoped_employees_for_user(user: User) -> list[Employee] | None:
    access_level = access_level_for_user(user)
    if access_level == "admin":
        return None
    employee = linked_employee_for_user(user)
    if not employee:
        return []
    if access_level in {"manager", "tl"}:
        team = list(Employee.objects.visible().filter(reporting_manager=employee))
        return [employee, *team]
    return [employee]


def sync_employee_user(employee: Employee, access_enabled: bool, access_level: str, password: str | None = None) -> User | None:
    access_level = normalize_access_level(access_level or employee.staff_role)
    if not access_enabled:
        return employee.user_id

    role = role_for_access_level(access_level, employee.tenant_id, employee.company_id)
    user = employee.user_id or User.objects(email=employee.email.lower(), is_active=True).first()
    if not user:
        user = User(
            tenant_id=employee.tenant_id,
            company_id=employee.company_id,
            email=employee.email.lower(),
            password_hash=hash_password(password or "Welcome@123"),
            first_name=employee.first_name,
            last_name=employee.last_name,
            phone=employee.phone,
            roles=[role],
            access_level=access_level,
            is_email_verified=True,
        )
    else:
        user.email = employee.email.lower()
        user.first_name = employee.first_name
        user.last_name = employee.last_name
        user.phone = employee.phone
        user.roles = [role]
        user.access_level = access_level
        user.status = "active"
        if password:
            user.password_hash = hash_password(password)
    user.save()

    employee.user_id = user
    employee.save()
    return user
