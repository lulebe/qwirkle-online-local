const games = require('./games')

function updatePlayers (game) {
  if (game && game.host)
    game.host.emit('players', game.players.map(player => ({name: player.name, connected: player.client != null})))
}

module.exports =  {
  init (io) {
    io.on('connection', client => {
      client.on('main-name', gameName => {
        const game = games.getGame(gameName)
        if (game) {
          game.host = client
          game.hostDisconnected = false
          client.hostsGame = game
          updatePlayers(game)
        }
      })
      client.on('remote-data', data => {
        const game = games.getGame(data.game)
        if (game) {
          const existingUser = game.players.find(player => player.name == data.user)
          if (existingUser)
            existingUser.client = client
          else
            game.players.push({name: data.user, client})
          client.playsGame = game
          updatePlayers(game)
        }
      })
      client.on('request-players', gameName => {
        updatePlayers(games.getGame(gameName))
      })
      client.on('client-update', data => {
        const game = games.getGame(data.game)
        if (game) {
          game.players.forEach(player => {
            player.client && player.client.emit('update', data.decks[player.name])
          })
        }
      })
      client.on('selection-change', data => {
        client.playsGame && client.playsGame.host && client.playsGame.host.emit('selection-change', data)
      })
      client.on('game-end', data => {
        const game = games.getGame(data.gameName)
        client.hostsGame = null
        game.players.forEach(p => p.client.playsGame = null)
        games.removeGame(game)
      })
      client.on('disconnect', () => {
        if (client.playsGame) {
          client.playsGame.players.find(player => player.client == client).client = null
          updatePlayers(client.playsGame)
          client.playsGame = null
        }
        if (client.hostsGame) {
          client.hostsGame.host = null
          client.hostsGame.hostDisconnected = (new Date()).getTime()
          client.hostsGame = null
        }
      })
    })
  }
}
