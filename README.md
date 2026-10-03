# dsh-vibrancy-skin

macOS 原生 Vibrancy（磨砂玻璃）材质皮肤，用于 DSH Desktop 的**右侧会话面板**，
并为第三方侧边栏插件（dsh-better-sidebar）提供同款磨砂，**两级效果各自独立开关**。
**只改材质，不改布局**：整个样式表只触碰 `background` 与自定义属性，不碰任何
grid / 尺寸 / 定位 / 圆角 / 内边距 / 溢出，原生布局与功能逐位不变。
**也不改任何第三方插件文件**——一个字节都不碰，见 §1.1。

---

## 1. 原理（为什么这样做）

磨砂**不是这个插件做出来的**——窗口本身已经有原生毛玻璃了：

`/Applications/DSH Desktop.app/Contents/Resources/app/lib/electron-runtime-Bq738q05.js`

```js
return spec.material === "transparent"
  ? { ...custom, transparent: true, backgroundColor: "#00000000",
      vibrancy: "sidebar", visualEffectState: "followWindow" }
  : custom;
```

而 profile 的 `macosMaterial` 已经是 `transparent`，所以整窗背后就是一层
`NSVisualEffectView`。右半边之所以看起来是实心的，纯粹是上游的一条 CSS：

```css
.dshDesktopConversationSurface { background: var(--dsw-alias-bg-base); }
```

本插件把这层不透明底换成一层可读的 tint，原生材质就透出来了。

### 三条不可松弛的红线

1. **绝不使用 `backdrop-filter`。** 上游源码注释写得很直白：
   > "... an opaque themed layer stays readable even when Chromium cannot blur
   > the transparent vibrancy window."
   
   在透明 vibrancy 窗口上做窗口内模糊，只会糊上一层均匀灰雾（上一版 6 个面全
   用 backdrop-filter，用户原话：「我现在连整个窗口都被蒙上了一层灰，我什么也
   看不见了」）。模糊交给系统，CSS 只负责"把挡住它的东西挪开"。
2. **只改材质，不改布局。** 只允许 `background*` 与自定义属性。
3. **tint 必须无环。** tint 用**静态调色板**（`--dsw-static-neutral-bluish-00/950`）
   合成，**绝不能**引用 `--dsw-alias-bg-base`——那正是被覆盖的属性，自引用会
   解析成 guaranteed-invalid 值，整个面板变全透明不可读。

### 为什么覆盖 token 而不是逐个选择器

`--dsw-alias-bg-base` 是上游**唯一**用来画会话区内部不透明层的 token。全量
grep 出货的爆炸半径只有 13 个包的直接消费点：`ConversationRoot` 根元素、
输入区渐隐座（composer seat）、附件卡片/缩略图/编辑器、sticky 表格行、
AskQuestion / Inspect 卡片。把这一个 token 在 `.dshDesktopConversationSurface`
子树内重定向，这些全部自动跟随，**一处生效、零遗漏**，而且不需要依赖任何
哈希类名（`uPhUma_` 这种前缀会随构建变）。

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
| `.dshDesktopSidebarSurface` | 上游已是透明，它就是要对齐的**参照物** |
| `.dshDesktopRightbarSurface` 本身 | 它自己不画底；侧边栏磨砂走 §1.1 的独立作用域，不在这里下手 |
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
顺着这个契约，在**三个稳定锚点**上重定向 token（全部是普通属性标记或 DSH 官方
class，没有一个 CSS-module 哈希）：

```css
/* (a) 插件自己在 src/client/index.tsx:289 挂到 <body> 上的宿主元素 */
[data-dsh-better-sidebar],
/* (b) DSH Desktop 自己的第三列：aside.dshDesktopRightbarSurface[data-rightbar-col]，
       子节点是 renderSlot("rightbar", …)，也就是侧边栏真正的落脚点 */
.dshDesktopRightbarSurface[data-rightbar-col],
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
`[data-rightbar-col]` / `[data-dockkit-host]` 是 DSH 与 dockkit 的公开 data 属性，
插件每次更新都还在。两级效果：

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

**修法**（规则 4，`client.js` 的 sheet 1）：token 是「在哪里声明就在哪里求值」的，所以在
`<body>` 上先把上游原值快照下来，再把它交还给弹层：

```css
/* 快照：声明在 body，此时 body 上的 token 还是上游原值（主题包自己就声明在 body） */
body[…] { --dsh-vib-bg-base-solid: var(--dsw-alias-bg-base);
          --dsh-vib-bg-layer-1-solid: var(--dsw-alias-bg-layer-1); }

/* 规则 4：不透明面交还给所有弹层（在弹层元素本身上声明，压过继承） */
body[…] :is(dialog, [role="dialog"], [role="alertdialog"]) {
  --dsw-alias-bg-base:  var(--dsh-vib-bg-base-solid);
  --dsw-alias-bg-layer-1: var(--dsh-vib-bg-layer-1-solid);
}
```

三个刻意的选择：

1. **还原 token，而不是给弹层写死 `background`**：弹层内部如果有卡片/列表也吃
   `--dsw-alias-bg-base` / `-bg-layer-1`，它们会一起回到原生实心，不会出现「壳实心、内层还是
   透的」。
2. **不绑定某一个面板作用域**（不写 `.dshDesktopConversationSurface :is(…)`）：弹层可能挂在
   会话区、标题栏或 `<body>` 上（portal 与否由第三方决定，随时会变），全局按平台+材质门槛
   生效最稳。皮肤的 token 重定向只发生在本插件自己的作用域里，所以这条规则在别处是空操作，
   不可能改变原生弹层外观。
3. **跟着总开关走**：它在 sheet 1（`enabled`）里，关掉皮肤时整张表被移除，弹层自然回到原生。

**失效模式**：第三方把面板改成 portal 到 body、或改用自己的 class/属性 → 最坏是本规则不再
命中，弹层变回「被 tint 透掉」的样子；不会让任何面板变得更糟（它不会覆盖非本插件的作用域）。

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
`~/Library/Application Support/DSH Desktop/logs/host/dsh-*.log`
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
主题下与「桌面」页外观完全一致。**四组控件、三个开关**：

| 分组 | 控件 | 作用 |
| --- | --- | --- |
| 外观 | 「启用磨砂玻璃」开关（总开关） | 关 = 摘掉全部样式表，**像素级回到原生**（不是 tint 100%，见下） |
| 侧边栏（better-sidebar） | 「侧边栏面板磨砂」开关（默认**开**） | 面板本体、标签栏、底部工作台、改动视图、任务图、浮动窗变成同款磨砂 |
| 侧边栏（better-sidebar） | 「深层玻璃（卡片 / 列表）」开关（默认**关**） | 连内部卡片、列表、内联编辑器也一起玻璃化；对比度会下降 |
| 强度 | 磨砂 / 均衡 / 实心 三张卡片 | 24% / 40%（默认）/ 62%，**三级色板共用** |
| 微调 | 0–100 数字输入 + 「恢复默认」 | 预设不够用时精确指定 |

选择写进 `localStorage`（`dsh-vibrancy-skin:tint` / `:enabled` / `:panels` / `:deep`），
下次启动自动恢复。两个侧边栏开关在总开关关闭时显示为灰色（因为整张样式表都不在）。

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
dshVibrancySkin.resetAll()        // 回到出厂：40% / 面板开 / 深层关 / 总开关开
dshVibrancySkin.getState()        // { enabled, panels, deep, tint, defaultTint, presets }
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
- [x] 在这页调强度当场生效（用户把强度调到 15%，探针读到的就是 15%）

**侧边栏磨砂（v1.3.1 起，用户已确认）**

- [x] **better-sidebar 整列（面板本体 + 标签栏 + dock tab host）变成同款磨砂**
      —— 用户原话：整列磨砂了，已达成我目前的需求
- [x] 三级与总开关是「与」关系（代码与 smoke test 双重覆盖；探针实测开关只摘自己那张表）
- [x] 侧边栏文字在当前强度（15% + 深层玻璃开）下可读（用户未提对比度问题）

**弹层可读性（v1.3.2）**

- [x] 规则 4 已写入 sheet 1，且 smoke test 断言：快照取自上游 token、`:is(dialog, [role="dialog"],
      [role="alertdialog"])` 拿到两个不透明 token、规则不绑定单个面板作用域
- [ ] 打开 dsh-cost-meter 的「费用明细」面板，面板是**实心可读**的（不再是透明的）
- [ ] 顺带看：设置里的弹层、插件管理器确认框、`@`/`/` 补层在任何强度下都不透明

**还没被明确看过的（都不影响已达成效果）**

- [ ] 关掉「启用磨砂玻璃」→ 面板像素级回到原生实心；再打开 → 恢复磨砂
- [ ] 关「侧边栏面板磨砂」→ 侧边栏当场回到原生实心，会话面板**不受影响**
- [ ] 关「深层玻璃」→ 侧边栏内部卡片/列表立即回到实心
- [ ] 顶部 32px 标题栏与下方会话区**同色**、可拖拽窗口
- [ ] `Cmd+B` 折叠侧栏正常；侧栏/右栏 resize handle 拖拽正常
- [ ] 输入框、发送按钮、`@`/`/` 补全弹层、右键菜单**保持不透明**
- [ ] better-sidebar 的拖拽分栏、标签切换、底部工作台折叠等交互**全部正常**
- [ ] 浅色主题看一遍（目前只在深色下确认过）
- [ ] 左侧边栏观感不变

---

## 6. 插件兼容性校验（内核 0.2.0-rc.2 起的新要求）

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
| **dsh-vibrancy-skin@1.3.2** | **无 `peerDependencies`** | **放行** |
