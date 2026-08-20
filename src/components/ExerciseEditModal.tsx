import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera as CameraIcon, Image as ImageIcon, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Exercise, ExerciseSettings } from '../types';
import type { CustomExercise } from '../types';
import { WorkoutRepository } from '../core/repositories/workoutRepository';
import { SettingsRepository } from '../core/repositories/settingsRepository';

interface ExerciseEditModalProps {
  exercise: Exercise;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void; // only for custom exercises
}


const ExerciseEditModal: React.FC<ExerciseEditModalProps> = ({
  exercise,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const isCustom = (exercise as CustomExercise).isCustom === true;

  const [settings, setSettings] = useState<ExerciseSettings>(() =>
    SettingsRepository.getExerciseSetting(exercise.id)
  );
  const [customName, setCustomName] = useState(exercise.name);
  const [previewImage, setPreviewImage] = useState<string | undefined>(settings.customImage);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const pickImage = async (source: CameraSource) => {
    setShowImagePicker(false);
    setIsLoading(true);
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
        width: 400,
      });
      if (image.dataUrl) {
        setPreviewImage(image.dataUrl);
        setSettings(prev => ({ ...prev, customImage: image.dataUrl }));
      }
    } catch (e) {
      console.log('Camera cancelled or failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(undefined);
    setSettings(prev => ({ ...prev, customImage: undefined }));
  };

  const handleSave = () => {
    // 1. 설정 저장 (이미지, 표시 여부 등)
    SettingsRepository.saveExerciseSetting(settings);

    // 2. 커스텀 운동인 경우 이름 변경 저장
    if (isCustom && customName.trim() !== '' && customName !== exercise.name) {
      const updated: CustomExercise = {
        ...exercise,
        name: customName.trim(),
        isCustom: true
      };
      WorkoutRepository.saveCustomExercise(updated);
    }

    onSaved();
    onClose();
  };

  const handleDelete = () => {
    if (!isCustom) return;
    WorkoutRepository.deleteCustomExercise(exercise.id);
    if (onDeleted) onDeleted();
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
        className="exercise-edit-modal"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="eem-header">
          <span className="eem-title">{isCustom ? '운동 편집' : '운동 설정'}</span>
          <button className="eem-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Image Section */}
        <div className="eem-image-section">
          <div className="eem-preview" onClick={() => setShowImagePicker(true)}>
            {previewImage ? (
              <img src={previewImage} alt="preview" className="eem-preview-img" />
            ) : (
              <div className="eem-preview-placeholder">
                {isLoading ? (
                  <span className="eem-loading">처리 중…</span>
                ) : (
                  <>
                    <CameraIcon size={28} color="var(--muted-color)" />
                    <span>이미지 등록</span>
                  </>
                )}
              </div>
            )}
            <div className="eem-preview-overlay">
              <CameraIcon size={16} color="#fff" />
            </div>
          </div>
          {previewImage && (
            <button className="eem-remove-img" onClick={handleRemoveImage}>
              <Trash2 size={14} />
              <span>이미지 제거</span>
            </button>
          )}
        </div>

        {/* Name (custom only) */}
        {isCustom && (
          <div className="eem-field">
            <label className="eem-label">운동 이름</label>
            <input
              className="eem-input"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="운동 이름 입력"
            />
          </div>
        )}

        {/* Show Name Toggle */}
        <div className="eem-toggle-row" onClick={() => setSettings(prev => ({ ...prev, showName: !prev.showName }))}>
          <div className="eem-toggle-info">
            <span className="eem-toggle-title">운동명 표시</span>
            <span className="eem-toggle-desc">운동 선택 화면에서 이름 표시 여부</span>
          </div>
          <div className={`eem-toggle-icon ${settings.showName ? 'on' : 'off'}`}>
            {settings.showName ? <Eye size={18} /> : <EyeOff size={18} />}
          </div>
        </div>

        {/* Save Button */}
        <button className="eem-save-btn" onClick={handleSave} disabled={isLoading}>
          저장하기
        </button>

        {/* Delete (custom only) */}
        {isCustom && (
          confirmDelete ? (
            <div className="eem-confirm-delete">
              <span>정말 삭제하시겠습니까?</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="eem-cancel-del" onClick={() => setConfirmDelete(false)}>취소</button>
                <button className="eem-confirm-del" onClick={handleDelete}>삭제</button>
              </div>
            </div>
          ) : (
            <button className="eem-delete-btn" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={16} />
              <span>이 운동 삭제</span>
            </button>
          )
        )}
      </motion.div>

      {/* Image Picker Action Sheet */}
      <AnimatePresence>
        {showImagePicker && (
          <motion.div
            className="eem-action-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImagePicker(false)}
          >
            <motion.div
              className="eem-action-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="eem-action-sheet-handle" />
              <span className="eem-action-sheet-title">이미지 등록 방법 선택</span>
              <button className="eem-action-btn" onClick={() => pickImage(CameraSource.Camera)}>
                <CameraIcon size={22} />
                <span>사진 촬영</span>
              </button>
              <button className="eem-action-btn" onClick={() => pickImage(CameraSource.Photos)}>
                <ImageIcon size={22} />
                <span>갤러리에서 선택</span>
              </button>
              <button className="eem-action-cancel" onClick={() => setShowImagePicker(false)}>
                취소
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .exercise-edit-modal {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 20px;
          width: 88%;
          max-width: 340px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .eem-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .eem-title { font-size: 1rem; font-weight: 700; }
        .eem-close {
          padding: 6px;
          background: var(--border-color);
          border-radius: 8px;
          color: var(--fg-color);
        }
        .eem-image-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .eem-preview {
          width: 120px;
          height: 120px;
          border-radius: 20px;
          background: var(--border-color);
          overflow: hidden;
          position: relative;
          cursor: pointer;
          border: 1.5px dashed var(--muted-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .eem-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .eem-preview-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: var(--muted-color);
          font-size: 0.7rem;
        }
        .eem-preview-overlay {
          position: absolute;
          bottom: 6px;
          right: 6px;
          background: rgba(0,0,0,0.5);
          border-radius: 50%;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .eem-loading { font-size: 0.7rem; color: var(--muted-color); }
        .eem-remove-img {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #ff6b6b;
        }
        .eem-field { display: flex; flex-direction: column; gap: 6px; }
        .eem-label { font-size: 0.7rem; color: var(--muted-color); }
        .eem-input {
          background: var(--border-color);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 12px;
          color: var(--fg-color);
          font-size: 0.9rem;
          font-family: inherit;
          outline: none;
        }
        .eem-input:focus { border-color: var(--accent-color); }
        .eem-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border-radius: 12px;
          cursor: pointer;
          border: 1px solid var(--border-color);
        }
        .eem-toggle-info { display: flex; flex-direction: column; gap: 2px; }
        .eem-toggle-title { font-size: 0.85rem; font-weight: 600; }
        .eem-toggle-desc { font-size: 0.65rem; color: var(--muted-color); }
        .eem-toggle-icon { padding: 6px; border-radius: 8px; }
        .eem-toggle-icon.on { color: var(--accent-color); }
        .eem-toggle-icon.off { color: var(--muted-color); }
        .eem-save-btn {
          background: var(--fg-color);
          color: var(--bg-color);
          padding: 14px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.95rem;
        }
        .eem-save-btn:disabled { opacity: 0.5; }
        .eem-delete-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid rgba(255,107,107,0.2);
        }
        .eem-confirm-delete {
          text-align: center;
          font-size: 0.85rem;
          color: var(--muted-color);
        }
        .eem-cancel-del {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          background: var(--border-color);
          color: var(--fg-color);
          font-weight: 600;
        }
        .eem-confirm-del {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          background: #ff4444;
          color: white;
          font-weight: 700;
        }
        .eem-action-sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .eem-action-sheet {
          background: var(--card-bg);
          border-radius: 20px 20px 0 0;
          padding: 16px 20px 28px;
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .eem-action-sheet-handle {
          width: 36px;
          height: 4px;
          background: var(--muted-color);
          border-radius: 2px;
          margin: 0 auto 4px;
          opacity: 0.4;
        }
        .eem-action-sheet-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--fg-color);
          text-align: center;
          margin-bottom: 4px;
        }
        .eem-action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--border-color);
          color: var(--fg-color);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .eem-action-btn:active {
          background: rgba(255,255,255,0.12);
        }
        .eem-action-cancel {
          padding: 12px;
          border-radius: 14px;
          background: var(--border-color);
          color: var(--muted-color);
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 4px;
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  );
};

export default ExerciseEditModal;
