const mongoose = require('mongoose');
const { buildFilter, getPagination, getSortOption } = require('../lib/issueHelpers');
const { createIssueRepository } = require('../repositories/issueRepository');
const { createVoteRepository } = require('../repositories/voteRepository');

const VALID_CATEGORIES = ['ห้องเรียน', 'ห้องน้ำ', 'อาหาร', 'Wi-Fi', 'ความปลอดภัย', 'อื่นๆ'];
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

class IssueServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'IssueServiceError';
    this.statusCode = statusCode;
  }
}

function assertValidObjectId(id, label = 'issue id') {
  if (!mongoose.isValidObjectId(id)) {
    throw new IssueServiceError(`Invalid ${label}`, 400);
  }
}

function serializeIssue(issue, voteMap = {}) {
  return {
    id: issue._id,
    user_id: issue.user_id?._id ?? issue.user_id,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    location: issue.location,
    image_url: issue.image_url,
    status: issue.status,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    author_name: issue.user_id?.name ?? null,
    votes: voteMap[issue._id.toString()] || 0,
  };
}

function validateIssueInput({ title, description, category, location }) {
  const normalizedTitle = String(title || '').trim();
  const normalizedDescription = String(description || '').trim();
  const normalizedLocation = location?.trim() || null;

  if (!normalizedTitle) {
    throw new IssueServiceError('กรุณากรอกหัวข้อปัญหา', 400);
  }

  if (normalizedTitle.length > 100) {
    throw new IssueServiceError('หัวข้อปัญหาต้องไม่เกิน 100 ตัวอักษร', 400);
  }

  if (!normalizedDescription) {
    throw new IssueServiceError('กรุณากรอกรายละเอียดปัญหา', 400);
  }

  if (normalizedDescription.length > 500) {
    throw new IssueServiceError('รายละเอียดต้องไม่เกิน 500 ตัวอักษร', 400);
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new IssueServiceError('หมวดหมู่ไม่ถูกต้อง', 400);
  }

  if (normalizedLocation && normalizedLocation.length > 200) {
    throw new IssueServiceError('สถานที่ต้องไม่เกิน 200 ตัวอักษร', 400);
  }

  return {
    title: normalizedTitle,
    description: normalizedDescription,
    category: category || null,
    location: normalizedLocation
  };
}

function validateIssueUpdateInput(input) {
  const updates = {};
  const normalizedTitle = input.title?.trim?.();
  const normalizedDescription = input.description?.trim?.();

  if (typeof normalizedTitle !== 'string' || !normalizedTitle) {
    throw new IssueServiceError('กรุณากรอกหัวข้อปัญหา', 400);
  }

  if (normalizedTitle.length > 100) {
    throw new IssueServiceError('หัวข้อปัญหาต้องไม่เกิน 100 ตัวอักษร', 400);
  }

  if (typeof normalizedDescription !== 'string' || !normalizedDescription) {
    throw new IssueServiceError('กรุณากรอกรายละเอียดปัญหา', 400);
  }

  if (normalizedDescription.length > 500) {
    throw new IssueServiceError('รายละเอียดต้องไม่เกิน 500 ตัวอักษร', 400);
  }

  updates.title = normalizedTitle;
  updates.description = normalizedDescription;

  if (Object.prototype.hasOwnProperty.call(input, 'category')) {
    const category = (input.category || '').trim();
    if (category && !VALID_CATEGORIES.includes(category)) {
      throw new IssueServiceError('หมวดหมู่ไม่ถูกต้อง', 400);
    }
    updates.category = category || null;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'location')) {
    const location = (input.location || '').trim();
    if (location.length > 200) {
      throw new IssueServiceError('สถานที่ต้องไม่เกิน 200 ตัวอักษร', 400);
    }
    updates.location = location || null;
  }

  return updates;
}

const createIssueService = ({
  issueRepository = createIssueRepository(),
  voteRepository = createVoteRepository()
} = {}) => {
  async function formatIssues(issues) {
    const ids = issues.map(issue => issue._id);
    const voteCounts = ids.length ? await voteRepository.countVotesByIssueIds(ids) : [];
    const voteMap = Object.fromEntries(voteCounts.map(v => [v._id.toString(), v.count]));
    return issues.map(issue => serializeIssue(issue, voteMap));
  }

  return {
    async listIssues(query) {
      const category = (query.category || '').trim();
      const status = (query.status || query.filter || '').trim();
      const sort = (query.sort || 'date').trim();
      const { limit, offset } = getPagination(query);
      const filter = buildFilter({ category, status });

      if (sort === 'votes') {
        const voteRows = await voteRepository.getIssueIdsByVoteCount();
        const sortedIds = voteRows.map(v => v._id);
        const allIssues = await issueRepository.findIssuesByIds({ filter, ids: sortedIds });
        const idxMap = Object.fromEntries(sortedIds.map((id, i) => [id.toString(), i]));
        const issues = allIssues
          .sort((a, b) => (idxMap[a._id.toString()] ?? 999) - (idxMap[b._id.toString()] ?? 999))
          .slice(offset, offset + limit);
        return formatIssues(issues);
      }

      const issues = await issueRepository.findIssues({
        filter,
        sort: { created_at: -1 },
        offset,
        limit
      });
      return formatIssues(issues);
    },

    async searchIssues(query) {
      const keyword = (query.q || '').trim();
      const category = (query.category || '').trim();
      const status = (query.status || '').trim();
      const sort = (query.sort || 'date').trim();
      const { limit, offset } = getPagination(query);
      const filter = buildFilter({ category, status, keyword });
      const issues = await issueRepository.findIssues({
        filter,
        sort: getSortOption(sort) || { created_at: -1 },
        offset,
        limit
      });

      return {
        issues: await formatIssues(issues),
        limit,
        offset
      };
    },

    async getIssueDetail(id, currentUserId = null) {
      assertValidObjectId(id);

      const issue = await issueRepository.findIssueById(id);
      if (!issue) {
        throw new IssueServiceError('Issue not found', 404);
      }

      const [formatted] = await formatIssues([issue]);
      let voted = false;

      if (currentUserId) {
        const existing = await voteRepository.findByUserAndIssue(currentUserId, issue._id);
        voted = !!existing;
      }

      return { ...formatted, voted };
    },

    async createIssue({ userId, input, imageUrl }) {
      const normalized = validateIssueInput(input);
      const issue = await issueRepository.createIssue({
        user_id: userId,
        ...normalized,
        image_url: imageUrl,
      });

      return {
        id: issue._id,
        title: issue.title,
        status: issue.status,
        image_url: issue.image_url,
      };
    },

    async updateIssueStatus(id, status) {
      assertValidObjectId(id);

      if (!VALID_STATUSES.includes(status)) {
        throw new IssueServiceError('Invalid status', 400);
      }

      const issue = await issueRepository.updateIssueStatus(id, status);
      if (!issue) {
        throw new IssueServiceError('Issue not found', 404);
      }

      return { message: 'Status updated', issueId: issue._id, status };
    },

    async updateIssue({ id, input, user }) {
      assertValidObjectId(id);
      const updates = validateIssueUpdateInput(input || {});

      const issue = await issueRepository.findIssueDocumentById(id);
      if (!issue) {
        throw new IssueServiceError('Issue not found', 404);
      }

      const isOwner = issue.user_id.toString() === user.id;
      const isAdminOrStaff = ['admin', 'staff'].includes(user.role);
      if (!isOwner && !isAdminOrStaff) {
        throw new IssueServiceError('ไม่มีสิทธิ์แก้ไข issue นี้', 403);
      }

      const updated = await issueRepository.updateIssue(id, updates);
      const [formatted] = await formatIssues([updated]);
      return { message: 'Issue updated', issue: formatted };
    },

    async deleteIssue(id, user) {
      assertValidObjectId(id);

      const issue = await issueRepository.findIssueDocumentById(id);
      if (!issue) {
        throw new IssueServiceError('Issue not found', 404);
      }

      const isAdmin = user.role === 'admin';
      const isOwner = issue.user_id.toString() === user.id;
      if (!isAdmin && !isOwner) {
        throw new IssueServiceError('ไม่มีสิทธิ์ลบ issue นี้', 403);
      }

      const imageUrl = issue.image_url;
      await issue.deleteOne();

      return { message: 'Issue deleted', issueId: id, imageUrl };
    }
  };
};

module.exports = { IssueServiceError, createIssueService };
