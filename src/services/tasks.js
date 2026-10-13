const tasksQueries = require('../db/queries/tasks');
const projectsQueries = require('../db/queries/projects');
const usersQueries = require('../db/queries/users');
const commentsQueries = require('../db/queries/comments');
const tagsQueries = require('../db/queries/tags');
const { isNonEmptyString } = require('../utils/validation');

// Also enforced by the CHECK constraint on tasks.status in src/db/schema.js
const VALID_TASK_STATUSES = ['active', 'completed', 'archived'];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function assertValidStatus(status) {
  if (status && !VALID_TASK_STATUSES.includes(status)) {
    throw { status: 400, message: `status must be one of: ${VALID_TASK_STATUSES.join(', ')}` };
  }
}

function listTasks({ status, project_id, assignee_id, page, page_size }) {
  assertValidStatus(status);

  const limit = Math.min(MAX_PAGE_SIZE, parseInt(page_size) || DEFAULT_PAGE_SIZE);
  const offset = ((parseInt(page) || 1) - 1) * limit;

  return tasksQueries.findTasks({
    status: status || undefined,
    projectId: project_id ? parseInt(project_id) : undefined,
    assigneeId: assignee_id ? parseInt(assignee_id) : undefined,
    limit,
    offset
  });
}

function getTaskById(id) {
  const task = tasksQueries.findTaskById(id);
  if (!task) return null;
  task.tags = tagsQueries.findTagsByTaskId(id);
  task.comments = commentsQueries.findCommentsByTaskId(id);
  return task;
}

function createTask({ title, description, project_id, assignee_id, due_date }) {
  if (!title || !isNonEmptyString(title)) {
    throw { status: 400, message: 'title is required' };
  }
  if (project_id && !projectsQueries.findProjectById(parseInt(project_id))) {
    throw { status: 400, message: 'project not found' };
  }
  if (assignee_id && !usersQueries.findUserById(parseInt(assignee_id))) {
    throw { status: 400, message: 'assignee not found' };
  }
  return tasksQueries.insertTask({
    title,
    description: description || null,
    projectId: project_id ? parseInt(project_id) : null,
    assigneeId: assignee_id ? parseInt(assignee_id) : null,
    dueDate: due_date || null
  });
}

function updateTask(id, data) {
  const existing = tasksQueries.findTaskById(id);
  if (!existing) {
    throw { status: 404, message: 'Task not found' };
  }

  const { title, description, status, project_id, assignee_id, due_date } = data;
  assertValidStatus(status);

  const updatedStatus = status !== undefined ? status : existing.status;
  // Stamp completed_at on entering 'completed', clear it on leaving, keep it otherwise
  const completedAt = updatedStatus === 'completed' && existing.status !== 'completed'
    ? new Date().toISOString()
    : (updatedStatus !== 'completed' ? null : existing.completed_at);

  return tasksQueries.updateTask(id, {
    title: title !== undefined ? title : existing.title,
    description: description !== undefined ? description : existing.description,
    status: updatedStatus,
    projectId: project_id !== undefined ? project_id : existing.project_id,
    assigneeId: assignee_id !== undefined ? assignee_id : existing.assignee_id,
    dueDate: due_date !== undefined ? due_date : existing.due_date,
    completedAt
  });
}

function deleteTask(id) {
  if (!tasksQueries.deleteTask(id)) {
    throw { status: 404, message: 'Task not found' };
  }
  return { deleted: true };
}

module.exports = { listTasks, getTaskById, createTask, updateTask, deleteTask };
