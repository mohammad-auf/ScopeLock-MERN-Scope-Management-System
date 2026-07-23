# ScopeLock

ScopeLock is a platform for freelancers to manage project scope, handle client requests, and auto-generate change orders when clients ask for out-of-scope work.

## Features

- **Scope Builder**: Define project scope items with estimated hours and category tags.
- **Client Portal**: A public, token-protected portal where clients can view their project timeline and submit new feature requests.
- **Match Engine**: Automatically classifies client requests as `in_scope`, `possible_extra`, or `unclear` based on keyword matching against the original scope.
- **Change Orders**: Generate draft change orders, review and edit them on a dedicated review page, send them to the client for approval, and automatically update project totals.
- **Notifications**: Real-time notifications for the freelancer when a client submits a request or responds to a change order.

---

## Project Structure

```
scopelock/
├── client/          # React frontend (Create React App)
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       └── utils/
│           └── scopeMatcher.js   ← Canonical scope match classifier
├── server/          # Node.js / Express backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   └── utils/
│       └── matchEngine.js        ← Re-export shim (points to client/src/utils/scopeMatcher.js)
└── README.md
```

---

## Environment Variables

### Backend (`server/.env`)

Copy `server/.env.example` to `server/.env` and fill in the values.

| Variable | Example | Description |
|---|---|---|
| `PORT` | `5000` | Port the Express server listens on |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/scopelock` | Full MongoDB connection string |
| `JWT_SECRET` | `a_long_random_string` | Secret key used to sign JWTs |
| `JWT_EXPIRY` | `7d` | JWT expiry duration |
| `CLIENT_ORIGIN` | `http://localhost:3000` | CORS allowed origin (your frontend URL) |
| `NODE_ENV` | `development` | Set to `production` when deployed |

> [!CAUTION]
> **Never commit `server/.env` to version control.** It contains your database credentials and JWT secret. Both `server/.env` and `client/.env` are already in `.gitignore`.

### Frontend (`client/.env`)

Copy `client/.env.example` to `client/.env` and fill in the values.

| Variable | Example | Description |
|---|---|---|
| `REACT_APP_API_BASE_URL` | `http://localhost:5000` | Base URL of the backend API (no trailing slash) |

---

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or later)
- MongoDB (local instance or MongoDB Atlas)

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env   # then edit .env with your values
npm run dev            # starts with nodemon
```

### 3. Frontend Setup

```bash
cd client
npm install
cp .env.example .env   # then edit .env with your values
npm start
```

The app will be available at `http://localhost:3000`.

---

## Seed Script

The seed script creates a demo freelancer account and a sample project with scope items. It is **safe to run multiple times** — it only deletes records belonging to the demo account (`freelancer@scopelock.com`) before recreating them.

```bash
# From the server/ directory:
node scripts/seed.js
```

**Output after running:**
```
Connected to MongoDB
Removed existing demo user: freelancer@scopelock.com
Created Freelancer: freelancer@scopelock.com (Password: password123)
Created Project: E-Commerce Website Redesign
Created 4 Scope Items

--- Seed Complete ---
Login:             freelancer@scopelock.com / password123
Client Portal URL: http://localhost:3000/portal/<token>
```

> [!NOTE]
> The seed script requires `MONGODB_URI` to be set in `server/.env` before running.

---

## API Endpoints

All protected endpoints require a `Authorization: Bearer <jwt>` header.

### Authentication (Public)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ name, email, password }` | Register a new freelancer account |
| `POST` | `/api/auth/login` | `{ email, password }` | Login and receive a JWT |

### Authentication (Protected)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Get the authenticated freelancer's profile |

---

### Projects (Protected)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/projects` | — | Get all projects owned by the freelancer |
| `POST` | `/api/projects` | `{ title, clientName, hourlyRate, status? }` | Create a new project |
| `GET` | `/api/projects/:id` | — | Get a specific project by ID |
| `PUT` | `/api/projects/:id` | `{ title?, clientName?, hourlyRate?, status? }` | Update a project's details |
| `DELETE` | `/api/projects/:id` | — | Delete a project and all its associated data |

---

### Scope Items (Protected)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/projects/:id/scope-items` | — | Get all scope items for a project |
| `POST` | `/api/projects/:id/scope-items` | `{ title, description, categoryTag, estimatedHours }` | Create a new scope item |
| `PUT` | `/api/scope-items/:id` | `{ title?, description?, categoryTag?, estimatedHours? }` | Update a scope item |
| `DELETE` | `/api/scope-items/:id` | — | Delete a scope item |

---

### Client Requests (Protected)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/projects/:id/requests` | — | Get all client requests for a project, newest first |
| `POST` | `/api/requests/:id/change-order` | `{ description, estimatedHours, isBlocking? }` | Generate a draft change order from a client request |

---

### Change Orders (Protected)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/projects/:id/change-orders` | — | Get all change orders for a project |
| `GET` | `/api/change-orders/:id` | — | Get a specific change order by ID |
| `PUT` | `/api/change-orders/:id` | `{ description?, estimatedHours? }` | Edit a **draft** change order |
| `PUT` | `/api/change-orders/:id/send` | — | Send a change order to the client for approval |
| `DELETE` | `/api/change-orders/:id` | — | Delete a **draft** change order |

---

### Timeline (Protected)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/:id/timeline` | Get the full scope + change order timeline for a project |

---

### Notifications (Protected)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get the latest 30 notifications for the freelancer |
| `PUT` | `/api/notifications/:id/read` | Mark a specific notification as read |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read |

---

### Client Portal (Public — no JWT required)

Authenticated via unique `portalToken` embedded in the URL. Rate limited to 20 requests/hour per token on the submit endpoint.

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/portal/:token` | — | Get project summary (title, status, totals) |
| `GET` | `/api/portal/:token/tags` | — | Get all unique scope item category tags |
| `POST` | `/api/portal/:token/requests` | `{ requestText, categoryTag? }` | Submit a new client request (auto-classified) |
| `GET` | `/api/portal/:token/change-orders` | — | Get all **sent** change orders awaiting client response |
| `PUT` | `/api/portal/:token/change-orders/:id/approve` | — | Approve a change order |
| `PUT` | `/api/portal/:token/change-orders/:id/decline` | — | Decline a change order |
| `GET` | `/api/portal/:token/timeline` | — | Get the simplified scope timeline (scope items + approved COs) |

---

## Deployment

### Backend on Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Set the **Root Directory** to blank (repository root) so the server can resolve `client/src/utils/scopeMatcher.js`.
4. Set **Build Command**: `cd server && npm install`
5. Set **Start Command**: `node server/server.js`
6. Add all environment variables from the table above under **Environment**.
7. Make sure `MONGODB_URI` points to a cloud-hosted database (MongoDB Atlas).
8. Set `CLIENT_ORIGIN` to your Vercel frontend URL.

### Frontend on Vercel

1. Create a new **Project** on [Vercel](https://vercel.com).
2. Import your GitHub repository.
3. Set the **Root Directory** to `client`.
4. Set the **Framework Preset** to `Create React App`.
5. Add the `REACT_APP_API_BASE_URL` environment variable (Production + Preview + Development) pointing to your deployed Render URL (e.g. `https://scopelock-backend.onrender.com`). **No trailing slash.**
6. Click **Deploy**.

> [!IMPORTANT]
> The `REACT_APP_API_BASE_URL` environment variable must be set in Vercel **before** the build runs. If you add or change it, you must trigger a new deployment (Redeploy without cache) for the change to take effect in the production bundle.

---

## Architecture Notes

### Scope Classifier

The scope match classifier is located in `client/src/utils/scopeMatcher.js` and is used by the server (Node.js `require`) to classify incoming client requests. The file is written in CommonJS syntax so it is compatible with both the server runtime and the Webpack/CRA build system.

The server-side `server/utils/matchEngine.js` is a thin re-export shim that delegates to `scopeMatcher.js` for backward compatibility.

### Security

- All secrets are loaded exclusively from environment variables. No credentials are hardcoded.
- `.env` files are excluded from version control via `.gitignore` at the root, `client/`, and `server/` levels.
- JWT tokens expire after the duration set in `JWT_EXPIRY`.
- The client portal is authenticated via opaque `portalToken` (no user login required).
