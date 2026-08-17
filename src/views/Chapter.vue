<template>
  <div
    class="chapter-wrapper"
    :style="bodyTheme"
    :class="{ night: isNight, day: !isNight, oled: isOled }"
    @click="handleTap"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchCancel"
      @contextmenu.prevent="openContextMenu($event)"
  >
    <div class="tool-bar" :style="leftBarTheme">
      <div class="tools">
        <el-popover
          :placement="popPlacement"
          :width="popupWidth"
          trigger="click"
          :visible-arrow="false"
          v-model="popCataVisible"
          popper-class="pop-cata"
        >
          <PopCata @getContent="getContent" ref="popCata" class="popup" />

          <div
            class="tool-icon"
            :class="{ 'no-point': noPoint }"
            slot="reference"
          >
            <div class="iconfont">&#58905;</div>
            <div class="icon-text">目录</div>
          </div>
        </el-popover>
        <el-popover
          :placement="popPlacement"
          :width="popupWidth"
          trigger="click"
          :visible-arrow="false"
          v-model="readSettingsVisible"
          popper-class="pop-setting"
        >
          <ReadSettings class="popup" />

          <div
            class="tool-icon"
            :class="{ 'no-point': noPoint }"
            slot="reference"
          >
            <div class="iconfont">&#58971;</div>
            <div class="icon-text">设置</div>
          </div>
        </el-popover>
        <div class="tool-icon" @click="toShelf">
          <div class="iconfont">&#58892;</div>
          <div class="icon-text">书架</div>
        </div>
        <div class="tool-icon" :class="{ 'no-point': noPoint }" @click="toTop">
          <div class="iconfont">&#58914;</div>
          <div class="icon-text">顶部</div>
        </div>
        <div
          class="tool-icon"
          :class="{ 'no-point': noPoint }"
          @click="toBottom"
        >
          <div class="iconfont">&#58915;</div>
          <div class="icon-text">底部</div>
        </div>
      </div>
    </div>
    <div class="read-bar" :style="rightBarTheme">
      <div class="tools">
        <div
          class="tool-icon"
          :class="{ 'no-point': noPoint }"
          @click="toPreChapter"
        >
          <div class="iconfont">&#58920;</div>
          <span v-if="$store.state.miniInterface">上一章</span>
        </div>
        <div
          class="tool-icon"
          :class="{ 'no-point': noPoint }"
          @click="toNextChapter"
        >
          <span v-if="$store.state.miniInterface">下一章</span>
          <div class="iconfont">&#58913;</div>
        </div>
      </div>
    </div>
    <div class="chapter-bar"></div>
    <div class="chapter" ref="content" :style="chapterTheme">
      <div class="content" :class="turnEffect">
        <div class="top-bar" ref="top"></div>
        <div v-for="data in chapterData" :key="data.index" ref="chapter">
          <div class="title" ref="title" :index="data.index" v-if="show">
            {{ data.title }}
          </div>
          <Pcontent :carray="data.content" />
        </div>
        <div class="loading" ref="loading"></div>
        <div class="bottom-bar" ref="bottom"></div>
      </div>
    </div>

      <!-- 阅读页右键菜单 -->
      <transition name="context-menu-fade">
        <div
          v-if="contextMenu.visible"
          class="context-menu-mask"
          @click.stop="closeContextMenu"
          @contextmenu.prevent.stop="closeContextMenu"
        >
          <div
            class="context-menu"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
            @click.stop
          >
            <div class="context-menu-item" @click="contextNextChapter">
              <i class="el-icon-bottom"></i>
              <span>下一章节</span>
            </div>
            <div class="context-menu-item" @click="contextBackToTitle">
              <i class="el-icon-sort-up"></i>
              <span>回到标题</span>
            </div>
            <div class="context-menu-item" @click="contextPreChapter">
              <i class="el-icon-top"></i>
              <span>上一章节</span>
            </div>
            <div class="context-menu-item" @click="contextToggleFullscreen">
              <i :class="isFullscreen ? 'el-icon-close' : 'el-icon-full-screen'"></i>
              <span>{{ isFullscreen ? '退出全屏' : '全屏阅读' }}</span>
            </div>
            <div class="context-menu-item" @click="contextShareParagraph">
              <i class="el-icon-share"></i>
              <span>分享段落</span>
            </div>
            <div class="context-menu-item" @click="contextBackToShelf">
              <i class="el-icon-back"></i>
              <span>返回书架</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- 分享段落弹窗 -->
      <el-dialog
        :visible.sync="shareVisible"
        title="分享段落"
        :width="$store.state.miniInterface ? '92%' : '520px'"
        :top="$store.state.miniInterface ? '8vh' : '12vh'"
        append-to-body
        custom-class="share-paragraph-dialog"
      >
        <textarea
          ref="shareTextarea"
          v-model="shareText"
          class="share-textarea"
          rows="10"
          readonly
        ></textarea>
        <span slot="footer">
          <el-button size="small" @click="shareVisible = false">关闭</el-button>
          <el-button size="small" type="primary" @click="copyShareText">复制</el-button>
        </span>
      </el-dialog>
  </div>
</template>

<script>
import PopCata from "../components/PopCatalog.vue";
import ReadSettings from "../components/ReadSettings.vue";
import Pcontent from "../components/Content.vue";
import jump from "../plugins/jump";
import config from "../plugins/config";
import ajax from "../plugins/ajax";

export default {
  components: {
    PopCata,
    Pcontent,
    ReadSettings,
  },
  created() {
    var config = JSON.parse(localStorage.getItem("config"));
    if (config != null) this.$store.commit("setConfig", config);
  },
  beforeCreate() {
    let config = JSON.parse(localStorage.getItem("config"));
    if (config != null) this.$store.commit("setConfig", config);
  },
  mounted() {
    this.syncBodyBackground();
      window.addEventListener("resize", this.handleResize);
      this.isFullscreen = this.getFullscreenState();
      document.addEventListener("fullscreenchange", this.handleFullscreenChange);
      document.addEventListener("webkitfullscreenchange", this.handleFullscreenChange);
      document.addEventListener("mozfullscreenchange", this.handleFullscreenChange);
      document.addEventListener("MSFullscreenChange", this.handleFullscreenChange);
    this.loading = this.$loading({
      target: this.$refs.content,
      lock: true,
      text: "正在获取内容",
      spinner: "el-icon-loading",
      background: "rgba(0,0,0,0)",
    });
    //获取书籍数据
    const that = this;
    let bookUrl = sessionStorage.getItem("bookUrl");
    let bookName = sessionStorage.getItem("bookName");
    let bookAuthor = sessionStorage.getItem("bookAuthor");
    let chapterIndex = Number(sessionStorage.getItem("chapterIndex") || 0);
    let chapterPos = Number(sessionStorage.getItem("chapterPos") || 0);
      let book = null;
      try {
    book = JSON.parse(localStorage.getItem(bookUrl));
      } catch (e) {
        book = null;
      }
    if (
      book == null ||
      chapterIndex != book.index ||
      chapterPos != book.chapterPos
    ) {
      book = {
        bookName: bookName,
        bookAuthor: bookAuthor,
        bookUrl: bookUrl,
        index: chapterIndex,
        chapterPos: chapterPos,
      };
      localStorage.setItem(bookUrl, JSON.stringify(book));
    }

    this.getCatalog(bookUrl).then(
      (res) => {
        let catalog = res.data && res.data.data;
          if (!res.data || !res.data.isSuccess || !Array.isArray(catalog) || catalog.length === 0) {
            that.closeLoading();
            that.$message.error("书籍目录为空，可能已被删除");
            that.clearInvalidReadingRecent(bookUrl);
            that.$router.replace("/").catch(() => {});
            return;
          }
        that.$store.commit("setReadingBook", book);
        that.$store.commit("setCatalog", catalog);
        var index = that.chapterIndex;
          if (!catalog[index]) {
            that.closeLoading();
            that.$message.error("阅读章节不存在，可能已被删除");
            that.clearInvalidReadingRecent(bookUrl);
            that.$router.replace("/").catch(() => {});
            return;
          }
        this.getContent(index, true, chapterPos);
        window.addEventListener("keyup", this.handleKeyPress);
        //监听底部加载
        this.scrollObserve = new IntersectionObserver(
          this.handleIScrollObserve,
          { rootMargin: "-100% 0% 20% 0%" }
        );
        this.enableInfiniteLoading &&
          this.scrollObserve.observe(this.$refs.loading);
        //监听当前阅读章节
        this.readingObserve = new IntersectionObserver(
          this.handleIReadingObserve
        );
        //第二次点击同一本书 页面标题不会变化
        document.title = null;
        document.title = bookName + " | " + catalog[index].title;
      },
      () => {
        that.loading.close();
        that.$message.error("获取书籍目录失败");
        that.clearInvalidReadingRecent(bookUrl);
          that.$router.replace("/").catch(() => {});
      }
    );
  },
  beforeRouteLeave(to, from, next) {
    this.computeChapterPos();
    this.saveReadingBookProgressToBrowser(this.chapterIndex);
    this.resetBodyBackground();
    next();
  },
  destroyed() {
    window.removeEventListener("keyup", this.handleKeyPress);
      window.removeEventListener("resize", this.handleResize);
      document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", this.handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", this.handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", this.handleFullscreenChange);
    this.readSettingsVisible = false;
    this.popCataVisible = false;
    this.scrollObserve?.disconnect();
    this.readingObserve?.disconnect();
    this.resetBodyBackground();
  },
  watch: {
    chapterData() {
      this.$store.commit("setContentLoading", false);
      //添加章节内容到observe
      this.addReadingObserve();
    },
    chapterIndex(index) {
      document.title =
        sessionStorage.getItem("bookName") + " | " + this.catalog[index].title;
      this.$store.dispatch("saveBookProcess");
    },
    theme() {
      // isNight / isOled 由计算属性根据 config.theme 自动更新
    },
    bodyColor(color) {
      this.syncBodyBackground(color);
    },
    chapterColor(color) {
      this.chapterTheme.background = color;
    },
    readWidth(width) {
      this.chapterTheme.width = width;
      let leftToolMargin = -((parseInt(width) + 130) / 2 + 74) + "px";
      let rightToolMargin = -((parseInt(width) + 130) / 2 + 58) + "px";
      this.leftBarTheme.marginLeft = leftToolMargin;
      this.rightBarTheme.marginRight = rightToolMargin;
    },
    popupColor(color) {
      this.leftBarTheme.background = color;
      this.rightBarTheme.background = color;
    },
    readSettingsVisible(visible) {
      /*
      if (!visible) {
        let configText = JSON.stringify(this.$store.state.config);
        localStorage.setItem("config", configText);
      }
      */
    },
    enableInfiniteLoading(enable) {
      if (!enable) {
        this.scrollObserve.disconnect();
      } else {
        this.scrollObserve.observe(this.$refs.loading);
      }
    },
  },
  data() {
    return {
      noPoint: true,
      showToolBar: false,
        windowWidth: window.innerWidth,
      chapterData: [],
      scrollObserve: null,
      readingObserve: null,
      touchStartX: 0,
      touchStartY: 0,
      touchStartTime: 0,
      touchTurned: false,
      touchBlocked: false,
      lastTurnTime: 0,
      lastPageTurnTime: 0,
      popoverWasOpen: false,
      turnDirection: "",
      turnEffect: "",
        contextMenu: {
          visible: false,
          x: 0,
          y: 0,
          paragraph: "",
        },
        shareVisible: false,
        shareText: "",
        isFullscreen: false,
    };
  },
  computed: {
    chapterIndex: {
      get() {
        return this.$store.state.readingBook.index || 0;
      },
      set(value) {
        this.$store.state.readingBook.index = value;
      },
    },
    chapterPos: {
      get() {
        return this.$store.state.readingBook.chapterPos || 0;
      },
      set(value) {
        this.$store.state.readingBook.chapterPos = value;
      },
    },
    catalog() {
      return this.$store.state.catalog;
    },
    windowHeight() {
      return window.innerHeight;
    },
    contentHeight() {
      return this.$refs.content.offsetHeight;
    },
    popCataVisible: {
      get() {
        return this.$store.state.popCataVisible;
      },
      set(value) {
        this.$store.commit("setPopCataVisible", value);
      },
    },
    readSettingsVisible: {
      get() {
        return this.$store.state.readSettingsVisible;
      },
      set(value) {
        this.$store.commit("setReadSettingsVisible", value);
      },
    },
    config() {
      return this.$store.state.config;
    },
    theme() {
      return this.config.theme;
    },
    bodyColor() {
      return (config.themes[this.config.theme] || {}).body;
    },
    chapterColor() {
      return (config.themes[this.config.theme] || {}).content;
    },
    popupColor() {
      return (config.themes[this.config.theme] || {}).popup;
    },
    isNight() {
      const t = this.$store.state.config.theme;
      return t == 6 || t == 7;
    },
    isOled() {
      return this.$store.state.config.theme == 7;
    },
      chapterWidthValue() {
        const cfg = this.$store.state.config.readWidth;
        const w = this.windowWidth;
        if (this.$store.state.miniInterface) return w;
        // 窗口宽度足以容纳配置宽度与两侧工具条时，使用配置宽度
        if (w >= cfg + 148) return cfg - 130;
        // 否则自适应：为两侧工具条预留 278px，保证菜单完整可见且不挤压正文
        return Math.max(320, w - 278);
      },
    readWidth() {
      if (!this.$store.state.miniInterface) {
        return this.chapterWidthValue + "px";
      } else {
        return this.windowWidth + "px";
      }
    },
    popupWidth() {
      if (!this.$store.state.miniInterface) {
        const cfg = this.$store.state.config.readWidth;
            const w = this.windowWidth;
            if (w >= cfg) return cfg - 33;
          return Math.min(Math.max(320, w - 66), w - 24);
      } else {
        return this.windowWidth - 33;
      }
    },
    popPlacement() {
      // 桌面端弹层在左侧工具条右侧；移动端工具条在顶部，弹层应向下展开
      return this.$store.state.miniInterface ? "bottom-start" : "right";
    },
    bodyTheme() {
      const theme = config.themes[this.$store.state.config.theme] || {};
      const menu = theme.menu || {};
      return {
        background: theme.body,
        "--read-popup": theme.popup || "#ffffff",
        "--read-icon": menu.icon || "#000000",
        "--read-sub-text": menu.subText || "rgba(0, 0, 0, 0.4)",
        "--read-chapter-text": menu.chapterText || "#262626",
        "--read-border": menu.border || "rgba(0, 0, 0, 0.1)",
        "--read-chapter-border": menu.chapterBorder || "#d8d8d8",
        "--read-arrow": menu.arrow || "#ede7da",
        "--read-shadow": menu.shadow ||
          "0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04)",
      };
    },
    chapterTheme() {
      return {
        background: (config.themes[this.$store.state.config.theme] || {}).content,
        width: this.readWidth,
        color: this.$store.state.config.fontColor || null,
      };
    },
    leftBarTheme() {
      const hidden = this.$store.state.miniInterface && !this.showToolBar;
      return {
        background: config.themes[this.$store.state.config.theme].popup,
        marginLeft: this.$store.state.miniInterface
          ? 0
          : -((this.chapterWidthValue + 130) / 2 + 74) + "px",
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(-110%)" : "translateY(0)",
        pointerEvents: hidden ? "none" : "auto",
      };
    },
    rightBarTheme() {
      const hidden = this.$store.state.miniInterface && !this.showToolBar;
      return {
        background: config.themes[this.$store.state.config.theme].popup,
        marginRight: this.$store.state.miniInterface
          ? 0
          : -((this.chapterWidthValue + 130) / 2 + 58) + "px",
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(110%)" : "translateY(0)",
        pointerEvents: hidden ? "none" : "auto",
      };
    },
    show() {
      return this.$store.state.showContent;
    },
    enableInfiniteLoading() {
      return this.$store.state.config.infiniteLoading;
    },
  },
  methods: {
      handleResize() {
        this.windowWidth = window.innerWidth;
      },
      closeLoading() {
        if (this.loading) {
          this.loading.close();
        }
      },
      clearInvalidReadingRecent(bookUrl) {
        try {
          const recent = JSON.parse(localStorage.getItem("readingRecent"));
          if (recent && recent.url === bookUrl) {
            localStorage.removeItem("readingRecent");
          }
        } catch (e) {
          localStorage.removeItem("readingRecent");
        }
      },
    getCatalog(bookUrl) {
      return ajax.get("/getChapterList?url=" + encodeURIComponent(bookUrl));
    },
    getContent(index, reloadChapter = true, chapterPos = 0) {
      if (reloadChapter) {
        //展示进度条
        this.$store.commit("setShowContent", false);
        if (!this.loading || !this.loading.visible) {
          this.loading = this.$loading({
            target: this.$refs.content,
            lock: true,
            text: "正在获取内容",
            spinner: "el-icon-loading",
            background: "rgba(0,0,0,0)",
          });
        }
        //强制滚回顶层
        jump(this.$refs.top, { duration: 0 });
        //从目录，按钮切换章节时保存进度 预加载时不保存
        this.saveReadingBookProgressToBrowser(index, chapterPos);
      }
      let bookUrl = sessionStorage.getItem("bookUrl");
      const chapter = this.catalog[index];
        if (!chapter) {
          this.closeLoading();
          this.$store.commit("setShowContent", true);
          this.$message.error("章节不存在，书籍可能已被删除");
          return;
        }
        let title = chapter.title;
      let chapterIndex = chapter.index;
      let that = this;
      ajax
        .get(
          "/getBookContent?url=" +
            encodeURIComponent(bookUrl) +
            "&index=" +
            chapterIndex
        )
        .then(
          (res) => {
            if (res.data.isSuccess) {
              let data = res.data.data || "";
              let content = data.split(/\n+/);
              that.updateChapterData({ index, content, title }, reloadChapter);
              //跳到合适位置
              this.toChapterPos(chapterPos);
            } else {
              that.$message.error(res.data.errorMsg || "书源正文解析错误！");
              let content = ["书源正文解析失败！"];
              that.updateChapterData({ index, content, title }, reloadChapter);
            }
            that.$store.commit("setContentLoading", true);
            that.loading.close();
            that.noPoint = false;
            that.$store.commit("setShowContent", true);
            that.applyTurnEffect();
            if (!res.data.isSuccess) {
                console.warn("书源正文解析失败，已用兜底内容替换");
              
            }
          },
          () => {
            that.$message.error("获取章节内容失败");
            let content = ["获取章节内容失败！"];
            that.updateChapterData({ index, content, title }, reloadChapter);
            that.loading.close();
            that.$store.commit("setShowContent", true);
              that.noPoint = false;
            that.clearInvalidReadingRecent(bookUrl);
          that.$router.replace("/").catch(() => {});
          }
        );
    },
    toChapterPos(chapterPos) {
      if (!chapterPos) return;
        if (!this.chapterData[0] || !this.chapterData[0].content) return;
      this.$nextTick(() => {
        //计算chapterPos对应的段落行数
        let wordCount = 0;
        let that = this;
        let index = this.chapterData[0].content.findIndex((paragraph) => {
          wordCount += paragraph.length;
          return wordCount >= this.chapterPos;
        });
        if (index == -1) index = this.chapterData[0].content.length - 1;
        if (index == 0) return; //第一行不跳转
        //跳转
        jump(this.$refs.chapter[0].children[1].children[index], {
          duration: 0,
          callback: () => (that.chapterPos = 0),
        });
      });
    },
    //计算当前章节阅读的字数
    computeChapterPos() {
      //dom没渲染时 返回0
      if (!this.$refs.chapter[0]) return 0;
      //计算当前阅读进度对应的element
      let index = this.chapterData.findIndex(
        (chapter) => chapter.index == this.chapterIndex
      );
      if (index == -1) return;
      let element = this.$refs.chapter[index].children[1].children;
      //计算已读字数
      let chapterPos = 0;
      for (let paragraph of element) {
        let text = paragraph.innerText;
        chapterPos += text.length;
        if (paragraph.getBoundingClientRect().top >= 0) {
          this.chapterPos = chapterPos;
          break;
        }
      }
    },
    toTop() {
      jump(this.$refs.top);
    },
    toBottom() {
      jump(this.$refs.bottom);
    },
    toNextChapter() {
      this.$store.commit("setContentLoading", true);
      let index = this.chapterIndex + 1;
      if (typeof this.catalog[index] !== "undefined") {
        this.turnDirection = "next";
        this.getContent(index);
      } else {
        this.$message.error("本章是最后一章");
      }
    },
    toPreChapter() {
      this.$store.commit("setContentLoading", true);
      let index = this.chapterIndex - 1;
      if (typeof this.catalog[index] !== "undefined") {
        this.turnDirection = "prev";
        this.getContent(index);
      } else {
        this.$message.error("本章是第一章");
      }
    },
      openContextMenu(event) {
        if (!event) return;
        const menuWidth = 180;
        const menuHeight = 272;
        const paragraph = this.getParagraphText(event);
        this.contextMenu = {
          visible: true,
          x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth)),
          y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight)),
          paragraph,
        };
      },
      closeContextMenu() {
        this.contextMenu.visible = false;
        this.contextMenu.paragraph = "";
      },
      getParagraphText(event) {
        const target = event.target;
        if (target && target.closest) {
          const paragraphEl = target.closest(".content p");
          if (paragraphEl) return paragraphEl.innerText.trim();
        }
        return (window.getSelection && window.getSelection().toString() || "").trim();
      },
      contextNextChapter() {
        this.closeContextMenu();
        this.toNextChapter();
      },
      contextBackToTitle() {
        this.closeContextMenu();
        this.toCurrentChapterTitle();
      },
      contextPreChapter() {
        this.closeContextMenu();
        this.toPreChapter();
      },
      contextToggleFullscreen() {
        this.closeContextMenu();
        this.toggleFullscreen();
      },
      contextShareParagraph() {
        const paragraph = this.contextMenu.paragraph;
        this.closeContextMenu();
        if (!paragraph) {
          this.$message.warning("请右键点击段落后再分享");
          return;
        }
        this.shareText = paragraph;
        this.shareVisible = true;
        this.$nextTick(() => {
          const textarea = this.$refs.shareTextarea;
          if (textarea) {
            textarea.focus();
            textarea.select();
          }
        });
      },
      contextBackToShelf() {
        this.closeContextMenu();
        this.toShelf();
      },
      toCurrentChapterTitle() {
        const refs = this.$refs.title;
        const titles = Array.isArray(refs) ? refs : [refs];
        const titleEl = titles.find(
          (el) =>
            el && parseInt(el.getAttribute("index"), 10) === this.chapterIndex
        );
        if (titleEl) {
          jump(titleEl, { duration: 300 });
        } else {
          this.$message.warning("当前章节标题暂不可用");
        }
      },
      toggleFullscreen() {
        const doc = document;
        const isFullscreen =
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement;
        if (isFullscreen) {
          const exitFn =
            doc.exitFullscreen ||
            doc.webkitExitFullscreen ||
            doc.mozCancelFullScreen ||
            doc.msExitFullscreen;
          if (exitFn) {
            try {
              const ret = exitFn.call(doc);
              if (ret && ret.catch) ret.catch(() => {});
            } catch (e) {}
          }
        } else {
          const el = doc.documentElement;
          const requestFn =
            el.requestFullscreen ||
            el.webkitRequestFullscreen ||
            el.mozRequestFullScreen ||
            el.msRequestFullscreen;
          if (requestFn) {
            try {
              const ret = requestFn.call(el);
              if (ret && ret.catch) ret.catch(() => {});
            } catch (e) {}
          } else {
            this.$message.warning("当前浏览器不支持全屏，请使用浏览器快捷键");
          }
        }
      },
      handleFullscreenChange() {
        this.isFullscreen = this.getFullscreenState();
      },
      getFullscreenState() {
        const doc = document;
        return !!(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        );
      },
      copyShareText() {
        const text = this.shareText;
        if (!text) return;
        const done = () => this.$message.success("已复制到剪贴板");
        const fallback = () => {
          const textarea = this.$refs.shareTextarea;
          if (!textarea) return false;
          textarea.focus();
          textarea.select();
          try {
            return document.execCommand("copy");
          } catch (e) {
            return false;
          }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(text)
            .then(done)
            .catch(() => {
              fallback() ? done() : this.$message.warning("复制失败，请手动全选复制");
            });
        } else if (fallback()) {
          done();
        } else {
          this.$message.warning("复制失败，请手动全选复制");
        }
      },
    saveReadingBookProgressToBrowser(index, chapterPos = this.chapterPos) {
      //保存localStorage
      let bookUrl = sessionStorage.getItem("bookUrl");
      let book = null;
        try {
          book = JSON.parse(localStorage.getItem(bookUrl));
        } catch (e) {
          book = null;
        }
        if (!book || typeof book !== "object") {
          book = {
            bookUrl: bookUrl,
            bookName: sessionStorage.getItem("bookName"),
            bookAuthor: sessionStorage.getItem("bookAuthor"),
          };
        }
      book.index = index;
      book.chapterPos = chapterPos;
      localStorage.setItem(bookUrl, JSON.stringify(book));
      //最近阅读
      let recent = null;
        try {
          recent = JSON.parse(localStorage.getItem("readingRecent"));
        } catch (e) {
          recent = null;
        }
        if (!recent || typeof recent !== "object") {
          recent = {
            name: sessionStorage.getItem("bookName"),
            author: sessionStorage.getItem("bookAuthor"),
            url: bookUrl,
          };
        }
        recent.chapterIndex = index;
        recent.chapterPos = chapterPos;
        localStorage.setItem("readingRecent", JSON.stringify(recent));
      // 旧字段已由上方 recent 写入
      book.chapterPos = chapterPos;
      // localStorage.setItem("readingRecent", JSON.stringify(book));
      //保存vuex
      this.chapterIndex = index;
      this.chapterPos = chapterPos;
      //保存sessionStorage
      sessionStorage.setItem("chapterIndex", index);
      sessionStorage.setItem("chapterPos", chapterPos);
    },
    updateChapterData(data, reloadChapter) {
      if (reloadChapter) {
        this.chapterData.splice(0);
      }
      this.chapterData.push(data);
    },
    loadMore() {
      let index = this.chapterData.slice(-1)[0].index;
      if (this.catalog.length - 1 > index) {
        this.getContent(index + 1, false);
      }
    },
    toShelf() {
      this.$router.push("/");
    },
    // 移动端点击：左右 1/3 区域为「上一页/下一页」（滚动一屏），中间为显示/隐藏工具条
    handleTap(event) {
      // 刚发生过滑动翻页时，忽略随后的 click，避免重复翻页
      if (Date.now() - this.lastTurnTime < 400) return;
      // 设置/目录弹层打开时，点击空白只负责关闭弹层（由 clickoutside 关闭），不再翻页/切工具条
      if (this.popoverWasOpen) {
        this.popoverWasOpen = false;
        return;
      }
      // 点击工具条、按钮、弹窗等交互元素时不做翻页/隐藏处理
      if (
        event.target.closest &&
        event.target.closest(
          ".tool-bar, .read-bar, .el-popover, .el-popper, .el-message, .el-button"
        )
      ) {
        return;
      }
      if (!this.$store.state.miniInterface) {
        this.showToolBar = !this.showToolBar;
        return;
      }
      // 快速连点防抖，避免多次滚动叠加造成屏幕上下来回跳动
      const now = Date.now();
      if (now - this.lastPageTurnTime < 350) return;
      const x =
        event.clientX ||
        (event.changedTouches &&
          event.changedTouches[0] &&
          event.changedTouches[0].clientX);
      const w = this.windowWidth;
      // 一屏高度（保留 100px 重叠，便于衔接阅读）
      const step = window.innerHeight - 100;
      if (x < w * 0.3) {
        // 点击左侧：上一页（向上滚动一屏）
        this.doPageTurn(0 - step, "up");
      } else if (x > w * 0.7) {
        // 点击右侧：下一页（向下滚动一屏）
        this.doPageTurn(step, "down");
      } else {
        // 点击中间：显示/隐藏工具条
        this.showToolBar = !this.showToolBar;
      }
    },
    handleTouchStart(event) {
      const t = event.changedTouches && event.changedTouches[0];
      if (!t) return;
      this.touchStartX = t.clientX;
      this.touchStartY = t.clientY;
      this.touchStartTime = Date.now();
      this.touchTurned = false;
      // 记录触摸开始时是否有弹层打开（用于「点击空白只关闭弹层」）
      this.popoverWasOpen = !!(
        this.$store.state.readSettingsVisible ||
        this.$store.state.popCataVisible
      );
      this.touchBlocked = !!(
        event.target.closest &&
        event.target.closest(
          ".tool-bar, .read-bar, .el-popover, .el-popper, .el-message"
        )
      );
    },
    handleTouchMove(event) {
      if (this.touchTurned || this.touchBlocked) return;
      const t = event.touches && event.touches[0];
      if (!t) return;
      const dx = t.clientX - this.touchStartX;
      const dy = t.clientY - this.touchStartY;
      // 左右滑动 = 切换上一章/下一章；水平位移明显大于垂直位移时才触发，避免与纵向滚动冲突
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        this.touchTurned = true;
        this.lastTurnTime = Date.now();
        if (dx < 0) {
          this.toNextChapter();
        } else {
          this.toPreChapter();
        }
      }
    },
    handleTouchEnd() {
      this.touchTurned = false;
      this.touchBlocked = false;
    },
    handleTouchCancel() {
      this.touchTurned = false;
      this.touchBlocked = false;
    },
    // 翻页动画：根据配置的翻页模式与方向，给正文附加对应的过渡动画
    applyTurnEffect() {
      const mode = this.$store.state.config.pageTurnMode || "slide";
      const dir = this.turnDirection;
      this.turnDirection = "";
      if (!dir || mode === "none") {
        this.turnEffect = "";
        return;
      }
      let effect;
      if (mode === "fade") {
        effect = "turn-fade";
      } else if (mode === "cover") {
        effect = dir === "next" ? "turn-cover-next" : "turn-cover-prev";
      } else {
        effect = dir === "next" ? "turn-slide-next" : "turn-slide-prev";
      }
      // 先清空再于下一帧赋值，确保动画可被重复触发
      this.turnEffect = "";
      this.$nextTick(() => {
        this.turnEffect = effect;
      });
    },
    // 点击「下一页/上一页」：滚动一屏并播放配置的翻页动画
    doPageTurn(delta, direction) {
      this.lastPageTurnTime = Date.now();
      const mode = this.$store.state.config.pageTurnMode || "slide";
      if (mode === "none") {
        window.scrollBy(0, delta);
        return;
      }
      let effect;
      if (mode === "fade") {
        effect = "turn-fade";
        window.scrollBy(0, delta);
      } else if (mode === "cover") {
        effect = direction === "down" ? "turn-page-cover-down" : "turn-page-cover-up";
        jump(delta, { duration: 220 });
      } else {
        effect = direction === "down" ? "turn-page-down" : "turn-page-up";
        jump(delta, { duration: 300 });
      }
      this.turnEffect = "";
      this.$nextTick(() => {
        this.turnEffect = effect;
      });
    },
    // 让 html/body 的背景跟随阅读主题，避免纯黑/深色主题下 iOS 橡皮筋回弹漏出全局浅色背景
    syncBodyBackground(bg) {
      const background = bg || this.bodyColor;
      document.body.style.background = background;
      document.documentElement.style.background = background;
    },
    resetBodyBackground() {
      document.body.style.background = "";
      document.documentElement.style.background = "";
    },
    //监听方向键
    handleKeyPress(event) {
      switch (event.key) {
        case "ArrowLeft":
          event.stopPropagation();
          event.preventDefault();
          this.toPreChapter();
          break;
        case "ArrowRight":
          event.stopPropagation();
          event.preventDefault();
          this.toNextChapter();
          break;
        case "ArrowUp":
          event.stopPropagation();
          event.preventDefault();
          if (document.documentElement.scrollTop === 0) {
            this.$message.warning("已到达页面顶部");
          } else {
            jump(0 - document.documentElement.clientHeight + 100);
          }
          break;
        case "ArrowDown":
          event.stopPropagation();
          event.preventDefault();
          if (
            document.documentElement.clientHeight +
              document.documentElement.scrollTop ===
            document.documentElement.scrollHeight
          ) {
            this.$message.warning("已到达页面底部");
          } else {
            jump(document.documentElement.clientHeight - 100);
          }
          break;
      }
    },
    //IntersectionObserver回调 底部加载
    handleIScrollObserve(entries) {
      if (this.loading && this.loading.visible) return;
      for (let { isIntersecting } of entries) {
        if (!isIntersecting) return;
        this.loadMore();
      }
    },
    //IntersectionObserver回调 当前阅读章节序号
    handleIReadingObserve(entries) {
      this.$nextTick(() => {
        for (let { isIntersecting, target, boundingClientRect } of entries) {
          let titleElement = target.querySelector(".title");
          if (!titleElement) return;
          let chapterTitleIndex = parseInt(titleElement.getAttribute("index"));
          if (isIntersecting) {
            this.chapterIndex = chapterTitleIndex;
          } else {
            if (boundingClientRect.top < 0) {
              this.chapterIndex = chapterTitleIndex + 1;
            } else {
              this.chapterIndex = chapterTitleIndex - 1;
            }
          }
        }
      });
    },
    //添加所有章节到observe
    addReadingObserve() {
      this.$nextTick(() => {
        let chapterElements = this.$refs.chapter;
        if (!chapterElements) return;
        chapterElements.forEach((el) => this.readingObserve.observe(el));
      });
    },
  },
};
</script>

<style lang="stylus" scoped>
>>> .pop-setting {
  margin-left: 68px;
  top: 0;
}

>>> .pop-cata {
  margin-left: 10px;
}

>>> .pop-setting,
>>> .pop-cata {
  background: var(--read-popup, #ffffff);
  border-color: var(--read-border, #ebeef5);
  color: var(--read-chapter-text, #262626);
}

@media screen and (max-width: 750px) {
  >>> .pop-setting,
  >>> .pop-cata {
    margin-left: 0 !important;
    top: auto !important;
  }
}

.chapter-wrapper {
  padding: 0 4%;
  flex-direction: column;
  align-items: center;
  touch-action: pan-y;

  >>> .no-point {
    pointer-events: none;
  }

  .tool-bar {
    position: fixed;
    top: 0;
    left: 50%;
    z-index: 100;
    transition: opacity 0.25s ease, transform 0.25s ease;

    .tools {
      display: flex;
      flex-direction: column;

      .tool-icon {
        font-size: 18px;
        width: 58px;
        height: 48px;
        text-align: center;
        padding-top: 12px;
        cursor: pointer;
        outline: none;

        .iconfont {
          font-family: iconfont;
          width: 16px;
          height: 16px;
          font-size: 16px;
          margin: 0 auto 6px;
        }

        .icon-text {
          font-size: 12px;
        }
      }
    }
  }

  .read-bar {
    position: fixed;
    bottom: 0;
    right: 50%;
    z-index: 100;
    transition: opacity 0.25s ease, transform 0.25s ease;

    .tools {
      display: flex;
      flex-direction: column;

      .tool-icon {
        font-size: 18px;
        width: 42px;
        height: 31px;
        padding-top: 12px;
        text-align: center;
        align-items: center;
        cursor: pointer;
        outline: none;
        margin-top: -1px;

        .iconfont {
          font-family: iconfont;
          width: 16px;
          height: 16px;
          font-size: 16px;
          margin: 0 auto 6px;
        }
      }
    }
  }

  .chapter-bar {
    .el-breadcrumb {
      .item {
        font-size: 14px;
        color: #606266;
      }
    }
  }

  .chapter {
    font-family: 'Microsoft YaHei', PingFangSC-Regular, HelveticaNeue-Light, 'Helvetica Neue Light', sans-serif;
    text-align: left;
    padding: 0 65px;
    min-height: 100vh;
    width: 670px;
    margin: 0 auto;
    overflow: hidden;

    >>> .el-icon-loading {
      font-size: 36px;
      color: #B5B5B5;
    }

    >>> .el-loading-text {
      font-weight: 500;
      color: #B5B5B5;
    }

    .content {
      font-size: 18px;
      line-height: 1.8;
      overflow: hidden;
      user-select: none;
        
                
      -webkit-user-select: none;
      font-family: 'Microsoft YaHei', PingFangSC-Regular, HelveticaNeue-Light, 'Helvetica Neue Light', sans-serif;

      .title {
        margin-bottom: 57px;
        font: 24px / 32px PingFangSC-Regular, HelveticaNeue-Light, 'Helvetica Neue Light', 'Microsoft YaHei', sans-serif;
      }

      .bottom-bar, .top-bar {
        height: 64px;
      }
    }
  }
}

.context-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: transparent;
}

.context-menu {
  position: fixed;
  min-width: 176px;
  padding: 6px;
  background: var(--read-popup, #ffffff);
  border: 1px solid var(--read-border, #ebeef5);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--read-chapter-text, #262626);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;

  i {
    font-size: 15px;
    color: var(--read-sub-text, rgba(0, 0, 0, 0.45));
    transition: color 0.15s ease;
  }

  &:hover {
    background: rgba(64, 158, 255, 0.1);
    color: #409eff;

    i {
      color: #409eff;
    }
  }
}

.context-menu-fade-enter-active,
.context-menu-fade-leave-active {
  transition: opacity 0.12s ease;
}

.context-menu-fade-enter,
.context-menu-fade-leave-to {
  opacity: 0;
}

.chapter-wrapper .chapter .content {
  cursor: default;
}

.chapter-wrapper .chapter .content .loading {
  height: 20px;
  pointer-events: none;
}

.day {
  >>> .popup {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  }

  >>> .tool-icon {
    border: 1px solid rgba(0, 0, 0, 0.1);
    margin-top: -1px;
    color: #000;

    .icon-text {
      color: rgba(0, 0, 0, 0.4);
    }
  }

  >>> .chapter {
    border: 1px solid #d8d8d8;
    color: #262626;
  }
}

.night {
  >>> .popup {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.48), 0 0 6px rgba(0, 0, 0, 0.16);
  }

  >>> .tool-icon {
    border: 1px solid #444;
    margin-top: -1px;
    color: #666;

    .icon-text {
      color: #666;
    }
  }

  >>> .chapter {
    border: 1px solid #444;
    color: #666;
  }

  >>> .popper__arrow {
    background: #666;
  }
}

/* OLED 纯黑主题：100% 纯黑背景 + 更柔和的灰白文字，减轻 OLED 屏幕烧屏与眩光 */
.oled {
  >>> .popup {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.7), 0 0 6px rgba(0, 0, 0, 0.3);
  }

  >>> .tool-icon {
    border: 1px solid #1c1c1c;
    margin-top: -1px;
    color: #8a8f99;

    .icon-text {
      color: #6f7480;
    }
  }

  >>> .chapter {
    border: 1px solid #000000;
    color: #a2a9b4;
  }

  >>> .popper__arrow {
    background: #101014;
  }
}

/* ---------- 翻页动画（可配置：滑动 / 覆盖 / 淡入 / 无） ---------- */
.content {
  &.turn-slide-next { animation: turn-slide-next 0.3s ease; }
  &.turn-slide-prev { animation: turn-slide-prev 0.3s ease; }
  &.turn-cover-next { animation: turn-cover-next 0.32s ease; }
  &.turn-cover-prev { animation: turn-cover-prev 0.32s ease; }
  &.turn-fade { animation: turn-fade 0.3s ease; }

  /* 点击「下一页/上一页」的纵向翻页动画 */
  &.turn-page-down { animation: turn-page-down 0.3s ease; }
  &.turn-page-up { animation: turn-page-up 0.3s ease; }
  &.turn-page-cover-down { animation: turn-page-cover-down 0.32s ease; }
  &.turn-page-cover-up { animation: turn-page-cover-up 0.32s ease; }
}

@keyframes turn-slide-next {
  from { transform: translateX(48px); opacity: 0.3; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes turn-slide-prev {
  from { transform: translateX(-48px); opacity: 0.3; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes turn-cover-next {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes turn-cover-prev {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
@keyframes turn-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes turn-page-down {
  from { transform: translateY(40px); opacity: 0.35; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes turn-page-up {
  from { transform: translateY(-40px); opacity: 0.35; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes turn-page-cover-down {
  from { transform: translateY(60%); }
  to { transform: translateY(0); }
}
@keyframes turn-page-cover-up {
  from { transform: translateY(-60%); }
  to { transform: translateY(0); }
}

@media screen and (max-width: 750px) {
  .chapter-wrapper {
    padding: 0;

    .tool-bar {
      left: 0;
      width: 100vw;
      margin-left: 0 !important;
      top: 0;
      padding-top: calc(var(--safe-top) + 8px);
      padding-bottom: 4px;

      .tools {
        flex-direction: row;
        padding: 0 4px;

        .tool-icon {
          border: none;
          width: auto;
          flex: 1;
          height: 46px;
          padding-top: 10px;
          margin-top: 0;
          box-sizing: border-box;
        }

        >>> .el-popover__reference-wrapper {
          flex: 1;
          display: flex;
        }
      }
    }

    .read-bar {
      right: 0;
      width: 100vw;
      margin-right: 0 !important;
      bottom: 0;
      padding-bottom: calc(var(--safe-bottom) + 6px);

      .tools {
        flex-direction: row;
        justify-content: space-between;
        padding: 0 15px;

        .tool-icon {
          border: none;
          width: auto;

          .iconfont {
            display: inline-block;
          }
        }
      }
    }

    .chapter {
      width: 100vw !important;
      padding: 0 20px calc(24px + var(--safe-bottom));
      box-sizing: border-box;

      .content {
        .top-bar {
          height: calc(64px + var(--safe-top));
        }
      }
    }
  }
}

/* ---------- 阅读页工具栏自适应优化 ---------- */
.chapter-wrapper .tool-bar .tools .tool-icon {
  width: 64px;
  height: 56px;
  border-radius: 10px;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.2;
}

.chapter-wrapper .tool-bar .tools .tool-icon .iconfont {
  width: 18px;
  height: 18px;
  font-size: 18px;
  margin: 0 auto 5px;
}

.chapter-wrapper .tool-bar .tools .tool-icon .icon-text {
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
}

.chapter-wrapper .read-bar .tools .tool-icon {
  width: 48px;
  height: 38px;
  border-radius: 8px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.chapter-wrapper .read-bar .tools .tool-icon .iconfont {
  width: 18px;
  height: 18px;
  font-size: 18px;
  margin: 0;
}

@media screen and (max-width: 750px) {
  .chapter-wrapper .tool-bar {
    padding-top: calc(var(--safe-top) + 6px);
  }

  .chapter-wrapper .tool-bar .tools {
    flex-direction: row;
    justify-content: space-between;
    padding: 0 6px;
    gap: 0;
  }

  .chapter-wrapper .tool-bar .tools .tool-icon {
    flex: 1 1 0;
    min-width: 0;
    width: auto;
    height: 52px;
    padding: 4px 0;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .chapter-wrapper .tool-bar .tools .tool-icon .iconfont {
    font-size: 18px;
    margin: 0 auto 4px;
  }

  .chapter-wrapper .tool-bar .tools .tool-icon .icon-text {
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
      font-weight: 500;
  }

  .chapter-wrapper .read-bar {
    padding-bottom: calc(var(--safe-bottom) + 6px);
  }

  .chapter-wrapper .read-bar .tools {
    flex-direction: row;
    justify-content: space-between;
    padding: 0 20px;
  }

  .chapter-wrapper .read-bar .tools .tool-icon {
    flex: 0 1 auto;
    width: auto;
    height: 42px;
    padding: 0 14px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 14px;
  }

  .chapter-wrapper .read-bar .tools .tool-icon .iconfont {
    display: inline-block;
    font-size: 18px;
    margin: 0;
  }
}

/* ---------- 阅读主题自适应：不同阅读主题对应的正文/菜单配色 ---------- */
.day {
  >>> .popup {
    box-shadow: var(--read-shadow, 0 2px 4px rgba(0, 0, 0, 0.12));
  }

  >>> .tool-icon {
    border: 1px solid var(--read-border, rgba(0, 0, 0, 0.1));
    color: var(--read-icon, #000);
  }

  >>> .tool-icon .icon-text {
    color: var(--read-sub-text, rgba(0, 0, 0, 0.4));
  }

  >>> .chapter {
    border: 1px solid var(--read-chapter-border, #d8d8d8);
    color: var(--read-chapter-text, #262626);
  }

  >>> .popper__arrow {
    background: var(--read-arrow, #ede7da);
  }
}

.night {
  >>> .popup {
    box-shadow: var(--read-shadow, 0 2px 4px rgba(0, 0, 0, 0.48));
  }

  >>> .tool-icon {
    border: 1px solid var(--read-border, #444);
    color: var(--read-icon, #666);
  }

  >>> .tool-icon .icon-text {
    color: var(--read-sub-text, #666);
  }

  >>> .chapter {
    border: 1px solid var(--read-chapter-border, #444);
    color: var(--read-chapter-text, #666);
  }

  >>> .popper__arrow {
    background: var(--read-arrow, #666);
  }
}

.oled {
  >>> .popup {
    box-shadow: var(--read-shadow, 0 2px 4px rgba(0, 0, 0, 0.7));
  }

  >>> .tool-icon {
    border: 1px solid var(--read-border, #1c1c1c);
    color: var(--read-icon, #8a8f99);
  }

  >>> .tool-icon .icon-text {
    color: var(--read-sub-text, #6f7480);
  }

  >>> .chapter {
    border: 1px solid var(--read-chapter-border, #000000);
    color: var(--read-chapter-text, #a2a9b4);
  }

  >>> .popper__arrow {
    background: var(--read-arrow, #101014);
  }
}

/* 移动端阅读页全宽显示，去掉正文左右边框，避免 OLED/深色主题下边缘出现明显线条 */
@media screen and (max-width: 750px) {
  .chapter-wrapper .chapter {
    border: none !important;
  }
}
</style>

<style lang="stylus">
/* 阅读页右键菜单与分享弹窗全局样式（dialog append-to-body 后 scoped 无法覆盖） */
.share-paragraph-dialog {
  border-radius: 12px;
  overflow: hidden;

  .el-dialog__header {
    padding: 16px 20px 10px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .el-dialog__body {
    padding: 16px 20px;
  }

  .el-dialog__footer {
    padding: 10px 20px 16px;
  }
}

.share-textarea {
  width: 100%;
  min-height: 260px;
  padding: 12px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  color: #303133;
  font-size: 14px;
  line-height: 1.8;
  resize: vertical;
  box-sizing: border-box;
  -webkit-user-select: text;
  user-select: text;
  cursor: text;
}
</style>
