from pydantic import BaseModel
from typing import Optional

# class UserAnswersSchema(BaseModel):
#     id: int
#     user_id: Optional[int]
#     quiz_id: Optional[int]
#     question_id: Optional[int]
#     answer: Optional[str]
#     is_correct: bool


#     model_config = {
#         "from_attributes": True
#     }


class UserAnswersListRequest(BaseModel):
    page: int = 1
    limit: int = 10
    user_id: Optional[int] = None
    quiz_id: Optional[int] = None
    question_id: Optional[int] = None

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit
