"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSkinStore } from "@/stores/skinStore";
import { useDragHandle } from "@/lib/useDragHandle";
import { Z_LAYER } from "@/lib/zLayers";

// ─── Web Audio: 기계식 키보드 클릭음 ─────────────────────────────
let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    if (!_audioCtx || _audioCtx.state === "closed") _audioCtx = new Ctor() as AudioContext;
    if (_audioCtx.state === "suspended") void _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
}

type KeyId = "up" | "down" | "limit" | "coin";

const PITCH: Record<KeyId, number> = { up: 1.4, down: 0.7, limit: 1.9, coin: 1.05 };

function playClick(variant: KeyId) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const p = PITCH[variant];

  const len = Math.floor(ctx.sampleRate * 0.035);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.22));
  const src = ctx.createBufferSource();
  src.buffer = buf;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2800 * p;
  bp.Q.value = 1.8;

  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.55, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = 140 * p;
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.09, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

  src.connect(bp); bp.connect(ng); ng.connect(ctx.destination);
  osc.connect(og); og.connect(ctx.destination);
  src.start(t); src.stop(t + 0.08);
  osc.start(t); osc.stop(t + 0.04);
}

// ─── Canvas flood-fill 배경 제거 ─────────────────────────────────
async function removeWhiteBg(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(src); return; }
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const total = w * h;
      const visited = new Uint8Array(total);
      const queue: number[] = [];

      const enq = (i: number) => {
        if (i >= 0 && i < total && !visited[i]) { visited[i] = 1; queue.push(i); }
      };
      enq(0); enq(w - 1); enq((h - 1) * w); enq((h - 1) * w + w - 1);

      const THRESHOLD = 200;
      const SCALE = 255 / (255 - THRESHOLD);

      while (queue.length > 0) {
        const i = queue.pop()!;
        const p4 = i * 4;
        const minC = Math.min(d[p4], d[p4 + 1], d[p4 + 2]);
        if (minC < THRESHOLD) continue;
        d[p4 + 3] = Math.round(Math.max(0, Math.min(255, (255 - minC) * SCALE)));
        const x = i % w, y = Math.floor(i / w);
        if (x > 0) enq(i - 1);
        if (x < w - 1) enq(i + 1);
        if (y > 0) enq(i - w);
        if (y < h - 1) enq(i + w);
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

// ─── 키 클릭 영역 (이미지 크기 대비 %) ──────────────────────────
const HIT_AREAS: Record<KeyId, React.CSSProperties> = {
  up:    { top: "37%", left: "27%", width: "29%", height: "27%" },
  down:  { top: "29%", left: "53%", width: "28%", height: "27%" },
  limit: { top: "57%", left: "19%", width: "34%", height: "30%" },
  coin:  { top: "52%", left: "52%", width: "31%", height: "36%" },
};

const IMG_WIDTH = 230;

// ─── 메인 위젯 ────────────────────────────────────────────────
/**
 * 키캡 키링 위젯.
 * - 기영이 위젯과 동일하게 클릭=선택(노란 점선 핸들), 드래그=이동, 바깥클릭=선택해제.
 * - 키캡 버튼은 드래그 전파를 막고 소리만 재생.
 * - × 버튼으로 위젯 비활성화.
 */
export default function KeycapWidget() {
  const keycapEnabled = useSkinStore((s) => s.keycapEnabled);
  const toggleKeycap  = useSkinStore((s) => s.toggleKeycap);
  const keycapPos     = useSkinStore((s) => s.keycapPos);
  const setKeycapPos  = useSkinStore((s) => s.setKeycapPos);

  const [imgSrc, setImgSrc]   = useState("/skins/keycap-keyring.png");
  const [bgReady, setBgReady] = useState(false);
  const [pressed, setPressed] = useState<KeyId | null>(null);
  const [selected, setSelected] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startDrag = useDragHandle();

  // 마운트 1회: Canvas로 흰 배경 제거
  useEffect(() => {
    removeWhiteBg("/skins/keycap-keyring.png")
      .then((url) => { setImgSrc(url); setBgReady(true); })
      .catch(() => setBgReady(true));
  }, []);

  // 컨테이너 바깥 클릭 → 선택 해제 (기영이 위젯과 동일)
  useEffect(() => {
    if (!selected) return;
    const handler = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setSelected(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [selected]);

  /** 이미지(비-키캡) 영역 드래그 → 위젯 이동 */
  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setSelected(true);
      const startPos = { x: keycapPos.x, y: keycapPos.y };
      startDrag(e, (dx, dy) => {
        setKeycapPos({ x: startPos.x + dx, y: startPos.y + dy });
      });
    },
    [keycapPos, startDrag, setKeycapPos],
  );

  /** 키캡 버튼 클릭: 드래그 전파 차단 + 소리 재생 */
  const handleKeyPointerDown = useCallback(
    (id: KeyId) => (e: React.PointerEvent) => {
      e.stopPropagation(); // 위젯 드래그 방지
      setSelected(true);
      setPressed(id);
      playClick(id);
      setTimeout(() => setPressed(null), 130);
    },
    [],
  );

  if (!keycapEnabled) return null;

  return (
    <div
      className="pointer-events-none absolute select-none"
      style={{ left: keycapPos.x, top: keycapPos.y, zIndex: Z_LAYER.keycap }}
    >
      <div
        ref={containerRef}
        className="pointer-events-auto"
        style={{
          position: "relative",
          width: IMG_WIDTH,
          cursor: selected ? "move" : "grab",
          // 선택 시 기영이와 동일한 노란 점선 외곽선
          outline: selected ? "2px dashed #f5d76e" : "none",
          outlineOffset: 6,
          borderRadius: 8,
        }}
        onPointerDown={handleDragPointerDown}
      >
        {/* × 삭제 버튼 (선택 시만 표시, 기영이와 동일) */}
        {selected && (
          <button
            data-export-ignore="true"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleKeycap();
              setSelected(false);
            }}
            title="키캡 위젯 삭제"
            aria-label="키캡 위젯 삭제"
            className="pointer-events-auto absolute flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-white bg-red-500 text-xs text-white"
            style={{ top: -10, left: -10, zIndex: 1 }}
          >
            ×
          </button>
        )}

        {/* 3D 렌더 이미지 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt="키캡 키링"
          draggable={false}
          style={{
            width: IMG_WIDTH,
            display: "block",
            filter: bgReady ? "drop-shadow(0 10px 28px rgba(0,0,0,0.65))" : undefined,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {/* 키캡 클릭 영역 */}
        {(Object.entries(HIT_AREAS) as [KeyId, React.CSSProperties][]).map(([id, area]) => (
          <button
            key={id}
            className="pointer-events-auto absolute"
            style={{
              ...area,
              border: "none",
              cursor: "pointer",
              borderRadius: "12%",
              // 눌러도 배경 박스를 깔지 않음 — 키캡 눌림 애니메이션(transform)만 유지.
              background: "transparent",
              transform: pressed === id ? "translateY(3px) scale(0.97)" : "translateY(0) scale(1)",
              transition: "transform 65ms ease-out",
            }}
            onPointerDown={handleKeyPointerDown(id)}
          />
        ))}
      </div>
    </div>
  );
}
