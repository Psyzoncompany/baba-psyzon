(() => {
  'use strict';

  const SCHEMA = 'psyzon-baba-tactics';
  const VERSION = 1;
  const LIBRARY_KEY = 'psyzon_baba_tactics_library_v1';
  const DRAFT_KEY = 'psyzon_baba_tactics_draft_v1';
  const PREFERENCES_KEY = 'psyzon_baba_tactics_preferences_v1';
  const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

  const LIMITS = Object.freeze({
    entities: 40,
    drawings: 300,
    stages: 80,
    pointsPerDrawing: 16,
    id: 80,
    name: 120,
    description: 2_000,
    entityName: 80,
    entityNumber: 4,
    drawingText: 500,
    stageName: 80,
  });

  const ENTITY_TYPES = Object.freeze({
    player: 'player',
    jogador: 'player',
    ball: 'ball',
    bola: 'ball',
  });

  const POSITIONS = Object.freeze({
    goalkeeper: 'goleiro',
    goleiro: 'goleiro',
    gk: 'goleiro',
    fixo: 'fixo',
    ala: 'ala',
    pivo: 'pivo',
    'pivô': 'pivo',
    pivot: 'pivo',
    none: 'none',
    nenhum: 'none',
    '': 'none',
  });

  const TEAMS = Object.freeze({
    team1: 'team1',
    'team-1': 'team1',
    time1: 'team1',
    'time-1': 'team1',
    '1': 'team1',
    team2: 'team2',
    'team-2': 'team2',
    time2: 'team2',
    'time-2': 'team2',
    '2': 'team2',
    neutral: 'neutral',
    neutro: 'neutral',
    none: 'neutral',
    nenhum: 'neutral',
    '': 'neutral',
  });

  const CATEGORIES = Object.freeze({
    ataque: 'ataque',
    attack: 'ataque',
    defesa: 'defesa',
    defense: 'defesa',
    'bola-parada': 'bola-parada',
    'bola parada': 'bola-parada',
    setpiece: 'bola-parada',
    'set-piece': 'bola-parada',
    'contra-ataque': 'contra-ataque',
    'contra ataque': 'contra-ataque',
    counterattack: 'contra-ataque',
    'counter-attack': 'contra-ataque',
    'saida-pressao': 'saida-pressao',
    'saída-pressão': 'saida-pressao',
    'saida de pressao': 'saida-pressao',
    'saída de pressão': 'saida-pressao',
    'press-escape': 'saida-pressao',
    personalizada: 'personalizada',
    personalizado: 'personalizada',
    custom: 'personalizada',
  });

  const ORIENTATIONS = Object.freeze({
    horizontal: 'horizontal',
    landscape: 'horizontal',
    vertical: 'vertical',
    portrait: 'vertical',
  });

  const DRAWING_TYPES = Object.freeze({
    movement: 'movement',
    movimentacao: 'movement',
    'movimentação': 'movement',
    arrow: 'movement',
    seta: 'movement',
    pass: 'pass',
    passe: 'pass',
    shot: 'shot',
    finalizacao: 'shot',
    'finalização': 'shot',
    line: 'line',
    linha: 'line',
    continuous: 'line',
    'continuous-line': 'line',
    dashed: 'dashed',
    dotted: 'dashed',
    pontilhada: 'dashed',
    'dashed-line': 'dashed',
    curve: 'curve',
    curved: 'curve',
    curva: 'curve',
    'curved-path': 'curve',
    zone: 'zone',
    zona: 'zone',
    area: 'zone',
    'área': 'zone',
    text: 'text',
    texto: 'text',
    note: 'text',
    observacao: 'text',
    'observação': 'text',
    dribble: 'dribble',
    conducao: 'dribble',
    'condução': 'dribble',
    defense: 'defense',
    defensive: 'defense',
    marcacao: 'defense',
    'marcação': 'defense',
  });

  const DRAWING_TACTICS = Object.freeze({
    movement: 'movement',
    movimentacao: 'movement',
    'movimentação': 'movement',
    pass: 'pass',
    passe: 'pass',
    shot: 'shot',
    finalizacao: 'shot',
    'finalização': 'shot',
    dribble: 'dribble',
    conducao: 'dribble',
    'condução': 'dribble',
    defense: 'defense',
    marcacao: 'defense',
    'marcação': 'defense',
    neutral: 'neutral',
    neutro: 'neutral',
    none: 'neutral',
    '': 'neutral',
  });

  const LABEL_MODES = Object.freeze({
    name: 'name',
    nome: 'name',
    number: 'number',
    numero: 'number',
    'número': 'number',
    both: 'both',
    ambos: 'both',
  });

  const MOVEMENT_MODES = Object.freeze({
    move: 'move',
    movement: 'move',
    mover: 'move',
    follow: 'follow',
    acompanhar: 'follow',
    pass: 'pass',
    passe: 'pass',
    shot: 'shot',
    finalizacao: 'shot',
    'finalização': 'shot',
  });

  let draftTimer = null;
  let pendingDraft = null;

  class TacticalStorageError extends Error {
    constructor(message, code = 'storage-error', cause = null) {
      super(message);
      this.name = 'TacticalStorageError';
      this.code = code;
      if (cause) this.cause = cause;
    }
  }

  function nativeStore() {
    const store = window.__nativeLS || window.localStorage;
    if (!store
      || typeof store.getItem !== 'function'
      || typeof store.setItem !== 'function'
      || typeof store.removeItem !== 'function') {
      throw new TacticalStorageError(
        'O armazenamento local não está disponível neste navegador.',
        'storage-unavailable',
      );
    }
    return store;
  }

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(value);
      } catch (_) {
        // O estado normalizado contém somente valores serializáveis.
      }
    }
    return JSON.parse(JSON.stringify(value));
  }

  function now() {
    return Date.now();
  }

  function createId(prefix) {
    const suffix = window.crypto?.randomUUID?.()
      || `${now()}_${Math.random().toString(16).slice(2)}`;
    return `${prefix}_${suffix}`;
  }

  function cleanString(value, maxLength, fallback = '') {
    const text = String(value ?? fallback)
      .replace(/\u0000/g, '')
      .trim();
    return text.slice(0, maxLength);
  }

  function aliasKey(value) {
    return cleanString(value, 80).toLocaleLowerCase('pt-BR');
  }

  function allowedValue(value, aliases, fallback) {
    return aliases[aliasKey(value)] || fallback;
  }

  function safeId(value, prefix, usedIds = null) {
    const cleaned = cleanString(value, LIMITS.id)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    const base = cleaned || createId(prefix);
    if (!usedIds) return base;
    let candidate = base;
    let suffix = 2;
    while (usedIds.has(candidate)) {
      candidate = `${base.slice(0, Math.max(1, LIMITS.id - String(suffix).length - 1))}_${suffix}`;
      suffix += 1;
    }
    usedIds.add(candidate);
    return candidate;
  }

  function finiteNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max, fallback = min) {
    return Math.min(max, Math.max(min, finiteNumber(value, fallback)));
  }

  function coordinate(value, fallback = 0.5) {
    return Number(clamp(value, 0, 1, fallback).toFixed(6));
  }

  function integer(value, min, max, fallback = min) {
    return Math.round(clamp(value, min, max, fallback));
  }

  function timestamp(value, fallback = now()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
  }

  function normalizeColor(value, fallback) {
    const color = cleanString(value, 32);
    if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
    if (/^(?:rgb|hsl)a?\([\d\s.,%+-]+\)$/i.test(color)) return color;
    return fallback;
  }

  function parseObject(raw, label = 'jogada') {
    let parsed = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new TacticalStorageError(
          `Não foi possível ler a ${label}: o JSON é inválido.`,
          'invalid-json',
          error,
        );
      }
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new TacticalStorageError(
        `A ${label} não possui uma estrutura válida.`,
        'invalid-data',
      );
    }
    return parsed;
  }

  function entityCoordinates(entity) {
    const source = entity?.position && typeof entity.position === 'object'
      ? entity.position
      : entity;
    return {
      u: coordinate(source?.u ?? source?.x, 0.5),
      v: coordinate(source?.v ?? source?.y, 0.5),
    };
  }

  function normalizeEntity(entity, index, usedIds, entityIdMap) {
    const source = entity && typeof entity === 'object' && !Array.isArray(entity)
      ? entity
      : {};
    const originalId = cleanString(source.id, LIMITS.id);
    const type = allowedValue(source.type, ENTITY_TYPES, 'player');
    const id = safeId(originalId, type === 'ball' ? 'ball' : 'player', usedIds);
    if (originalId && !entityIdMap.has(originalId)) entityIdMap.set(originalId, id);
    entityIdMap.set(id, id);

    const team = type === 'ball'
      ? 'neutral'
      : allowedValue(source.team ?? source.teamId, TEAMS, index % 2 ? 'team2' : 'team1');
    const defaultColor = team === 'team2' ? '#2563eb' : team === 'team1' ? '#ef4444' : '#f8fafc';
    const coords = entityCoordinates(source);
    const numberValue = source.number ?? source.numero ?? '';

    return {
      id,
      type,
      name: cleanString(
        source.name ?? source.nome,
        LIMITS.entityName,
        type === 'ball' ? 'Bola' : `Jogador ${index + 1}`,
      ),
      number: type === 'ball' ? '' : cleanString(numberValue, LIMITS.entityNumber),
      position: type === 'ball'
        ? 'none'
        : allowedValue(source.position ?? source.posicao, POSITIONS, 'ala'),
      team,
      color: normalizeColor(source.color ?? source.cor, defaultColor),
      labelMode: allowedValue(source.labelMode ?? source.label, LABEL_MODES, 'both'),
      u: coords.u,
      v: coords.v,
      locked: Boolean(source.locked ?? source.bloqueado),
    };
  }

  function normalizePoint(point, fallbackU = 0.5, fallbackV = 0.5) {
    if (Array.isArray(point)) {
      return {
        u: coordinate(point[0], fallbackU),
        v: coordinate(point[1], fallbackV),
      };
    }
    const source = point && typeof point === 'object' ? point : {};
    return {
      u: coordinate(source.u ?? source.x, fallbackU),
      v: coordinate(source.v ?? source.y, fallbackV),
    };
  }

  function drawingPoints(source) {
    let points = Array.isArray(source.points)
      ? source.points
      : Array.isArray(source.path)
        ? source.path
        : [];
    if (!points.length && (source.start || source.end)) {
      points = [source.start, source.end].filter(Boolean);
    }
    return points
      .slice(0, LIMITS.pointsPerDrawing)
      .map((point) => normalizePoint(point));
  }

  function normalizeDrawing(drawing, usedIds, drawingIdMap, entityIdMap) {
    const source = drawing && typeof drawing === 'object' && !Array.isArray(drawing)
      ? drawing
      : {};
    const originalId = cleanString(source.id, LIMITS.id);
    const id = safeId(originalId, 'drawing', usedIds);
    if (originalId && !drawingIdMap.has(originalId)) drawingIdMap.set(originalId, id);
    drawingIdMap.set(id, id);

    const type = allowedValue(source.type ?? source.tool, DRAWING_TYPES, 'line');
    const tactic = allowedValue(
      source.tactic ?? source.action ?? source.intent ?? source.semantic,
      DRAWING_TACTICS,
      (
      ['movement', 'pass', 'shot', 'dribble', 'defense'].includes(type) ? type : 'neutral'
      ),
    );
    const defaultColor = tactic === 'pass'
      ? '#38bdf8'
      : tactic === 'shot'
        ? '#f43f5e'
        : tactic === 'defense'
          ? '#f59e0b'
          : tactic === 'dribble'
            ? '#a78bfa'
            : '#22c55e';

    return {
      id,
      type,
      tactic,
      points: drawingPoints(source),
      color: normalizeColor(source.color ?? source.stroke, defaultColor),
      fillColor: normalizeColor(source.fillColor ?? source.fill, `${defaultColor}33`),
      width: Number(clamp(source.width ?? source.strokeWidth, 0.5, 12, 2.5).toFixed(2)),
      opacity: Number(clamp(source.opacity, 0.05, 1, 1).toFixed(3)),
      dashed: Boolean(source.dashed ?? type === 'dashed'),
      closed: Boolean(source.closed ?? type === 'zone'),
      arrowEnd: Boolean(source.arrowEnd ?? ['movement', 'pass', 'shot', 'dribble'].includes(type)),
      text: cleanString(source.text ?? source.label, LIMITS.drawingText),
      linkedEntityId: mappedReference(
        source.linkedEntityId ?? source.entityId ?? source.attachedTo,
        entityIdMap,
      ),
      stageIndex: integer(source.stageIndex ?? source.stage, 0, LIMITS.stages - 1, 0),
      locked: Boolean(source.locked ?? source.bloqueado),
    };
  }

  function mappedReference(value, referenceMap) {
    const id = cleanString(value, LIMITS.id);
    if (!id) return null;
    return referenceMap.get(id) || null;
  }

  function stagePositionEntries(stage) {
    if (Array.isArray(stage.positions)) return stage.positions;
    if (Array.isArray(stage.entities)) return stage.entities;
    if (Array.isArray(stage.entityPositions)) return stage.entityPositions;

    const objectSource = stage.positions && typeof stage.positions === 'object'
      ? stage.positions
      : stage.entities && typeof stage.entities === 'object'
        ? stage.entities
        : stage.entityPositions && typeof stage.entityPositions === 'object'
          ? stage.entityPositions
          : null;
    if (!objectSource) return [];
    return Object.entries(objectSource).map(([entityId, position]) => ({
      ...(position && typeof position === 'object' ? position : {}),
      entityId,
    }));
  }

  function normalizeStagePosition(position, entityIdMap) {
    const source = position && typeof position === 'object' && !Array.isArray(position)
      ? position
      : {};
    const entityId = mappedReference(
      source.entityId ?? source.id ?? source.playerId,
      entityIdMap,
    );
    if (!entityId) return null;
    const coords = entityCoordinates(source);
    const path = (Array.isArray(source.path) ? source.path : [])
      .slice(0, LIMITS.pointsPerDrawing)
      .map((point) => normalizePoint(point));
    const attachedTo = mappedReference(
      source.attachedTo ?? source.followEntityId ?? source.ownerId,
      entityIdMap,
    );
    return {
      entityId,
      u: coords.u,
      v: coords.v,
      path,
      mode: allowedValue(source.mode, MOVEMENT_MODES, 'move'),
      attachedTo,
    };
  }

  function normalizeStage(stage, index, usedIds, entityIdMap, drawingIdMap) {
    const source = stage && typeof stage === 'object' && !Array.isArray(stage)
      ? stage
      : {};
    const id = safeId(source.id, 'stage', usedIds);
    const seenPositions = new Set();
    const positions = stagePositionEntries(source)
      .slice(0, LIMITS.entities)
      .map((position) => normalizeStagePosition(position, entityIdMap))
      .filter((position) => {
        if (!position || seenPositions.has(position.entityId)) return false;
        seenPositions.add(position.entityId);
        return true;
      });
    const rawDrawingIds = source.visibleDrawingIds
      ?? source.drawingIds
      ?? source.drawings
      ?? [];
    const visibleDrawingIds = Array.from(new Set(
      (Array.isArray(rawDrawingIds) ? rawDrawingIds : [])
        .map((value) => (
          typeof value === 'object' && value ? value.id : value
        ))
        .map((value) => mappedReference(value, drawingIdMap))
        .filter(Boolean),
    )).slice(0, LIMITS.drawings);

    return {
      id,
      name: cleanString(source.name ?? source.nome, LIMITS.stageName, `Etapa ${index + 1}`),
      duration: integer(source.duration ?? source.durationMs, 100, 60_000, 1_200),
      positions,
      visibleDrawingIds,
      ballOwnerId: mappedReference(
        source.ballOwnerId ?? source.ballOwner ?? source.possessorId,
        entityIdMap,
      ),
    };
  }

  function normalizePlay(raw, options = {}) {
    const source = parseObject(raw);
    if (source.schema != null && source.schema !== SCHEMA) {
      throw new TacticalStorageError(
        'Esta jogada pertence a um formato diferente da Mesa Tática.',
        'invalid-schema',
      );
    }
    if (source.version != null && Number(source.version) !== VERSION) {
      throw new TacticalStorageError(
        'Esta versão de jogada ainda não é compatível com a Mesa Tática.',
        'unsupported-version',
      );
    }

    const regenerateId = Boolean(options.regenerateId);
    const normalizedAt = now();
    const entityIds = new Set();
    const entityIdMap = new Map();
    const sourceEntities = (Array.isArray(source.entities) ? source.entities : [])
      .slice(0, LIMITS.entities)
    const entities = sourceEntities
      .map((entity, index) => normalizeEntity(entity, index, entityIds, entityIdMap));
    entities.forEach((entity, index) => {
      const entitySource = sourceEntities[index] && typeof sourceEntities[index] === 'object'
        ? sourceEntities[index]
        : {};
      entity.attachedTo = mappedReference(
        entitySource.attachedTo ?? entitySource.followEntityId ?? entitySource.ownerId,
        entityIdMap,
      );
    });

    const drawingIds = new Set();
    const drawingIdMap = new Map();
    const drawings = (Array.isArray(source.drawings) ? source.drawings : [])
      .slice(0, LIMITS.drawings)
      .map((drawing) => normalizeDrawing(
        drawing,
        drawingIds,
        drawingIdMap,
        entityIdMap,
      ));

    const stageIds = new Set();
    const stages = (Array.isArray(source.stages) ? source.stages : [])
      .slice(0, LIMITS.stages)
      .map((stage, index) => normalizeStage(
        stage,
        index,
        stageIds,
        entityIdMap,
        drawingIdMap,
      ));
    const lastStageIndex = Math.max(0, stages.length - 1);
    drawings.forEach((drawing) => {
      drawing.stageIndex = integer(drawing.stageIndex, 0, lastStageIndex, 0);
    });

    const createdAt = timestamp(source.createdAt, normalizedAt);
    const id = regenerateId
      ? createId('play')
      : safeId(source.id, 'play');

    return {
      schema: SCHEMA,
      version: VERSION,
      id,
      name: cleanString(source.name ?? source.nome, LIMITS.name, 'Jogada sem nome'),
      description: cleanString(
        source.description ?? source.descricao,
        LIMITS.description,
      ),
      category: allowedValue(source.category ?? source.categoria, CATEGORIES, 'personalizada'),
      orientation: allowedValue(source.orientation ?? source.orientacao, ORIENTATIONS, 'horizontal'),
      createdAt: regenerateId ? normalizedAt : createdAt,
      updatedAt: regenerateId ? normalizedAt : timestamp(source.updatedAt, createdAt),
      entities,
      drawings,
      stages,
      activeStage: stages.length
        ? integer(source.activeStage, 0, stages.length - 1, 0)
        : 0,
    };
  }

  function emptyLibrary() {
    return {
      schema: SCHEMA,
      version: VERSION,
      updatedAt: now(),
      plays: [],
    };
  }

  function friendlyStorageError(error, action) {
    if (error instanceof TacticalStorageError) return error;
    const signature = `${error?.name || ''} ${error?.code || ''} ${error?.message || ''}`.toLowerCase();
    const numericCode = Number(error?.code);
    if (signature.includes('quota')
      || signature.includes('storage_full')
      || numericCode === 22
      || numericCode === 1014) {
      return new TacticalStorageError(
        'O armazenamento local está cheio. Exporte jogadas importantes e remova itens antigos antes de tentar novamente.',
        'quota-exceeded',
        error,
      );
    }
    return new TacticalStorageError(
      `Não foi possível ${action} no armazenamento local.`,
      'storage-error',
      error,
    );
  }

  function readStoredJSON(key, label) {
    let raw;
    try {
      raw = nativeStore().getItem(key);
    } catch (error) {
      throw friendlyStorageError(error, `ler ${label}`);
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new TacticalStorageError(
        `Os dados de ${label} estão corrompidos. Importe um backup válido ou limpe esses dados locais.`,
        'invalid-json',
        error,
      );
    }
  }

  function writeStoredJSON(key, value, label) {
    try {
      nativeStore().setItem(key, JSON.stringify(value));
    } catch (error) {
      throw friendlyStorageError(error, `salvar ${label}`);
    }
  }

  function readLibrary() {
    const parsed = readStoredJSON(LIBRARY_KEY, 'jogadas salvas');
    if (!parsed) return emptyLibrary();
    if (!parsed
      || typeof parsed !== 'object'
      || Array.isArray(parsed)
      || parsed.schema !== SCHEMA
      || Number(parsed.version) !== VERSION
      || !Array.isArray(parsed.plays)) {
      throw new TacticalStorageError(
        'A biblioteca local de jogadas possui um formato incompatível.',
        'invalid-library',
      );
    }
    return {
      schema: SCHEMA,
      version: VERSION,
      updatedAt: timestamp(parsed.updatedAt),
      plays: parsed.plays.map((play) => normalizePlay(play)),
    };
  }

  function loadDraft() {
    const parsed = readStoredJSON(DRAFT_KEY, 'rascunho');
    return parsed ? clone(normalizePlay(parsed)) : null;
  }

  function reportAsyncDraftError(error) {
    const friendly = friendlyStorageError(error, 'salvar o rascunho');
    console.error(friendly.message, friendly);
    try {
      window.dispatchEvent(new CustomEvent('tactical-storage-error', {
        detail: {
          code: friendly.code,
          message: friendly.message,
        },
      }));
    } catch (_) {
      // O evento é apenas um canal opcional para a interface.
    }
  }

  function reportDraftSaved(play) {
    try {
      window.dispatchEvent(new CustomEvent('tactical-storage-saved', {
        detail: {
          id: play.id,
          updatedAt: play.updatedAt,
        },
      }));
    } catch (_) {
      // O evento é apenas um canal opcional para a interface.
    }
  }

  function scheduleDraft(play, delay = 450) {
    const normalized = normalizePlay(play);
    normalized.updatedAt = now();
    pendingDraft = clone(normalized);
    clearTimeout(draftTimer);
    draftTimer = window.setTimeout(() => {
      draftTimer = null;
      try {
        flushDraft();
      } catch (error) {
        reportAsyncDraftError(error);
      }
    }, integer(delay, 0, 10_000, 450));
    return clone(normalized);
  }

  function flushDraft(play) {
    clearTimeout(draftTimer);
    draftTimer = null;
    if (play !== undefined) pendingDraft = normalizePlay(play);
    if (!pendingDraft) return loadDraft();
    const normalized = normalizePlay(pendingDraft);
    normalized.updatedAt = now();
    writeStoredJSON(DRAFT_KEY, normalized, 'rascunho');
    pendingDraft = null;
    reportDraftSaved(normalized);
    return clone(normalized);
  }

  function clearDraft() {
    clearTimeout(draftTimer);
    draftTimer = null;
    pendingDraft = null;
    try {
      nativeStore().removeItem(DRAFT_KEY);
    } catch (error) {
      throw friendlyStorageError(error, 'limpar o rascunho');
    }
  }

  function list() {
    return readLibrary().plays
      .slice()
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(clone);
  }

  function save(play) {
    const envelope = readLibrary();
    const normalized = normalizePlay(play);
    const existingIndex = envelope.plays.findIndex((item) => item.id === normalized.id);
    const savedAt = now();
    if (existingIndex >= 0) {
      normalized.createdAt = envelope.plays[existingIndex].createdAt;
      normalized.updatedAt = savedAt;
      envelope.plays[existingIndex] = normalized;
    } else {
      normalized.createdAt = timestamp(normalized.createdAt, savedAt);
      normalized.updatedAt = savedAt;
      envelope.plays.push(normalized);
    }
    envelope.updatedAt = savedAt;
    writeStoredJSON(LIBRARY_KEY, envelope, 'a biblioteca de jogadas');
    return clone(normalized);
  }

  function get(id) {
    const normalizedId = safeId(id, 'play');
    const found = readLibrary().plays.find((play) => play.id === normalizedId);
    return found ? clone(found) : null;
  }

  function duplicate(id) {
    const original = get(id);
    if (!original) {
      throw new TacticalStorageError(
        'A jogada que você tentou duplicar não foi encontrada.',
        'not-found',
      );
    }
    const copy = normalizePlay(original, { regenerateId: true });
    copy.name = cleanString(`${original.name} (cópia)`, LIMITS.name);
    return save(copy);
  }

  function remove(id) {
    const normalizedId = safeId(id, 'play');
    const envelope = readLibrary();
    const nextPlays = envelope.plays.filter((play) => play.id !== normalizedId);
    if (nextPlays.length === envelope.plays.length) return false;
    envelope.plays = nextPlays;
    envelope.updatedAt = now();
    writeStoredJSON(LIBRARY_KEY, envelope, 'a biblioteca de jogadas');
    return true;
  }

  function assertImportedWhitelist(value, aliases, label, { optional = false } = {}) {
    if ((value === undefined || value === null || value === '') && optional) return;
    if (!Object.prototype.hasOwnProperty.call(aliases, aliasKey(value))) {
      throw new TacticalStorageError(
        `O arquivo importado contém ${label} não reconhecido.`,
        'invalid-import',
      );
    }
  }

  function validateImportedPlay(raw) {
    const source = parseObject(raw, 'jogada importada');
    if (source.schema !== SCHEMA || Number(source.version) !== VERSION) {
      throw new TacticalStorageError(
        'O arquivo não é uma jogada compatível da Mesa Tática.',
        'invalid-schema',
      );
    }
    if (!Array.isArray(source.entities)
      || !Array.isArray(source.drawings)
      || !Array.isArray(source.stages)) {
      throw new TacticalStorageError(
        'O arquivo não contém todos os dados obrigatórios da jogada.',
        'invalid-import',
      );
    }
    if (source.entities.length > LIMITS.entities
      || source.drawings.length > LIMITS.drawings
      || source.stages.length > LIMITS.stages) {
      throw new TacticalStorageError(
        'A jogada excede os limites seguros de entidades, desenhos ou etapas.',
        'import-limit',
      );
    }
    assertImportedWhitelist(source.category, CATEGORIES, 'uma categoria', { optional: true });
    assertImportedWhitelist(source.orientation, ORIENTATIONS, 'uma orientação', { optional: true });
    const ballCount = source.entities.filter((entity) => (
      entity
      && typeof entity === 'object'
      && !Array.isArray(entity)
      && allowedValue(entity.type, ENTITY_TYPES, 'player') === 'ball'
    )).length;
    if (ballCount > 1) {
      throw new TacticalStorageError(
        'A jogada importada possui mais de uma bola.',
        'invalid-import',
      );
    }
    source.entities.forEach((entity) => {
      if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
        throw new TacticalStorageError('O arquivo contém uma entidade inválida.', 'invalid-import');
      }
      assertImportedWhitelist(entity.type, ENTITY_TYPES, 'um tipo de entidade', { optional: true });
      assertImportedWhitelist(entity.position ?? entity.posicao, POSITIONS, 'uma posição', { optional: true });
      assertImportedWhitelist(entity.team ?? entity.teamId, TEAMS, 'um time', { optional: true });
    });
    source.drawings.forEach((drawing) => {
      if (!drawing || typeof drawing !== 'object' || Array.isArray(drawing)) {
        throw new TacticalStorageError('O arquivo contém um desenho inválido.', 'invalid-import');
      }
      assertImportedWhitelist(drawing.type ?? drawing.tool, DRAWING_TYPES, 'um tipo de desenho');
      assertImportedWhitelist(
        drawing.tactic ?? drawing.action ?? drawing.intent ?? drawing.semantic,
        DRAWING_TACTICS,
        'uma finalidade tática',
        { optional: true },
      );
      const points = Array.isArray(drawing.points)
        ? drawing.points
        : Array.isArray(drawing.path)
          ? drawing.path
          : [];
      if (points.length > LIMITS.pointsPerDrawing) {
        throw new TacticalStorageError(
          'Um desenho do arquivo possui pontos demais.',
          'import-limit',
        );
      }
    });
    return normalizePlay(source);
  }

  function readFileText(file) {
    if (typeof file.text === 'function') return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo.'));
      reader.readAsText(file, 'utf-8');
    });
  }

  async function parseImportedFile(file) {
    if (!file || typeof file !== 'object') {
      throw new TacticalStorageError(
        'Selecione um arquivo JSON de jogada.',
        'missing-file',
      );
    }
    const size = Number(file.size || 0);
    if (size <= 0) {
      throw new TacticalStorageError('O arquivo selecionado está vazio.', 'empty-file');
    }
    if (size > MAX_IMPORT_BYTES) {
      throw new TacticalStorageError(
        'O arquivo excede o limite de 5 MB.',
        'file-too-large',
      );
    }
    const filename = cleanString(file.name, 255).toLowerCase();
    const type = cleanString(file.type, 100).toLowerCase();
    if (filename && !filename.endsWith('.json')) {
      throw new TacticalStorageError(
        'Use um arquivo com extensão .json.',
        'invalid-file-type',
      );
    }
    if (type && ![
      'application/json',
      'text/json',
      'text/plain',
      'application/octet-stream',
    ].includes(type)) {
      throw new TacticalStorageError(
        'O tipo do arquivo selecionado não é compatível com JSON.',
        'invalid-file-type',
      );
    }

    let text;
    try {
      text = await readFileText(file);
    } catch (error) {
      throw new TacticalStorageError(
        'Não foi possível ler o arquivo selecionado.',
        'file-read-error',
        error,
      );
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new TacticalStorageError(
        'O arquivo não contém um JSON válido.',
        'invalid-json',
        error,
      );
    }

    const container = parseObject(parsed, 'jogada importada');
    if (container.play !== undefined) {
      if (container.schema !== SCHEMA || Number(container.version) !== VERSION) {
        throw new TacticalStorageError(
          'O arquivo exportado possui um formato incompatível.',
          'invalid-schema',
        );
      }
      return clone(validateImportedPlay(container.play));
    }
    return clone(validateImportedPlay(container));
  }

  function exportJSON(play) {
    const normalized = normalizePlay(play);
    const payload = {
      schema: SCHEMA,
      version: VERSION,
      exportedAt: now(),
      play: normalized,
    };
    return new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: 'application/json;charset=utf-8' },
    );
  }

  function slugify(value) {
    const slug = cleanString(value, 120, 'jogada')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '');
    return slug || 'jogada';
  }

  function downloadBlob(blob, filename) {
    if (!(blob instanceof Blob)) {
      throw new TacticalStorageError(
        'O conteúdo preparado para download é inválido.',
        'invalid-blob',
      );
    }
    const requestedName = cleanString(filename, 180, 'jogada.json')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-');
    const safeFilename = requestedName || 'jogada.json';
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safeFilename;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    return safeFilename;
  }

  window.TacticalStorage = Object.freeze({
    schema: SCHEMA,
    version: VERSION,
    keys: Object.freeze({
      library: LIBRARY_KEY,
      draft: DRAFT_KEY,
      preferences: PREFERENCES_KEY,
    }),
    limits: LIMITS,
    nativeStore,
    normalizePlay,
    loadDraft,
    scheduleDraft,
    flushDraft,
    clearDraft,
    list,
    save,
    get,
    duplicate,
    remove,
    parseImportedFile,
    exportJSON,
    downloadBlob,
    slugify,
  });
})();
