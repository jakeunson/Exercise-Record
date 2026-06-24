import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkoutCalendarProps {
  workoutDates: Set<string>;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ workoutDates }) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build cells: null = empty, number = day
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to complete weeks
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [year, month]);

  const monthLabel = `${year}년 ${month + 1}월`;

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="workout-calendar">
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
        <span className="cal-month">{monthLabel}</span>
        <button className="cal-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
      </div>
      <div className="cal-day-labels">
        {DAY_LABELS.map(d => (
          <span key={d} className={`cal-day-label ${d === '일' ? 'sun' : d === '토' ? 'sat' : ''}`}>{d}</span>
        ))}
      </div>
      <div className="cal-grid">
        {calendarData.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="cal-cell empty" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const hasWorkout = workoutDates.has(dateStr);

          return (
            <div
              key={dateStr}
              className={`cal-cell ${isToday ? 'today' : ''} ${hasWorkout ? 'worked' : ''}`}
            >
              <span>{day}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .workout-calendar {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 12px;
        }
        .cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 0 4px;
        }
        .cal-nav-btn {
          background: none;
          border: none;
          color: var(--muted-color);
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .cal-nav-btn:active { background: rgba(255,255,255,0.1); }
        .cal-month {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--fg-color);
        }
        .cal-day-labels {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 4px;
        }
        .cal-day-label {
          text-align: center;
          font-size: 0.6rem;
          color: var(--muted-color);
          padding: 2px 0;
        }
        .cal-day-label.sun { color: #ff6b6b; }
        .cal-day-label.sat { color: #5ba3ff; }
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }
        .cal-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          position: relative;
        }
        .cal-cell span {
          font-size: 0.65rem;
          color: var(--muted-color);
          z-index: 1;
          position: relative;
        }
        .cal-cell.worked {
          background: var(--accent-color);
        }
        .cal-cell.worked span {
          color: #000;
          font-weight: 700;
        }
        .cal-cell.today:not(.worked) {
          border: 1.5px solid var(--accent-color);
        }
        .cal-cell.today:not(.worked) span {
          color: var(--accent-color);
          font-weight: 700;
        }
        .cal-cell.empty { pointer-events: none; }
      `}</style>
    </div>
  );
};

export default WorkoutCalendar;
