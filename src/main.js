import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import "./plugins/element.js";
import "./assets/styles/theme.css";
import store from "./plugins/vuex.js";
import "./plugins/md5.js";
import ajax from "./plugins/ajax";
import vuex from "./plugins/vuex";
import VueLazyload from "vue-lazyload";
import { getImageFromLegado } from "./plugins/utils";

Vue.config.productionTip = false;

/**
 * 全局异常兜底：
 * - Vue 渲染/生命周期异常统一记录，避免页面卡死或加载态无法关闭；
 * - 未处理的 Promise 异常统一记录，避免静默失败。
 */
Vue.config.errorHandler = function (err, vm, info) {
  console.error("[Vue error]", info, err);
  if (vm && vm.$message) {
    try {
      vm.$message.error("页面出现异常，请刷新后重试");
    } catch (e) {
      // 忽略错误提示自身的异常
    }
  }
};
window.addEventListener("unhandledrejection", function (event) {
  console.error("[Unhandled promise rejection]", event.reason);
});
new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");

/**
 * 图片懒加载全局配置
 */
Vue.use(VueLazyload, {
  preLoad: 1.3,
  error: require("./assets/imgs/noCover.jpeg"),
  loading: require("./assets/imgs/loading.gif"),
  attempt: 1,
  observer: true,
  filter: {
    replaceUnreachableImg(listener, _) {
      // 相对链接 | 显示带有urlOption的链接不可达 替换
      // 如果
      const { src } = listener;
      if (!/^http/.test(src) || /,\s*\{.*\}$/.test(src))
        listener.src = getImageFromLegado(src);
    },
  },
  adapter: {
    error({ src, el }) {
      // 部分图片需要带上源的headers或者解密才能正常显示
      el.src = getImageFromLegado(src);
    },
  },
});

/**
 * 加载配置
 */
ajax.get("/getReadConfig").then((res) => {
  var data = res.data.data;
  if (data) {
    var config = JSON.parse(data);
    var defaultConfig = store.state.config;
    config = Object.assign(defaultConfig, config);
    vuex.commit("setConfig", config);
  }

/**
 * 加载书架设置
 */
try {
  const savedBookshelfSettings = localStorage.getItem("bookshelfSettings");
  if (savedBookshelfSettings) {
    store.commit("setBookshelfSettings", JSON.parse(savedBookshelfSettings));
  }
} catch (e) {}
});

/**
 * 加载书架设置（本地持久化）
 */
try {
  const savedBookshelfSettings = localStorage.getItem("bookshelfSettings");
  if (savedBookshelfSettings) {
    store.commit("setBookshelfSettings", JSON.parse(savedBookshelfSettings));
  }
} catch (e) {}
