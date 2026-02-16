from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

class QuestionCreateRequest(BaseModel):
    subject_id: int
    user_id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str

    @field_validator("text", "option_a", "option_b", "option_c", "option_d", mode="before")
    @classmethod
    def must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class QuestionCreateResponse(BaseModel):
    id: int
    subject_id: int
    user_id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    created_at: datetime  
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )

class QuestionListRequest(BaseModel):
    text: Optional[str] = None 
    subject_id: Optional[int] = None
    user_id: Optional[int] = None
    
    page: int = 1 
    
    limit: int = 10 

    @property
    def offset(self) -> int:
        if self.page < 1:
            return 0
        return (self.page - 1) * self.limit

class QuestionListResponse(BaseModel):
    total: int
    page: int
    limit: int
    questions: list[QuestionCreateResponse]
