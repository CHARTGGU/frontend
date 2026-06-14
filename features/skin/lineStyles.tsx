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

function renderBasic(
  line: LineGeometryPoints,
  _isSelected: boolean,
  onPointerDown?: LinePointerHandler
) {
  const { x1, y1, x2, y2 } = line;

  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E5E5E5" strokeWidth={3} strokeLinecap="round" />
      <HitStroke line={line} onPointerDown={onPointerDown} />
    </>
  );
}

function renderRibbon(
  line: LineGeometryPoints,
  _isSelected: boolean,
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

/** 라인을 따라 점멸·확대되는 8각 별 반짝임. */
function Sparkle({
  cx,
  cy,
  size,
  color,
  delay,
  dur,
}: {
  cx: number;
  cy: number;
  size: number;
  color: string;
  delay: number;
  dur: number;
}) {
  const inner = size * 0.35;
  const path = `M0,${-size} L${inner},${-inner} L${size},0 L${inner},${inner} L0,${size} L${-inner},${inner} L${-size},0 L${-inner},${-inner} Z`;

  return (
    <g transform={`translate(${cx} ${cy})`} style={{ pointerEvents: "none" }} opacity={0}>
      <path d={path} fill={color}>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="0.2;1.3;0.2"
          keyTimes="0;0.5;1"
          dur={`${dur}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0"
          to="360"
          dur={`${dur * 2}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
          additive="sum"
        />
      </path>
      <animate
        attributeName="opacity"
        values="0;1;0"
        keyTimes="0;0.5;1"
        dur={`${dur}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </g>
  );
}

const SPARKLE_COLORS = ["#FFFFFF", "#FFE14D", "#FF8FB1", "#4DDC74", "#4D9DFF", "#FF9F4D", "#A14DFF"];

// 라인을 따라 분포한 반짝임 위치(t)와 라인 측면(side), 크기/색상/박자/지속시간을 고정 시드로 정의.
const SPARKLE_SEEDS = [
  { t: 0.04, side: 1, offset: 6, size: 3, delay: 0, dur: 1.5 },
  { t: 0.16, side: -1, offset: 8, size: 4, delay: 0.6, dur: 1.8 },
  { t: 0.28, side: 1, offset: 5, size: 2.5, delay: 1.1, dur: 1.3 },
  { t: 0.4, side: -1, offset: 7, size: 4.5, delay: 0.3, dur: 2 },
  { t: 0.52, side: 1, offset: 6, size: 3, delay: 1.4, dur: 1.6 },
  { t: 0.64, side: -1, offset: 8, size: 3.5, delay: 0.8, dur: 1.7 },
  { t: 0.76, side: 1, offset: 5, size: 2.5, delay: 0.2, dur: 1.4 },
  { t: 0.88, side: -1, offset: 7, size: 4, delay: 1.2, dur: 1.9 },
];

/** 라인을 따라 점멸하는 작은 흰색 십자(+) 반짝임. */
function CrossSparkle({
  cx,
  cy,
  size,
  delay,
  dur,
}: {
  cx: number;
  cy: number;
  size: number;
  delay: number;
  dur: number;
}) {
  return (
    <g transform={`translate(${cx} ${cy})`} style={{ pointerEvents: "none" }} opacity={0}>
      <line x1={0} y1={-size} x2={0} y2={size} stroke="white" strokeWidth={1} strokeLinecap="round" />
      <line x1={-size} y1={0} x2={size} y2={0} stroke="white" strokeWidth={1} strokeLinecap="round" />
      <animate
        attributeName="opacity"
        values="0;1;0"
        keyTimes="0;0.5;1"
        dur={`${dur}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </g>
  );
}

const CROSS_SPARKLE_SEEDS = [
  { t: 0.1, side: 1, offset: 11, size: 2.5, delay: 0, dur: 1.6 },
  { t: 0.35, side: -1, offset: 9, size: 2, delay: 0.5, dur: 1.9 },
  { t: 0.6, side: 1, offset: 10, size: 2.5, delay: 1, dur: 1.4 },
  { t: 0.85, side: -1, offset: 11, size: 2, delay: 0.3, dur: 1.7 },
];

/** 라인을 따라 좌→우로만 흐르는 빛나는 점(코멧). */
function Comet({
  x1,
  y1,
  x2,
  y2,
  glowId,
  color,
  dur,
  begin,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  glowId: string;
  color: string;
  dur: number;
  begin: number;
}) {
  const left = x1 <= x2 ? { x: x1, y: y1 } : { x: x2, y: y2 };
  const right = x1 <= x2 ? { x: x2, y: y2 } : { x: x1, y: y1 };

  return (
    <circle r={3} fill={color} filter={`url(#${glowId})`} style={{ pointerEvents: "none" }}>
      <animateMotion
        path={`M${left.x},${left.y} L${right.x},${right.y}`}
        dur={`${dur}s`}
        begin={`${begin}s`}
        repeatCount="indefinite"
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.08;0.92;1"
        dur={`${dur}s`}
        begin={`${begin}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}

function renderRainbow(
  line: LineGeometryPoints,
  _isSelected: boolean,
  onPointerDown?: LinePointerHandler
) {
  const { x1, y1, x2, y2 } = line;
  const { perpX, perpY } = computeLineGeometry(line);
  const gradientId = `line-rainbow-${line.id}`;
  const glowId = `line-rainbow-glow-${line.id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0%" stopColor="#FF4D4D" />
          <stop offset="20%" stopColor="#FF9F4D" />
          <stop offset="40%" stopColor="#FFE14D" />
          <stop offset="60%" stopColor="#4DDC74" />
          <stop offset="80%" stopColor="#4D9DFF" />
          <stop offset="100%" stopColor="#A14DFF" />
        </linearGradient>
        <filter id={glowId} x="-75%" y="-75%" width="250%" height="250%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* neon glow */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={`url(#${gradientId})`}
        strokeWidth={6}
        strokeOpacity={0.45}
        strokeLinecap="round"
        filter={`url(#${glowId})`}
      />
      {/* slightly translucent core */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        strokeOpacity={0.8}
        strokeLinecap="round"
      />
      {SPARKLE_SEEDS.map((s, i) => (
        <Sparkle
          key={i}
          cx={x1 + (x2 - x1) * s.t + perpX * s.offset * s.side}
          cy={y1 + (y2 - y1) * s.t + perpY * s.offset * s.side}
          size={s.size}
          color={SPARKLE_COLORS[i % SPARKLE_COLORS.length]}
          delay={s.delay}
          dur={s.dur}
        />
      ))}
      {CROSS_SPARKLE_SEEDS.map((s, i) => (
        <CrossSparkle
          key={i}
          cx={x1 + (x2 - x1) * s.t + perpX * s.offset * s.side}
          cy={y1 + (y2 - y1) * s.t + perpY * s.offset * s.side}
          size={s.size}
          delay={s.delay}
          dur={s.dur}
        />
      ))}
      <Comet x1={x1} y1={y1} x2={x2} y2={y2} glowId={glowId} color="#FFFFFF" dur={3} begin={0} />
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
