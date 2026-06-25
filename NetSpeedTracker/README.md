# ⚡ NetSpeedTracker — Chrome Extension

Real-time network speed overlay for every tab — accurate like fast.com, always visible.

## Features

- **Live download speed** — measured every 2 seconds using parallel CDN probes (like fast.com)
- **Always-on-top overlay** — floats over every webpage until you close it
- **Draggable widget** — move it anywhere on screen
- **Sparkline graph** — 20-point live speed history chart
- **Latency / Ping** — measures round-trip time every cycle
- **Quality rating** — Very Slow → Slow → Good → Fast → Very Fast → Ultra Fast
- **Peak & Average speed** tracking
- **Popup panel** — click the extension icon for a summary view

## How It Works (fast.com approach)

Instead of relying on the browser's `navigator.connection` API (which is unreliable/estimated), NetSpeedTracker downloads real chunks of data from Cloudflare's speed test endpoint:

```
https://speed.cloudflare.com/__down?bytes=500000
```

It runs **2 parallel connections**, streams the bytes, counts them, and calculates:

```
Speed (Mbps) = (bytes_received × 8) / (elapsed_seconds × 1,000,000)
```

Results are averaged and updated every 2 seconds.

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `NetSpeedTracker` folder
5. The overlay will appear on your next tab load ✓

## File Structure

```
NetSpeedTracker/
├── manifest.json      — Extension config (Manifest V3)
├── background.js      — Speed measurement engine (service worker)
├── content.js         — Overlay injected into every tab
├── overlay.css        — Overlay styles
├── popup.html         — Toolbar popup UI
├── popup.js           — Popup logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Permissions Used

| Permission | Reason |
|-----------|--------|
| `storage` | Save active/inactive state across sessions |
| `tabs` | Broadcast speed updates to all open tabs |
| `scripting` | Inject overlay into tabs |
| `<all_urls>` | Show overlay on every website |

## Speed Quality Thresholds

| Speed | Rating |
|-------|--------|
| < 1 Mbps | Very Slow 🔴 |
| 1–5 Mbps | Slow 🟠 |
| 5–25 Mbps | Good 🟡 |
| 25–100 Mbps | Fast 🟢 |
| 100–500 Mbps | Very Fast 💚 |
| > 500 Mbps | Ultra Fast 🔵 |
