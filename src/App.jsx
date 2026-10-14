import { useEffect, useState } from 'react'
import { createGame, DIFFICULTIES, revealCell, toggleFlag, chordCell } from './game/board'
import { comboMultiplier, countCorrectFlags } from './game/scoring'
import ParticleCanvas from './effects/ParticleCanvas'
import './App.css'

const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
const COMBO_MESSAGES = ['NICE!!', 'GOOD JOB!!', 'EXCELLENT!!!', 'UNSTOPPABLE!!!', 'MAXIMUM OVERDRIVE!!!!', 'ABSOLUTE CHAOS!!!!', 'LIMIT BREAK!!!!!!', 'WHAT IS HAPPENING!??!?!?!?!?']

function App() {
  const [game, setGame] = useState(() => createGame('beginner'))
  const [flagMode, setFlagMode] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [lastComboAt, setLastComboAt] = useState(0)
  const [effect, setEffect] = useState(null)
  const [effectText, setEffectText] = useState(null)
  const [comboMessage, setComboMessage] = useState(null)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])
  useEffect(() => {
    if (game.status !== 'playing') return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(timer)
  }, [game.status])
  useEffect(() => {
    if (!effectText) return undefined
    const timeout = window.setTimeout(() => setEffectText(null), effectText.kind === 'won' ? 2400 : 1100)
    return () => window.clearTimeout(timeout)
  }, [effectText])

  const elapsed = game.startedAt ? Math.floor(((game.endedAt ?? now) - game.startedAt) / 1000) : 0
  const newGame = (difficulty = game.difficulty) => {
    setGame(createGame(difficulty)); setFlagMode(false); setNow(Date.now()); setScore(0); setCombo(0); setMaxCombo(0); setLastComboAt(0); setEffect(null); setEffectText(null); setComboMessage(null)
  }
  const applyAction = (operation, kind, row, col) => {
    const next = operation(game)
    if (next === game) return
    const opened = next.revealedCount - game.revealedCount
    const openedSafe = next.board.flat().filter(cell => cell.isRevealed && !cell.hasMine).length - game.board.flat().filter(cell => cell.isRevealed && !cell.hasMine).length
    const flagChange = next.flaggedCount !== game.flaggedCount
    const ended = next.status === 'won' || next.status === 'lost'
    const safeOpen = opened > 0 && next.status !== 'lost'
    const comboAction = safeOpen || flagChange
    let nextCombo = combo
    let points = 0
    if (comboAction) {
      nextCombo = now - lastComboAt <= 2000 ? combo + 1 : 1
      setCombo(nextCombo); setLastComboAt(now); setMaxCombo(value => Math.max(value, nextCombo))
      if (nextCombo >= 4 && next.status === 'playing') {
        const messageIndex = Math.min(COMBO_MESSAGES.length - 1, nextCombo - 4)
        setComboMessage({ id: `${Date.now()}-${Math.random()}`, text: COMBO_MESSAGES[messageIndex], combo: nextCombo })
      }
      const multiplier = comboMultiplier(nextCombo)
      if (safeOpen) points += openedSafe * 10 * multiplier
      if (next.status === 'won') points += 500
      if (next.status === 'won' || next.status === 'lost') points += countCorrectFlags(next.board) * 100
      setScore(value => value + points)
    } else if (ended) {
      points = countCorrectFlags(next.board) * 100
      setScore(value => value + points)
    }
    if (ended) { setCombo(0); setLastComboAt(0) }
    setGame(next)
    const eventKind = next.status === 'won' ? 'won' : next.status === 'lost' ? 'lost' : opened > 3 ? 'chain' : kind
    const tile = document.querySelector(`[data-cell="${row}-${col}"]`)
    const rect = tile?.getBoundingClientRect()
    const position = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : {}
    const id = `${Date.now()}-${Math.random()}`
    setEffect({ id, kind: eventKind, count: opened, combo: nextCombo, ...position })
    const label = eventKind === 'won' ? 'YOU ARE A LEGEND!' : eventKind === 'lost' ? 'BOOOOOOM!!!' : eventKind === 'chain' ? (opened >= 10 ? `MASSIVE CHAIN! ×${opened}` : `CHAIN ×${opened}`) : eventKind === 'flag' ? (next.board[row][col].isFlagged ? 'FLAG!' : 'REMOVED') : `+${points}`
    if (eventKind !== 'cell' || safeOpen) setEffectText({ id, kind: eventKind, label, points, score: score + points, combo: nextCombo, multiplier: comboMultiplier(nextCombo), ...position })
  }
  const open = (r, c) => { if (!flagMode) applyAction(state => revealCell(state, r, c), 'cell', r, c) }
  const flag = (r, c) => applyAction(state => toggleFlag(state, r, c), 'flag', r, c)
  const chord = (r, c) => applyAction(state => chordCell(state, r, c), 'chord', r, c)
  const outcome = game.status === 'won' ? 'クリア！' : game.status === 'lost' ? 'ゲームオーバー' : ''
  const visibleCombo = now - lastComboAt <= 2000 ? combo : 0

  return <main className={`game-shell ${effect?.kind === 'lost' && !reducedMotion ? 'shake collapse-board' : ''} ${effect?.kind === 'won' ? 'celebrate' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}>
    <ParticleCanvas event={effect} reducedMotion={reducedMotion} />
    {comboMessage && !reducedMotion && <div key={comboMessage.id} className="combo-marquee" aria-live="polite" aria-atomic="true" style={{ fontSize: `${Math.min(88, Math.max(24, window.innerWidth * 0.88 / (comboMessage.text.length * 0.62)))}px` }}><span>{comboMessage.text}</span><small>COMBO ×{comboMessage.combo}</small></div>}
    {effectText && <div key={effectText.id} className={`effect-banner ${effectText.kind}`} style={{ left: effectText.x, top: effectText.y, fontSize: ['won', 'lost', 'chain'].includes(effectText.kind) ? undefined : `${Math.min(64, 22 + Math.max(0, effectText.combo - 1) * 4)}px`, filter: `drop-shadow(0 0 ${Math.min(26, 5 + effectText.combo * 1.3)}px #ffca55)` }} aria-live="polite">{effectText.label}{effectText.points > 0 && !['won', 'lost', 'chain'].includes(effectText.kind) && <small>+{effectText.points}</small>}{effectText.kind === 'won' && <small>SCORE {effectText.score.toLocaleString()}</small>}{!['won', 'lost'].includes(effectText.kind) && effectText.combo > 0 && <small className="combo-label" style={{ fontSize: `${Math.min(27, 13 + effectText.combo * 1.2)}px` }}>COMBO ×{effectText.combo}</small>}</div>}
    <section className="game-card" aria-label="マインスイーパー">
      <div className="game-toolbar"><button className="restart" onClick={() => newGame()} aria-label="はじめから">↻ <span>はじめから</span></button><div className="difficulty" aria-label="難易度">{Object.entries(DIFFICULTIES).map(([key, item]) => <button key={key} className={game.difficulty === key ? 'selected' : ''} onClick={() => newGame(key)}>{item.label}</button>)}</div></div>
      <div className="game-metrics"><div className="metric"><span>残り地雷</span><strong>{game.config.mines - game.flaggedCount}</strong></div><div className="metric"><span>時間</span><strong>{formatTime(elapsed)}</strong></div><div className="metric"><span>SCORE</span><strong>{score.toLocaleString()}</strong></div><div className={visibleCombo ? 'metric combo-count active' : 'metric combo-count'}><span>COMBO</span><strong>{visibleCombo ? `×${visibleCombo}` : '—'}</strong></div><div className="metric"><span>最大コンボ</span><strong>{maxCombo}</strong></div></div>
      {outcome && <div className={`result ${game.status}`}>{outcome} <span>{game.status === 'won' ? `TIME ${formatTime(elapsed)} · MAX COMBO ${maxCombo}` : `SCORE ${score.toLocaleString()} · MAX COMBO ${maxCombo}`}</span></div>}
      <div className="board-wrap"><div className={`board ${game.difficulty}`} role="grid" aria-label={`${game.config.rows}行${game.config.cols}列の盤面`} onContextMenu={e => e.preventDefault()}>
        {game.board.map((row, r) => row.map((cell, c) => {
          const shownMine = (game.status === 'lost' && cell.hasMine) || (game.status === 'won' && cell.hasMine && !cell.isFlagged)
          const classes = ['tile', cell.isRevealed ? 'revealed' : '', cell.isFlagged ? 'flagged' : '', shownMine ? 'mine' : '', game.detonated?.[0] === r && game.detonated?.[1] === c ? 'detonated' : '', cell.isRevealed && cell.adjacentMines ? `n${cell.adjacentMines}` : '', game.status === 'lost' && !reducedMotion ? 'loss-collapse' : ''].filter(Boolean).join(' ')
          const tileIndex = r * game.config.cols + c + 1
          const randomOrder = Math.abs(Math.sin(tileIndex * 12.9898 + game.config.rows * 78.233) * 43758.5453) % 1
          const fallStyle = game.status === 'lost' && !reducedMotion ? { '--fall-delay': `${Math.floor(randomOrder * 950)}ms`, '--fall-x': `${Math.round((randomOrder - 0.5) * 180)}px`, '--fall-rotation': `${Math.round((randomOrder - 0.5) * 900)}deg` } : undefined
          return <button key={`${r}-${c}`} data-cell={`${r}-${c}`} role="gridcell" aria-label={`第${r + 1}行第${c + 1}列${cell.isFlagged ? '、旗' : cell.isRevealed ? (cell.hasMine ? '、地雷' : `、${cell.adjacentMines || '空白'}`) : '、未開封'}`} className={classes} style={fallStyle} onClick={() => cell.isRevealed ? chord(r, c) : flagMode ? flag(r, c) : open(r, c)} onContextMenu={e => { e.preventDefault(); flag(r, c) }} onAuxClick={e => { if (e.button === 1) { e.preventDefault(); chord(r, c) } }}>{cell.isFlagged ? <span className="flag-icon">⚑</span> : shownMine ? '✹' : cell.isRevealed && cell.adjacentMines ? cell.adjacentMines : ''}</button>
        }))}
      </div></div>
      <div className="board-footer"><div className="legend"><span><i className="legend-open"/> 開封済み</span><span><i className="legend-hidden"/> 未開封</span></div><button className={`flag-toggle ${flagMode ? 'active' : ''}`} aria-pressed={flagMode} onClick={() => setFlagMode(active => !active)}>⚑ <span>{flagMode ? '旗モード ON' : '旗モード'}</span></button></div>
      <div className="instructions"><span>操作のヒント</span><p>クリック／タップで開封 · 右クリックで旗 · 開封済みの数字を押すと周囲を一括開封</p></div>
      <label className="motion-setting"><input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} /> 動きを軽減</label>
    </section>
  </main>
}
export default App
