'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { PlacementComp, convertToINR } from '../types';

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Props {
  data: PlacementComp[];
  animate: boolean;
  country?: string;
}

export default function PlacementBarChart({ data, animate, country }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (animate) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  useEffect(() => {
    if (!canvasRef.current || !shouldRender || data.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const sorted = [...data].sort((a, b) => String(a.year).localeCompare(String(b.year)));
    const labels = sorted.map((d) => String(d.year));

    const pkgValues = sorted.map((d) => {
      const cur = d.package_currency || 'INR';
      const inrVal = convertToINR(Number(d.average_package), cur, country || '');
      return +(inrVal / 100000).toFixed(2) || 0;
    });
    const rateValues = sorted.map((d) => Number(d.employment_rate_percent) || 0);

    const ctx = canvasRef.current.getContext('2d')!;

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Avg Package (LPA INR)',
            data: pkgValues,
            backgroundColor: '#070642',
            borderRadius: 8,
            borderSkipped: false,
            yAxisID: 'y',
          },
          {
            type: 'line' as any,
            label: 'Employment Rate %',
            data: rateValues,
            borderColor: '#9a3197',
            backgroundColor: 'rgba(154,49,151,0.12)',
            borderWidth: 2.5,
            pointRadius: 6,
            pointBackgroundColor: '#9a3197',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, pointStyle: 'circle', font: { family: 'Plus Jakarta Sans', size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: function (context: any) {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                if (label.includes('Rate') || label.includes('%')) {
                  return `${label}: ${value}%`;
                }
                return `${label}: ₹${value.toFixed(2)} LPA`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
          y: {
            beginAtZero: true,
            position: 'left',
            grid: { color: 'rgba(0,0,0,0.05)' },
            title: { display: true, text: 'Package (LPA INR)', font: { family: 'Plus Jakarta Sans', size: 11 } },
          },
          y1: {
            beginAtZero: true,
            max: 100,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Rate %', font: { family: 'Plus Jakarta Sans', size: 11 } },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [data, shouldRender]);

  return (
    <div style={{ position: 'relative', height: 300 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
