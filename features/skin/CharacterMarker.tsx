"use client";

interface CharacterMarkerProps {
  x: number;
  y: number;
  image: string;
  bubble: string;
  /** 'top' = 캐릭터가 포인트 위(최고점), 'bottom' = 아래(최저점). */
  anchor: "top" | "bottom";
}

/**
 * 가격 포인트에 붙는 캐릭터 + 말풍선. 좌표는 useChartOverlay에서 받음.
 * translate로 배치 — 부모 오버레이 레이어 기준 절대 위치.
 */
export default function CharacterMarker({
  x,
  y,
  image,
  bubble,
  anchor,
}: CharacterMarkerProps) {
  // 최고점: 포인트 위쪽으로 띄움 / 최저점: 아래쪽으로.
  const offsetY = anchor === "top" ? -78 : 12;

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 flex flex-col items-center"
      style={{
        transform: `translate(${x - 28}px, ${y + offsetY}px)`,
        willChange: "transform",
      }}
    >
      {anchor === "top" && <Bubble text={bubble} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" width={56} height={56} draggable={false} />
      {anchor === "bottom" && <Bubble text={bubble} />}
    </div>
  );
}

function Bubble({ text }: { text: string }) {
  return (
    <div className="mb-1 mt-1 whitespace-nowrap rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-gray-800 shadow">
      {text}
    </div>
  );
}
