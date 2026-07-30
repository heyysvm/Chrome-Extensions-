# NetSpeedTracker — Real-Time Network Monitor

Real-time network speed overlay for every tab — accurate like fast.com, always visible.

---

## Direct Download & Installation

### Direct ZIP Download
Download the pre-packaged extension ZIP:
- **Direct Download Link**: [NetSpeedTracker-v1.0.0.zip](https://github.com/heyysvm/Chrome-Extensions-/raw/main/NetSpeedTracker-v1.0.0.zip)

### Installation Steps:
1. Download and extract [NetSpeedTracker-v1.0.0.zip](https://github.com/heyysvm/Chrome-Extensions-/raw/main/NetSpeedTracker-v1.0.0.zip).
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer Mode** (top-right toggle).
4. Click **Load unpacked** and select the extracted `NetSpeedTracker` folder.

---

## Features

- **Live download speed**: Measured every 2 seconds using parallel CDN probes (like fast.com).
- **Always-on-top overlay**: Floats over webpage layouts until closed.
- **Draggable widget**: Position anywhere on screen.
- **Sparkline graph**: 20-point live speed history chart.
- **Latency / Ping**: Measures round-trip latency every cycle.
- **Quality rating**: Very Slow -> Slow -> Good -> Fast -> Very Fast -> Ultra Fast.
- **Peak & Average speed** tracking.

---

## How It Works

NetSpeedTracker downloads real chunks of data from Cloudflare's speed test endpoint:

```
https://speed.cloudflare.com/__down?bytes=500000
```

It runs 2 parallel connections, streams the bytes, and calculates throughput:

```
Speed (Mbps) = (bytes_received * 8) / (elapsed_seconds * 1,000,000)
```

---

## Permissions Used

| Permission | Reason |
|-----------|--------|
| `storage` | Save active/inactive state across sessions |
| `tabs` | Broadcast speed updates to all open tabs |
| `scripting` | Inject overlay into tabs |
| `<all_urls>` | Show overlay on every website |
