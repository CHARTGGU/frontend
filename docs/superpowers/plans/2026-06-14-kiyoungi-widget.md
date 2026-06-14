# 기영이 위젯 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "기영이 매매법" 밈(횡보 구간=얼굴, 급등 구간=빛의 검 든 팔)을 차트 위에 사용자가 드래그/리사이즈/회전으로 직접 배치할 수 있는 인터랙티브 위젯을 추가한다.

**Architecture:** `skinStore`에 `kiyoungiEnabled`/`kiyoungiBody`/`kiyoungiArm` 상태 추가 → `KiyoungiOverlay`가 `ChartView` 최상단(z-index 7)에서 `KiyoungiBody`(얼굴, 리사이즈 핸들 4개) + `KiyoungiArm`(팔+검, 끝점 핸들로 각도/길이 조절)을 렌더 → 공용 `useDragHandle` 훅으로 pointer 드래그 처리 → 클릭 시 선택(핸들 표시), 바깥 클릭 시 선택 해제 → `SkinSidebar`의 위젯 카드에서 on/off 토글 → PNG 내보내기 시 핸들 제외.

**Tech Stack:** Next.js (App Router) + TypeScript, Zustand(persist), CSS transform(rotate), Pointer Events, Tailwind CSS, html-to-image. (참고: `docs/superpowers/specs/2026-06-14-kiyoungi-widget-design.md`)

---

### Task 1: skinStore에 기영이 위젯 상태 추가

**Files:**
- Modify: `stores/skinStore.ts`

- [ ] **Step 1: 타입 export 추가**

`stores/skinStore.ts`에서 `export type FitMode = "cover" | "contain" | "tile";` 바로 아래에 추가:

```ts
export interface KiyoungiBodyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface KiyoungiArmState {
  x: number;
  y: number;
  length: number;
  angle: number;
}
```

- [ ] **Step 2: SkinState 인터페이스에 상태/액션 추가**

`fireHeight: number;` 바로 아래에 추가:

```ts
  /** 기영이 위젯 활성화 여부. */
  kiyoungiEnabled: boolean;
  /** 기영이 본체(얼굴) 위치/크기 (컨테이너 기준 px). */
  kiyoungiBody: KiyoungiBodyRect;
  /** 빛의 검 팔. x,y=어깨(앵커, px), length=검 길이(px), angle=방향(deg, 0=→, -90=↑). */
  kiyoungiArm: KiyoungiArmState;
```

`setFireHeight: (height: number) => void;` 바로 아래에 추가:

```ts
  toggleKiyoungi: () => void;
  setKiyoungiBody: (patch: Partial<KiyoungiBodyRect>) => void;
  setKiyoungiArm: (patch: Partial<KiyoungiArmState>) => void;
```

- [ ] **Step 3: 초기 상태값 추가**

`fireHeight: 30,` 바로 아래에 추가:

```ts
      kiyoungiEnabled: false,
      kiyoungiBody: { x: 160, y: 260, width: 200, height: 180 },
      kiyoungiArm: { x: 300, y: 280, length: 180, angle: -60 },
```

- [ ] **Step 4: 액션 구현 추가**

`setFireHeight: (fireHeight) => set({ fireHeight }),` 바로 아래에 추가:

```ts
      toggleKiyoungi: () => set((s) => ({ kiyoungiEnabled: !s.kiyoungiEnabled })),
      setKiyoungiBody: (patch) =>
        set((s) => ({ kiyoungiBody: { ...s.kiyoungiBody, ...patch } })),
      setKiyoungiArm: (patch) =>
        set((s) => ({ kiyoungiArm: { ...s.kiyoungiArm, ...patch } })),
```

- [ ] **Step 5: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료 (exit code 0).

- [ ] **Step 6: Commit**

```bash
git add stores/skinStore.ts
git commit -m "feat: add kiyoungi widget state to skinStore"
```

---

### Task 2: SVG 에셋 + 위젯 프리셋 추가

**Files:**
- Create: `public/skins/kiyoungi-face.png`
- Create: `public/skins/kiyoungi-sword-arm.png`
- Create: `public/skins/kiyoungi-thumb.svg`
- Modify: `features/skin/presets.ts`

- [ ] **Step 1: 얼굴 SVG 작성**

`public/skins/kiyoungi-face.png` 새로 생성 (viewBox 200×180, `kiyoungiBody` 기본 비율과 동일):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="180" viewBox="0 0 200 180">
  <circle cx="100" cy="110" r="58" fill="none" stroke="#8b5e34" stroke-width="4"/>
  <path d="M42 85 L54 32 L66 72 L80 28 L94 70 L108 25 L122 68 L136 30 L150 75 L158 85 Z" fill="#8b5e34"/>
  <circle cx="82" cy="112" r="6" fill="#3a2415"/>
  <circle cx="118" cy="110" r="6" fill="#3a2415"/>
  <path d="M78 138 Q100 158 124 136" fill="none" stroke="#8b5e34" stroke-width="5" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 2: 팔+빛의검 SVG 작성**

`public/skins/kiyoungi-sword-arm.png` 새로 생성. **viewBox는 정사각형 200×200** — 회전 기준점(어깨, 앵커)이 좌하단(0,200), 검 끝이 우상단(200,0) 근처에 오도록 그린다 (컴포넌트에서 `transform-origin: 0% 100%`로 좌하단을 고정하고 회전):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <line x1="10" y1="190" x2="140" y2="60" stroke="#8b5e34" stroke-width="16" stroke-linecap="round"/>
  <circle cx="140" cy="60" r="14" fill="#8b5e34"/>
  <path d="M133.7 53.6 L146.3 66.4 L195 8 Z" fill="#f5d76e" stroke="#8b5e34" stroke-width="2" stroke-linejoin="round"/>
  <g stroke="#f5d76e" stroke-width="2" stroke-linecap="round">
    <line x1="183" y1="35" x2="196" y2="42"/>
    <line x1="190" y1="20" x2="198" y2="30"/>
  </g>
</svg>
```

- [ ] **Step 3: 썸네일 SVG 작성**

`public/skins/kiyoungi-thumb.svg` 새로 생성 (`cat-running.svg`와 동일한 120×120 카드 썸네일 규격):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="#0f1117"/>
  <circle cx="50" cy="68" r="32" fill="none" stroke="#8b5e34" stroke-width="3"/>
  <path d="M24 50 L32 22 L40 42 L48 18 L56 40 L64 16 L72 42 L80 50 Z" fill="#8b5e34"/>
  <circle cx="42" cy="68" r="3.5" fill="#3a2415"/>
  <circle cx="60" cy="66" r="3.5" fill="#3a2415"/>
  <path d="M40 80 Q50 92 64 78" fill="none" stroke="#8b5e34" stroke-width="3" stroke-linecap="round"/>
  <line x1="68" y1="100" x2="100" y2="40" stroke="#8b5e34" stroke-width="8" stroke-linecap="round"/>
  <path d="M93 35 L101 47 L112 18 Z" fill="#f5d76e" stroke="#8b5e34" stroke-width="1.5" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 4: WIDGET_SKINS에 wg-kiyoungi 추가**

`features/skin/presets.ts`의 `WIDGET_SKINS` 배열에서 `wg-fire` 항목(`}`) 다음, `wg-news-marker` 항목 앞에 추가:

```ts
  {
    id: "wg-kiyoungi",
    name: "기영이 위젯",
    author: "ChartSkin",
    description: "횡보 구간엔 기영이, 급등 구간엔 빛의 검을 직접 배치하는 밈 위젯.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/kiyoungi-thumb.svg",
  },
```

- [ ] **Step 5: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 6: Commit**

```bash
git add public/skins/kiyoungi-face.png public/skins/kiyoungi-sword-arm.png public/skins/kiyoungi-thumb.svg features/skin/presets.ts
git commit -m "feat: add wg-kiyoungi widget preset and assets"
```

---

### Task 3: zLayers에 기영이 위젯 z-index 추가

**Files:**
- Modify: `lib/zLayers.ts`

- [ ] **Step 1: Z_LAYER에 kiyoungi 추가**

`lib/zLayers.ts`의 `cat: 6,` 바로 아래에 추가:

```ts
  /** 기영이 위젯 — 최상단, 인터랙티브(드래그/리사이즈/회전). */
  kiyoungi: 7,
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 3: Commit**

```bash
git add lib/zLayers.ts
git commit -m "feat: add kiyoungi layer to Z_LAYER"
```

---

### Task 4: 공용 드래그 훅 (`useDragHandle`)

**Files:**
- Create: `lib/useDragHandle.ts`

- [ ] **Step 1: 훅 작성**

`lib/useDragHandle.ts` 새로 생성:

```ts
import { useCallback, useRef } from "react";

type DragMoveHandler = (dx: number, dy: number) => void;

/**
 * 포인터 드래그 시작 시 window에 move/up 리스너를 등록하고,
 * 드래그 시작점 기준 누적 delta(dx, dy)를 매 move마다 콜백으로 전달.
 * 이동·리사이즈·회전+길이 핸들 모두 "시작 시점 값 + delta로 새 값 계산" 패턴으로 사용.
 */
export function useDragHandle() {
  const activeRef = useRef(false);

  return useCallback(
    (e: React.PointerEvent, onMove: DragMoveHandler, onEnd?: () => void) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeRef.current) return;
      activeRef.current = true;

      const startX = e.clientX;
      const startY = e.clientY;

      const handleMove = (ev: PointerEvent) => {
        onMove(ev.clientX - startX, ev.clientY - startY);
      };

      const handleUp = () => {
        activeRef.current = false;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        onEnd?.();
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [],
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 3: Commit**

```bash
git add lib/useDragHandle.ts
git commit -m "feat: add useDragHandle pointer-drag hook"
```

---

### Task 5: KiyoungiBody (얼굴 — 드래그 이동 + 4모서리 리사이즈)

**Files:**
- Create: `features/skin/KiyoungiBody.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`features/skin/KiyoungiBody.tsx` 새로 생성:

```tsx
"use client";

import { useSkinStore } from "@/stores/skinStore";
import { useDragHandle } from "@/lib/useDragHandle";

const MIN_SIZE = 60;

type Corner = "nw" | "ne" | "sw" | "se";
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

interface Props {
  selected: boolean;
  onSelect: () => void;
}

/** 기영이 본체(얼굴). 클릭=선택(핸들 표시), 드래그=이동, 모서리 핸들=리사이즈. */
export default function KiyoungiBody({ selected, onSelect }: Props) {
  const body = useSkinStore((s) => s.kiyoungiBody);
  const setBody = useSkinStore((s) => s.setKiyoungiBody);
  const startDrag = useDragHandle();

  const handleMovePointerDown = (e: React.PointerEvent) => {
    onSelect();
    const start = { ...body };
    startDrag(e, (dx, dy) => {
      setBody({ x: start.x + dx, y: start.y + dy });
    });
  };

  const handleCornerPointerDown =
    (corner: Corner) => (e: React.PointerEvent) => {
      const start = { ...body };
      startDrag(e, (dx, dy) => {
        let { x, y, width, height } = start;
        if (corner === "se") {
          width = Math.max(MIN_SIZE, start.width + dx);
          height = Math.max(MIN_SIZE, start.height + dy);
        } else if (corner === "sw") {
          width = Math.max(MIN_SIZE, start.width - dx);
          height = Math.max(MIN_SIZE, start.height + dy);
          x = start.x + (start.width - width);
        } else if (corner === "ne") {
          width = Math.max(MIN_SIZE, start.width + dx);
          height = Math.max(MIN_SIZE, start.height - dy);
          y = start.y + (start.height - height);
        } else {
          width = Math.max(MIN_SIZE, start.width - dx);
          height = Math.max(MIN_SIZE, start.height - dy);
          x = start.x + (start.width - width);
          y = start.y + (start.height - height);
        }
        setBody({ x, y, width, height });
      });
    };

  return (
    <div
      onPointerDown={handleMovePointerDown}
      style={{
        position: "absolute",
        left: body.x,
        top: body.y,
        width: body.width,
        height: body.height,
        pointerEvents: "auto",
        cursor: "move",
        outline: selected ? "2px dashed #f5d76e" : "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/skins/kiyoungi-face.png"
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      {selected &&
        CORNERS.map((corner) => (
          <div
            key={corner}
            data-export-ignore="true"
            onPointerDown={handleCornerPointerDown(corner)}
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              background: "#f5d76e",
              border: "1px solid #8b5e34",
              borderRadius: 2,
              cursor: `${corner}-resize`,
              ...(corner === "nw" && { left: -5, top: -5 }),
              ...(corner === "ne" && { right: -5, top: -5 }),
              ...(corner === "sw" && { left: -5, bottom: -5 }),
              ...(corner === "se" && { right: -5, bottom: -5 }),
            }}
          />
        ))}
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 3: Commit**

```bash
git add features/skin/KiyoungiBody.tsx
git commit -m "feat: add KiyoungiBody draggable/resizable face widget"
```

---

### Task 6: KiyoungiArm (팔+빛의검 — 드래그 이동 + 끝점 핸들로 각도/길이)

**Files:**
- Create: `features/skin/KiyoungiArm.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`features/skin/KiyoungiArm.tsx` 새로 생성.

기하 구조: 정사각형(`length` × `length`) 박스를 어깨(앵커, `arm.x, arm.y`)가 좌하단 모서리에 오도록 배치(`left: x, top: y - length`)하고 `transform-origin: 0% 100%`(좌하단=앵커, 고정 피벗)으로 `rotate(angle + 45deg)` 적용. 이 구성에서 **앵커→검끝 벡터 = `length * Math.SQRT2 * (cos(angle), sin(angle))`**가 항상 성립(아래 끝점 핸들 드래그 계산이 이 식의 역연산):

```tsx
"use client";

import { useSkinStore } from "@/stores/skinStore";
import { useDragHandle } from "@/lib/useDragHandle";

const MIN_LENGTH = 60;
const MAX_LENGTH = 500;

interface Props {
  selected: boolean;
  onSelect: () => void;
}

/** 기영이의 빛의 검 팔. 클릭=선택(끝점 핸들 표시), 드래그=어깨(앵커) 이동, 끝점 핸들=각도+길이 조절. */
export default function KiyoungiArm({ selected, onSelect }: Props) {
  const arm = useSkinStore((s) => s.kiyoungiArm);
  const setArm = useSkinStore((s) => s.setKiyoungiArm);
  const startDrag = useDragHandle();

  const handleMovePointerDown = (e: React.PointerEvent) => {
    onSelect();
    const start = { ...arm };
    startDrag(e, (dx, dy) => {
      setArm({ x: start.x + dx, y: start.y + dy });
    });
  };

  const handleTipPointerDown = (e: React.PointerEvent) => {
    const start = { ...arm };
    const rad = (start.angle * Math.PI) / 180;
    const tipOffsetX = start.length * Math.SQRT2 * Math.cos(rad);
    const tipOffsetY = start.length * Math.SQRT2 * Math.sin(rad);

    startDrag(e, (dx, dy) => {
      const nx = tipOffsetX + dx;
      const ny = tipOffsetY + dy;
      const newLength = Math.min(
        MAX_LENGTH,
        Math.max(MIN_LENGTH, Math.hypot(nx, ny) / Math.SQRT2),
      );
      const newAngle = (Math.atan2(ny, nx) * 180) / Math.PI;
      setArm({ length: newLength, angle: newAngle });
    });
  };

  return (
    <div
      onPointerDown={handleMovePointerDown}
      style={{
        position: "absolute",
        left: arm.x,
        top: arm.y - arm.length,
        width: arm.length,
        height: arm.length,
        transform: `rotate(${arm.angle + 45}deg)`,
        transformOrigin: "0% 100%",
        pointerEvents: "auto",
        cursor: "move",
        outline: selected ? "2px dashed #f5d76e" : "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/skins/kiyoungi-sword-arm.png"
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      {selected && (
        <div
          data-export-ignore="true"
          onPointerDown={handleTipPointerDown}
          style={{
            position: "absolute",
            right: -6,
            top: -6,
            width: 12,
            height: 12,
            background: "#f5d76e",
            border: "1px solid #8b5e34",
            borderRadius: "50%",
            cursor: "alias",
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 3: Commit**

```bash
git add features/skin/KiyoungiArm.tsx
git commit -m "feat: add KiyoungiArm rotatable/resizable sword-arm widget"
```

---

### Task 7: KiyoungiOverlay (컨테이너 + 선택 상태 관리)

**Files:**
- Create: `features/skin/KiyoungiOverlay.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`features/skin/KiyoungiOverlay.tsx` 새로 생성:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSkinStore } from "@/stores/skinStore";
import { Z_LAYER } from "@/lib/zLayers";
import KiyoungiBody from "./KiyoungiBody";
import KiyoungiArm from "./KiyoungiArm";

type Part = "body" | "arm" | null;

/**
 * 기영이 위젯 컨테이너. 얼굴(KiyoungiBody) + 빛의검 팔(KiyoungiArm)을 렌더.
 * 파츠 클릭 시 선택(핸들 표시), 컨테이너 바깥(차트 등) 클릭 시 선택 해제.
 */
export default function KiyoungiOverlay() {
  const kiyoungiEnabled = useSkinStore((s) => s.kiyoungiEnabled);
  const [selected, setSelected] = useState<Part>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kiyoungiEnabled) return;
    const handlePointerDown = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(e.target as Node)) {
        setSelected(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [kiyoungiEnabled]);

  if (!kiyoungiEnabled) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: Z_LAYER.kiyoungi }}
    >
      <KiyoungiBody
        selected={selected === "body"}
        onSelect={() => setSelected("body")}
      />
      <KiyoungiArm
        selected={selected === "arm"}
        onSelect={() => setSelected("arm")}
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
git add features/skin/KiyoungiOverlay.tsx
git commit -m "feat: add KiyoungiOverlay container with selection state"
```

---

### Task 8: SkinSidebar에 wg-kiyoungi 연결

**Files:**
- Modify: `features/skin/SkinSidebar.tsx`

- [ ] **Step 1: store 구독 추가**

`features/skin/SkinSidebar.tsx`에서 `const toggleFire = useSkinStore((s) => s.toggleFire);` 바로 아래에 추가:

```ts
  const kiyoungiEnabled = useSkinStore((s) => s.kiyoungiEnabled);
  const toggleKiyoungi = useSkinStore((s) => s.toggleKiyoungi);
```

- [ ] **Step 2: applied 판정에 wg-kiyoungi 추가**

기존:

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
                        fireEnabled) ||
                      (category === "widget" &&
                        skin.id === "wg-kiyoungi" &&
                        kiyoungiEnabled);
```

- [ ] **Step 3: onApply/onRemove에 wg-kiyoungi 추가**

기존:

```tsx
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
```

다음으로 교체:

```tsx
                          onApply={() => {
                            if (category === "background") applyBackground(skin.id);
                            else if (category === "indicator") applyIndicator(skin.id);
                            else if (category === "widget" && skin.id === "wg-running-cat") toggleCat();
                            else if (category === "widget" && skin.id === "wg-fire") toggleFire();
                            else if (category === "widget" && skin.id === "wg-kiyoungi") toggleKiyoungi();
                          }}
                          onRemove={() => {
                            if (category === "background") removeBackground();
                            else if (category === "indicator") removeIndicator();
                            else if (category === "widget" && skin.id === "wg-running-cat") toggleCat();
                            else if (category === "widget" && skin.id === "wg-fire") toggleFire();
                            else if (category === "widget" && skin.id === "wg-kiyoungi") toggleKiyoungi();
                          }}
```

- [ ] **Step 4: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 5: Commit**

```bash
git add features/skin/SkinSidebar.tsx
git commit -m "feat: wire wg-kiyoungi toggle into SkinSidebar"
```

---

### Task 9: ChartView 렌더 순서에 KiyoungiOverlay 추가

**Files:**
- Modify: `features/chart/ChartView.tsx`

- [ ] **Step 1: import 추가**

`features/chart/ChartView.tsx` 상단 import에서 `import IndicatorOverlay from "@/features/skin/IndicatorOverlay";` 바로 아래에 추가:

```ts
import KiyoungiOverlay from "@/features/skin/KiyoungiOverlay";
```

- [ ] **Step 2: 렌더 순서 최상단에 추가**

기존:

```tsx
        <div ref={captureRef} className="absolute inset-0 bg-[#131313]">
          <BackgroundLayer />
          <FireOverlay />
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
          <KiyoungiOverlay />
        </div>
```

- [ ] **Step 3: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 4: Commit**

```bash
git add features/chart/ChartView.tsx
git commit -m "feat: render KiyoungiOverlay on top of chart layers"
```

---

### Task 10: PNG 내보내기에서 핸들 제외

**Files:**
- Modify: `features/export/ExportButton.tsx`

- [ ] **Step 1: toPng에 filter 옵션 추가**

`features/export/ExportButton.tsx`에서 기존:

```ts
      const dataUrl = await toPng(node, {
        pixelRatio: 2, // 2x 해상도
        backgroundColor: "#131313",
        cacheBust: true,
      });
```

다음으로 교체:

```ts
      const dataUrl = await toPng(node, {
        pixelRatio: 2, // 2x 해상도
        backgroundColor: "#131313",
        cacheBust: true,
        // 기영이 위젯의 리사이즈/회전 핸들은 결과 이미지에서 제외.
        filter: (n) => n.dataset.exportIgnore !== "true",
      });
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 3: Commit**

```bash
git add features/export/ExportButton.tsx
git commit -m "fix: exclude kiyoungi widget handles from PNG export"
```

---

### Task 11: 수동 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 개발 서버 기동**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run dev`

- [ ] **Step 2: 위젯 적용 확인**

브라우저에서 `http://localhost:3000` 접속 → 마켓플레이스 사이드바 → 위젯 섹션 → "기영이 위젯" 카드 → 적용.
Expected: 차트 위에 기영이 얼굴(갈색 라인아트, 뾰족머리)과 빛의 검 팔이 기본 위치에 표시됨.

- [ ] **Step 3: 얼굴 선택/이동/리사이즈 확인**

얼굴을 클릭 → 4모서리에 노란 핸들 표시됨. 얼굴 본문 드래그 → 위치 이동. 모서리 핸들 드래그 → 크기 조절(60px 미만으로 줄어들지 않음, 반대편 모서리는 고정).

- [ ] **Step 4: 팔 선택/이동/회전+길이 확인**

팔(검)을 클릭 → 끝점에 원형 핸들 표시됨(얼굴 핸들은 사라짐 — 선택은 1개씩). 팔 본문 드래그 → 어깨(앵커) 위치 이동. 끝점 핸들을 여러 방향으로 드래그 → 팔의 각도와 길이가 동시에 자연스럽게 바뀜(길이 60~500px 범위 내).

- [ ] **Step 5: 선택 해제 확인**

차트의 빈 영역(캔들/배경)을 클릭 → 핸들이 모두 사라짐. 이때 차트 줌/팬/크로스헤어가 정상 동작하는지 확인.

- [ ] **Step 6: 새로고침 후 유지 확인**

얼굴/팔을 임의 위치로 옮긴 뒤 새로고침.
Expected: 위치/크기/각도/길이가 그대로 유지됨 (zustand persist).

- [ ] **Step 7: PNG 내보내기 확인**

얼굴 또는 팔을 선택한 상태(핸들 표시 중)에서 툴바의 "PNG 저장" 클릭.
Expected: 다운로드된 PNG에 얼굴+팔은 포함되고 노란 리사이즈/회전 핸들은 포함되지 않음.

- [ ] **Step 8: 다른 위젯/배경과의 z-order 확인**

배경 스킨 + 불타는 효과 + 뛰어다니는 고양이를 모두 적용한 뒤 기영이 위젯도 적용.
Expected: 기영이 위젯(얼굴/팔)이 다른 모든 레이어보다 위에 표시되고, 드래그/리사이즈가 정상 동작함.

- [ ] **Step 9: 해제 확인**

"기영이 위젯" 카드에서 "해제" 클릭.
Expected: 얼굴/팔이 모두 사라짐.

---

## Self-Review 결과

- **Spec coverage**: 레이어 순서/z-index(Task 3), 상태(`kiyoungiEnabled`/`kiyoungiBody`/`kiyoungiArm`, Task 1), 에셋 3종(Task 2), `KiyoungiBody`(드래그+리사이즈, Task 5), `KiyoungiArm`(드래그+회전+길이, Task 6), 선택 기반 핸들 표시/바깥 클릭 해제(Task 7), presets/SkinSidebar 연결(Task 2, 8), ChartView 렌더 순서(Task 9), PNG `data-export-ignore` 필터(Task 10), persist·수동 검증(Task 11) — spec의 모든 섹션이 매핑됨. "범위 제외"(색상 커스터마이징·얼굴 회전·다중 인스턴스·멀티터치)는 plan에도 포함하지 않음.
- **Placeholder scan**: 모든 코드 블록이 완성된 실제 코드. "TODO"/"나중에" 없음.
- **Type consistency**: `kiyoungiEnabled`/`kiyoungiBody`/`kiyoungiArm`/`toggleKiyoungi`/`setKiyoungiBody`/`setKiyoungiArm`, `KiyoungiBodyRect`/`KiyoungiArmState` 네이밍이 Task 1(스토어 정의)부터 Task 5~9(사용처)까지 동일. `KiyoungiArm`의 앵커→검끝 변환식(`length * Math.SQRT2 * (cos, sin)`)은 Task 6의 SVG 배치 설명(좌하단 앵커, `transform-origin: 0% 100%`, `rotate(angle+45)`)과 일치.
