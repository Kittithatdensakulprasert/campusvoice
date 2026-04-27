import React, { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './CommentItem.css';

/**
 * CommentItem — แสดง comment แต่ละอัน
 * Props:
 *   comment   {object}    — { id, body, user_id, user_name, created_at }
 *   onDeleted {function}  — callback เมื่อลบสำเร็จ รับ commentId
 */
export default function CommentItem({ comment, onDeleted }) {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  const canDelete = user && (user.id === comment.user_id || isAdmin);

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
      <p className="comment-item__body">{comment.body}</p>
      {canDelete && (
        <button
          className="comment-item__delete"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? '...' : 'ลบ'}
        </button>
      )}
    </div>
  );
}
