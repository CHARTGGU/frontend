"use client";

import { useState } from "react";
import Toolbar from "@/features/chart/Toolbar";
import ChartView from "@/features/chart/ChartView";
import SkinSidebar from "@/features/skin/SkinSidebar";
import { CaptureProvider } from "@/features/export/captureContext";
import OnboardingGuide from "@/features/onboarding/OnboardingGuide";
import { ONBOARDING_STEPS } from "@/features/onboarding/steps";
import { useChartTheme } from "@/features/skin/useChartTheme";

/**
 * 전체 화면 셸 (데스크탑 전용).
 * ┌ Toolbar (종목·기간·지표·PNG) ───────────────┐
 * │ ChartView (배경+차트+오버레이)  │ SkinSidebar │
 * └──────────────────────────────────────────────┘
 * CaptureProvider로 Toolbar(ExportButton)와 ChartView가 캡처 노드를 공유.
 */
export default function AppShell() {
  // 마켓플레이스 사이드바 접힘 상태 (AppShell이 소유, SkinSidebar에 props로 전달)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const theme = useChartTheme();

  return (
    <CaptureProvider>
      <div
        className="flex h-screen flex-col transition-colors duration-300"
        style={{ backgroundColor: theme.pageBg }}
      >
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <ChartView />
          <SkinSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
          />
        </div>
        <OnboardingGuide steps={ONBOARDING_STEPS} />
      </div>
    </CaptureProvider>
  );
}
