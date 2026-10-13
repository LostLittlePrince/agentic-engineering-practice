const tagsQueries = require('../db/queries/tags');
const tasksQueries = require('../db/queries/tasks');
const { isNonEmptyString } = require('../utils/validation');
const { isUniqueViolation } = require('../db/errors');

function listTags() {
  return tagsQueries.findAllTags();
}

function createTag({ name }) {
  if (!name || !isNonEmptyString(name)) {
    throw { status: 400, message: 'name is required' };
  }
  try {
    return tagsQueries.insertTag(name.toLowerCase().trim());
  } catch (err) {
    if (isUniqueViolation(err)) throw { status: 409, message: 'tag already exists' };
    throw err;
  }
}

function addTagToTask(taskId, { tag_id }) {
  if (!tasksQueries.findTaskById(taskId)) {
    throw { status: 404, message: 'Task not found' };
  }
  if (!tag_id) {
    throw { status: 400, message: 'tag_id is required' };
  }
  const tagId = parseInt(tag_id);
  if (!tagsQueries.findTagById(tagId)) {
    throw { status: 404, message: 'Tag not found' };
  }
  try {
    tagsQueries.insertTaskTag(taskId, tagId);
  } catch (err) {
    if (isUniqueViolation(err)) throw { status: 409, message: 'tag already applied to this task' };
    throw err;
  }
  return { task_id: taskId, tag_id: tagId };
}

function removeTagFromTask(taskId, tagId) {
  if (!tagsQueries.deleteTaskTag(taskId, tagId)) {
    throw { status: 404, message: 'Tag not applied to this task' };
  }
  return { deleted: true };
}

module.exports = { listTags, createTag, addTagToTask, removeTagFromTask };
