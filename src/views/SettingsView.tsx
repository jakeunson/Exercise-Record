import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Share2, Upload } from 'lucide-react';

const THEMES = [
  { name: 'Spring Green', color: '#00E676' },
  { name: 'Neon Blue',    color: '#00B0FF' },
  { name: 'Violet',       color: '#CE93D8' },
  { name: 'Sunset',       color: '#FF6E40' },
  { name: 'Volt Yellow',  color: '#D4E157' },
];

const TIMER_OPTIONS = [
  { label: 'OFF', value: 0 },
  { label: '30초', value: 30 },
  { label: '60초', value: 60 },
  { label: '90초', value: 90 },
  { label: '2분', value: 120 },
];

interface SettingsViewProps {
  accentColor: string;
  applyTheme: (color: string) => void;
  timerDuration: number;
  setTimerDuration: (val: number) => void;
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importStatus: 'idle' | 'success' | 'error';
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setStep: (step: any) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  accentColor, applyTheme,
  timerDuration, setTimerDuration,
  handleExport, handleImport, importStatus,
  fileInputRef, setStep
}) => {
  return (
    <motion.div
      key="settings"
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
        <h1>설정</h1>
        <div className="header-right" />
      </header>
      
      <div className="settings-list">
        {/* Feature 4: Theme */}
        <div className="settings-section">
          <h2>테마 컬러</h2>
          <p>앱 전체 강조 컬러를 변경합니다.</p>
          <div className="theme-palettes">
            {THEMES.map(t => (
              <button
                key={t.color}
                className={`theme-dot ${accentColor === t.color ? 'active' : ''}`}
                style={{ background: t.color }}
                onClick={() => applyTheme(t.color)}
                title={t.name}
              />
            ))}
          </div>
        </div>

        {/* Feature 1: Timer Duration */}
        <div className="settings-section">
          <h2>휴식 타이머</h2>
          <p>세트 저장 후 자동 시작되는 휴식 타이머 시간을 설정합니다.</p>
          <div className="timer-options">
            {TIMER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`timer-opt-btn ${timerDuration === opt.value ? 'active' : ''}`}
                onClick={() => setTimerDuration(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Backup */}
        <div className="settings-section">
          <h2>데이터 백업 및 복구</h2>
          <p>다른 기기로 데이터를 이동하거나<br/>현재 데이터를 안전하게 보관하세요.</p>
          
          <div className="settings-actions">
            <button className="settings-btn export" onClick={handleExport}>
              <Download size={20} />
              <span>백업 파일 내보내기</span>
            </button>
            
            <button className="settings-btn import" onClick={() => fileInputRef.current?.click()}>
              <Upload size={20} />
              <span>백업 파일 불러오기</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json"
              onChange={handleImport}
            />
          </div>

          {importStatus === 'success' && (
            <div className="status-msg success">데이터가 성공적으로 복구되었습니다!</div>
          )}
          {importStatus === 'error' && (
            <div className="status-msg error">파일 형식이 잘못되었습니다. 다시 확인해주세요.</div>
          )}
        </div>

        <div className="settings-info">
          <Share2 size={16} />
          <span>백업 파일(.json)을 카카오톡 나에게 보내기 등으로 공유한 뒤, 다른 기기에서 불러오시면 됩니다.</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsView;
