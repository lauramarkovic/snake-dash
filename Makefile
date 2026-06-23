.PHONY: install dev backend frontend backend-tests frontend-tests test

install:
	cd backend && uv sync
	cd frontend && npm ci

dev:
	@trap 'kill "$$backend_pid" "$$frontend_pid" 2>/dev/null; wait "$$backend_pid" "$$frontend_pid" 2>/dev/null' INT TERM EXIT; \
	$(MAKE) backend & backend_pid=$$!; \
	$(MAKE) frontend & frontend_pid=$$!; \
	wait

backend:
	cd backend && uv run uvicorn main:app --reload

frontend:
	cd frontend && npm run dev

backend-tests:
	cd backend && uv run pytest

frontend-tests:
	cd frontend && npm test

test: backend-tests frontend-tests
