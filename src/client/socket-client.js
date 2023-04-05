const { io } = require("socket.io-client")
const hotEmitter = require('./emitter')
const { eventName } = require('../config')

let currentHash = null

const socket = io("/")

const onSocketMessage = {
  connect: () => {
    console.log('[info: success] -> client socket connect successfully')
  },
  hash: (hash) => {
    console.log(`[info: hash] -> ${hash}`)
    currentHash = hash
  },
  ok: () => {
    console.log('[info]: ok')
    reloadApp()
  }
}

// 循环注册监听事件
for (const eventName in onSocketMessage) {
  const handler = onSocketMessage[eventName];
  socket.on(eventName, handler)
}


function reloadApp() {
  console.log('热更新')
  let hot = true
  if (hot) {
    hotEmitter.emit(eventName.WEBPACK_HOT_UPDATE, currentHash)
  } else {
    window.location.reload()
  }
}





