# API Conventions: Adding a New Endpoint

Follow these steps when adding a new endpoint to the Taskr API. They apply to every endpoint.

## 1. Put the route in a dedicated file in `src/routes/`

Each resource has its own route file. The file name is the resource name in lowercase plural form:

- `src/routes/tasks.js`
- `src/routes/projects.js`
- `src/routes/comments.js`

If the file already exists, add the endpoint there. Otherwise create it.

## 2. Export a named Express router

```js
const express = require('express');
const tasksRouter = express.Router();

// ...handlers...

module.exports = { tasksRouter };
```

## 3. Keep business logic in `src/services/`

Every handler calls a matching function in `src/services/<resource>.js`. Handlers read the request, call the service and send the response. They must not contain SQL, validation rules or other business logic. If the service function doesn't exist yet, create it in the service file with the same resource name.

Services get data through `src/db/queries/<resource>.js`. Never call `db.prepare` from a route or service.

```js
const tasksService = require('../services/tasks');

tasksRouter.get('/:id', (req, res, next) => {
  try {
    const task = tasksService.getTaskById(Number(req.params.id));
    if (!task) return next({ status: 404, message: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
});
```

## 4. Pass errors to `next` as `{ status, message }`

Don't build error responses in the handler with `res.status(...).json(...)`. Call `next` with an object that has a status code and a message, and let the global error handler format the response:

```js
return next({ status: 400, message: 'title is required' });
```

Service functions signal expected failures by throwing an object with `status` and `message`. The handler's `catch` passes it to `next` unchanged.

## 5. Register the router in `src/index.js`

Register every router with `app.use`, giving it the resource path and the imported router:

```js
const { tasksRouter } = require('./routes/tasks');

app.use('/tasks', tasksRouter);
```

Paths inside the router are relative to that mount point (`'/'`, `'/:id'`). Don't define routes directly in `src/index.js`.

## Checklist

1. Add or update the service function in `src/services/<resource>.js`.
2. Add the handler to `src/routes/<resource>.js`.
3. If the router is new, register it in `src/index.js`.
4. Add tests in `tests/<resource>.test.js`.
5. Run `npx jest tests/<resource>.test.js`, then `npm test`.
