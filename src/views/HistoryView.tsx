import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Exercise, WorkoutSession, SetRecord } from '../types';
import StatsCard from '../components/StatsCard';

interface HistoryViewProps {
  historySessions: WorkoutSession[];
  allExercises: Exercise[];
  filterMonth: string;
  setFilterMonth: (val: string) => void;
  filteredHistory: WorkoutSession[];
  setDeletingSession: (info: { id: string, date: string }) => void;
  setStep: (step: any) => void;
  updateSession: (id: string, date: string, updated: WorkoutSession) => void;
}

const HistorySessionCard: React.FC<{
  session: WorkoutSession;
  ex: Exercise | undefined;
  onDelete: () => void;
  onUpdate: (updated: WorkoutSession) => void;
}> = ({ session, ex, onDelete, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ setIndex: number; field: 'weight'|'reps'|'distance'|'time'|'calories'; subIndex?: number } | null>(null);
  
  const isCardio = ex?.category === 'cardio';

  let summaryValue = '';
  if (isCardio) {
    const totalDist = session.sets.reduce((a, s) => a + (s.distance || 0), 0);
    const totalCal = session.sets.reduce((a, s) => a + (s.calories || 0), 0);
    summaryValue = `${totalDist.toFixed(1)}km / ${totalCal}kcal`;
  } else {
    const totalVol = session.sets.reduce((a, s) => a + s.subSets.reduce((x, y) => x + y.weight * y.reps, 0), 0);
    summaryValue = `${totalVol}kg`;
  }

  // Quick edit logic
  const updateFocusedValue = (delta: number) => {
    if (!focusedCell) return;
    const { setIndex, field, subIndex } = focusedCell;
    
    // Create deep copy
    const updatedSets = JSON.parse(JSON.stringify(session.sets)) as SetRecord[];
    const targetSet = updatedSets[setIndex];

    if (field === 'weight' || field === 'reps') {
      const sIdx = subIndex ?? 0;
      if (!targetSet.subSets[sIdx]) return;
      const current = targetSet.subSets[sIdx][field];
      const updated = Math.max(0, (current || 0) + delta);
      targetSet.subSets[sIdx][field] = Math.round(updated * 10) / 10;
    } else {
      const current = targetSet[field];
      const updated = Math.max(0, (current || 0) + delta);
      targetSet[field] = Math.round(updated * 10) / 10;
    }

    onUpdate({ ...session, sets: updatedSets });
  };

  const renderQuickPad = () => {
    if (!focusedCell) return null;
    const { field } = focusedCell;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="quick-pad-inline"
      >
        {field === 'weight' && (
          <>
            <button onClick={() => updateFocusedValue(-5)}>-5</button>
            <button onClick={() => updateFocusedValue(-2.5)}>-2.5</button>
            <button onClick={() => updateFocusedValue(2.5)}>+2.5</button>
            <button onClick={() => updateFocusedValue(5)}>+5</button>
          </>
        )}
        {field === 'reps' && (
          <>
            <button onClick={() => updateFocusedValue(-5)}>-5</button>
            <button onClick={() => updateFocusedValue(-1)}>-1</button>
            <button onClick={() => updateFocusedValue(1)}>+1</button>
            <button onClick={() => updateFocusedValue(5)}>+5</button>
          </>
        )}
        {field === 'distance' && (
          <>
            <button onClick={() => updateFocusedValue(-1.0)}>-1.0</button>
            <button onClick={() => updateFocusedValue(-0.5)}>-0.5</button>
            <button onClick={() => updateFocusedValue(0.5)}>+0.5</button>
            <button onClick={() => updateFocusedValue(1.0)}>+1.0</button>
          </>
        )}
        {field === 'time' && (
          <>
            <button onClick={() => updateFocusedValue(-5)}>-5</button>
            <button onClick={() => updateFocusedValue(-1)}>-1</button>
            <button onClick={() => updateFocusedValue(1)}>+1</button>
            <button onClick={() => updateFocusedValue(5)}>+5</button>
          </>
        )}
        {field === 'calories' && (
          <>
            <button onClick={() => updateFocusedValue(-50)}>-50</button>
            <button onClick={() => updateFocusedValue(-10)}>-10</button>
            <button onClick={() => updateFocusedValue(10)}>+10</button>
            <button onClick={() => updateFocusedValue(50)}>+50</button>
          </>
        )}
      </motion.div>
    );
  };

  const [localDate, setLocalDate] = useState(session.date);
  
  const changeDateByDays = (e: React.MouseEvent, days: number) => {
    e.stopPropagation();
    const d = new Date(localDate);
    d.setDate(d.getDate() + days);
    const newDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setLocalDate(newDateStr);
  };

  const applyDateChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localDate !== session.date) {
      onUpdate({ ...session, date: localDate });
    }
  };

  return (
    <div className="history-card-wrapper" style={{ marginBottom: '8px' }}>
      <div 
        className="history-card accordion-card" 
        style={{ background: 'var(--card-bg)', margin: 0, borderRadius: '16px' }}
      >
        <div className="card-top" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
          <div className="history-info-group">
            <div className={`cat-icon cat-${ex?.category || 'default'}`} />
            <div className="card-titles">
              <span className="card-name">{ex?.name}</span>
              <span className="card-sub">{session.sets.length}세트</span>
            </div>
          </div>
          <div className="card-actions">
            <span className="card-summary">{summaryValue}</span>
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
                {/* 직관적인 날짜 변경 컨트롤러 */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', 
                  borderRadius: '12px', padding: '10px 12px', marginBottom: '16px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={(e) => changeDateByDays(e, -1)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '8px', color: 'var(--fg-color)', display: 'flex' }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    <div style={{ textAlign: 'center', minWidth: '90px' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--muted-color)', marginBottom: '2px' }}>운동 날짜</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: localDate !== session.date ? 'var(--accent-color)' : 'var(--fg-color)' }}>
                        {localDate}
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => changeDateByDays(e, 1)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '8px', color: 'var(--fg-color)', display: 'flex' }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <button 
                    onClick={applyDateChange}
                    disabled={localDate === session.date}
                    style={{ 
                      background: localDate !== session.date ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', 
                      border: 'none', padding: '8px 16px', borderRadius: '8px', 
                      color: localDate !== session.date ? '#000' : 'var(--muted-color)', 
                      fontWeight: 700, fontSize: '0.8rem',
                      opacity: localDate !== session.date ? 1 : 0.5
                    }}
                  >
                    이동
                  </button>
                </div>

                <div className="sets-table inline-edit-table">
                  <div className="sets-header-row">
                    <div className="col-set">세트</div>
                    {isCardio ? (
                      <>
                        <div className="col-val">거리</div>
                        <div className="col-val">시간</div>
                        <div className="col-val">kcal</div>
                      </>
                    ) : (
                      <>
                        <div className="col-val">kg</div>
                        <div className="col-val">회</div>
                      </>
                    )}
                  </div>

                  {session.sets.map((set, si) => (
                    <div key={si} className="set-row-item">
                      <div className="col-set"><span className="pending-badge">{si + 1}</span></div>
                      {isCardio ? (
                        <>
                          <div 
                            className={`col-val cell-input ${focusedCell?.setIndex === si && focusedCell?.field === 'distance' ? 'focused' : ''}`}
                            onClick={() => setFocusedCell({ setIndex: si, field: 'distance' })}
                          >{set.distance || 0}</div>
                          <div 
                            className={`col-val cell-input ${focusedCell?.setIndex === si && focusedCell?.field === 'time' ? 'focused' : ''}`}
                            onClick={() => setFocusedCell({ setIndex: si, field: 'time' })}
                          >{set.time || 0}</div>
                          <div 
                            className={`col-val cell-input ${focusedCell?.setIndex === si && focusedCell?.field === 'calories' ? 'focused' : ''}`}
                            onClick={() => setFocusedCell({ setIndex: si, field: 'calories' })}
                          >{set.calories || 0}</div>
                        </>
                      ) : (
                        <div className="subsets-col">
                          {set.subSets.map((ss, ssi) => (
                            <div key={ssi} className="subset-inner-row">
                              <div 
                                className={`col-val cell-input ${focusedCell?.setIndex === si && focusedCell?.field === 'weight' && focusedCell?.subIndex === ssi ? 'focused' : ''}`}
                                onClick={() => setFocusedCell({ setIndex: si, field: 'weight', subIndex: ssi })}
                              >{ss.weight}</div>
                              <div 
                                className={`col-val cell-input ${focusedCell?.setIndex === si && focusedCell?.field === 'reps' && focusedCell?.subIndex === ssi ? 'focused' : ''}`}
                                onClick={() => setFocusedCell({ setIndex: si, field: 'reps', subIndex: ssi })}
                              >{ss.reps}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {renderQuickPad()}

                {/* 하단 액션: 운동 기록 삭제 버튼 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255, 68, 68, 0.1)',
                      border: '1px solid rgba(255, 68, 68, 0.25)',
                      color: '#ff4444',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={15} />
                    <span>운동 기록 삭제</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const HistoryView: React.FC<HistoryViewProps> = ({
  historySessions,
  allExercises,
  filterMonth, setFilterMonth,
  filteredHistory,
  setDeletingSession,
  setStep,
  updateSession
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
    >
      <header className="record-header">
        <button onClick={() => setStep('category')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>운동 히스토리</h1>
        <div className="header-right" />
      </header>

      <div className="view-scroll-content">
        <StatsCard sessions={historySessions} filterMonth={filterMonth} />

        <div className="history-filters" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px', width: '100%' }}>
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
                        onUpdate={(updated) => updateSession(session.exerciseId, session.date, updated)}
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
      </div>
    </motion.div>
  );
};

export default HistoryView;
