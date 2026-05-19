const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');
const { IssueError, createIssueService } = require('../services/issueService');

function handleError(err, res) {
  if (err instanceof IssueError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error('Issue route error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}

function decodeUserId(authHeader) {
  if (!authHeader) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (_) {
    return null;
  }
}

const buildIssueRouter = ({ issueService = createIssueService() } = {}) => {
  const router = express.Router();

  // GET /api/issues
  router.get('/', async (req, res) => {
    try {
      res.json(await issueService.listIssues(req.query));
    } catch (err) {
      handleError(err, res);
    }
  });

  // GET /api/issues/search
  router.get('/search', async (req, res) => {
    try {
      res.json(await issueService.searchIssues(req.query));
    } catch (err) {
      handleError(err, res);
    }
  });

  // GET /api/issues/:id
  router.get('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid issue id' });
    }
    try {
      const userId = decodeUserId(req.headers.authorization);
      res.json(await issueService.getIssueById(req.params.id, userId));
    } catch (err) {
      handleError(err, res);
    }
  });

  // POST /api/issues
  router.post('/', verifyToken, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB' });
      }
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  }, async (req, res) => {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    try {
      const result = await issueService.createIssue(req.user.id, { ...req.body, imageUrl });
      res.status(201).json(result);
    } catch (err) {
      if (req.file) require('fs').unlink(req.file.path, () => {});
      handleError(err, res);
    }
  });

  // PATCH /api/issues/:id/status
  router.patch('/:id/status', verifyToken, roleGuard(['admin', 'staff']), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid issue id' });
    }
    try {
      res.json(await issueService.updateStatus(req.params.id, req.body.status));
    } catch (err) {
      handleError(err, res);
    }
  });

  // DELETE /api/issues/:id
  router.delete('/:id', verifyToken, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid issue id' });
    }
    try {
      res.json(await issueService.deleteIssue(req.params.id, req.user));
    } catch (err) {
      handleError(err, res);
    }
  });

  return router;
};

module.exports = buildIssueRouter();
module.exports.buildIssueRouter = buildIssueRouter;