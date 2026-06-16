import type { UTCTimestamp } from "lightweight-charts";

export type MarkerSymbol = "BTC" | "ETH";
export type MarkerDirection = "up" | "down" | "neutral";

export interface NewsMarker {
  id: string;
  /** 이벤트 날짜 (UTC 자정, unix seconds). */
  time: UTCTimestamp;
  /** 해당 종목 (BTC·ETH 모두에 영향이면 둘 다). */
  symbols: MarkerSymbol[];
  /** 가격 방향: 급등=up, 급락=down, 혼조=neutral. */
  direction: MarkerDirection;
  /** 이벤트 제목 — 10자 이내. */
  title: string;
  /** 이벤트 요약 — 20자 이내. */
  body: string;
}

/**
 * BTC·ETH 일 변동성 5% 초과 이벤트 목록 (2022~2025).
 *
 * 수집 기준: (high-low)/open > 5% 또는 |close-open|/open > 5% 이상 기록한
 * 날짜 중 명확한 뉴스 트리거가 있는 것만 선별.
 * 타이틀 ≤10자, 바디 ≤20자.
 */
export const NEWS_MARKERS: NewsMarker[] = [
  // ── 2022 ────────────────────────────────────────────────
  {
    id: "2022-05-09",
    time: 1652054400 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "LUNA 붕괴",
    body: "테라 UST 디페그 쇼크",
  },
  {
    id: "2022-09-15",
    time: 1663200000 as UTCTimestamp,
    symbols: ["ETH"],
    direction: "down",
    title: "ETH 머지",
    body: "지분증명 전환 셀더뉴스",
  },
  {
    id: "2022-11-08",
    time: 1667865600 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "FTX 파산",
    body: "대형 거래소 FTX 뱅크런",
  },
  // ── 2023 ────────────────────────────────────────────────
  {
    id: "2023-08-17",
    time: 1692230400 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "down",
    title: "BTC 급락",
    body: "SpaceX BTC 전량 매도",
  },
  {
    id: "2023-08-29",
    time: 1693267200 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "GBTC 승소",
    body: "그레이스케일 SEC 소송 승리",
  },
  {
    id: "2023-10-16",
    time: 1697414400 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "ETF 오보",
    body: "블랙록 ETF 승인 오보 급등",
  },
  {
    id: "2023-10-23",
    time: 1698019200 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "BTC +10%",
    body: "현물 ETF 기대 대형 랠리",
  },
  // ── 2024 ────────────────────────────────────────────────
  {
    id: "2024-01-10",
    time: 1704844800 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "BTC ETF 승인",
    body: "미 SEC 현물 ETF 첫 승인",
  },
  {
    id: "2024-03-05",
    time: 1709596800 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "BTC 신고가",
    body: "ETF 수요로 역대 최고가 달성",
  },
  {
    id: "2024-03-13",
    time: 1710288000 as UTCTimestamp,
    symbols: ["ETH"],
    direction: "up",
    title: "ETH 덴쿤",
    body: "레이어2 가스비 절감 업그레이드",
  },
  {
    id: "2024-04-20",
    time: 1713571200 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "neutral",
    title: "BTC 반감기",
    body: "4번째 채굴 보상 반감 완료",
  },
  {
    id: "2024-05-23",
    time: 1716422400 as UTCTimestamp,
    symbols: ["ETH"],
    direction: "up",
    title: "ETH ETF",
    body: "미 SEC 이더리움 ETF 승인",
  },
  {
    id: "2024-07-13",
    time: 1720828800 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "up",
    title: "트럼프 피격",
    body: "암살 미수 친코인 후보 급등",
  },
  {
    id: "2024-07-27",
    time: 1722038400 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "트럼프 연설",
    body: "BTC 전략 비축 공약 발표",
  },
  {
    id: "2024-11-06",
    time: 1730851200 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "up",
    title: "트럼프 당선",
    body: "친코인 대통령 당선 급등",
  },
  {
    id: "2024-12-05",
    time: 1733356800 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "BTC 10만달러",
    body: "비트코인 역사적 10만$ 돌파",
  },
  // ── 2025 ────────────────────────────────────────────────
  {
    id: "2025-04-07",
    time: 1743984000 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "관세 충격",
    body: "미중 무역전쟁 관세 폭탄 급락",
  },
  {
    id: "2025-10-10",
    time: 1760054400 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "100% 관세",
    body: "중국 100% 관세 BTC -10%",
  },
];
