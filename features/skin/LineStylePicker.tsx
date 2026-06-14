"use client";

import { LINE_STYLES, type LineGeometryPoints, type LineStyleId } from "./lineStyles";

const PREVIEW_LINE: LineGeometryPoints = { id: "preview", x1: 4, y1: 26, x2: 44, y2: 6 };

interface Props {
  onSelect: (styleId: LineStyleId) => void;
}

/**
 * 라인 스타일 4종 미리보기 팝업.
 * "그릴 스타일 선택"과 "선택된 라인의 스타일 변경" 양쪽에서 재사용.
 */
export default function LineStylePicker({ onSelect }: Props) {
  return (
    <div
      data-export-ignore="true"
      className="flex gap-1 rounded border border-panel-border bg-panel-alt p-1.5 shadow-lg"
      style={{ pointerEvents: "auto" }}
    >
      {LINE_STYLES.map((style) => (
        <button
          key={style.id}
          onClick={() => onSelect(style.id)}
          title={style.name}
          className="rounded border border-transparent p-1 hover:border-accent hover:bg-panel-hover"
        >
          <svg width={48} height={32} viewBox="0 0 48 32">
            {style.render(PREVIEW_LINE, false)}
          </svg>
        </button>
      ))}
    </div>
  );
}
