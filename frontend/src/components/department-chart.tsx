"use client"

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
  labels: ['IT', 'Marketing', 'Sales', 'HR', 'Finance'],
  datasets: [
    {
      data: [35, 25, 20, 15, 5],
      backgroundColor: [
        'rgba(37, 99, 235, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(96, 165, 250, 0.8)',
        'rgba(147, 197, 253, 0.8)',
        'rgba(191, 219, 254, 0.8)',
      ],
      borderColor: [
        'rgba(37, 99, 235, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(96, 165, 250, 1)',
        'rgba(147, 197, 253, 1)',
        'rgba(191, 219, 254, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
      },
    },
  },
};

export function DepartmentChart() {
  return (
    <div className="w-full h-full">
      <Doughnut data={data} options={options} />
    </div>
  );
}
