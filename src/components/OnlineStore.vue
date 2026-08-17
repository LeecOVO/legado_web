<template>
  <div>
    <el-dialog
      :visible.sync="dialogVisible"
      :width="miniInterface ? '94%' : '780px'"
      :top="miniInterface ? '2vh' : '6vh'"
      @opened="onOpened"
      @closed="onClosed"
    >
      <div slot="title" class="dialog-title">
        <i class="title-icon el-icon-search"></i>
        <span class="title-text">在线书库</span>
        <span class="title-count">
          <i class="status-dot" :class="downloaderState"></i>
          {{ downloaderStatusText }}
        </span>
      </div>

      <!-- 搜索栏 -->
      <div class="search-row">
        <el-input
          v-model="keyword"
          size="small"
          placeholder="输入书名或作者，例如：三体"
          clearable
          prefix-icon="el-icon-search"
          @keyup.enter.native="doSearch"
        />
        <el-button
          type="primary"
          size="small"
          icon="el-icon-search"
          :loading="searching"
          @click="doSearch"
        >
          搜索
        </el-button>
      </div>

      <el-tabs v-model="activeTab" class="store-tabs">
        <el-tab-pane label="搜索结果" name="search">
          <div class="search-status" v-if="searchHint">{{ searchHint }}</div>
          <div v-loading="searching" class="result-list">
            <div v-for="item in searchResults" :key="item.bookId" class="result-item">
              <div class="ri-info">
                <div class="ri-title">{{ item.title }}</div>
                <div class="ri-author">{{ item.author || '未知作者' }}</div>
              </div>
              <el-button size="mini" plain @click="openPreview(item)">详情</el-button>
              <el-button size="mini" type="primary" plain @click="download(item)">下载</el-button>
            </div>
            <div
              v-if="!searching && searched && searchResults.length === 0"
              class="empty-tip"
            >
              没有找到相关书籍，换个关键词试试
            </div>
            <div v-if="!searched" class="empty-tip">
              搜索在线小说，下载后自动加入书架
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="queueLabel" name="queue">
          <div v-loading="queueLoading" class="queue-list">
            <div v-for="t in queue" :key="t.id" class="queue-item">
              <div class="qi-head">
                <span class="qi-title">{{ t.title || t.bookId }}</span>
                <el-tag :type="statusTagType(t.status)" size="mini">
                  {{ statusText(t.status) }}{{ progressSuffix(t) }}
                </el-tag>
              </div>
              <div v-if="t.message" class="qi-msg">{{ t.message }}</div>
              <el-progress
                v-if="t.progress != null && t.progress > 0"
                :percentage="Math.min(t.progress, 100)"
                :stroke-width="6"
                :status="progressStatus(t.status)"
                :show-text="false"
              />
              <div class="qi-actions" v-if="actionButtons(t).length">
                <el-button
                  v-for="(b, i) in actionButtons(t)"
                  :key="i"
                  size="mini"
                  :type="b.type"
                  :plain="b.plain"
                  @click="b.handler(t)"
                >
                  {{ b.label }}
                </el-button>
              </div>
            </div>
            <div v-if="!queueLoading && queue.length === 0" class="empty-tip">
              下载队列为空
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 书籍详情预览 -->
    <el-dialog
      :visible.sync="previewVisible"
      :width="miniInterface ? '92%' : '520px'"
      :top="miniInterface ? '6vh' : '10vh'"
      title="书籍详情"
      append-to-body
    >
      <div v-loading="previewLoading" class="preview">
        <div class="preview-head">
          <img
            v-if="preview.coverUrl"
            :src="preview.coverUrl"
            class="preview-cover"
            alt=""
          />
          <div class="preview-meta">
            <div class="preview-name">{{ preview.bookName || '未知书名' }}</div>
            <div class="preview-author">{{ preview.author || '未知作者' }}</div>
            <div class="preview-stats">
              <span v-if="preview.chapterCount">共 {{ preview.chapterCount }} 章</span>
              <span v-if="preview.wordCount">约 {{ wordCountText(preview.wordCount) }}</span>
              <span v-if="preview.finished != null">{{ preview.finished ? '已完结' : '连载中' }}</span>
            </div>
          </div>
        </div>
        <div class="preview-tags">
          <el-tag
            v-for="(tag, i) in (preview.tags || [])"
            :key="i"
            size="mini"
            type="info"
            class="preview-tag"
          >
            {{ tag }}
          </el-tag>
        </div>
        <div class="preview-desc">{{ preview.description || '暂无简介' }}</div>
      </div>
      <span slot="footer">
        <el-button size="small" @click="previewVisible = false">关闭</el-button>
        <el-button size="small" type="primary" :loading="downloading" @click="downloadPreview">
          下载并加入书架
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import ajax from "../plugins/ajax";

export default {
  name: "OnlineStore",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      keyword: "",
      searching: false,
      searched: false,
      searchHint: "",
      searchResults: [],
      activeTab: "search",
      queue: [],
      queueLoading: false,
      previewVisible: false,
      previewLoading: false,
      preview: {},
      downloading: false,
      status: null,
      pollTimer: null,
      notifiedDone: {},
    };
  },
  computed: {
    miniInterface() {
      return this.$store.state.miniInterface;
    },
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
    queueLabel() {
      const active = this.queue.filter(
        (t) => !["DONE", "FAILED", "CANCELED"].includes(t.status)
      ).length;
      return active > 0 ? "下载队列 (" + active + ")" : "下载队列";
    },
    downloaderState() {
      if (this.status && this.status.enabled === false) return "danger";
      if (this.status && this.status.running) return "success";
      return "warning";
    },
    downloaderStatusText() {
      if (this.status && this.status.enabled === false) return "下载器已停用";
      if (this.status && this.status.running) {
        return "下载器 v" + (this.status.version || "?");
      }
      return "下载器未就绪";
    },
  },
  methods: {
    onOpened() {
      this.loadStatus();
      this.loadQueue();
      this.startPolling();
    },
    onClosed() {
      this.stopPolling();
      this.$emit("close");
    },
    beforeDestroy() {
      this.stopPolling();
    },
    startPolling() {
      this.stopPolling();
      this.pollTimer = setInterval(() => {
        this.loadQueue();
      }, 2000);
    },
    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },
    loadStatus() {
      ajax
        .get("/api/tomato/status")
        .then((res) => {
          if (res.data && res.data.isSuccess) {
            this.status = res.data.data;
          }
        })
        .catch(() => {});
    },
    doSearch() {
      const q = (this.keyword || "").trim();
      if (!q) {
        this.$message.warning("请输入关键词");
        return;
      }
      this.searching = true;
      this.searchHint = "";
      this.searched = false;
      ajax
        .get("/api/tomato/search", { params: { q } })
        .then((res) => {
          if (res.data && res.data.isSuccess) {
            this.searchResults = res.data.data || [];
            this.searched = true;
            this.searchHint =
              this.searchResults.length > 0
                ? "共 " + this.searchResults.length + " 条结果"
                : "";
            this.activeTab = "search";
          } else {
            this.searchResults = [];
            this.searched = true;
            this.searchHint = res.data.errorMsg || "搜索失败";
          }
        })
        .catch(() => {
          this.searchResults = [];
          this.searched = true;
          this.searchHint = "搜索失败，请确认下载器已就绪";
        })
        .finally(() => {
          this.searching = false;
        });
    },
    openPreview(item) {
      this.previewVisible = true;
      this.previewLoading = true;
      this.preview = {};
      ajax
        .get("/api/tomato/preview/" + encodeURIComponent(item.bookId))
        .then((res) => {
          if (res.data && res.data.isSuccess) {
            this.preview = res.data.data || {};
          } else {
            this.$message.error(res.data.errorMsg || "获取书籍信息失败");
          }
        })
        .catch(() => {
          this.$message.error("获取书籍信息失败");
        })
        .finally(() => {
          this.previewLoading = false;
        });
    },
    download(item) {
      this.submitDownload(item.bookId, item.title, item.author);
    },
    downloadPreview() {
      this.submitDownload(
        this.preview.bookId,
        this.preview.bookName,
        this.preview.author
      );
    },
    submitDownload(bookId, title, author) {
      if (!bookId) return;
      this.downloading = true;
      ajax
        .post("/api/tomato/download", {
          bookId: bookId,
          title: title,
          author: author,
        })
        .then((res) => {
          if (res.data && res.data.isSuccess) {
            this.$message.success("已加入下载队列");
            this.previewVisible = false;
            this.activeTab = "queue";
            this.loadQueue();
          } else {
            this.$message.error(res.data.errorMsg || "下载失败");
          }
        })
        .catch(() => {
          this.$message.error("下载失败");
        })
        .finally(() => {
          this.downloading = false;
        });
    },
    loadQueue() {
      ajax
        .get("/api/tomato/queue")
        .then((res) => {
          if (res.data && res.data.isSuccess) {
            const list = res.data.data || [];
            list.forEach((t) => {
              if (t.status === "DONE" && t.id && !this.notifiedDone[t.id]) {
                this.notifiedDone[t.id] = true;
                this.$emit("downloaded");
              }
            });
            this.queue = list;
          }
        })
        .catch(() => {})
        .finally(() => {
          this.queueLoading = false;
        });
    },
    statusText(status) {
      const map = {
        PENDING: "等待中",
        DOWNLOADING: "下载中",
        PARSING: "解析中",
        DONE: "已完成",
        FAILED: "失败",
        CANCELED: "已取消",
      };
      return map[status] || status || "未知";
    },
    statusTagType(status) {
      if (status === "DONE") return "success";
      if (status === "FAILED") return "danger";
      if (status === "CANCELED") return "info";
      return "warning";
    },
    progressSuffix(t) {
      if (
        t.progress != null &&
        t.progress > 0 &&
        t.progress < 100 &&
        t.status !== "DONE"
      ) {
        return " " + Math.min(t.progress, 100) + "%";
      }
      return "";
    },
    progressStatus(status) {
      if (status === "DONE") return "success";
      if (status === "FAILED") return "exception";
      return "";
    },
    actionButtons(t) {
      const btns = [];
      if (t.status === "DONE" && t.resultBookUrl) {
        btns.push({
          label: "阅读",
          type: "primary",
          plain: true,
          handler: () => this.readBook(t),
        });
      }
      if (t.status === "FAILED" || t.status === "CANCELED") {
        btns.push({
          label: "重试",
          type: "primary",
          plain: false,
          handler: () => this.retryTask(t),
        });
      }
      if (["PENDING", "DOWNLOADING", "PARSING"].includes(t.status)) {
        btns.push({
          label: "取消",
          type: "danger",
          plain: true,
          handler: () => this.cancelTask(t),
        });
      }
      return btns;
    },
    readBook(t) {
      this.$emit("read", {
        bookUrl: t.resultBookUrl,
        bookName: t.title,
        bookAuthor: t.author,
      });
    },
    retryTask(t) {
      ajax
        .post("/api/tomato/queue/" + t.id + "/retry", {})
        .then((res) => {
          if (res.data && res.data.isSuccess) {
            this.$message.success("已重新排队");
            this.loadQueue();
          } else {
            this.$message.error(res.data.errorMsg || "重试失败");
          }
        })
        .catch(() => {
          this.$message.error("重试失败");
        });
    },
    cancelTask(t) {
      ajax
        .delete("/api/tomato/queue/" + t.id)
        .then((res) => {
          if (res.data && res.data.isSuccess) {
            this.$message.success("已取消");
            this.loadQueue();
          } else {
            this.$message.error(res.data.errorMsg || "取消失败");
          }
        })
        .catch(() => {
          this.$message.error("取消失败");
        });
    },
    wordCountText(n) {
      if (n == null) return "";
      if (n >= 10000) {
        return (n / 10000).toFixed(1) + " 万字";
      }
      return n + " 字";
    },
  },
};
</script>

<style lang="stylus" scoped>
.dialog-title {
  display: flex;
  align-items: center;
  gap: 8px;

  .title-icon {
    font-size: 16px;
    color: var(--accent);
  }

  .title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-1);
  }

  .title-count {
    margin-left: 8px;
    font-size: 12px;
    font-weight: normal;
    color: var(--text-3);
    display: inline-flex;
    align-items: center;
    gap: 5px;

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--text-3);
      display: inline-block;

      &.success { background: var(--success); }
      &.danger { background: var(--danger); }
      &.warning { background: var(--warning); }
    }
  }
}

.search-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;

  >>> .el-input { flex: 1; }
}

.store-tabs {
  >>> .el-tabs__header { margin-bottom: 8px; }
}

.search-status {
  font-size: 12px;
  color: var(--text-3);
  padding: 2px 0 8px;
}

.result-list {
  min-height: 180px;
  max-height: 46vh;
  overflow-y: auto;

  .result-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 4px;
    border-bottom: 1px solid var(--border);

    .ri-info {
      flex: 1;
      min-width: 0;

      .ri-title {
        font-size: 14px;
        color: var(--text-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ri-author {
        font-size: 12px;
        color: var(--text-3);
        margin-top: 3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

.queue-list {
  min-height: 180px;
  max-height: 46vh;
  overflow-y: auto;

  .queue-item {
    padding: 12px 4px;
    border-bottom: 1px solid var(--border);

    .qi-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;

      .qi-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .qi-msg {
      font-size: 12px;
      color: var(--text-3);
      margin-top: 6px;
      word-break: break-all;
    }

    >>> .el-progress {
      margin-top: 8px;
    }

    .qi-actions {
      margin-top: 8px;
      display: flex;
      gap: 8px;
    }
  }
}

.empty-tip {
  padding: 40px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-3);
}

.preview {
  .preview-head {
    display: flex;
    gap: 14px;

    .preview-cover {
      width: 96px;
      height: 128px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      flex: none;
      background: var(--surface-2);
    }

    .preview-meta {
      flex: 1;
      min-width: 0;

      .preview-name {
        font-size: 17px;
        font-weight: 600;
        color: var(--text-1);
      }

      .preview-author {
        font-size: 13px;
        color: var(--text-2);
        margin-top: 6px;
      }

      .preview-stats {
        margin-top: 10px;
        font-size: 12px;
        color: var(--text-3);
        display: flex;
        flex-wrap: wrap;
        gap: 4px 12px;
      }
    }
  }

  .preview-tags {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .preview-tag { margin: 0; }
  }

  .preview-desc {
    margin-top: 12px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--text-2);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 30vh;
    overflow-y: auto;
  }
}

@media screen and (max-width: 750px) {
  .search-row {
    flex-direction: column;
  }

  .preview .preview-head {
    flex-direction: column;
    align-items: center;
    text-align: center;

    .preview-stats { justify-content: center; }
  }
}
</style>
