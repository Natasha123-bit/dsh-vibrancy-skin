# AGENTS.md — 在本仓库里干活前先读

## 这是什么

DSH Desktop 的**纯 CSS 注入插件**：没有构建步骤、没有依赖、不发网络请求，只是往桌面外壳里注入三张样式表
（外加一个设置页），把若干表面染成磨砂玻璃。仓库地址 `~/Documents/DSH-Projects/dsh-vibrancy-skin`
（2026-10-04 从 `~/Documents/DSH-Default/dsh-vibrancy-skin` 迁来，旧路径现为指向本仓库的软链）。

## 文件地图

| 文件 | 作用 |
| --- | --- |
| `client.js` | **唯一的真源码**：全部逻辑 + 三张样式表（sheet 1 基础层 / sheet 2 面板层 / sheet 3 深层玻璃） |
| `index.js` | 宿主侧插件入口（极小） |
| `package.json` | manifest：`dsh.client.platform` / `dsh.bundle.patch` / `exports["./client"]` / `version` |
| `cordis.patch.yml` | 插件管理器用的挂载补丁 |
| `smoke-test.mjs` | 纯静态断言（当前 112 条），改 `client.js` 必跑 |
| `verify.sh` | 活体安装核对（当前 **27** 项）：源码↔安装 md5、profile 挂载、宿主日志、sheet 完整性、版本号 |
| `rollback.sh` | 回滚辅助 |
| `README.md` | 设计不变量 + 逐条实证（§1.x 解释「为什么这样改」） |
| `STATE.md` | 逐版 delta / 实测记录 / 改过盘上哪些文件 |
| `CHANGELOG.md` | 版本时间线与**历史完整性声明** |
| `.backup/` | 真回滚点：v1.2.0 快照、v1.2.0 tar.gz、迁前整包快照、profile 侧文件备份 |

## 部署模型（别误改）

```
~/.dsh/profiles/desktop/node_modules/dsh-vibrancy-skin  →  软链  →  本仓库
~/.dsh/profiles/desktop/package.json  →  "dsh-vibrancy-skin": "link:<本仓库绝对路径>"
```

**改本仓库 = 改活体安装**：没有拷贝步骤，也没有第二份要同步的副本。用户 `Cmd+R` 后生效。
`verify.sh` 的第 1 节就是拿两边 md5 对撞来证明这一点。

## 硬规则

1. **绝不跑 `pnpm install`**（在 profile 里跑过一次并炸出 `ERR_PNPM_UNEXPECTED_STORE`）。挂载靠软链，不靠安装。
2. 改 `client.js` 后必须两条都绿：`node smoke-test.mjs`（112/112）与 `bash verify.sh`（27 项）；
   再确认 `md5 -q client.js` 与 `~/.dsh/profiles/desktop/node_modules/dsh-vibrancy-skin/client.js` 一致。
3. **禁止 `backdrop-filter`**：在透明 vibrancy 窗口上会变成灰雾（`verify.sh` 有专门断言，写了就红）。
4. 所有选择器必须挂在**门控 `<body>`** 的属性/类之下，并落在正确的 sheet；总开关必须能整张摘掉
   （smoke-test 校验作用域与 sheet 结构，`:is(a, b, c)` 这类选择器已被 `parseRules()` 括号感知解析处理）。
5. **不要声明 `peerDependencies`**：manifest 里一旦有 peer，就会被内核的插件兼容性校验纳入判定，
   内核升版可能导致**整个插件被拒绝加载**（比"样式失效"严重得多）。判定源码与逐包核对见 README §6。
6. 弹层不透明靠 sheet 1 的上游 token 快照 + `:is(dialog, [role="dialog"], [role="alertdialog"])` 规则；
   **不要**改成写死 `background`（挡掉换主题），也**不要**绑定某个第三方面板自己的作用域
   （第三方 DOM 位置会变，且在本插件作用域外是空操作）。
7. 版本号三处同步：`package.json` / `verify.sh` 第 8 节期望值 / README + STATE 的 delta 记录。
8. 动盘（profile 的 `package.json`、软链、日志）之前先备份，按 `rollback.sh` 的约定来。
9. 提交信息用 `vX.Y.Z: 摘要`；同一提交里同步更新 README（为什么）/ STATE（改了什么）/ CHANGELOG（什么时候）。
10. `verify.sh` 是**自定位**的（`SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"`），别把绝对路径写回去。

## 当前状态（2026-10-04）

- 版本 **v1.3.2**，`client.js` md5 `83db8447697538981563052b27dc951d`；git `main`，tag `v1.2.0` / `v1.3.2`，**无远端**。
- 环境：DSH Desktop **2.0.17** / `@deepseek-ai/dsh*` **0.2.0-rc.2**（本插件对 0.2.x 无需豁免，profile 里没有 `compatibility.json`）。
- **v1.3.2 验收通过（2026-10-04，用户确认）**：dsh-cost-meter「费用明细」面板实心可读、弹层不透明
  （README §5 那两条已改 `[x]`）。清单里仍剩 9 条 `[ ]`，属"顺手扫一眼"级别，不影响已达成效果。
- 计数基线（2026-10-04 实测校正）：`smoke-test.mjs` **112** 条、`verify.sh` **27** 项。
  此前写的 `verify.sh 25 项` 是 v1.3.2 **加那 2 条断言之前**的旧值，v1.3.2 起真实值一直是 27。
- 已知、**未动**的陈旧元数据：`.backup/LAST_BACKUP_TS` 仍写 `20260928-054614`（没反映 2026-10-04 迁前备份）；
  profile 侧 `pnpm-lock.yaml` / `node_modules/.pnpm/lock.yaml` / `.package-map.json` 仍写旧 `link:` 路径
  （故意不手改，见 STATE.md 迁移段）。
