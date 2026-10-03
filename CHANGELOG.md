# Changelog — dsh-vibrancy-skin

只记「发生了什么 / 什么时候 / 当时的证据」。**为什么这么改**见 `README.md`，**逐版增量与实测**见 `STATE.md`。

## 历史完整性声明（先读这条）

本仓库 2026-10-04 由 `~/Documents/DSH-Default/dsh-vibrancy-skin` 迁出。迁移前该目录**不是** git 仓库；
全盘 `find /Users/leixiaokang -name "dsh-vibrancy-skin*"` 只找到三处：活体源码目录、目标空目录、profile 软链。
因此版本历史的留存情况如下——**不要假装中间版本存在**：

| 版本 | 源码是否留存 | 处理 |
| --- | --- | --- |
| v1.1.0 | ✗ | 只在 README/STATE 里留有文字记录 |
| **v1.2.0** | ✓ | `.backup/v1.2.0-20260928-054614/` + 同名 tar.gz → 本仓库 **commit #1**，打 tag `v1.2.0` |
| v1.3.0 | ✗ | 不可复原，**不打 tag** |
| v1.3.1 | ✗ | 不可复原，**不打 tag** |
| **v1.3.2** | ✓ | 当前 HEAD，打 tag `v1.3.2` |

**不按文档"重建" v1.3.0 / v1.3.1**：重建物与当时实际运行的代码不是同一个东西，写进历史会污染「能回滚」的语义。
它们是本仓库建立之前就存在的缺口，不是迁移造成的；迁移唯一新增的好处是 **v1.2.0 之后的每一版都会真正留痕**。

---

## 2026-10-04 — 仓库化迁移（未改版本号）

- 源码 + 文档 + `.backup/` 迁至 `~/Documents/DSH-Projects/dsh-vibrancy-skin`；`git init -b main`。
- 活体挂载重指：`~/.dsh/profiles/desktop/node_modules/dsh-vibrancy-skin` 软链 → 新路径；
  profile `package.json` 的 `dependencies` 由 `link:…/DSH-Default/dsh-vibrancy-skin`
  改为 `link:…/DSH-Projects/dsh-vibrancy-skin`（`dsh.profile.bundles` 名单不变）。
- 旧目录 `~/Documents/DSH-Default/dsh-vibrancy-skin` 保留为**指向新路径的软链**，老引用与老会话里的绝对路径仍可用。
- `verify.sh` 去掉写死的 `SRC=` 绝对路径，改为自定位（`SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"`）。
- 修掉一个回滚点陷阱：`.backup/installed-v1.2.0-20260928-054614` 原本是指向**活体安装目录**的软链
  （改名像回滚点，实际不是）。仓库内改为指向同目录的 `v1.2.0-20260928-054614/` 真快照；按 `.gitignore` 不入库。
- 新增迁前整包快照 `.backup/dsh-vibrancy-skin-pre-migration-v1.3.2-20261004-033509.tar.gz`
  与 profile 侧原文件 `.backup/profile-20261004-033509/{package.json,cordis.patch.yml}`。
- **插件代码一行未改**：`client.js` md5 迁移前后均为 `83db8447697538981563052b27dc951d`；
  `node smoke-test.mjs` 112/112、`bash verify.sh` 25 项全绿（切换挂载后复跑）。

## v1.3.2 — 2026-10-02 23:57 (+0800)

**fix:** `dsh-cost-meter`「本会话费用明细」面板整页透明到没法看。

- 症状：打开该面板后整页变透明，背后会话正文和面板数字叠在一起；关掉 better-sidebar 的两个开关也一样。
- 根因（代码取证）：`dsh-cost-meter@1.8.6` 把入口按钮与面板放在**同一个 React fragment** 里，面板是普通 DOM 中的
  `<dialog>`（没有 portal；`showModal()` 只提升 top layer，不改变 CSS 继承），并以行内样式
  `background: var(--dsw-alias-bg-base,#fff)` 取底色——而这个 token 正被本插件的 tint 重定向。
- 修法：sheet 1 在门控 `<body>` 上快照上游原值
  （`--dsh-vib-bg-base-solid: var(--dsw-alias-bg-base)`、`--dsh-vib-bg-layer-1-solid: var(--dsw-alias-bg-layer-1)`），
  再对弹层还原：`body[…gate…] :is(dialog, [role="dialog"], [role="alertdialog"])` → 两个 token 恢复上游值。
  刻意**不**写死 `background`、**不**绑定单个第三方面板的作用域（见 README §1.2 的三条取舍）。
- 门禁：`smoke-test.mjs` **112/112**（新增 3 条断言）、`verify.sh` **25 项全绿**（新增 2 条断言）。
- 文档：README 新增 §1.2（弹层为什么不透明）与 §6（插件兼容性校验：desktop 2.0.17 / dsh 0.2.0-rc.2；
  本插件**刻意不声明 `peerDependencies`**，理由见该节）。

## v1.3.1 — 2026-09-28 06:12，06:20 拆掉诊断探针（源码不可复原）

**fix:** 可见的侧栏其实由**应用自己的 dockkit dock** 绘制，不在插件宿主的子树里。

- 症状（v1.3.0 之后）：两个侧栏开关都打开，只有上部菜单变磨砂，侧栏本身依旧不透明。
- 修法：补三个锚点（`[data-dsh-better-sidebar]`、`dshDesktopRightbarSurface[data-rightbar-col]`、
  `[data-dockkit-host="dock"]`）并用 `[class*="_tabHost_"]` 显式钉住 dock tab host 的底色；随后把临时诊断探针
  （`/tmp/dsh-probe-server.py` 及采集进程）整体拆除。
- 门禁：当时 `smoke-test.mjs` 109/109。

## v1.3.0 — 2026-09-28 05:47（源码不可复原）

**feat:** 磨砂第三方侧栏，两个独立开关（侧边栏面板磨砂 默认开 / 深层玻璃 默认关）。

- 遗留问题：只给"插件宿主子树"染色，可见侧栏仍不透明 → 由 v1.3.1 修。

## v1.2.0 — 2026-09-28 04:14（源码已留存，已打 tag）

**feat:** 设置页整合——设置里出现「磨砂玻璃 / Vibrancy」页（与内置 Desktop 页同级）。

- 回滚点：`.backup/v1.2.0-20260928-054614/`（9 文件）与 `.backup/dsh-vibrancy-skin-v1.2.0-20260928-054614.tar.gz`。

## v1.1.0 — 2026-09-28（源码未留存）

基础磨砂（标题栏/字幕栏染色）与设计不变量（纯 CSS 注入、不引入 `backdrop-filter`、总开关可整张摘掉）成型。
v1.1.0 / v1.2.0 时期的基础磨砂效果已由用户确认。

---

## 版本号约定

`package.json` 的 `version` 是唯一版本源，另外两处必须同步（否则门禁红）：
`verify.sh` 第 8 节的期望值、README/STATE 里的 delta 记录。
