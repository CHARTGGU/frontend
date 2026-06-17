/**
 * 온보딩 가이드 1회 표시 플래그.
 * localStorage 접근 불가(시크릿 모드·차단·SSR)여도 앱이 죽지 않도록 전부 try/catch.
 * - read 실패 → false(=안 봤음) 반환 → 가이드를 표시(graceful).
 * - write 실패 → 조용히 무시.
 * 가이드 개편 시 키 버전(v1→v2)을 올려 재노출할 수 있다.
 */
export const ONBOARDING_STORAGE_KEY = "chartskin:onboarding:seen:v1";

export function getSeen(): boolean {
  try {
    return globalThis.localStorage?.getItem(ONBOARDING_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSeen(): void {
  try {
    globalThis.localStorage?.setItem(ONBOARDING_STORAGE_KEY, "1");
  } catch {
    // 저장 실패는 무시 — 다음 접속에 다시 보일 수 있으나 앱 동작에는 영향 없음.
  }
}
