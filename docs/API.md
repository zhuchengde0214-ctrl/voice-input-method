# API 参考

Base URL: `http://localhost:3001`

所有 POST 请求体均为 JSON，响应同样为 JSON。错误响应统一格式：`{ "error": "<message>" }`。

---

## `GET /api/health`

健康探针。

**Response 200**
```json
{ "status": "ok", "timestamp": "2026-05-25T02:42:11.128Z" }
```

---

## `POST /api/enhance`

对一段文本做后处理：去口头禅、数字归一化、标点关键词替换、热词别名替换、自动收尾标点。

**Request**
```json
{
  "text": "嗯今天是二零二六年逗号天气真好",
  "hotwords": [
    { "term": "Kubernetes", "aliases": ["k8s", "K8S"] }
  ],
  "options": {
    "removeFillers": true,
    "normalizeNumbers": true,
    "autoPunctuation": true
  }
}
```

**Response 200**
```json
{
  "original": "嗯今天是二零二六年逗号天气真好",
  "enhanced": "今天是2026年，天气真好。"
}
```

**Errors**
- `400` — `text` 缺失或非字符串。

---

## `POST /api/command`

判断一段文本是否是预设的语音命令。返回结构化动作让前端执行。

**Request**
```json
{ "text": "换行" }
```

**Response 200**
```json
{ "command": { "action": "NEWLINE", "matched": "换行" } }
```

未匹配到命令时：
```json
{ "command": null }
```

**支持的 action**

| action | 触发词（部分） |
| --- | --- |
| `BACKSPACE` | 删除 / 退格 / delete / backspace |
| `NEWLINE` | 换行 / 回车 / enter |
| `SPACE` | 空格 / space |
| `CLEAR` | 清空 / 全部删除 / clear |
| `SELECT_ALL` | 全选 / select all |
| `UNDO` / `REDO` | 撤销 / 重做 |
| `COPY` | 复制 / copy |
| `STOP` | 停止 / 停止录音 |

---

## `/api/hotwords`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/api/hotwords` | 列出所有热词 |
| POST | `/api/hotwords` | 创建热词 `{ term, aliases?: string[] }` |
| DELETE | `/api/hotwords/:id` | 删除单条 |
| DELETE | `/api/hotwords` | 清空全部 |

---

## `/api/history`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/api/history` | 列出最近 200 条转写 |
| POST | `/api/history` | 保存一条 `{ text }` |
| DELETE | `/api/history/:id` | 删除单条 |
| DELETE | `/api/history` | 清空全部 |

---

## 速率与大小限制

- 请求体 ≤ 256 KB
- 历史记录服务端最多保留 200 条，自动滚动覆盖
