<template>
  <div class="index-wrapper" :style="shelfWrapperStyle">
    <aside class="navigation-wrapper">
      <div class="navigation-header">
        <div class="navigation-title-wrapper">
          <div class="navigation-title">阅读</div>
          <div class="navigation-sub-title">清风不识字，何故乱翻书</div>
        </div>
        <button
          class="theme-toggle"
          type="button"
          :title="uiDarkMode ? '切换到日间模式' : '切换到夜间模式'"
          @click="toggleDarkMode"
        >
          <i :class="uiDarkMode ? 'el-icon-sunny' : 'el-icon-moon'"></i>
        </button>
      </div>

      <div class="search-wrapper">
        <el-input
          size="mini"
          placeholder="搜索书架书籍"
          v-model="search"
          class="search-input"
        >
          <i slot="prefix" class="el-input__icon el-icon-search"></i>
        </el-input>
      </div>

      <div class="nav-body">
        <div class="nav-section">
          <div class="section-title">最近阅读</div>
          <el-tag
            :type="readingRecent.name == '尚无阅读记录' ? 'warning' : 'tip'"
            class="recent-book"
            @click="
              toDetail(
                readingRecent.url,
                readingRecent.name,
                readingRecent.author,
                readingRecent.chapterIndex,
                readingRecent.chapterPos
              )
            "
            :class="{ 'no-point': readingRecent.url == '' }"
          >
            {{ readingRecent.name }}
          </el-tag>
        </div>

        <div class="nav-section">
          <div class="section-title">基本设定</div>
          <div class="setting-row">
            <span class="status-dot" :class="connectType"></span>
            <el-tag
              :type="connectType"
              class="setting-connect"
              :class="{ 'no-point': newConnect }"
              @click="setIP"
            >
              {{ connectStatus }}
            </el-tag>
          </div>
        </div>

        <div class="nav-section">
          <div class="section-title">书籍管理</div>
          <el-tag
            type="info"
            class="setting-manage"
            @click="showBookManage = true"
          >
            书籍管理
          </el-tag>
        </div>
      </div>

      <div class="bottom-icons">
        <a
          href="https://github.com/LeecOVO/legado_web"
          target="_blank"
          rel="noopener noreferrer"
          :title="'GitHub: LeecOVO/legado_web'"
        >
          <div class="bottom-icon">
            <img :src="require('../assets/imgs/github.png')" alt="GitHub" />
          </div>
        </a>
          <button
            class="bottom-icon settings-icon"
            type="button"
            :title="'系统设置'"
            @click="showSystemSettings = true"
          >
            <i class="el-icon-setting"></i>
          </button>
            <el-tag
              :type="connectType"
              class="bottom-connect"
                :title="connectStatus"
              :class="{ 'no-point': newConnect }"
              @click="setIP"
            >
              {{ connectStatus }}
            </el-tag>
      </div>
    </aside>

    <div class="shelf-wrapper" ref="shelfWrapper">
      <div class="books-wrapper">
        <div class="wrapper">
          <div
            class="book"
            v-for="book in shelf"
            :key="book.noteUrl"
            :class="{ 'long-press': longPressActiveKey === book.noteUrl }"
            @click="
              toDetail(
                book.bookUrl,
                book.name,
                book.author,
                book.durChapterIndex,
                book.durChapterPos
              )
            "
            @touchstart="handleBookTouchStart(book)"
            @touchend="handleBookTouchEnd"
            @touchmove="handleBookTouchMove"
            @contextmenu.prevent="openContextMenu($event, book)"
          >
            <div class="cover-img">
              <img
                v-if="!book.coverUrl"
                :src="defaultCover"
                class="cover"
                alt=""
              />
              <img
                v-else
                class="cover"
                v-lazy="getCover(book.coverUrl)"
                :key="book.coverUrl"
                alt=""
              />
            </div>
            <div class="info">
              <div class="name">{{ book.name }}</div>
              <div class="sub">
                <div class="author">
                  {{ book.author }}
                </div>
                <div class="dot">•</div>
                <div class="size">共{{ book.totalChapterNum }}章</div>
                <div class="dot">•</div>
                <div class="date">{{ dateFormat(book.lastCheckTime) }}</div>
              </div>
              <div class="dur-chapter">已读：{{ book.durChapterTitle }}</div>
              <div class="last-chapter">
                最新：{{ book.latestChapterTitle }}
              </div>
            </div>
          </div>
        </div>
      </div>
        <button
          class="system-settings-fab" style="display: none"
          type="button"
          :title="'系统设置'"
          @click="showSystemSettings = true"
        >
          <i class="el-icon-setting"></i>
        </button>
    </div>

      <!-- 书籍右键菜单 -->
      <transition name="context-menu-fade">
        <div
          v-if="contextMenu.visible"
          class="context-menu-mask"
          @click="closeContextMenu"
          @contextmenu.prevent="closeContextMenu"
        >
          <div
            class="book-context-menu"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
            @click.stop
          >
            <div class="context-menu-item" @click="contextEditBook">
              <i class="el-icon-edit"></i>
              <span>编辑书籍</span>
            </div>
            <div class="context-menu-item danger" @click="contextDeleteBook">
              <i class="el-icon-delete"></i>
              <span>删除书籍</span>
            </div>
          </div>
        </div>
      </transition>

    <BookManage
      ref="bookManage"
      :visible.sync="showBookManage"
      @close="fetchBookShelfData"
      @saved="fetchBookShelfData"
    />
      <SystemSettings :visible.sync="showSystemSettings" />
  </div>
</template>

<script>
import "../assets/fonts/shelffont.css";
import ajax from "../plugins/ajax";
import BookManage from "../components/BookManage";
import SystemSettings from "../components/SystemSettings";
import noCover from "../assets/imgs/noCover.jpeg";

export default {
  components: { BookManage, SystemSettings },
  data() {
    return {
      search: "",
      showBookManage: false,
        showSystemSettings: false,
      longPressTimer: null,
      longPressFired: false,
      longPressBook: null,
      longPressActiveKey: "",
        contextMenu: {
          visible: false,
          x: 0,
          y: 0,
          book: null,
        },
        shelfLoaded: false,
      readingRecent: {
        name: "尚无阅读记录",
        author: "",
        url: "",
        chapterIndex: 0,
        chapterPos: 0,
      },
    };
  },
  mounted() {
    //获取最近阅读书籍
      try {
    let readingRecentStr = localStorage.getItem("readingRecent");
    if (readingRecentStr != null) {
      let recent = JSON.parse(readingRecentStr);
      if (recent && typeof recent.name !== "undefined" && typeof recent.url !== "undefined") {
        this.readingRecent = {
              name: recent.name,
              author: recent.author || "",
              url: recent.url,
              chapterIndex: Number(recent.chapterIndex) || 0,
              chapterPos: Number(recent.chapterPos) || 0,
            };
          } else {
            localStorage.removeItem("readingRecent");
      }
    }
      } catch (e) {
        localStorage.removeItem("readingRecent");
      }
    this.loading = this.$loading({
      target: this.$refs.shelfWrapper,
      lock: true,
      text: "正在获取书籍信息",
      spinner: "el-icon-loading",
      background: "var(--bg)",
    });
    this.$store
      .dispatch("saveBookProcess")
      .then(() => this.$store.commit("clearReadingBook"))
        .catch(() => {})
      .finally(() => this.fetchBookShelfData());
      this.applyBookshelfVisual();
  },
  methods: {
    setIP() {},
      applyBookshelfVisual() {
        if (this.$refs.shelfWrapper) {
          this.$refs.shelfWrapper.style.setProperty(
            "--book-gap",
            this.bookshelfSettings.bookSpacing + "px"
          );
        }
      },
    toggleDarkMode() {
      this.$store.commit("setUiDarkMode", !this.$store.state.uiDarkMode);
    },
    toDetail(bookUrl, bookName, bookAuthor, chapterIndex, chapterPos) {
      // 长按书籍打开编辑后，忽略随后的 click，避免误进入阅读页
      if (this.longPressFired) {
        this.longPressFired = false;
        return;
      }
        if (!bookUrl || !bookName) {
          this.$message.warning("书籍信息不完整，无法阅读");
          return;
        }
        if (
          this.shelfLoaded &&
            this.$store.state.shelf.length > 0 &&
          !this.$store.state.shelf.some((book) => book.bookUrl === bookUrl)
        ) {
          this.$message.warning("书籍已被删除，已清除最近阅读记录");
          this.clearReadingRecent();
          return;
        }
      sessionStorage.setItem("bookUrl", bookUrl);
      sessionStorage.setItem("bookName", bookName);
      sessionStorage.setItem("bookAuthor", bookAuthor);
      sessionStorage.setItem("chapterIndex", Number(chapterIndex) || 0);
      sessionStorage.setItem("chapterPos", Number(chapterPos) || 0);
      this.readingRecent = {
        name: bookName,
        author: bookAuthor,
        url: bookUrl,
        chapterIndex: Number(chapterIndex) || 0,
        chapterPos: Number(chapterPos) || 0,
      };
      localStorage.setItem("readingRecent", JSON.stringify(this.readingRecent));
      this.$router.push({
        path: "/chapter",
      });
    },
      clearReadingRecent() {
        this.readingRecent = {
          name: "尚无阅读记录",
          author: "",
          url: "",
          chapterIndex: 0,
          chapterPos: 0,
        };
        localStorage.removeItem("readingRecent");
      },
    // 移动端长按书籍卡片：打开书籍设置（编辑书名/作者/封面）
    handleBookTouchStart(book) {
      this.longPressFired = false;
      this.longPressBook = book;
      this.longPressActiveKey = "";
      this.longPressTimer = setTimeout(() => {
        this.longPressFired = true;
        this.longPressTimer = null;
        this.longPressActiveKey = book.noteUrl;
        // 触觉反馈：Android 支持 Vibration API；iOS Safari 无此接口，静默降级为动画
        if (navigator.vibrate) {
          try {
            navigator.vibrate(40);
          } catch (e) {}
        }
      }, 500);
    },
    handleBookTouchEnd() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      // 长按已触发：延迟到 click 之后打开编辑，避免释放时的 click 误关弹窗
      if (this.longPressFired) {
        const book = this.longPressBook;
        this.longPressBook = null;
        setTimeout(() => {
          this.longPressFired = false;
          this.longPressActiveKey = "";
          this.openBookEdit(book);
        }, 100);
      } else {
        this.longPressActiveKey = "";
      }
    },
    handleBookTouchMove() {
      // 移动视为滚动，取消长按
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      this.longPressActiveKey = "";
    },
      openContextMenu(e, book) {
          // 移动端长按会同时触发 touch 流程和 contextmenu，忽略触摸触发的右键菜单，保持原长按编辑体验
          if (this.longPressTimer || this.longPressFired) return;
        if (!book || !book.bookUrl) return;
        const menuWidth = 168;
        const menuHeight = 116;
        this.contextMenu = {
          visible: true,
          x: Math.max(8, Math.min(e.clientX, window.innerWidth - menuWidth)),
          y: Math.max(8, Math.min(e.clientY, window.innerHeight - menuHeight)),
          book,
        };
      },
      closeContextMenu() {
        this.contextMenu.visible = false;
        this.contextMenu.book = null;
      },
      contextEditBook() {
        const book = this.contextMenu.book;
        this.closeContextMenu();
        this.openBookEdit(book);
      },
      contextDeleteBook() {
        const book = this.contextMenu.book;
        this.closeContextMenu();
        this.deleteBook(book);
      },
      deleteBook(book) {
        if (!book || !book.bookUrl) return;
        this.$confirm(
          `确定要删除《${book.name}》吗？删除后可到回收站恢复。`,
          "确认删除",
          { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" }
        )
          .then(() => {
            ajax
              .delete(`/api/books?bookUrl=${encodeURIComponent(book.bookUrl)}`)
              .then((res) => {
                if (res.data.isSuccess) {
                  this.$message.success("已移入回收站");
                  this.$store.commit(
                    "addBooks",
                    this.$store.state.shelf.filter(
                      (b) => b.bookUrl !== book.bookUrl
                    )
                  );
                  if (this.readingRecent.url === book.bookUrl) {
                    this.clearReadingRecent();
                  }
                } else {
                  this.$message.error(res.data.errorMsg || "删除失败");
                }
              })
              .catch(() => {
                this.$message.error("删除失败");
              });
          })
          .catch(() => {});
      },
    openBookEdit(book) {
      if (this.$refs.bookManage && book && book.bookUrl) {
        this.$refs.bookManage.openEdit(book);
      }
    },
    dateFormat(t) {
      let time = new Date().getTime();
      let int = parseInt((time - t) / 1000);
      let str = "";
      Date.prototype.format = function (fmt) {
        var o = {
          "M+": this.getMonth() + 1, //月份
          "d+": this.getDate(), //日
          "h+": this.getHours(), //小时
          "m+": this.getMinutes(), //分
          "s+": this.getSeconds(), //秒
          "q+": Math.floor((this.getMonth() + 3) / 3), //季度
          S: this.getMilliseconds(), //毫秒
        };
        if (/(y+)/.test(fmt)) {
          fmt = fmt.replace(
            RegExp.$1,
            (this.getFullYear() + "").substr(4 - RegExp.$1.length)
          );
        }
        for (var k in o) {
          if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(
              RegExp.$1,
              RegExp.$1.length == 1
                ? o[k]
                : ("00" + o[k]).substr(("" + o[k]).length)
            );
          }
        }
        return fmt;
      };
      if (int <= 30) {
        str = "刚刚";
      } else if (int < 60) {
        str = int + "秒前";
      } else if (int < 3600) {
        str = parseInt(int / 60) + "分钟前";
      } else if (int < 86400) {
        str = parseInt(int / 3600) + "小时前";
      } else if (int < 2592000) {
        str = parseInt(int / 86400) + "天前";
      } else {
        str = new Date(t).format("yyyy-MM-dd");
      }
      return str;
    },
    getCover(coverUrl) {
      if (!coverUrl || coverUrl === '') {
        return noCover;
      }
      return /^data:/.test(coverUrl)
        ? coverUrl
        : (process.env.NODE_ENV !== "production" ? "" : "..") +
            "/cover?path=" +
            encodeURIComponent(coverUrl);
    },
    fetchBookShelfData() {
      const that = this;
      ajax
        .get("/getBookshelf", {
          timeout: 5000,
        })
        .then(function (response) {
          that.loading.close();
          that.$store.commit("setConnectType", "success");
          if (response.data.isSuccess) {
            that.$store.commit(
              "addBooks",
              (response.data.data || []).sort(function (a, b) {
                var x = a["durChapterTime"] || 0;
                var y = b["durChapterTime"] || 0;
                return y - x;
              })
            );
            const shelfData = response.data.data || [];
            if (
              that.readingRecent.url &&
              !shelfData.some((book) => book.bookUrl === that.readingRecent.url)
            ) {
              that.clearReadingRecent();
            }
          } else {
            that.$message.error(response.data.errorMsg || "获取书架数据失败");
          }
          that.$store.commit("setConnectStatus", "已连接");
          that.$store.commit("setNewConnect", false);
            that.shelfLoaded = true;
        })
        .catch(function () {
          that.loading.close();
          that.$store.commit("setConnectType", "danger");
          that.$store.commit("setConnectStatus", "连接失败");
          that.$message.error("后端连接失败");
          that.$store.commit("setNewConnect", false);
            that.shelfLoaded = true;
          
        });
    },
  },
    watch: {
      "bookshelfSettings.bookSpacing"() {
        this.applyBookshelfVisual();
      },
    },
  computed: {
    shelf() {
      let shelf = this.$store.state.shelf;
      return shelf.filter((book) => {
        if (this.search == "") return true;
        return (
          (book.name || "").includes(this.search) || (book.author || "").includes(this.search)
        );
      });
    },
      bookshelfSettings() {
        return this.$store.state.bookshelfSettings;
      },
      defaultCover() {
        if (
          this.bookshelfSettings.defaultCover === "custom" &&
          this.bookshelfSettings.customCoverUrl
        ) {
          return this.bookshelfSettings.customCoverUrl;
        }
        return noCover;
      },
      shelfWrapperStyle() {
        const bgMap = {
          default: "var(--bg)",
          paper: "linear-gradient(135deg, #f6efdc 0%, #eadfbd 100%)",
          green: "linear-gradient(135deg, #eaf4eb 0%, #d2e7d5 100%)",
          blue: "linear-gradient(135deg, #eaf2fd 0%, #d6e6fb 100%)",
          gray: "linear-gradient(135deg, #f2f3f5 0%, #e2e5ea 100%)",
          dark: "linear-gradient(135deg, #15181e 0%, #242933 100%)",
          custom: this.bookshelfSettings.shelfBackgroundColor || "var(--bg)",
        };
        return {
          "--book-gap": this.bookshelfSettings.bookSpacing + "px",
          background:
            bgMap[this.bookshelfSettings.shelfBackground] || "var(--bg)",
        };
      },
    connectStatus() {
      return this.$store.state.connectStatus;
    },
    connectType() {
      return this.$store.state.connectType;
    },
    newConnect() {
      return this.$store.state.newConnect;
    },
    showMenu() {
      return this.$store.state.miniInterface;
    },
    uiDarkMode() {
      return this.$store.state.uiDarkMode;
    },
  },
};
</script>

<style lang="stylus" scoped>
.index-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
  background: var(--bg);

  .navigation-wrapper {
    width: 280px;
    min-width: 280px;
    padding: 32px 28px 120px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: relative;

      @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
        background: var(--glass-bg);
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
        border-right: 1px solid var(--glass-border);
        box-shadow: var(--glass-shadow);
      }

    .navigation-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .navigation-title {
        font-size: 28px;
        font-weight: 600;
        font-family: FZZCYSK;
        color: var(--text-1);
        line-height: 1.2;
      }

      .navigation-sub-title {
        font-size: 13px;
        font-weight: 300;
        font-family: FZZCYSK;
        margin-top: 10px;
        color: var(--text-3);
      }

      .theme-toggle {
        flex: none;
        width: 38px;
        height: 38px;
        padding: 0;
        margin: 0;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--surface-2);
        color: var(--text-2);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.25s ease;
        outline: none;
        font-size: 18px;
        line-height: 1;
        font-family: inherit;

        i {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.4s ease;
        }

        &:hover {
          border-color: var(--accent);
          color: var(--accent);
          box-shadow: var(--shadow-sm);

          i { transform: rotate(20deg); }
        }

        &:active {
          transform: scale(0.92);
        }
      }
    }

    .search-wrapper {
      margin-top: 26px;

      .search-input {
        >>> .el-input__inner {
          border-radius: 50px;
          border-color: var(--border);
          background: var(--surface-2);
          color: var(--text-1);
          padding-left: 34px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        >>> .el-input__inner:focus {
          border-color: var(--accent);
        }

        >>> .el-input__inner::placeholder {
          color: var(--text-3);
        }

        >>> .el-input__icon {
          color: var(--text-3);
        }
      }
    }

    .nav-body {
      margin-top: 34px;
      flex: 1;

      .nav-section {
        .nav-section:nth-child(2) {
          display: none;
        }
        margin-bottom: 30px;

        .section-title {
          font-size: 12px;
          letter-spacing: 1px;
          color: var(--text-3);
          font-family: FZZCYSK;
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .recent-book {
          max-width: 100%;
          cursor: pointer;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .setting-row {
          display: flex;
          align-items: center;

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
            background: var(--text-3);
            flex: none;

            &.success { background: var(--success); }
            &.danger { background: var(--danger); }
            &.warning { background: var(--warning); }
          }
        }

        .setting-connect,
        .setting-manage {
          font-size: 12px;
          cursor: pointer;
        }
      }
        .nav-section:nth-child(2) {
          display: none;
        }
    }

    .bottom-icons {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 84px;
      display: flex;
      align-items: center;
      padding: 0 24px;
      border-top: 1px solid var(--glass-border, var(--border));
        gap: 12px;
        > a {
          flex: none;
          line-height: 0;
        }

      .bottom-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--surface-2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        border: 1px solid var(--border);
            flex: none;
            box-shadow: var(--shadow-sm);
          padding: 0;
          margin: 0;
          cursor: pointer;
          outline: none;
          font-family: inherit;

          i {
            font-size: 18px;
            color: var(--text-2);
            transition: color 0.2s ease, transform 0.35s ease;
          }

        img {
          width: 20px;
          height: 20px;
          opacity: 0.75;
        }

        &:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
          img { opacity: 1; }
            i { color: var(--accent); transform: rotate(30deg); }
        }
      }
        .bottom-connect {
          flex: none;
          max-width: 124px;
          height: 32px;
          line-height: 30px;
          padding: 0 12px;
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
            border-radius: 999px;
            background: var(--surface-2);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            transition: all 0.2s ease;

            &:hover {
              border-color: var(--accent);
              box-shadow: var(--shadow-md);
            }
        }
    }
  }

  .shelf-wrapper {
    padding: calc(36px + var(--safe-top)) calc(40px + var(--safe-right)) calc(36px + var(--safe-bottom)) calc(40px + var(--safe-left));
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
      position: relative;
    padding-top: calc(36px + var(--safe-top));
    padding-bottom: calc(36px + var(--safe-bottom));

    >>> .el-icon-loading {
      font-size: 36px;
      color: var(--text-3);
    }

    >>> .el-loading-text {
      font-weight: 500;
      color: var(--text-2);
    }

    .books-wrapper {
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
        padding-bottom: 8px;

      .wrapper {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        grid-gap: var(--book-gap, 18px);

        .book {
          user-select: none;
          display: flex;
          cursor: pointer;
          padding: 22px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          flex-direction: row;
          align-items: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

          .cover-img {
            flex: none;

            .cover {
              width: 78px;
              height: 104px;
              border-radius: 6px;
              object-fit: cover;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
            }
          }

          .info {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: left;
            margin-left: 18px;
            flex: 1;
            min-width: 0;

            .name {
              width: fit-content;
              max-width: 100%;
              font-size: 16px;
              font-weight: 600;
              color: var(--text-1);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .sub {
              display: flex;
              flex-direction: row;
              align-items: center;
              flex-wrap: wrap;
              font-size: 12px;
              font-weight: 500;
              color: var(--text-2);
              margin-top: 6px;

              .dot {
                margin: 0 7px;
                color: var(--text-3);
              }

              .author {
                max-width: 160px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .dur-chapter,
            .last-chapter {
              color: var(--text-3);
              font-size: 12px;
              margin-top: 6px;
              font-weight: 400;
              word-wrap: break-word;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 1;
              text-align: left;
            }
          }
        }

        .book:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
        }

        /* 长按反馈：轻微放大 + 高亮边框 */
        .book.long-press {
          animation: book-long-press 0.32s ease;
        }
      }
    }

    .books-wrapper::-webkit-scrollbar {
      width: 0 !important;
    }

      .system-settings-fab {
        position: absolute;
        left: 28px;
        bottom: calc(28px + var(--safe-bottom));
        z-index: 30;
        width: 48px;
        height: 48px;
        padding: 0;
        margin: 0;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text-2);
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-md);
        transition: all 0.25s ease;
        outline: none;
        -webkit-tap-highlight-color: transparent;

        i {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.35s ease;
        }

        &:hover {
          border-color: var(--accent);
          color: var(--accent);
          box-shadow: var(--shadow-lg);

          i {
            transform: rotate(60deg);
          }
        }

        &:active {
          transform: scale(0.92);
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

.book-context-menu {
  position: fixed;
  min-width: 160px;
  padding: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--text-1);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;

  i {
    font-size: 15px;
    color: var(--text-2);
    transition: color 0.15s ease;
  }

  &:hover {
    background: var(--hover);
    color: var(--accent);

    i {
      color: var(--accent);
    }
  }

  &.danger:hover {
    background: rgba(245, 108, 108, 0.08);
    color: var(--danger);

    i {
      color: var(--danger);
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

@keyframes book-long-press {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.035);
    box-shadow: var(--shadow-md);
    border-color: var(--accent);
  }
  100% {
    transform: scale(1);
  }
}

/* ---------- 移动端 ---------- */
@media screen and (max-width: 750px) {
  .index-wrapper {
    overflow-x: hidden;
    flex-direction: column;

    .navigation-wrapper {
      width: 100%;
      min-width: 0;
      padding: calc(16px + var(--safe-top)) 20px 20px;
      border-right: none;
      border-bottom: 1px solid var(--glass-border, var(--border));
      flex-direction: column;

      .navigation-header {
        .navigation-title { font-size: 24px; }
        .navigation-sub-title { display: none; }
      }

      .search-wrapper { margin-top: 18px; }

      .nav-body {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .nav-section {
          margin-bottom: 0;
          display: flex;
          flex-direction: row;
          align-items: center;
          min-width: 0;

          .section-title {
            margin-bottom: 0;
            margin-right: 14px;
            flex: none;
          }

          .recent-book,
          .setting-connect,
          .setting-manage {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }

      .bottom-icons {
        display: none;
      }
        .bottom-icons {
          position: static;
          height: auto;
          padding: 12px 0 0;
          margin-top: 14px;
          border-top: 1px solid var(--glass-border, var(--border));
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
            .bottom-connect {
              max-width: 38vw;
            }
        }
    }

    .shelf-wrapper {
      padding: calc(16px + var(--safe-top)) calc(16px + var(--safe-right)) calc(16px + var(--safe-bottom)) calc(16px + var(--safe-left));

      .books-wrapper {
        .wrapper {
          display: flex;
          flex-direction: column;
          grid-gap: 0;

          .book {
            width: 100%;
            margin-bottom: 12px;
            padding: 14px 16px;
            border-radius: var(--radius-sm);

            .cover-img .cover {
              width: 60px;
              height: 80px;
            }

            .info {
              margin-left: 14px;

              .name { font-size: 15px; }
              .sub { font-size: 11px; margin-top: 4px; }
              .dur-chapter, .last-chapter { font-size: 11px; margin-top: 4px; }
            }
          }
        }
      }

        .books-wrapper {
          padding-bottom: 8px;

          .wrapper .book {
            margin-bottom: var(--book-gap, 12px);
          }
        }

      .system-settings-fab {
            position: fixed;
          left: 16px;
          bottom: calc(16px + var(--safe-bottom));
          width: 44px;
          height: 44px;
          font-size: 18px;
        }
    }
  }
}
</style>
