const express = require('express');
const projectsService = require('../services/projects');
const { authenticate } = require('../middleware/authenticate');

const projectsRouter = express.Router();

projectsRouter.get('/', (req, res, next) => {
  try {
    res.json(projectsService.listProjects());
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/', (req, res, next) => {
  try {
    res.status(201).json(projectsService.createProject(req.body));
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/:id', (req, res, next) => {
  try {
    const project = projectsService.getProjectWithStats(parseInt(req.params.id));
    if (!project) return next({ status: 404, message: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

projectsRouter.put('/:id', (req, res, next) => {
  try {
    res.json(projectsService.updateProject(parseInt(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
});

projectsRouter.delete('/:id', authenticate, (req, res, next) => {
  try {
    res.json(projectsService.deleteProject(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

module.exports = { projectsRouter };
