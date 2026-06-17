"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinate, UTCTimestamp } from "lightweight-charts";
import { useStickerStore } from "@/stores/stickerStore";
import { useChartRefs } from "@/features/chart/ChartRefContext";
import { useChartOverlay } from "@/features/chart/useChartOverlay";
import { getPlotRight, isPastRightEdge } from "@/lib/plotGuard";
import { Z_LAYER } from "@/lib/zLayers";
import StickerItem from "./StickerItem";

/**
 * 부적 스티커 컨테이너. 스티커를 차트 좌표(time·price)에 앵커링 →
 * 스크롤·줌 시 차트와 함께 이동(CLAUDE.md §5 좌표 추적).
 * - useChartOverlay: view 변경(스크롤/줌/리사이즈)마다 rAF throttle 재렌더 트리거.
 * - 미배치(time=null) 스티커는 화면 중앙에 앵커를 부여.
 * - 스티커 선택 후 ESC → 삭제. 컨테이너 바깥 클릭 → 선택 해제.
 */
export default function StickerOverlay() {
  const stickers = useStickerStore((s) => s.stickers);
  const updateSticker = useStickerStore((s) => s.updateSticker);
  const removeSticker = useStickerStore((s) => s.removeSticker);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { chart, candleSeries } = useChartRefs();
  // view 변경마다 리렌더 → 아래 toPx 재계산 (딱딱 따라붙음).
  const { ready } = useChartOverlay();

  /** 화면 px(좌상단) → 차트 앵커(time, price). 시간축 밖이면 null. */
  const toAnchor = useCallback(
    (xPx: number, yPx: number) => {
      if (!chart || !candleSeries) return null;
      const time = chart.timeScale().coordinateToTime(xPx as Coordinate);
      const price = candleSeries.coordinateToPrice(yPx as Coordinate);
      if (time === null || typeof time !== "number" || price === null) {
        return null;
      }
      return { time: time as number, price };
    },
    [chart, candleSeries],
  );

  /** 차트 앵커(time, price) → 화면 px(좌상단). 가시영역 밖이면 null. */
  const toPx = useCallback(
    (time: number, price: number) => {
      if (!chart || !candleSeries) return null;
      const x = chart.timeScale().timeToCoordinate(time as UTCTimestamp);
      const y = candleSeries.priceToCoordinate(price);
      if (x === null || y === null) return null;
      return { x: x as number, y: y as number };
    },
    [chart, candleSeries],
  );

  // 미배치 스티커 → 차트 중앙(상단 35%)에 앵커 부여. 여러 개면 조금씩 어긋나게.
  useEffect(() => {
    if (!ready) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    let placed = stickers.filter((s) => s.time !== null).length;
    for (const s of stickers) {
      if (s.time === null || s.price === null) {
        const offset = (placed % 6) * 20;
        const anchor = toAnchor(rect.width / 2 + offset, rect.height * 0.35 + offset);
        if (anchor) updateSticker(s.id, anchor);
        placed += 1;
      }
    }
  }, [stickers, ready, toAnchor, updateSticker]);

  // ESC → 선택된 스티커 삭제.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedId) {
        removeSticker(selectedId);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, removeSticker]);

  // 컨테이너 바깥 클릭 → 선택 해제.
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(e.target as Node)) setSelectedId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  if (stickers.length === 0) return null;

  // 우측 끝이 가격축(Y축)·마켓플레이스에 근접한 스티커는 숨김.
  const plotRight = getPlotRight(chart);

  // 축 거터 클리핑은 상위 PlotClip이 담당 → 여기선 플롯 전체(inset-0)에 배치.
  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: Z_LAYER.sticker }}
    >
      {stickers.map((sticker) => {
        if (sticker.time === null || sticker.price === null) return null;
        const px = toPx(sticker.time, sticker.price);
        if (!px) return null;
        if (isPastRightEdge(plotRight, px.x + sticker.width)) return null;
        return (
          <StickerItem
            key={sticker.id}
            sticker={sticker}
            x={px.x}
            y={px.y}
            selected={selectedId === sticker.id}
            onSelect={() => setSelectedId(sticker.id)}
            onCommit={(box) => {
              const anchor = toAnchor(box.x, box.y);
              updateSticker(
                sticker.id,
                anchor
                  ? { ...anchor, width: box.width, height: box.height }
                  : { width: box.width, height: box.height },
              );
            }}
          />
        );
      })}
    </div>
  );
}
