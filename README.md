# dsh-vibrancy-skin

macOS 原生 Vibrancy（磨砂玻璃）材质皮肤，用于 DSH NEXT / DSH Desktop 的**会话面板**，
并为第三方侧边栏插件（dsh-better-sidebar）提供同款磨砂，**两级效果各自独立开关**；
v1.5.0 起还可以上传一张本地图片当玻璃底图（「透到壁纸」/「透到桌面」）；
v1.5.2 起把气泡、输入框、文件块与 cost-meter 的卡片/控件也改成同族半透明（§1.4）；
v1.6.0 起同时适配官方 DeepSeek Harness 客户端（共用同一个 `~/.dsh` profile，无需重装），原因与取证见 §1.0.2。
**只改材质，不改布局**：前三张样式表只触碰 `background` 与自定义属性；第四张（背景图）
只画一个 `body::before` 装饰层（`position` / `inset` / `z-index` / `filter` / `background-*`，
`pointer-events:none`），不参与布局，不碰任何 grid / 尺寸 / 圆角 / 内边距 / 溢出。
**也不改任何第三方插件文件**——一个字节都不碰，见 §1.1。

---

## 1. 原理（为什么这样做）

磨砂**不是这个插件做出来的**——窗口本身已经有原生毛玻璃了。
DSH NEXT（2.0.20-next）的 `app.asar/lib/main.js` 在 `macosMaterial === "transparent"` 时
仍然给窗口：

```js
{ vibrancy: "sidebar", visualEffectState: "active", backgroundColor: "#00000000" }
```

而 profile 的 `macosMaterial` 已经是 `transparent`，所以整窗背后就是一层
`NSVisualEffectView`。看起来实心的那些面，纯粹是上游的 CSS 画上去的不透明底。

### 1.0 macOS 上还剩哪几层不透明（2026-10-28 实测于 2.0.20-next）

上游**自己已经做了一部分透明化**：`[data-platform=darwin] ._1qAH1q_frame{background:0 0}`，
侧栏 `._1qAH1q_sidebarCol` 是 `color-mix(in srgb, var(--dsw-specific-sidebar-fill) 90%, transparent)`。
**仍然实心的只有三个面**，都是 `background: var(--dsw-alias-bg-base)`：

| 面 | 选择器（哈希前缀随构建变，只锚稳定局部名） | 归哪张 sheet |
| --- | --- | --- |
| 中栏 = 会话面板 | `[class*="_centerCol"]` | sheet 1（总开关） |
| 底栏 = AppFrame 第二行 | `[class*="_bottomRow"]` | sheet 1（总开关） |
| 右栏 = 侧边栏列 | `[class*="_rightbarCol"]` | sheet 2（侧边栏开关） |

本插件把这些不透明底换成一层可读的 tint，原生材质就透出来了。

### 1.0.1 v1.4.0 为什么必须改：门控从 `<body>` 搬到了 `<html>`

DSH NEXT 之前，材质门控是 `<body data-dsh-desktop-platform data-dsh-desktop-material>`；
2.0.20-next 改为 `lib/preload-app.cjs` 写 `document.documentElement.dataset.platform`
与 `documentElement.dataset.nextMaterial`，即
**`html[data-platform="darwin"][data-next-material="transparent"]`**。
旧的两个 `data-dsh-desktop-*` 属性在 app.asar 里出现 **0 次** → v1.3.2 的选择器
**一条都不命中**，所以用户看到的是"整个皮肤一次性失效"，而不是某个面板花掉。
同一版里外壳 class 也全换了（`.dshDesktopConversationSurface` /
`.dshDesktopRightbarSurface` / `.dshDesktopMacCaptionRow` 均 0 命中），故锚点一并改到
AppFrame 的三列上。
v1.6.0 起门控放宽为 `html[data-platform="darwin"]:not([data-next-material="off"])`，原因见 §1.0.2。

### 1.0.2 v1.6.0 官方客户端适配：为什么门控是「darwin 且未显式 off」

本机同时装着两个桌面壳：DSH NEXT（2.0.22-next / `@deepseek-ai/dsh` 0.2.2-rc.1）与官方客户端
`/Applications/DeepSeek Harness.app`（bundle `com.deepseek.dsh`，0.2.2-rc.1，`app.asar` 213,240,777 B）。
官方客户端的 `/lib/preload-app.cjs` **只**写
`document.documentElement.dataset.platform = process.platform`（darwin），另写
fullscreen / windowsTitlebar / windowsMenu / inputModality / dsThemeSource / dsDarkTheme /
htmlPreview / sidebarBrowserFrame / shellOverlay，**从不写 `dataset.nextMaterial`**。而它的
`/lib/main.js` 的 `createWindow` 在 darwin 下恒定带 `titleBarStyle:"hiddenInset"`、
`trafficLightPosition:{x:16,y:18}`、`vibrancy:"sidebar"`、`visualEffectState:"active"`、
`backgroundColor:"#00000000"`，整个文件 grep `macosMaterial` **0 命中**——官方窗口本身就是原生磨砂，
没有「关闭材质」这个状态。所以语义必须反过来：**属性不存在 = 有磨砂**。

**为什么不保留 exact `transparent`**：官方客户端下该属性永远是 `undefined`，exact 门控一条都不命中
（旧门控在官方窗口形态下的实测值是空串，见下面的五用例），整片皮肤会再次全灭；而「官方客户端」与
「NEXT 且材质 off」在页面 DOM 上没有第二个静态信号可区分——`data-platform` 两边都是 `darwin`，
其余 preload 属性是窗口/主题/输入模态，与材质无关；`macosMaterial` 只存在于 NEXT 的 `main.js`，
不落到页面里，去读宿主日志或 profile 又会让纯 CSS 注入变成有状态读取。既然「官方」与
「NEXT transparent」都该磨砂，唯一正确的判别式就是「darwin 且不是 off」。

**`:not()` 的语义**：`html[data-platform="darwin"]:not([data-next-material="off"])` 在 NEXT 下仍只有
两种取值——`transparent` 命中（与 v1.5.2 行为逐字一致）、`off` 不命中（窗口 opaque，保持原生）；
在官方客户端下属性缺失，`:not()` 自然成立。四张样式表全部同步，**没有第二个门控分支**，
所以不存在「一张表开、另一张表关」的半开状态。设置页的 `active` 判定同步改为
`root.dataset.platform === "darwin" && root.dataset.nextMaterial !== "off"`，官方客户端不再误报
「当前窗口没有启用玻璃背景」。

**已知副作用（用户已接受）**：NEXT 的 `nextMaterial` 由 preload 异步 `invoke` 写入，用户把材质设为
`off` 时，启动瞬间属性尚未到位，门控会短暂命中一次，出现一次玻璃色闪现，随后消失；
官方客户端属性永不存在，无此问题。

**取证**：

- 两个 App 共用 `~/.dsh`：官方 `resolveDesktopPaths()` → `profile=~/.dsh/profiles/desktop`、
  `lock=~/.dsh/profiles/desktop/lock`，`defaultDshHome()=~/.dsh`（`DSH_HOME` 可覆盖）。profile 的
  `dsh.profile.bundles` 已含 `dsh-vibrancy-skin`、`dependencies` 为
  `link:/Users/leixiaokang/Documents/DSH-Projects/dsh-vibrancy-skin` → 官方客户端加载**同一个 profile**，
  无需重装。
- 两份 `@deepseek-ai/dsh-client-ui-layout/lib/client.js` 同构、CSS 规则内容一致，仅 CSS-module
  哈希前缀不同：官方 `PIRFFq_centerCol/_rightbarCol/_bottomRow/_frame/_sidebarCol`（38,890 B，
  md5 `f33fd1cf2068380d1c8172131cfa7f8d`），NEXT `VFpnAa_*`（38,933 B）。插件只锚
  `[class*="_centerCol"]` 这类稳定局部名，两边都命中。
- 真实 CSS 引擎（chrome-headless-shell 1223，把 `client.js` 四张表的 CSS 原样抽出注入，读 `body`
  的 `--dsh-vib-tint-strength`）：官方形态（platform=darwin，**无** nextMaterial）→ `"40%"`；
  NEXT transparent → `"40%"`；NEXT off → `""`；platform=linux → `""`；对照：同一官方形态 +
  **旧**门控 → `""`（证明旧门控在官方客户端确实整片失效）。探针页在 `/tmp/gate-probe/`（临时文件，不入仓库）。

### 三条不可松弛的红线

1. **绝不使用 `backdrop-filter`。** 上游源码注释写得很直白：
   > "... an opaque themed layer stays readable even when Chromium cannot blur
   > the transparent vibrancy window."
   
   在透明 vibrancy 窗口上做窗口内模糊，只会糊上一层均匀灰雾（上一版 6 个面全
   用 backdrop-filter，用户原话：「我现在连整个窗口都被蒙上了一层灰，我什么也
   看不见了」）。模糊交给系统，CSS 只负责"把挡住它的东西挪开"。
   v1.5.0 的「背景图」也只对**图片自身**做 `filter: blur(var(--dsh-vib-frost, 36px))`（v1.5.1 起可调），不是窗口内采样（§1.3）。
2. **只改材质，不改布局。** 前三张表只允许 `background*` 与自定义属性；第 4 张只允许
   一个 `body::before` 装饰层（`pointer-events:none`，不占布局）。
3. **tint 必须无环。** tint 用**静态调色板**（`--dsw-static-neutral-bluish-00/950`）
   合成，**绝不能**引用 `--dsw-alias-bg-base`——那正是被覆盖的属性，自引用会
   解析成 guaranteed-invalid 值，整个面板变全透明不可读。

### 为什么覆盖 token 而不是逐个选择器

`--dsw-alias-bg-base` 是上游**唯一**用来画会话区内部不透明层的 token。全量
grep 出货的爆炸半径只有 13 个包的直接消费点：`ConversationRoot` 根元素、
输入区渐隐座（composer seat）、附件卡片/缩略图/编辑器、sticky 表格行、
AskQuestion / Inspect 卡片。把这一个 token 在中栏 `[class*="_centerCol"]` 子树内重定向，这些全部自动跟随，
**一处生效、零遗漏**。哈希前缀（`_1qAH1q_`、`uPhUma_`）每次构建都会变，所以只锚
稳定局部名 —— 命不中最多是"磨砂不出现"，见 §1.1 的失效模式。

已核实**安全**：没有任何 alias token 是从 `bg-base` 派生的；菜单/弹层走
`--dsw-specific-menu` ← `--dsw-menu-surface-fill`（在 transparent 模式下上游强制
`var(--dsw-alias-bg-layer-2)`），而 `--dsw-alias-bg-layer-*` 全部由静态调色板
派生 → **菜单与弹层保持不透明、可读**。输入框走 `--dsw-specific-input-major`，
同样不受影响。

面板自身设为 `transparent` 是刻意的：让当前面板去画**唯一一层** tint，避免
父面 + 根元素各画一层半透明而把不透明度悄悄叠成两倍。

### 刻意不碰的地方

| 元素 | 原因 |
| --- | --- |
| `[class*="_sidebarCol"]`（原 `.dshDesktopSidebarSurface`） | 上游在 darwin 上已是 `color-mix(… 90%, transparent)`，它就是要对齐的**参照物**；再染一次会叠成两层 |
| `[class*="_frame"]`（原外壳根） | 上游在 darwin 上已是 `background: 0 0` |
| `[class*="_rightbarCol"]` 列根 | 只在 sheet 2 里设为 transparent + 重定向 token；侧边栏磨砂走 §1.1 的独立作用域 |
| 第三方插件的布局 / 组件 / 构建产物 | 一行都不改；只经由作者文档化的 token 契约改材质（§1.1） |
| 菜单 / 弹层 / 输入框 | 它们多数走 `--dsw-specific-menu`、`--dsw-specific-input-major`，本来就与本次重定向无关；真正会吃到 `--dsw-alias-bg-base` 的 `dialog` / `[role=dialog]` 由**规则 4** 单独还原成不透明（§1.2） |

---

## 1.1 侧边栏（better-sidebar）是怎么磨砂的

**结论：能做到，而且不用碰 `dsh-better-sidebar` 的任何文件。**

作者在源码里把这条路留好了（`src/client/sidebar.module.css:13-21` 原文）：

> every surface here consumes DSH's generic tokens (`--dsw-alias-*`),
> NEVER `--dsw-specific-sidebar-fill` … The panels use the generic card surface
> `--dsw-alias-bg-layer-1`, which every dsh-web-ui skin overrides (see AGENTS.md §8)

也就是说：**用 DSH 通用 token 而不是私有 token，就是为了让皮肤来覆盖它**。本插件
顺着这个契约，在**三个锚点**上重定向 token：

```css
/* (a) 插件自己在 src/client/index.tsx:289 挂到 <body> 上的宿主元素（普通属性标记） */
[data-dsh-better-sidebar],
/* (b) AppFrame 的第三列。v1.3.2 用的是 .dshDesktopRightbarSurface[data-rightbar-col]，
       2.0.20-next 起那个 class 不存在了：列搬进 ui-layout 的 AppFrame，变成
       '._1qAH1q_rightbarCol{background: var(--dsw-alias-bg-base)}'。哈希前缀随构建变，
       所以只锚局部名；子节点仍是 renderSlot("rightbar", …)，也就是侧边栏真正的落脚点 */
[class*="_rightbarCol"],
/* (c) dockkit 的 dock 单元（DSH 用 var(--dsw-alias-bg-base) 给 dock 的 tab host 上底色） */
[data-dockkit-host="dock"] {
  --dsw-alias-bg-base: var(--dsh-vib-pane);
}
```

**为什么必须带上 (b)(c)，只染色 (a) 不够**（这是实测出来的，不是猜的）：本机装的是
dsh-better-sidebar 0.22.0，它的 `[data-dsh-better-sidebar]` 宿主是**空且零高**的 `div`
（里面只有隐藏的底部工作台），而用户看到的文件树/编辑器是 DSH 第三列里的
**应用自己的 dock**：

```
section._tabHost_<hash>_<idx>._pane_<hash>_<idx>   → 计算值 rgb(21,21,23) = 未染色的 --dsw-alias-bg-base
DSH 前端 CSS：._tabHost_<hash>_<idx>:not(._float_…){ background: var(--dsw-alias-bg-base) }
```

它不在 (a) 的子树里，所以 v1.3.0 只开了 (a) 时整列仍然不透明（用户当时的反馈正是
"仅 better-sidebar 的上部菜单变了磨砂，本体还是老样子"）。(b) 是这一列的列根，
覆盖 dock；(c) 是 dock 自己，万一哪天被 portal 到别处也仍然命中。

`data-dsh-better-sidebar` 是作者写的**普通属性标记**（不是 CSS-module 哈希），
`[data-dockkit-host]` 是 dockkit 的公开 data 属性，两者每次更新都还在；
`_rightbarCol` 是哈希类名，只锚**局部名**——前缀变了最坏是漏染，不会误伤别的元素。
列根自己设为 `transparent`，让 dock 的 tab host 去画唯一一层 tint，与 §1 中栏同一处理方式。
两级效果：

| 级别 | 开关（默认） | 做什么 | 为什么这样切 |
| --- | --- | --- | --- |
| 面板层 | 侧边栏面板磨砂（**开**） | 重定向 `--dsw-alias-bg-base`：面板本体 `.pane`、dock 的 tab host、改动视图根、任务图、浮动窗；再单独给 34px 标签栏、底部工作台、dock tab host 写 `background` | 这就是"整个 better-sidebar 界面"，与右侧会话面板同一层材质 |
| 深层玻璃 | 深层玻璃（**关**） | 在同样的三个锚点上再重定向 `--dsw-alias-bg-layer-1`：卡片、列表行、chip、节点卡、内联编辑器等约 25 处嵌套表面 | 透出更多桌面、文字对比度下降，属于口味问题，所以默认关、单独一个开关 |

两级都是**纯 CSS 声明**，只写 `background` 与自定义属性：

- **失效模式只有一种**：锚点或哈希前缀哪天变了 → 规则不匹配 → **磨砂不出现**，
  侧边栏回到原样。**不会崩溃、不会白屏、不会改变任何尺寸**（没有一条声明涉及布局）。
- 关掉开关 = 摘掉对应的 `<style>` 元素，**零残留**，不存在"半开"状态。
- 与总开关是「与」关系：总开关关掉时，整张样式表都不在，三级一起回到原生。
- 未安装 dsh-better-sidebar 时，设置页会显示提示并禁用这两个开关（不影响会话面板）。
- 若哪天侧边栏被拖到别的列（比如底部 dock 或浮动窗），需要在 (b)(c) 之外补一个锚点，
  一行的事——那属于"磨砂不出现"，不会坏。

---

## 1.2 弹层（dialog）为什么保持不透明 — v1.3.2 修 dsh-cost-meter「费用明细」全透明

**症状**（用户报告）：打开 dsh-cost-meter 新版的「本会话费用明细」面板后，整块面板变成
透明的，背后会话正文透上来跟面板数字叠在一起，没法看。与 better-sidebar 的设置无关。

**根因**（代码取证，`dsh-cost-meter@1.8.6/lib/client.js` 的 `fs()` 组件）：

```js
return e(E, null,
  e("button", { className: "cm-btn cm-stat-entry …", onClick: … }, "费用明细"),
  r ? e("dialog", { ref: l, role: "dialog", onCancel: …,
    style: { width: "min(1160px,94vw)", maxHeight: "90vh", padding: 24,
             borderRadius: 16, border: "1px solid var(--dsw-alias-border-l1)",
             color: "var(--dsw-alias-label-primary)",
             /* ↓ 就是这一行 */
             background: "var(--dsw-alias-bg-base,#fff)" } }, …) : null);
```

- 入口按钮与面板在**同一个 React fragment** 里（`e(E, …)`），面板是一个**普通 DOM 里的
  `<dialog>`**（没有 portal），`showModal()` 只把它提升到 top layer 绘制，**不改变 CSS 继承**。
- 它用**行内样式**把底色写成 `var(--dsw-alias-bg-base)`；而这个 token 恰好就是 §1 规则 2/3
  重定向的那一个 → 面板拿到的是一层 tint（用户当时 15% 强度 → 近乎全透明）。

**修法**（规则 4，`client.js` 的 sheet 1）：token 是「在哪里声明就在哪里求值」的，所以
在 `<body>` 上先备好**主题无关的静态色**，再把它交还给弹层：

```css
/* 快照：v1.4.0 起直接取自静态调色板（ui-theme 里 alias 就是对这两个值的转发） */
html[…] body         { --dsh-vib-bg-base-solid:    var(--dsw-static-neutral-bluish-00, #fff);
                       --dsh-vib-bg-layer-1-solid: var(--dsw-static-neutral-bluish-00, #fff); }
html[…] body[dark]  { --dsh-vib-bg-base-solid:    var(--dsw-static-neutral-bluish-950, #151517);
                       --dsh-vib-bg-layer-1-solid: var(--dsw-static-neutral-bluish-875, #1c1c1f); }

/* 规则 4：不透明面交还给所有弹层（在弹层元素本身上声明，压过继承） */
html[…] :is(dialog, [role="dialog"], [role="alertdialog"]) {
  --dsw-alias-bg-base:    var(--dsh-vib-bg-base-solid);
  --dsw-alias-bg-layer-1: var(--dsh-vib-bg-layer-1-solid);
}
```

> v1.3.2 的快照写法是 `var(--dsw-alias-bg-base)`（利用"在声明处求值"截获上游原值）。
> 2.0.20-next 里 ui-theme 把 alias 写成了静态 token 的转发，可以直接引用源头，**无环**
> 且在语义上完全等价，所以 v1.4.0 改成直取静态色。
>
> 另外：NEXT 重建后的 Modal 已经改用 `--dsw-alias-bg-layer-2`（上游保证不透明），
> 所以原生弹层不再需要这条规则；保留它是为了那些**用行内 `var(--dsw-alias-bg-base)`
> 自绘底**的第三方面板（实测 dsh-cost-meter 的「费用明细」就是这种）。

三个刻意的选择：

1. **还原 token，而不是给弹层写死 `background`**：弹层内部如果有卡片/列表也吃
   `--dsw-alias-bg-base` / `-bg-layer-1`，它们会一起回到原生实心，不会出现「壳实心、内层还是
   透的」。
2. **不绑定某一个面板作用域**（不写 `[class*="_centerCol"] :is(…)`）：弹层可能挂在
   会话区、标题栏或 `<body>` 上（portal 与否由第三方决定，随时会变），全局按平台+材质门槛
   生效最稳。皮肤的 token 重定向只发生在本插件自己的作用域里，所以这条规则在别处是空操作，
   不可能改变原生弹层外观。
3. **跟着总开关走**：它在 sheet 1（`enabled`）里，关掉皮肤时整张表被移除，弹层自然回到原生。

**失效模式**：第三方把面板改成 portal 到 body、或改用自己的 class/属性 → 最坏是本规则不再
命中，弹层变回「被 tint 透掉」的样子；不会让任何面板变得更糟（它不会覆盖非本插件的作用域）。

---


## 1.3 背景图与磨砂度（v1.5.0 / v1.5.1）：为什么是页面内一层，而不是让系统再透一点

需求：可以上传一张图片，让磨砂面板透出这张图（「透到壁纸」）；也可以选择「透到桌面」，
保持原来的原生材质。**v1.5.0 的语义（A 方案）**：

| 模式 | 观感 | 实现 |
| --- | --- | --- |
| `desktop`（默认） | 与 v1.4.0 完全一致：玻璃后面是真实桌面 | 第 4 张表**不存在** |
| `wallpaper` | 上传图铺满整窗当玻璃底图，面板磨砂透出这张图 | 第 4 张表 + `--dsh-vib-bg-image` |

### 为什么不让窗口自己再透

三条路都堵死了（2026-11-06 取证于 `app.asar`）：

1. **宿主进程没有 Electron 主进程 API。** 运行的 host 是独立 Node 进程
   （`app.asar/lib/host.js`，Electron 二进制但无 `BrowserWindow`），
   preload 只暴露读取材质的 `dsh-next:material`（invoke 读），没有设置窗口材质的接口。
2. **窗口材质是创建时定死的。** `main.js` 创建窗口时传
   `vibrancy: "sidebar", visualEffectState: "active", backgroundColor: "#00000000"`，
   后续只在 `main.js:874` 按 `macosMaterial` 在 `"sidebar"` 与 `null` 之间切。
   Electron 框架二进制里虽然能搜到 `under-page` 字符串，但没有可用的调用面。
3. **改系统壁纸是系统级副作用**（`systemPreferences.setDesktopWallpaper`），
   不可逆、影响面超出本插件，不做。

所以唯一可控的位置是**页面内的一层**：`html` / `body` / `#root` 在 darwin 上本来就透明
（`app.css`：`html[data-platform=darwin] body{background:transparent}`），
原生 `NSVisualEffectView` 在 Z 轴最下面；在它上面、所有内容下面再垫一层图片即可。

### 第 4 张表只做三件事

```css
html[data-platform="darwin"]:not([data-next-material="off"]) body::before {
  content: "";
  position: fixed;
  inset: -64px;              /* 让模糊边缘落在视口外，避免硬边 */
  z-index: -1;               /* 原生材质之上、全部内容之下 */
  pointer-events: none;      /* 绝不拦截点击/拖拽 */
  background-image: var(--dsh-vib-bg-image);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: blur(var(--dsh-vib-frost, 36px)); /* 半径由设置页「磨砂度」控制 */
}
```

门控字面量自 v1.6.0 起为 `html[data-platform="darwin"]:not([data-next-material="off"])`
（官方客户端不写 material key 时同样命中），见 §1.0.2；下面三件事不变。

- **开关 = `<style>` 存在与否**（沿用既有约定）：`wanted = enabled && bgMode==="wallpaper" && bgUrl!==null`。
  切回「透到桌面」、关总开关、移除图片 → 整张表消失，零残留。
- **图片经一个内联自定义属性传入**（`body.style.setProperty("--dsh-vib-bg-image", 'url("blob:…")')`），
  与 tint 同理：优先级最高，且随表一起消失。
- **为什么不用 `backdrop-filter`**：红线 1。那种写法要采样窗口后面的东西，在透明 vibrancy
  窗口上就是整片灰雾；这里的 blur 只作用在图片自己的像素上。

### 磨砂度（v1.5.1）：0 = 最清晰、100 = 纯雾面

- 半径不是写死的：`--dsh-vib-frost` 由 `applyFrostInline()` 写到 `body`，默认 `36px`，
  设置页滑杆 0–100 直接映射成 0–100 px（`36` 就是 v1.5.0 已验收的观感，升级不突变）。
- `0` = 图片完全不模糊（能看清壁纸细节，面板本身仍按 tint 磨砂）；`100` = 细节被抹平，只剩色块。
- **「透到桌面」模式下滑杆置灰**：那层模糊由 macOS 的 `NSVisualEffectView` 材质决定，CSS 改不了；
  不拿半透明雾面罩去假装（会更灰、文字对比度下降，属于视觉欺骗）。
- 关闭总开关时 `applyFrostInline()` 会 `removeProperty`，不留内联变量。

### 图片怎么进来、存在哪

1. 文件选择 → `createImageBitmap(file, { imageOrientation: "from-image" })`
   （EXIF 方向跟着转）→ `canvas` 长边缩到 **2048 px** → `toBlob("image/webp", 0.9)`；
2. 压缩后的 Blob 存 **IndexedDB**：db `dsh-vibrancy-skin` / store `bg` /
   记录 `image`（`{ id, blob, name, updatedAt }`，keyPath 是 `id`）；
3. 运行时只用 `URL.createObjectURL(blob)` 生成的 `blob:` URL，**从不把图片转成 base64 塞进
   CSS 或 localStorage**（5 MB 上限 + 字符串化会让大图直接失败）；
4. 启动时 `restoreBgImage()` 异步读回 Blob、重建 objectURL、再决定要不要装第 4 张表。
   失败（没有 IDB / 记录丢了 / 模式已切回 desktop）一律静默，保持「透到桌面」观感。

**隐私**：图片只在本机解码、压缩、存储；插件没有网络请求，也没有上报。设置页的
`bgHint` 明确写了"不联网、不上传"。**换 profile 或清站点数据会丢图**（origin 是
`dsh-app://app`，同一 profile 内稳定）。

### 失败模式（都是"退回桌面"，不会更糟）

| 情况 | 结果 |
| --- | --- |
| 没有 `createImageBitmap` / `canvas` / `toBlob` | 提示"无法解码"，不改任何状态 |
| 文件 > 30 MB | 提示先压缩，不读文件 |
| 没有 `indexedDB` / `URL.createObjectURL` | 当次可显示则显示；重启后回到桌面 |
| `wallpaper` 但图片记录不在 | 不装表 → 桌面观感；设置页显示"还没有选择图片" |
| 关总开关 / 切回桌面 | 表与内联变量同时摘掉，像素级回到原生 |

性能：整窗只有**一个** fixed 装饰层；模糊的是 2048 px 的 WebP（一般 < 1 MB），
不是每帧采样。CPU/GPU 开销远低于 backdrop-filter 方案。

### 行内代码块（v1.5.1）：把实心色改成半透明

聊天里的行内代码（`` `foo` ``）原本是一块实心底色：上游规则是
`._markdown_… :not(pre) > code { background-color: var(--dsw-alias-markdown-inline-code) }`，
而这个 token 是**实色**（浅色 `neutral-50` / 深色 `neutral-800`），所以在浅色壁纸上像贴了一块胶带。

v1.5.1 在门控作用域内把它改成 45% 不透明（颜色仍跟主题走）：

```css
html[data-platform="darwin"]:not([data-next-material="off"]) [class*="_markdown_"] :not(pre) > code {
  background-color: color-mix(in srgb, var(--dsw-alias-markdown-inline-code, #808080) 45%, transparent);
}
```

- 不写死颜色：换主题时 `--dsw-alias-markdown-inline-code` 变，`color-mix` 跟着变。
- 保留上游的细边框，块仍有边界；`padding` / `border-radius` 一律不碰（只改材质）。
- **围栏代码块（```）不动**：大块代码需要稳定底色保证可读性。
- 门控字面量 v1.6.0 起为 `html[data-platform="darwin"]:not([data-next-material="off"])`
  （官方客户端同样命中），见 §1.0.2。

## 1.4 半透明表面（v1.5.2）：五处「实心块」为什么还扎眼，怎么改

v1.5.0 / v1.5.1 之后，壁纸能透出来了，但有五类表面仍然是一块**实心色**：

| # | 表面 | 谁画的 | 上游底色 | v1.5.2 改成 |
| --- | --- | --- | --- | --- |
| 1 | 用户消息气泡 | dsh-client-ui-chat | `--dsw-specific-bubble` | 58% 同族色（浅 `deepseek-50` / 深 `bluish-850`） |
| 2 | 消息输入框 | dsh-client-ui-conversation | `--dsw-specific-input-major` | 64% |
| 3 | 「已编辑 N 个文件」块 | dsh-client-ui-deliverables | `--dsw-alias-bg-layer-1` + `--changes-fill` | 卡片/填充 52%，hover 70% |
| 4 | cost-meter 侧栏卡片（今日/余额/平价） | dsh-cost-meter | `.cm-footer-stack` + 内层 `.cm-bbox` 也是实心 | 外层 44%，内层 `transparent` |
| 5 | 费用角标 / 费用明细按钮 | dsh-cost-meter | `--dsw-alias-bg-layer-2` / `--dsw-alias-button-elevated-fill` | 42% / 46% |

原则和 §1.3 一致：**只改材质，不碰布局**；颜色一律 `color-mix(in srgb, <原 token> N%, transparent)`，
不写死 RGB，换主题/换 tint 都跟着走。全部规则挂在
`html[data-platform="darwin"]:not([data-next-material="off"])` 下，因此关总开关就整体退回实心
（v1.6.0 起放宽，官方客户端不写 material key 也命中，见 §1.0.2）。

**为什么五处不用同一个百分比**：它们面积、层级、文字密度都不同。气泡面积小且文字少，58% 就够透；
输入框要长期承载光标与多行文字，64% 保证对比度；文件块是信息卡片，52% 仍能看清文件名；
侧栏卡片在最边缘、背后就是壁纸，44% 即可；两个小控件面积更小，42% / 46% 避免「糊成一团灰」。
smoke test 会断言这组值**至少 5 个不同**，防止以后被「统一成一个变量」改回去。

**为什么不用 `backdrop-filter`**：还是那条红线（§1 红线 1）。这里的透明是**一层半透明色叠在已有磨砂面上**，
不做窗口采样，因此不会糊成灰雾；代价是背后的颜色是「面板色 × 壁纸」的合成结果，而不是实时模糊采样——
在 macOS vibrancy 窗口里这正是想要的效果。

**选择器为什么这么挑**：

- 气泡没有稳定 `data-*`，但 `--dsw-specific-bubble` 只被气泡消费 → 在门控 `body` 上重定义该 token 最稳，
  不依赖上游 CSS 的 hash 类名（hash 每次构建都会变）。
- 输入框 / 文件块有稳定属性 `[data-composer-card]` / `[data-changed-files]`，直接锚属性；
  文件块的 header 底色走的是它自己的 `--changes-fill` / `--changes-hover`，在卡片作用域里覆盖这两个变量即可。
- cost-meter 的类名是字面量（`cm-*`，不是 hash），但它自己有一套 `followSkinTransparency` 开关，
  只覆盖费用页/侧栏的一部分表面；本插件不依赖那个开关，直接覆盖卡片与控件。
- `.cm-bbox` 有一条独立兜底（50%），并被 `.cm-footer-stack` 内层的 `transparent` 规则按特异性压过，
  这样卡片无论出现在 footer 还是聊天 turn tail 都不会是实心。

**失败模式**：上游改类名/属性 → 该条规则变成空操作，对应表面退回实心（不会更糟）；
上游 token 不存在 → 规则带 fallback，仍是半透明；主题切换 → 深浅两支分别覆盖。


---

## 2. 安装

源码留在这里（**不要把 `node_modules` 当源码改**），文件拷进 profile：

```bash
P=~/.dsh/profiles/desktop
SRC=/Users/leixiaokang/Documents/DSH-Projects/dsh-vibrancy-skin   # 2026-10-04 起本仓库在此；旧路径已改为指向它的软链

# 1) 备份现盘（必须）
cp "$P/package.json"       "$P/package.json.bak-$(date +%Y%m%d-%H%M%S)"
cp "$P/cordis.patch.yml"   "$P/cordis.patch.yml.bak-$(date +%Y%m%d-%H%M%S)"

# 2) 投放包体
cp "$SRC"/package.json "$SRC"/index.js "$SRC"/client.js "$SRC"/cordis.patch.yml \
   "$P/node_modules/dsh-vibrancy-skin/"

# 3) 挂载（bundle 通道，已在 2026-09-28 02:44:05 实测生效过）
#    a. dependencies 需要含 "dsh-vibrancy-skin": "*"
#    b. dsh.profile.bundles 需要含 "dsh-vibrancy-skin"
#    c. profile 的 cordis.patch.yml 里如果出现：
#         - id: vibrancy-skin
#           disabled: true
#       那是旧的 kill switch，会让宿主每次都刷
#       `patch: entry "vibrancy-skin" not found`，删掉。
#       （插件管理器/市场自己写的 `disabled: false` 是空操作，留着无害；
#        `bash verify.sh` 第 3 节只对 `disabled: true` 报红。）
```

**挂载生效的运行时判据**：profile 里有 `- id: vibrancy-skin` 这一行时，若宿主日志
**没有** `patch: entry "vibrancy-skin" not found`，就说明该 entry 确实存在于 loader
栈里（bundle insert 建好了它）。2026-09-28 04:01 的两次 live patch reload 即为此状态。

重启 DSH Desktop 后，宿主日志
`~/.dsh/logs/desktop-next.log`（2.0.20-next 起；旧路径 `DSH Desktop/logs/host/` 见 verify.sh 的回退）
应当**不再**出现 `patch: entry "vibrancy-skin" not found`。

> ⚠️ 不要用 `pnpm install` / `pnpm remove` / 市场卸载来管理这个包。
> dependencies 里的 `"*"` 没有 lockfile 条目，任何 pnpm 物化都会
> `ERR_PNPM_UNEXPECTED_STORE` 退出 1，并可能只删掉 bundles 条目而留下悬空态
> （2026-09-28 02:56 就这样坏过一次）。

---

## 3. 调参

### 3.1 从设置界面调（推荐，改动即时生效）

**设置 → 磨砂玻璃 / Vibrancy**（在设置导航里紧挨着内置的「桌面」页，order 101）。

这一页不是自己画的 UI，而是直接复用了 DSH Desktop 官方设置页的样式类
（`dshDesktopSettings*`，由 `dsh-plugin-desktop` 无条件安装），所以它在浅色/深色
主题下与「桌面」页外观完全一致。**六组控件、三个开关**（另加背景图的模式卡片与图片按钮）：

| 分组 | 控件 | 作用 |
| --- | --- | --- |
| 外观 | 「启用磨砂玻璃」开关（总开关） | 关 = 摘掉全部样式表，**像素级回到原生**（不是 tint 100%，见下） |
| 背景图（v1.5.0） | 「透到桌面」/「透到壁纸」两张卡片 + 选择/更换/移除图片 | 壁纸 = 上传图铺满整窗当玻璃底图；桌面 = 原生透真实桌面。图片本机压缩后存 IndexedDB，见 §1.3 |
| 侧边栏（better-sidebar） | 「侧边栏面板磨砂」开关（默认**开**） | 面板本体、标签栏、底部工作台、改动视图、任务图、浮动窗变成同款磨砂 |
| 侧边栏（better-sidebar） | 「深层玻璃（卡片 / 列表）」开关（默认**关**） | 连内部卡片、列表、内联编辑器也一起玻璃化；对比度会下降 |
| 强度 | 磨砂 / 均衡 / 实心 三张卡片 | 24% / 40%（默认）/ 62%，**三级色板共用** |
| 磨砂度（v1.5.1） | 0–100 滑杆 + 当前 px 值 + 「恢复默认」 | 只调壁纸层的模糊半径：0 = 最清晰、100 = 纯雾面、默认 36；「透到桌面」时置灰 |
| 微调 | 0–100 数字输入 + 「恢复默认」 | 预设不够用时精确指定 |

选择写进 `localStorage`（`dsh-vibrancy-skin:tint` / `:enabled` / `:panels` / `:deep` /
`:bg-mode` / `:bg-name` / `:frost`），下次启动自动恢复。两个侧边栏开关在总开关关闭时显示为灰色
（因为整张样式表都不在）。背景图本身不进 localStorage，走 IndexedDB（§1.3）。

**为什么「关」是摘样式表而不是 tint 归 0 或 100**：tint 100% 只把
`.dshDesktopConversationSurface` 置为 transparent，而画 tint 的是当前面板的根元素
——会话面板会补上，其它占 main 槽的面板（轨迹/技能/预览…）不会，窗口材质就会从那里
漏出来。摘掉整张样式表则是零残留、零额外 CSS，且不需要给 body 加任何属性，也就不会
和上游 / 第三方插件的属性约定打架。

> 关于持久化：`localStorage` 按 origin 隔离，而桌面版固定走默认端口
> （当前 `http://127.0.0.1:43120`），profile 里没有显式 port 覆盖，所以实践上是持久
> 的。若哪天端口变了导致偏好丢失，再改走宿主 `Config` schema（`ctx.settings`）通道。

### 3.2 控制台（备用）

```js
dshVibrancySkin.setTint("24%")    // 更透 → 更磨砂、文字对比度下降
dshVibrancySkin.setTint("40%")    // 默认
dshVibrancySkin.setTint("62%")    // 更实 → 更接近原来的实心面板
dshVibrancySkin.setTint("")       // 复位
dshVibrancySkin.setEnabled(false) // 总开关（会话面板 + 侧边栏一起）
dshVibrancySkin.setPanels(false)  // 只关侧边栏"面板层"
dshVibrancySkin.setDeep(true)     // 打开"深层玻璃"
dshVibrancySkin.setBgMode("wallpaper") // 透到壁纸（需要有图；无图时等同于桌面观感）
dshVibrancySkin.setBgMode("desktop")   // 透到桌面（默认）
dshVibrancySkin.setFrost(36)           // 磨砂度：0 = 最清晰、100 = 纯雾面（只在壁纸模式可见）
// setBgImage(blob, name) / clearBgImage() 也暴露了，正常走设置页的「选择图片」即可
dshVibrancySkin.resetAll()        // 回到出厂：40% / 面板开 / 深层关 / 总开关开 / 透到桌面 / 磨砂度 36（保留已存图片）
dshVibrancySkin.getState()        // { enabled, panels, deep, tint, frost, bgMode, bgName, bgUrl, defaultTint, presets }
dshVibrancySkin.subscribe(fn)     // 订阅（设置界面就是靠它同步的）
```

预设也能直接取：`dshVibrancySkin.variants.{frost,balanced,solid}`。

要永久改默认值就改 `client.js` 里那一行：

```css
--dsh-vib-tint-strength: 40%;
```

---

## 4. 回滚

**已有现成回滚点**（v1.3.0 开工前备份，见 `.backup/LAST_BACKUP_TS`）：

```bash
SRC=/Users/leixiaokang/Documents/DSH-Projects/dsh-vibrancy-skin
TS=$(cat "$SRC/.backup/LAST_BACKUP_TS")          # 例：20260928-054614

# 方式一：整包回到上一个版本（v1.2.0）
rm -rf "$SRC".v1.3.0 && mkdir -p "$SRC".v1.3.0
cp -R "$SRC"/{package.json,index.js,client.js,cordis.patch.yml,README.md,STATE.md} "$SRC".v1.3.0/
tar -xzf "$SRC/.backup/dsh-vibrancy-skin-v1.2.0-$TS.tar.gz" -C "$SRC"     # 覆盖回 v1.2.0
# （包目录是软链，工作区一改就生效，无需再拷贝到 profile）
```

```bash
# 方式二：只关侧边栏那两级（保留会话面板磨砂）
dshVibrancySkin.setPanels(false)
dshVibrancySkin.setDeep(false)
```

```bash
# 方式三：彻底卸载 = 改 profile/package.json 去掉两处 dsh-vibrancy-skin
#         dsh.profile.bundles 与 dependencies
P=~/.dsh/profiles/desktop
cp "$P/package.json" "$P/package.json.bak-$(date +%Y%m%d-%H%M%S)"
# 备份原件在 $SRC/.backup/profile-$TS/{package.json,cordis.patch.yml}
```

**零风险降级**：即使本样式表整段失效（`color-mix` 不支持、静态 token 改名、
属性组合不匹配、第三方插件改了锚点），受影响的声明只是整条作废，上游原本的
不透明规则继续生效——回到原生观感，不会变成全透明不可读，更不会影响插件的
运行与布局。

> ⚠️ `.backup/installed-v1.x-*` 是**软链接**（指向工作区），不能当回滚点；
> 用 `.backup/v1.2.0-<TS>/` 目录或 `.backup/dsh-vibrancy-skin-v1.2.0-<TS>.tar.gz`。

---

## 5. 验收清单

`[x]` = 已经确认过（有记录）；`[ ]` = 没被明确看过的，用的时候顺手扫一眼即可。

**基础磨砂（v1.1.0 / v1.2.0 时期已确认）**

- [x] 宿主日志不再有 `patch: entry "vibrancy-skin" not found`
- [x] 右侧会话区透出桌面并呈磨砂感（初始需求的验收点）
- [x] 控制台/运行时可运行的证据：三张 `<style>` 都在、token 解析成 tint（探针实测，
      2026-09-28 06:0x；报告留在 `/tmp/dsh-vibrancy-probe.ndjson.done`）
- [x] **设置里多出「磨砂玻璃 / Vibrancy」一页**，位置紧挨内置「桌面」页之后
- [x] 该页共 4 组控件、3 个开关（总开关 / 侧边栏面板 / 深层玻璃）——渲染树已在 smoke test 里逐项断言
      （v1.5.0 增加「背景图」组后为 5 组；v1.5.1 再增加「磨砂度」组，现为 6 组 / 3 开关）
- [x] 在这页调强度当场生效（用户把强度调到 15%，探针读到的就是 15%）

**侧边栏磨砂（v1.3.1 起，用户已确认）**

- [x] **better-sidebar 整列（面板本体 + 标签栏 + dock tab host）变成同款磨砂**
      —— 用户原话：整列磨砂了，已达成我目前的需求
- [x] 三级与总开关是「与」关系（代码与 smoke test 双重覆盖；探针实测开关只摘自己那张表）
- [x] 侧边栏文字在当前强度（15% + 深层玻璃开）下可读（用户未提对比度问题）

**弹层可读性（v1.3.2）**

- [x] 规则 4 已写入 sheet 1，且 smoke test 断言：快照取自上游 token、`:is(dialog, [role="dialog"],
      [role="alertdialog"])` 拿到两个不透明 token、规则不绑定单个面板作用域
- [x] 打开 dsh-cost-meter 的「费用明细」面板，面板是**实心可读**的（不再是透明的）——2026-10-04 用户确认
- [x] 顺带看：设置里的弹层、插件管理器确认框、`@`/`/` 补层在任何强度下都不透明——2026-10-04 用户确认

**DSH NEXT 适配（v1.4.0，2026-10-28）**

静态侧已知全绿（可复核，不是"感觉好了"）：

- [x] 门控改到 `html[data-platform="darwin"][data-next-material="transparent"]`，
      与 `lib/preload-app.cjs` 实际写的属性逐字一致（在 app.asar 里 grep 到源头）
- [x] 三个不透明面的锚点取自 ui-layout 的实际规则（`_centerCol` / `_bottomRow` / `_rightbarCol`
      都实测 `background: var(--dsw-alias-bg-base)`），且 `[data-platform=darwin]` 覆盖规则也一并核对
- [x] `node smoke-test.mjs` → **117/117**；`bash verify.sh` → **29 ✓ / 0 ✗**（v1.5.0 为 **168/168** 与 **36 ✓ / 0 ✗**；v1.5.1 为 **204/204** 与 **42 ✓ / 0 ✗**；v1.5.2 为 **221/221** 与 **62 ✓ / 0 ✗**；v1.6.0 为 **224/224** 与 **63 ✓ / 0 ✗**，见下面几段）
- [x] 已确认上游会自己透明的面（`_frame` / `_sidebarCol`）**不**被本插件重复染色
- [x] 弹层快照改为直取静态调色板（`bluish-00` / `-950` / `-875`），无环、与 ui-theme 语义等价

需要在窗口里用眼睛确认的（`Cmd+R` 之后）：

- [ ] 中栏（会话区）透出桌面、文字可读 —— 这是本次修复的**主验收点**
- [ ] 底栏（如有）与侧栏同色，不出现一条突兀的实心横带
- [ ] better-sidebar 那一列仍是磨砂（右栏 + dock tab host）
- [ ] 设置页「磨砂玻璃」不再显示"当前窗口没有启用玻璃背景"的提示
- [ ] 浅色主题也看一眼

**背景图磨砂（v1.5.0，2026-11-06）**

静态侧已知全绿（可复核）：

- [x] 第 4 张表只在 `enabled && bgMode==="wallpaper" && bgUrl!==null` 时存在；唯一选择器是门控
      `body::before`，`pointer-events:none`、无 `backdrop-filter`、无布局属性（smoke test 独立审计）
- [x] `node smoke-test.mjs` → **168/168**；`bash verify.sh` → **36 ✓ / 0 ✗**
- [x] 无 IndexedDB / 无 `URL.createObjectURL` 时启动不抛，静默保持桌面观感
- [x] `node visual-bg.mjs` → `/tmp/dsh-bg-preview.png`：壁纸颜色透过三块面板可见，
      没有整片灰雾、没有硬切黑边（与本机原生窗口无关，只验证第 4 张表）

需要 `Cmd+R` 之后用眼睛确认：

- [ ] 设置 → 磨砂玻璃 → 「背景图」：选一张图后整窗变成该图的磨砂底，面板文字仍可读
- [ ] 切回「透到桌面」→ 立刻回到原生桌面，图片层无残留
- [ ] 关总开关 → 壁纸层同时消失（不是只剩图片）
- [ ] 重启 app → 壁纸模式与图片仍在（IndexedDB 恢复）
- [ ] 移除图片 → 回到桌面模式，设置页显示"还没有选择图片"

**磨砂度与行内代码（v1.5.1，2026-11-06）**

静态侧已知全绿（可复核）：

- [x] `node smoke-test.mjs` → **204/204**；`bash verify.sh` → **42 ✓ / 0 ✗**（§8 期望版本 1.5.1）
- [x] 第 4 张表只用 `blur(var(--dsh-vib-frost, 36px))`，没有硬编码半径；`frost` 夹取/取整/持久化/
      关总开关清内联变量，均由 smoke test 覆盖
- [x] 行内代码规则在门控作用域内、只改 `background-color`、45% `color-mix`；围栏代码块不动
- [x] `node visual-bg.mjs` → `/tmp/dsh-bg-preview-{0,36,100}.png`：0 档清晰、100 档趋于均匀，
      三张均无整片灰雾、无硬边

需要 `Cmd+R` 之后用眼睛确认：

- [ ] 设置 → 磨砂玻璃 → 「磨砂度」：滑杆拖到 0 壁纸细节清晰、拖到 100 只剩色块，拖动时实时变化
- [ ] 切到「透到桌面」：滑杆变灰并显示原因；切回「透到壁纸」后恢复可用且数值保留
- [ ] 浅色壁纸下聊天里的行内代码块不再是一块实心灰（透出底色，文字仍可读）
- [ ] 围栏代码块（大段代码）保持不透明、可读

**半透明表面（v1.5.2，2026-11-06）**

静态侧已知全绿（可复核）：

- [x] `node smoke-test.mjs` → **221/221**；`bash verify.sh` → **62 ✓ / 0 ✗**（§8 期望版本 1.5.2）
- [x] 10 条规则全部以门控根开头、只改 `background` / 自定义属性、无 `backdrop-filter` 声明、无布局属性
- [x] 百分比集合含 42/44/46/50/52/58/64/70，且至少 5 个不同值（当前 8 个）
- [x] 深浅两支分别覆盖：气泡（`deepseek-50` / `bluish-850`）、文件块（`neutral-50/100` / `neutral-850/800`）
- [x] `.cm-footer-stack.summary … .cm-bbox` 的 `transparent` 规则排在独立 `.cm-bbox`（50%）之前，
      内层按特异性生效；smoke test 有顺序 + 生效断言
- [x] 临时 mock 样张（`/tmp/v152-preview.png`，非仓库文件）：五处都透出壁纸、文字可读、无灰雾

需要 `Cmd+R` 之后用眼睛确认：

- [ ] 用户消息气泡不再是实心块，浅色/深色主题各看一眼
- [ ] 消息输入框半透明（默认 64%），光标与长文本仍清晰
- [ ] 「已编辑 N 个文件」卡片与 header 透出壁纸，文件名列表可读
- [ ] 侧栏底部的 cost-meter 卡片（今日/余额/平价进度条）半透明，数字对比度足够
- [ ] 顶部/输入区的「费用 ¥0」「费用明细」两个小控件不糊成一团
- [ ] 关总开关 → 以上五处全部回到实心（规则随门控一起失效）

**官方客户端适配（v1.6.0，2026-11-07）**

- [x] `node smoke-test.mjs` → **224/224**；`bash verify.sh` → **63 ✓ / 0 ✗**（§8 期望版本 1.6.0）
- [x] 29 处门控全部为 `html[data-platform="darwin"]:not([data-next-material="off"])`，
      且 `verify.sh` 断言「无 exact `material=transparent` 残留」
- [x] 设置页 `active` 判定同步（`nextMaterial !== "off"`），官方客户端不再误报「材质未透明」
- [x] 真实 CSS 引擎五用例（官方 / transparent / off / linux / 旧门控对照），官方形态下 tint 解析为 40%
- [ ] 在官方客户端 `Cmd+R` 后用眼睛确认：中栏 / 侧栏 / 底栏透出桌面、气泡 / 输入框半透明、
      弹层仍不透明（此项留给用户）

**还没被明确看过的（都不影响已达成效果）**

- [ ] 关掉「启用磨砂玻璃」→ 面板像素级回到原生实心；再打开 → 恢复磨砂
- [ ] 关「侧边栏面板磨砂」→ 侧边栏当场回到原生实心，会话面板**不受影响**
- [ ] 关「深层玻璃」→ 侧边栏内部卡片/列表立即回到实心
- [ ] `Cmd+B` 折叠侧栏正常；侧栏/右栏 resize handle 拖拽正常
- [ ] 发送按钮、`@`/`/` 补全弹层、右键菜单**保持不透明**（输入框本体自 v1.5.2 起为半透明）
- [ ] better-sidebar 的拖拽分栏、标签切换、底部工作台折叠等交互**全部正常**
- [ ] 浅色主题看一遍（目前只在深色下确认过）
- [ ] 左侧边栏观感不变

---

## 6. 插件兼容性校验（内核 0.2.0-rc.2 起的新要求）

> **2026-10-28 复核（2.0.20-next / `@deepseek-ai/dsh` 0.2.1-rc.3）**：判定逻辑不变，但
> `@deepseek-ai/*` 现在从 `app.asar/node_modules` 解析（profile 的 `node_modules/@deepseek-ai`
> 里只剩 `cosmokit` 与 `schemastery`）。本插件仍然**没有 `peerDependencies`**，所以这套
> 豁免判定与它无关——内核再升版也不会因此拒绝加载它。下面 §6.1–§6.3 的取证写于
> 0.2.0-rc.2 时期，作为判定源码的说明仍然有效。

DSH Desktop 2.0.17 / 内核 0.2.0-rc.2 起，`dsh plugin add` 与启动会**拒绝**声明了不兼容
`peerDependencies` 的包（不只是警告）。

### 6.1 判定规则（源码取证）

`/Applications/DSH Desktop.app/Contents/Resources/app/node_modules/@deepseek-ai/dsh-app-boot/lib/index.js`
（region `lib/types/plugin-compatibility.js`）：

```js
function evaluatePluginCompatibility(manifest, exemptions = {}, runtimeVersion = getDshRuntimeVersion()) {
  const fields = objectOf$1(manifest, "Plugin manifest");
  if (!Object.hasOwn(fields, "peerDependencies")) return void 0;   // ← 没有 peerDependencies 直接放行
  for (const [name, range] of Object.entries(fields.peerDependencies)) {
    if (name !== "@deepseek-ai/dsh" && !name.startsWith("@deepseek-ai/dsh-")) continue;  // 只看 dsh 家族
    const requirement = ["workspace:^","workspace:~","workspace:*"].includes(range) ? runtimeVersion : range;
    if (!semver.satisfies(runtimeVersion, requirement, { includePrerelease: true })) peers[name] = range;
  }
  …
}
```

- runtime 版本 = **`@deepseek-ai/dsh-app-boot` 自己的 package.json version**（当前 `0.2.0-rc.2`），
  不是 desktop 壳版本，也不是 profile 里别的包。
- 命中后由 `dsh-plugin-manager` 抛 `ManagementFailure("incompatible-version", …)`，UI 文案
  「…与 DSH … 不兼容（要求 …），运行它可能导致崩溃或数据丢失。」
- 出口：profile 下的 `compatibility.json` 精确版本豁免（`name@version` → runtime 版本列表），
  经 `dsh plugin allow-version` 或插件管理器授予（需要显式 `acceptRisk`）。

### 6.2 本插件：不受影响，且**刻意不加** peerDependencies

- `package.json` 里**没有** `peerDependencies` → 上面的第一行 `return void 0`，校验直接放行。
  当前盘面（2026-10-02）`bash verify.sh` 全绿、无 `compatibility.json`（= 没有任何包需要豁免）。
- **刻意不加**的原因：本插件是纯 CSS + 一个 `settings.section` 注册，不 import 任何 dsh 内部
  模块，最坏情况是样式不生效而不是崩溃；而一旦声明范围，下次内核升版（例如 0.3.0）就会让
  **整个插件被拒绝加载**，把一个「磨砂没了」的小退化升级成「插件被系统禁用」的大退化。
- 如果哪天想主动声明，唯一安全的形状是**只写下限**，例如
  `"peerDependencies": { "@deepseek-ai/dsh": ">=0.1.7-rc.1" }`：新版本永远满足，旧内核才被拦。
  （注意这也会让 pnpm 需要能解析该 peer；本包是 `link:` 进 profile 的，不是 `pnpm install` 出来的。）

### 6.3 2026-09-29 的历史警告是**过期**的

`.plugin-manager/logs/*/pnpm.log` 里有 39 条 `incompatible with dsh 0.2.0-rc.1`，全部是
**上一个内核（0.2.0-rc.1）时期**的记录（文件时间 2026-09-29 18:48–18:59），涉及的是当时的旧版
本：`dsh-better-sidebar@0.22.1`、`dsh-cost-meter@1.7.40`、`dshmarket@1.66.3`、
`@michengai/dsh-archive-manager@1.0.6`、`@michengai/dsh-btw@0.1.13`。

现在装的是已经支持新内核的版本，逐条核对 `peerDependencies`（`^0.2.0-rc.1`、`>=0.2.0-rc.1 <0.3.0-0`
或显式 `… || 0.2.0-rc.2`），在 runtime `0.2.0-rc.2` 下**全部满足**：

| 包 | 声明 | 结论 |
| --- | --- | --- |
| dsh-better-sidebar@0.24.1 | 14 项 `^0.2.0-rc.1` | 满足 |
| dsh-cost-meter@1.8.6 | `>=0.2.0-rc.1 <0.3.0-0` | 满足 |
| dshmarket@1.66.8 | `^0.2.0-rc.1` | 满足 |
| @michengai/dsh-archive-manager@1.0.11 | 显式含 `0.2.0-rc.2` | 满足 |
| @michengai/dsh-btw@0.1.15 | 显式含 `0.2.0-rc.2` | 满足 |
| **dsh-vibrancy-skin@1.6.0** | **无 `peerDependencies`** | **放行** |
