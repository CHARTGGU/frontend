# 불타는 효과 위젯 (Fire Overlay) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 위젯 카테고리에 "불타는 효과"를 추가해, 화면 하단 일부가 절차적(Doom Fire 알고리즘) 화염으로 타오르는 배경 위젯을 구현한다.

**Architecture:** `skinStore`에 `fireEnabled`/`fireHeight` 상태 추가 → `FireOverlay`(canvas, Doom Fire 알고리즘)가 `ChartView`에서 배경 스킨과 차트 사이(z-index 1)에 렌더 → `SkinSidebar`의 위젯 카드에서 토글, `FireControls`로 높이(%) 조절.

**Tech Stack:** Next.js (App Router) + TypeScript, Zustand(persist), Canvas 2D API, Tailwind CSS. (참고: `docs/superpowers/specs/2026-06-14-fire-widget-design.md`)

---

### Task 1: skinStore에 불 이펙트 상태 추가

**Files:**
- Modify: `stores/skinStore.ts`

- [ ] **Step 1: 인터페이스에 상태/액션 추가**

`stores/skinStore.ts`의 `SkinState` 인터페이스에서 `catEnabled: boolean;` 바로 아래에 추가:

```ts
  /** 불타는 효과 위젯 활성화 여부. */
  fireEnabled: boolean;
  /** 불 이펙트 영역 높이 (10~80, 화면 높이 %). */
  fireHeight: number;
```

그리고 `toggleCat: () => void;` 바로 아래에 추가:

```ts
  toggleFire: () => void;
  setFireHeight: (height: number) => void;
```

- [ ] **Step 2: 초기 상태값 추가**

`catEnabled: false,` 바로 아래에 추가:

```ts
      fireEnabled: false,
      fireHeight: 30,
```

- [ ] **Step 3: 액션 구현 추가**

`toggleCat: () => set((s) => ({ catEnabled: !s.catEnabled })),` 바로 아래에 추가:

```ts
      toggleFire: () => set((s) => ({ fireEnabled: !s.fireEnabled })),
      setFireHeight: (fireHeight) => set({ fireHeight }),
```

- [ ] **Step 4: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료 (exit code 0).

- [ ] **Step 5: Commit**

```bash
git add stores/skinStore.ts
git commit -m "feat: add fire overlay state to skinStore"
```

---

### Task 2: 위젯 프리셋 + 썸네일 추가

**Files:**
- Modify: `features/skin/presets.ts`
- Create: `public/skins/fire-thumb.svg`

- [ ] **Step 1: 썸네일 SVG 작성**

`public/skins/fire-thumb.svg` 새로 생성:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="fire" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#ffec99"/>
      <stop offset="35%" stop-color="#ffa94d"/>
      <stop offset="70%" stop-color="#e8590c"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" fill="#0f1117"/>
  <rect x="0" y="40" width="120" height="80" fill="url(#fire)"/>
</svg>
```

- [ ] **Step 2: WIDGET_SKINS에 wg-fire 추가**

`features/skin/presets.ts`의 `WIDGET_SKINS` 배열에서 `wg-running-cat` 항목(`}`) 다음, `wg-news-marker` 항목 앞에 추가:

```ts
  {
    id: "wg-fire",
    name: "불타는 효과",
    author: "ChartSkin",
    description: "화면 하단이 절차적으로 타오르는 화염 효과.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/fire-thumb.svg",
  },
```

- [ ] **Step 3: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 4: Commit**

```bash
git add public/skins/fire-thumb.svg features/skin/presets.ts
git commit -m "feat: add wg-fire widget preset and thumbnail"
```

---

### Task 3: FireOverlay 컴포넌트 (Doom Fire 알고리즘)

**Files:**
- Create: `features/skin/FireOverlay.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`features/skin/FireOverlay.tsx` 새로 생성:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useSkinStore } from "@/stores/skinStore";

const FIRE_WIDTH = 80;
const FIRE_HEIGHT = 40;

/** Doom Fire 37색 팔레트 (검정 → 빨강 → 주황 → 노랑 → 흰색). */
const FIRE_PALETTE: readonly [number, number, number][] = [
  [0x07, 0x07, 0x07], [0x1f, 0x07, 0x07], [0x2f, 0x0f, 0x07], [0x47, 0x0f, 0x07],
  [0x57, 0x17, 0x07], [0x67, 0x1f, 0x07], [0x77, 0x1f, 0x07], [0x8f, 0x27, 0x07],
  [0x9f, 0x2f, 0x07], [0xaf, 0x3f, 0x07], [0xbf, 0x47, 0x07], [0xc7, 0x47, 0x07],
  [0xdf, 0x4f, 0x07], [0xdf, 0x57, 0x07], [0xdf, 0x57, 0x07], [0xd7, 0x5f, 0x07],
  [0xd7, 0x5f, 0x07], [0xd7, 0x67, 0x0f], [0xcf, 0x6f, 0x0f], [0xcf, 0x77, 0x0f],
  [0xcf, 0x7f, 0x0f], [0xcf, 0x87, 0x17], [0xc7, 0x87, 0x17], [0xc7, 0x8f, 0x17],
  [0xc7, 0x97, 0x1f], [0xbf, 0x9f, 0x1f], [0xbf, 0x9f, 0x1f], [0xbf, 0xa7, 0x27],
  [0xbf, 0xa7, 0x27], [0xbf, 0xaf, 0x2f], [0xb7, 0xaf, 0x2f], [0xb7, 0xb7, 0x2f],
  [0xb7, 0xb7, 0x37], [0xcf, 0xcf, 0x6f], [0xdf, 0xdf, 0x9f], [0xef, 0xef, 0xc7],
  [0xff, 0xff, 0xff],
];

const MAX_INDEX = FIRE_PALETTE.length - 1; // 36

/**
 * 불타는 효과 위젯 = Doom Fire 알고리즘 (CLAUDE.md 위젯: 지표 바인딩 없음).
 * 저해상도(80x40) 픽셀 버퍼를 매 프레임 아래→위로 전파시키며 canvas에 렌더.
 * z-index:1 — 배경 스킨(auto) 위, 차트 캔버스(z-index:3) 아래 (CatOverlay의 z-index:4 대비).
 */
export default function FireOverlay() {
  const fireEnabled = useSkinStore((s) => s.fireEnabled);
  const fireHeight = useSkinStore((s) => s.fireHeight);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fireEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = FIRE_WIDTH;
    canvas.height = FIRE_HEIGHT;

    // 맨 아래 행은 항상 최대 강도로 시드, 나머지는 0(투명)에서 시작.
    const pixels = new Uint8Array(FIRE_WIDTH * FIRE_HEIGHT);
    for (let x = 0; x < FIRE_WIDTH; x++) {
      pixels[(FIRE_HEIGHT - 1) * FIRE_WIDTH + x] = MAX_INDEX;
    }

    const image = ctx.createImageData(FIRE_WIDTH, FIRE_HEIGHT);

    // 한 칸 위 행의 같은(또는 좌우로 흔들린) 칸으로 강도를 감쇄 전파.
    const spreadFire = (src: number) => {
      const pixel = pixels[src];
      if (pixel === 0) {
        pixels[src - FIRE_WIDTH] = 0;
        return;
      }
      const decay = Math.floor(Math.random() * 3) & 3; // 0|1|2
      const dst = src - decay + 1;
      pixels[dst - FIRE_WIDTH] = pixel - (decay & 1); // 0 또는 1만큼 감쇄
    };

    let raf = 0;
    const tick = () => {
      for (let x = 0; x < FIRE_WIDTH; x++) {
        for (let y = 1; y < FIRE_HEIGHT; y++) {
          spreadFire(y * FIRE_WIDTH + x);
        }
      }

      for (let i = 0; i < pixels.length; i++) {
        const [r, g, b] = FIRE_PALETTE[pixels[i]];
        const o = i * 4;
        image.data[o] = r;
        image.data[o + 1] = g;
        image.data[o + 2] = b;
        image.data[o + 3] = pixels[i] === 0 ? 0 : 255;
      }
      ctx.putImageData(image, 0, 0);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [fireEnabled]);

  if (!fireEnabled) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
      style={{ height: `${fireHeight}%`, zIndex: 1 }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 3: Commit**

```bash
git add features/skin/FireOverlay.tsx
git commit -m "feat: add FireOverlay doom-fire canvas widget"
```

---

### Task 4: FireControls (높이 슬라이더)

**Files:**
- Create: `features/skin/FireControls.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`features/skin/FireControls.tsx` 새로 생성 (`BackgroundControls.tsx`와 동일 패턴):

```tsx
"use client";

import { useSkinStore } from "@/stores/skinStore";

/** 적용된 불 이펙트 위젯의 높이(%) 컨트롤. 비활성 시 숨김. */
export default function FireControls() {
  const fireEnabled = useSkinStore((s) => s.fireEnabled);
  const fireHeight = useSkinStore((s) => s.fireHeight);
  const setFireHeight = useSkinStore((s) => s.setFireHeight);

  if (!fireEnabled) return null;

  return (
    <div className="space-y-1 border-b border-panel-border bg-panel-alt px-3 py-2.5">
      <label className="mb-1 flex justify-between text-[11px] text-text-muted">
        <span>불 높이</span>
        <span>{fireHeight}%</span>
      </label>
      <input
        type="range"
        min={10}
        max={80}
        step={5}
        value={fireHeight}
        onChange={(e) => setFireHeight(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 3: Commit**

```bash
git add features/skin/FireControls.tsx
git commit -m "feat: add FireControls height slider"
```

---

### Task 5: SkinSidebar에 wg-fire 연결

**Files:**
- Modify: `features/skin/SkinSidebar.tsx`

- [ ] **Step 1: import 및 store 구독 추가**

`features/skin/SkinSidebar.tsx` 상단 import에 추가:

```ts
import FireControls from "./FireControls";
```

`const catEnabled = useSkinStore((s) => s.catEnabled);` 바로 아래에 추가:

```ts
  const fireEnabled = useSkinStore((s) => s.fireEnabled);
  const toggleFire = useSkinStore((s) => s.toggleFire);
```

- [ ] **Step 2: applied 판정에 wg-fire 추가**

기존:

```tsx
                    const applied =
                      (category === "background" &&
                        backgroundSkinId === skin.id) ||
                      (category === "indicator" &&
                        indicatorSkinId === skin.id) ||
                      (category === "widget" &&
                        skin.id === "wg-running-cat" &&
                        catEnabled);
```

다음으로 교체:

```tsx
                    const applied =
                      (category === "background" &&
                        backgroundSkinId === skin.id) ||
                      (category === "indicator" &&
                        indicatorSkinId === skin.id) ||
                      (category === "widget" &&
                        skin.id === "wg-running-cat" &&
                        catEnabled) ||
                      (category === "widget" &&
                        skin.id === "wg-fire" &&
                        fireEnabled);
```

- [ ] **Step 3: onApply/onRemove에 wg-fire 추가, FireControls 렌더**

기존 `return (` 블록:

```tsx
                    return (
                      <SkinCard
                        key={skin.id}
                        skin={skin}
                        applied={applied}
                        onApply={() => {
                          if (category === "background") applyBackground(skin.id);
                          else if (category === "indicator") applyIndicator(skin.id);
                          else if (category === "widget" && skin.id === "wg-running-cat") toggleCat();
                        }}
                        onRemove={() => {
                          if (category === "background") removeBackground();
                          else if (category === "indicator") removeIndicator();
                          else if (category === "widget" && skin.id === "wg-running-cat") toggleCat();
                        }}
                        onDelete={
                          skin.id.startsWith("custom-")
                            ? () => handleDeleteCustom(skin.id)
                            : undefined
                        }
                      />
                    );
```

다음으로 교체:

```tsx
                    return (
                      <div key={skin.id}>
                        <SkinCard
                          skin={skin}
                          applied={applied}
                          onApply={() => {
                            if (category === "background") applyBackground(skin.id);
                            else if (category === "indicator") applyIndicator(skin.id);
                            else if (category === "widget" && skin.id === "wg-running-cat") toggleCat();
                            else if (category === "widget" && skin.id === "wg-fire") toggleFire();
                          }}
                          onRemove={() => {
                            if (category === "background") removeBackground();
                            else if (category === "indicator") removeIndicator();
                            else if (category === "widget" && skin.id === "wg-running-cat") toggleCat();
                            else if (category === "widget" && skin.id === "wg-fire") toggleFire();
                          }}
                          onDelete={
                            skin.id.startsWith("custom-")
                              ? () => handleDeleteCustom(skin.id)
                              : undefined
                          }
                        />
                        {skin.id === "wg-fire" && <FireControls />}
                      </div>
                    );
```

기존 `key={skin.id}`가 `SkinCard`에서 래퍼 `div`로 이동했음에 주의.

- [ ] **Step 4: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 5: Commit**

```bash
git add features/skin/SkinSidebar.tsx
git commit -m "feat: wire wg-fire toggle and height controls into SkinSidebar"
```

---

### Task 6: ChartView 렌더 순서에 FireOverlay 추가

**Files:**
- Modify: `features/chart/ChartView.tsx`

- [ ] **Step 1: import 추가**

`features/chart/ChartView.tsx` 상단 import에 추가 (`BackgroundLayer` import 다음 줄):

```ts
import FireOverlay from "@/features/skin/FireOverlay";
```

- [ ] **Step 2: 렌더 순서에 삽입**

기존:

```tsx
        <div ref={captureRef} className="absolute inset-0 bg-[#131313]">
          <BackgroundLayer />
          <ChartCanvas />
          <IndicatorOverlay />
          <VolumeProfileOverlay />
        </div>
```

다음으로 교체:

```tsx
        <div ref={captureRef} className="absolute inset-0 bg-[#131313]">
          <BackgroundLayer />
          <FireOverlay />
          <ChartCanvas />
          <IndicatorOverlay />
          <VolumeProfileOverlay />
        </div>
```

- [ ] **Step 3: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 4: Commit**

```bash
git add features/chart/ChartView.tsx
git commit -m "feat: render FireOverlay between background skin and chart"
```

---

### Task 7: 수동 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 개발 서버 기동**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run dev`

- [ ] **Step 2: 위젯 적용 확인**

브라우저에서 `http://localhost:3000` 접속 → 마켓플레이스 사이드바 → 위젯 섹션 → "불타는 효과" 카드 → 적용.
Expected: 화면 하단 ~30% 영역에 주황/노랑/빨강 화염 애니메이션이 위로 흔들리며 나타남.

- [ ] **Step 3: 높이 슬라이더 확인**

적용된 "불타는 효과" 카드 아래 슬라이더를 10%~80% 사이로 드래그.
Expected: 화염 영역의 높이가 실시간으로 변경됨.

- [ ] **Step 4: 레이어 순서 확인**

배경 스킨(밤하늘 또는 캔디) 적용 후 불타는 효과도 적용.
Expected: 화염이 배경 이미지보다 위에 보이고, 캔들/거래량 차트보다는 뒤에 보임(차트 캔들이 화염 위로 겹쳐 보임).

- [ ] **Step 5: PNG 내보내기 확인**

툴바의 "PNG 저장" 클릭.
Expected: 다운로드된 PNG에 화염 이펙트가 합성되어 포함됨.

- [ ] **Step 6: 새로고침 후 유지 확인**

페이지 새로고침.
Expected: 불타는 효과 on/off 상태와 높이 값이 그대로 유지됨 (zustand persist).

- [ ] **Step 7: 해제 확인**

"불타는 효과" 카드에서 "해제" 클릭.
Expected: 화염 이펙트가 사라지고 높이 슬라이더도 함께 숨겨짐.

---

## Self-Review 결과

- **Spec coverage**: 레이어 순서/z-index, 상태(`fireEnabled`/`fireHeight`), Doom Fire 알고리즘, FireControls UI, presets/SkinSidebar 연결, ChartView 렌더 순서, PNG 캡처, persist — 모두 Task 1~7에 매핑됨. 색상/강도 커스터마이징은 spec의 "범위 제외"와 일치하게 plan에도 없음.
- **Placeholder scan**: 모든 코드 블록이 완성된 실제 코드. "TODO"/"나중에" 없음.
- **Type consistency**: `fireEnabled`/`fireHeight`/`toggleFire`/`setFireHeight` 네이밍이 Task 1(스토어 정의)부터 Task 3~6(사용처)까지 동일.
