// vue.config.js
// 后端（阅读 APP 的 Web 服务）地址：默认回环 localhost:1122。
// 说明：devServer.proxy 的 target 由「跑 dev server 的那台机器」解析，
// 因此写 localhost 即可，且手机等外部设备通过局域网 IP 访问 8081 时同样能正常代理。
// 如需指向另一台机器上的后端，可用 VUE_APP_BACKEND_TARGET 覆盖，
// 例如 http://192.168.1.33:1122 或 http://localhost:1122
const backendTarget =
  process.env.VUE_APP_BACKEND_TARGET || "http://localhost:1122";

module.exports = {
  publicPath: "./",
  productionSourceMap: false,
  // 关闭保存时 lint：仓库历史代码存在 prettier 格式差异，避免 dev server 因格式告警编译失败
  lintOnSave: false,
  devServer: {
    host: "0.0.0.0",
    port: 8081,
    // 允许通过局域网 IP / 手机等外部设备访问开发服务器
    disableHostCheck: true,
    // 前端统一使用相对路径请求，开发模式下由这里代理转发到后端，
    // 避免硬编码 localhost 导致外部访问无法连接后端。
    proxy: {
      "/getReadConfig": { target: backendTarget, changeOrigin: true },
      "/getBookshelf": { target: backendTarget, changeOrigin: true },
      "/getChapterList": { target: backendTarget, changeOrigin: true },
      "/getBookContent": { target: backendTarget, changeOrigin: true },
      "/saveBookProgress": { target: backendTarget, changeOrigin: true },
      "/saveReadConfig": { target: backendTarget, changeOrigin: true },
      "/cover": { target: backendTarget, changeOrigin: true },
      "/image": { target: backendTarget, changeOrigin: true },
      "/api": { target: backendTarget, changeOrigin: true },
    },
  },
};
