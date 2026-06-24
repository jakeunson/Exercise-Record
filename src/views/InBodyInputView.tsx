import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera } from 'lucide-react';
import SwipePicker from '../components/SwipePicker';

interface InBodyInputViewProps {
  ibWeight: number;
  ibMuscle: number;
  ibFat: number;
  setIbWeight: (v: number) => void;
  setIbMuscle: (v: number) => void;
  setIbFat: (v: number) => void;
  ibWeightOptions: number[];
  ibMuscleOptions: number[];
  ibFatOptions: number[];
  saveInBody: () => void;
  setStep: (step: any) => void;
}

const InBodyInputView: React.FC<InBodyInputViewProps> = ({
  ibWeight, ibMuscle, ibFat,
  setIbWeight, setIbMuscle, setIbFat,
  ibWeightOptions, ibMuscleOptions, ibFatOptions,
  saveInBody, setStep
}) => {
  return (
    <motion.div
      key="inbody"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="step-container"
      style={{ overflowY: 'auto' }}
    >
      <header className="record-header">
        <button onClick={() => setStep('inbody_list')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>인바디 기록 추가</h1>
        <div className="header-right" />
      </header>
      <div className="record-main compact-pickers">
        <div className="pickers-row">
          <SwipePicker label="체중 (kg)" value={ibWeight} onChange={setIbWeight} options={ibWeightOptions} />
          <SwipePicker label="골격근량 (kg)" value={ibMuscle} onChange={setIbMuscle} options={ibMuscleOptions} />
          <SwipePicker label="체지방률 (%)" value={ibFat} onChange={setIbFat} options={ibFatOptions} />
        </div>

      </div>
      <button className="large-save-btn" style={{ width: '100%' }} onClick={saveInBody}>
        저장하기
      </button>
    </motion.div>
  );
};

export default InBodyInputView;
