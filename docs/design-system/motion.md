# 모션 · Hover · Press

전체 맥락은 [`README.md`](./README.md) 참고.

## 토큰

| 항목      | 권장 값                                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 지속 시간 | 120–200ms (Tailwind `duration-150`이 가장 근접)                                                                                                      |
| 이징      | `cubic-bezier(0.2,0,0,1)` — Tailwind 기본 이징에 없으므로 arbitrary 값 `ease-[cubic-bezier(0.2,0,0,1)]`로 지정                                       |
| 허용 속성 | `opacity`, `border-color`만. `transition-all`처럼 범위가 넓은 트랜지션은 지양 — 현재 `NoteItem.tsx`의 `transition-all` 사용이 이 원칙에서 벗어난 예. |
| 금지      | bounce, spring, parallax, 장식적 반복 애니메이션. 유일하게 허용되는 "애니메이션"은 상태 표시(예: 저장 중)에 쓰는 담백한 깜빡임(blink) 정도.          |

## Do / Don't

- **DO** hover는 투명도 40–55%로 낮추거나(링크/아이콘), CTA는 `#111`에 가까운 near-black으로
  살짝 어둡게.
- **DO** 선택/활성 상태는 흑백 반전(예: 선택된 항목 = 검정 채움)으로 표현한다.
- **DO** 트랜지션은 120–200ms, `cubic-bezier(0.2,0,0,1)`, `opacity`/`border-color`만.
- **DON'T** hover/press에서 색상 변화, 확대(scale-up), 리프트(그림자로 뜨는 효과)를 쓰지 않는다.
- **DON'T** `transition-all`처럼 범위가 넓은 트랜지션을 쓰지 않는다.
