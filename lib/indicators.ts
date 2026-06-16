import type { HistogramData, LineData, UTCTimestamp } from "lightweight-charts";
import type { Candle } from "./types";

const MACD_HIST_UP = "rgba(38,166,154,0.6)";
const MACD_HIST_DOWN = "rgba(239,83,80,0.6)";

/**
 * 단순 이동평균(SMA). lightweight-charts는 지표 0 제공 → 직접 계산.
 * 앞쪽 (period-1)개 구간은 값 없음 → 결과에서 제외 (라인 시작점 자연스럽게).
 */
export function sma(candles: Candle[], period: number): LineData[] {
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

export type CrossType = "golden" | "dead";

export interface Cross {
  time: UTCTimestamp;
  /** 교차 지점 가격 (slow MA값 — fast≈slow 이므로 마커 배치 기준으로 충분). */
  price: number;
  type: CrossType;
}

/**
 * fast/slow SMA 교차점 감지 (골든=fast가 slow 위로, 데드=아래로).
 * 두 MA가 모두 존재하는 시간만 비교. diff 부호가 마지막 비0 부호와 바뀌는 시점이 교차.
 * diff===0(접점)은 부호 미확정 → 다음 비0까지 보류. [from,to](초) 범위 필터.
 */
export function detectCrossesInRange(
  candles: Candle[],
  from: number,
  to: number,
  fast = 20,
  slow = 60,
): Cross[] {
  const fastMa = sma(candles, fast);
  const slowMa = sma(candles, slow);
  if (fastMa.length === 0 || slowMa.length === 0) return [];

  const fastByTime = new Map<number, number>();
  for (const p of fastMa) fastByTime.set(p.time as number, p.value);

  const crosses: Cross[] = [];
  let prevSign = 0;
  for (const sp of slowMa) {
    const t = sp.time as number;
    const fv = fastByTime.get(t);
    if (fv === undefined) continue;

    const diff = fv - sp.value;
    if (diff === 0) continue;
    const sign = diff > 0 ? 1 : -1;

    if (prevSign !== 0 && sign !== prevSign) {
      if (t >= from && t <= to) {
        crosses.push({
          time: sp.time as UTCTimestamp,
          price: sp.value,
          type: sign > 0 ? "golden" : "dead",
        });
      }
    }
    prevSign = sign;
  }
  return crosses;
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

export interface PocResult {
  /** 전체 버킷 (벽돌 렌더가 전 구간 필요). */
  buckets: VolumeBucket[];
  /** 최대 volume 버킷 인덱스 (POC = Point of Control). */
  pocIndex: number;
}

/**
 * 가시 시간범위([from,to] 초) 캔들 → volumeProfile 재활용 → 전체 버킷 + POC 인덱스.
 * 범위 내 캔들 없거나 버킷 생성 실패 시 null.
 */
export function detectPocInRange(
  candles: Candle[],
  from: number,
  to: number,
  bucketCount = 24,
): PocResult | null {
  const inRange = candles.filter(
    (c) => (c.time as number) >= from && (c.time as number) <= to,
  );
  const buckets = volumeProfile(inRange, bucketCount);
  if (buckets.length === 0) return null;

  let pocIndex = 0;
  for (let i = 1; i < buckets.length; i++) {
    if (buckets[i].volume > buckets[pocIndex].volume) pocIndex = i;
  }
  return { buckets, pocIndex };
}

// ── 일목균형표 ────────────────────────────────────────────

/**
 * [period] 기간의 고가·저가 중간값 ((high + low) / 2).
 * idx < period - 1 이면 데이터 부족 → null.
 */
function periodMid(candles: Candle[], period: number, idx: number): number | null {
  if (idx < period - 1) return null;
  let hi = candles[idx - period + 1].high;
  let lo = candles[idx - period + 1].low;
  for (let j = idx - period + 2; j <= idx; j++) {
    if (candles[j].high > hi) hi = candles[j].high;
    if (candles[j].low < lo) lo = candles[j].low;
  }
  return (hi + lo) / 2;
}

export interface IchimokuResult {
  /** 전환선 (9기간 중간값). */
  tenkan: LineData[];
  /** 기준선 (26기간 중간값). */
  kijun: LineData[];
  /** 선행스팬 A — (전환+기준)/2 를 +displacement 캔들 앞에 표시. */
  senkouA: LineData[];
  /** 선행스팬 B — 52기간 중간값을 +displacement 캔들 앞에 표시. 구름 경계. */
  senkouB: LineData[];
  /** 후행스팬 — 현재 종가를 -displacement 캔들 뒤에 표시. */
  chikou: LineData[];
}

/**
 * 일목균형표 5선 계산.
 * - 선행스팬 A/B: 캔들 배열의 미래 인덱스(candles[i+displacement]) 타임스탬프 사용.
 * - 후행스팬: 과거 인덱스(candles[i-displacement]) 타임스탬프 사용.
 * candles는 시간순 정렬 가정. 반환 배열은 모두 시간순.
 */
export function ichimoku(
  candles: Candle[],
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouBPeriod = 52,
  displacement = 26,
): IchimokuResult {
  const n = candles.length;
  const tenkan: LineData[] = [];
  const kijun: LineData[] = [];
  const senkouA: LineData[] = [];
  const senkouB: LineData[] = [];
  const chikou: LineData[] = [];

  for (let i = 0; i < n; i++) {
    const t = periodMid(candles, tenkanPeriod, i);
    const k = periodMid(candles, kijunPeriod, i);

    if (t !== null) tenkan.push({ time: candles[i].time, value: t });
    if (k !== null) kijun.push({ time: candles[i].time, value: k });

    // 선행스팬: +displacement 위치 타임스탬프에 그림 (미래 캔들이 있을 때만).
    const fwd = i + displacement;
    if (fwd < n) {
      if (t !== null && k !== null) {
        senkouA.push({ time: candles[fwd].time, value: (t + k) / 2 });
      }
      const sb = periodMid(candles, senkouBPeriod, i);
      if (sb !== null) {
        senkouB.push({ time: candles[fwd].time, value: sb });
      }
    }

    // 후행스팬: -displacement 위치 타임스탬프에 현재 종가를 그림.
    const bwd = i - displacement;
    if (bwd >= 0) {
      chikou.push({ time: candles[bwd].time, value: candles[i].close });
    }
  }

  return { tenkan, kijun, senkouA, senkouB, chikou };
}
