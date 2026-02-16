from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

class TeacherCreateRequest(BaseModel):
    first_name: str
    last_name: str
    third_name: str
    kafedra_id: int
    user_id: int

    @field_validator("first_name", "last_name", "third_name", mode="before")
    @classmethod
    def must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class TeacherCreateResponse(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    third_name: str
    full_name: str
    kafedra_id: int
    created_at: datetime  
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )

class TeacherListRequest(BaseModel):
    full_name: Optional[str] = None 
    kafedra_id: Optional[int] = None
    
    page: int = 1 
    
    limit: int = 10 

    @property
    def offset(self) -> int:
        if self.page < 1:
            return 0
        return (self.page - 1) * self.limit

class TeacherListResponse(BaseModel):
    total: int
    page: int
    limit: int
    teachers: list[TeacherCreateResponse]
