const Vote = require('../models/Vote');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function getPagination(query) {
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(Number(query.offset) || 0, 0);
  return { limit, offset };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter({ category, status, keyword }) {
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (keyword) {
    const safe = escapeRegex(keyword);
    filter.$or = [
      { title:       { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { location:    { $regex: safe, $options: 'i' } },
      { category:    { $regex: safe, $options: 'i' } },
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

module.exports = { getPagination, buildFilter, getSortOption, formatIssues };
