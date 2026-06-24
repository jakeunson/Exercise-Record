import React from 'react';
import { motion } from 'framer-motion';

interface ConfirmDeleteModalProps {
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ 
  onCancel, 
  onConfirm,
  title = "기록 삭제",
  message = "정말 이 기록을 삭제하시겠습니까?"
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="confirm-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>취소</button>
          <button className="confirm-delete-btn" onClick={onConfirm}>삭제</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmDeleteModal;
