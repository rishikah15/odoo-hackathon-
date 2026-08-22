# Dayflow HRMS — Leave, Payroll & QA Module

This module implements the **Leave Management**, **Payroll**, and **QA/Testing**
scope for Dayflow, plus minimal Attendance and Profile endpoints so the whole
app (login, check-in/out, leave, payroll, profile) can be exercised end to end.

## Stack
- **Backend:** Node.js, Express, PostgreSQL (`pg`), JWT auth, Socket.io for
  real-time push
- **Frontend:** React + Vite
- **Tests:** Jest + Supertest + socket.io-client

## Project layout
```
dayflow-hrms/
├── docker-compose.yml        # local Postgres for dev/test
├── backend/
│   ├── src/
│   │   ├── db/                # schema.sql, pool.js, seed.js
│   │   ├── middleware/auth.js # JWT verify + role guard
│   │   ├── routes/            # auth, leave, payroll, attendance, profile
│   │   └── index.js           # Express + Socket.io server
│   └── tests/qa.test.js       # full QA checklist as automated tests
└── frontend/
    └── src/
        ├── api/                # fetch client, auth context, socket hook
        ├── components/         # LeaveForm, MyLeaveList, AllLeaveRequests,
        │                       # MyPayroll, PayrollAdmin, AttendanceWidget,
        │                       # ProfileEditor, StatusBadge
        └── pages/               # Login, EmployeeDashboard, HRDashboard
```

## Setup

```bash
# 1. Start Postgres (creates the schema automatically via docker-entrypoint-initdb.d)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run seed     # creates hr@dayflow.test / employee@dayflow.test, both password123
npm run dev       # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev       # http://localhost:5173

# 4. Run the QA test suite (backend must be seeded and Postgres running)
cd backend
npm test
```

> Note: this sandbox has no network/package-registry access, so `npm install`
> could not be run here to produce a lockfile or execute the tests live. Every
> file has been syntax-checked (`node --check` for `.js`, bracket-balance
> pass for `.jsx`) but you should run `npm test` locally before shipping.

## A. Leave Management
- Employee: choose **Paid / Sick / Unpaid**, pick start & end date, add
  remarks, submit → status starts as 🟡 **Pending**.
- HR/Admin: view all requests, **Approve** or **Reject**, attach a comment.
- **Live status sync:** the backend pushes a `leave:update` Socket.io event to
  the specific employee's room the instant HR decides, scoped by JWT-verified
  user id. The employee's dashboard patches the row in place — no polling, no
  manual refresh. See `useLeaveSocket.js` / `MyLeaveList.jsx` and the
  socket-based test in `qa.test.js`.
- A request can only be decided once (`WHERE status = 'pending'` guard on the
  decision query) — prevents a double-approve/double-reject race.

## B. Payroll
- Employee: `GET /api/payroll/mine` — **read-only**. There is no employee-
  accessible write route; `PUT /api/payroll/:id` is gated by
  `requireRole('hr')` at the middleware layer, not just hidden in the UI.
- HR/Admin: `GET /api/payroll` (all employees), `PUT /api/payroll/:employeeId`
  to update basic salary, HRA, allowances, deductions.

## C. Testing / QA
`backend/tests/qa.test.js` automates the full checklist:
- Employee login / HR login (success)
- Wrong password rejected, unknown email rejected
- Employee permissions: 403 on HR-only leave/payroll routes, 401 with no token
- Check-in / check-out
- Leave application (incl. validation: bad leave_type, end before start)
- Leave approval **and** rejection, including the real-time socket push
- Double-decision guard
- Payroll visibility (employee read-only vs HR read/write), and that an HR
  edit is immediately visible in the employee's own read-only view
- Profile editing, including confirming `role` cannot be self-escalated

### Bugs found during self-review and fixed before delivery
| # | Issue | Fix |
|---|-------|-----|
| 1 | Login timing could reveal whether an email exists (no bcrypt call on unknown user) | Always run `bcrypt.compare` against a dummy hash so unknown-email and wrong-password paths take the same code path/timing |
| 2 | Nothing stopped HR decisions from being applied twice to the same request | Decision update now requires `status = 'pending'` in the `WHERE` clause; a second attempt returns 404 |
| 3 | Payroll write route existed but only the UI hid it from employees | Enforced `requireRole('hr')` at the Express middleware level so a direct API call from an employee token is rejected with 403 |
| 4 | Profile edit could accept `role`/`email` from the request body | Route explicitly whitelists `name`, `department`, `phone`; role/email are ignored server-side even if sent |
| 5 | Employee could see stale leave status until a manual page refresh | Added Socket.io room-per-employee push (`leave:update`) so the status flips live |

### Suggested next QA pass (not yet automated here)
- Concurrency test: two HR sessions deciding the same request simultaneously
- Frontend E2E (Playwright/Cypress) for the actual click-through flows above
- Load test on the payroll list endpoint for large employee counts
