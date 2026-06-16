"use client";

import { useDragHandle } from "@/lib/useDragHandle";

const MIN_SIZE = 60;

type Corner = "nw" | "ne" | "sw" | "se";
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

export interface KiyoungiBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  /** 차트 앵커 → 변환된 현재 화면 px(좌상단) + 크기. 상위(KiyoungiOverlay)가 계산해 내려줌. */
  box: KiyoungiBox;
  selected: boolean;
  onSelect: () => void;
  /** 드래그/리사이즈 후 px box를 차트 앵커로 환산해 저장하도록 상위에 위임. */
  onCommit: (box: KiyoungiBox) => void;
}

/**
 * 기영이 본체(얼굴). 클릭=선택(핸들 표시), 드래그=이동, 모서리 핸들=리사이즈.
 * 위치(box)는 상위가 차트 좌표에서 계산해 내려준 px. 조작 결과는 px box로 onCommit →
 * 상위가 다시 차트 앵커로 환산해 저장.
 */
export default function KiyoungiBody({ box, selected, onSelect, onCommit }: Props) {
  const startDrag = useDragHandle();

  const handleMovePointerDown = (e: React.PointerEvent) => {
    onSelect();
    const start = { ...box };
    startDrag(e, (dx, dy) => {
      onCommit({ ...start, x: start.x + dx, y: start.y + dy });
    });
  };

  const handleCornerPointerDown =
    (corner: Corner) => (e: React.PointerEvent) => {
      const start = { ...box };
      startDrag(e, (dx, dy) => {
        let { x, y, width, height } = start;
        if (corner === "se") {
          width = Math.max(MIN_SIZE, start.width + dx);
          height = Math.max(MIN_SIZE, start.height + dy);
        } else if (corner === "sw") {
          width = Math.max(MIN_SIZE, start.width - dx);
          height = Math.max(MIN_SIZE, start.height + dy);
          x = start.x + (start.width - width);
        } else if (corner === "ne") {
          width = Math.max(MIN_SIZE, start.width + dx);
          height = Math.max(MIN_SIZE, start.height - dy);
          y = start.y + (start.height - height);
        } else {
          width = Math.max(MIN_SIZE, start.width - dx);
          height = Math.max(MIN_SIZE, start.height - dy);
          x = start.x + (start.width - width);
          y = start.y + (start.height - height);
        }
        onCommit({ x, y, width, height });
      });
    };

  return (
    <div
      onPointerDown={handleMovePointerDown}
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        pointerEvents: "auto",
        cursor: "move",
        outline: selected ? "2px dashed #f5d76e" : "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/skins/kiyoungi-face.png"
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      {selected &&
        CORNERS.map((corner) => (
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
    </div>
  );
}
