import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import VoteButton from '../votes/VoteButton';
import CommentList from '../comments/CommentList';

const ISSUE_CATEGORIES = [
  'ห้องเรียน',
  'ห้องน้ำ',
  'อาหาร',
  'Wi-Fi',
  'ความปลอดภัย',
  'อื่นๆ',
];

const STATUS_LABELS = {
  open: 'รอดำเนินการ',
  in_progress: 'กำลังดำเนินการ',
  resolved: 'แก้ไขแล้ว',
  closed: 'เสร็จสิ้น',
};

const UNKNOWN_STATUS = 'Unknown';
const UNTITLED_ISSUE = 'Untitled issue';
const EMPTY_VALUE = '—';

function getStatusClass(status) {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'open') return 'status-open';
  if (normalized === 'in_progress' || normalized === 'in progress') return 'status-progress';
  if (normalized === 'resolved') return 'status-resolved';
  if (normalized === 'closed') return 'status-closed';

  return 'status-default';
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || UNKNOWN_STATUS;
}

function formatIssueDate(dateString) {
  return dateString ? new Date(dateString).toLocaleDateString() : EMPTY_VALUE;
}

function buildIssueQueryParams({ sort, category, status }) {
  const params = {};
  if (sort) params.sort = sort;
  if (category) params.category = category;
  if (status) params.status = status;
  return params;
}

function getIssueVoteCount(issue) {
  return issue.vote_count ?? issue.votes ?? 0;
}

function getIssuesFromResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.issues) ? data.issues : [];
}

function IssueLayoutNav() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="issue-side-nav" aria-label="Primary navigation">
      <Link className="issue-side-nav__brand" to="/issues">CV</Link>

      <Link
        className="issue-side-nav__icon is-active"
        to="/issues"
        aria-label="รายการปัญหา"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="issue-side-nav__svg">
          <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
          <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
        </svg>
        <span className="issue-side-nav__tooltip">รายการปัญหา</span>
      </Link>

      <Link
        className="issue-side-nav__icon"
        to="/report"
        aria-label="แจ้งปัญหา"
      >
        ＋
        <span className="issue-side-nav__tooltip">แจ้งปัญหา</span>
      </Link>

      <button
        type="button"
        className="issue-side-nav__icon issue-side-nav__icon--logout"
        aria-label="ออกจากระบบ"
        onClick={handleLogout}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="issue-side-nav__svg">
          <path fillRule="evenodd" d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V15a.75.75 0 0 0-1.5 0v3.75a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3V9A.75.75 0 1 0 9 9V5.25a1.5 1.5 0 0 1 1.5-1.5h6ZM5.78 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 0 0 0 1.06l3 3a.75.75 0 0 0 1.06-1.06l-1.72-1.72H15a.75.75 0 0 0 0-1.5H4.06l1.72-1.72a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" />
        </svg>
        <span className="issue-side-nav__tooltip">ออกจากระบบ</span>
      </button>
    </aside>
  );
}

function IssueTopBar({ searchText, onSearchChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const profileName = user?.name || 'ผู้ใช้งาน';
  const profileEmail = user?.email || '';
  const avatarSeed = encodeURIComponent(user?.email || user?.name || 'CampusVoice');

  return (
    <header className="issue-topbar">
      <div className="issue-search-wrap">
        <span className="issue-search-icon" aria-hidden="true">⌕</span>
        <input
          className="issue-search-input"
          type="search"
          placeholder="ค้นหาปัญหา"
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="issue-topbar-profile" aria-label="โปรไฟล์">
        <button
          type="button"
          className="issue-topbar-profile__trigger"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <img
            className="issue-topbar-profile__avatar"
            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${avatarSeed}`}
            alt="โปรไฟล์ผู้ใช้"
          />
        </button>

        <div className={`issue-topbar-profile__menu ${menuOpen ? 'is-open' : ''}`}>
          <p className="issue-topbar-profile__name">{profileName}</p>
          {profileEmail ? (
            <p className="issue-topbar-profile__email">{profileEmail}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function FilterSortBar({ status, onStatusChange, category, onCategoryChange, sort, onSortChange }) {
  return (
    <section className="filter-sort-bar" aria-label="Issue filters">
      <select
        className={`status-filter ${status ? `status-filter--${status}` : 'status-filter--all'}`}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="">สถานะทั้งหมด</option>
        <option value="open">รอดำเนินการ</option>
        <option value="in_progress">กำลังดำเนินการ</option>
        <option value="resolved">แก้ไขแล้ว</option>
        <option value="closed">เสร็จสิ้น</option>
      </select>

      <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
        <option value="">หมวดหมู่ทั้งหมด</option>
        {ISSUE_CATEGORIES.map((issueCategory) => (
          <option key={issueCategory} value={issueCategory}>
            {issueCategory}
          </option>
        ))}
      </select>

      <select value={sort} onChange={(e) => onSortChange(e.target.value)}>
        <option value="date">เรียงตามวันที่</option>
        <option value="votes">เรียงตามโหวต</option>
      </select>
    </section>
  );
}

export function IssueCard({ issue }) {
  const statusLabel = getStatusLabel(issue.status);

  return (
    <article className="issue-card">
      <div className="issue-card-header">
        <span className={`status-badge ${getStatusClass(issue.status)}`}>
          {statusLabel}
        </span>
        <span className="issue-votes">▲ {getIssueVoteCount(issue)}</span>
      </div>

      <h2 className="issue-title">{issue.title || UNTITLED_ISSUE}</h2>

      <p className="issue-description">
        {issue.description || EMPTY_VALUE}
      </p>

      <div className="issue-meta">
        <span className="issue-category">{issue.category || 'Uncategorized'}</span>
        <span>{formatIssueDate(issue.created_at)}</span>
      </div>

      <Link className="issue-detail-link" to={`/issues/${issue.id}`}>
        ดูรายละเอียด
      </Link>
    </article>
  );
}

export function IssueListPage() {
  const [issues, setIssues] = useState([]);
  const [sort, setSort] = useState('date');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildIssueQueryParams({ sort, category, status });
      const res = await api.get('/issues', { params });
      setIssues(getIssuesFromResponse(res.data));
    } catch (err) {
      console.error(err);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [sort, category, status]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const filteredIssues = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return issues;

    return issues.filter((issue) => {
      const haystack = [
        issue.title,
        issue.description,
        issue.category,
        issue.location
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [issues, searchText]);

  return (
    <main className="issue-layout">
      <IssueLayoutNav />

      <section className="issue-content">
        <IssueTopBar searchText={searchText} onSearchChange={setSearchText} />
        <FilterSortBar
          status={status}
          onStatusChange={setStatus}
          category={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
        />

        {loading ? (
          <p className="issue-message">Loading issues...</p>
        ) : filteredIssues.length === 0 ? (
          <p className="issue-message">No issues found.</p>
        ) : (
          <section className="issue-grid" aria-label="Issue list">
            {filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

export function IssueDetailPage() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  const issueId = Number(id);

  const fetchIssueDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/issues/${id}`);
      const issueData = res.data;
      setIssue(issueData);
      setVoteCount(getIssueVoteCount(issueData));
      setHasVoted(false);
    } catch (err) {
      console.error(err);
      setIssue(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssueDetail();
  }, [fetchIssueDetail]);

  if (loading) {
    return <p className="issue-message">Loading issue detail...</p>;
  }

  if (!issue) {
    return <p className="issue-message">Issue not found.</p>;
  }

  const statusLabel = getStatusLabel(issue.status);
  const imageUrl = issue.image_url || null;

  return (
    <main className="issue-layout">
      <IssueLayoutNav />
      <section className="issue-content">
        <IssueTopBar searchText="" onSearchChange={() => {}} />
        <article className="issue-detail">
          <div className="issue-card-header">
            <span className={`status-badge ${getStatusClass(issue.status)}`}>
              {statusLabel}
            </span>
            <VoteButton
              issueId={issueId}
              voteCount={voteCount}
              voted={hasVoted}
              onChange={({ voted, voteCount: nextCount }) => {
                setHasVoted(voted);
                setVoteCount(nextCount);
              }}
            />
          </div>

          <h1>{issue.title || UNTITLED_ISSUE}</h1>

          <div className="issue-meta detail-meta">
            <span>หมวดหมู่: {issue.category || 'ไม่มีหมวดหมู่'}</span>
            <span>สถานที่: {issue.location || EMPTY_VALUE}</span>
            <span>วันที่: {formatIssueDate(issue.created_at)}</span>
          </div>

          <p className="issue-detail-description">
            {issue.description || EMPTY_VALUE}
          </p>

          {imageUrl ? (
            <img
              className="issue-detail-image"
              src={imageUrl}
              alt={issue.title ? `Reported issue: ${issue.title}` : 'Reported issue'}
            />
          ) : null}

        </article>

        <CommentList issueId={issueId} />
      </section>
    </main>
  );
}

export default IssueListPage;
