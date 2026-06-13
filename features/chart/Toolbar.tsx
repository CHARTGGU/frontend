"use client";

import { useEffect, useRef, useState } from "react";
import {
  INTERVALS,
  MA_COLORS,
  MA_PERIODS,
  SYMBOLS,
  type SymbolId,
} from "@/lib/types";
import { useChartStore } from "@/stores/chartStore";
import ExportButton from "@/features/export/ExportButton";

/** 준비중인 보조지표 (메뉴 자리만 — 팀원이 채움). */
const SOON_INDICATORS = ["RSI", "볼린저밴드", "MACD"];

export default function Toolbar() {
  const symbol = useChartStore((s) => s.symbol);
  const interval = useChartStore((s) => s.interval);
  const activeMa = useChartStore((s) => s.activeMa);
  const setSymbol = useChartStore((s) => s.setSymbol);
  const setInterval = useChartStore((s) => s.setInterval);
  const toggleMa = useChartStore((s) => s.toggleMa);

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

      <IndicatorMenu activeMa={activeMa} onToggleMa={toggleMa} />

      <div className="ml-auto">
        <ExportButton />
      </div>
    </header>
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
    <div ref={ref} className="relative">
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
}: {
  activeMa: number[];
  onToggleMa: (p: (typeof MA_PERIODS)[number]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(() => setOpen(false));

  return (
    <div ref={ref} className="relative">
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
            오실레이터 (준비중)
          </p>
          {SOON_INDICATORS.map((name) => (
            <div
              key={name}
              className="flex cursor-not-allowed items-center justify-between rounded px-2 py-1 text-xs text-text-muted/50"
            >
              <span>{name}</span>
              <span className="text-[10px]">준비중</span>
            </div>
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
