---
name: test-scenarios
description: >
  GitHub 이슈 하나를 받아 "함수/컴포넌트 시그니처 확정 → 테스트 시나리오 도출"까지 순서대로
  처리하는 스킬. `/test-scenarios {이슈 번호}`(예: `/test-scenarios 5`)로 호출한다. 이슈 내용과
  관련 feature의 prd.md, 코드베이스의 기존 패턴을 참고해 함수 시그니처·에러 케이스·컴포넌트
  Props 타입을 먼저 확정하고 사용자 승인을 받은 뒤, 그 시그니처를 근거로 정상/경계/예외
  테스트 시나리오를 도출해 이슈의 Acceptance Criteria와 전부 대조한다. TDD로 테스트 코드를
  쓰기 직전, "무엇을 테스트할지"부터 문서로 합의하고 싶을 때 반드시 이 스킬을 사용한다 —
  이슈 번호를 주며 "시그니처부터 정하자", "테스트 시나리오 뽑아줘", "이 이슈 테스트할 거
  목록으로 만들어줘", "AC 다 커버되는지 확인해줘" 같은 요청이 오면 명시적으로 스킬 이름을
  부르지 않아도 사용한다. 구현 코드와 테스트 코드는 절대 작성하지 않는다 — 순수하게
  시그니처/시나리오를 문서화하는 단계이며, `/feature-planner`가 만든 PRD/이슈 다음에 오는
  단계다.
---

# /test-scenarios

GitHub 이슈 하나를 받아 다음 두 산출물을 순서대로 만든다. 화살표는 "이전 산출물을 사용자가
승인해야 다음으로 넘어간다"는 뜻이며, `[GATE]`로 표시된 지점에서 실제로 멈춰서 승인을
기다린다. **게이트를 건너뛰고 혼자 끝까지 진행하지 않는다** — 이 스킬은 테스트 코드를 짜기
전에 "무엇을 어떤 형태로 테스트할지"를 사람과 먼저 합의해두기 위한 것이라, 합의 없이 만든
시그니처/시나리오는 스킬의 존재 이유를 무너뜨린다.

```
GitHub Issue #{N} + docs/features/{name}/prd.md + 코드베이스 기존 패턴
    ↓ 1단계 — 시그니처 확정 (함수 시그니처 / 에러 케이스 / Props 타입, 구현 코드 없음)
    [GATE] 시그니처 승인
    ↓ 2단계 — docs/features/{name}/issue-{N}.md 상단에 기록
    ↓ 3단계 — 시그니처 기반 테스트 시나리오 도출 (정상/경계/예외, 시나리오 문장만)
    ↓ 4단계 — GitHub 이슈 AC와 대조해 커버리지 확인·보강
    ↓ 5단계 — docs/features/{name}/issue-{N}.md 하단에 기록
    [GATE] 시나리오 승인
```

## 언제 쓰나

- 사용자가 GitHub 이슈 번호를 주며 시그니처/테스트 시나리오를 만들어달라고 할 때
- TDD(Red-Green-Refactor)를 시작하기 직전, "이번 이슈에서 뭘 테스트해야 하는지"부터 정리하고
  싶을 때
- `/test-scenarios {N}`으로 직접 호출되었을 때

이 스킬이 하지 않는 것: 구현 코드 작성, 테스트 코드(`*.test.ts(x)`) 작성. 둘 다 이 스킬 이후
단계(TDD 사이클)의 일이다. 이 스킬의 산출물은 오직 마크다운 문서 하나다.

## 입력

`$ARGUMENTS`: GitHub 이슈 번호 (예: `5`).

## 0단계 — 이슈가 속한 feature 찾기

`docs/features/{name}/issue-{N}.md`를 어느 `{name}` 아래에 쓸지부터 정해야 한다.

1. `gh issue view {N} --repo <owner>/<repo>`로 이슈 제목/본문을 읽는다.
2. `docs/features/*/issues.md`를 뒤져 제목이나 이슈 번호가 언급된 feature 디렉토리를 찾는다
   (예: 이슈 제목이 "TAG-1: ..."이면 `docs/features/tag/issues.md`에서 TAG-1을 찾는다).
3. 매칭되는 feature를 찾지 못하면, 추측하지 말고 사용자에게 어느 `docs/features/{name}/`에
   속하는지 물어본다.

## 1단계 — 시그니처 확정

다음 세 가지를 참고해 시그니처를 정한다:

- **대상 이슈**: `gh issue view {N}`으로 읽은 설명과 Acceptance Criteria. AC에 나온 각
  Given/When/Then이 실제로 어떤 함수 호출·컴포넌트 렌더링으로 이어지는지 역산한다.
- **관련 PRD**: `docs/features/{name}/prd.md`의 "기술 결정" 섹션. 이미 ADR로 확정된 아키텍처
  (어떤 계층에 로직을 둘지, 어떤 함수/컴포넌트를 새로 만들지)를 그대로 따른다 — 이 스킬이
  다시 아키텍처를 재검토하지 않는다.
- **코드베이스 기존 패턴**: `src/api/notes.ts`(함수 시그니처 스타일: `동사+명사`, id가 있으면
  첫 인자), `src/context/NotesContext.tsx`(mutation 함수 네이밍), 기존 컴포넌트의
  `ComponentNameProps` 인터페이스 선언 패턴. `CLAUDE.md`의 "구현 패턴" 섹션에 이미 규칙이
  정리되어 있으니 새로 판단하지 말고 그대로 따른다.

확정할 항목:

- **함수 시그니처**: 이름, 파라미터 타입, 반환 타입 (예: `filterNotes(notes: Note[], query: string, fields: SearchableField[]): Note[]`)
- **에러 케이스**: 어떤 입력/상태에서 에러를 던지는지, 던지지 않는다면 그것도 명시한다
  (순수 함수라 에러 케이스가 없는 경우도 "없음"이라고 적어서 빠뜨린 게 아니라 확인한
  것임을 남긴다)
- **컴포넌트 Props 타입**: 새로 추가되거나 바뀌는 `ComponentNameProps` 인터페이스 전체

**절대 구현 코드를 쓰지 않는다.** 함수 본문이나 컴포넌트 JSX를 작성하고 싶은 유혹이 들어도,
타입 시그니처 선언 한 줄(`function X(...): Y`, `interface XProps { ... }`)까지만 쓴다 — 본문을
쓰기 시작하면 사실상 구현이 시작된 것이고, 그러면 이 스킬 뒤에 올 TDD의 Red 단계가 의미를
잃는다.

## [GATE] 시그니처 검토

확정한 시그니처 전체를 사용자에게 보여주고 승인을 받는다. 여기서 승인 없이 다음 단계로
넘어가지 않는다.

## 2단계 — 시그니처 기록

승인된 시그니처를 `docs/features/{name}/issue-{N}.md` 파일 **상단**에 기록한다. 파일이 없으면
새로 만든다. 형식은 아래 "문서 포맷" 참고.

## 3단계 — 테스트 시나리오 도출

승인된 시그니처(파라미터 타입, 반환 타입, 에러 케이스, Props 타입)를 근거로 시나리오를
뽑는다. 시그니처에 없는 동작을 상상해서 시나리오를 만들지 않는다 — 시그니처가 이미
"입력이 이렇게 주어지면 출력이 이렇다"를 규정하고 있으므로, 시나리오는 그 규정을 구체적인
값으로 예시화하는 작업이다.

- **분류**: 정상 / 경계 / 예외 세 가지로 나눈다.
  - 정상: 가장 흔한 입력으로 기대한 대로 동작하는 경우
  - 경계: 빈 값, 최댓값, 중복, 대소문자, 공백처럼 시그니처가 명시한 규칙의 가장자리
  - 예외: 시그니처에 명시된 에러 케이스가 실제로 던져지는 경우 (에러 케이스가 "없음"이라면
    이 분류는 비워도 된다)
- **형식**: `[정상/경계/예외] 함수명 — should [기대동작] when [조건]`
  (예: `[경계] filterNotes — should return all notes when query is empty string`)
- 테스트 코드는 작성하지 않는다. 시나리오 문장까지만 쓴다.

## 4단계 — AC 커버리지 대조

`gh issue view {N}`으로 Acceptance Criteria(Given/When/Then) 목록을 다시 읽는다. 각 AC 항목이
3단계에서 도출한 시나리오 중 최소 하나로 커버되는지 확인한다. 커버되지 않는 AC가 있으면
그 AC를 위한 시나리오를 추가로 도출한다 (형식은 3단계와 동일). 이 단계가 끝나면 "AC N개 중
N개 모두 시나리오로 커버됨"을 명시적으로 확인해서 사용자에게 보여준다.

## 5단계 — 시나리오 기록

완성된 시나리오 전체(4단계에서 추가된 것 포함)를 같은 `docs/features/{name}/issue-{N}.md`
파일 **하단**에 추가한다.

## [GATE] 시나리오 검토

완성된 시나리오와 AC 커버리지 결과를 사용자에게 보여주고 승인을 받는다. 승인 전까지 이
스킬 밖의 다음 작업(테스트 코드 구현 등 TDD 사이클)으로 넘어가지 않는다.

## 문서 포맷 (`docs/features/{name}/issue-{N}.md`)

```markdown
# 이슈 #{N}: {이슈 제목}

## 시그니처 (승인됨)

### 함수 시그니처

\`\`\`typescript
function filterNotes(notes: Note[], query: string, fields: SearchableField[]): Note[]
\`\`\`

### 에러 케이스

- 없음 (순수 함수, 잘못된 입력에도 예외를 던지지 않고 빈 배열/원본 배열로 처리)

### Props 타입

\`\`\`typescript
interface NoteItemProps {
note: Note;
isSelected: boolean;
searchQuery: string;
onSelect: (id: string) => void;
onDelete: (id: string) => void;
}
\`\`\`

## 테스트 시나리오

### 정상

- [정상] filterNotes — should return notes whose title includes the query when query matches a title

### 경계

- [경계] filterNotes — should return all notes when query is an empty string
- [경계] filterNotes — should ignore case when comparing query and note fields

### 예외

(해당 없음)

## AC 커버리지

- AC 1 (검색어로 제목 필터링) → 정상 시나리오 1
- AC 2 (빈 검색어 시 전체 표시) → 경계 시나리오 1
- ...
- 총 N개 AC 중 N개 모두 커버됨
```

## 참고

- 이 스킬은 `/feature-planner`(요구사항 인터뷰 → PRD → 이슈 분해)의 다음 단계다.
  `/feature-planner`가 만든 `prd.md`와 GitHub 이슈를 입력으로 받는다.
- 게이트 설계 원칙은 `/feature-planner`와 동일하다: 사람과 합의된 산출물만 다음 단계의
  입력이 될 수 있다.
