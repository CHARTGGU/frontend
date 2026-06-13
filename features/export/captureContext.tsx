"use client";

import { createContext, useContext, useRef, type RefObject } from "react";

/**
 * PNG 내보내기 대상 노드 공유.
 * ChartView가 [배경+차트+오버레이] 컨테이너에 ref를 달고,
 * Toolbar의 ExportButton이 이 노드를 html-to-image로 합성 캡처한다.
 */
const CaptureContext = createContext<RefObject<HTMLDivElement> | null>(null);

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <CaptureContext.Provider value={ref}>{children}</CaptureContext.Provider>
  );
}

export function useCaptureRef(): RefObject<HTMLDivElement> {
  const ctx = useContext(CaptureContext);
  if (!ctx) throw new Error("useCaptureRef must be used within CaptureProvider");
  return ctx;
}
