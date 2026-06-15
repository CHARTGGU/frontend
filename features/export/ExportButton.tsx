"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { useChartStore } from "@/stores/chartStore";
import { useCaptureRef } from "./captureContext";

/**
 * PNG 내보내기 = 합성 캡처 (CLAUDE.md §6).
 * chart.takeScreenshot()은 캔버스만 → 배경·캐릭터 빠짐. 금지.
 * 전체 컨테이너(배경+차트+오버레이)를 html-to-image로 한 장 합성.
 * 번들 SVG는 동일 출처라 CORS 무관.
 */
export default function ExportButton() {
  const captureRef = useCaptureRef();
  const symbol = useChartStore((s) => s.symbol);
  const status = useChartStore((s) => s.status);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    const node = captureRef.current;
    if (!node || busy) return;

    setBusy(true);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2, // 2x 해상도
        backgroundColor: "#131313",
        cacheBust: true,
        // 핸들·삭제버튼 등 data-export-ignore 요소는 결과 이미지에서 제외.
        // html-to-image는 텍스트 노드 등 비-HTMLElement에도 filter를 호출하므로
        // dataset 접근 전 타입 가드 필수 (없으면 TypeError로 캡처 전체 실패).
        filter: (n) =>
          !(n instanceof HTMLElement) || n.dataset.exportIgnore !== "true",
      });
      const link = document.createElement("a");
      link.download = `chartskin-${symbol}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // 합성 실패 (예: 외부 이미지 CORS). 사용자 알림.
      window.alert("이미지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={() => void handleExport()}
      disabled={busy || status !== "ready"}
      className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
    >
      {busy ? "저장 중…" : "PNG 저장"}
    </button>
  );
}
