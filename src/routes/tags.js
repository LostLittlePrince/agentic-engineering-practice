const express = require('express');
const tagsService = require('../services/tags');

// Mounted at /tags
const tagsRouter = express.Router();

tagsRouter.get('/', (req, res, next) => {
  try {
    res.json(tagsService.listTags());
  } catch (err) {
    next(err);
  }
});

tagsRouter.post('/', (req, res, next) => {
  try {
    res.status(201).json(tagsService.createTag(req.body));
  } catch (err) {
    next(err);
  }
});

// Mounted at /tasks/:id/tags
const taskTagsRouter = express.Router({ mergeParams: true });

taskTagsRouter.post('/', (req, res, next) => {
  try {
    res.status(201).json(tagsService.addTagToTask(parseInt(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
});

taskTagsRouter.delete('/:tagId', (req, res, next) => {
  try {
    res.json(tagsService.removeTagFromTask(parseInt(req.params.id), parseInt(req.params.tagId)));
  } catch (err) {
    next(err);
  }
});

module.exports = { tagsRouter, taskTagsRouter };
