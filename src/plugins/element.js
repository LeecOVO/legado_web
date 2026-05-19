import Vue from "vue";
import {
  Button,
  Dialog,
  Divider,
  MessageBox,
  Message,
  Breadcrumb,
  BreadcrumbItem,
  Table,
  Tooltip,
  TableColumn,
  Popover,
  Loading,
  Input,
  Tag,
  Upload,
  Pagination,
  Form,
  FormItem,
} from "element-ui";

Vue.use(Button);
Vue.use(Divider);
Vue.use(Breadcrumb);
Vue.use(BreadcrumbItem);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Popover);
Vue.use(Input);
Vue.use(Tag);
Vue.use(Tooltip);
Vue.use(Loading.directive);
Vue.use(Dialog);
Vue.use(Upload);
Vue.use(Pagination);
Vue.use(Form);
Vue.use(FormItem);

Vue.prototype.$msgbox = MessageBox;
Vue.prototype.$message = Message;
Vue.prototype.$alert = MessageBox.alert;
Vue.prototype.$confirm = MessageBox.confirm;
Vue.prototype.$prompt = MessageBox.prompt;
Vue.prototype.$loading = Loading.service;
