const twing = require('./templates')
const router = require('express').Router()

const games = require('./games')

module.exports = router

router.post('/game', (req, res) => {
  if (!req.body.game || !req.body.username)
    return res.status(400).send()
  const game = games.getGame(req.body.game.toUpperCase())
  if (!game)
    return res.status(404).send()
  twing.render('remote/game.twig', {gameName: game.name, userName: req.body.username}).then(rendered => res.end(rendered))
})