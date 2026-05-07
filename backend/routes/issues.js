const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');

const VALID_CATEGORIES = ['ห้องเรียน', 'ห้องน้ำ', 'อาหาร', 'Wi-Fi', 'ความปลอดภัย', 'อื่นๆ'];

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('อัพโหลดได้เฉพาะไฟล์รูปภาพ (JPEG, PNG, WEBP)'));
    }
  },
});

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function getPagination(query) {
  return {
    limit: Math.min(toPositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT),
    offset: Math.max(Number(query.offset) || 0, 0)
  };
}

function getIssueSelectSql(voteAlias = 'votes') {
  return `
    SELECT
      i.id,
      i.user_id,
      i.title,
      i.description,
      i.category,
      i.location,
      i.image_url,
      i.status,
      i.created_at,
      i.updated_at,
      u.name AS author_name,
      COALESCE(vc.vote_count, 0) AS ${voteAlias}
    FROM issues i
    LEFT JOIN users u ON u.id = i.user_id
    LEFT JOIN (
      SELECT issue_id, COUNT(*) AS vote_count
      FROM votes
      GROUP BY issue_id
    ) vc ON vc.issue_id = i.id
  `;
}

function getIssueOrderSql(sort) {
  if (sort === 'votes') {
    return 'ORDER BY votes DESC, i.created_at DESC';
  }

  return 'ORDER BY i.created_at DESC';
}

// GET /api/issues — list all issues (with filter/sort query params)
router.get('/', async (req, res) => {
  try {
    const category = (req.query.category || '').trim();
    const status = (req.query.status || req.query.filter || '').trim();
    const sort = (req.query.sort || 'date').trim();
    const { limit, offset } = getPagination(req.query);

    const where = [];
    const params = [];

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
        ${getIssueSelectSql('votes')}
        ${whereSql}
        ${getIssueOrderSql(sort)}
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json(issues);
  } catch (error) {
    console.error('List issues error:', error);
    res.status(500).json({ error: 'Failed to load issues' });
  }
});

// GET /api/issues/search?q=keyword — search issues
router.get('/search', async (req, res) => {
  try {
    const keyword = (req.query.q || '').trim();
    const category = (req.query.category || '').trim();
    const status = (req.query.status || '').trim();
    const { limit, offset } = getPagination(req.query);

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
        ${getIssueSelectSql('votes')}
        ${whereSql}
        ${getIssueOrderSql(req.query.sort)}
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
  try {
    const issueId = Number(req.params.id);

    if (!Number.isInteger(issueId) || issueId <= 0) {
      return res.status(400).json({ error: 'Invalid issue id' });
    }

    const [issues] = await pool.query(
      `
        ${getIssueSelectSql('votes')}
        WHERE i.id = ?
        LIMIT 1
      `,
      [issueId]
    );

    if (issues.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json(issues[0]);
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ error: 'Failed to load issue' });
  }
});

// POST /api/issues — create issue (auth required, image upload)
router.post('/', verifyToken, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB' });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { title, description, category, location } = req.body;

  function cleanupUpload() {
    if (req.file) fs.unlink(req.file.path, () => {});
  }

  if (!title || !title.trim()) {
    cleanupUpload();
    return res.status(400).json({ error: 'กรุณากรอกหัวข้อปัญหา' });
  }
  if (title.trim().length > 100) {
    cleanupUpload();
    return res.status(400).json({ error: 'หัวข้อปัญหาต้องไม่เกิน 100 ตัวอักษร' });
  }
  if (!description || !description.trim()) {
    cleanupUpload();
    return res.status(400).json({ error: 'กรุณากรอกรายละเอียดปัญหา' });
  }
  if (description.trim().length > 500) {
    cleanupUpload();
    return res.status(400).json({ error: 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร' });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    cleanupUpload();
    return res.status(400).json({ error: 'หมวดหมู่ไม่ถูกต้อง' });
  }
  if (location && location.trim().length > 200) {
    cleanupUpload();
    return res.status(400).json({ error: 'สถานที่ต้องไม่เกิน 200 ตัวอักษร' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await pool.query(
      'INSERT INTO issues (user_id, title, description, category, location, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title.trim(), description.trim(), category || null, location?.trim() || null, imageUrl]
    );

    res.status(201).json({
      id: result.insertId,
      title: title.trim(),
      status: 'open',
      image_url: imageUrl,
    });
  } catch (error) {
    cleanupUpload();
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
  }
});

router.patch("/:id/status",
  verifyToken,
  roleGuard(["admin", "staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const issueId = Number(id);
      const allowed = ["open", "in_progress", "resolved", "closed"];

      if (!Number.isInteger(issueId) || issueId <= 0) {
        return res.status(400).json({ message: "Invalid issue id" });
      }

      if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const [result] = await pool.query(
        "UPDATE issues SET status = ? WHERE id = ?",
        [status, issueId]
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
