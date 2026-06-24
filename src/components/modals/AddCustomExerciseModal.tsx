import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AddCustomExerciseModalProps {
  newExName: string;
  setNewExName: (name: string) => void;
  onCancel: () => void;
  onAdd: () => void;
}

const AddCustomExerciseModal: React.FC<AddCustomExerciseModalProps> = ({
  newExName, setNewExName, onCancel, onAdd
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focus after animation
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        className="confirm-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ gap: 16 }}
      >
        <h2>운동 추가</h2>
        <input
          ref={inputRef}
          className="add-ex-input"
          placeholder="운동 이름 입력"
          value={newExName}
          onChange={e => setNewExName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
        />
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>취소</button>
          <button className="confirm-delete-btn" style={{ background: 'var(--fg-color)', color: 'var(--bg-color)' }} onClick={onAdd}>추가</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddCustomExerciseModal;
