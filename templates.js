const fs = require('node:fs')
const path = require('node:path')
const { createEnvironment, createFilesystemLoader } = require('twing')

const loader = createFilesystemLoader(fs)
loader.addPath(path.join(__dirname, 'views'))
module.exports = createEnvironment(loader)