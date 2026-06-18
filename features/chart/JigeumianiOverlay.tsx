"use client";

import { useChartStore } from "@/stores/chartStore";
import { useSkinStore } from "@/stores/skinStore";
import { useChartOverlay } from "./useChartOverlay";
import { Z_LAYER } from "@/lib/zLayers";
import type { Candle } from "@/lib/types";

/**
 * 장대양봉 판정 기준
 * - 양봉: close > open
 * - 몸통(close - open) / open >= 7% — 강한 상승
 * - 몸통 / 전체범위(high - low) >= 75% — 꼬리 매우 짧은 강한 실체
 */
function isBigBullish(c: Candle): boolean {
  if (c.close <= c.open) return false;
  const body = c.close - c.open;
  const range = c.high - c.low;
  if (range === 0) return false;
  return body / c.open >= 0.07 && body / range >= 0.75;
}

/**
 * "지금이니? 🤔" 말풍선 오버레이.
 * 장대양봉 캔들 고가 위에 말풍선을 표시한다.
 * useChartOverlay 훅이 스크롤·줌·십자선·리사이즈를 모두 구독하고
 * rAF throttle 재배치를 처리하므로 감정 고양이와 동일한 기민함을 가진다.
 */
export default function JigeumianiOverlay() {
  const jigeumianiEnabled = useSkinStore((s) => s.jigeumianiEnabled);
  const candles = useChartStore((s) => s.candles);
  const { toCoord, ready } = useChartOverlay();

  if (!jigeumianiEnabled || !ready) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: Z_LAYER.jigeumiani }}
    >
      {candles.map((c) => {
        if (!isBigBullish(c)) return null;
        const pos = toCoord(c.time, c.high);
        if (!pos) return null;
        return <SpeechBubble key={c.time} x={pos.x} y={pos.y} />;
      })}
    </div>
  );
}

/** 말풍선 컴포넌트. 캔들 고가 바로 위에 붙는다. */
function SpeechBubble({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: x,
        top: y - 52,
        transform: "translateX(-50%)",
      }}
    >
      {/* 말풍선 본체 */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#fffde7",
          border: "1.5px solid #f9a825",
          borderRadius: 8,
          padding: "4px 8px",
          fontSize: 11,
          fontWeight: 700,
          color: "#5d4037",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
          lineHeight: 1.4,
        }}
      >
        지금이니? 🤔
        {/* 아래 꼬리 */}
        <div
          style={{
            position: "absolute",
            bottom: -6,
            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: 8,
            height: 8,
            backgroundColor: "#fffde7",
            borderRight: "1.5px solid #f9a825",
            borderBottom: "1.5px solid #f9a825",
          }}
        />
      </div>
    </div>
  );
}
