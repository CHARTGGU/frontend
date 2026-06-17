import type { FitMode } from "@/stores/skinStore";

export type SkinCategory = "background" | "indicator" | "widget" | "set" | "drawing";

export const CATEGORY_META: Record<
  SkinCategory,
  { label: string; icon: string; accent: string }
> = {
  // accent: 카테고리별 고유 색 — 헤더 좌측 바·아이콘 칩·카운트 배지에 사용해 구분.
  background: { label: "배경 스킨", icon: "🖼️", accent: "#4aa3ff" },
  indicator: { label: "지표 스킨", icon: "📍", accent: "#f5b945" },
  widget: { label: "위젯", icon: "🐾", accent: "#e06ec5" },
  set: { label: "세트 테마", icon: "🎨", accent: "#5fd38d" },
  drawing: { label: "그리기", icon: "✏️", accent: "#a78bfa" },
};

/**
 * 지표 스킨이 어느 지표에 바인딩되는지 구분.
 * 같은 카테고리(지표 스킨) 안에서도 연동 지표가 달라 서브그룹으로 표시.
 */
export type IndicatorBinding = "price-extreme" | "cross" | "volume-profile" | "ichimoku";

export const INDICATOR_BINDING_META: Record<
  IndicatorBinding,
  { label: string; icon: string; hint: string; accent: string }
> = {
  // accent: 지표 스킨 안의 하위 그룹(바인딩)별 고유 색 — 아이콘 칩·라벨·좌측 바·배지에 사용해 구분.
  "price-extreme": {
    label: "고가·저가",
    icon: "📈",
    hint: "기간 최고·최저점에 연동",
    accent: "#34c3a4",
  },
  cross: {
    label: "골든·데드크로스",
    icon: "✨",
    hint: "MA20 × MA60 교차에 연동",
    accent: "#f5c14b",
  },
  "volume-profile": {
    label: "매물대",
    icon: "🧱",
    hint: "가격대별 거래량(거래량 프로파일)에 연동",
    accent: "#e8794b",
  },
  ichimoku: {
    label: "일목균형표",
    icon: "☁️",
    hint: "전환선·기준선·선행스팬A/B·후행스팬 + 구름 채움",
    accent: "#7c9fe0",
  },
};

/** 지표 스킨 서브그룹 표시 순서. */
export const INDICATOR_BINDING_ORDER: IndicatorBinding[] = [
  "price-extreme",
  "cross",
  "volume-profile",
  "ichimoku",
];

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
  /** 지표 스킨일 때 연동 지표 구분(서브그룹). 그 외 카테고리는 미사용. */
  binding?: IndicatorBinding;
}

export interface BackgroundSkin extends BaseSkin {
  category: "background";
  image: string;
  defaultFit: FitMode;
  /** 적용 시 기본 투명도. 없으면 현재 투명도 유지. */
  defaultOpacity?: number;
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
  {
    id: "bg-gazua",
    name: "가즈아",
    author: "ChartSkin",
    description: "폭락 전광판 앞에서 기도하는 아이. 존버 트레이더의 간절함.",
    category: "background",
    status: "available",
    thumbnail: "/skins/bg-gazua.png",
    image: "/skins/bg-gazua.png",
    defaultFit: "cover",
  },
  {
    id: "bg-budda",
    name: "부다",
    author: "ChartSkin",
    description: "부처님의 가호로 수익을 기원합니다.",
    category: "background",
    status: "available",
    thumbnail: "/skins/bg-budda.jpeg",
    image: "/skins/bg-budda.jpeg",
    defaultFit: "cover",
    defaultOpacity: 0.3,
  },
  {
    id: "bg-karina",
    name: "카리나",
    author: "ChartSkin",
    description: "카리나와 함께하는 트레이딩.",
    category: "background",
    status: "available",
    thumbnail: "/skins/bg-karina.png",
    image: "/skins/bg-karina.png",
    defaultFit: "cover",
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
    binding: "price-extreme",
    status: "available",
    thumbnail: "/skins/cat-photo-happy.png",
    characters: {
      happy: "/skins/cat-photo-happy.png",
      sad: "/skins/cat-photo-sad.png",
      neutral: "/skins/cat-photo-neutral.png",
    },
  },
];

/**
 * 지표 바인딩 연출 스킨 — 골든/데드크로스(MA20×MA60)·매물대 벽돌.
 * 캐릭터 없음(BaseSkin). 적용은 skinStore.crossStyle/brickStyle 토글.
 * id ↔ 스타일 매핑은 SkinSidebar에서 처리.
 */
export const BINDING_SKINS: BaseSkin[] = [
  {
    id: "ind-cross-muhan",
    name: "무한도전 크로스",
    author: "ChartSkin",
    description: "골든크로스엔 무야~호~, 데드크로스엔 해골 스티커가 떠요.",
    category: "indicator",
    binding: "cross",
    status: "available",
    thumbnail: "/skins/muhan-muyaho.png",
  },
  {
    id: "ind-cross-neon",
    name: "네온 크로스",
    author: "ChartSkin",
    description: "MA20×MA60 교차점에 네온 링이 확산되는 사이버펑크 연출.",
    category: "indicator",
    binding: "cross",
    status: "available",
    thumbnail: "/skins/cross-neon.svg",
  },
  {
    id: "ind-cross-burst",
    name: "이모지 분수 크로스",
    author: "ChartSkin",
    description: "교차점에서 🚀💎🙌(골든)·📉💀(데드) 이모지가 솟구쳐요.",
    category: "indicator",
    binding: "cross",
    status: "available",
    thumbnail: "/skins/cross-burst.svg",
  },
  {
    id: "ind-brick-pixel",
    name: "픽셀 벽돌 매물대",
    author: "ChartSkin",
    description: "가격대별 거래량을 픽셀 벽돌로 쌓아요. 최대 매물대는 금색 벽.",
    category: "indicator",
    binding: "volume-profile",
    status: "available",
    thumbnail: "/skins/brick-pixel.svg",
  },
  {
    id: "ind-brick-gold",
    name: "골드바 매물대",
    author: "ChartSkin",
    description: "거래량을 골드바로 표현. 최대 매물대(POC)는 금괴로 강조.",
    category: "indicator",
    binding: "volume-profile",
    status: "available",
    thumbnail: "/skins/brick-gold.svg",
  },
  {
    id: "ind-ichimoku-cloud",
    name: "일목균형표",
    author: "ChartSkin",
    description: "전환선·기준선·선행스팬A·B·후행스팬 5선 + 구름 채움. 돌파 시 ✈️ 연출.",
    category: "indicator",
    binding: "ichimoku",
    status: "available",
    thumbnail: "/skins/ichimoku-thumb.svg",
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
    id: "wg-waterfall",
    name: "폭포수 효과",
    author: "ChartSkin",
    description: "화면 위에서 물줄기가 쏟아져 포말로 부서지는 폭포 효과.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/waterfall-thumb.svg",
  },
  {
    id: "wg-news-marker",
    name: "뉴스 마커",
    author: "ChartSkin",
    description: "5% 급등락 날짜에 뉴스 이유를 시간축 아이콘으로 표시.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/news-marker.svg",
  },
  {
    id: "wg-keycap",
    name: "키캡 키링",
    author: "ChartSkin",
    description: "상승↑·하락↓·상한가·₿ 4키 — 누르면 기계식 키보드 소리가 나요. 드래그로 위치 이동.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/keycap-thumb.svg",
  },
  {
    id: "wg-jigeumiani",
    name: "지금이니? 🤔",
    author: "ChartSkin",
    description: "장대양봉(몸통 3% 이상, 몸통/범위 60% 이상) 캔들 위에 '지금이니? 🤔' 말풍선을 띄워요.",
    category: "widget",
    status: "available",
    thumbnail: "/skins/jigeumiani-thumb.svg",
  },
];

/**
 * 부적 스티커 — 차트 위에 여러 장 자유 배치(드래그·리사이즈·삭제).
 * 위젯 카테고리에 표시. 적용은 stickerStore.addSticker(image)로 인스턴스 추가.
 * id ↔ 이미지 매핑은 STICKER_IMAGE에서 처리.
 */
export const STICKER_SKINS: BaseSkin[] = [
  {
    id: "wg-bujeok-rich",
    name: "부자 부적",
    author: "ChartSkin",
    description:
      "수상한 기운을 불러오는 부자 부적. 붙이기를 누르면 차트에 부적이 추가돼요.",
    category: "drawing",
    status: "available",
    thumbnail: "/skins/bujeok-rich.jpeg",
  },
];

/** 그리기 전용 위젯 (기영이). 라인그리기·부적과 같은 섹션에 표시. */
export const DRAWING_SKINS: BaseSkin[] = [
  {
    id: "wg-kiyoungi",
    name: "기영이 위젯",
    author: "ChartSkin",
    description: "기영이 매매법을 적용 가능한 위젯",
    category: "drawing",
    status: "available",
    thumbnail: "/skins/kiyoungi-thumb.png",
  },
];

/** 스티커 스킨 id ↔ 부착할 이미지 경로 매핑. */
export const STICKER_IMAGE: Record<string, string> = {
  "wg-bujeok-rich": "/skins/bujeok-rich.jpeg",
};

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
  indicator: [...INDICATOR_SKINS, ...BINDING_SKINS],
  widget: WIDGET_SKINS,
  set: SET_SKINS,
  drawing: [...DRAWING_SKINS, ...STICKER_SKINS],
};

/** 바인딩 스킨 id ↔ skinStore 스타일 매핑 (SkinSidebar 토글용). */
export const CROSS_SKIN_STYLE: Record<string, "neon" | "burst" | "muhan"> = {
  "ind-cross-neon": "neon",
  "ind-cross-burst": "burst",
  "ind-cross-muhan": "muhan",
};

export const BRICK_SKIN_STYLE: Record<string, "pixel" | "gold"> = {
  "ind-brick-pixel": "pixel",
  "ind-brick-gold": "gold",
};

export function findBackgroundSkin(id: string | null): BackgroundSkin | null {
  return BACKGROUND_SKINS.find((s) => s.id === id) ?? null;
}

export function findIndicatorSkin(id: string | null): IndicatorSkin | null {
  return INDICATOR_SKINS.find((s) => s.id === id) ?? null;
}
