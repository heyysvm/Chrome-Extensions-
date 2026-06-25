(function () {
  if (document.getElementById('v-overlay-root')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'v-overlay-root';
  
  wrapper.innerHTML = `
    <div id="v-card">
      <div id="v-drag-handle">
        <span class="v-brand">VELOCITY</span>
        <button id="v-close-btn">&times;</button>
      </div>
      <div class="v-speed-display">
        <h1 id="v-speed-value">0.0</h1>
        <div class="v-metrics"><span id="v-unit">Mbps</span></div>
      </div>
      <div class="v-progress-container">
        <div class="v-progress-bar" id="v-progress"></div>
      </div>
      <button id="v-test-btn">Test Speed</button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #v-overlay-root {
      position: fixed;
      top: 40px;
      right: 40px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    }
    #v-card {
      width: 190px;
      background: #0a0a0c !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 12px !important;
      padding: 14px !important;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6) !important;
      color: #ffffff !important;
      box-sizing: border-box !important;
    }
    #v-drag-handle {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      cursor: move !important;
      padding-bottom: 6px !important;
      user-select: none !important;
    }
    .v-brand {
      font-size: 9px !important;
      font-weight: 700 !important;
      letter-spacing: 1.5px !important;
      color: #666670 !important;
    }
    #v-close-btn {
      background: none !important;
      border: none !important;
      color: #666670 !important;
      font-size: 16px !important;
      cursor: pointer !important;
      line-height: 1 !important;
      padding: 0 2px !important;
      transition: color 0.2s;
    }
    #v-close-btn:hover { color: #f43f5e !important; }
    .v-speed-display { text-align: center !important; margin: 8px 0 !important; }
    #v-speed-value {
      font-size: 36px !important;
      font-weight: 200 !important;
      letter-spacing: -1px !important;
      line-height: 1 !important;
      margin: 0 !important;
      color: #ffffff !important;
    }
    #v-unit { font-size: 10px !important; color: #666670 !important; text-transform: uppercase !important; letter-spacing: 1px !important; }
    .v-progress-container { width: 100% !important; height: 2px !important; background: rgba(255, 255, 255, 0.03) !important; margin-bottom: 10px !important; overflow: hidden !important; }
    .v-progress-bar { width: 0% !important; height: 100% !important; background: #ffffff !important; transition: width 0.2s ease !important; }
    #v-test-btn {
      width: 100% !important;
      background: #ffffff !important;
      color: #000000 !important;
      border: none !important;
      padding: 8px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      border-radius: 20px !important;
      cursor: pointer !important;
      transition: opacity 0.2s !important;
    }
    #v-test-btn:hover { opacity: 0.9 !important; }
    #v-test-btn:disabled { background: rgba(255, 255, 255, 0.1) !important; color: #666670 !important; cursor: not-allowed !important; }
  `;

  document.head.appendChild(style);
  document.body.appendChild(wrapper);

  // Update DOM Element Hooks inside the actions below
  document.getElementById('v-close-btn').addEventListener('click', () => {
    wrapper.remove();
    style.remove();
  });

  const card = document.getElementById('v-overlay-root');
  const handle = document.getElementById('v-drag-handle');
  let posX = 0, posY = 0, mouseX = 0, mouseY = 0;

  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    mouseX = e.clientX;
    mouseY = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    posX = mouseX - e.clientX;
    posY = mouseY - e.clientY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    card.style.top = (card.offsetTop - posY) + "px";
    card.style.left = (card.offsetLeft - posX) + "px";
    card.style.right = "auto";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }

  document.getElementById('v-test-btn').addEventListener('click', async () => {
    const speedEl = document.getElementById('v-speed-value');
    const progressBar = document.getElementById('v-progress');
    const btn = document.getElementById('v-test-btn');
    
    btn.disabled = true;
    btn.innerText = "Testing...";
    progressBar.style.width = "10%";
    
    const testUrl = "https://speed.cloudflare.com/__down?bytes=4000000" + "&nocache=" + Math.random();
    
    try {
      const startTime = performance.now();
      const response = await fetch(testUrl, { cache: "no-store", mode: "cors" });
      if (!response.ok) throw new Error();
      
      const reader = response.body.getReader();
      let receivedLength = 0;
      
      while(true) {
        const {done, value} = await reader.read();
        if (done) break;
        receivedLength += value.length;
      }
      
      const endTime = performance.now();
      progressBar.style.width = "100%";

      const durationInSeconds = (endTime - startTime) / 1000;
      const bitsLoaded = receivedLength * 8;
      const speedMbps = ((bitsLoaded / (1024 * 1024)) / durationInSeconds).toFixed(1);

      speedEl.innerText = speedMbps;
    } catch {
      speedEl.innerText = "Err";
    } finally {
      setTimeout(() => {
        btn.disabled = false;
        btn.innerText = "Test Speed";
        progressBar.style.width = "0%";
      }, 1000);
    }
  });
})(); 