from datetime import datetime

from core.utils.password_hash import hash_password
from pydantic import BaseModel, ConfigDict, field_validator


class RoleResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class RoleRequest(BaseModel):
    name: str


class UserCreateRequest(BaseModel):
    username: str
    password: str
    roles: list[RoleRequest]

    @field_validator("username", mode="before")
    def validate_username(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Username cannot be empty")
        return value.strip().lower()

    @field_validator("password", mode="before")
    def validate_password(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Password cannot be empty")
        return hash_password(value.strip())


class UserUpdateRequest(BaseModel):
    username: str | None = None


class UserRoleAssignRequest(BaseModel):
    user_id: int
    role_ids: list[int]


class UserCreateResponse(BaseModel):
    id: int
    username: str
    roles: list[RoleResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserListRequest(BaseModel):
    page: int = 1
    limit: int = 10
    username: str | None = None

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


class UserListResponse(BaseModel):
    total: int
    page: int
    limit: int
    users: list[UserCreateResponse]


class UserLoginRequest(BaseModel):
    username: str
    password: str

    @field_validator("username", mode="before")
    def validate_username(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Username cannot be empty")
        return value.strip()

    @field_validator("password", mode="before")
    def validate_password(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Password cannot be empty")
        return value.strip()


class UserLoginResponse(BaseModel):
    type: str = "Bearer"
    access_token: str
    refresh_token: str