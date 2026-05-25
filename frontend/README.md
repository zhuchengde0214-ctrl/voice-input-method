# Frontend · 语音输入法 Web UI

零构建依赖的纯静态前端 — 直接用浏览器加载即可。

## 运行

```bash
# 任一静态服务器
npx http-server -p 3000 -c-1
# 或
python3 -m http.server 3000
```

打开 http://localhost:3000，授权麦克风后即可开始语音输入。

## 模块划分

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面骨架与可访问性属性 |
| `styles/main.css` | 主题 / 布局 / 录音状态视觉 |
| `js/recognizer.js` | 封装 Web Speech API 为 EventTarget |
| `js/api.js` | 后端 REST 客户端 |
| `js/app.js` | 编辑器、命令、热词、历史的 UI 编排 |

## 浏览器兼容性

依赖 `SpeechRecognition` / `webkitSpeechRecognition`。Chrome / Edge 完整支持；Firefox 暂不支持。
