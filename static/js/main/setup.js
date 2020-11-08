const socket = io(window.location.origin);
socket.on('connect', function(){
  socket.emit('main-name', gameName)
})
socket.on('players', function(data) {
  updatePlayers(data)
})

function updatePlayers (playerList) {
  const container = document.getElementById("setup-player-list")
  let html = ""
  playerList.forEach(player => {
    html += `<li><div class="color-marker ${player.connected ? "connected" : "disconnected"}"></div>${player.name}</li>`
  })
  container.innerHTML = html
  document.getElementById("connected-players").innerHTML = playerList.length
  document.getElementById("start-button").disabled = false //playerList.length < 2
}

if (window.localStorage.length > 0) { //has saved game
  document.getElementById("loadgame-info").classList.add('visible')
  document.getElementById("loadgame-playernames").innerHTML = JSON.parse(window.localStorage.getItem('game')).players.map(p => '"' + p.name + '"').join(', ')
}