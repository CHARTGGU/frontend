"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type LogicalRange,
} from "lightweight-charts";
import { subscribeKline } from "@/lib/binance";
import { bollinger, macd, rsi, sma } from "@/lib/indicators";
import {
  BB_COLORS,
  BB_MULT,
  BB_PERIOD,
  MA_COLORS,
  MACD_COLORS,
  MACD_FAST,
  MACD_SIGNAL,
  MACD_SLOW,
  RSI_COLOR,
  RSI_LEVELS,
  RSI_PERIOD,
  type MaPeriod,
} from "@/lib/types";
import { useChartStore } from "@/stores/chartStore";
import { useChartRefs } from "./ChartRefContext";

const volColor = (up: boolean) =>
  up ? "rgba(38,166,154,0.5)" : "rgba(239,83,80,0.5)";

export default function ChartCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const maSeriesRef = useRef<Map<MaPeriod, ISeriesApi<"Line">>>(new Map());

  // 볼린저밴드 3선 (price pane). 활성 시 생성, 해제 시 제거.
  const bbRef = useRef<{
    upper: ISeriesApi<"Line">;
    middle: ISeriesApi<"Line">;
    lower: ISeriesApi<"Line">;
  } | null>(null);

  // RSI (별도 pane). 시리즈 + 30/70 기준선.
  const rsiRef = useRef<{
    series: ISeriesApi<"Line">;
    lines: IPriceLine[];
  } | null>(null);

  // MACD (별도 pane). macd·signal 라인 + histogram.
  const macdRef = useRef<{
    macd: ISeriesApi<"Line">;
    signal: ISeriesApi<"Line">;
    hist: ISeriesApi<"Histogram">;
  } | null>(null);

  const { setRefs, setReady } = useChartRefs();

  const candles = useChartStore((s) => s.candles);
  const activeMa = useChartStore((s) => s.activeMa);
  const dataEpoch = useChartStore((s) => s.dataEpoch);
  const liveBar = useChartStore((s) => s.liveBar);
  const symbol = useChartStore((s) => s.symbol);
  const interval = useChartStore((s) => s.interval);
  const activeIndicators = useChartStore((s) => s.activeIndicators);

  // 마운트: 차트 + 시리즈 생성, 과거 페이징 구독. (lightweight-charts v5)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        // 배경 투명 → 뒤 배경 스킨 레이어가 비침 (CLAUDE.md §4).
        background: { color: "transparent" },
        textColor: "#cccccc",
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#333333" },
      timeScale: { borderColor: "#333333", timeVisible: false },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // 거래량 = 별도 pane(index 1).
    const volumeSeries = chart.addSeries(
      HistogramSeries,
      { priceFormat: { type: "volume" }, priceScaleId: "" },
      1,
    );

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;
    setRefs({ chart, candleSeries });

    const panes = chart.panes();
    if (panes.length > 1) panes[1].setHeight(120);

    // 왼쪽 끝 근접 → 과거 캔들 페이징 로드 (store가 중복 호출 방지).
    const onRangeChange = (range: LogicalRange | null) => {
      if (range && range.from < 10) {
        void useChartStore.getState().loadOlder();
      }
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRangeChange);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      maSeriesRef.current.clear();
      bbRef.current = null;
      rsiRef.current = null;
      macdRef.current = null;
      setRefs({ chart: null, candleSeries: null });
      setReady(false);
    };
  }, [setRefs, setReady]);

  // 캔들·거래량 데이터셋 적용 (전체 교체). fit은 별도 effect.
  useEffect(() => {
    const candleSeries = candleRef.current;
    const volumeSeries = volumeRef.current;
    if (!candleSeries || !volumeSeries) return;
    if (candles.length === 0) {
      setReady(false);
      return;
    }

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time,
        value: c.volume,
        color: volColor(c.close >= c.open),
      })),
    );
    setReady(true);
  }, [candles, setReady]);

  // fresh 로드(초기·심볼·기간 변경)에만 화면 맞춤. 페이징·실시간엔 뷰 유지.
  useEffect(() => {
    if (candles.length === 0) return;
    chartRef.current?.timeScale().fitContent();
  }, [dataEpoch, candles.length]);

  // 실시간 진행 캔들 — series.update (전체 setData 없이 마지막 바만 갱신).
  useEffect(() => {
    if (!liveBar) return;
    const candleSeries = candleRef.current;
    const volumeSeries = volumeRef.current;
    if (!candleSeries || !volumeSeries) return;

    candleSeries.update({
      time: liveBar.time,
      open: liveBar.open,
      high: liveBar.high,
      low: liveBar.low,
      close: liveBar.close,
    });
    volumeSeries.update({
      time: liveBar.time,
      value: liveBar.volume,
      color: volColor(liveBar.close >= liveBar.open),
    });
  }, [liveBar]);

  // WS 실시간 구독 (종목/기간별 재연결).
  useEffect(() => {
    const applyRealtimeBar = useChartStore.getState().applyRealtimeBar;
    const unsubscribe = subscribeKline(symbol, interval, applyRealtimeBar);
    return unsubscribe;
  }, [symbol, interval]);

  // MA 라인 동기화 (활성 기간만 유지).
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const map = maSeriesRef.current;

    for (const [period, series] of map) {
      if (!activeMa.includes(period)) {
        chart.removeSeries(series);
        map.delete(period);
      }
    }

    for (const period of activeMa) {
      let series = map.get(period);
      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: MA_COLORS[period],
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        map.set(period, series);
      }
      series.setData(candles.length >= period ? sma(candles, period) : []);
    }
  }, [candles, activeMa]);

  // 볼린저밴드 (price pane 오버레이) 동기화.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const on = activeIndicators.includes("bb");
    if (!on) {
      if (bbRef.current) {
        chart.removeSeries(bbRef.current.upper);
        chart.removeSeries(bbRef.current.middle);
        chart.removeSeries(bbRef.current.lower);
        bbRef.current = null;
      }
      return;
    }

    if (!bbRef.current) {
      const lineOpts = {
        lineWidth: 1 as const,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      };
      bbRef.current = {
        upper: chart.addSeries(LineSeries, { ...lineOpts, color: BB_COLORS.upper }),
        middle: chart.addSeries(LineSeries, {
          ...lineOpts,
          color: BB_COLORS.middle,
          lineStyle: LineStyle.Dashed,
        }),
        lower: chart.addSeries(LineSeries, { ...lineOpts, color: BB_COLORS.lower }),
      };
    }

    const bands = bollinger(candles, BB_PERIOD, BB_MULT);
    bbRef.current.upper.setData(bands.upper);
    bbRef.current.middle.setData(bands.middle);
    bbRef.current.lower.setData(bands.lower);
  }, [candles, activeIndicators]);

  // RSI (별도 pane) 동기화.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const on = activeIndicators.includes("rsi");
    if (!on) {
      if (rsiRef.current) {
        chart.removeSeries(rsiRef.current.series);
        rsiRef.current = null;
      }
      return;
    }

    if (!rsiRef.current) {
      const paneIndex = chart.panes().length;
      const series = chart.addSeries(
        LineSeries,
        {
          color: RSI_COLOR,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        },
        paneIndex,
      );
      const lines = RSI_LEVELS.map((level) =>
        series.createPriceLine({
          price: level,
          color: "rgba(255,255,255,0.25)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: String(level),
        }),
      );
      chart.panes()[paneIndex]?.setHeight(100);
      rsiRef.current = { series, lines };
    }

    rsiRef.current.series.setData(rsi(candles, RSI_PERIOD));
  }, [candles, activeIndicators]);

  // MACD (별도 pane) 동기화.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const on = activeIndicators.includes("macd");
    if (!on) {
      if (macdRef.current) {
        chart.removeSeries(macdRef.current.macd);
        chart.removeSeries(macdRef.current.signal);
        chart.removeSeries(macdRef.current.hist);
        macdRef.current = null;
      }
      return;
    }

    if (!macdRef.current) {
      const paneIndex = chart.panes().length;
      const hist = chart.addSeries(
        HistogramSeries,
        { priceLineVisible: false, lastValueVisible: false },
        paneIndex,
      );
      const macdLine = chart.addSeries(
        LineSeries,
        {
          color: MACD_COLORS.macd,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        },
        paneIndex,
      );
      const signalLine = chart.addSeries(
        LineSeries,
        {
          color: MACD_COLORS.signal,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        },
        paneIndex,
      );
      chart.panes()[paneIndex]?.setHeight(100);
      macdRef.current = { macd: macdLine, signal: signalLine, hist };
    }

    const result = macd(candles, MACD_FAST, MACD_SLOW, MACD_SIGNAL);
    macdRef.current.hist.setData(result.histogram);
    macdRef.current.macd.setData(result.macd);
    macdRef.current.signal.setData(result.signal);
  }, [candles, activeIndicators]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
