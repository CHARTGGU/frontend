import { useCallback, useRef } from "react";

type DragMoveHandler = (dx: number, dy: number) => void;

/**
 * 포인터 드래그 시작 시 window에 move/up 리스너를 등록하고,
 * 드래그 시작점 기준 누적 delta(dx, dy)를 매 move마다 콜백으로 전달.
 * 이동·리사이즈·회전+길이 핸들 모두 "시작 시점 값 + delta로 새 값 계산" 패턴으로 사용.
 */
export function useDragHandle() {
  const activeRef = useRef(false);

  return useCallback(
    (e: React.PointerEvent, onMove: DragMoveHandler, onEnd?: () => void) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeRef.current) return;
      activeRef.current = true;

      const startX = e.clientX;
      const startY = e.clientY;

      const handleMove = (ev: PointerEvent) => {
        onMove(ev.clientX - startX, ev.clientY - startY);
      };

      const handleUp = () => {
        activeRef.current = false;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        onEnd?.();
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [],
  );
}
