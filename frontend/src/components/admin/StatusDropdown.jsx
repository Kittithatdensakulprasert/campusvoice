import React from 'react';

const OPTIONS = [
  { value: 'open', label: 'เปิดเรื่อง' },
  { value: 'in_progress', label: 'กำลังแก้ไข' },
  { value: 'resolved', label: 'แก้ไขแล้ว' },
  { value: 'closed', label: 'ปิดงาน' }
];

export default function StatusDropdown({ value, onChange, disabled }) {
  const handleChange = (e) => {
    const nextStatus = e.target.value;
    if (nextStatus === value) return;

    const ok = window.confirm('ยืนยันการเปลี่ยนสถานะใช่ไหม?');
    if (!ok) {
      e.target.value = value;
      return;
    }

    onChange(nextStatus);
  };

  return (
    <select value={value} onChange={handleChange} disabled={disabled}>
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
