import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import BarChart from './BarChart';
import PieChart from './PieChart';
import SearchBar from './SearchBar';
import StatsCard from './StatsCard';
import './dashboard.css';

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed'
};

const SEARCH_LIMIT = 50;

function getStatusCount(items, status) {
  return items.find((item) => item.status === status)?.count || 0;
}

function getStatsErrorMessage(error) {
  const status = error.response?.status;

  if (status === 401) {
    return 'Please log in as admin or staff to view dashboard stats.';
  }

  if (status === 403) {
    return 'Only admin or staff can view dashboard stats.';
  }

  return 'Unable to load dashboard stats.';
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalIssues: 0, byCategory: [], byStatus: [] });
  const [issues, setIssues] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        setLoadingStats(true);
        const response = await api.get('/admin/stats');
        if (active) {
          setStats(response.data);
        }
      } catch (requestError) {
        if (active) {
          setError(getStatsErrorMessage(requestError));
        }
      } finally {
        if (active) {
          setLoadingStats(false);
        }
      }
    }

    loadStats();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const debounceId = window.setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const response = await api.get('/issues/search', {
          params: { q: query, category, status, limit: SEARCH_LIMIT, offset: 0 },
          signal: controller.signal
        });
        if (active) {
          setIssues(response.data.issues || []);
        }
      } catch (requestError) {
        if (active && requestError.name !== 'CanceledError') {
          setError('Unable to search issues.');
        }
      } finally {
        if (active) {
          setLoadingSearch(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(debounceId);
      controller.abort();
    };
  }, [query, category, status]);

  const statCards = useMemo(
    () => [
      { label: 'Total issues', value: stats.totalIssues, tone: 'blue' },
      { label: 'Open', value: getStatusCount(stats.byStatus, 'open'), tone: 'orange' },
      { label: 'In progress', value: getStatusCount(stats.byStatus, 'in_progress'), tone: 'green' },
      { label: 'Resolved', value: getStatusCount(stats.byStatus, 'resolved'), tone: 'sky' }
    ],
    [stats]
  );

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-kicker">CampusVoice</p>
          <h1>Search & Dashboard</h1>
        </div>
      </header>

      {error && <div className="dashboard-alert">{error}</div>}

      <section className="stats-grid" aria-label="Issue statistics">
        {statCards.map((card) => (
          <StatsCard key={card.label} label={card.label} value={loadingStats ? '-' : card.value} tone={card.tone} />
        ))}
      </section>

      <section className="dashboard-charts" aria-label="Dashboard charts">
        <PieChart data={stats.byCategory || []} />
        <BarChart data={stats.byStatus || []} />
      </section>

      <section className="search-panel" aria-label="Search issues">
        <div className="search-panel__header">
          <h2>Search Issues</h2>
          <span>{loadingSearch ? 'Loading...' : `${issues.length} results`}</span>
        </div>

        <SearchBar
          query={query}
          category={category}
          status={status}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
        />

        <div className="issue-results">
          {issues.length ? (
            issues.map((issue) => (
              <article className="issue-result" key={issue.id}>
                <div>
                  <h3>{issue.title}</h3>
                  <p>{issue.description}</p>
                </div>
                <dl>
                  <div>
                    <dt>Category</dt>
                    <dd>{issue.category || 'Uncategorized'}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{STATUS_LABELS[issue.status] || issue.status}</dd>
                  </div>
                  <div>
                    <dt>Votes</dt>
                    <dd>{issue.vote_count || 0}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="empty-state">{loadingSearch ? 'Searching issues...' : 'No issues found.'}</p>
          )}
        </div>
      </section>
    </main>
  );
}
