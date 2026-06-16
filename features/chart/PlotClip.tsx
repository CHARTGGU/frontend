"use client";

import { useChartRefs } from "./ChartRefContext";
import { useChartOverlay } from "./useChartOverlay";

/**
 * 차트 플롯 영역(가격축 Y·시간축 X 거터 제외)으로 자식 오버레이를 클리핑.
 *
 * 가격축·시간축은 차트 canvas 내부(z=3)라 z-index로 그 위에 못 둔다(캔들과 동일 레이어).
 * 대신 축 거터만큼 영역을 비워 오버레이가 축 위로 그려지지 않게 함 → 축이 항상 최상단.
 *
 * 플롯 좌상단(0,0) = 차트 컨테이너 좌상단과 동일하므로 origin을 보존한다.
 * → 자식이 timeToCoordinate/priceToCoordinate로 계산한 좌표 배치가 그대로 유효.
 * z-index를 설정하지 않아(=auto) stacking context를 만들지 않으므로,
 * 자식 오버레이들의 기존 z-index 순서는 전역에서 그대로 유지된다.
 */
export default function PlotClip({ children }: { children: React.ReactNode }) {
  const { chart } = useChartRefs();
  // view 변경(스크롤/줌/리사이즈, 가격 자릿수 변동)마다 거터 너비 재계산.
  useChartOverlay();

  const right = chart ? chart.priceScale("right").width() : 0;
  const bottom = chart ? chart.timeScale().height() : 0;

  return (
    <div
      className="pointer-events-none absolute overflow-hidden"
      style={{ top: 0, left: 0, right, bottom }}
    >
      {children}
    </div>
  );
}
