import React from 'react';
import { motion } from 'framer-motion';

interface InBodyRecord {
  date: string;
  weight: number;
  skeletalMuscleMass: number;
  bodyFatPercentage: number;
}

interface InBodyChartProps {
  data: InBodyRecord[];
}

const InBodyChart: React.FC<InBodyChartProps> = ({ data }) => {
  if (data.length < 2) {
    return (
      <div className="chart-empty">
        데이터가 2개 이상 쌓이면 그래프가 나타납니다.
      </div>
    );
  }

  // Sort by date ascending
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  
  const width = 300;
  const height = 120;
  const padding = 20;

  const getPoints = (key: keyof Pick<InBodyRecord, 'weight' | 'skeletalMuscleMass' | 'bodyFatPercentage'>) => {
    const values = sortedData.map(d => d[key] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return sortedData.map((d, i) => ({
      x: padding + (i * (width - padding * 2)) / (sortedData.length - 1),
      y: height - padding - (( (d[key] as number) - min) * (height - padding * 2)) / range
    }));
  };

  const weightPoints = getPoints('weight');
  const musclePoints = getPoints('skeletalMuscleMass');
  const fatPoints = getPoints('bodyFatPercentage');

  const createPath = (points: { x: number, y: number }[]) => {
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  };

  return (
    <div className="inbody-chart-container">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid Lines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        
        {/* Weight Path (White) */}
        <motion.path
          d={createPath(weightPoints)}
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />

        {/* Muscle Path (Green) */}
        <motion.path
          d={createPath(musclePoints)}
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />

        {/* Fat Path (Red/Muted) */}
        <motion.path
          d={createPath(fatPoints)}
          fill="none"
          stroke="#ff4444"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />

        {/* Points */}
        {musclePoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent-color)" />
        ))}
      </svg>
      
      <div className="chart-legend">
        <div className="legend-item"><span className="dot weight"></span> 체중</div>
        <div className="legend-item"><span className="dot muscle"></span> 골격근</div>
        <div className="legend-item"><span className="dot fat"></span> 체지방</div>
      </div>

      <style>{`
        .inbody-chart-container {
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 12px;
          margin-bottom: 16px;
          border: 1px solid var(--border-color);
        }
        .chart-empty {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: var(--muted-color);
          background: var(--card-bg);
          border-radius: 16px;
          margin-bottom: 16px;
          border: 1px dashed var(--border-color);
        }
        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 8px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          color: var(--muted-color);
        }
        .dot { width: 6px; height: 6px; border-radius: 50%; }
        .dot.weight { background: #fff; }
        .dot.muscle { background: var(--accent-color); }
        .dot.fat { background: #ff4444; }
      `}</style>
    </div>
  );
};

export default InBodyChart;
