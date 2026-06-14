"use client";

import { useEffect, useRef, useState } from "react";
import { useSkinStore, type CustomLine } from "@/stores/skinStore";
import { Z_LAYER } from "@/lib/zLayers";
import { useDragHandle } from "@/lib/useDragHandle";
import LineStylePicker from "./LineStylePicker";
import { getLineStyle, type LineStyleId } from "./lineStyles";

type Mode = "idle" | "picking" | "drawing";

const MIN_DRAW_DISTANCE = 10;

/**
 * 커스텀 라인 그리기 위젯.
 * 좌상단 ✏️ 버튼 → 스타일 선택(고양이 꼬리/리본/번개/무지개) → 차트 위 드래그로 직선 생성.
 * 기존 라인 클릭 → 선택(끝점 핸들 + 스타일 변경 + 삭제), 바깥 클릭 → 선택/모드 해제.
 */
export default function LineDrawOverlay() {
  const customLines = useSkinStore((s) => s.customLines);
  const addCustomLine = useSkinStore((s) => s.addCustomLine);
  const updateCustomLine = useSkinStore((s) => s.updateCustomLine);
  const removeCustomLine = useSkinStore((s) => s.removeCustomLine);
  const startDrag = useDragHandle();

  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [pendingStyle, setPendingStyle] = useState<LineStyleId | null>(null);
  const [draft, setDraft] = useState<CustomLine | null>(null);
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

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "drawing" || !pendingStyle) return;
    e.preventDefault();

    const rect = containerRef.current!.getBoundingClientRect();
    const x1 = e.clientX - rect.left;
    const y1 = e.clientY - rect.top;
    setDraft({ id: "draft", styleId: pendingStyle, x1, y1, x2: x1, y2: y1 });

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
        const id = crypto.randomUUID();
        addCustomLine({ id, styleId: pendingStyle, x1, y1, x2, y2 });
        setSelectedId(id);
      }
      setDraft(null);
      setMode("idle");
      setPendingStyle(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const selectedLine = customLines.find((l) => l.id === selectedId) ?? null;

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
        {customLines.map((line) => {
          const style = getLineStyle(line.styleId);
          return (
            <g key={line.id} style={{ pointerEvents: "auto" }}>
              {style.render(line, line.id === selectedId, (e) => {
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
            {getLineStyle(draft.styleId).render(draft, false)}
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

      {selectedLine && (
        <LineEditControls
          line={selectedLine}
          startDrag={startDrag}
          onUpdate={(patch) => updateCustomLine(selectedLine.id, patch)}
          onStyleChange={(styleId) => updateCustomLine(selectedLine.id, { styleId })}
          onDelete={() => {
            removeCustomLine(selectedLine.id);
            setSelectedId(null);
          }}
        />
      )}
    </div>
  );
}

function LineEditControls({
  line,
  startDrag,
  onUpdate,
  onStyleChange,
  onDelete,
}: {
  line: CustomLine;
  startDrag: ReturnType<typeof useDragHandle>;
  onUpdate: (patch: Partial<CustomLine>) => void;
  onStyleChange: (styleId: LineStyleId) => void;
  onDelete: () => void;
}) {
  const handlePointPointerDown =
    (point: "start" | "end") => (e: React.PointerEvent) => {
      const start = { ...line };
      startDrag(e, (dx, dy) => {
        if (point === "start") onUpdate({ x1: start.x1 + dx, y1: start.y1 + dy });
        else onUpdate({ x2: start.x2 + dx, y2: start.y2 + dy });
      });
    };

  const midX = (line.x1 + line.x2) / 2;
  const midY = (line.y1 + line.y2) / 2;

  return (
    <>
      {[
        { x: line.x1, y: line.y1, point: "start" as const },
        { x: line.x2, y: line.y2, point: "end" as const },
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
