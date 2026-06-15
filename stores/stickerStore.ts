import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 화면에 부착된 부적 스티커 1개.
 * 위치는 화면(viewport) px가 아니라 차트 좌표에 앵커링 →
 * 스크롤·줌하면 차트와 함께 이동한다.
 *  - time:  차트 시간축 값(UTCTimestamp, 초). 과거 데이터 prepend에도 불변 → 위치 고정.
 *  - price: 차트 가격축 가격.
 * 크기(width/height)는 px 고정(줌과 무관).
 * time/price = null → 아직 미배치. 오버레이가 다음 렌더에서 화면 중앙에 앵커를 부여.
 *
 * 주의: 시간축 앵커로 logical(데이터 배열 인덱스)을 쓰면 안 된다.
 * loadOlder가 과거 캔들을 배열 앞에 prepend → 모든 바의 logical이 밀려 스티커가 따라온다.
 */
export interface Sticker {
  id: string;
  src: string;
  time: number | null;
  price: number | null;
  width: number;
  height: number;
}

interface StickerState {
  stickers: Sticker[];
  /** 새 스티커 추가. 좌표는 미정(null) — 오버레이가 차트 중앙 앵커(time, price)로 확정. */
  addSticker: (src: string) => void;
  removeSticker: (id: string) => void;
  updateSticker: (id: string, patch: Partial<Omit<Sticker, "id">>) => void;
  clearStickers: () => void;
}

const DEFAULT_SIZE = 140;
/** 부적 원본 비율(528×705) 유지. */
const DEFAULT_RATIO = 705 / 528;

const newId = () =>
  `sticker-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const useStickerStore = create<StickerState>()(
  persist(
    (set) => ({
      stickers: [],

      addSticker: (src) =>
        set((s) => ({
          stickers: [
            ...s.stickers,
            {
              id: newId(),
              src,
              time: null,
              price: null,
              width: DEFAULT_SIZE,
              height: Math.round(DEFAULT_SIZE * DEFAULT_RATIO),
            },
          ],
        })),

      removeSticker: (id) =>
        set((s) => ({ stickers: s.stickers.filter((st) => st.id !== id) })),

      updateSticker: (id, patch) =>
        set((s) => ({
          stickers: s.stickers.map((st) =>
            st.id === id ? { ...st, ...patch } : st,
          ),
        })),

      clearStickers: () => set({ stickers: [] }),
    }),
    {
      name: "sticker-settings",
      version: 2,
      // v0(화면 px) · v1(logical 앵커) → v2(time 앵커): 구 데이터 호환 불가 → 초기화.
      migrate: () => ({ stickers: [] }),
    },
  ),
);
