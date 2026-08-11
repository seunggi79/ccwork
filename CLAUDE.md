# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

React 19 + TypeScript + Vite 기반의 노트 앱 실습/강의용 프로젝트. `json-server`를 가짜 REST
백엔드로 사용해 CRUD를 구현한다. `src/types/note.ts`의 주석(`❌ tags 필드는 아직 없음`)이
암시하듯, 강의 진행에 따라 기능이 점진적으로 추가되는 것을 전제로 한 코드베이스이므로
"미완성"처럼 보이는 부분이 의도된 것일 수 있다.

## 명령어

```bash
npm run dev          # Vite(5173) + json-server(3001)를 concurrently로 동시 실행
npm run server        # json-server만 단독 실행 (db.json 감시)
npm run build          # tsc 타입체크 후 vite build
npm run preview        # 빌드 결과 미리보기
npm run lint            # eslint --fix
npm run format           # prettier --write
npm test                  # vitest run (단발 실행)
npm run test:watch         # vitest 워치 모드
```

- 단일 테스트 파일 실행: `npx vitest run <path>` (예: `npx vitest run src/components/NoteItem.test.tsx`)
- 현재 테스트 파일은 존재하지 않지만 vitest + jsdom + Testing Library 설정(`vite.config.ts`,
  `src/test-setup.ts`)은 갖춰져 있음.
- 프론트엔드만 실행할 경우 `npm run dev`로 API 서버까지 함께 켜지 않으면 노트 목록 fetch가
  실패한다 (아래 아키텍처 참고).

## 아키텍처

### 데이터 흐름

```
db.json (json-server, :3001) ⇄ src/api/notes.ts (fetch 래퍼) ⇄ NotesContext ⇄ 컴포넌트 트리
```

- **`src/api/notes.ts`**: `API_URL = 'http://localhost:3001'`로 하드코딩된 fetch 함수들
  (`fetchNotes`, `createNote`, `updateNote`, `deleteNote`). 이 모듈이 유일한 HTTP 경계이며,
  다른 곳에서 직접 fetch를 호출하지 않는다.
- **`src/context/NotesContext.tsx`**: 전역 상태를 담당하는 유일한 소스. `notes`/`loading`/
  `error`와 `createNote`/`updateNote`/`deleteNote`를 제공하며, 각 함수는 API 호출 후 로컬 `notes`
  배열을 낙관적이 아닌 "서버 응답 기반"으로 갱신한다 (서버가 응답한 객체로 교체/추가/삭제).
  컴포넌트는 `useNotes()` 훅으로만 상태에 접근한다 (Provider 밖에서 호출 시 throw).
- **`src/App.tsx`**: 화면 상태(`selectedNoteId`, `isCreating`)는 Context가 아닌 로컬
  `useState`로 관리하고, `Layout`/`NoteList`/`NoteEditor`에 콜백/props로 내려준다. 즉 "선택된
  노트가 무엇인가"는 UI 상태, "노트 데이터 자체"는 서버 상태로 역할이 분리되어 있다.

### 컴포넌트 구조

- `Layout`: 헤더 + 사이드바(`sidebar` prop) + 메인(`main` prop) 뼈대만 담당하는 슬롯 컴포넌트.
- `NoteList` → `NoteItem`: 목록/개별 항목. 로딩·에러·빈 상태를 `NoteList`에서 분기 처리.
- `NoteEditor`: `selectedNoteId`/`isCreating` 두 플래그로 "미선택/생성/편집" 3가지 모드를
  표현. 선택된 노트가 바뀔 때 로컬 폼 상태를 동기화하는 `useEffect`가 있음
  (`react-hooks/exhaustive-deps` 의도적으로 비활성화됨).

### 스타일링

- Tailwind CSS v4 (`@tailwindcss/vite` 플러그인, `@import "tailwindcss"` 방식 — `tailwind.config.js` 없음).
- 디자인 토큰은 `src/index.css`의 `@theme` 블록에서 CSS 변수로 정의(`--color-*`,
  `--font-*`, `--radius`). 새 색상/폰트를 추가할 때는 여기에 토큰을 추가하고 `bg-foreground`,
  `text-muted-foreground`처럼 시맨틱 클래스명으로 사용하는 기존 패턴을 따를 것.

## 구현 패턴

### 컴포넌트

- 모든 컴포넌트는 `export function ComponentName(...)` **named export**로 선언한다.
  `export default`는 예외 없이 금지한다.
- Props는 컴포넌트 바로 위에 `interface ComponentNameProps { ... }`로 선언하고 함수
  시그니처에서 구조 분해한다 (`LayoutProps`, `NoteEditorProps`, `NoteItemProps`,
  `NoteListProps`).
- 콜백 props는 부모가 내려주는 이벤트를 나타내며 항상 `onX` (`onSelect`, `onDelete`,
  `onDone`, `onNewNote`)로 명명하고, 컴포넌트 내부에서 그 콜백을 호출하는 로컬 함수는
  `handleX` (`handleSelectNote`, `handleSave`)로 명명한다. 즉 "prop = onX, 구현체 =
  handleX"가 고정 규칙이다.
- 로딩/에러/빈 배열 등 데이터 상태에 따른 분기는 해당 데이터를 소비하는 컴포넌트
  (`NoteList`)가 직접 early return으로 처리하고, 별도의 `<Loading />`/`<ErrorMessage />`
  같은 공용 컴포넌트로 추출하지 않는다.
- 컴포넌트는 `components/` 아래 배럴(index.ts) 없이 파일 경로로 직접 import한다.
- 폼 검증 실패, 저장 실패 등 사용자 액션에서 발생하는 에러는 `alert()`를 쓰지 않고
  `console.error()`로만 남긴다.

### 상태 관리

- 서버에서 온 데이터(`notes`)와 그 CRUD 동작은 전부 `NotesContext` 한 곳에만 존재하고,
  컴포넌트는 `useNotes()` 훅으로만 접근한다 — props drilling이나 로컬 복사본을 만들지 않는다.
- 화면에만 의미 있는 상태(어떤 노트를 선택했는지, 생성 모드인지, 저장 중인지)는 Context에
  넣지 않고 해당 상태가 필요한 최상위 컴포넌트(`App`, `NoteEditor`)의 `useState`로 관리한 뒤
  props로 내려준다. "서버 상태는 Context, UI-only 상태는 지역 state"가 규칙이다.
- Context의 mutation 함수명은 `api/notes.ts`의 함수명과 동일하게 `create`/`update`/`delete`
  동사를 그대로 쓴다 (`createNote`/`updateNote`/`deleteNote`) — API 함수명과 Context 메서드명이
  1:1로 매칭되도록 유지할 것.
- Context의 mutation 함수(`createNote`/`updateNote`/`deleteNote`)는 항상 **먼저 API를 호출하고
  성공 응답을 받은 뒤에** `setNotes`로 로컬 상태를 갱신한다 (낙관적 업데이트 없음). 실패 시
  로컬 상태는 건드리지 않고 에러를 호출부로 던진다.

### API 호출

- 모든 HTTP 요청은 `src/api/notes.ts`에 모아두고, 컴포넌트나 Context에서 `fetch`를 직접
  호출하지 않는다.
- 함수는 `res.ok`를 확인해 실패 시 `throw new Error('Failed to ...')`로 던지고, 성공 시
  `res.json()`을 반환하는 동일한 형태를 따른다.
- 함수 시그니처는 리소스명을 뒤에 붙이는 동사+명사 형태(`fetchNotes`, `createNote`,
  `updateNote`, `deleteNote`)이며, id가 필요한 요청은 `(id, ...)` 순서로 첫 인자에 둔다.
- `createdAt`/`updatedAt` 타임스탬프는 서버가 아니라 클라이언트(`api/notes.ts`)에서
  `new Date().toISOString()`으로 생성해 요청 본문에 포함시킨다.

### 네이밍

- 컴포넌트 파일/식별자: PascalCase (`NoteItem`, `NoteEditor`, `NotesContext`).
- 함수/변수/훅: camelCase (`fetchNotes`, `useNotes`, `selectedNoteId`).
- Boolean 상태·prop은 원칙적으로 `is` 접두사를 사용한다 (`isCreating`, `isSelected`) —
  단, 아래 일관성 문제에 예외가 있다.
- 타입(`Note`, `ReactNode` 등)은 `import type` 없이 일반 `import { X } from '...'`로 가져오는
  것이 프로젝트 전체에서 일관된 방식이다.

## 발견된 일관성 없는 패턴

코드베이스를 훑으며 규칙에서 벗어난 부분들. 새 코드를 작성할 때 어느 쪽을 따를지 판단이
필요하면 아래를 참고하고, 가능하면 기존 다수 패턴(위 "구현 패턴" 규칙) 쪽으로 맞출 것.

- **export 방식 불일치 (규칙 위반, 수정 필요)**: `App.tsx`만 `export default App`을 쓰고,
  나머지 컴포넌트(`Layout`, `NoteList`, `NoteItem`, `NoteEditor`)는 전부 named export다.
  위 "컴포넌트" 규칙상 named export가 예외 없이 강제되므로, `App.tsx`를 건드릴 일이 있으면
  `export function App(...)` + `import { App } from './App'`로 맞출 것.
- **boolean 네이밍 불일치**: `isCreating`(App), `isSelected`(NoteItem/NoteList)는 `is`
  접두사를 쓰지만, 같은 성격의 `loading`(NotesContext), `saving`(NoteEditor)은 접두사가
  없다.
- **에러 처리 방식 불일치**: 폼 검증 실패나 저장 실패는 `NoteEditor.handleSave`에서
  `console.error()`로만 남기는 반면, 노트 목록 조회 실패는 `NotesContext`가 `error` 상태에
  담아 `NoteList`가 인라인 텍스트로 렌더링한다. 같은 종류의 실패(네트워크 오류)를 화면에
  보여주는 방식과 콘솔에만 남기는 방식이 혼재되어 있다.
- **에러 메시지 언어 불일치**: `api/notes.ts`의 `throw new Error(...)` 메시지는 영어
  (`'Failed to fetch notes'`)인데, `NoteList`는 이를 한국어 레이블과 그대로 이어붙여
  `"오류: Failed to fetch notes"`처럼 언어가 섞인 문구를 노출한다. 반면 사용자 입력 검증
  메시지(`console.error('제목을 입력해주세요')`)는 한국어로 직접 작성되어 있다.

## 코드 스타일 / 설정 메모

- Prettier: 세미콜론 사용, 싱글 쿼트, printWidth 100, trailingComma all (`.prettierrc`).
- ESLint: `typescript-eslint` recommended + `react-hooks`/`react-refresh` 규칙
  (`eslint.config.js`). `dist/`는 lint 대상에서 제외.
- TypeScript strict 모드, `noUnusedLocals`/`noUnusedParameters` 활성화 — 미사용 변수/파라미터가
  있으면 빌드(`tsc`)가 실패한다.
- UI 텍스트, 주석, 커밋 메시지 등은 한국어로 작성되어 있음 — 새로 추가하는 사용자 노출
  텍스트와 주석도 한국어 관례를 따를 것.

### 커밋 규칙 (husky + commitlint)

- `git commit` 시 `.husky/pre-commit`(lint-staged: eslint --fix, prettier --write)과
  `.husky/commit-msg`(commitlint, `commitlint.config.js`)가 자동 실행되며 위반 시 커밋이
  막힌다.
- 커밋 메시지 형식: `type: 제목` 한 줄 + 빈 줄 + 본문 최소 1줄 (제목만 있는 커밋은 거부됨).
- `type`은 `feat`/`fix`/`docs`/`style`/`refactor`/`perf`/`test`/`build`/`ci`/`chore`/`revert`/
  `init` 중 하나 (`init`은 기존 히스토리 관례를 위한 프로젝트 커스텀 타입).
