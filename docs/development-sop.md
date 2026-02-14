# Development Standard Operation Protocol (SOP)

Guidelines and procedures for developing the SbioChat Dashboard.
Reference this document when collaborating with Claude Code or onboarding new team members.

---

## 1. Development Environment

```
Host (WSL2 Ubuntu)
├── Docker Compose
│   ├── postgres (pgvector:pg16)     → port 5435
│   ├── backend (FastAPI/Python)     → port 8005
│   └── frontend (React/Vite)        → port 3005
└── Conda (Open WebUI)               → port 30072
```

### Core Principles

- **All services are managed via Docker** (DB, Backend, Frontend)
- Only Open WebUI runs directly in a conda environment (for generating test data)
- Port 5432 is the production PostgreSQL instance — **never use it**

### Hot Reload

Docker volume mounts are used so that source code changes are reflected immediately:

| Service | Host Path | Container Path | Method |
|---------|-----------|----------------|--------|
| Backend | `./backend/app` | `/app/app` | uvicorn `--reload` |
| Frontend | `./frontend/src` | `/app/src` | Vite HMR |

Only changes to `package.json`, `requirements.txt`, or `Dockerfile` require `docker compose up --build`.

---

## 2. Tech Stack & Patterns

### Backend (FastAPI)

- **Single file structure**: All endpoints in `backend/app/main.py`
- **Raw SQL**: Queries written directly with SQLAlchemy `text()` (no ORM models)
- **DB dependency**: Session managed via `get_db()` generator
- **Auth dependency**: `get_current_user()` — branches by `AUTH_MODE` (mock/SSO)
- **Auto table creation**: `CREATE TABLE IF NOT EXISTS` in `@app.on_event("startup")`
- **Timezone**: All times are converted to `Asia/Seoul` (KST) before returning

### Frontend (React + TypeScript)

- **No UI framework**: Tailwind CSS only (no shadcn, MUI, etc.)
- **Icons**: lucide-react
- **HTTP client**: axios (centralized in `frontend/src/lib/api.ts`)
- **State management**: React useState (no global state library)
- **Dark theme**: Tailwind CSS variable-based (bg-card, text-foreground, border-border, etc.)
- **Consistent card style**: `rounded-xl border border-border bg-card p-6`

### Coding Principles

- **No over-engineering**: Only implement what is requested. No unnecessary abstractions, utility functions, or error handling
- **Follow existing patterns**: Match the style and structure of existing code when adding new components/endpoints
- **Minimal comments**: No comments when code is self-explanatory. Only add comments for complex business logic

---

## 3. Authentication

### Mock Auth (Development)

```
ENV: AUTH_MODE=mock
```

- User switching via `MockAuthBanner` component (bottom-right corner)
- All authenticated API calls include `X-Auth-User: {email_prefix}` header
- Only `@samsung.com` emails are allowed; prefix is auto-extracted
- Admins are specified via `ADMIN_USERS` environment variable (comma-separated)

### SSO (Production) — Not yet implemented

```
ENV: AUTH_MODE=sso
```

- Knox Portal (IdP) → Keycloak (SP/IdP, SAML 2.0) → Dashboard (OIDC 2.0)
- See `docs/sso-integration-guide.md` for transition procedure

---

## 4. Docker Operations

### Full Build & Run

```bash
docker compose up --build -d
```

### Restart Individual Services

```bash
docker compose restart backend    # Restart backend only
docker compose restart frontend   # Restart frontend only
```

### View Logs

```bash
docker compose logs -f backend    # Backend logs (real-time)
docker compose logs -f frontend   # Frontend logs (real-time)
docker compose logs -f postgres   # DB logs (real-time)
```

### Access DB

```bash
docker exec -it openwebui-postgres psql -U openwebui_admin -d openwebui
```

### Back Up DB

```bash
bash backup_db.sh
```

### Stop All Containers

```bash
docker compose down
```

### Full Reset Including Data (Caution)

```bash
docker compose down -v   # Deletes named volumes — all DB data will be lost
```

---

## 5. Git Operations

### Commit Message Convention

```
<Action> <Target> — <Details (optional)>

Examples:
Add Require Python Packages feature with mock auth
Switch daily chart to line plot, use emoji labels
Fix authentication bug in login flow
```

### When to Commit

- Commit per logical unit of change (one logical change = one commit)
- Documentation changes are committed together with code changes
- **Never commit `.env` files** (contains sensitive information)

### Branching

- `main`: Single branch workflow (sufficient for current project scale)

---

## 6. Adding New Features

### Adding a Backend Endpoint

1. Add the endpoint function in `backend/app/main.py`
2. Define Pydantic models (request/response body) if needed
3. If a new DB table is needed, add DDL in the `create_*_table()` startup event
4. Manually test with curl

### Adding a Frontend Component

1. Add interface + API function in `frontend/src/lib/api.ts`
2. Create component file in `frontend/src/components/`
3. Import and render in `frontend/src/pages/Dashboard.tsx`
4. Follow existing card style: `rounded-xl border border-border bg-card p-6`

### Features Requiring Authentication

1. Backend: Add `current_user: str = Depends(get_current_user)` parameter
2. Frontend: Include `headers: { "X-Auth-User": authUser }` in API calls
3. Admin-only: Check `if current_user not in ADMIN_USERS`

---

## 7. Troubleshooting

### WSL File Permission Issues

Docker may create files as root on NTFS mounts, making them uneditable from the host:

```bash
sudo chmod -R a+rw /mnt/d/openwebui-dashboard/frontend/src/
sudo chmod -R a+rw /mnt/d/openwebui-dashboard/backend/app/
```

### DB Data Loss (Windows Reboot)

Resolved by using Docker named volume (`openwebui_pgdata`).
Bind mounts (`./data/db`) are unstable on NTFS and should not be used.

### Frontend Changes Not Reflected

1. Verify volume mount: Check `docker compose config` for `./frontend/src:/app/src`
2. If missing, rebuild: `docker compose up --build -d frontend`
3. Hard refresh browser cache: `Ctrl+Shift+R`

### Backend Startup Failure

```bash
docker compose logs backend
```

- DB connection failure: Check postgres healthcheck, verify port/password
- Import error: Missing package in `requirements.txt` → add it and rebuild with `--build`

---

## 8. Claude Code Collaboration Guide

### Information to Include in Work Requests

- **What**: Specific feature or change
- **Where**: Related file or component name
- **Constraints**: Technologies or patterns to avoid

### Context for Claude Code

- This project is managed via Docker
- Backend uses raw SQL (no ORM)
- Frontend uses Tailwind only (no UI libraries)
- Auth branches by `AUTH_MODE` (mock/sso)
- Commits are only made on explicit request

### Internal Environment Notes

- Do not use port 5432 (production DB)
- Be careful not to expose passwords/secrets in `.env` files
- SSO integration can only be tested on the internal network
