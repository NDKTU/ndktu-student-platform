from fastapi import HTTPException, status
from app.models.teacher.model import Teacher
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .schemas import (
    TeacherCreateRequest,
    TeacherListRequest,
    TeacherListResponse,
)


class TeacherRepository:
    def _generate_full_name(self, first_name: str, last_name: str, third_name: str) -> str:
        return f"{last_name} {first_name} {third_name}"

    async def create_teacher(
        self, session: AsyncSession, data: TeacherCreateRequest
    ) -> Teacher:
        full_name = self._generate_full_name(data.first_name, data.last_name, data.third_name)
        
        stmt_check = select(Teacher).where(Teacher.full_name == full_name)
        result_check = await session.execute(stmt_check)
        if result_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Teacher '{full_name}' already exists",
            )

        new_teacher = Teacher(
            first_name=data.first_name,
            last_name=data.last_name,
            third_name=data.third_name,
            full_name=full_name,
            kafedra_id=data.kafedra_id,
            user_id=data.user_id
        )
        session.add(new_teacher)

        try:
            await session.commit()
            await session.refresh(new_teacher)
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error",
            )
        return new_teacher

    async def get_teacher(
        self, session: AsyncSession, teacher_id: int
    ) -> Teacher:
        stmt = select(Teacher).where(Teacher.id == teacher_id)
        result = await session.execute(stmt)
        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )

        return teacher

    async def list_teachers(
        self, session: AsyncSession, request: TeacherListRequest
    ) -> TeacherListResponse:
        stmt = select(Teacher).offset(request.offset).limit(request.limit)

        if request.full_name:
            stmt = stmt.where(Teacher.full_name.ilike(f"%{request.full_name}%"))
        
        if request.kafedra_id:
            stmt = stmt.where(Teacher.kafedra_id == request.kafedra_id)

        result = await session.execute(stmt)
        teachers = result.scalars().all()

        count_stmt = select(func.count()).select_from(Teacher)
        if request.full_name:
            count_stmt = count_stmt.where(Teacher.full_name.ilike(f"%{request.full_name}%"))
        if request.kafedra_id:
            count_stmt = count_stmt.where(Teacher.kafedra_id == request.kafedra_id)

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return TeacherListResponse(
            total=total, page=request.page, limit=request.limit, teachers=teachers
        )

    async def update_teacher(
        self, session: AsyncSession, teacher_id: int, data: TeacherCreateRequest
    ) -> Teacher:
        stmt = select(Teacher).where(Teacher.id == teacher_id)
        result = await session.execute(stmt)
        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )

        full_name = self._generate_full_name(data.first_name, data.last_name, data.third_name)

        if full_name != teacher.full_name:
            # Check unique name excluding current
            stmt_check = select(Teacher).where(
                Teacher.full_name == full_name, Teacher.id != teacher_id
            )
            existing = (await session.execute(stmt_check)).scalar_one_or_none()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher name already taken",
                )
        
        teacher.first_name = data.first_name
        teacher.last_name = data.last_name
        teacher.third_name = data.third_name
        teacher.full_name = full_name
        
        if data.kafedra_id is not None:
             teacher.kafedra_id = data.kafedra_id

        await session.commit()
        await session.refresh(teacher)
        return teacher

    async def delete_teacher(
        self, session: AsyncSession, teacher_id: int
    ) -> None:
        stmt = select(Teacher).where(Teacher.id == teacher_id)
        result = await session.execute(stmt)
        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found"
            )

        await session.delete(teacher)
        await session.commit()


get_teacher_repository = TeacherRepository()
