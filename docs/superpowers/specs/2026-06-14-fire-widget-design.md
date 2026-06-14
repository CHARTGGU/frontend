# 불타는 효과 위젯 (Fire Overlay) — 설계

> 위젯 카테고리에 "불타는 효과" 추가. 화면 하단 일부를 절차적 화염으로 채우는 배경 위젯.

---

## 배경 / 목적

차트에 "불타는" 감성 효과를 더하기 위한 위젯. 지표에 바인딩되지 않는 순수 장식 요소(`docs/feature_spec.md` §위젯 정의와 동일 분류).

레퍼런스 이미지: 화면 하단에서 주황/노랑 화염 파티클이 타오르고 위로 갈수록 어두운 빨강~검정으로 페이드되는 룩. 외부 asset(영상/GIF) 없이 **Doom Fire 알고리즘**(고전 절차적 불 시뮬레이션)으로 근접 재현.

---

## 레이어 순서 & 위치

```
[배경 스킨 레이어]  z-index: auto (기존)
[불 이펙트 레이어]  z-index: 1        ← 신규, 화면 하단 고정
[차트 캔버스]       z-index: 3 (lightweight-charts 내부 고정)
[지표 오버레이]     z-index: auto (DOM 순서상 위)
[고양이 위젯]       z-index: 4
```

- 차트 배경은 투명(`background: { color: 'transparent' }`)이므로 불 이펙트가 차트 뒤에서 비쳐 보임.
- 불 이펙트는 배경 스킨 이미지보다 앞쪽에 그려짐 (DOM 순서 + z-index 1로 배경의 auto보다 위).
- 컨테이너: `position: absolute; left:0; right:0; bottom:0; height: ${fireHeight}%`, `pointer-events: none`.

---

## 상태 — `stores/skinStore.ts` 확장

```ts
interface SkinState {
  // ...기존
  /** 불타는 효과 위젯 활성화 여부. */
  fireEnabled: boolean;
  /** 불 이펙트 영역 높이 (0~100, 화면 높이 %). */
  fireHeight: number;

  toggleFire: () => void;
  setFireHeight: (height: number) => void;
}
```

- 기본값: `fireEnabled: false`, `fireHeight: 30`.
- 기존 `persist({ name: "skin-settings" })`에 자동 포함 (partialize 없음 → 전체 저장).

---

## 렌더링 — `features/skin/FireOverlay.tsx`

**알고리즘 (Doom Fire)**
- 저해상도 그리드: 너비 160 × 높이 80 셀.
- 팔레트: 인덱스 0(투명/검정) → 진한 빨강 → 주황 → 노랑 → 흰색 (약 36색 그라데이션).
- 매 프레임:
  1. 맨 아래 행(row = height-1)은 항상 최대 강도(팔레트 최상단 인덱스)로 시드.
  2. 각 셀은 아래 행의 값을 참조해 무작위 감쇄(-0~3) + 좌우 무작위 흔들림(±1 column)으로 위 행에 전파.
  3. 강도 0이 된 셀은 완전 투명(해당 위치 렌더 안 함).
- 렌더: off-screen 그리드를 `canvas.width/height = 80×40`로 그리고, CSS로 컨테이너 전체 크기로 확대 (`width:100%; height:100%`, `imageRendering: 'pixelated'`는 사용하지 않음 — 부드러운 그라데이션을 위해 기본 스케일링).
- `requestAnimationFrame` 루프, CatOverlay와 동일 패턴으로 cleanup(`cancelAnimationFrame`) 처리.
- props 없음 — `fireHeight`는 `useSkinStore`에서 직접 구독해 컨테이너 height만 조절(캔버스 내부 그리드 크기는 고정 80×40, CSS로 늘림).

**컴포넌트 시그니처**
```tsx
export default function FireOverlay(): JSX.Element | null {
  const fireEnabled = useSkinStore((s) => s.fireEnabled);
  const fireHeight = useSkinStore((s) => s.fireHeight);
  if (!fireEnabled) return null;
  // canvas + rAF 루프
}
```

---

## UI — `features/skin/FireControls.tsx`

- `BackgroundControls.tsx`와 동일 패턴(같은 위치에 슬라이더 1개).
- `fireEnabled === false`면 `null` 반환.
- 슬라이더: `min=10 max=80 step=5`, 기본 30, label "불 높이".

**SkinSidebar 변경**
- `WIDGET_SKINS`에 항목 추가 (presets.ts):
  ```ts
  {
    id: "wg-fire",
    name: "불타는 효과",
    author: "ChartSkin",
    description: "화면 하단이 절차적으로 타오르는 화염 효과.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/fire-thumb.svg", // 신규 썸네일 (단색 그라데이션 SVG로 간단 제작)
  }
  ```
- 위젯 목록 렌더 시 `wg-fire` 카드의 applied 상태 = `fireEnabled`, onApply/onRemove = `toggleFire`.
- `wg-fire`가 적용 중이면 카드 바로 아래에 `FireControls` 렌더 (러닝캣 카드와 동일 위치 패턴이지만 컨트롤 추가 — `BackgroundControls`가 배경 카드 목록 위에 오는 것과 달리, 여기는 카드 onApply 토글 직후 인라인 배치).

---

## ChartView 렌더 순서 변경

`features/chart/ChartView.tsx`:
```tsx
<BackgroundLayer />
<FireOverlay />
<ChartCanvas />
<IndicatorOverlay />
<VolumeProfileOverlay />
```

모두 `captureRef` 컨테이너 내부 → PNG 내보내기(html-to-image)에 자동 포함, 별도 처리 불필요.

---

## 파일 목록

| 구분 | 파일 |
|------|------|
| 신규 | `features/skin/FireOverlay.tsx` |
| 신규 | `features/skin/FireControls.tsx` |
| 신규 | `public/skins/fire-thumb.svg` (위젯 카드 썸네일) |
| 수정 | `stores/skinStore.ts` (fireEnabled/fireHeight + 액션) |
| 수정 | `features/skin/presets.ts` (wg-fire 항목) |
| 수정 | `features/skin/SkinSidebar.tsx` (wg-fire 적용/해제 + FireControls 배치) |
| 수정 | `features/chart/ChartView.tsx` (렌더 순서에 FireOverlay 추가) |

---

## 테스트 / 검증

- 단위 테스트: 없음 (canvas 렌더링 로직, 기존 프로젝트도 시각 컴포넌트는 unit test 없음 — `indicators.test.ts`만 순수 함수 테스트).
- 수동 검증:
  1. `npm run dev` → 위젯 카드 "불타는 효과" 적용 → 화면 하단에 화염 애니메이션 표시 확인.
  2. 높이 슬라이더 10~80% 조정 → 영역 크기 변화 확인.
  3. 배경 스킨(밤하늘/캔디) 적용 후 불 이펙트 동시 적용 → 배경 위, 차트 뒤 레이어 순서 확인.
  4. PNG 내보내기 → 불 이펙트가 결과 이미지에 포함되는지 확인.
  5. 새로고침 후 설정(on/off, 높이) 유지 확인 (persist).

---

## 범위 제외 (Out of scope)

- 색상 커스터마이징(다른 색 화염) — Phase2 색상 테마와 함께 추후 검토.
- 화염 강도/속도 조절 — 높이 슬라이더만 제공.
