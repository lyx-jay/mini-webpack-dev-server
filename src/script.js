const webpack = require('webpack')
const Server = require('./server/server')
const config = require('../webpack.config.js')

const compiler = webpack(config)

const server = new Server(compiler)

server.listen(8080, 'localhost', () => {
  console.log('server in running on http://localhost:8080/')
})
