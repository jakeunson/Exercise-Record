import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Activity, Save } from 'lucide-react';
import type { InBodyRecord } from '../../types';
import { StorageService } from '../../services/storage';

interface InBodyEditModalProps {
  record: InBodyRecord;
  onClose: () => void;
  onSaved: () => void;
}

const InBodyEditModal: React.FC<InBodyEditModalProps> = ({
  record,
  onClose,
  onSaved,
}) => {
  const [date, setDate] = useState(record.date);
  const [weight, setWeight] = useState(record.weight);
  const [muscle, setMuscle] = useState(record.skeletalMuscleMass);
  const [fat, setFat] = useState(record.bodyFatPercentage);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = () => {
    const updatedRecord: InBodyRecord = {
      date,
      weight,
      skeletalMuscleMass: muscle,
      bodyFatPercentage: fat
    };

    StorageService.updateInBody(record.date, updatedRecord);
    onSaved();
    onClose();
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
            <Activity size={18} color="var(--accent-color)" />
            <span>인바디 기록 수정</span>
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

          <div className="wem-field">
            <label className="wem-label">
              <span>체중 (kg)</span>
            </label>
            <input
              type="number"
              step="0.1"
              className="wem-input"
              value={weight}
              onChange={e => setWeight(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="wem-field">
            <label className="wem-label">
              <span>골격근량 (kg)</span>
            </label>
            <input
              type="number"
              step="0.1"
              className="wem-input"
              value={muscle}
              onChange={e => setMuscle(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="wem-field">
            <label className="wem-label">
              <span>체지방률 (%)</span>
            </label>
            <input
              type="number"
              step="0.1"
              className="wem-input"
              value={fat}
              onChange={e => setFat(parseFloat(e.target.value) || 0)}
            />
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
        .wem-input {
          background: var(--border-color);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px;
          color: var(--fg-color);
          font-size: 0.9rem;
          outline: none;
          width: 100%;
        }
        .wem-input:focus {
          border-color: var(--accent-color);
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

export default InBodyEditModal;
