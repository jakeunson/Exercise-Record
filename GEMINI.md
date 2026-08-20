# Exercise Record 프로젝트 공통 가이드라인

본 문서는 Exercise Record 앱의 일관성 유지와 버그 최소화를 위한 전역 개발 규칙입니다.
Antigravity 에이전트는 이 프로젝트 내에서 작업할 때 반드시 이 규칙을 최우선으로 준수해야 합니다.

## 1. 폴더별 특화 가이드라인 참조
본 프로젝트는 관심사를 분리하여 폴더별로 구체적인 지침을 따릅니다.
해당 폴더에서 작업할 때는 내부의 `GEMINI.md`를 우선적으로 준수하십시오.
- **Frontend (React, UI, 상태관리)**: `src/GEMINI.md` 참조
- **Backend (API, 서버)**: 차후 `server/` 디렉토리 신설 시 `server/GEMINI.md` 참조 예정

## 2. 코드 컨벤션 (TypeScript)
- **타입 안정성**: 명확한 타입스크립트 인터페이스를 사용하고, 불가피한 경우가 아니면 `any` 타입 사용을 엄격히 지양합니다. (`src/core/types/` 내장 타입 적극 활용)
- **명명 규칙**: 
  - 컴포넌트 파일: PascalCase (예: `CategoryEditModal.tsx`)
  - 유틸 및 훅: camelCase (예: `useSettings.ts`, `exportService.ts`)

## 3. PWA 및 모바일 친화성 (Touch-first)
- 이 프로젝트는 하이브리드 모바일 앱(Capacitor)을 타겟으로 합니다.
- 데스크탑 마우스 오버(Hover) 효과에 의존하지 않으며, 클릭/터치 영역이 작지 않게 디자인합니다. (최소 타겟 44px 권장)
- 롱프레스나 스와이프 등의 모바일 인터랙션을 적극적으로 고려합니다.
