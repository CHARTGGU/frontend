import type { FitMode } from "@/stores/skinStore";

export type SkinCategory = "background" | "indicator" | "widget" | "set";

export const CATEGORY_META: Record<
  SkinCategory,
  { label: string; icon: string }
> = {
  background: { label: "배경 스킨", icon: "🖼️" },
  indicator: { label: "지표 스킨", icon: "📍" },
  widget: { label: "위젯", icon: "🐾" },
  set: { label: "세트 테마", icon: "🎨" },
};

interface BaseSkin {
  id: string;
  name: string;
  author: string;
  description: string;
  category: SkinCategory;
  /** 'available' = 실제 적용 가능, 'soon' = 자리만(준비중). */
  status: "available" | "soon";
  /** 카드 썸네일 (배경색 또는 이미지). */
  thumbnail: string;
}

export interface BackgroundSkin extends BaseSkin {
  category: "background";
  image: string;
  defaultFit: FitMode;
}

export interface IndicatorSkin extends BaseSkin {
  category: "indicator";
  /** 가격 포인트에 붙는 캐릭터 이미지 (표정 variant). */
  characters: { happy: string; sad: string; neutral: string };
}

export type Skin = BackgroundSkin | IndicatorSkin | BaseSkin;

/** 배경 스킨 — 번들 SVG, 실제 적용 가능. */
export const BACKGROUND_SKINS: BackgroundSkin[] = [
  {
    id: "bg-night-sky",
    name: "밤하늘",
    author: "ChartSkin",
    description: "달과 별이 뜬 보라빛 밤하늘. 야간 트레이딩 무드.",
    category: "background",
    status: "available",
    thumbnail: "/skins/bg-night-sky.svg",
    image: "/skins/bg-night-sky.svg",
    defaultFit: "cover",
  },
  {
    id: "bg-candy",
    name: "캔디 패턴",
    author: "ChartSkin",
    description: "파스텔 도트 패턴. 귀엽고 달달한 분위기.",
    category: "background",
    status: "available",
    thumbnail: "/skins/bg-candy.svg",
    image: "/skins/bg-candy.svg",
    defaultFit: "tile",
  },
];

/** 지표 스킨 — 최고/최저점에 캐릭터+말풍선, 실제 적용 가능. */
export const INDICATOR_SKINS: IndicatorSkin[] = [
  {
    id: "ind-cat",
    name: "감정 고양이",
    author: "ChartSkin",
    description: "기간 최고점엔 신난 고양이, 최저점엔 슬픈 고양이가 붙어요.",
    category: "indicator",
    status: "available",
    thumbnail: "/skins/cat-photo-happy.png",
    characters: {
      happy: "/skins/cat-photo-happy.png",
      sad: "/skins/cat-photo-sad.png",
      neutral: "/skins/cat-photo-neutral.png",
    },
  },
];

/** 위젯 — Phase 2. 카테고리 자리만(준비중). */
export const WIDGET_SKINS: BaseSkin[] = [
  {
    id: "wg-running-cat",
    name: "뛰어다니는 고양이",
    author: "ChartSkin",
    description: "차트 캔들 고가 위를 좌우로 뛰어다니는 고양이 위젯.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/cat-running.svg",
  },
  {
    id: "wg-fire",
    name: "불타는 효과",
    author: "ChartSkin",
    description: "화면 하단이 절차적으로 타오르는 화염 효과.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/fire-thumb.svg",
  },
  {
    id: "wg-kiyoungi",
    name: "기영이 위젯",
    author: "ChartSkin",
    description: "횡보 구간엔 기영이, 급등 구간엔 빛의 검을 직접 배치하는 밈 위젯.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/kiyoungi-thumb.svg",
  },
  {
    id: "wg-news-marker",
    name: "뉴스 마커",
    author: "ChartSkin",
    description: "종목 뉴스를 차트 시간축에 표시. (준비중)",
    category: "widget",
    status: "soon",
    thumbnail: "/skins/news-marker.svg",
  },
];

/** 세트 테마 — Phase 2. 카테고리 자리만(준비중). */
export const SET_SKINS: BaseSkin[] = [
  {
    id: "set-night",
    name: "밤하늘 세트",
    author: "ChartSkin",
    description: "배경+지표+색상 묶음 패키지. (준비중)",
    category: "set",
    status: "soon",
    thumbnail: "/skins/bg-night-sky.svg",
  },
  {
    id: "set-candy",
    name: "달달 세트",
    author: "ChartSkin",
    description: "캔디 배경 + 고양이 지표 묶음. (준비중)",
    category: "set",
    status: "soon",
    thumbnail: "/skins/bg-candy.svg",
  },
];

export const SKINS_BY_CATEGORY: Record<SkinCategory, Skin[]> = {
  background: BACKGROUND_SKINS,
  indicator: INDICATOR_SKINS,
  widget: WIDGET_SKINS,
  set: SET_SKINS,
};

export function findBackgroundSkin(id: string | null): BackgroundSkin | null {
  return BACKGROUND_SKINS.find((s) => s.id === id) ?? null;
}

export function findIndicatorSkin(id: string | null): IndicatorSkin | null {
  return INDICATOR_SKINS.find((s) => s.id === id) ?? null;
}
