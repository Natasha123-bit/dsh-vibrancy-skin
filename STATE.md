# STATE — dsh-vibrancy-skin install

**Install time:** 2026-09-28 03:28, redeployed **04:14** as v1.2.0, **05:47** as v1.3.0, then
**06:12** as **v1.3.1**, **06:20** as the same 1.3.1 with the temporary diagnostic probe
stripped back out, **2026-10-02 23:57 (+0800)** as **v1.3.2** (dialog/overlay opacity fix),
and **2026-10-28 03:5x** as **v1.4.0** (DSH NEXT 2.0.20-next / dsh 0.2.1-rc.3 port),
**2026-11-06** as **v1.5.0** (background image frost: wallpaper / desktop modes), and the same day as **v1.5.1**
(frost dial + translucent inline code), then **v1.5.2** (translucent bubble / composer / file card / cost-meter
surfaces), and **2026-11-07** as **v1.6.0** (official DeepSeek Harness client 0.2.2-rc.1: gate widened from
material=transparent to darwin-minus-off).
**Source of truth:** this directory. `~/.dsh/profiles/desktop/node_modules/dsh-vibrancy-skin`
is a **symlink to this directory**, so an edit here is already the installed copy — there is no
copy step and no second place to keep in sync.

**2026-10-04 migration:** this directory *is* the migration — the plug-in was moved from
`~/Documents/DSH-Default/dsh-vibrancy-skin` to `~/Documents/DSH-Projects/dsh-vibrancy-skin`,
turned into a git repository (`main`, tags `v1.2.0` and `v1.3.2`), and the profile mount was
re-pointed at the new path (old directory kept as a symlink to it). No plugin code changed:
`client.js` md5 is `83db8447697538981563052b27dc951d` before and after. See `CHANGELOG.md`.

**迁移切换后的复验（2026-10-04 03:3x，切换挂载 + 旧目录改软链之后）**
- `node smoke-test.mjs` → 112/112；`bash verify.sh` → 27 ✓ / 0 ✗（§1 源码↔安装逐字节一致、
  §2 `link:/Users/leixiaokang/Documents/DSH-Projects/dsh-vibrancy-skin`、§4 两条解析路径都指向新仓库、
  §6 宿主日志自切换以来 0 条新行、§8 三张 sheet + 弹层快照/规则断言齐全、installed version = 1.3.2）。
- 旧目录 `/Users/leixiaokang/Documents/DSH-Default/dsh-vibrancy-skin` 已 `mv` 到**同一父目录下的隐藏目录**
  `/Users/leixiaokang/Documents/DSH-Default/.dsh-vibrancy-skin-old-20261004-033509`（**不是** `~/` 下——
  2026-10-04 实测校正），原位置改挂软链 → 新仓库（经旧路径读 `client.js` md5 相同）。
- 已知陈旧元数据（**故意不手改**）：profile 的 `pnpm-lock.yaml`、`node_modules/.pnpm/lock.yaml`、
  `node_modules/.package-map.json` 仍写着旧 `link:` 路径。因为旧路径现在是有效软链，即便将来真跑一次
  `pnpm install` 也能解析到同一份代码；手改 lockfile 反而有破坏完整性校验的风险（见 AGENTS.md 规则 1）。

**2026-10-04 复核与文档校正（未改一行插件代码，`client.js` md5 仍为 `83db8447697538981563052b27dc951d`）**
- **用户验收通过**：`Cmd+R` 后 dsh-cost-meter「费用明细」面板实心可读、弹层不透明 → v1.3.2 的弹层修复确认有效；
  README §5「弹层可读性」那两行由 `[ ]` 改 `[x]`（其余 9 条 `[ ]` 保持未勾，属"顺手扫一眼"级别）。
- **计数漂移校正**：文档里 6 处 `verify.sh 25 项` 一律改为 **27 项**（AGENTS.md 文件地图 + 硬规则 2、
  本文件迁移复验段 + v1.3.2 delta、CHANGELOG 迁移段 + v1.3.2 段）。`smoke-test.mjs` 的 112 条本来就是对的。
- **校正取证**（不是凭印象）：① 活体实测 `bash verify.sh | grep -o '✓' | wc -l` = 27，`✗` = 0；
  ② 拆开 `.backup/dsh-vibrancy-skin-pre-migration-v1.3.2-20261004-033509.tar.gz`，其中 `verify.sh`
  与当前**逐检查项完全一致**（`diff` 只多出第 9 行那条自定位注释）→ 27 自 v1.3.2 部署起即成立，
  25 是**加那 2 条断言之前**（v1.3.1 时期）的数，当时忘记 +2。
- **路径校正**：旧目录实际在 `/Users/leixiaokang/Documents/DSH-Default/.dsh-vibrancy-skin-old-20261004-033509`。
- 顺手发现、**未动**（留作待办）：`.backup/LAST_BACKUP_TS` 仍写 `20260928-054614`，未反映 2026-10-04 的迁前备份。

## v1.6.0 delta (official DeepSeek Harness client: window gate widened)

**需求（用户 2026-11-07）：** 「给插件做一下deepseek harness（官方客户端）的适配」。版本号拍板为 **v1.6.0**。

**根因（取证自 `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar`）：** 官方客户端
（bundle `com.deepseek.dsh`，0.2.2-rc.1，`app.asar` 213,240,777 B）与 DSH NEXT 共用同一个
`~/.dsh` profile，但 `lib/preload-app.cjs` **只**写 `document.documentElement.dataset.platform`
（另有 fullscreen / windowsTitlebar / windowsMenu / inputModality / dsThemeSource / dsDarkTheme /
htmlPreview / sidebarBrowserFrame / shellOverlay），**从不写 `dataset.nextMaterial`**；`lib/main.js`
的 `createWindow` 在 darwin 下恒定带 `vibrancy:"sidebar"` / `visualEffectState:"active"` /
`backgroundColor:"#00000000"`，全文件无 `macosMaterial` 命中 → 官方窗口本身就是磨砂，
exact `material=transparent` 门控在它上面一条都不命中（整片失效）。

**改动（`client.js` 1552 行；`smoke-test.mjs`、`verify.sh`、`package.json`）：**

| 位置 | v1.5.2 | v1.6.0 |
| --- | --- | --- |
| 门控字面量（29 处，含 1 处注释） | `html[data-platform="darwin"][data-next-material="transparent"]` | `html[data-platform="darwin"]:not([data-next-material="off"])` |
| 设置页 `active` 判定 | `nextMaterial === "transparent"` | `platform === "darwin" && nextMaterial !== "off"` |
| `client.js` 文件头 | 无官方客户端段 | 新增 1b 段（官方 preload 无 material key / main.js 恒有 vibrancy）；规则 4 改写 |
| `smoke-test.mjs` | 221 ✓ | **224 ✓ / 0 ✗**（新增 I2 段：官方形态无 `data-next-material` 时不报警、装两张表、日志行含 `material n/a`；WINDOW_SCOPE / 正则 / `body::before` 三处字面量同步） |
| `verify.sh` | 62 ✓ | **63 ✓ / 0 ✗**（新增「没有残留 exact `material=transparent` 门控」；§8 期望 1.6.0；门控断言文案 `html[data-platform=darwin] minus material=off (NEXT + official client)`） |
| `package.json` | 1.5.2 | 1.6.0 |

**为什么是 `:not([data-next-material="off"])` 而不是保留 exact transparent：** 官方客户端属性永远
缺失，exact 会让皮肤在官方下整片失效（真实引擎实测空串）；而「官方」与「NEXT off」没有第二个
静态 DOM 信号可区分——`data-platform` 两边都是 `darwin`，`macosMaterial` 只在 NEXT 的 `main.js` 里，
不落页面。NEXT 下 `transparent` 命中、`off` 不命中；官方属性缺失 → `:not()` 成立。设置页判定同步，
官方客户端不再误报「当前窗口没有启用玻璃背景」。

**验收（2026-11-07，可复核）：**

* `node smoke-test.mjs` → **224 ✓ / 0 ✗**；`bash verify.sh` → **63 ✓ / 0 ✗**（§8 期望 1.6.0）；
* 真实 CSS 引擎五用例（chrome-headless-shell 1223，把 `client.js` 四张表的 CSS 原样抽出注入，
  读 `body` 的 `--dsh-vib-tint-strength`）：

  | 形态 | 新门控 | 旧门控（对照） |
  | --- | --- | --- |
  | 官方（platform=darwin，无 nextMaterial） | `"40%"` | `""` |
  | NEXT transparent | `"40%"` | `"40%"` |
  | NEXT off | `""` | `""` |
  | platform=linux | `""` | `""` |

  官方形态 `"40%"` = 新门控命中；同形态 + 旧门控 `""` = 旧门控在官方客户端确实整片失效；
* `client.js` md5 **`b61e535f1efe8bb19628e95e626f6d38`**（1552 行），与活体软链一致；
* 窗口内观感待用户在官方客户端 `Cmd+R` 后目视（清单在 README §5）。

**副作用（用户已接受）：** NEXT 的 `nextMaterial` 由 preload 异步 `invoke` 写入，材质设为 `off` 时
启动瞬间属性尚未到位，门控会短暂命中一次，可能出现一次玻璃色闪现，随后消失；官方客户端属性永不
存在，无此问题。

**盘上文件：** 仓库内 `client.js` / `smoke-test.mjs` / `verify.sh` / `package.json` 四个文件被改；
`~/.dsh/profiles/desktop/node_modules/dsh-vibrancy-skin` 仍是软链，没有拷贝步骤，改仓库即活体安装。

## v1.5.2 delta (translucent surfaces: bubble / composer / file card / cost-meter)

**需求（用户 2026-11-06，v1.5.1 验收通过后）：** cost-meter 的卡片、图一的文件编辑块、图三的用户消息气泡
「也要让其不突兀」；随后补充「图一也是 dsh-cost-meter 的块，图二是消息输入框」，并明确
「这五处不要全部用同一个不透明度数值，要根据实际美学效果来单独选定」。

**改动（只动 `client.js`，1476 → 1540 行，+64/−0）：** sheet 1 末尾新增 10 条门控规则（行 203–265），
全部 `color-mix(in srgb, <原 token> N%, transparent)`，只改 `background` / 自定义属性：

| 表面 | 锚点 | 不透明度 |
| --- | --- | --- |
| 用户气泡（浅/深两支） | `--dsw-specific-bubble`（body / `body[data-ds-dark-theme]`） | 58%（`deepseek-50` / `bluish-850`） |
| 消息输入框 | `[data-composer-card]` | 64%（`--dsw-specific-input-major`） |
| 文件编辑块 | `[data-changed-files]` + `--changes-fill` / `--changes-hover` | 52% / 52% / 70%（深色 850 / 800） |
| cost 侧栏卡片外层 | `.cm-footer-stack.summary:not(.rail)` | 44% |
| cost 侧栏卡片内层 | 同前缀 `.cm-bbox` | `transparent`（压过独立兜底） |
| cost 卡片独立兜底 | `.cm-bbox` | 50%（`bg-layer-1`） |
| 费用角标 | `.cm-chip` | 42%（`bg-layer-2`） |
| 费用明细按钮 | `.cm-btn.cm-stat-entry` | 46%（`button-elevated-fill`） |

**为什么：**
- `--dsw-specific-bubble` 只被气泡消费 → 在门控 `body` 上重定义 token，不依赖上游 hash 类名（每次构建会变）。
- `[data-composer-card]` / `[data-changed-files]` / `.cm-*` 是稳定属性或字面量类名；cost-meter 自带的
  `followSkinTransparency` 只覆盖费用页/侧栏一部分表面，所以不依赖它，直接覆盖卡片与控件。
- 五个值刻意不同：面积/文字密度不同；smoke test 断言 distinct ≥ 5（当前 8 个）。
- 仍然**不用 `backdrop-filter`**：这里是半透明色叠在已有磨砂面上，不做窗口采样，不会糊成灰雾。

**验收（2026-11-06）：**
* `node smoke-test.mjs` → **221 ✓ / 0 ✗**（+17：白名单三项、10 条规则、7 锚点、门控/无布局/无 backdrop-filter、
  百分比集合、深色 token、透明规则顺序）；
* `bash verify.sh` → **62 ✓ / 0 ✗**（+20：§8 期望 1.5.2、9 锚点、8 百分比、3 深色 token；注释里的
  `backdrop-filter` 单词不误红，断言是声明级）；
* 临时 mock 样张 `/tmp/v152-preview.png`（2560×1600，非仓库文件）：五处均透出壁纸、文字可读、无灰雾；
* 窗口内观感待用户 `Cmd+R` 后目视；
* `client.js` md5 **`50495a6766bc68cba68010e9003716a4`**，与活体软链一致。

## v1.5.1 delta (frost dial + translucent inline code)

**需求（用户 2026-11-06，v1.5.0 验收通过后）：** ①「新增一个磨砂程度的调节？…最高变成纯雾面，最低变成纯透明」；
②「字符块能否也做成透明磨砂的…在使用浅色壁纸的时候不那么突兀」。

**改动（只动 `client.js`，1364 → 1476 行）：**

| 位置 | 内容 |
| --- | --- |
| 第 4 张表 | `filter: blur(36px)` → `filter: blur(var(--dsh-vib-frost, 36px))`（不再有硬编码半径） |
| 新状态 `frost` | localStorage `:frost`，默认 36，0–100 整数（clamp/round；非法忽略；等于默认时删 key） |
| 内联变量 | `applyFrostInline()` 写 `--dsh-vib-frost: ${n}px`；总开关关闭时 `removeProperty` |
| API | `setFrost()`；`getState()` 增 `frost`；`resetAll()` 复位 36；console banner 增 frost |
| 设置页 | 第 6 组「磨砂度」（强度与微调之间）：range 0–100 + `${n}px` + 恢复默认；`desktop` 模式 disabled + `frostDesktopHint` |
| 行内代码 | sheet 1 末尾：`[class*="_markdown_"] :not(pre) > code { background-color: color-mix(in srgb, var(--dsw-alias-markdown-inline-code, #808080) 45%, transparent) }` |

**为什么桌面模式置灰：** 那层模糊由 macOS `NSVisualEffectView` 材质决定，CSS 改不了；不拿半透明雾面罩假装（会更灰、对比度下降）。
**为什么行内代码是实心的：** 上游 `--dsw-alias-markdown-inline-code` 是实色（浅 `neutral-50` / 深 `neutral-800`），
45% `color-mix` 让主题与壁纸同时透出来；围栏代码块保持不透明以保证可读性。

**验收（2026-11-06）：**
* `node smoke-test.mjs` → **204 ✓ / 0 ✗**（+36：frost 状态/夹取/持久化/滑杆/disabled、第 4 表 var、行内代码审计）；
* `bash verify.sh` → **42 ✓ / 0 ✗**（+6：var blur、无硬编码 36、`:frost`、`--dsh-vib-frost`、`_markdown_`、color-mix；§8 期望 1.5.1）；
* `node visual-bg.mjs` → 0/36/100 三张 1280×800 样张（`/tmp/dsh-bg-preview-{0,36,100}.png`）：
  0 清晰、100 趋于均匀，三张均无灰雾/硬边；
* 窗口内观感待用户 `Cmd+R` 后目视（滑杆两端 + 浅色壁纸下的行内代码）；
* `client.js` md5 **`7ee155e1194ef5422b57cd6d8d96489d`**，与活体软链一致。

## v1.5.0 delta (background image: wallpaper / desktop modes)

**需求（用户 2026-11-06）：** 「给皮肤插件加上上传图片功能，以获得带背景毛玻璃的效果
（可选择是透到壁纸还是透到桌面）」。语义取 **A 方案**（用户确认）：

* `desktop`（默认）= 与 v1.4.0 完全一致：玻璃后面是真实桌面；
* `wallpaper` = 上传图铺满整窗做玻璃底图，磨砂面板透出这张图。

**为什么不是让窗口材质再透一点（取证自 `app.asar`）：**
宿主是独立 Node 进程（`lib/host.js`），没有 `BrowserWindow` 调用面；preload 只暴露**读**材质的
`dsh-next:material`；窗口创建时 `vibrancy:"sidebar"` 写死，`main.js:874` 只在 `"sidebar"` 与
`null` 之间切；Electron 二进制里搜得到 `under-page` 但没有可用入口。改系统壁纸属系统级副作用，不做。
→ 只能由页面内一层 CSS 实现（`html`/`body`/`#root` 在 darwin 上本就透明）。

**改动（只动 `client.js`，889 → 1364 行）：**

| 位置 | 内容 |
| --- | --- |
| 第 4 张表 `BG_STYLE_ID="dsh-vibrancy-skin-bg-styles"` | 唯一选择器门控 `body::before`：`position:fixed; inset:-64px; z-index:-1; pointer-events:none; background-image:var(--dsh-vib-bg-image); background-size:cover; filter:blur(36px)` |
| 装入条件 | `enabled && bgMode==="wallpaper" && bgUrl!==null`；任一不满足整张表不存在 |
| 内联变量 | `body.style.setProperty("--dsh-vib-bg-image", 'url("blob:…")')`；`applyBgInline()` 同时处理移除 |
| 存储 | IndexedDB `dsh-vibrancy-skin` / store `bg` / 记录 `image`（keyPath `id`，字段 `{id,blob,name,updatedAt}`） |
| 压缩 | `createImageBitmap` 带 `imageOrientation:"from-image"` → canvas 长边 2048 → `toBlob("image/webp", 0.9)`；>30 MB 拒绝 |
| 新状态 | `bgMode`（localStorage `:bg-mode`）、`bgName`（`:bg-name`），`bgUrl` 仅内存 objectURL |
| API | `setBgMode` / `setBgImage` / `clearBgImage` / `restoreBgImage`；`getState()` 增三字段；`resetAll()` 回 desktop 但**不删图** |
| 设置页 | 「背景图」组插在「外观」之后：两张 `SkinChoice` + 预览 + 选择/更换/移除 + 隐藏 file input + 错误 notice；zh/en 各 14 条新文案 |

**刻意没做的事：** 不用 `backdrop-filter`（仍是红线）；不把 base64 塞进 CSS/localStorage（5 MB 上限）；
不改系统壁纸/窗口材质；不碰第三方插件；图片只在本机解码存储，无网络请求。

**验收（2026-11-06）：**
* `node smoke-test.mjs` → **168 ✓ / 0 ✗**（新增 51 条：惰性装表、内联变量、objectURL 回收、
  无 IDB 不抛、第 4 表独立审计、设置页 5 组 + zh/en 无缺 key）；
* `bash verify.sh` → **36 ✓ / 0 ✗**（新增 7 条 BG 断言；§8 期望版本 1.5.0）；
* `node visual-bg.mjs` → `/tmp/dsh-bg-preview.png`（1280×800）：橙/品红/青团透过三块面板可见，
  无整片灰雾、无硬边；
* 窗口内观感（选图 / 切模式 / 关总开关 / 重启恢复 / 移除）待用户 `Cmd+R` 后目视，清单在 README §5。
* `client.js` md5 **`f15cd906692da4089e9871ac72d0beb5`**，与活体软链一致。

**踩到的坑：** IDB 记录必须带 `keyPath:"id"`（否则 `store.get("image")` 取不到）；
`setEnabled(false)` 时要同时 `applyBgInline()` 清内联变量，否则重开时变量残留；
测试里 `role="radiogroup"` 会先命中新增的背景图组，强度组要靠 `aria-labelledby="dsh-vibrancy-strength-title"` 定位。

## v1.4.0 delta (port: DSH NEXT 2.0.20-next + @deepseek-ai/dsh 0.2.1-rc.3)

**症状（用户 2026-10-28 报告）：** DSH 更新后皮肤插件「已经失效」——不是某一处花掉，是**整片
没有任何磨砂**，设置页还提示"当前窗口没有启用玻璃背景"。

**根因（取证自 `/Applications/DSH NEXT.app/Contents/Resources/app.asar`，不是猜的）：**

1. **门控从 `<body>` 搬到了 `<html>`。** `lib/preload-app.cjs` 现在写
   `document.documentElement.dataset.platform = process.platform` 与
   `documentElement.dataset.nextMaterial = "off" | "transparent"`；
   v1.3.2 用的 `body[data-dsh-desktop-platform][data-dsh-desktop-material]` 在 app.asar 里
   **出现 0 次** → 32 条选择器一条不中，所以是"一次性全灭"。
2. **外壳 class 全换了。** `.dshDesktopConversationSurface` / `.dshDesktopRightbarSurface` /
   `.dshDesktopMacCaptionRow` 均 **0 命中**；2.0.20-next 用 ui-layout 的 CSS-module 哈希类，
   `._1qAH1q_centerCol` / `_rightbarCol` / `_bottomRow` / `_sidebarCol` / `_frame`。
3. 上游**自己已经透明化了一部分**：`[data-platform=darwin] ._1qAH1q_frame{background:0 0}`、
   `_sidebarCol` 用 `color-mix(in srgb, var(--dsw-specific-sidebar-fill) 90%, transparent)`。
   仍实心的是 `_centerCol`、`_rightbarCol`、`_bottomRow`，三者都是
   `background: var(--dsw-alias-bg-base)`（darwin 覆盖规则里又重复了一遍，所以 macOS 上
   **不会**自动变透明）。

**改动（`client.js`，只动材质）：**

| 位置 | v1.3.2 | v1.4.0 |
| --- | --- | --- |
| 门控 | `body[data-dsh-desktop-platform="darwin"][data-dsh-desktop-material="transparent"]` | `html[data-platform="darwin"][data-next-material="transparent"]` |
| 中栏 | `.dshDesktopConversationSurface` | `[class*="_centerCol"]` |
| 标题条 | `.dshDesktopMacCaptionRow` | 删除（2.0.20-next 没有这条 32px 容器；`--dsh-frame-top-clearance: 48px` 直接让流量灯浮在冻结的侧栏上） |
| 底栏 | 无 | 新增 `[class*="_bottomRow"]` |
| 右栏（sheet 2/3） | `.dshDesktopRightbarSurface[data-rightbar-col]` | `[class*="_rightbarCol"]`，且列根本身设 `background: transparent !important`，由 dock 的 tab host 画唯一一层 tint |
| 弹层快照 | `var(--dsw-alias-bg-base)` / `-bg-layer-1`（在 body 上截获上游原值） | 直取 `--dsw-static-neutral-bluish-00/-950/-875`（ui-theme 里 alias 就是对它们的转发，语义等价且无环） |
| 设置页 `active` 判定 | 读 `document.body.dataset.dshDesktopPlatform/dshDesktopMaterial` | 读 `document.documentElement.dataset.platform/nextMaterial` |
| 控制台日志 | `material <body 属性>` | `platform <html> material <html>` |

**刻意没做的事：** 不给 `_sidebarCol` / `_frame` 再刷一层（上游已经透明，重复染色会叠成两层）；
不引入 `backdrop-filter`；不加 `peerDependencies`；不动任何第三方插件的文件。

**实现踩到的坑（记下来省下一次）：** 用 `python` 按行号替换 `client.js` 的模板字符串之后，
再调 `edit` 工具会被文件版本守卫拦下（`FS_STALE_VERSION: file changed since it was read`）
——替换后必须重新 `read` 再 `edit`，不要混用两种改法。

**验收（可复核）：**
- `node smoke-test.mjs` → **117/117 PASSED**（v1.3.2 的 112 条 + 5 条 NEXT 专项：
  AppFrame 中栏/底栏锚点、右栏 transparent、dark 双份、旧门控零残留）
- `bash verify.sh` → **29 ✓ / 0 ✗**（v1.3.2 的 27 条里换了右栏锚点，新增 centerCol / bottomRow /
  NEXT 门控 / 旧门控零残留 4 条 + 静态色快照断言，并把 §6 日志段改到 `~/.dsh/logs/desktop-next.log`）
- 未能自证的部分：**真实窗口观感**只能由用户 `Cmd+R` 后目视确认（README §5 已列出 5 个观察点）。

**没改的陈旧元数据（沿用 v1.3.2 的结论）：** profile 侧 `pnpm-lock.yaml` 等仍写旧 `link:` 路径；
`.backup/LAST_BACKUP_TS` 仍是 `20260928-054614`。

## v1.3.2 delta (fix: dsh-cost-meter's "本会话费用明细" panel rendered fully transparent)

* **Symptom reported by the user (2026-10-02):** opening dsh-cost-meter's new per-conversation
  cost detail panel turned the whole panel transparent — the conversation text behind it bled
  through the numbers, unreadable. The user had already checked that better-sidebar settings were
  not involved, and asked whether it could be fixed from this plugin.
* **Root cause, from the shipped code** (`dsh-cost-meter@1.8.6/lib/client.js`, component `fs()`):
  the entry button and the panel are one React fragment (`e(E, null, button, dialog)`) and the
  panel is an ordinary `<dialog>` in the normal DOM flow — **no portal**, so `showModal()`
  (top-layer paint) does not change CSS inheritance. It paints itself with an INLINE style:

  ```js
  e("dialog", { ref: l, role: "dialog", style: { …, background: "var(--dsw-alias-bg-base,#fff)" } }, …)
  ```

  `--dsw-alias-bg-base` is exactly the token sheets 1/2/3 retint, so the dialog inherited the
  translucent tint (tint was 15% at the time → effectively transparent).
* **Fix (rule 4 in sheet 1):** custom properties are substituted where they are *declared*, and
  upstream declares `--dsw-alias-bg-base`/`-bg-layer-1` on `<body>`
  (`dsh-client-ui-theme`: `body{…bluish-00}` + `body[data-ds-dark-theme]{…bluish-950}`). So the
  sheet now snapshots both on `<body>` (`--dsh-vib-bg-base-solid`, `--dsh-vib-bg-layer-1-solid`)
  and hands them back to overlays on the overlay element itself:

  ```css
  body[<gate>] :is(dialog, [role="dialog"], [role="alertdialog"]) {
    --dsw-alias-bg-base: var(--dsh-vib-bg-base-solid);
    --dsw-alias-bg-layer-1: var(--dsh-vib-bg-layer-1-solid);
  }
  ```

  Deliberate choices: (1) restore the **tokens**, not a hard-coded `background`, so nested cards
  inside the dialog go opaque too; (2) **not scoped to a pane** — a third party may portal the
  dialog to the pane, the title strip or `<body>`, and outside our retint scopes the rule is a
  no-op anyway; (3) it lives in sheet 1, so the master switch still removes it.
* `smoke-test.mjs` gained 3 checks (snapshot taken from the upstream token; the overlay rule
  restores both tokens; the rule is not pane-scoped) → **112/112**. Its `parseRules()` helper is now
  paren-aware when splitting top-level selector lists, because `:is(a, b, c)` contains commas.
* `verify.sh` §8 gained 2 assertions (snapshot present, overlay rule present) and now expects
  version 1.3.2 → **27/27**. (2026-10-04 校正：当时记成 **25/25** 是漏加了这 2 条——25 是加断言**之前**
  的旧值。27 = §1 4 + §2 2 + §3 1 + §4 2 + §5 3 + §6 4 + §8 11。取证：迁前快照
  `.backup/dsh-vibrancy-skin-pre-migration-v1.3.2-20261004-033509.tar.gz` 里的 `verify.sh` 与当前
  逐检查项一致，只多一行自定位注释 → 27 自 v1.3.2 部署起即成立。)
* Also checked for the user: DSH Desktop 2.0.17 / kernel 0.2.0-rc.2 added a **peerDependencies
  compatibility gate** (`evaluatePluginCompatibility` in `dsh-app-boot`). This plugin declares no
  `peerDependencies`, so the gate returns early and passes; adding a range would risk the plugin
  being *rejected* on the next kernel bump, so it is deliberately omitted. README §6 documents the
  rule, the current per-plugin verdicts, and why the 2026-09-29 `0.2.0-rc.1` warnings in
  `.plugin-manager/logs/` are stale.
* **Not yet confirmed by eye:** the user must reload (`Cmd+R`) and reopen the panel once.

## v1.3.1 delta (fix: the visible sidebar is painted by the app's dock, not by the plugin host)

* **Symptom reported by the user after v1.3.0:** with both sidebar switches on, only the top
  strip of better-sidebar looked frosted; the sidebar body stayed opaque.
* **Root cause, measured live** (temporary in-client probe, reports in
  `/tmp/dsh-vibrancy-probe.ndjson`): on this machine dsh-better-sidebar 0.22.0's own host
  `[data-dsh-better-sidebar]` is an **empty, zero-height div** (`rect=[0,1033,1012,0]`); its
  `[data-dsh-panel-host]` carries nothing but the **hidden** bottom workbench
  (`.nArs4W_bottomPanel.nArs4W_bottomPanelHidden`, y beyond the viewport). The sidebar the user
  actually sees is DSH Desktop's **third grid column**, and the opaque surface is the app's own
  dockkit dock:

  ```
  section._tabHost_1s7ij_162._pane_1s7ij_209   bg = rgb(21,21,23) = raw --dsw-alias-bg-base
  dsh-web-frontend index-DUvMhLle.css:
    ._tabHost_1s7ij_162:not(._float_1s7ij_156),._emptyTabHost_1s7ij_143 { background: var(--dsw-alias-bg-base) }
    ._pane_1s7ij_209 { display:flex;flex:1 1 auto;flex-direction:column;min-width:0;min-height:0;overflow:hidden }
  ```

  Measured rects: `[557,32,455,1001]` (1012px-wide window) and `[1012,32,455,1001]`
  (1467px-wide window) — exactly the right-hand column. It is **outside**
  `[data-dsh-better-sidebar]`, which is why retinting only that anchor changed nothing.
* **Fix:** sheets 2 and 3 now retint the token on three anchors —
  (a) `[data-dsh-better-sidebar]` (plugin-owned marker), (b)
  `.dshDesktopRightbarSurface[data-rightbar-col]` (the column root the desktop shell renders as
  `aside.dshDesktopRightbarSurface[data-rightbar-col]`, children = `renderSlot("rightbar", …)`),
  (c) `[data-dockkit-host="dock"]` (the dock cell itself, in case it is ever portaled). Sheet 2
  also forces `background: var(--dsh-vib-pane)` on `[class*="_tabHost_"]`, the dock's tab host.
* The probe also proved the plumbing was otherwise fine: all three `<style>` present,
  `--dsw-alias-bg-base`/`layer-1` resolving to `color-mix(in srgb, #151517 15%, transparent)` at
  the old anchor, 0 iframes, all our rules kept by the parser.
* Version 1.3.1; `verify.sh` §8 now asserts the two extra anchors; `smoke-test.mjs` gained 4
  checks (visible-sidebar anchors + tab-host rule + sheet 3 uses the same anchors).
* **Confirmed by the user** after one `Cmd+R`: 整列磨砂了，已达成我目前的需求 — the whole visible
  column is frosted. The temporary in-client probe used to prove the root cause has since been
  removed from `client.js`; the raw reports are kept at
  `/tmp/dsh-vibrancy-probe.ndjson.done` (242 KB).

## v1.3.0 delta (frosted third-party sidebar, two independent switches)

* Two more stylesheets, each gated by its own switch, both under the master switch:

  | Sheet id | Switch (`localStorage`) | Default | Declares |
  | --- | --- | --- | --- |
  | `dsh-vibrancy-skin-styles` | `enabled` (master) | on | `background`, `--dsh-vib-pane`, `--dsh-vib-tint-strength`, `--dsw-alias-bg-base` |
  | `dsh-vibrancy-skin-panel-styles` | `panels` | **on** | `--dsw-alias-bg-base`, `background` |
  | `dsh-vibrancy-skin-deep-styles` | `deep` | **off** | `--dsw-alias-bg-layer-1` |

* Sidebar scope is `[data-dsh-better-sidebar]` — the **plugin-owned attribute marker** that
  dsh-better-sidebar sets on the host element it appends to `<body>`
  (`src/client/index.tsx:289`), i.e. hash-proof, unlike the CSS-module class names.
* Justification is the plugin author's own contract (`src/client/sidebar.module.css:13-21`):
  every surface consumes the generic `--dsw-alias-*` tokens **so that skins can override
  them**. `--dsw-alias-bg-base` is consumed by `.pane`, the changes view root, the task graph
  and floating windows; `--dsw-alias-bg-layer-1` by the tab strip, bottom workbench and the
  nested cards/inputs (≈25 rules in the shipped bundle).
* Panel level additionally forces `background: var(--dsh-vib-pane)` on
  `[class*="_tabBar"]` / `[class*="_bottomPanel"]` so those two chrome bars are frosted even
  with the deep sheet off. Only the hash **prefix** can change between builds.
* New public API: `setPanels(bool)`, `setDeep(bool)`, `resetAll()`;
  `getState()` gains `panels` / `deep`. Console banner now prints both switches.
* Settings page: 4 groups (Appearance / Sidebar / Strength / Fine tuning), 3 switches. When
  `[data-dsh-better-sidebar]` is absent it shows a notice and the two sidebar switches are
  disabled — the pane keeps working.
* **No dsh-better-sidebar file is touched**, at any level. Failure mode is "the frost does not
  appear", never a crash, never a layout change.

## v1.2.0 delta (settings integration)

* `client.js` now registers a sibling Settings page — **Settings → 磨砂玻璃 / Vibrancy**
  (`settings.section`, `id: "vibrancy"`, `order: 101`, right after the built-in Desktop page).
  It reuses the desktop page's own classes (`dshDesktopSettings*`, installed unconditionally
  by `dsh-plugin-desktop`), so it looks native in both themes:
  enable switch + 3 preset cards (24% / 40% / 62%) + 0–100 fine-tune + reset.
* New public API: `setEnabled(bool)`, `getState()`, `subscribe(fn)`; `setTint` unchanged.
* The stylesheet is now installed in the **factory body** (module materialization, during the
  `immediately` boot prefetch tier) instead of only in `apply()`, so the skin keeps working
  even if `exports.inject = ["slots","locale"]` never saturates.
* `exports.inject = ["slots","locale"]`; `dsh.client.inject` lists the two client module
  names (non-graph entries are skipped silently by `arriveGraphRow`).
* "Disabled" is the **absence of the `<style>` element** — no new body attribute, no 100% tint.
  Removing the stylesheet restores the upstream look exactly, and avoids leaking the window
  material through main-slot panels that do not repaint `--dsw-alias-bg-base`.

## Files changed on disk (outside this directory)

| Path | Change |
| --- | --- |
| `~/.dsh/profiles/desktop/node_modules/dsh-vibrancy-skin` | **symlink** to this directory — writing here deploys instantly. **2026-10-04 迁移**：插件源码由 `~/Documents/DSH-Default/dsh-vibrancy-skin` 搬到 `~/Documents/DSH-Projects/dsh-vibrancy-skin`（本仓库），该软链已重指到新路径；旧目录留成指向新路径的软链 |
| `~/.dsh/profiles/desktop/package.json` | `dsh.profile.bundles` gains a trailing `"dsh-vibrancy-skin"`; `dependencies` 原为 `"link:/Users/leixiaokang/Documents/DSH-Default/dsh-vibrancy-skin"`，2026-10-04 改为 `"link:/Users/leixiaokang/Documents/DSH-Projects/dsh-vibrancy-skin"` |
| `~/.dsh/profiles/desktop/cordis.patch.yml` | removed the dangling tail pair `- id: vibrancy-skin` / `disabled: true`; the plugin manager later wrote its own `disabled: false` row (no-op, left in place) |
| `~/.dsh/profiles/desktop/.dsh-market/state.json` | `dsh-vibrancy-skin` removed from `disabled` |

## Backups created before the change

```
<this dir>/.backup/LAST_BACKUP_TS                       -> 20260928-054614
<this dir>/.backup/v1.2.0-20260928-054614/              full source snapshot (9 files)
<this dir>/.backup/dsh-vibrancy-skin-v1.2.0-20260928-054614.tar.gz   23 KB, the real rollback point
<this dir>/.backup/profile-20260928-054614/{package.json,cordis.patch.yml}
<this dir>/.backup/installed-v1.2.0-20260928-054614     SYMLINK — NOT a rollback point
~/.dsh/profiles/desktop/{package.json,cordis.patch.yml}.bak-20260928-032324
~/.dsh/profiles/desktop/{package.json,cordis.patch.yml}.bak   (pre-existing, 02:41 / 01:04)
```

## What has been verified

* `node smoke-test.mjs` — **109/109 checks pass** (v1.3.1). Covers the `__ModuleLoader__`
  contract, `apply()` running while `document.body` is still null (`dsh.client.immediately`
  does exactly that), the live tint API, all three sheets (installed/removed per switch,
  persisted across a fresh boot, gated by the master), the sidebar switches
  (`setPanels`/`setDeep` each move only their own sheet; banner reports both), mount state,
  both locale dictionaries (`zh`/`en`, no missing key), the rendered settings tree (native
  classes, 4 groups, 3 switches with the right defaults and disabled state, 3
  keyboard-accessible radios, current row selected, 0–100 input, reset disabled at default,
  "sidebar missing" notice path), and a rule-by-rule audit of **all three** stylesheets
  (every selector carries the darwin+transparent scope, material-only declarations, no
  `backdrop-filter`, no layout property, balanced braces).
* `bash verify.sh` — all green (8 sections): source == installed (it is a symlink), profile
  mount state consistent, patch row not disabled, package resolves through the profile's own
  `createRequire`, the manifest satisfies `dsh-client-modules`' validators, no new host-log
  rows, and the deployed client half carries all three sheet ids, all three sidebar anchors
  (`[data-dsh-better-sidebar]`, `.dshDesktopRightbarSurface[data-rightbar-col]`,
  `[data-dockkit-host="dock"]`), the `[class*="_tabHost_"]` rule, and no `backdrop-filter:`
  declaration.
* The mount shape is the one already observed working on 2026-09-28 02:44:05
  (plain `insert`, package resolvable, entry in `dsh.profile.bundles`).

### Runtime evidence that the mount is live (2026-09-28 04:01)

The host did two live patch reloads at **04:01:11** and **04:01:14** (+0800). The profile's
`cordis.patch.yml` contains a `- id: vibrancy-skin` row, and a patch row for a missing entry
always logs `patch: entry "vibrancy-skin" not found` (it did, at 01:19:25 / 02:56:33–02:59:16,
before the fix). **No such warning appears after 03:23** — the only remaining warnings are
unrelated (`ui-settings-unarchive-sessions` not found, `llm-deepseek` name mismatch). Therefore
the loader stack really does contain the `vibrancy-skin` entry: the bundle insert worked.
`.dsh-market/state.json` also no longer lists it under `disabled`.

## Confirmed working (2026-09-28 06:15, by the user's own eyes)

After the v1.3.1 anchor fix and one `Cmd+R`, the user reported:

> 整列磨砂了，已达成我目前的需求

That closes the last open question: with both sidebar switches on, the whole third column (the
visible dsh-better-sidebar UI) is frosted, in the same material as the conversation pane. The
causation is also pinned down, not just the outcome — see the v1.3.1 delta and the probe
evidence in `/tmp/dsh-vibrancy-probe.ndjson.done` (242 KB, kept as a record; the collector
script `/tmp/dsh-probe-server.py` and the temporary probe inside `client.js` have been
**removed**, so the shipped client half is probe-free).

Nothing about the fix depends on the probe: the probe was read-only diagnostics that wrote to
`localStorage` + a loopback beacon. Its removal changed `client.js` (md5
`9ce04cf397b49e587d9875ab2bff72f3`), and the file still passes `node --check`,
`node smoke-test.mjs` (109/109) and `bash verify.sh` (23 green checks).

## What is NOT verified automatically

The visual result is confirmed by a human, not by a test — the remaining automated gap is that
the CSS rules cannot be matched against a live sidebar DOM in CI. What *is* locked in is the
rule text (all three anchors, material-only declarations, no `backdrop-filter`, no layout
property) and the switch wiring.

Known limits, recorded for later:

* If the sidebar is ever dragged to a column other than the third one (e.g. a bottom dock or a
  floating window), the anchors may not cover it; the failure mode is "no frost", never a
  crash. Adding one anchor selector is the whole fix.
* Only a dark theme has been looked at with the sidebar levels on.

## How to undo

```bash
bash rollback.sh          # unmount + delete the package; profile files backed up first
bash rollback.sh --keep   # unmount but keep the files
```

Worst case, if the app will not start at all (it should — everything above is statically
validated — the fix is three edits): delete `"dsh-vibrancy-skin"` from
`dsh.profile.bundles` in `~/.dsh/profiles/desktop/package.json`, and remove the package
directory. The stylesheet cannot break the boot on its own: it is served to the renderer
only after the host half has already loaded successfully.

## Design invariants (do not relax)

1. No `backdrop-filter` anywhere — upstream states Chromium cannot blur the transparent
   vibrancy window; in-window blur paints uniform grey fog. (v1.5.0's background sheet uses
   `filter: blur()` on the image layer only — it blurs its own pixels, never samples the window
   behind it, so it is a different thing and stays.)
2. Material only — sheets 1–3 declare `background` and three custom properties, and nothing
   else. The background sheet (4) is the sole exception: it is a `pointer-events: none`
   decoration layer and may use `position` / `inset` / `z-index` / `filter` / `background-*`.
   Layout is untouched by construction.
3. The tint is cycle-free — built from `--dsw-static-neutral-bluish-00/950`, never from
   `--dsw-alias-bg-base` (self-reference would blank the pane).
4. Everything is scoped to `html[data-platform="darwin"]:not([data-next-material="off"])`
   (v1.6.0: this also matches the official DeepSeek Harness client, which never writes the
   material key; the old exact `…[data-next-material="transparent"]` literal is only valid for
   v1.5.2 and earlier; v1.3.2 and earlier: `body[data-dsh-desktop-*]`) so any failure degrades
   to the upstream opaque look instead of an unreadable window.
5. Third-party plugins are never modified, not even their shipped CSS. Only two things may be
   relied upon: (a) the plugin-owned attribute markers it writes itself
   (`[data-dsh-better-sidebar]`), and (b) the generic `--dsw-alias-*` tokens its author
   documents as the skin extension point. Hashed class names may only be used as
   `[class*="_localName"]`, where a miss costs a missed tint and nothing else.
6. Every switch is the presence/absence of a `<style>` element. No switch may be implemented by
   a "neutral" value of a live style, because that leaves a half-applied state behind.
