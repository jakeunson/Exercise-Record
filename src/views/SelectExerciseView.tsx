import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import type { Exercise, CustomExercise, ExerciseSettings, SetRecord, SubSet } from '../types';

interface SelectExerciseViewProps {
  selectedCategoryName: string;
  filteredExercises: Exercise[];
  ongoingWorkouts: Record<string, { sets: SetRecord[]; tempSubSets: SubSet[] }>;
  getExSetting: (exerciseId: string) => ExerciseSettings;
  startWorkout: (ex: Exercise) => void;
  handleLongPressStart: (ex: Exercise) => void;
  handleLongPressEnd: () => void;
  setShowAddExercise: (show: boolean) => void;
  setStep: (step: any) => void;
}

const SelectExerciseView: React.FC<SelectExerciseViewProps> = ({
  selectedCategoryName,
  filteredExercises,
  ongoingWorkouts,
  getExSetting,
  startWorkout,
  handleLongPressStart,
  handleLongPressEnd,
  setShowAddExercise,
  setStep,
}) => {
  return (
    <motion.div
      key="select"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="step-container"
    >
      <header className="record-header">
        <button onClick={() => setStep('category')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>{selectedCategoryName}</h1>
        <div className="header-right" />
      </header>
      
      <div className="view-scroll-content">
        <div className="exercise-grid">
          {filteredExercises.map((ex) => {
            const setting = getExSetting(ex.id);
            const isCustom = (ex as CustomExercise).isCustom === true;
            const isActive = ongoingWorkouts[ex.id] !== undefined && ongoingWorkouts[ex.id].sets.length > 0;
            return (
              <button
                key={ex.id}
                className={`exercise-square ${isCustom ? 'custom-ex' : ''} ${isActive ? 'active-workout' : ''}`}
                onClick={() => startWorkout(ex)}
                onMouseDown={() => handleLongPressStart(ex)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(ex)}
                onTouchEnd={handleLongPressEnd}
              >
                {setting.customImage && (
                  <img src={setting.customImage} alt={ex.name} className="ex-custom-img" />
                )}
                {setting.showName && (
                  <span className={setting.customImage ? 'ex-name-overlay' : ''}>{ex.name}</span>
                )}
              </button>
            );
          })}
          {/* Add custom exercise button */}
          <button
            className="exercise-square add-ex-square"
            onClick={() => setShowAddExercise(true)}
          >
            <Plus size={24} color="var(--muted-color)" />
            <span style={{ fontSize: '0.65rem', color: 'var(--muted-color)' }}>추가</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SelectExerciseView;
