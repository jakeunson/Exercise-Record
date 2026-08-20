# 프론트엔드 (UI & 상태 관리) 가이드라인

이 문서는 `src/` 디렉토리 하위의 프론트엔드 코드(React 컴포넌트, 훅, UI 등)를 작성할 때 Antigravity 에이전트가 반드시 지켜야 할 규칙입니다.

## 1. UI / 디자인 시스템 가이드라인

새로운 UI 요소를 추가할 때는 반드시 기존 `App.css`에 정의된 클래스와 템플릿을 재사용합니다. 인라인 스타일(`style={{...}}`)을 통한 레이아웃 하드코딩은 엄격히 금지합니다.

### 1.1. 모달(Modal) 및 팝업 규칙
모든 팝업과 모달은 `framer-motion`을 사용하며 다음과 같은 뼈대를 유지해야 합니다.
- **배경 (Overlay)**: `<motion.div className="modal-overlay">` (z-index, 블러 효과 기본 적용됨)
- **가벼운 확인/입력 창**: `<motion.div className="confirm-modal">` 사용
  - 제목은 `<h2>` 태그 사용
  - 입력창은 `<input className="add-ex-input" />` 사용
  - 하단 버튼 그룹은 `<div className="modal-actions">`로 묶어서 배치
- **크기가 큰 편집/가이드 창**: `<motion.div className="exercise-edit-modal">` 사용 (최대 높이 90vh 및 스크롤 자동 적용됨)
  - 헤더 영역은 `<div className="eem-header">` 사용 (내부 타이틀은 `.eem-title`, 닫기 버튼은 `.eem-close`)
- **종료 팝업 류**: `<motion.div className="exit-modal">` 사용

### 1.2. 공통 컴포넌트 클래스 및 사용 규칙
- **버튼**: 용도에 맞게 `.secondary-btn`, `.danger-btn`, `.cancel-btn`, `.confirm-delete-btn`, `.eem-save-btn` 중 하나를 채택할 것.
- **입력 필드**: `.add-ex-input` 또는 `.eem-input` 사용.
- **선택 박스(Dropdown)**: 네이티브 `<select>` 태그 사용을 지양하고, 통일된 UI를 위해 `<CustomSelect>` 컴포넌트를 사용합니다.
- **파괴적 액션(삭제 등)**: 인라인 UI 텍스트 변경 대신 `ConfirmDeleteModal` 등 별도의 명확한 확인 모달을 띄워 사용자 실수를 방지합니다.

### 1.3. 여백 및 레이아웃 (Spacing)
- 컴포넌트 간의 간격은 `Flexbox`의 `gap` 속성을 적극 활용하여 일관된 간격 시스템을 구축합니다.
- 부모 컨테이너에 `gap`이 설정되어 있음에도 불구하고 자식 요소에 인라인 스타일로 `margin-top`, `margin-bottom` 등을 하드코딩하여 레이아웃을 망가뜨리는 것을 엄격히 금지합니다.

### 1.4. 애니메이션 속성
- **오버레이 (Fade In/Out)**: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`
- **모달 트랜지션 (Spring)**: `transition={{ type: 'spring', damping: 30, stiffness: 300 }}`

---

## 2. 아키텍처 및 상태 관리 룰 (Architecture & State)

### 2.1. 데이터 계층 (Repository Pattern)
UI 컴포넌트(View, Modal 등) 내에서 직접 `localforage`나 데이터베이스 API에 접근하는 것을 금지합니다.
- 데이터의 CRUD는 반드시 `src/core/repositories/` 하위의 저장소 클래스(`SettingsRepository`, `WorkoutRepository` 등)를 통해서만 수행해야 합니다.

### 2.2. 상태 동기화 (Hooks)
- View 계층은 `src/ui/hooks/` 디렉토리에 있는 커스텀 훅(`useSettings`, `useWorkout` 등)을 사용하여 렌더링 상태를 가져옵니다.
- 데이터 추가/삭제 후 즉각적인 UI 반영이 필요한 경우, 각 훅이 제공하는 `.reload()` 메서드를 호출하여 캐시와 UI를 동기화합니다.
