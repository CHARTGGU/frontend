# 온보딩 스포트라이트 코치마크 설계

## 목적

처음 접속한 사용자에게 **1회만** 핵심 기능 위치를 안내하는 온보딩 가이드.
화면 전체를 반투명 어둡게 덮고 특정 UI 요소 하나만 "구멍"을 뚫어 밝게 강조(spotlight)한 뒤,
옆에 말풍선(coachmark)으로 설명을 띄운다. 여러 단계로 진행한다.

## 범위

- **포함**: 4단계 스포트라이트 가이드, 동적 위치 측정, 말풍선 viewport 보정, 클릭/버튼으로 진행·종료, 스크롤 잠금, localStorage 1회 표시 제어, 재사용 가능한 범용 엔진.
- **제외**: 다국어, 단계 건너뛰기 UI("그만 보기" 별도 버튼), 애니메이션 트랜지션 라이브러리, 모바일 대응(데스크탑 전용 앱).

## 단계 구성 (핵심 4단계)

| # | 타깃 (`data-onboarding`) | 제목 | 설명 |
|---|------|------|------|
| 1 | `symbol` | 종목 선택 | 보고 싶은 코인을 골라보세요 |
| 2 | `indicator` | 지표 추가 | MA·BB·RSI 등 보조지표를 켜고 끌 수 있어요 |
| 3 | `skin` | 스킨 적용 | 차트에 배경·캐릭터 스킨을 입혀보세요 |
| 4 | `export` | 이미지 저장 | 꾸민 차트를 PNG로 내보낼 수 있어요 |

타깃은 기존 컴포넌트(`Toolbar`의 SymbolSelect/IndicatorMenu/ExportButton, `SkinSidebar`)에
`data-onboarding="<id>"` 속성만 부착해 연결한다. 기존 컴포넌트 로직은 변경하지 않는다.

## 아키텍처

작은 파일 다수 원칙. 모든 코드는 `'use client'`(브라우저 DOM 측정 필요).

```
features/onboarding/
  steps.ts             # ONBOARDING_STEPS 배열 (id, title, description). 순서 = 진행 순서
  useOnboarding.ts     # 표시여부(localStorage) + 현재 stepIndex + next()/close() 상태머신
  useTargetRect.ts     # data-onboarding 셀렉터 → DOMRect 측정 + resize/scroll/RO 추적
  OnboardingGuide.tsx  # 본체: 훅 결합, Spotlight + Coachmark 렌더 결정
  Spotlight.tsx        # 구멍 뚫린 어두운 마스크 (box-shadow 트릭)
  Coachmark.tsx        # 말풍선 (제목·설명·점 인디케이터·다음/확인 버튼) + viewport 보정
lib/onboardingStorage.ts  # try/catch localStorage 래퍼 (getSeen/setSeen)
```

`AppShell`에 `<OnboardingGuide steps={ONBOARDING_STEPS} />` 한 줄 추가.

### 각 유닛 책임

- **steps.ts**: 순수 데이터. `{ id, title, description }[]`. 타깃 셀렉터는 `[data-onboarding="${id}"]`로 파생.
- **lib/onboardingStorage.ts**: `getSeen(): boolean`, `setSeen(): void`. 내부에서 try/catch. read 실패 → `false` 반환(=안 봤음 취급 → 표시). write 실패 → 조용히 무시.
- **useOnboarding(stepCount)**: 마운트 시 `getSeen()` 확인 → 안 봤으면 `isOpen=true, stepIndex=0`. `next()`는 다음 단계로, 마지막이면 `close()`. `close()`는 `setSeen()` 후 `isOpen=false`. 반환: `{ isOpen, stepIndex, isLast, next, close }`.
- **useTargetRect(selector, enabled)**: `enabled`일 때 셀렉터로 요소를 찾아 `getBoundingClientRect()` 측정. `resize`/`scroll`(capture) 이벤트 + `ResizeObserver`를 `requestAnimationFrame`으로 throttle 해 갱신. 요소 없으면 `null` 반환. 마운트 직후 요소가 아직 없을 수 있어, 못 찾으면 짧게 rAF 재시도(최대 N프레임).
- **Spotlight.tsx**: `rect`(+패딩) 위치에 절대배치 div. `box-shadow: 0 0 0 9999px rgba(0,0,0,0.6)`로 주변만 어둡게, 구멍 부위는 투명. 라운드·미세 글로우. `pointer-events` 설정으로 클릭을 오버레이가 가로채 밑 요소 직클릭 방지.
- **Coachmark.tsx**: `rect` 기준 말풍선 배치. 기본 아래 → 공간 부족 시 위/옆 → 최종 viewport 경계 clamp(좌우상하 여백 유지). 내부: 제목, 설명, 점 인디케이터(현재 강조), `다음`(마지막은 `확인`) 버튼. 단계/전체 수 표시.

## 데이터 / 상호작용 흐름

1. `AppShell` 마운트(dynamic, ssr:false) → `OnboardingGuide` 마운트.
2. `useOnboarding`이 `getSeen()` 확인. 봤으면 아무것도 렌더 안 함(null).
3. 안 봤으면 `isOpen=true`. `document.body.overflow='hidden'`(스크롤 잠금).
4. 현재 step의 `useTargetRect`로 타깃 사각형 측정.
   - 측정 성공 → Spotlight + Coachmark 렌더.
   - 타깃 못 찾음(요소 부재) → 해당 단계 자동 skip(`next()`).
5. **진행/종료(모두 `next()`/`close()` 경로)**:
   - 오버레이 빈곳 클릭 → `next()`
   - 강조 영역(스포트라이트) 클릭 → `next()`
   - `다음` 버튼 → `next()`
   - 마지막 단계에서 위 셋 중 무엇이든 → `close()`(= `확인` 동작)
6. `close()` → `setSeen()` 저장 + 스크롤 잠금 복구 + 언마운트.

## 스포트라이트 구현 상세 (box-shadow 트릭)

```tsx
// rect = 타깃 + padding
<div
  style={{
    position: "fixed",
    top: rect.top, left: rect.left,
    width: rect.width, height: rect.height,
    borderRadius: 8,
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
    pointerEvents: "auto", // 클릭 가로채기
  }}
  onClick={onNext}
/>
```

전체를 덮는 투명 클릭 레이어(빈곳 클릭용)를 그 아래 깔고, 둘 다 `onClick={onNext}`.
SVG mask 대비 장점: 구현 단순, 부드러운 그림자 경계, 리플로우 없음.

## 위치 추적 (CLAUDE.md §5 패턴 준수)

- `useLayoutEffect`에서 1차 측정(페인트 전 깜빡임 방지).
- `window` `resize` + `scroll`(capture: true, 내부 스크롤 포함) 리스너.
- `ResizeObserver`로 타깃/레이아웃 크기 변화 감지.
- 모든 갱신은 `requestAnimationFrame`으로 throttle, cleanup에서 cancel.
- 단계 전환 시 selector 바뀌면 자동 재측정.

## 말풍선 viewport 보정

- 선호 순서: 타깃 아래 중앙 → 위 → 오른쪽 → 왼쪽 (공간 충분한 첫 위치).
- 배치 후 좌/우/상/하가 viewport(여백 16px) 밖이면 안쪽으로 clamp.
- 말풍선 크기는 측정(`ref` + `getBoundingClientRect`) 후 보정 — 1프레임 측정→보정.

## 에러 처리 / 안전성

- localStorage 접근 불가(시크릿 모드·차단 등): `onboardingStorage`의 try/catch가 흡수. read 실패는 "안 봤음"으로, write 실패는 무시 → 앱은 정상 동작.
- 타깃 DOM 부재: 해당 단계 skip, 전부 부재면 즉시 close(무한 루프 방지 위해 skip은 단계당 1회 시도 제한).
- 언마운트/close 시 스크롤 잠금·이벤트 리스너·rAF 모두 정리.

## 테스트 계획

- `onboardingStorage`: getSeen/setSeen 정상, localStorage throw 시 graceful(read→false, write→무시). (jsdom)
- `useOnboarding`: seen=false→open, next 진행, 마지막 next→close 시 setSeen 호출, seen=true→닫힘.
- 말풍선 clamp 로직(순수 함수로 분리)에 대한 단위 테스트: 경계 밖 좌표 입력 → 안쪽 보정 좌표 반환.
- (수동) 브라우저에서 4단계 진행, 스크롤 잠금, 새로고침 시 미표시 확인.

## 미해결 / 결정 사항

- 단계별 문구는 위 표 기준 확정(추후 copy 조정 가능).
- localStorage read 실패 → **표시** 정책 확정.
- 버전 키 `chartskin:onboarding:seen:v1` — 향후 가이드 개편 시 v2로 올려 재노출 가능.
