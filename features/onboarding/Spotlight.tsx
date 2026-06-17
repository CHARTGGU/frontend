"use client";

import type { CSSProperties } from "react";

/** 스포트라이트 구멍 주변 여유(px). */
const SPOTLIGHT_PADDING = 6;

interface SpotlightProps {
  rect: DOMRect;
  /** 빈곳/강조영역 클릭 → 다음(또는 닫기). */
  onAdvance: () => void;
}

/**
 * 타깃 사각형만 구멍처럼 밝게 남기고 주변을 어둡게.
 * box-shadow 트릭: 작은 박스에 거대한 그림자를 주면 박스 밖이 전부 어두워진다.
 * (SVG mask 대비 구현 단순 + 부드러운 경계 + 리플로우 없음)
 * 박스 자체가 클릭을 가로채 밑 요소 직클릭을 막고 onAdvance만 호출한다.
 */
export default function Spotlight({ rect, onAdvance }: SpotlightProps) {
  const style: CSSProperties = {
    position: "fixed",
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
    borderRadius: 8,
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.62)",
    outline: "2px solid rgba(99, 179, 237, 0.9)",
    cursor: "pointer",
  };
  return <div style={style} onClick={onAdvance} aria-hidden />;
}
