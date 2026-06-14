export interface LinePoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LineGeometry {
  dx: number;
  dy: number;
  length: number;
  angle: number;
  perpX: number;
  perpY: number;
}

/**
 * 직선 두 점으로부터 길이/각도(deg)/수직 단위벡터를 계산.
 * length가 0이면 1로 처리해 0 나눗셈 방지(perp는 (0,0)).
 */
export function computeLineGeometry({ x1, y1, x2, y2 }: LinePoints): LineGeometry {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const rawLength = Math.hypot(dx, dy);
  const length = rawLength === 0 ? 1 : rawLength;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const perpX = rawLength === 0 ? 0 : -dy / length;
  const perpY = rawLength === 0 ? 0 : dx / length;
  return { dx, dy, length, angle, perpX, perpY };
}
