const express = require('express');
const router = express.Router();
const pool = require('../db');
// const verifyToken = require('../middleware/verifyToken');
// const multer = require('multer');

// GET /api/issues — list all issues (with filter/sort query params)
router.get('/', async (req, res) => {
  // TODO: Feature 3 — query params: category, status, sort, page
  res.status(501).json({ message: 'List issues — not yet implemented' });
});

// GET /api/issues/search?q=keyword — search issues
router.get('/search', async (req, res) => {
  try {
    const keyword = (req.query.q || '').trim();
    const category = (req.query.category || '').trim();
    const status = (req.query.status || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const where = [];
    const params = [];

    if (keyword) {
      const searchTerm = `%${keyword}%`;
      where.push('(i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ? OR i.category LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      where.push('i.category = ?');
      params.push(category);
    }

    if (status) {
      where.push('i.status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [issues] = await pool.query(
      `
        SELECT
          i.id,
          i.title,
          i.description,
          i.category,
          i.location,
          i.image_url,
          i.status,
          i.created_at,
          i.updated_at,
          u.name AS author_name,
          COALESCE(vc.vote_count, 0) AS vote_count
        FROM issues i
        LEFT JOIN users u ON u.id = i.user_id
        LEFT JOIN (
          SELECT issue_id, COUNT(*) AS vote_count
          FROM votes
          GROUP BY issue_id
        ) vc ON vc.issue_id = i.id
        ${whereSql}
        ORDER BY i.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({ issues, limit, offset });
  } catch (error) {
    console.error('Search issues error:', error);
    res.status(500).json({ error: 'Failed to search issues' });
  }
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
