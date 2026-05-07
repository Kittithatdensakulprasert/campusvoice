const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');

// GET /api/comments/:issueId — ดูความคิดเห็นของ issue
router.get('/:issueId', async (req, res) => {
  const issueId = parseInt(req.params.issueId);
  if (isNaN(issueId)) return res.status(400).json({ error: 'Invalid issue ID' });

  try {
    const [comments] = await pool.query(
      `SELECT
         c.id,
         c.body,
         c.created_at,
         c.updated_at,
         u.id   AS user_id,
         u.name AS user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.issue_id = ?
       ORDER BY c.created_at ASC`,
      [issueId]
    );

    res.json({ comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/comments/:issueId — เพิ่มความคิดเห็น (ต้อง login)
router.post('/:issueId', verifyToken, async (req, res) => {
  const issueId = parseInt(req.params.issueId);
  if (isNaN(issueId)) return res.status(400).json({ error: 'Invalid issue ID' });
  const userId = req.user.id;
  const { body } = req.body;

  if (!body || body.trim() === '') {
    return res.status(400).json({ error: 'Comment body is required' });
  }

  try {
    // ตรวจว่า issue มีอยู่จริง
    const [issues] = await pool.query('SELECT id FROM issues WHERE id = ?', [issueId]);
    if (issues.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const [result] = await pool.query(
      'INSERT INTO comments (user_id, issue_id, body) VALUES (?, ?, ?)',
      [userId, issueId, body.trim()]
    );

    // ดึง comment ที่เพิ่งสร้างพร้อม user info
    const [[comment]] = await pool.query(
      `SELECT
         c.id,
         c.body,
         c.created_at,
         u.id   AS user_id,
         u.name AS user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/comments/:id — ลบ comment (เจ้าของ หรือ admin)
router.delete('/:id', verifyToken, async (req, res) => {
  const commentId = parseInt(req.params.id);
  if (isNaN(commentId)) return res.status(400).json({ error: 'Invalid comment ID' });
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const [comments] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = comments[0];

    // เฉพาะเจ้าของหรือ admin เท่านั้นที่ลบได้
    if (comment.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
