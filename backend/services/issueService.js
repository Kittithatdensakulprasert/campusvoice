const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getPagination, buildFilter, getSortOption } = require('../lib/issueHelpers');
const { createIssueRepository } = require('../repositories/issueRepository');
const { createVoteRepository } = require('../repositories/voteRepository');

const VALID_CATEGORIES = ['ห้องเรียน', 'ห้องน้ำ', 'อาหาร', 'Wi-Fi', 'ความปลอดภัย', 'อื่นๆ'];
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

class IssueError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'IssueError';
    this.statusCode = statusCode;
  }
}

const createIssueService = ({
  issueRepository = createIssueRepository(),
  voteRepository = createVoteRepository(),
} = {}) => ({
  async listIssues(query) {
    const category = (query.category || '').trim();
    const status   = (query.status || query.filter || '').trim();
    const sort     = (query.sort || 'date').trim();
    const { limit, offset } = getPagination(query);
    const filter = buildFilter({ category, status });

    if (sort === 'votes') {
      return issueRepository.findAllSortedByVotes(filter);
    }
    return issueRepository.findAll({ filter, sortOption: { created_at: -1 }, limit, offset });
  },

  async searchIssues(query) {
    const keyword  = (query.q || '').trim();
    const category = (query.category || '').trim();
    const status   = (query.status || '').trim();
    const sort     = (query.sort || 'date').trim();
    const { limit, offset } = getPagination(query);
    const filter = buildFilter({ category, status, keyword });
    const sortOption = getSortOption(sort) || { created_at: -1 };

    const issues = await issueRepository.findAll({ filter, sortOption, limit, offset });
    return { issues, limit, offset };
  },

  async getIssueById(id, authHeader) {
    const issue = await issueRepository.findById(id);
    if (!issue) throw new IssueError('Issue not found', 404);

    let voted = false;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const existing = await voteRepository.findByUserAndIssue(decoded.id, id);
        voted = !!existing;
      } catch (_) {}
    }

    return { ...issue, voted };
  },

  async createIssue(userId, { title, description, category, location, imageUrl }) {
    if (!title || !title.trim())             throw new IssueError('กรุณากรอกหัวข้อปัญหา', 400);
    if (title.trim().length > 100)           throw new IssueError('หัวข้อปัญหาต้องไม่เกิน 100 ตัวอักษร', 400);
    if (!description || !description.trim()) throw new IssueError('กรุณากรอกรายละเอียดปัญหา', 400);
    if (description.trim().length > 500)     throw new IssueError('รายละเอียดต้องไม่เกิน 500 ตัวอักษร', 400);
    if (category && !VALID_CATEGORIES.includes(category)) throw new IssueError('หมวดหมู่ไม่ถูกต้อง', 400);
    if (location && location.trim().length > 200) throw new IssueError('สถานที่ต้องไม่เกิน 200 ตัวอักษร', 400);

    const issue = await issueRepository.create({
      user_id:     userId,
      title:       title.trim(),
      description: description.trim(),
      category:    category || null,
      location:    location?.trim() || null,
      image_url:   imageUrl || null,
    });

    return {
      id:        issue._id,
      title:     issue.title,
      status:    issue.status,
      image_url: issue.image_url,
    };
  },

  async updateStatus(issueId, status) {
    if (!VALID_STATUSES.includes(status)) throw new IssueError('Invalid status', 400);
    const issue = await issueRepository.updateStatus(issueId, status);
    if (!issue) throw new IssueError('Issue not found', 404);
    return { message: 'Status updated', issueId: issue._id, status };
  },

  async deleteIssue(issueId, requestingUser) {
    const issue = await issueRepository.findDocumentById(issueId);
    if (!issue) throw new IssueError('Issue not found', 404);

    const isAdmin = requestingUser.role === 'admin';
    const isOwner = issue.user_id.toString() === requestingUser.id;
    if (!isAdmin && !isOwner) throw new IssueError('ไม่มีสิทธิ์ลบ issue นี้', 403);

    await issue.deleteOne();

    if (issue.image_url) {
      fs.unlink(path.join(__dirname, '..', issue.image_url), () => {});
    }

    return { message: 'Issue deleted', issueId };
  },
});

module.exports = { IssueError, createIssueService };