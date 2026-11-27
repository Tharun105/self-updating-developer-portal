# Self-Updating Developer Portal for Automated Service Discovery

A full-stack service catalogue that discovers repositories on GitHub, turns them into services,
and keeps their metadata and documentation synchronised automatically (scheduled) or on demand (manual).

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, JavaScript, HTML5, CSS3, Bootstrap 5, Axios, React Router (Vite dev server) |
| Backend  | Java 17, Spring Boot 3.2, Maven, Spring Data JPA, Hibernate, Spring Security (JWT), REST |
| Database | MySQL 8 |

## Run it

**1. MySQL** - install MySQL 8 and start it. The `devportal` database is created automatically.

**2. Backend** (port 8080)
```bash
cd backend
# edit src/main/resources/application.properties, or use environment variables:
#   DB_USERNAME, DB_PASSWORD, GITHUB_TOKEN (optional), GITHUB_OWNERS (e.g. "octocat,your-org")
mvn spring-boot:run
```

**3. Frontend** (port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The API URL defaults to `http://localhost:8080/api`
(override with `VITE_API_URL` in `frontend/.env`).

### Demo accounts (seeded on first start)
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN - everything, including user management |
| developer | dev123 | DEVELOPER - manage services/docs, run syncs |
| viewer | view123 | VIEWER - read only (new self-registrations get this role) |

Change these passwords before any real deployment, and set a long random `JWT_SECRET`.

## How synchronization works
1. `SyncScheduler` runs on the cron in `sync.cron` (default: hourly). The **Sync now** buttons call `POST /api/sync/manual`.
2. For every tracked GitHub owner (`github.owners` + owners already discovered + any owner typed in the UI),
   `GitHubClient` calls `GET /users/{owner}/repos` and stores name, description, owner, language, URL, stars and last-updated date.
3. New repositories become services automatically (`sync.auto-create-services=true`). Existing services are updated only when
   GitHub reports a change. A service is `INACTIVE` when its repo is archived or untouched for `sync.inactive-after-days` days.
4. READMEs are fetched for new/changed repos. Services with an **API specification URL** get that document re-downloaded each sync.
5. Every run is written to `sync_history` (type, status, counts, who triggered it) and shown on the dashboard.

Without a `GITHUB_TOKEN` GitHub allows 60 requests/hour; each changed repo costs one extra request for its README.

## REST API (all under `/api`, JWT bearer token)
| Area | Endpoints | Access |
|------|-----------|--------|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` | public / any user |
| Services | `GET /services?q&status&language&page&size&sort`, `GET /services/{id}`, `GET /services/languages` | any user |
| | `POST /services`, `PUT /services/{id}`, `DELETE /services/{id}` | ADMIN, DEVELOPER |
| GitHub | `GET /github/repos?q` / `POST /github/repos/{id}/import` | any user / ADMIN, DEVELOPER |
| Sync | `GET /sync/history` / `POST /sync/manual?owner=` | any user / ADMIN, DEVELOPER |
| Docs | `GET /docs?q&serviceId`, `GET /docs/{id}` / `POST`, `PUT`, `DELETE` | any user / ADMIN, DEVELOPER |
| Dashboard | `GET /dashboard/stats` | any user |
| Admin | `GET /admin/overview`, `GET/POST/PUT/DELETE /users` | ADMIN |

Errors always return `{ "status", "message", "errors": { field: message } }`, which the UI shows as toasts and inline field errors.

## Database tables (created by Hibernate)
`users`, `services`, `github_repositories`, `documentation`, `sync_history`.

## Project structure
```
backend/src/main/java/com/devportal/
  config/      CORS, password encoder, demo data seeding
  controller/  REST controllers
  dto/         request/response records, GitHub payload
  exception/   global error handler
  model/       JPA entities and enums
  repository/  Spring Data repositories
  security/    JWT service, filter, security rules
  service/     catalogue, documentation, users, dashboard, GitHub client, sync + scheduler
frontend/src/
  api/         Axios client (token + 401 handling) and endpoint modules
  components/  Layout, Modal, Pagination, StatCard, StatusBadge, forms, tables
  context/     AuthContext (roles), ToastContext
  hooks/ utils/ pages/ styles/
```
"# self-updating-developer-portal" 
