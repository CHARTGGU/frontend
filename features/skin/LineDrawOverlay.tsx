"use client";

import { useEffect, useRef, useState } from "react";
import type { UTCTimestamp } from "lightweight-charts";
import { useSkinStore, type CustomLine } from "@/stores/skinStore";
import { Z_LAYER } from "@/lib/zLayers";
import { useDragHandle } from "@/lib/useDragHandle";
import { useChartOverlay } from "@/features/chart/useChartOverlay";
import { useChartRefs } from "@/features/chart/ChartRefContext";
import LineStylePicker from "./LineStylePicker";
import { getLineStyle, type LineStyleId } from "./lineStyles";

type Mode = "idle" | "picking" | "drawing";

interface DraftLine {
  styleId: LineStyleId;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface ScreenLine {
  line: CustomLine;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const MIN_DRAW_DISTANCE = 10;

/**
 * 커스텀 라인 그리기 위젯.
 * 좌상단 ✏️ 버튼 → 스타일 선택(고양이 꼬리/리본/번개/무지개) → 차트 위 드래그로 직선 생성.
 * 라인은 시간/가격(차트 좌표)으로 저장 — 줌/스크롤 시 priceToCoordinate/timeToCoordinate로 자동 재배치(CLAUDE.md §5).
 * 기존 라인 클릭 → 선택(끝점 핸들 + 스타일 변경 + 삭제), 바깥 클릭 → 선택/모드 해제.
 */
export default function LineDrawOverlay() {
  const customLines = useSkinStore((s) => s.customLines);
  const addCustomLine = useSkinStore((s) => s.addCustomLine);
  const updateCustomLine = useSkinStore((s) => s.updateCustomLine);
  const removeCustomLine = useSkinStore((s) => s.removeCustomLine);
  const startDrag = useDragHandle();
  const { toCoord, ready } = useChartOverlay();
  const { chart, candleSeries } = useChartRefs();

  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [pendingStyle, setPendingStyle] = useState<LineStyleId | null>(null);
  const [draft, setDraft] = useState<DraftLine | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(e.target as Node)) {
        setSelectedId(null);
        setMode("idle");
        setPendingStyle(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  /** 픽셀 좌표 → 차트 좌표(시간/가격). 가시영역 밖이면 null. */
  const coordToTimePrice = (x: number, y: number) => {
    if (!chart || !candleSeries) return null;
    const time = chart.timeScale().coordinateToTime(x);
    const price = candleSeries.coordinateToPrice(y);
    if (time === null || price === null) return null;
    return { time: time as UTCTimestamp, price };
  };

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "drawing" || !pendingStyle) return;
    e.preventDefault();

    const rect = containerRef.current!.getBoundingClientRect();
    const x1 = e.clientX - rect.left;
    const y1 = e.clientY - rect.top;
    setDraft({ styleId: pendingStyle, x1, y1, x2: x1, y2: y1 });

    const handleMove = (ev: PointerEvent) => {
      setDraft((d) =>
        d ? { ...d, x2: ev.clientX - rect.left, y2: ev.clientY - rect.top } : d,
      );
    };
    const handleUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      const x2 = ev.clientX - rect.left;
      const y2 = ev.clientY - rect.top;
      if (Math.hypot(x2 - x1, y2 - y1) >= MIN_DRAW_DISTANCE) {
        const p1 = coordToTimePrice(x1, y1);
        const p2 = coordToTimePrice(x2, y2);
        if (p1 && p2) {
          const id = crypto.randomUUID();
          addCustomLine({
            id,
            styleId: pendingStyle,
            time1: p1.time,
            price1: p1.price,
            time2: p2.time,
            price2: p2.price,
          });
          setSelectedId(id);
        }
      }
      setDraft(null);
      setMode("idle");
      setPendingStyle(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  if (!ready || !chart || !candleSeries) return null;

  // 각 라인을 화면 픽셀로 변환 — 한쪽 끝이라도 가시영역 밖(null)이면 숨김.
  const screenLines: ScreenLine[] = [];
  for (const line of customLines) {
    const p1 = toCoord(line.time1, line.price1);
    const p2 = toCoord(line.time2, line.price2);
    if (!p1 || !p2) continue;
    screenLines.push({ line, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  }

  const selected = screenLines.find((s) => s.line.id === selectedId) ?? null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: Z_LAYER.lineDrawing }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        style={{
          pointerEvents: mode === "drawing" ? "auto" : "none",
          cursor: mode === "drawing" ? "crosshair" : "default",
        }}
        onPointerDown={handleSvgPointerDown}
      >
        {screenLines.map(({ line, x1, y1, x2, y2 }) => {
          const style = getLineStyle(line.styleId);
          return (
            <g key={line.id} style={{ pointerEvents: "auto" }}>
              {style.render({ id: line.id, x1, y1, x2, y2 }, line.id === selectedId, (e) => {
                e.stopPropagation();
                setSelectedId(line.id);
                setMode("idle");
                setPendingStyle(null);
              })}
            </g>
          );
        })}
        {draft && (
          <g style={{ pointerEvents: "none", opacity: 0.7 }}>
            {getLineStyle(draft.styleId).render(
              { id: "draft", x1: draft.x1, y1: draft.y1, x2: draft.x2, y2: draft.y2 },
              false,
            )}
          </g>
        )}
      </svg>

      <button
        data-export-ignore="true"
        onClick={() => {
          setSelectedId(null);
          setMode((m) => (m === "idle" ? "picking" : "idle"));
          setPendingStyle(null);
        }}
        style={{ pointerEvents: "auto", position: "absolute", left: 8, top: 8 }}
        className="rounded bg-panel-alt p-1.5 text-sm shadow hover:bg-panel-hover"
        title="라인 그리기"
      >
        ✏️
      </button>

      {mode === "picking" && (
        <div
          data-export-ignore="true"
          style={{ pointerEvents: "auto", position: "absolute", left: 8, top: 44 }}
        >
          <LineStylePicker
            onSelect={(styleId) => {
              setPendingStyle(styleId);
              setMode("drawing");
            }}
          />
        </div>
      )}

      {selected && (
        <LineEditControls
          screen={selected}
          startDrag={startDrag}
          coordToTimePrice={coordToTimePrice}
          onUpdate={(patch) => updateCustomLine(selected.line.id, patch)}
          onStyleChange={(styleId) => updateCustomLine(selected.line.id, { styleId })}
          onDelete={() => {
            removeCustomLine(selected.line.id);
            setSelectedId(null);
          }}
        />
      )}
    </div>
  );
}

function LineEditControls({
  screen,
  startDrag,
  coordToTimePrice,
  onUpdate,
  onStyleChange,
  onDelete,
}: {
  screen: ScreenLine;
  startDrag: ReturnType<typeof useDragHandle>;
  coordToTimePrice: (x: number, y: number) => { time: UTCTimestamp; price: number } | null;
  onUpdate: (patch: Partial<CustomLine>) => void;
  onStyleChange: (styleId: LineStyleId) => void;
  onDelete: () => void;
}) {
  const handlePointPointerDown =
    (point: "start" | "end") => (e: React.PointerEvent) => {
      const origin =
        point === "start" ? { x: screen.x1, y: screen.y1 } : { x: screen.x2, y: screen.y2 };
      startDrag(e, (dx, dy) => {
        const next = coordToTimePrice(origin.x + dx, origin.y + dy);
        if (!next) return;
        if (point === "start") onUpdate({ time1: next.time, price1: next.price });
        else onUpdate({ time2: next.time, price2: next.price });
      });
    };

  const midX = (screen.x1 + screen.x2) / 2;
  const midY = (screen.y1 + screen.y2) / 2;

  return (
    <>
      {[
        { x: screen.x1, y: screen.y1, point: "start" as const },
        { x: screen.x2, y: screen.y2, point: "end" as const },
      ].map(({ x, y, point }) => (
        <div
          key={point}
          data-export-ignore="true"
          onPointerDown={handlePointPointerDown(point)}
          style={{
            position: "absolute",
            left: x - 6,
            top: y - 6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#f5d76e",
            border: "1px solid #8b5e34",
            cursor: "move",
            pointerEvents: "auto",
          }}
        />
      ))}

      <div
        data-export-ignore="true"
        style={{
          position: "absolute",
          left: midX,
          top: midY - 48,
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <LineStylePicker onSelect={onStyleChange} />
        <button
          onClick={onDelete}
          className="rounded bg-down px-2 py-1 text-xs text-white hover:opacity-80"
          title="삭제"
        >
          ×
        </button>
      </div>
    </>
  );
}
