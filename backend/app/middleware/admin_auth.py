from core.config import settings
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")

        if username == settings.admin.username and password == settings.admin.password:
            # ВАЖНО: Записываем токен или флаг в сессию
            request.session.update({"token": "some-secret-token"})
            return True

        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        if not token:
            return False
        # Здесь можно добавить проверку валидности токена
        return True
