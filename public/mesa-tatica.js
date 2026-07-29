(() => {
  'use strict';

  const Storage = window.TacticalStorage;
  const Exporter = window.TacticalExport;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const THEME_KEY = 'psyzon_baba_theme';
  const MAX_HISTORY = 70;
  const LONG_PRESS_MS = 560;
  const MOVE_TOLERANCE = 7;
  const DEFAULT_STAGE_DURATION = 1200;
  const TEAM_COLORS = Object.freeze({
    team1: '#0ea5e9',
    team2: '#f43f5e',
  });
  const TACTIC_META = Object.freeze({
    movement: { color: '#22c55e', label: 'Movimentação', arrow: true },
    pass: { color: '#38bdf8', label: 'Passe', arrow: true, dashed: true },
    shot: { color: '#f43f5e', label: 'Finalização', arrow: true },
    dribble: { color: '#a78bfa', label: 'Condução', arrow: true },
    defense: { color: '#f59e0b', label: 'Marcação', dashed: true },
    line: { color: '#f8fafc', label: 'Linha', tactic: 'neutral' },
    dashed: { color: '#f8fafc', label: 'Linha pontilhada', tactic: 'neutral', dashed: true },
    curve: { color: '#22c55e', label: 'Caminho curvado', tactic: 'movement', arrow: true },
    zone: { color: '#fbbf24', label: 'Zona', tactic: 'neutral' },
    text: { color: '#ffffff', label: 'Observação', tactic: 'neutral' },
  });
  const CATEGORY_LABELS = Object.freeze({
    ataque: 'Ataque',
    defesa: 'Defesa',
    'bola-parada': 'Bola parada',
    'contra-ataque': 'Contra-ataque',
    'saida-pressao': 'Saída de pressão',
    personalizada: 'Personalizada',
  });
  const POSITION_LABELS = Object.freeze({
    goleiro: 'Goleiro',
    fixo: 'Fixo',
    ala: 'Ala',
    pivo: 'Pivô',
    none: '',
  });
  const FORMATIONS = Object.freeze({
    '2-2': [
      { u: 0.07, v: 0.5, position: 'goleiro' },
      { u: 0.25, v: 0.25, position: 'fixo' },
      { u: 0.25, v: 0.75, position: 'ala' },
      { u: 0.43, v: 0.28, position: 'ala' },
      { u: 0.43, v: 0.72, position: 'pivo' },
    ],
    '3-1': [
      { u: 0.07, v: 0.5, position: 'goleiro' },
      { u: 0.23, v: 0.2, position: 'ala' },
      { u: 0.2, v: 0.5, position: 'fixo' },
      { u: 0.23, v: 0.8, position: 'ala' },
      { u: 0.44, v: 0.5, position: 'pivo' },
    ],
    '1-2-1': [
      { u: 0.07, v: 0.5, position: 'goleiro' },
      { u: 0.2, v: 0.5, position: 'fixo' },
      { u: 0.33, v: 0.24, position: 'ala' },
      { u: 0.33, v: 0.76, position: 'ala' },
      { u: 0.45, v: 0.5, position: 'pivo' },
    ],
    '4-0': [
      { u: 0.07, v: 0.5, position: 'goleiro' },
      { u: 0.2, v: 0.2, position: 'fixo' },
      { u: 0.28, v: 0.4, position: 'ala' },
      { u: 0.28, v: 0.6, position: 'ala' },
      { u: 0.2, v: 0.8, position: 'pivo' },
    ],
  });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const clone = (value) => (
    typeof structuredClone === 'function'
      ? structuredClone(value)
      : JSON.parse(JSON.stringify(value))
  );
  const uid = (prefix) => (
    `${prefix}_${window.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`
  );
  const iconMarkup = (name) => (
    `<svg aria-hidden="true"><use href="#tact-icon-${name}"></use></svg>`
  );
  const isTextInput = (target) => Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));

  const els = {
    body: document.body,
    saveState: $('#tactical-save-state'),
    themeToggle: $('#tactical-theme-toggle'),
    newPlay: $('#new-play-btn'),
    savePlay: $('#save-play-btn'),
    openLibrary: $('#open-library-btn'),
    openExport: $('#open-export-btn'),
    exportMenu: $('#export-menu'),
    fullscreen: $('#fullscreen-btn'),
    playName: $('#play-name'),
    playDescription: $('#play-description'),
    playCategory: $('#play-category'),
    toolsPanel: $('#tactical-tools-panel'),
    rightPanel: $('#tactical-right-panel'),
    panelBackdrop: $('#tactical-panel-backdrop'),
    courtFrame: $('#tactical-court-frame'),
    court: $('#tactical-court'),
    viewportLayer: $('#tactical-viewport-layer'),
    defs: $('#tactical-defs'),
    courtLayer: $('#tactical-court-layer'),
    zoneLayer: $('#tactical-zone-layer'),
    drawingLayer: $('#tactical-drawing-layer'),
    previewLayer: $('#tactical-preview-layer'),
    entityLayer: $('#tactical-entity-layer'),
    selectionLayer: $('#tactical-selection-layer'),
    emptyHint: $('#court-empty-hint'),
    orientation: $('#orientation-btn'),
    orientationLabel: $('#orientation-label'),
    zoomIn: $('#zoom-in-btn'),
    zoomOut: $('#zoom-out-btn'),
    zoomFit: $('#zoom-fit-btn'),
    mobileFullscreen: $('#mobile-fullscreen-btn'),
    zoomValue: $('#zoom-value'),
    undo: $('#undo-btn'),
    redo: $('#redo-btn'),
    clearBoard: $('#clear-board-btn'),
    addPlayerQuick: $('#add-player-quick-btn'),
    addBallQuick: $('#add-ball-quick-btn'),
    rosterAddPlayer: $('#roster-add-player-btn'),
    rosterAddBall: $('#roster-add-ball-btn'),
    mobileAddPlayer: $('#mobile-add-player'),
    mobileUndo: $('#mobile-undo'),
    rosterList: $('#roster-list'),
    teamOneCount: $('#team-one-count'),
    teamTwoCount: $('#team-two-count'),
    formationTeam: $('#formation-team'),
    stagesList: $('#stages-list'),
    addStage: $('#add-stage-btn'),
    deleteStage: $('#delete-stage-btn'),
    stageDuration: $('#stage-duration'),
    stageDurationLabel: $('#stage-duration-label'),
    stageDurationValue: $('#stage-duration-value'),
    recordPlay: $('#record-play-btn'),
    previousStage: $('#previous-stage-btn'),
    nextStage: $('#next-stage-btn'),
    playPause: $('#play-pause-btn'),
    mobilePlayPause: $('#mobile-play-pause'),
    restartPlayback: $('#restart-playback-btn'),
    progress: $('#animation-progress'),
    animationTime: $('#animation-time'),
    stageCaption: $('#stage-caption'),
    playbackSpeed: $('#playback-speed'),
    repeatPlayback: $('#repeat-playback'),
    librarySearch: $('#library-search'),
    libraryCategory: $('#library-category'),
    libraryList: $('#library-list'),
    inspector: $('#selection-inspector'),
    playerDialog: $('#player-dialog'),
    playerForm: $('#player-form'),
    playerDialogTitle: $('#player-dialog-title'),
    playerName: $('#player-name'),
    playerNumber: $('#player-number'),
    playerPosition: $('#player-position'),
    playerTeam: $('#player-team'),
    playerColor: $('#player-color'),
    playerColorValue: $('#player-color-value'),
    playerLocked: $('#player-locked'),
    playerDelete: $('#player-delete-btn'),
    playerDuplicate: $('#player-duplicate-btn'),
    textDialog: $('#text-dialog'),
    textForm: $('#text-form'),
    drawingText: $('#drawing-text'),
    contextMenu: $('#context-menu'),
    toast: $('#tactical-toast'),
    liveStatus: $('#tactical-live-status'),
    importFile: $('#import-json-file'),
    exportPng: $('#export-png-btn'),
    exportJson: $('#export-json-btn'),
    importJson: $('#import-json-btn'),
    printBoard: $('#print-board-btn'),
    recordVideo: $('#record-video-btn'),
    rotateHint: $('#rotate-hint'),
    dismissRotateHint: $('#dismiss-rotate-hint'),
  };

  const ui = {
    tool: 'select',
    selected: null,
    editingPlayerId: null,
    pendingPlayerPoint: null,
    pendingTextPoint: null,
    interaction: null,
    activePointers: new Map(),
    pinch: null,
    longPressTimer: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    history: [],
    future: [],
    dirty: false,
    renderFrame: null,
    recording: false,
    playing: false,
    playbackFrame: null,
    playbackElapsed: 0,
    playbackLastTime: 0,
    playbackSegment: 0,
    animationPositions: null,
    stageDurationBefore: null,
    toastTimer: null,
  };

  function blankStage(index = 0) {
    return {
      id: uid('stage'),
      name: `Etapa ${index + 1}`,
      duration: DEFAULT_STAGE_DURATION,
      positions: [],
      visibleDrawingIds: [],
      ballOwnerId: null,
    };
  }

  function newPlay() {
    const time = Date.now();
    return Storage.normalizePlay({
      schema: Storage.schema,
      version: Storage.version,
      id: uid('play'),
      name: 'Nova jogada',
      description: '',
      category: 'ataque',
      orientation: 'horizontal',
      createdAt: time,
      updatedAt: time,
      entities: [],
      drawings: [],
      stages: [blankStage(0)],
      activeStage: 0,
    });
  }

  let play;
  try {
    play = Storage.loadDraft() || newPlay();
  } catch (error) {
    console.error(error);
    play = newPlay();
    window.setTimeout(() => showToast(error.message || 'O rascunho local não pôde ser carregado.', 'error'), 0);
  }
  if (!play.stages.length) play.stages = [blankStage(0)];

  function dimensions() {
    if (play.orientation === 'vertical') {
      return {
        width: 600,
        height: 1000,
        court: { x: 75, y: 50, width: 450, height: 900 },
      };
    }
    return {
      width: 1000,
      height: 600,
      court: { x: 50, y: 75, width: 900, height: 450 },
    };
  }

  function canonicalToPoint(position) {
    const { court } = dimensions();
    const u = clamp(position?.u, 0, 1);
    const v = clamp(position?.v, 0, 1);
    if (play.orientation === 'vertical') {
      return {
        x: court.x + v * court.width,
        y: court.y + u * court.height,
      };
    }
    return {
      x: court.x + u * court.width,
      y: court.y + v * court.height,
    };
  }

  function pointToCanonical(point) {
    const { court } = dimensions();
    if (play.orientation === 'vertical') {
      return {
        u: clamp((point.y - court.y) / court.height, 0, 1),
        v: clamp((point.x - court.x) / court.width, 0, 1),
      };
    }
    return {
      u: clamp((point.x - court.x) / court.width, 0, 1),
      v: clamp((point.y - court.y) / court.height, 0, 1),
    };
  }

  function svgElement(name, attributes = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) node.setAttribute(key, String(value));
    });
    return node;
  }

  function appendLine(group, start, end, className = 'tactical-court-line', attributes = {}) {
    const a = canonicalToPoint(start);
    const b = canonicalToPoint(end);
    const line = svgElement('line', {
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      class: className,
      stroke: '#f8fafc',
      'stroke-width': 3,
      'vector-effect': 'non-scaling-stroke',
      ...attributes,
    });
    group.appendChild(line);
    return line;
  }

  function courtPath(points) {
    return points.map((point, index) => {
      const mapped = canonicalToPoint(point);
      return `${index ? 'L' : 'M'} ${mapped.x} ${mapped.y}`;
    }).join(' ');
  }

  function renderDefinitions() {
    const markers = [
      ['movement', TACTIC_META.movement.color],
      ['pass', TACTIC_META.pass.color],
      ['shot', TACTIC_META.shot.color],
      ['dribble', TACTIC_META.dribble.color],
      ['defense', TACTIC_META.defense.color],
      ['neutral', '#f8fafc'],
    ].map(([name, color]) => `
      <marker id="tactical-arrow-${name}" viewBox="0 0 10 10" refX="8.3" refY="5"
        markerWidth="7" markerHeight="7" orient="auto-start-reverse" markerUnits="strokeWidth">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="${color}"></path>
      </marker>
    `).join('');
    els.defs.innerHTML = `
      <linearGradient id="tactical-court-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b896c"></stop>
        <stop offset="52%" stop-color="#08745d"></stop>
        <stop offset="100%" stop-color="#075846"></stop>
      </linearGradient>
      <pattern id="tactical-floor-stripes" width="64" height="64" patternUnits="userSpaceOnUse">
        <rect width="32" height="64" fill="rgba(255,255,255,.026)"></rect>
      </pattern>
      <pattern id="tactical-goal-net" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 0H10M0 0V10" fill="none" stroke="rgba(248,250,252,.52)" stroke-width="1"></path>
      </pattern>
      <filter id="tactical-token-shadow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#001b14" flood-opacity=".42"></feDropShadow>
      </filter>
      ${markers}
    `;
  }

  function renderCourt() {
    const { width, height, court } = dimensions();
    els.court.setAttribute('viewBox', `0 0 ${width} ${height}`);
    els.court.dataset.orientation = play.orientation;
    els.courtFrame.classList.toggle('is-vertical', play.orientation === 'vertical');
    els.courtLayer.replaceChildren();

    const shadow = svgElement('rect', {
      x: court.x - 10,
      y: court.y - 10,
      width: court.width + 20,
      height: court.height + 20,
      rx: 18,
      fill: '#031f19',
      opacity: '.34',
    });
    const surface = svgElement('rect', {
      x: court.x,
      y: court.y,
      width: court.width,
      height: court.height,
      rx: 8,
      class: 'tactical-court-surface',
      fill: 'url(#tactical-court-gradient)',
      stroke: '#f8fafc',
      'stroke-width': 4,
      'vector-effect': 'non-scaling-stroke',
    });
    const stripes = svgElement('rect', {
      x: court.x,
      y: court.y,
      width: court.width,
      height: court.height,
      rx: 8,
      fill: 'url(#tactical-floor-stripes)',
      opacity: '.8',
      'pointer-events': 'none',
    });
    els.courtLayer.append(shadow, surface, stripes);

    appendLine(els.courtLayer, { u: .5, v: 0 }, { u: .5, v: 1 });
    const center = canonicalToPoint({ u: .5, v: .5 });
    const radius = play.orientation === 'vertical'
      ? court.width * .15
      : court.height * .15;
    els.courtLayer.append(
      svgElement('circle', {
        cx: center.x,
        cy: center.y,
        r: radius,
        fill: 'none',
        stroke: '#f8fafc',
        'stroke-width': 3,
        'vector-effect': 'non-scaling-stroke',
        class: 'tactical-court-line',
      }),
      svgElement('circle', {
        cx: center.x,
        cy: center.y,
        r: 4,
        fill: '#f8fafc',
        class: 'tactical-court-mark',
      }),
    );

    const areaPath = (side) => {
      const u = side === 'left' ? 0 : 1;
      const bulge = side === 'left' ? .15 : .85;
      const start = canonicalToPoint({ u, v: .2 });
      const controlOne = canonicalToPoint({ u: bulge, v: .2 });
      const controlTwo = canonicalToPoint({ u: bulge, v: .8 });
      const end = canonicalToPoint({ u, v: .8 });
      return `M ${start.x} ${start.y} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${end.x} ${end.y}`;
    };
    ['left', 'right'].forEach((side) => {
      els.courtLayer.appendChild(svgElement('path', {
        d: areaPath(side),
        fill: 'none',
        stroke: '#f8fafc',
        'stroke-width': 3,
        'vector-effect': 'non-scaling-stroke',
        class: 'tactical-court-line tactical-penalty-area',
      }));
    });

    [
      { u: .15, v: .5, type: 'penalty' },
      { u: .25, v: .5, type: 'second-penalty' },
      { u: .85, v: .5, type: 'penalty' },
      { u: .75, v: .5, type: 'second-penalty' },
    ].forEach((mark) => {
      const point = canonicalToPoint(mark);
      els.courtLayer.appendChild(svgElement('circle', {
        cx: point.x,
        cy: point.y,
        r: mark.type === 'penalty' ? 4.5 : 3.5,
        fill: '#f8fafc',
        class: `tactical-court-mark is-${mark.type}`,
      }));
    });

    const goalDepth = 24;
    const goalSpan = play.orientation === 'vertical' ? court.width * .18 : court.height * .18;
    if (play.orientation === 'vertical') {
      [court.y - goalDepth, court.y + court.height].forEach((y, index) => {
        els.courtLayer.appendChild(svgElement('rect', {
          x: court.x + (court.width - goalSpan) / 2,
          y,
          width: goalSpan,
          height: goalDepth,
          fill: 'url(#tactical-goal-net)',
          stroke: '#f8fafc',
          'stroke-width': 3,
          class: 'tactical-goal',
          'data-goal-side': index ? 'end' : 'start',
        }));
      });
    } else {
      [court.x - goalDepth, court.x + court.width].forEach((x, index) => {
        els.courtLayer.appendChild(svgElement('rect', {
          x,
          y: court.y + (court.height - goalSpan) / 2,
          width: goalDepth,
          height: goalSpan,
          fill: 'url(#tactical-goal-net)',
          stroke: '#f8fafc',
          'stroke-width': 3,
          class: 'tactical-goal',
          'data-goal-side': index ? 'end' : 'start',
        }));
      });
    }

    [
      [{ u: 0, v: .03 }, { u: .015, v: .03 }, { u: .015, v: 0 }],
      [{ u: 0, v: .97 }, { u: .015, v: .97 }, { u: .015, v: 1 }],
      [{ u: 1, v: .03 }, { u: .985, v: .03 }, { u: .985, v: 0 }],
      [{ u: 1, v: .97 }, { u: .985, v: .97 }, { u: .985, v: 1 }],
    ].forEach((points) => {
      els.courtLayer.appendChild(svgElement('path', {
        d: courtPath(points),
        fill: 'none',
        stroke: '#f8fafc',
        'stroke-width': 2,
        opacity: '.9',
        class: 'tactical-court-line tactical-corner-mark',
      }));
    });
    applyViewport();
  }

  function drawingPathData(drawing) {
    const points = (drawing.points || []).map(canonicalToPoint);
    if (!points.length) return '';
    if ((drawing.type === 'curve' || drawing.type === 'dribble') && points.length >= 3) {
      return `M ${points[0].x} ${points[0].y} Q ${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y}`;
    }
    return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  }

  function drawingArrowMarker(drawing, tactic, activeMarkerIds) {
    if (!drawing.arrowEnd) return null;
    const markerId = `tactical-arrow-drawing-${drawing.id.replace(/[^a-z0-9_-]/gi, '-')}`;
    activeMarkerIds.add(markerId);
    let marker = document.getElementById(markerId);
    if (!marker) {
      marker = svgElement('marker', {
        id: markerId,
        viewBox: '0 0 10 10',
        refX: 8.3,
        refY: 5,
        markerWidth: 7,
        markerHeight: 7,
        orient: 'auto-start-reverse',
        markerUnits: 'strokeWidth',
        'data-drawing-marker': 'true',
      });
      marker.appendChild(svgElement('path', { d: 'M 0 0 L 10 5 L 0 10 z' }));
      els.defs.appendChild(marker);
    }
    const color = drawing.color || TACTIC_META[tactic]?.color || '#f8fafc';
    marker.querySelector('path')?.setAttribute('fill', color);
    return `url(#${markerId})`;
  }

  function drawingVisible(drawing) {
    if (!ui.playing && !ui.animationPositions) return true;
    const drawingStage = Number(drawing.stageIndex || 0);
    const segment = Number(ui.playbackSegment || 0);
    return drawingStage === segment || drawingStage === Math.min(segment + 1, play.stages.length - 1);
  }

  function renderDrawings() {
    els.zoneLayer.replaceChildren();
    els.drawingLayer.replaceChildren();
    const activeMarkerIds = new Set();
    play.drawings.forEach((drawing) => {
      if (!drawingVisible(drawing)) return;
      const selected = ui.selected?.kind === 'drawing' && ui.selected.id === drawing.id;
      const group = svgElement('g', {
        class: `tactical-drawing ${selected ? 'is-selected' : ''} ${drawing.locked ? 'is-locked' : ''}`,
        'data-drawing-id': drawing.id,
        'data-kind': 'drawing',
        role: 'button',
        tabindex: '0',
        'aria-label': `${TACTIC_META[drawing.type]?.label || 'Desenho'}${drawing.locked ? ', bloqueado' : ''}`,
      });
      if (drawing.type === 'zone' && drawing.points.length >= 2) {
        const first = canonicalToPoint(drawing.points[0]);
        const second = canonicalToPoint(drawing.points[1]);
        const rect = svgElement('rect', {
          x: Math.min(first.x, second.x),
          y: Math.min(first.y, second.y),
          width: Math.abs(second.x - first.x),
          height: Math.abs(second.y - first.y),
          rx: 12,
          fill: drawing.fillColor || `${drawing.color}33`,
          stroke: drawing.color,
          'stroke-width': drawing.width || 2.5,
          'stroke-dasharray': '8 6',
          opacity: drawing.opacity ?? 1,
          class: 'tactical-zone-shape',
          'vector-effect': 'non-scaling-stroke',
        });
        const hit = svgElement('rect', {
          x: Math.min(first.x, second.x) - 6,
          y: Math.min(first.y, second.y) - 6,
          width: Math.abs(second.x - first.x) + 12,
          height: Math.abs(second.y - first.y) + 12,
          fill: 'transparent',
          stroke: 'transparent',
          'stroke-width': 16,
          class: 'tactical-drawing-hit',
        });
        group.append(rect, hit);
        els.zoneLayer.appendChild(group);
        return;
      }
      if (drawing.type === 'text' && drawing.points.length) {
        const point = canonicalToPoint(drawing.points[0]);
        const background = svgElement('rect', {
          x: point.x - 8,
          y: point.y - 27,
          width: Math.max(80, Math.min(300, (drawing.text || '').length * 8 + 20)),
          height: 34,
          rx: 10,
          fill: 'rgba(5,25,21,.72)',
          stroke: drawing.color,
          'stroke-width': 1.5,
          class: 'tactical-text-background',
        });
        const text = svgElement('text', {
          x: point.x + 4,
          y: point.y - 5,
          fill: drawing.color,
          'font-size': 17,
          'font-weight': 600,
          'font-family': 'Baba Apple UI, Inter, sans-serif',
          class: 'tactical-drawing-text',
        });
        text.textContent = drawing.text || 'Observação';
        group.append(background, text);
        els.drawingLayer.appendChild(group);
        return;
      }
      const tactic = drawing.tactic || TACTIC_META[drawing.type]?.tactic || drawing.type || 'neutral';
      const pathData = drawingPathData(drawing);
      const isDashed = drawing.dashed || ['pass', 'defense', 'dashed'].includes(drawing.type);
      const visiblePath = svgElement('path', {
        d: pathData,
        fill: 'none',
        stroke: drawing.color || TACTIC_META[tactic]?.color || '#f8fafc',
        'stroke-width': drawing.width || 3,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-dasharray': isDashed ? '10 8' : null,
        'marker-end': drawingArrowMarker(drawing, tactic, activeMarkerIds),
        opacity: drawing.opacity ?? 1,
        class: 'tactical-drawing-path',
        'vector-effect': 'non-scaling-stroke',
      });
      const hitPath = svgElement('path', {
        d: pathData,
        fill: 'none',
        stroke: 'transparent',
        'stroke-width': 22,
        'stroke-linecap': 'round',
        class: 'tactical-drawing-hit',
        'vector-effect': 'non-scaling-stroke',
      });
      group.append(visiblePath, hitPath);
      els.drawingLayer.appendChild(group);
    });
    els.defs.querySelectorAll('[data-drawing-marker]').forEach((marker) => {
      if (!activeMarkerIds.has(marker.id)) marker.remove();
    });
  }

  function entityTransform(entity, override = null) {
    const position = override || entity;
    const point = canonicalToPoint(position);
    return `translate(${point.x} ${point.y})`;
  }

  function renderEntities() {
    els.entityLayer.replaceChildren();
    play.entities.forEach((entity) => {
      const override = ui.animationPositions?.get(entity.id) || null;
      const selected = ui.selected?.kind === 'entity' && ui.selected.id === entity.id;
      const group = svgElement('g', {
        transform: entityTransform(entity, override),
        class: `tactical-entity ${entity.type === 'ball' ? 'tactical-ball-token' : 'tactical-player-token'} ${selected ? 'is-selected' : ''} ${entity.locked ? 'is-locked' : ''}`,
        'data-entity-id': entity.id,
        'data-kind': 'entity',
        'data-team': entity.team,
        role: 'button',
        tabindex: '0',
        'aria-label': entity.type === 'ball'
          ? 'Bola'
          : `${entity.name}, número ${entity.number || 'sem número'}, ${POSITION_LABELS[entity.position] || entity.position}${entity.locked ? ', bloqueado' : ''}`,
        filter: 'url(#tactical-token-shadow)',
      });
      if (entity.type === 'ball') {
        group.append(
          svgElement('circle', {
            r: 18,
            fill: '#f8fafc',
            stroke: '#0f172a',
            'stroke-width': 3,
          }),
          svgElement('path', {
            d: 'M0-8 7-3 4 6H-4L-7-3ZM0-8V-15M7-3l7-2M4 6l5 6M-4 6l-5 6M-7-3l-7-2',
            fill: '#0f172a',
            stroke: '#0f172a',
            'stroke-width': 1.8,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'vector-effect': 'non-scaling-stroke',
          }),
        );
      } else {
        const outerStroke = entity.team === 'team2' ? '#fecdd3' : '#bae6fd';
        group.append(
          svgElement('circle', {
            r: 29,
            fill: 'rgba(3,20,16,.36)',
            stroke: outerStroke,
            'stroke-width': 4,
            class: 'tactical-player-ring',
          }),
          svgElement('circle', {
            r: 24,
            fill: entity.color || TEAM_COLORS[entity.team] || '#64748b',
            stroke: 'rgba(255,255,255,.86)',
            'stroke-width': 2,
            class: 'tactical-player-disc',
          }),
        );
        const number = svgElement('text', {
          x: 0,
          y: 7,
          'text-anchor': 'middle',
          fill: '#ffffff',
          'font-size': 19,
          'font-weight': 700,
          'font-family': 'Baba Apple UI, Inter, sans-serif',
          'paint-order': 'stroke',
          stroke: 'rgba(0,0,0,.22)',
          'stroke-width': 1.5,
          class: 'tactical-player-number',
        });
        number.textContent = entity.number || '•';
        group.appendChild(number);

        const label = svgElement('text', {
          x: 0,
          y: 46,
          'text-anchor': 'middle',
          fill: '#ffffff',
          'font-size': 16,
          'font-weight': 650,
          'font-family': 'Baba Apple UI, Inter, sans-serif',
          'paint-order': 'stroke',
          stroke: 'rgba(2,12,10,.88)',
          'stroke-width': 4,
          'stroke-linejoin': 'round',
          class: 'tactical-entity-label',
        });
        label.textContent = entity.labelMode === 'number'
          ? `#${entity.number || '—'}`
          : entity.labelMode === 'name'
            ? entity.name
            : `${entity.name}${entity.position === 'goleiro' ? ' · GOL' : ''}`;
        group.appendChild(label);

        if (entity.locked) {
          group.appendChild(svgElement('path', {
            d: 'M18-24v-4a5 5 0 0 1 10 0v4m-12 0h14v12H16Z',
            fill: '#0f172a',
            stroke: '#f8fafc',
            'stroke-width': 1.5,
            class: 'tactical-lock-badge',
          }));
        }
      }
      els.entityLayer.appendChild(group);
    });
    els.emptyHint?.classList.toggle('hidden', play.entities.length > 0 || play.drawings.length > 0);
  }

  function renderSelection() {
    els.selectionLayer.replaceChildren();
    if (!ui.selected) return;
    if (ui.selected.kind === 'entity') {
      const entity = play.entities.find((item) => item.id === ui.selected.id);
      if (!entity) return;
      const point = canonicalToPoint(ui.animationPositions?.get(entity.id) || entity);
      els.selectionLayer.appendChild(svgElement('circle', {
        cx: point.x,
        cy: point.y,
        r: entity.type === 'ball' ? 27 : 38,
        fill: 'none',
        stroke: '#fef08a',
        'stroke-width': 3,
        'stroke-dasharray': '7 5',
        class: 'tactical-selection-ring',
        'vector-effect': 'non-scaling-stroke',
      }));
      return;
    }
    const drawing = play.drawings.find((item) => item.id === ui.selected.id);
    if (!drawing) return;
    drawing.points.forEach((position, index) => {
      const point = canonicalToPoint(position);
      els.selectionLayer.appendChild(svgElement('circle', {
        cx: point.x,
        cy: point.y,
        r: 10,
        fill: '#fef08a',
        stroke: '#0f172a',
        'stroke-width': 2,
        class: 'tactical-selection-handle',
        'data-handle-index': index,
        'data-drawing-id': drawing.id,
        'data-kind': 'handle',
        tabindex: '0',
      }));
    });
  }

  function renderPreview() {
    els.previewLayer.replaceChildren();
    const interaction = ui.interaction;
    if (!interaction || interaction.type !== 'draw') return;
    const preview = buildDrawing(interaction.tool, interaction.start, interaction.current, true);
    if (!preview) return;
    const group = svgElement('g', { class: 'is-preview tactical-drawing' });
    if (preview.type === 'zone') {
      const first = canonicalToPoint(preview.points[0]);
      const second = canonicalToPoint(preview.points[1]);
      group.appendChild(svgElement('rect', {
        x: Math.min(first.x, second.x),
        y: Math.min(first.y, second.y),
        width: Math.abs(second.x - first.x),
        height: Math.abs(second.y - first.y),
        rx: 12,
        fill: `${preview.color}33`,
        stroke: preview.color,
        'stroke-width': 3,
        'stroke-dasharray': '8 6',
      }));
    } else {
      const tactic = preview.tactic || preview.type;
      group.appendChild(svgElement('path', {
        d: drawingPathData(preview),
        fill: 'none',
        stroke: preview.color,
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'stroke-dasharray': preview.dashed ? '10 8' : null,
        'marker-end': preview.arrowEnd ? `url(#tactical-arrow-${TACTIC_META[tactic] ? tactic : 'neutral'})` : null,
      }));
    }
    els.previewLayer.appendChild(group);
  }

  function applyViewport() {
    const { width, height } = dimensions();
    const cx = width / 2;
    const cy = height / 2;
    els.viewportLayer.setAttribute(
      'transform',
      `translate(${cx + ui.panX} ${cy + ui.panY}) scale(${ui.zoom}) translate(${-cx} ${-cy})`,
    );
    els.zoomValue.textContent = `${Math.round(ui.zoom * 100)}%`;
  }

  function scheduleBoardRender() {
    if (ui.renderFrame) return;
    ui.renderFrame = requestAnimationFrame(() => {
      ui.renderFrame = null;
      renderDrawings();
      renderPreview();
      renderEntities();
      renderSelection();
    });
  }

  function renderBoard() {
    renderCourt();
    renderDrawings();
    renderPreview();
    renderEntities();
    renderSelection();
  }

  function snapshot() {
    return JSON.stringify({
      orientation: play.orientation,
      entities: play.entities,
      drawings: play.drawings,
      stages: play.stages,
      activeStage: play.activeStage,
    });
  }

  function restoreSnapshot(raw) {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    play.orientation = value.orientation || 'horizontal';
    play.entities = clone(value.entities || []);
    play.drawings = clone(value.drawings || []);
    play.stages = clone(value.stages || [blankStage(0)]);
    if (!play.stages.length) play.stages = [blankStage(0)];
    play.activeStage = clamp(value.activeStage, 0, play.stages.length - 1);
    ui.animationPositions = null;
    ui.selected = null;
  }

  function commitHistory(before, label = 'Alteração') {
    if (!before || before === snapshot()) return false;
    ui.history.push({ state: before, label });
    if (ui.history.length > MAX_HISTORY) ui.history.shift();
    ui.future = [];
    updateHistoryButtons();
    markDirty();
    return true;
  }

  function updateHistoryButtons() {
    const canUndo = ui.history.length > 0;
    const canRedo = ui.future.length > 0;
    els.undo.disabled = !canUndo;
    els.redo.disabled = !canRedo;
    els.mobileUndo.disabled = !canUndo;
  }

  function undo() {
    const previous = ui.history.pop();
    if (!previous) return;
    pausePlayback();
    ui.future.push({ state: snapshot(), label: previous.label });
    restoreSnapshot(previous.state);
    renderAll();
    markDirty();
    announce(`Desfeito: ${previous.label}.`);
  }

  function redo() {
    const next = ui.future.pop();
    if (!next) return;
    pausePlayback();
    ui.history.push({ state: snapshot(), label: next.label });
    restoreSnapshot(next.state);
    renderAll();
    markDirty();
    announce(`Refeito: ${next.label}.`);
  }

  function markDirty() {
    ui.dirty = true;
    play.updatedAt = Date.now();
    try {
      Storage.scheduleDraft(play);
      els.saveState?.classList.remove('is-saved');
      els.saveState?.classList.add('is-saving');
      if (els.saveState) els.saveState.querySelector('span').textContent = 'Salvando localmente...';
    } catch (error) {
      showToast(error.message || 'Não foi possível salvar o rascunho.', 'error');
    }
  }

  function showToast(message, type = 'info') {
    if (!els.toast) return;
    clearTimeout(ui.toastTimer);
    els.toast.textContent = String(message || '');
    els.toast.dataset.type = type;
    els.toast.classList.add('is-showing');
    ui.toastTimer = window.setTimeout(() => {
      els.toast.classList.remove('is-showing');
    }, 3200);
  }

  function announce(message) {
    if (!els.liveStatus) return;
    els.liveStatus.textContent = '';
    window.requestAnimationFrame(() => {
      els.liveStatus.textContent = message;
    });
  }

  function applyTheme(theme) {
    const dark = theme === 'dark';
    document.documentElement.classList.remove('tactical-dark-boot');
    document.body.classList.toggle('baba-dark-theme', dark);
    els.themeToggle.setAttribute('aria-pressed', String(dark));
    els.themeToggle.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
    els.themeToggle.title = dark ? 'Ativar tema claro' : 'Ativar tema escuro';
    const metaTheme = $('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = dark ? '#071721' : '#08745d';
  }

  function toggleTheme() {
    const next = document.body.classList.contains('baba-dark-theme') ? 'light' : 'dark';
    try {
      Storage.nativeStore().setItem(THEME_KEY, next);
    } catch (_) {}
    applyTheme(next);
  }

  function renderMetadata() {
    if (document.activeElement !== els.playName) els.playName.value = play.name || '';
    if (document.activeElement !== els.playDescription) els.playDescription.value = play.description || '';
    els.playCategory.value = play.category || 'ataque';
    els.orientationLabel.textContent = play.orientation === 'vertical' ? 'Vertical' : 'Horizontal';
  }

  function playerPositionText(player) {
    const position = POSITION_LABELS[player.position] || 'Jogador';
    return `${position} · #${player.number || '—'}`;
  }

  function makeRosterItem(entity) {
    const item = document.createElement('article');
    item.className = `tactical-roster-item ${ui.selected?.kind === 'entity' && ui.selected.id === entity.id ? 'is-selected' : ''}`;
    item.dataset.entityId = entity.id;

    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = entity.type === 'ball' ? 'tactical-roster-ball' : 'tactical-roster-marker';
    marker.dataset.rosterAction = 'select';
    marker.style.setProperty('--marker-color', entity.color || '#64748b');
    marker.setAttribute('aria-label', `Selecionar ${entity.name}`);
    marker.textContent = entity.type === 'ball' ? '●' : (entity.number || '•');

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'tactical-roster-copy';
    copy.dataset.rosterAction = 'edit';
    const strong = document.createElement('strong');
    strong.textContent = entity.name || (entity.type === 'ball' ? 'Bola' : 'Jogador');
    const small = document.createElement('small');
    small.textContent = entity.type === 'ball'
      ? (entity.attachedTo ? 'Acompanhando jogador' : 'Movimento livre')
      : playerPositionText(entity);
    copy.append(strong, small);

    const actions = document.createElement('div');
    actions.className = 'tactical-roster-actions';
    if (entity.type === 'player') {
      const lock = document.createElement('button');
      lock.type = 'button';
      lock.dataset.rosterAction = 'lock';
      lock.title = entity.locked ? 'Desbloquear posição' : 'Bloquear posição';
      lock.setAttribute('aria-label', lock.title);
      lock.innerHTML = entity.locked ? '🔒' : '🔓';
      actions.appendChild(lock);
    }
    const duplicate = document.createElement('button');
    duplicate.type = 'button';
    duplicate.dataset.rosterAction = 'duplicate';
    duplicate.title = 'Duplicar';
    duplicate.setAttribute('aria-label', `Duplicar ${entity.name}`);
    duplicate.textContent = '⧉';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.rosterAction = 'delete';
    remove.title = 'Excluir';
    remove.setAttribute('aria-label', `Excluir ${entity.name}`);
    remove.textContent = '×';
    actions.append(duplicate, remove);
    item.append(marker, copy, actions);
    return item;
  }

  function renderRoster() {
    els.rosterList.replaceChildren();
    const sorted = play.entities.slice().sort((left, right) => {
      if (left.type === 'ball') return 1;
      if (right.type === 'ball') return -1;
      if (left.team !== right.team) return left.team.localeCompare(right.team);
      return String(left.number).localeCompare(String(right.number), 'pt-BR', { numeric: true });
    });
    if (!sorted.length) {
      const empty = document.createElement('div');
      empty.className = 'tactical-empty-state tactical-empty-state--compact';
      empty.innerHTML = `${iconMarkup('player')}<strong>Nenhum marcador</strong><p>Adicione jogadores ou aplique uma formação rápida.</p>`;
      els.rosterList.appendChild(empty);
    } else {
      sorted.forEach((entity) => els.rosterList.appendChild(makeRosterItem(entity)));
    }
    els.teamOneCount.textContent = String(play.entities.filter((entity) => entity.type === 'player' && entity.team === 'team1').length);
    els.teamTwoCount.textContent = String(play.entities.filter((entity) => entity.type === 'player' && entity.team === 'team2').length);
  }

  function stagePositionMap(stage) {
    return new Map((stage?.positions || []).map((position) => [position.entityId, position]));
  }

  function captureStage(stage, { visibleDrawings = null } = {}) {
    stage.positions = play.entities.map((entity) => ({
      entityId: entity.id,
      u: entity.u,
      v: entity.v,
      path: [],
      mode: 'move',
      attachedTo: entity.attachedTo || null,
    }));
    const ball = play.entities.find((entity) => entity.type === 'ball');
    stage.ballOwnerId = ball?.attachedTo || null;
    if (visibleDrawings) stage.visibleDrawingIds = visibleDrawings.slice();
    return stage;
  }

  function syncActiveStage() {
    const stage = play.stages[play.activeStage];
    if (!stage) return;
    captureStage(stage, {
      visibleDrawings: play.drawings
        .filter((drawing) => Number(drawing.stageIndex || 0) === play.activeStage)
        .map((drawing) => drawing.id),
    });
  }

  function ensureEntityInStages(entity) {
    play.stages.forEach((stage) => {
      const existing = stage.positions.find((position) => position.entityId === entity.id);
      if (!existing) {
        stage.positions.push({
          entityId: entity.id,
          u: entity.u,
          v: entity.v,
          path: [],
          mode: 'move',
          attachedTo: entity.attachedTo || null,
        });
      }
    });
  }

  function applyStage(index, { render = true } = {}) {
    const safeIndex = clamp(index, 0, play.stages.length - 1);
    const stage = play.stages[safeIndex];
    const positions = stagePositionMap(stage);
    play.entities.forEach((entity) => {
      const position = positions.get(entity.id);
      if (!position) return;
      entity.u = position.u;
      entity.v = position.v;
      entity.attachedTo = position.attachedTo || null;
    });
    play.activeStage = safeIndex;
    ui.animationPositions = null;
    ui.playbackSegment = Math.min(safeIndex, Math.max(0, play.stages.length - 2));
    if (render) renderAll();
  }

  function renderStages() {
    els.stagesList.replaceChildren();
    play.stages.forEach((stage, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `tactical-stage-item ${index === play.activeStage ? 'is-active' : ''}`;
      item.dataset.stageIndex = String(index);
      item.setAttribute('aria-current', index === play.activeStage ? 'step' : 'false');
      const indexBadge = document.createElement('span');
      indexBadge.textContent = String(index + 1).padStart(2, '0');
      const copy = document.createElement('span');
      const strong = document.createElement('strong');
      strong.textContent = stage.name || `Etapa ${index + 1}`;
      const small = document.createElement('small');
      small.textContent = index === 0
        ? `Quadro inicial · ${stage.positions.length} elementos`
        : `${(Number(stage.duration || DEFAULT_STAGE_DURATION) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s · ${stage.positions.length} elementos`;
      copy.append(strong, small);
      item.append(indexBadge, copy);
      els.stagesList.appendChild(item);
    });
    const stage = play.stages[play.activeStage] || play.stages[0];
    const duration = Number(stage?.duration || DEFAULT_STAGE_DURATION);
    const initialStage = play.activeStage === 0;
    els.stageDuration.value = String(clamp(duration, Number(els.stageDuration.min), Number(els.stageDuration.max)));
    els.stageDuration.disabled = initialStage;
    els.stageDurationLabel.textContent = initialStage ? 'Quadro inicial' : 'Duração até esta etapa';
    els.stageDurationValue.textContent = initialStage
      ? 'Sem transição'
      : `${(duration / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`;
    els.deleteStage.disabled = play.stages.length <= 1;
    updatePlaybackUI();
  }

  function libraryMatches(item) {
    const query = (els.librarySearch.value || '').trim().toLocaleLowerCase('pt-BR');
    const category = els.libraryCategory.value || 'all';
    const matchesText = !query
      || item.name.toLocaleLowerCase('pt-BR').includes(query)
      || item.description.toLocaleLowerCase('pt-BR').includes(query);
    return matchesText && (category === 'all' || item.category === category);
  }

  function renderLibrary() {
    let items = [];
    try {
      items = Storage.list().filter(libraryMatches);
    } catch (error) {
      showToast(error.message || 'A biblioteca não pôde ser carregada.', 'error');
    }
    els.libraryList.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'tactical-empty-state tactical-empty-state--compact';
      empty.innerHTML = `${iconMarkup('folder')}<strong>Nenhuma jogada encontrada</strong><p>Salve a estratégia atual para encontrá-la aqui.</p>`;
      els.libraryList.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = `tactical-library-card ${item.id === play.id ? 'is-current' : ''}`;
      card.dataset.playId = item.id;
      const head = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = item.name;
      const category = document.createElement('span');
      category.textContent = CATEGORY_LABELS[item.category] || item.category;
      head.append(strong, category);
      const description = document.createElement('p');
      description.textContent = item.description || `${item.entities.length} elementos · ${item.stages.length} etapas`;
      const meta = document.createElement('small');
      meta.textContent = `Atualizada em ${new Date(item.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;
      const actions = document.createElement('div');
      actions.className = 'tactical-library-actions';
      [
        ['open', 'Abrir'],
        ['duplicate', 'Duplicar'],
        ['delete', 'Excluir'],
      ].forEach(([action, label]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.libraryAction = action;
        button.textContent = label;
        if (action === 'delete') button.className = 'is-danger';
        actions.appendChild(button);
      });
      card.append(head, description, meta, actions);
      els.libraryList.appendChild(card);
    });
  }

  function renderInspector() {
    els.inspector.replaceChildren();
    if (!ui.selected) {
      const empty = document.createElement('div');
      empty.className = 'tactical-empty-state';
      empty.innerHTML = `${iconMarkup('select')}<strong>Nada selecionado</strong><p>Selecione um jogador, a bola ou um desenho para editar suas propriedades.</p>`;
      els.inspector.appendChild(empty);
      return;
    }
    if (ui.selected.kind === 'entity') {
      const entity = play.entities.find((item) => item.id === ui.selected.id);
      if (!entity) {
        ui.selected = null;
        return renderInspector();
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'tactical-inspector-form';
      const title = document.createElement('div');
      title.className = 'tactical-inspector-title';
      const marker = document.createElement('i');
      marker.style.background = entity.color || '#f8fafc';
      const copy = document.createElement('span');
      const strong = document.createElement('strong');
      strong.textContent = entity.name;
      const small = document.createElement('small');
      small.textContent = entity.type === 'ball' ? 'Bola tática' : playerPositionText(entity);
      copy.append(strong, small);
      title.append(marker, copy);
      wrapper.appendChild(title);

      if (entity.type === 'ball') {
        const label = document.createElement('label');
        label.className = 'tactical-field';
        const caption = document.createElement('span');
        caption.textContent = 'Bola acompanha';
        const select = document.createElement('select');
        select.id = 'inspector-ball-owner';
        const free = document.createElement('option');
        free.value = '';
        free.textContent = 'Movimento livre';
        select.appendChild(free);
        play.entities.filter((item) => item.type === 'player').forEach((player) => {
          const option = document.createElement('option');
          option.value = player.id;
          option.textContent = `${player.name} · Time ${player.team === 'team2' ? '2' : '1'}`;
          option.selected = entity.attachedTo === player.id;
          select.appendChild(option);
        });
        label.append(caption, select);
        wrapper.appendChild(label);
      } else {
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'tactical-primary-btn';
        edit.dataset.inspectorAction = 'edit-entity';
        edit.innerHTML = `${iconMarkup('player')}<span>Editar jogador</span>`;
        wrapper.appendChild(edit);
      }
      const actions = document.createElement('div');
      actions.className = 'tactical-inspector-actions';
      [
        ['duplicate-entity', 'Duplicar'],
        ['toggle-lock-entity', entity.locked ? 'Desbloquear' : 'Bloquear'],
        ['delete-entity', 'Excluir'],
      ].forEach(([action, label]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.inspectorAction = action;
        button.textContent = label;
        if (action === 'delete-entity') button.className = 'is-danger';
        actions.appendChild(button);
      });
      wrapper.appendChild(actions);
      els.inspector.appendChild(wrapper);
      return;
    }

    const drawing = play.drawings.find((item) => item.id === ui.selected.id);
    if (!drawing) {
      ui.selected = null;
      return renderInspector();
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'tactical-inspector-form';
    const heading = document.createElement('div');
    heading.className = 'tactical-inspector-heading';
    const title = document.createElement('strong');
    title.textContent = TACTIC_META[drawing.type]?.label || 'Elemento tático';
    const subtitle = document.createElement('small');
    subtitle.textContent = `Etapa ${Number(drawing.stageIndex || 0) + 1}`;
    heading.append(title, subtitle);
    wrapper.appendChild(heading);

    const colorLabel = document.createElement('label');
    colorLabel.className = 'tactical-field';
    colorLabel.innerHTML = '<span>Cor</span>';
    const color = document.createElement('input');
    color.type = 'color';
    color.value = /^#[0-9a-f]{6}$/i.test(drawing.color) ? drawing.color : '#ffffff';
    color.dataset.drawingProperty = 'color';
    colorLabel.appendChild(color);
    wrapper.appendChild(colorLabel);

    if (drawing.type !== 'text') {
      const widthLabel = document.createElement('label');
      widthLabel.className = 'tactical-field';
      const widthCaption = document.createElement('span');
      widthCaption.textContent = 'Espessura';
      const width = document.createElement('input');
      width.type = 'range';
      width.min = '1';
      width.max = '10';
      width.step = '.5';
      width.value = String(drawing.width || 3);
      width.dataset.drawingProperty = 'width';
      widthLabel.append(widthCaption, width);
      wrapper.appendChild(widthLabel);
    }

    if (drawing.type === 'text') {
      const textLabel = document.createElement('label');
      textLabel.className = 'tactical-field';
      const textCaption = document.createElement('span');
      textCaption.textContent = 'Observação';
      const textarea = document.createElement('textarea');
      textarea.maxLength = 120;
      textarea.rows = 3;
      textarea.value = drawing.text || '';
      textarea.dataset.drawingProperty = 'text';
      textLabel.append(textCaption, textarea);
      wrapper.appendChild(textLabel);
    }

    const linkLabel = document.createElement('label');
    linkLabel.className = 'tactical-field';
    const linkCaption = document.createElement('span');
    linkCaption.textContent = 'Associar caminho a';
    const link = document.createElement('select');
    link.dataset.drawingProperty = 'linkedEntityId';
    const noLink = document.createElement('option');
    noLink.value = '';
    noLink.textContent = 'Nenhum elemento';
    link.appendChild(noLink);
    play.entities.forEach((entity) => {
      const option = document.createElement('option');
      option.value = entity.id;
      option.textContent = entity.name;
      option.selected = drawing.linkedEntityId === entity.id;
      link.appendChild(option);
    });
    linkLabel.append(linkCaption, link);
    wrapper.appendChild(linkLabel);

    const stageLabel = document.createElement('label');
    stageLabel.className = 'tactical-field';
    const stageCaption = document.createElement('span');
    stageCaption.textContent = 'Aparece na etapa';
    const stageSelect = document.createElement('select');
    stageSelect.dataset.drawingProperty = 'stageIndex';
    play.stages.forEach((stage, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `${index + 1}. ${stage.name}`;
      option.selected = Number(drawing.stageIndex || 0) === index;
      stageSelect.appendChild(option);
    });
    stageLabel.append(stageCaption, stageSelect);
    wrapper.appendChild(stageLabel);

    const actions = document.createElement('div');
    actions.className = 'tactical-inspector-actions';
    [
      ['duplicate-drawing', 'Duplicar'],
      ['toggle-lock-drawing', drawing.locked ? 'Desbloquear' : 'Bloquear'],
      ['delete-drawing', 'Excluir'],
    ].forEach(([action, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.inspectorAction = action;
      button.textContent = label;
      if (action === 'delete-drawing') button.className = 'is-danger';
      actions.appendChild(button);
    });
    wrapper.appendChild(actions);
    els.inspector.appendChild(wrapper);
  }

  function renderAll() {
    renderMetadata();
    renderBoard();
    renderRoster();
    renderStages();
    renderLibrary();
    renderInspector();
    updateHistoryButtons();
    updateToolButtons();
    updatePlaybackUI();
  }

  function setSelected(kind, id, { inspector = false } = {}) {
    ui.selected = id ? { kind, id } : null;
    renderEntities();
    renderDrawings();
    renderSelection();
    renderRoster();
    renderInspector();
    if (inspector && id) setSideTab('inspector');
    const item = kind === 'entity'
      ? play.entities.find((entity) => entity.id === id)
      : play.drawings.find((drawing) => drawing.id === id);
    if (item) announce(`${item.name || TACTIC_META[item.type]?.label || 'Elemento'} selecionado.`);
  }

  function updateToolButtons() {
    $$('[data-tool]').forEach((button) => {
      const active = button.dataset.tool === ui.tool;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    els.court.dataset.activeTool = ui.tool;
    document.body.dataset.activeTool = ui.tool;
  }

  function setTool(tool) {
    if (!['select', 'pan', 'player', 'ball', 'movement', 'pass', 'shot', 'dribble', 'defense', 'line', 'dashed', 'curve', 'zone', 'text', 'eraser'].includes(tool)) {
      tool = 'select';
    }
    ui.tool = tool;
    ui.interaction = null;
    renderPreview();
    updateToolButtons();
    announce(`Ferramenta ${tool === 'select' ? 'Selecionar' : TACTIC_META[tool]?.label || tool} ativa.`);
  }

  function openPlayerDialog(entity = null, point = null) {
    ui.editingPlayerId = entity?.id || null;
    ui.pendingPlayerPoint = point || { u: .35, v: .5 };
    els.playerDialogTitle.textContent = entity ? 'Editar jogador' : 'Adicionar jogador';
    const team = entity?.team || els.formationTeam.value || 'team1';
    const sameTeamCount = play.entities.filter((item) => item.type === 'player' && item.team === team).length;
    els.playerName.value = entity?.name || `Jogador ${sameTeamCount + 1}`;
    els.playerNumber.value = entity?.number || String(sameTeamCount + 1);
    els.playerPosition.value = entity?.position || (sameTeamCount === 0 ? 'goleiro' : 'ala');
    els.playerTeam.value = team;
    els.playerColor.value = entity?.color || TEAM_COLORS[team];
    els.playerColorValue.textContent = els.playerColor.value;
    els.playerLocked.checked = Boolean(entity?.locked);
    els.playerDelete.classList.toggle('hidden', !entity);
    els.playerDuplicate.classList.toggle('hidden', !entity);
    showDialog(els.playerDialog, els.playerName);
  }

  function showDialog(dialog, focusTarget = null) {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.body.classList.add('tactical-dialog-open');
    window.setTimeout(() => focusTarget?.focus(), 30);
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    if (!$$('dialog[open]').length) document.body.classList.remove('tactical-dialog-open');
  }

  function hasCapacity(collection, label) {
    const limit = Number(Storage.limits?.[collection]) || Number.POSITIVE_INFINITY;
    if ((play[collection]?.length || 0) < limit) return true;
    showToast(`Limite de ${limit} ${label} atingido nesta jogada.`, 'error');
    return false;
  }

  function addPlayer(values, point = null) {
    if (!hasCapacity('entities', 'elementos')) return null;
    const team = values.team === 'team2' ? 'team2' : 'team1';
    const position = point || ui.pendingPlayerPoint || { u: team === 'team2' ? .72 : .28, v: .5 };
    const entity = {
      id: uid('player'),
      type: 'player',
      name: String(values.name || 'Jogador').trim().slice(0, 40) || 'Jogador',
      number: String(values.number ?? '').slice(0, 2),
      position: values.position || 'ala',
      team,
      color: values.color || TEAM_COLORS[team],
      labelMode: 'both',
      u: clamp(position.u, .01, .99),
      v: clamp(position.v, .03, .97),
      locked: Boolean(values.locked),
      attachedTo: null,
    };
    play.entities.push(entity);
    ensureEntityInStages(entity);
    setSelected('entity', entity.id);
    return entity;
  }

  function addBall(point = null) {
    const existing = play.entities.find((entity) => entity.type === 'ball');
    if (existing) {
      setSelected('entity', existing.id, { inspector: true });
      showToast('A bola já está na quadra.');
      return existing;
    }
    if (!hasCapacity('entities', 'elementos')) return null;
    const before = snapshot();
    const position = point || { u: .5, v: .5 };
    const ball = {
      id: uid('ball'),
      type: 'ball',
      name: 'Bola',
      number: '',
      position: 'none',
      team: 'neutral',
      color: '#f8fafc',
      labelMode: 'name',
      u: clamp(position.u, .01, .99),
      v: clamp(position.v, .03, .97),
      locked: false,
      attachedTo: null,
    };
    play.entities.push(ball);
    ensureEntityInStages(ball);
    commitHistory(before, 'Adicionar bola');
    setSelected('entity', ball.id);
    renderAll();
    showToast('Bola adicionada à quadra.', 'success');
    return ball;
  }

  function updatePlayerFromForm(event) {
    event.preventDefault();
    const values = {
      name: els.playerName.value,
      number: els.playerNumber.value,
      position: els.playerPosition.value,
      team: els.playerTeam.value,
      color: els.playerColor.value,
      locked: els.playerLocked.checked,
    };
    const before = snapshot();
    if (ui.editingPlayerId) {
      const entity = play.entities.find((item) => item.id === ui.editingPlayerId);
      if (!entity) return closeDialog(els.playerDialog);
      Object.assign(entity, values, {
        name: String(values.name || 'Jogador').trim().slice(0, 40) || 'Jogador',
        number: String(values.number || '').slice(0, 2),
      });
      if (!ui.recording) syncActiveStage();
      commitHistory(before, 'Editar jogador');
      setSelected('entity', entity.id);
    } else {
      const entity = addPlayer(values, ui.pendingPlayerPoint);
      if (!entity) return;
      commitHistory(before, 'Adicionar jogador');
      setSelected('entity', entity.id);
    }
    closeDialog(els.playerDialog);
    renderAll();
    showToast('Jogador salvo.', 'success');
  }

  function duplicateEntity(id) {
    const source = play.entities.find((entity) => entity.id === id);
    if (!source) return;
    if (source.type === 'ball') return showToast('A quadra usa apenas uma bola.');
    if (!hasCapacity('entities', 'elementos')) return;
    const before = snapshot();
    const copy = clone(source);
    copy.id = uid(source.type === 'ball' ? 'ball' : 'player');
    copy.name = source.type === 'ball' ? 'Bola' : `${source.name} cópia`.slice(0, 40);
    copy.u = clamp(source.u + .035, .01, .99);
    copy.v = clamp(source.v + .05, .03, .97);
    copy.locked = false;
    play.entities.push(copy);
    ensureEntityInStages(copy);
    commitHistory(before, 'Duplicar jogador');
    setSelected('entity', copy.id);
    renderAll();
  }

  function removeEntity(id) {
    const entity = play.entities.find((item) => item.id === id);
    if (!entity) return;
    const before = snapshot();
    play.entities = play.entities.filter((item) => item.id !== id);
    play.entities.forEach((item) => {
      if (item.attachedTo === id) item.attachedTo = null;
    });
    play.drawings.forEach((drawing) => {
      if (drawing.linkedEntityId === id) drawing.linkedEntityId = null;
    });
    play.stages.forEach((stage) => {
      stage.positions = stage.positions.filter((position) => position.entityId !== id);
      stage.positions.forEach((position) => {
        if (position.attachedTo === id) position.attachedTo = null;
      });
      if (stage.ballOwnerId === id) stage.ballOwnerId = null;
    });
    if (ui.selected?.id === id) ui.selected = null;
    commitHistory(before, entity.type === 'ball' ? 'Remover bola' : 'Remover jogador');
    renderAll();
    showToast(`${entity.name} removido.`, 'success');
  }

  function toggleEntityLock(id) {
    const entity = play.entities.find((item) => item.id === id);
    if (!entity) return;
    const before = snapshot();
    entity.locked = !entity.locked;
    commitHistory(before, entity.locked ? 'Bloquear jogador' : 'Desbloquear jogador');
    renderAll();
  }

  function duplicateDrawing(id) {
    const source = play.drawings.find((drawing) => drawing.id === id);
    if (!source) return;
    if (!hasCapacity('drawings', 'desenhos')) return;
    const before = snapshot();
    const copy = clone(source);
    copy.id = uid('drawing');
    copy.points = copy.points.map((point) => ({
      u: clamp(point.u + .025, 0, 1),
      v: clamp(point.v + .04, 0, 1),
    }));
    copy.locked = false;
    play.drawings.push(copy);
    const stage = play.stages[copy.stageIndex];
    if (stage && !stage.visibleDrawingIds.includes(copy.id)) stage.visibleDrawingIds.push(copy.id);
    commitHistory(before, 'Duplicar desenho');
    setSelected('drawing', copy.id);
    renderAll();
  }

  function removeDrawing(id) {
    const drawing = play.drawings.find((item) => item.id === id);
    if (!drawing) return;
    const before = snapshot();
    play.drawings = play.drawings.filter((item) => item.id !== id);
    play.stages.forEach((stage) => {
      stage.visibleDrawingIds = stage.visibleDrawingIds.filter((drawingId) => drawingId !== id);
    });
    if (ui.selected?.id === id) ui.selected = null;
    commitHistory(before, 'Excluir desenho');
    renderAll();
  }

  function deleteSelection() {
    if (!ui.selected) return;
    if (ui.selected.kind === 'entity') removeEntity(ui.selected.id);
    else removeDrawing(ui.selected.id);
  }

  function applyFormation(name, team) {
    if (name === 'custom') {
      setTool('select');
      showToast('Formação personalizada ativa: mova os jogadores livremente.');
      return;
    }
    const template = FORMATIONS[name];
    if (!template) return;
    let players = play.entities.filter((entity) => entity.type === 'player' && entity.team === team);
    const missingPlayers = Math.max(0, 5 - players.length);
    if (play.entities.length + missingPlayers > Number(Storage.limits?.entities || Number.POSITIVE_INFINITY)) {
      showToast(`A formação precisa de ${missingPlayers} vaga(s), mas o limite de elementos foi atingido.`, 'error');
      return;
    }
    const before = snapshot();
    while (players.length < 5) {
      const index = players.length;
      const created = addPlayer({
        name: `${team === 'team2' ? 'Time 2' : 'Time 1'} · ${index + 1}`,
        number: index + 1,
        position: template[index].position,
        team,
        color: TEAM_COLORS[team],
        locked: false,
      }, template[index]);
      players.push(created);
    }
    players.slice(0, 5).forEach((player, index) => {
      const position = template[index];
      player.u = team === 'team2' ? 1 - position.u : position.u;
      player.v = position.v;
      player.position = position.position;
    });
    play.stages.forEach((stage) => {
      const stageMap = stagePositionMap(stage);
      players.slice(0, 5).forEach((player) => {
        const position = stageMap.get(player.id);
        if (position) {
          position.u = player.u;
          position.v = player.v;
        }
      });
    });
    syncActiveStage();
    commitHistory(before, `Aplicar formação ${name}`);
    renderAll();
    showToast(`Formação ${name} aplicada ao ${team === 'team2' ? 'Time 2' : 'Time 1'}.`, 'success');
  }

  function screenToWorld(clientX, clientY) {
    const point = els.court.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = els.viewportLayer.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const mapped = point.matrixTransform(matrix.inverse());
    return { x: mapped.x, y: mapped.y };
  }

  function screenToCanonical(clientX, clientY) {
    return pointToCanonical(screenToWorld(clientX, clientY));
  }

  function canonicalDistance(a, b) {
    const x = (a.u - b.u) * 2;
    const y = a.v - b.v;
    return Math.hypot(x, y);
  }

  function nearestEntity(point, { ballOnly = false, playerOnly = false } = {}) {
    const candidates = play.entities.filter((entity) => {
      if (ballOnly) return entity.type === 'ball';
      if (playerOnly) return entity.type === 'player';
      return true;
    });
    return candidates
      .map((entity) => ({ entity, distance: canonicalDistance(point, entity) }))
      .sort((left, right) => left.distance - right.distance)
      .find((item) => item.distance <= .24)?.entity || null;
  }

  function buildDrawing(tool, start, end, preview = false) {
    const meta = TACTIC_META[tool];
    if (!meta || !start || !end) return null;
    const tactic = ['movement', 'pass', 'shot', 'dribble', 'defense'].includes(tool)
      ? tool
      : (meta.tactic || 'neutral');
    let points = [clone(start), clone(end)];
    if (tool === 'curve' || tool === 'dribble') {
      const dx = end.u - start.u;
      const dy = end.v - start.v;
      const bend = Math.min(.16, Math.max(.055, canonicalDistance(start, end) * .18));
      points = [
        clone(start),
        {
          u: clamp((start.u + end.u) / 2 - dy * bend, 0, 1),
          v: clamp((start.v + end.v) / 2 + dx * bend, 0, 1),
        },
        clone(end),
      ];
    }
    let linkedEntityId = null;
    if (!preview) {
      if (tool === 'pass' || tool === 'shot') {
        linkedEntityId = nearestEntity(start, { ballOnly: true })?.id || nearestEntity(start)?.id || null;
      } else if (['movement', 'dribble', 'curve', 'defense'].includes(tool)) {
        linkedEntityId = nearestEntity(start, { playerOnly: true })?.id || null;
      }
    }
    return {
      id: preview ? 'preview' : uid('drawing'),
      type: tool,
      tactic,
      points,
      color: meta.color,
      fillColor: `${meta.color}33`,
      width: tool === 'shot' ? 4.5 : 3,
      opacity: 1,
      dashed: Boolean(meta.dashed),
      closed: tool === 'zone',
      arrowEnd: Boolean(meta.arrow),
      text: '',
      linkedEntityId,
      stageIndex: play.activeStage,
      locked: false,
    };
  }

  function drawingGestureDistance(interaction) {
    const first = canonicalToPoint(interaction.start);
    const second = canonicalToPoint(interaction.current);
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function beginLongPress(event, targetInfo) {
    clearTimeout(ui.longPressTimer);
    ui.longPressTimer = window.setTimeout(() => {
      if (!ui.interaction || ui.interaction.moved || ui.activePointers.size > 1) return;
      ui.interaction.longPressed = true;
      setSelected(targetInfo.kind, targetInfo.id);
      openContextMenu(event.clientX, event.clientY);
      navigator.vibrate?.(20);
    }, LONG_PRESS_MS);
  }

  function clearLongPress() {
    clearTimeout(ui.longPressTimer);
    ui.longPressTimer = null;
  }

  function targetInfoFromEvent(event) {
    const handle = event.target.closest?.('[data-kind="handle"]');
    if (handle) {
      return {
        kind: 'handle',
        id: handle.dataset.drawingId,
        pointIndex: Number(handle.dataset.handleIndex),
      };
    }
    const entity = event.target.closest?.('[data-entity-id]');
    if (entity) return { kind: 'entity', id: entity.dataset.entityId };
    const drawing = event.target.closest?.('[data-drawing-id]');
    if (drawing) return { kind: 'drawing', id: drawing.dataset.drawingId };
    return null;
  }

  function resumeEditingFromTimeline() {
    if (!ui.animationPositions) return;
    const segment = playbackSegmentAt(ui.playbackElapsed);
    const stageIndex = segment.local >= .5
      ? Math.min(segment.index + 1, play.stages.length - 1)
      : segment.index;
    applyStage(stageIndex, { render: false });
    ui.playbackElapsed = play.stages
      .slice(1, stageIndex + 1)
      .reduce((total, stage) => total + Number(stage.duration || DEFAULT_STAGE_DURATION), 0);
    ui.animationPositions = null;
    renderAll();
    showToast(`Edição retomada na Etapa ${stageIndex + 1}.`, 'success');
  }

  function pointerDown(event) {
    if (event.button !== undefined && event.button > 1) return;
    els.contextMenu.classList.add('hidden');
    ui.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try {
      els.court.setPointerCapture?.(event.pointerId);
    } catch (_) {}
    if (ui.activePointers.size === 2) {
      clearLongPress();
      const interrupted = ui.interaction;
      if (interrupted?.before && interrupted.type !== 'pan') {
        const viewport = { zoom: ui.zoom, panX: ui.panX, panY: ui.panY };
        restoreSnapshot(interrupted.before);
        ui.zoom = viewport.zoom;
        ui.panX = viewport.panX;
        ui.panY = viewport.panY;
      }
      ui.interaction = null;
      renderPreview();
      if (interrupted?.before && interrupted.type !== 'pan') {
        renderAll();
      }
      const points = Array.from(ui.activePointers.values());
      ui.pinch = {
        distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
        midpoint: {
          x: (points[0].x + points[1].x) / 2,
          y: (points[0].y + points[1].y) / 2,
        },
        zoom: ui.zoom,
        panX: ui.panX,
        panY: ui.panY,
      };
      event.preventDefault();
      return;
    }

    const target = targetInfoFromEvent(event);
    const panGesture = ui.tool === 'pan' || event.button === 1;
    if (ui.animationPositions && !panGesture && (target || ui.tool !== 'select')) {
      resumeEditingFromTimeline();
    }
    const canonical = screenToCanonical(event.clientX, event.clientY);
    if (panGesture) {
      ui.interaction = {
        type: 'pan',
        pointerId: event.pointerId,
        startClient: { x: event.clientX, y: event.clientY },
        startPan: { x: ui.panX, y: ui.panY },
        moved: false,
      };
      event.preventDefault();
      return;
    }

    if (ui.tool === 'eraser') {
      if (target?.kind === 'entity') removeEntity(target.id);
      if (target?.kind === 'drawing' || target?.kind === 'handle') removeDrawing(target.id);
      event.preventDefault();
      return;
    }

    if (ui.tool === 'player') {
      openPlayerDialog(null, canonical);
      setTool('select');
      event.preventDefault();
      return;
    }
    if (ui.tool === 'ball') {
      addBall(canonical);
      setTool('select');
      event.preventDefault();
      return;
    }
    if (ui.tool === 'text') {
      ui.pendingTextPoint = canonical;
      els.drawingText.value = '';
      showDialog(els.textDialog, els.drawingText);
      event.preventDefault();
      return;
    }

    if (TACTIC_META[ui.tool] && ui.tool !== 'text') {
      ui.interaction = {
        type: 'draw',
        pointerId: event.pointerId,
        tool: ui.tool,
        start: canonical,
        current: canonical,
        moved: false,
        before: snapshot(),
      };
      renderPreview();
      event.preventDefault();
      return;
    }

    if (target?.kind === 'handle') {
      const drawing = play.drawings.find((item) => item.id === target.id);
      if (!drawing || drawing.locked) return;
      setSelected('drawing', drawing.id);
      ui.interaction = {
        type: 'handle',
        pointerId: event.pointerId,
        drawingId: drawing.id,
        pointIndex: target.pointIndex,
        before: snapshot(),
        moved: false,
        startClient: { x: event.clientX, y: event.clientY },
      };
      event.preventDefault();
      return;
    }

    if (target?.kind === 'entity') {
      const entity = play.entities.find((item) => item.id === target.id);
      if (!entity) return;
      setSelected('entity', entity.id);
      ui.interaction = {
        type: entity.locked ? 'select' : 'drag-entity',
        pointerId: event.pointerId,
        entityId: entity.id,
        before: snapshot(),
        moved: false,
        startClient: { x: event.clientX, y: event.clientY },
        startCanonical: canonical,
        original: { u: entity.u, v: entity.v },
      };
      beginLongPress(event, target);
      event.preventDefault();
      return;
    }

    if (target?.kind === 'drawing') {
      const drawing = play.drawings.find((item) => item.id === target.id);
      if (!drawing) return;
      setSelected('drawing', drawing.id);
      ui.interaction = {
        type: drawing.locked ? 'select' : 'drag-drawing',
        pointerId: event.pointerId,
        drawingId: drawing.id,
        before: snapshot(),
        moved: false,
        startClient: { x: event.clientX, y: event.clientY },
        startCanonical: canonical,
        originalPoints: clone(drawing.points),
      };
      beginLongPress(event, target);
      event.preventDefault();
      return;
    }

    setSelected(null, null);
    ui.interaction = {
      type: 'select',
      pointerId: event.pointerId,
      moved: false,
      startClient: { x: event.clientX, y: event.clientY },
    };
  }

  function pointerMove(event) {
    if (ui.activePointers.has(event.pointerId)) {
      ui.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (ui.activePointers.size >= 2 && ui.pinch) {
      const points = Array.from(ui.activePointers.values()).slice(0, 2);
      const distance = Math.max(1, Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y));
      const midpoint = {
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2,
      };
      ui.zoom = clamp(ui.pinch.zoom * (distance / Math.max(1, ui.pinch.distance)), .55, 3.5);
      const { width, height } = dimensions();
      const rect = els.court.getBoundingClientRect();
      ui.panX = ui.pinch.panX + (midpoint.x - ui.pinch.midpoint.x) * (width / Math.max(1, rect.width));
      ui.panY = ui.pinch.panY + (midpoint.y - ui.pinch.midpoint.y) * (height / Math.max(1, rect.height));
      applyViewport();
      event.preventDefault();
      return;
    }

    const interaction = ui.interaction;
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    const movedPixels = interaction.startClient
      ? Math.hypot(event.clientX - interaction.startClient.x, event.clientY - interaction.startClient.y)
      : 0;
    if (movedPixels > MOVE_TOLERANCE) {
      interaction.moved = true;
      clearLongPress();
    }

    if (interaction.type === 'pan') {
      const { width, height } = dimensions();
      const rect = els.court.getBoundingClientRect();
      ui.panX = interaction.startPan.x + (event.clientX - interaction.startClient.x) * (width / Math.max(1, rect.width));
      ui.panY = interaction.startPan.y + (event.clientY - interaction.startClient.y) * (height / Math.max(1, rect.height));
      applyViewport();
      event.preventDefault();
      return;
    }
    const canonical = screenToCanonical(event.clientX, event.clientY);
    if (interaction.type === 'draw') {
      interaction.current = canonical;
      interaction.moved = drawingGestureDistance(interaction) > 8;
      renderPreview();
      event.preventDefault();
      return;
    }
    if (interaction.type === 'drag-entity') {
      const entity = play.entities.find((item) => item.id === interaction.entityId);
      if (!entity) return;
      entity.u = clamp(interaction.original.u + canonical.u - interaction.startCanonical.u, .005, .995);
      entity.v = clamp(interaction.original.v + canonical.v - interaction.startCanonical.v, .015, .985);
      scheduleBoardRender();
      event.preventDefault();
      return;
    }
    if (interaction.type === 'drag-drawing') {
      const drawing = play.drawings.find((item) => item.id === interaction.drawingId);
      if (!drawing) return;
      const deltaU = canonical.u - interaction.startCanonical.u;
      const deltaV = canonical.v - interaction.startCanonical.v;
      drawing.points = interaction.originalPoints.map((point) => ({
        u: clamp(point.u + deltaU, 0, 1),
        v: clamp(point.v + deltaV, 0, 1),
      }));
      scheduleBoardRender();
      event.preventDefault();
      return;
    }
    if (interaction.type === 'handle') {
      const drawing = play.drawings.find((item) => item.id === interaction.drawingId);
      if (!drawing?.points[interaction.pointIndex]) return;
      drawing.points[interaction.pointIndex] = canonical;
      scheduleBoardRender();
      event.preventDefault();
    }
  }

  function finishInteraction(event, cancelled = false) {
    ui.activePointers.delete(event.pointerId);
    if (ui.activePointers.size < 2) ui.pinch = null;
    try {
      els.court.releasePointerCapture?.(event.pointerId);
    } catch (_) {}
    const interaction = ui.interaction;
    clearLongPress();
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    ui.interaction = null;

    if (cancelled && interaction.before) {
      restoreSnapshot(interaction.before);
      renderAll();
      return;
    }
    if (interaction.longPressed) return;
    if (interaction.type === 'draw') {
      renderPreview();
      if (!interaction.moved) return;
      if (!hasCapacity('drawings', 'desenhos')) return;
      const drawing = buildDrawing(interaction.tool, interaction.start, interaction.current);
      if (!drawing) return;
      play.drawings.push(drawing);
      const stage = play.stages[drawing.stageIndex];
      if (stage && !stage.visibleDrawingIds.includes(drawing.id)) stage.visibleDrawingIds.push(drawing.id);
      commitHistory(interaction.before, `Desenhar ${TACTIC_META[drawing.type]?.label || 'elemento'}`);
      setSelected('drawing', drawing.id);
      renderAll();
      return;
    }
    if (['drag-entity', 'drag-drawing', 'handle'].includes(interaction.type) && interaction.moved) {
      if (interaction.type === 'drag-entity' && !ui.recording) syncActiveStage();
      const label = interaction.type === 'drag-entity'
        ? 'Mover jogador'
        : interaction.type === 'handle'
          ? 'Editar desenho'
          : 'Mover desenho';
      commitHistory(interaction.before, label);
      renderAll();
    }
  }

  function wheelZoom(event) {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    ui.zoom = clamp(ui.zoom * (direction > 0 ? 1.1 : .9), .55, 3.5);
    applyViewport();
  }

  function setZoom(value) {
    ui.zoom = clamp(value, .55, 3.5);
    applyViewport();
  }

  function resetViewport() {
    ui.zoom = 1;
    ui.panX = 0;
    ui.panY = 0;
    applyViewport();
  }

  function openContextMenu(clientX, clientY) {
    if (!ui.selected) return;
    const lockButton = $('[data-context-action="lock"]', els.contextMenu);
    const selectedItem = ui.selected.kind === 'entity'
      ? play.entities.find((item) => item.id === ui.selected.id)
      : play.drawings.find((item) => item.id === ui.selected.id);
    if (lockButton) lockButton.textContent = selectedItem?.locked ? 'Desbloquear' : 'Bloquear posição';
    els.contextMenu.classList.remove('hidden');
    const rect = els.contextMenu.getBoundingClientRect();
    els.contextMenu.style.left = `${clamp(clientX, 8, window.innerWidth - rect.width - 8)}px`;
    els.contextMenu.style.top = `${clamp(clientY, 8, window.innerHeight - rect.height - 8)}px`;
    $('[role="menuitem"]', els.contextMenu)?.focus();
  }

  function handleContextAction(action) {
    if (!ui.selected) return;
    const { kind, id } = ui.selected;
    els.contextMenu.classList.add('hidden');
    if (action === 'edit') {
      if (kind === 'entity') {
        const entity = play.entities.find((item) => item.id === id);
        if (entity?.type === 'player') openPlayerDialog(entity);
        else setSideTab('inspector');
      } else {
        setSideTab('inspector');
      }
    }
    if (action === 'duplicate') {
      if (kind === 'entity') duplicateEntity(id);
      else duplicateDrawing(id);
    }
    if (action === 'lock') {
      if (kind === 'entity') toggleEntityLock(id);
      else {
        const drawing = play.drawings.find((item) => item.id === id);
        if (!drawing) return;
        const before = snapshot();
        drawing.locked = !drawing.locked;
        commitHistory(before, drawing.locked ? 'Bloquear desenho' : 'Desbloquear desenho');
        renderAll();
      }
    }
    if (action === 'delete') deleteSelection();
  }

  function addTextDrawing(event) {
    event.preventDefault();
    const text = els.drawingText.value.trim();
    if (!text || !ui.pendingTextPoint) return;
    if (!hasCapacity('drawings', 'desenhos')) return;
    const before = snapshot();
    const drawing = {
      id: uid('drawing'),
      type: 'text',
      tactic: 'neutral',
      points: [clone(ui.pendingTextPoint)],
      color: '#ffffff',
      fillColor: '#0f172acc',
      width: 2,
      opacity: 1,
      dashed: false,
      closed: false,
      arrowEnd: false,
      text: text.slice(0, 120),
      linkedEntityId: null,
      stageIndex: play.activeStage,
      locked: false,
    };
    play.drawings.push(drawing);
    const stage = play.stages[drawing.stageIndex];
    if (stage) stage.visibleDrawingIds.push(drawing.id);
    commitHistory(before, 'Adicionar observação');
    ui.pendingTextPoint = null;
    closeDialog(els.textDialog);
    setSelected('drawing', drawing.id);
    renderAll();
  }

  function addStage() {
    pausePlayback();
    if (!hasCapacity('stages', 'etapas')) return;
    const before = snapshot();
    const stage = blankStage(play.stages.length);
    stage.duration = Number(play.stages[play.stages.length - 1]?.duration || DEFAULT_STAGE_DURATION);
    captureStage(stage, {
      visibleDrawings: play.drawings
        .filter((drawing) => Number(drawing.stageIndex || 0) === play.activeStage)
        .map((drawing) => drawing.id),
    });
    play.stages.push(stage);
    play.activeStage = play.stages.length - 1;
    commitHistory(before, 'Adicionar etapa');
    renderAll();
    setSideTab('stages');
    showToast(`Etapa ${play.stages.length} adicionada.`, 'success');
  }

  function deleteStage() {
    if (play.stages.length <= 1) return showToast('A jogada precisa manter ao menos uma etapa.');
    const before = snapshot();
    const removedIndex = play.activeStage;
    play.stages.splice(removedIndex, 1);
    play.drawings.forEach((drawing) => {
      if (drawing.stageIndex === removedIndex) drawing.stageIndex = Math.max(0, removedIndex - 1);
      else if (drawing.stageIndex > removedIndex) drawing.stageIndex -= 1;
    });
    play.activeStage = clamp(removedIndex - 1, 0, play.stages.length - 1);
    applyStage(play.activeStage, { render: false });
    commitHistory(before, 'Excluir etapa');
    renderAll();
  }

  function toggleRecording() {
    pausePlayback();
    ui.recording = !ui.recording;
    els.recordPlay.classList.toggle('is-recording', ui.recording);
    els.recordPlay.setAttribute('aria-pressed', String(ui.recording));
    els.recordPlay.querySelector('span').textContent = ui.recording ? 'Gravando etapas' : 'Gravar jogada';
    if (ui.recording) {
      syncActiveStage();
      showToast('Gravação iniciada. Mova os elementos e pressione “Adicionar etapa”.', 'success');
      announce('Gravação de etapas iniciada.');
    } else {
      syncActiveStage();
      markDirty();
      showToast('Gravação de etapas pausada.');
    }
  }

  function totalPlaybackDuration() {
    if (play.stages.length < 2) return 0;
    return play.stages.slice(1).reduce((total, stage) => total + Number(stage.duration || DEFAULT_STAGE_DURATION), 0);
  }

  function playbackSegmentAt(elapsed) {
    let consumed = 0;
    for (let index = 0; index < play.stages.length - 1; index += 1) {
      const duration = Number(play.stages[index + 1]?.duration || DEFAULT_STAGE_DURATION);
      if (elapsed <= consumed + duration || index === play.stages.length - 2) {
        return {
          index,
          local: clamp((elapsed - consumed) / Math.max(1, duration), 0, 1),
          start: consumed,
          duration,
        };
      }
      consumed += duration;
    }
    return { index: 0, local: 0, start: 0, duration: DEFAULT_STAGE_DURATION };
  }

  function easeInOut(value) {
    const t = clamp(value, 0, 1);
    return t < .5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
  }

  function interpolatePoint(start, end, progress) {
    return {
      u: start.u + (end.u - start.u) * progress,
      v: start.v + (end.v - start.v) * progress,
    };
  }

  function quadraticPoint(start, control, end, progress) {
    const inverse = 1 - progress;
    return {
      u: inverse * inverse * start.u + 2 * inverse * progress * control.u + progress * progress * end.u,
      v: inverse * inverse * start.v + 2 * inverse * progress * control.v + progress * progress * end.v,
    };
  }

  function linkedPath(entityId, segmentIndex) {
    return play.drawings.find((drawing) => (
      drawing.linkedEntityId === entityId
      && Number(drawing.stageIndex || 0) === segmentIndex
      && ['movement', 'pass', 'shot', 'dribble', 'curve'].includes(drawing.type)
    )) || null;
  }

  function pathInterpolatedPosition(entityId, start, end, progress, segmentIndex) {
    const drawing = linkedPath(entityId, segmentIndex);
    if (!drawing) return interpolatePoint(start, end, progress);
    if ((drawing.type === 'curve' || drawing.type === 'dribble') && drawing.points.length >= 3) {
      return quadraticPoint(start, drawing.points[1], end, progress);
    }
    return interpolatePoint(start, end, progress);
  }

  function animationPositionsAt(elapsed) {
    const segment = playbackSegmentAt(elapsed);
    const startStage = play.stages[segment.index];
    const endStage = play.stages[segment.index + 1] || startStage;
    const startMap = stagePositionMap(startStage);
    const endMap = stagePositionMap(endStage);
    const progress = easeInOut(segment.local);
    const positions = new Map();

    play.entities.filter((entity) => entity.type === 'player').forEach((entity) => {
      const start = startMap.get(entity.id) || entity;
      const end = endMap.get(entity.id) || start;
      positions.set(entity.id, pathInterpolatedPosition(entity.id, start, end, progress, segment.index));
    });
    play.entities.filter((entity) => entity.type === 'ball').forEach((entity) => {
      const start = startMap.get(entity.id) || entity;
      const end = endMap.get(entity.id) || start;
      const path = linkedPath(entity.id, segment.index);
      const startOwnerId = start.attachedTo || startStage.ballOwnerId || null;
      const endOwnerId = end.attachedTo || endStage.ballOwnerId || null;
      const attachedPosition = (ownerId, stageMap, fallback) => {
        const owner = play.entities.find((item) => item.id === ownerId);
        const ownerStagePosition = owner && (stageMap.get(ownerId) || owner);
        if (!owner || !ownerStagePosition) return fallback;
        const direction = owner.team === 'team2' ? -1 : 1;
        return {
          u: clamp(ownerStagePosition.u + direction * .035, .01, .99),
          v: clamp(ownerStagePosition.v + .035, .02, .98),
        };
      };
      if (startOwnerId && startOwnerId === endOwnerId && positions.has(startOwnerId)) {
        const owner = play.entities.find((item) => item.id === startOwnerId);
        const ownerPosition = positions.get(startOwnerId);
        const direction = owner?.team === 'team2' ? -1 : 1;
        positions.set(entity.id, {
          u: clamp(ownerPosition.u + direction * .035, .01, .99),
          v: clamp(ownerPosition.v + .035, .02, .98),
        });
        return;
      }
      const effectiveStart = startOwnerId ? attachedPosition(startOwnerId, startMap, start) : start;
      const effectiveEnd = endOwnerId ? attachedPosition(endOwnerId, endMap, end) : end;
      positions.set(
        entity.id,
        path
          ? pathInterpolatedPosition(entity.id, effectiveStart, effectiveEnd, progress, segment.index)
          : interpolatePoint(effectiveStart, effectiveEnd, progress),
      );
    });
    return { positions, segment };
  }

  function applyEntityTransforms(positions) {
    play.entities.forEach((entity) => {
      const node = els.entityLayer.querySelector(`[data-entity-id="${CSS.escape(entity.id)}"]`);
      if (!node) return;
      node.setAttribute('transform', entityTransform(entity, positions?.get(entity.id) || null));
    });
    if (ui.selected?.kind === 'entity') renderSelection();
  }

  function applyAnimationAtElapsed(elapsed, forceDrawingRender = false) {
    const total = totalPlaybackDuration();
    ui.playbackElapsed = clamp(elapsed, 0, total);
    const { positions, segment } = animationPositionsAt(ui.playbackElapsed);
    const segmentChanged = segment.index !== ui.playbackSegment;
    ui.playbackSegment = segment.index;
    ui.animationPositions = positions;
    applyEntityTransforms(positions);
    if (segmentChanged || forceDrawingRender) renderDrawings();
    updatePlaybackUI();
  }

  function playbackTick(timestamp) {
    if (!ui.playing) return;
    if (!ui.playbackLastTime) ui.playbackLastTime = timestamp;
    const speed = Number(els.playbackSpeed.value || 1);
    const delta = Math.min(100, timestamp - ui.playbackLastTime) * speed;
    ui.playbackLastTime = timestamp;
    const total = totalPlaybackDuration();
    let nextElapsed = ui.playbackElapsed + delta;
    if (nextElapsed >= total) {
      if (els.repeatPlayback.checked) {
        nextElapsed = total ? nextElapsed % total : 0;
        ui.playbackLastTime = timestamp;
      } else {
        applyAnimationAtElapsed(total, true);
        ui.playing = false;
        ui.playbackFrame = null;
        applyStage(Math.max(0, play.stages.length - 1), { render: false });
        ui.playbackElapsed = total;
        ui.playbackSegment = Math.max(0, play.stages.length - 2);
        renderAll();
        updatePlaybackUI();
        announce('Reprodução concluída.');
        return;
      }
    }
    applyAnimationAtElapsed(nextElapsed);
    ui.playbackFrame = requestAnimationFrame(playbackTick);
  }

  function playPlayback() {
    const total = totalPlaybackDuration();
    if (!total) {
      showToast('Adicione ao menos duas etapas para reproduzir a jogada.');
      return;
    }
    if (ui.playbackElapsed >= total) ui.playbackElapsed = 0;
    ui.playing = true;
    ui.recording = false;
    els.recordPlay.classList.remove('is-recording');
    els.recordPlay.setAttribute('aria-pressed', 'false');
    els.recordPlay.querySelector('span').textContent = 'Gravar jogada';
    ui.playbackLastTime = performance.now();
    ui.animationPositions = animationPositionsAt(ui.playbackElapsed).positions;
    renderDrawings();
    renderEntities();
    updatePlaybackUI();
    cancelAnimationFrame(ui.playbackFrame);
    ui.playbackFrame = requestAnimationFrame(playbackTick);
    announce('Reprodução iniciada.');
  }

  function pausePlayback() {
    if (!ui.playing) return;
    ui.playing = false;
    cancelAnimationFrame(ui.playbackFrame);
    ui.playbackFrame = null;
    ui.playbackLastTime = 0;
    updatePlaybackUI();
    announce('Reprodução pausada.');
  }

  function togglePlayback() {
    if (ui.playing) pausePlayback();
    else playPlayback();
  }

  function restartPlayback() {
    pausePlayback();
    ui.playbackElapsed = 0;
    ui.playbackSegment = 0;
    ui.animationPositions = null;
    applyStage(0, { render: false });
    renderAll();
    announce('Jogada reiniciada na primeira etapa.');
  }

  function formatDuration(milliseconds) {
    const seconds = Math.max(0, Math.round(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function updatePlaybackUI() {
    const total = totalPlaybackDuration();
    const progress = total ? Math.round((ui.playbackElapsed / total) * 1000) : 0;
    if (document.activeElement !== els.progress) els.progress.value = String(progress);
    els.animationTime.textContent = `${formatDuration(ui.playbackElapsed)} / ${formatDuration(total)}`;
    const visibleStage = ui.playing || ui.animationPositions
      ? Math.min(ui.playbackSegment + 1, play.stages.length - 1)
      : play.activeStage;
    els.stageCaption.textContent = `Etapa ${Math.min(play.stages.length, visibleStage + 1)} de ${play.stages.length}`;
    [els.playPause, els.mobilePlayPause].forEach((button) => {
      button.classList.toggle('is-playing', ui.playing);
      button.setAttribute('aria-label', ui.playing ? 'Pausar jogada' : 'Reproduzir jogada');
    });
    const mobileLabel = $('span', els.mobilePlayPause);
    if (mobileLabel) mobileLabel.textContent = ui.playing ? 'Pausar' : 'Reproduzir';
    document.body.classList.toggle('tactical-is-playing', ui.playing);
  }

  function saveCurrentPlay() {
    play.name = els.playName.value.trim().slice(0, 80) || 'Jogada sem nome';
    play.description = els.playDescription.value.trim().slice(0, 240);
    play.category = els.playCategory.value;
    if (!ui.recording) syncActiveStage();
    try {
      play = Storage.save(play);
      Storage.flushDraft(play);
      ui.dirty = false;
      renderAll();
      showToast('Jogada salva na biblioteca local.', 'success');
      announce('Jogada salva.');
    } catch (error) {
      showToast(error.message || 'Não foi possível salvar a jogada.', 'error');
    }
  }

  function createNewPlay() {
    if (ui.dirty && !window.confirm('Criar uma nova jogada? Salve a estratégia atual na biblioteca antes de continuar se quiser mantê-la.')) {
      return;
    }
    pausePlayback();
    play = newPlay();
    ui.history = [];
    ui.future = [];
    ui.selected = null;
    ui.recording = false;
    ui.playbackElapsed = 0;
    ui.animationPositions = null;
    resetViewport();
    markDirty();
    renderAll();
    showToast('Nova jogada criada.', 'success');
  }

  function loadLibraryPlay(id) {
    if (ui.dirty && !window.confirm('Abrir outra jogada? As alterações atuais que ainda não foram salvas na biblioteca serão substituídas.')) {
      return;
    }
    try {
      const loaded = Storage.get(id);
      if (!loaded) return showToast('A jogada não foi encontrada.', 'error');
      pausePlayback();
      play = loaded;
      if (!play.stages.length) play.stages = [blankStage(0)];
      ui.history = [];
      ui.future = [];
      ui.selected = null;
      ui.recording = false;
      ui.playbackElapsed = 0;
      ui.animationPositions = null;
      ui.dirty = false;
      resetViewport();
      Storage.flushDraft(play);
      renderAll();
      showToast(`“${play.name}” aberta.`, 'success');
      closePanels();
    } catch (error) {
      showToast(error.message || 'A jogada não pôde ser aberta.', 'error');
    }
  }

  function duplicateLibraryPlay(id) {
    try {
      const copy = Storage.duplicate(id);
      renderLibrary();
      showToast(`Cópia “${copy.name}” criada.`, 'success');
    } catch (error) {
      showToast(error.message || 'A jogada não pôde ser duplicada.', 'error');
    }
  }

  function deleteLibraryPlay(id) {
    try {
      const item = Storage.get(id);
      if (!item) return;
      if (!window.confirm(`Excluir a jogada “${item.name}”? Esta ação remove a cópia salva deste dispositivo.`)) return;
      Storage.remove(id);
      renderLibrary();
      showToast('Jogada excluída da biblioteca.', 'success');
    } catch (error) {
      showToast(error.message || 'A jogada não pôde ser excluída.', 'error');
    }
  }

  function exportFilename(extension) {
    return `mesa-tatica-${Storage.slugify(play.name)}.${extension}`;
  }

  async function exportPNG() {
    closeExportMenu();
    try {
      await Exporter.exportPNG(els.court, exportFilename('png'), {
        background: '#08745d',
        scale: window.innerWidth < 700 ? 1.5 : 2,
      });
      showToast('Imagem PNG exportada.', 'success');
    } catch (error) {
      showToast(error.message || 'Não foi possível exportar a imagem.', 'error');
    }
  }

  function exportJSON() {
    closeExportMenu();
    try {
      const blob = Storage.exportJSON(play);
      Storage.downloadBlob(blob, exportFilename('json'));
      showToast('Arquivo JSON exportado.', 'success');
    } catch (error) {
      showToast(error.message || 'Não foi possível exportar o JSON.', 'error');
    }
  }

  async function importJSONFile(file) {
    if (!file) return;
    try {
      const imported = await Storage.parseImportedFile(file);
      pausePlayback();
      play = imported;
      if (!play.stages.length) play.stages = [blankStage(0)];
      play.id = uid('play');
      play.name = `${play.name} (importada)`.slice(0, 80);
      play.createdAt = Date.now();
      play.updatedAt = Date.now();
      ui.history = [];
      ui.future = [];
      ui.selected = null;
      ui.playbackElapsed = 0;
      ui.animationPositions = null;
      els.playName.blur();
      els.playDescription.blur();
      resetViewport();
      markDirty();
      renderAll();
      showToast('Jogada importada e aberta como nova cópia.', 'success');
    } catch (error) {
      showToast(error.message || 'O arquivo não pôde ser importado.', 'error');
    } finally {
      els.importFile.value = '';
    }
  }

  function printBoard() {
    closeExportMenu();
    try {
      Exporter.printSVG(els.court, `${play.name} — Mesa Tática`);
    } catch (error) {
      showToast(error.message || 'Não foi possível abrir a impressão.', 'error');
    }
  }

  async function recordAnimationVideo() {
    closeExportMenu();
    const total = totalPlaybackDuration();
    if (!total) return showToast('Adicione ao menos duas etapas para gravar a animação.');
    if (!Exporter.supportsRecording()) {
      return showToast('Este navegador não oferece gravação WebM. A exportação PNG e JSON continua disponível.', 'error');
    }
    pausePlayback();
    const restoration = {
      activeStage: play.activeStage,
      elapsed: ui.playbackElapsed,
      segment: ui.playbackSegment,
      animationPositions: ui.animationPositions,
    };
    document.body.classList.add('tactical-is-exporting');
    showToast('Gravando a animação. Mantenha esta aba aberta...');
    try {
      await Exporter.recordSVG({
        svg: els.court,
        durationMs: total,
        filename: exportFilename('webm'),
        fps: window.innerWidth < 700 ? 18 : 24,
        background: '#08745d',
        seek: (progress) => {
          applyAnimationAtElapsed(progress * total, true);
        },
        restore: () => {
          play.activeStage = restoration.activeStage;
          ui.playbackElapsed = restoration.elapsed;
          ui.playbackSegment = restoration.segment;
          ui.animationPositions = restoration.animationPositions;
          renderAll();
        },
      });
      showToast('Animação WebM exportada.', 'success');
    } catch (error) {
      showToast(error.message || 'Não foi possível gravar a animação.', 'error');
    } finally {
      document.body.classList.remove('tactical-is-exporting');
    }
  }

  function toggleExportMenu() {
    const opening = els.exportMenu.classList.contains('hidden');
    if (opening) {
      els.exportMenu.classList.remove('hidden');
      const triggerRect = els.openExport.getBoundingClientRect();
      const menuRect = els.exportMenu.getBoundingClientRect();
      els.exportMenu.style.left = `${clamp(triggerRect.right - menuRect.width, 8, window.innerWidth - menuRect.width - 8)}px`;
      els.exportMenu.style.top = `${Math.min(window.innerHeight - menuRect.height - 8, triggerRect.bottom + 8)}px`;
      els.openExport.setAttribute('aria-expanded', 'true');
      $('button', els.exportMenu)?.focus();
    } else {
      closeExportMenu();
    }
  }

  function closeExportMenu() {
    els.exportMenu.classList.add('hidden');
    els.openExport.setAttribute('aria-expanded', 'false');
  }

  function setSideTab(name) {
    $$('[data-side-tab]').forEach((button) => {
      const active = button.dataset.sideTab === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $$('[data-side-panel]').forEach((panel) => {
      const active = panel.dataset.sidePanel === name;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
    if (name === 'library') renderLibrary();
    if (name === 'inspector') renderInspector();
  }

  function isMobileLayout() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function openPanel(which) {
    const panel = which === 'tools' ? els.toolsPanel : els.rightPanel;
    if (!isMobileLayout()) {
      if (which === 'right') setSideTab('roster');
      panel.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    closePanels();
    panel.classList.add('is-open');
    els.panelBackdrop.classList.remove('hidden');
    document.body.classList.add('tactical-drawer-open');
    const first = $('button, input, select', panel);
    window.setTimeout(() => first?.focus(), 50);
  }

  function closePanels() {
    els.toolsPanel.classList.remove('is-open');
    els.rightPanel.classList.remove('is-open');
    els.panelBackdrop.classList.add('hidden');
    document.body.classList.remove('tactical-drawer-open');
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function handleFullscreenChange() {
    const fullscreen = Boolean(fullscreenElement());
    document.body.classList.toggle('tactical-fullscreen', fullscreen);
    [els.fullscreen, els.mobileFullscreen].forEach((button) => {
      if (!button) return;
      button.setAttribute('aria-label', fullscreen ? 'Sair da tela cheia' : 'Abrir quadra em tela cheia');
      button.title = fullscreen ? 'Sair da tela cheia' : 'Tela cheia';
    });
    if (!fullscreen) {
      try {
        screen.orientation?.unlock?.();
      } catch (_) {}
    }
    window.setTimeout(resetViewport, 80);
  }

  async function toggleFullscreen() {
    const target = $('.tactical-center');
    const request = target?.requestFullscreen || target?.webkitRequestFullscreen;
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    try {
      if (!fullscreenElement()) {
        if (typeof request !== 'function') {
          showToast('A tela cheia não é oferecida por este navegador.', 'error');
          return;
        }
        await request.call(target);
        document.body.classList.add('tactical-fullscreen');
        if (play.orientation === 'horizontal') {
          try {
            await screen.orientation?.lock?.('landscape');
          } catch (_) {}
        }
      } else {
        if (typeof exit === 'function') await exit.call(document);
      }
    } catch (error) {
      showToast('O navegador não permitiu abrir a quadra em tela cheia.', 'error');
    }
  }

  function toggleOrientation() {
    const before = snapshot();
    play.orientation = play.orientation === 'vertical' ? 'horizontal' : 'vertical';
    resetViewport();
    commitHistory(before, 'Alternar orientação');
    renderAll();
  }

  function clearBoard() {
    if (!play.entities.length && !play.drawings.length) return;
    if (!window.confirm('Limpar jogadores, bola, desenhos e etapas da quadra? Você poderá desfazer esta ação.')) return;
    pausePlayback();
    const before = snapshot();
    play.entities = [];
    play.drawings = [];
    play.stages = [blankStage(0)];
    play.activeStage = 0;
    ui.selected = null;
    ui.playbackElapsed = 0;
    ui.animationPositions = null;
    commitHistory(before, 'Limpar quadra');
    renderAll();
    showToast('Quadra limpa. Use Desfazer para recuperar.', 'success');
  }

  function handleRosterClick(event) {
    const item = event.target.closest('[data-entity-id]');
    const action = event.target.closest('[data-roster-action]')?.dataset.rosterAction;
    if (!item || !action) return;
    const id = item.dataset.entityId;
    const entity = play.entities.find((entry) => entry.id === id);
    if (!entity) return;
    if (action === 'select') setSelected('entity', id);
    if (action === 'edit') {
      setSelected('entity', id);
      if (entity.type === 'player') openPlayerDialog(entity);
      else setSideTab('inspector');
    }
    if (action === 'lock') toggleEntityLock(id);
    if (action === 'duplicate') duplicateEntity(id);
    if (action === 'delete') removeEntity(id);
  }

  function handleInspectorAction(event) {
    const action = event.target.closest('[data-inspector-action]')?.dataset.inspectorAction;
    if (!action || !ui.selected) return;
    const { kind, id } = ui.selected;
    if (action === 'edit-entity') {
      const entity = play.entities.find((item) => item.id === id);
      if (entity?.type === 'player') openPlayerDialog(entity);
    }
    if (action === 'duplicate-entity') duplicateEntity(id);
    if (action === 'toggle-lock-entity') toggleEntityLock(id);
    if (action === 'delete-entity') removeEntity(id);
    if (action === 'duplicate-drawing') duplicateDrawing(id);
    if (action === 'toggle-lock-drawing') {
      const drawing = play.drawings.find((item) => item.id === id);
      if (!drawing) return;
      const before = snapshot();
      drawing.locked = !drawing.locked;
      commitHistory(before, drawing.locked ? 'Bloquear desenho' : 'Desbloquear desenho');
      renderAll();
    }
    if (action === 'delete-drawing') removeDrawing(id);
  }

  function handleInspectorChange(event) {
    if (!ui.selected) return;
    if (event.target.id === 'inspector-ball-owner') {
      const entity = play.entities.find((item) => item.id === ui.selected.id && item.type === 'ball');
      if (!entity) return;
      const before = snapshot();
      entity.attachedTo = event.target.value || null;
      if (!ui.recording) syncActiveStage();
      commitHistory(before, 'Vincular bola ao jogador');
      renderAll();
      return;
    }
    const property = event.target.dataset.drawingProperty;
    if (!property || ui.selected.kind !== 'drawing') return;
    const drawing = play.drawings.find((item) => item.id === ui.selected.id);
    if (!drawing) return;
    const before = snapshot();
    if (property === 'width') drawing.width = clamp(event.target.value, 1, 10);
    else if (property === 'stageIndex') {
      const oldStage = play.stages[drawing.stageIndex];
      if (oldStage) oldStage.visibleDrawingIds = oldStage.visibleDrawingIds.filter((id) => id !== drawing.id);
      drawing.stageIndex = clamp(event.target.value, 0, play.stages.length - 1);
      const stage = play.stages[drawing.stageIndex];
      if (stage && !stage.visibleDrawingIds.includes(drawing.id)) stage.visibleDrawingIds.push(drawing.id);
    } else if (property === 'linkedEntityId') drawing.linkedEntityId = event.target.value || null;
    else if (property === 'text') drawing.text = event.target.value.slice(0, 120);
    else drawing[property] = event.target.value;
    commitHistory(before, 'Editar propriedades do desenho');
    renderAll();
  }

  function keyboardHandler(event) {
    if (event.key === 'Escape') {
      closeExportMenu();
      els.contextMenu.classList.add('hidden');
      closePanels();
      if (els.playerDialog.open) closeDialog(els.playerDialog);
      if (els.textDialog.open) closeDialog(els.textDialog);
      setTool('select');
      return;
    }
    const boardItem = event.target.matches?.('g[data-entity-id], g[data-drawing-id]')
      ? event.target
      : null;
    if ((event.key === 'Enter' || event.code === 'Space') && boardItem) {
      event.preventDefault();
      if (boardItem.dataset.entityId) {
        setSelected('entity', boardItem.dataset.entityId, { inspector: true });
      } else {
        setSelected('drawing', boardItem.dataset.drawingId, { inspector: true });
      }
      return;
    }
    if (isTextInput(event.target)) return;
    const nativeControl = event.target.closest?.('button, a, [role="button"], [role="tab"], [role="menuitem"]');
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === 'y') {
      event.preventDefault();
      redo();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (ui.selected) {
        event.preventDefault();
        deleteSelection();
      }
      return;
    }
    if (nativeControl) return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (event.repeat) return;
      togglePlayback();
      return;
    }
    const tools = { v: 'select', h: 'pan', j: 'player', b: 'ball' };
    if (!event.ctrlKey && !event.metaKey && !event.altKey && tools[key]) setTool(tools[key]);
  }

  function doubleClickCourt(event) {
    const target = targetInfoFromEvent(event);
    if (!target) return;
    if (target.kind === 'entity') {
      const entity = play.entities.find((item) => item.id === target.id);
      if (entity?.type === 'player') openPlayerDialog(entity);
      else setSelected('entity', target.id, { inspector: true });
    } else {
      setSelected('drawing', target.id, { inspector: true });
    }
  }

  function bindEvents() {
    els.themeToggle.addEventListener('click', toggleTheme);
    els.newPlay.addEventListener('click', createNewPlay);
    els.savePlay.addEventListener('click', saveCurrentPlay);
    els.openLibrary.addEventListener('click', () => {
      setSideTab('library');
      openPanel('right');
    });
    els.openExport.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleExportMenu();
    });
    [els.fullscreen, els.mobileFullscreen].forEach((button) => {
      button?.addEventListener('click', toggleFullscreen);
    });
    els.orientation.addEventListener('click', toggleOrientation);
    els.zoomIn.addEventListener('click', () => setZoom(ui.zoom * 1.15));
    els.zoomOut.addEventListener('click', () => setZoom(ui.zoom * .85));
    els.zoomFit.addEventListener('click', resetViewport);
    els.undo.addEventListener('click', undo);
    els.redo.addEventListener('click', redo);
    els.mobileUndo.addEventListener('click', undo);
    els.clearBoard.addEventListener('click', clearBoard);
    [els.addPlayerQuick, els.rosterAddPlayer, els.mobileAddPlayer].forEach((button) => {
      button.addEventListener('click', () => openPlayerDialog());
    });
    [els.addBallQuick, els.rosterAddBall].forEach((button) => {
      button.addEventListener('click', () => addBall());
    });
    $$('[data-tool]').forEach((button) => {
      button.addEventListener('click', () => setTool(button.dataset.tool));
    });
    $$('[data-formation]').forEach((button) => {
      button.addEventListener('click', () => applyFormation(button.dataset.formation, els.formationTeam.value));
    });
    $$('[data-side-tab]').forEach((button) => {
      button.addEventListener('click', () => setSideTab(button.dataset.sideTab));
    });
    $$('[data-open-panel]').forEach((button) => {
      button.addEventListener('click', () => openPanel(button.dataset.openPanel));
    });
    $$('[data-close-panel]').forEach((button) => {
      button.addEventListener('click', closePanels);
    });
    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener('click', () => closeDialog(document.getElementById(button.dataset.closeDialog)));
    });

    els.playerForm.addEventListener('submit', updatePlayerFromForm);
    els.playerColor.addEventListener('input', () => {
      els.playerColorValue.textContent = els.playerColor.value;
    });
    els.playerTeam.addEventListener('change', () => {
      if (!ui.editingPlayerId) {
        els.playerColor.value = TEAM_COLORS[els.playerTeam.value] || TEAM_COLORS.team1;
        els.playerColorValue.textContent = els.playerColor.value;
      }
    });
    els.playerDelete.addEventListener('click', () => {
      const id = ui.editingPlayerId;
      closeDialog(els.playerDialog);
      if (id) removeEntity(id);
    });
    els.playerDuplicate.addEventListener('click', () => {
      const id = ui.editingPlayerId;
      closeDialog(els.playerDialog);
      if (id) duplicateEntity(id);
    });
    els.textForm.addEventListener('submit', addTextDrawing);

    els.court.addEventListener('pointerdown', pointerDown);
    els.court.addEventListener('pointermove', pointerMove);
    els.court.addEventListener('pointerup', (event) => finishInteraction(event));
    els.court.addEventListener('pointercancel', (event) => finishInteraction(event, true));
    window.addEventListener('pointerup', (event) => finishInteraction(event), true);
    window.addEventListener('pointercancel', (event) => finishInteraction(event, true), true);
    els.court.addEventListener('wheel', wheelZoom, { passive: false });
    els.court.addEventListener('dblclick', doubleClickCourt);

    els.rosterList.addEventListener('click', handleRosterClick);
    els.inspector.addEventListener('click', handleInspectorAction);
    els.inspector.addEventListener('change', handleInspectorChange);
    els.stagesList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-stage-index]');
      if (!button) return;
      pausePlayback();
      applyStage(Number(button.dataset.stageIndex));
    });
    els.addStage.addEventListener('click', addStage);
    els.deleteStage.addEventListener('click', deleteStage);
    els.stageDuration.addEventListener('pointerdown', () => {
      ui.stageDurationBefore = snapshot();
    });
    els.stageDuration.addEventListener('focus', () => {
      if (!ui.stageDurationBefore) ui.stageDurationBefore = snapshot();
    });
    els.stageDuration.addEventListener('keydown', (event) => {
      if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)
        && !ui.stageDurationBefore
      ) {
        ui.stageDurationBefore = snapshot();
      }
    });
    els.stageDuration.addEventListener('input', () => {
      const stage = play.stages[play.activeStage];
      if (!stage) return;
      stage.duration = Number(els.stageDuration.value);
      els.stageDurationValue.textContent = `${(stage.duration / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`;
      updatePlaybackUI();
    });
    els.stageDuration.addEventListener('change', () => {
      if (ui.stageDurationBefore) {
        commitHistory(ui.stageDurationBefore, 'Alterar duração da etapa');
      } else {
        markDirty();
      }
      ui.stageDurationBefore = null;
      renderStages();
    });
    els.recordPlay.addEventListener('click', toggleRecording);
    els.playPause.addEventListener('click', togglePlayback);
    els.mobilePlayPause.addEventListener('click', togglePlayback);
    els.restartPlayback.addEventListener('click', restartPlayback);
    els.previousStage.addEventListener('click', () => {
      pausePlayback();
      applyStage(play.activeStage - 1);
    });
    els.nextStage.addEventListener('click', () => {
      pausePlayback();
      applyStage(play.activeStage + 1);
    });
    els.progress.addEventListener('input', () => {
      pausePlayback();
      applyAnimationAtElapsed((Number(els.progress.value) / 1000) * totalPlaybackDuration(), true);
    });

    els.librarySearch.addEventListener('input', renderLibrary);
    els.libraryCategory.addEventListener('change', renderLibrary);
    els.libraryList.addEventListener('click', (event) => {
      const card = event.target.closest('[data-play-id]');
      const action = event.target.closest('[data-library-action]')?.dataset.libraryAction;
      if (!card || !action) return;
      if (action === 'open') loadLibraryPlay(card.dataset.playId);
      if (action === 'duplicate') duplicateLibraryPlay(card.dataset.playId);
      if (action === 'delete') deleteLibraryPlay(card.dataset.playId);
    });

    [els.playName, els.playDescription].forEach((input) => {
      input.addEventListener('input', () => {
        if (input === els.playName) play.name = input.value.slice(0, 80);
        else play.description = input.value.slice(0, 240);
        markDirty();
      });
    });
    els.playCategory.addEventListener('change', () => {
      play.category = els.playCategory.value;
      markDirty();
    });

    els.contextMenu.addEventListener('click', (event) => {
      const action = event.target.closest('[data-context-action]')?.dataset.contextAction;
      if (action) handleContextAction(action);
    });
    document.addEventListener('pointerdown', (event) => {
      if (!event.target.closest('#export-menu, #open-export-btn')) closeExportMenu();
      if (!event.target.closest('#context-menu, #tactical-court')) els.contextMenu.classList.add('hidden');
    });
    els.panelBackdrop.addEventListener('click', closePanels);
    els.exportPng.addEventListener('click', exportPNG);
    els.exportJson.addEventListener('click', exportJSON);
    els.importJson.addEventListener('click', () => {
      closeExportMenu();
      els.importFile.click();
    });
    els.importFile.addEventListener('change', () => importJSONFile(els.importFile.files?.[0]));
    els.printBoard.addEventListener('click', printBoard);
    els.recordVideo.addEventListener('click', recordAnimationVideo);
    els.dismissRotateHint.addEventListener('click', () => {
      els.rotateHint.classList.add('is-dismissed');
      try {
        Storage.nativeStore().setItem('psyzon_baba_tactics_rotate_hint_dismissed', '1');
      } catch (_) {}
    });

    document.addEventListener('keydown', keyboardHandler);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') pausePlayback();
    });
    window.addEventListener('resize', () => {
      if (!isMobileLayout()) closePanels();
      closeExportMenu();
    }, { passive: true });
    window.addEventListener('tactical-storage-error', (event) => {
      els.saveState?.classList.remove('is-saving', 'is-saved');
      if (els.saveState) els.saveState.querySelector('span').textContent = 'Falha ao salvar';
      showToast(event.detail?.message || 'Falha no armazenamento local.', 'error');
    });
    window.addEventListener('tactical-storage-saved', () => {
      els.saveState?.classList.remove('is-saving');
      els.saveState?.classList.add('is-saved');
      if (els.saveState) els.saveState.querySelector('span').textContent = 'Rascunho salvo';
    });
    window.addEventListener('pagehide', cleanup);
  }

  function cleanup() {
    pausePlayback();
    cancelAnimationFrame(ui.renderFrame);
    ui.renderFrame = null;
    clearLongPress();
    try {
      Storage.flushDraft(play);
    } catch (_) {}
  }

  function boot() {
    let savedTheme = 'light';
    try {
      savedTheme = Storage.nativeStore().getItem(THEME_KEY) || 'light';
    } catch (_) {}
    applyTheme(savedTheme);
    renderDefinitions();
    bindEvents();
    if (!play.stages.length) play.stages = [blankStage(0)];
    play.activeStage = clamp(play.activeStage, 0, play.stages.length - 1);
    if (!play.stages[play.activeStage].positions.length && play.entities.length) syncActiveStage();
    try {
      if (Storage.nativeStore().getItem('psyzon_baba_tactics_rotate_hint_dismissed') === '1') {
        els.rotateHint.classList.add('is-dismissed');
      }
    } catch (_) {}
    if (!Exporter.supportsRecording()) {
      els.recordVideo.disabled = true;
      els.recordVideo.title = 'Gravação WebM indisponível neste navegador';
    }
    const fullscreenSupported = typeof $('.tactical-center')?.requestFullscreen === 'function'
      || typeof $('.tactical-center')?.webkitRequestFullscreen === 'function';
    if (!fullscreenSupported) {
      [els.fullscreen, els.mobileFullscreen].forEach((button) => {
        if (!button) return;
        button.disabled = true;
        button.title = 'Tela cheia indisponível neste navegador';
      });
    }
    renderAll();
    markDirty();
    announce('Mesa Tática pronta para uso.');
  }

  boot();
})();
