const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');
const { IssueServiceError, createIssueService } = require('../services/issueService');

function cleanupUploadedFile(file) {
  if (file) {
    fs.unlink(file.path, () => {});
  }
}

function getOptionalUserId(req, jwtLib = jwt, jwtSecret = process.env.JWT_SECRET) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwtLib.verify(token, jwtSecret);
    return decoded.id;
  } catch (_) {
    return null;
  }
}

function handleIssueError(error, res, logLabel) {
  if (error instanceof IssueServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(`${logLabel} error:`, error);
  return res.status(500).json({ error: logLabel });
}

const buildIssueRouter = ({
  issueService = createIssueService(),
  authMiddleware = verifyToken,
  staffGuard = roleGuard(['admin', 'staff']),
  uploadMiddleware = upload,
  jwtLib = jwt,
  jwtSecret = process.env.JWT_SECRET
} = {}) => {
  const router = express.Router();

  // GET /api/issues
  router.get('/', async (req, res) => {
    try {
      return res.json(await issueService.listIssues(req.query));
    } catch (error) {
      return handleIssueError(error, res, 'Failed to load issues');
    }
  });

  // GET /api/issues/search
  router.get('/search', async (req, res) => {
    try {
      return res.json(await issueService.searchIssues(req.query));
    } catch (error) {
      return handleIssueError(error, res, 'Failed to search issues');
    }
  });

  // GET /api/issues/:id
  router.get('/:id', async (req, res) => {
    try {
      const currentUserId = getOptionalUserId(req, jwtLib, jwtSecret);
      return res.json(await issueService.getIssueDetail(req.params.id, currentUserId));
    } catch (error) {
      return handleIssueError(error, res, 'Failed to load issue');
    }
  });

  // POST /api/issues
  router.post('/', authMiddleware, (req, res, next) => {
    uploadMiddleware.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB' });
      }
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  }, async (req, res) => {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      const result = await issueService.createIssue({
        userId: req.user.id,
        input: req.body,
        imageUrl
      });

      return res.status(201).json(result);
    } catch (error) {
      cleanupUploadedFile(req.file);
      return handleIssueError(error, res, 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  });

  // PATCH /api/issues/:id/status
  router.patch('/:id/status', authMiddleware, staffGuard, async (req, res) => {
    try {
      return res.json(await issueService.updateIssueStatus(req.params.id, req.body.status));
    } catch (error) {
      return handleIssueError(error, res, 'Failed to update issue status');
    }
  });

  // PATCH /api/issues/:id
  router.patch('/:id', authMiddleware, async (req, res) => {
    try {
      return res.json(await issueService.updateIssue({
        id: req.params.id,
        input: req.body,
        user: req.user
      }));
    } catch (error) {
      return handleIssueError(error, res, 'Failed to update issue');
    }
  });

  // DELETE /api/issues/:id — admin สามารถลบได้ทุก issue, user ลบได้เฉพาะของตัวเอง
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await issueService.deleteIssue(req.params.id, req.user);

      if (result.imageUrl) {
        fs.unlink(path.join(__dirname, '..', result.imageUrl), () => {});
      }

      return res.json({ message: result.message, issueId: result.issueId });
    } catch (error) {
      return handleIssueError(error, res, 'Failed to delete issue');
    }
  });

  return router;
};

module.exports = buildIssueRouter();
module.exports.buildIssueRouter = buildIssueRouter;
module.exports.getOptionalUserId = getOptionalUserId;
