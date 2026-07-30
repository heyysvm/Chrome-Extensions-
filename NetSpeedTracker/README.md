# ⚡ NetSpeedTracker — Real-Time Network Monitor

Real-time network speed overlay for every tab — accurate like fast.com, always visible.

---

## ⚡ Direct 1-Click Download

Click the badge or link below to download the ready-to-install extension `.zip`:

[![Download NetSpeedTracker](https://img.shields.io/badge/📥_Download_NetSpeedTracker-ZIP-blue?style=for-the-badge&logo=googlechrome)](https://github.com/heyysvm/Chrome-Extensions-/raw/main/NetSpeedTracker-v1.0.0.zip)

- 📥 **Direct Download Link**: [https://github.com/heyysvm/Chrome-Extensions-/raw/main/NetSpeedTracker-v1.0.0.zip](https://github.com/heyysvm/Chrome-Extensions-/raw/main/NetSpeedTracker-v1.0.0.zip)

---

## Features

- **Live download speed** — measured every 2 seconds using parallel CDN probes (like fast.com)
- **Always-on-top overlay** — floats over every webpage until you close it
- **Draggable widget** — move it anywhere on screen
- **Sparkline graph** — 20-point live speed history chart
- **Latency / Ping** — measures round-trip time every cycle
- **Quality rating** — Very Slow → Slow → Good → Fast → Very Fast → Ultra Fast
- **Peak & Average speed** tracking
- **Popup panel** — click the extension icon for a summary view

---

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

---

## Installation

1. Download and extract [NetSpeedTracker-v1.0.0.zip](https://github.com/heyysvm/Chrome-Extensions-/raw/main/NetSpeedTracker-v1.0.0.zip).
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer Mode** (top-right toggle)
4. Click **"Load unpacked"**
5. Select the extracted `NetSpeedTracker` folder
6. Done! ✓

---

## Permissions Used

| Permission | Reason |
|-----------|--------|
| `storage` | Save active/inactive state across sessions |
| `tabs` | Broadcast speed updates to all open tabs |
| `scripting` | Inject overlay into tabs |
| `<all_urls>` | Show overlay on every website |
