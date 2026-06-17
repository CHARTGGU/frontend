"use client";

import { useEffect } from "react";
import { useChartStore } from "@/stores/chartStore";
import { useSkinStore } from "@/stores/skinStore";
import { useCaptureRef } from "@/features/export/captureContext";
import { useChartTheme } from "@/features/skin/useChartTheme";
import BackgroundLayer from "@/features/skin/BackgroundLayer";
import FireOverlay from "@/features/skin/FireOverlay";
import WaterfallOverlay from "@/features/skin/WaterfallOverlay";
import IndicatorOverlay from "@/features/skin/IndicatorOverlay";
import CrossOverlay from "@/features/skin/bindings/CrossOverlay";
import BrickOverlay from "@/features/skin/bindings/BrickOverlay";
import KiyoungiOverlay from "@/features/skin/KiyoungiOverlay";
import StickerOverlay from "@/features/skin/StickerOverlay";
import LineDrawOverlay from "@/features/skin/LineDrawOverlay";
import JigeumianiOverlay from "./JigeumianiOverlay";
import KeycapWidget from "./KeycapWidget";
import ChartCanvas from "./ChartCanvas";
import { ChartRefProvider } from "./ChartRefContext";
import IchimokuCloudOverlay from "./IchimokuCloudOverlay";
import NewsMarkerOverlay from "./NewsMarkerOverlay";
import VolumeProfileOverlay from "./VolumeProfileOverlay";
import PlotClip from "./PlotClip";

/**
 * 차트 영역 합성: [배경 스킨] → [차트 캔들/거래량] → [지표 스킨 오버레이].
 * 세 레이어를 captureRef 컨테이너에 담아 PNG 한 장으로 캡처 가능.
 */
export default function ChartView() {
  const status = useChartStore((s) => s.status);
  const error = useChartStore((s) => s.error);
  const loadCandles = useChartStore((s) => s.loadCandles);
  const newsMarkersEnabled = useSkinStore((s) => s.newsMarkersEnabled);
  const skinsVisible = useSkinStore((s) => s.skinsVisible);
  const captureRef = useCaptureRef();
  const theme = useChartTheme();

  // 최초 마운트 시 초기 데이터 로드 (BTCUSDT · 1d).
  useEffect(() => {
    void loadCandles();
  }, [loadCandles]);

  return (
    <div
      className="relative min-w-0 flex-1 transition-colors duration-300"
      style={{ backgroundColor: theme.pageBg }}
    >
      <ChartRefProvider>
        <div
          ref={captureRef}
          className="absolute inset-0 transition-colors duration-300"
          style={{ backgroundColor: theme.pageBg }}
        >
          {/* 마켓플레이스 스킨·위젯 오버레이는 skinsVisible로 일괄 표시/숨김.
              숨겨도 각 스킨의 적용 상태/설정은 store에 보존되어 다시 켜면 그대로 복원된다.
              VolumeProfile·Ichimoku 구름 등 차트 분석 지표는 별도 유지(영향 없음). */}
          {skinsVisible && <BackgroundLayer />}
          {skinsVisible && <FireOverlay />}
          {skinsVisible && <WaterfallOverlay />}
          {/* 매물대(지표·벽돌 스킨)는 차트보다 먼저 그려 캔들 뒤로 깔리게 함(투명 차트 배경으로 비침). */}
          <PlotClip>
            <VolumeProfileOverlay />
            {skinsVisible && <BrickOverlay />}
          </PlotClip>
          <ChartCanvas />
          <IchimokuCloudOverlay />
          {skinsVisible && newsMarkersEnabled && <NewsMarkerOverlay />}
          {/* 키캡 위젯 — 차트 좌표와 무관한 플로팅 위젯, PlotClip 밖에 배치. */}
          {skinsVisible && <KeycapWidget />}
          {/* 캔들 위 오버레이는 PlotClip으로 축(Y·X) 거터를 비워 축이 최상단 유지. */}
          {skinsVisible && (
            <PlotClip>
              <IndicatorOverlay />
              <CrossOverlay />
              <KiyoungiOverlay />
              <JigeumianiOverlay />
              <LineDrawOverlay />
              <StickerOverlay />
            </PlotClip>
          )}
        </div>

        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-text-muted">
            시세 불러오는 중…
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm">
            <p className="text-down">{error ?? "시세를 불러오지 못했습니다."}</p>
            <button
              onClick={() => void loadCandles()}
              className="rounded bg-accent px-3 py-1.5 text-white hover:bg-accent-hover"
            >
              다시 시도
            </button>
          </div>
        )}
      </ChartRefProvider>
    </div>
  );
}
