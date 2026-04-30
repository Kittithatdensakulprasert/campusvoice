const express = require('express');
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const roleGuard = require("../middleware/roleGuard");
// const pool = require('../db');
// const verifyToken = require('../middleware/verifyToken');
// const multer = require('multer');

// GET /api/issues — list all issues (with filter/sort query params)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        i.id,
        i.title,
        i.category,
        i.location,
        i.status,
        i.created_at,
        COUNT(v.id) AS vote_count
      FROM issues i
      LEFT JOIN votes v ON v.issue_id = i.id
      GROUP BY i.id
      ORDER BY vote_count DESC, i.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
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

router.patch("/:id/status",
verifyToken,
  roleGuard(["admin", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const allowed = ["open", "in_progress", "resolved", "closed"];

      if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const [result] = await db.query(
        "UPDATE issues SET status = ? WHERE id = ?",
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Issue not found" });
      }

      return res.json({ message: "Status updated", issueId: id, status });
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE /api/issues/:id — delete issue (admin only)
router.delete('/:id', async (req, res) => {
  // TODO: Feature 6 — verifyToken + roleGuard(['admin'])
  res.status(501).json({ message: 'Delete issue — not yet implemented' });
});

module.exports = router;
