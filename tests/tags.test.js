process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');
const { db } = require('../DB');
const { createSchema } = require('./schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
  db.prepare('INSERT INTO users (id, name, email) VALUES (1, ?, ?)').run('Tagger', 'tagger@test.com');
  db.prepare('INSERT INTO tasks (id, title) VALUES (1, ?)').run('Taggable Task');
  db.prepare('INSERT INTO tags (id, name) VALUES (1, ?)').run('urgent');
});

describe('GET /tags', () => {
  test('lists tags sorted by name', async () => {
    db.prepare("INSERT INTO tags (id, name) VALUES (2, 'backend')").run();
    const res = await request(app).get('/tags');
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.name)).toEqual(['backend', 'urgent']);
  });
});

describe('POST /tags', () => {
  test('creates a tag with a lowercased, trimmed name', async () => {
    const res = await request(app).post('/tags').send({ name: '  Frontend ' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('frontend');

    const row = db.prepare('SELECT name FROM tags WHERE id = ?').get(res.body.id);
    expect(row.name).toBe('frontend');
  });

  test('rejects a tag without a name', async () => {
    const res = await request(app).post('/tags').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'name is required' });
  });

  test('rejects a tag name that already exists', async () => {
    const res = await request(app).post('/tags').send({ name: 'URGENT' });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'tag already exists' });
  });
});

describe('POST /tasks/:id/tags', () => {
  test('applies a tag to a task', async () => {
    const res = await request(app).post('/tasks/1/tags').send({ tag_id: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ task_id: 1, tag_id: 1 });

    const task = await request(app).get('/tasks/1');
    expect(task.body.tags.map((t) => t.name)).toEqual(['urgent']);
  });

  test('returns 404 when the task does not exist', async () => {
    const res = await request(app).post('/tasks/99999/tags').send({ tag_id: 1 });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Task not found' });
  });

  test('rejects a request without a tag_id', async () => {
    const res = await request(app).post('/tasks/1/tags').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'tag_id is required' });
  });

  test('returns 404 when the tag does not exist', async () => {
    const res = await request(app).post('/tasks/1/tags').send({ tag_id: 99999 });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not found' });
  });

  test('returns 409 when the tag is already applied', async () => {
    await request(app).post('/tasks/1/tags').send({ tag_id: 1 });
    const res = await request(app).post('/tasks/1/tags').send({ tag_id: 1 });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'tag already applied to this task' });
  });
});

describe('DELETE /tasks/:id/tags/:tagId', () => {
  test('removes a tag from a task', async () => {
    db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (1, 1)').run();
    const res = await request(app).delete('/tasks/1/tags/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });

    const count = db.prepare('SELECT COUNT(*) AS n FROM task_tags').get().n;
    expect(count).toBe(0);
  });

  test('returns 404 when the tag is not applied to the task', async () => {
    const res = await request(app).delete('/tasks/1/tags/1');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tag not applied to this task' });
  });

  test('returns 404 when the task does not exist', async () => {
    const res = await request(app).delete('/tasks/99999/tags/1');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /tasks/:id with tags and comments', () => {
  test('embeds the task tags and comments', async () => {
    db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (1, 1)').run();
    db.prepare("INSERT INTO comments (task_id, user_id, body) VALUES (1, 1, 'Noted')").run();

    const res = await request(app).get('/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([{ id: 1, name: 'urgent' }]);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0]).toMatchObject({ body: 'Noted', user_name: 'Tagger' });
  });
});
