"use client";

import {
  detectCrossesInRange,
  detectPocInRange,
  type Cross,
  type PocResult,
} from "@/lib/indicators";
import { useChartStore } from "@/stores/chartStore";
import { useChartOverlay } from "@/features/chart/useChartOverlay";
import { useChartRefs } from "@/features/chart/ChartRefContext";

export interface BindingData {
  crosses: Cross[];
  poc: PocResult | null;
  toCoord: ReturnType<typeof useChartOverlay>["toCoord"];
  priceToY: (price: number) => number | null;
  width: number;
  ready: boolean;
}

/**
 * 본 차트(실시간 chartStore 캔들) 기준 크로스·POC 바인딩 데이터.
 * useChartOverlay 구독 → 스크롤·줌마다 가시범위 재계산(rAF throttle).
 * PoC의 usePocBindings와 동일 구조지만 데이터 소스가 fixture가 아닌 실 캔들.
 */
export function useBindingData(): BindingData {
  const candles = useChartStore((s) => s.candles);
  const { toCoord, ready } = useChartOverlay();
  const { chart, candleSeries } = useChartRefs();

  let crosses: Cross[] = [];
  let poc: PocResult | null = null;
  let priceToY: (price: number) => number | null = () => null;
  let width = 0;

  if (ready && chart && candleSeries && candles.length > 0) {
    const vr = chart.timeScale().getVisibleRange();
    if (vr) {
      const from = vr.from as number;
      const to = vr.to as number;
      crosses = detectCrossesInRange(candles, from, to, 20, 60);
      poc = detectPocInRange(candles, from, to, 24);
    }
    priceToY = (price) => candleSeries.priceToCoordinate(price);
    width = chart.timeScale().width();
  }

  return { crosses, poc, toCoord, priceToY, width, ready };
}

/** 크로스 → 픽셀좌표 + 가시영역 밖 제거. */
export function positionCrosses(
  crosses: Cross[],
  toCoord: BindingData["toCoord"],
): Array<{ cross: Cross; x: number; y: number }> {
  const out: Array<{ cross: Cross; x: number; y: number }> = [];
  for (const cross of crosses) {
    const p = toCoord(cross.time, cross.price);
    if (p) out.push({ cross, x: p.x, y: p.y });
  }
  return out;
}

export interface BrickRow {
  y: number;
  ratio: number;
  isPoc: boolean;
}

/** POC 버킷 → 막대 행 + 가시영역 밖 제거. */
export function toBrickRows(
  poc: PocResult,
  priceToY: BindingData["priceToY"],
): BrickRow[] {
  let maxVol = 1;
  for (const b of poc.buckets) if (b.volume > maxVol) maxVol = b.volume;

  const rows: BrickRow[] = [];
  poc.buckets.forEach((b, i) => {
    const y = priceToY((b.priceLow + b.priceHigh) / 2);
    if (y === null) return;
    rows.push({ y, ratio: b.volume / maxVol, isPoc: i === poc.pocIndex });
  });
  return rows;
}
