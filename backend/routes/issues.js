const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');
const { IssueServiceError, createIssueService } = require('../services/issueService');

const issueService = createIssueService();

function cleanupUploadedFile(file) {
  if (file) {
    fs.unlink(file.path, () => {});
  }
}

function handleIssueError(error, res, logLabel) {
  if (error instanceof IssueServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(`${logLabel} error:`, error);
  return res.status(500).json({ error: logLabel });
}

// GET /api/issues
router.get('/', async (req, res) => {
  try {
    res.json(await issueService.listIssues(req.query));
  } catch (error) {
    handleIssueError(error, res, 'Failed to load issues');
  }
});

// GET /api/issues/search
router.get('/search', async (req, res) => {
  try {
    res.json(await issueService.searchIssues(req.query));
  } catch (error) {
    handleIssueError(error, res, 'Failed to search issues');
  }
});

// GET /api/issues/:id
router.get('/:id', async (req, res) => {
  try {
    res.json(await issueService.getIssueDetail(req.params.id, req.headers.authorization));
  } catch (error) {
    handleIssueError(error, res, 'Failed to load issue');
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
    const result = await issueService.createIssue({
      userId: req.user.id,
      input: req.body,
      imageUrl
    });

    res.status(201).json(result);
  } catch (error) {
    cleanupUploadedFile(req.file);
    handleIssueError(error, res, 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
  }
});

// PATCH /api/issues/:id/status
router.patch('/:id/status', verifyToken, roleGuard(['admin', 'staff']), async (req, res) => {
  try {
    res.json(await issueService.updateIssueStatus(req.params.id, req.body.status));
  } catch (error) {
    handleIssueError(error, res, 'Failed to update issue status');
  }
});

// DELETE /api/issues/:id — admin สามารถลบได้ทุก issue, user ลบได้เฉพาะของตัวเอง
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await issueService.deleteIssue(req.params.id, req.user);

    if (result.imageUrl) {
      fs.unlink(path.join(__dirname, '..', result.imageUrl), () => {});
    }

    res.json({ message: result.message, issueId: result.issueId });
  } catch (error) {
    handleIssueError(error, res, 'Failed to delete issue');
  }
});

module.exports = router;
