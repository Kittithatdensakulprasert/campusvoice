import React from 'react';

export default function StatsCard({ label, value, tone = 'blue' }) {
  return (
    <article className={`stats-card stats-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
