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
export type LineDrawMode = "idle" | "drawing";

export interface CustomLine {
  id: string;
  styleId: LineStyleId;
  /** basic 스타일 전용 색상. 없으면 기본색 사용. */
  color?: string;
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
  /** 매물대 벽돌 투명도 0~1 (스타일별 개별 저장). */
  brickOpacity: Record<BrickStyle, number>;
  /** 배경 투명도 0~1. */
  backgroundOpacity: number;
  /** 배경 이미지 fit 모드. */
  fitMode: FitMode;
  /**
   * 배경 스킨에 맞춰 차트 색·페이지 톤을 자동으로 바꿀지 여부 (기본 true).
   * false면 배경 이미지는 유지하되 색은 기본 팔레트(DEFAULT_THEME)로 복귀.
   */
  themingEnabled: boolean;
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
  /** 뉴스 마커 위젯 활성화 여부. */
  newsMarkersEnabled: boolean;
  /** "지금이니?" 말풍선 위젯 활성화 여부. */
  jigeumianiEnabled: boolean;
  /** 키캡 키링 위젯 활성화 여부. */
  keycapEnabled: boolean;
  /** 키캡 위젯 위치 (차트 컨테이너 기준 px). */
  keycapPos: { x: number; y: number };
  /** 사용자가 그린 커스텀 라인 목록. */
  customLines: CustomLine[];
  /** 기본선 스타일 색상. */
  basicLineColor: string;
  /** 라인 그리기 모드 (비persist). */
  lineDrawMode: LineDrawMode;
  /** 그릴 라인 스타일 (비persist). */
  lineDrawPendingStyle: LineStyleId | null;
  /**
   * 마켓플레이스 스킨·위젯 전역 표시 여부 (true=보임). false면 적용된 스킨·위젯
   * 오버레이를 일괄 숨김만 함 — 각 스킨의 적용 상태/설정값은 그대로 보존되어
   * 다시 true로 돌리면 기존 설정 그대로 복원된다. 차트 분석 지표는 영향 없음.
   */
  skinsVisible: boolean;

  applyBackground: (id: string) => void;
  removeBackground: () => void;
  applyIndicator: (id: string) => void;
  removeIndicator: () => void;
  /** 같은 스타일 재선택 시 해제(토글), 다른 스타일이면 교체. */
  setCrossStyle: (style: CrossStyle) => void;
  setBrickStyle: (style: BrickStyle) => void;
  /** 매물대 벽돌 투명도를 스타일별로 설정 (0~1). */
  setBrickOpacity: (style: BrickStyle, opacity: number) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setFitMode: (mode: FitMode) => void;
  /** 배경 연동 테마 on/off 토글. */
  toggleTheming: () => void;
  toggleCat: () => void;
  toggleFire: () => void;
  setFireHeight: (height: number) => void;
  toggleWaterfall: () => void;
  setWaterfallHeight: (height: number) => void;
  toggleKiyoungi: () => void;
  setKiyoungiBody: (patch: Partial<KiyoungiBodyRect>) => void;
  setKiyoungiArm: (patch: Partial<KiyoungiArmState>) => void;
  toggleNewsMarkers: () => void;
  toggleJigeumiani: () => void;
  toggleKeycap: () => void;
  setKeycapPos: (pos: { x: number; y: number }) => void;
  addCustomLine: (line: CustomLine) => void;
  updateCustomLine: (id: string, patch: Partial<CustomLine>) => void;
  removeCustomLine: (id: string) => void;
  clearCustomLines: () => void;
  setBasicLineColor: (color: string) => void;
  setLineDrawMode: (mode: LineDrawMode) => void;
  setLineDrawPendingStyle: (styleId: LineStyleId | null) => void;
  /** 마켓플레이스 스킨·위젯 전역 표시/숨김 토글 (설정값은 보존). */
  toggleSkinsVisible: () => void;
}

export const useSkinStore = create<SkinState>()(
  persist(
    (set) => ({
      backgroundSkinId: null,
      indicatorSkinId: null,
      crossStyle: null,
      brickStyle: null,
      brickOpacity: { pixel: 0.75, gold: 0.75 },
      backgroundOpacity: 0.5,
      fitMode: "cover",
      themingEnabled: true,
      catEnabled: false,
      fireEnabled: false,
      fireHeight: 30,
      waterfallEnabled: false,
      waterfallHeight: 50,
      kiyoungiEnabled: false,
      newsMarkersEnabled: false,
      jigeumianiEnabled: false,
      keycapEnabled: false,
      keycapPos: { x: 20, y: 60 },
      kiyoungiBody: { time: null, price: null, width: 200, height: 180 },
      kiyoungiArm: { offsetX: -60, offsetY: 0, length: 180, angle: -60 },
      customLines: [],
      basicLineColor: "#E5E5E5",
      lineDrawMode: "idle",
      lineDrawPendingStyle: null,
      skinsVisible: true,

      applyBackground: (id) => set({ backgroundSkinId: id }),
      removeBackground: () => set({ backgroundSkinId: null }),
      applyIndicator: (id) => set({ indicatorSkinId: id }),
      removeIndicator: () => set({ indicatorSkinId: null }),
      setCrossStyle: (style) =>
        set((s) => ({ crossStyle: s.crossStyle === style ? null : style })),
      setBrickStyle: (style) =>
        set((s) => ({ brickStyle: s.brickStyle === style ? null : style })),
      setBrickOpacity: (style, opacity) =>
        set((s) => ({ brickOpacity: { ...s.brickOpacity, [style]: opacity } })),
      setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),
      setFitMode: (fitMode) => set({ fitMode }),
      toggleTheming: () => set((s) => ({ themingEnabled: !s.themingEnabled })),
      toggleCat: () => set((s) => ({ catEnabled: !s.catEnabled })),
      toggleFire: () => set((s) => ({ fireEnabled: !s.fireEnabled })),
      setFireHeight: (fireHeight) => set({ fireHeight }),
      toggleWaterfall: () =>
        set((s) => ({ waterfallEnabled: !s.waterfallEnabled })),
      setWaterfallHeight: (waterfallHeight) => set({ waterfallHeight }),
      toggleKiyoungi: () => set((s) => ({ kiyoungiEnabled: !s.kiyoungiEnabled })),
      toggleNewsMarkers: () => set((s) => ({ newsMarkersEnabled: !s.newsMarkersEnabled })),
      toggleJigeumiani: () => set((s) => ({ jigeumianiEnabled: !s.jigeumianiEnabled })),
      toggleKeycap: () => set((s) => ({ keycapEnabled: !s.keycapEnabled })),
      setKeycapPos: (keycapPos) => set({ keycapPos }),
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
      clearCustomLines: () => set({ customLines: [] }),
      setBasicLineColor: (basicLineColor) => set({ basicLineColor }),
      setLineDrawMode: (lineDrawMode) => set({ lineDrawMode }),
      setLineDrawPendingStyle: (lineDrawPendingStyle) => set({ lineDrawPendingStyle }),
      toggleSkinsVisible: () =>
        set((s) => ({ skinsVisible: !s.skinsVisible })),
    }),
    {
      name: "skin-settings",
      version: 3,
      partialize: ({ lineDrawMode: _m, lineDrawPendingStyle: _p, ...rest }) => rest,
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
