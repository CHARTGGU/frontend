'use client'

import { useEffect, useRef, type RefObject } from 'react'

interface Props {
  hostRef: RefObject<HTMLDivElement | null>
  color?: string
  getYAtX?: (x: number) => number | null
  getXBounds?: () => { left: number; right: number } | null
}

// RunCat 스타일: 슬림한 몸, 큰 눈 2개, 앞발은 둥근 손 모양으로 뻗음.
// phase(0..1)가 한 보폭 주기.
function drawCat(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  s: number,
  color: string,
  phase: number,
  facing: number,
) {
  ctx.save()
  ctx.translate(x, groundY)
  ctx.scale(facing, 1)
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const tau = Math.PI * 2
  const bob = Math.sin(phase * tau) * s * 0.05

  // 몸통: 슬림한 수평 타원
  const by = -s * 0.44 + bob
  ctx.beginPath()
  ctx.ellipse(0, by, s * 0.50, s * 0.24, -0.08, 0, tau)
  ctx.fill()

  // 머리
  const hx = s * 0.43
  const hy = by - s * 0.22
  ctx.beginPath()
  ctx.arc(hx, hy, s * 0.25, 0, tau)
  ctx.fill()

  // 목 연결
  ctx.beginPath()
  ctx.ellipse(s * 0.25, by - s * 0.07, s * 0.18, s * 0.15, 0, 0, tau)
  ctx.fill()

  // 뒤 귀
  ctx.beginPath()
  ctx.moveTo(hx - s * 0.17, hy - s * 0.16)
  ctx.lineTo(hx - s * 0.05, hy - s * 0.46)
  ctx.lineTo(hx + s * 0.08, hy - s * 0.17)
  ctx.closePath()
  ctx.fill()

  // 앞 귀
  ctx.beginPath()
  ctx.moveTo(hx + s * 0.08, hy - s * 0.18)
  ctx.lineTo(hx + s * 0.22, hy - s * 0.46)
  ctx.lineTo(hx + s * 0.30, hy - s * 0.13)
  ctx.closePath()
  ctx.fill()

  // 눈: 어두운 큰 원 2개 (RunCat 특징)
  ctx.fillStyle = '#1a1a2e'
  ctx.beginPath()
  ctx.arc(hx + s * 0.04, hy + s * 0.01, s * 0.08, 0, tau)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(hx + s * 0.20, hy - s * 0.01, s * 0.08, 0, tau)
  ctx.fill()
  ctx.fillStyle = color
  ctx.strokeStyle = color

  // 꼬리: 얇고 위로 휘어짐
  const tailWag = Math.sin(phase * tau + 0.9) * s * 0.13
  ctx.lineWidth = s * 0.10
  ctx.beginPath()
  ctx.moveTo(-s * 0.46, by + s * 0.04)
  ctx.quadraticCurveTo(
    -s * 0.88, by - s * 0.30 + tailWag,
    -s * 0.65, by - s * 0.68 + tailWag,
  )
  ctx.stroke()

  // 앞발 2개: 앞으로 쭉 뻗고 끝이 둥근 손 (RunCat 고스트 손 느낌)
  const frontSwing = Math.sin(phase * tau) * s * 0.36
  ctx.lineWidth = s * 0.15
  const pawR = s * 0.09
  const frontLegs = [
    { ax: s * 0.34, ay: by + s * 0.12 },
    { ax: s * 0.26, ay: by + s * 0.20 },
  ]
  for (const fl of frontLegs) {
    const fx = fl.ax + frontSwing * 0.56
    const fy = s * 0.03
    ctx.beginPath()
    ctx.moveTo(fl.ax, fl.ay)
    ctx.quadraticCurveTo(fl.ax + frontSwing * 0.3, fl.ay + s * 0.18, fx, fy)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(fx, fy, pawR, 0, tau)
    ctx.fill()
  }

  // 뒷발 2개: 뒤로 뻗고 끝이 둥근 발
  const backSwing = Math.sin(phase * tau + Math.PI) * s * 0.32
  ctx.lineWidth = s * 0.14
  const backLegs = [
    { ax: -s * 0.28, ay: by + s * 0.18 },
    { ax: -s * 0.10, ay: by + s * 0.20 },
  ]
  for (const bl of backLegs) {
    const bx2 = bl.ax + backSwing * 0.50
    const by2 = s * 0.03
    ctx.beginPath()
    ctx.moveTo(bl.ax, bl.ay)
    ctx.quadraticCurveTo(bl.ax + backSwing * 0.25, bl.ay + s * 0.18, bx2, by2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(bx2, by2, pawR, 0, tau)
    ctx.fill()
  }

  ctx.restore()
}

export function CatOverlay({
  hostRef,
  color = '#e5e7eb',
  getYAtX,
  getXBounds,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colorRef = useRef(color)
  colorRef.current = color
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

    const speed = 115 // px/s
    const size = 24
    const margin = size * 1.4
    let x = margin
    let dir = 1
    let smoothY: number | null = null
    let last = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const dt = (now - last) / 1000
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

      if (x < left) {
        x = left
        dir = 1
      } else if (x > right) {
        x = right
        dir = -1
      }

      x += speed * dt * dir
      if (x >= right) {
        x = right
        dir = -1
      } else if (x <= left) {
        x = left
        dir = 1
      }

      ctx.clearRect(0, 0, w, h)
      const phase = ((now / 1000) * 3) % 1

      const raw = getYRef.current?.(x)
      const targetY = (raw == null || Number.isNaN(raw) ? h * 0.5 : raw) - 2
      smoothY =
        smoothY == null ? targetY : smoothY + (targetY - smoothY) * Math.min(1, dt * 12)
      const groundY = Math.max(size * 0.9, Math.min(h - 4, smoothY))

      drawCat(ctx, x, groundY, size, colorRef.current, phase, dir)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [hostRef])

  // zIndex 4: lightweight-charts 내부 canvas(z-index:3) 위에 그림
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 4,
      }}
    />
  )
}
