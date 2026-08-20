import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CategoryItem } from '../../core/types';

interface AddCategoryModalProps {
  onClose: () => void;
  onAdd: (category: CategoryItem) => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus after animation
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: `custom-cat-${Date.now()}`,
      name: name.trim(),
      isCustom: true,
      showName: true,
      order: Date.now(),
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ zIndex: 1002 }}
      >
        <motion.div
          className="confirm-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{ gap: 16 }}
        >
          <h2>새 부위 추가</h2>
          <input
            ref={inputRef}
            className="add-ex-input"
            placeholder="예: 복근, 코어, 전신 등"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>취소</button>
            <button 
              className="confirm-delete-btn" 
              style={{ background: 'var(--fg-color)', color: 'var(--bg-color)', opacity: name.trim() ? 1 : 0.5 }} 
              onClick={handleAdd}
              disabled={!name.trim()}
            >
              추가
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddCategoryModal;
