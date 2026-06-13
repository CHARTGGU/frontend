import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  /** 뛰어다니는 고양이 위젯 활성화 여부. */
  catEnabled: boolean;

  applyBackground: (id: string) => void;
  removeBackground: () => void;
  applyIndicator: (id: string) => void;
  removeIndicator: () => void;
  setBackgroundOpacity: (opacity: number) => void;
  setFitMode: (mode: FitMode) => void;
  toggleCat: () => void;
}

export const useSkinStore = create<SkinState>()(
  persist(
    (set) => ({
      backgroundSkinId: null,
      indicatorSkinId: null,
      backgroundOpacity: 0.5,
      fitMode: "cover",
      catEnabled: false,

      applyBackground: (id) => set({ backgroundSkinId: id }),
      removeBackground: () => set({ backgroundSkinId: null }),
      applyIndicator: (id) => set({ indicatorSkinId: id }),
      removeIndicator: () => set({ indicatorSkinId: null }),
      setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
      setFitMode: (fitMode) => set({ fitMode }),
      toggleCat: () => set((s) => ({ catEnabled: !s.catEnabled })),
    }),
    { name: "skin-settings" }
  )
);
