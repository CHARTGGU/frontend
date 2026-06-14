"use client";

import { useSkinStore } from "@/stores/skinStore";

/** 적용된 불 이펙트 위젯의 높이(%) 컨트롤. 비활성 시 숨김. */
export default function FireControls() {
  const fireEnabled = useSkinStore((s) => s.fireEnabled);
  const fireHeight = useSkinStore((s) => s.fireHeight);
  const setFireHeight = useSkinStore((s) => s.setFireHeight);

  if (!fireEnabled) return null;

  return (
    <div className="space-y-1 border-b border-panel-border bg-panel-alt px-3 py-2.5">
      <label className="mb-1 flex justify-between text-[11px] text-text-muted">
        <span>불 높이</span>
        <span>{fireHeight}%</span>
      </label>
      <input
        type="range"
        min={10}
        max={80}
        step={5}
        value={fireHeight}
        onChange={(e) => setFireHeight(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}
