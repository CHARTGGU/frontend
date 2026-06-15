"use client";

import { useDragHandle } from "@/lib/useDragHandle";
import { useStickerStore, type Sticker } from "@/stores/stickerStore";

const MIN_SIZE = 48;

type Corner = "nw" | "ne" | "sw" | "se";
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

export interface StickerBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  sticker: Sticker;
  /** 차트 앵커 → 변환된 현재 화면 px(좌상단). */
  x: number;
  y: number;
  selected: boolean;
  onSelect: () => void;
  /** 드래그/리사이즈 후 px box를 차트 앵커로 환산해 저장하도록 상위에 위임. */
  onCommit: (box: StickerBox) => void;
}

/**
 * 부적 스티커 1개. 클릭=선택(핸들 표시), 드래그=이동, 모서리 핸들=리사이즈, ×=삭제.
 * 위치(x,y)는 상위(StickerOverlay)가 차트 좌표에서 계산해 내려준 px.
 * 조작 결과는 px box로 onCommit → 상위가 다시 차트 앵커로 환산해 저장.
 * 핸들/삭제 버튼은 data-export-ignore로 PNG 캡처에서 제외.
 */
export default function StickerItem({
  sticker,
  x,
  y,
  selected,
  onSelect,
  onCommit,
}: Props) {
  const removeSticker = useStickerStore((s) => s.removeSticker);
  const startDrag = useDragHandle();
  const { width, height } = sticker;

  const handleMovePointerDown = (e: React.PointerEvent) => {
    onSelect();
    const start = { x, y, width, height };
    startDrag(e, (dx, dy) => {
      onCommit({ ...start, x: start.x + dx, y: start.y + dy });
    });
  };

  const handleCornerPointerDown =
    (corner: Corner) => (e: React.PointerEvent) => {
      const start = { x, y, width, height };
      startDrag(e, (dx, dy) => {
        let { x: nx, y: ny, width: w, height: h } = start;
        if (corner === "se") {
          w = Math.max(MIN_SIZE, start.width + dx);
          h = Math.max(MIN_SIZE, start.height + dy);
        } else if (corner === "sw") {
          w = Math.max(MIN_SIZE, start.width - dx);
          h = Math.max(MIN_SIZE, start.height + dy);
          nx = start.x + (start.width - w);
        } else if (corner === "ne") {
          w = Math.max(MIN_SIZE, start.width + dx);
          h = Math.max(MIN_SIZE, start.height - dy);
          ny = start.y + (start.height - h);
        } else {
          w = Math.max(MIN_SIZE, start.width - dx);
          h = Math.max(MIN_SIZE, start.height - dy);
          nx = start.x + (start.width - w);
          ny = start.y + (start.height - h);
        }
        onCommit({ x: nx, y: ny, width: w, height: h });
      });
    };

  return (
    <div
      onPointerDown={handleMovePointerDown}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        pointerEvents: "auto",
        cursor: "move",
        outline: selected ? "2px dashed #f5d76e" : "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sticker.src}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {selected && (
        <>
          <button
            data-export-ignore="true"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removeSticker(sticker.id);
            }}
            title="스티커 삭제"
            aria-label="스티커 삭제"
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#d64545",
              color: "#fff",
              border: "1px solid #fff",
              fontSize: 12,
              lineHeight: "18px",
              cursor: "pointer",
            }}
          >
            ×
          </button>

          {CORNERS.map((corner) => (
            <div
              key={corner}
              data-export-ignore="true"
              onPointerDown={handleCornerPointerDown(corner)}
              style={{
                position: "absolute",
                width: 10,
                height: 10,
                background: "#f5d76e",
                border: "1px solid #8b5e34",
                borderRadius: 2,
                cursor: `${corner}-resize`,
                ...(corner === "nw" && { left: -5, top: -5 }),
                ...(corner === "ne" && { right: -5, top: -5 }),
                ...(corner === "sw" && { left: -5, bottom: -5 }),
                ...(corner === "se" && { right: -5, bottom: -5 }),
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
