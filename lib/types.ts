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

/** 기간. */
export const INTERVALS = [
  { id: "1m", label: "1m", enabled: true },
  { id: "5m", label: "5m", enabled: true },
  { id: "15m", label: "15m", enabled: true },
  { id: "1h", label: "1h", enabled: true },
  { id: "4h", label: "4h", enabled: true },
  { id: "1d", label: "1D", enabled: true },
] as const;

export type IntervalId = (typeof INTERVALS)[number]["id"];

/** 일봉 미만(분/시간봉) — 시간축에 시각 표시 필요. */
export const INTRADAY_INTERVALS: readonly IntervalId[] = [
  "1m",
  "5m",
  "15m",
  "1h",
  "4h",
];

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
export type IndicatorId = "bb" | "rsi" | "macd" | "volProfile" | "ichimoku";

export const INDICATOR_LABELS: Record<IndicatorId, string> = {
  bb: "볼린저밴드",
  rsi: "RSI",
  macd: "MACD",
  volProfile: "매물대",
  ichimoku: "일목균형표",
};

/** Toolbar 체크박스 대표색. */
export const INDICATOR_DOT: Record<IndicatorId, string> = {
  bb: "#4dabf7",
  rsi: "#cc5de8",
  macd: "#20c997",
  volProfile: "#ffa94d",
  ichimoku: "#ff9f43",
};

/** 일목균형표 색상. */
export const ICHIMOKU_COLORS = {
  /** 전환선 (9) — 빨강 계열. */
  tenkan: "#ef5350",
  /** 기준선 (26) — 파랑. */
  kijun: "#2962ff",
  /** 선행스팬 A 경계선 — 청록. */
  senkouA: "#26a69a",
  /** 선행스팬 B 경계선 — 오렌지. */
  senkouB: "#ff9f43",
  /** 후행스팬 — 보라. */
  chikou: "#9c27b0",
  /** 구름 채우기 — A > B (상승 구름). */
  cloudUp: "rgba(38,166,154,0.18)",
  /** 구름 채우기 — B > A (하락 구름). */
  cloudDown: "rgba(239,83,80,0.18)",
} as const;

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
