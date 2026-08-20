import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Trash2, History, ChevronDown, ChevronUp } from 'lucide-react';
import type { Exercise, SetRecord, SubSet, WorkoutSession } from '../types';
import RestTimer from '../components/RestTimer';

interface RecordViewProps {
  selectedExercise: Exercise | null;
  currentSets: SetRecord[];
  setCurrentSets: (sets: SetRecord[]) => void;
  prevSession: WorkoutSession | null;
  finishWorkout: (finalSetsFromView?: SetRecord[]) => void;
  timerActive: boolean;
  timerKey: number;
  timerDuration: number;
  stopTimer: () => void;
  startTimer: () => void;
  showToast?: (msg: string) => void;
  setStep: (step: any) => void;
}

type WorkingSet = {
  id: string; // unique ID for React key
  isCompleted: boolean;
  subSets: SubSet[];
  distance?: number;
  time?: number;
  calories?: number;
  timestamp?: number;
};

const RecordView: React.FC<RecordViewProps> = ({
  selectedExercise,
  currentSets,
  setCurrentSets,
  prevSession,
  finishWorkout,
  timerActive, timerKey, timerDuration, stopTimer, startTimer,
  showToast,
  setStep,
}) => {
  const isCardio = selectedExercise?.category === 'cardio';
  const [showPrevDetails, setShowPrevDetails] = useState(false);

  const handleBack = () => {
    if (currentSets.length > 0) {
      showToast?.('운동이 임시 저장되었습니다 💾');
    }
    setStep('select');
  };

  const [workingSets, setWorkingSets] = useState<WorkingSet[]>(() => {
    const initial: WorkingSet[] = currentSets.map(s => ({
      id: Math.random().toString(36).substring(7),
      isCompleted: true,
      subSets: s.subSets ? JSON.parse(JSON.stringify(s.subSets)) : [],
      distance: s.distance,
      time: s.time,
      calories: s.calories,
      timestamp: s.timestamp
    }));

    let newSet: WorkingSet;
    if (initial.length > 0) {
      const last = initial[initial.length - 1];
      newSet = {
        id: Math.random().toString(36).substring(7),
        isCompleted: false,
        // 드롭세트가 있더라도 새 세트는 1줄만 생성
        subSets: last.subSets && last.subSets.length > 0 
          ? [JSON.parse(JSON.stringify(last.subSets[last.subSets.length - 1]))] 
          : [{ weight: 0, reps: 0 }],
        distance: last.distance,
        time: last.time,
        calories: last.calories
      };
    } else {
      if (prevSession && prevSession.sets.length > 0) {
        const pLast = prevSession.sets[0];
        newSet = {
          id: Math.random().toString(36).substring(7),
          isCompleted: false,
          // 직전 기록에 드롭세트가 있어도 1줄만 복사
          subSets: pLast.subSets && pLast.subSets.length > 0 
            ? [JSON.parse(JSON.stringify(pLast.subSets[0]))] 
            : [{ weight: 40, reps: 10 }],
          distance: pLast.distance ?? 5.0,
          time: pLast.time ?? 30,
          calories: pLast.calories ?? 300
        };
      } else {
        newSet = {
          id: Math.random().toString(36).substring(7),
          isCompleted: false,
          subSets: [{ weight: 20, reps: 10 }],
          distance: 5.0,
          time: 30,
          calories: 300
        };
      }
    }
    initial.push(newSet);
    return initial;
  });

  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; field: 'weight'|'reps'|'distance'|'time'|'calories'; subIndex?: number } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const completed = workingSets.filter(s => s.isCompleted).map(s => {
      const record: SetRecord = { timestamp: s.timestamp || Date.now(), subSets: [] };
      if (isCardio) {
        record.distance = s.distance;
        record.time = s.time;
        record.calories = s.calories;
      } else {
        record.subSets = s.subSets;
      }
      return record;
    });
    setCurrentSets(completed);
  }, [workingSets, setCurrentSets, isCardio]);

  useEffect(() => {
    const pendingIndex = workingSets.findIndex(s => !s.isCompleted);
    if (pendingIndex !== -1 && !focusedCell) {
      setFocusedCell({ rowIndex: pendingIndex, field: isCardio ? 'distance' : 'weight', subIndex: 0 });
    }
  }, [workingSets, isCardio, focusedCell]);

  if (!selectedExercise) return null;

  const handleComplete = (index: number) => {
    setWorkingSets(prev => {
      const copy = [...prev];
      // 원본 변이 방지를 위한 깊은 복사
      const target = { ...copy[index], subSets: JSON.parse(JSON.stringify(copy[index].subSets)) };
      copy[index] = target;
      
      if (target.isCompleted) {
        target.isCompleted = false;
        return copy;
      } else {
        target.isCompleted = true;
        target.timestamp = Date.now();
        
        const isLatestSet = (index === copy.length - 1);
        if (isLatestSet) {
          copy.push({
            id: Math.random().toString(36).substring(7),
            isCompleted: false,
            // 다음 세트 추가 시에도 마지막 서브셋 1개만 복사
            subSets: target.subSets.length > 0 ? [JSON.parse(JSON.stringify(target.subSets[target.subSets.length - 1]))] : [{ weight: 20, reps: 10 }],
            distance: target.distance,
            time: target.time,
            calories: target.calories
          });
          setFocusedCell({ rowIndex: index + 1, field: isCardio ? 'distance' : 'weight', subIndex: 0 });
          startTimer();
          setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }, 100);
        }
        
        return copy;
      }
    });
  };

  const updateFocusedValue = (delta: number) => {
    if (!focusedCell) return;
    setWorkingSets(prev => {
      const copy = [...prev];
      const target = { ...copy[focusedCell.rowIndex], subSets: JSON.parse(JSON.stringify(copy[focusedCell.rowIndex].subSets)) };
      copy[focusedCell.rowIndex] = target;
      
      if (focusedCell.field === 'weight' || focusedCell.field === 'reps') {
        const sIdx = focusedCell.subIndex ?? 0;
        if (!target.subSets[sIdx]) return prev;
        const current = target.subSets[sIdx][focusedCell.field];
        const updated = Math.max(0, (current || 0) + delta);
        target.subSets[sIdx][focusedCell.field] = Math.round(updated * 10) / 10;
      } else {
        const current = target[focusedCell.field];
        const raw = Math.max(0, (current || 0) + delta);
        // distance는 소수점 1자리, 나머지(time, calories)는 정수
        target[focusedCell.field] = focusedCell.field === 'distance'
          ? Math.round(raw * 10) / 10
          : Math.round(raw);
      }
      return copy;
    });
  };


  const removeSet = (index: number) => {
    setWorkingSets(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      if (copy.length === 0 || copy.every(s => s.isCompleted)) {
        const last = prev[index - 1] || prev[index];
        copy.push({
          id: Math.random().toString(36).substring(7),
          isCompleted: false,
          subSets: last?.subSets && last.subSets.length > 0 ? [JSON.parse(JSON.stringify(last.subSets[last.subSets.length - 1]))] : [{ weight: 20, reps: 10 }],
          distance: last?.distance ?? 5,
          time: last?.time ?? 30,
          calories: last?.calories ?? 300
        });
      }
      if (focusedCell?.rowIndex === index) {
        setFocusedCell(null);
      }
      return copy;
    });
  };

  const handleFinishWorkout = () => {
    // 1. 체크(완료)된 세트만 필터링합니다. (Hevy, Strong 스타일)
    let validSets = workingSets.filter(s => s.isCompleted);

    // 2. 만약 단 1세트도 체크하지 않은 채 운동 종료를 눌렀다면,
    // 사용자의 실수를 배려하여 입력 중이던 첫 번째 세트 1개는 저장해줍니다.
    if (validSets.length === 0 && workingSets.length > 0) {
      validSets = [workingSets[0]];
    }

    const finalSets = validSets.map(s => {
      const record: SetRecord = { timestamp: s.timestamp || Date.now(), subSets: [] };
      if (isCardio) {
        record.distance = s.distance;
        record.time = s.time;
        record.calories = s.calories;
      } else {
        // 복사를 통해 참조를 안전하게 분리
        record.subSets = s.subSets ? JSON.parse(JSON.stringify(s.subSets)) : [];
      }
      return record;
    });

    // App.tsx의 finishWorkout 함수에 필터링된 최종 세트를 넘겨서 정확히 저장되게 함
    finishWorkout(finalSets);
  };

  const renderQuickPad = () => {
    if (!focusedCell) return null;
    const { field } = focusedCell;

    if (field === 'weight') {
      return (
        <div className="quick-pad">
          <button onClick={() => updateFocusedValue(-5)}>-5</button>
          <button onClick={() => updateFocusedValue(-2.5)}>-2.5</button>
          <button onClick={() => updateFocusedValue(2.5)}>+2.5</button>
          <button onClick={() => updateFocusedValue(5)}>+5</button>
        </div>
      );
    } else if (field === 'reps') {
      return (
        <div className="quick-pad">
          <button onClick={() => updateFocusedValue(-5)}>-5</button>
          <button onClick={() => updateFocusedValue(-1)}>-1</button>
          <button onClick={() => updateFocusedValue(1)}>+1</button>
          <button onClick={() => updateFocusedValue(5)}>+5</button>
        </div>
      );
    } else if (field === 'distance') {
      return (
        <div className="quick-pad">
          <button onClick={() => updateFocusedValue(-1.0)}>-1.0</button>
          <button onClick={() => updateFocusedValue(-0.1)}>-0.1</button>
          <button onClick={() => updateFocusedValue(0.1)}>+0.1</button>
          <button onClick={() => updateFocusedValue(1.0)}>+1.0</button>
        </div>
      );
    } else if (field === 'time') {
      return (
        <div className="quick-pad">
          <button onClick={() => updateFocusedValue(-5)}>-5</button>
          <button onClick={() => updateFocusedValue(-1)}>-1</button>
          <button onClick={() => updateFocusedValue(1)}>+1</button>
          <button onClick={() => updateFocusedValue(5)}>+5</button>
        </div>
      );
    } else if (field === 'calories') {
      return (
        <div className="quick-pad">
          <button onClick={() => updateFocusedValue(-10)}>-10</button>
          <button onClick={() => updateFocusedValue(-1)}>-1</button>
          <button onClick={() => updateFocusedValue(1)}>+1</button>
          <button onClick={() => updateFocusedValue(10)}>+10</button>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      key="record"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="step-container"
    >
      <header className="record-header">
        <button onClick={handleBack} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>{selectedExercise.name}</h1>
        <div className="header-right">
          <button className="finish-top-btn" onClick={handleFinishWorkout}>운동 종료</button>
        </div>
      </header>

      <div className="record-scroll-area" ref={scrollRef}>
        {prevSession && (
          <div 
            className="prev-session-card compact"
            style={{ cursor: 'pointer', transition: 'background 0.2s', userSelect: 'none', padding: '12px 16px' }}
            onClick={() => setShowPrevDetails(!showPrevDetails)}
          >
            <div className="prev-session-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={15} color="var(--accent-color)" />
                <span className="prev-session-title" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--fg-color)' }}>
                  직전 기록 ({prevSession.date})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-color)' }}>· {prevSession.sets.length}세트</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--muted-color)' }}>
                {showPrevDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            <AnimatePresence>
              {showPrevDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {prevSession.sets.map((set, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--fg-color)' }}>
                        <span style={{ color: 'var(--muted-color)', fontWeight: 600, fontSize: '0.75rem', width: '44px' }}>
                          {idx + 1}세트
                        </span>
                        <div style={{ display: 'flex', gap: '8px', fontWeight: 600 }}>
                          {isCardio ? (
                            <span>
                              {set.distance ? `${set.distance}km ` : ''}
                              {set.time ? `${set.time}분 ` : ''}
                              {set.calories ? `${set.calories}kcal` : ''}
                            </span>
                          ) : (
                            <span>
                              {set.subSets?.map((ss, ssi) => (
                                <span key={ssi}>
                                  {ssi > 0 && <span style={{ color: 'var(--muted-color)', margin: '0 4px' }}>/</span>}
                                  {ss.weight}kg × {ss.reps}회
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="sets-table">
          <div className="sets-header-row">
            <div className="col-set">세트</div>
            {isCardio ? (
              <>
                <div className="col-val">거리(km)</div>
                <div className="col-val">시간(분)</div>
                <div className="col-val">kcal</div>
              </>
            ) : (
              <>
                <div className="col-val">무게(kg)</div>
                <div className="col-val">횟수(회)</div>
              </>
            )}
            <div className="col-check">완료</div>
          </div>

          {workingSets.map((row, rIndex) => (
            <div key={row.id} className={`set-row-item ${row.isCompleted ? 'completed' : 'pending'}`}>
              <div className="col-set">
                {row.isCompleted ? rIndex + 1 : <span className="pending-badge">{rIndex + 1}</span>}
              </div>

              {isCardio ? (
                <>
                  <div 
                    className={`col-val cell-input ${focusedCell?.rowIndex === rIndex && focusedCell?.field === 'distance' ? 'focused' : ''}`}
                    onClick={() => setFocusedCell({ rowIndex: rIndex, field: 'distance' })}
                  >
                    {row.distance}
                  </div>
                  <div 
                    className={`col-val cell-input ${focusedCell?.rowIndex === rIndex && focusedCell?.field === 'time' ? 'focused' : ''}`}
                    onClick={() => setFocusedCell({ rowIndex: rIndex, field: 'time' })}
                  >
                    {row.time}
                  </div>
                  <div 
                    className={`col-val cell-input ${focusedCell?.rowIndex === rIndex && focusedCell?.field === 'calories' ? 'focused' : ''}`}
                    onClick={() => setFocusedCell({ rowIndex: rIndex, field: 'calories' })}
                  >
                    {row.calories}
                  </div>
                </>
              ) : (
                <div className="subsets-col">
                  {row.subSets.map((sub, sIndex) => (
                    <div key={sIndex} className="subset-inner-row">
                      <div 
                        className={`col-val cell-input ${focusedCell?.rowIndex === rIndex && focusedCell?.field === 'weight' && focusedCell?.subIndex === sIndex ? 'focused' : ''}`}
                        onClick={() => setFocusedCell({ rowIndex: rIndex, field: 'weight', subIndex: sIndex })}
                      >
                        {sub.weight}
                      </div>
                      <div 
                        className={`col-val cell-input ${focusedCell?.rowIndex === rIndex && focusedCell?.field === 'reps' && focusedCell?.subIndex === sIndex ? 'focused' : ''}`}
                        onClick={() => setFocusedCell({ rowIndex: rIndex, field: 'reps', subIndex: sIndex })}
                      >
                        {sub.reps}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="col-check">
                <button 
                  className={`check-btn ${row.isCompleted ? 'checked' : ''}`} 
                  onClick={() => handleComplete(rIndex)}
                >
                  <Check size={20} strokeWidth={row.isCompleted ? 3 : 2} />
                </button>
                {row.isCompleted && (
                  <button 
                    className="inline-del-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSet(rIndex);
                    }}
                    title="세트 삭제"
                  >
                    <Trash2 size={18} strokeWidth={2.2} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {timerActive && timerDuration > 0 && (
          <RestTimer
            key={timerKey}
            duration={timerDuration}
            timerKey={timerKey}
            onComplete={stopTimer}
            onSkip={stopTimer}
          />
        )}
      </AnimatePresence>

      <div className="quick-pad-container">
        {renderQuickPad()}
      </div>
    </motion.div>
  );
};

export default RecordView;
