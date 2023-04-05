const path = require('path')
const mime = require('mime')

/**
 * 
 * @param {String} filePath 
 * @param {Object} fs 
 */
function routesMiddleware(outdir, fs) {
  return (req, res, next) => {
    let { url } = req
    if (url === '/favicon.ico') {
      return res.sendStatus(404)
    }
    if (url === '/') {
      url = '/index.html'
    }
    const filePath = path.join(outdir, url)
    try {
      const obj = fs.statSync(filePath)
      if (obj.isFile()) {
        const content = fs.readFileSync(filePath)
        // 获取文件的类型信息
        const type = mime.getType(filePath)
        res.setHeader("Content-Type", type)
        res.send(content)
      } else {
        res.sendStatus(404)
      }
    } catch (error) {
      res.sendStatus(404)
    }
  }
}
/**
 * 从内存中读取内容
 * @param {String} path 
 */
function readContentFromMemory(path) {

}


module.exports = {
  routesMiddleware
}