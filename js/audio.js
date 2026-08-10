window.TimerApp = window.TimerApp || {};

(function(exports) {
  'use strict';

  var audioCtx = null;
  var initialized = false;

  function init() {
    if (initialized) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      initialized = true;
    } catch (e) {
      // Web Audio API not available
    }
  }

  /**
   * Ensure audio context is resumed (needed after user gesture on some browsers).
   * Returns a Promise so callers can wait until the context is truly running
   * before scheduling oscillators against audioCtx.currentTime.
   */
  function ensureResumed() {
    if (audioCtx && audioCtx.state === 'suspended') {
      return audioCtx.resume();
    }
    return Promise.resolve();
  }

  /**
   * Play a short beep at the given frequency.
   */
  function beep(frequency, duration, volume) {
    if (!audioCtx) return;
    ensureResumed().then(function() {
      frequency = frequency || 880;
      duration = duration || 0.12;
      volume = volume || 0.15;

      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.value = volume;

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      var now = audioCtx.currentTime;
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Play a sharp police-whistle tone for countdown alerts.
   * Two slightly detuned sine waves (2740 + 2800 Hz) create a fixed
   * ~60 Hz beat that gives the tone natural thickness without any
   * moving modulation — fast attack, flat sustain, quick release.
   */
  function whistle() {
    if (!audioCtx) return;
    ensureResumed().then(function() {
      var now = audioCtx.currentTime;
      var duration = 0.32;

      // Two detuned oscillators for a fixed, subtle beat (~60 Hz apart)
      var freqs = [1940, 2000];

      for (var i = 0; i < freqs.length; i++) {
        var osc = audioCtx.createOscillator();
        var envelope = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqs[i], now);

        // Amplitude envelope
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(0.16, now + 0.02);
        envelope.gain.setValueAtTime(0.16, now + 0.29);
        envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(envelope);
        envelope.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration);
      }
    });
  }

  /**
   * Play a lower, longer tone for phase transitions.
   */
  function transitionTone() {
    if (!audioCtx) return;
    ensureResumed().then(function() {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      var now = audioCtx.currentTime;
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  /**
   * Play a completion chime (ascending two-tone).
   */
  function completionChime() {
    if (!audioCtx) return;
    ensureResumed().then(function() {
      [523, 784].forEach(function(freq, i) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.15);
        osc.stop(audioCtx.currentTime + i * 0.15 + 0.5);
      });
    });
  }

  var cachedVoices = null;
  var routineName = '';
  var suppressFinished = false;

  /**
   * Speak a phrase using the Speech Synthesis API.
   */
  function speak(phrase, lang) {
    if (!window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (!cachedVoices || cachedVoices.length === 0) {
      cachedVoices = window.speechSynthesis.getVoices();
    }

    var utterance = new SpeechSynthesisUtterance(phrase);
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    if (lang) {
      utterance.lang = lang;
      // Prefer an exact locale match, then a prefix match
      var bestVoice = null;
      for (var i = 0; i < cachedVoices.length; i++) {
        if (cachedVoices[i].lang === lang) {
          bestVoice = cachedVoices[i];
          break;
        }
        if (!bestVoice && cachedVoices[i].lang.indexOf(lang) === 0) {
          bestVoice = cachedVoices[i];
        }
      }
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
    }
    window.speechSynthesis.speak(utterance);

    // Proactively resume audio context — speech synthesis may have suspended it
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Preload voices — some browsers load them asynchronously
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function() {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  }

  /**
   * Announce a phase change.
   */
  function announcePhase(phase) {
    var t = exports.I18n.t;
    var lang = exports.I18n.getLanguage();
    var SPEECH_LOCALE = { en: 'en-US', 'zh-HK': 'zh-HK', 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN', ja: 'ja-JP' };
    var speechLang = SPEECH_LOCALE[lang] || '';
    switch (phase) {
      case 'prepare':
        speak(routineName ? t('audioPrepareName', { name: routineName }) : t('audioPrepare'), speechLang);
        break;
      case 'work': speak(t('audioWork'), speechLang); break;
      case 'rest': speak(t('audioRest'), speechLang); break;
      case 'finished':
        if (!suppressFinished) speak(t('audioFinished'), speechLang);
        break;
    }
  }

  /**
   * Wire up audio to state events.
   */
  function wire(stateModule) {
    stateModule.on('phasechange', function(data) {
      if (data.phase === 'finished') {
        completionChime();
      } else if (data.phase !== 'paused') {
        transitionTone();
      }
      announcePhase(data.phase);
    });

    stateModule.on('tick', function() {
      var st = stateModule.getState();
      if (st && st.phaseSecondsRemaining <= 3 && st.phaseSecondsRemaining > 0
          && st.phase !== 'idle' && st.phase !== 'finished' && !st.isPaused) {
        if (st.phase === 'work') {
          whistle();
        } else {
          beep(880, 0.1, 0.12);
        }
      }
    });
  }

  exports.Audio = {
    init: init,
    beep: beep,
    whistle: whistle,
    transitionTone: transitionTone,
    completionChime: completionChime,
    speak: speak,
    wire: wire,
    setRoutineName: function(name) { routineName = name; },
    setSuppressFinished: function(val) { suppressFinished = val; }
  };

})(window.TimerApp);
