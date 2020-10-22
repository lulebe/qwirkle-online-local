const customAlphabet = require('nanoid/non-secure').customAlphabet

const nanoid = customAlphabet('123456789ABCDEFGHIJKLMNPQRSTUVWXYZ', 5)

//game: {name: String, players: [{name: String, client: Socket(client)}], host: Socket(host), hostDisconnected: Bool/Int(Timestamp)}
const games = []

setInterval(removeNullHostGames, 60000)

module.exports = {
  makeGame, getGame, removeGame, getScreenById
}

function getGame (name) {
  const game = games.find(game => game.name == name)
   if (game) game.hostDisconnected = (new Date()).getTime()
  return game
}

function getScreenById (game, id) {
  return game.screens.find(screen => screen.screenId == id)
}

function makeGame () {
  let gameName = nanoid()
  while (getGame(gameName) != null) {
    gameName = nanoid()
  }
  const game = {name: gameName, players: [], host: null, screens: [], nextScreenNum: 1, hostDisconnected: (new Date()).getTime()}
  games.push(game)
  return game
}

function removeGame (game) {
  //games.splice(games.indexOf(game), 1)
}

function removeNullHostGames () {
  games.forEach(game => {
    if (game.hostDisconnected && game.hostDisconnected < ((new Date()).getTime() - 1800000))
      removeGame(game)
  })
}
