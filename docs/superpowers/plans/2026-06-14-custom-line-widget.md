# 커스텀 라인 그리기 위젯 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 차트 좌상단 플로팅 버튼으로 라인 스타일(고양이 꼬리/리본/번개/무지개)을 선택해 차트 위에 직선을 그리고, 그려진 선을 클릭해 위치 조정·스타일 변경·삭제할 수 있는 인터랙티브 드로잉 위젯을 추가한다.

**Architecture:** `skinStore`에 `customLines: CustomLine[]`(id/styleId/x1/y1/x2/y2) 상태 + add/update/remove 액션 추가 → `lineStyles.tsx`가 4종 스타일별 SVG render 함수 제공(공용 좌표 계산은 `lib/lineGeometry.ts`) → `LineDrawOverlay`가 `ChartView` 최상단(z-index 8)에서 SVG로 모든 선을 렌더, 좌상단 ✏️ 버튼→`LineStylePicker`로 스타일 선택→드래그로 신규 선 생성, 기존 선 클릭 시 끝점 핸들(`useDragHandle` 재사용)+스타일 재선택+삭제 컨트롤 표시, 바깥 클릭 시 선택/모드 해제 → PNG 내보내기 시 컨트롤은 `data-export-ignore`로 제외.

**Tech Stack:** Next.js (App Router) + TypeScript, Zustand(persist), SVG, Pointer Events, Tailwind CSS, Vitest. (참고: `docs/superpowers/specs/2026-06-14-custom-line-widget-design.md`)

---

### Task 1: skinStore에 커스텀 라인 상태 추가

**Files:**
- Modify: `stores/skinStore.ts`

- [ ] **Step 1: 타입 export 추가**

`stores/skinStore.ts`에서 `export interface KiyoungiArmState { ... }` 블록 바로 아래에 추가:

```ts
export type LineStyleId = "cat-tail" | "ribbon" | "lightning" | "rainbow";

export interface CustomLine {
  id: string;
  styleId: LineStyleId;
  /** 컨테이너 기준 px 좌표. 차트 좌표와 무관 (kiyoungi와 동일 방식). */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
```

- [ ] **Step 2: SkinState 인터페이스에 상태/액션 추가**

`kiyoungiArm: KiyoungiArmState;` 선언 바로 아래에 추가:

```ts
  /** 사용자가 그린 커스텀 라인 목록. */
  customLines: CustomLine[];
```

`setKiyoungiArm: (patch: Partial<KiyoungiArmState>) => void;` 바로 아래에 추가:

```ts
  addCustomLine: (line: CustomLine) => void;
  updateCustomLine: (id: string, patch: Partial<CustomLine>) => void;
  removeCustomLine: (id: string) => void;
```

- [ ] **Step 3: 초기 상태값 추가**

`kiyoungiArm: { offsetX: -60, offsetY: 0, length: 180, angle: -60 },` 바로 아래에 추가:

```ts
      customLines: [],
```

- [ ] **Step 4: 액션 구현 추가**

`setKiyoungiArm: (patch) => set((s) => ({ kiyoungiArm: { ...s.kiyoungiArm, ...patch } })),` 바로 아래에 추가:

```ts
      addCustomLine: (line) =>
        set((s) => ({ customLines: [...s.customLines, line] })),
      updateCustomLine: (id, patch) =>
        set((s) => ({
          customLines: s.customLines.map((l) =>
            l.id === id ? { ...l, ...patch } : l,
          ),
        })),
      removeCustomLine: (id) =>
        set((s) => ({ customLines: s.customLines.filter((l) => l.id !== id) })),
```

- [ ] **Step 5: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료 (exit code 0).

- [ ] **Step 6: Commit**

```bash
git add stores/skinStore.ts
git commit -m "feat: add custom line drawing state to skinStore"
```

---

### Task 2: zLayers에 커스텀 라인 z-index 추가

**Files:**
- Modify: `lib/zLayers.ts`

- [ ] **Step 1: Z_LAYER에 lineDrawing 추가**

`lib/zLayers.ts`의 `kiyoungi: 7,` 바로 아래에 추가:

```ts
  /** 커스텀 라인 그리기 위젯 — 최상단, 인터랙티브(그리기/드래그/스타일변경/삭제). */
  lineDrawing: 8,
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 3: Commit**

```bash
git add lib/zLayers.ts
git commit -m "feat: add lineDrawing layer to Z_LAYER"
```

---

### Task 3: 라인 기하 계산 헬퍼 (`lib/lineGeometry.ts`) — TDD

**Files:**
- Create: `lib/lineGeometry.ts`
- Test: `lib/lineGeometry.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/lineGeometry.test.ts` 새로 생성:

```ts
import { describe, it, expect } from "vitest";
import { computeLineGeometry } from "./lineGeometry";

describe("computeLineGeometry", () => {
  it("수평선: length=10, angle=0, perp=(0,1)", () => {
    const g = computeLineGeometry({ x1: 0, y1: 0, x2: 10, y2: 0 });
    expect(g.length).toBeCloseTo(10);
    expect(g.angle).toBeCloseTo(0);
    expect(g.perpX).toBeCloseTo(0);
    expect(g.perpY).toBeCloseTo(1);
  });

  it("수직선: length=10, angle=90, perp=(-1,0)", () => {
    const g = computeLineGeometry({ x1: 0, y1: 0, x2: 0, y2: 10 });
    expect(g.length).toBeCloseTo(10);
    expect(g.angle).toBeCloseTo(90);
    expect(g.perpX).toBeCloseTo(-1);
    expect(g.perpY).toBeCloseTo(0);
  });

  it("길이 0이면 length=1, perp=(0,0)으로 0 나눗셈 방지", () => {
    const g = computeLineGeometry({ x1: 5, y1: 5, x2: 5, y2: 5 });
    expect(g.length).toBe(1);
    expect(g.perpX).toBe(0);
    expect(g.perpY).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run test -- lineGeometry`
Expected: FAIL — `Cannot find module './lineGeometry'` (또는 동일 취지 에러).

- [ ] **Step 3: 구현 작성**

`lib/lineGeometry.ts` 새로 생성:

```ts
export interface LinePoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LineGeometry {
  dx: number;
  dy: number;
  length: number;
  angle: number;
  perpX: number;
  perpY: number;
}

/**
 * 직선 두 점으로부터 길이/각도(deg)/수직 단위벡터를 계산.
 * length가 0이면 1로 처리해 0 나눗셈 방지(perp는 (0,0)).
 */
export function computeLineGeometry({ x1, y1, x2, y2 }: LinePoints): LineGeometry {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const rawLength = Math.hypot(dx, dy);
  const length = rawLength === 0 ? 1 : rawLength;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const perpX = rawLength === 0 ? 0 : -dy / length;
  const perpY = rawLength === 0 ? 0 : dx / length;
  return { dx, dy, length, angle, perpX, perpY };
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run test -- lineGeometry`
Expected: PASS (3 tests).

- [ ] **Step 5: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 6: Commit**

```bash
git add lib/lineGeometry.ts lib/lineGeometry.test.ts
git commit -m "feat: add computeLineGeometry helper for custom line rendering"
```

---

### Task 4: 라인 스타일 4종 정의 (`features/skin/lineStyles.tsx`)

**Files:**
- Create: `features/skin/lineStyles.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`features/skin/lineStyles.tsx` 새로 생성:

```tsx
"use client";

import type { ReactNode } from "react";
import { computeLineGeometry } from "@/lib/lineGeometry";

export type LineStyleId = "cat-tail" | "ribbon" | "lightning" | "rainbow";

export interface LineGeometryPoints {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type LinePointerHandler = (e: React.PointerEvent<SVGElement>) => void;

export interface LineStyleMeta {
  id: LineStyleId;
  name: string;
  render: (
    line: LineGeometryPoints,
    isSelected: boolean,
    onPointerDown?: LinePointerHandler,
  ) => ReactNode;
}

/** 클릭 판정용 투명 굵은 stroke. pointer-events:stroke로 선 위만 반응. */
function HitStroke({
  line,
  onPointerDown,
}: {
  line: LineGeometryPoints;
  onPointerDown?: LinePointerHandler;
}) {
  return (
    <line
      x1={line.x1}
      y1={line.y1}
      x2={line.x2}
      y2={line.y2}
      stroke="transparent"
      strokeWidth={20}
      style={{ pointerEvents: "stroke", cursor: "pointer" }}
      onPointerDown={onPointerDown}
    />
  );
}

/** 선택된 라인 아래에 표시되는 흰색 반투명 강조선. */
function SelectionHalo({ line }: { line: LineGeometryPoints }) {
  return (
    <line
      x1={line.x1}
      y1={line.y1}
      x2={line.x2}
      y2={line.y2}
      stroke="#ffffff"
      strokeWidth={16}
      strokeOpacity={0.25}
      strokeLinecap="round"
    />
  );
}

/** 고양이 꼬리: 점1(굵음)→점2(뾰족) 테이퍼 폴리곤 + 타비 스트라이프 + 끝 fluffy tuft. */
function renderCatTail(
  line: LineGeometryPoints,
  isSelected: boolean,
  onPointerDown?: LinePointerHandler,
): ReactNode {
  const { x1, y1, x2, y2 } = line;
  const { perpX, perpY } = computeLineGeometry(line);
  const baseHalf = 8;
  const tipHalf = 1.5;

  const points = [
    [x1 + perpX * baseHalf, y1 + perpY * baseHalf],
    [x2 + perpX * tipHalf, y2 + perpY * tipHalf],
    [x2 - perpX * tipHalf, y2 - perpY * tipHalf],
    [x1 - perpX * baseHalf, y1 - perpY * baseHalf],
  ]
    .map((p) => p.join(","))
    .join(" ");

  const stripes = [0.25, 0.45, 0.65].map((t, i) => {
    const half = baseHalf + (tipHalf - baseHalf) * t;
    const cx = x1 + (x2 - x1) * t;
    const cy = y1 + (y2 - y1) * t;
    return (
      <line
        key={i}
        x1={cx + perpX * half}
        y1={cy + perpY * half}
        x2={cx - perpX * half}
        y2={cy - perpY * half}
        stroke="#A8612A"
        strokeWidth={2.5}
      />
    );
  });

  return (
    <g>
      {isSelected && <SelectionHalo line={line} />}
      <polygon points={points} fill="#D98E4A" />
      {stripes}
      <circle cx={x2} cy={y2} r={4} fill="#D98E4A" />
      <circle cx={x2 + perpX * 3} cy={y2 + perpY * 3} r={2.5} fill="#D98E4A" />
      <circle cx={x2 - perpX * 3} cy={y2 - perpY * 3} r={2.5} fill="#D98E4A" />
      <HitStroke line={line} onPointerDown={onPointerDown} />
    </g>
  );
}

/** 리본: 두께 있는 띠 + 중앙 흰 점선 + 끝 매듭(나비 날개 2개+원). */
function renderRibbon(
  line: LineGeometryPoints,
  isSelected: boolean,
  onPointerDown?: LinePointerHandler,
): ReactNode {
  const { x1, y1, x2, y2 } = line;
  const { angle, perpX, perpY } = computeLineGeometry(line);
  const half = 6;

  const points = [
    [x1 + perpX * half, y1 + perpY * half],
    [x2 + perpX * half, y2 + perpY * half],
    [x2 - perpX * half, y2 - perpY * half],
    [x1 - perpX * half, y1 - perpY * half],
  ]
    .map((p) => p.join(","))
    .join(" ");

  return (
    <g>
      {isSelected && <SelectionHalo line={line} />}
      <polygon points={points} fill="#FF8FB1" />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#ffffff"
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      <g transform={`translate(${x2} ${y2}) rotate(${angle})`}>
        <polygon points="0,0 -16,-9 -10,0" fill="#FF6FA0" />
        <polygon points="0,0 -16,9 -10,0" fill="#FF6FA0" />
        <circle cx={0} cy={0} r={4} fill="#FFC1D6" />
      </g>
      <HitStroke line={line} onPointerDown={onPointerDown} />
    </g>
  );
}

const LIGHTNING_JITTER = [0, -8, 6, -10, 0];

/** 번개: 고정 시드 지그재그 폴리라인 + 바깥 glow + 안쪽 밝은 선. */
function renderLightning(
  line: LineGeometryPoints,
  isSelected: boolean,
  onPointerDown?: LinePointerHandler,
): ReactNode {
  const { x1, y1, x2, y2 } = line;
  const { perpX, perpY } = computeLineGeometry(line);

  const points = LIGHTNING_JITTER.map((j, i) => {
    const t = i / (LIGHTNING_JITTER.length - 1);
    const bx = x1 + (x2 - x1) * t;
    const by = y1 + (y2 - y1) * t;
    return `${bx + perpX * j},${by + perpY * j}`;
  }).join(" ");

  return (
    <g>
      {isSelected && <SelectionHalo line={line} />}
      <polyline
        points={points}
        fill="none"
        stroke="#FFE14D"
        strokeWidth={10}
        strokeOpacity={0.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#FFE14D"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <HitStroke line={line} onPointerDown={onPointerDown} />
    </g>
  );
}

/** 무지개: userSpaceOnUse 그래디언트(빨강~보라) 굵은 선. */
function renderRainbow(
  line: LineGeometryPoints,
  isSelected: boolean,
  onPointerDown?: LinePointerHandler,
): ReactNode {
  const { id, x1, y1, x2, y2 } = line;
  const gradientId = `line-rainbow-${id}`;

  return (
    <g>
      {isSelected && <SelectionHalo line={line} />}
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor="#FF4D4D" />
          <stop offset="20%" stopColor="#FF9F4D" />
          <stop offset="40%" stopColor="#FFE14D" />
          <stop offset="60%" stopColor="#4DDC74" />
          <stop offset="80%" stopColor="#4D9DFF" />
          <stop offset="100%" stopColor="#A14DFF" />
        </linearGradient>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={`url(#${gradientId})`}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <HitStroke line={line} onPointerDown={onPointerDown} />
    </g>
  );
}

export const LINE_STYLES: LineStyleMeta[] = [
  { id: "cat-tail", name: "고양이 꼬리", render: renderCatTail },
  { id: "ribbon", name: "리본", render: renderRibbon },
  { id: "lightning", name: "번개", render: renderLightning },
  { id: "rainbow", name: "무지개", render: renderRainbow },
];

export function getLineStyle(id: LineStyleId): LineStyleMeta {
  return LINE_STYLES.find((s) => s.id === id) ?? LINE_STYLES[0];
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 3: Commit**

```bash
git add features/skin/lineStyles.tsx
git commit -m "feat: add cat-tail/ribbon/lightning/rainbow line style renderers"
```

---

### Task 5: 스타일 선택 팝업 (`LineStylePicker`)

**Files:**
- Create: `features/skin/LineStylePicker.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`features/skin/LineStylePicker.tsx` 새로 생성:

```tsx
"use client";

import { LINE_STYLES, type LineGeometryPoints, type LineStyleId } from "./lineStyles";

const PREVIEW_LINE: LineGeometryPoints = { id: "preview", x1: 4, y1: 26, x2: 44, y2: 6 };

interface Props {
  onSelect: (styleId: LineStyleId) => void;
}

/**
 * 라인 스타일 4종 미리보기 팝업.
 * "그릴 스타일 선택"과 "선택된 라인의 스타일 변경" 양쪽에서 재사용.
 */
export default function LineStylePicker({ onSelect }: Props) {
  return (
    <div
      data-export-ignore="true"
      className="flex gap-1 rounded border border-panel-border bg-panel-alt p-1.5 shadow-lg"
      style={{ pointerEvents: "auto" }}
    >
      {LINE_STYLES.map((style) => (
        <button
          key={style.id}
          onClick={() => onSelect(style.id)}
          title={style.name}
          className="rounded border border-transparent p-1 hover:border-accent hover:bg-panel-hover"
        >
          <svg width={48} height={32} viewBox="0 0 48 32">
            {style.render(PREVIEW_LINE, false)}
          </svg>
        </button>
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
git add features/skin/LineStylePicker.tsx
git commit -m "feat: add LineStylePicker style preview popup"
```

---

### Task 6: 메인 오버레이 (`LineDrawOverlay`)

**Files:**
- Create: `features/skin/LineDrawOverlay.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`features/skin/LineDrawOverlay.tsx` 새로 생성:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSkinStore, type CustomLine } from "@/stores/skinStore";
import { Z_LAYER } from "@/lib/zLayers";
import { useDragHandle } from "@/lib/useDragHandle";
import LineStylePicker from "./LineStylePicker";
import { getLineStyle, type LineStyleId } from "./lineStyles";

type Mode = "idle" | "picking" | "drawing";

const MIN_DRAW_DISTANCE = 10;

/**
 * 커스텀 라인 그리기 위젯.
 * 좌상단 ✏️ 버튼 → 스타일 선택(고양이 꼬리/리본/번개/무지개) → 차트 위 드래그로 직선 생성.
 * 기존 라인 클릭 → 선택(끝점 핸들 + 스타일 변경 + 삭제), 바깥 클릭 → 선택/모드 해제.
 */
export default function LineDrawOverlay() {
  const customLines = useSkinStore((s) => s.customLines);
  const addCustomLine = useSkinStore((s) => s.addCustomLine);
  const updateCustomLine = useSkinStore((s) => s.updateCustomLine);
  const removeCustomLine = useSkinStore((s) => s.removeCustomLine);
  const startDrag = useDragHandle();

  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [pendingStyle, setPendingStyle] = useState<LineStyleId | null>(null);
  const [draft, setDraft] = useState<CustomLine | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(e.target as Node)) {
        setSelectedId(null);
        setMode("idle");
        setPendingStyle(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "drawing" || !pendingStyle) return;
    e.preventDefault();

    const rect = containerRef.current!.getBoundingClientRect();
    const x1 = e.clientX - rect.left;
    const y1 = e.clientY - rect.top;
    setDraft({ id: "draft", styleId: pendingStyle, x1, y1, x2: x1, y2: y1 });

    const handleMove = (ev: PointerEvent) => {
      setDraft((d) =>
        d ? { ...d, x2: ev.clientX - rect.left, y2: ev.clientY - rect.top } : d,
      );
    };
    const handleUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      const x2 = ev.clientX - rect.left;
      const y2 = ev.clientY - rect.top;
      if (Math.hypot(x2 - x1, y2 - y1) >= MIN_DRAW_DISTANCE) {
        const id = crypto.randomUUID();
        addCustomLine({ id, styleId: pendingStyle, x1, y1, x2, y2 });
        setSelectedId(id);
      }
      setDraft(null);
      setMode("idle");
      setPendingStyle(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const selectedLine = customLines.find((l) => l.id === selectedId) ?? null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: Z_LAYER.lineDrawing }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        style={{
          pointerEvents: mode === "drawing" ? "auto" : "none",
          cursor: mode === "drawing" ? "crosshair" : "default",
        }}
        onPointerDown={handleSvgPointerDown}
      >
        {customLines.map((line) => {
          const style = getLineStyle(line.styleId);
          return (
            <g key={line.id} style={{ pointerEvents: "auto" }}>
              {style.render(line, line.id === selectedId, (e) => {
                e.stopPropagation();
                setSelectedId(line.id);
              })}
            </g>
          );
        })}
        {draft && (
          <g style={{ pointerEvents: "none", opacity: 0.7 }}>
            {getLineStyle(draft.styleId).render(draft, false)}
          </g>
        )}
      </svg>

      <button
        data-export-ignore="true"
        onClick={() => {
          setSelectedId(null);
          setMode((m) => (m === "idle" ? "picking" : "idle"));
          setPendingStyle(null);
        }}
        style={{ pointerEvents: "auto", position: "absolute", left: 8, top: 8 }}
        className="rounded bg-panel-alt p-1.5 text-sm shadow hover:bg-panel-hover"
        title="라인 그리기"
      >
        ✏️
      </button>

      {mode === "picking" && (
        <div
          data-export-ignore="true"
          style={{ pointerEvents: "auto", position: "absolute", left: 8, top: 44 }}
        >
          <LineStylePicker
            onSelect={(styleId) => {
              setPendingStyle(styleId);
              setMode("drawing");
            }}
          />
        </div>
      )}

      {selectedLine && (
        <LineEditControls
          line={selectedLine}
          startDrag={startDrag}
          onUpdate={(patch) => updateCustomLine(selectedLine.id, patch)}
          onStyleChange={(styleId) => updateCustomLine(selectedLine.id, { styleId })}
          onDelete={() => {
            removeCustomLine(selectedLine.id);
            setSelectedId(null);
          }}
        />
      )}
    </div>
  );
}

function LineEditControls({
  line,
  startDrag,
  onUpdate,
  onStyleChange,
  onDelete,
}: {
  line: CustomLine;
  startDrag: ReturnType<typeof useDragHandle>;
  onUpdate: (patch: Partial<CustomLine>) => void;
  onStyleChange: (styleId: LineStyleId) => void;
  onDelete: () => void;
}) {
  const handlePointPointerDown =
    (point: "start" | "end") => (e: React.PointerEvent) => {
      const start = { ...line };
      startDrag(e, (dx, dy) => {
        if (point === "start") onUpdate({ x1: start.x1 + dx, y1: start.y1 + dy });
        else onUpdate({ x2: start.x2 + dx, y2: start.y2 + dy });
      });
    };

  const midX = (line.x1 + line.x2) / 2;
  const midY = (line.y1 + line.y2) / 2;

  return (
    <>
      {[
        { x: line.x1, y: line.y1, point: "start" as const },
        { x: line.x2, y: line.y2, point: "end" as const },
      ].map(({ x, y, point }) => (
        <div
          key={point}
          data-export-ignore="true"
          onPointerDown={handlePointPointerDown(point)}
          style={{
            position: "absolute",
            left: x - 6,
            top: y - 6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#f5d76e",
            border: "1px solid #8b5e34",
            cursor: "move",
            pointerEvents: "auto",
          }}
        />
      ))}

      <div
        data-export-ignore="true"
        style={{
          position: "absolute",
          left: midX,
          top: midY - 48,
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <LineStylePicker onSelect={onStyleChange} />
        <button
          onClick={onDelete}
          className="rounded bg-down px-2 py-1 text-xs text-white hover:opacity-80"
          title="삭제"
        >
          ×
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 3: Commit**

```bash
git add features/skin/LineDrawOverlay.tsx
git commit -m "feat: add LineDrawOverlay with draw/select/edit interactions"
```

---

### Task 7: ChartView 렌더 순서에 LineDrawOverlay 추가

**Files:**
- Modify: `features/chart/ChartView.tsx`

- [ ] **Step 1: import 추가**

`features/chart/ChartView.tsx` 상단 import에서 `import KiyoungiOverlay from "@/features/skin/KiyoungiOverlay";` 바로 아래에 추가:

```ts
import LineDrawOverlay from "@/features/skin/LineDrawOverlay";
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
          <KiyoungiOverlay />
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
          <LineDrawOverlay />
        </div>
```

- [ ] **Step 3: 타입체크**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run typecheck`
Expected: 에러 없이 종료.

- [ ] **Step 4: Commit**

```bash
git add features/chart/ChartView.tsx
git commit -m "feat: render LineDrawOverlay on top of chart layers"
```

---

### Task 8: 수동 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 개발 서버 기동**

Run: `cd /Users/ibok/project/chartggu/frontend && npm run dev`

- [ ] **Step 2: 스타일 picker 표시 확인**

브라우저에서 `http://localhost:3000` 접속 → 차트 좌상단 ✏️ 버튼 클릭.
Expected: 고양이 꼬리/리본/번개/무지개 4종 미리보기 팝업이 버튼 아래 표시됨.

- [ ] **Step 3: 라인 생성 확인**

스타일 하나 선택(예: 고양이 꼬리) → 커서가 crosshair로 변함 → 차트 위에서 드래그(10px 이상).
Expected: 드래그 경로 미리보기가 보이고, 놓으면 해당 스타일의 선이 생성되며 양 끝에 노란 끝점 핸들이 표시됨.

- [ ] **Step 4: 끝점 핸들 드래그 확인**

끝점 핸들을 드래그.
Expected: 선의 길이/각도가 자연스럽게 변경됨.

- [ ] **Step 5: 기존 선 클릭 → 스타일 변경 확인**

다른 빈 영역 클릭(선택 해제) 후, 그려진 선을 클릭.
Expected: 끝점 핸들 + 스타일 picker + 삭제(×) 버튼이 다시 표시됨. picker에서 다른 스타일(예: 무지개) 클릭 → 선의 모양이 즉시 변경됨.

- [ ] **Step 6: 삭제 확인**

선택된 상태에서 × 버튼 클릭.
Expected: 해당 선이 사라짐.

- [ ] **Step 7: 여러 선 동시 존재 확인**

위 과정을 반복해 스타일이 다른 선을 2~3개 생성.
Expected: 각 선이 독립적으로 존재하고, 클릭하면 해당 선만 선택됨(다른 선의 핸들은 보이지 않음).

- [ ] **Step 8: 바깥 클릭 / 차트 인터랙션 확인**

선을 선택한 상태에서 차트의 빈 영역(캔들/배경)을 클릭.
Expected: 핸들/picker/삭제버튼이 모두 사라짐. 이후 차트 줌/팬/크로스헤어가 정상 동작.

- [ ] **Step 9: 새로고침 후 유지 확인**

선을 1~2개 만든 뒤 새로고침.
Expected: 선의 위치/스타일이 그대로 유지됨 (zustand persist).

- [ ] **Step 10: PNG 내보내기 확인**

선을 선택한 상태(핸들/picker 표시 중)에서 툴바의 "PNG 저장" 클릭.
Expected: 다운로드된 PNG에 선은 포함되고, ✏️ 버튼/picker/끝점 핸들/삭제 버튼은 포함되지 않음.

---

## Self-Review 결과

- **Spec coverage**: 레이어 z-index(Task 2), 상태(`customLines`/`CustomLine`/`LineStyleId`, Task 1), 4종 스타일 SVG 렌더(Task 4) + 공용 기하 계산(Task 3, TDD), 스타일 picker(Task 5), 그리기/선택/끝점편집/스타일변경/삭제/바깥클릭해제(Task 6), ChartView 통합(Task 7), PNG `data-export-ignore` 제외(기존 ExportButton 필터 재사용 — 코드 변경 불필요, Task 6에서 속성만 부여), persist·수동 검증(Task 8) — spec의 모든 섹션이 매핑됨. "범위 제외"(곱선·색상커스텀·다중스타일조합·멀티터치·사이드바카드)는 plan에도 포함하지 않음.
- **Placeholder scan**: 모든 코드 블록이 완성된 실제 코드. "TODO"/"나중에" 없음.
- **Type consistency**: `CustomLine`/`LineStyleId`/`customLines`/`addCustomLine`/`updateCustomLine`/`removeCustomLine`이 Task 1(스토어 정의)부터 Task 6(사용처)까지 동일. `LineGeometryPoints`/`LineStyleMeta`/`getLineStyle`/`LINE_STYLES`가 Task 4(정의)와 Task 5~6(사용처)에서 동일하게 import됨. `computeLineGeometry`의 반환 필드(`length`/`angle`/`perpX`/`perpY`)가 Task 3(정의+테스트)과 Task 4(사용처)에서 일치.
