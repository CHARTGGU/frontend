"use client";

import { Z_LAYER } from "@/lib/zLayers";
import { useSkinStore } from "@/stores/skinStore";
import { useBindingData, toBrickRows } from "./useBindingData";

const BAR_MAX = 240;
const BRICK = 11;
const GAP = 2;

/**
 * 매물대 벽돌 오버레이. skinStore.brickStyle 에 따라 pixel/gold 렌더.
 * POC(최대 매물대)는 금색 강조 + 라벨. 가격축 우측 정렬, 좌표 추적.
 */
export default function BrickOverlay() {
  const brickStyle = useSkinStore((s) => s.brickStyle);
  const brickOpacity = useSkinStore((s) => s.brickOpacity);
  const { poc, priceToY, width, ready } = useBindingData();

  if (!brickStyle || !ready || !poc || width === 0) return null;
  const rows = toBrickRows(poc, priceToY);
  const anchorRight = width - 8;

  if (brickStyle === "gold") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ zIndex: Z_LAYER.indicatorBehind, opacity: brickOpacity.gold }}
      >
        {rows.map((row, i) => {
          const len = Math.max(6, row.ratio * BAR_MAX);
          const h = row.isPoc ? 13 : 9;
          return (
            <div
              key={i}
              className="absolute flex items-center justify-end gap-1"
              style={{
                left: anchorRight - len - 70,
                top: row.y - h / 2,
                width: len + 70,
                animation: `poc-brick-rise 320ms ease-out ${i * 12}ms both`,
              }}
            >
              <div
                style={{
                  width: len,
                  height: h,
                  borderRadius: 3,
                  background: row.isPoc
                    ? "linear-gradient(90deg,#fff3bf,#ffd43b,#f08c00)"
                    : "linear-gradient(90deg,#495057,#868e96)",
                  boxShadow: row.isPoc ? "0 0 8px rgba(255,200,0,0.7)" : "none",
                  ...(row.isPoc
                    ? { animation: "poc-poc-glow 1.4s ease-in-out infinite" }
                    : {}),
                }}
              />
              {row.isPoc && (
                <span className="whitespace-nowrap text-[12px] font-black text-[#ffd43b]">
                  💰 매물벽
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // pixel
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: Z_LAYER.indicatorBehind, opacity: brickOpacity.pixel }}
    >
      {rows.map((row, i) => {
        const len = row.ratio * BAR_MAX;
        const count = Math.max(1, Math.round(len / (BRICK + GAP)));
        const h = row.isPoc ? BRICK + 4 : BRICK;
        return (
          <div
            key={i}
            className="absolute flex items-center gap-[2px]"
            style={{
              left: 0,
              top: row.y - h / 2,
              width: anchorRight,
              flexDirection: "row-reverse",
              justifyContent: "flex-start",
              paddingRight: 8,
              animation: `poc-brick-rise 320ms ease-out ${i * 12}ms both`,
            }}
          >
            {Array.from({ length: count }, (_, k) => (
              <span
                key={k}
                style={{
                  width: BRICK,
                  height: h,
                  borderRadius: 2,
                  background: row.isPoc ? "#ffd43b" : "#7048e8",
                  boxShadow: row.isPoc
                    ? "inset 0 0 0 1px #f08c00"
                    : "inset 0 0 0 1px #5f3dc4",
                  ...(row.isPoc
                    ? { animation: "poc-poc-glow 1.4s ease-in-out infinite" }
                    : {}),
                }}
              />
            ))}
            {row.isPoc && (
              <span className="ml-1 whitespace-nowrap text-[11px] font-black text-[#ffd43b]">
                매물벽 ⛏️
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
