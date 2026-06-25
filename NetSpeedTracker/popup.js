let running = true;
let peak = 0;

function fmt(mbps) {
  if (!mbps || mbps <= 0) return { v: '—', u: 'Mbps' };
  if (mbps >= 1000) return { v: (mbps/1000).toFixed(2), u: 'Gbps' };
  if (mbps >= 100)  return { v: mbps.toFixed(1), u: 'Mbps' };
  return { v: mbps.toFixed(2), u: 'Mbps' };
}

function quality(mbps) {
  if (!mbps || mbps <= 0) return { label: 'Measuring…', color: '#6b7280' };
  if (mbps < 1)   return { label: 'Very Slow',  color: '#ef4444' };
  if (mbps < 5)   return { label: 'Slow',       color: '#f97316' };
  if (mbps < 25)  return { label: 'Good',       color: '#eab308' };
  if (mbps < 100) return { label: 'Fast',       color: '#22c55e' };
  if (mbps < 500) return { label: 'Very Fast',  color: '#a78bfa' };
  return               { label: 'Ultra Fast',   color: '#38bdf8' };
}

function render(speed, latency) {
  const { v, u } = fmt(speed);
  const q = quality(speed);
  document.getElementById('p-speed').textContent = v;
  document.getElementById('p-speed').style.color = q.color;
  document.getElementById('p-unit').textContent = u;
  document.getElementById('p-quality').textContent = q.label;
  document.getElementById('p-quality').style.color = q.color;
  document.getElementById('p-ping').textContent = latency > 0 ? `${latency} ms` : '— ms';
  if (speed > peak) peak = speed;
  const pf = fmt(peak);
  document.getElementById('p-peak').textContent = peak > 0 ? `${pf.v} ${pf.u}` : '— Mbps';
}

function setBtn(on) {
  running = on;
  const btn = document.getElementById('p-btn');
  const pulse = document.getElementById('pulse');
  btn.textContent = on ? 'Stop Tracker' : 'Start Tracker';
  btn.className = on ? '' : 'off';
  pulse.style.background = on ? '#8b5cf6' : '#4b5563';
  pulse.style.boxShadow = on ? '0 0 6px #8b5cf6' : 'none';
  pulse.style.animation = on ? 'blink 2s infinite' : 'none';
}

chrome.runtime.sendMessage({ type: 'GET_STATUS' }, res => {
  if (res) { setBtn(res.running); render(res.speed, res.latency); }
});

document.getElementById('p-btn').addEventListener('click', () => {
  if (running) {
    chrome.runtime.sendMessage({ type: 'STOP' }, () => setBtn(false));
  } else {
    chrome.runtime.sendMessage({ type: 'START' }, () => setBtn(true));
  }
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'SPEED_UPDATE') render(msg.speed, msg.latency);
});
