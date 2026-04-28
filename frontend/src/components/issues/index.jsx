import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';

function getStatusClass(status) {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'open') return 'status-open';
  if (normalized === 'in_progress' || normalized === 'in progress') return 'status-progress';
  if (normalized === 'closed') return 'status-closed';
  if (normalized === 'rejected') return 'status-rejected';

  return 'status-default';
}

export function IssueCard({ issue }) {
  return (
    <article className="issue-card">
      <div className="issue-card-header">
        <span className={`status-badge ${getStatusClass(issue.status)}`}>
          {issue.status}
        </span>
        <span className="issue-votes">▲ {issue.votes || 0}</span>
      </div>

      <h2 className="issue-title">{issue.title}</h2>

      <p className="issue-description">
        {issue.description}
      </p>

      <div className="issue-meta">
        <span>{issue.category}</span>
        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
      </div>

      <Link className="issue-detail-link" to={`/issues/${issue.id}`}>
        View detail
      </Link>
    </article>
  );
}

export function IssueListPage() {
  const [issues, setIssues] = useState([]);
  const [sort, setSort] = useState('date');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, [sort, category, status]);

  async function fetchIssues() {
    try {
      setLoading(true);

      const params = {};
      if (sort) params.sort = sort;
      if (category) params.category = category;
      if (status) params.status = status;

      const res = await api.get('/issues', { params });
      setIssues(res.data);
    } catch (err) {
      console.error(err);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="issue-page">
      <div className="issue-page-header">
        <h1>Issue List</h1>
        <p>รายการปัญหาที่ถูกแจ้งเข้ามาในระบบ</p>
      </div>

      <section className="filter-sort-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="road">Road</option>
          <option value="water">Water</option>
          <option value="electricity">Electricity</option>
          <option value="garbage">Garbage</option>
          <option value="other">Other</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="date">Sort by date</option>
          <option value="votes">Sort by votes</option>
        </select>
      </section>

      {loading ? (
        <p className="issue-message">Loading issues...</p>
      ) : issues.length === 0 ? (
        <p className="issue-message">No issues found.</p>
      ) : (
        <section className="issue-grid">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </section>
      )}
    </main>
  );
}

export function IssueDetailPage() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssueDetail();
  }, [id]);

  async function fetchIssueDetail() {
    try {
      setLoading(true);
      const res = await api.get(`/issues/${id}`);
      setIssue(res.data);
    } catch (err) {
      console.error(err);
      setIssue(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="issue-message">Loading issue detail...</p>;
  }

  if (!issue) {
    return <p className="issue-message">Issue not found.</p>;
  }

  return (
    <main className="issue-page">
      <Link className="back-link" to="/issues">
        ← Back to issues
      </Link>

      <article className="issue-detail">
        <div className="issue-card-header">
          <span className={`status-badge ${getStatusClass(issue.status)}`}>
            {issue.status}
          </span>
          <span className="issue-votes">▲ {issue.votes || 0}</span>
        </div>

        <h1>{issue.title}</h1>

        <div className="issue-meta detail-meta">
          <span>Category: {issue.category}</span>
          <span>Date: {new Date(issue.created_at).toLocaleDateString()}</span>
        </div>

        <p className="issue-detail-description">
          {issue.description}
        </p>
      </article>
    </main>
  );
}

export default IssueListPage;