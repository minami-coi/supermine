import { useEffect, useRef } from 'react'

const palette = ['#f5bd4f', '#e97959', '#74a87a', '#7ba9d4', '#d77db2', '#fff0a8']

export default function ParticleCanvas({ event, reducedMotion }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !event || reducedMotion) return undefined
    const ctx = canvas.getContext('2d')
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * ratio)
      canvas.height = Math.floor(window.innerHeight * ratio)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    resize()
    const big = event.kind === 'won' || event.kind === 'lost'
    const count = big ? 150 : Math.min(75, 8 + event.count * 3)
    const x = event.x ?? window.innerWidth / 2
    const y = event.y ?? window.innerHeight / 2
    const particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = (big ? 2 + Math.random() * 8 : 1 + Math.random() * 4)
      return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (big ? 3 : 1), life: 1, size: 2 + Math.random() * (big ? 5 : 3), color: event.kind === 'lost' ? ['#ee4b37', '#ffb02e', '#fff1dc'][Math.floor(Math.random() * 3)] : palette[Math.floor(Math.random() * palette.length)], spin: Math.random() * 6 }
    })
    let frame
    let last = 0
    const duration = big ? (event.kind === 'won' ? 2400 : 1250) : 800
    const started = performance.now()
    const draw = time => {
      if (document.hidden) { frame = requestAnimationFrame(draw); return }
      if (time - last < 16) { frame = requestAnimationFrame(draw); return }
      last = time
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const progress = Math.min(1, (time - started) / duration)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.vx *= 0.994; p.life = Math.max(0, 1 - progress); p.spin += 0.08
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin)
        if (big || event.kind === 'chain') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.7)
        else { ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
      }
      ctx.globalAlpha = 1
      if (progress < 1) frame = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', resize)
    frame = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); ctx.clearRect(0, 0, canvas.width, canvas.height) }
  }, [event, reducedMotion])
  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />
}
