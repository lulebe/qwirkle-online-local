let currentDeck = []

const socket = io(window.location.origin);
socket.on('connect', function(){
  socket.emit('remote-data', {game: gameName, user: userName})
})
socket.on('update', deck => {
  currentDeck = deck
  displayDeck(deck)
  for (let i = 0; i < 6; i++) {
    if (deck[i])
      document.getElementById('piece-'+i).classList.toggle("selected", deck[i].selected)
    else
    document.getElementById('piece-'+i).classList.remove("selected")
  }
})

function displayDeck (deck) {
  for (let i = 0; i < 6; i++) {
    clearPiece(document.getElementById("piece-" + i + "-canvas"))
    if (deck[i]) renderPiece(deck[i].piece, document.getElementById("piece-" + i + "-canvas"))
  }
}

for (let i = 0; i < 6; i++) {
  document.getElementById('piece-'+i).addEventListener('click', e => {
    if (currentDeck[i]) {
      currentDeck[i].selected = !currentDeck[i].selected
      document.getElementById('piece-'+i).classList.toggle("selected", currentDeck[i].selected)
      socket.emit('selection-change', {player: userName, deck: currentDeck})
    }
  })
}
