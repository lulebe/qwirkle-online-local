const tileSize = 64

const canvas = document.getElementById("game-canvas")
const ctx = canvas.getContext("2d")

let translateX = 0
let translateY = 0
let previousTranslateX = 0
let previousTranslateY = 0
let mousedown = false
let mousedownX = 0
let mousedownY = 0
let mousemoved = false
let touchdown = false
let touchdownX = 0
let touchdownY = 0
let touchmoved = false
let scale = 1.0

window.addEventListener('resize', resizeCanvas)

function resizeCanvas (isInit) {
  document.getElementById("game-canvas").width = document.getElementById("game-table").clientWidth -10
  document.getElementById("game-canvas").height = document.getElementById("game-table").clientHeight -10
  if (!isInit)
    drawGame()
}
function initCanvas () {
  resizeCanvas(true)
}

function drawGame () {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.translate(translateX, translateY)
  ctx.scale(scale, scale)

  drawGrid()

  Object.keys(game.table).forEach(x => {
    Object.keys(game.table[x]).forEach(y => {
      const piece = game.table[x][y].piece
      const prevTurn = game.table[x][y].prevTurn
      drawPiece(ctx, x, y, piece, prevTurn)
      
    })
  })

  ctx.scale(1.0/scale, 1.0/scale)
  ctx.translate(-translateX, -translateY)
}

function drawGrid () {
  ctx.strokeStyle = "#aaaaaa"
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let row = -25; row<36; row++) {
    ctx.moveTo(tileSize*-25, tileSize*row)
    ctx.lineTo(tileSize*35, tileSize*row)
  }
  for (let column = -25; column<36; column++) {
    ctx.moveTo(tileSize*column, tileSize*-25)
    ctx.lineTo(tileSize*column, tileSize*35)
  }
  ctx.stroke()
}

function drawPiece (ctx, x, y, piece, prevTurn) {
  ctx.fillStyle = prevTurn ? "#555555" : "#000000"
  ctx.fillRect(x*tileSize+1, y*tileSize+1, tileSize-1, tileSize-1)
  ctx.fillStyle = ["#ff3333", "#33ff33", "#ffdd00", "#3333ff", "#ff3dc8", "#dcc2d8"][parseInt(piece.substring(0,1))]
  switch (parseInt(piece.substring(1,2))) {
    case 0:
      ctx.fillRect(x*tileSize+10, y*tileSize+10, tileSize-20, tileSize-20)
      break
    case 1:
      ctx.beginPath()
      ctx.moveTo(x*tileSize + tileSize/2, y*tileSize + 10)
      ctx.lineTo(x*tileSize + 10, y*tileSize + tileSize-10)
      ctx.lineTo(x*tileSize + tileSize - 10, y*tileSize + tileSize-10)
      ctx.fill()
      break
    case 2:
      ctx.beginPath()
      ctx.arc(x*tileSize+10+(tileSize-20)/2, y*tileSize+10+(tileSize-20)/2, (tileSize-20)/2, 0, 2*Math.PI)
      ctx.fill()
      break
    case 3:
      ctx.fillRect(x*tileSize+10, y*tileSize+25, tileSize-20, tileSize-50)
      ctx.fillRect(x*tileSize+25, y*tileSize+10, tileSize-50, tileSize-20)
      break
    case 4:
      ctx.fillRect(x*tileSize+10, y*tileSize+25, tileSize-20, tileSize-50)
      break
    case 5:
      ctx.beginPath()
      ctx.moveTo(x*tileSize + tileSize/2, y*tileSize + 10)
      ctx.lineTo(x*tileSize + 12, y*tileSize + (tileSize-20)*0.75 + 10)
      ctx.lineTo(x*tileSize + tileSize - 12, y*tileSize + (tileSize-20)*0.75 + 10)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(x*tileSize + tileSize/2, y*tileSize + tileSize - 10)
      ctx.lineTo(x*tileSize + 12, y*tileSize + (tileSize-20)*0.25 + 10)
      ctx.lineTo(x*tileSize + tileSize - 12, y*tileSize + (tileSize-20)*0.25 + 10)
      ctx.fill()
      break
  }
}

//mouse events
canvas.addEventListener("mousedown", e => {
  mousedownX = e.clientX
  mousedownY = e.clientY
  mousedown = true
})
canvas.addEventListener("mousemove", e => {
  if (mousedown) {
    mousemoved = true
    translateX = previousTranslateX + e.clientX - mousedownX
    translateY = previousTranslateY + e.clientY - mousedownY
    drawGame()
  }
})
window.addEventListener("mouseup", e => {
  if (mousedown) {
    if (!mousemoved)
      canvasClick(mousedownX, mousedownY)
    mousedown = false
    mousemoved = false
    previousTranslateX = translateX
    previousTranslateY = translateY
  }
})
canvas.addEventListener("touchstart", e => {
  e.preventDefault()
  if (!touchdown) {
    touchdownX = e.touches[0].clientX
    touchdownY = e.touches[0].clientY
    touchdown = true
  }
}, {passive: false})
canvas.addEventListener("touchmove", e => {
  e.preventDefault()
  if (touchdown) {
    if (Math.abs(e.touches[0].clientX - touchdownX) > 4 || Math.abs(e.touches[0].clientY - touchdownY) > 4)
      touchmoved = true
    translateX = previousTranslateX + e.touches[0].clientX - touchdownX
    translateY = previousTranslateY + e.touches[0].clientY - touchdownY
    drawGame()
  }
}, {passive: false})
canvas.addEventListener("touchend", e => {
  e.preventDefault()
  if (touchdown) {
    if (!touchmoved)
      canvasClick(touchdownX, touchdownY)
    touchdown = false
    touchmoved = false
    previousTranslateX = translateX
    previousTranslateY = translateY
  }
}, {passive: false})

function canvasClick (x, y) {
  const bounds = canvas.getBoundingClientRect()
  const realX = Math.floor((x - bounds.left - translateX) / scale / tileSize)
  const realY = Math.floor((y - bounds.top - translateY) / scale / tileSize)
  clickedField(realX, realY)
}

document.getElementById("zoom-in").addEventListener("click", e => {
  const currentCenterX = ((canvas.width/2)-translateX) / scale
  const currentCenterY = ((canvas.height/2)-translateY) / scale
  scale += 0.1
  if (scale >= 1) scale = 1.0
  translateX = previousTranslateX = (canvas.width/2) - (currentCenterX * scale)
  translateY = previousTranslateY = (canvas.height/2) - (currentCenterY * scale)
  drawGame()
})
document.getElementById("zoom-out").addEventListener("click", e => {
  const currentCenterX = ((canvas.width/2)-translateX) / scale
  const currentCenterY = ((canvas.height/2)-translateY) / scale
  scale -= 0.1
  if (scale <= 0.5) scale = 0.5
  translateX = previousTranslateX = (canvas.width/2) - (currentCenterX * scale)
  translateY = previousTranslateY = (canvas.height/2) - (currentCenterY * scale)
  drawGame()
})
