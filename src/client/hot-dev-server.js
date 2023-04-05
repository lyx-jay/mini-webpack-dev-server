const hotEmitter = require('./emitter')
const { eventName } = require('../config')

let currentHash
// 存储上一次的hash值
let lastHash = null

hotEmitter.on(eventName.WEBPACK_HOT_UPDATE, (hash) => {
  currentHash = hash
  // 第一次请求不进行热更新检查
  // if (!lastHash) {
  //   lastHash = currentHash
  //   return
  // }
  hotCheck()
  console.log(13123)
})

function hotCheck() {
  console.log('hot check')
  hotDownloadManifest()
    .then(hotUpdate => {
      console.log('hotUpdate', hotUpdate)
      let chunkList = Object.keys(hotUpdate.c)
      chunkList.forEach(chunkId => {
        hotDownloadUpdateChunk(chunkId)
      })
      lastHash = currentHash
    })
    .catch(err => {
      console.warn('[error]: download update chunk file')
      window.location.reload()
    })

}

/**
 * 通过JSONP的方式请求更新部分，然后执行（JSONP请求回来的内容可以立即执行）
 * @param {String} chunkId 
 */
function hotDownloadUpdateChunk(chunkId) {
  const element = document.createElement('script')
  element.charset = 'utf8'
  element.src = `${chunkId}.${lastHash}.hot-update.js`
  document.head.appendChild(element)
}

/**
 * 请求 manifest 文件，该文件包含所有要更新的模块的 hash 值和chunk名
 * @returns 
 */
function hotDownloadManifest() {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.open('get', `${lastHash}.hot-update.json`)
    xhr.onload = () => {
      try {
        let hotUpdate = JSON.parse(xhr.responseText)
        resolve(hotUpdate)
      } catch (error) {
        reject(error)
      }
    }
    xhr.onerror = () => {
      reject(error)
    }
    xhr.send()
  })
}

// 【8.0】这个hotCreateModule很重要，module.hot的值 就是这个函数执行的结果
let hotCreateModule = (moduleID) => {
  let hot = {// module.hot属性值
    accept(deps = [], callback) {
      deps.forEach(dep => {
        // 调用accept将回调函数 保存在module.hot._acceptedDependencies中
        hot._acceptedDependencies[dep] = callback || function () { };
      })
    },
    check: hotCheck// module.hot.check === hotCheck
  }
  return hot;
}

//【8】补丁JS取回来后会调用webpackHotUpdate方法(请看update chunk的格式)，里面会实现模块的热更新
window.webpackHotUpdate = (chunkID, moreModules) => {
  console.log('moreModules :>> ', moreModules);
  // 【9】热更新
  // 循环新拉来的模块
  Object.keys(moreModules).forEach(moduleID => {
    // 1、通过__webpack_require__.c 模块缓存可以找到旧模块
    let oldModule = __webpack_require__.c[moduleID];

    // 2、更新__webpack_require__.c，利用moduleID将新的拉来的模块覆盖原来的模块
    let newModule = __webpack_require__.c[moduleID] = {
      i: moduleID,
      l: false,
      exports: {},
      hot: hotCreateModule(moduleID),
      parents: oldModule.parents,
      children: oldModule.children
    };

    // 3、执行最新编译生成的模块代码
    moreModules[moduleID].call(newModule.exports, newModule, newModule.exports, __webpack_require__);
    newModule.l = true;

    // 这块请回顾下accept的原理
    // 4、让父模块中存储的_acceptedDependencies执行
    newModule.parents && newModule.parents.forEach(parentID => {
      let parentModule = __webpack_require__.c[parentID];
      parentModule.hot._acceptedDependencies[moduleID] && parentModule.hot._acceptedDependencies[moduleID]()
    });
  })
}