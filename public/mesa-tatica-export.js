(function initTacticalExport(global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var XLINK_NS = 'http://www.w3.org/1999/xlink';
  var MAX_CANVAS_SIDE = 4096;
  var MAX_CANVAS_PIXELS = 16000000;
  var DEFAULT_BACKGROUND = '#08745d';
  var DEFAULT_PNG_FILENAME = 'mesa-tatica.png';
  var DEFAULT_WEBM_FILENAME = 'jogada-mesa-tatica.webm';
  var EXPORT_STYLE = [
    'text, .tactical-label, [data-tactical-label], [data-player-label], [data-ball-label] {',
    '  font-family: "Baba Apple UI", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
    '  font-kerning: normal;',
    '  text-rendering: geometricPrecision;',
    '}',
    '.tactical-player-label, [data-player-label], [data-ball-label] {',
    '  text-anchor: middle;',
    '  dominant-baseline: central;',
    '}'
  ].join('\n');

  function assertBrowserSupport() {
    if (!global.document || typeof global.XMLSerializer !== 'function') {
      throw new Error('A exportação da Mesa Tática requer um navegador com suporte a SVG.');
    }
    if (typeof global.Blob !== 'function' || !global.URL || typeof global.URL.createObjectURL !== 'function') {
      throw new Error('Este navegador não oferece os recursos necessários para gerar o arquivo.');
    }
  }

  function assertSvg(svg) {
    if (!svg || String(svg.nodeName || '').toLowerCase() !== 'svg' || typeof svg.cloneNode !== 'function') {
      throw new TypeError('Informe uma quadra SVG válida para exportar.');
    }
  }

  function finitePositive(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function svgMetrics(svg) {
    var viewBox = svg.viewBox && svg.viewBox.baseVal;
    var viewWidth = finitePositive(viewBox && viewBox.width, 0);
    var viewHeight = finitePositive(viewBox && viewBox.height, 0);
    var rect = typeof svg.getBoundingClientRect === 'function' ? svg.getBoundingClientRect() : null;
    var renderedWidth = finitePositive(rect && rect.width, 0);
    var renderedHeight = finitePositive(rect && rect.height, 0);
    var widthAttribute = finitePositive(parseFloat(svg.getAttribute && svg.getAttribute('width')), 0);
    var heightAttribute = finitePositive(parseFloat(svg.getAttribute && svg.getAttribute('height')), 0);
    var width = viewWidth || renderedWidth || widthAttribute || 1200;
    var height = viewHeight || renderedHeight || heightAttribute || 700;

    return {
      minX: viewBox && Number.isFinite(viewBox.x) ? viewBox.x : 0,
      minY: viewBox && Number.isFinite(viewBox.y) ? viewBox.y : 0,
      width: Math.max(1, width),
      height: Math.max(1, height)
    };
  }

  function removeExportOnlyState(clone) {
    clone.querySelectorAll('[data-export-ignore], .tactical-selection-layer, .is-preview').forEach(function removeNode(node) {
      node.remove();
    });
    clone.querySelectorAll('[data-export-reset-transform]').forEach(function resetViewport(node) {
      node.removeAttribute('transform');
      node.removeAttribute('data-export-reset-transform');
      if (node.style) node.style.removeProperty('transform');
    });

    var nodes = [clone].concat(Array.prototype.slice.call(clone.querySelectorAll('*')));
    nodes.forEach(function cleanNode(node) {
      [
        'tabindex',
        'focusable',
        'aria-selected',
        'aria-pressed',
        'aria-current',
        'aria-grabbed',
        'aria-activedescendant',
        'data-selected',
        'data-focused'
      ].forEach(function removeAttribute(attribute) {
        node.removeAttribute(attribute);
      });
      if (node.classList) {
        node.classList.remove('is-selected', 'is-focused', 'has-focus');
      }
    });
  }

  function serializedSvg(svg) {
    assertBrowserSupport();
    assertSvg(svg);

    var metrics = svgMetrics(svg);
    var clone = svg.cloneNode(true);
    removeExportOnlyState(clone);

    clone.setAttribute('xmlns', SVG_NS);
    clone.setAttribute('xmlns:xlink', XLINK_NS);
    clone.setAttribute('width', String(metrics.width));
    clone.setAttribute('height', String(metrics.height));
    if (!clone.hasAttribute('viewBox')) {
      clone.setAttribute('viewBox', [
        metrics.minX,
        metrics.minY,
        metrics.width,
        metrics.height
      ].join(' '));
    }
    clone.setAttribute('preserveAspectRatio', clone.getAttribute('preserveAspectRatio') || 'xMidYMid meet');

    var style = clone.ownerDocument.createElementNS(SVG_NS, 'style');
    style.setAttribute('data-tactical-export-style', 'true');
    style.textContent = EXPORT_STYLE;
    clone.insertBefore(style, clone.firstChild);

    var source = new global.XMLSerializer().serializeToString(clone);
    if (!/^<svg[\s>]/i.test(source)) {
      source = source.replace(/^<[^>]+>/, '');
    }
    return {
      source: source,
      metrics: metrics
    };
  }

  function canvasDimensions(metrics, scale) {
    var safeScale = Math.max(0.1, finitePositive(scale, 1));
    var requestedWidth = Math.max(1, Math.round(metrics.width * safeScale));
    var requestedHeight = Math.max(1, Math.round(metrics.height * safeScale));
    var pixelScale = Math.min(
      1,
      MAX_CANVAS_SIDE / requestedWidth,
      MAX_CANVAS_SIDE / requestedHeight,
      Math.sqrt(MAX_CANVAS_PIXELS / (requestedWidth * requestedHeight))
    );

    return {
      width: Math.max(1, Math.floor(requestedWidth * pixelScale)),
      height: Math.max(1, Math.floor(requestedHeight * pixelScale)),
      requestedScale: safeScale,
      appliedScale: safeScale * pixelScale
    };
  }

  function createCanvas(metrics, scale, background) {
    var dimensions = canvasDimensions(metrics, scale);
    var canvas = global.document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    var context = canvas.getContext('2d', { alpha: !background });
    if (!context) {
      throw new Error('Não foi possível criar a área de exportação da quadra.');
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    return {
      canvas: canvas,
      context: context,
      dimensions: dimensions
    };
  }

  function paintBackground(context, canvas, background) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!background) return;
    context.save();
    context.fillStyle = String(background);
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function loadImage(url) {
    return new Promise(function imagePromise(resolve, reject) {
      var image = new global.Image();
      image.decoding = 'async';
      image.onload = function onImageLoad() {
        resolve({
          drawable: image,
          dispose: function disposeImage() {
            image.onload = null;
            image.onerror = null;
            image.src = '';
          }
        });
      };
      image.onerror = function onImageError() {
        reject(new Error('Não foi possível renderizar a quadra SVG.'));
      };
      image.src = url;
    });
  }

  async function loadDrawable(svgBlob, url) {
    if (typeof global.createImageBitmap === 'function') {
      try {
        var bitmap = await global.createImageBitmap(svgBlob);
        return {
          drawable: bitmap,
          dispose: function disposeBitmap() {
            if (typeof bitmap.close === 'function') bitmap.close();
          }
        };
      } catch (_) {
        // Alguns WebKit antigos não decodificam SVG em createImageBitmap.
      }
    }
    return loadImage(url);
  }

  async function drawSerializedSvg(serialized, target, background) {
    var svgBlob = new global.Blob([serialized.source], { type: 'image/svg+xml;charset=utf-8' });
    var svgUrl = global.URL.createObjectURL(svgBlob);
    var loaded = null;

    try {
      loaded = await loadDrawable(svgBlob, svgUrl);
      paintBackground(target.context, target.canvas, background);
      target.context.drawImage(loaded.drawable, 0, 0, target.canvas.width, target.canvas.height);
    } finally {
      if (loaded) loaded.dispose();
      global.URL.revokeObjectURL(svgUrl);
    }
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function canvasBlobPromise(resolve, reject) {
      if (typeof canvas.toBlob !== 'function') {
        reject(new Error('Este navegador não consegue gerar a imagem PNG.'));
        return;
      }
      canvas.toBlob(function onCanvasBlob(blob) {
        if (blob) resolve(blob);
        else reject(new Error('A imagem da quadra não pôde ser gerada.'));
      }, type, quality);
    });
  }

  function safeFilename(filename, fallback, extension) {
    var value = String(filename || fallback || 'arquivo')
      .trim()
      .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, '-')
      .replace(/\s+/g, ' ')
      .slice(0, 180);
    if (!value) value = fallback;
    if (extension && !value.toLowerCase().endsWith(extension)) value += extension;
    return value;
  }

  function downloadBlob(blob, filename) {
    assertBrowserSupport();
    if (!(blob instanceof global.Blob)) {
      throw new TypeError('O conteúdo informado para download é inválido.');
    }

    var url = global.URL.createObjectURL(blob);
    var link = global.document.createElement('a');
    link.href = url;
    link.download = safeFilename(filename, 'arquivo', '');
    link.rel = 'noopener';
    link.hidden = true;
    global.document.body.appendChild(link);

    try {
      link.click();
    } finally {
      link.remove();
      global.setTimeout(function revokeDownloadUrl() {
        global.URL.revokeObjectURL(url);
      }, 1200);
    }
    return link.download;
  }

  async function exportPNG(svg, filename, options) {
    var config = options || {};
    var background = config.background === undefined ? DEFAULT_BACKGROUND : config.background;
    var scale = config.scale === undefined ? 2 : config.scale;
    var serialized = serializedSvg(svg);
    var target = createCanvas(serialized.metrics, scale, background);

    await drawSerializedSvg(serialized, target, background);
    var blob = await canvasToBlob(target.canvas, 'image/png');
    var outputName = safeFilename(filename, DEFAULT_PNG_FILENAME, '.png');
    downloadBlob(blob, outputName);

    return {
      blob: blob,
      filename: outputName,
      width: target.canvas.width,
      height: target.canvas.height,
      scale: target.dimensions.appliedScale
    };
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function printSVG(svg, title) {
    var serialized = serializedSvg(svg);
    var printTitle = String(title || 'Mesa Tática');
    var popup = global.open('', '_blank', 'width=1200,height=820');
    if (!popup) {
      throw new Error('O navegador bloqueou a janela de impressão. Permita pop-ups e tente novamente.');
    }

    try {
      popup.opener = null;
    } catch (_) {
      // Alguns navegadores não permitem alterar opener após window.open.
    }

    popup.document.open();
    popup.document.write([
      '<!doctype html>',
      '<html lang="pt-BR"><head><meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width,initial-scale=1">',
      '<title>', escapeHtml(printTitle), '</title>',
      '<style>',
      '@page{size:landscape;margin:10mm}',
      '*{box-sizing:border-box}',
      'html,body{margin:0;min-height:100%;background:#fff;color:#102a43}',
      'body{display:grid;place-items:center;padding:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      'main{display:grid;width:100%;height:100%;place-items:center}',
      'svg{display:block;width:100%;height:auto;max-width:100%;max-height:calc(100vh - 20mm)}',
      '@media print{html,body,main{width:100%;height:100%;overflow:hidden}}',
      '</style></head><body><main aria-label="Estratégia da Mesa Tática">',
      serialized.source,
      '</main><script>',
      '(function(){var done=false;function run(){if(done)return;done=true;window.focus();window.print();}',
      'if(document.fonts&&document.fonts.ready){document.fonts.ready.then(run,run);}else{setTimeout(run,80);}',
      'window.onafterprint=function(){window.close();};})();',
      '<\/script></body></html>'
    ].join(''));
    popup.document.close();
    return popup;
  }

  function supportedWebmMimeType() {
    var Recorder = global.MediaRecorder;
    if (typeof Recorder !== 'function') return '';
    var candidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    if (typeof Recorder.isTypeSupported !== 'function') return 'video/webm';
    return candidates.find(function findSupported(type) {
      return Recorder.isTypeSupported(type);
    }) || '';
  }

  function supportsRecording() {
    if (!global.document || typeof global.MediaRecorder !== 'function') return false;
    var canvas = global.document.createElement('canvas');
    return typeof canvas.captureStream === 'function' && Boolean(supportedWebmMimeType());
  }

  function requestFrame(callback) {
    if (typeof global.requestAnimationFrame === 'function') {
      return global.requestAnimationFrame(callback);
    }
    return global.setTimeout(function timeoutFrame() {
      callback(global.performance && typeof global.performance.now === 'function'
        ? global.performance.now()
        : Date.now());
    }, 16);
  }

  function cancelFrame(frameId) {
    if (frameId == null) return;
    if (typeof global.cancelAnimationFrame === 'function') {
      global.cancelAnimationFrame(frameId);
    } else {
      global.clearTimeout(frameId);
    }
  }

  function nextFrame() {
    return new Promise(function nextFramePromise(resolve) {
      requestFrame(resolve);
    });
  }

  function recorderStopped(recorder, mimeType, chunks) {
    return new Promise(function recorderPromise(resolve, reject) {
      recorder.addEventListener('dataavailable', function onData(event) {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      });
      recorder.addEventListener('error', function onRecorderError(event) {
        reject(event.error || new Error('O navegador interrompeu a gravação da jogada.'));
      }, { once: true });
      recorder.addEventListener('stop', function onRecorderStop() {
        var blob = new global.Blob(chunks, { type: mimeType });
        if (!blob.size) {
          reject(new Error('A gravação terminou sem produzir um vídeo.'));
          return;
        }
        resolve(blob);
      }, { once: true });
    });
  }

  function runRecordingFrames(options) {
    var svg = options.svg;
    var target = options.target;
    var durationMs = options.durationMs;
    var fps = options.fps;
    var background = options.background;
    var seek = options.seek;
    var streamTrack = options.streamTrack;
    var frameInterval = 1000 / fps;
    var frameId = null;
    var stopped = false;
    var startedAt = null;
    var lastRenderedAt = -Infinity;

    var completion = new Promise(function frameLoopPromise(resolve, reject) {
      async function tick(timestamp) {
        if (stopped) return;
        if (startedAt == null) startedAt = timestamp;
        var elapsed = Math.max(0, timestamp - startedAt);
        var progress = Math.min(1, elapsed / durationMs);

        if (progress < 1 && timestamp - lastRenderedAt < frameInterval) {
          frameId = requestFrame(tick);
          return;
        }

        lastRenderedAt = timestamp;
        try {
          await Promise.resolve(seek(progress));
          var frameSvg = serializedSvg(svg);
          await drawSerializedSvg(frameSvg, target, background);
          if (streamTrack && typeof streamTrack.requestFrame === 'function') {
            streamTrack.requestFrame();
          }
          if (progress >= 1) {
            stopped = true;
            resolve();
            return;
          }
          frameId = requestFrame(tick);
        } catch (error) {
          stopped = true;
          reject(error);
        }
      }

      frameId = requestFrame(tick);
    });

    return {
      completion: completion,
      cancel: function cancelRecordingFrames() {
        stopped = true;
        cancelFrame(frameId);
      }
    };
  }

  async function recordSVG(options) {
    var config = options || {};
    assertBrowserSupport();
    assertSvg(config.svg);

    var durationMs = finitePositive(config.durationMs, 0);
    if (!durationMs) throw new TypeError('Informe uma duração válida para gravar a jogada.');
    if (typeof config.seek !== 'function') {
      throw new TypeError('A gravação precisa de uma função seek(progress) para reproduzir a jogada.');
    }

    var restore = typeof config.restore === 'function' ? config.restore : function noopRestore() {};
    var fps = Math.min(60, Math.max(1, Math.round(finitePositive(config.fps, 24))));
    var background = config.background === undefined ? DEFAULT_BACKGROUND : config.background;
    var outputName = safeFilename(config.filename, DEFAULT_WEBM_FILENAME, '.webm');
    var mimeType = supportedWebmMimeType();
    var target = null;
    var stream = null;
    var recorder = null;
    var frameLoop = null;
    var recordingResult = null;
    var failure = null;

    try {
      if (!supportsRecording() || !mimeType) {
        throw new Error('A gravação WebM não é compatível com este navegador. Use um navegador com canvas.captureStream e MediaRecorder.');
      }

      var initialSvg = serializedSvg(config.svg);
      target = createCanvas(initialSvg.metrics, 1, background);
      await Promise.resolve(config.seek(0));
      initialSvg = serializedSvg(config.svg);
      await drawSerializedSvg(initialSvg, target, background);

      stream = target.canvas.captureStream(fps);
      var tracks = stream.getVideoTracks ? stream.getVideoTracks() : [];
      var videoTrack = tracks[0] || null;
      var chunks = [];
      try {
        recorder = new global.MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: 6000000
        });
      } catch (_) {
        throw new Error('O navegador detectou WebM, mas não conseguiu iniciar a gravação da jogada.');
      }
      var stoppedPromise = recorderStopped(recorder, mimeType, chunks);
      try {
        recorder.start(250);
      } catch (_) {
        throw new Error('O navegador não conseguiu iniciar a captura WebM da jogada.');
      }

      frameLoop = runRecordingFrames({
        svg: config.svg,
        target: target,
        durationMs: durationMs,
        fps: fps,
        background: background,
        seek: config.seek,
        streamTrack: videoTrack
      });
      await Promise.race([
        frameLoop.completion,
        stoppedPromise.then(function recordingStoppedEarly() {
          throw new Error('A gravação WebM foi interrompida antes do fim da jogada.');
        })
      ]);
      await nextFrame();
      if (videoTrack && typeof videoTrack.requestFrame === 'function') videoTrack.requestFrame();
      if (typeof recorder.requestData === 'function' && recorder.state === 'recording') recorder.requestData();
      if (recorder.state !== 'inactive') recorder.stop();

      var blob = await stoppedPromise;
      downloadBlob(blob, outputName);
      recordingResult = {
        blob: blob,
        filename: outputName,
        mimeType: mimeType,
        width: target.canvas.width,
        height: target.canvas.height,
        fps: fps,
        durationMs: durationMs
      };
    } catch (error) {
      failure = error instanceof Error ? error : new Error('Não foi possível gravar a animação da jogada.');
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch (_) {
          // O cleanup dos tracks abaixo encerra qualquer captura restante.
        }
      }
    } finally {
      if (frameLoop) frameLoop.cancel();
      if (stream && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach(function stopTrack(track) {
          try {
            track.stop();
          } catch (_) {
            // Ignora tracks já encerrados pelo navegador.
          }
        });
      }
      try {
        await Promise.resolve(restore());
      } catch (restoreError) {
        if (!failure) {
          failure = restoreError instanceof Error
            ? restoreError
            : new Error('A gravação terminou, mas o estado anterior não pôde ser restaurado.');
        }
      }
    }

    if (failure) throw failure;
    return recordingResult;
  }

  global.TacticalExport = Object.freeze({
    supportsRecording: supportsRecording,
    exportPNG: exportPNG,
    printSVG: printSVG,
    recordSVG: recordSVG,
    downloadBlob: downloadBlob
  });
}(typeof window !== 'undefined' ? window : globalThis));
