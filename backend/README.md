# TaskFlow — Backend API

Node.js + Express + TypeScript REST API backing the TaskFlow mobile app: email/password + Google auth (JWT) and per-user task CRUD, backed by MongoDB. See the [root README](../README.md) for the full project overview and Google credential setup.

## Stack

- Express + TypeScript
- MongoDB via Mongoose
- JWT auth (`jsonwebtoken`) + `bcryptjs` password hashing
- `google-auth-library` to verify Google ID tokens server-side

## Project structure

```
src/
  config/db.ts          MongoDB connection
  models/                User, Task Mongoose schemas
  middleware/            JWT auth guard, centralized error handler
  controllers/            auth + task route handlers
  routes/                 auth + task Express routers
  utils/sortTasks.ts      smart urgency-sort algorithm (deadline + schedule + priority)
  index.ts                app entrypoint
```

## Setup

```sh
npm install
cp .env.example .env   # adjust JWT_SECRET, MONGO_URI, PORT, GOOGLE_WEB_CLIENT_ID as needed
```

MongoDB needs to be running locally. Either:

```sh
docker compose up -d                                   # via Docker
# or
brew install mongodb-community@7.0 && brew services start mongodb/brew/mongodb-community@7.0
```

## Run

```sh
npm run dev     # ts-node + nodemon, http://localhost:4000
```

## API

| Method | Route                       | Auth | Description                          |
|--------|------------------------------|------|---------------------------------------|
| POST   | `/api/auth/register`         | —    | Create account, returns `{ token, user }` |
| POST   | `/api/auth/login`             | —    | `{ token, user }`                     |
| POST   | `/api/auth/google`            | —    | `{ idToken }` → verifies with Google, finds-or-creates the account, returns `{ token, user }` |
| GET    | `/api/auth/me`                | ✓    | Current user                          |
| PUT    | `/api/auth/me`                | ✓    | Partial update: `{ name?, onboarded? }` |
| GET    | `/api/tasks?status&priority&category&sort` | ✓ | List tasks (sort: `smart` \| `deadline` \| `priority`) |
| POST   | `/api/tasks`                  | ✓    | Create task: `title, description, dateTime, deadline, priority, category` |
| PUT    | `/api/tasks/:id`              | ✓    | Update task fields                    |
| PATCH  | `/api/tasks/:id/complete`     | ✓    | Toggle completion                     |
| DELETE | `/api/tasks/:id`              | ✓    | Delete task                           |

Authenticated routes expect `Authorization: Bearer <token>`.

## Smart sort

`sortTasksSmart` (see [src/utils/sortTasks.ts](src/utils/sortTasks.ts)) ranks tasks by blending three signals into one urgency score instead of sorting by a single field:

- 70% weight on hours remaining until `deadline`, 30% on hours until the scheduled `dateTime`
- a priority boost that shifts the effective deadline earlier (high: -30h, medium: -10h, low: 0h)
- completed tasks always sort last

This means a low-priority task due in an hour still outranks a high-priority task due next week.
