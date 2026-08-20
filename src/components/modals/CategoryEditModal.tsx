import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera as CameraIcon, Trash2, X, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { CategoryItem } from '../../core/types';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface CategoryEditModalProps {
  category: CategoryItem;
  onClose: () => void;
  onSaved: (cat: CategoryItem) => void;
  onDeleted?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const CategoryEditModal: React.FC<CategoryEditModalProps> = ({ 
  category, onClose, onSaved, onDeleted, onMoveUp, onMoveDown 
}) => {
  const [name, setName] = useState(category.name);
  const [showName, setShowName] = useState(category.showName !== false);
  const [customImage, setCustomImage] = useState<string | undefined>(category.customImage);
  const [isLoading, setIsLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        setCustomImage(image.dataUrl);
      }
    } catch (e) {
      console.log('Camera cancelled or failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSaved({
      ...category,
      name: name.trim(),
      showName,
      customImage: customImage || undefined
    });
  };

  return (
    <>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ zIndex: 1002 }}
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
            <span className="eem-title">부위 설정</span>
            <button className="eem-close" onClick={onClose}><X size={18} /></button>
          </div>

          {/* Image Section */}
          <div className="eem-image-section">
            <div className="eem-preview" onClick={() => setShowImagePicker(true)}>
              {customImage ? (
                <img src={customImage} alt="preview" className="eem-preview-img" />
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
            {customImage && (
              <button className="eem-remove-img" onClick={() => setCustomImage(undefined)}>
                <Trash2 size={14} />
                <span>이미지 제거</span>
              </button>
            )}
          </div>

          {/* Name */}
          <div className="eem-field">
            <label className="eem-label">부위 이름</label>
            <input
              className="eem-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="부위 이름 입력"
            />
          </div>

          {/* Show Name Toggle */}
          <div className="eem-toggle-row" onClick={() => setShowName(!showName)}>
            <div className="eem-toggle-info">
              <span className="eem-toggle-title">부위명 표시</span>
              <span className="eem-toggle-desc">운동 선택 화면에서 이름 표시 여부</span>
            </div>
            <div className={`eem-toggle-icon ${showName ? 'on' : 'off'}`}>
              {showName ? <Eye size={18} /> : <EyeOff size={18} />}
            </div>
          </div>

          {/* Order Actions */}
          <div className="eem-field">
            <label className="eem-label">순서 변경</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="eem-save-btn" 
                onClick={onMoveUp} 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
              >
                <ArrowUp size={18} /> 위로
              </button>
              <button 
                className="eem-save-btn" 
                onClick={onMoveDown} 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
              >
                <ArrowDown size={18} /> 아래로
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button 
            className="eem-save-btn" 
            onClick={handleSave} 
            disabled={isLoading || !name.trim()}
            style={{ opacity: !name.trim() ? 0.5 : 1 }}
          >
            저장하기
          </button>

          {/* Delete (custom only) */}
          {category.isCustom && onDeleted && (
            <button className="eem-delete-btn" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={16} />
              <span>이 부위 삭제</span>
            </button>
          )}
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDeleteModal
            title="부위 삭제"
            message="정말 이 부위를 삭제하시겠습니까?"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={onDeleted!}
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
            style={{ zIndex: 1005 }}
          >
            <motion.div
              className="eem-action-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="eem-action-btn" onClick={() => pickImage(CameraSource.Camera)}>
                사진 촬영
              </button>
              <button className="eem-action-btn" onClick={() => pickImage(CameraSource.Photos)}>
                앨범에서 선택
              </button>
              <button className="eem-action-btn eem-action-cancel" onClick={() => setShowImagePicker(false)}>
                취소
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CategoryEditModal;
