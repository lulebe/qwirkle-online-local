const games = require('./games')

function updatePlayers (game) {
  if (!game)
    return
  if (game.host)
    game.host.emit('players', game.players.map(player => ({name: player.name, connected: player.client != null})))
  game.screens.forEach(screen => {
    screen.emit('players', game.players.map(player => ({name: player.name, connected: player.client != null})))
  })  
}

module.exports =  {
  init (io) {
    io.on('connection', client => {
      client.on('main-name', gameName => {
        const game = games.getGame(gameName)
        if (game) {
          game.host = client
          client.hostsGame = game
          updatePlayers(game)
        }
      })
      client.on('screen-name', gameName => {
        const game = games.getGame(gameName)
        if (game) {
          game.screens.push(client)
          client.screensGame = game
          client.screenId = game.nextScreenId
          game.nextScreenId++
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
      client.on('screen-update', data => {
        const game = games.getGame(data.gameName)
        game.screens.forEach(screen => screen.emit('game-data', data.data))
      })
      client.on('screen-event', data => {
        const game = games.getGame(data.gameName)
        game.host.emit('screen-event', data)
      })
      client.on('screen-warning', data => {
        const game = client.hostsGame
        if (game)
          game.screens.forEach(screen => screen.emit('warning', data))
      })
      client.on('disconnect', () => {
        if (client.playsGame) {
          client.playsGame.players.find(player => player.client == client).client = null
          updatePlayers(client.playsGame)
          client.playsGame = null
        }
        if (client.hostsGame) {
          client.hostsGame.host = null
          client.hostsGame = null
        }
        if (client.screensGame) {
          const index = client.screensGame.screens.indexOf(client)
          if (index > -1)
          client.screensGame.screens.splice(index, 1)
        }
      })
    })
  }
}
