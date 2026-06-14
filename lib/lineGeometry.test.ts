import { describe, it, expect } from "vitest";
import { computeLineGeometry } from "./lineGeometry";

describe("computeLineGeometry", () => {
  it("수평선: length=10, angle=0, perp=(0,1)", () => {
    const g = computeLineGeometry({ x1: 0, y1: 0, x2: 10, y2: 0 });
    expect(g.length).toBeCloseTo(10);
    expect(g.angle).toBeCloseTo(0);
    expect(g.perpX).toBeCloseTo(0);
    expect(g.perpY).toBeCloseTo(1);
  });

  it("수직선: length=10, angle=90, perp=(-1,0)", () => {
    const g = computeLineGeometry({ x1: 0, y1: 0, x2: 0, y2: 10 });
    expect(g.length).toBeCloseTo(10);
    expect(g.angle).toBeCloseTo(90);
    expect(g.perpX).toBeCloseTo(-1);
    expect(g.perpY).toBeCloseTo(0);
  });

  it("길이 0이면 length=1, perp=(0,0)으로 0 나눗셈 방지", () => {
    const g = computeLineGeometry({ x1: 5, y1: 5, x2: 5, y2: 5 });
    expect(g.length).toBe(1);
    expect(g.perpX).toBe(0);
    expect(g.perpY).toBe(0);
  });
});
