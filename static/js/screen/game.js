const socket = io(window.location.origin);
socket.on('connect', () => {
  socket.emit('screen-name', gameName)
})
socket.on('selection-change', data => {
  const player = game.players.find(player => player.name == data.player)
  if (player)
    player.deck = data.deck
  displaySelectedPieces()
})
socket.on('players', function(data) {
  if (!game) return
  const connected = {}
  data.forEach(d => {
    connected[d.name] = d.connected
  })
  game.players.forEach(player => {
    player.connected = connected[player.name]
  })
  updateScoreboard()
  updateDeckdata()
})
socket.on('game-data', data => {
  console.log(data)
  game = data
  drawGame()
  displaySelectedPieces()
  updateScoreboard()
  displayBoxSize()
  displayCurrentPlayer()
})
socket.on('warning', data => {
  displayWarning(data.warningNum)
})

let nextRow = 0
let firstTurn = true
let gameEnding = false
let startingPlayer = 0
let rowsChangedY = [], rowsChangedX = []
let game = null
initCanvas()

const SE_CLICKED_FIELD = 1
const SE_RESET_TURN = 2
const SE_SWAP_PIECES = 3
const SE_MAKE_TURN = 4
function clickedField (x, y) {
  socket.emit('screen-event', {gameName, event: SE_CLICKED_FIELD, x, y})
}

function resetTurn () {
  socket.emit('screen-event', {gameName, event: SE_RESET_TURN})
}

function swapPieces () {
  socket.emit('screen-event', {gameName, event: SE_SWAP_PIECES})
}

function makeTurn () {
  socket.emit('screen-event', {gameName, event: SE_MAKE_TURN})
}

function updateScoreboard () {
  const scoreboard = document.getElementById('scoreboard')
  const turn = game.players[game.turn]
  scoreboard.innerHTML = [...game.players].sort((a, b) => b.score - a.score).reduce((html, player) => html + `<li class="${player == turn ? "turn" : ""}"><div class="color-marker ${player.connected ? "connected" : "disconnected"}"></div>${player.name}: ${player.score} (${player.deck.length} on hand)</li>`, "")
}

function displaySelectedPieces () {
  document.getElementById("selection-size").innerHTML = game.players[game.turn].deck.filter(piece => piece.selected).length
}

function displayBoxSize () {
  document.getElementById("box-size").innerHTML = game.box.length
}

function displayCurrentPlayer () {
  document.getElementById('turn-player').innerHTML = game.players[game.turn].name
}

const WARN_NOTHING = 0
const WARN_BOX_EMPTY = 1
const WARN_SELECT_1 = 2
const WARN_INVALID_TURN = 3
const WARN_CANT_SWAP = 4
const WARN_GAME_OVER = 5
const warnings = [
  "",
  "The box is empty. The game will end when someone runs out of pieces.",
  "Please select exactly 1 piece.",
  "Invalid turn has been reset. Please try again.",
  "Can't swap more pieces than currently in box.",
  "Game is over. Highest score wins!"
]
let warningTimeout = null
function displayWarning (warningNum) {
  warningTimeout && clearTimeout(warningTimeout)
  document.getElementById("warning-box").innerHTML = warnings[warningNum]
  document.getElementById("warning-box").classList.add("visible")
  warningTimeout = setTimeout(() => {document.getElementById("warning-box").classList.remove("visible")}, 6000)
}

document.getElementById('main-action-reset').addEventListener('click', resetTurn)
document.getElementById('main-action-swap').addEventListener('click', swapPieces)
document.getElementById('main-action-finish').addEventListener('click', makeTurn)