"use client";

import { useEffect, useRef, useState } from "react";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { useChartRefs } from "./ChartRefContext";
import { useChartStore } from "@/stores/chartStore";
import { ichimoku } from "@/lib/indicators";
import type { IchimokuResult } from "@/lib/indicators";
import { ICHIMOKU_COLORS } from "@/lib/types";
import { Z_LAYER } from "@/lib/zLayers";
import type { Candle } from "@/lib/types";

interface Breakout {
  key: string;
  x: number;
  /** 구름 경계 y 좌표 (CSS px). */
  y: number;
  dir: "up" | "down";
}

/**
 * 선행스팬 A/B 사이 구름을 canvas에 그린다.
 * 교차 구간은 색이 바뀌므로 삼각형 2개로 분할 처리.
 */
function drawCloud(
  canvas: HTMLCanvasElement,
  chart: IChartApi,
  candleSeries: ISeriesApi<"Candlestick">,
  ichi: IchimokuResult,
) {
  const parent = canvas.parentElement;
  if (!parent) return;
  const rect = parent.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  const dpr = window.devicePixelRatio || 1;

  const newW = Math.round(w * dpr);
  const newH = Math.round(h * dpr);
  if (canvas.width !== newW || canvas.height !== newH) {
    canvas.width = newW;
    canvas.height = newH;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // CSS 픽셀 좌표로 그리되 DPR 스케일로 선명하게.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // senkouB lookup (time → value).
  const bMap = new Map(ichi.senkouB.map((d) => [d.time as number, d.value]));
  const ts = chart.timeScale();

  // 화면 좌표 포인트 구성 (A·B가 모두 존재하는 시각만).
  const pts: { x: number; yA: number; yB: number }[] = [];
  for (const aPoint of ichi.senkouA) {
    const bVal = bMap.get(aPoint.time as number);
    if (bVal == null) continue;
    const x = ts.timeToCoordinate(aPoint.time);
    const yA = candleSeries.priceToCoordinate(aPoint.value);
    const yB = candleSeries.priceToCoordinate(bVal);
    if (x == null || yA == null || yB == null) continue;
    pts.push({ x, yA, yB });
  }

  if (pts.length < 2) return;

  ctx.save();
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];

    // 캔버스 바깥 구간 건너뜀.
    if ((p0.x < -2 && p1.x < -2) || (p0.x > w + 2 && p1.x > w + 2)) continue;

    // 화면 좌표: y 작을수록 위(가격 높음). A 위 = A>B 가격 = yA < yB.
    const aAbove0 = p0.yA < p0.yB;
    const aAbove1 = p1.yA < p1.yB;

    if (aAbove0 === aAbove1) {
      // 교차 없음 — 사각형 하나.
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.yA);
      ctx.lineTo(p1.x, p1.yA);
      ctx.lineTo(p1.x, p1.yB);
      ctx.lineTo(p0.x, p0.yB);
      ctx.closePath();
      ctx.fillStyle = aAbove0 ? ICHIMOKU_COLORS.cloudUp : ICHIMOKU_COLORS.cloudDown;
      ctx.fill();
    } else {
      // 교차점 계산: yA(t) == yB(t) 되는 t ∈ (0,1).
      const diff0 = p0.yA - p0.yB;
      const diff1 = p1.yA - p1.yB;
      const t = diff0 / (diff0 - diff1);
      const xCross = p0.x + t * (p1.x - p0.x);
      const yCross = p0.yA + t * (p1.yA - p0.yA);

      // p0 쪽 삼각형.
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.yA);
      ctx.lineTo(xCross, yCross);
      ctx.lineTo(p0.x, p0.yB);
      ctx.closePath();
      ctx.fillStyle = aAbove0 ? ICHIMOKU_COLORS.cloudUp : ICHIMOKU_COLORS.cloudDown;
      ctx.fill();

      // p1 쪽 삼각형.
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.yA);
      ctx.lineTo(xCross, yCross);
      ctx.lineTo(p1.x, p1.yB);
      ctx.closePath();
      ctx.fillStyle = aAbove1 ? ICHIMOKU_COLORS.cloudUp : ICHIMOKU_COLORS.cloudDown;
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * 구름 돌파 지점 감지.
 * - 상향 돌파: 전봉 종가가 구름 상단 이하 → 현봉 종가가 구름 상단 초과.
 * - 하향 돌파: 전봉 종가가 구름 하단 이상 → 현봉 종가가 구름 하단 미만.
 */
function detectBreakouts(
  chart: IChartApi,
  candleSeries: ISeriesApi<"Candlestick">,
  candles: Candle[],
  ichi: IchimokuResult,
): Breakout[] {
  const aMap = new Map(ichi.senkouA.map((d) => [d.time as number, d.value]));
  const bMap = new Map(ichi.senkouB.map((d) => [d.time as number, d.value]));
  const ts = chart.timeScale();
  const breakouts: Breakout[] = [];

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const ct = curr.time as number;
    const pt = prev.time as number;

    const currA = aMap.get(ct);
    const currB = bMap.get(ct);
    const prevA = aMap.get(pt);
    const prevB = bMap.get(pt);
    if (currA == null || currB == null || prevA == null || prevB == null) continue;

    const currTop = Math.max(currA, currB);
    const currBot = Math.min(currA, currB);
    const prevTop = Math.max(prevA, prevB);
    const prevBot = Math.min(prevA, prevB);

    const x = ts.timeToCoordinate(curr.time);
    if (x == null) continue;

    if (prev.close <= prevTop && curr.close > currTop) {
      // 상향 돌파 — 구름 위로 이탈.
      const y = candleSeries.priceToCoordinate(currTop);
      if (y != null) breakouts.push({ key: `up-${ct}`, x, y, dir: "up" });
    } else if (prev.close >= prevBot && curr.close < currBot) {
      // 하향 돌파 — 구름 아래로 이탈.
      const y = candleSeries.priceToCoordinate(currBot);
      if (y != null) breakouts.push({ key: `dn-${ct}`, x, y, dir: "down" });
    }
  }
  return breakouts;
}

/**
 * 일목균형표 구름 오버레이.
 * - canvas: 선행스팬 A·B 사이 구름 채움 (상승=청록, 하락=빨강).
 * - DOM: 구름 돌파 지점마다 ✈️ 이모지 마커 (애니메이션).
 */
export default function IchimokuCloudOverlay() {
  const { chart, candleSeries, ready } = useChartRefs();
  const candles = useChartStore((s) => s.candles);
  const activeIndicators = useChartStore((s) => s.activeIndicators);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [breakouts, setBreakouts] = useState<Breakout[]>([]);

  const isOn = activeIndicators.includes("ichimoku");

  useEffect(() => {
    const canvas = canvasRef.current;

    // 꺼졌거나 준비 안 됐으면 캔버스 지우고 마커 제거.
    if (!isOn || !chart || !candleSeries || !ready || candles.length === 0 || !canvas) {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setBreakouts([]);
      return;
    }

    // 일목균형표 계산 (순수 함수, 매 render마다 재계산).
    const ichi = ichimoku(candles);

    let raf = 0;
    const redraw = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        drawCloud(canvas, chart, candleSeries, ichi);
        setBreakouts(detectBreakouts(chart, candleSeries, candles, ichi));
      });
    };

    const ts = chart.timeScale();
    ts.subscribeVisibleLogicalRangeChange(redraw);
    window.addEventListener("resize", redraw);
    redraw();

    return () => {
      ts.unsubscribeVisibleLogicalRangeChange(redraw);
      window.removeEventListener("resize", redraw);
      if (raf) cancelAnimationFrame(raf);
      // 오버레이 해제 시 캔버스 클리어.
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setBreakouts([]);
    };
  }, [isOn, chart, candleSeries, ready, candles]);

  return (
    <>
      {/* 구름 캔버스 — 캔들 위 반투명 오버레이 (z:4). */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: Z_LAYER.ichimokuCloud }}
      />

      {/* 구름 돌파 ✈️ 마커 — 구름 경계에 위치, 펄스 애니메이션. */}
      {isOn &&
        breakouts.map((b) => (
          <div
            key={b.key}
            className="pointer-events-none absolute animate-pulse"
            title={b.dir === "up" ? "구름 상향 돌파" : "구름 하향 돌파"}
            style={{
              left: b.x,
              top: b.dir === "up" ? b.y - 28 : b.y + 4,
              zIndex: Z_LAYER.ichimokuCloud + 1,
              fontSize: 15,
              lineHeight: 1,
              transform: `translateX(-50%) rotate(${b.dir === "up" ? -45 : 135}deg)`,
              filter:
                b.dir === "up"
                  ? "drop-shadow(0 0 4px rgba(38,166,154,0.9))"
                  : "drop-shadow(0 0 4px rgba(239,83,80,0.9))",
            }}
          >
            ✈️
          </div>
        ))}
    </>
  );
}
