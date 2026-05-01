const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');

// POST /api/votes/:issueId — toggle vote (1 user = 1 vote)
router.post('/:issueId', verifyToken, async (req, res) => {
  const issueId = parseInt(req.params.issueId);
  if (isNaN(issueId)) return res.status(400).json({ error: 'Invalid issue ID' });
  const userId = req.user.id;

  try {
    // ตรวจว่า issue มีอยู่จริง
    const [issues] = await pool.query('SELECT id FROM issues WHERE id = ?', [issueId]);
    if (issues.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // ตรวจว่า user โหวตไปแล้วหรือยัง
    const [existing] = await pool.query(
      'SELECT id FROM votes WHERE user_id = ? AND issue_id = ?',
      [userId, issueId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Already voted', voted: true });
    }

    // เพิ่ม vote
    await pool.query(
      'INSERT INTO votes (user_id, issue_id) VALUES (?, ?)',
      [userId, issueId]
    );

    // นับ vote ทั้งหมดของ issue นั้น
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM votes WHERE issue_id = ?',
      [issueId]
    );

    res.status(201).json({ message: 'Voted successfully', voteCount: count, voted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/votes/:issueId — ยกเลิก vote
router.delete('/:issueId', verifyToken, async (req, res) => {
  const issueId = parseInt(req.params.issueId);
  if (isNaN(issueId)) return res.status(400).json({ error: 'Invalid issue ID' });
  const userId = req.user.id;

  try {
    const [result] = await pool.query(
      'DELETE FROM votes WHERE user_id = ? AND issue_id = ?',
      [userId, issueId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM votes WHERE issue_id = ?',
      [issueId]
    );

    res.json({ message: 'Vote removed', voteCount: count, voted: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
