"use client";

import { useEffect, useRef, useState } from "react";
import { useSkinStore } from "@/stores/skinStore";
import { Z_LAYER } from "@/lib/zLayers";
import KiyoungiBody from "./KiyoungiBody";
import KiyoungiArm from "./KiyoungiArm";

type Part = "body" | "arm" | null;

/**
 * 기영이 위젯 컨테이너. 얼굴(KiyoungiBody) + 빛의검 팔(KiyoungiArm)을 렌더.
 * 파츠 클릭 시 선택(핸들 표시), 컨테이너 바깥(차트 등) 클릭 시 선택 해제.
 */
export default function KiyoungiOverlay() {
  const kiyoungiEnabled = useSkinStore((s) => s.kiyoungiEnabled);
  const [selected, setSelected] = useState<Part>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: Z_LAYER.kiyoungi }}
    >
      <KiyoungiBody
        selected={selected === "body"}
        onSelect={() => setSelected("body")}
      />
      <KiyoungiArm
        selected={selected === "arm"}
        onSelect={() => setSelected("arm")}
      />
    </div>
  );
}
