import logging

from fastapi import HTTPException, status
from app.models.results.model import Result
from app.models.user.model import User
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from .schemas import (
    ResultListRequest,
    ResultListResponse,
)

logger = logging.getLogger(__name__)


class ResultRepository:
    async def get_result(
        self, session: AsyncSession, result_id: int
    ) -> Result:
        stmt = select(Result).options(
            selectinload(Result.user).selectinload(User.student),
            selectinload(Result.quiz),
            selectinload(Result.subject),
            selectinload(Result.group),
        ).where(Result.id == result_id)
        result = await session.execute(stmt)
        obj = result.scalar_one_or_none()

        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Result not found"
            )

        return obj

    async def list_results(
        self, session: AsyncSession, request: ResultListRequest
    ) -> ResultListResponse:
        stmt = select(Result).options(
            selectinload(Result.user).selectinload(User.student),
            selectinload(Result.quiz),
            selectinload(Result.subject),
            selectinload(Result.group),
        ).offset(request.offset).limit(request.limit)

        if request.user_id:
            stmt = stmt.where(Result.user_id == request.user_id)
        
        if request.quiz_id:
            stmt = stmt.where(Result.quiz_id == request.quiz_id)
        
        if request.group_id:
            stmt = stmt.where(Result.group_id == request.group_id)

        if request.subject_id:
            stmt = stmt.where(Result.subject_id == request.subject_id)

        if request.grade is not None:
            stmt = stmt.where(Result.grade == request.grade)

        result = await session.execute(stmt)
        results = result.scalars().all()

        count_stmt = select(func.count()).select_from(Result)
        if request.user_id:
            count_stmt = count_stmt.where(Result.user_id == request.user_id)
        if request.quiz_id:
            count_stmt = count_stmt.where(Result.quiz_id == request.quiz_id)
        if request.group_id:
            count_stmt = count_stmt.where(Result.group_id == request.group_id)
        if request.subject_id:
            count_stmt = count_stmt.where(Result.subject_id == request.subject_id)
        if request.grade is not None:
            count_stmt = count_stmt.where(Result.grade == request.grade)

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return ResultListResponse(
            total=total, page=request.page, limit=request.limit, results=results
        )

    async def delete_result(
        self, session: AsyncSession, result_id: int
    ) -> None:
        stmt = select(Result).where(Result.id == result_id)
        result = await session.execute(stmt)
        obj = result.scalar_one_or_none()

        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Result not found"
            )

        await session.delete(obj)
        await session.commit()


get_result_repository = ResultRepository()
