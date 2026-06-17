"use client";

import { useCallback, useEffect, useState } from "react";
import { getSeen, setSeen } from "@/lib/onboardingStorage";

export interface OnboardingController {
  /** 가이드 표시 여부. */
  isOpen: boolean;
  /** 현재 단계 인덱스(0-base). */
  stepIndex: number;
  /** 마지막 단계인가. */
  isLast: boolean;
  /** 다음 단계로(마지막이면 닫고 본 것으로 기록). */
  next: () => void;
  /** 즉시 닫고 본 것으로 기록. */
  close: () => void;
}

/**
 * 온보딩 표시 여부와 단계 진행을 관리.
 * 마운트 시 localStorage를 확인해 "안 봤으면" 1회 표시한다.
 */
export function useOnboarding(stepCount: number): OnboardingController {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // 첫 마운트 1회만 확인 (effect라 SSR/하이드레이션 깜빡임 없음).
  useEffect(() => {
    if (!getSeen()) setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setSeen();
    setIsOpen(false);
  }, []);

  const isLast = stepIndex >= stepCount - 1;

  const next = useCallback(() => {
    if (stepIndex >= stepCount - 1) {
      close();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, stepCount, close]);

  return { isOpen, stepIndex, isLast, next, close };
}
