from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RoleCreateRequest(BaseModel):
    name: str

class RolePermissionAssignRequest(BaseModel):
    role_id: int
    permission_ids: list[int]

    model_config = ConfigDict(
        str_strip_whitespace=True,
        str_to_lower=True,
    )


class RoleCreateResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoleListRequest(BaseModel):
    page: int = 1
    limit: int = 10
    name: str | None = None

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


class RoleListResponse(BaseModel):
    total: int
    page: int
    limit: int
    roles: list[RoleCreateResponse]
