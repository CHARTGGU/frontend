import dynamic from "next/dynamic";

// 차트·오버레이는 브라우저 전용(lightweight-charts) → SSR 비활성.
// CLAUDE.md 아키텍처 §1: SSR에서 차트 마운트 금지.
const AppShell = dynamic(() => import("@/features/AppShell"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center text-text-muted">
      차트 로딩 중…
    </div>
  ),
});

export default function Home() {
  return <AppShell />;
}
