import type { UTCTimestamp } from "lightweight-charts";
import type { RawKline } from "./binance";
import type { Candle } from "./types";

/**
 * Binance klines 원본 → 통일 Candle[] 정규화.
 * openTime(ms) → unix seconds 변환. 가격/거래량 문자열 → number.
 * CLAUDE.md 아키텍처 §3: 차트 입력 직전 통일 정규화.
 */
export function fromBinance(raw: RawKline[]): Candle[] {
  return raw.map((k) => ({
    time: Math.floor(k[0] / 1000) as UTCTimestamp,
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  }));
}
