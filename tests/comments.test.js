process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/index');
const { db } = require('../src/db/connection');
const { createSchema } = require('../src/db/schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
  db.prepare('INSERT INTO users (id, name, email) VALUES (1, ?, ?)').run('Comment Author', 'author@test.com');
  db.prepare('INSERT INTO tasks (id, title) VALUES (1, ?)').run('Commented Task');
});

describe('GET /tasks/:id/comments', () => {
  test('lists comments oldest first with the author name', async () => {
    db.prepare("INSERT INTO comments (task_id, user_id, body, created_at) VALUES (1, 1, 'Second', '2024-01-02 00:00:00')").run();
    db.prepare("INSERT INTO comments (task_id, user_id, body, created_at) VALUES (1, 1, 'First', '2024-01-01 00:00:00')").run();

    const res = await request(app).get('/tasks/1/comments');
    expect(res.status).toBe(200);
    expect(res.body.map((c) => c.body)).toEqual(['First', 'Second']);
    expect(res.body[0].user_name).toBe('Comment Author');
  });

  test('returns an empty array when the task has no comments', async () => {
    const res = await request(app).get('/tasks/1/comments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns 404 when the task does not exist', async () => {
    const res = await request(app).get('/tasks/99999/comments');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Task not found' });
  });
});

describe('POST /tasks/:id/comments', () => {
  test('adds a comment and returns it with the author name', async () => {
    const res = await request(app)
      .post('/tasks/1/comments')
      .send({ user_id: 1, body: 'Looks good' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.body).toBe('Looks good');
    expect(res.body.task_id).toBe(1);
    expect(res.body.user_name).toBe('Comment Author');

    const count = db.prepare('SELECT COUNT(*) AS n FROM comments WHERE task_id = 1').get().n;
    expect(count).toBe(1);
  });

  test('returns 404 when the task does not exist, even if the body is invalid', async () => {
    const res = await request(app)
      .post('/tasks/99999/comments')
      .send({ user_id: 1, body: '' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Task not found' });
  });

  test('rejects a comment with an empty body', async () => {
    const res = await request(app)
      .post('/tasks/1/comments')
      .send({ user_id: 1, body: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'body is required' });
  });

  test('rejects a comment without a user_id', async () => {
    const res = await request(app)
      .post('/tasks/1/comments')
      .send({ body: 'Who wrote this?' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'user_id is required' });
  });

  test('rejects a comment from a user that does not exist', async () => {
    const res = await request(app)
      .post('/tasks/1/comments')
      .send({ user_id: 99999, body: 'Ghost comment' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'user not found' });
  });
});
