# ScopeLock

ScopeLock is a platform for freelancers to manage project scope, handle client requests, and auto-generate change orders when clients ask for out-of-scope work.

## Features

- **Scope Builder**: Define project scope items with estimated hours and category tags.
- **Client Portal**: A public, token-protected portal where clients can view their project timeline and submit new feature requests.
- **Match Engine**: Automatically classifies client requests as `in_scope`, `possible_extra`, or `unclear` based on keyword matching against the original scope.
- **Change Orders**: Generate draft change orders, send them to the client for approval, and automatically update project totals.

---

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or later)
- MongoDB (v6 or later, local instance or MongoDB Atlas)

### 2. Backend Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the values:
     - `PORT=5000`
     - `MONGODB_URI=mongodb://127.0.0.1:27017/scopelock` (or your Atlas string)
     - `JWT_SECRET=your_random_secret_string`
     - `JWT_EXPIRY=7d`
     - `CLIENT_ORIGIN=http://localhost:3000`
     - `NODE_ENV=development`
4. Seed the database with sample data (optional but recommended):
   ```bash
   node scripts/seed.js
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the value:
     - `REACT_APP_API_BASE_URL=http://localhost:5000`
4. Start the frontend development server:
   ```bash
   npm start
   ```

---

## Deployment

This repository is ready for cloud deployment.

### Backend (Render)
1. Create a new Web Service on [Render](https://render.com).
2. Point it to the `server/` directory.
3. Add the environment variables listed in `server/.env.example`.
4. Ensure `MONGODB_URI` points to a cloud-hosted database (like MongoDB Atlas).
*(Alternatively, use the included `server/render.yaml` Blueprint).*

### Frontend (Vercel)
1. Create a new Project on [Vercel](https://vercel.com).
2. Point the framework preset to "Create React App" and the root directory to `client/`.
3. Add the `REACT_APP_API_BASE_URL` environment variable pointing to your deployed Render URL.
4. The included `vercel.json` ensures React Router client-side routing works correctly.

---

## API Endpoints List

### Authentication Endpoints (Public)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new freelancer |
| `POST` | `/api/auth/login` | Login and return JWT |

### Authentication Endpoints (Protected)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Get the logged-in freelancer's profile |

### Project Endpoints (Protected)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | Get all projects for the freelancer |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/:id` | Get a specific project by ID |
| `PUT` | `/api/projects/:id` | Update a project's details |
| `DELETE` | `/api/projects/:id` | Delete a project and all associated data |

### Scope Item Endpoints (Protected)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/:id/scope-items` | Get all scope items for a project |
| `POST` | `/api/projects/:id/scope-items` | Create a new scope item |
| `PUT` | `/api/scope-items/:id` | Update a scope item |
| `DELETE` | `/api/scope-items/:id` | Delete a scope item |

### Request and Change Order Endpoints (Protected)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/:id/requests` | Get all client requests for a project |
| `POST` | `/api/requests/:id/change-order` | Generate a draft change order from a request |
| `GET` | `/api/projects/:id/change-orders` | Get all change orders for a project |
| `GET` | `/api/change-orders/:id` | Get a specific change order |
| `PUT` | `/api/change-orders/:id` | Edit a draft change order (description, hours) |
| `PUT` | `/api/change-orders/:id/send` | Send a change order to the client |
| `DELETE` | `/api/change-orders/:id` | Delete a draft change order |
| `GET` | `/api/projects/:id/timeline` | Get the combined scope and change order timeline |

### Notification Endpoints (Protected)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get all notifications for the freelancer |
| `PATCH`| `/api/notifications/:id/read` | Mark a specific notification as read |
| `PATCH`| `/api/notifications/read-all` | Mark all notifications as read |

### Client Portal Endpoints (Public)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/portal/:token` | Get project summary for the portal |
| `GET` | `/api/portal/:token/tags` | Get all unique category tags for the project |
| `POST` | `/api/portal/:token/requests` | Submit a new request (Rate limited) |
| `GET` | `/api/portal/:token/change-orders` | Get pending change orders |
| `PUT` | `/api/portal/:token/change-orders/:id/approve` | Approve a change order |
| `PUT` | `/api/portal/:token/change-orders/:id/decline` | Decline a change order |
| `GET` | `/api/portal/:token/timeline` | Get the simplified client timeline |
