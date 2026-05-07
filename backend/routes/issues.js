const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Vote = require('../models/Vote');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');

const VALID_CATEGORIES = ['ห้องเรียน', 'ห้องน้ำ', 'อาหาร', 'Wi-Fi', 'ความปลอดภัย', 'อื่นๆ'];
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

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

function getPagination(query) {
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(Number(query.offset) || 0, 0);
  return { limit, offset };
}

function buildFilter({ category, status, keyword }) {
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (keyword) {
    filter.$or = [
      { title:       { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { location:    { $regex: keyword, $options: 'i' } },
      { category:    { $regex: keyword, $options: 'i' } },
    ];
  }
  return filter;
}

function getSortOption(sort) {
  if (sort === 'votes') return null; // handled in aggregation
  return { created_at: -1 };
}

async function formatIssues(issues) {
  const ids = issues.map(i => i._id);
  const voteCounts = await Vote.aggregate([
    { $match: { issue_id: { $in: ids } } },
    { $group: { _id: '$issue_id', count: { $sum: 1 } } },
  ]);
  const voteMap = Object.fromEntries(voteCounts.map(v => [v._id.toString(), v.count]));

  return issues.map(issue => ({
    id:          issue._id,
    user_id:     issue.user_id?._id ?? issue.user_id,
    title:       issue.title,
    description: issue.description,
    category:    issue.category,
    location:    issue.location,
    image_url:   issue.image_url,
    status:      issue.status,
    created_at:  issue.created_at,
    updated_at:  issue.updated_at,
    author_name: issue.user_id?.name ?? null,
    votes:       voteMap[issue._id.toString()] || 0,
  }));
}

// GET /api/issues
router.get('/', async (req, res) => {
  try {
    const category = (req.query.category || '').trim();
    const status   = (req.query.status || req.query.filter || '').trim();
    const sort     = (req.query.sort || 'date').trim();
    const { limit, offset } = getPagination(req.query);

    const filter = buildFilter({ category, status });

    let issues;
    if (sort === 'votes') {
      const ids = await Vote.aggregate([
        { $group: { _id: '$issue_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      const sortedIds = ids.map(v => v._id);
      const allIssues = await Issue.find({ ...filter, _id: { $in: sortedIds } })
        .populate('user_id', 'name')
        .lean();
      const idxMap = Object.fromEntries(sortedIds.map((id, i) => [id.toString(), i]));
      issues = allIssues.sort((a, b) => (idxMap[a._id.toString()] ?? 999) - (idxMap[b._id.toString()] ?? 999));
    } else {
      issues = await Issue.find(filter)
        .populate('user_id', 'name')
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
    }

    res.json(await formatIssues(issues));
  } catch (error) {
    console.error('List issues error:', error);
    res.status(500).json({ error: 'Failed to load issues' });
  }
});

// GET /api/issues/search
router.get('/search', async (req, res) => {
  try {
    const keyword  = (req.query.q || '').trim();
    const category = (req.query.category || '').trim();
    const status   = (req.query.status || '').trim();
    const sort     = (req.query.sort || 'date').trim();
    const { limit, offset } = getPagination(req.query);

    const filter = buildFilter({ category, status, keyword });

    const issues = await Issue.find(filter)
      .populate('user_id', 'name')
      .sort(getSortOption(sort) || { created_at: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    res.json({ issues: await formatIssues(issues), limit, offset });
  } catch (error) {
    console.error('Search issues error:', error);
    res.status(500).json({ error: 'Failed to search issues' });
  }
});

// GET /api/issues/:id
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid issue id' });
    }

    const issue = await Issue.findById(req.params.id)
      .populate('user_id', 'name')
      .lean();

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const [formatted] = await formatIssues([issue]);
    res.json(formatted);
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ error: 'Failed to load issue' });
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
  const { title, description, category, location } = req.body;

  function cleanupUpload() {
    if (req.file) fs.unlink(req.file.path, () => {});
  }

  if (!title || !title.trim()) { cleanupUpload(); return res.status(400).json({ error: 'กรุณากรอกหัวข้อปัญหา' }); }
  if (title.trim().length > 100) { cleanupUpload(); return res.status(400).json({ error: 'หัวข้อปัญหาต้องไม่เกิน 100 ตัวอักษร' }); }
  if (!description || !description.trim()) { cleanupUpload(); return res.status(400).json({ error: 'กรุณากรอกรายละเอียดปัญหา' }); }
  if (description.trim().length > 500) { cleanupUpload(); return res.status(400).json({ error: 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร' }); }
  if (category && !VALID_CATEGORIES.includes(category)) { cleanupUpload(); return res.status(400).json({ error: 'หมวดหมู่ไม่ถูกต้อง' }); }
  if (location && location.trim().length > 200) { cleanupUpload(); return res.status(400).json({ error: 'สถานที่ต้องไม่เกิน 200 ตัวอักษร' }); }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const issue = await Issue.create({
      user_id:     req.user.id,
      title:       title.trim(),
      description: description.trim(),
      category:    category || null,
      location:    location?.trim() || null,
      image_url:   imageUrl,
    });

    res.status(201).json({
      id:        issue._id,
      title:     issue.title,
      status:    issue.status,
      image_url: issue.image_url,
    });
  } catch (error) {
    cleanupUpload();
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
  }
});

// PATCH /api/issues/:id/status
router.patch('/:id/status', verifyToken, roleGuard(['admin', 'staff']), async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid issue id' });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    res.json({ message: 'Status updated', issueId: issue._id, status });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/issues/:id — delete issue (admin only)
router.delete('/:id', verifyToken, roleGuard(['admin']), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid issue id' });
  }

  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    if (issue.image_url) {
      fs.unlink(path.join(__dirname, '..', issue.image_url), () => {});
    }

    res.json({ message: 'Issue deleted', issueId: req.params.id });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

module.exports = router;