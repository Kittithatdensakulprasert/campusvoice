import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import IssueTable from './IssueTable';

export default function AdminPage() {
  const { loading, isStaff } = useAuth();
  const [issues, setIssues] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const fetchIssues = async () => {
    try {
      setFetching(true);
      setError('');
      const { data } = await api.get('/issues');
      const list = Array.isArray(data) ? data : data.issues || [];
      setIssues(
        list.map((item) => ({
          ...item,
          status: toUiStatus(item.status)
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'โหลดรายการปัญหาไม่สำเร็จ');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleChangeStatus = async (id, nextStatus) => {
    try {
      setUpdatingId(id);
      await api.patch(`/issues/${id}/status`, { status: nextStatus });
      setIssues((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      window.alert(err.response?.data?.message || 'เปลี่ยนสถานะไม่สำเร็จ');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>กำลังตรวจสอบผู้ใช้...</div>;
  if (!isStaff) return <div style={{ padding: '2rem' }}>หน้านี้สำหรับ staff/admin เท่านั้น</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Admin Panel</h1>
      <button onClick={fetchIssues} style={{ marginBottom: '1rem' }}>
        รีโหลดข้อมูล
      </button>
      {fetching ? <p>กำลังโหลด...</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!fetching && !error ? (
        <IssueTable
          issues={issues}
          updatingId={updatingId}
          onChangeStatus={handleChangeStatus}
        />
      ) : null}
    </div>
  );
}

function toUiStatus(status) {
  if (status === 'open') return 'pending';
  if (status === 'resolved' || status === 'closed') return 'done';
  return status || 'pending';
}
