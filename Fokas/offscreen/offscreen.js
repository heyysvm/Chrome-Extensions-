let currentAudio = null;

function playSound(soundFile) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const soundUrl = chrome.runtime.getURL('assets/' + (soundFile || 'ios_sos_alarm.wav'));
  currentAudio = new Audio(soundUrl);
  currentAudio.loop = true;
  currentAudio.volume = 1.0;

  return currentAudio.play().catch(err => {
    console.log('Audio play error for', soundFile, err);
    if (soundFile !== 'ios_sos_alarm.wav') {
      const fallbackUrl = chrome.runtime.getURL('assets/ios_sos_alarm.wav');
      currentAudio = new Audio(fallbackUrl);
      currentAudio.loop = true;
      currentAudio.volume = 1.0;
      currentAudio.play().catch(e => console.log('Fallback audio error:', e));
    }
  });
}

function stopSound() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'OFFSCREEN_PLAY_ALARM') {
    const soundFile = msg.soundFile || 'ios_sos_alarm.wav';
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
