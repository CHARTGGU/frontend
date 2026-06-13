"use client";

import { useSkinStore } from "@/stores/skinStore";
import { findBackgroundSkin } from "./presets";

/**
 * 배경 스킨 = 차트 뒤 절대배치 레이어 (CLAUDE.md §4).
 * 차트 좌표에 연동하지 않음 → 스크롤·줌에 자동 고정.
 * 차트 배경은 투명 → 이 레이어가 비쳐 보인다.
 */
export default function BackgroundLayer() {
  const backgroundSkinId = useSkinStore((s) => s.backgroundSkinId);
  const opacity = useSkinStore((s) => s.backgroundOpacity);
  const fitMode = useSkinStore((s) => s.fitMode);

  const skin = findBackgroundSkin(backgroundSkinId);
  if (!skin) return null;

  const style: React.CSSProperties =
    fitMode === "tile"
      ? {
          backgroundImage: `url(${skin.image})`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
          opacity,
        }
      : {
          backgroundImage: `url(${skin.image})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: fitMode, // cover | contain
          opacity,
        };

  return <div className="pointer-events-none absolute inset-0" style={style} />;
}
