网络安全学习代码库
本代码库主要包含模拟 Yakit API 的实现，专注于网络安全相关的功能开发。目前仅提供了 API 部分，其余相关模块和功能已拆分至其他仓库中。

模块内日志使用 `logtap`   启用日志 `@24wings/core` 或者某个模块 `['@24wings/core','fuzz']`

```js
    await configure({
      sinks: { console: getConsoleSink() },
      loggers: [
    
        { category: ['core','fuzz'], lowestLevel: "debug", sinks: ["console"] },
      ],
    });
```