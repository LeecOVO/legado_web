<template>
  <div
    class="settings-wrapper"
    :style="settingsTheme"
    :class="{ night: isNight, day: !isNight, embedded: embedded }"
  >
    <div class="settings-title">设置</div>
    <div class="setting-list">
      <ul>
        <li class="theme-list">
          <i>阅读主题</i>
          <span
            class="theme-item"
            v-for="(themeColor, index) in themeColors"
            :key="index"
            :style="themeColor"
            ref="themes"
            @click="setTheme(index)"
            :class="{ selected: selectedTheme == index }"
            ><em v-if="index < 6" class="iconfont">&#58980;</em
            ><em v-else-if="index === 6" class="moon-icon">{{ moonIcon }}</em
            ><em v-else class="oled-label">OLED</em></span
          >
        </li>
        <li class="font-list">
          <i>正文字体</i>
          <span
            class="font-item"
            v-for="(font, index) in fonts"
            :key="index"
            :class="{ selected: selectedFont == index }"
            @click="setFont(index)"
            >{{ font }}</span
          >
        </li>
        <li class="font-list">
          <i>自定字体</i>
          <el-tooltip effect="dark" content="自定义的字体名称" placement="top">
            <input
              type="text"
              class="font-item font-item-input"
              v-model="customFontName"
              placeholder="请输入自定义的字体名称"
            />
          </el-tooltip>

          <el-popover
            placement="top"
            width="180"
            v-model="customFontSavePopVisible"
          >
            <p>
              请确认输入的字体名称完整无误，并且该字体已经安装在您的设备上。
            </p>
            <p>确定保存吗？</p>
            <div style="text-align: right; margin: 0">
              <el-button
                size="mini"
                type="text"
                @click="customFontSavePopVisible = false"
                >取消</el-button
              >
              <el-button
                type="primary"
                size="mini"
                @click="
                  setCustomFont();
                  customFontSavePopVisible = false;
                "
                >确定</el-button
              >
            </div>
            <span type="text" class="font-item" slot="reference">保存</span>
          </el-popover>
        </li>
        <li class="font-size">
          <i>字体大小</i>
          <div class="resize">
            <span class="less" @click="lessFontSize"
              ><em class="iconfont">&#58966;</em></span
            ><b></b> <span class="lang">{{ fontSize }}</span
            ><b></b>
            <span class="more" @click="moreFontSize"
              ><em class="iconfont">&#58976;</em></span
            >
          </div>
        </li>
        <li class="font-color">
          <i>字体颜色</i>
          <div class="color-options">
            <span
              class="color-swatch"
              v-for="(c, i) in colorPresets"
              :key="i"
              :style="c.value ? { background: c.value } : {}"
              :class="{ selected: fontColor === c.value, default: c.value === '' }"
              @click="setFontColor(c.value)"
            ></span>
            <label class="color-swatch color-custom" title="自定义颜色">
              <input type="color" :value="fontColor" @input="onCustomColor" />
              <em class="iconfont">&#58971;</em>
            </label>
          </div>
        </li>
        <li class="read-width" v-if="!$store.state.miniInterface">
          <i>页面宽度</i>
          <div class="resize">
            <span class="less" @click="lessReadWidth"
              ><em class="iconfont">&#58965;</em></span
            ><b></b> <span class="lang">{{ readWidth }}</span
            ><b></b>
            <span class="more" @click="moreReadWidth"
              ><em class="iconfont">&#58975;</em></span
            >
          </div>
        </li>
        <li class="infinite-loading">
          <i>无限加载</i>
          <span
            class="infinite-loading-item"
            :key="0"
            :class="{ selected: infiniteLoading == false }"
            @click="setInfiniteLoading(false)"
            >关闭</span
          >
          <span
            class="infinite-loading-item"
            :key="1"
            :class="{ selected: infiniteLoading == true }"
            @click="setInfiniteLoading(true)"
            >开启</span
          >
        </li>
        <li class="page-turn-mode">
          <i>翻页动画</i>
          <span
            class="page-turn-item"
            v-for="(label, key) in pageTurnModes"
            :key="key"
            :class="{ selected: pageTurnMode === key }"
            @click="setPageTurnMode(key)"
            >{{ label }}</span
          >
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import "../assets/fonts/popfont.css";
import "../assets/fonts/iconfont.css";
import config from "../plugins/config";
import ajax from "../plugins/ajax";
export default {
  name: "ReadSettings",
  props: {
    embedded: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      theme: 0,
      isNight: this.$store.state.config.theme >= 6,
      moonIcon: "",
      themeColors: [
        {
          background: config.themes[0].body,
        },
        {
          background: config.themes[1].body,
        },
        {
          background: config.themes[2].body,
        },
        {
          background: config.themes[3].body,
        },
        {
          background: config.themes[4].body,
        },
        {
          background: config.themes[5].body,
        },
        {
          background: config.themes[6].body,
        },
        {
          background: config.themes[7].body,
        },
      ],
      moonIconStyle: {
        display: "inline",
        color: "rgba(255,255,255,0.2)",
      },
      colorPresets: [
        { value: "" },
        { value: "#262626" },
        { value: "#4a4a4a" },
        { value: "#8a8a8a" },
        { value: "#a2a9b4" },
        { value: "#b08d57" },
        { value: "#7a9a7a" },
        { value: "#ffffff" },
      ],
      fonts: ["雅黑", "宋体", "楷书"],
      pageTurnModes: {
        slide: "滑动",
        cover: "覆盖",
        fade: "淡入",
        none: "无",
      },
      customFontName: this.$store.state.config.customFontName,
      customFontSavePopVisible: false,
    };
  },
  mounted() {
    //初始化设置项目
    var config = this.$store.state.config;
    this.theme = config.theme;
    if (this.theme >= 6) {
      this.moonIcon = "";
    } else {
      this.moonIcon = "";
    }
  },
    watch: {
      "config.theme"(theme) {
        this.isNight = theme >= 6;
        this.moonIcon = this.isNight ? "" : "";
      },
    },
  computed: {
    config() {
      return this.$store.state.config;
    },
    popupTheme() {
        if (this.embedded) {
          return { background: "transparent" };
        }
      return {
        background: (config.themes[this.config.theme] || {}).popup,
      };
    },
      settingsTheme() {
          if (this.embedded) {
            return { background: "transparent" };
          }
        const theme = config.themes[this.config.theme] || {};
        const menu = theme.menu || {};
        const night = this.config.theme >= 6;
        const oled = this.config.theme == 7;
        const titleColor = night ? "#e2e4e8" : menu.chapterText || "#262626";
        const labelColor = night ? "#b0b5bf" : menu.subText || "#666";
        const buttonBg = oled ? "rgba(18, 18, 22, 0.72)" : night ? "rgba(45, 45, 45, 0.5)" : "rgba(255, 255, 255, 0.5)";
        const buttonBorder = oled ? "#2b2b30" : night ? "#666666" : menu.border || "rgba(0, 0, 0, 0.1)";
        return {
          background: theme.popup,
          "--read-setting-title": titleColor,
          "--read-setting-label": labelColor,
          "--read-setting-text": menu.chapterText || "#262626",
          "--read-setting-border": menu.border || "rgba(0, 0, 0, 0.1)",
          "--read-setting-button-bg": buttonBg,
          "--read-setting-button-border": buttonBorder,
          "--read-setting-button-text": menu.chapterText || "#262626",
          "--read-setting-input-bg": oled ? "rgba(0, 0, 0, 0.45)" : night ? "rgba(45, 45, 45, 0.5)" : "rgba(255, 255, 255, 0.72)",
          "--read-setting-accent": "#ed4259",
        };
      },
    selectedTheme() {
      return this.$store.state.config.theme;
    },
    selectedFont() {
      return this.$store.state.config.font;
    },
    fontSize() {
      return this.$store.state.config.fontSize;
    },
    readWidth() {
      return this.$store.state.config.readWidth;
    },
    infiniteLoading() {
      return this.$store.state.config.infiniteLoading;
    },
    fontColor() {
      return this.$store.state.config.fontColor || "";
    },
    pageTurnMode() {
      return this.$store.state.config.pageTurnMode || "slide";
    },
  },
  methods: {
    setTheme(theme) {
      if (theme >= 6) {
        this.isNight = true;
        this.moonIcon = "";
        this.moonIconStyle.color = "#ed4259";
      } else {
        this.isNight = false;
        this.moonIcon = "";
        this.moonIconStyle.color = "rgba(255,255,255,0.2)";
      }
      let config = this.config;
      config.theme = theme;
      this.saveConfig(config);
    },
    setFontColor(color) {
      let config = this.config;
      config.fontColor = color;
      this.saveConfig(config);
    },
    onCustomColor(event) {
      this.setFontColor(event.target.value);
    },
    setPageTurnMode(mode) {
      let config = this.config;
      config.pageTurnMode = mode;
      this.saveConfig(config);
    },
    setFont(font) {
      let config = this.config;
      config.font = font;
      this.saveConfig(config);
    },
    setCustomFont() {
      let config = this.config;
      config.font = -1;
      config.customFontName = this.customFontName;
      this.saveConfig(config);
    },
    moreFontSize() {
      let config = this.config;
      if (config.fontSize < 48) config.fontSize += 2;
      this.saveConfig(config);
    },
    lessFontSize() {
      let config = this.config;
      if (config.fontSize > 12) config.fontSize -= 2;
      this.saveConfig(config);
    },
    moreReadWidth() {
      let config = this.config;
      /*if (config.readWidth < 960)*/
      config.readWidth += 160;
      this.saveConfig(config);
    },
    lessReadWidth() {
      let config = this.config;
      if (config.readWidth > 640) config.readWidth -= 160;
      this.saveConfig(config);
    },
    setInfiniteLoading(loading) {
      let config = this.config;
      config.infiniteLoading = loading;
      this.saveConfig(config);
    },
    saveConfig(config) {
      this.$store.commit("setConfig", config);
      localStorage.setItem("config", JSON.stringify(config));
      this.uploadConfig(config);
    },
    uploadConfig(config) {
      ajax.post("/saveReadConfig", config);
    },
  },
};
</script>

<style lang="stylus" scoped>
>>>.iconfont {
  font-family: iconfont;
  font-style: normal;
}

>>>.moon-icon {
  font-family: iconfont;
  font-style: normal;
}

.settings-wrapper {
  user-select: none;
  margin: -13px;
  // width: 478px;
  // height: 350px;
  text-align: left;
  padding: 40px 0 40px 24px;
  background: var(--read-popup, #ede7da url('../assets/imgs/themes/popup_1.png') repeat);

  .settings-title {
    font-size: 18px;
    line-height: 22px;
    margin-bottom: 28px;
    font-family: FZZCYSK;
    font-weight: 400;
      color: var(--read-setting-title, #262626);
  }

  .setting-list {
    ul {
      list-style: none outside none;
      margin: 0;
      padding: 0;

      li {
        list-style: none outside none;

        i {
          font: 12px / 16px PingFangSC-Regular, '-apple-system', Simsun;
          display: inline-block;
          min-width: 48px;
          margin-right: 16px;
          vertical-align: middle;
          color: var(--read-setting-label, #666);
        }

        .theme-item {
          width: 32px;
          height: 32px;
          line-height: 1;
          margin-right: 10px;
          margin-top: 6px;
          border-radius: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          vertical-align: middle;
          transition: transform 0.15s ease, box-shadow 0.15s ease;

          &:hover {
            transform: scale(1.12);
          }

          .iconfont {
            display: none;
          }

          .oled-label {
            font-style: normal;
            font-size: 8px;
            font-weight: 600;
            letter-spacing: 0.5px;
            color: rgba(255, 255, 255, 0.85);
          }
        }

        .selected {
          color: #ed4259;

          .iconfont {
            display: inline;
          }

          .oled-label {
            color: #409eff;
          }
        }
      }

      .font-list, .infinite-loading, .page-turn-mode {
        margin-top: 28px;

        .font-item, .infinite-loading-item, .page-turn-item {
          width: 78px;
          height: 34px;
          cursor: pointer;
          margin-right: 16px;
          border-radius: 4px;
          text-align: center;
          vertical-align: middle;
          display: inline-block;
          font: 14px / 34px PingFangSC-Regular, HelveticaNeue-Light, 'Helvetica Neue Light', 'Microsoft YaHei', sans-serif;
          transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
        }
        .font-item-input {
          width: 168px;
          color: var(--read-setting-text, #000000);
            background: var(--read-setting-input-bg, transparent);
        }
        .selected {
          color: #ed4259;
          border: 1px solid #ed4259;
        }

        .font-item:hover, .infinite-loading-item:hover, .page-turn-item:hover {
          border: 1px solid #ed4259;
          color: #ed4259;
        }
      }

      .font-size, .read-width {
        margin-top: 28px;

        .resize {
          display: flex;
          align-items: center;
          width: 274px;
          max-width: 100%;
          height: 34px;
          vertical-align: middle;
          border-radius: 2px;

          span {
            flex: 1;
            height: 34px;
            line-height: 34px;
            cursor: pointer;
            text-align: center;
            vertical-align: middle;

            em {
              font-style: normal;
            }
          }

          .less:hover, .more:hover {
            color: #ed4259;
          }

          .lang {
            color: var(--read-setting-label, #a6a6a6);
            font-weight: 400;
            font-family: FZZCYSK;
          }

          b {
            flex: none;
            display: inline-block;
            height: 20px;
            vertical-align: middle;
          }
        }
      }

      .font-color {
        margin-top: 28px;

        .color-options {
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          vertical-align: middle;
          gap: 8px;
          max-width: 320px;

          .color-swatch {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 1px solid rgba(128, 128, 128, 0.45);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            flex: none;
            transition: transform 0.15s ease, box-shadow 0.15s ease;

            &:hover {
              transform: scale(1.15);
            }

            &.default {
              background: rgba(255, 255, 255, 0.4) !important;

              &::after {
                content: "";
                position: absolute;
                width: 34px;
                height: 1px;
                background: #f56c6c;
                transform: rotate(-45deg);
              }
            }

            &.selected {
              box-shadow: 0 0 0 2px #409eff;
              border-color: #409eff;
            }

            &.color-custom {
              background: conic-gradient(#f56c6c, #e6a23c, #67c23a, #409eff, #b882ff, #f56c6c);
              overflow: hidden;

              input {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                cursor: pointer;
                border: none;
                padding: 0;
              }

              em {
                font-style: normal;
                font-size: 12px;
                color: #fff;
                pointer-events: none;
                text-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
              }
            }
          }
        }
      }
    }
  }
}

.night {
  >>>.settings-title {
    color: var(--read-setting-title, #e2e4e8);
  }

  >>> i {
    color: var(--read-setting-label, #b0b5bf);
  }

  >>>.theme-item {
    border: 1px solid #666;
  }

  >>>.selected {
    border: 1px solid #666;
  }

  >>>.moon-icon {
    color: #ed4259;
  }

  >>>.font-list, .infinite-loading, .page-turn-mode {
    .font-item, .infinite-loading-item, .page-turn-item {
      border: 1px solid #666;
      background: rgba(45, 45, 45, 0.5);
    }
  }

  >>>.resize {
    border: 1px solid #666;
    background: rgba(45, 45, 45, 0.5);

    b {
      border-right: 1px solid #666;
    }
  }
}

.day {
  >>>.theme-item {
    border: 1px solid #e5e5e5;
  }

  >>>.selected {
    border: 1px solid #ed4259;
  }

  >>>.moon-icon {
    display: inline;
    color: rgba(255, 255, 255, 0.2);
  }

  >>>.font-list, .infinite-loading, .page-turn-mode {
    .font-item, .infinite-loading-item, .page-turn-item {
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
  }

  >>>.resize {
    border: 1px solid #e5e5e5;
    background: rgba(255, 255, 255, 0.5);

    b {
      border-right: 1px solid #e5e5e5;
    }
  }
}

/* ---------- 阅读主题自适应：设置弹窗字体/按钮/背景配色 ---------- */
.night {
  >>>.theme-item {
    border: 1px solid var(--read-setting-button-border, #666);
  }

  >>>.selected {
    border: 1px solid var(--read-setting-button-border, #666);
  }

  >>>.font-list, .infinite-loading, .page-turn-mode {
    .font-item, .infinite-loading-item, .page-turn-item {
      border: 1px solid var(--read-setting-button-border, #666);
      background: var(--read-setting-button-bg, rgba(45, 45, 45, 0.5));
      color: var(--read-setting-button-text, #666);
    }
  }

  >>>.resize {
    border: 1px solid var(--read-setting-button-border, #666);
    background: var(--read-setting-button-bg, rgba(45, 45, 45, 0.5));
    color: var(--read-setting-button-text, #666);

    b {
      border-right: 1px solid var(--read-setting-button-border, #666);
    }

    .lang {
      color: var(--read-setting-label, #b0b5bf);
    }
  }
}

.day {
  >>>.theme-item {
    border: 1px solid var(--read-setting-border, #e5e5e5);
  }

  >>>.selected {
    border: 1px solid var(--read-setting-accent, #ed4259);
  }

  >>>.font-list, .infinite-loading, .page-turn-mode {
    .font-item, .infinite-loading-item, .page-turn-item {
      border: 1px solid var(--read-setting-button-border, rgba(0, 0, 0, 0.1));
      background: var(--read-setting-button-bg, rgba(255, 255, 255, 0.5));
      color: var(--read-setting-button-text, #262626);
    }
  }

  >>>.resize {
    border: 1px solid var(--read-setting-button-border, #e5e5e5);
    background: var(--read-setting-button-bg, rgba(255, 255, 255, 0.5));
    color: var(--read-setting-button-text, #262626);

    b {
      border-right: 1px solid var(--read-setting-button-border, #e5e5e5);
    }

    .lang {
      color: var(--read-setting-label, #a6a6a6);
    }
  }

  >>>.font-item-input {
    background: var(--read-setting-input-bg, transparent);
    color: var(--read-setting-text, #000000);
  }
}

@media screen and (max-width: 500px) {
  .settings-wrapper {
    padding: 20px 16px 24px 16px;
    max-height: calc(100vh - 110px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    .setting-list ul li {
      margin-bottom: 22px;

      i {
        display: block;
        width: 100%;
        margin: 0 0 10px;
        padding: 0;
      }
    }

    .resize {
      width: 100%;
      max-width: 280px;
    }

    .font-item-input {
      width: 150px;
    }

    .color-options {
      max-width: 100%;
    }

    .theme-item {
      margin-right: 8px;
    }
  }
}

/* ---------- 弹层自适应：阅读设置 ---------- */
.settings-wrapper {
  box-sizing: border-box;
  padding: 28px 24px 32px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.settings-wrapper .setting-list ul li {
  margin-bottom: 20px;
}

.settings-wrapper .font-list,
.settings-wrapper .infinite-loading,
.settings-wrapper .page-turn-mode {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.settings-wrapper .font-list .font-item,
.settings-wrapper .infinite-loading .infinite-loading-item,
.settings-wrapper .page-turn-mode .page-turn-item {
  margin-right: 0;
  margin-bottom: 4px;
  flex: none;
}

.settings-wrapper .font-list .font-item-input {
  flex: 1 1 160px;
  min-width: 140px;
  max-width: 260px;
  margin-right: 0;
}

.settings-wrapper .font-size .resize,
.settings-wrapper .read-width .resize {
  width: 100%;
  max-width: 320px;
}

.settings-wrapper .font-color .color-options {
  max-width: 100%;
}

@media screen and (max-width: 750px) {
  .settings-wrapper {
    padding: 22px 16px 28px;
    max-height: calc(100vh - 150px);
  }

  .settings-wrapper .font-list .font-item-input {
    width: 100%;
    max-width: 220px;
  }
}

/* 嵌入系统设置面板时：去除弹层边距与背景，统一使用全局主题变量 */
.embedded {
  margin: 0 !important;
  padding: 0 !important;
  max-height: none;
  overflow: visible;
  background: transparent !important;

  .settings-title {
    display: none;
  }

  .setting-list ul li i {
    color: var(--text-2);
  }

  .font-list,
  .infinite-loading,
  .page-turn-mode {
    .font-item,
    .infinite-loading-item,
    .page-turn-item {
      color: var(--text-1);
      background: var(--surface-2);
      border: 1px solid var(--border);

      &:hover {
        color: var(--accent);
        border-color: var(--accent);
      }
    }

    .selected {
      color: var(--accent);
      border-color: var(--accent);
      background: var(--accent-soft);
    }
  }

  .font-size,
  .read-width {
    .resize {
      color: var(--text-1);
      background: var(--surface-2);
      border: 1px solid var(--border);

      b {
        border-right: 1px solid var(--border);
      }

      .lang {
        color: var(--text-3);
      }

      .less:hover,
      .more:hover {
        color: var(--accent);
      }
    }
  }

  .font-color .color-options .color-swatch {
    border-color: var(--border-strong);
  }

  &.night,
  &.day {
    >>> .font-list,
    >>> .infinite-loading,
    >>> .page-turn-mode {
      .font-item,
      .infinite-loading-item,
      .page-turn-item {
        color: var(--text-1);
        background: var(--surface-2);
        border: 1px solid var(--border);
      }

      .selected {
        color: var(--accent);
        border-color: var(--accent);
        background: var(--accent-soft);
      }
    }

    >>> .resize {
      color: var(--text-1);
      background: var(--surface-2);
      border: 1px solid var(--border);

      b {
        border-right: 1px solid var(--border);
      }
    }

    >>> i {
      color: var(--text-2);
    }

    >>> .theme-item,
    >>> .selected {
      border: 1px solid var(--border-strong);
    }
  }
}
</style>
