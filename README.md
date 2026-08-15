# TaskFlow - Project and Task Management with RBAC

TaskFlow is a full-stack project and task management application built to demonstrate a practical Role-Based Access Control (RBAC) system. It has three roles: Admin, Manager, and Employee. Access is enforced on both the backend API and the frontend UI.

> Built as a full-stack developer assessment project.

## Features

- JWT authentication with protected routes
- Admin-only user creation and user management
- Role-based project and task visibility
- Project creation with one manager and multiple employees
- Task board with To Do, In Progress, In Review, and Done columns
- Employees can update only the status of tasks assigned to them
- Search, filters, pagination, and responsive dashboard UI
- Secure Express middleware: Helmet, rate limiting, input validation, and Mongo sanitization

## Roles and Permissions

| Role | Permissions |
| --- | --- |
| Admin | Full workspace access. Can create employee/manager accounts, manage users, create/edit/delete projects and tasks, and view all data. |
| Manager | Can create projects, assign employees, create tasks, and manage projects they own. |
| Employee | Can view only assigned projects/tasks and update the status of their own tasks. |

Public self-registration is disabled. New employee and manager accounts must be created by an Admin from the Team page.

## Tech Stack

**Frontend**

- React 18 + Vite
- Redux Toolkit
- React Router v6
- Axios
- Tailwind CSS
- lucide-react, react-hot-toast, date-fns

**Backend**

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcryptjs password hashing
- express-validator
- helmet, cors, express-rate-limit, express-mongo-sanitize

## Folder Structure

```text
taskflow/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
    seed.js
    server.js
  frontend/
    src/
      api/
      app/
      components/
      features/
      pages/
      utils/
    index.html
```

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas database or local MongoDB

### Backend

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Install and run:

```bash
cd backend
npm install
npm run seed
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Install and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Demo Credentials

Run `npm run seed` inside `backend` first.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@taskflow.com` | `Admin@123` |
| Manager | `manager@taskflow.com` | `Manager@123` |
| Employee | `employee@taskflow.com` | `Employee@123` |

The seed script creates demo users, one demo project, and sample tasks.

## Main App Flow

1. Admin logs in.
2. Admin creates manager and employee accounts from the Team page.
3. Admin creates a project and selects one manager plus multiple employees.
4. Manager creates tasks and assigns them to employees.
5. Employees update only the status of their assigned tasks.

## API Summary

All routes are prefixed with `/api`.

Protected routes require:

```text
Authorization: Bearer <token>
```

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Login and return JWT |
| GET | `/auth/me` | Authenticated | Get current user |
| GET | `/users` | Admin | List users |
| POST | `/users` | Admin | Create employee or manager account |
| GET | `/users/:id` | Admin | Get single user |
| PUT | `/users/:id` | Admin | Update user details |
| DELETE | `/users/:id` | Admin | Delete user |
| GET | `/users/list/assignable` | Admin, Manager | Get users for dropdowns |
| GET | `/projects` | Authenticated | List projects scoped by role |
| POST | `/projects` | Admin, Manager | Create project |
| GET | `/projects/:id` | Scoped | Get project details |
| PUT | `/projects/:id` | Admin, Manager | Update project |
| DELETE | `/projects/:id` | Admin, Manager | Delete project and its tasks |
| GET | `/tasks` | Authenticated | List tasks scoped by role |
| POST | `/tasks` | Admin, Manager | Create task |
| GET | `/tasks/:id` | Scoped | Get task details |
| PUT | `/tasks/:id` | Scoped | Update task. Employees are status-only. |
| DELETE | `/tasks/:id` | Admin, Manager | Delete task |

List endpoints support pagination and filters:

```text
?page=1&limit=10&search=query&status=active&role=manager&priority=high
```

## Security and RBAC Notes

- Public registration is not available.
- Passwords are hashed with bcrypt.
- JWT is required for protected API routes.
- Backend controllers enforce role-based data access.
- Frontend route guards are used for UX, but backend authorization remains the source of truth.
- Employees cannot update task title, assignee, priority, due date, or description.
- Deleting a project also deletes its tasks.
- A user cannot delete their own admin account.

## Optimization Notes

- MongoDB indexes are added for common user, project, and task queries.
- Read-heavy list endpoints use lean Mongoose queries where possible.
- Project board tasks are grouped once per render instead of filtered repeatedly.
- Task cards are memoized to reduce unnecessary rerenders.
- Frontend production build is generated with Vite.

## Render Deployment

Deploy this monorepo as two Render services:

1. Backend: Web Service
2. Frontend: Static Site

### Backend on Render

Create a new Render Web Service and connect your GitHub repo.

Use these settings:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Environment variables:

```env
NODE_ENV=production
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-service.onrender.com
```

Do not manually set `PORT`. Render provides it automatically.

After deployment, test:

```text
https://your-backend-service.onrender.com/api/health
```

### Frontend on Render

Create a new Render Static Site and connect the same GitHub repo.

Use these settings:

```text
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

Environment variable:

```env
VITE_API_URL=https://your-backend-service.onrender.com/api
```

Add this rewrite for React Router:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

After the frontend deploys, copy its URL and update backend `CLIENT_URL`, then redeploy the backend.

## Scripts

### Backend

```bash
npm run dev
npm start
npm run seed
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## Important Notes

- Do not commit `.env` files.
- Add `.env` values manually in Render Environment Variables.
- If using a new MongoDB database, run the seed script before logging in with demo credentials.
- In production, replace demo credentials with real admin credentials before sharing the app.
"# taskflow" 
