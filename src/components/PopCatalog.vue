<template>
  <div class="cata-wrapper" :style="popupTheme">
    <div class="title">目录</div>
    <div
      class="data-wrapper"
      ref="cataData"
      :class="{ night: isNight, day: !isNight }"
    >
      <div class="cata">
        <div
          class="log"
          v-for="(note, index) in catalog"
          :class="{ selected: isSelected(index) }"
          :key="note.durChapterIndex"
          @click="gotoChapter(note)"
          ref="cata"
        >
          <div class="log-text">
            {{ note.title }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import jump from "../plugins/jump";
import config from "../plugins/config";
import "../assets/fonts/popfont.css";
export default {
  name: "PopCata",
  data() {
    return {
      isNight: this.$store.state.config.theme >= 6,
      index: this.$store.state.readingBook.index,
    };
  },
  computed: {
    catalog() {
      return this.$store.state.catalog;
    },
    popCataVisible() {
      return this.$store.state.popCataVisible;
    },
    theme() {
      return this.$store.state.config.theme;
    },
    popupTheme() {
      return {
        background: (config.themes[this.theme] || {}).popup,
      };
    },
  },
  mounted() {},
  watch: {
    theme(theme) {
      if (theme >= 6) {
        this.isNight = true;
      } else {
        this.isNight = false;
      }
    },
    popCataVisible() {
      this.$nextTick(function () {
        let index = this.$store.state.readingBook.index || 0;
        let wrapper = this.$refs.cataData;
          let target = this.$refs.cata && this.$refs.cata[index];
          if (!target || !wrapper) return;
        jump(target, { container: wrapper, duration: 0 });
      });
    },
  },
  methods: {
    isSelected(index) {
      return index == this.$store.state.readingBook.index;
    },
    gotoChapter(note) {
      this.index = this.catalog.indexOf(note);
      this.$store.commit("setPopCataVisible", false);
      this.$store.commit("setContentLoading", true);
      this.$emit("getContent", this.index);
    },
  },
};
</script>

<style lang="stylus" scoped>
.cata-wrapper {
  margin: -16px;
  padding: 18px 0 24px 25px;

  // background: #ede7da url('../assets/imgs/themes/popup_1.png') repeat;
  .title {
    font-size: 18px;
    font-weight: 400;
    font-family: FZZCYSK;
    margin: 0 0 20px 0;
    color: #ed4259;
    width: fit-content;
    border-bottom: 1px solid #ed4259;
  }

  .data-wrapper {
    height: 300px;
    overflow: auto;

    .cata {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 16px;

      .selected {
        color: #EB4259;
      }

      .log {
        height: 40px;
        cursor: pointer;
        font: 16px / 40px PingFangSC-Regular, HelveticaNeue-Light, 'Helvetica Neue Light', 'Microsoft YaHei', sans-serif;

        .log-text {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .night {
    >>>.log {
      border-bottom: 1px solid #666;
      color: #b0b5bf;
    }
  }

  .day {
    >>>.log {
      border-bottom: 1px solid #f2f2f2;
    }
  }
}

@media screen and (max-width: 500px) {
  .cata-wrapper .data-wrapper .cata {
    grid-template-columns: 1fr;
  }
}

/* ---------- 弹层自适应：目录 ---------- */
.cata-wrapper {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 180px);
  padding: 18px 20px 24px;
}

.cata-wrapper .title {
  flex: none;
  margin-bottom: 14px;
}

.cata-wrapper .data-wrapper {
  flex: 1 1 auto;
  height: auto;
  min-height: 220px;
  max-height: 50vh;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.cata-wrapper .data-wrapper .cata {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  column-gap: 14px;
}

@media screen and (max-width: 750px) {
  .cata-wrapper {
    padding: 14px 14px 18px;
    max-height: calc(100vh - 150px);
  }

  .cata-wrapper .data-wrapper {
    min-height: 160px;
    max-height: 48vh;
  }
}

@media screen and (max-width: 500px) {
  .cata-wrapper .data-wrapper .cata {
    grid-template-columns: 1fr;
  }

  .cata-wrapper .data-wrapper {
    max-height: 45vh;
  }
}
</style>
