"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  computeCoachmarkPosition,
  type CoachmarkPosition,
} from "@/lib/coachmarkPosition";
import type { OnboardingStep } from "./steps";

interface CoachmarkProps {
  step: OnboardingStep;
  stepIndex: number;
  total: number;
  isLast: boolean;
  /** 타깃 사각형. null이면 화면 중앙에 배치(타깃 부재 fallback). */
  rect: DOMRect | null;
  onNext: () => void;
}

/**
 * 말풍선: 제목·설명·점 인디케이터·다음/확인 버튼.
 * 자기 크기를 측정한 뒤 computeCoachmarkPosition으로 타깃 주변에 배치하고
 * viewport 경계를 넘으면 안쪽으로 보정한다.
 */
export default function Coachmark({
  step,
  stepIndex,
  total,
  isLast,
  rect,
  onNext,
}: CoachmarkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<CoachmarkPosition | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bubble = {
      width: el.offsetWidth,
      height: el.offsetHeight,
    };
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    if (rect) {
      setPos(computeCoachmarkPosition(rect, bubble, viewport));
    } else {
      // 타깃 없음 → 화면 중앙.
      setPos({
        placement: "bottom",
        top: viewport.height / 2 - bubble.height / 2,
        left: viewport.width / 2 - bubble.width / 2,
      });
    }
  }, [rect, step.id]);

  return (
    <div
      ref={ref}
      // 측정 전(pos=null)에는 보이지 않게 화면 밖에 둔다(깜빡임 방지).
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: 280,
      }}
      className="z-[1] rounded-lg border border-panel-border bg-panel p-4 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-sm font-bold text-text-primary">{step.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
        {step.description}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === stepIndex ? "bg-accent" : "bg-panel-border"
              }`}
            />
          ))}
        </div>
        <button
          onClick={onNext}
          className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
        >
          {isLast ? "확인" : "다음"}
        </button>
      </div>
    </div>
  );
}
