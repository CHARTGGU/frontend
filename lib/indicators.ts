import type { HistogramData, LineData, UTCTimestamp } from "lightweight-charts";
import type { Candle, MaPeriod } from "./types";

const MACD_HIST_UP = "rgba(38,166,154,0.6)";
const MACD_HIST_DOWN = "rgba(239,83,80,0.6)";

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
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);

  const offset = slow - fast;
  const macdLine: LineData[] = [];
  const macdValues: number[] = [];
  for (let i = 0; i < emaSlow.length; i++) {
    const value = emaFast[i + offset] - emaSlow[i];
    macdValues.push(value);
    macdLine.push({ time: candles[slow - 1 + i].time, value });
  }

  const signalValues = ema(macdValues, signalPeriod);
  const signal: LineData[] = [];
  const histogram: HistogramData[] = [];
  const sigOffset = macdValues.length - signalValues.length;
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
    // close가 [min,max] 범위 바깥일 때(보정 데이터 등) 클램프 처리
    if (idx < 0) idx = 0;
    if (idx >= bucketCount) idx = bucketCount - 1;
    buckets[idx] = { ...buckets[idx], volume: buckets[idx].volume + c.volume };
  }
  return buckets;
}
