import { z } from "zod";
import type { IntervalId, SymbolId } from "./types";

const BINANCE_BASE = "https://api.binance.com";

/**
 * Binance klines 응답: 배열의 배열.
 * [openTime, open, high, low, close, volume, closeTime, ...] — 인덱스 0~5만 사용.
 * 외부 데이터이므로 zod로 형태 검증. (CLAUDE.md 입력 검증)
 */
const KlineTupleSchema = z.tuple([
  z.number(), // 0 open time (ms)
  z.string(), // 1 open
  z.string(), // 2 high
  z.string(), // 3 low
  z.string(), // 4 close
  z.string(), // 5 volume
]).rest(z.unknown());

const KlinesSchema = z.array(KlineTupleSchema);

export type RawKline = z.infer<typeof KlineTupleSchema>;

interface FetchKlinesParams {
  symbol: SymbolId;
  interval: IntervalId;
  limit?: number;
  /** 이 시각(ms) 이전 캔들 조회 — 과거 페이징용. */
  endTime?: number;
  signal?: AbortSignal;
}

/**
 * Binance 과거 캔들 조회. 키 불필요 + CORS 허용 → 브라우저 직접 호출.
 * (주식·기타 소스는 추후 app/api/* 프록시 경유 — 현재는 Backlog)
 */
export async function fetchKlines({
  symbol,
  interval,
  limit = 300,
  endTime,
  signal,
}: FetchKlinesParams): Promise<RawKline[]> {
  const url = new URL("/api/v3/klines", BINANCE_BASE);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));
  if (endTime !== undefined) url.searchParams.set("endTime", String(endTime));

  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("네트워크 오류로 시세를 불러오지 못했습니다.");
  }

  if (!res.ok) {
    throw new Error(`시세 조회 실패 (HTTP ${res.status})`);
  }

  const json: unknown = await res.json();
  const parsed = KlinesSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("시세 응답 형식이 올바르지 않습니다.");
  }
  return parsed.data;
}

const BINANCE_WS = "wss://stream.binance.com:9443/ws";

/** WS kline 메시지 검증 (필요한 필드만). */
const KlineSocketSchema = z.object({
  k: z.object({
    t: z.number(), // openTime (ms)
    o: z.string(),
    h: z.string(),
    l: z.string(),
    c: z.string(),
    v: z.string(),
    x: z.boolean(), // 캔들 마감 여부
  }),
});

export interface RealtimeBar {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closed: boolean;
}

/**
 * Binance kline WebSocket 구독 (키 불필요·CORS 무관).
 * 진행 중 캔들이 매 체결마다 갱신됨 → onBar 콜백.
 * 반환된 cleanup 호출로 연결 종료.
 */
export function subscribeKline(
  symbol: SymbolId,
  interval: IntervalId,
  onBar: (bar: RealtimeBar) => void,
): () => void {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  const ws = new WebSocket(`${BINANCE_WS}/${stream}`);

  ws.onmessage = (event) => {
    try {
      const parsed = KlineSocketSchema.safeParse(JSON.parse(event.data));
      if (!parsed.success) return;
      const k = parsed.data.k;
      onBar({
        time: Math.floor(k.t / 1000),
        open: Number(k.o),
        high: Number(k.h),
        low: Number(k.l),
        close: Number(k.c),
        volume: Number(k.v),
        closed: k.x,
      });
    } catch {
      // 파싱 실패한 메시지는 무시.
    }
  };

  return () => {
    ws.onmessage = null;
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
}
