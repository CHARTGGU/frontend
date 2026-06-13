# 보조지표 추가 (RSI · 볼린저밴드 · MACD · 매물대) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 차트에 RSI·볼린저밴드·MACD·매물대 4종 보조지표를 추가하고 Toolbar 토글로 켜고 끈다.

**Architecture:** 지표 계산은 `lib/indicators.ts`의 순수 함수(직접 구현, lightweight-charts는 지표 0 제공). BB는 price pane 오버레이 LineSeries ×3, RSI/MACD는 별도 pane 시리즈, 매물대는 DOM 가로막대 오버레이. 토글 상태는 zustand `chartStore.activeIndicators`. 전부 기존 MA 동기화 패턴을 복제한다.

**Tech Stack:** Next.js(App Router) · TypeScript · lightweight-charts v5.0.5 · Zustand · Tailwind · Vitest(신규).

---

## 파일 구조

| 파일 | 책임 | 작업 |
|------|------|------|
| `lib/indicators.ts` | 지표 순수 계산 함수 | Modify (ema/rsi/bollinger/macd/volumeProfile 추가) |
| `lib/indicators.test.ts` | 계산 함수 단위 테스트 | Create |
| `lib/types.ts` | 지표 ID·라벨·색상·파라미터 메타 | Modify |
| `stores/chartStore.ts` | `activeIndicators` 토글 상태 | Modify |
| `features/chart/ChartCanvas.tsx` | BB/RSI/MACD 시리즈 동기화 | Modify |
| `features/chart/VolumeProfileOverlay.tsx` | 매물대 DOM 가로막대 | Create |
| `features/chart/ChartView.tsx` | 매물대 오버레이 마운트 | Modify |
| `features/chart/Toolbar.tsx` | 지표 체크박스 토글 UI | Modify |
| `vitest.config.ts`, `package.json` | 테스트 러너 셋업 | Create/Modify |

표준 파라미터(고정): RSI 14 · BB 20/2 · MACD 12/26/9 · 매물대 버킷 24.

---

## Task 0: Vitest 셋업

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: vitest 설치**

Run:
```bash
npm i -D vitest@^2
```
Expected: devDependencies에 vitest 추가, 설치 성공.

- [ ] **Step 2: test 스크립트 추가**

`package.json`의 `scripts`에 한 줄 추가 (기존 줄 보존):
```json
    "test": "vitest run",
```

- [ ] **Step 3: vitest 설정 생성**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
```

- [ ] **Step 4: 러너 동작 확인 (빈 실행)**

Run: `npm test`
Expected: "No test files found" 또는 0 tests — 에러 없이 종료(테스트 파일은 Task 1에서 추가).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: vitest 테스트 러너 셋업"
```

---

## Task 1: EMA + RSI 계산

**Files:**
- Modify: `lib/indicators.ts`
- Test: `lib/indicators.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

Create `lib/indicators.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import type { UTCTimestamp } from "lightweight-charts";
import { ema, rsi } from "./indicators";
import type { Candle } from "./types";

// close 값 배열 → Candle[] (time은 1초 간격, ohlc는 close로 단순화).
function candlesFromCloses(closes: number[]): Candle[] {
  return closes.map((c, i) => ({
    time: (i + 1) as UTCTimestamp,
    open: c,
    high: c,
    low: c,
    close: c,
    volume: 1,
  }));
}

describe("ema", () => {
  it("길이 부족하면 빈 배열", () => {
    expect(ema([1, 2], 3)).toEqual([]);
  });

  it("첫 EMA는 첫 period의 SMA, 이후 EMA 공식", () => {
    // period 3, k = 2/(3+1) = 0.5
    // SMA(2,4,6)=4 → 다음 close 8: 8*0.5 + 4*0.5 = 6
    const out = ema([2, 4, 6, 8], 3);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeCloseTo(4, 6);
    expect(out[1]).toBeCloseTo(6, 6);
  });
});

describe("rsi", () => {
  it("길이 부족하면 빈 배열", () => {
    expect(rsi(candlesFromCloses([1, 2, 3]), 14)).toEqual([]);
  });

  it("전부 상승하면 RSI 100 수렴", () => {
    const out = rsi(candlesFromCloses([1, 2, 3, 4, 5, 6]), 3);
    expect(out[out.length - 1].value).toBeCloseTo(100, 6);
  });

  it("알려진 Wilder 예제값과 일치", () => {
    // 고전 Wilder 14기간 첫 RSI ≈ 70.46 (close 시퀀스 아래).
    const closes = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08,
      45.89, 46.03, 45.61, 46.28, 46.28,
    ];
    const out = rsi(candlesFromCloses(closes), 14);
    expect(out[0].value).toBeCloseTo(70.46, 1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL — "ema is not a function" / "rsi is not a function".

- [ ] **Step 3: 구현 추가**

`lib/indicators.ts` 상단 import에 `HistogramData` 추가하고(아래 Task들에서 사용), 파일 끝에 추가:
```ts
/**
 * 지수이동평균. values 길이 < period면 빈 배열.
 * 첫 값 = 첫 period의 SMA, 이후 EMA = close*k + prev*(1-k), k = 2/(period+1).
 * 반환 길이 = values.length - period + 1.
 */
export function ema(values: number[], period: number): number[] {
  if (values.length < period) return [];

  const k = 2 / (period + 1);
  const out: number[] = [];
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i];
  let prev = seed / period;
  out.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

/**
 * RSI (Wilder smoothing). 0~100. candles.length <= period면 빈 배열.
 * 첫 평균은 단순평균, 이후 Wilder: avg = (avg*(period-1) + cur)/period.
 * 반환 길이 = candles.length - period.
 */
export function rsi(candles: Candle[], period = 14): LineData[] {
  if (candles.length <= period) return [];

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;

  const out: LineData[] = [];
  const push = (i: number) => {
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    const value = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    out.push({ time: candles[i].time, value });
  };
  push(period);

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const curGain = diff > 0 ? diff : 0;
    const curLoss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + curGain) / period;
    avgLoss = (avgLoss * (period - 1) + curLoss) / period;
    push(i);
  }
  return out;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS (ema 2 + rsi 3 테스트).

- [ ] **Step 5: Commit**

```bash
git add lib/indicators.ts lib/indicators.test.ts
git commit -m "feat: RSI·EMA 지표 계산 함수"
```

---

## Task 2: 볼린저밴드 계산

**Files:**
- Modify: `lib/indicators.ts`
- Test: `lib/indicators.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

`lib/indicators.test.ts`에 import 갱신 (`import { ema, rsi, bollinger } from "./indicators";`) 후 describe 추가:
```ts
describe("bollinger", () => {
  it("길이 부족하면 전부 빈 배열", () => {
    const out = bollinger(candlesFromCloses([1, 2]), 3, 2);
    expect(out.middle).toEqual([]);
    expect(out.upper).toEqual([]);
    expect(out.lower).toEqual([]);
  });

  it("middle=SMA, upper/lower = middle ± mult*모집단σ", () => {
    // closes [2,4,6], period 3: mean=4, 모집단분산=((4)+(0)+(4))/3=2.667, σ≈1.633
    const out = bollinger(candlesFromCloses([2, 4, 6]), 3, 2);
    expect(out.middle).toHaveLength(1);
    expect(out.middle[0].value).toBeCloseTo(4, 6);
    expect(out.upper[0].value).toBeCloseTo(4 + 2 * 1.63299, 4);
    expect(out.lower[0].value).toBeCloseTo(4 - 2 * 1.63299, 4);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL — "bollinger is not a function".

- [ ] **Step 3: 구현 추가**

`lib/indicators.ts` 끝에 추가:
```ts
export interface Bollinger {
  upper: LineData[];
  middle: LineData[];
  lower: LineData[];
}

/**
 * 볼린저밴드. middle = SMA(period), upper/lower = middle ± mult*σ.
 * σ = 모집단 표준편차(period 윈도우). candles.length < period면 전부 빈 배열.
 */
export function bollinger(candles: Candle[], period = 20, mult = 2): Bollinger {
  const upper: LineData[] = [];
  const middle: LineData[] = [];
  const lower: LineData[] = [];
  if (candles.length < period) return { upper, middle, lower };

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    const mean = sum / period;

    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = candles[j].close - mean;
      variance += d * d;
    }
    const sd = Math.sqrt(variance / period);

    const time = candles[i].time;
    middle.push({ time, value: mean });
    upper.push({ time, value: mean + mult * sd });
    lower.push({ time, value: mean - mult * sd });
  }
  return { upper, middle, lower };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/indicators.ts lib/indicators.test.ts
git commit -m "feat: 볼린저밴드 계산 함수"
```

---

## Task 3: MACD 계산

**Files:**
- Modify: `lib/indicators.ts`
- Test: `lib/indicators.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

import 갱신 (`bollinger, macd`) 후 describe 추가:
```ts
describe("macd", () => {
  it("길이 부족(< slow)하면 전부 빈 배열", () => {
    const out = macd(candlesFromCloses([1, 2, 3]), 2, 4, 2);
    expect(out.macd).toEqual([]);
    expect(out.signal).toEqual([]);
    expect(out.histogram).toEqual([]);
  });

  it("macd = emaFast - emaSlow (slow 시점부터), histogram = macd - signal", () => {
    const closes = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = macd(candlesFromCloses(closes), 2, 4, 2);
    // macd 길이 = closes.length - slow + 1 = 5
    expect(out.macd).toHaveLength(5);
    // 단조 상승 → macd 양수
    expect(out.macd[out.macd.length - 1].value).toBeGreaterThan(0);
    // histogram 길이 = macd 길이 - signalPeriod + 1 = 5 - 2 + 1 = 4
    expect(out.histogram).toHaveLength(4);
    // histogram 색상 부호별
    const last = out.histogram[out.histogram.length - 1];
    expect(last.color).toBeDefined();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL — "macd is not a function".

- [ ] **Step 3: 구현 추가**

`lib/indicators.ts` 상단 색상 상수 + 끝에 함수 추가. 먼저 파일 상단(import 아래)에 추가:
```ts
const MACD_HIST_UP = "rgba(38,166,154,0.6)";
const MACD_HIST_DOWN = "rgba(239,83,80,0.6)";
```
파일 끝에 추가:
```ts
export interface Macd {
  macd: LineData[];
  signal: LineData[];
  histogram: HistogramData[];
}

/**
 * MACD = EMA(fast) - EMA(slow). signal = EMA(macd, signalPeriod).
 * histogram = macd - signal (색상 부호별). 길이 < slow면 전부 빈 배열.
 * EMA 시작점이 달라 fast를 slow 시작점에 정렬한 뒤 차를 구한다.
 */
export function macd(
  candles: Candle[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): Macd {
  const empty: Macd = { macd: [], signal: [], histogram: [] };
  if (candles.length < slow) return empty;

  const closes = candles.map((c) => c.close);
  const emaFast = ema(closes, fast); // 길이 = n - fast + 1
  const emaSlow = ema(closes, slow); // 길이 = n - slow + 1

  // slow 기준 정렬: emaFast를 (slow-fast)만큼 잘라 emaSlow와 인덱스 맞춤.
  const offset = slow - fast;
  const macdLine: LineData[] = [];
  const macdValues: number[] = [];
  for (let i = 0; i < emaSlow.length; i++) {
    const value = emaFast[i + offset] - emaSlow[i];
    macdValues.push(value);
    // emaSlow[i]는 캔들 인덱스 (slow - 1 + i)에 대응.
    macdLine.push({ time: candles[slow - 1 + i].time, value });
  }

  const signalValues = ema(macdValues, signalPeriod); // 길이 = macd - signalPeriod + 1
  const signal: LineData[] = [];
  const histogram: HistogramData[] = [];
  const sigOffset = macdValues.length - signalValues.length; // signalPeriod - 1
  for (let i = 0; i < signalValues.length; i++) {
    const time = macdLine[i + sigOffset].time;
    signal.push({ time, value: signalValues[i] });
    const hist = macdValues[i + sigOffset] - signalValues[i];
    histogram.push({
      time,
      value: hist,
      color: hist >= 0 ? MACD_HIST_UP : MACD_HIST_DOWN,
    });
  }

  return { macd: macdLine, signal, histogram };
}
```

상단 import 줄을 다음으로 교체(타입 추가):
```ts
import type { HistogramData, LineData, UTCTimestamp } from "lightweight-charts";
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/indicators.ts lib/indicators.test.ts
git commit -m "feat: MACD 계산 함수"
```

---

## Task 4: 매물대(Volume Profile) 계산

**Files:**
- Modify: `lib/indicators.ts`
- Test: `lib/indicators.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

import 갱신 (`macd, volumeProfile`) 후 describe 추가:
```ts
describe("volumeProfile", () => {
  it("빈 입력이면 빈 배열", () => {
    expect(volumeProfile([], 4)).toEqual([]);
  });

  it("close가 속한 버킷에 volume 합산, 버킷 수만큼 반환", () => {
    // 가격범위 0~4, 버킷 4개 → 폭 1. close=0.5→버킷0, 3.5→버킷3.
    const candles: Candle[] = [
      { time: 1 as UTCTimestamp, open: 0, high: 4, low: 0, close: 0.5, volume: 10 },
      { time: 2 as UTCTimestamp, open: 0, high: 4, low: 0, close: 3.5, volume: 20 },
      { time: 3 as UTCTimestamp, open: 0, high: 4, low: 0, close: 0.5, volume: 5 },
    ];
    const out = volumeProfile(candles, 4);
    expect(out).toHaveLength(4);
    expect(out[0].volume).toBe(15); // 10 + 5
    expect(out[3].volume).toBe(20);
    expect(out[1].volume).toBe(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL — "volumeProfile is not a function".

- [ ] **Step 3: 구현 추가**

`lib/indicators.ts` 끝에 추가:
```ts
export interface VolumeBucket {
  priceLow: number;
  priceHigh: number;
  volume: number;
}

/**
 * 매물대. [min(low), max(high)] 구간을 bucketCount 등분, 각 캔들 volume을
 * close가 속한 버킷에 합산. 입력은 가시범위 캔들(호출부에서 필터).
 * 빈 입력이나 범위 0이면 빈 배열.
 */
export function volumeProfile(
  candles: Candle[],
  bucketCount = 24,
): VolumeBucket[] {
  if (candles.length === 0 || bucketCount <= 0) return [];

  let min = candles[0].low;
  let max = candles[0].high;
  for (const c of candles) {
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }
  const span = max - min;
  if (span <= 0) return [];

  const width = span / bucketCount;
  const buckets: VolumeBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    priceLow: min + i * width,
    priceHigh: min + (i + 1) * width,
    volume: 0,
  }));

  for (const c of candles) {
    let idx = Math.floor((c.close - min) / width);
    if (idx < 0) idx = 0;
    if (idx >= bucketCount) idx = bucketCount - 1;
    buckets[idx] = { ...buckets[idx], volume: buckets[idx].volume + c.volume };
  }
  return buckets;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS (전체 지표 테스트 통과).

- [ ] **Step 5: Commit**

```bash
git add lib/indicators.ts lib/indicators.test.ts
git commit -m "feat: 매물대(Volume Profile) 계산 함수"
```

---

## Task 5: 지표 메타 (types.ts)

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: 메타 추가**

`lib/types.ts` 끝(`LoadStatus` 줄 아래)에 추가:
```ts
/** 보조지표 ID. */
export type IndicatorId = "bb" | "rsi" | "macd" | "volProfile";

/** price pane에 오버레이되는 지표(시리즈). */
export const OVERLAY_INDICATORS = ["bb"] as const;
/** 별도 pane에 그리는 지표. */
export const PANE_INDICATORS = ["rsi", "macd"] as const;
/** DOM 오버레이 지표. */
export const DOM_INDICATORS = ["volProfile"] as const;

export const INDICATOR_LABELS: Record<IndicatorId, string> = {
  bb: "볼린저밴드",
  rsi: "RSI",
  macd: "MACD",
  volProfile: "매물대",
};

/** Toolbar 체크박스 대표색. */
export const INDICATOR_DOT: Record<IndicatorId, string> = {
  bb: "#4dabf7",
  rsi: "#cc5de8",
  macd: "#20c997",
  volProfile: "#ffa94d",
};

/** 고정 표준 파라미터. */
export const RSI_PERIOD = 14;
export const RSI_LEVELS = [30, 70] as const;
export const BB_PERIOD = 20;
export const BB_MULT = 2;
export const MACD_FAST = 12;
export const MACD_SLOW = 26;
export const MACD_SIGNAL = 9;
export const VOL_PROFILE_BUCKETS = 24;

/** BB 3선 색상. */
export const BB_COLORS = {
  upper: "#4dabf7",
  middle: "rgba(77,171,247,0.5)",
  lower: "#4dabf7",
} as const;

/** RSI 라인 색상. */
export const RSI_COLOR = "#cc5de8";

/** MACD 색상 (히스토그램은 indicators.ts에서 부호별 처리). */
export const MACD_COLORS = {
  macd: "#20c997",
  signal: "#ff922b",
} as const;
```

- [ ] **Step 2: 타입 체크**

Run: `npm run typecheck`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: 보조지표 메타·색상·파라미터 상수"
```

---

## Task 6: chartStore 토글 상태

**Files:**
- Modify: `stores/chartStore.ts`

- [ ] **Step 1: import + 상태 타입 추가**

`stores/chartStore.ts` 상단 types import에 `IndicatorId` 추가:
```ts
import type {
  Candle,
  IndicatorId,
  IntervalId,
  LoadStatus,
  MaPeriod,
  SymbolId,
} from "@/lib/types";
```

`ChartState` 인터페이스에 `activeMa` 아래 추가:
```ts
  /** 활성화된 보조지표 (기본 전부 off). */
  activeIndicators: IndicatorId[];
```
그리고 `toggleMa` 시그니처 아래 추가:
```ts
  toggleIndicator: (id: IndicatorId) => void;
```

- [ ] **Step 2: 초기값 + 액션 구현**

`activeMa: [...MA_PERIODS],` 아래에 추가:
```ts
  activeIndicators: [],
```
`toggleMa` 구현 블록 아래에 추가 (불변 업데이트):
```ts
  toggleIndicator: (id) =>
    set((s) => ({
      activeIndicators: s.activeIndicators.includes(id)
        ? s.activeIndicators.filter((x) => x !== id)
        : [...s.activeIndicators, id],
    })),
```

- [ ] **Step 3: 타입 체크**

Run: `npm run typecheck`
Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add stores/chartStore.ts
git commit -m "feat: chartStore 보조지표 토글 상태"
```

---

## Task 7: ChartCanvas — 볼린저밴드 시리즈 동기화

**Files:**
- Modify: `features/chart/ChartCanvas.tsx`

- [ ] **Step 1: import + ref 추가**

상단 import에서 `lib/indicators`·`lib/types`·`lightweight-charts` 갱신:
```ts
import { bollinger, macd, rsi, sma } from "@/lib/indicators";
import {
  BB_COLORS,
  BB_MULT,
  BB_PERIOD,
  MA_COLORS,
  MACD_COLORS,
  MACD_FAST,
  MACD_SIGNAL,
  MACD_SLOW,
  RSI_COLOR,
  RSI_LEVELS,
  RSI_PERIOD,
  type MaPeriod,
} from "@/lib/types";
```
(`lightweight-charts` import에 이미 `LineSeries`, `HistogramSeries`, `LineStyle`, `IPriceLine`은 없으니 `IPriceLine` 추가.)

```ts
import {
  CandlestickSeries,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type LogicalRange,
} from "lightweight-charts";
```

컴포넌트 본문 ref 선언부(`maSeriesRef` 아래)에 추가:
```ts
  // 볼린저밴드 3선 (price pane). 활성 시 생성, 해제 시 제거.
  const bbRef = useRef<{
    upper: ISeriesApi<"Line">;
    middle: ISeriesApi<"Line">;
    lower: ISeriesApi<"Line">;
  } | null>(null);
```

store 구독부(`const interval = ...` 아래)에 추가:
```ts
  const activeIndicators = useChartStore((s) => s.activeIndicators);
```

- [ ] **Step 2: BB 동기화 effect 추가**

MA effect(`}, [candles, activeMa]);` 블록) 아래에 추가:
```ts
  // 볼린저밴드 (price pane 오버레이) 동기화.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const on = activeIndicators.includes("bb");
    if (!on) {
      if (bbRef.current) {
        chart.removeSeries(bbRef.current.upper);
        chart.removeSeries(bbRef.current.middle);
        chart.removeSeries(bbRef.current.lower);
        bbRef.current = null;
      }
      return;
    }

    if (!bbRef.current) {
      const lineOpts = {
        lineWidth: 1 as const,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      };
      bbRef.current = {
        upper: chart.addSeries(LineSeries, { ...lineOpts, color: BB_COLORS.upper }),
        middle: chart.addSeries(LineSeries, {
          ...lineOpts,
          color: BB_COLORS.middle,
          lineStyle: LineStyle.Dashed,
        }),
        lower: chart.addSeries(LineSeries, { ...lineOpts, color: BB_COLORS.lower }),
      };
    }

    const bands = bollinger(candles, BB_PERIOD, BB_MULT);
    bbRef.current.upper.setData(bands.upper);
    bbRef.current.middle.setData(bands.middle);
    bbRef.current.lower.setData(bands.lower);
  }, [candles, activeIndicators]);
```

- [ ] **Step 3: 언마운트 정리에 ref 클리어**

마운트 effect의 cleanup(`maSeriesRef.current.clear();` 아래)에 추가:
```ts
      bbRef.current = null;
```
(chart.remove()가 시리즈를 모두 파기하므로 removeSeries 불필요, ref만 초기화.)

- [ ] **Step 4: 타입 체크 + 수동 확인**

Run: `npm run typecheck`
Expected: 에러 없음.
(렌더 확인은 Task 11에서 토글 UI 연결 후 일괄.)

- [ ] **Step 5: Commit**

```bash
git add features/chart/ChartCanvas.tsx
git commit -m "feat: 볼린저밴드 시리즈 동기화"
```

---

## Task 8: ChartCanvas — RSI 별도 pane

**Files:**
- Modify: `features/chart/ChartCanvas.tsx`

- [ ] **Step 1: ref 추가**

`bbRef` 아래에 추가:
```ts
  // RSI (별도 pane). 시리즈 + 30/70 기준선.
  const rsiRef = useRef<{
    series: ISeriesApi<"Line">;
    lines: IPriceLine[];
  } | null>(null);
```

- [ ] **Step 2: RSI 동기화 effect 추가**

BB effect 아래에 추가:
```ts
  // RSI (별도 pane) 동기화.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const on = activeIndicators.includes("rsi");
    if (!on) {
      if (rsiRef.current) {
        chart.removeSeries(rsiRef.current.series);
        rsiRef.current = null;
      }
      return;
    }

    if (!rsiRef.current) {
      // 다음 빈 pane 인덱스 = 현재 pane 수 (volume=1 이후 append).
      const paneIndex = chart.panes().length;
      const series = chart.addSeries(
        LineSeries,
        {
          color: RSI_COLOR,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        },
        paneIndex,
      );
      const lines = RSI_LEVELS.map((level) =>
        series.createPriceLine({
          price: level,
          color: "rgba(255,255,255,0.25)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: String(level),
        }),
      );
      chart.panes()[paneIndex]?.setHeight(100);
      rsiRef.current = { series, lines };
    }

    rsiRef.current.series.setData(rsi(candles, RSI_PERIOD));
  }, [candles, activeIndicators]);
```

- [ ] **Step 3: 언마운트 정리에 ref 클리어**

cleanup의 `bbRef.current = null;` 아래에 추가:
```ts
      rsiRef.current = null;
```

- [ ] **Step 4: 타입 체크**

Run: `npm run typecheck`
Expected: 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add features/chart/ChartCanvas.tsx
git commit -m "feat: RSI 별도 pane 시리즈"
```

---

## Task 9: ChartCanvas — MACD 별도 pane

**Files:**
- Modify: `features/chart/ChartCanvas.tsx`

- [ ] **Step 1: ref 추가**

`rsiRef` 아래에 추가:
```ts
  // MACD (별도 pane). macd·signal 라인 + histogram.
  const macdRef = useRef<{
    macd: ISeriesApi<"Line">;
    signal: ISeriesApi<"Line">;
    hist: ISeriesApi<"Histogram">;
  } | null>(null);
```

- [ ] **Step 2: MACD 동기화 effect 추가**

RSI effect 아래에 추가:
```ts
  // MACD (별도 pane) 동기화.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const on = activeIndicators.includes("macd");
    if (!on) {
      if (macdRef.current) {
        chart.removeSeries(macdRef.current.macd);
        chart.removeSeries(macdRef.current.signal);
        chart.removeSeries(macdRef.current.hist);
        macdRef.current = null;
      }
      return;
    }

    if (!macdRef.current) {
      const paneIndex = chart.panes().length;
      const hist = chart.addSeries(
        HistogramSeries,
        { priceLineVisible: false, lastValueVisible: false },
        paneIndex,
      );
      const macdLine = chart.addSeries(
        LineSeries,
        {
          color: MACD_COLORS.macd,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        },
        paneIndex,
      );
      const signalLine = chart.addSeries(
        LineSeries,
        {
          color: MACD_COLORS.signal,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        },
        paneIndex,
      );
      chart.panes()[paneIndex]?.setHeight(100);
      macdRef.current = { macd: macdLine, signal: signalLine, hist };
    }

    const result = macd(candles, MACD_FAST, MACD_SLOW, MACD_SIGNAL);
    macdRef.current.hist.setData(result.histogram);
    macdRef.current.macd.setData(result.macd);
    macdRef.current.signal.setData(result.signal);
  }, [candles, activeIndicators]);
```

- [ ] **Step 3: 언마운트 정리에 ref 클리어**

cleanup의 `rsiRef.current = null;` 아래에 추가:
```ts
      macdRef.current = null;
```

- [ ] **Step 4: 타입 체크**

Run: `npm run typecheck`
Expected: 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add features/chart/ChartCanvas.tsx
git commit -m "feat: MACD 별도 pane 시리즈"
```

---

## Task 10: 매물대 DOM 오버레이

**Files:**
- Create: `features/chart/VolumeProfileOverlay.tsx`
- Modify: `features/chart/ChartView.tsx`

- [ ] **Step 1: 오버레이 컴포넌트 생성**

Create `features/chart/VolumeProfileOverlay.tsx`:
```tsx
"use client";

import { volumeProfile } from "@/lib/indicators";
import { VOL_PROFILE_BUCKETS } from "@/lib/types";
import { useChartStore } from "@/stores/chartStore";
import { useChartOverlay } from "./useChartOverlay";
import { useChartRefs } from "./ChartRefContext";

/** 막대 최대 폭(px). */
const MAX_BAR_WIDTH = 120;

/**
 * 매물대 = 가시범위 캔들의 가격버킷별 거래량 → 우측 가로막대.
 * DOM 오버레이(CLAUDE.md §5). 스크롤·줌 시 useChartOverlay rAF로 재배치.
 */
export default function VolumeProfileOverlay() {
  const active = useChartStore((s) => s.activeIndicators);
  const candles = useChartStore((s) => s.candles);
  const { toCoord, ready } = useChartOverlay();
  const { chart, candleSeries } = useChartRefs();

  if (!active.includes("volProfile") || !ready || !chart || !candleSeries) {
    return null;
  }

  const visibleRange = chart.timeScale().getVisibleRange();
  if (!visibleRange) return null;

  const from = visibleRange.from as number;
  const to = visibleRange.to as number;
  const visible = candles.filter(
    (c) => (c.time as number) >= from && (c.time as number) <= to,
  );
  const buckets = volumeProfile(visible, VOL_PROFILE_BUCKETS);
  if (buckets.length === 0) return null;

  const maxVol = buckets.reduce((m, b) => (b.volume > m ? b.volume : m), 0);
  if (maxVol <= 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {buckets.map((b, i) => {
        const yTop = candleSeries.priceToCoordinate(b.priceHigh);
        const yBottom = candleSeries.priceToCoordinate(b.priceLow);
        if (yTop === null || yBottom === null) return null;

        const height = Math.max(1, yBottom - yTop - 1);
        const width = (b.volume / maxVol) * MAX_BAR_WIDTH;
        if (width < 1) return null;

        return (
          <div
            key={i}
            className="absolute rounded-sm bg-[rgba(255,169,77,0.35)]"
            style={{
              right: 8,
              top: yTop,
              height,
              width,
            }}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: ChartView에 마운트**

`features/chart/ChartView.tsx`의 import에 추가:
```ts
import VolumeProfileOverlay from "./VolumeProfileOverlay";
```
`<IndicatorOverlay />` 아래에 추가:
```tsx
          <VolumeProfileOverlay />
```

- [ ] **Step 3: 타입 체크**

Run: `npm run typecheck`
Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add features/chart/VolumeProfileOverlay.tsx features/chart/ChartView.tsx
git commit -m "feat: 매물대 DOM 오버레이"
```

---

## Task 11: Toolbar — 지표 토글 UI

**Files:**
- Modify: `features/chart/Toolbar.tsx`

- [ ] **Step 1: import 교체 + store 구독**

상단 import에서 types 갱신:
```ts
import {
  INDICATOR_DOT,
  INDICATOR_LABELS,
  INTERVALS,
  MA_COLORS,
  MA_PERIODS,
  SYMBOLS,
  type IndicatorId,
  type SymbolId,
} from "@/lib/types";
```
`SOON_INDICATORS` 상수(13~15줄) 삭제하고 대체:
```ts
/** 토글 가능한 보조지표 목록. */
const INDICATOR_IDS: IndicatorId[] = ["bb", "rsi", "macd", "volProfile"];
```

`Toolbar` 함수 본문 store 구독부에 추가:
```ts
  const activeIndicators = useChartStore((s) => s.activeIndicators);
  const toggleIndicator = useChartStore((s) => s.toggleIndicator);
```

- [ ] **Step 2: IndicatorMenu에 prop 전달**

`<IndicatorMenu activeMa={activeMa} onToggleMa={toggleMa} />`를 교체:
```tsx
      <IndicatorMenu
        activeMa={activeMa}
        onToggleMa={toggleMa}
        activeIndicators={activeIndicators}
        onToggleIndicator={toggleIndicator}
      />
```

- [ ] **Step 3: IndicatorMenu 시그니처·렌더 교체**

`IndicatorMenu` 함수의 props와 "준비중" 블록을 교체. 함수 시그니처:
```tsx
function IndicatorMenu({
  activeMa,
  onToggleMa,
  activeIndicators,
  onToggleIndicator,
}: {
  activeMa: number[];
  onToggleMa: (p: (typeof MA_PERIODS)[number]) => void;
  activeIndicators: IndicatorId[];
  onToggleIndicator: (id: IndicatorId) => void;
}) {
```
그리고 기존 "오실레이터 (준비중)" 블록(`<div className="my-1 border-t ...` 부터 `SOON_INDICATORS.map(...)` 닫는 부분까지)을 교체:
```tsx
          <div className="my-1 border-t border-panel-border" />
          <p className="px-2 py-1 text-[10px] font-bold uppercase text-text-muted">
            보조지표
          </p>
          {INDICATOR_IDS.map((id) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-text-primary hover:bg-panel-hover"
            >
              <input
                type="checkbox"
                checked={activeIndicators.includes(id)}
                onChange={() => onToggleIndicator(id)}
                className="accent-accent"
              />
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: INDICATOR_DOT[id] }}
              />
              <span>{INDICATOR_LABELS[id]}</span>
            </label>
          ))}
```

- [ ] **Step 4: 타입 체크 + lint**

Run: `npm run typecheck && npm run lint`
Expected: 에러 없음. (`SOON_INDICATORS` 미사용 제거 확인.)

- [ ] **Step 5: Commit**

```bash
git add features/chart/Toolbar.tsx
git commit -m "feat: Toolbar 보조지표 토글 UI"
```

---

## Task 12: 통합 수동 검증

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 전체 테스트 + 빌드**

Run: `npm test && npm run typecheck && npm run build`
Expected: 테스트 PASS, 타입 OK, 빌드 성공.

- [ ] **Step 2: dev 서버 수동 확인**

Run: `npm run dev` → 브라우저 접속.
체크리스트:
- 지표 추가 메뉴에 볼린저밴드/RSI/MACD/매물대 노출.
- 볼린저밴드 토글 → price pane에 3선(상·중·하). 해제 시 사라짐.
- RSI 토글 → 하단 새 pane, 라인 + 30/70 점선. 해제 시 pane 제거.
- MACD 토글 → 하단 새 pane, macd/signal 라인 + 히스토그램(부호별 색). 해제 시 제거.
- 매물대 토글 → 차트 우측 가로막대. 스크롤·줌 시 재계산되어 따라붙음.
- RSI+MACD 동시 토글 → pane 2개 정상 스택. 끄는 순서 무관하게 정리.
- PNG 내보내기 → 매물대 막대 포함 캡처 확인(html-to-image).

- [ ] **Step 3: console.log 잔존 확인**

Run: `git grep -n "console.log" lib features stores`
Expected: 신규 코드에 없음.

- [ ] **Step 4: 최종 커밋 (필요 시)**

검증 중 수정 발생하면 커밋. 없으면 생략.

---

## Self-Review 메모

- **Spec 커버리지**: RSI·BB·MACD·매물대 4종 전부 계산(Task1~4)+렌더(Task7~10)+토글(Task6,11) 매핑됨. 고정 파라미터(Task5), liveBar 미반영(effect 의존성 `candles`만, `liveBar` 제외) 준수.
- **리스크 검증**: v5 동적 pane = `addSeries(type, opts, paneIndex)`로 자동 생성 확인됨(typings). 매물대 DOM = 기존 IndicatorOverlay 패턴 그대로라 PNG 합성 OK.
- **타입 일관성**: `IndicatorId` 단일 정의(types.ts), 모든 소비처 동일 import. `toggleIndicator`·`activeIndicators` 명칭 store/Toolbar 일치.
- **주의**: RSI/MACD pane 제거 시 lightweight-charts가 빈 pane 자동 정리하는지 수동 확인(Task12). 안 되면 `chart.removePane(index)` 명시 호출로 보강 — 단, 인덱스 시프트 주의(두 지표 동시 활성 시 높은 인덱스부터 제거).
