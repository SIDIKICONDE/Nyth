import { DayActivity } from '../types/analytics';

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export const createLinePath = (data: DayActivity[], chartWidth: number, chartHeight: number, maxActivity: number): string => {
  if (data.length === 0) {
    return '';
  }
  
  if (data.length === 1) {
    const x = 40;
    const y = chartHeight - 40 - (data[0].total / maxActivity) * (chartHeight - 60);
    return `M ${x} ${y}`;
  }
  
  const points = data.map((d, i) => {
    const x = 40 + (i * (chartWidth - 92) / (data.length - 1));
    const y = chartHeight - 40 - (d.total / maxActivity) * (chartHeight - 60);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return points;
}; 