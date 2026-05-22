import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

interface SwipePickerProps {
  value: number;
  onChange: (val: number) => void;
  options: number[];
  label: string;
  step?: number;
}

const SwipePicker: React.FC<SwipePickerProps> = ({ value, onChange, options, label }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_HEIGHT = 50;
  
  const selectedIndex = options.indexOf(value);
  const y = useMotionValue(-selectedIndex * ITEM_HEIGHT);

  const handleDragEnd = (_: any, info: any) => {
    const currentY = y.get();
    const velocity = info.velocity.y;
    
    // Inertia calculation
    const targetY = currentY + velocity * 0.1;
    let newIndex = Math.round(-targetY / ITEM_HEIGHT);
    
    newIndex = Math.max(0, Math.min(newIndex, options.length - 1));
    
    // Snap animation
    animate(y, -newIndex * ITEM_HEIGHT, {
      type: "spring",
      stiffness: 300,
      damping: 30,
      onComplete: () => {
        onChange(options[newIndex]);
      }
    });
  };

  useEffect(() => {
    // Sync y with value when external changes happen (like prev record loading)
    y.set(-selectedIndex * ITEM_HEIGHT);
  }, [value, selectedIndex]);

  return (
    <div className="picker-container">
      <div className="picker-label">{label}</div>
      <div className="picker-viewport" ref={containerRef}>
        <div className="picker-selection-overlay" />
        <motion.div
          className="picker-list"
          drag="y"
          dragConstraints={{
            top: -(options.length - 1) * ITEM_HEIGHT,
            bottom: 0,
          }}
          onDragEnd={handleDragEnd}
          style={{ y }}
        >
          {options.map((opt, i) => (
            <div
              key={i}
              className={`picker-item ${opt === value ? 'active' : ''}`}
              style={{ height: ITEM_HEIGHT }}
            >
              {opt}
            </div>
          ))}
        </motion.div>
      </div>
      <style>{`
        .picker-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .picker-label {
          font-size: 0.65rem;
          color: var(--muted-color);
          text-transform: uppercase;
          letter-spacing: 0.05rem;
        }
        .picker-viewport {
          position: relative;
          width: 100%;
          height: 150px;
          overflow: hidden;
          background: var(--card-bg);
          border-radius: 12px;
          display: flex;
          justify-content: center;
          cursor: grab;
        }
        .picker-viewport:active {
          cursor: grabbing;
        }
        .picker-selection-overlay {
          position: absolute;
          top: 50px;
          left: 10px;
          right: 10px;
          height: 50px;
          background: rgba(255, 255, 255, 0.05);
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          pointer-events: none;
          z-index: 2;
        }
        .picker-list {
          padding-top: 50px;
          padding-bottom: 50px;
          width: 100%;
        }
        .picker-item {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--muted-color);
          transition: color 0.2s, font-size 0.2s;
        }
        .picker-item.active {
          color: var(--fg-color);
          font-size: 1.8rem;
        }
      `}</style>
    </div>
  );
};

export default SwipePicker;
