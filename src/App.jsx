import { useEffect, useState } from 'react'
import { createGame, DIFFICULTIES, revealCell, toggleFlag, chordCell } from './game/board'
import { comboMultiplier, countCorrectFlags } from './game/scoring'
import ParticleCanvas from './effects/ParticleCanvas'
import './App.css'

const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

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
    setGame(createGame(difficulty)); setFlagMode(false); setNow(Date.now()); setScore(0); setCombo(0); setMaxCombo(0); setLastComboAt(0); setEffect(null); setEffectText(null)
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

  return <main className={`game-shell ${effect?.kind === 'lost' ? 'shake' : ''} ${effect?.kind === 'won' ? 'celebrate' : ''}`}>
    <ParticleCanvas event={effect} reducedMotion={reducedMotion} />
    {effectText && <div key={effectText.id} className={`effect-banner ${effectText.kind}`} style={{ left: effectText.x, top: effectText.y, fontSize: ['won', 'lost', 'chain'].includes(effectText.kind) ? undefined : `${Math.min(64, 22 + Math.max(0, effectText.combo - 1) * 4)}px`, filter: `drop-shadow(0 0 ${Math.min(26, 5 + effectText.combo * 1.3)}px #ffca55)` }} aria-live="polite">{effectText.label}{effectText.points > 0 && !['won', 'lost', 'chain'].includes(effectText.kind) && <small>+{effectText.points}</small>}{effectText.kind === 'won' && <small>SCORE {effectText.score.toLocaleString()}</small>}{!['won', 'lost'].includes(effectText.kind) && effectText.combo > 0 && <small className="combo-label" style={{ fontSize: `${Math.min(27, 13 + effectText.combo * 1.2)}px` }}>COMBO ×{effectText.combo}</small>}</div>}
    <header className="topbar"><div className="brand-mark">✳</div><div className="brand"><span>FIELD NOTES / 01</span><strong>Super Mine Sweeper</strong></div><span className="edition">MINESWEEPER CLUB</span></header>
    <section className="intro"><div className="eyebrow">A LITTLE GAME OF LOGIC</div><h1>静かな盤面に、<br className="mobile-break"/>ひとつずつ答えを。</h1><p>数字を手がかりに、地雷のない道を見つけよう。</p></section>
    <section className="game-card" aria-label="マインスイーパー">
      <div className="card-heading"><div><span className="eyebrow">TODAY'S FIELD</span><h2>ゲームボード</h2></div><button className="restart" onClick={() => newGame()} aria-label="リスタート">↻ <span>リスタート</span></button></div>
      <div className="difficulty" aria-label="難易度">{Object.entries(DIFFICULTIES).map(([key, item]) => <button key={key} className={game.difficulty === key ? 'selected' : ''} onClick={() => newGame(key)}>{item.label}</button>)}</div>
      <div className="stats"><div className="stat"><span>残り地雷</span><strong>{String(game.config.mines - game.flaggedCount).padStart(3, '0')}</strong></div><div className="status-face" aria-label={outcome || 'プレイ中'}>{game.status === 'won' ? '✦' : game.status === 'lost' ? '×' : '☺'}</div><div className="stat timer"><span>経過時間</span><strong>{formatTime(elapsed)}</strong></div></div>
      <div className="scorebar"><div><span>SCORE</span><strong>{score.toLocaleString()}</strong></div><div className={visibleCombo ? 'combo-count active' : 'combo-count'}><span>COMBO</span><strong>{visibleCombo ? `×${visibleCombo}` : '—'}</strong></div><div><span>MAX COMBO</span><strong>{maxCombo}</strong></div></div>
      {outcome && <div className={`result ${game.status}`}>{outcome} <span>{game.status === 'won' ? `TIME ${formatTime(elapsed)} · MAX COMBO ${maxCombo}` : `SCORE ${score.toLocaleString()} · MAX COMBO ${maxCombo}`}</span></div>}
      <div className="board-wrap"><div className={`board ${game.difficulty}`} role="grid" aria-label={`${game.config.rows}行${game.config.cols}列の盤面`} onContextMenu={e => e.preventDefault()}>
        {game.board.map((row, r) => row.map((cell, c) => {
          const shownMine = (game.status === 'lost' && cell.hasMine) || (game.status === 'won' && cell.hasMine && !cell.isFlagged)
          const classes = ['tile', cell.isRevealed ? 'revealed' : '', cell.isFlagged ? 'flagged' : '', shownMine ? 'mine' : '', game.detonated?.[0] === r && game.detonated?.[1] === c ? 'detonated' : '', cell.isRevealed && cell.adjacentMines ? `n${cell.adjacentMines}` : ''].filter(Boolean).join(' ')
          return <button key={`${r}-${c}`} data-cell={`${r}-${c}`} role="gridcell" aria-label={`第${r + 1}行第${c + 1}列${cell.isFlagged ? '、旗' : cell.isRevealed ? (cell.hasMine ? '、地雷' : `、${cell.adjacentMines || '空白'}`) : '、未開封'}`} className={classes} onClick={() => cell.isRevealed ? chord(r, c) : flagMode ? flag(r, c) : open(r, c)} onContextMenu={e => { e.preventDefault(); flag(r, c) }} onAuxClick={e => { if (e.button === 1) { e.preventDefault(); chord(r, c) } }}>{cell.isFlagged ? <span className="flag-icon">⚑</span> : shownMine ? '✹' : cell.isRevealed && cell.adjacentMines ? cell.adjacentMines : ''}</button>
        }))}
      </div></div>
      <div className="board-footer"><div className="legend"><span><i className="legend-open"/> 開封済み</span><span><i className="legend-hidden"/> 未開封</span></div><button className={`flag-toggle ${flagMode ? 'active' : ''}`} aria-pressed={flagMode} onClick={() => setFlagMode(active => !active)}>⚑ <span>{flagMode ? '旗モード ON' : '旗モード'}</span></button></div>
      <div className="instructions"><span>操作のヒント</span><p>クリック／タップで開封 · 右クリックで旗 · 開封済みの数字を押すと周囲を一括開封</p></div>
      <label className="motion-setting"><input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} /> 動きを軽減</label>
    </section>
    <footer className="page-footer"><span>THINK SLOWLY. CLICK CAREFULLY.</span><span>NO. 001 — LOGIC & PATIENCE</span></footer>
  </main>
}
export default App
