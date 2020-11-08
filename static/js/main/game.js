const socket = io(window.location.origin);
socket.on('connect', () => {
  socket.emit('main-name', gameName)
})
socket.on('selection-change', data => {
  const player = game.players.find(player => player.name == data.player)
  if (player)
    player.deck = data.deck
  displaySelectedPieces()
})
socket.on('players', function(data) {
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
const SE_CLICKED_FIELD = 1
const SE_RESET_TURN = 2
const SE_SWAP_PIECES = 3
const SE_MAKE_TURN = 4
socket.on('screen-event', data => {
  switch (data.event) {
    case SE_CLICKED_FIELD:
      clickedField(data.x, data.y)
    break;
    case SE_RESET_TURN:
      resetTurn()
    break;
    case SE_SWAP_PIECES:
      swapPieces()
    break;
    case SE_MAKE_TURN:
      makeTurn()
    break;
  }
})

function updateScreens () {
  socket.emit('screen-update', {gameName: gameName, data: game})
}

function warnScreens (warningNum) {
  socket.emit('screen-warning', {gameName: gameName, warningNum})
}

let nextRow = 0
let firstTurn = true
let startingPlayer = 0
let rowsChangedY = [], rowsChangedX = []
const game = {name: gameName, players: playerNames.map(name => ({name, score: 0, connected: false, deck: []})), box: makeBox(), table: {}, turn: 0}

if (canLoadGame()) //has saved game
  displayLoadGamePopup()
else
  initGame()

function initGame () {
  fillDecks()
  setStartingPlayer()
  updateScoreboard()
  initCanvas()
  updateScreens()
}

function canLoadGame () {
  if (!window.localStorage.getItem('nextRow') || !window.localStorage.getItem('game')) return false
  const savedPlayerNames = JSON.parse(window.localStorage.getItem('game')).players.map(p => p.name)
  return game.players.length === savedPlayerNames.length && game.players.every(p => savedPlayerNames.includes(p.name))
}

function displayLoadGamePopup () {
  document.getElementById('loadgame-popup').classList.add('visible')
}

function loadGame () {
  document.getElementById('loadgame-popup').classList.remove('visible')
  nextRow = window.localStorage.getItem('nextRow')
  const loadedGame = JSON.parse(window.localStorage.getItem('game'))
  game.players = loadedGame.players
  game.box = loadedGame.box
  game.table = loadedGame.table
  game.turn = loadedGame.turn
  updateScreens()
  document.getElementById('turn-player').innerHTML = game.players[game.turn].name
  updateScoreboard()
  initCanvas()
  updateScreens()
  displayBoxSize()
  updateDeckdata()
}

function startNewGame () {
  document.getElementById('loadgame-popup').classList.remove('visible')
  window.localStorage.clear()
  initGame()
}

//"colorShape" = "XX"
//colors: 0=red, 1=green, 2=yellow, 3=blue, 4=pink, 5=rose
//shapes: 0=rect, 1=tri, 2=circle, 3=plus, 4=minus, 5=star 
function makeBox () {
  const box = []
  for (let i = 0; i < 3; i++) {
    for (let color = 0; color < 6; color++) {
      for (let shape = 0; shape < 6; shape++) {
        box.push("" + color + shape)
      }
    }
  }
  return arrShuffle(box)
}

function arrShuffle (array) {
  let currentIndex = array.length, temporaryValue, randomIndex
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
}

function fillDecks () {
  game.players.forEach(player => {
    while (player.deck.length < 6 && game.box.length > 0) {
      player.deck.push({piece: game.box.pop(), selected: false})
    }
  })
  if (game.box.length == 0)
    boxEmpty()
  displayBoxSize()
  updateDeckdata()
  updateScreens()
}

function boxEmpty () {
  displayWarning(WARN_BOX_EMPTY)
}

function updateDeckdata () {
  //send new decks to clients
  const deckData = {}
  game.players.forEach(p => deckData[p.name] = p.deck)
  socket.emit('client-update', {game: gameName, decks: deckData})
  displaySelectedPieces()
}

function getMaxRowFromDeck (deck) {
  const uniquePieces = [...new Set(deck)]
  let max = 1
  uniquePieces.forEach(piece => max = Math.max(max, uniquePieces.filter(otherPiece => otherPiece.piece.substring(0,1) == piece.piece.substring(0,1)).length))
  uniquePieces.forEach(piece => max = Math.max(max, uniquePieces.filter(otherPiece => otherPiece.piece.substring(1,2) == piece.piece.substring(1,2)).length))
  return max
}
function setStartingPlayer () {
  game.turn = startingPlayer = game.players.indexOf(game.players.map(player => ({player, maxRow: getMaxRowFromDeck(player.deck)})).sort((a, b) => a.maxRow - b.maxRow).pop().player)
  document.getElementById('turn-player').innerHTML = game.players[game.turn].name
}

function clickedField (x, y) {
  const selectedPieces = game.players[game.turn].deck.filter(piece => piece.selected)
  if (selectedPieces.length !== 1) {
    displayWarning(WARN_SELECT_1)
    return
  }
  const selectedPiece = selectedPieces[0]
  if (typeof game.table[x] == "undefined")
    game.table[x] = {}
  if (typeof game.table[x][y] == "undefined") {
    game.table[x][y] = {piece: selectedPiece.piece, new: true, rowX: findRowX(x, y), rowY: findRowY(x, y)}
    game.players[game.turn].deck.splice(game.players[game.turn].deck.indexOf(selectedPiece), 1)
    drawGame()
    updateDeckdata()
    updateScreens()
  }
}

function findRowX (x, y) {
  let previousX = null, nextX = null
  if (game.table[x-1] != null && game.table[x-1][y] != null)
    previousX =  game.table[x-1][y].rowX
  if (game.table[x+1] != null && game.table[x+1][y] != null)
    nextX = game.table[x+1][y].rowX
  if (previousX && nextX)
    return mergeRowsX(game.table[x-1][y].rowX, game.table[x+1][y].rowX)
  if (previousX) return previousX
  if (nextX) return nextX
  nextRow++
  return nextRow
}

function mergeRowsX (from, to) {
  Object.keys(game.table).forEach(sx => {
    const x = parseInt(sx)
    Object.keys(game.table[x]).forEach(sy => {
      const y = parseInt(sy)
      if (game.table[x][y].rowX == from) {
        rowsChangedX.push({x, y, from, to})
        game.table[x][y].rowX = to
      }
    })
  })
  return to
}

function findRowY (x, y) {
  let previousY = null, nextY = null
  if (game.table[x] != null && game.table[x][y-1] != null)
    previousY = game.table[x][y-1].rowY
  if (game.table[x] != null && game.table[x][y+1] != null)
    nextY = game.table[x][y+1].rowY
  if (previousY && nextY)
    return mergeRowsY(game.table[x][y-1].rowY, game.table[x][y+1].rowY)
  if (previousY) return previousY
  if (nextY) return nextY
  nextRow++
  return nextRow
}

function mergeRowsY (from, to) {
  Object.keys(game.table).forEach(sx => {
    const x = parseInt(sx)
    Object.keys(game.table[x]).forEach(sy => {
      const y = parseInt(sy)
      if (game.table[x][y].rowY == from) {
        rowsChangedY.push({x, y, from, to})
        game.table[x][y].rowY = to
      }
    })
  })
  return to
}

function makeTurn () {
  let hasInvalidPieces = false
  const newPiecePositions = []
  Object.keys(game.table).forEach(sx => {
    const x = parseInt(sx)
    Object.keys(game.table[x]).forEach(sy => {
      const y = parseInt(sy)
      const piece = game.table[x][y]
      if (piece.new) {
        newPiecePositions.push({x, y})
        const allowed = checkPieceAllowed(x, y)
        console.log("check allowed", x, y, allowed)
        if (!allowed)
          hasInvalidPieces = true
      }
    })
  })
  if ( newPiecePositions.length > 0 && (hasInvalidPieces || !piecesShareRow(newPiecePositions))) {
    resetTurn()
    displayWarning(WARN_INVALID_TURN)
  } else {
    addScores(newPiecePositions)
    removePrevTurnMarks()
    newPiecePositions.forEach(pos => {
      game.table[pos.x][pos.y].new = false
      game.table[pos.x][pos.y].prevTurn = true
    })
    rowsChangedX = []
    rowsChangedY = []
    drawGame()
    fillDecks()
    toNextTurn()
    updateScoreboard()
    updateScreens()
  }
}

function piecesShareRow (newPiecePositions) {
  const rowXShared = [...new Set(newPiecePositions.map(pos => game.table[pos.x][pos.y].rowX))]
  const rowYShared = [...new Set(newPiecePositions.map(pos => game.table[pos.x][pos.y].rowY))]
  if (rowXShared.length !== 1 && rowYShared.length !== 1) return false
  //row has to be preexisting
  const rowXMembersNew = []
  const rowYMembersNew = []
  Object.keys(game.table).forEach(sx => {
    const x = parseInt(sx)
    Object.keys(game.table[x]).forEach(sy => {
      const y = parseInt(sy)
      if (game.table[x][y].rowX == rowXShared[0]) rowXMembersNew.push(game.table[x][y].new)
      if (game.table[x][y].rowY == rowYShared[0]) rowYMembersNew.push(game.table[x][y].new)
    })
  })
  if (firstTurn && (rowXShared.length === 1 || rowYShared.length === 1))
    return true
  if (rowXShared.length === 1 && rowXMembersNew.some(v => v == false))
    return true
  if (rowYShared.length === 1 && rowYMembersNew.some(v => v == false))
    return true
  return false
}

function checkPieceAllowed (x, y) {
  //for all 4 neighboring rows:
  //if row exists & (is other color & same logo) | (is same color & other logo)

  //1. is only part of 1 row per axis
  //or try to join rows if possible
  const piece = game.table[x][y]
  if (game.table[x-1] != null && game.table[x-1][y] != null && game.table[x-1][y].rowX !== piece.rowX)
    return false
  if (game.table[x+1] != null && game.table[x+1][y] != null && game.table[x+1][y].rowX !== piece.rowX)
    return false
  if (game.table[x] != null && game.table[x][y-1] != null && game.table[x][y-1].rowY !== piece.rowY)
    return false
  if (game.table[x] != null && game.table[x][y+1] != null && game.table[x][y+1].rowY !== piece.rowY)
    return false
  
  //2. get pieces for rows
  let rowXPieces = []
  let rowYPieces = []
  Object.keys(game.table).forEach(sx => {
    const x = parseInt(sx)
    Object.keys(game.table[x]).forEach(sy => {
      const y = parseInt(sy)
      const p = game.table[x][y]
      if (p.rowX === piece.rowX) rowXPieces.push(p)
      if (p.rowY === piece.rowY) rowYPieces.push(p)
    })
  })

  //3. row lengths max 6
  if (rowXPieces.length > 6 || rowYPieces.length > 6)
    return false
  
  //4. correct rows, either:
  //all same color but unique shape
  //all same shape but unique color
  if (rowXPieces.every(p => p.piece.substring(0,1) == piece.piece.substring(0,1))) {
    if (rowXPieces.length == [...new Set(rowXPieces.map(p => p.piece.substring(1,2)))].length) {
      //check Y
      if (rowYPieces.every(p => p.piece.substring(0,1) == piece.piece.substring(0,1))) {
        if (rowYPieces.length == [...new Set(rowYPieces.map(p => p.piece.substring(1,2)))].length) 
          return true
      } else if (rowYPieces.every(p => p.piece.substring(1,2) == piece.piece.substring(1,2))) {
        if (rowYPieces.length == [...new Set(rowYPieces.map(p => p.piece.substring(0,1)))].length)
          return true
      }
    }
  } else if (rowXPieces.every(p => p.piece.substring(1,2) == piece.piece.substring(1,2))) {
    if (rowXPieces.length == [...new Set(rowXPieces.map(p => p.piece.substring(0,1)))].length) {
      if (rowYPieces.every(p => p.piece.substring(0,1) == piece.piece.substring(0,1))) {
        if (rowYPieces.length == [...new Set(rowYPieces.map(p => p.piece.substring(1,2)))].length) 
          return true
      } else if (rowYPieces.every(p => p.piece.substring(1,2) == piece.piece.substring(1,2))) {
        if (rowYPieces.length == [...new Set(rowYPieces.map(p => p.piece.substring(0,1)))].length)
          return true
      }
    }
  }
  return false
}

function addScores (newPiecePositions) {
  let score = 0
  //1. for each piece, check if included in previous pieces' rows
  //2. if not, check new row lengths for piece
  //3. add row lengths + qwirkle bonus to score
  const rowsCounted = []
  newPiecePositions.forEach(pos => {
    let rowXPieces = []
    let rowYPieces = []
    Object.keys(game.table).forEach(sx => {
      const x = parseInt(sx)
      Object.keys(game.table[x]).forEach(sy => {
        const y = parseInt(sy)
        const p = game.table[x][y]
        if (p.rowX === game.table[pos.x][pos.y].rowX) rowXPieces.push(p)
        if (p.rowY === game.table[pos.x][pos.y].rowY) rowYPieces.push(p)
      })
    })
    if (!rowsCounted.includes(game.table[pos.x][pos.y].rowX)) {
      score += rowXPieces.length > 1 ? rowXPieces.length + (rowXPieces.length == 6 ? 6 : 0) : 0
      rowsCounted.push(game.table[pos.x][pos.y].rowX)
    }
    if (!rowsCounted.includes(game.table[pos.x][pos.y].rowY)) {
      score += rowYPieces.length > 1 ? rowYPieces.length + (rowYPieces.length == 6 ? 6 : 0) : 0
      rowsCounted.push(game.table[pos.x][pos.y].rowY)
    }
  })
  if (score) firstTurn = false
  game.players[game.turn].score += score
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
  warnScreens(warningNum)
}

function gameEnd () {
  displayWarning(WARN_GAME_OVER)
  socket.emit('game-end', {gameName})
  updateScreens()
  clearSavedGame()
}

function toNextTurn () {
  if (game.players[game.turn].deck.length === 0) {//end game
    game.players[game.turn].score += 6
    updateScoreboard()
    gameEnd()
  } else {
    game.turn = game.turn == game.players.length - 1 ? 0 : game.turn + 1
    document.getElementById('turn-player').innerHTML = game.players[game.turn].name
    displaySelectedPieces()
    saveGame()
  }
}

function swapPieces () {
  resetTurn()
  const player = game.players[game.turn]
  const toSwap = player.deck.filter(piece => piece.selected)
  player.deck = player.deck.filter(piece => !piece.selected)
  if (game.box.length < toSwap.length)
    return displayWarning(WARN_CANT_SWAP)
  while (player.deck.length < 6 && game.box.length > 0) {
    player.deck.push({piece: game.box.pop(), selected: false})
  }
  toSwap.forEach(piece => game.box.push(piece.piece))
  game.box = arrShuffle(game.box)
  removePrevTurnMarks()
  toNextTurn()
  updateScoreboard()
  updateScreens()
  updateDeckdata()
}

function removePrevTurnMarks () {
  Object.keys(game.table).forEach(sx => {
    const x = parseInt(sx)
    Object.keys(game.table[x]).forEach(sy => {
      const y = parseInt(sy)
      const piece = game.table[x][y]
      if (piece.prevTurn) {
        delete piece.prevTurn
      }
    })
  })
}

function resetTurn () {
  const newPiecePositions = []
  Object.keys(game.table).forEach(sx => {
    const x = parseInt(sx)
    Object.keys(game.table[x]).forEach(sy => {
      const y = parseInt(sy)
      const piece = game.table[x][y]
      if (piece.new) {
        newPiecePositions.push({x, y})
      }
    })
  })
  newPiecePositions.forEach(pos => {
    game.players[game.turn].deck.push({piece: game.table[pos.x][pos.y].piece, selected: false})
    delete game.table[pos.x][pos.y]
  })
  rowsChangedX.forEach(piece => {
    if (game.table[piece.x][piece.y] != null)
      game.table[piece.x][piece.y].rowX = piece.from
  })
  rowsChangedY.forEach(piece => {
    if (game.table[piece.x][piece.y] != null)
      game.table[piece.x][piece.y].rowY = piece.from
  })
  updateDeckdata()
  drawGame()
  updateScreens()
}

function saveGame () {
  window.localStorage.setItem('nextRow', nextRow)
  window.localStorage.setItem('game', JSON.stringify(game))
}
function clearSavedGame () {
  window.localStorage.clear()
}

document.getElementById('main-action-reset').addEventListener('click', resetTurn)
document.getElementById('main-action-swap').addEventListener('click', swapPieces)
document.getElementById('main-action-finish').addEventListener('click', makeTurn)
document.getElementById('loadgame-load').addEventListener('click', loadGame)
document.getElementById('loadgame-new').addEventListener('click', startNewGame)