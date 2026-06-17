import { afterEach, describe, expect, it, vi } from "vitest";
import { getSeen, setSeen, ONBOARDING_STORAGE_KEY } from "./onboardingStorage";

function mockStorage() {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  vi.stubGlobal("localStorage", ls);
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("onboardingStorage", () => {
  it("플래그가 없으면 getSeen()은 false", () => {
    mockStorage();
    expect(getSeen()).toBe(false);
  });

  it("setSeen() 후 getSeen()은 true", () => {
    mockStorage();
    setSeen();
    expect(getSeen()).toBe(true);
  });

  it("setSeen()은 정확한 키에 '1'을 쓴다", () => {
    const store = mockStorage();
    setSeen();
    expect(store.get(ONBOARDING_STORAGE_KEY)).toBe("1");
  });

  it("localStorage 접근이 throw해도 getSeen()은 false (graceful → 표시)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(getSeen()).toBe(false);
  });

  it("localStorage 접근이 throw해도 setSeen()은 예외를 던지지 않는다", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => setSeen()).not.toThrow();
  });

  it("localStorage 자체가 undefined여도 안전 (SSR/차단)", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(getSeen()).toBe(false);
    expect(() => setSeen()).not.toThrow();
  });
});
