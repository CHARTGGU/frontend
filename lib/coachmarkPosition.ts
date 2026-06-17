/**
 * 말풍선(coachmark) 배치 계산 — 순수 함수 (DOM 비의존, 단위 테스트 가능).
 * 선호 순서대로 타깃 주변에 배치하고, viewport 경계를 넘으면 안쪽으로 clamp.
 */
export interface RectLike {
  top: number;
  left: number;
  width: number;
  height: number;
}
export interface SizeLike {
  width: number;
  height: number;
}
export type Placement = "bottom" | "top" | "right" | "left";
export interface CoachmarkPosition {
  top: number;
  left: number;
  placement: Placement;
}

/** 타깃과 말풍선 사이 간격(px). */
export const COACHMARK_GAP = 12;
/** 화면 경계에서 유지할 최소 여백(px). */
export const VIEWPORT_MARGIN = 16;

function clamp(value: number, min: number, max: number): number {
  // max < min(공간이 말풍선보다 작은 극단)일 때는 min 우선.
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

export function computeCoachmarkPosition(
  target: RectLike,
  bubble: SizeLike,
  viewport: SizeLike,
): CoachmarkPosition {
  const fitsBottom =
    target.top + target.height + COACHMARK_GAP + bubble.height <=
    viewport.height - VIEWPORT_MARGIN;
  const fitsTop = target.top - COACHMARK_GAP - bubble.height >= VIEWPORT_MARGIN;
  const fitsRight =
    target.left + target.width + COACHMARK_GAP + bubble.width <=
    viewport.width - VIEWPORT_MARGIN;

  let placement: Placement;
  if (fitsBottom) placement = "bottom";
  else if (fitsTop) placement = "top";
  else if (fitsRight) placement = "right";
  else placement = "left";

  const centerX = target.left + target.width / 2 - bubble.width / 2;
  const centerY = target.top + target.height / 2 - bubble.height / 2;

  let top: number;
  let left: number;
  switch (placement) {
    case "bottom":
      top = target.top + target.height + COACHMARK_GAP;
      left = centerX;
      break;
    case "top":
      top = target.top - COACHMARK_GAP - bubble.height;
      left = centerX;
      break;
    case "right":
      top = centerY;
      left = target.left + target.width + COACHMARK_GAP;
      break;
    case "left":
      top = centerY;
      left = target.left - COACHMARK_GAP - bubble.width;
      break;
  }

  return {
    placement,
    left: clamp(
      left,
      VIEWPORT_MARGIN,
      viewport.width - VIEWPORT_MARGIN - bubble.width,
    ),
    top: clamp(
      top,
      VIEWPORT_MARGIN,
      viewport.height - VIEWPORT_MARGIN - bubble.height,
    ),
  };
}
