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

module.exports = { getPagination, buildFilter, getSortOption };
