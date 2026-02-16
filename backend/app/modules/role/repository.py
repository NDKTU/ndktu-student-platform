from fastapi import HTTPException, status
from app.models.role.model import Role
from app.models.permission.model import Permission
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .schemas import RoleCreateRequest, RoleListRequest, RoleListResponse, RolePermissionAssignRequest


class RoleRepository:
    async def create_role(self, session: AsyncSession, data: RoleCreateRequest) -> Role:
        # Проверка на существование роли с таким именем
        stmt_check = select(Role).where(Role.name == data.name)
        result_check = await session.execute(stmt_check)
        if result_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role '{data.name}' already exists",
            )

        new_role = Role(name=data.name)
        session.add(new_role)

        try:
            await session.commit()
            await session.refresh(new_role)
        except Exception:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error",
            )
        return new_role

    async def get_role(self, session: AsyncSession, role_id: int) -> Role:
        stmt = select(Role).where(Role.id == role_id)
        result = await session.execute(stmt)
        role = result.scalar_one_or_none()

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
            )

        return role

    async def list_roles(
        self, session: AsyncSession, request: RoleListRequest
    ) -> RoleListResponse:
        stmt = select(Role).offset(request.offset).limit(request.limit)
        result = await session.execute(stmt)
        roles = result.scalars().all()

        count_stmt = select(func.count()).select_from(Role)
        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        return RoleListResponse(
            total=total, page=request.page, limit=request.limit, roles=roles
        )

    async def update_role(
        self, session: AsyncSession, role_id: int, data: RoleCreateRequest
    ) -> Role:
        # Получаем текущую роль из базы
        stmt = select(Role).where(Role.id == role_id)
        result = await session.execute(stmt)
        role = result.scalar_one_or_none()

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
            )

        # Логика обновления "как в User" (явная проверка полей)
        if data.name is not None:
            # Проверяем, не занято ли новое имя другой ролью
            stmt_check = select(Role).where(Role.name == data.name, Role.id != role_id)
            existing_role = (await session.execute(stmt_check)).scalar_one_or_none()
            if existing_role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Role name already taken",
                )
            role.name = data.name

        await session.commit()
        await session.refresh(role)
        return role

    async def delete_role(self, session: AsyncSession, role_id: int) -> None:
        stmt = select(Role).where(Role.id == role_id)
        result = await session.execute(stmt)
        role = result.scalar_one_or_none()

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
            )

        await session.delete(role)
        await session.commit()

    async def assign_permissions(
        self, session: AsyncSession, data: RolePermissionAssignRequest
    ) -> None:
        # 1. Fetch Role
        stmt = select(Role).where(Role.id == data.role_id).options(selectinload(Role.permissions))
        result = await session.execute(stmt)
        role = result.scalar_one_or_none()

        if not role:
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
            )
        
        # 2. Fetch Permissions
        if not data.permission_ids:
            role.permissions = []
        else:
            stmt_perms = select(Permission).where(Permission.id.in_(data.permission_ids))
            result_perms = await session.execute(stmt_perms)
            permissions = result_perms.scalars().all()
            
            if len(permissions) != len(data.permission_ids):
                 found_ids = {p.id for p in permissions}
                 missing_ids = set(data.permission_ids) - found_ids
                 raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Permissions with ids {missing_ids} not found"
                )
            
            # 3. Assign
            role.permissions = list(permissions)
            
        try:
            await session.commit()
        except Exception:
             await session.rollback()
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error while assigning permissions"
            )


get_role_repository = RoleRepository()
