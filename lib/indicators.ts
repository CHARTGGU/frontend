import type { LineData, UTCTimestamp } from "lightweight-charts";
import type { Candle, MaPeriod } from "./types";

/**
 * 단순 이동평균(SMA). lightweight-charts는 지표 0 제공 → 직접 계산.
 * 앞쪽 (period-1)개 구간은 값 없음 → 결과에서 제외 (라인 시작점 자연스럽게).
 */
export function sma(candles: Candle[], period: MaPeriod): LineData[] {
  if (candles.length < period) return [];

  const out: LineData[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) {
      out.push({
        time: candles[i].time,
        value: sum / period,
      });
    }
  }
  return out;
}

export interface PricePoint {
  time: UTCTimestamp;
  price: number;
}

export interface HighLow {
  high: PricePoint;
  low: PricePoint;
}

/**
 * 가시 데이터 내 최고점(high 최대)/최저점(low 최소) 자동 감지.
 * 지표 스킨의 캐릭터 바인딩 포인트로 사용.
 */
export function detectHighLow(candles: Candle[]): HighLow | null {
  if (candles.length === 0) return null;

  let high = candles[0];
  let low = candles[0];
  for (const c of candles) {
    if (c.high > high.high) high = c;
    if (c.low < low.low) low = c;
  }

  return {
    high: { time: high.time, price: high.high },
    low: { time: low.time, price: low.low },
  };
}

/**
 * 가시 시간범위([from, to] 초) 내 캔들만 골라 최고/최저 감지.
 * filter는 새 배열 → mutate 없음. 범위 내 캔들 없으면 null.
 */
export function detectHighLowInRange(
  candles: Candle[],
  from: number,
  to: number,
): HighLow | null {
  const inRange = candles.filter(
    (c) => (c.time as number) >= from && (c.time as number) <= to,
  );
  return detectHighLow(inRange);
}
