const bodyparser = require('body-parser')
const express = require('express')
const twing = require('./templates')

const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
require('./socket').init(io)

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended: false}))


app.get('/', (req, res) => {
  twing.render('index.twig').then(rendered => res.end(rendered))
})

app.use('/remote', require('./routes_remote.js'))
app.use('/main', require('./routes_main.js'))
app.use('/screen', require('./routes_screen.js'))

app.use('/static', express.static('./static'))

http.listen(process.env.PORT || 8080, () => {console.log("running...")})