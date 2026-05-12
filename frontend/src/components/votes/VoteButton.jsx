import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './VoteButton.css';

/**
 * VoteButton — ปุ่มโหวต issue
 * Props:
 *   issueId   {number}  — ID ของ issue
 *   voteCount {number}  — จำนวน vote เริ่มต้น
 *   voted     {boolean} — user นี้โหวตแล้วหรือยัง
 *   onChange  {function} — callback เมื่อสถานะโหวตเปลี่ยน ({ voted, voteCount })
 */
export default function VoteButton({ issueId, voteCount = 0, voted = false, onChange }) {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(voteCount);
  const [hasVoted, setHasVoted] = useState(voted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCount(voteCount);
  }, [voteCount]);

  useEffect(() => {
    setHasVoted(voted);
  }, [voted]);

  const handleVote = async () => {
    if (!isAuthenticated) {
      alert('กรุณาเข้าสู่ระบบก่อนโหวต');
      return;
    }

    if (loading) return;

    const prevCount = count;
    const prevVoted = hasVoted;
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(`/votes/${issueId}`);
      setCount(data.voteCount);
      setHasVoted(data.voted);
      if (onChange) onChange({ voted: data.voted, voteCount: data.voteCount });
    } catch (err) {
      setCount(prevCount);
      setHasVoted(prevVoted);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      console.error('Vote error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className={`vote-btn${hasVoted ? ' vote-btn--active' : ''}`}
        onClick={handleVote}
        disabled={loading}
        title={hasVoted ? 'ยกเลิกโหวต' : 'โหวต'}
      >
        <span className="vote-btn__icon">▲</span>
        <span className="vote-btn__count">{count}</span>
      </button>
      {error && <p style={{ fontSize: '0.75rem', color: 'var(--color-error)', margin: '0.25rem 0 0' }}>{error}</p>}
    </div>
  );
}
