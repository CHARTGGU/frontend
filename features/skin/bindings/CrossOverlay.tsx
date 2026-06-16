"use client";

import { Z_LAYER } from "@/lib/zLayers";
import { isPastRightEdge } from "@/lib/plotGuard";
import { useSkinStore } from "@/stores/skinStore";
import { useBindingData, positionCrosses } from "./useBindingData";

/** 무한도전 스티커 (골든=무야호, 데드=해골). */
const MUHAN_STICKER: Record<"golden" | "dead", string> = {
  golden: "/skins/muhan-muyaho.png",
  dead: "/skins/muhan-skull.png",
};

const GOLDEN_EMOJI = ["🚀", "💎", "🙌", "🤑", "📈"];
const DEAD_EMOJI = ["📉", "💀", "🥶", "😭", "🩸"];

/**
 * 골든/데드크로스(MA20×MA60) 연출 오버레이.
 * skinStore.crossStyle 에 따라 neon/burst/muhan 렌더. 좌표 추적(스크롤·줌).
 */
export default function CrossOverlay() {
  const crossStyle = useSkinStore((s) => s.crossStyle);
  const { crosses, toCoord, width, ready } = useBindingData();

  if (!crossStyle || !ready) return null;
  // 앵커 x가 가격축(Y축)·마켓플레이스에 근접한 크로스는 제외 (width=플롯 우경계).
  const items = positionCrosses(crosses, toCoord).filter(
    ({ x }) => !isPastRightEdge(width, x),
  );
  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: Z_LAYER.indicator }}
    >
      {items.map(({ cross, x, y }) => {
        const golden = cross.type === "golden";
        if (crossStyle === "muhan") {
          // 위치(translate)는 바깥 div, 등장 애니(scale)는 안쪽 div로 분리.
          // 같은 엘리먼트에 translate + scale 애니를 같이 주면 keyframe의
          // transform이 인라인 translate를 덮어써 좌측상단에 붙는다.
          return (
            <div
              key={cross.time}
              className="absolute left-0 top-0"
              style={{ transform: `translate(${x - 44}px, ${y - 96}px)` }}
            >
              <div style={{ animation: "poc-pop 380ms cubic-bezier(0.2,1.4,0.4,1) both" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={MUHAN_STICKER[golden ? "golden" : "dead"]}
                  alt={golden ? "골든크로스" : "데드크로스"}
                  width={88}
                  draggable={false}
                  style={{
                    display: "block",
                    height: "auto",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                    animation: "poc-shake 600ms ease-in-out 380ms",
                  }}
                />
              </div>
            </div>
          );
        }

        if (crossStyle === "burst") {
          const set = golden ? GOLDEN_EMOJI : DEAD_EMOJI;
          return (
            <div
              key={cross.time}
              className="absolute left-0 top-0"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              {set.map((e, k) => {
                const spread = (k - (set.length - 1) / 2) * 22;
                const rise = -70 - (k % 2) * 24;
                return (
                  <span
                    key={k}
                    className="absolute text-xl"
                    style={
                      {
                        left: spread - 10,
                        top: -12,
                        "--poc-rise": `${rise}px`,
                        animation: `poc-burst 1.5s ease-out ${k * 0.12}s infinite`,
                      } as React.CSSProperties
                    }
                  >
                    {e}
                  </span>
                );
              })}
            </div>
          );
        }

        // neon
        const neon = golden ? "#39ff14" : "#ff2d55";
        return (
          <div
            key={cross.time}
            className="absolute left-0 top-0"
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            {[0, 1].map((k) => (
              <span
                key={k}
                className="absolute rounded-full border-2"
                style={{
                  left: -22,
                  top: -22,
                  width: 44,
                  height: 44,
                  borderColor: neon,
                  boxShadow: `0 0 12px ${neon}`,
                  animation: `poc-ring 1.6s ease-out ${k * 0.5}s infinite`,
                }}
              />
            ))}
            <span
              className="absolute rounded-full"
              style={{
                left: -5,
                top: -5,
                width: 10,
                height: 10,
                background: neon,
                boxShadow: `0 0 10px ${neon}`,
              }}
            />
            <span
              className="absolute whitespace-nowrap text-[12px] font-bold tracking-widest"
              style={{
                left: 16,
                top: -30,
                color: neon,
                textShadow: `0 0 8px ${neon}`,
                animation: "poc-glitch 0.4s steps(2) infinite",
              }}
            >
              {golden ? "GOLDEN CROSS" : "DEAD CROSS"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
