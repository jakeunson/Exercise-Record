import React, { useMemo } from 'react';
import { CATEGORIES, DEFAULT_EXERCISES } from '../types';
import type { WorkoutSession } from '../types';

interface StatsCardProps {
  sessions: WorkoutSession[];
  filterMonth: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ sessions, filterMonth }) => {
  const stats = useMemo(() => {
    const thisMonthSessions = sessions.filter(s => s.date.startsWith(filterMonth));

    // 운동 일수 (unique dates)
    const uniqueDates = new Set(thisMonthSessions.map(s => s.date));
    const workoutDays = uniqueDates.size;

    let totalVolume = 0;
    let totalCardioTime = 0;
    thisMonthSessions.forEach(s => {
      const ex = DEFAULT_EXERCISES.find(e => e.id === s.exerciseId);
      const isCardio = ex?.category === 'cardio';

      s.sets.forEach(set => {
        if (isCardio) {
          totalCardioTime += (set.time || 0);
        } else if (set.subSets) {
          set.subSets.forEach(ss => {
            totalVolume += ss.weight * ss.reps;
          });
        }
      });
    });

    // 부위별 세션 수
    const catCount: Record<string, number> = {};
    CATEGORIES.forEach(c => { catCount[c.id] = 0; });
    thisMonthSessions.forEach(s => {
      const ex = DEFAULT_EXERCISES.find(e => e.id === s.exerciseId);
      if (ex) catCount[ex.category] = (catCount[ex.category] || 0) + 1;
    });

    const sorted = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]?.[1] || 1;

    return { workoutDays, totalVolume, totalCardioTime, sorted, maxCount };
  }, [sessions, filterMonth]);

  const { workoutDays, totalVolume, totalCardioTime, sorted, maxCount } = stats;

  const displayMonth = filterMonth ? parseInt(filterMonth.split('-')[1], 10) + '월' : '';

  const getCatName = (id: string) => CATEGORIES.find(c => c.id === id)?.name ?? id;

  return (
    <div className="stats-card">
      <div className="stats-row-top">
        <div className="stat-item">
          <span className="stat-num">{workoutDays}<span className="stat-unit">일</span></span>
          <span className="stat-desc">{displayMonth} 운동일</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-num">{totalVolume.toLocaleString()}<span className="stat-unit">kg</span></span>
          <span className="stat-desc">{displayMonth} 볼륨</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-num">{totalCardioTime}<span className="stat-unit">분</span></span>
          <span className="stat-desc">{displayMonth} 유산소</span>
        </div>
      </div>

      {sorted.some(([, v]) => v > 0) && (
        <div className="stats-bars">
          <span className="stats-bars-title">부위별 세션</span>
          {sorted.filter(([, v]) => v > 0).slice(0, 4).map(([catId, count]) => (
            <div key={catId} className="bar-row">
              <span className="bar-label">{getCatName(catId)}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="bar-count">{count}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .stats-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 8px;
        }
        .stats-row-top {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .stat-num {
          font-size: 1.6rem;
          font-weight: 900;
          color: var(--accent-color);
          line-height: 1;
        }
        .stat-unit {
          font-size: 0.75rem;
          font-weight: 600;
          margin-left: 2px;
        }
        .stat-desc {
          font-size: 0.65rem;
          color: var(--muted-color);
        }
        .stat-divider {
          width: 1px;
          height: 36px;
          background: var(--border-color);
        }
        .stats-bars {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
        }
        .stats-bars-title {
          font-size: 0.65rem;
          color: var(--muted-color);
          margin-bottom: 2px;
        }
        .bar-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bar-label {
          font-size: 0.7rem;
          color: var(--muted-color);
          width: 38px;
          text-align: right;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .bar-track {
          flex: 1;
          height: 6px;
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: var(--accent-color);
          border-radius: 3px;
          transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bar-count {
          font-size: 0.65rem;
          color: var(--accent-color);
          font-weight: 700;
          width: 14px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default StatsCard;
