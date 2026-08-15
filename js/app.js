window.TimerApp = window.TimerApp || {};

(function(exports) {
  'use strict';

  function init() {
    // Initialize state machine with default config
    exports.State.init(exports.UI.getQuickstartConfig());

    // Wire audio to state events
    exports.Audio.wire(exports.State);

    // Wire UI to state events
    exports.UI.wire(exports.State);

    // Initialize UI (renders routines, binds events, loads saved config)
    exports.UI.init();

    // Load version from sw.js (single source of truth)
    loadVersion();

    // About modal — click version in menu footer to open
    setupAboutModal();

    // Export/Import routines
    exports.ExportImport.wireMenu();

    // Initialize audio context on first user interaction
    document.addEventListener('click', function initAudio() {
      exports.Audio.init();
    }, { once: true });
  }

  var appVersion = '';

  function loadVersion() {
    // Cache-busting query: the menu footer should always show the latest
    // deployed version, not one served from HTTP cache.
    fetch('sw.js?t=' + Date.now())
      .then(function(res) { return res.text(); })
      .then(function(text) {
        var match = text.match(/var VERSION = '([^']+)'/);
        if (match) {
          appVersion = match[1];
          var el = document.getElementById('menu-footer-version');
          if (el) el.textContent = 'v' + appVersion;
        }
      });
  }

  function setupAboutModal() {
    var modal = document.getElementById('about-modal');
    if (!modal) return;

    // Open modal when version is clicked
    var footer = document.getElementById('menu-footer');
    if (footer) {
      footer.addEventListener('click', function() {
        var verEl = document.getElementById('about-version');
        if (verEl) verEl.textContent = 'v' + appVersion;
        modal.classList.remove('hidden');
      });
    }

    // Close on backdrop click
    modal.querySelector('.modal-backdrop').addEventListener('click', function() {
      modal.classList.add('hidden');
    });
  }

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { scope: '/ez-timer/' })
      .then(function(reg) {
        // Notify installed users when an update is available
        reg.addEventListener('updatefound', function() {
          var newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateAvailable();
            }
          });
        });
      });
  }

  function showUpdateAvailable() {
    // Don't show multiple banners
    if (document.getElementById('update-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#ffd54f;color:#333;text-align:center;padding:12px 16px;z-index:9999;cursor:pointer;font-size:14px;box-shadow:0 -2px 8px rgba(0,0,0,0.2);';
    banner.textContent = 'New version available — Tap to update';

    banner.addEventListener('click', function() {
      banner.textContent = 'Updating...';
      var reloaded = false;
      function doReload() {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      }
      navigator.serviceWorker.ready.then(function(readyReg) {
        if (readyReg.waiting) {
          // Reload as soon as the new worker takes control
          navigator.serviceWorker.addEventListener('controllerchange', doReload);
          readyReg.waiting.postMessage({ type: 'SKIP_WAITING' });
          // Fallback if the new worker never takes control
          setTimeout(doReload, 3000);
        } else {
          doReload();
        }
      });
    });

    document.body.appendChild(banner);
  }

  // Start the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window.TimerApp);
