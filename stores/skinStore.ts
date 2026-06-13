import { create } from "zustand";

export type FitMode = "cover" | "contain" | "tile";

interface SkinState {
  /** 적용된 배경 스킨 id (null = 없음). */
  backgroundSkinId: string | null;
  /** 적용된 지표 스킨 id (null = 없음). */
  indicatorSkinId: string | null;
  /** 배경 투명도 0~1. */
  backgroundOpacity: number;
  /** 배경 이미지 fit 모드. */
  fitMode: FitMode;

  applyBackground: (id: string) => void;
  removeBackground: () => void;
  applyIndicator: (id: string) => void;
  removeIndicator: () => void;
  setBackgroundOpacity: (opacity: number) => void;
  setFitMode: (mode: FitMode) => void;
}

export const useSkinStore = create<SkinState>((set) => ({
  backgroundSkinId: null,
  indicatorSkinId: null,
  backgroundOpacity: 0.5,
  fitMode: "cover",

  applyBackground: (id) => set({ backgroundSkinId: id }),
  removeBackground: () => set({ backgroundSkinId: null }),
  applyIndicator: (id) => set({ indicatorSkinId: id }),
  removeIndicator: () => set({ indicatorSkinId: null }),
  setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
  setFitMode: (fitMode) => set({ fitMode }),
}));
