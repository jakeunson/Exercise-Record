import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Timer, Save, Layers, Play } from 'lucide-react';

interface UserGuideModalProps {
  onClose: () => void;
}

const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay" 
        onClick={onClose} 
        style={{ zIndex: 1002 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="exercise-edit-modal"
          onClick={e => e.stopPropagation()}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="eem-header">
            <span className="eem-title">📖 앱 사용 가이드</span>
            <button onClick={onClose} className="eem-close"><X size={18} /></button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <section>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-color)', margin: 0, fontSize: '0.95rem' }}>
                <Layers size={18} /> 커스텀 부위 및 운동
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-color)', lineHeight: 1.6, fontSize: '0.85rem' }}>
                <li style={{ marginBottom: '4px' }}><strong>추가:</strong> 상단의 <span style={{ color: 'var(--accent-color)' }}>+</span> 버튼을 눌러 나만의 운동 부위나 새로운 운동을 추가할 수 있습니다.</li>
                <li><strong>편집 (롱프레스):</strong> 운동이나 부위 카드를 <strong>길게 누르면</strong> 사진 등록, 이름 변경, 부위 이동 등을 할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-color)', margin: 0, fontSize: '0.95rem' }}>
                <Check size={18} /> 운동 기록 방법
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-color)', lineHeight: 1.6, fontSize: '0.85rem' }}>
                <li style={{ marginBottom: '4px' }}>세트를 기록하고 <strong>체크 버튼(V)</strong>을 누르면 완료됩니다.</li>
                <li>세트 옆의 <strong>휴지통 버튼</strong>으로 실수로 기록한 세트를 삭제할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-color)', margin: 0, fontSize: '0.95rem' }}>
                <Timer size={18} /> 휴식 타이머
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-color)', lineHeight: 1.6, fontSize: '0.85rem' }}>
                <li style={{ marginBottom: '4px' }}>설정에서 시간을 맞춰두면 세트 완료 시 <strong>자동으로 실행</strong>됩니다.</li>
                <li>휴식 중 <strong>+30초</strong> 버튼을 눌러 휴식을 연장하거나 <strong>건너뜀</strong> 버튼으로 즉시 종료할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-color)', margin: 0, fontSize: '0.95rem' }}>
                <Save size={18} /> 백업 및 복구
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-color)', lineHeight: 1.6, fontSize: '0.85rem' }}>
                <li style={{ marginBottom: '4px' }}>설정에서 백업 파일을 생성하여 카카오톡 '나에게 보내기' 등으로 저장하세요.</li>
                <li>기기를 변경하더라도 해당 파일을 불러오면 <strong>사진, 설정, 기록까지 100% 복원</strong>됩니다.</li>
              </ul>
            </section>
            
            <section>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-color)', margin: 0, fontSize: '0.95rem' }}>
                <Play size={18} /> 플립 커버 화면 지원
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-color)', lineHeight: 1.6, fontSize: '0.85rem' }}>
                <li>Z 플립을 닫은 상태에서도 풀스크린으로 앱이 완벽 동작합니다. 폰을 열지 않고 간편하게 기록하세요!</li>
              </ul>
            </section>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserGuideModal;
