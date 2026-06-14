# 기영이 위젯 — 설계

> 위젯 카테고리에 "기영이 위젯" 추가. "기영이 매매법" 밈(횡보 구간 = 얼굴, 급등 구간 = 빛의 검 든 팔)을 차트 위에 사용자가 직접 배치할 수 있는 인터랙티브 오버레이 위젯.

---

## 배경 / 목적

차트가 일정 기간 횡보 후 상단에 여러 뾰족한 고점을 찍고 강하게 상승하는 패턴이 보일 때, "기영이"(횡보 구간 = 얼굴+뾰족머리) + "빛의 검"(급등 구간 = 검을 든 팔)을 겹쳐 표현하는 밈 위젯.

지표에 바인딩되지 않는 순수 장식/인터랙션 요소(`docs/feature_spec.md` §위젯 정의와 동일 분류). 기존 위젯(고양이, 불 효과)과 달리 **사용자가 직접 드래그/리사이즈/회전으로 위치를 맞추는** 것이 핵심 — 차트 좌표에 자동 연동하지 않음.

---

## 레이어 순서 & 위치

```
[배경 스킨 레이어]   z-index: 0
[불 이펙트 레이어]   z-index: 0
[차트 캔버스]        z-index: 3 (lightweight-charts 내부 고정)
[지표 오버레이]      z-index: 5
[뛰어다니는 고양이]  z-index: 6
[기영이 위젯]        z-index: 7  ← 신규, 최상단 + 인터랙티브
```

- 컨테이너는 `position: absolute; inset: 0; pointer-events: none` (차트 줌/팬/크로스헤어 방해 안 함).
- 위젯 요소(얼굴 이미지, 팔 이미지) 자체만 `pointer-events: auto`로 클릭/드래그 가능.

---

## 상태 — `stores/skinStore.ts` 확장

```ts
interface BodyRect { x: number; y: number; width: number; height: number }
interface ArmState { offsetX: number; offsetY: number; length: number; angle: number }

interface SkinState {
  // ...기존
  /** 기영이 위젯 활성화 여부. */
  kiyoungiEnabled: boolean;
  /** 기영이 본체(얼굴) 위치/크기. 컨테이너 기준 px. */
  kiyoungiBody: BodyRect;
  /** 빛의 검 팔. (offsetX,offsetY)=어깨(앵커) — kiyoungiBody 좌상단 기준 상대 오프셋(px), 본체 이동 시 팔도 같이 따라움. length=검 길이(px), angle=각도(deg, 0=→, -90=↑). */
  kiyoungiArm: ArmState;

  toggleKiyoungi: () => void;
  setKiyoungiBody: (patch: Partial<BodyRect>) => void;
  setKiyoungiArm: (patch: Partial<ArmState>) => void;
}
```

- 기본값:
  - `kiyoungiEnabled: false`
  - `kiyoungiBody: { x: 160, y: 260, width: 200, height: 180 }`
  - `kiyoungiArm: { offsetX: 140, offsetY: 20, length: 180, angle: -60 }` (= 본체 기준 절대좌표 300,280과 동일 위치)
- 기존 `persist({ name: "skin-settings" })`에 자동 포함 (partialize 없음 → 전체 저장).
- "어떤 파츠가 선택돼 핸들 표시 중인지"는 store에 두지 않음 — `KiyoungiOverlay` 컴포넌트 로컬 state (새로고침 시 선택 해제되는 게 정상).

---

## 에셋

| 파일 | 내용 |
|------|------|
| `public/skins/kiyoungi-face.svg` | 동그란 얼굴 + 점 눈 2개 + 웃는 입 + 위쪽에 뾰족뾰족한 갈색 머리카락(밈 참고 이미지의 횡보 구간 위 고점 라인 실루엣). 손그림풍 라인아트(`cat-running.svg`와 동일 스타일), 배경 투명. |
| `public/skins/kiyoungi-sword-arm.svg` | 대각선 팔(둥근 막대) + 끝에 길쭉한 빛의 검(삼각/지그재그 칼날 + 광선 줄무늬). 같은 갈색 라인 톤, 배경 투명. 회전 기준점(어깨)이 SVG의 한쪽 끝에 오도록 좌표 설계 → `transform-origin`을 그쪽으로 고정. |
| `public/skins/kiyoungi-thumb.svg` | 위젯 카드 썸네일 (얼굴+팔 축소 합성, 단순 버전). |

마음에 안 들면 추후 에셋 파일만 교체 가능 (컴포넌트/로직 변경 없음).

---

## 컴포넌트

### `features/skin/KiyoungiOverlay.tsx`
- 컨테이너 div (`position:absolute; inset:0; pointer-events:none; zIndex: Z_LAYER.kiyoungi`).
- `kiyoungiEnabled === false`면 `null` 반환.
- 로컬 state: `selected: 'body' | 'arm' | null`.
- `document`에 `pointerdown` 리스너 등록 — 이벤트 타깃이 본체/팔 DOM 밖이면 `selected = null`. cleanup으로 리스너 해제.
- `<KiyoungiBody selected={...} onSelect={...} />`, `<KiyoungiArm selected={...} onSelect={...} />` 렌더.

### `features/skin/KiyoungiBody.tsx`
- `<img src="/skins/kiyoungi-face.svg" draggable={false}>`를 `kiyoungiBody` rect(`left/top/width/height`)로 절대배치. `pointer-events: auto`.
- pointerdown(이미지 본문) → `onSelect('body')` + 드래그 시작 → `setKiyoungiBody({ x, y })` 갱신.
- `selected === 'body'`일 때만 4 모서리에 8×8px 리사이즈 핸들(`<div data-export-ignore="true">`) 렌더. 핸들 드래그 → 반대편 모서리 고정하며 `width/height` (+필요시 `x/y`) 갱신, 최소 60×60px 클램프.

### `features/skin/KiyoungiArm.tsx`
- 앵커(어깨) = `(kiyoungiBody.x + kiyoungiArm.offsetX, kiyoungiBody.y + kiyoungiArm.offsetY)` — 본체 좌상단 기준 상대 오프셋이므로 본체를 드래그하면 팔도 같이 따라움. `<img src="/skins/kiyoungi-sword-arm.svg" draggable={false}>`를 이 앵커 기준 `transform: rotate(${angle+45}deg)` + `length` 정사각 박스로 배치, `transform-origin`을 어깨쪽 끝(`0% 100%`)으로 고정.
- pointerdown(이미지 본문) → `onSelect('arm')` + 드래그 시작 → `setKiyoungiArm({ offsetX, offsetY })`(앵커를 본체 기준 오프셋으로 이동).
- `selected === 'arm'`일 때만 검 끝점에 핸들 1개(`data-export-ignore="true"`) 렌더. 드래그 시 앵커 기준 `angle = atan2(dy, dx)` (deg), `length = Math.hypot(dx, dy)`로 재계산, `length`는 60~500px 클램프, `angle`은 클램프 없음(360° 자유).

### `lib/useDragHandle.ts` (공용 훅)
- pointerdown → `pointermove`/`pointerup`을 `window`에 등록(드래그 중 커서가 요소 밖으로 나가도 추적), 시작 좌표 대비 delta 계산해 콜백 호출, pointerup 시 리스너 해제.
- drag(이동), resize-corner(모서리), rotate-tip(팔 끝점) 세 가지 사용처가 동일 패턴 공유.

---

## 통합

- `lib/zLayers.ts`: `kiyoungi: 7` 추가 (주석: "기영이 위젯 — 최상단, 인터랙티브(드래그/리사이즈)").
- `features/skin/presets.ts`: `WIDGET_SKINS`에 추가
  ```ts
  {
    id: "wg-kiyoungi",
    name: "기영이 위젯",
    author: "ChartSkin",
    description: "횡보 구간엔 기영이, 급등 구간엔 빛의 검을 직접 배치하는 밈 위젯.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/kiyoungi-thumb.svg",
  }
  ```
- `features/skin/SkinSidebar.tsx`: `wg-kiyoungi` 카드의 applied 상태 = `kiyoungiEnabled`, onApply/onRemove = `toggleKiyoungi`. 별도 컨트롤 패널 없음 (위치/크기는 캔버스 위 직접 드래그로 조정).
- `features/chart/ChartView.tsx`: 렌더 순서 마지막에 `<KiyoungiOverlay />` 추가.
  ```tsx
  <BackgroundLayer />
  <FireOverlay />
  <ChartCanvas />
  <IndicatorOverlay />
  <VolumeProfileOverlay />
  <KiyoungiOverlay />
  ```
- `features/export/ExportButton.tsx`: `toPng(node, { ..., filter: (n) => (n as HTMLElement).dataset?.exportIgnore !== "true" })` 추가 — 캡처 시 핸들 제외(선택 해제 안 한 채 내보내도 안전).

---

## 검증

1. `npm run dev` → 위젯 카드 "기영이 위젯" 적용 → 기본 위치에 얼굴 + 팔(검) 표시 확인.
2. 얼굴 클릭 → 모서리 핸들 표시 → 드래그로 이동, 핸들로 리사이즈(최소 크기 클램프) 확인.
3. 팔 클릭 → 끝점 핸들 드래그로 각도/길이 동시 변경 확인 (360° 자유, 길이 60~500px).
4. 차트 영역(위젯 외부) 클릭 → 핸들 숨김(선택 해제) 확인. 차트 줌/팬/크로스헤어가 위젯에 막히지 않는지 확인.
5. 새로고침 후 위치/크기/각도 유지(persist) 확인.
6. PNG 내보내기 → 선택 상태(핸들 보임)에서 내보내도 핸들 없이 얼굴+팔만 포함되는지 확인.
7. 배경 스킨 + 불 효과 동시 적용 상태에서도 기영이 위젯이 최상단에 정상 표시되는지 확인.

---

## 범위 제외 (Out of scope)

- 색상 커스터마이징(에셋 색상 변경) — 추후 에셋 교체로 대응.
- 본체/팔 회전(얼굴 자체 기울이기) — 팔만 회전 가능, 얼굴은 위치/크기만.
- 다중 인스턴스(기영이 여러 개 배치) — 단일 인스턴스만.
- 모바일 터치 멀티터치 제스처 — pointer 이벤트 기반 단일 포인터 드래그만 지원.

---

## 파일 목록

| 구분 | 파일 |
|------|------|
| 신규 | `features/skin/KiyoungiOverlay.tsx` |
| 신규 | `features/skin/KiyoungiBody.tsx` |
| 신규 | `features/skin/KiyoungiArm.tsx` |
| 신규 | `lib/useDragHandle.ts` |
| 신규 | `public/skins/kiyoungi-face.svg` |
| 신규 | `public/skins/kiyoungi-sword-arm.svg` |
| 신규 | `public/skins/kiyoungi-thumb.svg` |
| 수정 | `stores/skinStore.ts` (kiyoungiEnabled/Body/Arm + 액션) |
| 수정 | `features/skin/presets.ts` (wg-kiyoungi 항목) |
| 수정 | `features/skin/SkinSidebar.tsx` (wg-kiyoungi 적용/해제) |
| 수정 | `features/chart/ChartView.tsx` (렌더 순서에 KiyoungiOverlay 추가) |
| 수정 | `lib/zLayers.ts` (kiyoungi: 7) |
| 수정 | `features/export/ExportButton.tsx` (data-export-ignore 필터) |
