// NetSpeedTracker — background service worker
// Real speed measurement using Cloudflare's speed test endpoint
// Same approach as fast.com: download real bytes, measure throughput

let running = false;
let currentSpeed = 0;
let currentLatency = 0;
let history = [];
let timer = null;

// ── LATENCY ────────────────────────────────────
async function ping() {
  try {
    const t = Date.now();
    await fetch('https://speed.cloudflare.com/__down?bytes=1', {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
    });
    return Date.now() - t;
  } catch { return -1; }
}

// ── DOWNLOAD PROBE ─────────────────────────────
// Downloads a real chunk and measures byte throughput
// exactly like fast.com does internally
async function probe(bytes) {
  const url = `https://speed.cloudflare.com/__down?bytes=${bytes}`;
  const t = Date.now();
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    const reader = res.body.getReader();
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
    }
    const sec = (Date.now() - t) / 1000;
    return (received * 8) / (sec * 1_000_000); // Mbps
  } catch { return null; }
}

// ── MEASUREMENT CYCLE ──────────────────────────
// Run 3 parallel probes of different sizes, trim outlier, average
// This is the core fast.com technique
async function measure() {
  const results = await Promise.allSettled([
    probe(250_000),   // 250 KB
    probe(500_000),   // 500 KB
    probe(1_000_000), // 1 MB
  ]);

  const valid = results
    .filter(r => r.status === 'fulfilled' && r.value > 0)
    .map(r => r.value)
    .sort((a, b) => a - b);

  if (!valid.length) return null;

  // Drop highest outlier if we have 3 samples (fast.com style)
  const trimmed = valid.length === 3 ? valid.slice(0, 2) : valid;
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

// ── BROADCAST ──────────────────────────────────
function broadcast(data) {
  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      if (!tab.url) continue;
      if (tab.url.startsWith('chrome://')) continue;
      if (tab.url.startsWith('chrome-extension://')) continue;
      chrome.tabs.sendMessage(tab.id, data).catch(() => {});
    }
  });
}

// ── LOOP ───────────────────────────────────────
async function loop() {
  if (!running) return;

  const [speed, latency] = await Promise.all([measure(), ping()]);

  if (speed !== null) {
    currentSpeed = speed;
    history.push({ speed, ts: Date.now() });
    if (history.length > 30) history.shift();
  }
  currentLatency = latency;

  broadcast({
    type: 'SPEED_UPDATE',
    speed: currentSpeed,
    latency: currentLatency,
    history: history.slice(-20)
  });

  if (running) timer = setTimeout(loop, 3000);
}

function start() {
  if (running) return;
  running = true;
  loop();
}

function stop() {
  running = false;
  if (timer) clearTimeout(timer);
  broadcast({ type: 'OVERLAY_HIDE' });
}

// ── MESSAGES ───────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _, reply) => {
  if (msg.type === 'GET_STATUS') {
    reply({ running, speed: currentSpeed, latency: currentLatency });
    return true;
  }
  if (msg.type === 'START') {
    start();
    broadcast({ type: 'OVERLAY_SHOW' });
    reply({ ok: true });
    return true;
  }
  if (msg.type === 'STOP') {
    stop();
    reply({ ok: true });
    return true;
  }
});

// ── BOOT ───────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => start());
start(); // also start on service worker wake
