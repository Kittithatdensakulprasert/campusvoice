import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../common/Pagination';
import SideNav from '../common/SideNav';
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
  return <SideNav />;
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

export function IssueCard({ issue, onDelete }) {
  const { user, isAdmin } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const statusLabel = getStatusLabel(issue.status);

  const isOwner = user && String(user.id) === String(issue.user_id);
  const canDelete = isAdmin || isOwner;

  async function handleDelete(e) {
    e.preventDefault();
    if (!window.confirm(`ยืนยันการลบ "${issue.title || 'issue นี้'}"?`)) return;
    try {
      setDeleting(true);
      await api.delete(`/issues/${issue.id}`);
      onDelete?.(issue.id);
    } catch (err) {
      window.alert(err.response?.data?.error || 'ลบไม่สำเร็จ');
    } finally {
      setDeleting(false);
    }
  }

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
        <span className="issue-category">{issue.category || 'ไม่มีหมวดหมู่'}</span>
        <span>{formatIssueDate(issue.created_at)}</span>
      </div>

      <div className="issue-card-actions">
        <Link className="issue-detail-link" to={`/issues/${issue.id}`}>
          ดูรายละเอียด
        </Link>
        {canDelete && (
          <button
            type="button"
            className="issue-delete-btn"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="ลบ issue"
          >
            {deleting ? '...' : 'ลบ'}
          </button>
        )}
      </div>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleDeleteIssue = useCallback((deletedId) => {
    setIssues((prev) => prev.filter((issue) => String(issue.id) !== String(deletedId)));
  }, []);

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

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

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
          <div className="issue-loading">
            <div className="loading-spinner">
              <svg className="spinning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9H4m0 11v-5h.582m0 0a8.001 8.001 0 0 0 15.356-2H20m0 0v5" />
              </svg>
            </div>
            <p>กำลังดำเนินการ...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <p className="issue-message">ไม่พบปัญหาที่ค้นหา</p>
        ) : (
          <>
            <section className="issue-grid" aria-label="Issue list">
              {filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((issue) => (
                <IssueCard key={issue.id} issue={issue} onDelete={handleDeleteIssue} />
              ))}
            </section>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredIssues.length}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </>
        )}
      </section>
    </main>
  );
}

export function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchIssueDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/issues/${id}`);
      const issueData = res.data;
      setIssue(issueData);
      setVoteCount(getIssueVoteCount(issueData));
      setHasVoted(!!issueData.voted);
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

  async function handleDelete() {
    if (!window.confirm(`ยืนยันการลบ "${issue?.title || 'issue นี้'}"?`)) return;
    try {
      setDeleting(true);
      await api.delete(`/issues/${id}`);
      navigate('/issues');
    } catch (err) {
      window.alert(err.response?.data?.error || 'ลบไม่สำเร็จ');
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="issue-message">กำลังโหลด...</p>;
  }

  if (!issue) {
    return <p className="issue-message">ไม่พบปัญหานี้</p>;
  }

  const statusLabel = getStatusLabel(issue.status);
  const imageUrl = issue.image_url || null;
  const isOwner = user && String(user.id) === String(issue.user_id);
  const canDelete = isAdmin || isOwner;

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
            <div className="issue-detail-header-actions">
              <VoteButton
                issueId={id}
                voteCount={voteCount}
                voted={hasVoted}
                onChange={({ voted, voteCount: nextCount }) => {
                  setHasVoted(voted);
                  setVoteCount(nextCount);
                }}
              />
              {canDelete && (
                <button
                  type="button"
                  className="issue-delete-btn"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'กำลังลบ...' : 'ลบ issue'}
                </button>
              )}
            </div>
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

        <CommentList issueId={id} />
      </section>
    </main>
  );
}

export default IssueListPage;
