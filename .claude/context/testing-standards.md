# Testing Standards

Follow these standards when writing tests for the Taskr API.

## File naming

Name test files `tests/<resource>.test.js`, using the resource name in lowercase plural form: `tasks.test.js`, `projects.test.js`, `comments.test.js`. Jest only picks up files that match `tests/*.test.js`, so a file with any other name is skipped without warning.

## Tools and database

Use Jest and supertest against the in-memory SQLite database. Tests must not need a running server, a seeded `taskr.db`, environment variables or any other external setup. Every file starts with this setup:

```js
process.env.NODE_ENV = 'test'; // must come before requiring the app or DB

const request = require('supertest');
const app = require('../src/index');
const { db } = require('../src/db/connection');
const { createSchema } = require('../src/db/schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
  // Insert only the rows this file's tests need, with explicit ids.
});
```

- Setting `NODE_ENV = 'test'` first makes `src/db/connection.js` open `:memory:` instead of `taskr.db`.
- All test files share the same in-memory connection, so clear every table in `beforeEach`. A test must not depend on rows left behind by another test.
- Pass requests to `request(app)`. Never call `app.listen`.
- Routes protected by `authenticate` need the `x-api-key: dev-key` header. Send it in the happy-path test, and leave it out in one of the error cases.

## Coverage for each endpoint

Group each endpoint's tests in a `describe` block named after the method and path. Each endpoint needs:

1. **The happy path.** Assert the status code and the parts of the response body that matter. For writes, also confirm the change took effect, either with a follow-up request or by querying `db`.
2. **At least two error cases.** Choose the ones that apply, for example:
   - a missing or invalid required field → `400`
   - a resource that doesn't exist → `404`
   - a duplicate of a unique value → `409`
   - a missing or wrong API key → `401`
   - an invalid filter or enum value, such as `?status=bogus` → `400`

   Check both the status code and that the body has an `error` message.

## Test descriptions

Write descriptions in plain English. Say what the endpoint does from the client's point of view, not how it's implemented.

| Good | Bad |
|---|---|
| `returns 404 when the task does not exist` | `getTaskById returns null` |
| `creates a task and returns it with an id` | `runs INSERT and calls lastInsertRowid` |
| `rejects a comment with an empty body` | `isNonEmptyString fails` |

## Running the suite

The whole suite must pass with `npm test` and nothing else. Run one file with `npx jest tests/<resource>.test.js`, and run `npm test` before finishing.
