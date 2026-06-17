"use client";

import { useSkinStore } from "@/stores/skinStore";
import type { ChartTheme } from "@/lib/chartTheme";
import { resolveTheme } from "./presets";

/**
 * 현재 적용된 배경 스킨 + 테마 on/off → 사용할 ChartTheme.
 * resolveTheme이 항상 동일 객체 참조를 돌려주므로 useEffect dep로 바로 써도 안전.
 */
export function useChartTheme(): ChartTheme {
  const backgroundSkinId = useSkinStore((s) => s.backgroundSkinId);
  const themingEnabled = useSkinStore((s) => s.themingEnabled);
  return resolveTheme(backgroundSkinId, themingEnabled);
}
