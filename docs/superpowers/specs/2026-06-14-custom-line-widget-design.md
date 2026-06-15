# 커스텀 라인 그리기 위젯 — 설계

> 차트 좌상단 플로팅 버튼으로 스타일(고양이 꼬리/리본/번개/무지개)을 고른 뒤, 차트 위에 직선을 그려 꾸미는 인터랙티브 드로잉 도구. 그려진 선은 클릭해 선택 → 끝점 드래그로 위치 변경, 스타일 재선택, 삭제 가능.

---

## 배경 / 목적

기존 위젯(고양이, 불 효과, 기영이)과 달리 사용자가 화면 위에 자유롭게 "장식 선"을 여러 개 그릴 수 있는 도구. 차트 좌표·지표 바인딩과 무관한 순수 데코레이션(`docs/feature_spec.md` §위젯 정의와 동일 분류).

---

## 레이어 순서

```
[배경 스킨 레이어]   z-index: 0
[불 이펙트 레이어]   z-index: 0
[차트 캔버스]        z-index: 3 (lightweight-charts 내부 고정)
[지표 오버레이]      z-index: 5
[뛰어다니는 고양이]  z-index: 6
[기영이 위젯]        z-index: 7
[커스텀 라인]        z-index: 8  ← 신규, 최상단
```

- `lib/zLayers.ts`에 `lineDrawing: 8` 추가.
- 컨테이너는 `position:absolute; inset:0`. 기본 `pointer-events:none`이지만 그리기 모드 중엔 `auto`로 전환. 개별 선/핸들은 항상 `pointer-events:auto`(컨테이너가 none이어도 자식은 이벤트 수신 가능).

---

## 상태 — `stores/skinStore.ts` 확장

```ts
export type LineStyleId = "cat-tail" | "ribbon" | "lightning" | "rainbow";

export interface CustomLine {
  id: string;
  styleId: LineStyleId;
  /** 컨테이너 기준 px 좌표. 차트 좌표와 무관 (kiyoungi와 동일 방식). */
  x1: number; y1: number; x2: number; y2: number;
}

interface SkinState {
  // ...기존
  /** 사용자가 그린 커스텀 라인 목록. */
  customLines: CustomLine[];

  addCustomLine: (line: CustomLine) => void;
  updateCustomLine: (id: string, patch: Partial<CustomLine>) => void;
  removeCustomLine: (id: string) => void;
}
```

- 기본값: `customLines: []`.
- 기존 `persist({ name: "skin-settings" })`에 자동 포함 — partialize 없음.
- "현재 선택된 라인 id" / "그리기 모드 상태"는 store에 두지 않음 — `LineDrawOverlay` 로컬 state (새로고침 시 선택·모드 해제가 정상).
- `id`는 `crypto.randomUUID()`로 생성.

---

## 컴포넌트

### `features/skin/lineStyles.ts` (신규)
- `LINE_STYLES: LineStyleMeta[]` — 4종 스타일 메타 + render 함수.
- `interface LineStyleMeta { id: LineStyleId; name: string; render: (line: CustomLine, isSelected: boolean) => ReactNode; }`
- 모든 스타일은 직선 2점(`x1,y1,x2,y2`) 좌표를 입력으로 받아 SVG 요소(`<g>`)를 반환. 데이터 모델은 항상 직선이고, 시각적 곱선/지그재그 등은 렌더 함수 내부에서만 계산.
- 공통: 각 스타일 렌더 결과에 투명 hit-stroke(`stroke="transparent" strokeWidth={20} pointerEvents="stroke"`)를 포함해 클릭 판정 영역 확보.
- 그래디언트(rainbow) 등 인스턴스별 `<defs>`가 필요한 스타일은 `id` 기반 고유 키(`gradient-${line.id}`) 사용 — 여러 선 동시 존재 시 충돌 방지.

#### 1. 고양이 꼬리 (`cat-tail`)
- 점1(굵기 ~16px) → 점2(굵기 ~3px) 테이퍼 폴리곤 `<path fill="#D98E4A">`.
- 폴리곤 위에 진한 갈색(`#A8612A`) 사선 stripe 2~3개(타비 패턴).
- 점2 끝에 작은 원 2~3개 겹쳐 fluffy tuft.

#### 2. 리본 (`ribbon`)
- 폭 ~12px 평행사변형 `<path fill="#FF8FB1">`.
- 중앙에 흰색 점선(`<line strokeDasharray>`).
- 점2 끝에 리본 매듭: 삼각형 2개(나비 날개) + 중앙 작은 원, 선 각도에 맞춰 `transform: rotate()`.

#### 3. 번개 (`lightning`)
- 점1→점2를 4~5 구간으로 나눠 고정 시드 jitter(±8px, 수직방향)로 zigzag `<polyline>` 생성.
- 이중 스트로크: 바깥 `stroke-width:10 opacity:.3 #FFE14D`(glow) + 안쪽 `stroke-width:3 #FFE14D`.
- `strokeLinecap/linejoin: round`.

#### 4. 무지개 (`rainbow`)
- `<line>` + `<linearGradient gradientUnits="userSpaceOnUse">` (x1,y1,x2,y2 = 선 좌표), red→orange→yellow→green→blue→violet 6색.
- `stroke-width:10`, `strokeLinecap:round`.

### `features/skin/LineStylePicker.tsx` (신규)
- 4종 스타일 미리보기(가로 40px 샘플 라인, `lineStyles.ts`의 render 함수 재사용)를 가로 나열한 작은 팝업.
- `onSelect: (styleId: LineStyleId) => void` prop으로 두 컨텍스트에서 재사용:
  1. 플로팅 버튼에서 "그릴 스타일 선택"
  2. 선택된 라인의 "스타일 변경"
- 컨테이너에 `data-export-ignore="true"`.

### `features/skin/LineDrawOverlay.tsx` (신규)
- 컨테이너 `<svg>` (`position:absolute; inset:0; width:100%; height:100%; zIndex: Z_LAYER.lineDrawing`).
- 좌상단 플로팅 ✏️ 버튼 (`data-export-ignore="true"`, `pointer-events:auto`).
- 로컬 state: `mode: 'idle' | 'picking' | 'drawing'`, `pendingStyle: LineStyleId | null`, `selectedId: string | null`, `draft: {x1,y1,x2,y2} | null`(그리기 중 미리보기).
- **흐름**:
  1. 버튼 클릭 → `mode='picking'`, `<LineStylePicker>` 표시.
  2. 스타일 선택 → `mode='drawing'`, `pendingStyle` 설정, picker 닫힘. SVG `pointer-events:auto`, 커서 `crosshair`.
  3. pointerdown(차트 영역) → `draft` 시작점 설정. pointermove → `draft` 끝점 갱신(미리보기 렌더). pointerup → 드래그 거리 < 10px면 취소, 아니면 `addCustomLine({ id: crypto.randomUUID(), styleId: pendingStyle, ...draft })` → `mode='idle'`, `selectedId=새id`.
- `customLines.map(...)` → 각 선을 해당 스타일 `render(line, selected)`로 렌더. 클릭 시 `selectedId` 설정(다른 선 클릭 시 전환, 같은 선이면 유지).
- `selectedId`가 있으면:
  - 끝점 핸들 2개(`<circle data-export-ignore="true" pointer-events="auto">`) — `useDragHandle`로 드래그 시작 시점 좌표 + delta → `updateCustomLine(id, { x1/y1 또는 x2/y2 })`.
  - 선 중간점 근처에 작은 컨트롤 그룹(`data-export-ignore="true"`): `<LineStylePicker>`(스타일 변경) + 삭제(×) 버튼(`removeCustomLine(id)`).
- `document`에 `pointerdown` 리스너 — 이벤트 타깃이 선/핸들/picker/버튼 밖이면 `selectedId=null`, `mode='idle'` (KiyoungiOverlay와 동일 패턴). cleanup으로 해제.

### `lib/useDragHandle.ts`
- 기존 훅 그대로 재사용 (변경 없음).

---

## 통합

- `lib/zLayers.ts`: `lineDrawing: 8` 추가.
- `stores/skinStore.ts`: `customLines` + 3개 액션 추가.
- `features/chart/ChartView.tsx`: 렌더 순서 마지막에 `<LineDrawOverlay />` 추가 (KiyoungiOverlay 다음).
  ```tsx
  <BackgroundLayer />
  <FireOverlay />
  <ChartCanvas />
  <IndicatorOverlay />
  <VolumeProfileOverlay />
  <KiyoungiOverlay />
  <LineDrawOverlay />
  ```
- `features/export/ExportButton.tsx`: 코드 변경 없음 — 기존 `filter: (n) => n.dataset.exportIgnore !== "true"`가 신규 `data-export-ignore` 요소에도 그대로 적용됨.
- 사이드바(`SkinSidebar.tsx`) 카드 없음 — 항상 사용 가능한 도구. `customLines`가 빈 배열이면 화면에 아무 흔적 없음.

---

## 검증

1. `npm run dev` → 차트 좌상단 ✏️ 버튼 클릭 → 스타일 4종(고양이 꼬리/리본/번개/무지개) picker 표시 확인.
2. 스타일 선택 → 차트 위 드래그 → 선 생성, 양 끝점 핸들 표시 확인.
3. 끝점 핸들 드래그 → 위치/길이 변경 확인.
4. 기존 선 클릭 → 선택 → 스타일 전환 picker에서 다른 스타일 선택 시 즉시 반영 확인.
5. 삭제(×) 클릭 → 해당 선 제거 확인.
6. 여러 선 동시 생성 → 각각 독립적으로 클릭 선택/편집 가능 확인.
7. 선/핸들/picker 바깥 클릭 → 선택 및 그리기 모드 해제, 차트 줌/팬/크로스헤어가 막히지 않는지 확인.
8. 새로고침 → 선들의 위치/스타일 유지(persist) 확인.
9. PNG 내보내기 → 선은 포함, 플로팅 버튼/picker/핸들/삭제 버튼은 제외되는지 확인.

---

## 범위 제외 (Out of scope)

- 곱선/베지어 라인 — 직선(2점)만 지원, 스타일별 시각 곱선(지그재그 등)은 렌더 내부 계산일 뿐 데이터는 직선.
- 선 색상/굵기 커스터마이징 — 4종 프리셋 스타일 고정.
- 선당 다중 스타일 조합.
- 화살표/텍스트 라벨.
- 멀티터치(pointer 단일 포인터 드래그만).
- 사이드바 위젯 카드 / on-off 토글 — 항상 사용 가능한 그리기 도구.

---

## 파일 목록

| 구분 | 파일 |
|------|------|
| 신규 | `features/skin/LineDrawOverlay.tsx` |
| 신규 | `features/skin/LineStylePicker.tsx` |
| 신규 | `features/skin/lineStyles.ts` |
| 수정 | `stores/skinStore.ts` (customLines + 액션) |
| 수정 | `lib/zLayers.ts` (lineDrawing: 8) |
| 수정 | `features/chart/ChartView.tsx` (렌더 순서에 LineDrawOverlay 추가) |
