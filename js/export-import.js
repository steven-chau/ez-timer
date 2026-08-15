window.TimerApp = window.TimerApp || {};

(function(exports) {
  'use strict';

  // Kept small so each QR stays at version ≤15: 77 modules max renders as
  // 4px blocks, which cameras decode far more reliably than dense QRs.
  var MAX_CHUNK_BYTES = 400;

  // Base64 is pure ASCII, so the QR payload is immune to non-ASCII
  // character-encoding issues regardless of routine names.
  function base64Encode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function base64Decode(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function stripRoutine(r) {
    return {
      name: r.name,
      sets: r.sets,
      workMinutes: r.workMinutes,
      workSeconds: r.workSeconds,
      restMinutes: r.restMinutes,
      restSeconds: r.restSeconds,
      prepareMinutes: r.prepareMinutes || 0,
      prepareSeconds: r.prepareSeconds || 10
    };
  }

  function getRoutines() {
    var routines = exports.Storage.getRoutines();
    // Strip id and order — not needed for import
    return routines.map(stripRoutine);
  }

  // ===== Export =====

  function openExport() {
    if (typeof qrcode === 'undefined') {
      console.error('Export: qrcode-generator library not loaded from CDN');
      alert('QR code library failed to load. Please check your internet connection.');
      return;
    }

    var routines = getRoutines();
    if (routines.length === 0) {
      alert(exports.I18n.t('noRoutinesToExport'));
      return;
    }

    var json = JSON.stringify(routines);
    console.log('Export: ' + routines.length + ' routines, ' + json.length + ' chars');

    var chunks;
    if (base64Encode(json).length <= MAX_CHUNK_BYTES) {
      chunks = [{ i: 0, n: 1, d: routines }];
    } else {
      chunks = chunkRoutines(routines, MAX_CHUNK_BYTES);
      console.log('Export: split into ' + chunks.length + ' QR frames');
    }

    showExportModal(chunks);
  }

  function chunkRoutines(routines, maxBytes) {
    var chunks = [];
    var current = [];
    for (var i = 0; i < routines.length; i++) {
      var test = current.concat([routines[i]]);
      var testJson = JSON.stringify({ i: 0, n: 1, d: test });
      if (base64Encode(testJson).length <= maxBytes) {
        current.push(routines[i]);
      } else {
        if (current.length === 0) {
          // Single routine too large — put it in its own chunk anyway
          current.push(routines[i]);
        } else {
          i--; // retry this routine in the next chunk
        }
        chunks.push(current);
        current = [];
      }
    }
    if (current.length > 0) chunks.push(current);

    return chunks.map(function(chunk, idx) {
      return { i: idx, n: chunks.length, d: chunk };
    });
  }

  var exportTimer = null;

  function showExportModal(chunks) {
    var modal = document.getElementById('export-modal');
    var container = document.getElementById('qr-export-container');
    var progress = document.getElementById('qr-export-progress');
    var instruction = document.getElementById('qr-export-instruction');
    modal.classList.remove('hidden');

    var total = chunks.length;
    var currentIdx = 0;

    function renderQr() {
      var chunk = chunks[currentIdx];
      var payload = base64Encode(JSON.stringify(chunk));

      container.innerHTML = '';
      try {
        // Error correction M (15%) — L (7%) is too fragile for screen scans
        var qr = qrcode(0, 'M');
        qr.addData(payload);
        qr.make();
        var moduleCount = qr.getModuleCount();

        var QUIET = 4; // modules of white border required by ZXing
        var targetSize = Math.min(340, window.innerWidth * 0.85);
        var scale = Math.max(2, Math.floor(targetSize / (moduleCount + QUIET * 2)));
        var paddedSize = (moduleCount + QUIET * 2) * scale;
        console.log('QR version: ~' + Math.ceil((moduleCount - 17) / 4) + ', modules: ' + moduleCount + 'x' + moduleCount + ', ' + scale + 'px per module');

        var canvas = document.createElement('canvas');
        canvas.width = paddedSize;
        canvas.height = paddedSize;
        var ctx = canvas.getContext('2d');

        // White background (quiet zone)
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, paddedSize, paddedSize);

        // Draw QR modules
        for (var row = 0; row < moduleCount; row++) {
          for (var col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
              ctx.fillStyle = '#000';
              ctx.fillRect((col + QUIET) * scale, (row + QUIET) * scale, scale, scale);
            }
          }
        }

        container.appendChild(canvas);
      } catch (e) {
        console.error('QR error:', e);
        container.textContent = 'QR error: ' + e.message;
      }

      if (total > 1) {
        progress.textContent = (currentIdx + 1) + ' / ' + total;
        instruction.textContent = exports.I18n.t('qrMultiInstruction');
      } else {
        progress.textContent = '';
        instruction.textContent = exports.I18n.t('qrSingleInstruction');
      }
    }

    renderQr();

    if (total > 1) {
      exportTimer = setInterval(function() {
        currentIdx = (currentIdx + 1) % total;
        renderQr();
      }, 2000);
    }

    // Close handler
    var onClose = function() {
      if (exportTimer) { clearInterval(exportTimer); exportTimer = null; }
      modal.classList.add('hidden');
    };

    document.getElementById('btn-close-export').onclick = onClose;
    modal.querySelector('.modal-backdrop').onclick = onClose;
  }

  // ===== Import =====

  var html5QrCode = null;
  var importChunks = [];
  var importTotal = -1;
  var scanAttempts = 0;

  function openImport() {
    console.log('=== Import: opening scanner ===');

    if (typeof Html5Qrcode === 'undefined') {
      console.error('Import: Html5Qrcode is not defined — CDN script may have failed to load');
      alert('QR scanner not available. Please check your connection.');
      return;
    }
    console.log('Import: Html5Qrcode found, version:', Html5Qrcode.version || 'unknown');

    var modal = document.getElementById('import-modal');
    modal.classList.remove('hidden');

    importChunks = [];
    importTotal = -1;
    scanAttempts = 0;
    document.getElementById('import-progress').textContent = '';
    document.getElementById('import-actions').classList.add('hidden');
    document.getElementById('btn-import-merge').disabled = false;
    var wipeBox = document.getElementById('import-wipe-checkbox');
    if (wipeBox) wipeBox.checked = false;

    // Clean up any previous scanner instance
    if (html5QrCode) {
      console.log('Import: cleaning up previous scanner instance');
      html5QrCode.stop().then(function() {
        html5QrCode.clear();
      }).catch(function() {});
    }

    var readerEl = document.getElementById('qr-reader');
    readerEl.innerHTML = '';
    html5QrCode = new Html5Qrcode('qr-reader');
    console.log('Import: scanner instance created');

    html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 300, height: 300 }, aspectRatio: 1 },
      onScanSuccess,
      function(errMsg) {
        scanAttempts++;
        // Log first 5 attempts, then every 50th
        if (scanAttempts <= 5) {
          console.log('Import: scan attempt #' + scanAttempts + ' — ' + errMsg);
        } else if (scanAttempts % 50 === 0) {
          console.log('Import: scan attempt #' + scanAttempts + ' — still trying (last err: ' + errMsg + ')');
        }
        // Update a visible counter so the user knows it's working
        var prog = document.getElementById('import-progress');
        if (prog && prog.textContent === '' && scanAttempts % 10 === 0) {
          prog.textContent = exports.I18n.t('importScanning', { n: scanAttempts });
        }
      }
    ).then(function() {
      console.log('Import: camera started successfully');
    }).catch(function(err) {
      console.error('Import: camera start error —', err.message || err);
      readerEl.textContent = 'Camera error: ' + err.message;
    });
  }

  // Rich diagnostics for a JSON.parse failure on a scanned payload, to
  // pinpoint whether the QR decode corrupted the data or the wrong QR
  // code was scanned.
  function describeParseFailure(rawText, err) {
    console.warn('Import: JSON parse failed — probably not an EZ Timer QR code, or the payload is corrupted. Error: ' + err.message);
    console.warn('Import: decoded text length: ' + rawText.length + ' chars');

    // Exact positions of every control character that breaks JSON
    var bad = [];
    for (var i = 0; i < rawText.length; i++) {
      var c = rawText.charCodeAt(i);
      if (c < 32 || c === 127) bad.push(i);
    }
    if (bad.length > 0) {
      var desc = bad.slice(0, 10).map(function(i) {
        return 'pos ' + i + ' = char code ' + rawText.charCodeAt(i);
      }).join(', ');
      if (bad.length > 10) desc += ', ... (' + bad.length + ' total)';
      console.warn('Import: control characters in decoded text: ' + desc);
    }

    // Context around where the parser gave up
    var pos = -1;
    var m = err.message.match(/position (\d+)/);
    if (m) {
      pos = parseInt(m[1], 10);
    } else {
      m = err.message.match(/column (\d+)/);
      if (m) pos = parseInt(m[1], 10) - 1;
    }
    if (pos !== -1) {
      var start = Math.max(0, pos - 40);
      var end = Math.min(rawText.length, pos + 40);
      console.warn('Import: context around error position ' + pos + ': ...' +
        JSON.stringify(rawText.slice(start, end)) + '...');
    }

    var shown = rawText.length > 2000 ? rawText.slice(0, 2000) + ' …[truncated]' : rawText;
    console.warn('Import: full decoded text (escaped): ' + JSON.stringify(shown));

    try {
      var decoded = base64Decode(rawText.trim());
      var shown2 = decoded.length > 2000 ? decoded.slice(0, 2000) + ' …[truncated]' : decoded;
      console.warn('Import: base64-decoded text (escaped): ' + JSON.stringify(shown2));
    } catch (e2) {
      console.warn('Import: payload is not valid base64 either: ' + e2.message);
    }
  }

  function onScanSuccess(decodedText, decodedResult) {
    console.log('Import: QR scanned, ' + decodedText.length + ' bytes');
    if (decodedResult) {
      try {
        var fmt = decodedResult.result && decodedResult.result.format ? decodedResult.result.format.formatName : 'unknown';
        console.log('Import: decoder metadata — format: ' + fmt + ', decoder: ' + (decodedResult.decoderNamespace || 'unknown'));
      } catch (e) { /* metadata is best-effort */ }
    }

    var data;
    try {
      data = JSON.parse(base64Decode(decodedText.trim()));
      console.log('JSON parsed successfully. Type:', Array.isArray(data) ? 'array' : typeof data);
    } catch (e) {
      describeParseFailure(decodedText, e);
      return;
    }

    // Single-chunk payload: plain array of routines
    if (Array.isArray(data)) {
      console.log('Import: detected single-chunk payload, ' + data.length + ' routines');
      importChunks = [{ i: 0, n: 1, d: data }];
      importTotal = 1;
      finishImport();
      return;
    }

    // Multi-chunk payload
    if (data && typeof data.i === 'number' && Array.isArray(data.d)) {
      console.log('Import: detected multi-chunk payload, chunk ' + data.i + '/' + data.n + ', ' + data.d.length + ' routines');
      if (importTotal === -1) {
        importTotal = data.n;
        console.log('Import: expecting ' + importTotal + ' total chunks');
      }

      // Avoid duplicates
      var exists = importChunks.some(function(c) { return c.i === data.i; });
      if (exists) {
        console.log('Import: chunk ' + data.i + ' already received, skipping');
        return;
      }
      importChunks.push(data);

      var prog = document.getElementById('import-progress');
      prog.textContent = exports.I18n.t('importReceived')
        .replace('{cur}', importChunks.length)
        .replace('{total}', importTotal);
      console.log('Import: progress ' + importChunks.length + '/' + importTotal);

      if (importChunks.length >= importTotal) {
        console.log('Import: all chunks received, finishing');
        finishImport();
      }
      return;
    }

    console.warn('Import: unrecognized payload format. Keys:', Object.keys(data));
  }

  function finishImport() {
    console.log('=== Import: finishing ===');
    if (html5QrCode) {
      try {
        html5QrCode.stop().then(function() {
          html5QrCode.clear();
        }).catch(function() {});
      } catch (e) {
        // Scanner was never started (e.g., camera unavailable) — ignore
        console.log('Import: scanner was not running');
      }
      html5QrCode = null;
    }

    // Assemble routines in order
    var allRoutines = [];
    importChunks.sort(function(a, b) { return a.i - b.i; });
    for (var i = 0; i < importChunks.length; i++) {
      allRoutines = allRoutines.concat(importChunks[i].d);
    }

    console.log('Import: assembled ' + allRoutines.length + ' routines total');
    console.log('Import: routine names —', allRoutines.map(function(r) { return r.name; }));

    document.getElementById('qr-reader').innerHTML = '';
    document.getElementById('import-progress').textContent =
      exports.I18n.t('importReady').replace('{count}', allRoutines.length);
    document.getElementById('import-actions').classList.remove('hidden');

    var mergeBtn = document.getElementById('btn-import-merge');
    var cancelBtn = document.getElementById('btn-import-cancel');
    var merged = false;

    mergeBtn.onclick = function() {
      if (merged) return;
      merged = true;
      mergeBtn.disabled = true;
      var wipeBox = document.getElementById('import-wipe-checkbox');
      if (wipeBox && wipeBox.checked) {
        console.log('Import: wiping all existing routines before import');
        exports.Storage.deleteAllRoutines();
      }
      console.log('Import: user clicked Import — merging ' + allRoutines.length + ' routines');
      mergeRoutines(allRoutines);
      closeImport();
    };

    cancelBtn.onclick = function() {
      console.log('Import: user cancelled');
      closeImport();
    };
  }

  function mergeRoutines(newRoutines) {
    var existing = exports.Storage.getRoutines();
    console.log('Import: merging ' + newRoutines.length + ' new routines into ' + existing.length + ' existing');

    var names = {};
    for (var i = 0; i < existing.length; i++) {
      names[existing[i].name] = true;
    }

    for (var j = 0; j < newRoutines.length; j++) {
      var r = newRoutines[j];
      r.id = undefined;
      var base = r.name;
      var suffix = 2;
      while (names[r.name]) {
        r.name = base + ' (' + suffix + ')';
        suffix++;
      }
      names[r.name] = true;
      exports.Storage.saveRoutine(r);
      console.log('Import: saved routine "' + r.name + '"');
    }

    if (exports.UI && exports.UI.renderRoutines) {
      exports.UI.renderRoutines();
    }
    console.log('Import: merge complete, UI refreshed');
  }

  function closeImport() {
    console.log('Import: closing');
    if (html5QrCode) {
      try {
        html5QrCode.stop().then(function() {
          html5QrCode.clear();
        }).catch(function() {});
      } catch (e) {
        // Scanner already stopped by finishImport — ignore
        console.log('Import: scanner already stopped');
      }
      html5QrCode = null;
    }
    var modal = document.getElementById('import-modal');
    if (modal) modal.classList.add('hidden');
    importChunks = [];
    importTotal = -1;
  }

  // Wire up menu buttons
  function wireMenu() {
    var btnExport = document.getElementById('btn-export-routines');
    var btnImport = document.getElementById('btn-import-routines');
    if (btnExport) btnExport.addEventListener('click', openExport);
    if (btnImport) btnImport.addEventListener('click', openImport);

    // Close import modal on backdrop click
    var importModal = document.getElementById('import-modal');
    if (importModal) {
      importModal.querySelector('.modal-backdrop').addEventListener('click', closeImport);
    }

    // File upload import using jsQR (independent decoder)
    var fileLabel = document.getElementById('import-file-label');
    var fileInput = document.getElementById('import-file-input');
    if (fileLabel && fileInput) {
      fileLabel.addEventListener('click', function() { fileInput.click(); });
      fileInput.addEventListener('change', function() {
        if (!fileInput.files || !fileInput.files[0]) return;
        var file = fileInput.files[0];
        console.log('Import: scanning uploaded file via jsQR — ' + file.name);
        fileInput.value = '';

        if (typeof jsQR === 'undefined') {
          console.error('Import: jsQR library not loaded');
          alert('QR decoder library not available.');
          return;
        }

        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            console.log('Import: jsQR decoded, ' + code.data.length + ' bytes');
            onScanSuccess(code.data);
          } else {
            console.error('Import: jsQR could not find a QR code in this image');
            alert('No QR code found in this image. Please make sure the QR code is clearly visible.');
          }
        };
        img.onerror = function() {
          console.error('Import: failed to load image file');
          alert('Could not load the image file.');
        };
        img.src = URL.createObjectURL(file);
      });
    }
  }

  exports.ExportImport = {
    openExport: openExport,
    openImport: openImport,
    wireMenu: wireMenu
  };

})(window.TimerApp);
