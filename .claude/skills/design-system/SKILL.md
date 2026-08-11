---
name: design-system
description: 이 노트 앱에서 Tailwind 클래스를 고르거나, 컬러/스페이싱/타이포/보더/섀도우/모션을
  정하거나, 새 UI 컴포넌트를 만들 때 가장 먼저 참고. YEEZY 브루탈-미니멀 디자인 시스템을 이 앱에
  맞게 재해석한 규칙(docs/design-system/)의 진입점.
trigger: /design-system
---

# /design-system

스타일/CSS/Tailwind 관련 코드를 쓰기 **전에** 먼저 읽는다. 이 파일 자체는 짧게 유지하고, 실제
값과 Do/Don't는 `docs/design-system/`의 관심사별 파일에 있다 — 작업에 맞는 파일만 골라 읽는다.

## 철학 (한 문단 요약)

순백(`#FFFFFF`) 캔버스 + 순흑(`#000000`) UI, 단일 모노스페이스 서체, 하드엣지(radius 0,
그림자 없음), 위계는 위치·여백으로만 표현하고 상태는 색이 아니라 반전(inversion)·투명도로
표현한다. 담백하고 사무적인 톤 — 이모지·느낌표·설득형 카피 없음. 자세한 배경과 이 앱에 맞춘
예외(한글 처리, destructive 색)는 `docs/design-system/README.md` 참고.

## 하려는 작업 → 읽을 파일

| 하려는 작업                           | 읽을 파일                               |
| ------------------------------------- | --------------------------------------- |
| 색상 클래스 선택                      | `docs/design-system/colors.md`          |
| 폰트/텍스트 스타일                    | `docs/design-system/typography.md`      |
| 여백/패딩/마진                        | `docs/design-system/spacing.md`         |
| 보더/라운드/그림자                    | `docs/design-system/borders-shadows.md` |
| hover/press/트랜지션                  | `docs/design-system/motion.md`          |
| 새 컴포넌트(버튼/인풋/모달/태그칩 등) | `docs/design-system/components.md`      |
| 화면에 노출되는 새 문구 작성          | `docs/design-system/content-voice.md`   |
| 전체 맥락/배경/예외 사항이 궁금할 때  | `docs/design-system/README.md`          |

## 주의

실제 코드(`src/index.css`, `NoteItem.tsx` 등)에는 아직 이 시스템이 적용되지 않았다. 적용 시
위 문서들의 "권장 값"을 기준으로 삼는다 — 지금 코드의 값과 다르다고 해서 문서가 틀린 게 아니라,
아직 리스타일링이 안 된 것이다.
