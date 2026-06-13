"use client";

import { useMemo } from "react";
import { volumeProfile } from "@/lib/indicators";
import { VOL_PROFILE_BUCKETS } from "@/lib/types";
import { useChartStore } from "@/stores/chartStore";
import { useChartRefs } from "./ChartRefContext";
import { useChartOverlay } from "./useChartOverlay";

/** 막대 최대 폭(px). */
const MAX_BAR_WIDTH = 120;

/**
 * 매물대 = 가시범위 캔들의 가격버킷별 거래량 → 우측 가로막대.
 * DOM 오버레이(CLAUDE.md §5). 스크롤·줌 시 useChartOverlay rAF로 재배치.
 */
export default function VolumeProfileOverlay() {
  const active = useChartStore((s) => s.activeIndicators);
  const candles = useChartStore((s) => s.candles);
  const { ready } = useChartOverlay();
  const { chart, candleSeries } = useChartRefs();

  // 가시 시간범위 — 매 rAF 렌더마다 새로 읽음(저렴). null은 가드.
  const visibleRange = chart?.timeScale().getVisibleRange() ?? null;
  const from = visibleRange ? (visibleRange.from as number) : null;
  const to = visibleRange ? (visibleRange.to as number) : null;

  // 버킷 계산은 candles·가시범위가 바뀔 때만(crosshair·가격줌엔 from/to 불변 → 캐시 히트).
  const buckets = useMemo(() => {
    if (from === null || to === null) return [];
    const visible = candles.filter(
      (c) => (c.time as number) >= from && (c.time as number) <= to,
    );
    return volumeProfile(visible, VOL_PROFILE_BUCKETS);
  }, [candles, from, to]);

  if (!active.includes("volProfile") || !ready || !chart || !candleSeries) {
    return null;
  }
  if (buckets.length === 0) return null;

  const maxVol = buckets.reduce((m, b) => (b.volume > m ? b.volume : m), 0);
  if (maxVol <= 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {buckets.map((b, i) => {
        const yTop = candleSeries.priceToCoordinate(b.priceHigh);
        const yBottom = candleSeries.priceToCoordinate(b.priceLow);
        if (yTop === null || yBottom === null) return null;

        const height = Math.max(1, yBottom - yTop - 1);
        const width = (b.volume / maxVol) * MAX_BAR_WIDTH;
        if (width < 1) return null;

        return (
          <div
            key={i}
            className="absolute rounded-sm bg-[rgba(255,169,77,0.35)]"
            style={{
              right: 8,
              top: yTop,
              height,
              width,
            }}
          />
        );
      })}
    </div>
  );
}
