window.TimerApp = window.TimerApp || {};

(function(exports) {
  'use strict';

  var STORAGE_KEY = 'interval-timer-routines';
  var CONFIG_KEY = 'interval-timer-last-config';

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  function getRoutines() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      var routines = data ? JSON.parse(data) : [];
      // Migrate: assign order to routines that don't have one
      var needsSave = false;
      for (var i = 0; i < routines.length; i++) {
        if (routines[i].order === undefined) {
          routines[i].order = i;
          needsSave = true;
        }
      }
      if (needsSave) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
      }
      routines.sort(function(a, b) { return a.order - b.order; });
      return routines;
    } catch (e) {
      return [];
    }
  }

  function saveRoutine(routine) {
    var routines = getRoutines();
    if (!routine.id) {
      routine.id = generateId();
      // New routines go to the end
      var maxOrder = 0;
      for (var i = 0; i < routines.length; i++) {
        if (routines[i].order > maxOrder) maxOrder = routines[i].order;
      }
      routine.order = maxOrder + 1;
      routines.push(routine);
    } else {
      var idx = -1;
      for (var i = 0; i < routines.length; i++) {
        if (routines[i].id === routine.id) { idx = i; break; }
      }
      if (idx >= 0) {
        routine.order = routines[idx].order; // preserve existing order
        routines[idx] = routine;
      } else {
        routine.id = generateId();
        var max = 0;
        for (var j = 0; j < routines.length; j++) {
          if (routines[j].order > max) max = routines[j].order;
        }
        routine.order = max + 1;
        routines.push(routine);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
    return routine;
  }

  function reorderRoutines(orderedIds) {
    var routines = getRoutines();
    for (var i = 0; i < orderedIds.length; i++) {
      for (var j = 0; j < routines.length; j++) {
        if (routines[j].id === orderedIds[i]) {
          routines[j].order = i;
          break;
        }
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  }

  function deleteRoutine(id) {
    var routines = [];
    var all = getRoutines();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id !== id) routines.push(all[i]);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  }

  function deleteAllRoutines() {
    localStorage.setItem(STORAGE_KEY, '[]');
  }

  function getLastConfig() {
    try {
      var data = localStorage.getItem(CONFIG_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function saveLastConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  exports.Storage = {
    getRoutines: getRoutines,
    saveRoutine: saveRoutine,
    deleteRoutine: deleteRoutine,
    deleteAllRoutines: deleteAllRoutines,
    reorderRoutines: reorderRoutines,
    getLastConfig: getLastConfig,
    saveLastConfig: saveLastConfig
  };

})(window.TimerApp);
