export const DIFFICULTIES = {
  beginner: { label: '初級', rows: 8, cols: 8, mines: 10 },
  intermediate: { label: '中級', rows: 12, cols: 12, mines: 28 },
  expert: { label: '上級', rows: 16, cols: 16, mines: 50 },
}

const neighbors = (board, row, col) => {
  const cells = []
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue
    const r = row + dr, c = col + dc
    if (board[r]?.[c]) cells.push([r, c])
  }
  return cells
}

export function createGame(difficulty = 'beginner') {
  const config = DIFFICULTIES[difficulty] ?? DIFFICULTIES.beginner
  return { difficulty, config, board: Array.from({ length: config.rows }, () => Array.from({ length: config.cols }, () => ({ hasMine: false, adjacentMines: 0, isRevealed: false, isFlagged: false }))), status: 'ready', flaggedCount: 0, revealedCount: 0, startedAt: null, endedAt: null, detonated: null }
}

function placeMines(board, config, safeRow, safeCol) {
  const candidates = []
  board.forEach((row, r) => row.forEach((_, c) => { if (r !== safeRow || c !== safeCol) candidates.push([r, c]) }))
  if (config.mines > candidates.length) throw new Error('地雷数が盤面サイズを超えています')
  for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]] }
  for (const [r, c] of candidates.slice(0, config.mines)) board[r][c].hasMine = true
  board.forEach((row, r) => row.forEach((cell, c) => { cell.adjacentMines = neighbors(board, r, c).filter(([nr, nc]) => board[nr][nc].hasMine).length }))
}

function finishIfWon(state) {
  if (state.revealedCount >= state.config.rows * state.config.cols - state.config.mines) { state.status = 'won'; state.endedAt = Date.now() }
}
function revealMany(state, starts) {
  const queue = [...starts], seen = new Set()
  while (queue.length) {
    const [r, c] = queue.pop(), key = `${r},${c}`
    if (seen.has(key)) continue
    seen.add(key)
    const cell = state.board[r]?.[c]
    if (!cell || cell.isRevealed || cell.isFlagged) continue
    if (cell.hasMine) { cell.isRevealed = true; state.detonated = [r, c]; state.status = 'lost'; state.endedAt = Date.now(); return }
    cell.isRevealed = true; state.revealedCount++
    if (!cell.adjacentMines) queue.push(...neighbors(state.board, r, c))
  }
  finishIfWon(state)
}
const mutate = (state, operation) => { const next = structuredClone(state); operation(next); return next }
export function revealCell(state, row, col) {
  if (state.status === 'won' || state.status === 'lost') return state
  const cell = state.board[row]?.[col]
  if (!cell || cell.isFlagged || cell.isRevealed) return state
  return mutate(state, next => { if (next.status === 'ready') { placeMines(next.board, next.config, row, col); next.status = 'playing'; next.startedAt = Date.now() } revealMany(next, [[row, col]]) })
}
export function toggleFlag(state, row, col) {
  if (state.status === 'won' || state.status === 'lost') return state
  const cell = state.board[row]?.[col]
  if (!cell || cell.isRevealed) return state
  return mutate(state, next => { const target = next.board[row][col]; target.isFlagged = !target.isFlagged; next.flaggedCount += target.isFlagged ? 1 : -1 })
}
export function chordCell(state, row, col) {
  if (state.status !== 'playing') return state
  const cell = state.board[row]?.[col]
  if (!cell?.isRevealed || !cell.adjacentMines) return state
  const around = neighbors(state.board, row, col)
  if (around.filter(([r, c]) => state.board[r][c].isFlagged).length !== cell.adjacentMines) return state
  return mutate(state, next => revealMany(next, around))
}
