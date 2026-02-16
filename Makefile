.PHONY: up down restart logs frontend-logs backend-logs

up:
	docker compose up -d --build

down:
	docker compose down

restart: down up

logs:
	docker compose logs -f

frontend-logs:
	docker compose logs -f frontend

backend-logs:
	docker compose logs -f backend
