# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Taskr: a REST API for task management (users, projects, tasks, comments, tags). Node.js + Express 5 + SQLite (`better-sqlite3`, synchronous API) + Jest/supertest. This repo is used for practicing agentic engineering.

Keep changes scoped to the task. When you notice a problem outside the task's scope, point it out instead of quietly working around it or fixing it.

## Context files

Before starting these kinds of tasks, read the matching file and follow it:

| Task involves | Read |
|---|---|
| API routes or endpoints (adding, changing, or moving them) | `.claude/context/api-conventions.md` |
| Testing (writing, changing, or fixing tests) | `.claude/context/testing-standards.md` |

## Commands

```bash
npm install
npm run db:seed          # create schema + sample data in ./taskr.db (skips if users already exist)
npm run db:reset         # rm -f taskr.db && reseed (uses `rm`; needs a POSIX shell on Windows)
npm run dev              # node --watch src/index.js, port 3000 (PORT env overrides)
npm start
npm test                 # all Jest tests
npx jest tests/tasks.test.js            # one file
npx jest tests/tasks.test.js -t "filters by"   # one test by name
```

There is no lint or build step.

## Folder structure

All application code lives under `src/`. Tests live in `tests/`.

```
src/
  index.js              builds the app, mounts middleware and routers; listen() only when run directly
  config.js             PORT, API_KEY, DB_PATH (env reads)
  routes/               one express.Router per resource, exported by name
    health.js           GET /, GET /health
    webhooks.js         POST /webhooks/task-update
    users.js  projects.js  tasks.js
    comments.js         mounted at /tasks/:id/comments (mergeParams)
    tags.js             tagsRouter at /tags, taskTagsRouter at /tasks/:id/tags (mergeParams)
  services/             business logic and validation, one file per resource
    users.js  projects.js  tasks.js  comments.js  tags.js
    email.js            welcome-email stub (only logs)
  db/
    connection.js       the shared `db` (WAL, foreign_keys = ON); `:memory:` when NODE_ENV=test
    schema.js           createSchema(db), the single schema definition, used by seed.js and the tests
    seed.js             sample data for taskr.db
    errors.js           isUniqueViolation(err)
    queries/            SQL, one file per resource
      users.js  projects.js  tasks.js  comments.js  tags.js
  middleware/
    authenticate.js     x-api-key check
    request-logger.js
    error-handler.js
  utils/
    validation.js       validateEmail, isNonEmptyString
tests/
  <resource>.test.js
```

### Layers

Each layer calls only the one below it. **Routes call services, services call queries, and queries call the database connection.**

1. **Routes** (`src/routes/`) parse request params, call one service function, and send the response. They contain no SQL and no validation. All errors go to `next(err)`.
2. **Services** (`src/services/`) validate input, check that referenced rows exist, and hold business rules. They signal expected failures by throwing `{ status, message }`. A service may call any resource's queries, but never `db` directly.
3. **Queries** (`src/db/queries/`) are thin `db.prepare(...)` wrappers around `src/db/connection.js`. They know nothing about HTTP or validation.
4. **Connection** (`src/db/connection.js`) exports the single shared `db`.

Other notes:

- **`middleware/error-handler.js`** turns `{ status, message }` into `res.status(status).json({ error: message })`. It logs only 5xx errors.
- **Auth** (`middleware/authenticate.js`) checks the `x-api-key` header against `API_KEY` (default `dev-key`). It is applied only to `DELETE /users/:id` and `DELETE /projects/:id`.
- **Task status** values are `active | completed | archived`. They're defined in `services/tasks.js` (`VALID_TASK_STATUSES`) and in the CHECK constraint in `db/schema.js`; keep the two in sync. `PUT /tasks/:id` sets `completed_at` when a task enters `completed` and clears it when the task leaves.
- Pagination limits (`DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`) live in `services/tasks.js`.

## Naming conventions

- **All files use kebab-case** `.js` names, for example `error-handler.js` and `request-logger.js`. Don't use camelCase, PascalCase or snake_case file names.
- Resource files use the lowercase plural resource name, and the same name in each layer: `routes/tasks.js`, `services/tasks.js` and `db/queries/tasks.js`.
- Routers are exported by name as `<resource>Router`, for example `module.exports = { tasksRouter }`.
- Test files are `tests/<resource>.test.js`. Jest only picks up `tests/*.test.js`, so a file with any other name is silently skipped.

## Rules

- Don't define routes in `src/index.js`. Its only job for new routes is `app.use(path, router)`.
- Don't skip a layer: no SQL in routes or services, and no request or response handling in services or queries.
- Don't add circular `require`s or lazy (in-function) `require`s.
- `src/utils/` is not a catch-all. Before adding a helper there, check whether it belongs in a service, query module or middleware.
- Schema changes go in `src/db/schema.js` only.

## Tests

Tests import the app from `src/index.js` and run against the in-memory database. See `.claude/context/testing-standards.md`.
