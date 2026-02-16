from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ResultResponse(BaseModel):
    id: int
    user_id: Optional[int]
    quiz_id: Optional[int]
    subject_id: Optional[int]
    group_id: Optional[int]
    correct_answers: int
    wrong_answers: int
    grade: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )

class ResultListRequest(BaseModel):
    user_id: Optional[int] = None
    quiz_id: Optional[int] = None
    subject_id: Optional[int] = None
    group_id: Optional[int] = None
    
    page: int = 1
    limit: int = 10

    @property
    def offset(self) -> int:
        if self.page < 1:
            return 0
        return (self.page - 1) * self.limit

class ResultListResponse(BaseModel):
    total: int
    page: int
    limit: int
    results: list[ResultResponse]
