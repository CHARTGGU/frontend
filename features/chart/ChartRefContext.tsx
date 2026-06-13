"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type {
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";

interface ChartRefs {
  chart: IChartApi | null;
  candleSeries: ISeriesApi<"Candlestick"> | null;
  /** 차트 마운트 완료 + 데이터 적용 여부. 오버레이가 좌표 계산 가능 시점. */
  ready: boolean;
  setRefs: (refs: {
    chart: IChartApi | null;
    candleSeries: ISeriesApi<"Candlestick"> | null;
  }) => void;
  setReady: (ready: boolean) => void;
}

const ChartRefContext = createContext<ChartRefs | null>(null);

/**
 * 차트 인스턴스(chart/candleSeries)를 오버레이 레이어와 공유.
 * ChartCanvas가 마운트 시 채우고, IndicatorOverlay가 좌표 변환에 소비.
 */
export function ChartRefProvider({ children }: { children: React.ReactNode }) {
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [candleSeries, setCandleSeries] =
    useState<ISeriesApi<"Candlestick"> | null>(null);
  const [ready, setReady] = useState(false);

  // 안정적 identity 유지 — ChartCanvas 마운트 effect가 매 렌더 재실행되지 않도록.
  const setRefs = useCallback<ChartRefs["setRefs"]>(({ chart: c, candleSeries: cs }) => {
    setChart(c);
    setCandleSeries(cs);
  }, []);

  const value = useMemo<ChartRefs>(
    () => ({ chart, candleSeries, ready, setRefs, setReady }),
    [chart, candleSeries, ready, setRefs],
  );

  return (
    <ChartRefContext.Provider value={value}>
      {children}
    </ChartRefContext.Provider>
  );
}

export function useChartRefs(): ChartRefs {
  const ctx = useContext(ChartRefContext);
  if (!ctx) {
    throw new Error("useChartRefs must be used within ChartRefProvider");
  }
  return ctx;
}
