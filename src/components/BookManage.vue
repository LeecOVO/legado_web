<template>
  <div>
    <!-- Main Dialog -->
    <el-dialog
      :visible.sync="dialogVisible"
      :width="miniInterface ? '94%' : '760px'"
      :top="miniInterface ? '2vh' : '6vh'"
      @opened="onOpened"
      @closed="onClosed"
    >
      <div slot="title" class="dialog-title">
        <i
          class="title-icon"
          :class="showRecycle ? 'el-icon-delete is-danger' : 'el-icon-collection'"
        ></i>
        <span class="title-text">{{ showRecycle ? '回收站' : '书籍管理' }}</span>
        <span class="title-count" v-if="!loading">
          {{ showRecycle ? recycleBooks.length : books.length }} 本
        </span>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <el-button
          v-if="!showRecycle"
          type="success"
          size="small"
          icon="el-icon-upload2"
          @click="uploadVisible = true"
        >
          上传TXT
        </el-button>
        <el-input
          v-model="searchText"
          size="small"
          placeholder="搜索书名或作者..."
          clearable
          prefix-icon="el-icon-search"
          class="search-input"
        />
      </div>

      <transition name="fade" mode="out-in">
        <div v-if="!showRecycle" key="books">
          <el-table
            :data="pagedBooks"
            size="small"
            stripe
            v-loading="loading"
            empty-text="书架空空如也，上传一本书开始阅读吧"
            style="width: 100%"
          >
            <el-table-column prop="name" label="书名" min-width="160">
              <template slot-scope="scope">
                <div class="book-name">
                  <img
                    v-if="scope.row.coverUrl"
                    :src="getCoverUrl(scope.row.coverUrl)"
                    class="cell-cover"
                    alt=""
                  />
                  <span class="book-name-text">{{ scope.row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column v-if="!miniInterface" prop="author" label="作者" min-width="110">
              <template slot-scope="scope">
                {{ scope.row.author || '未知' }}
              </template>
            </el-table-column>
            <el-table-column v-if="!miniInterface" prop="totalChapterNum" label="章节" width="80" align="center">
              <template slot-scope="scope">
                {{ scope.row.totalChapterNum || 0 }}章
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template slot-scope="scope">
                <el-button size="mini" type="primary" plain @click="openEdit(scope.row)">
                  编辑
                </el-button>
                <el-button size="mini" type="danger" plain @click="softDelete(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper" v-if="filteredBooks.length > pageSize">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="filteredBooks.length"
              :page-size="pageSize"
              :current-page.sync="currentPage"
              small
            />
          </div>
        </div>
        <div v-else key="recycle">
          <el-table
            :data="pagedRecycleBooks"
            size="small"
            stripe
            v-loading="loading"
            empty-text="回收站是空的"
            style="width: 100%"
          >
            <el-table-column prop="name" label="书名" min-width="160" />
            <el-table-column v-if="!miniInterface" prop="author" label="作者" min-width="110">
              <template slot-scope="scope">
                {{ scope.row.author || '未知' }}
              </template>
            </el-table-column>
            <el-table-column v-if="!miniInterface" label="删除时间" width="150">
              <template slot-scope="scope">
                {{ formatTime(scope.row.deletedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template slot-scope="scope">
                <el-button size="mini" type="success" plain @click="restoreBook(scope.row)">
                  恢复
                </el-button>
                <el-button size="mini" type="danger" plain @click="permanentDelete(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper" v-if="filteredRecycleBooks.length > pageSize">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="filteredRecycleBooks.length"
              :page-size="pageSize"
              :current-page.sync="currentPage"
              small
            />
          </div>
        </div>
      </transition>

      <!-- Footer Toggle -->
      <div class="footer-toggle" @click="toggleRecycle">
        <i
          class="toggle-icon"
          :class="showRecycle ? 'el-icon-collection' : 'el-icon-delete'"
        ></i>
        <span class="toggle-text">{{ showRecycle ? '返回书籍管理' : '回收站' }}</span>
      </div>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog
      :visible.sync="editVisible"
      title="编辑书籍"
      :width="miniInterface ? '92%' : '440px'"
      :top="miniInterface ? '6vh' : '10vh'"
      append-to-body
    >
      <el-form :model="editForm" label-width="60px" size="small">
        <el-form-item label="书名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="editForm.author" />
        </el-form-item>
        <el-form-item label="封面">
          <div class="cover-edit">
            <img
              v-if="editForm.coverUrl && !/^data:/.test(editForm.coverUrl)"
              :src="getCoverUrl(editForm.coverUrl)"
              class="cover-preview"
            />
            <div v-else-if="editForm.coverUrl" class="cover-preview cover-data">
              封面
            </div>
            <img v-else :src="defaultCover" class="cover-preview" />
            <el-upload
              action="#"
              accept="image/jpeg,image/png,image/gif,image/webp"
              :show-file-list="false"
              :http-request="uploadCoverRequest"
              :before-upload="beforeCoverUpload"
            >
              <el-button size="mini" type="primary" plain>上传封面</el-button>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="editVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveEdit">保存</el-button>
      </span>
    </el-dialog>

    <!-- Upload Dialog -->
    <el-dialog
      :visible.sync="uploadVisible"
      title="上传TXT文件"
      :width="miniInterface ? '92%' : '480px'"
      :top="miniInterface ? '6vh' : '10vh'"
      append-to-body
    >
      <el-upload
        ref="upload"
        class="upload-area"
        drag
        multiple
        accept=".txt"
        action="#"
        :auto-upload="false"
      >
        <i class="el-icon-upload" />
        <div class="el-upload__text">将TXT文件拖到此处，或<em>点击选择</em></div>
        <div class="el-upload__tip" slot="tip">支持同时选择多个 .txt 文件</div>
      </el-upload>
      <span slot="footer">
        <el-button size="small" @click="uploadVisible = false">取消</el-button>
        <el-button
          size="small"
          type="success"
          @click="submitUpload"
          :loading="uploading"
        >
          开始上传
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import ajax from "../plugins/ajax";
import noCover from "../assets/imgs/noCover.jpeg";

export default {
  name: "BookManage",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      noCover,
      showRecycle: false,
      books: [],
      recycleBooks: [],
      searchText: "",
      currentPage: 1,
      pageSize: 20,
      loading: false,
      editVisible: false,
      editForm: {
        bookUrl: "",
        name: "",
        author: "",
        coverUrl: "",
      },
      uploadVisible: false,
      uploading: false,
    };
  },
  computed: {
    miniInterface() {
      return this.$store.state.miniInterface;
    },
      defaultCover() {
        const settings = this.$store.state.bookshelfSettings;
        if (settings && settings.defaultCover === "custom" && settings.customCoverUrl) {
          return settings.customCoverUrl;
        }
        return noCover;
      },
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
    filteredBooks() {
      if (!this.searchText) return this.books;
      const s = this.searchText.toLowerCase();
      return this.books.filter(
        (b) =>
          (b.name || "").toLowerCase().includes(s) ||
          (b.author || "").toLowerCase().includes(s)
      );
    },
    filteredRecycleBooks() {
      if (!this.searchText) return this.recycleBooks;
      const s = this.searchText.toLowerCase();
      return this.recycleBooks.filter(
        (b) =>
          (b.name || "").toLowerCase().includes(s) ||
          (b.author || "").toLowerCase().includes(s)
      );
    },
    pagedBooks() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredBooks.slice(start, start + this.pageSize);
    },
    pagedRecycleBooks() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredRecycleBooks.slice(start, start + this.pageSize);
    },
  },
  methods: {
    onOpened() {
      this.fetchBooks();
    },
    onClosed() {
      this.$emit("close");
    },
    fetchBooks() {
      this.loading = true;
      ajax
        .get("/getBookshelf")
        .then((res) => {
          if (res.data.isSuccess) {
            this.books = res.data.data || [];
          } else {
            this.$message.error(res.data.errorMsg || "获取书籍列表失败");
          }
        })
        .catch(() => {
          this.$message.error("获取书籍列表失败");
        })
        .finally(() => {
          this.loading = false;
        });
    },
    fetchRecycleBooks() {
      ajax
        .get("/api/books/recycle")
        .then((res) => {
          if (res.data.isSuccess) {
            this.recycleBooks = res.data.data || [];
          } else {
            this.$message.error(res.data.errorMsg || "获取回收站列表失败");
          }
        })
        .catch(() => {
          this.$message.error("获取回收站列表失败");
        });
    },
    toggleRecycle() {
      this.showRecycle = !this.showRecycle;
      this.searchText = "";
      this.currentPage = 1;
      if (this.showRecycle) {
        this.fetchRecycleBooks();
      } else {
        this.fetchBooks();
      }
    },
    softDelete(book) {
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
                this.fetchBooks();
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
    permanentDelete(book) {
      this.$confirm(
        `确定要删除《${book.name}》吗？此操作不可恢复！`,
        "确认删除",
        { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" }
      )
        .then(() => {
          ajax
            .delete(
              `/api/books/permanent?bookUrl=${encodeURIComponent(book.bookUrl)}`
            )
            .then((res) => {
              if (res.data.isSuccess) {
                this.$message.success("已删除");
                this.fetchRecycleBooks();
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
    restoreBook(book) {
      this.$confirm(
        `确定要恢复《${book.name}》吗？`,
        "确认恢复",
        { confirmButtonText: "恢复", cancelButtonText: "取消", type: "info" }
      )
        .then(() => {
          ajax
            .post(
              `/api/books/recycle/restore?bookUrl=${encodeURIComponent(book.bookUrl)}`
            )
            .then((res) => {
              if (res.data.isSuccess) {
                this.$message.success("已恢复");
                this.fetchRecycleBooks();
              } else {
                this.$message.error(res.data.errorMsg || "恢复失败");
              }
            })
            .catch(() => {
              this.$message.error("恢复失败");
            });
        })
        .catch(() => {});
    },
    openEdit(book) {
      this.editForm = {
        bookUrl: book.bookUrl,
        name: book.name,
        author: book.author || "",
        coverUrl: book.coverUrl || "",
      };
      this.editVisible = true;
    },
    saveEdit() {
      ajax
        .put("/api/books", {
          bookUrl: this.editForm.bookUrl,
          name: this.editForm.name,
          author: this.editForm.author,
        })
        .then((res) => {
          if (res.data.isSuccess) {
            this.$message.success("修改成功");
            this.editVisible = false;
            this.fetchBooks();
            this.$emit("saved");
          } else {
            this.$message.error(res.data.errorMsg || "修改失败");
          }
        })
        .catch(() => {
          this.$message.error("修改失败");
        });
    },
    getCoverUrl(coverUrl) {
      if (!coverUrl) return this.defaultCover;
      if (/^data:/.test(coverUrl)) return coverUrl;
      const base = process.env.NODE_ENV !== "production" ? "" : "..";
      return `${base}/cover?path=${encodeURIComponent(coverUrl)}`;
    },
    beforeCoverUpload(file) {
      const isImage = /^image\/(jpeg|png|gif|webp)$/.test(file.type);
      if (!isImage) {
        this.$message.error("仅支持 jpg/png/gif/webp 格式");
        return false;
      }
      return true;
    },
    uploadCoverRequest(option) {
      const formData = new FormData();
      formData.append("bookUrl", this.editForm.bookUrl);
      formData.append("file", option.file);
      ajax
        .post("/api/books/cover", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          if (res.data.isSuccess && res.data.data) {
            this.editForm.coverUrl = res.data.data;
            this.$message.success("封面上传成功");
            option.onSuccess(res);
          } else {
            this.$message.error(res.data.errorMsg || "上传失败");
            option.onError(new Error(res.data.errorMsg || "上传失败"));
          }
        })
        .catch((err) => {
          this.$message.error("封面上传失败");
          option.onError(err);
        });
    },
    submitUpload() {
      const files = this.$refs.upload.uploadFiles;
      if (files.length === 0) {
        this.$message.warning("请选择文件");
        return;
      }
      this.uploading = true;
      const formData = new FormData();
      files.forEach((f) => {
        formData.append("files", f.raw);
      });
      ajax
        .post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          if (res.data.isSuccess) {
            this.$message.success(res.data.data || "上传成功");
            this.uploadVisible = false;
            this.$refs.upload.clearFiles();
            this.fetchBooks();
          } else {
            this.$message.error(res.data.errorMsg || "上传失败");
          }
        })
        .catch(() => {
          this.$message.error("上传失败");
        })
        .finally(() => {
          this.uploading = false;
        });
    },
    formatTime(ts) {
      if (!ts || ts === 0) return "未知";
      const d = new Date(ts);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },
  },
  watch: {
    searchText() {
      this.currentPage = 1;
    },
    visible(val) {
      if (!val) {
        this.showRecycle = false;
        this.searchText = '';
        this.currentPage = 1;
      }
    },
  },
};
</script>

<style lang="stylus" scoped>
>>> .el-dialog__header {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

>>> .el-dialog__footer {
  padding-top: 14px;
}

>>> .el-button {
  border-radius: 6px;
  transition: all 0.2s ease;
}

.dialog-title {
  display: flex;
  align-items: center;

  .title-icon {
    margin-right: 8px;
    font-size: 18px;
    color: var(--accent);

    &.is-danger { color: var(--danger); }
  }
  .title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-1);
  }
  .title-count {
    margin-left: 10px;
    font-size: 12px;
    font-weight: 400;
    color: var(--text-3);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 1px 10px;
  }
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  .search-input { flex: 1; max-width: 300px; }
}

.book-name {
  display: flex;
  align-items: center;

  .cell-cover {
    width: 26px;
    height: 34px;
    border-radius: 3px;
    object-fit: cover;
    margin-right: 10px;
    flex: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  }
  .book-name-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.footer-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 12px;
  margin-top: 14px;
  border-top: 1px solid var(--border);
  cursor: pointer;
  user-select: none;
  color: var(--text-2);
  transition: color 0.25s ease;
  &:hover { color: var(--accent); }
  .toggle-icon {
    font-size: 15px;
    margin-right: 6px;
  }
  .toggle-text {
    font-size: 13px;
  }
}

.cover-edit {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  .cover-preview {
    width: 60px;
    height: 80px;
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  }
  .cover-data {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: var(--text-3);
    background: var(--surface-2);
  }
}

.upload-area {
  >>> .el-upload-dragger { width: 100%; }
  >>> .el-icon-upload { color: var(--text-3); }
}

@media screen and (max-width: 750px) {
  .toolbar {
    flex-direction: column;
    gap: 8px;
    .search-input { max-width: 100%; }
  }

  .dialog-title .title-text { font-size: 15px; }
}
</style>

<style lang="stylus">
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
