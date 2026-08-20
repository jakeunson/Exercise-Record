import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface RestTimerProps {
  duration: number; // seconds
  timerKey: number; // change to restart timer
  onComplete: () => void;
  onSkip: () => void;
  onFinishWorkout?: () => void;
}

const ADD_SECONDS = 30;

const RestTimer: React.FC<RestTimerProps> = ({ duration, timerKey, onComplete, onSkip, onFinishWorkout }) => {
  const [remaining, setRemaining] = useState(duration);
  const [totalDuration, setTotalDuration] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset & start timer whenever key or duration changes
  useEffect(() => {
    setRemaining(duration);
    setTotalDuration(duration);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerKey, duration]);

  const handleAddTime = () => {
    setRemaining(prev => prev + ADD_SECONDS);
    setTotalDuration(prev => prev + ADD_SECONDS);
  };

  // SVG ring geometry — fills the container
  const RING_SIZE = 200;
  const CENTER = RING_SIZE / 2;
  const STROKE = 10;
  const RADIUS = (RING_SIZE - STROKE * 2) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = totalDuration > 0 ? remaining / totalDuration : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <motion.div
      className="rest-timer-modal-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* ── Ring + numbers ── */}
      <div className="rt-ring-wrap">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="rt-ring-svg"
        >
          {/* Background track */}
          <circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
          <motion.circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none"
            stroke="var(--accent-color)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Center text */}
        <div className="rt-center-text">
          <span className="rt-label">휴식 중</span>
          <span className="rt-count">{remaining}</span>
          <span className="rt-unit">초</span>
        </div>
      </div>

      {/* ── Bottom action buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
        <div className="rt-actions" style={{ maxWidth: '100%' }}>
          <button className="rt-add-btn" onClick={handleAddTime}>
            +{ADD_SECONDS}초
          </button>
          <button className="rt-skip-btn" onClick={onSkip}>
            건너뜀
          </button>
        </div>
        {onFinishWorkout && (
          <button className="rt-finish-btn" onClick={onFinishWorkout}>
            운동 종료
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default RestTimer;
