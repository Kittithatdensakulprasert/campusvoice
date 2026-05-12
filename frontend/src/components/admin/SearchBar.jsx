import React from 'react';

const CATEGORY_OPTIONS = [
  { value: '', label: 'หมวดหมู่ทั้งหมด' },
  { value: 'ห้องเรียน', label: 'ห้องเรียน' },
  { value: 'ห้องน้ำ', label: 'ห้องน้ำ' },
  { value: 'อาหาร', label: 'อาหาร' },
  { value: 'Wi-Fi', label: 'Wi-Fi' },
  { value: 'ความปลอดภัย', label: 'ความปลอดภัย' },
  { value: 'อื่นๆ', label: 'อื่นๆ' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'สถานะทั้งหมด' },
  { value: 'open', label: 'รอดำเนินการ' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'resolved', label: 'แก้ไขแล้ว' },
  { value: 'closed', label: 'เสร็จสิ้น' }
];

export default function SearchBar({ query, category, status, onQueryChange, onCategoryChange, onStatusChange }) {
  return (
    <div className="dashboard-search" aria-label="Issue search filters">
      <label className="dashboard-search__field">
        <span>ค้นหา</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="ค้นหาตามหัวข้อ รายละเอียด สถานที่..."
        />
      </label>

      <label className="dashboard-search__field dashboard-search__select">
        <span>หมวดหมู่</span>
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value || 'all-categories'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="dashboard-search__field dashboard-search__select">
        <span>สถานะ</span>
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
