from fastapi import HTTPException, status
from app.models.quiz.model import Quiz
from app.models.question.model import Question
from app.models.quiz_questions.model import QuizQuestion
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .schemas import (
    QuizCreateRequest,
    QuizListRequest,
    QuizListRequest,
    QuizListResponse,
)
from core.config import settings


from app.models.group_teachers.model import GroupTeacher

class QuizRepository:
    async def create_quiz(
        self, session: AsyncSession, data: QuizCreateRequest
    ) -> Quiz:
        new_quiz = Quiz(
            title=data.title,
            question_number=data.question_number,
            duration=data.duration,
            pin=data.pin,
            is_active=data.is_active,
            user_id=data.user_id,
            group_id=data.group_id,
            subject_id=data.subject_id,
        )
        session.add(new_quiz)

        # Auto-link questions if user_id and subject_id are provided
        if data.user_id and data.subject_id:
            # Find all questions with matching user_id and subject_id
            stmt_questions = select(Question).where(
                Question.user_id == data.user_id,
                Question.subject_id == data.subject_id
            )
            result_questions = await session.execute(stmt_questions)
            questions = result_questions.scalars().all()

            for question in questions:
                # Create relation
                quiz_question = QuizQuestion(
                    quiz=new_quiz,
                    question=question
                )
                session.add(quiz_question)
        
        # Auto-create GroupTeacher relation if user_id and group_id are provided
        if data.user_id and data.group_id:
            # Check if relation already exists
            stmt_check = select(GroupTeacher).where(
                GroupTeacher.teacher_id == data.user_id,
                GroupTeacher.group_id == data.group_id
            )
            result_check = await session.execute(stmt_check)
            existing_relation = result_check.scalar_one_or_none()
            
            if not existing_relation:
                new_group_teacher = GroupTeacher(
                    teacher_id=data.user_id,
                    group_id=data.group_id
                )
                session.add(new_group_teacher)

        try:
            await session.commit()
            await session.refresh(new_quiz)
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error",
            )
        return new_quiz

    async def get_quiz(
        self, session: AsyncSession, quiz_id: int
    ) -> Quiz:
        stmt = select(Quiz).where(Quiz.id == quiz_id)
        result = await session.execute(stmt)
        quiz = result.scalar_one_or_none()

        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found"
            )

        return quiz

    async def list_quizzes(
        self, session: AsyncSession, request: QuizListRequest
    ) -> QuizListResponse:
        stmt = select(Quiz).offset(request.offset).limit(request.limit)

        if request.title:
            stmt = stmt.where(Quiz.title.ilike(f"%{request.title}%"))
        
        if request.user_id:
            stmt = stmt.where(Quiz.user_id == request.user_id)
        
        if request.group_id:
            stmt = stmt.where(Quiz.group_id == request.group_id)

        if request.subject_id:
            stmt = stmt.where(Quiz.subject_id == request.subject_id)

        if request.is_active is not None:
             stmt = stmt.where(Quiz.is_active == request.is_active)

        result = await session.execute(stmt)
        quizzes = result.scalars().all()

        count_stmt = select(func.count()).select_from(Quiz)
        if request.title:
            count_stmt = count_stmt.where(Quiz.title.ilike(f"%{request.title}%"))
        if request.user_id:
            count_stmt = count_stmt.where(Quiz.user_id == request.user_id)
        if request.group_id:
            count_stmt = count_stmt.where(Quiz.group_id == request.group_id)
        if request.subject_id:
            count_stmt = count_stmt.where(Quiz.subject_id == request.subject_id)
        if request.is_active is not None:
            count_stmt = count_stmt.where(Quiz.is_active == request.is_active)

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return QuizListResponse(
            total=total, page=request.page, limit=request.limit, quizzes=quizzes
        )

    async def update_quiz(
        self, session: AsyncSession, quiz_id: int, data: QuizCreateRequest
    ) -> Quiz:
        stmt = select(Quiz).where(Quiz.id == quiz_id)
        result = await session.execute(stmt)
        quiz = result.scalar_one_or_none()

        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found"
            )
        
        quiz.title = data.title
        quiz.question_number = data.question_number
        quiz.duration = data.duration
        quiz.pin = data.pin
        quiz.is_active = data.is_active
        quiz.user_id = data.user_id
        quiz.group_id = data.group_id
        quiz.subject_id = data.subject_id

        await session.commit()
        await session.refresh(quiz)
        return quiz

    async def delete_quiz(
        self, session: AsyncSession, quiz_id: int
    ) -> None:
        stmt = select(Quiz).where(Quiz.id == quiz_id)
        result = await session.execute(stmt)
        quiz = result.scalar_one_or_none()

        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found"
            )

        await session.delete(quiz)
        await session.commit()


    async def upload_image(self, file) -> str:
        import shutil
        import uuid
        import os

        # Generate unique filename
        file_ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        
        # Use config for upload dir
        # Ensure dir exists (though ideally create on startup or here)
        os.makedirs(settings.file_url.upload_dir, exist_ok=True)
        file_path = f"{settings.file_url.upload_dir}/{filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Use config for http url
        return f"{settings.file_url.http}/{filename}"


get_quiz_repository = QuizRepository()
