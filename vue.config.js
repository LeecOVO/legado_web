// vue.config.js
// 后端（阅读 APP 的 Web 服务）地址：默认局域网 192.168.1.38:1122，可在 .env.development 中
// 通过 VUE_APP_BACKEND_TARGET 覆盖，例如 http://192.168.1.38:1122 或 http://localhost:1122
const backendTarget =
  process.env.VUE_APP_BACKEND_TARGET || "http://192.168.1.1:1122";

module.exports = {
  publicPath: "./",
  productionSourceMap: false,
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
