"use client";

import { useSkinStore } from "@/stores/skinStore";
import type { BrickStyle } from "@/stores/skinStore";

interface BrickControlsProps {
  /** 이 컨트롤이 담당하는 매물대 스타일. */
  style: BrickStyle;
}

/**
 * 적용된 매물대 벽돌(픽셀/골드바)의 투명도(%) 컨트롤.
 * 해당 스타일이 적용된 상태가 아니면 숨김. 스타일별 값은 개별 저장.
 */
export default function BrickControls({ style }: BrickControlsProps) {
  const brickStyle = useSkinStore((s) => s.brickStyle);
  const brickOpacity = useSkinStore((s) => s.brickOpacity);
  const setBrickOpacity = useSkinStore((s) => s.setBrickOpacity);

  if (brickStyle !== style) return null;

  const pct = Math.round(brickOpacity[style] * 100);

  return (
    <div className="space-y-1 border-b border-panel-border bg-panel-alt px-3 py-2.5">
      <label className="mb-1 flex justify-between text-[11px] text-text-muted">
        <span>투명도</span>
        <span>{pct}%</span>
      </label>
      <input
        type="range"
        min={10}
        max={100}
        step={5}
        value={pct}
        onChange={(e) => setBrickOpacity(style, Number(e.target.value) / 100)}
        className="w-full accent-accent"
      />
    </div>
  );
}
