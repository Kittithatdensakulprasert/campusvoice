import React from 'react';

const OPTIONS = [
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'in_progress', label: 'กำลังแก้ไข' },
  { value: 'done', label: 'เสร็จสิ้น' }
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
