"use client";

import { detectHighLowInRange } from "@/lib/indicators";
import { useChartStore } from "@/stores/chartStore";
import { useSkinStore } from "@/stores/skinStore";
import { useChartOverlay } from "@/features/chart/useChartOverlay";
import { useChartRefs } from "@/features/chart/ChartRefContext";
import { Z_LAYER } from "@/lib/zLayers";
import CharacterMarker from "./CharacterMarker";
import { findIndicatorSkin } from "./presets";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/**
 * 지표 스킨 오버레이 = 최고점/최저점 자동 감지 → 캐릭터+말풍선 좌표 추적.
 * 차트 위 절대배치 레이어. 가시영역 밖 좌표(null)는 렌더 생략(숨김).
 */
export default function IndicatorOverlay() {
  const indicatorSkinId = useSkinStore((s) => s.indicatorSkinId);
  const candles = useChartStore((s) => s.candles);
  const { toCoord, ready } = useChartOverlay();
  const { chart } = useChartRefs();

  const skin = findIndicatorSkin(indicatorSkinId);
  if (!skin || !ready || !chart) return null;

  // 현재 화면에 보이는 시간범위 취득 (v5: timeScale().getVisibleRange()).
  // Time은 여기선 UTCTimestamp=초. null이면(데이터 없음 등) 렌더 생략.
  const visibleRange = chart.timeScale().getVisibleRange();
  if (!visibleRange) return null;

  // 가시범위 내 캔들만으로 최고/최저 재계산 → 스크롤·줌 시 자동 재배치.
  const hl = detectHighLowInRange(
    candles,
    visibleRange.from as number,
    visibleRange.to as number,
  );
  if (!hl) return null;

  const highPos = toCoord(hl.high.time, hl.high.price);
  const lowPos = toCoord(hl.low.time, hl.low.price);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: Z_LAYER.indicator }}
    >
      {highPos && (
        <CharacterMarker
          x={highPos.x}
          y={highPos.y}
          image={skin.characters.happy}
          bubble={`최고 ${fmt(hl.high.price)}`}
          anchor="top"
        />
      )}
      {lowPos && (
        <CharacterMarker
          x={lowPos.x}
          y={lowPos.y}
          image={skin.characters.sad}
          bubble={`최저 ${fmt(hl.low.price)}`}
          anchor="bottom"
        />
      )}
    </div>
  );
}
