const express = require('express');
const router = express.Router();
// const pool = require('../db');
// const verifyToken = require('../middleware/verifyToken');
// const multer = require('multer');

// GET /api/issues — list all issues (with filter/sort query params)
router.get('/', async (req, res) => {
  // TODO: Feature 3 — query params: category, status, sort, page
  res.status(501).json({ message: 'List issues — not yet implemented' });
});

// GET /api/issues/search?q=keyword — search issues
router.get('/search', async (req, res) => {
  // TODO: Feature 5 — search by title/description
  res.status(501).json({ message: 'Search issues — not yet implemented' });
});

// GET /api/issues/:id — single issue detail
router.get('/:id', async (req, res) => {
  // TODO: Feature 3
  res.status(501).json({ message: 'Get issue — not yet implemented' });
});

// POST /api/issues — create issue (auth required, image upload)
router.post('/', async (req, res) => {
  // TODO: Feature 2 — verifyToken + multer upload
  res.status(501).json({ message: 'Create issue — not yet implemented' });
});

// PATCH /api/issues/:id/status — update issue status (staff/admin only)
router.patch('/:id/status', async (req, res) => {
  // TODO: Feature 6 — verifyToken + roleGuard(['admin', 'staff'])
  res.status(501).json({ message: 'Update issue status — not yet implemented' });
});

// DELETE /api/issues/:id — delete issue (admin only)
router.delete('/:id', async (req, res) => {
  // TODO: Feature 6 — verifyToken + roleGuard(['admin'])
  res.status(501).json({ message: 'Delete issue — not yet implemented' });
});

module.exports = router;
