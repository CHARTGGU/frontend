import type { IChartApi } from "lightweight-charts";

/**
 * 플롯 우측 가드 — 떠다니는 오버레이가 가격축(Y축)·마켓플레이스를 침범하지 않게 함.
 *
 * 가격축·시간축은 lightweight-charts 캔버스 **내부**(z=3) 고정값이라, 캔들 위에
 * 보여야 하는 오버레이(z>3)를 축보다 z-index 낮게 둘 수 없다(낮추면 캔들 뒤로 숨음).
 * 대신 오버레이의 우측 끝이 플롯 우경계(=가격축 거터 시작점)에 근접하면 통째로
 * 숨겨, 축을 가리거나 우측 마켓플레이스 쪽으로 침범하는 것을 원천 차단한다.
 *
 * 적용 대상: 떠다니는 요소(드래그 위젯·스티커, 데이터 바인딩 마커).
 * 제외: 가격축에 의도적으로 정렬되는 요소(매물대 벽돌 등).
 */

/** 우경계에서 이만큼 앞에서부터 숨김 ("근접" 여유 px). */
export const RIGHT_EDGE_HIDE_MARGIN = 8;

/**
 * 플롯 가로 우경계(px). 시간축 너비 = 가격축이 시작되는 x 좌표.
 * chart 미준비 시 null.
 */
export function getPlotRight(chart: IChartApi | null | undefined): number | null {
  if (!chart) return null;
  return chart.timeScale().width();
}

/**
 * 요소의 우측 기준 x가 플롯 우경계에 근접/침범했는지.
 * @param plotRight 플롯 우경계 px (getPlotRight). null·0 이하면 판정 불가 → false(숨기지 않음).
 * @param rightX    요소의 우측 끝(박스) 또는 앵커(마커) x px.
 * @param margin    근접 여유. 기본 RIGHT_EDGE_HIDE_MARGIN.
 */
export function isPastRightEdge(
  plotRight: number | null,
  rightX: number,
  margin: number = RIGHT_EDGE_HIDE_MARGIN,
): boolean {
  // null·0 이하(차트 초기화 직전 등)는 경계 미확정 → 숨기지 않음.
  if (plotRight === null || plotRight <= 0) return false;
  return rightX >= plotRight - margin;
}
