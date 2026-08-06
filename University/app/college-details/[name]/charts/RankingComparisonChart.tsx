'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface RankingData {
  year: number;
  rank: number;
  category?: string;
}

interface Props {
  data: RankingData[];
  animate: boolean;
  title?: string;
}

export default function RankingComparisonChart({ data, animate, title = 'NIRF Engineering Rankings' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (animate) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  useEffect(() => {
    if (!canvasRef.current || !shouldRender || data.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const sorted = [...data].sort((a, b) => a.year - b.year);
    const labels = sorted.map((d) => `${d.year}`);
    const ranks = sorted.map((d) => d.rank);

    // Map ranks so smaller numbers (better) represent taller bars growing upwards
    const maxRank = Math.max(...ranks);
    const maxVal = Math.max(25, maxRank + 5);
    const plottedRanks = ranks.map((r) => maxVal - r);

    const ctx = canvasRef.current.getContext('2d')!;

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Rank',
            data: plottedRanks,
            backgroundColor: [
              'rgba(154, 49, 151, 0.8)', // Theme primary purple
              'rgba(154, 49, 151, 0.6)',
              'rgba(154, 49, 151, 0.4)',
            ],
            borderColor: 'rgba(154, 49, 151, 1)',
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'x',
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: { size: 12, weight: 600 },
              color: '#475569',
              padding: 12,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const plottedVal = ctx.parsed.y ?? 0;
                const actualRank = maxVal - plottedVal;
                return `Rank: ${actualRank}`;
              },
            },
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 10,
            cornerRadius: 6,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            reverse: false, // Grow bars upwards naturally
            min: 0,
            max: maxVal,
            ticks: {
              color: '#64748b',
              font: { size: 11 },
              callback: function (value) {
                const actualRank = maxVal - (value as number);
                return actualRank > 0 ? actualRank : '';
              },
            },
            grid: {
              color: 'rgba(203, 213, 225, 0.2)',
            },
            title: {
              display: true,
              text: 'Rank (Lower is Better)',
              color: '#475569',
              font: { size: 12, weight: 600 },
            },
          },
          x: {
            ticks: {
              color: '#64748b',
              font: { size: 11 },
            },
            grid: {
              color: 'transparent',
            },
            title: {
              display: true,
              text: 'Year',
              color: '#475569',
              font: { size: 12, weight: 600 },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, shouldRender]);

  return <canvas ref={canvasRef} />;
}
