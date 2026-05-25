# 贡献指南

## 提交规范（Conventional Commits）

```
<type>(<scope>): <subject>

<body 解释 *为什么*>
```

`type`：`feat | fix | chore | docs | test | refactor | perf | style | ci`

例：

```
feat(backend): add hotword alias replacement to enhancer

Substring matches inside CJK text need no boundary handling, but ASCII
fillers like "er" otherwise swallow letters inside real words such as
"Kubernetes". Anchor ASCII fillers on \b boundaries to fix.
```

## 分支策略

- 主分支：`main`，保护、只接受 PR
- 功能分支：`feat/<scope>`、`fix/<scope>`、`docs/<scope>`
- 合并方式：`--no-ff`（保留分支拓扑，便于 review 与 revert）

## 开发流程

1. 从 `main` 切分支：`git checkout -b feat/<feature>`
2. 编写代码 + 测试
3. 跑测试：`cd backend && npm test`
4. 提交（每次 commit 解释一个独立的变更原因）
5. 推送并提交 PR
6. PR 合并后立刻删除分支

## 代码风格

- JavaScript：默认 2 空格缩进；模块用 ES Module 风格（前端）或 CommonJS（后端，Node 兼容性最佳）。
- 不写无意义注释。注释只解释**为什么**或**约束**。
