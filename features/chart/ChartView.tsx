"use client";

import { useEffect } from "react";
import { useChartStore } from "@/stores/chartStore";
import { useSkinStore } from "@/stores/skinStore";
import { useCaptureRef } from "@/features/export/captureContext";
import BackgroundLayer from "@/features/skin/BackgroundLayer";
import FireOverlay from "@/features/skin/FireOverlay";
import WaterfallOverlay from "@/features/skin/WaterfallOverlay";
import IndicatorOverlay from "@/features/skin/IndicatorOverlay";
import CrossOverlay from "@/features/skin/bindings/CrossOverlay";
import BrickOverlay from "@/features/skin/bindings/BrickOverlay";
import KiyoungiOverlay from "@/features/skin/KiyoungiOverlay";
import StickerOverlay from "@/features/skin/StickerOverlay";
import LineDrawOverlay from "@/features/skin/LineDrawOverlay";
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
  const captureRef = useCaptureRef();

  // 최초 마운트 시 초기 데이터 로드 (BTCUSDT · 1d).
  useEffect(() => {
    void loadCandles();
  }, [loadCandles]);

  return (
    <div className="relative min-w-0 flex-1 bg-[#131313]">
      <ChartRefProvider>
        <div ref={captureRef} className="absolute inset-0 bg-[#131313]">
          <BackgroundLayer />
          <FireOverlay />
          <WaterfallOverlay />
          <ChartCanvas />
          <IchimokuCloudOverlay />
          {newsMarkersEnabled && <NewsMarkerOverlay />}
          {/* 캔들 위 오버레이는 PlotClip으로 축(Y·X) 거터를 비워 축이 최상단 유지. */}
          <PlotClip>
            <IndicatorOverlay />
            <CrossOverlay />
            <BrickOverlay />
            <VolumeProfileOverlay />
            <KiyoungiOverlay />
            <LineDrawOverlay />
            <StickerOverlay />
          </PlotClip>
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
