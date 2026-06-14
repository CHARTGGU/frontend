import { describe, it, expect } from "vitest";
import type { UTCTimestamp } from "lightweight-charts";
import {
  ema,
  rsi,
  bollinger,
  macd,
  volumeProfile,
  detectCrossesInRange,
  detectPocInRange,
} from "./indicators";
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
    for (const h of out.histogram) {
      expect(Number.isFinite(h.value)).toBe(true);
      expect(h.color).toBe(
        h.value >= 0 ? "rgba(38,166,154,0.6)" : "rgba(239,83,80,0.6)",
      );
    }
  });
});

describe("volumeProfile", () => {
  it("빈 입력이면 빈 배열", () => {
    expect(volumeProfile([], 4)).toEqual([]);
  });

  it("close가 속한 버킷에 volume 합산, 버킷 수만큼 반환", () => {
    const candles: Candle[] = [
      { time: 1 as UTCTimestamp, open: 0, high: 4, low: 0, close: 0.5, volume: 10 },
      { time: 2 as UTCTimestamp, open: 0, high: 4, low: 0, close: 3.5, volume: 20 },
      { time: 3 as UTCTimestamp, open: 0, high: 4, low: 0, close: 0.5, volume: 5 },
    ];
    const out = volumeProfile(candles, 4);
    expect(out).toHaveLength(4);
    expect(out[0].volume).toBe(15);
    expect(out[3].volume).toBe(20);
    expect(out[1].volume).toBe(0);
  });
});

describe("detectCrossesInRange", () => {
  // fast=2, slow=3. closes가 하락→상승→하락 → 골든 1회, 데드 1회.
  const closes = [3, 2, 1, 2, 3, 4, 3, 2, 1];

  it("MA 길이 부족하면 빈 배열", () => {
    expect(detectCrossesInRange(candlesFromCloses([1, 2]), 0, Infinity, 2, 3))
      .toEqual([]);
  });

  it("골든·데드 교차를 시간순으로 감지", () => {
    const out = detectCrossesInRange(
      candlesFromCloses(closes), 0, Infinity, 2, 3,
    );
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ time: 5, type: "golden" });
    expect(out[0].price).toBeCloseTo(2.0, 6); // slow MA값
    expect(out[1]).toMatchObject({ time: 8, type: "dead" });
    expect(out[1].price).toBeCloseTo(3.0, 6);
  });

  it("[from,to] 범위 밖 교차는 제외", () => {
    const out = detectCrossesInRange(
      candlesFromCloses(closes), 6, Infinity, 2, 3,
    );
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe("dead");
  });
});

describe("detectPocInRange", () => {
  const candles: Candle[] = [
    { time: 1 as UTCTimestamp, open: 0, high: 4, low: 0, close: 0.5, volume: 10 },
    { time: 2 as UTCTimestamp, open: 0, high: 4, low: 0, close: 3.5, volume: 50 },
    { time: 3 as UTCTimestamp, open: 0, high: 4, low: 0, close: 0.5, volume: 5 },
  ];

  it("범위 내 캔들 없으면 null", () => {
    expect(detectPocInRange(candles, 100, 200, 4)).toBeNull();
  });

  it("최대 volume 버킷을 POC로, 전체 버킷 반환", () => {
    const out = detectPocInRange(candles, 0, Infinity, 4);
    expect(out).not.toBeNull();
    expect(out!.buckets).toHaveLength(4);
    expect(out!.pocIndex).toBe(3); // close 3.5 버킷에 volume 50
    expect(out!.buckets[out!.pocIndex].volume).toBe(50);
  });
});
