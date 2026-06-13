"use client";

import { useRef, useState } from "react";
import { useSkinStore } from "@/stores/skinStore";
import { useCustomBgStore } from "@/stores/customBgStore";

/**
 * "내 사진 올리기" 버튼 + 숨김 파일 입력.
 * 선택한 이미지를 다운스케일·IndexedDB 저장 후 곧바로 배경으로 적용한다.
 * 로딩·에러 상태를 인라인 표시한다.
 */
export default function CustomBgUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCustomBgStore((s) => s.add);
  const applyBackground = useSkinStore((s) => s.applyBackground);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 허용
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const id = await add(file);
      applyBackground(id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "사진을 올리지 못했습니다.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-panel-border bg-panel-alt px-3 py-2.5">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full rounded border border-dashed border-panel-border px-2 py-1.5 text-[11px] text-text-muted hover:bg-panel-hover hover:text-text-primary disabled:opacity-50"
      >
        {busy ? "올리는 중…" : "＋ 내 사진 올리기"}
      </button>
      {error && (
        <p className="mt-1 text-[10px] leading-tight text-red-400">{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
