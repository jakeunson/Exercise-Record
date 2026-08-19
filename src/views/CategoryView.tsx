import React from 'react';
import { motion } from 'framer-motion';
import { Activity, History, Settings } from 'lucide-react';
import { CATEGORIES } from '../types';
import type { Category, WorkoutSession, Exercise } from '../types';
import HeatmapWidget from '../components/HeatmapWidget';
import BadgeShowcase from '../components/BadgeShowcase';

const CATEGORY_IMAGES: Record<string, string> = {
  chest: '/category_icons/chest.jpg',
  back: '/category_icons/back.jpg',
  legs: '/category_icons/legs.jpg',
  shoulders: '/category_icons/shoulders.jpg',
  arms: '/category_icons/arms.jpg',
  cardio: '/category_icons/cardio.jpg',
};

interface CategoryViewProps {
  activeCategories: Set<Category>;
  selectCategory: (cat: Category) => void;
  setStep: (step: any) => void;
  historySessions: WorkoutSession[];
  allExercises: Exercise[];
}

const CategoryView: React.FC<CategoryViewProps> = ({
  activeCategories,
  selectCategory,
  setStep,
  historySessions,
  allExercises
}) => {
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
      <div className="category-grid">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategories.has(cat.id);
          return (
            <button
              key={cat.id}
              className={`category-square image-btn ${isActive ? 'active-category' : ''}`}
              onClick={() => selectCategory(cat.id)}
            >
              <img src={CATEGORY_IMAGES[cat.id]} alt={cat.name} className="cat-img" />
              <div className="cat-overlay">
                <span>{cat.name}</span>
              </div>
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
