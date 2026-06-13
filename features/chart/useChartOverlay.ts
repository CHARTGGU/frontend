"use client";

import { useCallback, useEffect, useState } from "react";
import type { UTCTimestamp } from "lightweight-charts";
import { useChartRefs } from "./ChartRefContext";

export interface Coord {
  x: number;
  y: number;
}

/**
 * 좌표 오버레이 엔진 (CLAUDE.md §5).
 * - 스크롤/줌/십자선/리사이즈 구독 → requestAnimationFrame throttle → 재배치.
 * - toCoord: 가격·시간 → 픽셀. 가시영역 밖이면 null (호출부에서 숨김 처리).
 *
 * "view 변할 때 딱딱 따라붙는 기민함이 제품 완성도 핵심."
 */
export function useChartOverlay() {
  const { chart, candleSeries, ready } = useChartRefs();
  // rAF로 throttle된 재배치 트리거 (값 자체는 의미 없음, 변화로 리렌더 유발).
  const [, bump] = useState(0);

  useEffect(() => {
    if (!chart || !candleSeries || !ready) return;

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        bump((n) => n + 1);
      });
    };

    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleLogicalRangeChange(schedule);
    chart.subscribeCrosshairMove(schedule);
    window.addEventListener("resize", schedule);
    schedule(); // 최초 1회 배치

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(schedule);
      chart.unsubscribeCrosshairMove(schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [chart, candleSeries, ready]);

  const toCoord = useCallback(
    (time: UTCTimestamp, price: number): Coord | null => {
      if (!chart || !candleSeries) return null;
      const x = chart.timeScale().timeToCoordinate(time);
      const y = candleSeries.priceToCoordinate(price);
      if (x === null || y === null) return null;
      return { x, y };
    },
    [chart, candleSeries],
  );

  return { toCoord, ready };
}
