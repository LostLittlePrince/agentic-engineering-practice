const { db } = require('../connection');

function findAllTags() {
  return db.prepare('SELECT * FROM tags ORDER BY name ASC').all();
}

function findTagById(id) {
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
}

function insertTag(name) {
  const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(name);
  return findTagById(result.lastInsertRowid);
}

function findTagsByTaskId(taskId) {
  return db.prepare(
    'SELECT t.* FROM tags t JOIN task_tags tt ON tt.tag_id = t.id WHERE tt.task_id = ?'
  ).all(taskId);
}

function insertTaskTag(taskId, tagId) {
  db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(taskId, tagId);
}

function deleteTaskTag(taskId, tagId) {
  return db.prepare(
    'DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?'
  ).run(taskId, tagId).changes > 0;
}

module.exports = { findAllTags, findTagById, insertTag, findTagsByTaskId, insertTaskTag, deleteTaskTag };
