import { useEffect, useRef } from 'react'

const palette = ['#f5bd4f', '#e97959', '#74a87a', '#7ba9d4', '#d77db2', '#fff0a8']

export default function ParticleCanvas({ event }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !event) return undefined
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
    if (event.kind === 'won') {
      const particles = []
      const rings = []
      let frame
      let last = 0
      let nextBurst = 0
      const started = performance.now()
      const burstDuration = 2250
      const launchBurst = () => {
        const x = window.innerWidth * (0.06 + Math.random() * 0.88)
        const y = window.innerHeight * (0.08 + Math.random() * 0.67)
        const color = palette[Math.floor(Math.random() * palette.length)]
        const size = 42 + Math.floor(Math.random() * 20)
        rings.push({ x, y, radius: 2, life: 1, color })
        for (let i = 0; i < size; i++) {
          const angle = Math.PI * 2 * i / size + (Math.random() - 0.5) * 0.12
          const speed = 2.2 + Math.random() * 7.2
          particles.push({ x, y, px: x, py: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.8 + Math.random() * 0.65, decay: 0.005 + Math.random() * 0.006, size: 2 + Math.random() * 4.5, color: Math.random() < 0.22 ? '#fff4bd' : color, spin: Math.random() * 6, star: Math.random() < 0.42 })
        }
      }
      const drawVictory = time => {
        if (document.hidden) { frame = requestAnimationFrame(drawVictory); return }
        if (time - last < 16) { frame = requestAnimationFrame(drawVictory); return }
        last = time
        const elapsed = time - started
        if (elapsed >= nextBurst && elapsed < burstDuration) {
          launchBurst()
          nextBurst += 125 + Math.random() * 100
        }
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
        ctx.globalCompositeOperation = 'lighter'
        for (let i = rings.length - 1; i >= 0; i--) {
          const ring = rings[i]
          ring.radius += 5.2; ring.life -= 0.025
          if (ring.life <= 0) { rings.splice(i, 1); continue }
          ctx.globalAlpha = ring.life * 0.58
          ctx.strokeStyle = ring.color; ctx.lineWidth = 2.5; ctx.shadowColor = ring.color; ctx.shadowBlur = 20
          ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2); ctx.stroke()
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]
          p.px = p.x; p.py = p.y; p.x += p.vx; p.y += p.vy; p.vy += 0.055; p.vx *= 0.989; p.life -= p.decay; p.spin += 0.07
          if (p.life <= 0 || p.y > window.innerHeight + 40) { particles.splice(i, 1); continue }
          ctx.globalAlpha = Math.min(1, p.life)
          ctx.strokeStyle = p.color; ctx.lineWidth = p.size * 0.8; ctx.shadowColor = p.color; ctx.shadowBlur = 15
          ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke()
          ctx.fillStyle = p.color; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin)
          if (p.star) {
            ctx.beginPath()
            for (let point = 0; point < 10; point++) {
              const radius = point % 2 ? p.size * 0.42 : p.size
              const angle = -Math.PI / 2 + point * Math.PI / 5
              const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius
              if (point === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
            }
            ctx.closePath(); ctx.fill()
          } else { ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill() }
          ctx.restore()
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0
        if (elapsed < burstDuration || particles.length || rings.length) frame = requestAnimationFrame(drawVictory)
        else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', resize)
      frame = requestAnimationFrame(drawVictory)
      return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); ctx.clearRect(0, 0, canvas.width, canvas.height) }
    }
    const big = event.kind === 'won' || event.kind === 'lost'
    const combo = Math.max(1, event.combo || 1)
    const intensity = Math.min(2.2, 1 + (combo - 1) * 0.12)
    const count = big ? 180 : Math.min(220, Math.round((72 + event.count * 5) * intensity))
    const x = event.x ?? window.innerWidth / 2
    const y = event.y ?? window.innerHeight / 2
    const particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = (big ? 3 + Math.random() * 10 : 4 + Math.random() * 9) * (big ? 1 : Math.min(1.8, 0.95 + combo * 0.06))
      return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (big ? 3 : 1), life: 1, size: 3 + Math.random() * (big ? 6 : 7 + Math.min(5, combo * 0.3)), color: event.kind === 'lost' ? ['#ee4b37', '#ffb02e', '#fff1dc'][Math.floor(Math.random() * 3)] : palette[Math.floor(Math.random() * palette.length)], spin: Math.random() * 6, star: Math.random() < Math.min(0.85, 0.28 + combo * 0.025) }
    })
    let frame
    let last = 0
    const duration = big ? (event.kind === 'won' ? 2400 : 1250) : Math.min(1600, 1100 + combo * 35)
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
        ctx.shadowColor = p.color
        ctx.shadowBlur = Math.min(34, 14 + combo * 2)
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin)
        if (p.star) {
          ctx.beginPath()
          for (let point = 0; point < 10; point++) {
            const radius = point % 2 ? p.size * 0.42 : p.size
            const angle = -Math.PI / 2 + point * Math.PI / 5
            const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius
            if (point === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
          }
          ctx.closePath(); ctx.fill()
        } else if (big || event.kind === 'chain' || combo > 3) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.7)
        else { ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      if (progress < 1) frame = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', resize)
    frame = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); ctx.clearRect(0, 0, canvas.width, canvas.height) }
  }, [event])
  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />
}
