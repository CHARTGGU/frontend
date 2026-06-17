import type { FitMode } from "@/stores/skinStore";
import { DEFAULT_THEME, type ChartTheme } from "@/lib/chartTheme";

export type SkinCategory = "background" | "indicator" | "widget" | "drawing";

export const CATEGORY_META: Record<
  SkinCategory,
  { label: string; icon: string; accent: string }
> = {
  // accent: 카테고리별 고유 색 — 헤더 좌측 바·아이콘 칩·카운트 배지에 사용해 구분.
  background: { label: "배경 스킨", icon: "🖼️", accent: "#4aa3ff" },
  indicator: { label: "지표 스킨", icon: "📍", accent: "#f5b945" },
  widget: { label: "위젯", icon: "🐾", accent: "#e06ec5" },
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
  /**
   * 이 배경에 어울리는 색 팔레트. 적용 시(테마 켜짐) 차트 캔들·그리드·축·텍스트와
   * 페이지 베이스 배경색이 이 값으로 바뀐다. 없으면 DEFAULT_THEME 사용.
   */
  theme?: ChartTheme;
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
    theme: {
      pageBg: "#16112e",
      candleUp: "#5fe0c8",
      candleDown: "#ff6b8a",
      grid: "rgba(160,150,230,0.10)",
      text: "#d4cdf0",
      axisBorder: "#372f5e",
    },
  },
  {
    id: "bg-cyber-grid",
    name: "사이버펑크 그리드",
    author: "ChartSkin",
    description: "신스웨이브 태양과 네온 원근 그리드. CRT 스캔라인까지, 차트 단말기 무드.",
    category: "background",
    status: "available",
    thumbnail: "/skins/bg-cyber-grid.svg",
    image: "/skins/bg-cyber-grid.svg",
    defaultFit: "cover",
    theme: {
      pageBg: "#0d0221",
      candleUp: "#2de2e6",
      candleDown: "#ff2e97",
      grid: "rgba(255,46,151,0.10)",
      text: "#9af7f2",
      axisBorder: "#3a1d5e",
    },
  },
  {
    id: "bg-moon-rally",
    name: "떡상 일출",
    author: "ChartSkin",
    description: "지평선 위로 떠오르는 황금빛 태양과 솟구치는 상승 캔들. 가즈아 무드.",
    category: "background",
    status: "available",
    thumbnail: "/skins/bg-moon-rally.svg",
    image: "/skins/bg-moon-rally.svg",
    defaultFit: "cover",
    theme: {
      pageBg: "#1c1305",
      candleUp: "#86d96a",
      candleDown: "#ff7a45",
      grid: "rgba(255,196,84,0.09)",
      text: "#f5e0b0",
      axisBorder: "#4a3413",
    },
  },
  {
    id: "bg-abyss-aurora",
    name: "심해 오로라",
    author: "ChartSkin",
    description: "딥블루 심해에 흐르는 청록 오로라와 떠오르는 기포. 차분한 시네마틱 무드.",
    category: "background",
    status: "available",
    thumbnail: "/skins/bg-abyss-aurora.svg",
    image: "/skins/bg-abyss-aurora.svg",
    defaultFit: "cover",
    theme: {
      pageBg: "#072135",
      candleUp: "#46ecd0",
      candleDown: "#ff7384",
      grid: "rgba(70,236,208,0.10)",
      text: "#bfe6ef",
      axisBorder: "#11506b",
    },
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
    theme: {
      pageBg: "#15110d",
      candleUp: "#3ecf8e",
      candleDown: "#ff4d4d",
      grid: "rgba(255,255,255,0.05)",
      text: "#d8cbb6",
      axisBorder: "#3a2f22",
    },
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
    theme: {
      pageBg: "#1a1308",
      candleUp: "#5ec98a",
      candleDown: "#ef5350",
      grid: "rgba(255,210,120,0.07)",
      text: "#e8d8a8",
      axisBorder: "#43361a",
    },
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
    defaultOpacity: 0.35,
    theme: {
      pageBg: "#141016",
      candleUp: "#34d3a0",
      candleDown: "#ff5d73",
      grid: "rgba(255,255,255,0.06)",
      text: "#d7cfe0",
      axisBorder: "#332b3d",
    },
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

export const SKINS_BY_CATEGORY: Record<SkinCategory, Skin[]> = {
  background: BACKGROUND_SKINS,
  indicator: [...INDICATOR_SKINS, ...BINDING_SKINS],
  widget: WIDGET_SKINS,
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

/**
 * 적용된 배경 스킨 id + 테마 on/off → 차트·페이지에 쓸 ChartTheme 결정.
 * - 테마 꺼짐 → 항상 DEFAULT_THEME (기존 색 유지).
 * - 스킨 없음/팔레트 없음(커스텀 업로드 배경 등) → DEFAULT_THEME.
 * 반환값은 항상 동일 객체 참조(스킨의 theme 또는 DEFAULT_THEME)라 useEffect dep로 안전.
 */
export function resolveTheme(
  backgroundSkinId: string | null,
  themingEnabled: boolean,
): ChartTheme {
  if (!themingEnabled) return DEFAULT_THEME;
  return findBackgroundSkin(backgroundSkinId)?.theme ?? DEFAULT_THEME;
}

export function findIndicatorSkin(id: string | null): IndicatorSkin | null {
  return INDICATOR_SKINS.find((s) => s.id === id) ?? null;
}
