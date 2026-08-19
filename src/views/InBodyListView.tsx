import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { InBodyRecord, UserProfile } from '../types';
import InBodyChart from '../components/InBodyChart';

interface InBodyListViewProps {
  userProfile: UserProfile;
  inBodyHistory: InBodyRecord[];
  updateInBody: (oldDate: string, record: InBodyRecord) => void;
  setDeletingInBody: (date: string) => void;
  setStep: (step: any) => void;
}

// --- C-I-D 알고리즘 헬퍼 ---
const getBodyType = (rec: InBodyRecord, profile: UserProfile) => {
  const gender = profile.gender || 'male'; // fallback
  const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : 30; // fallback 30s
  
  // 1. 체지방률 평가
  let fatStatus: 'low' | 'normal' | 'high' = 'normal';
  if (gender === 'male') {
    let min = 14, max = 24;
    if (age < 30) { min = 12; max = 22; }
    else if (age >= 40) { min = 16; max = 26; }
    
    if (rec.bodyFatPercentage < min) fatStatus = 'low';
    else if (rec.bodyFatPercentage > max) fatStatus = 'high';
  } else {
    let min = 22, max = 32;
    if (age < 30) { min = 20; max = 30; }
    else if (age >= 40) { min = 24; max = 34; }
    
    if (rec.bodyFatPercentage < min) fatStatus = 'low';
    else if (rec.bodyFatPercentage > max) fatStatus = 'high';
  }

  // 2. 골격근량 평가
  const muscleRatio = rec.skeletalMuscleMass / rec.weight;
  let muscleStatus: 'low' | 'good' = 'low';
  if (gender === 'male' && muscleRatio >= 0.38) muscleStatus = 'good';
  if (gender === 'female' && muscleRatio >= 0.30) muscleStatus = 'good';

  // 3. C-I-D 판별
  if (muscleStatus === 'good' && (fatStatus === 'low' || fatStatus === 'normal')) return 'D';
  if (fatStatus === 'high' || muscleStatus === 'low') return 'C';
  return 'I';
};

const DeltaBadge = ({ value, invertColors = false }: { value: number, invertColors?: boolean }) => {
  if (value === 0) return <span style={{ color: 'var(--muted-color)', fontSize: '0.75rem' }}>-</span>;
  const isPositive = value > 0;
  // invertColors가 true이면(예: 체지방) 양수(+)가 나쁜 것(빨강), 음수(-)가 좋은 것(초록)
  const isGood = invertColors ? !isPositive : isPositive;
  const color = isGood ? 'var(--accent-color)' : '#ff4444';
  const sign = isPositive ? '+' : '';
  
  return (
    <span style={{ color, fontSize: '0.75rem', fontWeight: 600 }}>
      {sign}{value.toFixed(1)} {isPositive ? '▲' : '▼'}
    </span>
  );
};

const InBodySessionCard: React.FC<{
  rec: InBodyRecord;
  prevRec?: InBodyRecord;
  userProfile: UserProfile;
  isMaxMuscle: boolean;
  onUpdate: (oldDate: string, updated: InBodyRecord) => void;
  onDelete: (date: string) => void;
}> = ({ rec, prevRec, userProfile, isMaxMuscle, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  
  // 퀵 에디트용 로컬 상태
  const [localDate, setLocalDate] = useState(rec.date);
  const [localWeight, setLocalWeight] = useState(rec.weight);
  const [localMuscle, setLocalMuscle] = useState(rec.skeletalMuscleMass);
  const [localFat, setLocalFat] = useState(rec.bodyFatPercentage);

  const bodyType = getBodyType(rec, userProfile);
  let typeLabel = '';
  let typeColor = '';
  if (bodyType === 'D') { typeLabel = '강인형'; typeColor = '#FFD700'; }
  else if (bodyType === 'I') { typeLabel = '표준형'; typeColor = 'var(--accent-color)'; }
  else { typeLabel = '체지방형'; typeColor = '#ff4444'; }

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(rec.date, {
      date: localDate,
      weight: localWeight,
      skeletalMuscleMass: localMuscle,
      bodyFatPercentage: localFat
    });
    setExpanded(false);
  };

  const changeDateByDays = (e: React.MouseEvent, days: number) => {
    e.stopPropagation();
    const d = new Date(localDate);
    d.setDate(d.getDate() + days);
    setLocalDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  return (
    <div className="history-card-wrapper" style={{ marginBottom: '8px' }}>
      <div
        className="history-card"
        style={{ background: 'var(--card-bg)', margin: 0, borderRadius: '16px', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="card-top" style={{ paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="card-date" style={{ fontSize: '1.1rem' }}>{rec.date}</span>
            <div style={{ padding: '2px 8px', borderRadius: '12px', background: `${typeColor}20`, color: typeColor, fontSize: '0.75rem', fontWeight: 700 }}>
              {bodyType}타입 ({typeLabel})
            </div>
            {isMaxMuscle && <span title="역대 최고 골격근량" style={{ fontSize: '1.2rem' }}>🏆</span>}
          </div>
          <button className="icon-btn edit">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        <div className="inbody-stats-grid">
          <div className="stat-box">
            <span className="label">체중</span>
            <span className="val">{rec.weight.toFixed(1)}kg</span>
            {prevRec && <DeltaBadge value={rec.weight - prevRec.weight} invertColors={true} />}
          </div>
          <div className="stat-box">
            <span className="label">골격근</span>
            <span className="val">{rec.skeletalMuscleMass.toFixed(1)}kg</span>
            {prevRec && <DeltaBadge value={rec.skeletalMuscleMass - prevRec.skeletalMuscleMass} />}
          </div>
          <div className="stat-box">
            <span className="label">체지방</span>
            <span className="val">{rec.bodyFatPercentage.toFixed(1)}%</span>
            {prevRec && <DeltaBadge value={rec.bodyFatPercentage - prevRec.bodyFatPercentage} invertColors={true} />}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}
              onClick={(e) => e.stopPropagation()}
            >
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted-color)' }}>날짜 변경</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="icon-btn" onClick={(e) => changeDateByDays(e, -1)}><ArrowLeft size={18} /></button>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{localDate}</span>
                  <button className="icon-btn" onClick={(e) => changeDateByDays(e, 1)}><ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} /></button>
                </div>
              </div>

              {[
                { label: '체중', val: localWeight, set: setLocalWeight, unit: 'kg' },
                { label: '골격근', val: localMuscle, set: setLocalMuscle, unit: 'kg' },
                { label: '체지방', val: localFat, set: setLocalFat, unit: '%' }
              ].map((field, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--muted-color)', width: '60px' }}>{field.label}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, width: '60px', textAlign: 'center' }}>{field.val.toFixed(1)}{field.unit}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="icon-btn edit" style={{ width: '36px', height: '36px', fontSize: '0.8rem', fontWeight: 600, background: 'var(--border-color)', borderRadius: '8px' }} onClick={() => field.set(Math.max(0, Number((field.val - 0.5).toFixed(1))))}>-.5</button>
                    <button className="icon-btn edit" style={{ width: '36px', height: '36px', fontSize: '0.8rem', fontWeight: 600, background: 'var(--border-color)', borderRadius: '8px' }} onClick={() => field.set(Math.max(0, Number((field.val - 0.1).toFixed(1))))}>-.1</button>
                    <button className="icon-btn edit" style={{ width: '36px', height: '36px', fontSize: '0.8rem', fontWeight: 600, background: 'var(--border-color)', borderRadius: '8px' }} onClick={() => field.set(Number((field.val + 0.1).toFixed(1)))}>+.1</button>
                    <button className="icon-btn edit" style={{ width: '36px', height: '36px', fontSize: '0.8rem', fontWeight: 600, background: 'var(--border-color)', borderRadius: '8px' }} onClick={() => field.set(Number((field.val + 0.5).toFixed(1)))}>+.5</button>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(rec.date);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 68, 68, 0.1)',
                    border: '1px solid rgba(255, 68, 68, 0.25)',
                    color: '#ff4444',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={15} />
                  <span>기록 삭제</span>
                </button>

                <button 
                  className="main-btn" 
                  style={{ padding: '8px 20px', fontSize: '0.85rem', width: 'auto', borderRadius: '10px' }}
                  onClick={handleApply}
                >
                  수정 적용
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const InBodyListView: React.FC<InBodyListViewProps> = ({
  userProfile,
  inBodyHistory,
  updateInBody,
  setDeletingInBody,
  setStep
}) => {
  // 최고 골격근량 찾기
  const maxMuscle = inBodyHistory.reduce((max, rec) => Math.max(max, rec.skeletalMuscleMass), 0);

  // 내림차순 정렬 (최신이 먼저)
  const sortedHistory = [...inBodyHistory].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <motion.div
      key="inbody_list"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="step-container"
    >
      <header className="record-header">
        <button onClick={() => setStep('category')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>인바디 분석</h1>
        <div className="header-right">
          <button className="finish-top-btn" onClick={() => setStep('inbody')}>
            기록 추가
          </button>
        </div>
      </header>
      
      <div className="view-scroll-content">
        <InBodyChart data={inBodyHistory} userProfile={userProfile} />

        <div className="history-list">
          {sortedHistory.length > 0 ? (
            sortedHistory.map((rec, i) => {
              const prevRec = i < sortedHistory.length - 1 ? sortedHistory[i + 1] : undefined;
              return (
                <InBodySessionCard 
                  key={rec.date} 
                  rec={rec} 
                  prevRec={prevRec} 
                  userProfile={userProfile}
                  isMaxMuscle={rec.skeletalMuscleMass === maxMuscle && maxMuscle > 0}
                  onUpdate={updateInBody}
                  onDelete={setDeletingInBody}
                />
              );
            })
          ) : (
            <div className="empty-state">
              <Activity size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p>기록된 인바디가 없습니다.</p>
              <button className="main-btn" style={{ marginTop: 20 }} onClick={() => setStep('inbody')}>
                첫 기록 추가하기
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InBodyListView;
