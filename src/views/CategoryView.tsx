import React from 'react';
import { motion } from 'framer-motion';
import { Activity, History, Settings, Plus } from 'lucide-react';
import type { CategoryItem, WorkoutSession, Exercise } from '../core/types';
import HeatmapWidget from '../components/HeatmapWidget';
import BadgeShowcase from '../components/BadgeShowcase';

interface CategoryViewProps {
  categories: CategoryItem[];
  activeCategories: Set<string>;
  selectCategory: (catId: string) => void;
  setStep: (step: any) => void;
  historySessions: WorkoutSession[];
  allExercises: Exercise[];
  onAddCategory: () => void;
  onEditCategory: (cat: CategoryItem) => void;
}

const CategoryView: React.FC<CategoryViewProps> = ({
  categories,
  activeCategories,
  selectCategory,
  setStep,
  historySessions,
  allExercises,
  onAddCategory,
  onEditCategory
}) => {
  // 롱프레스 로직
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLongPressStart = (cat: CategoryItem) => {
    pressTimer.current = setTimeout(() => {
      onEditCategory(cat);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 600);
  };

  const handleLongPressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // categories sort by order
  const sortedCategories = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <motion.div
      key="category"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="step-container"
      style={{ overflowY: 'auto' }}
    >
      <header className="home-header">
        <div className="title-area">
          <h1>운동 기록</h1>
          <p>부위를 선택하세요</p>
        </div>
        <div className="header-actions">
          <button className="icon-trigger" onClick={onAddCategory}>
            <Plus size={22} />
          </button>
          <button className="icon-trigger" onClick={() => setStep('inbody_list')}>
            <Activity size={22} />
          </button>
          <button className="icon-trigger" onClick={() => setStep('history')}>
            <History size={22} />
          </button>
          <button className="icon-trigger" onClick={() => setStep('settings')}>
            <Settings size={22} />
          </button>
        </div>
      </header>

      {/* 카테고리 그리드 */}
      <div className="exercise-grid" style={{ paddingBottom: 0 }}>
        {sortedCategories.map((cat) => {
          const isActive = activeCategories.has(cat.id);
          const hasImage = !!cat.customImage;
          const showName = cat.showName !== false;

          return (
            <button
              key={cat.id}
              className={`exercise-square ${cat.isCustom ? 'custom-ex' : ''} ${isActive ? 'active-workout' : ''}`}
              onClick={() => selectCategory(cat.id)}
              onMouseDown={() => handleLongPressStart(cat)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(cat)}
              onTouchEnd={handleLongPressEnd}
            >
              {hasImage && (
                <img src={cat.customImage} alt={cat.name} className="ex-custom-img" />
              )}
              {showName && (
                <span className={hasImage ? 'ex-name-overlay' : ''}>{cat.name}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="home-dashboard">
        <HeatmapWidget sessions={historySessions} allExercises={allExercises} />
        <BadgeShowcase sessions={historySessions} allExercises={allExercises} />
      </div>
    </motion.div>
  );
};

export default CategoryView;
