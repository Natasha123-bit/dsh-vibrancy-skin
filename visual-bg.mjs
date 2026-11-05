/**
 * Visual sample for the background-image layer, at three frost levels.
 *
 * The plugin itself cannot be rendered without DSH Desktop running, but the
 * only thing that matters visually is sheet 4: a fixed, blurred picture layer
 * behind the (native) frosted panes. This script reproduces exactly that:
 *
 *   1. pulls the BG_CSS_CONTENT template literal out of client.js verbatim
 *      (no second copy to drift), so the selector / z-index / blur formula
 *      under test is the shipped one;
 *   2. builds a colourful mock wallpaper (inline SVG data URI) and exposes it
 *      to the sheet through --dsh-vib-bg-image on <html>, like the plugin's
 *      inline property on <body>;
 *   3. renders frost 0 / 36 / 100 by replacing the
 *      `blur(var(--dsh-vib-frost, 36px))` fallback expression with a concrete
 *      px value — v1.5.1 made the radius adjustable, so one sample is no
 *      longer enough to judge "too sharp" vs "grey fog";
 *   4. lays out three semi-transparent panes (the app's sidebar / conversation
 *      / right column shape) and screenshots 1280×800 with the bundled
 *      Playwright Chromium, headless, to /tmp/dsh-bg-preview-{0,36,100}.png
 *      plus the legacy /tmp/dsh-bg-preview.png copy of the 36px sample.
 *
 * Usage: node visual-bg.mjs
 * Output: four PNGs under /tmp (paths + sizes + dimensions printed)
 *
 * No npm package is used — only node: builtins and a local Chromium binary.
 * The HTML lives in /tmp and is never committed.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(here, "client.js"), "utf8");

/* --- 1. sheet 4, verbatim ------------------------------------------------ */
const match = /const BG_CSS_CONTENT\s*=\s*`([\s\S]*?)`;/.exec(SRC);
if (match === null) {
  console.error("✗ could not find BG_CSS_CONTENT in client.js — did sheet 4 move?");
  process.exit(1);
}
const BG_CSS = match[1];

/* v1.5.1 moved the radius behind a custom property. Refuse to silently render
   a stale hard-coded 36px if the formula changes again. */
const FROST_RE = /var\(--dsh-vib-frost,\s*36px\)/;
if (!FROST_RE.test(BG_CSS)) {
  console.error("✗ sheet 4 no longer contains blur(var(--dsh-vib-frost, 36px))");
  console.error("  update visual-bg.mjs to match the shipped blur formula");
  process.exit(1);
}

const FROSTS = [
  { value: 0, label: "0px · 未模糊，保留原图细节" },
  { value: 36, label: "36px · 默认" },
  { value: 100, label: "100px · 接近纯雾面" },
];

/* --- 2. mock wallpaper --------------------------------------------------- */
/* A dark violet base with three large, soft colour pools (amber, magenta,
   teal) plus a cool wedge — enough hue variety to see whether the pane is
   really letting the picture through instead of a flat grey fog. */
const wallpaper = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <radialGradient id="amber" cx="18%" cy="16%" r="62%">
      <stop offset="0%" stop-color="#ffb03a"/>
      <stop offset="45%" stop-color="#f0603c"/>
      <stop offset="100%" stop-color="#f0603c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="magenta" cx="78%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#ff4f9a"/>
      <stop offset="55%" stop-color="#b03cdb"/>
      <stop offset="100%" stop-color="#b03cdb" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="teal" cx="62%" cy="88%" r="60%">
      <stop offset="0%" stop-color="#2ee6d6"/>
      <stop offset="50%" stop-color="#1f7fbf"/>
      <stop offset="100%" stop-color="#1f7fbf" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1038"/>
      <stop offset="55%" stop-color="#241246"/>
      <stop offset="100%" stop-color="#0d1830"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#base)"/>
  <rect width="1600" height="1000" fill="url(#amber)"/>
  <rect width="1600" height="1000" fill="url(#magenta)"/>
  <rect width="1600" height="1000" fill="url(#teal)"/>
  <g fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="2">
    <circle cx="260" cy="760" r="150"/>
    <circle cx="1300" cy="720" r="210"/>
    <circle cx="880" cy="150" r="120"/>
  </g>
</svg>`;

const wallpaperUri = `data:image/svg+xml,${encodeURIComponent(wallpaper).replace(/'/g, "%27")}`;

/* --- 3. the sample page -------------------------------------------------- */
const PANE = "rgba(18,18,24,0.45)";
const BORDER = "rgba(255,255,255,0.12)";

const buildHtml = (frost, frostLabel) => `<!doctype html>
<html lang="zh-CN" data-platform="darwin" data-next-material="transparent"
      style="--dsh-vib-bg-image: url('${wallpaperUri}')">
<head>
  <meta charset="utf-8">
  <title>dsh-vibrancy-skin v1.5.1 — background image sample (frost ${frost}px)</title>
  <style>
    /* ---- sheet 4, copied verbatim from client.js; only the var() fallback
           expression is substituted with the concrete px value ---- */
${BG_CSS.replace(FROST_RE, `${frost}px`)}

    /* ---- sample-page chrome only (not part of the plugin) ---- */
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                   "PingFang SC", "Helvetica Neue", sans-serif;
      color: #f5f5f7;
      -webkit-font-smoothing: antialiased;
    }
    .stage {
      position: relative;
      height: 100vh;
      padding: 40px;
      display: grid;
      grid-template-columns: 264px minmax(0, 1fr) 320px;
      gap: 24px;
    }
    .pane {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 24px;
      background: ${PANE};
      border: 1px solid ${BORDER};
      border-radius: 12px;
      overflow: hidden;
    }
    .eyebrow {
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.55);
    }
    h1 { margin: 4px 0 0; font-size: 26px; font-weight: 600; letter-spacing: -0.01em; }
    h2 { margin: 0; font-size: 17px; font-weight: 600; }
    p  { margin: 0; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.72); }
    .row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      font-size: 13px;
      color: rgba(255,255,255,0.82);
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.35); flex: none; }
    .grow { flex: 1; }
    .card {
      padding: 16px;
      border-radius: 10px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      font-size: 13px;
      line-height: 1.6;
      color: rgba(255,255,255,0.78);
    }
    .spacer { flex: 1; }
    .caption {
      position: fixed;
      left: 44px;
      bottom: 14px;
      font-size: 11px;
      letter-spacing: 0.04em;
      color: rgba(255,255,255,0.55);
    }
  </style>
</head>
<body>
  <main class="stage">
    <section class="pane">
      <span class="eyebrow">Sidebar</span>
      <h2>侧边栏</h2>
      <p>同一层玻璃，透出后面的图片。</p>
      <div class="row"><span class="dot"></span>会话</div>
      <div class="row"><span class="dot"></span>文件</div>
      <div class="row"><span class="dot"></span>改动视图</div>
      <div class="spacer"></div>
      <span class="eyebrow">264 px · rgba 0.45</span>
    </section>

    <section class="pane">
      <span class="eyebrow">Conversation</span>
      <h1>背景图 · 磨砂面板</h1>
      <p>图片以 fixed / inset -64px 铺在窗口后面，自身 blur(${frost}px)；面板是半透明层，所以颜色会透上来，而不是一层灰雾。</p>
      <div class="card">
        中心区域应当能看出壁纸的橙 / 品红 / 青三种色团经过 ${frost}px 模糊后的柔光，
        以及面板边缘没有 1px 硬切黑边。当前档位：${frostLabel}。
      </div>
      <div class="card">
        本样张只复刻第 4 张表（body::before 装饰层），不含原生 vibrancy；
        面板的 rgba(18,18,24,0.45) 就是真实窗口里玻璃那一层。
      </div>
      <div class="spacer"></div>
      <span class="eyebrow">1280 × 800 · 1× DPR · frost ${frost}px</span>
    </section>

    <section class="pane">
      <span class="eyebrow">Right column</span>
      <h2>右侧工作台</h2>
      <p>三个面板都是同一配方：半透明底 + 1px 亮边 + 12px 圆角。</p>
      <div class="row"><span class="dot"></span><span class="grow">任务图</span>3</div>
      <div class="row"><span class="dot"></span><span class="grow">费用明细</span>¥ 0.42</div>
      <div class="row"><span class="dot"></span><span class="grow">宿主日志</span>live</div>
      <div class="spacer"></div>
      <span class="eyebrow">320 px · rgba 0.45</span>
    </section>
  </main>
  <div class="caption">dsh-vibrancy-skin v1.5.1 · 背景图视觉样张 · frost ${frost}px · 仅用于观察颜色透出与边缘过渡</div>
</body>
</html>`;

/* --- 4. locate Chromium -------------------------------------------------- */
const candidates = [
  /* Preferred: the full Chromium bundle Playwright usually installs. */
  join(
    homedir(),
    "Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium",
  ),
  /* This machine's chromium-1223 actually ships "Google Chrome for Testing"
     instead, which hangs on spawn here, so the documented fallback is the
     headless shell — it takes the exact same --screenshot flags. */
  join(
    homedir(),
    "Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  ),
];
const browser = candidates.find((path) => existsSync(path));
if (browser === undefined) {
  console.error("✗ no bundled Chromium found. Checked:");
  for (const path of candidates) console.error(`    ${path}`);
  process.exit(1);
}

/* --- 5. screenshot each frost level -------------------------------------- */
const PROFILE_DIR = "/tmp/dsh-bg-preview-profile";
rmSync(PROFILE_DIR, { recursive: true, force: true });
mkdirSync(PROFILE_DIR, { recursive: true });

const baseArgs = [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${PROFILE_DIR}`,
  "--window-size=1280,800",
];

console.log(`[visual-bg] browser: ${browser}`);

const samples = [];
for (const { value, label } of FROSTS) {
  const htmlPath = `/tmp/dsh-bg-preview-${value}.html`;
  const pngPath = `/tmp/dsh-bg-preview-${value}.png`;
  writeFileSync(htmlPath, buildHtml(value, label), "utf8");
  rmSync(pngPath, { force: true });

  const result = spawnSync(browser, [...baseArgs, `--screenshot=${pngPath}`, `file://${htmlPath}`], {
    stdio: ["ignore", "ignore", "pipe"],
    timeout: 120_000,
    encoding: "utf8",
  });
  const stderr = (result.stderr || "").trim();

  if (result.error) {
    console.error(`✗ could not start Chromium for frost ${value}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`✗ Chromium exited with ${result.status} for frost ${value}`);
    if (stderr !== "") console.error(stderr.split("\n").slice(-15).join("\n"));
    process.exit(1);
  }
  if (!existsSync(pngPath)) {
    console.error(`✗ Chromium exited 0 but wrote no screenshot for frost ${value}`);
    if (stderr !== "") console.error(stderr.split("\n").slice(-15).join("\n"));
    process.exit(1);
  }

  /* PNG IHDR: width = bytes 16..20, height = 20..24 (big-endian). */
  const bytes = readFileSync(pngPath);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== 1280 || height !== 800) {
    console.error(`✗ frost ${value}: expected 1280×800, got ${width}×${height}`);
    process.exit(1);
  }
  samples.push({ value, pngPath, width, height, kb: (statSync(pngPath).size / 1024).toFixed(1) });
}

/* Legacy path kept for docs/scripts that still look at the single sample;
   it is the 36px default, the level users see before touching the slider. */
const legacy = "/tmp/dsh-bg-preview.png";
copyFileSync("/tmp/dsh-bg-preview-36.png", legacy);

console.log("[visual-bg] samples written:");
for (const sample of samples) {
  console.log(`  ${sample.pngPath}  ${sample.width}×${sample.height}  ${sample.kb} KB`);
}
console.log(`  ${legacy}  (copy of the 36px default)  ${(statSync(legacy).size / 1024).toFixed(1)} KB`);