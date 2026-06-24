const fs = require('fs');
const file = 'src/App.css';
let c = fs.readFileSync(file, 'utf8');

const cssToAdd = `
/* History UI Enhancements */
.history-date-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.history-date-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--muted-color);
  padding-left: 4px;
}
.history-group-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.accordion-card {
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  overflow: hidden;
}
.accordion-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}
.accordion-card .card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.info-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cat-icon {
  width: 6px;
  height: 36px;
  border-radius: 6px;
}
.cat-chest { background: #FF5252; }
.cat-back { background: #448AFF; }
.cat-legs { background: #69F0AE; }
.cat-shoulders { background: #E040FB; }
.cat-arms { background: #FFD740; }
.cat-cardio { background: #18FFFF; }
.cat-default { background: var(--muted-color); }

.card-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.card-titles .card-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--fg-color);
}
.card-titles .card-sub {
  font-size: 0.75rem;
  color: var(--muted-color);
}
.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-summary {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--accent-color);
  margin-right: 4px;
}
.icon-btn {
  background: none;
  border: none;
  color: var(--muted-color);
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.icon-btn:hover { background: rgba(255,255,255,0.1); }
.icon-btn.delete:hover { color: #ff4444; background: rgba(255, 68, 68, 0.1); }
.expand-icon {
  color: var(--muted-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}
.card-sets-accordion {
  overflow: hidden;
}
.accordion-content {
  padding-top: 16px;
  margin-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
`;

fs.writeFileSync(file, c + '\n' + cssToAdd);
console.log('App.css updated via script.');
