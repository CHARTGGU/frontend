"use client";

import { useEffect, useState } from "react";
import type { MouseEventParams } from "lightweight-charts";
import { useChartRefs } from "./ChartRefContext";
import { useChartStore } from "@/stores/chartStore";
import { NEWS_MARKERS } from "@/lib/newsMarkers";
import type { MarkerDirection, NewsMarker } from "@/lib/newsMarkers";
import { Z_LAYER } from "@/lib/zLayers";

const ICON_SIZE = 16;

const DIR_COLOR: Record<MarkerDirection, { bg: string; ring: string }> = {
  up: { bg: "#22c55e", ring: "#22c55e55" },
  down: { bg: "#ef4444", ring: "#ef444455" },
  neutral: { bg: "#6b7280", ring: "#6b728055" },
};

interface PositionedMarker extends NewsMarker {
  x: number;
}

/** 뉴스 마커 툴팁 카드 (마커 아이콘 위에 렌더). */
function MarkerTooltip({ m }: { m: PositionedMarker }) {
  const { bg } = DIR_COLOR[m.direction];
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        bottom: ICON_SIZE + 8,
        left: "50%",
        transform: "translateX(-50%)",
        minWidth: 130,
        backgroundColor: "#1a1d2e",
        border: `1px solid ${bg}`,
        borderRadius: 6,
        padding: "6px 10px",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        zIndex: 1,
      }}
    >
      {/* 꼬리 */}
      <div
        style={{
          position: "absolute",
          bottom: -5,
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: 8,
          height: 8,
          backgroundColor: "#1a1d2e",
          borderRight: `1px solid ${bg}`,
          borderBottom: `1px solid ${bg}`,
        }}
      />
      <div style={{ fontSize: 11, fontWeight: 700, color: bg, marginBottom: 3 }}>
        {m.title}
      </div>
      <div style={{ fontSize: 10, color: "#cccccc", lineHeight: 1.4 }}>
        {m.body}
      </div>
      <div style={{ fontSize: 9, color: "#666", marginTop: 4 }}>
        {m.symbols.join(" · ")}
      </div>
    </div>
  );
}

/**
 * 뉴스 마커 오버레이.
 * - 시간축 위 이벤트 아이콘(N) 항상 표시.
 * - 툴팁 트리거 2가지:
 *   1. 아이콘에 직접 마우스 올림 (iconHoveredId)
 *   2. 차트 어디서든 해당 날짜에 십자선 진입 (crosshairId)
 */
export default function NewsMarkerOverlay() {
  const { chart, ready } = useChartRefs();
  const symbol = useChartStore((s) => s.symbol);
  const [, bump] = useState(0);
  const [iconHoveredId, setIconHoveredId] = useState<string | null>(null);
  const [crosshairId, setCrosshairId] = useState<string | null>(null);

  // 뷰 변화(스크롤·줌·리사이즈) → rAF throttle → x 재계산.
  useEffect(() => {
    if (!chart || !ready) return;
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        bump((n) => n + 1);
      });
    };
    const ts = chart.timeScale();
    ts.subscribeVisibleLogicalRangeChange(schedule);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      ts.unsubscribeVisibleLogicalRangeChange(schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [chart, ready]);

  // 십자선 이동 → 현재 날짜에 뉴스 마커가 있으면 활성.
  useEffect(() => {
    if (!chart || !ready) return;
    const sym = symbol.startsWith("BTC") ? "BTC" : "ETH";

    const onCrosshair = (params: MouseEventParams) => {
      if (!params.time) {
        setCrosshairId(null);
        return;
      }
      // 날짜 비교: 분봉·시봉 등 인트라데이에서도 같은 날(UTC 자정)이면 일치.
      const cursorDay = Math.floor((params.time as number) / 86400) * 86400;
      const matched = NEWS_MARKERS.find((m) => {
        if (!m.symbols.includes(sym as "BTC" | "ETH")) return false;
        return (m.time as number) === cursorDay;
      });
      setCrosshairId(matched?.id ?? null);
    };

    chart.subscribeCrosshairMove(onCrosshair);
    return () => {
      chart.unsubscribeCrosshairMove(onCrosshair);
      setCrosshairId(null);
    };
  }, [chart, ready, symbol]);

  if (!chart || !ready) return null;

  // 아이콘 직접 호버가 십자선보다 우선.
  const activeId = iconHoveredId ?? crosshairId;

  const sym = symbol.startsWith("BTC") ? "BTC" : "ETH";
  const ts = chart.timeScale();

  const visible: PositionedMarker[] = [];
  for (const m of NEWS_MARKERS) {
    if (!m.symbols.includes(sym as "BTC" | "ETH")) continue;
    const x = ts.timeToCoordinate(m.time);
    if (x === null) continue;
    visible.push({ ...m, x });
  }

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: Z_LAYER.newsMarker }}
    >
      {visible.map((m) => {
        const { bg, ring } = DIR_COLOR[m.direction];
        const isActive = activeId === m.id;

        return (
          <div
            key={m.id}
            className="pointer-events-auto absolute"
            style={{ left: m.x, bottom: 4, transform: "translateX(-50%)" }}
            onMouseEnter={() => setIconHoveredId(m.id)}
            onMouseLeave={() => setIconHoveredId(null)}
          >
            {/* 마커 아이콘 */}
            <div
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                borderRadius: "50%",
                backgroundColor: bg,
                boxShadow: isActive ? `0 0 0 3px ${ring}` : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                fontWeight: 700,
                color: "#fff",
                cursor: "default",
                userSelect: "none",
                transition: "box-shadow 0.1s",
              }}
            >
              N
            </div>

            {isActive && <MarkerTooltip m={m} />}
          </div>
        );
      })}
    </div>
  );
}
