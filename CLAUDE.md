# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

React 19 + TypeScript + Vite 기반의 노트 앱 실습/강의용 프로젝트. `json-server`를 가짜 REST
백엔드로 사용해 CRUD를 구현한다. `src/types/note.ts`의 주석(`❌ tags 필드는 아직 없음`)이
암시하듯, 강의 진행에 따라 기능이 점진적으로 추가되는 것을 전제로 한 코드베이스이므로
"미완성"처럼 보이는 부분이 의도된 것일 수 있다.

## 명령어

`package.json`의 `scripts`에 명령어 목록이 있다 (`npm run dev`가 vite+json-server를 동시 실행).

- 단일 테스트 파일 실행: `npx vitest run <path>` (예: `npx vitest run src/components/NoteItem.test.tsx`)
- 단일 E2E 파일 실행: `npx playwright test e2e/tag.spec.ts`
- **테스트가 2계층이다.** `src/` 아래 `*.test.ts(x)`는 Vitest(jsdom, `api/notes.ts` 모킹)로
  도는 단위/컴포넌트 테스트고, `e2e/` 아래 `*.spec.ts`는 Playwright로 실제 브라우저 +
  실제 json-server를 상대로 도는 E2E다. 둘은 실행기가 다르므로 서로의 파일을 섞어 실행하면
  안 된다 (아래 "테스트 설정 메모" 참고).
- 프론트엔드만 실행할 경우 `npm run dev`로 API 서버까지 함께 켜지 않으면 노트 목록 fetch가
  실패한다 (아래 아키텍처 참고). E2E는 `playwright.config.ts`의 `webServer`가 `npm run dev`를
  자동으로 띄우므로 따로 켜둘 필요가 없다.

## TDD 이슈 사이클

GitHub 이슈 하나를 개발할 때는 아래 순서를 따른다. 각 단계 사이에는 사람 승인 게이트가
있다 — **자동으로 다음 단계로 넘어가지 않고, 한 단계가 끝나면 다음 단계를 제안한 뒤 승인을
기다린다.**

1. `/test-scenarios {N}` (skill) — 함수 시그니처/Props 타입을 확정하고, 그 시그니처를
   근거로 정상/경계/예외 테스트 시나리오를 도출해 이슈의 Acceptance Criteria와 전부
   대조한다. `docs/features/{name}/issue-{N}.md`에 기록. [GATE] 시그니처 승인, [GATE] 시나리오
   승인.
2. `/tdd-red {N}` (skill) — 승인된 시나리오를 하나씩 실패하는 Vitest 테스트로 옮긴다.
   `src/`의 구현 코드는 건드리지 않는다.
3. `/tdd-green {N}` (skill) — 실패 테스트를 하나씩 최소 구현으로 통과시킨다. 테스트가
   요구하지 않는 기능은 추가하지 않는다.
4. `ac-verifier` (agent) — **테스트 통과가 곧 AC 충족을 의미하지 않는다.** AC 문장이 요구하는
   의도가 코드/테스트에 실제로 반영됐는지 독립적으로 검증한다. 갭이 발견되면 그 갭을
   보완하는 시나리오를 추가해 1~3단계를 다시 돈다(주로 `/test-scenarios`부터 짧게 재진입).
5. `/tdd-refactor {N}` (skill) — 테스트가 전부 통과하는 상태를 유지하면서 구조만 개선한다.
   변경 하나마다 즉시 재검증하고, 테스트가 깨지면 그 변경만 즉시 롤백한다.
6. `/tdd-security-gate {N}` (skill) — 타입 오류(`tsc --noEmit`)·의존성 취약점(`npm
audit`)·`.env` 노출을 점검해 즉시 수정 필요/권장 수정/무시 가능으로 분류한다. (전역
   `/security-review`는 SQLi/XSS 등 더 넓은 범위의 일반 보안 리뷰이며 이 사이클에서 쓰는
   것과 다르다 — 이슈 커밋 전 점검에는 항상 `/tdd-security-gate`를 쓴다.)
7. 커밋 → push → `gh pr create --base feature/{spec-branch}`(예: `feature/tag-spec`처럼 해당
   기능의 스펙 브랜치로, `main`이 아님) → 머지(일반 머지, squash 아님) → `gh issue close {N}`.

이슈 간 의존성이 있으면(예: TAG-2가 TAG-1의 `TagInput`을 재사용), 새 이슈용 브랜치는 `main`이
아니라 **선행 이슈가 머지된 feature 브랜치**(예: `feature/tag-spec`)에서 분기한다.

### 기능 단위 마무리 — E2E

위 1~7단계는 **이슈 하나**를 단위로 돈다. 한 기능(PRD)에 속한 이슈들이 전부 머지되면, 마지막에
`/e2e-write {기능명}` (skill)로 그 기능 전체를 실제 브라우저에서 한 번 검증한다 (예:
`/e2e-write tag`). 이 스킬은 `docs/features/{name}/prd.md`의 사용자 스토리 중 **실제로 구현된
것만** 골라 `e2e/{name}.spec.ts`로 옮기고, 결과를 같은 PRD의 "E2E 커버리지" 섹션에 기록한다.

TDD 사이클과 방향이 반대라는 점에 주의한다 — TDD는 **없는 기능**을 위해 실패하는 테스트를 먼저
쓰지만, E2E는 **이미 머지된 기능**의 회귀 테스트라 처음 실행부터 통과해야 정상이다. 여기서
실패가 나면 테스트가 잘못됐거나(셀렉터/타이밍) 실제 버그가 있다는 뜻이므로, 단언을 완화해
통과시키지 않는다.

Vitest가 이미 검증하는 것(입력값 경계, 순수 함수 엣지케이스, mock 호출 인자)은 E2E에서
중복하지 않는다. E2E에는 단위 테스트가 **구조적으로 할 수 없는 것**만 남긴다 — 새로고침 후에도
값이 남아있는지(실제 HTTP + `db.json` 영속화), 여러 화면을 넘나드는 흐름.

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
- 스타일/CSS/Tailwind 작업 전에 `design-system` 스킬
  (`.claude/skills/design-system/SKILL.md`)을 먼저 참고할 것.

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

- TypeScript strict 모드, `noUnusedLocals`/`noUnusedParameters` 활성화 — 미사용 변수/파라미터가
  있으면 빌드(`tsc`)가 실패한다.
- UI 텍스트, 주석, 커밋 메시지 등은 한국어로 작성되어 있음 — 새로 추가하는 사용자 노출
  텍스트와 주석도 한국어 관례를 따를 것.

### 테스트 설정 메모 (지우면 깨지는 것들)

Vitest와 Playwright를 한 저장소에서 함께 쓰기 위해 들어간 설정들이다. 넷 다 없으면 조용히
또는 요란하게 깨지므로, "왜 이런 게 있지?" 싶어도 지우기 전에 아래 이유를 확인할 것.

- **Vitest의 E2E 제외** — `vite.config.ts`의 `test.exclude`에 `e2e` 글로브: Vitest는 기본
  패턴상 `e2e/` 아래 `.spec.ts`도 자기 테스트로 집어삼킨다. 그러면 Playwright의 `test()`를
  Vitest가 실행하려다 `Playwright Test did not expect test() to be called here`로 `npm test`
  전체가 실패한다.
- **Vite 감시에서 `db.json` 제외** — `vite.config.ts`의 `server.watch.ignored`: `db.json`은
  json-server가 노트를 생성/수정/삭제할 때마다 다시 쓰는 런타임 파일인데, 프로젝트 루트에
  있어 Vite 개발 서버의 기본 감시 대상에 들어간다. E2E 실행 중 잦은 쓰기가 브라우저 전체
  새로고침을 유발해 화면의 React 상태(선택된 노트 등)를 날려버리고, E2E가 간헐적으로
  실패한다. 증상이 "요소는 visible/enabled/stable인데 클릭이 타임아웃"으로 나타나 원인을
  찾기 매우 어렵다.
- **react-hooks 규칙을 React 코드로 한정** — `eslint.config.js`에서 `react-hooks`/
  `react-refresh`를 `src/` 글로브에만 적용: 이 규칙들을 저장소 전체에 걸면 Playwright
  fixture의 `use(...)` 파라미터를 React 훅 호출로 오인해 `react-hooks/rules-of-hooks` 오탐이
  난다. React 코드에만 적용하는 게 맞다.
- **타입 체크 범위에 `e2e` 포함** — `tsconfig.json`의 `include`에 `e2e`와
  `playwright.config.ts`: 없으면 `e2e/` 아래 코드가 `tsc --noEmit`과 `npm run build`의 타입
  체크에서 통째로 빠져, E2E 코드의 타입 오류가 조용히 통과된다 (`/tdd-security-gate`의 타입
  점검도 함께 무력화됨).

E2E는 별도 테스트 DB 없이 **실제 `db.json`을 상대로** 돈다. 대신 `e2e/support/fixtures.ts`의
`notesApi`가 테스트 중 만든 노트를 성공/실패와 무관하게 전부 삭제하므로 실행 후 `db.json`은
원상 복구된다. 새 E2E를 쓸 때는 반드시 이 fixture로 데이터를 만들고, UI로 만든 노트는
`notesApi.track(id)`로 정리 대상에 등록할 것 — 직접 `fetch`로 데이터를 만들면 정리되지 않고
`db.json`에 쓰레기가 쌓인다.

### 커밋 규칙 (husky + commitlint)

- `git commit` 시 `.husky/pre-commit`(lint-staged: eslint --fix, prettier --write)과
  `.husky/commit-msg`(commitlint, `commitlint.config.js`)가 자동 실행되며 위반 시 커밋이
  막힌다.
- 커밋 메시지 형식: `type: 제목` 한 줄 + 빈 줄 + 본문 최소 1줄 (제목만 있는 커밋은 거부됨).
- `type`은 `feat`/`fix`/`docs`/`style`/`refactor`/`perf`/`test`/`build`/`ci`/`chore`/`revert`/
  `init` 중 하나 (`init`은 기존 히스토리 관례를 위한 프로젝트 커스텀 타입).
