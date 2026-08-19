import React, { useMemo } from 'react';
import type { WorkoutSession, Exercise } from '../types';

interface BadgeShowcaseProps {
  sessions: WorkoutSession[];
  allExercises: Exercise[];
}

const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ sessions, allExercises }) => {
  const badges = useMemo(() => {
    const today = new Date();
    // 1. Sort unique dates
    const uniqueDates = Array.from(new Set(sessions.map(s => s.date))).sort();
    
    // 2. Calculate CURRENT streak (not max streak)
    let currentStreak = 0;
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    // 역순(최신순)으로 정렬하여 현재 스트릭 계산
    const sortedDatesDesc = [...uniqueDates].sort((a, b) => b.localeCompare(a));
    if (sortedDatesDesc.includes(todayStr) || sortedDatesDesc.includes(yesterdayStr)) {
      currentStreak = 1;
      let checkDate = new Date(sortedDatesDesc[0]); // 가장 최근 운동일 (오늘 아니면 어제)
      for (let i = 1; i < sortedDatesDesc.length; i++) {
        const prevDate = new Date(sortedDatesDesc[i]);
        const diffTime = Math.abs(checkDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
          checkDate = prevDate;
        } else {
          break; // 연속이 끊김
        }
      }
    }

    // 3. 이번 주 데이터 필터링 (일요일 기준)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
    
    const thisWeekSessions = sessions.filter(s => s.date >= startOfWeekStr && s.date <= todayStr);
    const thisWeekDays = new Set(thisWeekSessions.map(s => s.date)).size;
    
    // 이번 주 총 볼륨
    let thisWeekVolume = 0;
    thisWeekSessions.forEach(session => {
      const ex = allExercises.find(e => e.id === session.exerciseId);
      if (ex?.category !== 'cardio') {
        thisWeekVolume += session.sets.reduce((a, s) => a + s.subSets.reduce((x, y) => x + y.weight * y.reps, 0), 0);
      }
    });

    // 4. 최근 7일 이내 유산소 여부
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;
    const recentCardio = sessions.some(s => {
      if (s.date >= weekAgoStr) {
        const ex = allExercises.find(e => e.id === s.exerciseId);
        return ex?.category === 'cardio';
      }
      return false;
    });

    // 5. Calculate this month's consistency
    const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const daysThisMonth = uniqueDates.filter(d => d.startsWith(currentMonthPrefix)).length;

    return [
      { id: 'streak', icon: '🔥', name: '버닝 중', desc: '현재 3일 이상 연속 운동 중 (쉬면 꺼짐!)', earned: currentStreak >= 3 },
      { id: 'week3', icon: '🏃', name: '주 3회', desc: '이번 주 3회 출석 (매주 일요일 리셋)', earned: thisWeekDays >= 3 },
      { id: 'weekvol', icon: '💪', name: '주간 10톤', desc: '이번 주 누적 볼륨 10,000kg (매주 리셋)', earned: thisWeekVolume >= 10000 },
      { id: 'recent_cardio', icon: '💧', name: '유산소 유지', desc: '최근 7일 이내 유산소 달성 (7일 지나면 꺼짐!)', earned: recentCardio },
      { id: 'month15', icon: '📅', name: '이달의 우수생', desc: '이번 달 15일 이상 출석 (매월 1일 리셋)', earned: daysThisMonth >= 15 },
    ];
  }, [sessions, allExercises]);

  return (
    <div className="badge-showcase">
      <div className="badge-grid">
        {badges.map(b => (
          <div key={b.id} className={`badge-item ${b.earned ? 'earned' : 'locked'}`} title={`${b.name} - ${b.desc}`}>
            <div className="badge-icon">{b.icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeShowcase;
