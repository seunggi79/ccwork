# 이슈 #6: TAG-2: 편집 중인 노트에서 태그 삭제

## 시그니처 (승인됨)

### 함수 시그니처 — `src/utils/tags.ts` (기존 파일에 추가)

```typescript
export function removeTag(tags: string[], tagToRemove: string): string[];
```

- **동작**: `tagToRemove`와 정확히 일치(exact match)하는 항목을 제거한 **새 배열**을 반환.
  `addTag`가 이미 대소문자/공백만 다른 중복을 걸러주므로 배열 안에는 태그당 하나의 정규
  표기만 존재하고, 삭제는 렌더링된 칩 텍스트 그대로 `onRemove(tag)`로 호출되므로 정확
  일치면 충분하다(대소문자 무시 비교 불필요).
- **에러 케이스**: 없음 — 순수 함수. 존재하지 않는 태그를 제거하려 해도 예외 없이 원본과
  동등한 배열을 반환한다.

### Props 타입 변경 — `src/components/TagInput.tsx` (기존 파일)

```typescript
interface TagInputProps {
  tags: string[];
  onAdd: (value: string) => void;
  onRemove: (tag: string) => void;
}
```

- 각 태그 칩에 삭제(×) 버튼이 추가되고, 클릭 시 `onRemove(해당 태그)` 호출.
- **에러 케이스**: 없음.

### 기존 컴포넌트 수정 — `src/components/NoteEditor.tsx` (Props 타입 변경 없음)

- 신규 내부 핸들러: `handleRemoveTag(tag: string): void` — `setTags(removeTag(tags, tag))` 호출
- `<TagInput tags={tags} onAdd={handleAddTag} onRemove={handleRemoveTag} />`로 변경(`onRemove`
  추가 전달)

**API/Context 계층(`src/api/notes.ts`, `src/context/NotesContext.tsx`)은 변경 없음** —
`updateNote(id, { tags })`는 TAG-1에서 이미 배선되어 있다.

**근거**: PRD `docs/features/tag/prd.md`의 ADR-002(`TagInput`이 `tags`/`onAdd`/`onRemove`
props를 받는 프레젠테이셔널 컴포넌트로 분리)와 칩 스타일 ADR(별도 `Chip` 컴포넌트 없이
`TagInput.tsx` 내부에 hairline 사각형 + `×` 글리프로 구현)을 그대로 따른다.

## 테스트 시나리오

### 정상

- [x] [정상] removeTag — should remove the matching tag and return a new array containing the remaining tags when the tag exists
- [x] [정상] TagInput — should render a delete (×) button for each tag chip
- [x] [정상] TagInput — should call onRemove with the clicked tag's value when its delete button is clicked
- [x] [정상] NoteEditor — should remove the tag chip from the screen immediately when its delete button is clicked, before Save is clicked
- [x] [정상] NoteEditor — should call updateNote with the tags array excluding the removed tag when Save is clicked after removing a tag
- [x] [정상] NoteEditor — should remove only the clicked tag chip and keep the other tag chip visible when two tags exist
- [x] [정상] NoteEditor — should not display the removed tag after Save succeeds while the other remaining tag stays visible

### 경계

- [x] [경계] removeTag — should return an array with the same tags (no removal) when tagToRemove does not match any existing tag
- [x] [경계] removeTag — should not remove a tag when tagToRemove differs from it only in case (exact match only, no case-insensitive comparison)
- [x] [경계] removeTag — should return an empty array when removing the only remaining tag
- [x] [경계] TagInput — should call onRemove only with the tag whose delete button was clicked, leaving other tags' handlers uncalled, when multiple tags are rendered
- [x] [경계] NoteEditor — should not call updateNote or createNote while a tag has been removed locally but Save has not been clicked yet
- [x] [경계] NoteEditor — should restore the removed tag when the note is reselected after the actual Cancel button is clicked without saving
- [x] [경계] NoteEditor — should call updateNote with an empty tags array when the only tag is removed and Save is clicked
- [x] [경계] NoteEditor — should restore both the removed tag and the remaining tag when the note is reselected after the actual Cancel button is clicked, given a note with two tags

### 예외

(해당 없음 — `removeTag`, `TagInput`, 이번 이슈 범위의 `NoteEditor` 변경 모두 예외를 던지지
않는 순수 함수/UI 로직이다)

## AC 커버리지

- AC 1 (`react` 칩의 × 클릭 → `react`만 사라지고 `todo` 유지) → 정상 `removeTag`(매칭 항목
  제거) + 정상 `TagInput`(칩마다 × 버튼, onRemove 호출) + 경계 `TagInput`(클릭한 태그만
  영향) + 정상 `NoteEditor`(즉시 화면 반영) + 정상 `NoteEditor`(두 태그 동시 존재 시 클릭한
  것만 사라지고 나머지는 유지 — `ac-verifier` 재검증에서 "단일 태그 노트로만 테스트돼 두
  태그가 동시에 떠 있는 상태에서의 통합 검증이 없다"는 갭 보완)
- AC 2 (저장 전에는 API 호출 없음) → 경계 `NoteEditor`(저장 전 API 미호출)
- AC 3 (저장 시 `updateNote`에 삭제 반영) → 정상 `NoteEditor`(updateNote 호출) + 정상
  `NoteEditor`(저장 후에도 삭제한 태그는 안 보이고 나머지 태그는 남아있음 — `ac-verifier`
  재검증에서 "호출 인자만 검증되고 저장 후 화면 상태는 미검증"으로 지적된 갭 보완)
- AC 4 (취소 시 API 미호출 + 재열람 시 삭제한 태그 복원) → 경계 `NoteEditor`(실제 취소 버튼
  클릭 후 재선택 시 복원 — TAG-1 `ac-verifier` 재검증에서 "재선택 시뮬레이션만으로는 실제
  취소 버튼 클릭 경로가 검증되지 않는다"는 갭이 발견된 바 있어, 이번엔 처음부터 실제 취소
  버튼을 클릭하는 형태로 작성한다) + 경계 `NoteEditor`(AC 원문과 동일하게 태그 2개짜리
  노트에서 하나만 삭제 후 취소 → 재열람 시 둘 다 복원되는지 확인 — `ac-verifier` 재검증에서
  "원문은 2개 태그 시나리오인데 테스트는 1개 태그 노트를 썼다"는 편차 보완)
- AC 5 (태그 0개로 저장 가능) → 경계 `removeTag`(마지막 태그 제거 시 빈 배열) + 경계
  `NoteEditor`(updateNote를 `tags: []`로 호출)

**총 5개 AC 중 5개 모두 시나리오로 커버됨** (AC1/AC3/AC4는 2026-08-12 `ac-verifier` 재검증에서
발견된 갭을 보완하는 시나리오 3건이 추가되어 부분 충족 → 충족으로 승격 대상).

## 보안 게이트 결과 (`tdd-security-gate`, 2026-08-12)

- **타입 오류**: `npx tsc --noEmit` — 0건, clean.
- **`.env` 노출**: 프로젝트에 `.env`/`.env.local`/`.env.example` 파일 없음, `import.meta.env`
  사용도 없음 — 해당 없음.
- **의존성 취약점**: `npm audit` — 9건(low 1, high 6, critical 2). TAG-1과 동일하게 전부
  `devDependencies` 트리(`vite`, `concurrently` 및 하위 의존성 `postcss`, `js-yaml`, `nanoid`,
  `ws`, `shell-quote`, `brace-expansion`, `@babel/core`)에만 있고, 런타임 의존성(`react`,
  `react-dom`)에는 없음 → **"권장 수정"**으로 분류. `fixAvailable: true`(`npm audit fix`로
  `--force` 없이 해결 가능)하나 이번 게이트에서는 적용하지 않고 보류.
- **결론**: "즉시 수정 필요" 항목 없음 → 이슈 #6(TAG-2) 커밋 게이트 통과.
