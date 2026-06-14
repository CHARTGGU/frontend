"use client";

import { computeLineGeometry } from "@/lib/lineGeometry";

export type LineStyleId = "basic" | "ribbon" | "rainbow";

export interface LineGeometryPoints {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type LinePointerHandler = (e: React.PointerEvent<SVGElement>) => void;

export interface LineStyleMeta {
  id: LineStyleId;
  name: string;
  render: (
    line: LineGeometryPoints,
    isSelected: boolean,
    onPointerDown?: LinePointerHandler
  ) => React.ReactNode;
}

/** 클릭 판정용 투명 두꺼운 스트로크. */
function HitStroke({
  line,
  onPointerDown,
}: {
  line: LineGeometryPoints;
  onPointerDown?: LinePointerHandler;
}) {
  return (
    <line
      x1={line.x1}
      y1={line.y1}
      x2={line.x2}
      y2={line.y2}
      stroke="transparent"
      strokeWidth={14}
      style={{ pointerEvents: "stroke", cursor: "pointer" }}
      onPointerDown={onPointerDown}
    />
  );
}

/** 선택 시 표시되는 부드러운 흰색 하이라이트. */
function SelectionHalo({ line }: { line: LineGeometryPoints }) {
  return (
    <line
      x1={line.x1}
      y1={line.y1}
      x2={line.x2}
      y2={line.y2}
      stroke="white"
      strokeOpacity={0.25}
      strokeWidth={10}
      strokeLinecap="round"
      style={{ pointerEvents: "none" }}
    />
  );
}

function renderBasic(
  line: LineGeometryPoints,
  isSelected: boolean,
  onPointerDown?: LinePointerHandler
) {
  const { x1, y1, x2, y2 } = line;

  return (
    <>
      {isSelected && <SelectionHalo line={line} />}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E5E5E5" strokeWidth={3} strokeLinecap="round" />
      <HitStroke line={line} onPointerDown={onPointerDown} />
    </>
  );
}

function renderRibbon(
  line: LineGeometryPoints,
  isSelected: boolean,
  onPointerDown?: LinePointerHandler
) {
  const { x1, y1, x2, y2 } = line;
  const { perpX, perpY, angle } = computeLineGeometry(line);
  const half = 4;

  const p1a = { x: x1 + perpX * half, y: y1 + perpY * half };
  const p1b = { x: x1 - perpX * half, y: y1 - perpY * half };
  const p2a = { x: x2 + perpX * half, y: y2 + perpY * half };
  const p2b = { x: x2 - perpX * half, y: y2 - perpY * half };

  const points = `${p1a.x},${p1a.y} ${p2a.x},${p2a.y} ${p2b.x},${p2b.y} ${p1b.x},${p1b.y}`;

  return (
    <>
      {isSelected && <SelectionHalo line={line} />}
      <polygon points={points} fill="#FF8FB1" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={1} strokeDasharray="6 4" />
      {/* bow knot at point2, rotated to line angle */}
      <g transform={`translate(${x2}, ${y2}) rotate(${angle})`}>
        <polygon points="0,0 9,-5 9,5" fill="#FF6FA0" />
        <polygon points="0,0 -9,-5 -9,5" fill="#FF6FA0" />
        <circle cx={0} cy={0} r={2.5} fill="#FFC1D6" />
      </g>
      <HitStroke line={line} onPointerDown={onPointerDown} />
    </>
  );
}

function renderRainbow(
  line: LineGeometryPoints,
  isSelected: boolean,
  onPointerDown?: LinePointerHandler
) {
  const { x1, y1, x2, y2 } = line;
  const gradientId = `line-rainbow-${line.id}`;

  return (
    <>
      {isSelected && <SelectionHalo line={line} />}
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor="#FF4D4D" />
          <stop offset="20%" stopColor="#FF9F4D" />
          <stop offset="40%" stopColor="#FFE14D" />
          <stop offset="60%" stopColor="#4DDC74" />
          <stop offset="80%" stopColor="#4D9DFF" />
          <stop offset="100%" stopColor="#A14DFF" />
        </linearGradient>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${gradientId})`} strokeWidth={5} strokeLinecap="round" />
      <HitStroke line={line} onPointerDown={onPointerDown} />
    </>
  );
}

/** LINE_STYLES[0]("basic")이 기본 스타일 — getLineStyle의 fallback이자 picker의 첫 항목. */
export const LINE_STYLES: LineStyleMeta[] = [
  { id: "basic", name: "기본", render: renderBasic },
  { id: "ribbon", name: "리본", render: renderRibbon },
  { id: "rainbow", name: "무지개", render: renderRainbow },
];

export function getLineStyle(id: LineStyleId): LineStyleMeta {
  return LINE_STYLES.find((s) => s.id === id) ?? LINE_STYLES[0];
}
