import axios from "axios";
// 统一使用相对路径：请求始终发往当前页面所在的源（origin）。
// - 生产环境：前端由阅读后端同源托管，相对路径直接命中后端；
// - 开发环境：由 vue.config.js 的 devServer.proxy 转发到后端（默认 192.168.1.38:1122），
//   避免硬编码 localhost 导致外部访问（手机/其他设备）连不上后端。
const ajax = axios.create({
  baseURL: "",
});
export default ajax;
