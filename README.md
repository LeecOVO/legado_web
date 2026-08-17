vue3版本 https://github.com/gedoor/legado/tree/master/modules/web
***
# 「阅读3.0」 web 端（已打包进阅读3.0，不能设置IP）

> 项目仓库：https://github.com/LeecOVO/legado_web

本程序为「阅读3.0」的配套 web 端，需要保证手机和电脑在同一局域网内，然后手机端打开 web 服务。

~~在线地址 http://alanskycn.gitee.io/vip/reader/~~

## 具体实现

使用 Vue2 开发

## 功能特性

- 本地存储阅读记录与设置
- 阅读主题切换
- 夜间模式 / 深色模式（跟随系统或手动切换）
- OLED 纯黑阅读主题（100% 纯黑背景，呵护 OLED 屏幕）
- 阅读字体颜色自定义
- 字号调节
- 字体调节
- 阅读宽度调节
- 移动端 / iOS Safari（浏览器 App 模式）适配

## 使用方法

> node版本大于17，先[设置环境变量NODE_OPTIONS](https://github.com/webpack/webpack/issues/14532)
> ```bash
> export NODE_OPTIONS=--openssl-legacy-provider
> ```
```shell
yarn install
#安装项目
yarn serve
#开发模式
yarn build
#打包
yarn lint
#格式化代码
```
 - 调试时修改 `.env.development` 里的 `VUE_APP_BACKEND_TARGET` 指向后端地址（默认 `http://192.168.1.38:1122`）。
 - 前端统一使用相对路径请求，开发模式下由 `vue.config.js` 的 `devServer.proxy` 转发到后端，
   因此手机/其他设备访问开发服务器时不会错误地请求 `localhost`。

## 预览

![](imgs/1.jpg)
![](imgs/2.jpg)
![](imgs/3.jpg)
![](imgs/4.jpg)
