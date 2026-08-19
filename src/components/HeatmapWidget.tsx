import React, { useMemo, useRef, useEffect } from 'react';
import type { WorkoutSession, Exercise } from '../types';

interface HeatmapWidgetProps {
  sessions: WorkoutSession[];
  allExercises: Exercise[];
}

const HeatmapWidget: React.FC<HeatmapWidgetProps> = ({ sessions, allExercises }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const heatmapData = useMemo(() => {
    // 1. Calculate stats per date
    const dateStats: Record<string, { volume: number, hasCardio: boolean }> = {};
    
    sessions.forEach(session => {
      const ex = allExercises.find(e => e.id === session.exerciseId);
      if (!dateStats[session.date]) dateStats[session.date] = { volume: 0, hasCardio: false };
      
      if (ex?.category === 'cardio') {
        dateStats[session.date].hasCardio = true;
        const cardioVol = session.sets.reduce((a, s) => a + (s.calories || 0), 0) * 10;
        dateStats[session.date].volume += cardioVol;
      } else {
        const weightVol = session.sets.reduce((a, s) => a + s.subSets.reduce((x, y) => x + y.weight * y.reps, 0), 0);
        dateStats[session.date].volume += weightVol;
      }
    });

    // 2. Generate past 52 weeks of dates (52 * 7 = 364 days)
    const today = new Date();
    // Start from Sunday 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 363 - today.getDay()); 

    const weeks: { date: string; level: number }[][] = [];
    let currentWeek: { date: string; level: number }[] = [];

    for (let i = 0; i <= 363 + today.getDay(); i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const stat = dateStats[dateStr];
      let level = 0;
      if (stat) {
        if (stat.volume > 10000) level = 4;
        else if (stat.volume > 5000) level = 3;
        else if (stat.volume > 2000) level = 2;
        else level = 1;
      }

      currentWeek.push({ date: dateStr, level });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while(currentWeek.length < 7) {
        currentWeek.push({ date: 'empty', level: -1 });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [sessions, allExercises]);

  // 스크롤을 항상 가장 오른쪽(최근)으로 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [heatmapData]);

  return (
    <div className="heatmap-widget">
      <div className="heatmap-scroll" ref={scrollRef} style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        
        {/* 상단 월 표시 헤더 */}
        <div style={{ display: 'flex', gap: '4px', height: '24px', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--muted-color)' }}>
          {heatmapData.map((week, wIdx) => {
            const firstValidDay = week.find(d => d.date !== 'empty');
            if (!firstValidDay) return <div key={`m-${wIdx}`} style={{ width: '14px', flexShrink: 0 }} />;
            
            const currentMonth = firstValidDay.date.split('-')[1]; // ex) "08"
            
            let showMonth = false;
            if (wIdx === 0) {
              showMonth = true;
            } else {
              const prevWeekValidDay = heatmapData[wIdx - 1].find(d => d.date !== 'empty');
              if (prevWeekValidDay) {
                const prevMonth = prevWeekValidDay.date.split('-')[1];
                if (currentMonth !== prevMonth) showMonth = true;
              }
            }

            return (
              <div key={`m-${wIdx}`} style={{ width: '14px', flexShrink: 0, position: 'relative' }}>
                {showMonth && (
                  <span style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 1, whiteSpace: 'nowrap', fontWeight: 700 }}>
                    {currentMonth}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="heatmap-grid" style={{ display: 'flex', gap: '4px' }}>
          {heatmapData.map((week, wIdx) => (
            <div key={wIdx} className="heatmap-col" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {week.map((day, dIdx) => (
                <div 
                  key={`${wIdx}-${dIdx}`} 
                  className={`heatmap-cell level-${day.level} ${day.level === -1 ? 'hidden' : ''}`}
                  title={day.level > 0 ? day.date : undefined}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '4px',
                    opacity: day.level === -1 ? 0 : 1
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-legend" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '8px', fontSize: '0.6rem', color: 'var(--muted-color)' }}>
        <span>적음</span>
        <div className="heatmap-cell level-0" style={{ width: '12px', height: '12px', borderRadius: '3px' }}></div>
        <div className="heatmap-cell level-1" style={{ width: '12px', height: '12px', borderRadius: '3px' }}></div>
        <div className="heatmap-cell level-2" style={{ width: '12px', height: '12px', borderRadius: '3px' }}></div>
        <div className="heatmap-cell level-3" style={{ width: '12px', height: '12px', borderRadius: '3px' }}></div>
        <div className="heatmap-cell level-4" style={{ width: '12px', height: '12px', borderRadius: '3px' }}></div>
        <span>많음</span>
      </div>
    </div>
  );
};

export default HeatmapWidget;
