import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Exercise, SetRecord } from '../types';

interface SummaryViewProps {
  selectedExercise: Exercise | null;
  currentSets: SetRecord[];
  reset: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  selectedExercise,
  currentSets,
  reset
}) => {
  if (!selectedExercise) return null;

  return (
    <motion.div
      key="summary"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="step-container summary-step"
    >
      <div className="success-icon"><Check size={48} color="var(--accent-color)" /></div>
      <h1>오늘의 성과</h1>
      <div className="summary-card">
        <div className="summary-row"><span>운동</span><span>{selectedExercise.name}</span></div>
        <div className="summary-row"><span>총 세트</span><span>{currentSets.length} 세트</span></div>
        {selectedExercise.category === 'cardio' ? (
          <>
            <div className="summary-row">
              <span>총 거리</span>
              <span>{currentSets.reduce((acc, s) => acc + (s.distance || 0), 0).toFixed(1)} km</span>
            </div>
            <div className="summary-row">
              <span>총 소모 칼로리</span>
              <span>{currentSets.reduce((acc, s) => acc + (s.calories || 0), 0)} kcal</span>
            </div>
          </>
        ) : (
          <div className="summary-row">
            <span>총 볼륨</span>
            <span>{currentSets.reduce((acc, s) => acc + s.subSets.reduce((a, b) => a + b.weight * b.reps, 0), 0)} kg</span>
          </div>
        )}
      </div>
      <button className="main-btn" onClick={reset}>홈으로 이동</button>
    </motion.div>
  );
};

export default SummaryView;
