let currentAudio = null;
let currentSoundFile = null;

function stopSound() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
    } catch (e) {}
    currentAudio = null;
  }
  currentSoundFile = null;
}

function playSound(soundFile) {
  const chosen = soundFile || 'chodu-cid.mp3';

  if (currentAudio && currentSoundFile === chosen && !currentAudio.paused) {
    return Promise.resolve();
  }

  stopSound();

  const soundUrl = chrome.runtime.getURL('assets/' + chosen);
  currentAudio = new Audio(soundUrl);
  currentSoundFile = chosen;
  currentAudio.loop = true;
  currentAudio.volume = 1.0;

  return currentAudio.play().catch(err => {
    console.log('Audio play error for', chosen, err);
    if (chosen !== 'chodu-cid.mp3') {
      stopSound();
      const fallbackUrl = chrome.runtime.getURL('assets/chodu-cid.mp3');
      currentAudio = new Audio(fallbackUrl);
      currentSoundFile = 'chodu-cid.mp3';
      currentAudio.loop = true;
      currentAudio.volume = 1.0;
      currentAudio.play().catch(e => console.log('Fallback audio error:', e));
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'OFFSCREEN_PLAY_ALARM') {
    const soundFile = msg.soundFile || 'chodu-cid.mp3';
    playSound(soundFile);
    sendResponse({ status: 'playing', soundFile });
    return true;
  }

  if (msg.action === 'OFFSCREEN_STOP_ALARM') {
    stopSound();
    sendResponse({ status: 'stopped' });
    return true;
  }
});
