import React from 'react';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'Wi-Fi', label: 'Wi-Fi' },
  { value: 'Facility', label: 'Facility' },
  { value: 'Classroom', label: 'Classroom' },
  { value: 'Food', label: 'Food' },
  { value: 'Safety', label: 'Safety' },
  { value: 'Other', label: 'Other' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

export default function SearchBar({ query, category, status, onQueryChange, onCategoryChange, onStatusChange }) {
  return (
    <div className="dashboard-search" aria-label="Issue search filters">
      <label className="dashboard-search__field">
        <span>Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by title, detail, location..."
        />
      </label>

      <label className="dashboard-search__field dashboard-search__select">
        <span>Category</span>
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value || 'all-categories'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="dashboard-search__field dashboard-search__select">
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || 'all-statuses'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
