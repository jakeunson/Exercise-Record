import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, ChevronLeft, ChevronRight } from 'lucide-react';

interface InBodyInputViewProps {
  ibWeight: number;
  ibMuscle: number;
  ibFat: number;
  setIbWeight: (v: number) => void;
  setIbMuscle: (v: number) => void;
  setIbFat: (v: number) => void;
  saveInBody: (date: string, w: number, m: number, f: number) => void;
  setStep: (step: any) => void;
}

const InBodyInputView: React.FC<InBodyInputViewProps> = ({
  ibWeight, ibMuscle, ibFat,
  setIbWeight, setIbMuscle, setIbFat,
  saveInBody, setStep
}) => {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  const [focusedField, setFocusedField] = useState<'weight' | 'muscle' | 'fat'>('weight');

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const updateValue = (amount: number) => {
    if (focusedField === 'weight') setIbWeight(Math.max(0, Number((ibWeight + amount).toFixed(1))));
    if (focusedField === 'muscle') setIbMuscle(Math.max(0, Number((ibMuscle + amount).toFixed(1))));
    if (focusedField === 'fat') setIbFat(Math.max(0, Number((ibFat + amount).toFixed(1))));
  };

  return (
    <motion.div
      key="inbody_input"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="step-container"
    >
      <header className="record-header">
        <button onClick={() => setStep('inbody_list')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>인바디 기록 추가</h1>
        <div className="header-right" />
      </header>

      <div className="view-scroll-content">
        <div className="record-main" style={{ display: 'flex', flexDirection: 'column', padding: '0 4px', gap: '16px' }}>
        
        {/* Date Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <button className="icon-btn edit" onClick={() => changeDate(-1)}><ChevronLeft size={20} /></button>
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{date}</span>
          <button className="icon-btn edit" onClick={() => changeDate(1)}><ChevronRight size={20} /></button>
        </div>

        {/* Value Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div 
            className={`quick-field ${focusedField === 'weight' ? 'active' : ''}`}
            onClick={() => setFocusedField('weight')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--card-bg)', borderRadius: '16px', border: focusedField === 'weight' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)' }}
          >
            <span style={{ color: 'var(--muted-color)', fontWeight: 600 }}>체중</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>{ibWeight.toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--muted-color)' }}>kg</span></span>
          </div>

          <div 
            className={`quick-field ${focusedField === 'muscle' ? 'active' : ''}`}
            onClick={() => setFocusedField('muscle')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--card-bg)', borderRadius: '16px', border: focusedField === 'muscle' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)' }}
          >
            <span style={{ color: 'var(--muted-color)', fontWeight: 600 }}>골격근량</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>{ibMuscle.toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--muted-color)' }}>kg</span></span>
          </div>

          <div 
            className={`quick-field ${focusedField === 'fat' ? 'active' : ''}`}
            onClick={() => setFocusedField('fat')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--card-bg)', borderRadius: '16px', border: focusedField === 'fat' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)' }}
          >
            <span style={{ color: 'var(--muted-color)', fontWeight: 600 }}>체지방률</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>{ibFat.toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--muted-color)' }}>%</span></span>
          </div>

        </div>

        {/* Quick Pad */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingBottom: '16px' }}>
          <button className="icon-btn edit" style={{ flex: 1, height: '48px', fontSize: '1.1rem', fontWeight: 600, background: 'var(--border-color)' }} onClick={() => updateValue(-1.0)}>-1.0</button>
          <button className="icon-btn edit" style={{ flex: 1, height: '48px', fontSize: '1.1rem', fontWeight: 600, background: 'var(--border-color)' }} onClick={() => updateValue(-0.1)}>-0.1</button>
          <button className="icon-btn edit" style={{ flex: 1, height: '48px', fontSize: '1.1rem', fontWeight: 600, background: 'var(--border-color)' }} onClick={() => updateValue(0.1)}>+0.1</button>
          <button className="icon-btn edit" style={{ flex: 1, height: '48px', fontSize: '1.1rem', fontWeight: 600, background: 'var(--border-color)' }} onClick={() => updateValue(1.0)}>+1.0</button>
        </div>

        <button className="main-btn" style={{ height: '56px', fontSize: '1.1rem' }} onClick={() => saveInBody(date, ibWeight, ibMuscle, ibFat)}>
          <Save size={20} style={{ marginRight: '8px' }} /> 저장하기
        </button>

      </div>
    </div>
  </motion.div>
  );
};

export default InBodyInputView;
