"use client";

import { useLayoutEffect, useState } from "react";

/**
 * 셀렉터로 찾은 요소의 화면 사각형(DOMRect)을 측정하고 추적한다.
 * - resize/scroll/ResizeObserver 변화를 requestAnimationFrame으로 throttle 갱신
 *   (CLAUDE.md §5: view 변화에 딱딱 따라붙는 기민함).
 * - 마운트 직후 타깃이 아직 없을 수 있어 최대 MAX_POLL 프레임 폴링.
 * - 끝내 못 찾으면 null.
 */
const MAX_POLL = 30;

export function useTargetRect(
  selector: string,
  enabled: boolean,
): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!enabled || !selector) {
      setRect(null);
      return;
    }

    let raf = 0;
    let polls = 0;

    const measure = () => {
      const el = document.querySelector(selector);
      if (el) {
        setRect(el.getBoundingClientRect());
        return;
      }
      // 아직 미마운트 → 다음 프레임 재시도(한도 내).
      if (polls < MAX_POLL) {
        polls += 1;
        raf = requestAnimationFrame(measure);
      } else {
        setRect(null);
      }
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.querySelector(selector);
        setRect(el ? el.getBoundingClientRect() : null);
      });
    };

    measure();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true); // 내부 스크롤 포함(capture)
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      ro.disconnect();
    };
  }, [selector, enabled]);

  return rect;
}
