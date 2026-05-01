import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import './CommentList.css';

/**
 * CommentList — แสดงรายการ comment + form เพิ่ม comment
 * Props:
 *   issueId {number} — ID ของ issue
 */
export default function CommentList({ issueId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data } = await api.get(`/comments/${issueId}`);
        setComments(data.comments);
      } catch (err) {
        setError('ไม่สามารถโหลดความคิดเห็นได้');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [issueId]);

  const handleAdded = (newComment) => {
    setComments((prev) => [...prev, newComment]);
  };

  const handleDeleted = (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <section className="comment-list">
      <h3 className="comment-list__title">
        ความคิดเห็น ({comments.length})
      </h3>

      <CommentForm issueId={issueId} onAdded={handleAdded} />

      <div className="comment-list__items">
        {loading && <p className="comment-list__status">กำลังโหลด...</p>}
        {error && <p className="comment-list__status comment-list__status--error">{error}</p>}
        {!loading && !error && comments.length === 0 && (
          <p className="comment-list__status">ยังไม่มีความคิดเห็น</p>
        )}
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDeleted={handleDeleted}
          />
        ))}
      </div>
    </section>
  );
}
