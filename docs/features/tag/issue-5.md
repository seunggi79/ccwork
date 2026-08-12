# 이슈 #5: TAG-1: 편집 중인 노트에 태그 추가

## 시그니처 (승인됨)

### 타입 변경 — `src/types/note.ts`

```typescript
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[]; // 신규 필드 (필수, ADR-001)
  createdAt: string;
  updatedAt: string;
}
```

### 함수 시그니처 — `src/utils/tags.ts` (신규 파일)

```typescript
export function addTag(tags: string[], input: string): string[];
```

- **동작**: `input`을 `trim()`한 뒤, 빈 문자열이거나 기존 `tags`와 대소문자 무시 비교로
  중복이면 `tags`를 그대로(참조 동일) 반환. 아니면 trim된 원본 표기 그대로를 append한 **새
  배열**을 반환.
- **에러 케이스**: 없음 — 항상 정상적으로 배열을 반환하는 순수 함수. 빈 값/중복 입력도
  예외가 아니라 "무시하고 원본 반환"으로 처리한다.

### Props 타입 — `src/components/TagInput.tsx` (신규 파일)

```typescript
interface TagInputProps {
  tags: string[];
  onAdd: (value: string) => void;
}
export function TagInput({ tags, onAdd }: TagInputProps);
```

- ADR-002에 따라 `onRemove`는 이번 이슈에 포함하지 않는다 — 삭제 버튼/`onRemove`는
  TAG-2(#6)에서 추가.
- 입력 중인 텍스트는 `TagInput`이 자체 로컬 상태로 관리한다 (부모는 커밋된 `tags` 배열만
  안다). Enter 시 `onAdd(현재 입력값)` 호출 후 자체 입력값을 초기화한다.
- **에러 케이스**: 없음.

### 기존 컴포넌트 수정 — `src/components/NoteEditor.tsx` (Props 타입 변경 없음)

- 신규 로컬 상태: `const [tags, setTags] = useState<string[]>([])`
- 기존 폼 동기화 `useEffect`에 태그 동기화 추가: 편집 모드면
  `setTags(selectedNote?.tags ?? [])`, 생성 모드면 `setTags([])`
- 신규 내부 핸들러: `handleAddTag(value: string): void` — `setTags(addTag(tags, value))` 호출
- `handleSave`: 편집 모드(`!isCreating && selectedNoteId`)일 때만
  `updateNote(selectedNoteId, { title, content, tags })` 호출 (생성 모드의 `createNote` 호출은
  TAG-1 범위 밖, 그대로 title/content만 전달)
- 편집 모드에서만 `<TagInput tags={tags} onAdd={handleAddTag} />` 렌더링

**API/Context 계층(`src/api/notes.ts`, `src/context/NotesContext.tsx`)은 변경 없음** —
`updateNote(id, updates: Partial<Note>)`가 이미 임의 필드를 받는 구조라 `tags`도 그대로
실린다.

## 테스트 시나리오

### 정상

- [x] [정상] addTag — should append the trimmed input as a new tag when input is a new, non-duplicate value
- [x] [정상] addTag — should keep existing tags unchanged and append the new tag when adding a second distinct tag
- [x] [정상] TagInput — should render one chip per tag in the tags prop
- [x] [정상] TagInput — should call onAdd with the current input value and clear the input field when Enter is pressed
- [x] [정상] NoteEditor — should call updateNote with the previous tags plus the newly added tag when Save is clicked
- [x] [정상] NoteEditor — should keep the newly added tag chip visible in the UI after Save succeeds

### 경계

- [x] [경계] addTag — should silently return the tags array unchanged (no error) when input is an empty string
- [x] [경계] addTag — should silently return the tags array unchanged (no error) when input is only whitespace
- [x] [경계] addTag — should return the tags array unchanged when input matches an existing tag ignoring case and surrounding whitespace
- [x] [경계] addTag — should preserve the original casing of the previously-added tag when a case-different duplicate input is rejected
- [x] [경계] addTag — should support accumulating at least 20 distinct tags without any artificial limit
- [x] [경계] NoteEditor — should not call updateNote or createNote while a tag has been added locally but Save has not been clicked yet
- [x] [경계] NoteEditor — should populate the tags state from the selected note's existing tags when opening an existing note for editing
- [x] [경계] NoteEditor — should restore the tags state from the server-persisted note (discarding any unsaved addition) when the note is reselected after Cancel was clicked without saving
- [x] [경계] NoteEditor — should not render TagInput when isCreating is true
- [x] [경계] NoteEditor — should not call updateNote when Cancel is clicked after a tag has been added locally
- [x] [경계] NoteEditor — should render 20 tag chips when 20 distinct tags are added one by one via the tag input

### 예외

(해당 없음 — `addTag`, `TagInput`, 이번 이슈 범위의 `NoteEditor` 변경 모두 예외를 던지지 않는
순수 함수/UI 로직이다)

## AC 커버리지

- AC 1 (빈 입력창에 `react` 입력 후 Enter → 칩 표시, 입력창 초기화) → 정상 `addTag`(append) +
  정상 `TagInput`(chip 렌더링, onAdd 호출/입력창 초기화)
- AC 2 (기존 `study` + 신규 `urgent` → 둘 다 유지) → 정상 `addTag`(기존 유지 + append)
- AC 3 (저장 전에는 API 호출 없음) → 경계 `NoteEditor`(저장 전 API 미호출)
- AC 4 (저장 시 `updateNote`에 태그 반영) → 정상 `NoteEditor`(updateNote 호출) + 정상
  `NoteEditor`(저장 후 화면에 태그 유지) — 후자는 `ac-verifier` 재검증에서 "호출 인자는
  검증되지만 저장 후 UI 반영은 미검증"으로 지적된 갭 보완
- AC 5 (취소 후 재열람 시 추가한 태그 사라짐) → 경계 `NoteEditor`(재선택 시 서버 상태로 복원) +
  경계 `NoteEditor`(취소 클릭 시 updateNote 미호출) — 후자는 `ac-verifier` 재검증에서 "재선택
  시뮬레이션만 있고 실제 취소 버튼 클릭 경로는 미검증"으로 지적된 갭 보완
- AC 6 (대소문자/공백만 다른 중복 무시) → 경계 `addTag`(대소문자/공백 무시 중복 판단)
- AC 7 (빈/공백 입력 무시, 에러 없음) → 경계 `addTag`(빈 문자열/공백 입력 무시)
- AC 8 (태그 20개 연속 추가, 제한 없음) → 경계 `addTag`(20개 이상 누적 지원) + 경계
  `NoteEditor`(실제 입력 20회로 20개 칩 렌더링) — 후자는 `ac-verifier` 재검증에서 "순수 함수
  레벨만 검증되고 실제 UI 렌더링 파이프라인은 미검증"으로 지적된 갭 보완
- AC 9 (생성 모드에서는 태그 입력창 미노출) → 경계 `NoteEditor`(isCreating 시 TagInput 미렌더링)

## 보안 게이트 결과 (`tdd-security-gate`, 2026-08-12)

- **타입 오류**: `npx tsc --noEmit` — 0건, clean.
- **`.env` 노출**: 프로젝트에 `.env`/`.env.local`/`.env.example` 파일 없음 — 해당 없음.
- **의존성 취약점**: `npm audit` — 9건(low 1, high 6, critical 2). 전부 `devDependencies` 트리
  (`vite`, `concurrently` 및 그 하위 의존성 `postcss`, `js-yaml`, `nanoid`, `ws`, `shell-quote`,
  `brace-expansion`, `@babel/core`)에만 있고, 런타임 의존성(`react`, `react-dom`)에는 없음 →
  배포되는 번들에는 포함되지 않아 **"즉시 수정 필요"가 아닌 "권장 수정"**으로 분류. 전부
  `fixAvailable: true`(`npm audit fix`로 `--force` 없이 해결 가능하나 이번 게이트에서는
  범위 밖이라 적용하지 않음 — 개발자 판단으로 보류).
- **결론**: "즉시 수정 필요" 항목 없음 → 이슈 #5(TAG-1) 커밋 게이트 통과. `npm audit fix`
  적용은 별도 작업으로 남겨둠.

**총 9개 AC 중 9개 모두 시나리오로 커버됨** (AC4/AC5/AC8은 2026-08-12 `ac-verifier` 재검증에서
발견된 갭을 보완하는 시나리오 3건이 추가되어 부분 충족 → 충족으로 승격 대상).
