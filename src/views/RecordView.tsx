import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, History } from 'lucide-react';
import type { Exercise, SetRecord, SubSet, WorkoutSession } from '../types';
import SwipePicker from '../components/SwipePicker';
import RestTimer from '../components/RestTimer';

interface RecordViewProps {
  selectedExercise: Exercise | null;
  currentSets: SetRecord[];
  tempSubSets: SubSet[];
  prevSession: WorkoutSession | null;
  distance: number;
  time: number;
  weight: number;
  reps: number;
  setDistance: (v: number) => void;
  setTime: (v: number) => void;
  setWeight: (v: number) => void;
  setReps: (v: number) => void;
  calories: number;
  setCalories: (v: number) => void;
  addSubSet: () => void;
  saveSet: () => void;
  finishWorkout: () => void;
  timerActive: boolean;
  timerKey: number;
  timerDuration: number;
  stopTimer: () => void;
  showSaveToast: boolean;
  setStep: (step: any) => void;
  distanceOptions: number[];
  timeOptions: number[];
  weightOptions: number[];
  repOptions: number[];
  calorieOptions: number[];
}

const RecordView: React.FC<RecordViewProps> = ({
  selectedExercise,
  currentSets,
  tempSubSets,
  prevSession,
  distance, time, weight, reps, calories,
  setDistance, setTime, setWeight, setReps, setCalories,
  addSubSet, saveSet, finishWorkout,
  timerActive, timerKey, timerDuration, stopTimer,
  showSaveToast,
  setStep,
  distanceOptions, timeOptions, weightOptions, repOptions, calorieOptions
}) => {
  if (!selectedExercise) return null;

  return (
    <motion.div
      key="record"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="step-container"
    >
      <header className="record-header">
        <button onClick={() => setStep('select')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>{selectedExercise.name}</h1>
        <div className="header-right">
          <motion.span 
            key={currentSets.length}
            initial={{ scale: 1.3, color: "#fff" }}
            animate={{ scale: 1, color: "var(--accent-color)" }}
            className="set-badge"
          >
            {currentSets.length + 1} 세트
          </motion.span>
        </div>
      </header>

      <div className="record-scroll-area">
        <AnimatePresence>
          {showSaveToast && (
            <div className="save-toast-wrapper">
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="save-toast"
              >
                <Check size={20} />
                <span>{currentSets.length}세트 저장됨!</span>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {prevSession ? (
          <div className="prev-session-card">
            <div className="prev-session-header">
              <History size={14} color="var(--accent-color)" />
              <span className="prev-session-title">직전 운동 기록 ({prevSession.date})</span>
            </div>
            <div className="prev-session-sets">
              {prevSession.sets.map((set, si) => {
                const isCurrentSet = si === currentSets.length;
                return (
                  <div key={si} className={`prev-session-set-row ${isCurrentSet ? 'highlight-active-set' : ''}`}>
                    <span className="prev-set-num">{si + 1}세트:</span>
                    <span className="prev-set-val">
                      {selectedExercise.category === 'cardio'
                        ? `${set.distance}km / ${set.time}분${set.calories ? ` / ${set.calories}kcal` : ''}`
                        : set.subSets.map(ss => `${ss.weight}kg x ${ss.reps}회`).join(', ')}
                    </span>
                    {isCurrentSet && <span className="prev-active-indicator">현재 세트</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="prev-info">
            <History size={16} />
            <span>첫 기록입니다. 화이팅!</span>
          </div>
        )}

        {selectedExercise.category === 'cardio' ? (
          <div className="pickers-group">
            <SwipePicker label="거리 (km)" value={distance} onChange={setDistance} options={distanceOptions} />
            <SwipePicker label="시간 (분)" value={time} onChange={setTime} options={timeOptions} />
            <SwipePicker label="칼로리 (kcal)" value={calories} onChange={setCalories} options={calorieOptions} />
          </div>
        ) : (
          <div className="record-main">
            <div className="temp-subsets">
              {tempSubSets.map((s, i) => <div key={i} className="subset-tag">{s.weight}kg x {s.reps}회</div>)}
              {tempSubSets.length > 0 && <button className="add-sub-btn" onClick={addSubSet}>+</button>}
            </div>
            <div className="pickers-group">
              <SwipePicker label="무게 (kg)" value={weight} onChange={setWeight} options={weightOptions} />
              <SwipePicker label="횟수" value={reps} onChange={setReps} options={repOptions} />
            </div>
            {tempSubSets.length === 0 && <button className="add-load-btn" onClick={addSubSet}>중량 추가 (선택사항)</button>}
          </div>
        )}
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

      <div className="actions-group-large">
        <button className="large-save-btn" onClick={saveSet}>세트 저장</button>
        <button className="large-finish-btn" onClick={finishWorkout}>운동 종료</button>
      </div>
    </motion.div>
  );
};

export default RecordView;
