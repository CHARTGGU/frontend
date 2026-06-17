# 온보딩 스포트라이트 코치마크 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 처음 접속한 사용자에게 1회만 핵심 기능(종목·지표·스킨·PNG)을 스포트라이트 + 말풍선으로 안내하는 온보딩 가이드를 만든다.

**Architecture:** 순수 로직(localStorage 래퍼·말풍선 위치 계산)은 `lib/`에 두고 TDD(node vitest). React 훅/컴포넌트는 `features/onboarding/`에 두고 수동 검증. 타깃은 기존 컴포넌트에 `data-onboarding` 속성만 부착해 연결하고, `AppShell`에 `<OnboardingGuide>` 한 줄을 추가한다.

**Tech Stack:** Next.js(App Router, client component) · React 18 · TypeScript · Tailwind · Zustand(기존) · vitest(node 환경, `lib/**/*.test.ts`만 실행).

---

## File Structure

**Create:**
- `lib/onboardingStorage.ts` — localStorage 1회표시 플래그 read/write (try/catch)
- `lib/onboardingStorage.test.ts` — 위 단위 테스트
- `lib/coachmarkPosition.ts` — 말풍선 배치/clamp 순수 함수
- `lib/coachmarkPosition.test.ts` — 위 단위 테스트
- `features/onboarding/steps.ts` — 단계 config + 셀렉터 헬퍼
- `features/onboarding/useOnboarding.ts` — 표시여부 + 단계 상태머신 훅
- `features/onboarding/useTargetRect.ts` — 타깃 DOMRect 측정/추적 훅
- `features/onboarding/Spotlight.tsx` — 구멍 뚫린 어두운 마스크
- `features/onboarding/Coachmark.tsx` — 말풍선(제목·설명·점·버튼)
- `features/onboarding/OnboardingGuide.tsx` — 본체(훅 결합·스크롤잠금·렌더)

**Modify:**
- `features/chart/Toolbar.tsx` — SymbolSelect 루트(:85)·IndicatorMenu 루트(:130)에 `data-onboarding`
- `features/export/ExportButton.tsx` — 버튼(:49)에 `data-onboarding="export"`
- `features/skin/SkinSidebar.tsx` — 펼친 `<aside>`(:128)에 `data-onboarding="skin"`
- `features/AppShell.tsx` — `<OnboardingGuide steps={ONBOARDING_STEPS} />` 추가

---

## Task 1: localStorage 래퍼 (lib, TDD)

**Files:**
- Create: `lib/onboardingStorage.ts`
- Test: `lib/onboardingStorage.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`lib/onboardingStorage.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSeen, setSeen, ONBOARDING_STORAGE_KEY } from "./onboardingStorage";

function mockStorage() {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  vi.stubGlobal("localStorage", ls);
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("onboardingStorage", () => {
  it("플래그가 없으면 getSeen()은 false", () => {
    mockStorage();
    expect(getSeen()).toBe(false);
  });

  it("setSeen() 후 getSeen()은 true", () => {
    mockStorage();
    setSeen();
    expect(getSeen()).toBe(true);
  });

  it("setSeen()은 정확한 키에 '1'을 쓴다", () => {
    const store = mockStorage();
    setSeen();
    expect(store.get(ONBOARDING_STORAGE_KEY)).toBe("1");
  });

  it("localStorage 접근이 throw해도 getSeen()은 false (graceful → 표시)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(getSeen()).toBe(false);
  });

  it("localStorage 접근이 throw해도 setSeen()은 예외를 던지지 않는다", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => setSeen()).not.toThrow();
  });

  it("localStorage 자체가 undefined여도 안전 (SSR/차단)", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(getSeen()).toBe(false);
    expect(() => setSeen()).not.toThrow();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/onboardingStorage.test.ts`
Expected: FAIL — `./onboardingStorage` 모듈/export 없음.

- [ ] **Step 3: 구현 작성**

`lib/onboardingStorage.ts`:

```ts
/**
 * 온보딩 가이드 1회 표시 플래그.
 * localStorage 접근 불가(시크릿 모드·차단·SSR)여도 앱이 죽지 않도록 전부 try/catch.
 * - read 실패 → false(=안 봤음) 반환 → 가이드를 표시(graceful).
 * - write 실패 → 조용히 무시.
 * 가이드 개편 시 키 버전(v1→v2)을 올려 재노출할 수 있다.
 */
export const ONBOARDING_STORAGE_KEY = "chartskin:onboarding:seen:v1";

export function getSeen(): boolean {
  try {
    return globalThis.localStorage?.getItem(ONBOARDING_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSeen(): void {
  try {
    globalThis.localStorage?.setItem(ONBOARDING_STORAGE_KEY, "1");
  } catch {
    // 저장 실패는 무시 — 다음 접속에 다시 보일 수 있으나 앱 동작에는 영향 없음.
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run lib/onboardingStorage.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/onboardingStorage.ts lib/onboardingStorage.test.ts
git commit -m "feat: 온보딩 1회표시 localStorage 래퍼 (graceful try/catch)"
```

---

## Task 2: 말풍선 위치 계산 (lib, TDD)

**Files:**
- Create: `lib/coachmarkPosition.ts`
- Test: `lib/coachmarkPosition.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`lib/coachmarkPosition.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  computeCoachmarkPosition,
  COACHMARK_GAP,
  VIEWPORT_MARGIN,
  type RectLike,
} from "./coachmarkPosition";

const VIEWPORT = { width: 1280, height: 800 };
const BUBBLE = { width: 280, height: 120 };

function rect(partial: Partial<RectLike>): RectLike {
  return { top: 0, left: 0, width: 100, height: 40, ...partial };
}

describe("computeCoachmarkPosition", () => {
  it("위/아래 공간 충분하면 아래(bottom)에 배치하고 타깃 중앙 정렬", () => {
    const target = rect({ top: 100, left: 590, width: 100, height: 40 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.placement).toBe("bottom");
    expect(pos.top).toBe(100 + 40 + COACHMARK_GAP);
    // 중앙 정렬: target 중앙 640 - bubble 절반 140 = 500
    expect(pos.left).toBe(500);
  });

  it("아래 공간이 없으면 위(top)에 배치", () => {
    const target = rect({ top: 740, left: 590, width: 100, height: 40 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.placement).toBe("top");
    expect(pos.top).toBe(740 - COACHMARK_GAP - BUBBLE.height);
  });

  it("세로로 꽉 찬 우측 패널이면 왼쪽(left)에 배치", () => {
    const target = rect({ top: 0, left: 980, width: 300, height: 800 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.placement).toBe("left");
    expect(pos.left).toBe(980 - COACHMARK_GAP - BUBBLE.width);
  });

  it("왼쪽 경계를 넘는 left는 VIEWPORT_MARGIN으로 보정", () => {
    const target = rect({ top: 100, left: 0, width: 60, height: 40 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.left).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
  });

  it("오른쪽 경계를 넘지 않도록 left를 보정", () => {
    const target = rect({ top: 100, left: 1240, width: 40, height: 40 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.left + BUBBLE.width).toBeLessThanOrEqual(
      VIEWPORT.width - VIEWPORT_MARGIN,
    );
  });

  it("top도 세로 경계 안으로 보정", () => {
    const target = rect({ top: 0, left: 980, width: 300, height: 800 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.top).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
    expect(pos.top + BUBBLE.height).toBeLessThanOrEqual(
      VIEWPORT.height - VIEWPORT_MARGIN,
    );
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run lib/coachmarkPosition.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성**

`lib/coachmarkPosition.ts`:

```ts
/**
 * 말풍선(coachmark) 배치 계산 — 순수 함수 (DOM 비의존, 단위 테스트 가능).
 * 선호 순서대로 타깃 주변에 배치하고, viewport 경계를 넘으면 안쪽으로 clamp.
 */
export interface RectLike {
  top: number;
  left: number;
  width: number;
  height: number;
}
export interface SizeLike {
  width: number;
  height: number;
}
export type Placement = "bottom" | "top" | "right" | "left";
export interface CoachmarkPosition {
  top: number;
  left: number;
  placement: Placement;
}

/** 타깃과 말풍선 사이 간격(px). */
export const COACHMARK_GAP = 12;
/** 화면 경계에서 유지할 최소 여백(px). */
export const VIEWPORT_MARGIN = 16;

function clamp(value: number, min: number, max: number): number {
  // max < min(공간이 말풍선보다 작은 극단)일 때는 min 우선.
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

export function computeCoachmarkPosition(
  target: RectLike,
  bubble: SizeLike,
  viewport: SizeLike,
): CoachmarkPosition {
  const fitsBottom =
    target.top + target.height + COACHMARK_GAP + bubble.height <=
    viewport.height - VIEWPORT_MARGIN;
  const fitsTop =
    target.top - COACHMARK_GAP - bubble.height >= VIEWPORT_MARGIN;
  const fitsRight =
    target.left + target.width + COACHMARK_GAP + bubble.width <=
    viewport.width - VIEWPORT_MARGIN;

  let placement: Placement;
  if (fitsBottom) placement = "bottom";
  else if (fitsTop) placement = "top";
  else if (fitsRight) placement = "right";
  else placement = "left";

  const centerX = target.left + target.width / 2 - bubble.width / 2;
  const centerY = target.top + target.height / 2 - bubble.height / 2;

  let top: number;
  let left: number;
  switch (placement) {
    case "bottom":
      top = target.top + target.height + COACHMARK_GAP;
      left = centerX;
      break;
    case "top":
      top = target.top - COACHMARK_GAP - bubble.height;
      left = centerX;
      break;
    case "right":
      top = centerY;
      left = target.left + target.width + COACHMARK_GAP;
      break;
    case "left":
      top = centerY;
      left = target.left - COACHMARK_GAP - bubble.width;
      break;
  }

  return {
    placement,
    left: clamp(
      left,
      VIEWPORT_MARGIN,
      viewport.width - VIEWPORT_MARGIN - bubble.width,
    ),
    top: clamp(
      top,
      VIEWPORT_MARGIN,
      viewport.height - VIEWPORT_MARGIN - bubble.height,
    ),
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run lib/coachmarkPosition.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/coachmarkPosition.ts lib/coachmarkPosition.test.ts
git commit -m "feat: 말풍선 배치/clamp 순수 함수 (viewport 경계 보정)"
```

---

## Task 3: 단계 config

**Files:**
- Create: `features/onboarding/steps.ts`

- [ ] **Step 1: config 작성**

`features/onboarding/steps.ts`:

```ts
/**
 * 온보딩 단계 정의 (배열 순서 = 진행 순서).
 * 각 단계의 타깃은 기존 컴포넌트에 부착된 data-onboarding="<id>" 요소.
 */
export interface OnboardingStep {
  /** 타깃 식별자 — DOM의 data-onboarding 값과 일치. */
  id: string;
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "symbol",
    title: "종목 선택",
    description: "보고 싶은 코인을 여기서 골라보세요.",
  },
  {
    id: "indicator",
    title: "지표 추가",
    description: "MA·볼린저밴드·RSI 같은 보조지표를 켜고 끌 수 있어요.",
  },
  {
    id: "skin",
    title: "스킨 적용",
    description: "차트에 배경·캐릭터 스킨을 입혀 나만의 뷰를 만들어요.",
  },
  {
    id: "export",
    title: "이미지 저장",
    description: "꾸민 차트를 PNG 한 장으로 내보낼 수 있어요.",
  },
];

/** data-onboarding 셀렉터 헬퍼. */
export const onboardingSelector = (id: string) => `[data-onboarding="${id}"]`;
```

- [ ] **Step 2: 타입체크**

Run: `npm run typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add features/onboarding/steps.ts
git commit -m "feat: 온보딩 4단계 config (종목·지표·스킨·PNG)"
```

---

## Task 4: useOnboarding 훅 (표시여부 + 단계 상태머신)

**Files:**
- Create: `features/onboarding/useOnboarding.ts`

- [ ] **Step 1: 구현 작성**

`features/onboarding/useOnboarding.ts`:

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { getSeen, setSeen } from "@/lib/onboardingStorage";

export interface OnboardingController {
  /** 가이드 표시 여부. */
  isOpen: boolean;
  /** 현재 단계 인덱스(0-base). */
  stepIndex: number;
  /** 마지막 단계인가. */
  isLast: boolean;
  /** 다음 단계로(마지막이면 닫고 본 것으로 기록). */
  next: () => void;
  /** 즉시 닫고 본 것으로 기록. */
  close: () => void;
}

/**
 * 온보딩 표시 여부와 단계 진행을 관리.
 * 마운트 시 localStorage를 확인해 "안 봤으면" 1회 표시한다.
 */
export function useOnboarding(stepCount: number): OnboardingController {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // 첫 마운트 1회만 확인 (effect라 SSR/하이드레이션 깜빡임 없음).
  useEffect(() => {
    if (!getSeen()) setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setSeen();
    setIsOpen(false);
  }, []);

  const isLast = stepIndex >= stepCount - 1;

  const next = useCallback(() => {
    if (stepIndex >= stepCount - 1) {
      close();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, stepCount, close]);

  return { isOpen, stepIndex, isLast, next, close };
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add features/onboarding/useOnboarding.ts
git commit -m "feat: useOnboarding 훅 (1회표시 + 단계 진행/종료)"
```

---

## Task 5: useTargetRect 훅 (타깃 측정/추적)

**Files:**
- Create: `features/onboarding/useTargetRect.ts`

- [ ] **Step 1: 구현 작성**

`features/onboarding/useTargetRect.ts`:

```ts
"use client";

import { useLayoutEffect, useState } from "react";

/**
 * 셀렉터로 찾은 요소의 화면 사각형(DOMRect)을 측정하고 추적한다.
 * - resize/scroll/ResizeObserver 변화를 requestAnimationFrame으로 throttle 갱신
 *   (CLAUDE.md §5: view 변화에 딱딱 따라붙는 기민함).
 * - 마운트 직후 타깃이 아직 없을 수 있어 최대 MAX_POLL 프레임 폴링.
 * - 끝내 못 찾으면 null.
 */
const MAX_POLL = 30;

export function useTargetRect(
  selector: string,
  enabled: boolean,
): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!enabled) {
      setRect(null);
      return;
    }

    let raf = 0;
    let polls = 0;

    const measure = () => {
      const el = document.querySelector(selector);
      if (el) {
        setRect(el.getBoundingClientRect());
        return;
      }
      // 아직 미마운트 → 다음 프레임 재시도(한도 내).
      if (polls < MAX_POLL) {
        polls += 1;
        raf = requestAnimationFrame(measure);
      } else {
        setRect(null);
      }
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.querySelector(selector);
        setRect(el ? el.getBoundingClientRect() : null);
      });
    };

    measure();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true); // 내부 스크롤 포함(capture)
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      ro.disconnect();
    };
  }, [selector, enabled]);

  return rect;
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add features/onboarding/useTargetRect.ts
git commit -m "feat: useTargetRect 훅 (타깃 측정 + resize/scroll/RO rAF 추적)"
```

---

## Task 6: Spotlight 컴포넌트

**Files:**
- Create: `features/onboarding/Spotlight.tsx`

- [ ] **Step 1: 구현 작성**

`features/onboarding/Spotlight.tsx`:

```ts
"use client";

import type { CSSProperties } from "react";

/** 스포트라이트 구멍 주변 여유(px). */
const SPOTLIGHT_PADDING = 6;

interface SpotlightProps {
  rect: DOMRect;
  /** 빈곳/강조영역 클릭 → 다음(또는 닫기). */
  onAdvance: () => void;
}

/**
 * 타깃 사각형만 구멍처럼 밝게 남기고 주변을 어둡게.
 * box-shadow 트릭: 작은 박스에 거대한 그림자를 주면 박스 밖이 전부 어두워진다.
 * (SVG mask 대비 구현 단순 + 부드러운 경계 + 리플로우 없음)
 * 박스 자체가 클릭을 가로채 밑 요소 직클릭을 막고 onAdvance만 호출한다.
 */
export default function Spotlight({ rect, onAdvance }: SpotlightProps) {
  const style: CSSProperties = {
    position: "fixed",
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
    borderRadius: 8,
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.62)",
    outline: "2px solid rgba(99, 179, 237, 0.9)",
    cursor: "pointer",
  };
  return <div style={style} onClick={onAdvance} aria-hidden />;
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add features/onboarding/Spotlight.tsx
git commit -m "feat: Spotlight 컴포넌트 (box-shadow 구멍 + 클릭 가로채기)"
```

---

## Task 7: Coachmark 컴포넌트 (말풍선)

**Files:**
- Create: `features/onboarding/Coachmark.tsx`

- [ ] **Step 1: 구현 작성**

`features/onboarding/Coachmark.tsx`:

```ts
"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  computeCoachmarkPosition,
  type CoachmarkPosition,
} from "@/lib/coachmarkPosition";
import type { OnboardingStep } from "./steps";

interface CoachmarkProps {
  step: OnboardingStep;
  stepIndex: number;
  total: number;
  isLast: boolean;
  /** 타깃 사각형. null이면 화면 중앙에 배치(타깃 부재 fallback). */
  rect: DOMRect | null;
  onNext: () => void;
}

/**
 * 말풍선: 제목·설명·점 인디케이터·다음/확인 버튼.
 * 자기 크기를 측정한 뒤 computeCoachmarkPosition으로 타깃 주변에 배치하고
 * viewport 경계를 넘으면 안쪽으로 보정한다.
 */
export default function Coachmark({
  step,
  stepIndex,
  total,
  isLast,
  rect,
  onNext,
}: CoachmarkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<CoachmarkPosition | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bubble = {
      width: el.offsetWidth,
      height: el.offsetHeight,
    };
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    if (rect) {
      setPos(computeCoachmarkPosition(rect, bubble, viewport));
    } else {
      // 타깃 없음 → 화면 중앙.
      setPos({
        placement: "bottom",
        top: viewport.height / 2 - bubble.height / 2,
        left: viewport.width / 2 - bubble.width / 2,
      });
    }
  }, [rect, step.id]);

  return (
    <div
      ref={ref}
      // 측정 전(pos=null)에는 보이지 않게 화면 밖에 둔다(깜빡임 방지).
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: 280,
      }}
      className="z-[1] rounded-lg border border-panel-border bg-panel p-4 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-sm font-bold text-text-primary">{step.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
        {step.description}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === stepIndex ? "bg-accent" : "bg-panel-border"
              }`}
            />
          ))}
        </div>
        <button
          onClick={onNext}
          className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
        >
          {isLast ? "확인" : "다음"}
        </button>
      </div>
    </div>
  );
}
```

> 참고: 말풍선 버튼/본문 클릭이 오버레이의 onAdvance로 이중 전파되지 않도록 `stopPropagation` 후 버튼은 `onNext`만 호출한다. 버튼 onNext == 오버레이 onAdvance == 컨트롤러 next() 로 동작은 동일하지만, 이중 호출(한 클릭에 2단계 점프)을 막기 위해 전파를 차단한다.

- [ ] **Step 2: 타입체크**

Run: `npm run typecheck`
Expected: 에러 없음. (`bg-accent-hover`, `border-panel-border`, `text-text-muted` 등은 기존 컴포넌트에서 쓰는 토큰 — globals/tailwind에 존재.)

- [ ] **Step 3: 커밋**

```bash
git add features/onboarding/Coachmark.tsx
git commit -m "feat: Coachmark 말풍선 (제목·설명·점 인디케이터·다음/확인)"
```

---

## Task 8: OnboardingGuide 본체 (훅 결합 + 스크롤 잠금 + 빈곳 오버레이)

**Files:**
- Create: `features/onboarding/OnboardingGuide.tsx`

- [ ] **Step 1: 구현 작성**

`features/onboarding/OnboardingGuide.tsx`:

```ts
"use client";

import { useEffect } from "react";
import { useOnboarding } from "./useOnboarding";
import { useTargetRect } from "./useTargetRect";
import { onboardingSelector, type OnboardingStep } from "./steps";
import Spotlight from "./Spotlight";
import Coachmark from "./Coachmark";

interface OnboardingGuideProps {
  steps: OnboardingStep[];
}

/**
 * 온보딩 가이드 본체.
 * - 첫 방문 1회만 표시(useOnboarding).
 * - 현재 단계 타깃을 측정(useTargetRect)해 Spotlight + Coachmark 렌더.
 * - 표시 중 배경 스크롤 잠금.
 * - 오버레이 빈곳/강조영역/버튼 클릭 → 모두 next()(마지막이면 close()).
 */
export default function OnboardingGuide({ steps }: OnboardingGuideProps) {
  const { isOpen, stepIndex, isLast, next } = useOnboarding(steps.length);
  const step = steps[stepIndex];
  const rect = useTargetRect(
    step ? onboardingSelector(step.id) : "",
    isOpen,
  );

  // 표시 중 배경 스크롤 잠금.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !step) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* 빈곳 클릭 레이어: rect가 없을 때도 화면 전체를 어둡게/클릭 가능하게.
          rect가 있으면 Spotlight가 그 위에서 어둠을 그리므로 이 레이어는 투명. */}
      <div
        className="absolute inset-0"
        style={{
          background: rect ? "transparent" : "rgba(0,0,0,0.62)",
          cursor: "pointer",
        }}
        onClick={next}
      />
      {rect && <Spotlight rect={rect} onAdvance={next} />}
      <Coachmark
        step={step}
        stepIndex={stepIndex}
        total={steps.length}
        isLast={isLast}
        rect={rect}
        onNext={next}
      />
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add features/onboarding/OnboardingGuide.tsx
git commit -m "feat: OnboardingGuide 본체 (스포트라이트+말풍선+스크롤잠금)"
```

---

## Task 9: 타깃 부착 + AppShell 통합

**Files:**
- Modify: `features/chart/Toolbar.tsx`, `features/export/ExportButton.tsx`, `features/skin/SkinSidebar.tsx`, `features/AppShell.tsx`

- [ ] **Step 1: SymbolSelect 루트에 data-onboarding**

`features/chart/Toolbar.tsx` — SymbolSelect의 `return (` 바로 아래 루트 div(약 :85):

변경 전:
```tsx
  return (
    <div ref={ref} className="relative">
```
변경 후:
```tsx
  return (
    <div ref={ref} className="relative" data-onboarding="symbol">
```

- [ ] **Step 2: IndicatorMenu 루트에 data-onboarding**

`features/chart/Toolbar.tsx` — IndicatorMenu의 루트 div(약 :130):

변경 전:
```tsx
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded bg-panel-alt px-2.5 py-1.5 text-xs text-text-primary hover:bg-panel-hover"
      >
        <span>지표 추가</span>
```
변경 후:
```tsx
  return (
    <div ref={ref} className="relative" data-onboarding="indicator">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded bg-panel-alt px-2.5 py-1.5 text-xs text-text-primary hover:bg-panel-hover"
      >
        <span>지표 추가</span>
```

- [ ] **Step 3: ExportButton에 data-onboarding**

`features/export/ExportButton.tsx` — `return (` 의 `<button>`(:49):

변경 전:
```tsx
    <button
      onClick={() => void handleExport()}
      disabled={busy || status !== "ready"}
      className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
    >
```
변경 후:
```tsx
    <button
      data-onboarding="export"
      onClick={() => void handleExport()}
      disabled={busy || status !== "ready"}
      className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
    >
```

- [ ] **Step 4: SkinSidebar 펼친 패널에 data-onboarding**

`features/skin/SkinSidebar.tsx` — 펼친 상태의 `<aside>`(:128):

변경 전:
```tsx
  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-panel-border bg-panel transition-[width]">
```
변경 후:
```tsx
  return (
    <aside
      data-onboarding="skin"
      className="flex w-[300px] shrink-0 flex-col border-l border-panel-border bg-panel transition-[width]"
    >
```

- [ ] **Step 5: AppShell에 OnboardingGuide 마운트**

`features/AppShell.tsx`:

import 추가(상단 import 블록):
```tsx
import OnboardingGuide from "@/features/onboarding/OnboardingGuide";
import { ONBOARDING_STEPS } from "@/features/onboarding/steps";
```

`</div>` 닫기 직전(CaptureProvider 안, 최상위 div 안)에 추가:

변경 전:
```tsx
          <SkinSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
          />
        </div>
      </div>
    </CaptureProvider>
```
변경 후:
```tsx
          <SkinSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
          />
        </div>
        <OnboardingGuide steps={ONBOARDING_STEPS} />
      </div>
    </CaptureProvider>
```

- [ ] **Step 6: 타입체크 + 전체 테스트**

Run: `npm run typecheck && npx vitest run`
Expected: 타입 에러 없음, 기존+신규 테스트 모두 PASS.

- [ ] **Step 7: 커밋**

```bash
git add features/chart/Toolbar.tsx features/export/ExportButton.tsx features/skin/SkinSidebar.tsx features/AppShell.tsx
git commit -m "feat: 온보딩 타깃 data-onboarding 부착 + AppShell 통합"
```

---

## Task 10: 수동 검증 (브라우저)

**Files:** 없음(실행 확인만)

- [ ] **Step 1: 개발 서버 실행**

Run: `npm run dev` (별도 터미널/백그라운드)

- [ ] **Step 2: 첫 방문 동작 확인**

브라우저 콘솔에서 `localStorage.removeItem('chartskin:onboarding:seen:v1')` 실행 후 새로고침. 확인:
- [ ] 화면이 어두워지고 **종목 선택** 버튼만 밝게 강조 + 옆에 말풍선.
- [ ] 점 인디케이터 4개 중 1번째 활성, 버튼 "다음".
- [ ] **다음** 클릭 → 지표 메뉴 → 스킨 사이드바(왼쪽에 말풍선) → PNG 버튼 순서로 이동.
- [ ] 마지막 단계 버튼이 "확인"이고 클릭 시 닫힘.
- [ ] 오버레이 빈곳 클릭/강조영역 클릭으로도 다음 단계 진행 및 마지막에 닫힘.
- [ ] 가이드 표시 중 배경 스크롤 잠김(휠/스크롤 안 됨), 닫으면 복구.
- [ ] 창 크기를 바꿔도 스포트라이트/말풍선이 타깃을 따라붙고 말풍선이 화면 밖으로 안 나감.

- [ ] **Step 3: 1회 표시 확인**

새로고침 → 가이드가 **다시 뜨지 않음**(localStorage 기록됨).

- [ ] **Step 4: localStorage 차단 graceful 확인**

DevTools에서 localStorage 차단(또는 시크릿+차단) 후 새로고침 → 콘솔 에러 없이 앱 정상 + 가이드 표시.

---

## Self-Review

**Spec coverage:**
- 반투명 어두운 오버레이 + 구멍 강조 → Task 6 Spotlight ✓
- 옆 말풍선 설명 → Task 7 Coachmark ✓
- 여러 단계 + 점 인디케이터 + 다음/확인 → Task 4 useOnboarding + Task 7 ✓
- 단계별 실제 DOM 측정 → 동적 위치 → Task 5 useTargetRect + Task 2 computeCoachmarkPosition ✓
- 말풍선 화면 밖 보정 → Task 2 clamp ✓
- 닫는 방법(확인/빈곳/강조영역 클릭) → Task 8 OnboardingGuide(onClick=next) + Task 6(onAdvance) ✓
- 배경 스크롤 잠금 → Task 8 useEffect overflow hidden ✓
- localStorage 1회 표시 + try/catch graceful → Task 1 ✓

**Placeholder scan:** 모든 코드 step에 완전한 코드 포함. TODO/TBD 없음. ✓

**Type consistency:** `getSeen/setSeen`(Task1) ↔ Task4 사용 일치. `computeCoachmarkPosition`/`CoachmarkPosition`(Task2) ↔ Task7 사용 일치. `OnboardingStep`/`onboardingSelector`(Task3) ↔ Task8 사용 일치. `useTargetRect(selector, enabled)`(Task5) ↔ Task8 호출 일치. `Spotlight({rect,onAdvance})`(Task6) ↔ Task8 일치. `Coachmark({step,stepIndex,total,isLast,rect,onNext})`(Task7) ↔ Task8 일치. ✓

**테스트 환경 주의:** vitest는 node 환경 + `lib/**/*.test.ts`만 실행. 그래서 순수 로직(Task1·2)만 자동 테스트, React 훅/컴포넌트는 Task10 수동 검증. 이는 기존 프로젝트 테스트 셋업과 일치(`lib/*.test.ts`만 존재).
