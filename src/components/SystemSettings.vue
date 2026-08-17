<template>
  <el-dialog
    custom-class="system-settings-dialog"
    :visible.sync="dialogVisible"
    :width="miniInterface ? '94%' : '560px'"
    :top="miniInterface ? '3vh' : '8vh'"
    :append-to-body="true"
    @closed="onClosed"
  >
    <div slot="title" class="dialog-title">
      <i class="el-icon-setting title-icon"></i>
      <span class="title-text">系统设置</span>
    </div>

    <div class="system-settings">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <el-tab-pane label="书架设置" name="bookshelf">
          <div class="panel">
            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">书籍间距</span>
                <span class="label-value">{{ bookshelfSettings.bookSpacing }}px</span>
              </div>
              <el-slider
                v-model="bookshelfSettings.bookSpacing"
                :min="8"
                :max="36"
                :step="2"
                @change="saveBookshelfSettings"
              />
              <div class="setting-tip">
                控制书架页面书籍卡片之间的间距，桌面端与移动端同步生效。
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">默认封面</span>
              </div>
              <div class="cover-options">
                <div
                  class="cover-option"
                  :class="{ active: bookshelfSettings.defaultCover === 'builtin' }"
                  @click="selectDefaultCover('builtin')"
                >
                  <img :src="noCover" class="cover-thumb" alt="内置默认封面" />
                  <span class="cover-option-name">内置封面</span>
                  <i
                    v-if="bookshelfSettings.defaultCover === 'builtin'"
                    class="el-icon-check check"
                  ></i>
                </div>
                <div
                  class="cover-option"
                  :class="{ active: bookshelfSettings.defaultCover === 'custom' }"
                  @click="chooseCustomCover"
                >
                  <img
                    v-if="bookshelfSettings.customCoverUrl"
                    :src="bookshelfSettings.customCoverUrl"
                    class="cover-thumb"
                    alt="自定义默认封面"
                  />
                  <div v-else class="cover-thumb cover-placeholder">
                    <i class="el-icon-plus"></i>
                  </div>
                  <span class="cover-option-name">自定义</span>
                    <span
                      v-if="bookshelfSettings.customCoverUrl"
                      class="cover-option-change"
                      @click.stop="openCoverFile"
                    >更换</span>
                  <i
                    v-if="bookshelfSettings.defaultCover === 'custom'"
                    class="el-icon-check check"
                  ></i>
                </div>
              </div>
              <input
                ref="coverFile"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                class="hidden-input"
                @change="onCoverFileChange"
              />
                <input
                  ref="bgFile"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="hidden-input"
                  @change="onBgFileChange"
                />
              <div class="setting-tip">
                未设置封面的书籍将统一使用该默认封面；自定义封面会压缩后保存在本机浏览器。
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-label">
                <span class="label-text">全局背景</span>
              </div>
              <div class="bg-options">
                <div
                  class="bg-option"
                  v-for="bg in shelfBackgrounds"
                  :key="bg.key"
                  :class="{ active: bookshelfSettings.shelfBackground === bg.key }"
                  @click="selectShelfBackground(bg.key)"
                >
                  <span class="bg-swatch" :style="{ background: bg.value }"></span>
                  <span class="bg-name">{{ bg.name }}</span>
                </div>
                <div
                  class="bg-option custom"
                  :class="{ active: bookshelfSettings.shelfBackground === 'custom' }"
                  @click="selectShelfBackground('custom')"
                >
                  <span
                    class="bg-swatch"
                    :style="customBgSwatchStyle"
                  >
                      <img
                        v-if="bookshelfSettings.shelfBackgroundImage"
                        :src="bookshelfSettings.shelfBackgroundImage"
                        class="bg-swatch-img"
                        alt=""
                      />
                    <input
                      v-else
                        type="color"
                      v-model="bookshelfSettings.shelfBackgroundColor"
                      class="color-input"
                      @click.stop
                      @input="selectShelfBackground('custom')"
                    />
                  </span>
                  <span class="bg-name">{{ bookshelfSettings.shelfBackgroundImage ? "自定义图" : "自定义" }}</span>
                </div>
              </div>
                <div
                  class="bg-custom-actions"
                  v-if="bookshelfSettings.shelfBackground === 'custom'"
                >
                  <el-button
                    size="mini"
                    icon="el-icon-upload2"
                    @click="openBgFile"
                  >
                    {{ bookshelfSettings.shelfBackgroundImage ? "更换背景图" : "上传背景图" }}
                  </el-button>
                  <el-button
                    v-if="bookshelfSettings.shelfBackgroundImage"
                    size="mini"
                    icon="el-icon-delete"
                    @click="removeBgImage"
                  >
                    移除图片
                  </el-button>
                </div>
              <div class="setting-tip">
                应用于整个页面背景；“自定义”可上传背景图并自适应铺满，未上传图片时使用颜色。
              </div>
            </div>

            <div class="setting-actions">
              <el-button size="small" plain @click="resetBookshelfSettings">
                恢复默认
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="阅读设置" name="reading">
          <div class="panel reading-panel">
            <ReadSettings :embedded="true" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="关于我们" name="about">
          <div class="panel about-panel">
            <div class="about-logo">阅</div>
            <div class="about-title">Legado Web 书架</div>
            <div class="about-desc">
              一款轻量、干净的网页阅读器。支持 Legado 后端书籍管理、多书源在线阅读、阅读进度同步，以及移动端与桌面端一致的阅读体验。
            </div>
            <div class="about-meta">Version 1.2.0 · MIT License</div>
            <a
              class="github-card"
              href="https://github.com/LeecOVO/legado_web"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img :src="githubIcon" class="github-icon" alt="GitHub" />
              <span class="github-text">
                <span class="github-title">GitHub 仓库</span>
                <span class="github-url">LeecOVO/legado_web</span>
              </span>
              <i class="el-icon-arrow-right github-arrow"></i>
            </a>
            <a
              class="github-card"
              href="https://github.com/LeecOVO/legado_web/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i class="el-icon-question github-icon question"></i>
              <span class="github-text">
                <span class="github-title">问题反馈</span>
                <span class="github-url">提交 Issue 或查看已知问题</span>
              </span>
              <i class="el-icon-arrow-right github-arrow"></i>
            </a>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<script>
import ReadSettings from "./ReadSettings.vue";
import noCover from "../assets/imgs/noCover.jpeg";
import githubIcon from "../assets/imgs/github.png";

export default {
  name: "SystemSettings",
  components: { ReadSettings },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      activeTab: "bookshelf",
      noCover,
      githubIcon,
      shelfBackgrounds: [
        { key: "default", name: "默认", value: "var(--bg)" },
        { key: "paper", name: "暖纸", value: "linear-gradient(135deg, #f6efdc 0%, #eadfbd 100%)" },
        { key: "green", name: "护眼绿", value: "linear-gradient(135deg, #eaf4eb 0%, #d2e7d5 100%)" },
        { key: "blue", name: "晴空蓝", value: "linear-gradient(135deg, #eaf2fd 0%, #d6e6fb 100%)" },
        { key: "gray", name: "雾灰", value: "linear-gradient(135deg, #f2f3f5 0%, #e2e5ea 100%)" },
        { key: "dark", name: "墨黑", value: "linear-gradient(135deg, #15181e 0%, #242933 100%)" },
      ],
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
    bookshelfSettings() {
      return this.$store.state.bookshelfSettings;
    },
      customBgSwatchStyle() {
        if (this.bookshelfSettings.shelfBackgroundImage) {
          return {
            backgroundImage: `url("${this.bookshelfSettings.shelfBackgroundImage}")`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          };
        }
        return {
          background: this.bookshelfSettings.shelfBackgroundColor || "#f4f5f7",
        };
      },
  },
  methods: {
    onClosed() {
      this.activeTab = "bookshelf";
    },
    saveBookshelfSettings() {
      this.$store.commit("setBookshelfSettings", this.bookshelfSettings);
        try {
      localStorage.setItem(
        "bookshelfSettings",
        JSON.stringify(this.$store.state.bookshelfSettings)
      );
        } catch (e) {
          this.$message.error("保存失败：背景图过大，请压缩后重试");
        }
    },
    selectDefaultCover(type) {
      this.bookshelfSettings.defaultCover = type;
      this.saveBookshelfSettings();
    },
    chooseCustomCover() {
      this.bookshelfSettings.defaultCover = "custom";
      this.saveBookshelfSettings();
      if (!this.bookshelfSettings.customCoverUrl) {
        this.$nextTick(() => {
          if (this.$refs.coverFile) this.$refs.coverFile.click();
        });
      }
    },
      openCoverFile() {
        this.bookshelfSettings.defaultCover = "custom";
        this.saveBookshelfSettings();
        this.$nextTick(() => {
          if (this.$refs.coverFile) this.$refs.coverFile.click();
        });
      },
    onCoverFileChange(event) {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        this.$message.error("请选择图片文件");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        this.$message.error("图片不能超过 8MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const maxW = 240;
            const scale = Math.min(1, maxW / img.width);
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            this.bookshelfSettings.customCoverUrl = canvas.toDataURL(
              "image/jpeg",
              0.85
            );
            this.bookshelfSettings.defaultCover = "custom";
            this.saveBookshelfSettings();
            this.$message.success("默认封面已更新");
          } catch (err) {
            this.$message.error("图片处理失败");
          }
        };
        img.onerror = () => {
          this.$message.error("图片读取失败");
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    selectShelfBackground(key) {
      this.bookshelfSettings.shelfBackground = key;
      this.saveBookshelfSettings();
    },
      openBgFile() {
        this.bookshelfSettings.shelfBackground = "custom";
        this.saveBookshelfSettings();
        this.$nextTick(() => {
          if (this.$refs.bgFile) this.$refs.bgFile.click();
        });
      },
      onBgFileChange(event) {
        const file = event.target.files && event.target.files[0];
        event.target.value = "";
        if (!file) return;
        if (!/^image\//.test(file.type)) {
          this.$message.error("请选择图片文件");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          this.$message.error("背景图不能超过 10MB");
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            try {
              const maxW = 1920;
              const maxH = 1920;
              const scale = Math.min(1, maxW / img.width, maxH / img.height);
              const canvas = document.createElement("canvas");
              canvas.width = Math.max(1, Math.round(img.width * scale));
              canvas.height = Math.max(1, Math.round(img.height * scale));
              const ctx = canvas.getContext("2d");
              ctx.fillStyle =
                this.bookshelfSettings.shelfBackgroundColor || "#f4f5f7";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              this.bookshelfSettings.shelfBackgroundImage = canvas.toDataURL(
                "image/jpeg",
                0.82
              );
              this.bookshelfSettings.shelfBackground = "custom";
              this.saveBookshelfSettings();
              this.$message.success("背景图已更新");
            } catch (err) {
              this.$message.error("图片处理失败");
            }
          };
          img.onerror = () => {
            this.$message.error("图片读取失败");
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      },
      removeBgImage() {
        this.bookshelfSettings.shelfBackgroundImage = "";
        this.saveBookshelfSettings();
        this.$message.success("背景图已移除");
      },
    resetBookshelfSettings() {
      this.$store.commit("setBookshelfSettings", {});
      localStorage.setItem(
        "bookshelfSettings",
        JSON.stringify(this.$store.state.bookshelfSettings)
      );
      this.$message.success("已恢复默认书架设置");
    },
  },
};
</script>

<style lang="stylus" scoped>
>>> .system-settings-dialog {
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-lg);

  .el-dialog__header {
    padding: 18px 22px 10px;
    border-bottom: 1px solid var(--border);
  }

  .el-dialog__body {
    padding: 10px 22px 22px;
    color: var(--text-1);
  }
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 8px;

  .title-icon {
    color: var(--accent);
    font-size: 18px;
  }

  .title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-1);
  }
}

.settings-tabs {
  >>> .el-tabs__header {
    margin-bottom: 14px;
  }

  >>> .el-tabs__item {
    font-size: 14px;
    color: var(--text-2);
    height: 40px;
    line-height: 40px;
  }

  >>> .el-tabs__item.is-active {
    color: var(--accent);
    font-weight: 600;
  }

  >>> .el-tabs__active-bar {
    background: var(--accent);
    height: 2px;
    border-radius: 2px;
  }

  >>> .el-tabs__nav-wrap::after {
    background: var(--border);
    height: 1px;
  }
}

.panel {
  padding: 4px 2px 8px;
}

.setting-item {
  margin-bottom: 22px;

  .setting-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .label-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-1);
    }

    .label-value {
      font-size: 12px;
      color: var(--accent);
      background: var(--accent-soft);
      padding: 2px 10px;
      border-radius: 20px;
    }
  }

  .setting-tip {
    font-size: 12px;
    color: var(--text-3);
    line-height: 1.6;
    margin-top: 8px;
  }
}

>>> .el-slider__runway {
  background: var(--surface-2);
  height: 6px;
  border-radius: 6px;
}

>>> .el-slider__bar {
  background: var(--accent);
  height: 6px;
  border-radius: 6px;
}

>>> .el-slider__button {
  width: 16px;
  height: 16px;
  border: 2px solid var(--accent);
  background: var(--surface);
}

>>> .el-slider__button-wrapper {
  top: -15px;
}

.cover-options {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.cover-option {
  position: relative;
  width: 112px;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  .cover-thumb {
    width: 60px;
    height: 80px;
    border-radius: 6px;
    object-fit: cover;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .cover-placeholder {
    background: var(--bg-elevated);
    border: 1px dashed var(--border-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: var(--text-3);
    box-shadow: none;
  }

  .cover-option-name {
    font-size: 12px;
    color: var(--text-2);
  }

    .cover-option-change {
      font-size: 10px;
      color: var(--accent);
      cursor: pointer;
      padding: 1px 8px;
      border-radius: 10px;
      background: var(--accent-soft);
      line-height: 1.4;
      transition: all 0.2s ease;

      &:hover {
        background: var(--accent);
        color: #fff;
      }
    }

  .check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 18px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 12px;
  }

  &.active {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  &:active {
    transform: scale(0.97);
  }
}

.hidden-input {
  display: none;
}

.bg-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.bg-option {
  width: 76px;
  padding: 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  .bg-swatch {
    width: 100%;
    height: 34px;
    border-radius: 6px;
    border: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }

  .bg-name {
    font-size: 11px;
    color: var(--text-2);
  }

  &.active {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  &:active {
    transform: scale(0.97);
  }
}

.color-input {
  position: absolute;
  top: -6px;
  left: -6px;
  width: calc(100% + 12px);
  height: calc(100% + 12px);
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0;
}

.bg-swatch-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.bg-custom-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.setting-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.reading-panel {
  padding: 0;
  max-height: 54vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.about-panel {
  text-align: center;
  padding: 18px 6px 10px;

  .about-logo {
    width: 64px;
    height: 64px;
    margin: 0 auto 14px;
    border-radius: 18px;
    background: linear-gradient(135deg, #409eff 0%, #6cb3ff 100%);
    color: #fff;
    font-size: 30px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-md);
  }

  .about-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-1);
  }

  .about-desc {
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.8;
    margin: 12px auto 10px;
    max-width: 420px;
  }

  .about-meta {
    font-size: 12px;
    color: var(--text-3);
    margin-bottom: 22px;
  }

  .github-card {
    display: flex;
    align-items: center;
    max-width: 420px;
    margin: 0 auto 12px;
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    text-decoration: none;
    transition: all 0.2s ease;

    .github-icon {
      width: 28px;
      height: 28px;
      flex: none;
      margin-right: 12px;
      opacity: 0.85;

      &.question {
        opacity: 1;
        color: var(--accent);
        font-size: 26px;
        line-height: 28px;
        text-align: center;
      }
    }

    .github-text {
      flex: 1;
      min-width: 0;
      text-align: left;
      display: flex;
      flex-direction: column;

      .github-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-1);
      }

      .github-url {
        font-size: 12px;
        color: var(--text-3);
        margin-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .github-arrow {
      color: var(--text-3);
      font-size: 16px;
      flex: none;
      margin-left: 8px;
    }

    &:hover {
      border-color: var(--accent);
      box-shadow: var(--shadow-sm);

      .github-arrow {
        color: var(--accent);
      }
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

@media screen and (max-width: 750px) {
  >>> .system-settings-dialog {
    border-radius: var(--radius-sm);
  }

  .panel {
    padding: 0;
  }

  .cover-options,
  .bg-options {
    gap: 8px;
  }

  .cover-option {
    width: 104px;
  }

  .bg-option {
    width: 68px;
  }

  .reading-panel {
    max-height: 52vh;
  }
}
</style>
