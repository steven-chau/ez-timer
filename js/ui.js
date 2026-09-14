window.TimerApp = window.TimerApp || {};

(function(exports) {
  'use strict';

  // ===== DOM references (cached on init) =====
  var configView, timerView, timerBg, routineLabel, phaseLabel, countdownDigits, countdownContainer;
  var progressRing, setCounter, btnPlayPause, iconPause, iconPlay;
  var btnSkipBack, btnSkipFwd, btnLock, iconUnlocked, iconLocked;
  var btnExit, lockOverlay, timerControls;
  var routinesGrid, routinesEmpty;
  var routineModal, modalTitle, btnModalCancel, btnModalSave;
  var confirmModal, confirmModalMessage, btnConfirmCancel, btnConfirmDelete;
  var btnMenuFullscreen, menuFullscreenLabel;
  var btnMenuShare;
  var btnSponsor;
  var btnMenu, menuBackdrop, menuDrawer, btnMenuClose;
  var recordsView, recordsList, recordsEmpty, btnLoadMore, btnModeDetailed, btnModeCalendar, btnRecordsBack;
  var recordsDetailed, recordsCalendar, calendarGrid, calendarDayHeaders, calendarMonthLabel;
  var setsDisplay;
  var workMinDisplay, workSecDisplay;
  var restMinDisplay, restSecDisplay;
  var prepareMinDisplay, prepareSecDisplay;
  var modalSetsDisplay;
  var modalWorkMinDisplay, modalWorkSecDisplay;
  var modalRestMinDisplay, modalRestSecDisplay;
  var modalPrepareMinDisplay, modalPrepareSecDisplay;

  // ===== Config state =====
  var config = {
    sets: 3,
    workMinutes: 0, workSeconds: 30,
    restMinutes: 0, restSeconds: 10,
    prepareMinutes: 0, prepareSeconds: 10
  };

  var modalConfig = {};
  var editingRoutineId = null;
  var pendingDeleteId = null;
  var currentRoutineName = '';
  var playlist = null;
  var configScrollY = 0;
  var recordsOffset = 0;
  var DAYS_PER_PAGE = 7;
  var calendarYear, calendarMonth;

  // ===== Circumference constant =====
  var CIRCUMFERENCE = 2 * Math.PI * 90; // ~565.49
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  // ===== Init =====
  function init() {
    cacheDom();
    exports.I18n.updatePageLanguage();
    loadLastConfig();
    renderRoutines();
    setupMenu();
    bindEvents();
    setupFullscreen();
  }

  function cacheDom() {
    configView = document.getElementById('config-view');
    timerView = document.getElementById('timer-view');
    timerBg = document.getElementById('timer-bg');
    routineLabel = document.getElementById('routine-label');
    phaseLabel = document.getElementById('phase-label');
    countdownDigits = document.getElementById('countdown-digits');
    countdownContainer = document.querySelector('.countdown-container');
    progressRing = document.getElementById('progress-ring');
    setCounter = document.getElementById('set-counter');
    btnPlayPause = document.getElementById('btn-play-pause');
    iconPause = document.getElementById('icon-pause');
    iconPlay = document.getElementById('icon-play');
    btnSkipBack = document.getElementById('btn-skip-back');
    btnSkipFwd = document.getElementById('btn-skip-fwd');
    btnLock = document.getElementById('btn-lock');
    iconUnlocked = document.getElementById('icon-unlocked');
    iconLocked = document.getElementById('icon-locked');
    btnExit = document.getElementById('btn-exit');
    lockOverlay = document.getElementById('lock-overlay');
    timerControls = document.getElementById('timer-controls');
    routinesGrid = document.getElementById('routines-grid');
    routinesEmpty = document.getElementById('routines-empty');
    routineModal = document.getElementById('routine-modal');
    modalTitle = document.getElementById('modal-title');

    setsDisplay = document.getElementById('sets-display');
    workMinDisplay = document.getElementById('work-min-display');
    workSecDisplay = document.getElementById('work-sec-display');
    restMinDisplay = document.getElementById('rest-min-display');
    restSecDisplay = document.getElementById('rest-sec-display');
    prepareMinDisplay = document.getElementById('prepare-min-display');
    prepareSecDisplay = document.getElementById('prepare-sec-display');

    modalSetsDisplay = document.getElementById('modal-sets-display');
    modalWorkMinDisplay = document.getElementById('modal-work-min-display');
    modalWorkSecDisplay = document.getElementById('modal-work-sec-display');
    modalRestMinDisplay = document.getElementById('modal-rest-min-display');
    modalRestSecDisplay = document.getElementById('modal-rest-sec-display');
    modalPrepareMinDisplay = document.getElementById('modal-prepare-min-display');
    modalPrepareSecDisplay = document.getElementById('modal-prepare-sec-display');

    btnModalCancel = document.getElementById('btn-modal-cancel');
    btnModalSave = document.getElementById('btn-modal-save');

    confirmModal = document.getElementById('confirm-modal');
    confirmModalMessage = document.getElementById('confirm-modal-message');
    btnConfirmCancel = document.getElementById('btn-confirm-cancel');
    btnConfirmDelete = document.getElementById('btn-confirm-delete');

    btnMenuFullscreen = document.getElementById('btn-menu-fullscreen');
    btnMenuShare = document.getElementById('btn-menu-share');
    btnSponsor = document.getElementById('btn-sponsor');

    btnMenu = document.getElementById('btn-menu');
    menuBackdrop = document.getElementById('menu-backdrop');
    menuDrawer = document.getElementById('menu-drawer');
    btnMenuClose = document.getElementById('btn-menu-close');

    // Records view
    recordsView = document.getElementById('records-view');
    recordsList = document.getElementById('records-list');
    recordsEmpty = document.getElementById('records-empty');
    btnLoadMore = document.getElementById('btn-load-more');
    btnModeDetailed = document.getElementById('btn-mode-detailed');
    btnModeCalendar = document.getElementById('btn-mode-calendar');
    btnRecordsBack = document.getElementById('btn-records-back');
    recordsDetailed = document.getElementById('records-detailed');
    recordsCalendar = document.getElementById('records-calendar');
    calendarGrid = document.getElementById('calendar-grid');
    calendarDayHeaders = document.getElementById('calendar-day-headers');
    calendarMonthLabel = document.getElementById('calendar-month-label');
  }

  // ===== Config Helpers =====
  function loadLastConfig() {
    var saved = exports.Storage.getLastConfig();
    if (saved) {
      config.sets = saved.sets || 3;
      config.workMinutes = saved.workMinutes || 0;
      config.workSeconds = saved.workSeconds || 30;
      config.restMinutes = saved.restMinutes || 0;
      config.restSeconds = saved.restSeconds || 10;
      config.prepareMinutes = saved.prepareMinutes || 0;
      config.prepareSeconds = saved.prepareSeconds || 10;
    }
    updateConfigDisplay();
  }

  function updateConfigDisplay() {
    setsDisplay.textContent = config.sets;
    workMinDisplay.textContent = config.workMinutes;
    workSecDisplay.textContent = pad(config.workSeconds);
    restMinDisplay.textContent = config.restMinutes;
    restSecDisplay.textContent = pad(config.restSeconds);
    prepareMinDisplay.textContent = config.prepareMinutes;
    prepareSecDisplay.textContent = pad(config.prepareSeconds);
  }

  function getConfigFromDOM(prefix) {
    var getEl = function(id) { return document.getElementById(id); };
    if (prefix === 'modal-') {
      return {
        sets: modalConfig.sets,
        workMinutes: modalConfig.workMinutes,
        workSeconds: modalConfig.workSeconds,
        restMinutes: modalConfig.restMinutes,
        restSeconds: modalConfig.restSeconds,
        prepareMinutes: modalConfig.prepareMinutes,
        prepareSeconds: modalConfig.prepareSeconds
      };
    }
    return {
      sets: config.sets,
      workMinutes: config.workMinutes,
      workSeconds: config.workSeconds,
      restMinutes: config.restMinutes,
      restSeconds: config.restSeconds,
      prepareMinutes: config.prepareMinutes,
      prepareSeconds: config.prepareSeconds
    };
  }

  function getQuickstartConfig() {
    return {
      sets: config.sets,
      workMinutes: config.workMinutes,
      workSeconds: config.workSeconds,
      restMinutes: config.restMinutes,
      restSeconds: config.restSeconds,
      prepareMinutes: config.prepareMinutes,
      prepareSeconds: config.prepareSeconds
    };
  }

  // ===== Stepper Logic =====
  function adjustConfig(target, action, isModal) {
    var cfg = isModal ? modalConfig : config;
    var amount = 1;
    // Shift key for ±10 adjustment on minutes, ±5 on seconds
    var shiftAmount = 10;

    switch (target) {
      case 'sets':
      case 'modal-sets':
        if (action === 'increment') cfg.sets = Math.min(99, cfg.sets + amount);
        else cfg.sets = Math.max(1, cfg.sets - amount);
        break;

      case 'work':
      case 'modal-work':
        if (action === 'increment') {
          cfg.workSeconds += 5;
          if (cfg.workSeconds >= 60) { cfg.workSeconds = 0; cfg.workMinutes++; }
          if (cfg.workMinutes > 99) { cfg.workMinutes = 99; cfg.workSeconds = 55; }
        } else {
          cfg.workSeconds -= 5;
          if (cfg.workSeconds < 0) { cfg.workSeconds = 55; cfg.workMinutes--; }
          if (cfg.workMinutes < 0) { cfg.workMinutes = 0; cfg.workSeconds = 0; }
        }
        break;

      case 'rest':
      case 'modal-rest':
        if (action === 'increment') {
          cfg.restSeconds += 5;
          if (cfg.restSeconds >= 60) { cfg.restSeconds = 0; cfg.restMinutes++; }
          if (cfg.restMinutes > 99) { cfg.restMinutes = 99; cfg.restSeconds = 55; }
        } else {
          cfg.restSeconds -= 5;
          if (cfg.restSeconds < 0) { cfg.restSeconds = 55; cfg.restMinutes--; }
          if (cfg.restMinutes < 0) { cfg.restMinutes = 0; cfg.restSeconds = 0; }
        }
        break;

      case 'prepare':
      case 'modal-prepare':
        if (action === 'increment') {
          cfg.prepareSeconds += 5;
          if (cfg.prepareSeconds >= 60) { cfg.prepareSeconds = 0; cfg.prepareMinutes++; }
          if (cfg.prepareMinutes > 99) { cfg.prepareMinutes = 99; cfg.prepareSeconds = 55; }
        } else {
          cfg.prepareSeconds -= 5;
          if (cfg.prepareSeconds < 0) { cfg.prepareSeconds = 55; cfg.prepareMinutes--; }
          if (cfg.prepareMinutes < 0) { cfg.prepareMinutes = 0; cfg.prepareSeconds = 0; }
        }
        break;
    }

    if (isModal) {
      updateModalDisplay();
    } else {
      updateConfigDisplay();
      saveCurrentConfig();
    }
  }

  function saveCurrentConfig() {
    exports.Storage.saveLastConfig(getQuickstartConfig());
  }

  // ===== Time Input Editing =====
  function startTimeEdit(displayEl, cfgKey, minDisplay, secDisplay, isModal) {
    if (displayEl.classList.contains('editing')) return;
    displayEl.classList.add('editing');

    var cfg = isModal ? modalConfig : config;
    var minKey = cfgKey + 'Minutes';
    var secKey = cfgKey + 'Seconds';

    // Replace spans with inputs
    minDisplay.innerHTML = '<input type="number" class="time-edit-input" value="' + cfg[minKey] + '" min="0" max="99" inputmode="numeric">';
    secDisplay.innerHTML = '<input type="number" class="time-edit-input" value="' + pad(cfg[secKey]) + '" min="0" max="59" inputmode="numeric">';

    var minInput = minDisplay.querySelector('input');
    var secInput = secDisplay.querySelector('input');

    minInput.focus();
    minInput.select();

    function commit() {
      var newMin = clamp(parseInt(minInput.value, 10) || 0, 0, 99);
      var newSec = clamp(parseInt(secInput.value, 10) || 0, 0, 59);
      cfg[minKey] = newMin;
      cfg[secKey] = newSec;

      // Restore display
      minDisplay.textContent = newMin;
      secDisplay.textContent = pad(newSec);
      displayEl.classList.remove('editing');

      if (isModal) {
        updateModalDisplay();
      } else {
        saveCurrentConfig();
      }
    }

    function cancel() {
      minDisplay.textContent = cfg[minKey];
      secDisplay.textContent = pad(cfg[secKey]);
      displayEl.classList.remove('editing');
    }

    displayEl.addEventListener('focusout', function() {
      setTimeout(function() {
        if (displayEl.classList.contains('editing') && !displayEl.contains(document.activeElement)) {
          commit();
        }
      }, 150);
    });

    function onKeydown(e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    }

    minInput.addEventListener('keydown', onKeydown);
    secInput.addEventListener('keydown', onKeydown);
  }

  // ===== Modal =====
  function openModal(routine) {
    editingRoutineId = routine ? routine.id : null;
    modalTitle.textContent = exports.I18n.t(routine && routine.id ? 'editRoutine' : 'newRoutine');
    document.getElementById('modal-name').value = routine ? routine.name : '';

    if (routine) {
      modalConfig = {
        sets: routine.sets,
        workMinutes: routine.workMinutes,
        workSeconds: routine.workSeconds,
        restMinutes: routine.restMinutes,
        restSeconds: routine.restSeconds,
        prepareMinutes: routine.prepareMinutes || 0,
        prepareSeconds: routine.prepareSeconds || 10
      };
    } else {
      modalConfig = {
        sets: config.sets,
        workMinutes: config.workMinutes,
        workSeconds: config.workSeconds,
        restMinutes: config.restMinutes,
        restSeconds: config.restSeconds,
        prepareMinutes: config.prepareMinutes,
        prepareSeconds: config.prepareSeconds
      };
    }
    updateModalDisplay();
    routineModal.classList.remove('hidden');
    document.getElementById('modal-name').focus();
  }

  function closeModal() {
    routineModal.classList.add('hidden');
    editingRoutineId = null;
  }

  function openConfirmModal(name, id) {
    pendingDeleteId = id;
    confirmModalMessage.textContent = exports.I18n.t('confirmDelete', {name: name});
    confirmModal.classList.remove('hidden');
    btnConfirmCancel.focus();
  }

  function closeConfirmModal() {
    confirmModal.classList.add('hidden');
    pendingDeleteId = null;
  }

  function openLanguageModal() {
    updateLanguageModalActive();
    document.getElementById('language-modal').classList.remove('hidden');
  }

  function closeLanguageModal() {
    document.getElementById('language-modal').classList.add('hidden');
  }

  function updateLanguageModalActive() {
    var current = exports.I18n.getLanguage();
    var options = document.querySelectorAll('.language-option');
    for (var i = 0; i < options.length; i++) {
      var opt = options[i];
      if (opt.getAttribute('data-lang') === current) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    }
  }

  function updateModalDisplay() {
    modalSetsDisplay.textContent = modalConfig.sets;
    modalWorkMinDisplay.textContent = modalConfig.workMinutes;
    modalWorkSecDisplay.textContent = pad(modalConfig.workSeconds);
    modalRestMinDisplay.textContent = modalConfig.restMinutes;
    modalRestSecDisplay.textContent = pad(modalConfig.restSeconds);
    modalPrepareMinDisplay.textContent = modalConfig.prepareMinutes;
    modalPrepareSecDisplay.textContent = pad(modalConfig.prepareSeconds);
  }

  function saveModal() {
    var name = document.getElementById('modal-name').value.trim();
    if (!name) {
      document.getElementById('modal-name').focus();
      return;
    }

    var routine = {
      id: editingRoutineId,
      name: name,
      sets: modalConfig.sets,
      workMinutes: modalConfig.workMinutes,
      workSeconds: modalConfig.workSeconds,
      restMinutes: modalConfig.restMinutes,
      restSeconds: modalConfig.restSeconds,
      prepareMinutes: modalConfig.prepareMinutes,
      prepareSeconds: modalConfig.prepareSeconds
    };

    exports.Storage.saveRoutine(routine);
    closeModal();
    renderRoutines();
  }

  // ===== Routines =====
  function renderRoutines() {
    var routines = exports.Storage.getRoutines();
    routinesGrid.innerHTML = '';

    if (routines.length === 0) {
      routinesEmpty.classList.remove('hidden');
      return;
    }

    routinesEmpty.classList.add('hidden');

    if (routines.length > 1) {
      routinesGrid.appendChild(createAllCard(routines));
    }

    for (var i = 0; i < routines.length; i++) {
      routinesGrid.appendChild(createRoutineCard(routines[i]));
    }
  }

  var draggedId = null;

  function onDragStart(e) {
    draggedId = this.dataset.id;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragEnd(e) {
    this.classList.remove('dragging');
    var cards = routinesGrid.querySelectorAll('.routine-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.remove('drag-over');
    }
    draggedId = null;
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var card = e.target.closest('.routine-card');
    if (card && card.dataset.id !== draggedId) {
      var cards = routinesGrid.querySelectorAll('.routine-card');
      for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove('drag-over');
      }
      card.classList.add('drag-over');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    var card = e.target.closest('.routine-card');
    if (!card || card.dataset.id === draggedId) return;
    card.classList.remove('drag-over');

    var cards = routinesGrid.querySelectorAll('.routine-card');
    var orderedIds = [];
    var dropIdx = -1;
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].dataset.id === card.dataset.id) dropIdx = i;
    }
    for (var j = 0; j < cards.length; j++) {
      if (cards[j].dataset.id !== draggedId) {
        orderedIds.push(cards[j].dataset.id);
      }
    }
    orderedIds.splice(dropIdx, 0, draggedId);

    exports.Storage.reorderRoutines(orderedIds);
    renderRoutines();
  }

  function createRoutineCard(routine) {
    var card = document.createElement('div');
    card.className = 'routine-card';
    card.draggable = true;
    card.dataset.id = routine.id;
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragend', onDragEnd);
    var t = exports.I18n.t;

    var totalSec = routine.prepareSeconds +
      (routine.sets * (routine.workMinutes * 60 + routine.workSeconds)) +
      ((routine.sets - 1) * (routine.restMinutes * 60 + routine.restSeconds));
    var durationStr = formatDuration(totalSec);

    var workSec = routine.workMinutes * 60 + routine.workSeconds;
    var restSec = routine.restMinutes * 60 + routine.restSeconds;

    card.innerHTML =
      '<div class="routine-card-header">' +
        '<span class="routine-card-name">' + escapeHtml(routine.name) + '</span>' +
        '<span class="routine-card-grip" aria-hidden="true">' +
          '<svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" opacity="0.35">' +
            '<circle cx="3" cy="3" r="1.2"/><circle cx="9" cy="3" r="1.2"/>' +
            '<circle cx="3" cy="8" r="1.2"/><circle cx="9" cy="8" r="1.2"/>' +
            '<circle cx="3" cy="13" r="1.2"/><circle cx="9" cy="13" r="1.2"/>' +
          '</svg>' +
        '</span>' +
      '</div>' +
      '<div class="routine-card-duration">' + durationStr + '</div>' +
      '<div class="routine-card-tags">' +
        '<span class="routine-tag sets">' + routine.sets + 'x</span>' +
        '<span class="routine-tag">' + escapeHtml(t('work')) + ' ' + formatDurationShort(workSec) + '</span>' +
        (restSec > 0 ? '<span class="routine-tag">' + escapeHtml(t('rest')) + ' ' + formatDurationShort(restSec) + '</span>' : '') +
      '</div>' +
      '<div class="routine-card-actions">' +
        '<button class="btn btn-icon-only btn-secondary routine-edit" data-id="' + routine.id + '" aria-label="' + escapeHtml(t('edit')) + '">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
        '</button>' +
        '<button class="btn btn-icon-only btn-secondary routine-clone" data-id="' + routine.id + '" aria-label="' + escapeHtml(t('clone')) + '">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
        '</button>' +
        '<button class="btn btn-icon-only btn-danger routine-delete" data-id="' + routine.id + '" aria-label="' + escapeHtml(t('delete')) + '">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        '</button>' +
        '<button class="btn btn-primary routine-start btn-start-icon" data-id="' + routine.id + '" aria-label="' + escapeHtml(t('start')) + '">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '</button>' +
      '</div>';

    return card;
  }

  function createAllCard(routines) {
    var card = document.createElement('div');
    card.className = 'routine-card routine-card-all';
    var t = exports.I18n.t;

    var totalSec = 0;
    for (var i = 0; i < routines.length; i++) {
      var r = routines[i];
      totalSec += r.prepareSeconds +
        (r.sets * (r.workMinutes * 60 + r.workSeconds)) +
        ((r.sets - 1) * (r.restMinutes * 60 + r.restSeconds));
    }

    card.innerHTML =
      '<div class="routine-card-all-name">' + escapeHtml(t('all')) + '</div>' +
      '<div class="routine-card-duration">' + formatDuration(totalSec) + '</div>' +
      '<div class="routine-card-all-actions">' +
        '<button class="btn btn-secondary routine-all-shuffle">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>' +
          '<span>' + escapeHtml(t('shuffle')) + '</span>' +
        '</button>' +
        '<button class="btn btn-primary routine-all-play" aria-label="' + escapeHtml(t('start')) + '">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '</button>' +
      '</div>';

    return card;
  }

  // ===== Timer View =====
  function showTimerView() {
    configScrollY = window.scrollY;
    configView.classList.add('hidden');
    recordsView.classList.add('hidden');
    timerView.classList.remove('hidden');
    updateTimerDisplay();
  }

  function showConfigView() {
    timerView.classList.add('hidden');
    recordsView.classList.add('hidden');
    configView.classList.remove('hidden');
    updateConfigDisplay();
    renderRoutines();
    if (exports.Confetti) exports.Confetti.stop();
    var gif = document.getElementById('finish-gif');
    if (gif) {
      gif.classList.remove('pop');
      gif.style.left = '';
      gif.style.top = '';
    }
    window.scrollTo(0, configScrollY);
  }

  // ===== Records View =====
  function showRecordsView() {
    configScrollY = window.scrollY;
    configView.classList.add('hidden');
    timerView.classList.add('hidden');
    recordsView.classList.remove('hidden');
    recordsOffset = 0;
    var now = new Date();
    calendarYear = now.getFullYear();
    calendarMonth = now.getMonth();
    renderDetailedView();
  }

  function hideRecordsView() {
    recordsView.classList.add('hidden');
    configView.classList.remove('hidden');
    updateConfigDisplay();
    renderRoutines();
    window.scrollTo(0, configScrollY);
  }

  function renderDetailedView() {
    var t = exports.I18n.t;
    var lang = exports.I18n.getLanguage();
    var result = exports.Records.getPaginated(recordsOffset, DAYS_PER_PAGE, lang);

    // Build day groups
    var html = '';
    for (var i = 0; i < result.days.length; i++) {
      var day = result.days[i];
      html += '<div class="records-day">';
      html += '<div class="records-day-header">' + escapeHtml(day.label) + '</div>';
      // Within a day, chronological order (oldest first)
      for (var j = day.records.length - 1; j >= 0; j--) {
        var rec = day.records[j];
        var time = new Date(rec.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        html += '<div class="records-item">';
        html += '<span class="records-item-name">' + escapeHtml(rec.name) + ' (' + escapeHtml(formatDuration(rec.duration)) + ')</span>';
        html += '<span class="records-item-time">' + escapeHtml(time) + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }

    recordsList.innerHTML = html;

    if (result.days.length === 0 && recordsOffset === 0) {
      recordsEmpty.classList.remove('hidden');
    } else {
      recordsEmpty.classList.add('hidden');
    }

    if (result.hasMore) {
      btnLoadMore.classList.remove('hidden');
    } else {
      btnLoadMore.classList.add('hidden');
    }
  }

  function loadMoreRecords() {
    recordsOffset += DAYS_PER_PAGE;
    renderDetailedView();
  }

  function renderCalendarView() {
    var daily = exports.Records.getDailyDurations(calendarYear, calendarMonth);

    // Compute max duration for color scaling
    var maxDuration = 0;
    var keys = Object.keys(daily);
    for (var i = 0; i < keys.length; i++) {
      if (daily[keys[i]] > maxDuration) maxDuration = daily[keys[i]];
    }

    function getLevel(sec) {
      if (sec === 0) return 0;
      if (maxDuration === 0) return 0;
      var ratio = sec / maxDuration;
      if (ratio <= 0.25) return 1;
      if (ratio <= 0.5) return 2;
      if (ratio <= 0.75) return 3;
      return 4;
    }

    // Month label
    var lang = exports.I18n.getLanguage();
    var locale = lang === 'zh-HK' ? 'zh-Hant-HK' : lang === 'zh-TW' ? 'zh-Hant-TW' : lang === 'zh-CN' ? 'zh-Hans-CN' : lang === 'ja' ? 'ja-JP' : 'en-US';
    var monthDate = new Date(calendarYear, calendarMonth, 1);
    calendarMonthLabel.textContent = monthDate.toLocaleDateString(locale, { year: 'numeric', month: 'long' });

    // Day headers (Sun–Sat in locale order)
    var headerHtml = '';
    for (var d = 0; d < 7; d++) {
      // Start from Sunday
      var dayDate = new Date(2021, 0, 3 + d); // Jan 3, 2021 is a Sunday
      headerHtml += '<div class="calendar-day-header">' + dayDate.toLocaleDateString(locale, { weekday: 'narrow' }) + '</div>';
    }
    calendarDayHeaders.innerHTML = headerHtml;

    // Build grid
    var firstDay = new Date(calendarYear, calendarMonth, 1).getDay(); // 0=Sun
    var daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    var gridHtml = '';
    // Empty cells before the 1st
    for (var e = 0; e < firstDay; e++) {
      gridHtml += '<div class="calendar-day empty"></div>';
    }
    // Day cells
    for (var day = 1; day <= daysInMonth; day++) {
      var dateKey = calendarYear + '-' + pad(calendarMonth + 1) + '-' + pad(day);
      var duration = daily[dateKey] || 0;
      var level = getLevel(duration);
      gridHtml += '<div class="calendar-day l' + level + '" title="' + escapeHtml(formatDuration(duration)) + '">' + day + '</div>';
    }
    calendarGrid.innerHTML = gridHtml;

    // Reset any explicit size from a previous render so the parent
    // doesn't inflate before we measure available space.
    calendarGrid.style.width = '';
    calendarGrid.style.height = '';

    // Size the grid to be as large as possible while roughly square
    var calRect = recordsCalendar.getBoundingClientRect();
    var navH = document.querySelector('.calendar-nav').getBoundingClientRect().height;
    var headersH = calendarDayHeaders.getBoundingClientRect().height;
    var legendH = document.querySelector('.calendar-legend').getBoundingClientRect().height;
    var gaps = 24; // margins between sections
    var availW = calRect.width;
    var availH = calRect.height - navH - headersH - legendH - gaps;
    var idealW = Math.min(availW, availH * 7 / 6);
    var idealH = Math.min(availH, availW * 6 / 7);
    calendarGrid.style.width = Math.floor(idealW) + 'px';
    calendarGrid.style.height = Math.floor(idealH) + 'px';

    // Disable next button when viewing current month
    var now = new Date();
    var isCurrentMonth = calendarYear === now.getFullYear() && calendarMonth === now.getMonth();
    document.getElementById('btn-month-next').disabled = isCurrentMonth;
  }

  function changeMonth(delta) {
    calendarMonth += delta;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendarView();
  }

  function updateTimerDisplay() {
    var st = exports.State.getState();
    if (!st) return;

    // Phase label & color
    var phaseClass = exports.State.getPhaseClass();
    timerBg.className = 'timer-bg ' + phaseClass;
    routineLabel.textContent = currentRoutineName;
    phaseLabel.textContent = getPhaseLabelText(st);
    phaseLabel.classList.remove('flash');

    // Countdown digits
    var remaining = st.phaseSecondsRemaining;
    if (remaining > 59) {
      var min = Math.floor(remaining / 60);
      var sec = remaining % 60;
      countdownDigits.textContent = min + ':' + pad(sec);
    } else {
      countdownDigits.textContent = remaining;
    }

    // Hide the circle during the finished phase (keep layout space)
    countdownContainer.style.visibility = st.phase === 'finished' ? 'hidden' : '';

    // Progress ring
    if (st.phaseSecondsTotal > 0) {
      var progress = remaining / st.phaseSecondsTotal;
      var offset = CIRCUMFERENCE * (1 - progress);
      if (remaining === st.phaseSecondsTotal) {
        // Snap to full at phase start
        progressRing.style.transition = 'none';
        progressRing.style.strokeDashoffset = offset;
        progressRing.offsetHeight; // force reflow
        progressRing.style.transition = '';
      } else if (remaining === 0) {
        // Use a short transition so the ring visibly drains to zero
        progressRing.style.transition = 'stroke-dashoffset 0.35s linear, stroke 0.3s';
        progressRing.style.strokeDashoffset = offset;
      } else {
        progressRing.style.strokeDashoffset = offset;
      }
    } else {
      progressRing.style.strokeDashoffset = CIRCUMFERENCE;
    }
    progressRing.style.stroke = st.phase === 'paused'
      ? 'rgba(255,255,255,0.35)'
      : 'rgba(255,255,255,0.85)';

    // Set counter
    var t = exports.I18n.t;
    if (st.phase === 'prepare') {
      setCounter.textContent = t('setCounter', {current: '1', total: '' + st.totalSets});
    } else if (st.phase === 'finished') {
      setCounter.textContent = '';
    } else if (st.phase === 'paused') {
      setCounter.textContent = t('setCounterPaused', {current: '' + st.currentSet, total: '' + st.totalSets});
    } else {
      setCounter.textContent = t('setCounter', {current: '' + st.currentSet, total: '' + st.totalSets});
    }

    // Play/pause icon
    if (st.isPaused) {
      iconPause.classList.add('hidden');
      iconPlay.classList.remove('hidden');
      btnPlayPause.setAttribute('aria-label', t('resumeAria'));
    } else {
      iconPause.classList.remove('hidden');
      iconPlay.classList.add('hidden');
      btnPlayPause.setAttribute('aria-label', t('pauseAria'));
    }

    // Lock icon
    if (st.isLocked) {
      iconUnlocked.classList.add('hidden');
      iconLocked.classList.remove('hidden');
      btnLock.setAttribute('aria-label', t('unlockAria'));
      lockOverlay.classList.remove('hidden');
      timerControls.classList.add('locked');
    } else {
      iconUnlocked.classList.remove('hidden');
      iconLocked.classList.add('hidden');
      btnLock.setAttribute('aria-label', t('lockAria'));
      lockOverlay.classList.add('hidden');
      timerControls.classList.remove('locked');
    }
  }

  function flashPhaseLabel() {
    phaseLabel.classList.add('flash');
    setTimeout(function() { phaseLabel.classList.remove('flash'); }, 900);
  }

  function getPhaseLabelText(st) {
    var t = exports.I18n.t;
    if (st.phase === 'prepare') return t('phaseGetReady');
    if (st.phase === 'work') return t('phaseWork');
    if (st.phase === 'rest') return t('phaseRest');
    if (st.phase === 'paused') return t('phasePaused');
    if (st.phase === 'finished') return t('phaseDone');
    return '';
  }

  // ===== Exit =====
  var finishAutoExit = null;

  function exitTimer() {
    if (finishAutoExit) { clearTimeout(finishAutoExit); finishAutoExit = null; }
    exports.State.transition('exit');
    exports.Timer.stop();
    showConfigView();
  }

  // ===== Swipe Gestures =====
  var touchStartX = 0;
  var touchStartY = 0;

  function handleTouchStart(e) {
    if (e.target.closest('.timer-controls')) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (e.target.closest('.timer-controls')) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      var State = exports.State;
      if (dx > 0) {
        State.transition('skip-backward');
      } else {
        State.transition('skip-forward');
      }
      updateTimerDisplay();
      flashPhaseLabel();
    }
  }

  // ===== Event Binding =====
  function bindEvents() {
    // --- Stepper buttons (quickstart panel) ---
    document.querySelector('#config-view').addEventListener('click', function(e) {
      var btn = e.target.closest('.stepper-btn');
      if (!btn) return;
      var action = btn.dataset.action;
      var target = btn.dataset.target;
      if (action && target) {
        adjustConfig(target, action, false);
      }
    });

    // --- Stepper buttons (modal) ---
    routineModal.addEventListener('click', function(e) {
      var btn = e.target.closest('.stepper-btn');
      if (!btn) return;
      var action = btn.dataset.action;
      var target = btn.dataset.target;
      if (action && target) {
        adjustConfig(target, action, true);
      }
    });

    // --- Time display click for editing ---
    document.querySelector('#config-view').addEventListener('click', function(e) {
      var display = e.target.closest('.time-display');
      if (!display) return;
      var target = display.dataset.target;
      if (!target) return;
      var isModal = false;

      var minEl, secEl;
      switch (target) {
        case 'work':
          minEl = workMinDisplay; secEl = workSecDisplay; break;
        case 'rest':
          minEl = restMinDisplay; secEl = restSecDisplay; break;
        case 'prepare':
          minEl = prepareMinDisplay; secEl = prepareSecDisplay; break;
        default: return;
      }
      startTimeEdit(display, target, minEl, secEl, false);
    });

    routineModal.addEventListener('click', function(e) {
      var display = e.target.closest('.time-display');
      if (!display) return;
      var target = display.dataset.target;
      if (!target) return;
      var minEl, secEl;
      switch (target) {
        case 'modal-work':
          minEl = modalWorkMinDisplay; secEl = modalWorkSecDisplay; break;
        case 'modal-rest':
          minEl = modalRestMinDisplay; secEl = modalRestSecDisplay; break;
        case 'modal-prepare':
          minEl = modalPrepareMinDisplay; secEl = modalPrepareSecDisplay; break;
        default: return;
      }
      startTimeEdit(display, target.replace('modal-', ''), minEl, secEl, true);
    });

    // --- Start button ---
    document.getElementById('btn-start').addEventListener('click', function() {
      var totalWork = config.workMinutes * 60 + config.workSeconds;
      if (totalWork === 0) return;

      currentRoutineName = exports.I18n.t('quickstart');
      exports.State.init(getQuickstartConfig());
      exports.Audio.init();
      exports.State.transition('start');
      exports.Timer.start();
      showTimerView();
    });

    // --- Save Routine button ---
    document.getElementById('btn-save-routine').addEventListener('click', function() {
      openModal(null);
    });

    // --- Add routine button ---
    document.getElementById('btn-add-routine').addEventListener('click', function() {
      openModal(null);
    });

    // --- Routine card actions (delegation) ---
    routinesGrid.addEventListener('dragover', onDragOver);
    routinesGrid.addEventListener('drop', onDrop);

    routinesGrid.addEventListener('click', function(e) {
      var btn = e.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('routine-all-play')) {
        startPlaylist(exports.Storage.getRoutines(), false);
        return;
      }
      if (btn.classList.contains('routine-all-shuffle')) {
        startPlaylist(exports.Storage.getRoutines(), true);
        return;
      }

      var id = btn.dataset.id;
      if (!id) return;

      if (btn.classList.contains('routine-edit')) {
        var routines = exports.Storage.getRoutines();
        for (var i = 0; i < routines.length; i++) {
          if (routines[i].id === id) { openModal(routines[i]); break; }
        }
      } else if (btn.classList.contains('routine-clone')) {
        var allRoutines = exports.Storage.getRoutines();
        for (var k = 0; k < allRoutines.length; k++) {
          if (allRoutines[k].id === id) {
            var original = allRoutines[k];
            openModal({
              id: null,
              name: original.name + ' (Copy)',
              sets: original.sets,
              workMinutes: original.workMinutes,
              workSeconds: original.workSeconds,
              restMinutes: original.restMinutes,
              restSeconds: original.restSeconds,
              prepareMinutes: original.prepareMinutes || 0,
              prepareSeconds: original.prepareSeconds || 10
            });
            break;
          }
        }
      } else if (btn.classList.contains('routine-delete')) {
        var routines = exports.Storage.getRoutines();
        var name = '';
        for (var jj = 0; jj < routines.length; jj++) {
          if (routines[jj].id === id) { name = routines[jj].name; break; }
        }
        openConfirmModal(name, id);
      } else if (btn.classList.contains('routine-start')) {
        var routines = exports.Storage.getRoutines();
        for (var j = 0; j < routines.length; j++) {
          if (routines[j].id === id) {
            startRoutine(routines[j]);
            break;
          }
        }
      }
    });

    // --- Modal buttons ---
    btnModalCancel.addEventListener('click', closeModal);
    btnModalSave.addEventListener('click', saveModal);
    routineModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

    // --- Confirm modal ---
    btnConfirmCancel.addEventListener('click', closeConfirmModal);
    btnConfirmDelete.addEventListener('click', function() {
      if (pendingDeleteId) {
        exports.Storage.deleteRoutine(pendingDeleteId);
      }
      closeConfirmModal();
      renderRoutines();
    });
    confirmModal.querySelector('.modal-backdrop').addEventListener('click', closeConfirmModal);

    // --- Modal keyboard ---
    document.getElementById('modal-name').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); saveModal(); }
      if (e.key === 'Escape') { closeModal(); }
    });

    // --- Timer controls ---
    btnPlayPause.addEventListener('click', function() {
      var State = exports.State;
      var st = State.getState();
      if (st.isPaused) {
        State.transition('resume');
        exports.Timer.start();
      } else {
        State.transition('pause');
        exports.Timer.stop();
      }
      updateTimerDisplay();
    });

    btnSkipBack.addEventListener('click', function() {
      if (exports.State.getState().isLocked) return;
      exports.State.transition('skip-backward');
      updateTimerDisplay();
      flashPhaseLabel();
    });

    btnSkipFwd.addEventListener('click', function() {
      if (exports.State.getState().isLocked) return;
      var State = exports.State;
      var wasActive = State.getState().phase !== 'finished';
      State.transition('skip-forward');
      updateTimerDisplay();
      flashPhaseLabel();
      var st = State.getState();
      if (wasActive && st.phase === 'finished') {
        exports.Timer.stop();
        if (!playlist || playlist.index >= playlist.routines.length - 1) {
          setTimeout(function() { showConfigView(); }, 2000);
        }
      }
    });

    btnLock.addEventListener('click', function() {
      exports.State.transition('toggle-lock');
      updateTimerDisplay();
    });

    // --- Exit ---
    btnExit.addEventListener('click', exitTimer);

    // --- Swipe gestures on timer ---
    timerBg.addEventListener('touchstart', handleTouchStart, { passive: true });
    timerBg.addEventListener('touchend', handleTouchEnd, { passive: true });

    // --- Keyboard shortcuts ---
    document.addEventListener('keydown', function(e) {
      var st = exports.State.getState();
      if (!st || st.view !== 'timer') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          btnPlayPause.click();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!st.isLocked) btnSkipBack.click();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!st.isLocked) btnSkipFwd.click();
          break;
        case 'Escape':
          e.preventDefault();
          if (st.isPaused) {
            exports.State.transition('exit');
            exports.Timer.stop();
            showConfigView();
          }
          break;
        case 'l':
          if (!e.ctrlKey && !e.metaKey) {
            btnLock.click();
          }
          break;
      }
    });

    // --- Menu ---
    btnMenu.addEventListener('click', openMenu);
    btnMenuClose.addEventListener('click', closeMenu);
    menuBackdrop.addEventListener('click', closeMenu);

    // --- Language ---
    document.getElementById('btn-language').addEventListener('click', function() {
      closeMenu();
      openLanguageModal();
    });

    var langModal = document.getElementById('language-modal');
    langModal.querySelector('.modal-backdrop').addEventListener('click', closeLanguageModal);
    langModal.addEventListener('click', function(e) {
      var opt = e.target.closest('.language-option');
      if (!opt) return;
      var lang = opt.getAttribute('data-lang');
      exports.I18n.setLanguage(lang);
      closeLanguageModal();
    });

    // --- Track Records ---
    document.getElementById('btn-track-records').addEventListener('click', function() {
      closeMenu();
      showRecordsView();
    });

    btnRecordsBack.addEventListener('click', hideRecordsView);

    btnModeDetailed.addEventListener('click', function() {
      btnModeDetailed.classList.add('active');
      btnModeCalendar.classList.remove('active');
      recordsDetailed.classList.remove('hidden');
      recordsCalendar.classList.add('hidden');
      recordsOffset = 0;
      renderDetailedView();
    });

    btnModeCalendar.addEventListener('click', function() {
      btnModeDetailed.classList.remove('active');
      btnModeCalendar.classList.add('active');
      recordsDetailed.classList.add('hidden');
      recordsCalendar.classList.remove('hidden');
      var now = new Date();
      calendarYear = now.getFullYear();
      calendarMonth = now.getMonth();
      renderCalendarView();
    });

    btnLoadMore.addEventListener('click', loadMoreRecords);

    document.getElementById('btn-month-prev').addEventListener('click', function() { changeMonth(-1); });
    document.getElementById('btn-month-next').addEventListener('click', function() { changeMonth(1); });

    // --- Wake Lock ---
    exports.State.on('start', function() {
      requestWakeLock();
    });

    exports.State.on('exit', function() {
      releaseWakeLock();
    });
  }

  // ===== Start from routine =====
  function startRoutine(routine) {
    var cfg = {
      sets: routine.sets,
      workMinutes: routine.workMinutes,
      workSeconds: routine.workSeconds,
      restMinutes: routine.restMinutes,
      restSeconds: routine.restSeconds,
      prepareMinutes: routine.prepareMinutes || 0,
      prepareSeconds: routine.prepareSeconds || 10
    };

    var totalWork = cfg.workMinutes * 60 + cfg.workSeconds;
    if (totalWork === 0) return;

    currentRoutineName = routine.name;
    exports.Audio.setRoutineName(currentRoutineName);
    if (!playlist) exports.Audio.setSuppressFinished(false);
    exports.State.init(cfg);
    exports.Audio.init();
    exports.State.transition('start');
    exports.Timer.start();
    showTimerView();
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  function startPlaylist(routines, shouldShuffle) {
    var list = shouldShuffle ? shuffleArray(routines.slice()) : routines.slice();
    playlist = { routines: list, index: 0 };
    exports.Audio.setSuppressFinished(true);
    startRoutine(list[0]);
  }

  // ===== Wake Lock =====
  var wakeLock = null;

  function requestWakeLock() {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(function(sentinel) {
        wakeLock = sentinel;
        wakeLock.addEventListener('release', function() {
          wakeLock = null;
        });
      }).catch(function() {
        // Wake lock not available or denied
      });
    }
  }

  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release().catch(function() {});
      wakeLock = null;
    }
  }

  // ===== Fullscreen =====
  function setupFullscreen() {
    var isStandalone = window.matchMedia('(display-mode: standalone)').matches
                    || navigator.standalone;
    if (isIOS || isStandalone) {
      btnMenuFullscreen.style.display = 'none';
    } else {
      menuFullscreenLabel = btnMenuFullscreen.querySelector('span');

      btnMenuFullscreen.addEventListener('click', function() {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
        closeMenu();
      });

      document.addEventListener('fullscreenchange', function() {
        var active = !!document.fullscreenElement;
        var key = active ? 'fullscreenExit' : 'fullscreenEnter';
        menuFullscreenLabel.setAttribute('data-i18n', key);
        menuFullscreenLabel.textContent = exports.I18n.t(key);
      });
    }

    // Share button
    var shareUrl = 'https://steven-chau.github.io/ez-timer/';

    btnMenuShare.addEventListener('click', function() {
      if (navigator.share) {
        navigator.share({
          title: 'EZ Timer',
          text: exports.I18n.t('appTitle'),
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
      }
      closeMenu();
    });

    // Sponsor button (always works)
    btnSponsor.addEventListener('click', function() {
      var lang = exports.I18n.getLanguage();
      var url = 'https://steven-chau.github.io/ez-timer/SPONSOR.' + lang + '.html';
      window.open(url, '_blank', 'noopener');
      closeMenu();
    });
  }

  // ===== Menu =====
  function setupMenu() {
  }

  function openMenu() {
    menuDrawer.classList.remove('closed');
    menuBackdrop.classList.remove('closed');
  }

  function closeMenu() {
    menuDrawer.classList.add('closed');
    menuBackdrop.classList.add('closed');
  }

  // ===== Helpers =====
  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function clamp(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDuration(totalSec) {
    var t = exports.I18n.t;
    if (totalSec < 60) return t('durationSec', {s: '' + totalSec});
    if (totalSec < 3600) {
      var m = Math.floor(totalSec / 60);
      var s = totalSec % 60;
      return s > 0 ? t('durationMinSec', {m: '' + m, s: '' + s}) : t('durationMin', {m: '' + m});
    }
    var h = Math.floor(totalSec / 3600);
    var rem = totalSec % 3600;
    var m2 = Math.floor(rem / 60);
    return m2 > 0 ? t('durationHourMin', {h: '' + h, m: '' + m2}) : t('durationHour', {h: '' + h});
  }

  function formatDurationShort(totalSec) {
    var t = exports.I18n.t;
    if (totalSec < 60) return t('durationSec', {s: '' + totalSec});
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return s > 0 ? t('durationShort', {m: '' + m, s: pad(s)}) : t('durationShortMin', {m: '' + m});
  }

  // ===== State change listener =====
  function wire(stateModule) {
    // Language change refreshes the UI
    exports.I18n.onChange(function() {
      exports.I18n.updatePageLanguage();
      updateConfigDisplay();
      updateTimerDisplay();
      renderRoutines();
      if (!recordsView.classList.contains('hidden')) {
        recordsOffset = 0;
        if (!recordsCalendar.classList.contains('hidden')) {
          renderCalendarView();
        } else {
          renderDetailedView();
        }
      }
    });

    stateModule.on('phasechange', function() {
      updateTimerDisplay();
      flashPhaseLabel();
    });

    stateModule.on('tick', function() {
      updateTimerDisplay();
    });

    stateModule.on('lockchange', function() {
      updateTimerDisplay();
    });

    stateModule.on('exit', function() {
      playlist = null;
      showConfigView();
    });

    stateModule.on('finish', function() {
      exports.Timer.stop();

      // Record workout history for every completed routine
      var st = exports.State.getState();
      if (st) {
        var secs = st.seconds;
        var duration = secs.prepare
          + (st.totalSets * secs.work)
          + ((st.totalSets - 1) * secs.rest);
        exports.Records.add({
          name: currentRoutineName,
          duration: duration,
          sets: st.totalSets,
          workSeconds: secs.work,
          restSeconds: secs.rest,
          prepareSeconds: secs.prepare
        });
      }

      // If there are more routines in the playlist, chain to the next one
      if (playlist && playlist.index < playlist.routines.length - 1) {
        playlist.index++;
        var isLast = playlist.index >= playlist.routines.length - 1;
        exports.Audio.setSuppressFinished(!isLast);
        var next = playlist.routines[playlist.index];
        setTimeout(function() {
          startRoutine(next);
        }, 1500);
        return;
      }
      playlist = null;

      finishAutoExit = setTimeout(function() { exitTimer(); }, 12000);
      // Capture circle position before we hide it
      var circle = document.querySelector('.countdown-container');
      var bg = document.getElementById('timer-bg');
      var cr = circle.getBoundingClientRect();
      var br = bg.getBoundingClientRect();
      var cx = cr.left - br.left + cr.width / 2;
      var cy = cr.top - br.top + cr.height / 2;
      updateTimerDisplay();
      exports.Confetti.fire();
      var gif = document.getElementById('finish-gif');
      if (gif) {
        gif.style.left = cx + 'px';
        gif.style.top = cy + 'px';
        gif.classList.add('pop');
      }
    });
  }

  exports.UI = {
    init: init,
    updateTimerDisplay: updateTimerDisplay,
    showTimerView: showTimerView,
    showConfigView: showConfigView,
    getQuickstartConfig: getQuickstartConfig,
    wire: wire,
    renderRoutines: renderRoutines
  };

})(window.TimerApp);
