document.addEventListener('DOMContentLoaded', () => {
  let devData = { devPalette: [], devNotes: '', quizScore: 0 };
  let currentTool = 'json';
  let currentCheatCat = 'git';

  const navBtns = document.querySelectorAll('.nav-tabs .tab-btn');
  const views = document.querySelectorAll('.view');
  const toggleInspectorBtn = document.getElementById('toggleInspectorBtn');
  const paletteGrid = document.getElementById('paletteGrid');
  const exportPaletteBtn = document.getElementById('exportPaletteBtn');

  const toolChips = document.querySelectorAll('.tool-chip');
  const toolInput = document.getElementById('toolInput');
  const toolOutput = document.getElementById('toolOutput');
  const runToolBtn = document.getElementById('runToolBtn');
  const copyToolOutputBtn = document.getElementById('copyToolOutputBtn');

  const cheatChips = document.querySelectorAll('.cheat-chip');
  const cheatContent = document.getElementById('cheatContent');

  const launchPipBtn = document.getElementById('launchPipBtn');
  const footerStatus = document.getElementById('footerStatus');

  // Quiz Game Data
  const quizQuestions = [
    { q: 'Which method adds elements to the end of an Array?', opts: ['push()', 'pop()', 'shift()', 'unshift()'], ans: 0 },
    { q: 'What does CSS property "display: flex" create?', opts: ['Flex container', 'Grid layout', 'Block element', 'Inline box'], ans: 0 },
    { q: 'What is HTTP status code 404?', opts: ['Not Found', 'OK', 'Forbidden', 'Internal Server Error'], ans: 0 },
    { q: 'Which keyword defines a block-scoped constant in JS?', opts: ['const', 'var', 'let', 'static'], ans: 0 },
    { q: 'Which Git command stages modified files?', opts: ['git add .', 'git commit', 'git push', 'git checkout'], ans: 0 }
  ];
  let quizIndex = 0;
  let currentScore = 0;
  const quizCard = document.getElementById('quizCard');
  const quizQuestion = document.getElementById('quizQuestion');
  const quizOptions = document.getElementById('quizOptions');
  const startQuizBtn = document.getElementById('startQuizBtn');
  const quizHighScore = document.getElementById('quizHighScore');

  const cheatData = {
    git: [
      { code: 'git status', desc: 'Check working tree status' },
      { code: 'git add .', desc: 'Stage all modified files' },
      { code: 'git commit -m "msg"', desc: 'Commit staged changes' },
      { code: 'git push origin main', desc: 'Push commits to remote' },
      { code: 'git checkout -b branch', desc: 'Create and switch branch' }
    ],
    flex: [
      { code: 'display: flex;', desc: 'Initialize flex layout' },
      { code: 'justify-content: center;', desc: 'Align along main axis' },
      { code: 'align-items: center;', desc: 'Align along cross axis' },
      { code: 'flex-direction: column;', desc: 'Stack items vertically' },
      { code: 'gap: 12px;', desc: 'Set gap between items' }
    ],
    http: [
      { code: '200 OK', desc: 'Successful HTTP request' },
      { code: '201 Created', desc: 'Resource created successfully' },
      { code: '400 Bad Request', desc: 'Client syntax error' },
      { code: '401 Unauthorized', desc: 'Authentication required' },
      { code: '404 Not Found', desc: 'Resource does not exist' }
    ],
    regex: [
      { code: '^\\d+$', desc: 'Match digits only' },
      { code: '^[a-zA-Z0-9]+$', desc: 'Match alphanumeric string' },
      { code: '\\b(word)\\b', desc: 'Match exact word boundary' },
      { code: 'https?:\\/\\/[^\\s]+', desc: 'Match HTTP/HTTPS URL' }
    ]
  };

  function loadDevData() {
    chrome.runtime.sendMessage({ action: 'GET_DATA' }, (res) => {
      if (res) {
        devData = res;
        renderPalette();
        renderCheats();
        if (quizHighScore) quizHighScore.textContent = `High Score: ${res.quizScore || 0}`;
      }
    });
  }

  function renderPalette() {
    paletteGrid.innerHTML = '';
    const palette = devData.devPalette || [];
    if (palette.length === 0) {
      paletteGrid.innerHTML = '<div style="grid-column:span 2; font-size:11px; color:#94a3b8;">No color tokens saved yet. Toggle inspector to save colors!</div>';
      return;
    }

    palette.forEach(c => {
      const card = document.createElement('div');
      card.className = 'color-card';
      card.innerHTML = `
        <div class="color-box" style="background:${c.hex}"></div>
        <div class="color-info">
          <span class="color-name">${c.name || 'Token'}</span>
          <span class="color-hex">${c.hex}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        navigator.clipboard.writeText(c.hex);
        showStatus(`Copied ${c.hex}!`);
      });
      paletteGrid.appendChild(card);
    });
  }

  function renderCheats() {
    cheatContent.innerHTML = '';
    const items = cheatData[currentCheatCat] || [];
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'cheat-item';
      card.innerHTML = `
        <span class="cheat-code">${escapeHtml(item.code)}</span>
        <span class="cheat-desc">${escapeHtml(item.desc)}</span>
      `;
      card.addEventListener('click', () => {
        navigator.clipboard.writeText(item.code);
        showStatus(`Copied: ${item.code}`);
      });
      cheatContent.appendChild(card);
    });
  }

  function showStatus(msg) {
    footerStatus.textContent = msg;
    setTimeout(() => { footerStatus.textContent = 'Ready'; }, 1500);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // View Navigation
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`view-${btn.dataset.view}`).classList.add('active');
    });
  });

  // Toggle Inspector
  toggleInspectorBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'TOGGLE_INSPECTOR' }, () => {
      showStatus('Inspector Toggled');
    });
  });

  // Export Palette
  exportPaletteBtn.addEventListener('click', () => {
    const cssVars = (devData.devPalette || []).map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.name} */`).join('\n');
    const cssContent = `:root {\n${cssVars}\n}`;
    navigator.clipboard.writeText(cssContent);
    showStatus('Exported CSS Variables!');
  });

  // Utilities Tool
  toolChips.forEach(chip => {
    chip.addEventListener('click', () => {
      toolChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentTool = chip.dataset.tool;
    });
  });

  runToolBtn.addEventListener('click', () => {
    const val = toolInput.value;
    if (!val) return;
    try {
      if (currentTool === 'json') {
        const parsed = JSON.parse(val);
        toolOutput.value = JSON.stringify(parsed, null, 2);
      } else if (currentTool === 'b64e') {
        toolOutput.value = btoa(val);
      } else if (currentTool === 'b64d') {
        toolOutput.value = atob(val);
      } else if (currentTool === 'urle') {
        toolOutput.value = encodeURIComponent(val);
      }
      showStatus('Processed!');
    } catch (e) {
      toolOutput.value = 'Error processing input';
    }
  });

  copyToolOutputBtn.addEventListener('click', () => {
    if (toolOutput.value) {
      navigator.clipboard.writeText(toolOutput.value);
      showStatus('Copied Result!');
    }
  });

  // Cheat Chips
  cheatChips.forEach(chip => {
    chip.addEventListener('click', () => {
      cheatChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCheatCat = chip.dataset.cat;
      renderCheats();
    });
  });

  // Micro Quiz Game
  function startQuiz() {
    quizIndex = 0;
    currentScore = 0;
    renderQuestion();
  }

  function renderQuestion() {
    if (quizIndex >= quizQuestions.length) {
      quizQuestion.textContent = `Quiz Finished! Score: ${currentScore}/${quizQuestions.length}`;
      quizOptions.innerHTML = '';
      if (currentScore > (devData.quizScore || 0)) {
        chrome.storage.local.set({ quizScore: currentScore }, () => {
          quizHighScore.textContent = `High Score: ${currentScore}`;
        });
      }
      startQuizBtn.textContent = 'Play Again';
      return;
    }

    const q = quizQuestions[quizIndex];
    quizQuestion.textContent = `Q${quizIndex + 1}: ${q.q}`;
    quizOptions.innerHTML = '';

    q.opts.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (idx === q.ans) currentScore += 1;
        quizIndex += 1;
        renderQuestion();
      });
      quizOptions.appendChild(btn);
    });
  }

  startQuizBtn.addEventListener('click', startQuiz);

  // PIP Floating Window
  launchPipBtn.addEventListener('click', async () => {
    if (!('documentPictureInPicture' in window)) {
      showStatus('PIP supported in Chrome/Edge Desktop');
      return;
    }

    try {
      const pipWindow = await documentPictureInPicture.requestWindow({ width: 360, height: 450 });

      const style = pipWindow.document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@400;700&display=swap');
        html, body { margin: 0; padding: 0; height: 100%; width: 100%; box-sizing: border-box; }
        body { background: #0f172a; color: #f8fafc; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }
        .pip-header { padding: 10px 14px; background: rgba(15,23,42,0.95); border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 13px; font-weight: 800; color: #38bdf8; }
        textarea { flex: 1; background: #0f172a; border: none; padding: 12px; color: #f8fafc; font-family: 'Fira Code', monospace; font-size: 12px; outline: none; resize: none; }
      `;
      pipWindow.document.head.appendChild(style);

      pipWindow.document.body.innerHTML = `
        <div class="pip-header">DevLens Floating Notepad</div>
        <textarea id="pipTextarea" placeholder="Type notes or paste code snippets here..."></textarea>
      `;

      const txt = pipWindow.document.getElementById('pipTextarea');
      txt.value = devData.devNotes || '';
      txt.addEventListener('input', () => {
        chrome.storage.local.set({ devNotes: txt.value });
      });
    } catch (e) {
      showStatus('Could not open PIP Window');
    }
  });

  loadDevData();
});
