"use client";

import { useSkinStore } from "@/stores/skinStore";
import { useDragHandle } from "@/lib/useDragHandle";

const MIN_SIZE = 60;

type Corner = "nw" | "ne" | "sw" | "se";
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

interface Props {
  selected: boolean;
  onSelect: () => void;
}

/** 기영이 본체(얼굴). 클릭=선택(핸들 표시), 드래그=이동, 모서리 핸들=리사이즈. */
export default function KiyoungiBody({ selected, onSelect }: Props) {
  const body = useSkinStore((s) => s.kiyoungiBody);
  const setBody = useSkinStore((s) => s.setKiyoungiBody);
  const startDrag = useDragHandle();

  const handleMovePointerDown = (e: React.PointerEvent) => {
    onSelect();
    const start = { ...body };
    startDrag(e, (dx, dy) => {
      setBody({ x: start.x + dx, y: start.y + dy });
    });
  };

  const handleCornerPointerDown =
    (corner: Corner) => (e: React.PointerEvent) => {
      const start = { ...body };
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
        setBody({ x, y, width, height });
      });
    };

  return (
    <div
      onPointerDown={handleMovePointerDown}
      style={{
        position: "absolute",
        left: body.x,
        top: body.y,
        width: body.width,
        height: body.height,
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
