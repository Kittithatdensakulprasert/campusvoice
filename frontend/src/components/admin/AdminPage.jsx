import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import SideNav from '../common/SideNav';
import IssueTable from './IssueTable';
import './AdminPage.css';

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' }
];

const ROLE_LABELS = ROLE_OPTIONS.reduce((labels, role) => {
  labels[role.value] = role.label;
  return labels;
}, {});

function getUsersErrorMessage(err) {
  if (err.response?.status === 403) {
    return 'เฉพาะ admin เท่านั้นที่ดูและเปลี่ยน role ผู้ใช้ได้';
  }

  return err.response?.data?.message || 'โหลดรายชื่อผู้ใช้ไม่สำเร็จ';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function UserManagementTable({ users, currentUserId, updatingUserId, onRoleChange }) {
  if (!users.length) {
    return <p className="admin-empty-state">ยังไม่มีข้อมูลผู้ใช้</p>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ชื่อ</th>
            <th>อีเมล</th>
            <th>Role</th>
            <th>วันที่สมัคร</th>
            <th>เปลี่ยน role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((item) => {
            const isCurrentUser = item.id === currentUserId;
            const isUpdating = updatingUserId === item.id;

            return (
              <tr key={item.id}>
                <td>
                  <div className="admin-user-cell">
                    <span className="admin-user-avatar" aria-hidden="true">
                      {(item.name || item.email || '?').charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <strong>{item.name || '-'}</strong>
                      <span>ID: {item.id}</span>
                    </div>
                  </div>
                </td>
                <td>{item.email || '-'}</td>
                <td>
                  <span className={`admin-role-badge admin-role-badge--${item.role || 'user'}`}>
                    {ROLE_LABELS[item.role] || item.role || 'User'}
                  </span>
                </td>
                <td>{formatDate(item.created_at || item.createdAt)}</td>
                <td>
                  <select
                    className="admin-role-select"
                    value={item.role || 'user'}
                    disabled={isUpdating || isCurrentUser}
                    title={isCurrentUser ? 'ไม่ควรเปลี่ยน role ของบัญชีตัวเองจากหน้านี้' : 'เปลี่ยน role ผู้ใช้'}
                    onChange={(event) => onRoleChange(item, event.target.value)}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const { loading, user, isAdmin, isStaff } = useAuth();
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeView, setActiveView] = useState('issues');
  const [fetching, setFetching] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState('');
  const [usersError, setUsersError] = useState('');

  const fetchIssues = async () => {
    try {
      setFetching(true);
      setError('');
      const { data } = await api.get('/issues');
      const list = Array.isArray(data) ? data : data.issues || [];
      setIssues(list);
    } catch (err) {
      setError(err.response?.data?.message || 'โหลดรายการปัญหาไม่สำเร็จ');
    } finally {
      setFetching(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true);
      setUsersError('');
      const { data } = await api.get('/admin/users');
      const list = Array.isArray(data) ? data : data.users || [];
      setUsers(list);
    } catch (err) {
      setUsersError(getUsersErrorMessage(err));
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (loading || !user || !isStaff) return;
    fetchIssues();
  }, [loading, user, isStaff]);

  useEffect(() => {
    if (loading || !user || !isAdmin) return;
    fetchUsers();
  }, [loading, user, isAdmin]);

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

  const handleDeleteIssue = async (id) => {
    const target = issues.find((item) => item.id === id);
    const ok = window.confirm(`ยืนยันการลบ "${target?.title || 'issue นี้'}"?`);
    if (!ok) return;
    try {
      setUpdatingId(id);
      await api.delete(`/issues/${id}`);
      setIssues((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      window.alert(err.response?.data?.error || 'ลบ issue ไม่สำเร็จ');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleChangeRole = async (targetUser, nextRole) => {
    const currentRole = targetUser.role || 'user';
    if (currentRole === nextRole) return;

    const ok = window.confirm(`ยืนยันการเปลี่ยน ${targetUser.email} เป็น ${ROLE_LABELS[nextRole]} ใช่ไหม?`);
    if (!ok) return;

    try {
      setUpdatingUserId(targetUser.id);
      await api.patch(`/admin/users/${targetUser.id}/role`, { role: nextRole });
      setUsers((prev) =>
        prev.map((item) => (item.id === targetUser.id ? { ...item, role: nextRole } : item))
      );
    } catch (err) {
      // revert select กลับ role เดิม
      setUsers((prev) =>
        prev.map((item) => (item.id === targetUser.id ? { ...item, role: currentRole } : item))
      );
      window.alert(err.response?.data?.error || err.response?.data?.message || 'เปลี่ยน role ไม่สำเร็จ');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const userStats = useMemo(() => {
    return ROLE_OPTIONS.map((role) => ({
      ...role,
      count: users.filter((item) => item.role === role.value).length
    }));
  }, [users]);

  if (loading) return <div style={{ padding: '2rem' }}>กำลังตรวจสอบผู้ใช้...</div>;
  if (!user || !isStaff) return <div style={{ padding: '2rem' }}>หน้านี้สำหรับ staff/admin เท่านั้น</div>;

  return (
    <main className="issue-layout">
      <SideNav />
      <section className="issue-content admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">CampusVoice</p>
          <h1>Admin Panel</h1>
        </div>
        <div className="admin-header-meta">
          <span>{user.name || user.email}</span>
          <strong>{ROLE_LABELS[user.role] || user.role}</strong>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        <button
          className={activeView === 'issues' ? 'admin-tab admin-tab--active' : 'admin-tab'}
          type="button"
          onClick={() => setActiveView('issues')}
        >
          Issues
        </button>
        <button
          className={activeView === 'users' ? 'admin-tab admin-tab--active' : 'admin-tab'}
          type="button"
          disabled={!isAdmin}
          title={isAdmin ? 'จัดการผู้ใช้' : 'เฉพาะ admin เท่านั้น'}
          onClick={() => setActiveView('users')}
        >
          Users
        </button>
      </nav>

      {activeView === 'issues' ? (
        <section className="admin-panel" aria-label="Issue management">
          <div className="admin-panel__header">
            <div>
              <h2>Issue Management</h2>
              <p>ดูรายการปัญหาและเปลี่ยนสถานะงาน</p>
            </div>
            <button className="admin-action-button" type="button" onClick={fetchIssues} disabled={fetching}>
              {fetching ? 'กำลังโหลด...' : 'รีโหลดข้อมูล'}
            </button>
          </div>
          {error ? <div className="admin-alert">{error}</div> : null}
          {!error ? (
            <IssueTable
              issues={issues}
              updatingId={updatingId}
              onChangeStatus={handleChangeStatus}
              onDeleteIssue={handleDeleteIssue}
            />
          ) : null}
        </section>
      ) : (
        <section className="admin-panel" aria-label="User management">
          <div className="admin-panel__header">
            <div>
              <h2>User Management</h2>
              <p>ดูรายชื่อผู้ใช้และเปลี่ยน role ระหว่าง user, staff, admin</p>
            </div>
            <button className="admin-action-button" type="button" onClick={fetchUsers} disabled={fetchingUsers}>
              {fetchingUsers ? 'กำลังโหลด...' : 'รีโหลด users'}
            </button>
          </div>

          <div className="admin-user-stats" aria-label="User role summary">
            {userStats.map((role) => (
              <div className="admin-user-stat" key={role.value}>
                <span>{role.label}</span>
                <strong>{fetchingUsers ? '-' : role.count}</strong>
              </div>
            ))}
          </div>

          {usersError ? <div className="admin-alert">{usersError}</div> : null}
          {!usersError ? (
            <UserManagementTable
              users={users}
              currentUserId={user.id}
              updatingUserId={updatingUserId}
              onRoleChange={handleChangeRole}
            />
          ) : null}
        </section>
      )}
      </section>
    </main>
  );
}
