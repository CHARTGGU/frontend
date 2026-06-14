"use client";

import { useEffect, useRef } from "react";
import { useSkinStore } from "@/stores/skinStore";
import { Z_LAYER } from "@/lib/zLayers";

/** Doom Fire 37색 팔레트 (검정 → 빨강 → 주황 → 노랑 → 흰색). */
const FIRE_PALETTE: readonly [number, number, number][] = [
  [0x07, 0x07, 0x07], [0x1f, 0x07, 0x07], [0x2f, 0x0f, 0x07], [0x47, 0x0f, 0x07],
  [0x57, 0x17, 0x07], [0x67, 0x1f, 0x07], [0x77, 0x1f, 0x07], [0x8f, 0x27, 0x07],
  [0x9f, 0x2f, 0x07], [0xaf, 0x3f, 0x07], [0xbf, 0x47, 0x07], [0xc7, 0x47, 0x07],
  [0xdf, 0x4f, 0x07], [0xdf, 0x57, 0x07], [0xdf, 0x57, 0x07], [0xd7, 0x5f, 0x07],
  [0xd7, 0x5f, 0x07], [0xd7, 0x67, 0x0f], [0xcf, 0x6f, 0x0f], [0xcf, 0x77, 0x0f],
  [0xcf, 0x7f, 0x0f], [0xcf, 0x87, 0x17], [0xc7, 0x87, 0x17], [0xc7, 0x8f, 0x17],
  [0xc7, 0x97, 0x1f], [0xbf, 0x9f, 0x1f], [0xbf, 0x9f, 0x1f], [0xbf, 0xa7, 0x27],
  [0xbf, 0xa7, 0x27], [0xbf, 0xaf, 0x2f], [0xb7, 0xaf, 0x2f], [0xb7, 0xb7, 0x2f],
  [0xb7, 0xb7, 0x37], [0xcf, 0xcf, 0x6f], [0xdf, 0xdf, 0x9f], [0xef, 0xef, 0xc7],
  [0xff, 0xff, 0xff],
];

const MAX_INDEX = FIRE_PALETTE.length - 1; // 36

/** 시뮬 셀 1칸이 차지하는 화면 픽셀. 작을수록 곱지만 비용↑ (도트감 ↓). */
const CELL_PX = 5;

/** 전체 불투명도 — 낮출수록 뒤 배경 스킨이 비쳐 보임. */
const FIRE_ALPHA = 0.8;

/**
 * 불타는 효과 위젯 = Doom Fire 알고리즘 (CLAUDE.md 위젯: 지표 바인딩 없음).
 *
 * 컨테이너는 항상 차트 전체 높이를 덮고(투명), `fireHeight`는 컨테이너 크기가 아니라
 * "불꽃이 몇 행까지 타오르는지"를 감쇄율로 제어한다 → 불꽃은 그 위 투명 영역으로
 * 자연스럽게 사그라들어 어떤 높이에서도 윗부분이 잘리지 않는다(클립 방지).
 * 저해상도 버퍼를 오프스크린에 그린 뒤 smoothing 업스케일 + 블러 + 반투명(FIRE_ALPHA)으로 렌더.
 * z-index:0 — 배경 스킨(auto, DOM 먼저) 위, 차트 캔버스(z-index:3)·지표 스킨(IndicatorOverlay, DOM 나중) 아래.
 */
export default function FireOverlay() {
  const fireEnabled = useSkinStore((s) => s.fireEnabled);
  const fireHeight = useSkinStore((s) => s.fireHeight);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 슬라이더 값은 ref로 읽어 시뮬을 재시작하지 않고 매 프레임 반영.
  const fireHeightRef = useRef(fireHeight);
  fireHeightRef.current = fireHeight;

  useEffect(() => {
    if (!fireEnabled) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 저해상도 시뮬을 부드럽게 업스케일하기 위한 오프스크린 버퍼.
    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d");
    if (!bctx) return;

    let cols = 0;
    let rows = 0;
    let pixels = new Uint8Array(0);
    let image: ImageData = bctx.createImageData(1, 1);

    // 컨테이너(차트 전체) 크기에 맞춰 격자/캔버스 재구성. 바닥행은 항상 max로 시드.
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      cols = Math.max(1, Math.ceil(width / CELL_PX));
      rows = Math.max(2, Math.ceil(height / CELL_PX));
      pixels = new Uint8Array(cols * rows);
      for (let x = 0; x < cols; x++) pixels[(rows - 1) * cols + x] = MAX_INDEX;

      buffer.width = cols;
      buffer.height = rows;
      image = bctx.createImageData(cols, rows);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.globalAlpha = FIRE_ALPHA; // 반투명 → 뒤 배경 비침
      // 도트/노이즈 제거용 가우시안 블러(백킹 px 기준).
      ctx.filter = `blur(${Math.max(1, dpr * 2)}px)`;
    };

    // 한 칸 위 행의 좌우로 흔들린 칸으로 강도를 감쇄 전파. decaySpan은 불 높이에 적응.
    const spreadFire = (x: number, y: number, decaySpan: number) => {
      const src = y * cols + x;
      const pixel = pixels[src];
      if (pixel === 0) {
        pixels[src - cols] = 0;
        return;
      }
      const decay = Math.floor(Math.random() * decaySpan);
      const wind = Math.floor(Math.random() * 3) - 1; // -1|0|1, 감쇄와 분리해 좌우 쏠림 방지
      const dstX = Math.min(cols - 1, Math.max(0, x + wind));
      pixels[(y - 1) * cols + dstX] = Math.max(0, pixel - decay);
    };

    let raf = 0;
    const tick = () => {
      // 불꽃이 (fireHeight% × 전체행) 부근에서 0이 되도록 평균 감쇄량을 매 프레임 산출.
      // 0.9 → 목표 도달 전에 사그라들어 윗선이 부드럽게 페이드.
      const flameRows = Math.max(2, (rows * fireHeightRef.current) / 100);
      const decaySpan = (2 * MAX_INDEX) / (flameRows * 0.9) + 1;

      for (let x = 0; x < cols; x++) {
        for (let y = 1; y < rows; y++) spreadFire(x, y, decaySpan);
      }

      for (let i = 0; i < pixels.length; i++) {
        const v = pixels[i];
        const [r, g, b] = FIRE_PALETTE[v];
        const o = i * 4;
        image.data[o] = r;
        image.data[o + 1] = g;
        image.data[o + 2] = b;
        // 낮은 강도일수록 투명 → 화염 끝이 도트 대신 부드럽게 사라짐.
        image.data[o + 3] = Math.min(255, v * 36);
      }
      bctx.putImageData(image, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(buffer, 0, 0, cols, rows, 0, 0, canvas.width, canvas.height);

      raf = requestAnimationFrame(tick);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [fireEnabled]);

  if (!fireEnabled) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: Z_LAYER.fire }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
