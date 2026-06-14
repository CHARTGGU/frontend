"use client";

import { useEffect, useRef } from "react";
import { useSkinStore } from "@/stores/skinStore";

const FIRE_WIDTH = 80;
const FIRE_HEIGHT = 40;

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

/**
 * 불타는 효과 위젯 = Doom Fire 알고리즘 (CLAUDE.md 위젯: 지표 바인딩 없음).
 * 저해상도(80x40) 픽셀 버퍼를 매 프레임 아래→위로 전파시키며 canvas에 렌더.
 * z-index:1 — 배경 스킨(auto) 위, 차트 캔버스(z-index:3) 아래 (CatOverlay의 z-index:4 대비).
 */
export default function FireOverlay() {
  const fireEnabled = useSkinStore((s) => s.fireEnabled);
  const fireHeight = useSkinStore((s) => s.fireHeight);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fireEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = FIRE_WIDTH;
    canvas.height = FIRE_HEIGHT;

    // 맨 아래 행은 항상 최대 강도로 시드, 나머지는 0(투명)에서 시작.
    const pixels = new Uint8Array(FIRE_WIDTH * FIRE_HEIGHT);
    for (let x = 0; x < FIRE_WIDTH; x++) {
      pixels[(FIRE_HEIGHT - 1) * FIRE_WIDTH + x] = MAX_INDEX;
    }

    const image = ctx.createImageData(FIRE_WIDTH, FIRE_HEIGHT);

    // 한 칸 위 행의 같은(또는 좌우로 흔들린) 칸으로 강도를 감쇄 전파.
    // x, y를 명시적으로 받아 edge 칼럼 wraparound 방지.
    const spreadFire = (x: number, y: number) => {
      const src = y * FIRE_WIDTH + x;
      const pixel = pixels[src];
      if (pixel === 0) {
        pixels[src - FIRE_WIDTH] = 0;
        return;
      }
      const decay = Math.floor(Math.random() * 3); // 0|1|2
      const dstX = Math.min(FIRE_WIDTH - 1, Math.max(0, x - decay + 1));
      pixels[(y - 1) * FIRE_WIDTH + dstX] = pixel - (decay & 1); // 0 또는 1만큼 감쇄
    };

    let raf = 0;
    const tick = () => {
      for (let x = 0; x < FIRE_WIDTH; x++) {
        for (let y = 1; y < FIRE_HEIGHT; y++) {
          spreadFire(x, y);
        }
      }

      for (let i = 0; i < pixels.length; i++) {
        const [r, g, b] = FIRE_PALETTE[pixels[i]];
        const o = i * 4;
        image.data[o] = r;
        image.data[o + 1] = g;
        image.data[o + 2] = b;
        image.data[o + 3] = pixels[i] === 0 ? 0 : 255;
      }
      ctx.putImageData(image, 0, 0);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [fireEnabled]);

  if (!fireEnabled) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
      style={{ height: `${fireHeight}%`, zIndex: 1 }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
