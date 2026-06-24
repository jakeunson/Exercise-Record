const fs = require('fs');
const file = 'src/App.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const returnIndex = lines.findIndex(line => line.startsWith('  return ('));

if (returnIndex === -1) {
  console.log('Could not find return statement');
  process.exit(1);
}

let newContent = lines.slice(0, returnIndex).join('\n');

// Replace imports
newContent = newContent.replace(
  /import SwipePicker from '.\/components\/SwipePicker';[\s\S]*import WorkoutEditModal from '.\/components\/WorkoutEditModal';/,
  `import ExerciseEditModal from './components/ExerciseEditModal';
import WorkoutEditModal from './components/WorkoutEditModal';

import CategoryView from './views/CategoryView';
import SelectExerciseView from './views/SelectExerciseView';
import RecordView from './views/RecordView';
import SummaryView from './views/SummaryView';
import HistoryView from './views/HistoryView';
import InBodyListView from './views/InBodyListView';
import InBodyInputView from './views/InBodyInputView';
import SettingsView from './views/SettingsView';

import ConfirmDeleteModal from './components/modals/ConfirmDeleteModal';
import AddCustomExerciseModal from './components/modals/AddCustomExerciseModal';
import './App.css';`
);

const newReturnBlock = `  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {step === 'category' && (
          <CategoryView
            activeCategories={activeCategories}
            selectCategory={selectCategory}
            setStep={setStep}
            workoutDates={workoutDates}
          />
        )}
        {step === 'settings' && (
          <SettingsView
            accentColor={accentColor}
            applyTheme={applyTheme}
            timerDuration={timerDuration}
            setTimerDuration={(val) => {
              setTimerDuration(val);
              StorageService.saveTimerDuration(val);
            }}
            handleExport={handleExport}
            handleImport={handleImport}
            importStatus={importStatus}
            fileInputRef={fileInputRef}
            setStep={setStep}
          />
        )}
        {step === 'inbody_list' && (
          <InBodyListView
            inBodyHistory={inBodyHistory}
            setDeletingInBody={setDeletingInBody}
            setStep={setStep}
          />
        )}
        {step === 'inbody' && (
          <InBodyInputView
            ibWeight={ibWeight} ibMuscle={ibMuscle} ibFat={ibFat}
            setIbWeight={setIbWeight} setIbMuscle={setIbMuscle} setIbFat={setIbFat}
            ibWeightOptions={ibWeightOptions} ibMuscleOptions={ibMuscleOptions} ibFatOptions={ibFatOptions}
            saveInBody={saveInBody} setStep={setStep}
          />
        )}
        {step === 'history' && (
          <HistoryView
            historySessions={historySessions}
            allExercises={allExercises}
            filterDate={filterDate} setFilterDate={setFilterDate}
            filterExerciseId={filterExerciseId} setFilterExerciseId={setFilterExerciseId}
            filteredHistory={filteredHistory}
            setEditingSession={setEditingSession}
            setDeletingSession={setDeletingSession}
            setStep={setStep}
          />
        )}
        {step === 'select' && (
          <SelectExerciseView
            selectedCategory={selectedCategory}
            filteredExercises={filteredExercises}
            ongoingWorkouts={ongoingWorkouts}
            getExSetting={getExSetting}
            startWorkout={startWorkout}
            handleLongPressStart={handleLongPressStart}
            handleLongPressEnd={handleLongPressEnd}
            setShowAddExercise={setShowAddExercise}
            setStep={setStep}
          />
        )}
        {step === 'record' && (
          <RecordView
            selectedExercise={selectedExercise}
            currentSets={currentSets}
            tempSubSets={tempSubSets}
            prevSession={prevSession}
            distance={distance} time={time} weight={weight} reps={reps}
            setDistance={setDistance} setTime={setTime} setWeight={setWeight} setReps={setReps}
            addSubSet={addSubSet} saveSet={saveSet} finishWorkout={finishWorkout}
            timerActive={timerActive} timerKey={timerKey} timerDuration={timerDuration} stopTimer={stopTimer}
            showSaveToast={showSaveToast}
            setStep={setStep}
            distanceOptions={distanceOptions} timeOptions={timeOptions} weightOptions={weightOptions} repOptions={repOptions}
          />
        )}
        {step === 'summary' && (
          <SummaryView
            selectedExercise={selectedExercise}
            currentSets={currentSets}
            reset={reset}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════ DELETE MODALS ══════════════════ */}
      <AnimatePresence>
        {(deletingSession || deletingInBody) && (
          <ConfirmDeleteModal
            onCancel={() => { setDeletingSession(null); setDeletingInBody(null); }}
            onConfirm={() => {
              if (deletingSession) deleteWorkout(deletingSession.id, deletingSession.date);
              if (deletingInBody) deleteInBody(deletingInBody);
              setDeletingSession(null);
              setDeletingInBody(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════ EXERCISE EDIT MODAL ══════════════════ */}
      <AnimatePresence>
        {editingExercise && (
          <ExerciseEditModal
            exercise={editingExercise}
            onClose={() => setEditingExercise(null)}
            onSaved={refreshExerciseSettings}
            onDeleted={() => {
              setCustomExercises(StorageService.getCustomExercises());
              setExerciseSettings(StorageService.getExerciseSettings());
            }}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════ WORKOUT EDIT MODAL ══════════════════ */}
      <AnimatePresence>
        {editingSession && (
          <WorkoutEditModal
            session={editingSession}
            allExercises={allExercises}
            onClose={() => setEditingSession(null)}
            onSaved={() => {
              setHistorySessions(StorageService.getSessions());
              setWorkoutDates(StorageService.getWorkoutDates());
            }}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════ ADD CUSTOM EXERCISE MODAL ══════════════════ */}
      <AnimatePresence>
        {showAddExercise && (
          <AddCustomExerciseModal
            newExName={newExName}
            setNewExName={setNewExName}
            onCancel={() => { setShowAddExercise(false); setNewExName(''); }}
            onAdd={handleAddCustomExercise}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;`;

fs.writeFileSync(file, newContent + '\n' + newReturnBlock);
console.log('App.tsx successfully updated!');
