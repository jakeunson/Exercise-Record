import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RestTimerProps {
  duration: number; // seconds
  timerKey: number; // change to restart timer
  onComplete: () => void;
  onSkip: () => void;
}

const RestTimer: React.FC<RestTimerProps> = ({ duration, timerKey, onComplete, onSkip }) => {
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset & start timer whenever key or duration changes
  useEffect(() => {
    setRemaining(duration);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          // vibrate on complete
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

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / duration;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      <motion.div
        className="rest-timer-bar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <div className="timer-ring-wrap">
          <svg width={68} height={68} viewBox="0 0 68 68">
            {/* Background circle */}
            <circle
              cx={34} cy={34} r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={5}
            />
            {/* Progress circle */}
            <motion.circle
              cx={34} cy={34} r={radius}
              fill="none"
              stroke="var(--accent-color)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 34 34)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="timer-count">{remaining}</span>
        </div>

        <div className="timer-info">
          <span className="timer-label">휴식 중</span>
          <span className="timer-sub">세트 간 휴식 타이머</span>
        </div>

        <button className="timer-skip-btn" onClick={onSkip}>
          건너뜀
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default RestTimer;
