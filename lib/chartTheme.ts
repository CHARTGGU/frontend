/**
 * 배경 스킨에 어울리는 색 팔레트(테마).
 * 배경 스킨 적용 시 차트(캔들·그리드·축·텍스트)와 페이지 베이스 배경색을
 * 이 팔레트로 맞춰 전체 무드를 통일한다. presets의 각 BackgroundSkin이 1세트씩 보유.
 */
export interface ChartTheme {
  /** 페이지/차트 베이스 배경색 (투명 차트 뒤에 깔리는 바탕). */
  pageBg: string;
  /** 상승 캔들 (몸통·테두리·심지 공통). 반드시 hex(#rrggbb). */
  candleUp: string;
  /** 하락 캔들. 반드시 hex(#rrggbb). */
  candleDown: string;
  /** 차트 그리드 라인 색 (보통 낮은 알파). */
  grid: string;
  /** 축 텍스트 색. */
  text: string;
  /** 가격축·시간축 테두리 색. */
  axisBorder: string;
}

/**
 * 기본 테마 — 테마 미적용/배경 없음일 때 사용.
 * 값은 기존 하드코딩(ChartCanvas·AppShell)과 동일 → 회귀 없음.
 */
export const DEFAULT_THEME: ChartTheme = {
  pageBg: "#131313",
  candleUp: "#26a69a",
  candleDown: "#ef5350",
  grid: "rgba(255,255,255,0.06)",
  text: "#cccccc",
  axisBorder: "#333333",
};

/**
 * hex(#rrggbb) → rgba 문자열. 거래량 막대 등 캔들색 기반 반투명 파생색 계산용.
 * 잘못된 형식이면 원본을 그대로 반환(안전).
 */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex;
  return `rgba(${r},${g},${b},${alpha})`;
}
