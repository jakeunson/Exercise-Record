import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Activity, Trash2, Edit2 } from 'lucide-react';
import type { InBodyRecord } from '../types';
import InBodyChart from '../components/InBodyChart';

interface InBodyListViewProps {
  inBodyHistory: InBodyRecord[];
  setEditingInBody: (record: InBodyRecord) => void;
  setDeletingInBody: (date: string) => void;
  setStep: (step: any) => void;
}

const InBodyListView: React.FC<InBodyListViewProps> = ({
  inBodyHistory,
  setEditingInBody,
  setDeletingInBody,
  setStep
}) => {
  return (
    <motion.div
      key="inbody_list"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="step-container"
      style={{ overflowY: 'auto' }}
    >
      <header className="record-header">
        <button onClick={() => setStep('category')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>인바디 히스토리</h1>
        <div className="header-right">
          <button className="add-btn-small" onClick={() => setStep('inbody')}>
            <Plus size={20} />
          </button>
        </div>
      </header>
      
      <InBodyChart data={inBodyHistory} />

      <div className="history-list">
        {inBodyHistory.length > 0 ? (
          inBodyHistory.map((rec) => (
            <div key={rec.date} className="history-card">
              <div className="card-top">
                <span className="card-date">{rec.date}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="icon-btn edit" onClick={() => setEditingInBody(rec)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="delete-btn" onClick={() => setDeletingInBody(rec.date)}>
                    <Trash2 size={16} color="#ff4444" />
                  </button>
                </div>
              </div>
              <div className="inbody-stats-grid">
                <div className="stat-box">
                  <span className="label">체중</span>
                  <span className="val">{rec.weight}kg</span>
                </div>
                <div className="stat-box">
                  <span className="label">골격근량</span>
                  <span className="val">{rec.skeletalMuscleMass}kg</span>
                </div>
                <div className="stat-box">
                  <span className="label">체지방률</span>
                  <span className="val">{rec.bodyFatPercentage}%</span>
                </div>
              </div>
            </div>
          ))
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
    </motion.div>
  );
};

export default InBodyListView;
