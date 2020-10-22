const twing = require('./templates')
const router = require('express').Router()

const games = require('./games')

module.exports = router

router.post('/game', (req, res) => {
  if (!req.body.game)
    return res.status(400).send()
  const game = games.getGame(req.body.game.toUpperCase())
  if (!game)
    return res.status(404).send()
  twing.render('screen/game.twig', {gameName: game.name}).then(rendered => res.end(rendered))
})