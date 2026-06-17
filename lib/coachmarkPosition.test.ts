import { describe, expect, it } from "vitest";
import {
  computeCoachmarkPosition,
  COACHMARK_GAP,
  VIEWPORT_MARGIN,
  type RectLike,
} from "./coachmarkPosition";

const VIEWPORT = { width: 1280, height: 800 };
const BUBBLE = { width: 280, height: 120 };

function rect(partial: Partial<RectLike>): RectLike {
  return { top: 0, left: 0, width: 100, height: 40, ...partial };
}

describe("computeCoachmarkPosition", () => {
  it("위/아래 공간 충분하면 아래(bottom)에 배치하고 타깃 중앙 정렬", () => {
    const target = rect({ top: 100, left: 590, width: 100, height: 40 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.placement).toBe("bottom");
    expect(pos.top).toBe(100 + 40 + COACHMARK_GAP);
    // 중앙 정렬: target 중앙 640 - bubble 절반 140 = 500
    expect(pos.left).toBe(500);
  });

  it("아래 공간이 없으면 위(top)에 배치", () => {
    const target = rect({ top: 740, left: 590, width: 100, height: 40 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.placement).toBe("top");
    expect(pos.top).toBe(740 - COACHMARK_GAP - BUBBLE.height);
  });

  it("세로로 꽉 찬 우측 패널이면 왼쪽(left)에 배치", () => {
    const target = rect({ top: 0, left: 980, width: 300, height: 800 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.placement).toBe("left");
    expect(pos.left).toBe(980 - COACHMARK_GAP - BUBBLE.width);
  });

  it("왼쪽 경계를 넘는 left는 VIEWPORT_MARGIN으로 보정", () => {
    const target = rect({ top: 100, left: 0, width: 60, height: 40 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.left).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
  });

  it("오른쪽 경계를 넘지 않도록 left를 보정", () => {
    const target = rect({ top: 100, left: 1240, width: 40, height: 40 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.left + BUBBLE.width).toBeLessThanOrEqual(
      VIEWPORT.width - VIEWPORT_MARGIN,
    );
  });

  it("top도 세로 경계 안으로 보정", () => {
    const target = rect({ top: 0, left: 980, width: 300, height: 800 });
    const pos = computeCoachmarkPosition(target, BUBBLE, VIEWPORT);
    expect(pos.top).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
    expect(pos.top + BUBBLE.height).toBeLessThanOrEqual(
      VIEWPORT.height - VIEWPORT_MARGIN,
    );
  });
});
