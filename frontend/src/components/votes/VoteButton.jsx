import React, { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './VoteButton.css';

/**
 * VoteButton — ปุ่มโหวต issue
 * Props:
 *   issueId   {number}  — ID ของ issue
 *   voteCount {number}  — จำนวน vote เริ่มต้น
 *   voted     {boolean} — user นี้โหวตแล้วหรือยัง
 */
export default function VoteButton({ issueId, voteCount = 0, voted = false }) {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(voteCount);
  const [hasVoted, setHasVoted] = useState(voted);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (!isAuthenticated) {
      alert('กรุณาเข้าสู่ระบบก่อนโหวต');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (hasVoted) {
        const { data } = await api.delete(`/votes/${issueId}`);
        setCount(data.voteCount);
        setHasVoted(false);
      } else {
        const { data } = await api.post(`/votes/${issueId}`);
        setCount(data.voteCount);
        setHasVoted(true);
      }
    } catch (err) {
      console.error('Vote error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`vote-btn${hasVoted ? ' vote-btn--active' : ''}`}
      onClick={handleVote}
      disabled={loading}
      title={hasVoted ? 'ยกเลิกโหวต' : 'โหวต'}
    >
      <span className="vote-btn__icon">▲</span>
      <span className="vote-btn__count">{count}</span>
    </button>
  );
}
