# epettyshop — Merchant Automation Hub

A multi-tenant workflow automation system for independent store owners to design workflows, define business rules, execute processes dynamically, and track operations.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1. Install Dependencies
```bash
cd Epettyshop
npm install
```

### 2. Seed the Database
```bash
npm run seed
```
This creates two demo tenants (**StyleVault** and **TechGadgets Pro**) with sample workflows pre-loaded.

### 3. Start Development Servers
```bash
npm run dev
```
This starts both servers concurrently:
- **Backend API**: http://localhost:4000
- **Frontend**: http://localhost:5173

### 4. Open the App
Navigate to http://localhost:5173 — you'll see a tenant selector. Click a store to log in.

---

## 🏗 Architecture

### Monorepo Structure
```
Epettyshop/
├── backend/    # Express.js REST API
└── frontend/   # Vite + React + TailwindCSS v4 + TanStack Router
```

### Backend (Express.js + SQLite)
- **Framework**: Express.js with TypeScript
- **Database**: SQLite via `better-sqlite3` (zero-config, portable)
- **Auth**: JWT tokens containing `tenantId` — every protected route enforces tenant isolation
- **Port**: 4000

#### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/tenants` | List available tenants |
| POST | `/api/auth/login` | Exchange tenantId for JWT |
| GET | `/api/workflows` | List tenant's workflows |
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows/:id` | Get workflow with steps & rules |
| PUT | `/api/workflows/:id` | Update workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |
| POST | `/api/workflows/:wid/steps` | Add step |
| PUT | `/api/workflows/:wid/steps/:sid` | Update step |
| DELETE | `/api/workflows/:wid/steps/:sid` | Delete step |
| POST | `/api/steps/:sid/rules` | Add rule |
| PUT | `/api/steps/:sid/rules/:rid` | Update rule |
| DELETE | `/api/steps/:sid/rules/:rid` | Delete rule |
| POST | `/api/execute` | Execute workflow |
| GET | `/api/executions` | List executions |
| GET | `/api/executions/:id` | Get execution with logs |

### Frontend (Vite + React + Tailwind CSS v4)
- **Routing**: TanStack Router (file-based, type-safe)
- **Styling**: Tailwind CSS v4 with custom design tokens
- **State**: React hooks + localStorage for auth
- **Port**: 5173 (proxies `/api` to backend port 4000)

---

## 🗄 Database Schema

SQLite database at `backend/data/epettyshop.db`.

```
tenants        → id, name, email
workflows      → id, tenant_id, name, trigger_event, is_active
steps          → id, workflow_id, name, step_type, step_order, metadata
rules          → id, step_id, condition, next_step_id, priority
executions     → id, workflow_id, tenant_id, status, input_payload
execution_logs → id, execution_id, step_id, step_name, rule_evaluated, rule_result
```

### Multi-Tenancy
Every workflow, execution, and log is scoped to a `tenant_id`. The backend middleware extracts `tenantId` from the JWT and injects it into every query. A tenant **cannot** read or modify another tenant's data — the API returns 404 for cross-tenant requests.

---

## ⚙️ Execution Engine

Located at `backend/src/engine/executor.ts`.

**No `eval()`** — uses a custom safe expression parser that supports:
- Dot-notation property access: `data.order_details.total_amount`
- Operators: `>`, `<`, `>=`, `<=`, `==`, `!=`
- Logical: `&&`, `||`
- String literals: `'Gold'`, numeric values, booleans
- `DEFAULT` keyword as a catch-all fallback

**Loop Prevention**: Steps are tracked with a visited set; cycles abort with a `failed` status.

---

## 🎨 Design Decisions

1. **SQLite over PostgreSQL**: Zero-config local setup for challenge submission. Schema is fully relational and migrations to PostgreSQL are trivial (change driver, add SERIAL types).
2. **Simulated Auth**: JWT issued per-tenant without passwords — demonstrates multi-tenancy without signup complexity.
3. **Vite Proxy**: Frontend proxies `/api` to avoid CORS in development; in production, set `VITE_API_BASE` to the deployed backend URL.
4. **File-based routing**: TanStack Router auto-generates type-safe `routeTree.gen.ts` from the `src/routes/` directory.

---

## 📦 Deployment

### Frontend → Vercel / Netlify
```bash
cd frontend && npm run build
```
Set env var `VITE_API_BASE=https://your-backend.render.com` before building.

### Backend → Render / Railway
```bash
cd backend && npm run build && npm start
```
Set env var `JWT_SECRET` to a strong random string.

---

## 🎥 Demo Workflow

1. Log in as **StyleVault**
2. Open "High Value Order Routing" workflow
3. Inspect the 3 steps and conditional rules
4. Navigate to the **Simulator**
5. The sample payload ($750, Gold loyalty) is pre-loaded
6. Click **Execute Dry Run**
7. Watch the audit log — rule `total_amount > 500 && loyalty_tier == 'Gold'` passes → routes to "Apply VIP Tag & Auto-Fulfill"
