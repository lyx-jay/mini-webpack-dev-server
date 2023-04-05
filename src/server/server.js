const express = require('express')
const http = require('http')
const memoryFileSystem = require('memory-fs')
const { routesMiddleware } = require('./middleware')
const socket = require('socket.io')
const path = require('path')


class Server {
  constructor(compiler) {

    this.compiler = compiler
    // express 实例
    this.app = null
    // web server 服务器
    this.server = null
    // 保存内存文件系统
    this.fs = null
    // hash值
    this.currentHash = null
    // ws 客户端列表
    this.websocketList = []
    this.addAdditionalEntries(this.compiler)
    this.initialize()
  }

  /**
   * 初始化
   */
  initialize() {
    this.setupHooks()
    this.setupApp()
    this.setupMiddlewares()
    this.setupBuiltInRoutes()
    this.createServer()
    this.createWebsocketServer()
  }

  /**
   * 设置监听函数
   */
  setupHooks() {
    this.compiler.hooks.done.tap('webpack-dev-server', (status) => {
      console.log(`[compile done]: ${status.hash}`)
      // this.sendStatus(status)
      // 给每一个客户端的socket发送消息
      this.websocketList.forEach(socket => {
        this.sendStatus(socket, status.hash)
      })
    })
  }

  /**
   * 创建express服务器
   */
  setupApp() {
    this.app = new express()
  }

  setupMiddlewares() {
    // compiler.watch 首次运行会进行编译
    // 每当有文件变化时，也会重新进行编译
    this.compiler.watch({}, () => {
      console.log("Compiled successfully!");
    });

    const mfs = new memoryFileSystem()
    // 使用内存来存储编译后产生的文件
    this.compiler.outputFileSystem = mfs
    this.fs = this.compiler.outputFileSystem
  }

  /**
   * 使用 express 中间件，处理路由
   */
  setupBuiltInRoutes() {
    const outputPath = this.compiler.options.output.path
    this.app.use(routesMiddleware(outputPath, this.fs))
  }

  createServer() {
    this.server = http.createServer(this.app)
  }

  createWebsocketServer() {
    const io = socket(this.server)
    io.on('connection', (socket) => {
      console.log('[createWebsocketServer]: socket server has been created')

      this.websocketList.push(socket)
      // socket 链接断开，移除该socket
      socket.on('disconnect', () => {
        const idx = this.websocketList.indexOf(socket)
        this.websocketList.splice(idx, 1)
      })

      // this.sendStatus(socket, this.currentHash)
    })
  }

  addAdditionalEntries(compiler) {
    const config = compiler.options
    const entry = config.entry.main.import
    entry.push(...[
      path.resolve(__dirname, '../client/socket-client.js'),
      path.resolve(__dirname, '../client/hot-dev-server.js'),
    ])
    compiler.hooks.entryOption.call(config.context, config.entry)
  }

  /**
   * 向客户端发送hash值
   * @param {socket.Socket} socket 
   * @param {String} hash 
   */
  sendStatus(socket, hash) {
    socket.emit('hash', hash)
    socket.emit('ok')
  }

  /**
   * 监听函数封装
   * @param {Number} port 
   * @param {String} hostname 
   * @param {Function} callback 
   */
  listen(port = 8080, hostname = 'localhost', callback = () => { }) {
    this.server.listen(port, hostname, callback)
  }

}

module.exports = Server