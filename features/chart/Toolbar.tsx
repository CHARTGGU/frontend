"use client";

import { useEffect, useRef, useState } from "react";
import {
  INDICATOR_DOT,
  INDICATOR_LABELS,
  INTERVALS,
  MA_COLORS,
  MA_PERIODS,
  SYMBOLS,
  type IndicatorId,
  type SymbolId,
} from "@/lib/types";
import { useChartStore } from "@/stores/chartStore";
import { useSkinStore } from "@/stores/skinStore";
import ExportButton from "@/features/export/ExportButton";

/** 토글 가능한 보조지표 목록. */
const INDICATOR_IDS: IndicatorId[] = ["bb", "rsi", "macd", "volProfile", "ichimoku"];

export default function Toolbar() {
  const symbol = useChartStore((s) => s.symbol);
  const interval = useChartStore((s) => s.interval);
  const activeMa = useChartStore((s) => s.activeMa);
  const setSymbol = useChartStore((s) => s.setSymbol);
  const setInterval = useChartStore((s) => s.setInterval);
  const toggleMa = useChartStore((s) => s.toggleMa);
  const activeIndicators = useChartStore((s) => s.activeIndicators);
  const toggleIndicator = useChartStore((s) => s.toggleIndicator);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-panel-border bg-panel px-3">
      <span className="mr-1 text-sm font-bold text-text-primary">
        Chart<span className="text-accent">Skin</span>
      </span>

      <SymbolSelect value={symbol} onChange={setSymbol} />

      {/* 기간 — 1D만 활성, 나머지 준비중(비활성) */}
      <div className="flex items-center gap-0.5 rounded bg-panel-alt p-0.5">
        {INTERVALS.map((iv) => (
          <button
            key={iv.id}
            disabled={!iv.enabled}
            onClick={() => iv.enabled && setInterval(iv.id)}
            title={iv.enabled ? undefined : "준비중"}
            className={`rounded px-2 py-1 text-xs ${
              interval === iv.id
                ? "bg-accent text-white"
                : iv.enabled
                  ? "text-text-primary hover:bg-panel-hover"
                  : "cursor-not-allowed text-text-muted/40"
            }`}
          >
            {iv.label}
          </button>
        ))}
      </div>

      <IndicatorMenu
        activeMa={activeMa}
        onToggleMa={toggleMa}
        activeIndicators={activeIndicators}
        onToggleIndicator={toggleIndicator}
      />

      <div className="ml-auto flex items-center gap-2">
        <SkinVisibilityToggle />
        <ExportButton />
      </div>
    </header>
  );
}

/**
 * 마켓플레이스 스킨·위젯 전역 표시/숨김 토글.
 * 적용된 스킨을 차트에서 잠시 가렸다가 다시 보이게 하는 용도 — 설정값은 보존되어
 * 다시 켜면 기존 그대로 복원된다(skinStore.skinsVisible).
 */
function SkinVisibilityToggle() {
  const skinsVisible = useSkinStore((s) => s.skinsVisible);
  const toggleSkinsVisible = useSkinStore((s) => s.toggleSkinsVisible);

  return (
    <button
      onClick={toggleSkinsVisible}
      aria-pressed={!skinsVisible}
      title={
        skinsVisible
          ? "마켓플레이스 스킨·위젯 숨기기 (설정 유지)"
          : "마켓플레이스 스킨·위젯 다시 보이기"
      }
      className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-colors ${
        skinsVisible
          ? "bg-panel-alt text-text-primary hover:bg-panel-hover"
          : "bg-accent/15 text-accent hover:bg-accent/25"
      }`}
    >
      <EyeIcon off={!skinsVisible} />
      <span>스킨 {skinsVisible ? "표시" : "숨김"}</span>
    </button>
  );
}

/** 눈 아이콘. off=true면 가려진(빗금) 눈으로 '숨김' 상태를 나타낸다. */
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {off ? (
        <>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 0 1-4.24-4.24" />
          <path d="M6.61 6.61A18.5 18.5 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </>
      ) : (
        <>
          <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function SymbolSelect({
  value,
  onChange,
}: {
  value: SymbolId;
  onChange: (s: SymbolId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(() => setOpen(false));
  const current = SYMBOLS.find((s) => s.id === value)!;

  return (
    <div ref={ref} className="relative" data-onboarding="symbol">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded bg-panel-alt px-2.5 py-1.5 text-sm text-text-primary hover:bg-panel-hover"
      >
        <span className="font-semibold">{current.label}</span>
        <span className="text-text-muted">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-40 overflow-hidden rounded border border-panel-border bg-panel-alt shadow-lg">
          {SYMBOLS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-panel-hover ${
                s.id === value ? "text-accent" : "text-text-primary"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IndicatorMenu({
  activeMa,
  onToggleMa,
  activeIndicators,
  onToggleIndicator,
}: {
  activeMa: number[];
  onToggleMa: (p: (typeof MA_PERIODS)[number]) => void;
  activeIndicators: IndicatorId[];
  onToggleIndicator: (id: IndicatorId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(() => setOpen(false));

  return (
    <div ref={ref} className="relative" data-onboarding="indicator">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded bg-panel-alt px-2.5 py-1.5 text-xs text-text-primary hover:bg-panel-hover"
      >
        <span>지표 추가</span>
        <span className="text-text-muted">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-48 rounded border border-panel-border bg-panel-alt p-1 shadow-lg">
          <p className="px-2 py-1 text-[10px] font-bold uppercase text-text-muted">
            이동평균 (MA)
          </p>
          {MA_PERIODS.map((p) => (
            <label
              key={p}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-text-primary hover:bg-panel-hover"
            >
              <input
                type="checkbox"
                checked={activeMa.includes(p)}
                onChange={() => onToggleMa(p)}
                className="accent-accent"
              />
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: MA_COLORS[p] }}
              />
              <span>MA {p}</span>
            </label>
          ))}

          <div className="my-1 border-t border-panel-border" />
          <p className="px-2 py-1 text-[10px] font-bold uppercase text-text-muted">
            보조지표
          </p>
          {INDICATOR_IDS.map((id) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-text-primary hover:bg-panel-hover"
            >
              <input
                type="checkbox"
                checked={activeIndicators.includes(id)}
                onChange={() => onToggleIndicator(id)}
                className="accent-accent"
              />
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: INDICATOR_DOT[id] }}
              />
              <span>{INDICATOR_LABELS[id]}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/** 바깥 클릭 시 닫기 훅. */
function useOutsideClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}
