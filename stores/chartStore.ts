import type { UTCTimestamp } from "lightweight-charts";
import { create } from "zustand";
import { fromBinance } from "@/lib/adapters";
import { fetchKlines, type RealtimeBar } from "@/lib/binance";
import type {
  Candle,
  IndicatorId,
  IntervalId,
  LoadStatus,
  MaPeriod,
  SymbolId,
} from "@/lib/types";
import { MA_PERIODS } from "@/lib/types";

interface ChartState {
  symbol: SymbolId;
  interval: IntervalId;
  candles: Candle[];
  status: LoadStatus;
  error: string | null;
  /** 활성화된 MA 기간 집합 (기본 전체 on). */
  activeMa: MaPeriod[];
  /** 활성화된 보조지표 (기본 전부 off). */
  activeIndicators: IndicatorId[];
  /** fresh 로드(초기·심볼·기간 변경) 카운터 — 차트 fitContent 트리거. */
  dataEpoch: number;
  /** 과거 페이징 중복 호출 방지. */
  loadingMore: boolean;
  /** 더 불러올 과거 데이터 존재 여부. */
  hasMore: boolean;
  /** 실시간 진행 캔들 (WS) — 차트 series.update 전용. candles와 분리. */
  liveBar: Candle | null;

  setSymbol: (symbol: SymbolId) => void;
  setInterval: (interval: IntervalId) => void;
  toggleMa: (period: MaPeriod) => void;
  toggleIndicator: (id: IndicatorId) => void;
  loadCandles: () => Promise<void>;
  loadOlder: () => Promise<void>;
  applyRealtimeBar: (bar: RealtimeBar) => void;
}

let activeController: AbortController | null = null;

export const useChartStore = create<ChartState>((set, get) => ({
  symbol: "BTCUSDT",
  interval: "1d",
  candles: [],
  status: "idle",
  error: null,
  activeMa: [...MA_PERIODS],
  activeIndicators: [],
  dataEpoch: 0,
  loadingMore: false,
  hasMore: true,
  liveBar: null,

  setSymbol: (symbol) => {
    if (symbol === get().symbol) return;
    set({ symbol });
    void get().loadCandles();
  },

  setInterval: (interval) => {
    if (interval === get().interval) return;
    set({ interval });
    void get().loadCandles();
  },

  toggleMa: (period) =>
    set((s) => ({
      activeMa: s.activeMa.includes(period)
        ? s.activeMa.filter((p) => p !== period)
        : [...s.activeMa, period].sort((a, b) => a - b),
    })),

  toggleIndicator: (id) =>
    set((s) => ({
      activeIndicators: s.activeIndicators.includes(id)
        ? s.activeIndicators.filter((x) => x !== id)
        : [...s.activeIndicators, id],
    })),

  loadCandles: async () => {
    // 직전 요청 취소 (종목/기간 빠른 전환 대비).
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;

    const { symbol, interval } = get();
    set({ status: "loading", error: null });

    try {
      const raw = await fetchKlines({ symbol, interval, signal: controller.signal });
      if (controller.signal.aborted) return;
      set((s) => ({
        candles: fromBinance(raw),
        status: "ready",
        error: null,
        dataEpoch: s.dataEpoch + 1,
        hasMore: true,
        loadingMore: false,
        liveBar: null,
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const message =
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      set({ status: "error", error: message });
    }
  },

  loadOlder: async () => {
    const { candles, loadingMore, hasMore, symbol, interval } = get();
    if (loadingMore || !hasMore || candles.length === 0) return;

    set({ loadingMore: true });
    try {
      // 현재 가장 오래된 캔들 직전까지 조회.
      const endTime = (candles[0].time as number) * 1000 - 1;
      const raw = await fetchKlines({ symbol, interval, limit: 300, endTime });
      const older = fromBinance(raw);

      // 종목/기간이 그새 바뀌었으면 폐기.
      if (get().symbol !== symbol || get().interval !== interval) {
        set({ loadingMore: false });
        return;
      }

      const oldestTime = get().candles[0]?.time as number | undefined;
      const merged = [
        ...older.filter((o) => (o.time as number) < (oldestTime ?? Infinity)),
        ...get().candles,
      ];
      set({
        candles: merged,
        loadingMore: false,
        // 더 이상 안 늘면(중복뿐이거나 빈 응답) 페이징 종료.
        hasMore: merged.length > get().candles.length || older.length >= 300,
      });
    } catch {
      set({ loadingMore: false });
    }
  },

  applyRealtimeBar: (bar) => {
    const { candles } = get();
    if (candles.length === 0) return;
    const lastTime = candles[candles.length - 1].time as number;
    // 과거 캔들보다 이전 틱은 무시.
    if (bar.time < lastTime) return;

    set({
      liveBar: {
        time: bar.time as UTCTimestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      },
    });
  },
}));
