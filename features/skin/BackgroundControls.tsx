"use client";

import { useSkinStore, type FitMode } from "@/stores/skinStore";

const FIT_MODES: { id: FitMode; label: string }[] = [
  { id: "cover", label: "꽉 채움" },
  { id: "contain", label: "맞춤" },
  { id: "tile", label: "타일" },
];

/** 적용된 배경 스킨의 투명도·fit 컨트롤. 배경 미적용 시 숨김. */
export default function BackgroundControls() {
  const backgroundSkinId = useSkinStore((s) => s.backgroundSkinId);
  const opacity = useSkinStore((s) => s.backgroundOpacity);
  const fitMode = useSkinStore((s) => s.fitMode);
  const themingEnabled = useSkinStore((s) => s.themingEnabled);
  const setOpacity = useSkinStore((s) => s.setBackgroundOpacity);
  const setFitMode = useSkinStore((s) => s.setFitMode);
  const toggleTheming = useSkinStore((s) => s.toggleTheming);

  if (!backgroundSkinId) return null;

  return (
    <div className="space-y-2.5 border-b border-panel-border bg-panel-alt px-3 py-2.5">
      <div>
        <label className="mb-1 flex justify-between text-[11px] text-text-muted">
          <span>투명도</span>
          <span>{Math.round(opacity * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-2">
        <span className="text-[11px] text-text-muted">
          배경에 맞춰 색 변경
          <span className="ml-1 text-text-muted/70">(캔들·톤)</span>
        </span>
        <input
          type="checkbox"
          checked={themingEnabled}
          onChange={toggleTheming}
          className="h-3.5 w-3.5 accent-accent"
        />
      </label>

      <div>
        <span className="mb-1 block text-[11px] text-text-muted">맞춤 모드</span>
        <div className="flex gap-1">
          {FIT_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setFitMode(m.id)}
              className={`flex-1 rounded px-1.5 py-1 text-[11px] ${
                fitMode === m.id
                  ? "bg-accent text-white"
                  : "bg-panel text-text-muted hover:bg-panel-hover"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
