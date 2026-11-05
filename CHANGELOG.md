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
| **v1.3.2** | ✓ | 打 tag `v1.3.2` |
| **v1.4.0** | ✓ | DSH NEXT 适配；未打 tag |
| **v1.5.0** | ✓ | 背景图磨砂 |
| **v1.5.1** | ✓ | 当前 HEAD（磨砂度 + 行内代码半透明）|

**不按文档"重建" v1.3.0 / v1.3.1**：重建物与当时实际运行的代码不是同一个东西，写进历史会污染「能回滚」的语义。
它们是本仓库建立之前就存在的缺口，不是迁移造成的；迁移唯一新增的好处是 **v1.2.0 之后的每一版都会真正留痕**。

---

## 2026-11-06 — v1.5.0：背景图磨砂（透到壁纸 / 透到桌面）

- **触发**：用户要求「给皮肤插件加上上传图片功能，以获得带背景毛玻璃的效果
  （可选择是透到壁纸还是透到桌面）」。语义确认为：壁纸 = 上传图铺满整窗做玻璃底图；
  桌面 = 不铺图、透真实桌面（v1.4.0 现状）。
- **为什么只能页面内做**：宿主进程（`app.asar/lib/host.js`）是独立 Node，无 `BrowserWindow`；
  preload 只暴露读材质的 `dsh-next:material`；窗口创建时 `vibrancy:"sidebar"` 写死。
  改系统壁纸属系统级副作用，不做。
- **改动**：新增第 4 张样式表（`body::before` 全屏装饰层，`inset:-64px`、`z-index:-1`、
  `pointer-events:none`、`filter:blur(36px)`、底图走内联变量 `--dsh-vib-bg-image`）；
  上传 → `createImageBitmap` → canvas 长边 2048 → WebP 0.9 → IndexedDB（db `dsh-vibrancy-skin` /
  store `bg` / 记录 `image`）；新增 `setBgMode` / `setBgImage` / `clearBgImage` / `restoreBgImage`；
  设置页新增「背景图」组（两张模式卡片 + 预览 + 选择/更换/移除，zh/en 各 14 条文案）。
  `client.js` 889 → 1364 行，只动 `client.js`。
- **验收**：`node smoke-test.mjs` **168 ✓ / 0 ✗**；`bash verify.sh` **36 ✓ / 0 ✗**；
  `node visual-bg.mjs` 出样张 `/tmp/dsh-bg-preview.png`（无灰雾、无硬边）。
  窗口内观感待用户 `Cmd+R` 目视确认。版本号三处同步（`package.json` / `verify.sh` §8 / 文档）。
- **未改**：无 `backdrop-filter`、无 `peerDependencies`、不碰第三方插件、无网络请求。

## 2026-11-06 — v1.5.1：磨砂度滑杆 + 行内代码半透明

- **触发**：用户 v1.5.0 验收通过后提两条：「新增一个磨砂程度的调节…最高变成纯雾面，最低变成纯透明」；
  「字符块能否也做成透明磨砂的…在使用浅色壁纸的时候不那么突兀」。
- **磨砂度**：第 4 张表 `filter:blur(36px)` → `blur(var(--dsh-vib-frost, 36px))`；新增 `frost`
  状态（localStorage `:frost`，默认 36，0–100 整数，clamp/round、非法忽略、默认值不落盘），
  `applyFrostInline()` 写 `--dsh-vib-frost`，`setFrost()` / `getState().frost` / `resetAll` 复位。
  设置页第 6 组（强度与微调之间）：0–100 滑杆 + `${n}px` + 恢复默认；「透到桌面」模式 disabled
  并说明（模糊由 macOS 材质固定，CSS 改不了，不拿雾面罩假装）。
- **行内代码**：上游 `--dsw-alias-markdown-inline-code` 是实色（浅 `neutral-50` / 深 `neutral-800`）；
  在门控作用域内改为 `color-mix(in srgb, var(--dsw-alias-markdown-inline-code, #808080) 45%, transparent)`，
  只改背景色，保留细边框；围栏代码块不动。
- **验收**：`node smoke-test.mjs` **204 ✓ / 0 ✗**（+36）；`bash verify.sh` **42 ✓ / 0 ✗**（+6，§8 期望 1.5.1）；
  `node visual-bg.mjs` 出 0/36/100 三张 1280×800 样张（无灰雾/硬边）。窗口观感待用户 `Cmd+R` 目视。
  `client.js` 1364 → 1476 行，md5 `7ee155e1194ef5422b57cd6d8d96489d`。
- **未改**：无 `backdrop-filter`、无 `peerDependencies`、无网络请求、不动布局属性。

## 2026-10-28 — v1.4.0：适配 DSH NEXT（2.0.20-next / `@deepseek-ai/dsh` 0.2.1-rc.3）

- **触发**：用户报告"dsh 发生更新了，现在皮肤插件已经失效"，要求适配本机的 DSH NEXT。
- **根因**：`2.0.20-next` 把窗口材质门控从 `<body data-dsh-desktop-*>` 搬到
  `<html data-platform data-next-material>`（`lib/preload-app.cjs`），并整体换了外壳 DOM
  （`.dshDesktopConversationSurface` / `.dshDesktopRightbarSurface` / `.dshDesktopMacCaptionRow`
  在 app.asar 里 **0 命中**）→ v1.3.2 的全部选择器一次性失配。
- **改动**：门控换到 `html[data-platform="darwin"][data-next-material="transparent"]`；
  中栏 / 底栏 / 右栏锚点改到 AppFrame 的 `_centerCol` / `_bottomRow` / `_rightbarCol`
  （只锚稳定局部名，不锚哈希前缀）；删掉已不存在的标题条规则；弹层快照改为直取静态调色板；
  设置页的 `active` 判定与控制台日志改读 `<html>`；`verify.sh` 第 6 节改读
  `~/.dsh/logs/desktop-next.log`（新日志用 ISO-8601 UTC 时间戳，旧的时间过滤不再适用）。
- **验收**：`node smoke-test.mjs` **117/117**；`bash verify.sh` **29 ✓ / 0 ✗**；
  窗口观感待用户 `Cmd+R` 目视确认。版本号三处同步（`package.json` / `verify.sh` / 本文）。
- **未改**：无 `peerDependencies`、无 `backdrop-filter`、第三方插件文件一个字节没碰。

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
  `node smoke-test.mjs` 112/112、`bash verify.sh` 27 项全绿（切换挂载后复跑；2026-10-04 校正，当时误记 25）。

## 2026-10-04 — 用户验收通过 + 文档计量校正（未改版本号、未改插件代码）

- **v1.3.2 验收通过（用户确认）**：`Cmd+R` 后 dsh-cost-meter「费用明细」面板实心可读、弹层不透明。
  README §5「弹层可读性」那两行由 `[ ]` 改 `[x]`；清单里其余 9 条 `[ ]` 仍是"顺手扫一眼"级别，不影响已达成效果。
- **计数漂移校正**：`bash verify.sh` 的真实项数是 **27**（§1 4 + §2 2 + §3 1 + §4 2 + §5 3 + §6 4 + §8 11），
  文档里写的 `verify.sh 25 项` 一律改正（AGENTS.md 两处、STATE.md 两处、本文件两处）。
  取证：`.backup/dsh-vibrancy-skin-pre-migration-v1.3.2-20261004-033509.tar.gz` 内的 `verify.sh`
  与当前逐检查项一致（只多一行自定位注释）→ **27 从 v1.3.2 部署起就成立**；25 是 v1.3.2 **加那 2 条断言之前**的旧值，当时忘记 +2。
- **路径校正**：旧目录实际在 `~/Documents/DSH-Default/.dsh-vibrancy-skin-old-20261004-033509`（同一父目录下的隐藏目录）。
- 顺手发现、**未动**（留作待办）：`.backup/LAST_BACKUP_TS` 仍写 `20260928-054614`，没反映 2026-10-04 的迁前备份。

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
- 门禁：`smoke-test.mjs` **112/112**（新增 3 条断言）、`verify.sh` **27 项全绿**（新增 2 条断言；
  2026-10-04 校正，原记「25 项」是漏加这 2 条的旧值，见上方 2026-10-04 一节）。
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
