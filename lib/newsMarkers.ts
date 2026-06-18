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
 * BTC·ETH 주요 이벤트 목록 (2020~2025).
 *
 * 수집 기준: (high-low)/open > 3% 또는 |close-open|/open > 3% 기록한
 * 날짜 중 뉴스 트리거가 있는 것, 또는 시장에 영향을 준 주요 규제·온체인 이벤트.
 * 타이틀 ≤10자, 바디 ≤20자.
 */
export const NEWS_MARKERS: NewsMarker[] = [
  // ── 2020 ────────────────────────────────────────────────
  {
    id: "2020-03-12",
    time: 1583971200 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "코로나 폭락",
    body: "COVID-19 공포 BTC -40%",
  },
  {
    id: "2020-05-11",
    time: 1589155200 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "neutral",
    title: "BTC 반감기",
    body: "3번째 채굴 보상 반감",
  },
  {
    id: "2020-10-21",
    time: 1603238400 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "페이팔 코인",
    body: "페이팔 암호화폐 결제 지원",
  },
  {
    id: "2020-12-16",
    time: 1608076800 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "BTC 2만달러",
    body: "역대 신고가 $20,000 돌파",
  },
  // ── 2021 ────────────────────────────────────────────────
  {
    id: "2021-01-29",
    time: 1611878400 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "머스크 BTC",
    body: "트위터 바이오에 #Bitcoin 추가",
  },
  {
    id: "2021-02-08",
    time: 1612742400 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "테슬라 매수",
    body: "테슬라 BTC 15억달러 매입",
  },
  {
    id: "2021-04-14",
    time: 1618358400 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "up",
    title: "코인베이스 IPO",
    body: "나스닥 직접 상장 사상 최고가",
  },
  {
    id: "2021-05-12",
    time: 1620777600 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "down",
    title: "테슬라 매도",
    body: "머스크 BTC 결제 중단 선언",
  },
  {
    id: "2021-05-19",
    time: 1621382400 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "중국 금지",
    body: "중국 금융기관 코인 거래 금지",
  },
  {
    id: "2021-06-09",
    time: 1623196800 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "엘살바도르",
    body: "BTC 법정화폐 세계 최초 채택",
  },
  {
    id: "2021-09-07",
    time: 1630972800 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "down",
    title: "BTC 급락",
    body: "엘살바도르 도입 당일 -17%",
  },
  {
    id: "2021-10-20",
    time: 1634688000 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "선물 ETF",
    body: "ProShares BTC 선물 ETF 출시",
  },
  {
    id: "2021-11-10",
    time: 1636502400 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "BTC 역대 ATH",
    body: "$68,789 역대 최고가 달성",
  },
  // ── 2022 ────────────────────────────────────────────────
  {
    id: "2022-01-21",
    time: 1642723200 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "금리 공포",
    body: "연준 금리인상 우려 -14%",
  },
  {
    id: "2022-03-02",
    time: 1646179200 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "up",
    title: "우크라 지원",
    body: "전쟁 난민 암호화폐 모금 급등",
  },
  {
    id: "2022-05-09",
    time: 1652054400 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "LUNA 붕괴",
    body: "테라 UST 디페그 쇼크",
  },
  {
    id: "2022-06-13",
    time: 1655078400 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "셀시우스 동결",
    body: "셀시우스 출금 중단 BTC -15%",
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
    id: "2023-03-10",
    time: 1678406400 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "SVB 파산",
    body: "실리콘밸리뱅크 파산 공포",
  },
  {
    id: "2023-06-06",
    time: 1686009600 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "SEC 소송",
    body: "SEC, 바이낸스·코인베이스 소송",
  },
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
    id: "2025-01-20",
    time: 1737331200 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "up",
    title: "트럼프 취임",
    body: "친코인 대통령 공식 취임 랠리",
  },
  {
    id: "2025-01-23",
    time: 1737590400 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "up",
    title: "코인 행정명령",
    body: "트럼프 암호화폐 우호 EO 서명",
  },
  {
    id: "2025-04-07",
    time: 1743984000 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "관세 충격",
    body: "미중 무역전쟁 관세 폭탄 급락",
  },
  {
    id: "2025-05-22",
    time: 1747872000 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "up",
    title: "미 코인법안",
    body: "미 하원 암호화폐 법안 통과",
  },
  {
    id: "2025-10-10",
    time: 1760054400 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "100% 관세",
    body: "중국 100% 관세 BTC -10%",
  },
  // ── 2026 ────────────────────────────────────────────────
  {
    id: "2026-01-20",
    time: 1768867200 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "미국 비축 서명",
    body: "트럼프 BTC 전략비축 행정명령",
  },
  {
    id: "2026-02-05",
    time: 1770249600 as UTCTimestamp,
    symbols: ["ETH"],
    direction: "up",
    title: "ETH 펙트라",
    body: "펙트라 하드포크 계정추상화 지원",
  },
  {
    id: "2026-03-15",
    time: 1773532800 as UTCTimestamp,
    symbols: ["BTC"],
    direction: "up",
    title: "BTC 15만달러",
    body: "$150,000 역대 신고가 돌파",
  },
  {
    id: "2026-04-17",
    time: 1776384000 as UTCTimestamp,
    symbols: ["ETH"],
    direction: "up",
    title: "ETH 스테이킹 ETF",
    body: "SEC ETH ETF 스테이킹 수익 허용",
  },
  {
    id: "2026-05-20",
    time: 1779235200 as UTCTimestamp,
    symbols: ["BTC", "ETH"],
    direction: "down",
    title: "BTC 조정",
    body: "거시 긴축 우려 -18% 급락",
  },
  {
    id: "2026-06-05",
    time: 1780617600 as UTCTimestamp,
    symbols: ["ETH"],
    direction: "up",
    title: "ETH 급등",
    body: "온체인 활동 폭증 ETH 반등",
  },
];
