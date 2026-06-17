import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, hexToRgba } from "./chartTheme";
import { BACKGROUND_SKINS, resolveTheme } from "@/features/skin/presets";

describe("resolveTheme", () => {
  it("테마가 꺼져 있으면 스킨이 있어도 DEFAULT_THEME", () => {
    const skin = BACKGROUND_SKINS.find((s) => s.theme)!;
    expect(resolveTheme(skin.id, false)).toBe(DEFAULT_THEME);
  });

  it("배경 미적용(null)이면 DEFAULT_THEME", () => {
    expect(resolveTheme(null, true)).toBe(DEFAULT_THEME);
  });

  it("알 수 없는 id(커스텀 업로드 등)면 DEFAULT_THEME", () => {
    expect(resolveTheme("custom-1234", true)).toBe(DEFAULT_THEME);
  });

  it("팔레트를 가진 스킨이면 그 스킨의 theme을 동일 참조로 반환", () => {
    const skin = BACKGROUND_SKINS.find((s) => s.theme)!;
    expect(resolveTheme(skin.id, true)).toBe(skin.theme);
  });

  it("모든 배경 스킨은 캔들 상승/하락 색이 서로 달라 구분 가능", () => {
    for (const skin of BACKGROUND_SKINS) {
      const t = resolveTheme(skin.id, true);
      expect(t.candleUp).not.toBe(t.candleDown);
    }
  });
});

describe("hexToRgba", () => {
  it("#rrggbb를 rgba로 변환", () => {
    expect(hexToRgba("#26a69a", 0.5)).toBe("rgba(38,166,154,0.5)");
  });

  it("형식이 잘못되면 원본 반환(안전)", () => {
    expect(hexToRgba("rgba(0,0,0,0.2)", 0.5)).toBe("rgba(0,0,0,0.2)");
  });
});
