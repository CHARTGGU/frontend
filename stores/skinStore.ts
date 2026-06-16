import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UTCTimestamp } from "lightweight-charts";

export type FitMode = "cover" | "contain" | "tile";

/** 골든/데드크로스(MA20×MA60) 연출 스타일. null = 미적용. */
export type CrossStyle = "neon" | "burst" | "muhan";
/** 매물대 벽돌 연출 스타일. null = 미적용. */
export type BrickStyle = "pixel" | "gold";

export interface KiyoungiBodyRect {
  /** 차트 시간축 앵커(UTCTimestamp 초). null=미배치 → 오버레이가 중앙에 배치. 부적 스티커와 동일하게 스크롤·줌 시 차트와 함께 이동. */
  time: number | null;
  /** 차트 가격축 앵커. */
  price: number | null;
  width: number;
  height: number;
}

export interface KiyoungiArmState {
  offsetX: number;
  offsetY: number;
  length: number;
  angle: number;
}

export type LineStyleId = "basic" | "heart" | "rainbow";

export interface CustomLine {
  id: string;
  styleId: LineStyleId;
  /** 차트 좌표(시간/가격) 기준 — 줌/스크롤 시 priceToCoordinate/timeToCoordinate로 재배치. */
  time1: UTCTimestamp;
  price1: number;
  time2: UTCTimestamp;
  price2: number;
}

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
  /** 기영이 위젯 활성화 여부. */
  kiyoungiEnabled: boolean;
  /** 기영이 본체(얼굴). 위치는 차트 좌표(time/price) 앵커, 크기(width/height)는 px 고정. */
  kiyoungiBody: KiyoungiBodyRect;
  /** 빛의 검 팔. offsetX,offsetY=어깨(앵커) 위치 — kiyoungiBody 우하단 모서리 기준 상대 오프셋(px). length=검 길이(px), angle=방향(deg, 0=→, -90=↑). */
  kiyoungiArm: KiyoungiArmState;
  /** 사용자가 그린 커스텀 라인 목록. */
  customLines: CustomLine[];

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
  toggleKiyoungi: () => void;
  setKiyoungiBody: (patch: Partial<KiyoungiBodyRect>) => void;
  setKiyoungiArm: (patch: Partial<KiyoungiArmState>) => void;
  addCustomLine: (line: CustomLine) => void;
  updateCustomLine: (id: string, patch: Partial<CustomLine>) => void;
  removeCustomLine: (id: string) => void;
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
      kiyoungiEnabled: false,
      kiyoungiBody: { time: null, price: null, width: 200, height: 180 },
      kiyoungiArm: { offsetX: -60, offsetY: 0, length: 180, angle: -60 },
      customLines: [],

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
      toggleKiyoungi: () => set((s) => ({ kiyoungiEnabled: !s.kiyoungiEnabled })),
      setKiyoungiBody: (patch) =>
        set((s) => ({ kiyoungiBody: { ...s.kiyoungiBody, ...patch } })),
      setKiyoungiArm: (patch) =>
        set((s) => ({ kiyoungiArm: { ...s.kiyoungiArm, ...patch } })),
      addCustomLine: (line) =>
        set((s) => ({ customLines: [...s.customLines, line] })),
      updateCustomLine: (id, patch) =>
        set((s) => ({
          customLines: s.customLines.map((l) =>
            l.id === id ? { ...l, ...patch } : l,
          ),
        })),
      removeCustomLine: (id) =>
        set((s) => ({ customLines: s.customLines.filter((l) => l.id !== id) })),
    }),
    {
      name: "skin-settings",
      version: 3,
      // v0 → v2: customLines가 px 좌표(x1..y2)에서 차트 좌표(time1/price1/time2/price2)로 변경됨 — 호환 불가, 옛 형식 제거.
      // v2 → v3: kiyoungiBody가 화면 px(x/y)에서 차트 앵커(time/price)로 변경됨 — 호환 불가, 미배치(null)로 초기화.
      migrate: (state, version) => {
        let next = state;
        if (version < 2 && next && typeof next === "object" && "customLines" in next) {
          const lines = (next as { customLines: unknown }).customLines;
          const valid = Array.isArray(lines)
            ? lines.filter(
                (l): l is CustomLine =>
                  typeof l === "object" && l !== null && typeof (l as CustomLine).time1 === "number"
              )
            : [];
          next = { ...(next as object), customLines: valid };
        }
        if (version < 3 && next && typeof next === "object" && "kiyoungiBody" in next) {
          const prev = (next as { kiyoungiBody: Partial<KiyoungiBodyRect> }).kiyoungiBody;
          next = {
            ...(next as object),
            kiyoungiBody: {
              time: null,
              price: null,
              width: prev?.width ?? 200,
              height: prev?.height ?? 180,
            },
          };
        }
        return next;
      },
    }
  )
);
