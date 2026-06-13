import { describe, it, expect } from "vitest";
import type { UTCTimestamp } from "lightweight-charts";
import { ema, rsi, bollinger, macd } from "./indicators";
import type { Candle } from "./types";

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
    const closes = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08,
      45.89, 46.03, 45.61, 46.28, 46.28,
    ];
    const out = rsi(candlesFromCloses(closes), 14);
    expect(out[0].value).toBeCloseTo(70.46, 1);
  });
});

describe("bollinger", () => {
  it("길이 부족하면 전부 빈 배열", () => {
    const out = bollinger(candlesFromCloses([1, 2]), 3, 2);
    expect(out.middle).toEqual([]);
    expect(out.upper).toEqual([]);
    expect(out.lower).toEqual([]);
  });

  it("middle=SMA, upper/lower = middle ± mult*모집단σ", () => {
    const out = bollinger(candlesFromCloses([2, 4, 6]), 3, 2);
    expect(out.middle).toHaveLength(1);
    expect(out.middle[0].value).toBeCloseTo(4, 6);
    expect(out.upper[0].value).toBeCloseTo(4 + 2 * 1.63299, 4);
    expect(out.lower[0].value).toBeCloseTo(4 - 2 * 1.63299, 4);
  });
});

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
    expect(out.macd).toHaveLength(5);
    expect(out.macd[out.macd.length - 1].value).toBeGreaterThan(0);
    expect(out.histogram).toHaveLength(4);
    const last = out.histogram[out.histogram.length - 1];
    expect(last.color).toBeDefined();
  });
});
