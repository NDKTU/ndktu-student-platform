.PHONY: up down restart logs frontend-logs backend-logs backup backup-database backup-logs backup-images restore

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

backup: backup-database backup-logs backup-images

backup-database:
	./scripts/backup.sh

backup-logs:
	./scripts/backup_logs.sh

backup-images:
	./scripts/backup_images.sh

restore:
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz"; exit 1; fi
	./scripts/restore.sh $(FILE)
