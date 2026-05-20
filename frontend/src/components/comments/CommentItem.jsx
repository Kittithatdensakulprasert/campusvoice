import React, { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './CommentItem.css';

/**
 * CommentItem — แสดง comment แต่ละอัน
 * Props:
 *   comment   {object}    — { id, body, user_id, user_name, created_at }
 *   onDeleted {function}  — callback เมื่อลบสำเร็จ รับ commentId
 *   onUpdated {function}  — callback เมื่อแก้ไขสำเร็จ รับ comment object
 */
export default function CommentItem({ comment, onDeleted, onUpdated }) {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body || '');

  const canManage = user && (user.id === comment.user_id || isAdmin);

  const handleDelete = async () => {
    if (!window.confirm('ลบความคิดเห็นนี้?')) return;
    setLoading(true);
    try {
      await api.delete(`/comments/${comment.id}`);
      if (onDeleted) onDeleted(comment.id);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const body = editBody.trim();
    if (!body) return alert('กรุณากรอกความคิดเห็น');
    setLoading(true);
    try {
      const { data } = await api.patch(`/comments/${comment.id}`, { body });
      if (onUpdated) onUpdated(data.comment);
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'แก้ไขไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="comment-item">
      <div className="comment-item__header">
        <span className="comment-item__author">{comment.user_name}</span>
        <span className="comment-item__date">{formatDate(comment.created_at)}</span>
      </div>
      {editing ? (
        <>
          <textarea
            className="comment-item__edit-input"
            value={editBody}
            maxLength={1000}
            onChange={(event) => setEditBody(event.target.value)}
          />
          <div className="comment-item__actions">
            <button className="comment-item__action" onClick={handleUpdate} disabled={loading}>
              {loading ? '...' : 'บันทึก'}
            </button>
            <button
              className="comment-item__action"
              onClick={() => {
                setEditing(false);
                setEditBody(comment.body || '');
              }}
              disabled={loading}
            >
              ยกเลิก
            </button>
          </div>
        </>
      ) : (
        <p className="comment-item__body">{comment.body}</p>
      )}
      {canManage && !editing && (
        <div className="comment-item__actions">
          <button className="comment-item__action" onClick={() => setEditing(true)} disabled={loading}>
            แก้ไข
          </button>
          <button className="comment-item__action comment-item__action--danger" onClick={handleDelete} disabled={loading}>
            {loading ? '...' : 'ลบ'}
          </button>
        </div>
      )}
    </div>
  );
}
