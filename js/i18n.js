window.TimerApp = window.TimerApp || {};

(function(exports) {
  'use strict';

  var STORAGE_KEY = 'app-language';
  var currentLang = null;
  var changeListeners = [];

  var translations = {
    en: {
      appTitle: 'EZ Timer',
      quickstart: 'Quickstart',
      yourRoutines: 'Your Routines',
      sets: 'Sets',
      work: 'Work',
      rest: 'Rest',
      getReady: 'Get Ready',
      saveRoutine: 'Save Routine',
      start: 'Start',
      edit: 'Edit',
      clone: 'Clone',
      delete: 'Delete',
      confirmDelete: 'Delete "{name}"? This cannot be undone.',
      exit: 'Exit',
      cancel: 'Cancel',
      save: 'Save',
      newRoutine: 'New Routine',
      editRoutine: 'Edit Routine',
      name: 'Name',
      routineName: 'Routine name',
      menu: 'Menu',
      language: 'Language',
      githubRepo: 'GitHub Repo',
      contact: 'Contact',
      sponsor: 'Sponsor',
      share: 'Share',
      noRoutines: 'No routines yet. Use the quickstart panel above to create one.',
      menuAria: 'Menu',
      closeMenuAria: 'Close menu',
      addRoutineAria: 'Add new routine',
      decreaseSets: 'Decrease sets',
      increaseSets: 'Increase sets',
      decreaseWork: 'Decrease work time',
      increaseWork: 'Increase work time',
      decreaseRest: 'Decrease rest time',
      increaseRest: 'Increase rest time',
      decreasePrepare: 'Decrease prepare time',
      increasePrepare: 'Increase prepare time',
      skipBackAria: 'Skip backward',
      skipFwdAria: 'Skip forward',
      lockAria: 'Lock screen',
      unlockAria: 'Unlock screen',
      fullscreenEnter: 'Enter full screen',
      fullscreenExit: 'Exit full screen',
      pauseAria: 'Pause',
      resumeAria: 'Resume',
      phaseGetReady: 'Get Ready',
      phaseWork: 'Work',
      phaseRest: 'Rest',
      phasePaused: 'Paused',
      phaseDone: 'Done!',
      setCounter: 'Set {current} / {total}',
      setCounterComplete: 'Complete!',
      setCounterPaused: 'Set {current} / {total} (Paused)',
      audioPrepare: 'Get Ready',
      audioPrepareName: 'Get ready for {name}',
      audioWork: 'Work',
      audioRest: 'Rest',
      audioFinished: 'Workout complete',
      durationSec: '{s}s',
      durationMin: '{m}m',
      durationMinSec: '{m}m {s}s',
      durationHour: '{h}h',
      durationHourMin: '{h}h {m}m',
      durationShort: '{m}:{s}',
      durationShortMin: '{m}m',
      langEn: 'English',
      langZhHK: '廣東話',
      langZhTW: '台灣中文',
      langZhCN: '简体中文',
      langJa: '日本語',
      trackRecords: 'Track Records',
      modeDetailed: 'Detailed',
      modeCalendar: 'Calendar',
      heatmapLess: 'Less',
      heatmapMore: 'More',
      loadMore: 'Load More',
      noRecords: 'No workout records yet.',
      recordsBackAria: 'Back',
      selectLanguage: 'Language',
      all: 'All',
      shuffle: 'Shuffle',
      exportRoutines: 'Export Routines',
      importRoutines: 'Import Routines',
      noRoutinesToExport: 'No routines to export.',
      qrSingleInstruction: 'Scan this code from another device with EZ Timer open, then tap Import Routines.',
      qrMultiInstruction: 'Keep scanning — each QR contains a batch of routines.',
      importReceived: 'Received {cur} / {total} batches',
      importReady: '{count} routine(s) received. Import now?',
      importMerge: 'Import',
      importUploadPrefix: 'Or ',
      importUploadLink: 'upload a screenshot',
      importUploadSuffix: ' of the QR code.',
      importScanning: 'Scanning... ({n} frames)',
      importWipeFirst: 'Wipe out all existing routines first'
    },
    'zh-HK': {
      appTitle: '簡易計時器',
      quickstart: '快速開始',
      yourRoutines: '你的流程',
      sets: '組數',
      work: '運動',
      rest: '休息',
      getReady: '準備',
      saveRoutine: '儲存流程',
      start: '開始',
      edit: '編輯',
      clone: '複製',
      delete: '刪除',
      confirmDelete: '刪除「{name}」？呢個動作冇得還原。',
      exit: '離開',
      cancel: '取消',
      save: '儲存',
      newRoutine: '新增流程',
      editRoutine: '編輯流程',
      name: '名稱',
      routineName: '流程名稱',
      menu: '選單',
      language: '語言',
      githubRepo: 'GitHub 存放庫',
      contact: '聯絡',
      sponsor: '贊助支持',
      share: '分享',
      noRoutines: '未有流程。請用上面嘅快速開始面板建立一個。',
      menuAria: '選單',
      closeMenuAria: '關閉選單',
      addRoutineAria: '新增流程',
      decreaseSets: '減少組數',
      increaseSets: '增加組數',
      decreaseWork: '減少運動時間',
      increaseWork: '增加運動時間',
      decreaseRest: '減少休息時間',
      increaseRest: '增加休息時間',
      decreasePrepare: '減少準備時間',
      increasePrepare: '增加準備時間',
      skipBackAria: '跳返上一個',
      skipFwdAria: '跳去下一個',
      lockAria: '鎖定螢幕',
      unlockAria: '解鎖螢幕',
      fullscreenEnter: '進入全螢幕',
      fullscreenExit: '離開全螢幕',
      pauseAria: '暫停',
      resumeAria: '繼續',
      phaseGetReady: '準備',
      phaseWork: '運動',
      phaseRest: '休息',
      phasePaused: '已暫停',
      phaseDone: '任務完成，恭喜恭喜！',
      setCounter: '第 {current} / {total} 組',
      setCounterComplete: '搞掂晒！',
      setCounterPaused: '第 {current} / {total} 組 (已暫停)',
      audioPrepare: '準備',
      audioPrepareName: '準備做{name}',
      audioWork: '做運動',
      audioRest: '休息',
      audioFinished: '運動完成',
      durationSec: '{s}秒',
      durationMin: '{m}分鐘',
      durationMinSec: '{m}分{s}秒',
      durationHour: '{h}小時',
      durationHourMin: '{h}小時{m}分鐘',
      durationShort: '{m}:{s}',
      durationShortMin: '{m}分鐘',
      langEn: 'English',
      langZhHK: '廣東話',
      langZhTW: '台灣中文',
      langZhCN: '简体中文',
      langJa: '日本語',
      trackRecords: '運動記錄',
      modeDetailed: '詳細',
      modeCalendar: '日曆',
      heatmapLess: '少',
      heatmapMore: '多',
      loadMore: '載入更多',
      noRecords: '未有運動記錄。',
      recordsBackAria: '返回',
      selectLanguage: '語言',
      all: '全部',
      shuffle: '隨機',
      exportRoutines: '匯出流程',
      importRoutines: '匯入流程',
      noRoutinesToExport: '未有流程可匯出。',
      qrSingleInstruction: '喺另一部裝置開啟 EZ Timer，然後點擊「匯入流程」掃瞄呢個 QR Code。',
      qrMultiInstruction: '請繼續掃瞄 — 每個 QR Code 包含一部分流程。',
      importReceived: '已接收 {cur} / {total} 批',
      importReady: '已接收 {count} 個流程，要匯入嗎？',
      importMerge: '匯入',
      importUploadPrefix: '或者',
      importUploadLink: '上傳螢幕截圖',
      importUploadSuffix: '掃描 QR Code。',
      importScanning: '掃描中...（{n} 幀）',
      importWipeFirst: '先刪除所有現有流程'
    },
    'zh-TW': {
      appTitle: '簡易計時器',
      quickstart: '快速開始',
      yourRoutines: '你的流程',
      sets: '組數',
      work: '運動',
      rest: '休息',
      getReady: '準備',
      saveRoutine: '儲存流程',
      start: '開始',
      edit: '編輯',
      clone: '複製',
      delete: '刪除',
      confirmDelete: '刪除「{name}」？這個動作無法還原。',
      exit: '離開',
      cancel: '取消',
      save: '儲存',
      newRoutine: '新增流程',
      editRoutine: '編輯流程',
      name: '名稱',
      routineName: '流程名稱',
      menu: '選單',
      language: '語言',
      githubRepo: 'GitHub 存放庫',
      contact: '聯絡',
      sponsor: '小額贊助',
      share: '分享',
      noRoutines: '尚無流程。請使用上方的快速開始面板建立一個。',
      menuAria: '選單',
      closeMenuAria: '關閉選單',
      addRoutineAria: '新增流程',
      decreaseSets: '減少組數',
      increaseSets: '增加組數',
      decreaseWork: '減少運動時間',
      increaseWork: '增加運動時間',
      decreaseRest: '減少休息時間',
      increaseRest: '增加休息時間',
      decreasePrepare: '減少準備時間',
      increasePrepare: '增加準備時間',
      skipBackAria: '跳回上一個',
      skipFwdAria: '跳往下一個',
      lockAria: '鎖定螢幕',
      unlockAria: '解鎖螢幕',
      fullscreenEnter: '進入全螢幕',
      fullscreenExit: '離開全螢幕',
      pauseAria: '暫停',
      resumeAria: '繼續',
      phaseGetReady: '準備',
      phaseWork: '運動',
      phaseRest: '休息',
      phasePaused: '已暫停',
      phaseDone: '完成！',
      setCounter: '第 {current} / {total} 組',
      setCounterComplete: '全部完成！',
      setCounterPaused: '第 {current} / {total} 組 (已暫停)',
      audioPrepare: '準備',
      audioPrepareName: '準備做{name}',
      audioWork: '開始運動',
      audioRest: '休息一下',
      audioFinished: '運動完成',
      durationSec: '{s} 秒',
      durationMin: '{m} 分鐘',
      durationMinSec: '{m} 分 {s} 秒',
      durationHour: '{h} 小時',
      durationHourMin: '{h} 小時 {m} 分鐘',
      durationShort: '{m}:{s}',
      durationShortMin: '{m} 分鐘',
      langEn: 'English',
      langZhHK: '廣東話',
      langZhTW: '台灣中文',
      langZhCN: '简体中文',
      langJa: '日本語',
      trackRecords: '運動記錄',
      modeDetailed: '詳細',
      modeCalendar: '日曆',
      heatmapLess: '少',
      heatmapMore: '多',
      loadMore: '載入更多',
      noRecords: '未有運動記錄。',
      recordsBackAria: '返回',
      selectLanguage: '語言',
      all: '全部',
      shuffle: '隨機',
      exportRoutines: '匯出流程',
      importRoutines: '匯入流程',
      noRoutinesToExport: '尚無流程可匯出。',
      qrSingleInstruction: '在另一部裝置開啟 EZ Timer，然後點擊「匯入流程」掃描此 QR Code。',
      qrMultiInstruction: '請繼續掃描 — 每個 QR Code 包含一部分流程。',
      importReceived: '已接收 {cur} / {total} 批',
      importReady: '已接收 {count} 個流程，要匯入嗎？',
      importMerge: '匯入',
      importWipeFirst: '先刪除所有現有流程'
    },
    'zh-CN': {
      appTitle: '简易计时器',
      quickstart: '快速开始',
      yourRoutines: '你的流程',
      sets: '组数',
      work: '运动',
      rest: '休息',
      getReady: '准备',
      saveRoutine: '保存流程',
      start: '开始',
      edit: '编辑',
      clone: '复制',
      delete: '删除',
      confirmDelete: '删除"{name}"？此操作无法撤销。',
      exit: '退出',
      cancel: '取消',
      save: '保存',
      newRoutine: '新增流程',
      editRoutine: '编辑流程',
      name: '名称',
      routineName: '流程名称',
      menu: '菜单',
      language: '语言',
      githubRepo: 'GitHub 仓库',
      contact: '联系我们',
      sponsor: '打赏',
      share: '分享',
      noRoutines: '暂无流程。请使用上方的快速开始面板创建一个。',
      menuAria: '菜单',
      closeMenuAria: '关闭菜单',
      addRoutineAria: '新增流程',
      decreaseSets: '减少组数',
      increaseSets: '增加组数',
      decreaseWork: '减少运动时间',
      increaseWork: '增加运动时间',
      decreaseRest: '减少休息时间',
      increaseRest: '增加休息时间',
      decreasePrepare: '减少准备时间',
      increasePrepare: '增加准备时间',
      skipBackAria: '跳回上一个',
      skipFwdAria: '跳到下一个',
      lockAria: '锁定屏幕',
      unlockAria: '解锁屏幕',
      fullscreenEnter: '进入全屏',
      fullscreenExit: '退出全屏',
      pauseAria: '暂停',
      resumeAria: '继续',
      phaseGetReady: '准备',
      phaseWork: '运动',
      phaseRest: '休息',
      phasePaused: '已暂停',
      phaseDone: '完成！',
      setCounter: '第 {current} / {total} 组',
      setCounterComplete: '全部完成！',
      setCounterPaused: '第 {current} / {total} 组 (已暂停)',
      audioPrepare: '准备',
      audioPrepareName: '准备做{name}',
      audioWork: '开始运动',
      audioRest: '休息一下',
      audioFinished: '运动完成',
      durationSec: '{s} 秒',
      durationMin: '{m} 分钟',
      durationMinSec: '{m} 分 {s} 秒',
      durationHour: '{h} 小时',
      durationHourMin: '{h} 小时 {m} 分钟',
      durationShort: '{m}:{s}',
      durationShortMin: '{m} 分钟',
      langEn: 'English',
      langZhHK: '廣東話',
      langZhTW: '台灣中文',
      langZhCN: '简体中文',
      langJa: '日本語',
      trackRecords: '运动记录',
      modeDetailed: '详细',
      modeCalendar: '日历',
      heatmapLess: '少',
      heatmapMore: '多',
      loadMore: '加载更多',
      noRecords: '暂无运动记录。',
      recordsBackAria: '返回',
      selectLanguage: '语言',
      all: '全部',
      shuffle: '随机',
      exportRoutines: '导出流程',
      importRoutines: '导入流程',
      noRoutinesToExport: '暂无流程可导出。',
      qrSingleInstruction: '在另一部设备打开 EZ Timer，然后点击「导入流程」扫描此二维码。',
      qrMultiInstruction: '请继续扫描 — 每个二维码包含一部分流程。',
      importReceived: '已接收 {cur} / {total} 批',
      importReady: '已接收 {count} 个流程，要导入吗？',
      importMerge: '导入',
      importUploadPrefix: '或者',
      importUploadLink: '上传屏幕截图',
      importUploadSuffix: '扫描二维码。',
      importScanning: '扫描中...（{n} 帧）',
      importWipeFirst: '先删除所有现有流程'
    },
    ja: {
      appTitle: 'EZ タイマー',
      quickstart: 'クイックスタート',
      yourRoutines: 'ルーティン',
      sets: 'セット数',
      work: '運動',
      rest: '休憩',
      getReady: '準備',
      saveRoutine: 'ルーティンを保存',
      start: 'スタート',
      edit: '編集',
      clone: '複製',
      delete: '削除',
      confirmDelete: '「{name}」を削除しますか？この操作は元に戻せません。',
      exit: '終了',
      cancel: 'キャンセル',
      save: '保存',
      newRoutine: '新規ルーティン',
      editRoutine: 'ルーティンを編集',
      name: '名前',
      routineName: 'ルーティン名',
      menu: 'メニュー',
      language: '言語',
      githubRepo: 'GitHub リポジトリ',
      contact: 'お問い合わせ',
      sponsor: '投げ銭',
      share: '共有する',
      noRoutines: 'ルーティンがありません。上のクイックスタートパネルで作成してください。',
      menuAria: 'メニュー',
      closeMenuAria: 'メニューを閉じる',
      addRoutineAria: '新規ルーティンを追加',
      decreaseSets: 'セット数を減らす',
      increaseSets: 'セット数を増やす',
      decreaseWork: '運動時間を減らす',
      increaseWork: '運動時間を増やす',
      decreaseRest: '休憩時間を減らす',
      increaseRest: '休憩時間を増やす',
      decreasePrepare: '準備時間を減らす',
      increasePrepare: '準備時間を増やす',
      skipBackAria: '前に戻る',
      skipFwdAria: '次に進む',
      lockAria: '画面をロック',
      unlockAria: 'ロックを解除',
      fullscreenEnter: '全画面表示にする',
      fullscreenExit: '全画面表示を解除',
      pauseAria: '一時停止',
      resumeAria: '再開',
      phaseGetReady: '準備',
      phaseWork: '運動',
      phaseRest: '休憩',
      phasePaused: '一時停止中',
      phaseDone: '完了！',
      setCounter: 'セット {current} / {total}',
      setCounterComplete: '完了！',
      setCounterPaused: 'セット {current} / {total} (一時停止中)',
      audioPrepare: '準備',
      audioPrepareName: '{name}の準備',
      audioWork: '運動しましょう',
      audioRest: '休みましょう',
      audioFinished: 'ワークアウト完了',
      durationSec: '{s}秒',
      durationMin: '{m}分',
      durationMinSec: '{m}分{s}秒',
      durationHour: '{h}時間',
      durationHourMin: '{h}時間{m}分',
      durationShort: '{m}:{s}',
      durationShortMin: '{m}分',
      langEn: 'English',
      langZhHK: '廣東話',
      langZhTW: '台灣中文',
      langZhCN: '简体中文',
      langJa: '日本語',
      trackRecords: '記録',
      modeDetailed: '詳細',
      modeCalendar: 'カレンダー',
      heatmapLess: '少ない',
      heatmapMore: '多い',
      loadMore: 'もっと読み込む',
      noRecords: 'まだ記録がありません。',
      recordsBackAria: '戻る',
      selectLanguage: '言語',
      all: '全部',
      shuffle: 'シャッフル',
      exportRoutines: 'ルーティンをエクスポート',
      importRoutines: 'ルーティンをインポート',
      noRoutinesToExport: 'エクスポートするルーティンがありません。',
      qrSingleInstruction: '別の端末で EZ Timer を開き、「ルーティンをインポート」をタップしてこの QR コードをスキャンしてください。',
      qrMultiInstruction: 'スキャンを続けてください — 各 QR コードにはルーティンの一部が含まれています。',
      importReceived: '{cur} / {total} バッチ受信',
      importReady: '{count} 件のルーティンを受信しました。インポートしますか？',
      importMerge: 'インポート',
      importUploadPrefix: '',
      importUploadLink: 'スクリーンショットをアップロード',
      importUploadSuffix: 'してQRコードを読み取ってください。',
      importScanning: 'スキャン中...（{n} フレーム）',
      importWipeFirst: '既存のルーティンをすべて削除してからインポート'
    }
  };

  function detectLanguage() {
    var supported = Object.keys(translations);
    var nav = navigator;

    // Exact match on primary language
    if (nav.language && supported.indexOf(nav.language) !== -1) {
      return nav.language;
    }

    // Walk the full preference list
    var langs = nav.languages || [];
    for (var i = 0; i < langs.length; i++) {
      // Try exact match first
      if (supported.indexOf(langs[i]) !== -1) {
        return langs[i];
      }
      // Try prefix match (e.g. "zh" from "zh-SG")
      var prefix = langs[i].split('-')[0];
      for (var j = 0; j < supported.length; j++) {
        if (supported[j].indexOf(prefix + '-') === 0) {
          return supported[j];
        }
      }
    }

    return 'en';
  }

  function getLanguage() {
    if (currentLang) return currentLang;
    try {
      currentLang = localStorage.getItem(STORAGE_KEY) || detectLanguage();
    } catch (e) {
      currentLang = detectLanguage();
    }
    return currentLang;
  }

  function setLanguage(lang) {
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
    for (var i = 0; i < changeListeners.length; i++) {
      changeListeners[i](lang);
    }
  }

  function t(key, vars) {
    var lang = getLanguage();
    var dict = translations[lang] || translations['en'];
    var str = dict[key];
    if (str === undefined) {
      str = (translations['en'][key] !== undefined) ? translations['en'][key] : key;
    }
    if (vars) {
      for (var k in vars) {
        if (vars.hasOwnProperty(k)) {
          str = str.replace('{' + k + '}', vars[k]);
        }
      }
    }
    return str;
  }

  function onChange(fn) {
    changeListeners.push(fn);
  }

  function updatePageLanguage() {
    var lang = getLanguage();
    document.documentElement.lang = lang;
    document.title = t('appTitle');

    // Text content
    var textEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) {
      textEls[i].textContent = t(textEls[i].getAttribute('data-i18n'));
    }

    // Placeholder
    var placeholderEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < placeholderEls.length; j++) {
      placeholderEls[j].placeholder = t(placeholderEls[j].getAttribute('data-i18n-placeholder'));
    }

    // aria-label
    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    for (var k = 0; k < ariaEls.length; k++) {
      ariaEls[k].setAttribute('aria-label', t(ariaEls[k].getAttribute('data-i18n-aria')));
    }
  }

  exports.I18n = {
    getLanguage: getLanguage,
    setLanguage: setLanguage,
    t: t,
    onChange: onChange,
    updatePageLanguage: updatePageLanguage
  };

})(window.TimerApp);
