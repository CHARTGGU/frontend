"use client";

import { useSkinStore } from "@/stores/skinStore";
import { useDragHandle } from "@/lib/useDragHandle";

const MIN_LENGTH = 60;
const MAX_LENGTH = 500;

interface Props {
  selected: boolean;
  onSelect: () => void;
}

/**
 * 기영이의 빛의 검 팔. 앵커(어깨)는 kiyoungiBody 좌상단 기준 상대 오프셋으로 저장 →
 * 본체를 드래그해도 팔이 함께 따라옴. 클릭=선택(끝점 핸들 표시), 드래그=어깨(앵커) 이동(오프셋 조절),
 * 끝점 핸들=각도+길이 조절.
 */
export default function KiyoungiArm({ selected, onSelect }: Props) {
  const body = useSkinStore((s) => s.kiyoungiBody);
  const arm = useSkinStore((s) => s.kiyoungiArm);
  const setArm = useSkinStore((s) => s.setKiyoungiArm);
  const startDrag = useDragHandle();

  const anchorX = body.x + arm.offsetX;
  const anchorY = body.y + arm.offsetY;

  const handleMovePointerDown = (e: React.PointerEvent) => {
    onSelect();
    const start = { ...arm };
    startDrag(e, (dx, dy) => {
      setArm({ offsetX: start.offsetX + dx, offsetY: start.offsetY + dy });
    });
  };

  const handleTipPointerDown = (e: React.PointerEvent) => {
    const start = { ...arm };
    const rad = (start.angle * Math.PI) / 180;
    const tipOffsetX = start.length * Math.SQRT2 * Math.cos(rad);
    const tipOffsetY = start.length * Math.SQRT2 * Math.sin(rad);

    startDrag(e, (dx, dy) => {
      const nx = tipOffsetX + dx;
      const ny = tipOffsetY + dy;
      const newLength = Math.min(
        MAX_LENGTH,
        Math.max(MIN_LENGTH, Math.hypot(nx, ny) / Math.SQRT2),
      );
      const newAngle = (Math.atan2(ny, nx) * 180) / Math.PI;
      setArm({ length: newLength, angle: newAngle });
    });
  };

  return (
    <div
      onPointerDown={handleMovePointerDown}
      style={{
        position: "absolute",
        left: anchorX,
        top: anchorY - arm.length,
        width: arm.length,
        height: arm.length,
        transform: `rotate(${arm.angle + 45}deg)`,
        transformOrigin: "0% 100%",
        pointerEvents: "auto",
        cursor: "move",
        outline: selected ? "2px dashed #f5d76e" : "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/skins/kiyoungi-sword-arm.svg"
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      {selected && (
        <div
          data-export-ignore="true"
          onPointerDown={handleTipPointerDown}
          style={{
            position: "absolute",
            right: -6,
            top: -6,
            width: 12,
            height: 12,
            background: "#f5d76e",
            border: "1px solid #8b5e34",
            borderRadius: "50%",
            cursor: "alias",
          }}
        />
      )}
    </div>
  );
}
