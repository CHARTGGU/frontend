"use client";

import { useSkinStore } from "@/stores/skinStore";
import { useCustomBgStore, isCustomBgId } from "@/stores/customBgStore";
import { Z_LAYER } from "@/lib/zLayers";
import { findBackgroundSkin } from "./presets";

/**
 * 배경 스킨 = 차트 뒤 절대배치 레이어 (CLAUDE.md §4).
 * 차트 좌표에 연동하지 않음 → 스크롤·줌에 자동 고정.
 * 차트 배경은 투명 → 이 레이어가 비쳐 보인다.
 * preset 스킨과 사용자 업로드(custom) 배경 둘 다 같은 레이어로 렌더한다.
 */
export default function BackgroundLayer() {
  const backgroundSkinId = useSkinStore((s) => s.backgroundSkinId);
  const opacity = useSkinStore((s) => s.backgroundOpacity);
  const fitMode = useSkinStore((s) => s.fitMode);
  const customItems = useCustomBgStore((s) => s.items);

  // 적용된 id가 custom 프리픽스면 업로드 사진, 아니면 preset 스킨.
  const image = isCustomBgId(backgroundSkinId)
    ? customItems.find((i) => i.id === backgroundSkinId)?.objectUrl ?? null
    : findBackgroundSkin(backgroundSkinId)?.image ?? null;

  if (!image) return null;

  const style: React.CSSProperties =
    fitMode === "tile"
      ? {
          backgroundImage: `url(${image})`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
          opacity,
        }
      : {
          backgroundImage: `url(${image})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: fitMode, // cover | contain
          opacity,
        };

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ ...style, zIndex: Z_LAYER.background }}
    />
  );
}
