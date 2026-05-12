import React from 'react';
import StatusDropdown from './StatusDropdown';

export default function IssueTable({ issues, updatingId, onChangeStatus, onDeleteIssue }) {
  if (!issues.length) {
    return <p>ยังไม่มีข้อมูลปัญหา</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>หัวข้อ</th>
            <th style={th}>สถานที่</th>
            <th style={th}>หมวดหมู่</th>
            <th style={th}>โหวต</th>
            <th style={th}>สถานะ</th>
            <th style={th}>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td style={td}>{issue.id}</td>
              <td style={td}>{issue.title || '-'}</td>
              <td style={td}>{issue.location || '-'}</td>
              <td style={td}>{issue.category || '-'}</td>
              <td style={td}>{issue.vote_count ?? issue.votes ?? 0}</td>
              <td style={td}>
                <StatusDropdown
                  value={issue.status || 'open'}
                  disabled={updatingId === issue.id}
                  onChange={(nextStatus) => onChangeStatus(issue.id, nextStatus)}
                />
              </td>
              <td style={td}>
                <button
                  type="button"
                  style={deleteBtn}
                  disabled={updatingId === issue.id}
                  onClick={() => onDeleteIssue(issue.id)}
                >
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  textAlign: 'left',
  borderBottom: '1px solid #ddd',
  padding: '10px 12px'
};

const td = {
  borderBottom: '1px solid #f0f0f0',
  padding: '10px 12px',
  verticalAlign: 'middle'
};

const deleteBtn = {
  padding: '4px 12px',
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
};
