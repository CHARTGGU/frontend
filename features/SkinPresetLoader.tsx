"use client";

import { useEffect } from "react";
import { useSkinStore } from "@/stores/skinStore";

/**
 * URL 쿼리 파라미터 `?preset=<name>`을 읽어 스킨 상태를 초기 적용한다.
 * 슬라이드 데모 iframe에서 특정 스킨 조합을 미리 세팅할 때 사용.
 *
 * 지원 프리셋:
 * - `useful`  : 감정고양이 + 네온크로스 + 픽셀매물대 (투자 지표 슬라이드)
 * - `mental`  : 부처 배경 + 키캡 위젯 (멘탈 케어 슬라이드)
 */
export default function SkinPresetLoader() {
  const applyBackground   = useSkinStore((s) => s.applyBackground);
  const setBackgroundOpacity = useSkinStore((s) => s.setBackgroundOpacity);
  const applyIndicator    = useSkinStore((s) => s.applyIndicator);
  const setCrossStyle     = useSkinStore((s) => s.setCrossStyle);
  const setBrickStyle     = useSkinStore((s) => s.setBrickStyle);

  // 토글이 아닌 "강제 켜기"가 필요해서 set 직접 사용
  const setPreset = useSkinStore.setState;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("preset");
    if (!preset) return;

    if (preset === "useful") {
      // 감정 고양이 + 네온 크로스 + 픽셀 벽돌 매물대
      applyIndicator("ind-cat");
      setCrossStyle("neon");
      setBrickStyle("pixel");
      // 불필요한 다른 위젯 끄기
      setPreset({
        backgroundSkinId: null,
        keycapEnabled: false,
        fireEnabled: false,
        waterfallEnabled: false,
      });
    } else if (preset === "mental") {
      // 부처 배경 + 키캡 위젯
      applyBackground("bg-budda");
      setBackgroundOpacity(0.3);
      setPreset({
        keycapEnabled: true,
        keycapPos: { x: 20, y: 60 },
        indicatorSkinId: null,
        crossStyle: null,
        brickStyle: null,
        fireEnabled: false,
        waterfallEnabled: false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 1회만

  return null;
}
