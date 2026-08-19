import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progress = duration > 0 ? remaining / duration : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      className="rest-timer-modal-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="rest-timer-content-box">
        {/* Left: Circular Ring Timer */}
        <div className="timer-ring-wrap-large">
          <svg width={94} height={94} viewBox="0 0 94 94">
            <circle
              cx={47} cy={47} r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={7}
            />
            <motion.circle
              cx={47} cy={47} r={radius}
              fill="none"
              stroke="var(--accent-color)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 47 47)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="timer-count-large">{remaining}</span>
        </div>

        {/* Middle: Timer Info */}
        <div className="timer-info-large">
          <span className="timer-label-large">휴식 중</span>
          <span className="timer-sub-large">세트 간 휴식 타이머</span>
        </div>

        {/* Right: Skip Button */}
        <button className="timer-skip-btn-large" onClick={onSkip}>
          건너뜀
        </button>
      </div>
    </motion.div>
  );
};

export default RestTimer;
