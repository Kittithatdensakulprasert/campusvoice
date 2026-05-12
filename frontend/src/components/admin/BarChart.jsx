import React from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const STATUS_LABELS = {
  open: 'รอดำเนินการ',
  in_progress: 'กำลังดำเนินการ',
  resolved: 'แก้ไขแล้ว',
  closed: 'เสร็จสิ้น'
};

export default function BarChart({ data }) {
  const chartData = {
    labels: data.map((item) => STATUS_LABELS[item.status] || item.status),
    datasets: [
      {
        label: 'จำนวนปัญหา',
        data: data.map((item) => Number(item.count)),
        backgroundColor: '#22b573',
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div className="chart-panel">
      <div className="chart-panel__header">
        <h2>ปัญหาตามสถานะ</h2>
      </div>
      <div className="chart-panel__body chart-panel__body--bar">
        {data.length ? <Bar data={chartData} options={options} /> : <p className="empty-state">ยังไม่มีข้อมูลสถานะ</p>}
      </div>
    </div>
  );
}
