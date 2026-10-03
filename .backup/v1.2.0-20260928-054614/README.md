# dsh-vibrancy-skin

macOS 原生 Vibrancy（磨砂玻璃）材质皮肤，用于 DSH Desktop 的**右侧会话面板**。
**只改材质，不改布局**：整个样式表只触碰 `background` 与自定义属性，不碰任何
grid / 尺寸 / 定位 / 圆角 / 内边距 / 溢出，原生布局与功能逐位不变。

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
| `.dshDesktopRightbarSurface` | 第三方面板（better-sidebar）的宿主；它本身不画底，强行上 tint 属于越界改别人 UI |
| 菜单 / 弹层 / 输入框 | 见上，保持不透明可读 |

---

## 2. 安装

源码留在这里（**不要把 `node_modules` 当源码改**），文件拷进 profile：

```bash
P=~/.dsh/profiles/desktop
SRC=/Users/leixiaokang/Documents/DSH-Default/dsh-vibrancy-skin

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
主题下与「桌面」页外观完全一致。三组控件：

| 分组 | 控件 | 作用 |
| --- | --- | --- |
| 外观 | 「启用磨砂玻璃」开关 | 关 = 摘掉整张样式表，**像素级回到原生**（不是 tint 100%，见下） |
| 强度 | 磨砂 / 均衡 / 实心 三张卡片 | 24% / 40%（默认）/ 62% |
| 微调 | 0–100 数字输入 + 「恢复默认」 | 预设不够用时精确指定 |

选择写进 `localStorage`（`dsh-vibrancy-skin:tint` / `:enabled`），下次启动自动恢复。

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
dshVibrancySkin.setTint("24%")   // 更透 → 更磨砂、文字对比度下降
dshVibrancySkin.setTint("40%")   // 默认
dshVibrancySkin.setTint("62%")   // 更实 → 更接近原来的实心面板
dshVibrancySkin.setTint("")      // 复位
dshVibrancySkin.setEnabled(false) // 整个皮肤总开关
dshVibrancySkin.getState()        // { enabled, tint, defaultTint, presets }
dshVibrancySkin.subscribe(fn)     // 订阅（设置界面就是靠它同步的）
```

预设也能直接取：`dshVibrancySkin.variants.{frost,balanced,solid}`。

要永久改默认值就改 `client.js` 里那一行：

```css
--dsh-vib-tint-strength: 40%;
```

---

## 4. 回滚

```bash
P=~/.dsh/profiles/desktop
# 方式一：还原备份
cp "$P/package.json.bak-<时间戳>"     "$P/package.json"
cp "$P/cordis.patch.yml.bak-<时间戳>" "$P/cordis.patch.yml"
rm -rf "$P/node_modules/dsh-vibrancy-skin"
```

```bash
# 方式二：只摘挂载、留包体（改 package.json 去掉两处 dsh-vibrancy-skin）
```

**零风险降级**：即使本样式表整段失效（`color-mix` 不支持、静态 token 改名、
属性组合不匹配），它的声明只是整条作废，上游原本的不透明规则继续生效——
回到原生观感，不会变成全透明不可读。

---

## 5. 验收清单

- [ ] 宿主日志不再有 `patch: entry "vibrancy-skin" not found`
- [ ] 控制台出现 `[dsh-vibrancy-skin] applied — enabled true, tint 40%, theme …, material transparent`
- [ ] **设置里多出「磨砂玻璃 / Vibrancy」一页**，位置紧挨内置「桌面」页之后
- [ ] 在该页切换预设，右侧会话区**当场变化**，无需刷新
- [ ] 关掉「启用磨砂玻璃」→ 面板像素级回到原生实心；再打开 → 恢复磨砂
- [ ] 右侧会话区透出桌面并呈磨砂感；左侧边栏观感不变
- [ ] 顶部 32px 标题栏与下方会话区**同色**、可拖拽窗口
- [ ] `Cmd+B` 折叠侧栏正常；侧栏/右栏 resize handle 拖拽正常
- [ ] 消息文字、附件卡片、AskQuestion 卡片对比度可读
- [ ] 输入框、发送按钮、`@`/`/` 补全弹层、右键菜单**保持不透明**
- [ ] 浅色 / 深色主题各看一遍
