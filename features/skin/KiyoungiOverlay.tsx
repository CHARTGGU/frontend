"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinate, UTCTimestamp } from "lightweight-charts";
import { useSkinStore } from "@/stores/skinStore";
import { useChartRefs } from "@/features/chart/ChartRefContext";
import { useChartOverlay } from "@/features/chart/useChartOverlay";
import { Z_LAYER } from "@/lib/zLayers";
import KiyoungiBody, { type KiyoungiBox } from "./KiyoungiBody";
import KiyoungiArm from "./KiyoungiArm";

type Part = "body" | "arm" | null;

/**
 * 기영이 위젯 컨테이너. 얼굴(KiyoungiBody) + 빛의검 팔(KiyoungiArm)을 렌더.
 * 본체 위치는 차트 좌표(time·price)에 앵커링 → 스크롤·줌 시 차트와 함께 이동(부적 스티커와 동일, CLAUDE.md §5).
 * - useChartOverlay: view 변경(스크롤/줌/리사이즈)마다 rAF throttle 재렌더 트리거.
 * - 미배치(time=null) 본체는 화면 중앙에 앵커를 부여.
 * - 팔은 본체 우하단 모서리 기준 상대 px 오프셋 → 본체 px만 잡히면 자동 추종.
 * - 파츠 클릭 시 선택(핸들 표시), 컨테이너 바깥 클릭 시 선택 해제.
 */
export default function KiyoungiOverlay() {
  const kiyoungiEnabled = useSkinStore((s) => s.kiyoungiEnabled);
  const body = useSkinStore((s) => s.kiyoungiBody);
  const setBody = useSkinStore((s) => s.setKiyoungiBody);
  const [selected, setSelected] = useState<Part>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { chart, candleSeries } = useChartRefs();
  // view 변경마다 리렌더 → 아래 toPx 재계산 (딱딱 따라붙음).
  const { ready } = useChartOverlay();

  /** 화면 px(좌상단) → 차트 앵커(time, price). 시간축 밖이면 null. */
  const toAnchor = useCallback(
    (xPx: number, yPx: number) => {
      if (!chart || !candleSeries) return null;
      const time = chart.timeScale().coordinateToTime(xPx as Coordinate);
      const price = candleSeries.coordinateToPrice(yPx as Coordinate);
      if (time === null || typeof time !== "number" || price === null) {
        return null;
      }
      return { time: time as number, price };
    },
    [chart, candleSeries],
  );

  /** 차트 앵커(time, price) → 화면 px(좌상단). 가시영역 밖이면 null. */
  const toPx = useCallback(
    (time: number, price: number) => {
      if (!chart || !candleSeries) return null;
      const x = chart.timeScale().timeToCoordinate(time as UTCTimestamp);
      const y = candleSeries.priceToCoordinate(price);
      if (x === null || y === null) return null;
      return { x: x as number, y: y as number };
    },
    [chart, candleSeries],
  );

  // 미배치 본체 → 차트 중앙(상단 40%)에 앵커 부여.
  useEffect(() => {
    if (!kiyoungiEnabled || !ready) return;
    if (body.time !== null && body.price !== null) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const anchor = toAnchor(rect.width / 2, rect.height * 0.4);
    if (anchor) setBody(anchor);
  }, [kiyoungiEnabled, ready, body.time, body.price, toAnchor, setBody]);

  // 컨테이너 바깥(차트 등) 클릭 → 선택 해제.
  useEffect(() => {
    if (!kiyoungiEnabled) return;
    const handlePointerDown = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(e.target as Node)) {
        setSelected(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [kiyoungiEnabled]);

  if (!kiyoungiEnabled) return null;

  // 미배치거나 가시영역 밖이면 숨김 (다음 view에서 다시 표시).
  const px =
    body.time !== null && body.price !== null
      ? toPx(body.time, body.price)
      : null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: Z_LAYER.kiyoungi }}
    >
      {px && (
        <>
          <KiyoungiBody
            box={{ x: px.x, y: px.y, width: body.width, height: body.height }}
            selected={selected === "body"}
            onSelect={() => setSelected("body")}
            onCommit={(next: KiyoungiBox) => {
              const anchor = toAnchor(next.x, next.y);
              setBody(
                anchor
                  ? { ...anchor, width: next.width, height: next.height }
                  : { width: next.width, height: next.height },
              );
            }}
          />
          <KiyoungiArm
            body={{ x: px.x, y: px.y, width: body.width, height: body.height }}
            selected={selected === "arm"}
            onSelect={() => setSelected("arm")}
          />
        </>
      )}
    </div>
  );
}
