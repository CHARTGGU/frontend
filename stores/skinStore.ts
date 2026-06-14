import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FitMode = "cover" | "contain" | "tile";

export interface KiyoungiBodyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface KiyoungiArmState {
  offsetX: number;
  offsetY: number;
  length: number;
  angle: number;
}

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
  /** 불타는 효과 위젯 활성화 여부. */
  fireEnabled: boolean;
  /** 불 이펙트 영역 높이 (10~80, 화면 높이 %). */
  fireHeight: number;
  /** 기영이 위젯 활성화 여부. */
  kiyoungiEnabled: boolean;
  /** 기영이 본체(얼굴) 위치/크기 (컨테이너 기준 px). */
  kiyoungiBody: KiyoungiBodyRect;
  /** 빛의 검 팔. offsetX,offsetY=어깨(앵커) 위치 — kiyoungiBody 우하단 모서리 기준 상대 오프셋(px). length=검 길이(px), angle=방향(deg, 0=→, -90=↑). */
  kiyoungiArm: KiyoungiArmState;

  applyBackground: (id: string) => void;
  removeBackground: () => void;
  applyIndicator: (id: string) => void;
  removeIndicator: () => void;
  setBackgroundOpacity: (opacity: number) => void;
  setFitMode: (mode: FitMode) => void;
  toggleCat: () => void;
  toggleFire: () => void;
  setFireHeight: (height: number) => void;
  toggleKiyoungi: () => void;
  setKiyoungiBody: (patch: Partial<KiyoungiBodyRect>) => void;
  setKiyoungiArm: (patch: Partial<KiyoungiArmState>) => void;
}

export const useSkinStore = create<SkinState>()(
  persist(
    (set) => ({
      backgroundSkinId: null,
      indicatorSkinId: null,
      backgroundOpacity: 0.5,
      fitMode: "cover",
      catEnabled: false,
      fireEnabled: false,
      fireHeight: 30,
      kiyoungiEnabled: false,
      kiyoungiBody: { x: 160, y: 260, width: 200, height: 180 },
      kiyoungiArm: { offsetX: -60, offsetY: -40, length: 180, angle: -60 },

      applyBackground: (id) => set({ backgroundSkinId: id }),
      removeBackground: () => set({ backgroundSkinId: null }),
      applyIndicator: (id) => set({ indicatorSkinId: id }),
      removeIndicator: () => set({ indicatorSkinId: null }),
      setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
      setFitMode: (fitMode) => set({ fitMode }),
      toggleCat: () => set((s) => ({ catEnabled: !s.catEnabled })),
      toggleFire: () => set((s) => ({ fireEnabled: !s.fireEnabled })),
      setFireHeight: (fireHeight) => set({ fireHeight }),
      toggleKiyoungi: () => set((s) => ({ kiyoungiEnabled: !s.kiyoungiEnabled })),
      setKiyoungiBody: (patch) =>
        set((s) => ({ kiyoungiBody: { ...s.kiyoungiBody, ...patch } })),
      setKiyoungiArm: (patch) =>
        set((s) => ({ kiyoungiArm: { ...s.kiyoungiArm, ...patch } })),
    }),
    { name: "skin-settings" }
  )
);
