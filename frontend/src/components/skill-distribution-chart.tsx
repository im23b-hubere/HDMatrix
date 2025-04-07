"use client"

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
};

// Standarddaten als Fallback
const defaultData = {
  labels: ['JavaScript', 'Python', 'Java', 'React', 'SQL', 'TypeScript', 'Node.js'],
  datasets: [
    {
      data: [65, 59, 55, 51, 48, 45, 40],
      backgroundColor: 'rgba(37, 99, 235, 0.8)',
      borderColor: 'rgba(37, 99, 235, 1)',
      borderWidth: 1,
      borderRadius: 4,
      maxBarThickness: 35,
    },
  ],
};

interface SkillDistributionChartProps {
  data?: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
      borderRadius: number;
      maxBarThickness: number;
    }[];
  };
}

export function SkillDistributionChart({ data = defaultData }: SkillDistributionChartProps) {
  return (
    <div className="w-full h-full">
      <Bar options={options} data={data} />
    </div>
  );
}
