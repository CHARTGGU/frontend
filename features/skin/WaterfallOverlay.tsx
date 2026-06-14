"use client";

import { useEffect, useRef } from "react";
import { useSkinStore } from "@/stores/skinStore";
import { Z_LAYER } from "@/lib/zLayers";

/** 물줄기 1개. y는 줄기 머리(아래 끝) 위치. */
interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  width: number;
  alpha: number;
}

/** 하단 포말(스플래시) 입자 1개. */
interface Foam {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 → 0
  r: number;
}

/** 화면 폭 1줄기당 가로 간격(px). 작을수록 빽빽 → 비용↑. */
const COLUMN_PX = 9;

/** 전체 불투명도 — 낮출수록 뒤 배경/차트가 비쳐 보임. */
const WATER_ALPHA = 0.55;

/** 낙하 가속(px/frame²). 떨어질수록 빨라져 물처럼 보임. */
const GRAVITY = 0.35;

/**
 * 폭포수 효과 위젯 = 절차적 물줄기 파티클 (CLAUDE.md 위젯: 지표 바인딩 없음).
 *
 * FireOverlay와 대칭: 불은 바닥에서 위로 타오르고, 폭포는 위에서 아래로 쏟아진다.
 * 컨테이너는 항상 차트 전체를 덮고(투명), `waterfallHeight`는 컨테이너 크기가 아니라
 * "물 커튼이 화면 몇 %까지 닿는지"를 제어한다 → 그 선 부근에서 줄기는 포말로 부서지고
 * 재활용되어 어떤 높이에서도 자연스럽게 흩어진다.
 * z-index:0 — 배경 스킨 위, 차트 캔들(z-index:3)·지표 스킨 아래. FireOverlay와 동일 레이어.
 */
export default function WaterfallOverlay() {
  const waterfallEnabled = useSkinStore((s) => s.waterfallEnabled);
  const waterfallHeight = useSkinStore((s) => s.waterfallHeight);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 슬라이더 값은 ref로 읽어 애니메이션을 재시작하지 않고 매 프레임 반영.
  const heightRef = useRef(waterfallHeight);
  heightRef.current = waterfallHeight;

  useEffect(() => {
    if (!waterfallEnabled) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let drops: Drop[] = [];
    let foam: Foam[] = [];

    // 새 물줄기를 화면 위(음수 y)에서 생성. 굵기/속도/길이/투명도 랜덤 → 깊이감.
    const spawnDrop = (x: number, fromTop: boolean): Drop => {
      const speed = 6 + Math.random() * 7;
      return {
        x: x + (Math.random() - 0.5) * COLUMN_PX,
        y: fromTop ? -Math.random() * height : Math.random() * -40,
        len: 18 + Math.random() * 42,
        speed,
        width: 0.8 + Math.random() * 1.8,
        alpha: 0.25 + Math.random() * 0.55,
      };
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      width = rect.width;
      height = rect.height;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.max(1, Math.ceil(width / COLUMN_PX));
      drops = Array.from({ length: cols }, (_, i) =>
        spawnDrop(i * COLUMN_PX, true),
      );
      foam = [];
    };

    // 줄기가 커튼 하단에 닿으면 부서지는 포말 몇 알 생성.
    const splash = (x: number, y: number) => {
      const n = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        foam.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2.2,
          vy: -Math.random() * 2.5,
          life: 1,
          r: 0.8 + Math.random() * 1.6,
        });
      }
    };

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      const curtainY = (height * heightRef.current) / 100;

      // 물줄기 — 머리(밝음)→꼬리(투명) 세로 그라데이션 선.
      ctx.globalAlpha = WATER_ALPHA;
      ctx.lineCap = "round";
      for (const d of drops) {
        d.speed += GRAVITY;
        d.y += d.speed;

        const tailY = d.y - d.len;
        const grad = ctx.createLinearGradient(0, tailY, 0, d.y);
        grad.addColorStop(0, "rgba(190, 235, 255, 0)");
        grad.addColorStop(0.6, `rgba(150, 215, 255, ${d.alpha * 0.7})`);
        grad.addColorStop(1, `rgba(235, 250, 255, ${d.alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(d.x, tailY);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();

        // 커튼 하단 도달 → 포말 후 위로 재활용.
        if (d.y >= curtainY) {
          splash(d.x, curtainY);
          Object.assign(d, spawnDrop(d.x, false));
        }
      }

      // 포말 — 짧게 튀어오르며 사라지는 흰 입자.
      for (let i = foam.length - 1; i >= 0; i--) {
        const f = foam[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += GRAVITY * 0.5;
        f.life -= 0.04;
        if (f.life <= 0) {
          foam.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = WATER_ALPHA * f.life;
        ctx.fillStyle = "rgba(240, 252, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 커튼 하단 물안개 — 부서지는 선을 부드럽게 가려 끊김 방지.
      const mist = ctx.createLinearGradient(0, curtainY - 26, 0, curtainY + 14);
      mist.addColorStop(0, "rgba(210, 240, 255, 0)");
      mist.addColorStop(1, `rgba(210, 240, 255, ${WATER_ALPHA * 0.4})`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = mist;
      ctx.fillRect(0, curtainY - 26, width, 40);

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
  }, [waterfallEnabled]);

  if (!waterfallEnabled) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: Z_LAYER.waterfall }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
