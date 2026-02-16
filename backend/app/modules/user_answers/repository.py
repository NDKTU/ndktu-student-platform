from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_answers.model import UserAnswers
from .schemas import UserAnswersListRequest

class UserAnswersRepository:
    async def get_all(
        self, 
        session: AsyncSession,
        data: UserAnswersListRequest
    ):
        stmt = select(UserAnswers)
        
        filters = []
        if data.user_id is not None:
            filters.append(UserAnswers.user_id == data.user_id)
        if data.quiz_id is not None:
            filters.append(UserAnswers.quiz_id == data.quiz_id)
        if data.question_id is not None:
            filters.append(UserAnswers.question_id == data.question_id)
            
        if filters:
            stmt = stmt.where(and_(*filters))
            
        stmt = stmt.offset(data.offset).limit(data.limit)
        
        result = await session.execute(stmt)
        return result.scalars().all()

user_answers_repository = UserAnswersRepository()
