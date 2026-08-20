import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera as CameraIcon, Image as ImageIcon, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Exercise, ExerciseSettings, CategoryItem } from '../core/types';
import type { CustomExercise } from '../core/types';
import { WorkoutRepository } from '../core/repositories/workoutRepository';
import { SettingsRepository } from '../core/repositories/settingsRepository';
import CustomSelect from './CustomSelect';
import ConfirmDeleteModal from './modals/ConfirmDeleteModal';

interface ExerciseEditModalProps {
  exercise: Exercise;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
  categories: CategoryItem[];
  onCategoryChanged?: () => void;
}


const ExerciseEditModal: React.FC<ExerciseEditModalProps> = ({
  exercise,
  onClose,
  onSaved,
  onDeleted,
  categories,
  onCategoryChanged
}) => {
  const isCustom = (exercise as CustomExercise).isCustom === true;

  const [settings, setSettings] = useState<ExerciseSettings>(() =>
    SettingsRepository.getExerciseSetting(exercise.id)
  );
  const [customName, setCustomName] = useState(exercise.name);
  const [selectedCatId, setSelectedCatId] = useState<string>(exercise.category);
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
    if (!customName.trim()) return;

    const finalSettings = { ...settings };
    if (!isCustom) {
      if (customName.trim() !== exercise.name) {
        finalSettings.customName = customName.trim();
      } else {
        finalSettings.customName = undefined;
      }
    }

    // 1. 설정 저장 (이미지, 표시 여부 등)
    SettingsRepository.saveExerciseSetting(finalSettings);

    // 2. 카테고리 변경 저장
    if (selectedCatId !== exercise.category) {
      SettingsRepository.saveExerciseCategoryOverride(exercise.id, selectedCatId);
      if (onCategoryChanged) onCategoryChanged();
    }

    // 3. 커스텀 운동인 경우 이름 변경 저장
    if (isCustom && customName.trim() !== exercise.name) {
      const updated: CustomExercise = {
        ...exercise,
        name: customName.trim(),
        isCustom: true
      };
      if (selectedCatId !== exercise.category) {
        updated.category = selectedCatId as any;
      }
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
    <>
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

        {/* Category Dropdown */}
        <div className="eem-field">
          <label className="eem-label">소속 부위 변경</label>
          <CustomSelect
            value={selectedCatId}
            onChange={setSelectedCatId}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />
        </div>

        {/* Name */}
        <div className="eem-field">
          <label className="eem-label">운동 이름</label>
          <input
            className="eem-input"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="운동 이름 입력"
          />
        </div>

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
        <button 
          className="eem-save-btn" 
          onClick={handleSave} 
          disabled={isLoading || !customName.trim()}
          style={{ opacity: !customName.trim() ? 0.5 : 1 }}
        >
          저장하기
        </button>

        {/* Delete (custom only) */}
        {isCustom && (
          <button className="eem-delete-btn" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} />
            <span>이 운동 삭제</span>
          </button>
        )}
      </motion.div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDeleteModal
            title="운동 삭제"
            message="정말 이 운동을 삭제하시겠습니까?"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>

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
    </>
  );
};

export default ExerciseEditModal;
