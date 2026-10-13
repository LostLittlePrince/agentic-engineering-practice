const projectsQueries = require('../db/queries/projects');
const { isNonEmptyString } = require('../utils/validation');

function listProjects() {
  return projectsQueries.findAllProjects();
}

function getProjectStats(projectId) {
  const stats = { total: 0, active: 0, completed: 0, archived: 0 };
  for (const row of projectsQueries.countTasksByStatus(projectId)) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }
  return stats;
}

function getProjectWithStats(id) {
  const project = projectsQueries.findProjectById(id);
  if (!project) return null;
  return { ...project, stats: getProjectStats(id) };
}

function createProject({ name, description, owner_id }) {
  if (!name || !isNonEmptyString(name)) {
    throw { status: 400, message: 'name is required' };
  }
  return projectsQueries.insertProject({
    name,
    description: description || null,
    ownerId: owner_id || null
  });
}

function updateProject(id, data) {
  const existing = projectsQueries.findProjectById(id);
  if (!existing) {
    throw { status: 404, message: 'Project not found' };
  }
  return projectsQueries.updateProject(id, {
    name: data.name !== undefined ? data.name : existing.name,
    description: data.description !== undefined ? data.description : existing.description,
    ownerId: data.owner_id !== undefined ? data.owner_id : existing.owner_id
  });
}

function deleteProject(id) {
  if (!projectsQueries.deleteProject(id)) {
    throw { status: 404, message: 'Project not found' };
  }
  return { deleted: true };
}

module.exports = { listProjects, getProjectWithStats, createProject, updateProject, deleteProject };
