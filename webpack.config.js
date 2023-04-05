const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    // 生成html文件
    new HtmlWebpackPlugin(),
    // 热更新 runtime 代码
    new webpack.HotModuleReplacementPlugin()
  ]
}