"use client";

import { useSkinStore } from "@/stores/skinStore";

/** 적용된 폭포수 이펙트 위젯의 높이(%) 컨트롤. 비활성 시 숨김. */
export default function WaterfallControls() {
  const waterfallEnabled = useSkinStore((s) => s.waterfallEnabled);
  const waterfallHeight = useSkinStore((s) => s.waterfallHeight);
  const setWaterfallHeight = useSkinStore((s) => s.setWaterfallHeight);

  if (!waterfallEnabled) return null;

  return (
    <div className="space-y-1 border-b border-panel-border bg-panel-alt px-3 py-2.5">
      <label className="mb-1 flex justify-between text-[11px] text-text-muted">
        <span>폭포 높이</span>
        <span>{waterfallHeight}%</span>
      </label>
      <input
        type="range"
        min={10}
        max={90}
        step={5}
        value={waterfallHeight}
        onChange={(e) => setWaterfallHeight(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}
