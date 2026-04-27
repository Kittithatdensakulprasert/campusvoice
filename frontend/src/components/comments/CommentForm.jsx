import React, { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './CommentForm.css';

/**
 * CommentForm — form เพิ่ม comment
 * Props:
 *   issueId   {number}    — ID ของ issue
 *   onAdded   {function}  — callback เมื่อเพิ่ม comment สำเร็จ รับ comment object
 */
export default function CommentForm({ issueId, onAdded }) {
  const { isAuthenticated } = useAuth();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <p className="comment-form__login-hint">
        กรุณา <a href="/login">เข้าสู่ระบบ</a> ก่อนแสดงความคิดเห็น
      </p>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(`/comments/${issueId}`, { body });
      setBody('');
      if (onAdded) onAdded(data.comment);
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        className="comment-form__input"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="แสดงความคิดเห็น..."
        rows={3}
        maxLength={1000}
        disabled={loading}
      />
      {error && <p className="comment-form__error">{error}</p>}
      <div className="comment-form__footer">
        <span className="comment-form__count">{body.length}/1000</span>
        <button
          type="submit"
          className="comment-form__submit"
          disabled={loading || !body.trim()}
        >
          {loading ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
        </button>
      </div>
    </form>
  );
}
