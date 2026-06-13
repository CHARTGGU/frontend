"use client";

import type { Skin } from "./presets";

interface SkinCardProps {
  skin: Skin;
  applied: boolean;
  onApply: () => void;
  onRemove: () => void;
  /** 사용자 업로드 배경 등 삭제 가능한 카드에만 전달 → 🗑 버튼 노출. */
  onDelete?: () => void;
}

/**
 * 마켓플레이스 스킨 카드 (VSCode 익스텐션 항목 룩).
 * 썸네일 + 이름/제작자/설명 + 적용·해제 버튼. status='soon'이면 비활성(준비중).
 * onDelete가 있으면 우측에 삭제 버튼을 추가로 노출한다(커스텀 배경).
 */
export default function SkinCard({
  skin,
  applied,
  onApply,
  onRemove,
  onDelete,
}: SkinCardProps) {
  const soon = skin.status === "soon";

  return (
    <div
      className={`flex gap-2.5 border-b border-panel-border px-3 py-2.5 ${
        soon ? "opacity-50" : "hover:bg-panel-hover"
      }`}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-panel-alt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={skin.thumbnail}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text-primary">
            {skin.name}
          </span>
          {applied && (
            <span className="shrink-0 whitespace-nowrap rounded-sm bg-accent px-1 text-[10px] text-white">
              적용중
            </span>
          )}
        </div>
        <p className="truncate text-[11px] text-text-muted">{skin.author}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-text-muted">
          {skin.description}
        </p>

        <div className="mt-1.5 flex items-center gap-1.5">
          {soon ? (
            <span className="text-[11px] text-text-muted">준비중</span>
          ) : applied ? (
            <button
              onClick={onRemove}
              className="rounded border border-panel-border px-2 py-0.5 text-[11px] text-text-primary hover:bg-panel-border"
            >
              해제
            </button>
          ) : (
            <button
              onClick={onApply}
              className="rounded bg-accent px-2 py-0.5 text-[11px] text-white hover:bg-accent-hover"
            >
              적용
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="삭제"
              aria-label="삭제"
              className="rounded border border-panel-border px-1.5 py-0.5 text-[11px] text-text-muted hover:bg-panel-border hover:text-text-primary"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
