import { describe, it, expect } from "vitest";
import { isPastRightEdge, RIGHT_EDGE_HIDE_MARGIN } from "./plotGuard";

describe("isPastRightEdge", () => {
  it("우경계보다 충분히 왼쪽이면 false", () => {
    expect(isPastRightEdge(300, 100)).toBe(false);
  });

  it("우경계 - margin 지점에 닿으면 true (근접 시작)", () => {
    expect(isPastRightEdge(300, 300 - RIGHT_EDGE_HIDE_MARGIN)).toBe(true);
  });

  it("근접 여유 직전이면 아직 false", () => {
    expect(isPastRightEdge(300, 300 - RIGHT_EDGE_HIDE_MARGIN - 1)).toBe(false);
  });

  it("우경계를 넘으면 true", () => {
    expect(isPastRightEdge(300, 320)).toBe(true);
  });

  it("plotRight=null이면 판정 불가 → false (숨기지 않음)", () => {
    expect(isPastRightEdge(null, 99999)).toBe(false);
  });

  it("plotRight=0(차트 초기화 직전)이면 false (전부 숨기는 사고 방지)", () => {
    expect(isPastRightEdge(0, 99999)).toBe(false);
  });

  it("커스텀 margin 적용", () => {
    expect(isPastRightEdge(300, 280, 30)).toBe(true);
    expect(isPastRightEdge(300, 280, 10)).toBe(false);
  });
});
