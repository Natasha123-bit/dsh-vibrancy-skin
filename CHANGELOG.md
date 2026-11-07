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
| **v1.5.1** | ✓ | 磨砂度 + 行内代码半透明 |
| **v1.5.2** | ✓ | 五处表面半透明 |
| **v1.6.0** | ✓ | 详情（官方客户端适配：门控放宽） |
| **v1.6.1** | ✓ | 当前 HEAD（官方客户端设置页：自带 settings fallback） |

**不按文档"重建" v1.3.0 / v1.3.1**：重建物与当时实际运行的代码不是同一个东西，写进历史会污染「能回滚」的语义。
它们是本仓库建立之前就存在的缺口，不是迁移造成的；迁移唯一新增的好处是 **v1.2.0 之后的每一版都会真正留痕**。

---

## 2026-11-07 — 市场收录准备（awesome-dsh-plugin / category: theme）

- **触发**：用户要求直接做插件上架（DSH 插件市场）的准备。
- **改动（只动元数据，`client.js` / 四张样式表零改动）**：新增 MIT `LICENSE`；`package.json` 补
  `license` / `author` / `repository` / `homepage` / `bugs` / `keywords`；新增 `market/awesome-entry.yml`
  （投稿 awesome-dsh-plugin 的 `data/plugins/Natasha123-bit__dsh-vibrancy-skin.yml` 草稿，category `theme`）；
  GitHub 仓库加 `dsh-plugin` topic。
- **收录条件核对**：`dsh.bundle.patch` 已有（可安装）；仓库 2026-11-05 创建、已满 1 天；topic 已加；
  描述只陈述功能、不带营销词；插件 macOS 专属，条目描述已写明。
- **验收**：`node smoke-test.mjs` **230/230**；`bash verify.sh` **69 ✓ / 0 ✗**；`npm pack --dry-run`
  6 个文件（新增 LICENSE，47.8 kB）。
- **已 push**：`42e209d`（`6823019..42e209d`），pull request 尚未提交（等用户审核）。
- **2026-11-07 晚 · 市场素材**：新增 `assets/screenshots/conversation.png` 与
  `assets/screenshots/settings.png`（2560x1650，侧栏折叠 / 设置页，界面内无账号名、余额、路径等个人信息）；
  仓库根新增 `screenshots.json`（2 条相对路径，符合 1–8 张规范）。
- **图标回调**：先用 `generate_image` 生成了一版图标并写进条目 `icon` 字段，用户看后否决（「好丑，不要图标」），
  已删除 `assets/icon*.png` 与条目 `icon` 字段；市场将回退到作者头像。
- **未做**：没开 PR；没 npm publish（本机 npm 未登录，`npm whoami` 报 need auth）；`client.js` md5 仍为
  `568668ca77e230df1371c8c279c8455c`。

## 2026-11-07 — 窗口验收通过：README §5 全部项目（v1.4.0–v1.6.1）

- **用户确认**：「窗口验收通过，readme中的待验收项也全部都通过（包括前面版本的）」。
- **范围**：中栏/底栏/better-sidebar 透桌面；设置页不再误报「材质未透明」；浅色主题；壁纸选图 /
  切回桌面 / 关总开关 / 重启恢复 / 移除图片；磨砂度滑杆（含 desktop 置灰与数值保留）；行内代码与
  围栏代码块；五处半透明表面与关总开关回退；开关「启用磨砂玻璃 / 侧边栏面板磨砂 / 深层玻璃」；
  `Cmd+B`、resize handle、发送按钮 / 补全弹层 / 右键菜单不透明；better-sidebar 拖拽分栏与标签切换；
  官方客户端设置页（标题层级 / 开关 / 滑杆 / 无裁切）。
- **盘上文件**：只改文档——README §5 的 30 个 `[ ]` → `[x]`，STATE 加验收记录并更新各版「待目视」行，
  AGENTS 当前状态同步；`client.js` 一行未改（md5 仍 `568668ca77e230df1371c8c279c8455c`）。

## 2026-11-07 — v1.6.1：官方客户端设置页样式 fallback

- **触发**：用户在官方客户端截图反馈「这个设置界面根本没法用啊」——插件自己的「磨砂玻璃」section
  在官方壳里退化成默认 `h3` 大字、开关变成灰色小横条、顶部被裁掉半行；设置弹窗本身正常。
- **根因**：section 复用宿主的 `dshDesktopSettings*` 类，这套样式在 Next 里由桌面壳用
  `<style id="dsh-desktop-settings-styles">` 注入（源 `src/client/desktop-settings-styles.ts`，
  563 行 / 17,653 字符 / 51 个类）；官方客户端 0.2.2-rc.1 把这整层丢掉（`dshDesktopSettings` 在官方
  `app.asar` 命中 0、Next 命中 293）。与门控 / 材质 / 遮罩穿透无关。
- **改动**：`client.js` 新增 `HOST_SETTINGS_STYLE_ID` / `SETTINGS_STYLE_ID` / `SETTINGS_CSS`（逐字拷贝）
  与 `ensureSettingsStyles()`：宿主 sheet 存在则不注入（Next 外观不变），缺失才懒安装
  `<style id="dsh-vibrancy-skin-settings-styles">`，dispose 时摘掉自身、不碰宿主。`client.js` 1552 → 2155 行；
  `smoke-test.mjs` 224 → **230**（+6），`verify.sh` 63 → **69**（+6，§8 期望 1.6.1），`package.json` 1.6.1。
- **证据**：`SETTINGS_CSS` 与 Next 源表 `equal true`；headless 样张（无宿主样式）里标题 22/16 px、
  36×20 开关轨道 + 白色 knob、选中预设蓝描边、滑杆/按钮原生外观。
- **验收**：`node smoke-test.mjs` **230 ✓ / 0 ✗**；`bash verify.sh` **69 ✓ / 0 ✗**；md5
  `568668ca77e230df1371c8c279c8455c` 与活体软链一致。官方客户端实际观感待用户 `Cmd+R`。
- **未改**：门控、四张材质表、第三方插件；无 `backdrop-filter`、无 `peerDependencies`。

## 2026-11-07 — v1.6.0：官方 DeepSeek Harness 客户端适配（门控放宽）

- **触发**：用户要求「给插件做一下deepseek harness（官方客户端）的适配」；版本号拍板为 v1.6.0。
- **根因**：官方客户端 `/Applications/DeepSeek Harness.app`（bundle `com.deepseek.dsh`，0.2.2-rc.1，
  `app.asar` 213,240,777 B）与 DSH NEXT 共用 `~/.dsh` profile，但其 `lib/preload-app.cjs`
  **只**写 `data-platform`，不写 `nextMaterial`；`lib/main.js` 的 `createWindow` 在 darwin 下
  恒定带 `vibrancy:"sidebar"` / `visualEffectState:"active"` / `backgroundColor:"#00000000"`，
  无 `macosMaterial` 分支 → 官方窗口本身就是磨砂，exact `material=transparent` 门控整片失配。
- **改动**：29 处门控字面量（含 1 处注释）
  `html[data-platform="darwin"][data-next-material="transparent"]`
  → `html[data-platform="darwin"]:not([data-next-material="off"])`；设置页 `active` 判定改为
  `platform === "darwin" && nextMaterial !== "off"`；文件头新增 1b 段、规则 4 改写。
  `client.js` 1540 → 1552 行；`smoke-test.mjs` 221 → **224**（新增 I2 段），`verify.sh`
  62 → **63**（新增无 exact transparent 残留断言，§8 期望 1.6.0）；`package.json` 1.6.0。
- **为什么不用 `data-platform` 单条件**：`macosMaterial=off` 时窗口没有 vibrancy，皮肤必须不命中；
  官方客户端没有该属性，`:not([data-next-material="off"])` 同时满足两者（NEXT 的
  transparent/off 行为不变）。
- **证据**：两份 ui-layout `client.js` 同构，仅 CSS-module 前缀不同（官方 `PIRFFq_*` 38,890 B /
  NEXT `VFpnAa_*` 38,933 B），`[class*="_centerCol"]` 等锚点两边都命中；真实 CSS 引擎五用例
  （官方 / transparent / off / linux / 旧门控对照）中官方形态解析出 tint `40%`，旧门控为 `""`。
- **验收**：`node smoke-test.mjs` **224 ✓ / 0 ✗**；`bash verify.sh` **63 ✓ / 0 ✗**（§8 期望 1.6.0）；
  `client.js` md5 `b61e535f1efe8bb19628e95e626f6d38`，与活体软链一致。窗口观感待用户
  在官方客户端 `Cmd+R` 后目视。
- **副作用（已接受）**：NEXT 材质为 `off` 时，启动瞬间 `nextMaterial` 尚未异步写入，可能出现
  一次短暂玻璃色闪现；官方客户端无此问题。
- **未改**：无 `backdrop-filter`、无布局属性、无 `peerDependencies`、不碰第三方插件文件。

## 2026-11-06 — v1.5.2：五处表面半透明（cost 卡片/角标、文件块、气泡、输入框）

- **触发**：用户 v1.5.1 验收后指出「dsh-cost-meter 插件的卡片仍然是实心的，还有图一的文件编辑块
  和图三的用户消息气泡块，也要让其不突兀」；随后补充「图一也是 dsh-cost-meter 的块，图二是消息输入框。
  注意这五处不要全部用同一个不透明度数值，要根据实际美学效果来单独选定」。
- **改动**：`client.js` sheet 1 末尾新增 10 条门控规则，全部 `color-mix(in srgb, <原 token> N%, transparent)`：
  用户气泡 58%（`--dsw-specific-bubble`，浅/深两支）、输入框 64%（`[data-composer-card]`）、
  文件编辑块 52% + hover 70%（`[data-changed-files]`、`--changes-fill/--changes-hover`）、
  cost 侧栏卡片外层 44% + 内层 `.cm-bbox` `transparent`、独立 `.cm-bbox` 50% 兜底、
  费用角标 `.cm-chip` 42%、费用明细按钮 `.cm-btn.cm-stat-entry` 46%。
  `client.js` 1476 → 1540 行，只动 `client.js`。
- **为什么不统一成一个数**：五处面积/层级/文字密度不同；smoke test 断言 distinct ≥ 5。
- **验收**：`node smoke-test.mjs` **221 ✓ / 0 ✗**（+17）；`bash verify.sh` **62 ✓ / 0 ✗**（+20，§8 期望 1.5.2）；
  临时 mock 样张 `/tmp/v152-preview.png` 五处透出壁纸、文字可读、无灰雾。窗口观感待用户 `Cmd+R` 目视。
  `client.js` md5 `50495a6766bc68cba68010e9003716a4`。
- **未改**：无 `backdrop-filter`、无布局属性、无 `peerDependencies`、不碰第三方插件文件。

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
