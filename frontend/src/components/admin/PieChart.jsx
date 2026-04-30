import React from 'react';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Legend, Tooltip);

const COLORS = ['#2f80ed', '#22b573', '#f97316', '#0ea5e9', '#f59e0b', '#64748b'];

export default function PieChart({ data }) {
  const chartData = {
    labels: data.map((item) => item.category),
    datasets: [
      {
        data: data.map((item) => Number(item.count)),
        backgroundColor: COLORS,
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="chart-panel">
      <div className="chart-panel__header">
        <h2>Issues by Category</h2>
      </div>
      <div className="chart-panel__body">
        {data.length ? <Pie data={chartData} /> : <p className="empty-state">No category data yet.</p>}
      </div>
    </div>
  );
}
