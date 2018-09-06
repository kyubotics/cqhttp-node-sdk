# CQHttp Node SDK

[![License](https://img.shields.io/npm/l/cqhttp.svg)](LICENSE)
[![NPM](https://img.shields.io/npm/v/cqhttp.svg)](https://www.npmjs.com/package/cqhttp)
[![NPM Downloads](https://img.shields.io/npm/dt/cqhttp.svg)](https://www.npmjs.com/package/cqhttp)

本项目为酷 Q 的 CoolQ HTTP API 插件的 Node SDK，封装了 web server 相关的代码，让使用 Node.js 的开发者能方便地开发插件。仅支持插件 3.0.0 或更新版本。

关于 CoolQ HTTP API 插件，见 [richardchien/coolq-http-api](https://github.com/richardchien/coolq-http-api)。

## 用法

首先安装 `cqhttp` 模块：

```bash
npm install --save cqhttp
```

然后在程序中使用：

```es6
const CQHttp = require('cqhttp');

const bot = new CQHttp({
    apiRoot: 'http://127.0.0.1:5700/',
    accessToken: '123',
    secret: 'abc'
});

bot.on('message', context => {
    bot('send_msg', {
        ...context,
        message: '哈喽～'
    });
});

bot.listen(8080, '127.0.0.1');
```

更详细的示例请参考 [`demo.js`](demo.js)。

### 创建实例

首先创建 `CQHttp` 类的实例，传入 `apiRoot`，即为酷 Q HTTP API 插件的监听地址，如果你不需要调用 API，也可以不传入。Access token 和签名密钥也在这里传入，如果没有配置 `access_token` 或 `secret` 项，则不传。

### 事件处理

`on()` 方法用于添加对应上报类型（`post_type`）的回调函数，目前有三个上报类型 `message`、`event`（插件 v3.x）、`notice`（插件 v4.x）、`request`，一个上报类型可以有多个回调，收到上报时按添加顺序来调用。

回调函数接受一个参数 `context`，即为上报的数据，具体数据内容见 [事件上报](https://richardchien.github.io/coolq-http-api/#/Post)。

函数可以不返回值，也可以返回一个对象，会被自动作为 JSON 响应返回给 HTTP API 插件，具体见 [上报请求的响应数据格式](https://richardchien.github.io/coolq-http-api/#/Post?id=%E4%B8%8A%E6%8A%A5%E8%AF%B7%E6%B1%82%E7%9A%84%E5%93%8D%E5%BA%94%E6%95%B0%E6%8D%AE%E6%A0%BC%E5%BC%8F)。如果同一个上报类型添加了多个回调，只有最后一个有返回值的回调的返回值会被返回给插件。

### API 调用

在设置了 `api_root` 的情况下，直接在 `CQHttp` 类的实例上就可以调用 API，第一个参数为要调用的接口（或者称为 action），第二个可选参数为一个对象用于传入参数，例如 `bot('send_private_msg', { user_id: 123456, message: 'hello' })`，这里的 `send_private_msg` 即为 [`/send_private_msg` 发送私聊消息](https://richardchien.github.io/coolq-http-api/#/API?id=send_private_msg-%E5%8F%91%E9%80%81%E7%A7%81%E8%81%8A%E6%B6%88%E6%81%AF) 中的 `/send_private_msg`。其它 API 见 [API 描述](https://richardchien.github.io/coolq-http-api/#/API)。

每个 API 调用最后都会由 `axios` 库来发出请求，如果网络无法连接，它可能会抛出一个异常，见 [Handling Errors](https://github.com/axios/axios#handling-errors)。而一旦请求成功，本 SDK 会判断 HTTP 响应状态码，只有当状态码为 200，且 `status` 字段为 `ok` 或 `async` 时，会返回 `data` 字段的内容，否则也抛出一个异常（是一个简单对象），在这个异常中你可以通过 `status` 和 `retcode` 属性来获取 HTTP 状态码和插件的 `retcode`（如果状态码不为 200，则 `retcode` 为 undefined），具体响应状态码和 `retcode` 的含义，见 [响应说明](https://richardchien.github.io/coolq-http-api/#/API?id=%E5%93%8D%E5%BA%94%E8%AF%B4%E6%98%8E)。

### 运行实例

使用装饰器定义好处理函数之后，调用 `bot.listen()` 即可运行。这个方法第一个参数为监听端口，第二个参数为监听的 host，来指定服务端需要运行在哪个地址，然后在 HTTP API 插件的配置文件中，在 `post_url` 项中配置此地址（`http://host:port/`）。

## 遇到问题

本 SDK 的代码非常简单，如果发现有问题可以参考下源码，可以自行做一些修复，也欢迎提交 pull request 或 issue。
