import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Trash2, Edit2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Exercise, WorkoutSession } from '../types';
import StatsCard from '../components/StatsCard';

interface HistoryViewProps {
  historySessions: WorkoutSession[];
  allExercises: Exercise[];
  filterMonth: string;
  setFilterMonth: (val: string) => void;
  filteredHistory: WorkoutSession[];
  setEditingSession: (session: WorkoutSession) => void;
  setDeletingSession: (info: { id: string, date: string }) => void;
  setStep: (step: any) => void;
}

const HistorySessionCard: React.FC<{
  session: WorkoutSession;
  ex: Exercise | undefined;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ session, ex, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  let summaryValue = '';
  if (ex?.category === 'cardio') {
    const totalDist = session.sets.reduce((a, s) => a + (s.distance || 0), 0);
    const totalCal = session.sets.reduce((a, s) => a + (s.calories || 0), 0);
    summaryValue = `${totalDist.toFixed(1)}km / ${totalCal}kcal`;
  } else {
    const totalVol = session.sets.reduce((a, s) => a + s.subSets.reduce((x, y) => x + y.weight * y.reps, 0), 0);
    summaryValue = `${totalVol}kg`;
  }

  return (
    <div className="history-card accordion-card" onClick={() => setExpanded(!expanded)}>
      <div className="card-top">
        <div className="history-info-group">
          <div className={`cat-icon cat-${ex?.category || 'default'}`} />
          <div className="card-titles">
            <span className="card-name">{ex?.name}</span>
            <span className="card-sub">{session.sets.length}세트</span>
          </div>
        </div>
        <div className="card-actions">
          <span className="card-summary">{summaryValue}</span>
          <button className="icon-btn edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit2 size={14} />
          </button>
          <button className="icon-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(e); }}>
            <Trash2 size={14} color="#ff4444" />
          </button>
          <div className="expand-icon">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="card-sets-accordion"
          >
            <div className="accordion-content">
              {session.sets.map((set, si) => (
                <div key={si} className="set-row">
                  <span className="set-num">{si + 1}세트:</span>
                  <span className="set-val">
                    {ex?.category === 'cardio' 
                      ? `${set.distance}km / ${set.time}분${set.calories ? ` / ${set.calories}kcal` : ''}` 
                      : set.subSets.map(ss => `${ss.weight}kgx${ss.reps}`).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HistoryView: React.FC<HistoryViewProps> = ({
  historySessions,
  allExercises,
  filterMonth, setFilterMonth,
  filteredHistory,
  setEditingSession,
  setDeletingSession,
  setStep
}) => {
  const groupedSessions = useMemo(() => {
    const groups: Record<string, WorkoutSession[]> = {};
    filteredHistory.forEach(s => {
      if (!groups[s.date]) groups[s.date] = [];
      groups[s.date].push(s);
    });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => ({
      date,
      sessions: groups[date]
    }));
  }, [filteredHistory]);

  const handlePrevMonth = () => {
    if (!filterMonth) return;
    const [y, m] = filterMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    setFilterMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    if (!filterMonth) return;
    const [y, m] = filterMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    setFilterMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthDisplay = filterMonth ? `${filterMonth.split('-')[0]}년 ${parseInt(filterMonth.split('-')[1], 10)}월` : '';

  return (
    <motion.div
      key="history"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="step-container"
      style={{ overflowY: 'auto' }}
    >
      <header className="record-header">
        <button onClick={() => setStep('category')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>운동 히스토리</h1>
        <div className="header-right" />
      </header>

      <StatsCard sessions={historySessions} filterMonth={filterMonth} />

      <div className="history-filters" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', width: '100%' }}>
        <div className="filter-item month-nav" style={{ width: '100%', background: 'var(--card-bg)', padding: '12px 16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <button className="icon-btn" onClick={handlePrevMonth} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--fg-color)', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={20} /></button>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--fg-color)' }}>{monthDisplay}</span>
          <button className="icon-btn" onClick={handleNextMonth} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--fg-color)', cursor: 'pointer', display: 'flex' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="history-list">
        {groupedSessions.length > 0 ? (
          groupedSessions.map(group => (
            <div key={group.date} className="history-date-group">
              <div className="history-date-header">
                <Calendar size={14} />
                <span>{group.date}</span>
              </div>
              <div className="history-group-cards">
                {group.sessions.map(session => {
                  const ex = allExercises.find(e => e.id === session.exerciseId);
                  return (
                    <HistorySessionCard
                      key={`${session.exerciseId}-${session.date}`}
                      session={session}
                      ex={ex}
                      onEdit={() => setEditingSession(session)}
                      onDelete={() => {
                        setDeletingSession({ id: session.exerciseId, date: session.date });
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))
        ) : <div className="empty-state">기록이 없습니다.</div>}
      </div>
    </motion.div>
  );
};

export default HistoryView;
