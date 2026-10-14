export function comboMultiplier(count) {
  if (count >= 20) return 5
  if (count >= 10) return 3
  if (count >= 5) return 2
  return 1
}

export function countCorrectFlags(board) {
  return board.flat().filter(cell => cell.isFlagged && cell.hasMine).length
}
