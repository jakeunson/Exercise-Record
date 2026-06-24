import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Plus, Calendar, Dumbbell, Save } from 'lucide-react';
import type { WorkoutSession, SetRecord, SubSet, Exercise } from '../types';
import { StorageService } from '../services/storage';

interface WorkoutEditModalProps {
  session: WorkoutSession;
  allExercises: Exercise[];
  onClose: () => void;
  onSaved: () => void;
}

const WorkoutEditModal: React.FC<WorkoutEditModalProps> = ({
  session,
  allExercises,
  onClose,
  onSaved,
}) => {
  const [exerciseId, setExerciseId] = useState(session.exerciseId);
  const [date, setDate] = useState(session.date);
  const [sets, setSets] = useState<SetRecord[]>(() => 
    JSON.parse(JSON.stringify(session.sets))
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const selectedExercise = allExercises.find(e => e.id === exerciseId);
  const isCardio = selectedExercise?.category === 'cardio';

  // Save changes
  const handleSave = () => {
    if (!exerciseId) return;
    
    // Filter out empty sets or sets with empty subsets
    const cleanSets = sets.filter(set => {
      if (isCardio) {
        return (set.distance !== undefined && set.distance > 0) || (set.time !== undefined && set.time > 0) || (set.calories !== undefined && set.calories > 0);
      } else {
        return set.subSets && set.subSets.length > 0;
      }
    });

    const updatedSession: WorkoutSession = {
      exerciseId,
      date,
      sets: cleanSets
    };

    StorageService.updateSession(session.exerciseId, session.date, updatedSession);
    onSaved();
    onClose();
  };

  // Modify standard subSets
  const handleSubSetChange = (setIndex: number, subIndex: number, field: keyof SubSet, value: number) => {
    const updatedSets = [...sets];
    updatedSets[setIndex].subSets[subIndex] = {
      ...updatedSets[setIndex].subSets[subIndex],
      [field]: value
    };
    setSets(updatedSets);
  };

  const addSubSet = (setIndex: number) => {
    const updatedSets = [...sets];
    // Copy the last subset values if exists, otherwise default
    const lastSub = updatedSets[setIndex].subSets[updatedSets[setIndex].subSets.length - 1] || { weight: 40, reps: 10 };
    updatedSets[setIndex].subSets.push({ ...lastSub });
    setSets(updatedSets);
  };

  const removeSubSet = (setIndex: number, subIndex: number) => {
    const updatedSets = [...sets];
    updatedSets[setIndex].subSets.splice(subIndex, 1);
    setSets(updatedSets);
  };

  // Modify cardio sets
  const handleCardioChange = (setIndex: number, field: 'distance' | 'time' | 'calories', value: number) => {
    const updatedSets = [...sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [field]: value
    };
    setSets(updatedSets);
  };

  // Add a new set to the session
  const addNewSet = () => {
    const newSet: SetRecord = isCardio
      ? { distance: 5.0, time: 30, calories: 100, subSets: [], timestamp: Date.now() }
      : { subSets: [{ weight: 40, reps: 10 }], timestamp: Date.now() };
    setSets([...sets, newSet]);
  };

  const removeSet = (setIndex: number) => {
    const updatedSets = [...sets];
    updatedSets.splice(setIndex, 1);
    setSets(updatedSets);
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="workout-edit-modal"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="wem-header">
          <div className="wem-header-title">
            <Dumbbell size={18} color="var(--accent-color)" />
            <span>기록 수정</span>
          </div>
          <button className="wem-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="wem-body">
          {/* Date Input */}
          <div className="wem-field">
            <label className="wem-label">
              <Calendar size={14} />
              <span>날짜</span>
            </label>
            <input
              type="date"
              className="wem-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {/* Exercise Selection */}
          <div className="wem-field">
            <label className="wem-label">
              <Dumbbell size={14} />
              <span>운동 종류</span>
            </label>
            <select
              className="wem-select"
              value={exerciseId}
              onChange={e => setExerciseId(e.target.value)}
            >
              {allExercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {/* Sets Section */}
          <div className="wem-sets-section">
            <div className="wem-sets-header">
              <span>세트 세부 정보</span>
              <button className="wem-add-set-btn" onClick={addNewSet}>
                <Plus size={14} />
                <span>세트 추가</span>
              </button>
            </div>

            {sets.length === 0 ? (
              <div className="wem-empty-sets">
                등록된 세트가 없습니다. 세트를 추가해주세요.
              </div>
            ) : (
              <div className="wem-sets-list">
                {sets.map((set, setIndex) => (
                  <div key={setIndex} className="wem-set-card">
                    <div className="wem-set-card-header">
                      <span className="wem-set-title">{setIndex + 1}세트</span>
                      <button className="wem-delete-set-btn" onClick={() => removeSet(setIndex)}>
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {isCardio ? (
                      /* Cardio inputs */
                      <div className="wem-cardio-inputs">
                        <div className="wem-sub-input-group">
                          <span className="wem-sub-label">거리 (km)</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="wem-sub-input"
                            value={set.distance ?? 0}
                            onChange={e => handleCardioChange(setIndex, 'distance', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="wem-sub-input-group">
                          <span className="wem-sub-label">시간 (분)</span>
                          <input
                            type="number"
                            min="0"
                            className="wem-sub-input"
                            value={set.time ?? 0}
                            onChange={e => handleCardioChange(setIndex, 'time', parseInt(e.target.value, 10) || 0)}
                          />
                        </div>
                        <div className="wem-sub-input-group">
                          <span className="wem-sub-label">칼로리 (kcal)</span>
                          <input
                            type="number"
                            min="0"
                            className="wem-sub-input"
                            value={set.calories ?? 0}
                            onChange={e => handleCardioChange(setIndex, 'calories', parseInt(e.target.value, 10) || 0)}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Standard subSets inputs */
                      <div className="wem-subsets-list">
                        {set.subSets.map((sub, subIndex) => (
                          <div key={subIndex} className="wem-subset-row">
                            <div className="wem-subset-inputs">
                              <div className="wem-mini-input-group">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  className="wem-mini-input"
                                  value={sub.weight}
                                  onChange={e => handleSubSetChange(setIndex, subIndex, 'weight', parseFloat(e.target.value) || 0)}
                                />
                                <span className="wem-mini-unit">kg</span>
                              </div>
                              <span className="wem-subset-x">×</span>
                              <div className="wem-mini-input-group">
                                <input
                                  type="number"
                                  min="0"
                                  className="wem-mini-input"
                                  value={sub.reps}
                                  onChange={e => handleSubSetChange(setIndex, subIndex, 'reps', parseInt(e.target.value, 10) || 0)}
                                />
                                <span className="wem-mini-unit">회</span>
                              </div>
                            </div>
                            {set.subSets.length > 1 && (
                              <button className="wem-remove-subset-btn" onClick={() => removeSubSet(setIndex, subIndex)}>
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button className="wem-add-subset-btn" onClick={() => addSubSet(setIndex)}>
                          <Plus size={12} />
                          <span>중량 추가</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="wem-footer">
          <button className="wem-cancel-btn" onClick={onClose}>취소</button>
          <button className="wem-save-btn" onClick={handleSave}>
            <Save size={16} />
            <span>기록 저장</span>
          </button>
        </div>
      </motion.div>

      <style>{`
        .workout-edit-modal {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 20px;
          width: 90%;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 85vh;
        }
        .wem-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }
        .wem-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .wem-close-btn {
          color: var(--muted-color);
          padding: 4px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .wem-close-btn:active {
          background: rgba(255, 255, 255, 0.05);
        }
        .wem-body {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-right: 4px;
        }
        .wem-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .wem-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--muted-color);
          font-weight: 600;
        }
        .wem-input, .wem-select {
          background: var(--border-color);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px;
          color: var(--fg-color);
          font-size: 0.9rem;
          outline: none;
          width: 100%;
        }
        .wem-input:focus, .wem-select:focus {
          border-color: var(--accent-color);
        }
        .wem-sets-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .wem-sets-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: var(--muted-color);
          font-weight: 600;
        }
        .wem-add-set-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--accent-color);
          font-weight: 700;
          font-size: 0.75rem;
        }
        .wem-empty-sets {
          text-align: center;
          padding: 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed var(--border-color);
          border-radius: 16px;
          color: var(--muted-color);
          font-size: 0.8rem;
        }
        .wem-sets-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .wem-set-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .wem-set-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .wem-set-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--fg-color);
        }
        .wem-delete-set-btn {
          color: #ff4444;
          padding: 4px;
          border-radius: 6px;
        }
        .wem-cardio-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        .wem-sub-input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .wem-sub-label {
          font-size: 0.7rem;
          color: var(--muted-color);
        }
        .wem-sub-input {
          background: var(--border-color);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 8px 10px;
          color: var(--fg-color);
          font-size: 0.85rem;
          width: 100%;
          outline: none;
        }
        .wem-sub-input:focus {
          border-color: var(--accent-color);
        }
        .wem-subsets-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .wem-subset-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .wem-subset-inputs {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
        }
        .wem-mini-input-group {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--border-color);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 6px 8px;
          flex: 1;
        }
        .wem-mini-input {
          background: transparent;
          border: none;
          color: var(--fg-color);
          font-size: 0.85rem;
          width: 100%;
          outline: none;
          text-align: center;
          font-weight: 700;
        }
        .wem-mini-unit {
          font-size: 0.7rem;
          color: var(--muted-color);
          margin-left: 2px;
        }
        .wem-subset-x {
          color: var(--muted-color);
          font-size: 0.8rem;
          font-weight: 700;
        }
        .wem-remove-subset-btn {
          color: var(--muted-color);
          padding: 4px;
        }
        .wem-add-subset-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          padding: 6px;
          color: var(--muted-color);
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 2px;
        }
        .wem-add-subset-btn:active {
          background: rgba(255, 255, 255, 0.08);
        }
        .wem-footer {
          display: flex;
          gap: 10px;
          border-top: 1px solid var(--border-color);
          padding-top: 12px;
        }
        .wem-cancel-btn {
          flex: 1;
          background: var(--border-color);
          color: var(--fg-color);
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .wem-save-btn {
          flex: 1.2;
          background: var(--fg-color);
          color: var(--bg-color);
          padding: 12px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
      `}</style>
    </motion.div>
  );
};

export default WorkoutEditModal;
