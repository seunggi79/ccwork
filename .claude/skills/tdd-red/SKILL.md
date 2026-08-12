---
name: tdd-red
description: >
  `/test-scenarios`가 승인해둔 시그니처·테스트 시나리오를 실제로 실패하는(Red) 테스트
  코드로 옮기는 스킬. `/tdd-red {이슈 번호}`(예: `/tdd-red 5`)로 호출한다.
  `docs/features/{name}/issue-{N}.md`에 이미 기록된 "시그니처 (승인됨)"과 "테스트 시나리오"
  섹션만 근거로 시나리오 하나하나를 `it('should ... when ...')` 테스트로 작성하고, 작성 직후
  바로 실행해 실패를 확인한 뒤 다음 시나리오로 넘어간다. TDD Red-Green-Refactor 사이클의
  Red 단계를 시작할 때, 또는 "이슈 시나리오를 테스트 코드로 옮겨줘", "실패하는 테스트부터
  짜줘", "TDD 레드 단계 시작하자", "이 이슈 테스트 코드 작성해줘" 같은 요청이 오면 명시적으로
  스킬 이름을 부르지 않아도 사용한다. 이 스킬은 테스트 파일(`*.test.ts`/`*.test.tsx`)만
  생성·수정하며, `src/`의 구현 코드는 절대 건드리지 않는다 — 구현은 이 스킬 다음 단계(Green
  단계)의 일이다. 승인된 시그니처/시나리오 문서가 아직 없다면 먼저 `/test-scenarios`부터
  실행하도록 안내한다.
---

# /tdd-red

`docs/features/{name}/issue-{N}.md`에 이미 승인되어 있는 시그니처와 테스트 시나리오를 실제
Vitest 테스트 코드로 옮기는 단계다. 여기서는 아무것도 새로 설계하지 않는다 — 시그니처와
시나리오는 이미 사람이 합의한 것이므로, 이 스킬의 역할은 그 문장을 그대로 코드로
"번역"하고, 구현이 아직 없어서 정말로 실패하는지 하나씩 확인하는 것뿐이다.

```
docs/features/{name}/issue-{N}.md (승인된 시그니처 + 시나리오)
    ↓ 0단계 — 이슈가 속한 feature 찾기
    ↓ 1단계 — 문서에서 시그니처·시나리오 읽기 (승인 여부 확인)
    ↓ 2단계 — 시나리오 그룹 → 테스트 파일 매핑
    ↓ 3단계 — 시나리오 하나씩: 테스트 작성 → 즉시 실행 → 실패 확인 → 다음 시나리오
    ↓ 4단계 — 전체 완료 후 `npm test` 실행 → 전부 실패 확인
실패하는 테스트 스위트 (Red 완료, Green 단계로 인계)
```

## 언제 쓰나

- `/test-scenarios`로 시그니처·시나리오 문서가 이미 승인된 이슈에 대해 TDD를 시작할 때
- "이슈 N번 테스트 코드부터 짜자", "Red 단계 시작", "실패하는 테스트 먼저 만들어줘" 같은
  요청이 올 때
- `/tdd-red {N}`으로 직접 호출되었을 때

이 스킬이 하지 않는 것: 시그니처나 시나리오를 새로 만들거나 수정하는 것(그건
`/test-scenarios`의 일), `src/` 아래 구현 코드를 작성하거나 고치는 것(그건 Green 단계의
일). 테스트를 통과시키기 위해 구현 파일을 손대고 싶은 유혹이 들어도 참는다 — 지금은 "이
테스트가 왜 실패하는지"를 확인하는 단계이지, 통과시키는 단계가 아니다.

## 입력

`$ARGUMENTS`: GitHub 이슈 번호 (예: `5`).

## 0단계 — 이슈가 속한 feature 찾기

`docs/features/{name}/issue-{N}.md`의 `{name}`을 확정한다. `/test-scenarios`의 0단계와 동일한
방법을 쓴다: `gh issue view {N}`으로 제목을 확인하고, `docs/features/*/issues.md`에서 해당
이슈 번호나 제목을 찾아 소속 feature를 특정한다. 찾지 못하면 추측하지 말고 사용자에게 묻는다.

## 1단계 — 시그니처·시나리오 읽기

`docs/features/{name}/issue-{N}.md`를 읽는다. 이 파일에 "## 시그니처 (승인됨)"과 "## 테스트
시나리오" 섹션이 모두 있어야 진행할 수 있다. 둘 중 하나라도 없다면 이 스킬을 멈추고
사용자에게 먼저 `/test-scenarios {N}`을 실행해 시그니처·시나리오를 확정·승인받으라고
안내한다 — 승인되지 않은 시그니처를 근거로 테스트를 짜면 나중에 시그니처가 바뀔 때 테스트를
전부 다시 써야 한다.

## 2단계 — 시나리오 그룹 → 테스트 파일 매핑

"## 테스트 시나리오" 섹션의 각 시나리오는 `[분류] 함수명/컴포넌트명 — should ... when ...`
형식이다. 이 `함수명/컴포넌트명`으로 "## 시그니처" 섹션의 해당 소제목(예: "### 함수 시그니처
— `src/utils/tags.ts`", "### Props 타입 — `src/components/TagInput.tsx`")을 찾아 대상 파일
경로를 알아낸다.

- 테스트 파일 경로 = 대상 파일과 **같은 디렉토리** + `{파일명}.test.ts`(순수 함수/유틸) 또는
  `{파일명}.test.tsx`(컴포넌트, JSX를 렌더링하는 경우).
  예) `src/utils/tags.ts` → `src/utils/tags.test.ts`,
  `src/components/TagInput.tsx` → `src/components/TagInput.test.tsx`.
- 같은 파일을 대상으로 하는 시나리오가 여러 개면 한 테스트 파일에 모으고, 함수/컴포넌트별로
  `describe` 블록을 나눈다.
- 기존 컴포넌트를 수정하는 시나리오(예: `NoteEditor`)도 동일하게 처리한다 — 대상 파일은
  이미 존재하지만, 그 파일에 대응하는 `.test.tsx`가 없으면 새로 만든다.

이 매핑 결과(시나리오 → 테스트 파일 경로)를 먼저 목록으로 정리하고 다음 단계로 넘어간다.

## 3단계 — 시나리오를 테스트 코드로: 작성 → 즉시 실행 → 실패 확인

시나리오를 문서에 나온 순서(정상 → 경계 → 예외) 그대로, **하나씩** 처리한다. 한 번에 여러
시나리오를 몰아서 쓰지 않는다 — 몰아 쓰면 어떤 테스트가 잘못된 이유로 실패하는지(테스트
자체의 실수 때문인지, 구현이 없어서인지) 구분할 수 없게 된다.

각 시나리오마다:

1. **테스트 이름 만들기**: 시나리오 문장에서 `[분류] 함수명 — ` 접두사만 떼어내고 나머지
   `should ... when ...` 문장을 그대로 `it(...)`의 이름으로 쓴다. 시나리오 문서가 이미 이
   형식으로 작성돼 있으므로 새로 표현을 바꾸지 않는다.
2. **테스트 본문 작성**: 승인된 시그니처(파라미터 타입, 반환 타입, Props 타입)에 정확히
   맞춰 호출부를 작성한다. 시그니처에 없는 동작을 임의로 가정하지 않는다.
3. **즉시 실행**: `npx vitest run <테스트 파일 경로>`로 그 테스트 파일만 실행한다.
4. **실패 확인**: 실패하되, **원하는 이유로 실패하는지** 확인한다.
   - 정상적인 실패: 대상 함수/컴포넌트/파일이 아직 없어서 나는 `Cannot find module`,
     TypeScript 타입 에러, 또는 실제로 로직이 없어서 나는 assertion 실패. 이런 실패는 구현이
     없다는 신호이므로 그대로 두고 다음 시나리오로 넘어간다.
   - 잘못된 실패: 테스트 코드 자체의 오타, 잘못된 셀렉터, `await` 누락 등으로 나는 실패.
     이건 시나리오를 잘못 옮긴 것이므로 테스트 코드를 고치고 다시 실행한다.
   - **테스트가 통과해버리면** 시나리오를 잘못 짰거나(이미 성립하는 걸 테스트함) 시그니처
     해석을 잘못한 것이니, 시그니처 문서를 다시 확인하고 테스트를 수정한다.
     "should not ~ when ~"처럼 **부정문 시나리오**는 특히 조심한다 — 대상 컴포넌트/함수가
     아직 아예 없는 지금 시점엔 "안 나타난다/안 불린다"가 조건과 무관하게 항상 참이라
     거짓으로 통과하기 쉽다. 이럴 땐 단독으로 부재만 확인하지 말고, 조건이 다른 두 상태를
     같은 테스트 안에서 비교해 차이를 단언한다(예: "조건 A일 때 렌더링되는 요소 수가 조건
     B일 때보다 적어야 한다"). 지금은 두 조건 다 그 요소가 없어 개수가 같으므로 이 비교가
     실제로 실패하고, 구현이 조건부 렌더링을 갖추면 그때 차이가 생겨 통과한다.
5. 다음 시나리오로 이동.

대상 구현 파일(`src/utils/tags.ts`처럼 "신규 파일"로 표시된 것)이 아직 없어 `Cannot find
module` 에러가 나는 것은 **정상**이다. 이 에러를 없애려고 빈 스켈레톤 구현 파일을 만들지
않는다 — 그것도 `src/` 구현 코드를 건드리는 것이라 이 스킬의 제약을 벗어난다. import가
가리키는 파일이 없다는 사실 자체가 지금 단계에서는 유효한 "실패"다.

### 컨텍스트를 쓰는 컴포넌트 테스트할 때

`NoteEditor`처럼 `useNotes()`를 쓰는 컴포넌트는 `NotesProvider` 밖에서 렌더링하면 즉시
throw한다. 이런 컴포넌트를 테스트할 때는:

- `src/api/notes.ts`를 `vi.mock('../../api/notes')`(상대 경로는 테스트 파일 위치에 맞게
  조정)로 모킹해 실제 네트워크 요청이 나가지 않게 한다.
- 렌더링 시 대상 컴포넌트를 `<NotesProvider>...</NotesProvider>`로 감싼다.

**notes 로딩 타이밍에 주의한다.** `NotesProvider`는 마운트 시 `fetchNotes()`를 호출하고,
그 응답이 비동기로 도착한 뒤에야 `notes` state가 채워진다. `NoteEditor`처럼 `selectedNoteId`가
바뀔 때만 폼을 동기화하는 `useEffect`(의존성 배열이 `notes`를 포함하지 않는 경우가 흔함)를
가진 컴포넌트를, 처음부터 `selectedNoteId`가 채워진 상태로 마운트하면 `notes`가 아직
비어 있는 시점에 그 effect가 딱 한 번 실행되고 이후 다시 돌지 않아 폼이 영영 비어 있는
채로 남는 경우가 있다. 실제 앱에서는 노트를 선택하는 시점엔 이미 목록이 로드되어 있어서
이 문제가 나타나지 않으므로, 이건 기능 결함이 아니라 **테스트가 실제 사용 순서를 재현하지
못해서 생기는 "잘못된 실패"**다. 대상 컴포넌트를 먼저 `selectedNoteId={null}`처럼 아무것도
선택되지 않은 상태로 마운트해 로딩이 끝나길 기다린 뒤, 원하는 props로 `rerender`해서 실제
선택 흐름을 재현한다:

```typescript
async function renderEditor(props: NoteEditorProps) {
  const utils = render(
    <NotesProvider>
      <NoteEditor selectedNoteId={null} isCreating={false} onDone={props.onDone} />
    </NotesProvider>,
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0)); // fetchNotes 응답 microtask 플러시
  });
  utils.rerender(
    <NotesProvider>
      <NoteEditor {...props} />
    </NotesProvider>,
  );
  return utils;
}
```

같은 `<NotesProvider>`를 감싼 채로 `rerender`하면 React가 같은 위치의 같은 컴포넌트로
재조정하므로 내부 `notes` state는 유지된 채 자식(`NoteEditor`)의 props만 바뀐다 — 이 성질을
이용해 "취소 후 재선택" 같은 시나리오도 동일 헬퍼로 재현할 수 있다.

## 테스트 코드 컨벤션

- **위치**: 테스트 대상 파일과 같은 디렉토리.
- **파일명**: `{파일명}.test.ts`(순수 함수/유틸) 또는 `{파일명}.test.tsx`(컴포넌트).
- **describe**: 함수/컴포넌트 단위로 묶는다 (`describe('addTag', () => { ... })`).
- **it**: `"should [기대 동작] when [조건]"` 형식, 시나리오 문서의 문장을 그대로 사용.
- Vitest(`describe`/`it`/`expect`, `vitest.config.ts`에서 `globals: true`라 import 없이도
  전역으로 쓸 수 있지만, 이 프로젝트는 명시적으로 import하는 편이 기존 설정 파일들과 일관됨)
  - React Testing Library(`@testing-library/react`, 필요 시 `@testing-library/user-event`)를
    사용한다.

**순수 함수 예시** (`src/utils/tags.ts` → `src/utils/tags.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { addTag } from './tags';

describe('addTag', () => {
  it('should append the trimmed input as a new tag when input is a new, non-duplicate value', () => {
    expect(addTag(['react'], 'vue')).toEqual(['react', 'vue']);
  });

  it('should silently return the tags array unchanged (no error) when input is an empty string', () => {
    const tags = ['react'];
    expect(addTag(tags, '')).toBe(tags);
  });
});
```

**컴포넌트 예시** (`src/components/TagInput.tsx` → `src/components/TagInput.test.tsx`):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('should render one chip per tag in the tags prop', () => {
    render(<TagInput tags={['react', 'study']} onAdd={() => {}} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();
  });

  it('should call onAdd with the current input value and clear the input field when Enter is pressed', async () => {
    const handleAdd = vi.fn();
    render(<TagInput tags={[]} onAdd={handleAdd} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'urgent{enter}');
    expect(handleAdd).toHaveBeenCalledWith('urgent');
    expect(input).toHaveValue('');
  });
});
```

## 4단계 — 전체 완료 후 전체 실행

모든 시나리오를 테스트로 옮겼으면 `npm test`(=`vitest run`, 전체 스위트)를 한 번 실행해서
이번에 추가한 테스트가 **전부** 실패하는지 확인한다. 하나라도 통과한다면 3단계로 돌아가
원인(시나리오 오해석 또는 테스트 실수)을 찾는다. 결과를 사용자에게 요약해서 보여준다 — 몇
개 테스트 파일에 몇 개 시나리오를 옮겼고, 전부 예상대로 실패했는지.

## 제약

- **테스트 파일만 생성·수정한다.** `*.test.ts` / `*.test.tsx` 이외의 파일은 만들거나 고치지
  않는다.
- **`src/`의 구현 코드는 절대 수정하지 않는다.** 테스트를 통과시키기 위한 구현, 빈 스켈레톤
  파일, 타입 임시 선언 등 어떤 형태로도 손대지 않는다. 구현은 이 스킬 다음(Green 단계)의
  일이며, 별도 지시 없이 이 스킬 안에서 넘어가지 않는다.
- 시그니처·시나리오 문서 자체가 못 미덥거나 빠진 케이스가 있어 보여도, 이 스킬 안에서
  임의로 시나리오를 추가·수정하지 않는다 — 그건 `/test-scenarios`로 돌아가 다시 승인받아야
  할 일이다. 발견한 문제는 사용자에게 알리기만 한다.

## 참고

- 이 스킬은 `/test-scenarios`(시그니처 확정 → 시나리오 도출) 바로 다음 단계다.
  `/test-scenarios`가 만든 `docs/features/{name}/issue-{N}.md`를 입력으로 받는다.
- 이 스킬이 끝나면 "실패하는 테스트 스위트"가 남는다. 이후 구현을 채워 테스트를 통과시키는
  Green 단계는 이 스킬의 범위 밖이다.
