<template>
  <div id="app">
    <transition name="page" mode="out-in">
      <router-view :key="$route.path" />
    </transition>
  </div>
</template>

<script>
export default {
  name: "app",
  components: {},
  beforeCreate() {
    this.$store.commit("setMiniInterface", window.innerWidth < 750);
    window.onresize = () => {
      this.$store.commit("setMiniInterface", window.innerWidth < 750);
    };
  },
  created() {
    // 初始化全局深色模式：优先本地保存，其次跟随系统
    let saved = localStorage.getItem("uiDarkMode");
    let dark;
    if (saved != null) {
      dark = saved === "1" || saved === "true";
    } else {
      dark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    this.$store.commit("setUiDarkMode", dark);
    this.applyTheme(dark);
  },
  watch: {
    "$store.state.uiDarkMode"(dark) {
      this.applyTheme(dark);
    },
  },
  methods: {
    applyTheme(dark) {
      document.documentElement.setAttribute(
        "data-theme",
        dark ? "dark" : "light"
      );
      localStorage.setItem("uiDarkMode", dark ? "1" : "0");
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", dark ? "#0e1014" : "#f4f5f7");
      }
      // 主题切换时为全局元素附加过渡，实现颜色平滑渐变
      const root = document.documentElement;
      root.classList.add("theme-transition");
      if (this._themeTimer) clearTimeout(this._themeTimer);
      this._themeTimer = setTimeout(() => {
        root.classList.remove("theme-transition");
      }, 400);
    },
  },
};
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-1);
  margin: 0;
  height: 100%;
  background: var(--bg);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 页面切换过渡动画 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.page-enter {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
