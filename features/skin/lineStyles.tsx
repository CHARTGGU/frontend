"use client";

import { computeLineGeometry } from "@/lib/lineGeometry";

export type LineStyleId = "cat-tail" | "ribbon" | "lightning" | "rainbow";

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

function renderCatTail(
  line: LineGeometryPoints,
  isSelected: boolean,
  onPointerDown?: LinePointerHandler
) {
  const { x1, y1, x2, y2 } = line;
  const { perpX, perpY } = computeLineGeometry(line);
  const baseHalf = 5;
  const tipHalf = 1;

  const p1a = { x: x1 + perpX * baseHalf, y: y1 + perpY * baseHalf };
  const p1b = { x: x1 - perpX * baseHalf, y: y1 - perpY * baseHalf };
  const p2a = { x: x2 + perpX * tipHalf, y: y2 + perpY * tipHalf };
  const p2b = { x: x2 - perpX * tipHalf, y: y2 - perpY * tipHalf };

  const points = `${p1a.x},${p1a.y} ${p2a.x},${p2a.y} ${p2b.x},${p2b.y} ${p1b.x},${p1b.y}`;

  // 3 stripes at t = 0.25, 0.45, 0.65 — darker brown lines across the tail, tapering width with t
  const stripes = [0.25, 0.45, 0.65].map((t) => {
    const cx = x1 + (x2 - x1) * t;
    const cy = y1 + (y2 - y1) * t;
    const half = baseHalf + (tipHalf - baseHalf) * t;
    return {
      x1: cx + perpX * half,
      y1: cy + perpY * half,
      x2: cx - perpX * half,
      y2: cy - perpY * half,
    };
  });

  // 3 fluffy tuft circles near the tip, slightly overlapping, radius ~2-2.5px, centered around point2
  const tufts = [
    { dx: 0, dy: 0, r: 2.5 },
    { dx: perpX * 2, dy: perpY * 2, r: 2 },
    { dx: -perpX * 2, dy: -perpY * 2, r: 2 },
  ];

  return (
    <>
      {isSelected && <SelectionHalo line={line} />}
      <polygon points={points} fill="#D98E4A" />
      {stripes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#A8612A" strokeWidth={1} />
      ))}
      {tufts.map((t, i) => (
        <circle key={i} cx={x2 + t.dx} cy={y2 + t.dy} r={t.r} fill="#D98E4A" />
      ))}
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

const LIGHTNING_JITTER = [0, -8, 6, -10, 0];

function renderLightning(
  line: LineGeometryPoints,
  isSelected: boolean,
  onPointerDown?: LinePointerHandler
) {
  const { x1, y1, x2, y2 } = line;
  const { perpX, perpY } = computeLineGeometry(line);

  const segments = LIGHTNING_JITTER.length - 1;
  const points = LIGHTNING_JITTER.map((jitter, i) => {
    const t = i / segments;
    const baseX = x1 + (x2 - x1) * t;
    const baseY = y1 + (y2 - y1) * t;
    return `${baseX + perpX * jitter},${baseY + perpY * jitter}`;
  }).join(" ");

  return (
    <>
      {isSelected && <SelectionHalo line={line} />}
      <polyline
        points={points}
        fill="none"
        stroke="#FFE14D"
        strokeWidth={6}
        strokeOpacity={0.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#FFE14D"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

export const LINE_STYLES: LineStyleMeta[] = [
  { id: "cat-tail", name: "고양이 꼬리", render: renderCatTail },
  { id: "ribbon", name: "리본", render: renderRibbon },
  { id: "lightning", name: "번개", render: renderLightning },
  { id: "rainbow", name: "무지개", render: renderRainbow },
];

export function getLineStyle(id: LineStyleId): LineStyleMeta {
  return LINE_STYLES.find((s) => s.id === id) ?? LINE_STYLES[0];
}
