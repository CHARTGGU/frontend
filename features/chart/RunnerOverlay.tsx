'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { Z_LAYER } from '@/lib/zLayers'

interface Props {
  hostRef: RefObject<HTMLDivElement | null>
  getYAtX?: (x: number) => number | null
  getXBounds?: () => { left: number; right: number } | null
}

/** 러너 한 마리 정의 — 프레임 시퀀스(소스 기준 오른쪽 향함) + 달리기 파라미터. */
interface RunnerSpec {
  frames: string[]
  /** 표시 높이(px). */
  height: number
  /** 이동 속도(px/s) — 둘이 다르면 앞서거니 뒤서거니 경주 느낌. */
  speed: number
  /** 프레임 교차 주기(ms). */
  frameMs: number
  /** 시작 x 오프셋(px) — 스타트 위치 시차. */
  startOffset: number
  /** 프레임 위상 오프셋 — 둘이 같은 자세로 안 겹치게. */
  phaseOffset: number
}

const BALL_FRAMES = Array.from({ length: 10 }, (_, i) => `/skins/ball-run-${i + 1}.png`)
const CLOUD_FRAMES = Array.from({ length: 10 }, (_, i) => `/skins/cloud-run-${i + 1}.png`)

const RUNNERS: RunnerSpec[] = [
  { frames: BALL_FRAMES, height: 46, speed: 96, frameMs: 90, startOffset: 0, phaseOffset: 0 },
  { frames: CLOUD_FRAMES, height: 52, speed: 82, frameMs: 95, startOffset: 54, phaseOffset: 4 },
]

interface RunnerRuntime {
  spec: RunnerSpec
  imgs: HTMLImageElement[]
  x: number
  dir: number
  smoothY: number | null
}

export function RunnerOverlay({ hostRef, getYAtX, getXBounds }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const getYRef = useRef(getYAtX)
  getYRef.current = getYAtX
  const getBoundsRef = useRef(getXBounds)
  getBoundsRef.current = getXBounds

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = host.clientWidth * dpr
      canvas.height = host.clientHeight * dpr
      canvas.style.width = `${host.clientWidth}px`
      canvas.style.height = `${host.clientHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    // 프레임 프리로드.
    const runners: RunnerRuntime[] = RUNNERS.map((spec) => ({
      spec,
      imgs: spec.frames.map((src) => {
        const img = new Image()
        img.src = src
        return img
      }),
      x: 0,
      dir: 1,
      smoothY: null,
    }))

    const margin = 30
    let initialized = false
    let last = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const w = host.clientWidth
      const h = host.clientHeight

      const b = getBoundsRef.current?.()
      let left = margin
      let right = Math.max(margin, w - margin)
      if (b) {
        left = Math.max(margin, b.left + margin)
        right = Math.min(w - margin, b.right - margin)
        if (right < left) {
          const mid = (b.left + b.right) / 2
          left = right = mid
        }
      }

      if (!initialized) {
        for (const r of runners) r.x = Math.min(right, left + r.spec.startOffset)
        initialized = true
      }

      ctx.clearRect(0, 0, w, h)

      for (const r of runners) {
        // 가시범위 안에서 좌우 왕복.
        if (r.x < left) {
          r.x = left
          r.dir = 1
        } else if (r.x > right) {
          r.x = right
          r.dir = -1
        }
        r.x += r.spec.speed * dt * r.dir
        if (r.x >= right) {
          r.x = right
          r.dir = -1
        } else if (r.x <= left) {
          r.x = left
          r.dir = 1
        }

        // 캔들 고가 라인 추적(부드럽게 보간).
        const raw = getYRef.current?.(r.x)
        const targetY = raw == null || Number.isNaN(raw) ? h * 0.5 : raw
        r.smoothY =
          r.smoothY == null
            ? targetY
            : r.smoothY + (targetY - r.smoothY) * Math.min(1, dt * 12)
        const groundY = Math.max(r.spec.height, Math.min(h - 2, r.smoothY)) - 4

        // 현재 프레임.
        const fi =
          (Math.floor(now / r.spec.frameMs) + r.spec.phaseOffset) % r.spec.frames.length
        const img = r.imgs[fi]
        if (!img || !img.complete || img.naturalWidth === 0) continue

        const drawH = r.spec.height
        const drawW = (img.naturalWidth / img.naturalHeight) * drawH

        ctx.save()
        ctx.translate(r.x, groundY)
        // 소스가 오른쪽 향함 → 왼쪽 이동(dir<0) 시 좌우 반전.
        ctx.scale(r.dir, 1)
        ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH)
        ctx.restore()
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [hostRef])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: Z_LAYER.cat,
      }}
    />
  )
}
