const twing = require('./templates')
const router = require('express').Router()

const games = require('./games')

module.exports = router

router.post('/create_game', (req, res) => {
  const game = games.makeGame()
  twing.render('main/setup_phase.twig', {gameName: game.name}).then(rendered => res.end(rendered))
})

router.post('/start_game', (req, res) => {
  const game = games.getGame(req.body.gameName)
  if (!game)
    return res.status(400).send()
  twing.render('main/game.twig', {gameName: game.name, players: JSON.stringify(game.players.map(player => player.name))}).then(rendered => res.end(rendered))
})