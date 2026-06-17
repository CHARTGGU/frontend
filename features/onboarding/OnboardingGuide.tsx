"use client";

import { useEffect } from "react";
import { useOnboarding } from "./useOnboarding";
import { useTargetRect } from "./useTargetRect";
import { onboardingSelector, type OnboardingStep } from "./steps";
import Spotlight from "./Spotlight";
import Coachmark from "./Coachmark";

interface OnboardingGuideProps {
  steps: OnboardingStep[];
}

/**
 * 온보딩 가이드 본체.
 * - 첫 방문 1회만 표시(useOnboarding).
 * - 현재 단계 타깃을 측정(useTargetRect)해 Spotlight + Coachmark 렌더.
 * - 표시 중 배경 스크롤 잠금.
 * - 오버레이 빈곳/강조영역/버튼 클릭 → 모두 next()(마지막이면 close()).
 */
export default function OnboardingGuide({ steps }: OnboardingGuideProps) {
  const { isOpen, stepIndex, isLast, next } = useOnboarding(steps.length);
  const step = steps[stepIndex];
  const rect = useTargetRect(step ? onboardingSelector(step.id) : "", isOpen);

  // 표시 중 배경 스크롤 잠금.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !step) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* 빈곳 클릭 레이어: rect가 없을 때도 화면 전체를 어둡게/클릭 가능하게.
          rect가 있으면 Spotlight가 그 위에서 어둠을 그리므로 이 레이어는 투명. */}
      <div
        className="absolute inset-0"
        style={{
          background: rect ? "transparent" : "rgba(0,0,0,0.62)",
          cursor: "pointer",
        }}
        onClick={next}
      />
      {rect && <Spotlight rect={rect} onAdvance={next} />}
      <Coachmark
        step={step}
        stepIndex={stepIndex}
        total={steps.length}
        isLast={isLast}
        rect={rect}
        onNext={next}
      />
    </div>
  );
}
