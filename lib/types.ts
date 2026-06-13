import type { UTCTimestamp } from "lightweight-charts";

/**
 * 차트 입력 직전 통일 정규화 포맷.
 * 소스(Binance/KIS/…)마다 캔들 포맷·타임존 다름 → 어댑터로 이 포맷에 맞춤.
 * CLAUDE.md 아키텍처 §3.
 */
export interface Candle {
  time: UTCTimestamp; // unix seconds (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** MVP 종목 — BTC-USDT, ETH-USDT 고정. */
export const SYMBOLS = [
  { id: "BTCUSDT", label: "BTC / USDT", short: "BTC" },
  { id: "ETHUSDT", label: "ETH / USDT", short: "ETH" },
] as const;

export type SymbolId = (typeof SYMBOLS)[number]["id"];

/** 기간 — MVP는 1d만 활성, 나머지는 비활성(준비중). */
export const INTERVALS = [
  { id: "1m", label: "1m", enabled: false },
  { id: "5m", label: "5m", enabled: false },
  { id: "15m", label: "15m", enabled: false },
  { id: "1h", label: "1h", enabled: false },
  { id: "4h", label: "4h", enabled: false },
  { id: "1d", label: "1D", enabled: true },
] as const;

export type IntervalId = (typeof INTERVALS)[number]["id"];

/** MA 기간 (SMA 직접 계산). */
export const MA_PERIODS = [5, 20, 60, 120] as const;
export type MaPeriod = (typeof MA_PERIODS)[number];

/** MA 라인 색상 (기간별 고정). */
export const MA_COLORS: Record<MaPeriod, string> = {
  5: "#f5d76e",
  20: "#e67e22",
  60: "#9b59b6",
  120: "#3498db",
};

export type LoadStatus = "idle" | "loading" | "ready" | "error";

/** 보조지표 ID. */
export type IndicatorId = "bb" | "rsi" | "macd" | "volProfile";

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
/** RSI 30/70 기준선 색상. */
export const RSI_LEVEL_COLOR = "rgba(255,255,255,0.25)";

/** MACD 색상 (히스토그램은 indicators.ts에서 부호별 처리). */
export const MACD_COLORS = {
  macd: "#20c997",
  signal: "#ff922b",
} as const;
