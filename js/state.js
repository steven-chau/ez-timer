window.TimerApp = window.TimerApp || {};

(function(exports) {
  'use strict';

  var PHASE_COLORS = {
    prepare: 'var(--color-prepare)',
    work: 'var(--color-work)',
    rest: 'var(--color-rest)'
  };

  var PHASE_ORDER = ['prepare', 'work', 'rest'];

  var state = null;
  var listeners = [];
  var pendingAdvanceId = null;

  /* Origin: steven-chau/ez-timer — ezit-f7d2k9 */
  function defaultConfig() {
    return {
      sets: 3,
      workMinutes: 0,
      workSeconds: 30,
      restMinutes: 0,
      restSeconds: 10,
      prepareMinutes: 0,
      prepareSeconds: 10
    };
  }

  function configToSeconds(cfg) {
    return {
      prepare: cfg.prepareMinutes * 60 + cfg.prepareSeconds,
      work: cfg.workMinutes * 60 + cfg.workSeconds,
      rest: cfg.restMinutes * 60 + cfg.restSeconds
    };
  }

  function getInitialState(config) {
    var secs = configToSeconds(config);
    return {
      view: 'config',
      config: config,
      totalSets: config.sets,
      currentSet: 1,
      phase: 'idle',         // idle | prepare | work | rest | paused | finished
      previousPhase: null,   // used when resuming from paused
      phaseSecondsRemaining: 0,
      phaseSecondsTotal: 0,
      isPaused: false,
      isLocked: false,
      seconds: secs
    };
  }

  function init(config) {
    state = getInitialState(config || defaultConfig());
  }

  function getState() {
    return state;
  }

  function on(eventName, fn) {
    listeners.push({ event: eventName, fn: fn });
  }

  function emit(eventName, data) {
    for (var i = 0; i < listeners.length; i++) {
      if (listeners[i].event === eventName) {
        listeners[i].fn(data);
      }
    }
  }

  /**
   * Advance to the next phase when current phase's timer reaches 0.
   */
  function advancePhase() {
    if (state.phase === 'prepare') {
      if (state.seconds.work > 0) {
        setPhase('work', state.seconds.work);
      } else if (state.seconds.rest > 0 && state.currentSet < state.totalSets) {
        setPhase('rest', state.seconds.rest);
      } else if (state.currentSet >= state.totalSets) {
        finish();
      } else {
        state.currentSet++;
        advancePhase();
      }
    } else if (state.phase === 'work') {
      if (state.seconds.rest > 0 && state.currentSet < state.totalSets) {
        setPhase('rest', state.seconds.rest);
      } else if (state.currentSet >= state.totalSets) {
        finish();
      } else {
        state.currentSet++;
        setPhase('work', state.seconds.work);
      }
    } else if (state.phase === 'rest') {
      state.currentSet++;
      if (state.seconds.work > 0) {
        setPhase('work', state.seconds.work);
      } else if (state.seconds.rest > 0 && state.currentSet < state.totalSets) {
        setPhase('rest', state.seconds.rest);
      } else if (state.currentSet >= state.totalSets) {
        finish();
      } else {
        advancePhase();
      }
    }
  }

  function setPhase(phase, totalSeconds) {
    state.previousPhase = state.phase;
    state.phase = phase;
    state.phaseSecondsRemaining = totalSeconds;
    state.phaseSecondsTotal = totalSeconds;
    emit('phasechange', { phase: phase });
  }

  function finish() {
    state.phase = 'finished';
    state.phaseSecondsRemaining = 0;
    state.previousPhase = null;
    emit('phasechange', { phase: 'finished' });
    emit('finish');
  }

  /**
   * Main transition function. Called by timer ticks and user actions.
   * Returns true if the timer should continue running.
   */
  function transition(action, data) {
    if (!state) return false;

    switch (action) {
      case 'start':
        if (state.phase !== 'idle') return false;
        state.view = 'timer';
        var secs = state.seconds;
        if (secs.prepare > 0) {
          setPhase('prepare', secs.prepare);
        } else if (secs.work > 0) {
          setPhase('work', secs.work);
        } else {
          return false;
        }
        state.currentSet = 1;
        state.isPaused = false;
        emit('start');
        return true;

      case 'tick':
        if (state.isPaused || state.phase === 'idle' || state.phase === 'finished') return false;
        state.phaseSecondsRemaining--;
        emit('tick');
        if (state.phaseSecondsRemaining <= 0) {
          pendingAdvanceId = setTimeout(function() {
            pendingAdvanceId = null;
            advancePhase();
            if (state.phase !== 'finished') {
              exports.Timer.start();
            }
          }, 500);
          return false;
        }
        return state.phase !== 'finished';

      case 'pause':
        if (state.phase === 'idle' || state.phase === 'finished') return false;
        state.isPaused = true;
        state.previousPhase = state.phase;
        state.phase = 'paused';
        emit('phasechange', { phase: 'paused' });
        return false;

      case 'resume':
        if (!state.isPaused) return false;
        state.isPaused = false;
        state.phase = state.previousPhase;
        emit('phasechange', { phase: state.phase });
        return true;

      case 'skip-forward':
        if (state.isPaused) return false;
        if (state.phase === 'idle' || state.phase === 'finished') return false;
        if (state.phase === 'prepare' && state.seconds.work === 0) return state.phase !== 'finished';
        state.phaseSecondsRemaining = 0;
        advancePhase();
        return state.phase !== 'finished';

      case 'skip-backward':
        if (state.isPaused) return false;
        if (state.phase === 'idle' || state.phase === 'finished') return false;
        if (state.phase === 'prepare') {
          state.phaseSecondsRemaining = state.seconds.prepare;
          state.phaseSecondsTotal = state.seconds.prepare;
        } else if (state.phase === 'work') {
          if (state.currentSet === 1 && state.seconds.prepare > 0) {
            setPhase('prepare', state.seconds.prepare);
          } else if (state.currentSet > 1 && state.seconds.rest > 0) {
            state.currentSet--;
            setPhase('rest', state.seconds.rest);
          } else if (state.currentSet > 1) {
            state.currentSet--;
            setPhase('work', state.seconds.work);
          } else {
            state.phaseSecondsRemaining = state.phaseSecondsTotal;
          }
        } else if (state.phase === 'rest') {
          setPhase('work', state.seconds.work);
        }
        return state.phase !== 'finished';

      case 'exit':
        if (pendingAdvanceId !== null) {
          clearTimeout(pendingAdvanceId);
          pendingAdvanceId = null;
        }
        state.phase = 'idle';
        state.view = 'config';
        state.isPaused = false;
        state.isLocked = false;
        state.currentSet = 1;
        state.phaseSecondsRemaining = 0;
        emit('exit');
        return false;

      case 'toggle-lock':
        state.isLocked = !state.isLocked;
        emit('lockchange', { locked: state.isLocked });
        return !state.isPaused && state.phase !== 'idle' && state.phase !== 'finished';

      default:
        return false;
    }
  }

  function getPhaseColor() {
    if (!state || state.phase === 'idle' || state.phase === 'finished') return null;
    if (state.phase === 'paused') {
      return state.previousPhase ? PHASE_COLORS[state.previousPhase] : null;
    }
    return PHASE_COLORS[state.phase] || null;
  }

  function getPhaseClass() {
    if (!state) return '';
    if (state.phase === 'paused') return 'phase-paused';
    if (state.phase === 'finished') return 'phase-finished';
    return 'phase-' + state.phase;
  }

  exports.State = {
    init: init,
    getState: getState,
    transition: transition,
    on: on,
    getPhaseColor: getPhaseColor,
    getPhaseClass: getPhaseClass,
    configToSeconds: configToSeconds,
    defaultConfig: defaultConfig
  };

})(window.TimerApp);
