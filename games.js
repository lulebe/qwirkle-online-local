const customAlphabet = require('nanoid/non-secure').customAlphabet

const nanoid = customAlphabet('123456789ABCDEFGHIJKLMNPQRSTUVWXYZ', 5)

//game: {name: String, players: [{name: String, client: Socket(client)}], host: Socket(host), lastActive: Int(Timestamp)}
const games = []

setInterval(removeInactiveGames, 60000)

module.exports = {
  makeGame, getGame, removeGame, getScreenById
}

function getGame (name) {
  const game = games.find(game => game.name == name)
   if (game) game.lastActive = (new Date()).getTime()
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
  const game = {name: gameName, players: [], host: null, screens: [], nextScreenNum: 1, lastActive: (new Date()).getTime()}
  games.push(game)
  return game
}

function removeGame (game) {
  games.splice(games.indexOf(game), 1)
}

function removeInactiveGames () {
  games.forEach(game => {
    if (game.lastActive < ((new Date()).getTime() - 1800000))
      removeGame(game)
  })
}
