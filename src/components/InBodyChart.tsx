import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InBodyRecord, UserProfile } from '../types';
import CustomSelect from './CustomSelect';

interface InBodyChartProps {
  data: InBodyRecord[];
  userProfile?: UserProfile;
}

type TabType = 'all' | 'weight' | 'muscle' | 'fat';
type PeriodType = '1M' | '3M' | '6M' | 'ALL';

const InBodyChart: React.FC<InBodyChartProps> = ({ data, userProfile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [period, setPeriod] = useState<PeriodType>('ALL');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const metricOptions: { id: TabType; label: string }[] = [
    { id: 'all', label: '전체 종합' },
    { id: 'weight', label: '체중 (kg)' },
    { id: 'muscle', label: '골격근량 (kg)' },
    { id: 'fat', label: '체지방률 (%)' },
  ];

  const periodOptions: { id: PeriodType; label: string }[] = [
    { id: 'ALL', label: '전체 기간' },
    { id: '1M', label: '최근 1개월' },
    { id: '3M', label: '최근 3개월' },
    { id: '6M', label: '최근 6개월' },
  ];

  // 1. Sort all data ascending by date
  const sortedAllData = useMemo(() => {
    return [...data].sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  // 2. Filter data by period
  const activeData = useMemo(() => {
    if (sortedAllData.length < 2) return sortedAllData;
    if (period === 'ALL') return sortedAllData;

    const now = new Date();
    const cutoff = new Date(now);
    if (period === '1M') cutoff.setMonth(now.getMonth() - 1);
    else if (period === '3M') cutoff.setMonth(now.getMonth() - 3);
    else if (period === '6M') cutoff.setMonth(now.getMonth() - 6);

    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    const filtered = sortedAllData.filter(d => d.date >= cutoffStr);
    
    // If filtered data has fewer than 2 points, fallback to all data to maintain graph continuity
    return filtered.length >= 2 ? filtered : sortedAllData;
  }, [sortedAllData, period]);

  // 3. Calculate standard ranges based on userProfile
  const standardRanges = useMemo(() => {
    const gender = userProfile?.gender || 'male';
    const age = userProfile?.birthYear ? new Date().getFullYear() - userProfile.birthYear : 30;

    let fatMin = 14, fatMax = 24;
    if (gender === 'male') {
      if (age < 30) { fatMin = 12; fatMax = 22; }
      else if (age >= 40) { fatMin = 16; fatMax = 26; }
    } else {
      if (age < 30) { fatMin = 20; fatMax = 30; }
      else if (age >= 40) { fatMin = 24; fatMax = 34; }
      else { fatMin = 22; fatMax = 32; }
    }

    const latestWeight = activeData.length > 0 ? activeData[activeData.length - 1].weight : 70;
    const muscleMin = Number((latestWeight * (gender === 'male' ? 0.32 : 0.25)).toFixed(1));
    const muscleMax = Number((latestWeight * (gender === 'male' ? 0.42 : 0.35)).toFixed(1));

    return { fatMin, fatMax, muscleMin, muscleMax };
  }, [userProfile, activeData]);

  if (data.length < 2) {
    return (
      <div className="chart-empty">
        데이터가 2개 이상 쌓이면 그래프와 분석 리포트가 나타납니다.
      </div>
    );
  }

  const width = 320;
  const height = 150;
  const paddingX = 20;
  const paddingY = 24;

  // Chart point calculator with standard zone inclusion
  const getPoints = (key: keyof Pick<InBodyRecord, 'weight' | 'skeletalMuscleMass' | 'bodyFatPercentage'>) => {
    const values = activeData.map(d => d[key] as number);
    let min = Math.min(...values);
    let max = Math.max(...values);

    // Expand min/max so standard zone fits visually on screen
    if (key === 'bodyFatPercentage' && activeTab === 'fat') {
      min = Math.min(min, standardRanges.fatMin - 2);
      max = Math.max(max, standardRanges.fatMax + 2);
    } else if (key === 'skeletalMuscleMass' && activeTab === 'muscle') {
      min = Math.min(min, standardRanges.muscleMin - 1);
      max = Math.max(max, standardRanges.muscleMax + 1);
    }

    const range = max - min || 1;

    const points = activeData.map((d, i) => ({
      x: paddingX + (i * (width - paddingX * 2)) / (activeData.length - 1),
      y: height - paddingY - (((d[key] as number) - min) * (height - paddingY * 2)) / range,
      val: d[key] as number,
      date: d.date
    }));

    const getYForValue = (v: number) => {
      return height - paddingY - ((v - min) * (height - paddingY * 2)) / range;
    };

    return { points, min, max, getYForValue };
  };

  const weightData = getPoints('weight');
  const muscleData = getPoints('skeletalMuscleMass');
  const fatData = getPoints('bodyFatPercentage');

  const createPath = (points: { x: number, y: number }[]) => {
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  };

  const firstRec = activeData[0];
  const lastRec = activeData[activeData.length - 1];

  // Helper for Hero Stats
  const renderHeroStats = () => {
    if (activeTab === 'weight') {
      const diff = Number((lastRec.weight - firstRec.weight).toFixed(1));
      const minW = Math.min(...activeData.map(d => d.weight)).toFixed(1);
      const maxW = Math.max(...activeData.map(d => d.weight)).toFixed(1);
      const isDown = diff <= 0;
      return (
        <div className="hero-stat-card">
          <div className="hero-stat-main">
            <span className="hero-label">현재 체중</span>
            <div className="hero-value-row">
              <span className="hero-value">{lastRec.weight.toFixed(1)}<span className="unit">kg</span></span>
              <span className={`hero-delta ${isDown ? 'good' : 'neutral'}`}>
                시작 대비 {diff > 0 ? `+${diff}` : diff}kg {diff < 0 ? '🔻' : diff > 0 ? '🔺' : ''}
              </span>
            </div>
          </div>
          <div className="hero-sub-stats">
            <span>최저 <strong>{minW}</strong></span>
            <span>최고 <strong>{maxW}</strong></span>
          </div>
        </div>
      );
    }

    if (activeTab === 'muscle') {
      const diff = Number((lastRec.skeletalMuscleMass - firstRec.skeletalMuscleMass).toFixed(1));
      const minM = Math.min(...activeData.map(d => d.skeletalMuscleMass)).toFixed(1);
      const maxM = Math.max(...activeData.map(d => d.skeletalMuscleMass)).toFixed(1);
      const isUp = diff >= 0;
      return (
        <div className="hero-stat-card">
          <div className="hero-stat-main">
            <span className="hero-label">현재 골격근량</span>
            <div className="hero-value-row">
              <span className="hero-value" style={{ color: 'var(--accent-color)' }}>
                {lastRec.skeletalMuscleMass.toFixed(1)}<span className="unit">kg</span>
              </span>
              <span className={`hero-delta ${isUp ? 'good' : 'bad'}`}>
                시작 대비 {diff > 0 ? `+${diff}` : diff}kg {diff > 0 ? '🔺' : diff < 0 ? '🔻' : ''}
              </span>
            </div>
          </div>
          <div className="hero-sub-stats">
            <span>최저 <strong>{minM}</strong></span>
            <span>최고 <strong>{maxM}</strong></span>
          </div>
        </div>
      );
    }

    if (activeTab === 'fat') {
      const diff = Number((lastRec.bodyFatPercentage - firstRec.bodyFatPercentage).toFixed(1));
      const minF = Math.min(...activeData.map(d => d.bodyFatPercentage)).toFixed(1);
      const maxF = Math.max(...activeData.map(d => d.bodyFatPercentage)).toFixed(1);
      const isDown = diff <= 0;
      return (
        <div className="hero-stat-card">
          <div className="hero-stat-main">
            <span className="hero-label">현재 체지방률</span>
            <div className="hero-value-row">
              <span className="hero-value" style={{ color: '#FF7043' }}>
                {lastRec.bodyFatPercentage.toFixed(1)}<span className="unit">%</span>
              </span>
              <span className={`hero-delta ${isDown ? 'good' : 'bad'}`}>
                시작 대비 {diff > 0 ? `+${diff}` : diff}% {diff < 0 ? '🔻' : diff > 0 ? '🔺' : ''}
              </span>
            </div>
          </div>
          <div className="hero-sub-stats">
            <span>최저 <strong>{minF}</strong></span>
            <span>최고 <strong>{maxF}</strong></span>
          </div>
        </div>
      );
    }

    // ALL tab summary
    const wDiff = Number((lastRec.weight - firstRec.weight).toFixed(1));
    const mDiff = Number((lastRec.skeletalMuscleMass - firstRec.skeletalMuscleMass).toFixed(1));
    const fDiff = Number((lastRec.bodyFatPercentage - firstRec.bodyFatPercentage).toFixed(1));

    return (
      <div className="hero-stat-grid-all">
        <div className="hero-mini-box">
          <span className="label">체중</span>
          <span className="val">{lastRec.weight.toFixed(1)}kg</span>
          <span className={`delta ${wDiff <= 0 ? 'good' : 'neutral'}`}>{wDiff > 0 ? `+${wDiff}` : wDiff}</span>
        </div>
        <div className="hero-mini-box">
          <span className="label">골격근</span>
          <span className="val" style={{ color: 'var(--accent-color)' }}>{lastRec.skeletalMuscleMass.toFixed(1)}kg</span>
          <span className={`delta ${mDiff >= 0 ? 'good' : 'bad'}`}>{mDiff > 0 ? `+${mDiff}` : mDiff}</span>
        </div>
        <div className="hero-mini-box">
          <span className="label">체지방</span>
          <span className="val" style={{ color: '#FF7043' }}>{lastRec.bodyFatPercentage.toFixed(1)}%</span>
          <span className={`delta ${fDiff <= 0 ? 'good' : 'bad'}`}>{fDiff > 0 ? `+${fDiff}` : fDiff}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="inbody-chart-container">
      {/* Top Filter Controls: Custom Dark Dropdowns */}
      <div className="chart-select-controls">
        {/* Metric Dropdown */}
        <CustomSelect
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val as TabType);
            setHoverIdx(null);
          }}
          options={metricOptions.map(o => ({ value: o.id, label: o.label }))}
        />

        {/* Period Dropdown */}
        <CustomSelect
          value={period}
          onChange={(val) => {
            setPeriod(val as PeriodType);
            setHoverIdx(null);
          }}
          options={periodOptions.map(o => ({ value: o.id, label: o.label }))}
        />
      </div>

      {/* Hero Summary Stats (Feature 1) */}
      {renderHeroStats()}

      {/* SVG Chart Area */}
      <div style={{ position: 'relative', marginTop: '12px' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          
          {/* Feature 4: Standard Range Zone Band */}
          {activeTab === 'fat' && (
            <g className="standard-zone">
              {(() => {
                const yTop = fatData.getYForValue(standardRanges.fatMax);
                const yBottom = fatData.getYForValue(standardRanges.fatMin);
                const zoneHeight = Math.max(4, yBottom - yTop);
                return (
                  <>
                    <rect
                      x={paddingX}
                      y={yTop}
                      width={width - paddingX * 2}
                      height={zoneHeight}
                      fill="rgba(0, 230, 118, 0.08)"
                      rx={4}
                    />
                    <line
                      x1={paddingX}
                      y1={yTop}
                      x2={width - paddingX}
                      y2={yTop}
                      stroke="rgba(0, 230, 118, 0.3)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <line
                      x1={paddingX}
                      y1={yBottom}
                      x2={width - paddingX}
                      y2={yBottom}
                      stroke="rgba(0, 230, 118, 0.3)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={width - paddingX - 4}
                      y={yTop + 10}
                      fill="rgba(0, 230, 118, 0.7)"
                      fontSize="7.5"
                      fontWeight="600"
                      textAnchor="end"
                    >
                      표준 체지방 ({standardRanges.fatMin}~{standardRanges.fatMax}%)
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {activeTab === 'muscle' && (
            <g className="standard-zone">
              {(() => {
                const yTop = muscleData.getYForValue(standardRanges.muscleMax);
                const yBottom = muscleData.getYForValue(standardRanges.muscleMin);
                const zoneHeight = Math.max(4, yBottom - yTop);
                return (
                  <>
                    <rect
                      x={paddingX}
                      y={yTop}
                      width={width - paddingX * 2}
                      height={zoneHeight}
                      fill="rgba(0, 230, 118, 0.08)"
                      rx={4}
                    />
                    <text
                      x={width - paddingX - 4}
                      y={yTop + 10}
                      fill="rgba(0, 230, 118, 0.7)"
                      fontSize="7.5"
                      fontWeight="600"
                      textAnchor="end"
                    >
                      표준 골격근 ({standardRanges.muscleMin}~{standardRanges.muscleMax}kg)
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* Bottom Baseline Grid */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />

          {/* Graph Lines */}
          <AnimatePresence>
            {(activeTab === 'all' || activeTab === 'weight') && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.path
                  d={createPath(weightData.points)}
                  fill="none"
                  stroke={activeTab === 'all' ? 'rgba(255,255,255,0.5)' : '#FFFFFF'}
                  strokeWidth={activeTab === 'weight' ? '3' : '2'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
                {activeTab === 'weight' &&
                  weightData.points.map((p, i) => (
                    <circle
                      key={`w-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={hoverIdx === i ? '6' : '3.5'}
                      fill="#FFFFFF"
                      stroke="var(--card-bg)"
                      strokeWidth="1.5"
                      onClick={() => setHoverIdx(i)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
              </motion.g>
            )}

            {(activeTab === 'all' || activeTab === 'muscle') && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.path
                  d={createPath(muscleData.points)}
                  fill="none"
                  stroke="var(--accent-color)"
                  strokeWidth={activeTab === 'muscle' ? '3' : '2'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
                {activeTab === 'muscle' &&
                  muscleData.points.map((p, i) => (
                    <circle
                      key={`m-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={hoverIdx === i ? '6' : '3.5'}
                      fill="var(--accent-color)"
                      stroke="var(--card-bg)"
                      strokeWidth="1.5"
                      onClick={() => setHoverIdx(i)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
              </motion.g>
            )}

            {(activeTab === 'all' || activeTab === 'fat') && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.path
                  d={createPath(fatData.points)}
                  fill="none"
                  stroke="#FF7043"
                  strokeWidth={activeTab === 'fat' ? '3' : '2'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
                {activeTab === 'fat' &&
                  fatData.points.map((p, i) => (
                    <circle
                      key={`f-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={hoverIdx === i ? '6' : '3.5'}
                      fill="#FF7043"
                      stroke="var(--card-bg)"
                      strokeWidth="1.5"
                      onClick={() => setHoverIdx(i)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
              </motion.g>
            )}
          </AnimatePresence>

          {/* Interactive Touch / Hover Tooltip */}
          {activeTab !== 'all' && hoverIdx !== null && (
            <g>
              {(() => {
                const pts =
                  activeTab === 'weight'
                    ? weightData.points
                    : activeTab === 'muscle'
                    ? muscleData.points
                    : fatData.points;
                const p = pts[hoverIdx];
                if (!p) return null;
                const isLeft = hoverIdx < pts.length / 2;
                const tooltipX = isLeft ? p.x + 8 : p.x - 8;
                return (
                  <g>
                    <line
                      x1={p.x}
                      y1={p.y}
                      x2={p.x}
                      y2={height - paddingY}
                      stroke="rgba(255,255,255,0.25)"
                      strokeDasharray="3 3"
                    />
                    <rect
                      x={isLeft ? tooltipX : tooltipX - 54}
                      y={p.y - 24}
                      width="54"
                      height="22"
                      rx="6"
                      fill="rgba(20,20,24,0.9)"
                      stroke="var(--border-color)"
                      strokeWidth="1"
                    />
                    <text
                      x={isLeft ? tooltipX + 27 : tooltipX - 27}
                      y={p.y - 14}
                      fill="#fff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.val.toFixed(1)} {activeTab === 'fat' ? '%' : 'kg'}
                    </text>
                    <text
                      x={isLeft ? tooltipX + 27 : tooltipX - 27}
                      y={p.y - 5}
                      fill="rgba(255,255,255,0.6)"
                      fontSize="7"
                      textAnchor="middle"
                    >
                      {p.date.slice(5)}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* First & Last Date Labels */}
          {activeData.length >= 2 && (
            <>
              <text
                x={paddingX}
                y={height - 6}
                fill="var(--muted-color)"
                fontSize="8"
                textAnchor="start"
              >
                {activeData[0].date.slice(5)}
              </text>
              <text
                x={width - paddingX}
                y={height - 6}
                fill="var(--muted-color)"
                fontSize="8"
                textAnchor="end"
              >
                {activeData[activeData.length - 1].date.slice(5)}
              </text>
            </>
          )}
        </svg>

        {activeTab === 'all' && (
          <div className="chart-legend">
            <div className="legend-item">
              <span className="dot weight"></span> 체중
            </div>
            <div className="legend-item">
              <span className="dot muscle"></span> 골격근
            </div>
            <div className="legend-item">
              <span className="dot fat"></span> 체지방
            </div>
          </div>
        )}
      </div>

      <style>{`
        .inbody-chart-container {
          background: var(--card-bg);
          border-radius: 18px;
          padding: 14px;
          margin-bottom: 16px;
          border: 1px solid var(--border-color);
        }
        .chart-select-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
          position: relative;
          z-index: 30;
        }


        /* Hero Stats Styles */
        .hero-stat-card {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 10px 14px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .hero-stat-main {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .hero-label {
          font-size: 0.7rem;
          color: var(--muted-color);
          font-weight: 500;
        }
        .hero-value-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .hero-value {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--fg-color);
        }
        .hero-value .unit {
          font-size: 0.8rem;
          font-weight: 500;
          margin-left: 2px;
          color: var(--muted-color);
        }
        .hero-delta {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 6px;
        }
        .hero-delta.good {
          background: rgba(0, 230, 118, 0.15);
          color: var(--accent-color);
        }
        .hero-delta.bad {
          background: rgba(255, 68, 68, 0.15);
          color: #ff4444;
        }
        .hero-delta.neutral {
          background: rgba(255, 255, 255, 0.08);
          color: var(--muted-color);
        }
        .hero-sub-stats {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.65rem;
          color: var(--muted-color);
          text-align: right;
        }
        .hero-sub-stats strong {
          color: var(--fg-color);
        }

        .hero-stat-grid-all {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .hero-mini-box {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .hero-mini-box .label {
          font-size: 0.65rem;
          color: var(--muted-color);
        }
        .hero-mini-box .val {
          font-size: 1.05rem;
          font-weight: 700;
        }
        .hero-mini-box .delta {
          font-size: 0.65rem;
          font-weight: 600;
        }
        .hero-mini-box .delta.good { color: var(--accent-color); }
        .hero-mini-box .delta.bad { color: #ff4444; }
        .hero-mini-box .delta.neutral { color: var(--muted-color); }

        .chart-empty {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: var(--muted-color);
          background: var(--card-bg);
          border-radius: 16px;
          margin-bottom: 16px;
          border: 1px dashed var(--border-color);
        }
        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 10px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          color: var(--muted-color);
        }
        .dot { width: 6px; height: 6px; border-radius: 50%; }
        .dot.weight { background: #fff; }
        .dot.muscle { background: var(--accent-color); }
        .dot.fat { background: #FF7043; }
      `}</style>
    </div>
  );
};

export default InBodyChart;
