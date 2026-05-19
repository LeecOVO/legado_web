<template>
  <div>
    <!-- Main Dialog -->
    <el-dialog
      :visible.sync="dialogVisible"
      width="720px"
      top="6vh"
      :close-on-click-modal="false"
      @opened="onOpened"
    >
      <div slot="title" class="dialog-title">
        <span :class="showRecycle ? 'title-recycle' : 'title-manage'">
          {{ showRecycle ? '🗑️ 回收站' : '📚 书籍管理' }}
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

      <!-- Normal Book Table -->
      <el-table
        v-if="!showRecycle"
        :data="pagedBooks"
        size="small"
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="name" label="书名" min-width="160" />
        <el-table-column prop="author" label="作者" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.author || '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalChapterNum" label="章节" width="80" align="center">
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

      <!-- Recycle Bin Table -->
      <el-table
        v-else
        :data="pagedRecycleBooks"
        size="small"
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="name" label="书名" min-width="160" />
        <el-table-column prop="author" label="作者" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.author || '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="删除时间" width="150">
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
              彻底删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="showRecycle ? filteredRecycleBooks.length : filteredBooks.length"
          :page-size="pageSize"
          :current-page.sync="currentPage"
          small
        />
      </div>

      <!-- Footer Toggle -->
      <div class="footer-toggle" @click="toggleRecycle">
        <span class="toggle-icon">{{ showRecycle ? '📚' : '🗑️' }}</span>
        <span class="toggle-text">{{ showRecycle ? '返回书籍管理' : '回收站' }}</span>
      </div>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog
      :visible.sync="editVisible"
      title="编辑书籍"
      width="440px"
      top="10vh"
      append-to-body
    >
      <el-form :model="editForm" label-width="70px" size="small">
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
            <div v-else class="cover-preview cover-empty">无封面</div>
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
      width="480px"
      top="10vh"
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
        `确定要彻底删除《${book.name}》吗？此操作不可恢复！`,
        "确认彻底删除",
        { confirmButtonText: "彻底删除", cancelButtonText: "取消", type: "warning" }
      )
        .then(() => {
          ajax
            .delete(
              `/api/books/permanent?bookUrl=${encodeURIComponent(book.bookUrl)}`
            )
            .then((res) => {
              if (res.data.isSuccess) {
                this.$message.success("已彻底删除");
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
          } else {
            this.$message.error(res.data.errorMsg || "修改失败");
          }
        })
        .catch(() => {
          this.$message.error("修改失败");
        });
    },
    getCoverUrl(coverUrl) {
      const base =
        process.env.NODE_ENV !== "production"
          ? `${process.env.VUE_APP_BASE_URL}:${process.env.VUE_APP_PORT}`
          : "..";
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
.dialog-title {
  .title-manage { color: #409EFF; }
  .title-recycle { color: #F56C6C; }
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  .search-input { flex: 1; max-width: 300px; }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.footer-toggle {
  text-align: center;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #EBEEF5;
  cursor: pointer;
  user-select: none;
  &:hover { opacity: 0.7; }
  .toggle-icon { font-size: 18px; }
  .toggle-text {
    font-size: 12px;
    color: #909399;
    margin-left: 4px;
  }
}

.cover-edit {
  display: flex;
  align-items: center;
  gap: 12px;
  .cover-preview {
    width: 60px;
    height: 80px;
    border-radius: 4px;
    object-fit: cover;
    border: 1px solid #EBEEF5;
  }
  .cover-empty, .cover-data {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #C0C4CC;
    background: #F5F7FA;
  }
}

.upload-area {
  >>> .el-upload-dragger { width: 100%; }
}
</style>
