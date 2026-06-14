import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FitMode = "cover" | "contain" | "tile";

/** 골든/데드크로스(MA20×MA60) 연출 스타일. null = 미적용. */
export type CrossStyle = "neon" | "burst" | "muhan";
/** 매물대 벽돌 연출 스타일. null = 미적용. */
export type BrickStyle = "pixel" | "gold";

interface SkinState {
  /** 적용된 배경 스킨 id (null = 없음). */
  backgroundSkinId: string | null;
  /** 적용된 지표 스킨 id (null = 없음). */
  indicatorSkinId: string | null;
  /** 적용된 크로스 연출 스타일 (null = 없음). */
  crossStyle: CrossStyle | null;
  /** 적용된 매물대 벽돌 스타일 (null = 없음). */
  brickStyle: BrickStyle | null;
  /** 배경 투명도 0~1. */
  backgroundOpacity: number;
  /** 배경 이미지 fit 모드. */
  fitMode: FitMode;
  /** 뛰어다니는 고양이 위젯 활성화 여부. */
  catEnabled: boolean;
  /** 불타는 효과 위젯 활성화 여부. */
  fireEnabled: boolean;
  /** 불 이펙트 영역 높이 (10~80, 화면 높이 %). */
  fireHeight: number;
  /** 폭포수 효과 위젯 활성화 여부. */
  waterfallEnabled: boolean;
  /** 폭포 커튼이 닿는 높이 (10~90, 화면 높이 %). */
  waterfallHeight: number;

  applyBackground: (id: string) => void;
  removeBackground: () => void;
  applyIndicator: (id: string) => void;
  removeIndicator: () => void;
  /** 같은 스타일 재선택 시 해제(토글), 다른 스타일이면 교체. */
  setCrossStyle: (style: CrossStyle) => void;
  setBrickStyle: (style: BrickStyle) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setFitMode: (mode: FitMode) => void;
  toggleCat: () => void;
  toggleFire: () => void;
  setFireHeight: (height: number) => void;
  toggleWaterfall: () => void;
  setWaterfallHeight: (height: number) => void;
}

export const useSkinStore = create<SkinState>()(
  persist(
    (set) => ({
      backgroundSkinId: null,
      indicatorSkinId: null,
      crossStyle: null,
      brickStyle: null,
      backgroundOpacity: 0.5,
      fitMode: "cover",
      catEnabled: false,
      fireEnabled: false,
      fireHeight: 30,
      waterfallEnabled: false,
      waterfallHeight: 50,

      applyBackground: (id) => set({ backgroundSkinId: id }),
      removeBackground: () => set({ backgroundSkinId: null }),
      applyIndicator: (id) => set({ indicatorSkinId: id }),
      removeIndicator: () => set({ indicatorSkinId: null }),
      setCrossStyle: (style) =>
        set((s) => ({ crossStyle: s.crossStyle === style ? null : style })),
      setBrickStyle: (style) =>
        set((s) => ({ brickStyle: s.brickStyle === style ? null : style })),
      setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
      setFitMode: (fitMode) => set({ fitMode }),
      toggleCat: () => set((s) => ({ catEnabled: !s.catEnabled })),
      toggleFire: () => set((s) => ({ fireEnabled: !s.fireEnabled })),
      setFireHeight: (fireHeight) => set({ fireHeight }),
      toggleWaterfall: () =>
        set((s) => ({ waterfallEnabled: !s.waterfallEnabled })),
      setWaterfallHeight: (waterfallHeight) => set({ waterfallHeight }),
    }),
    { name: "skin-settings" }
  )
);
