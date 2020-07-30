const tileSize = 64

function clearPiece (canvas) {
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
}

function renderPiece (piece, canvas) {
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#000000"
  ctx.fillRect(1, 1, tileSize-1, tileSize-1)
  ctx.fillStyle = ["#ff3333", "#33ff33", "#ffdd00", "#3333ff", "#ff3dc8", "#dcc2d8"][parseInt(piece.substring(0,1))]
  switch (parseInt(piece.substring(1,2))) {
    case 0:
      ctx.fillRect(10, 10, tileSize-20, tileSize-20)
      break
    case 1:
      ctx.beginPath()
      ctx.moveTo(tileSize/2, 10)
      ctx.lineTo(10, tileSize-10)
      ctx.lineTo(tileSize - 10, tileSize-10)
      ctx.fill()
      break
    case 2:
      ctx.beginPath()
      ctx.arc(10+(tileSize-20)/2, 10+(tileSize-20)/2, (tileSize-20)/2, 0, 2*Math.PI)
      ctx.fill()
      break
    case 3:
      ctx.fillRect(10, 25, tileSize-20, tileSize-50)
      ctx.fillRect(25, 10, tileSize-50, tileSize-20)
      break
    case 4:
      ctx.fillRect(10, 25, tileSize-20, tileSize-50)
      break
    case 5:
      ctx.beginPath()
      ctx.moveTo(tileSize/2, 10)
      ctx.lineTo(12, (tileSize-20)*0.75 + 10)
      ctx.lineTo(tileSize - 12, (tileSize-20)*0.75 + 10)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(tileSize/2, tileSize - 10)
      ctx.lineTo(12, (tileSize-20)*0.25 + 10)
      ctx.lineTo(tileSize - 12, (tileSize-20)*0.25 + 10)
      ctx.fill()
      break
  }
}
