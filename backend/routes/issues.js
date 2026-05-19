const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const Vote = require('../models/Vote');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');
const { getPagination, buildFilter, getSortOption, formatIssues } = require('../lib/issueHelpers');

const VALID_CATEGORIES = ['ห้องเรียน', 'ห้องน้ำ', 'อาหาร', 'Wi-Fi', 'ความปลอดภัย', 'อื่นๆ'];
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

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
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid issue id' });
  }

  try {
    const issue = await Issue.findById(req.params.id)
      .populate('user_id', 'name')
      .lean();

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const [formatted] = await formatIssues([issue]);

    let voted = false;
    if (req.headers.authorization) {
      // optionally check if the current user has voted
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const existing = await Vote.findOne({ user_id: decoded.id, issue_id: issue._id });
        voted = !!existing;
      } catch (_) {}
    }

    res.json({ ...formatted, voted });
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

  if (!title || !title.trim())            { cleanupUpload(); return res.status(400).json({ error: 'กรุณากรอกหัวข้อปัญหา' }); }
  if (title.trim().length > 100)          { cleanupUpload(); return res.status(400).json({ error: 'หัวข้อปัญหาต้องไม่เกิน 100 ตัวอักษร' }); }
  if (!description || !description.trim()) { cleanupUpload(); return res.status(400).json({ error: 'กรุณากรอกรายละเอียดปัญหา' }); }
  if (description.trim().length > 500)   { cleanupUpload(); return res.status(400).json({ error: 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร' }); }
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
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid issue id' });
  }

  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    res.json({ message: 'Status updated', issueId: issue._id, status });
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({ error: 'Failed to update issue status' });
  }
});

// PATCH /api/issues/:id
router.patch('/:id', verifyToken, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid issue id' });
  }

  const title = req.body?.title?.trim?.();
  const description = req.body?.description?.trim?.();
  const updates = {};

  if (typeof title !== 'string' || !title) {
    return res.status(400).json({ error: 'กรุณากรอกหัวข้อปัญหา' });
  }
  if (title.length > 100) {
    return res.status(400).json({ error: 'หัวข้อปัญหาต้องไม่เกิน 100 ตัวอักษร' });
  }
  if (typeof description !== 'string' || !description) {
    return res.status(400).json({ error: 'กรุณากรอกรายละเอียดปัญหา' });
  }
  if (description.length > 500) {
    return res.status(400).json({ error: 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร' });
  }

  updates.title = title;
  updates.description = description;

  if (Object.prototype.hasOwnProperty.call(req.body, 'category')) {
    const category = (req.body.category || '').trim();
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'หมวดหมู่ไม่ถูกต้อง' });
    }
    updates.category = category || null;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'location')) {
    const location = (req.body.location || '').trim();
    if (location.length > 200) {
      return res.status(400).json({ error: 'สถานที่ต้องไม่เกิน 200 ตัวอักษร' });
    }
    updates.location = location || null;
  }

  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const isOwner = issue.user_id.toString() === req.user.id;
    const isAdminOrStaff = ['admin', 'staff'].includes(req.user.role);
    if (!isOwner && !isAdminOrStaff) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไข issue นี้' });
    }

    const updated = await Issue.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    )
      .populate('user_id', 'name')
      .lean();

    const [formatted] = await formatIssues([updated]);
    res.json({ message: 'Issue updated', issue: formatted });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// DELETE /api/issues/:id — admin สามารถลบได้ทุก issue, user ลบได้เฉพาะของตัวเอง
router.delete('/:id', verifyToken, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid issue id' });
  }

  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = issue.user_id.toString() === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์ลบ issue นี้' });
    }

    await issue.deleteOne();

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
