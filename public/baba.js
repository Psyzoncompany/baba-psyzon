(() => {
  const STORAGE_KEY = 'psyzon_baba_state_v1';
  const ADMIN_PASSWORD = '153090';
  const TEAM_NAMES = ['Barcelona', 'Arsenal', 'Real Madrid', 'PSG', 'Chelsea'];
  const MODE_KEY = 'psyzon_baba_mode';
  const REMEMBER_ORGANIZER_KEY = 'psyzon_baba_organizer_remembered';
  const VISITOR_TEAM_ID = 'team_visitante';
  const VISITOR_TEAM_NAME = 'Visitante';
  const EXTERNAL_GOAL_SCORER_ID = '__external_goal_scorer__';
  const PLAYER_BABA_PRICE = 15;
  const GOALKEEPER_BABA_PRICE = 7;
  const PAYMENT_DUE_DAY = 30;
  const GOAL_PRIORITIES = [
    { id: 'alta', label: 'Alta', value: 3 },
    { id: 'media', label: 'Media', value: 2 },
    { id: 'baixa', label: 'Baixa', value: 1 },
  ];
  const RANKING_MODES = [
    { id: 'goals', label: 'Gols', icon: 'baba-ball' },
    { id: 'wins', label: 'Vitorias', icon: 'baba-check' },
    { id: 'losses', label: 'Derrotas', icon: 'baba-x' },
    { id: 'titles', label: 'Titulos', icon: 'baba-trophy' },
    { id: 'efficiency', label: 'Aproveitamento', icon: 'baba-chart' },
  ];
  const PDF_ROW_LIMITS = {
    payments: 18,
    standings: 12,
    currentHistory: 24,
    dailyScorers: 26,
    rankings: 8,
    goalkeeper: 8,
  };
  const BABA_ASSISTANT_QUICK_QUESTIONS = [
    'Quem fez mais gols?',
    'Quem mais ganhou?',
    'Quem e o melhor jogador?',
    'Quem esta em melhor fase?',
    'Quem ainda nao pagou?',
    'Compare dois jogadores',
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const els = {
    gateway: $('#mode-gateway'),
    app: $('#baba-app'),
    enterOrganizer: $('#enter-organizer-btn'),
    enterPlayer: $('#enter-player-btn'),
    passwordForm: $('#organizer-password-form'),
    passwordInput: $('#organizer-password'),
    passwordFeedback: $('#password-feedback'),
    rememberOrganizer: $('#remember-organizer-password'),
    closePassword: $('#close-organizer-password'),
    modeReset: $('#mode-reset-btn'),
    logoutBtn: $('#baba-logout-btn'),
    moreToggle: $('#baba-more-toggle'),
    moreMenu: $('#baba-more-menu'),
    headerManage: $('[data-header-tab="organizer"]'),
    createToday: $('#create-today-btn'),
    saveHistory: $('#save-history-btn'),
    dateInput: $('#baba-date-input'),
    dateDisplay: $('#baba-date-display'),
    markPresent: $('#mark-present-btn'),
    drawTeams: $('#draw-teams-btn'),
    startFirstGame: $('#start-first-game-btn'),
    undoGame: $('#undo-game-btn'),
    finishBaba: $('#finish-baba-btn'),
    resetCurrent: $('#reset-current-btn'),
    playerForm: $('#player-form'),
    playerName: $('#player-name'),
    playerType: $('#player-type'),
    playersAdminList: $('#players-admin-list'),
    presentList: $('#present-list'),
    presentCountLabel: $('#present-count-label'),
    activeStatus: $('#active-status-label'),
    activeSubtitle: $('#active-baba-subtitle'),
    fieldTeamA: $('#field-team-a'),
    fieldTeamB: $('#field-team-b'),
    liveScore: $('#live-score'),
    metricPresent: $('#metric-present'),
    metricTeams: $('#metric-teams'),
    metricGames: $('#metric-games'),
    metricNextTeam: $('#metric-next-team'),
    matchNumberPill: $('#match-number-pill'),
    currentMatchPanel: $('#current-match-panel'),
    queueList: $('#queue-list'),
    standingsList: $('#standings-list'),
    tableTopScorers: $('#table-top-scorers'),
    dailyTopScorers: $('#daily-top-scorers'),
    currentGamesList: $('#current-games-list'),
    lastResultPill: $('#last-result-pill'),
    lastResultPanel: $('#last-result-panel'),
    teamsGrid: $('#teams-grid'),
    rankingList: $('#ranking-list'),
    dailyRankingList: $('#daily-ranking-list'),
    rankingFilterControls: $('#ranking-filter-controls'),
    monthlyRankingLabel: $('#monthly-ranking-label'),
    monthlyRankingList: $('#monthly-ranking-list'),
    goalkeeperRankingList: $('#goalkeeper-ranking-list'),
    goalForm: $('#goal-form'),
    goalFormTitle: $('#goal-form-title'),
    goalFormSubtitle: $('#goal-form-subtitle'),
    goalSubmit: $('#goal-submit-btn'),
    goalCancelEdit: $('#goal-cancel-edit-btn'),
    goalImage: $('#goal-image'),
    goalImagePreview: $('#goal-image-preview'),
    goalName: $('#goal-name'),
    goalDescription: $('#goal-description'),
    goalPriority: $('#goal-priority'),
    goalTarget: $('#goal-target'),
    goalCollected: $('#goal-collected'),
    goalsSummary: $('#goals-summary'),
    goalsCountLabel: $('#goals-count-label'),
    goalsList: $('#goals-list'),
    paymentSummary: $('#payment-summary'),
    paymentList: $('#payment-list'),
    monthlyHistoryTabs: $('#monthly-history-tabs'),
    monthlyHistoryRanking: $('#monthly-history-ranking'),
    historyList: $('#history-list'),
    historyCountLabel: $('#history-count-label'),
    historyDetail: $('#history-detail'),
    historyDetailLabel: $('#history-detail-label'),
    toast: $('#baba-toast'),
    shareFab: $('#baba-share-fab'),
    presentModal: $('#present-modal'),
    closePresentModal: $('#close-present-modal'),
    goalModal: $('#goal-modal'),
    goalModalTitle: $('#goal-modal-title'),
    goalPlayerList: $('#goal-player-list'),
    closeGoalModal: $('#close-goal-modal'),
    teamDetailModal: $('#team-detail-modal'),
    teamDetailTitle: $('#team-detail-title'),
    teamDetailList: $('#team-detail-list'),
    closeTeamDetailModal: $('#close-team-detail-modal'),
    gameDetailModal: $('#game-detail-modal'),
    gameDetailTitle: $('#game-detail-title'),
    gameDetailList: $('#game-detail-list'),
    closeGameDetailModal: $('#close-game-detail-modal'),
  };

  let state = readState();
  let mode = null;
  let selectedHistoryId = null;
  let selectedMonthlyKey = null;
  let rankingMode = 'goals';
  const expandedRankingKeys = new Set();
  const loadingHistoryIds = new Set();
  let toastTimer = null;
  let goalTeamId = null;
  let editingGoalId = null;
  let timerTick = null;
  let hasBooted = false;
  let tabsStickySentinel = null;
  let tabsScrollFrame = null;
  const babaAssistant = {
    wired: false,
    open: false,
    typing: false,
    messages: [],
    context: {
      players: [],
      topic: '',
      period: '',
    },
    els: {},
  };

  function newId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function todayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function currentPaymentMonthKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function paymentMonthLabel(key = currentPaymentMonthKey()) {
    const [year, month] = String(key).split('-').map(Number);
    if (!year || !month) return 'mes atual';
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
  }

  function paymentDueDateLabel(key = currentPaymentMonthKey()) {
    const [year, month] = String(key).split('-').map(Number);
    if (!year || !month) return `todo dia ${PAYMENT_DUE_DAY}`;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(year, month - 1, PAYMENT_DUE_DAY));
  }

  function formatDate(iso) {
    if (!iso) return '-';
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  }

  function formatTime(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function parseMoneyValue(value) {
    const normalized = String(value ?? '')
      .trim()
      .replace(/\s/g, '')
      .replace(/[R$]/gi, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.');
    const number = Number(normalized);
    return Number.isFinite(number) && number > 0 ? Number(number.toFixed(2)) : 0;
  }

  function normalizeGoalPriority(value) {
    const normalized = String(value || '').toLowerCase();
    if (['alta', 'high', '3'].includes(normalized)) return 'alta';
    if (['baixa', 'low', '1'].includes(normalized)) return 'baixa';
    return 'media';
  }

  function goalPriorityMeta(value) {
    const id = normalizeGoalPriority(value);
    return GOAL_PRIORITIES.find((priority) => priority.id === id) || GOAL_PRIORITIES[1];
  }

  function formatBabaDateLong(iso) {
    const value = iso || todayISO();
    const [year, month, day] = String(value).split('-').map(Number);
    if (!year || !month || !day) return value;
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function getRemainingSeconds(match) {
    if (!match) return 8 * 60;
    const base = Number(match.timerRemainingSeconds ?? match.durationSeconds ?? 8 * 60);
    if (!match.timerRunning || !match.timerStartedAt) return Math.max(0, base);
    const elapsed = Math.floor((Date.now() - match.timerStartedAt) / 1000);
    return Math.max(0, base - elapsed);
  }

  function formatCountdown(seconds) {
    const safe = Math.max(0, Number(seconds || 0));
    const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
    const rest = String(safe % 60).padStart(2, '0');
    return `${minutes}:${rest}`;
  }

  function renderTimerOnly() {
    const baba = getActiveBaba();
    const match = baba?.jogoAtual;
    const timerEl = $('#current-timer');
    if (!timerEl || !match) return;
    const remaining = getRemainingSeconds(match);
    if (remaining === 0 && match.timerRunning) {
      match.timerRunning = false;
      match.timerRemainingSeconds = 0;
      match.timerStartedAt = null;
      render();
      return;
    }
    const isPrepared = !match.timerRunning && !match.iniciadoEm;
    const timerText = timerEl.querySelector('.baba-timer__text');
    const nextText = isPrepared ? 'Aguardando inicio' : (remaining ? formatCountdown(remaining) : 'Tempo esgotado');
    if (timerText) timerText.textContent = nextText;
    else timerEl.textContent = nextText;
    timerEl.classList.toggle('is-over', remaining === 0 && !isPrepared);
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function shuffle(items) {
    const list = [...items];
    for (let index = list.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [list[index], list[randomIndex]] = [list[randomIndex], list[index]];
    }
    return list;
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createEmptyState();
      const parsed = JSON.parse(raw);
      return normalizeState(parsed);
    } catch (error) {
      console.warn('Falha ao ler estado do Baba:', error);
      return createEmptyState();
    }
  }

  function createEmptyState() {
    return {
      version: 1,
      activeBabaId: null,
      players: [],
      babas: [],
      purchaseGoals: [],
      monthlyPayments: {},
      updatedAt: Date.now(),
    };
  }

  function normalizeMonthlyPayments(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return Object.entries(source).reduce((records, [key, record]) => {
      if (!/^\d{4}-\d{2}$/.test(String(key))) return records;
      const safe = record && typeof record === 'object' ? record : {};
      records[key] = {
        pagamentos: safe.pagamentos && typeof safe.pagamentos === 'object' && !Array.isArray(safe.pagamentos) ? safe.pagamentos : {},
        atualizadoEm: Number(safe.atualizadoEm || safe.updatedAt || Date.now()),
      };
      return records;
    }, {});
  }

  function normalizePurchaseGoal(goal) {
    const safe = goal && typeof goal === 'object' ? goal : {};
    const nome = String(safe.nome || safe.name || '').trim();
    const descricao = String(safe.descricao || safe.description || '').trim();
    const valor = parseMoneyValue(safe.valor ?? safe.target ?? safe.meta);
    const arrecadado = parseMoneyValue(safe.arrecadado ?? safe.collected ?? safe.valorArrecadado);
    const foto = String(safe.foto || safe.image || safe.imageData || '').trim();
    const prioridade = normalizeGoalPriority(safe.prioridade ?? safe.priority);
    if (!nome && !descricao && !valor && !arrecadado && !foto) return null;
    return {
      id: safe.id || newId('goal'),
      nome: nome || 'Meta sem nome',
      descricao,
      prioridade,
      valor,
      arrecadado,
      foto,
      criadoEm: Number(safe.criadoEm || safe.createdAt || Date.now()),
      atualizadoEm: Number(safe.atualizadoEm || safe.updatedAt || Date.now()),
    };
  }

  function createUndoSnapshot(baba) {
    return {
      schemaVersion: 2,
      teams: JSON.parse(JSON.stringify(baba.teams || [])),
      filaTimes: [...(baba.filaTimes || [])],
      jogoAtual: baba.jogoAtual ? JSON.parse(JSON.stringify(baba.jogoAtual)) : null,
      jogosLength: (baba.jogos || []).length,
      lastResult: baba.lastResult ? JSON.parse(JSON.stringify(baba.lastResult)) : null,
      pendingTieBreak: baba.pendingTieBreak ? JSON.parse(JSON.stringify(baba.pendingTieBreak)) : null,
      status: baba.status,
      teamRevealIndex: Number(baba.teamRevealIndex || 0),
      campeaoDoBaba: baba.campeaoDoBaba ? JSON.parse(JSON.stringify(baba.campeaoDoBaba)) : null,
      finalizadoEm: baba.finalizadoEm || null,
      createdAt: Date.now(),
    };
  }

  function normalizeUndoStack(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-10).map((entry) => {
      if (entry?.schemaVersion === 2) return entry;
      try {
        const legacyBaba = typeof entry === 'string' ? JSON.parse(entry) : entry;
        return legacyBaba && typeof legacyBaba === 'object' ? createUndoSnapshot(legacyBaba) : null;
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
  }

  function normalizeState(value) {
    const next = value && typeof value === 'object' ? value : createEmptyState();
    next.version = 1;
    next.players = Array.isArray(next.players) ? next.players : [];
    next.babas = Array.isArray(next.babas) ? next.babas : [];
    next.monthlyPayments = normalizeMonthlyPayments(next.monthlyPayments);
    next.purchaseGoals = Array.isArray(next.purchaseGoals)
      ? next.purchaseGoals.map(normalizePurchaseGoal).filter(Boolean)
      : [];
    next.babas.forEach((baba) => {
      baba.visitantes = Array.isArray(baba.visitantes) ? baba.visitantes : [];
      baba.pagamentos = baba.pagamentos && typeof baba.pagamentos === 'object' && !Array.isArray(baba.pagamentos) ? baba.pagamentos : {};
      baba.undoStack = normalizeUndoStack(baba.undoStack);
    });
    const currentMonth = currentPaymentMonthKey();
    const activeBaba = next.babas.find((baba) => baba.id === next.activeBabaId);
    if (!next.monthlyPayments[currentMonth] && activeBaba?.pagamentos && Object.keys(activeBaba.pagamentos).length) {
      next.monthlyPayments[currentMonth] = {
        pagamentos: { ...activeBaba.pagamentos },
        atualizadoEm: Date.now(),
      };
    }
    next.activeBabaId = next.activeBabaId || null;
    next.updatedAt = next.updatedAt || Date.now();
    return next;
  }

  function saveState(message) {
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
    if (message) showToast(message);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 3200);
  }

  function getActiveBaba() {
    return state.babas.find((baba) => baba.id === state.activeBabaId) || null;
  }

  function getBabaById(id) {
    return state.babas.find((baba) => baba.id === id) || null;
  }

  function getPlayer(id) {
    return state.players.find((player) => player.id === id) || null;
  }

  function getVisitor(baba, id) {
    return (baba?.visitantes || []).find((player) => player.id === id) || null;
  }

  function getBabaPlayer(baba, id) {
    return getPlayer(id) || getVisitor(baba, id);
  }

  function getTeam(baba, id) {
    return baba?.teams?.find((team) => team.id === id) || null;
  }

  function teamOrderValue(team) {
    if (!team) return 9999;
    if (team.id === VISITOR_TEAM_ID || team.tipo === 'visitante') return 9998;
    const match = String(team.id || '').match(/^team_(\d+)$/);
    return match ? Number(match[1]) : 9997;
  }

  function getSequentialTeamIds(teams = []) {
    return [...teams]
      .sort((a, b) => teamOrderValue(a) - teamOrderValue(b) || String(a.name || '').localeCompare(String(b.name || '')))
      .map((team) => team.id);
  }

  function makeEmptyTeam(id, name, extra = {}) {
    return {
      id,
      name,
      jogadores: [],
      pontos: 0,
      golsPro: 0,
      golsContra: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      ...extra,
    };
  }

  function ensureVisitorTeam(baba) {
    if (!baba) return null;
    baba.visitantes = Array.isArray(baba.visitantes) ? baba.visitantes : [];
    if (!baba.visitantes.length) return null;
    baba.teams = Array.isArray(baba.teams) ? baba.teams : [];
    let team = getTeam(baba, VISITOR_TEAM_ID);
    if (!team) {
      team = makeEmptyTeam(VISITOR_TEAM_ID, VISITOR_TEAM_NAME, { tipo: 'visitante' });
      baba.teams.push(team);
    }
    team.name = VISITOR_TEAM_NAME;
    team.tipo = 'visitante';
    team.jogadores = baba.visitantes.map((player) => player.id);
    const inCurrentMatch = [baba.jogoAtual?.timeA, baba.jogoAtual?.timeB].includes(team.id);
    if (!inCurrentMatch && baba.teams.length >= 2 && !(baba.filaTimes || []).includes(team.id)) {
      baba.filaTimes = [...(baba.filaTimes || []), team.id];
    }
    return team;
  }

  function removeVisitorTeamIfEmpty(baba) {
    if (!baba || (baba.visitantes || []).length) return;
    baba.teams = (baba.teams || []).filter((team) => team.id !== VISITOR_TEAM_ID);
    baba.filaTimes = (baba.filaTimes || []).filter((id) => id !== VISITOR_TEAM_ID);
  }

  function visitorTeamHasGames(baba) {
    return (baba?.jogos || []).some((game) => game.timeA === VISITOR_TEAM_ID || game.timeB === VISITOR_TEAM_ID);
  }

  function monthKeyFromISO(iso) {
    if (!iso || !String(iso).includes('-')) return '';
    return String(iso).slice(0, 7);
  }

  function monthLabel(key) {
    if (!key) return 'Mes atual';
    const [year, month] = key.split('-').map(Number);
    if (!year || !month) return key;
    return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  function activeMonthKey(baba = getActiveBaba()) {
    return monthKeyFromISO(baba?.dataISO || todayISO());
  }

  function teamNamesFromValue(baba, value) {
    return String(value || '')
      .split(',')
      .map((id) => getTeam(baba, id)?.name)
      .filter(Boolean)
      .join(', ') || '-';
  }

  function teamDetailButton(baba, team, fallback = 'Time') {
    if (!team) return escapeHTML(fallback);
    return `<button class="baba-team-link" type="button" data-team-detail-id="${team.id}" data-team-detail-baba-id="${baba?.id || ''}">${escapeHTML(team.name)}</button>`;
  }

  function teamButtonsFromValue(baba, value) {
    const buttons = String(value || '')
      .split(',')
      .map((id) => getTeam(baba, id))
      .filter(Boolean)
      .map((team) => teamDetailButton(baba, team));
    return buttons.length ? buttons.join(', ') : '-';
  }

  function teamLabel(team) {
    return team?.name || 'Aguardando';
  }

  function scoreState(scoreA, scoreB) {
    const a = Number(scoreA || 0);
    const b = Number(scoreB || 0);
    if (a === b) return ['draw', 'draw'];
    return a > b ? ['win', 'loss'] : ['loss', 'win'];
  }

  function scoreBadgeHTML(scoreA, scoreB, compact = false) {
    const [stateA, stateB] = scoreState(scoreA, scoreB);
    return `
      <span class="baba-score-boxes ${compact ? 'baba-score-boxes--compact' : ''}" aria-label="Placar ${Number(scoreA || 0)} a ${Number(scoreB || 0)}">
        <b class="baba-score-box baba-score-box--${stateA}">${Number(scoreA || 0)}</b>
        <span>x</span>
        <b class="baba-score-box baba-score-box--${stateB}">${Number(scoreB || 0)}</b>
      </span>
    `;
  }

  function matchLineHTML(baba, teamA, scoreA, scoreB, teamB, compact = false) {
    return `
      <span class="baba-match-line ${compact ? 'baba-match-line--compact' : ''}">
        ${teamDetailButton(baba, teamA, teamA?.name || 'Time')}
        ${scoreBadgeHTML(scoreA, scoreB, compact)}
        ${teamDetailButton(baba, teamB, teamB?.name || 'Time')}
      </span>
    `;
  }

  function resultStatusLabel(record = {}) {
    if (record.criterioDesempate === 'impar_par') {
      return record.timeQueContinuou ? 'Empate: definido no impar/par' : 'Empate: aguardando impar/par';
    }
    if (record.decididoPorSorteio) return 'Empate: rodizio definido por sorteio';
    if (record.empate || record.resultado === 'empate') return 'Empate';
    return 'Resultado normal';
  }

  function getPendingTieBreakRoute(baba, pending = baba?.pendingTieBreak) {
    const tiedTeamIds = (pending?.tiedTeams || []).filter((id) => getTeam(baba, id));
    const tiedTeams = tiedTeamIds.map((id) => getTeam(baba, id)).filter(Boolean);
    const sourceQueue = [...(pending?.queue || baba?.filaTimes || [])].filter(Boolean);
    const nextTeamId = sourceQueue.find((id) => !tiedTeamIds.includes(id)) || null;
    const remainingQueue = sourceQueue.filter((id) => id !== nextTeamId);
    return {
      tiedTeamIds,
      tiedTeams,
      nextTeamId,
      nextTeam: getTeam(baba, nextTeamId),
      remainingQueue,
    };
  }

  function playerName(id, baba = getActiveBaba()) {
    return getBabaPlayer(baba, id)?.nome || 'Jogador removido';
  }

  function hasPaymentRecord(baba, playerId) {
    return Boolean(baba?.pagamentos && Object.prototype.hasOwnProperty.call(baba.pagamentos, playerId));
  }

  function getMonthlyPaymentRecord(key = currentPaymentMonthKey()) {
    state.monthlyPayments = state.monthlyPayments && typeof state.monthlyPayments === 'object' && !Array.isArray(state.monthlyPayments)
      ? state.monthlyPayments
      : {};
    if (!state.monthlyPayments[key]) {
      state.monthlyPayments[key] = { pagamentos: {}, atualizadoEm: Date.now() };
    }
    const record = state.monthlyPayments[key];
    record.pagamentos = record.pagamentos && typeof record.pagamentos === 'object' && !Array.isArray(record.pagamentos)
      ? record.pagamentos
      : {};
    record.atualizadoEm = Number(record.atualizadoEm || Date.now());
    return record;
  }

  function hasMonthlyPaymentRecord(playerId, key = currentPaymentMonthKey()) {
    const record = state.monthlyPayments?.[key];
    return Boolean(record?.pagamentos && Object.prototype.hasOwnProperty.call(record.pagamentos, playerId));
  }

  function isPlayerPaidThisMonth(playerId, baba = getActiveBaba()) {
    const key = currentPaymentMonthKey();
    if (hasMonthlyPaymentRecord(playerId, key)) return Boolean(state.monthlyPayments[key].pagamentos[playerId]);
    return Boolean(baba?.pagamentos?.[playerId]);
  }

  function playerAppearsInBaba(baba, playerId) {
    if (!baba || !playerId) return false;
    return (baba.jogadoresPresentes || []).includes(playerId)
      || (baba.visitantes || []).some((player) => player.id === playerId)
      || (baba.teams || []).some((team) => (team.jogadores || []).includes(playerId))
      || hasPaymentRecord(baba, playerId);
  }

  function playerPaymentState(playerId, baba = getActiveBaba(), { force = false } = {}) {
    if (!playerId) return null;
    const key = currentPaymentMonthKey();
    if (hasMonthlyPaymentRecord(playerId, key)) return state.monthlyPayments[key].pagamentos[playerId] ? 'paid' : 'unpaid';
    if (hasPaymentRecord(baba, playerId)) return baba.pagamentos[playerId] ? 'paid' : 'unpaid';
    return force || getPlayer(playerId) || playerAppearsInBaba(baba, playerId) ? 'unpaid' : null;
  }

  function playerPaymentNameHTML(playerId, baba = getActiveBaba(), options = {}) {
    const name = options.name || playerName(playerId, baba);
    const state = playerPaymentState(playerId, baba, options);
    if (!state) return escapeHTML(name);
    const label = state === 'paid' ? 'Pago' : 'Nao pagou';
    return `
      <span class="baba-player-payment is-${state}">
        <span class="baba-player-payment__name">${escapeHTML(name)}</span>
        <span class="baba-player-payment__status">${label}</span>
      </span>
    `;
  }

  function isOrganizer() {
    return mode === 'organizer';
  }

  function isForcedViewerMode() {
    const params = new URLSearchParams(window.location.search);
    const view = String(params.get('view') || params.get('modo') || '').toLowerCase();
    return ['player', 'viewer', 'visualizador', 'jogador'].includes(view) || params.has('publico') || params.has('share');
  }

  function requireOrganizer() {
    if (!isOrganizer()) {
      showToast('Apenas o organizador pode alterar o Baba.');
      return false;
    }
    return true;
  }

  function hasRememberedOrganizerAccess() {
    return localStorage.getItem(REMEMBER_ORGANIZER_KEY) === ADMIN_PASSWORD;
  }

  function rememberOrganizerAccess(remember) {
    if (remember) localStorage.setItem(REMEMBER_ORGANIZER_KEY, ADMIN_PASSWORD);
    else localStorage.removeItem(REMEMBER_ORGANIZER_KEY);
  }

  function openOrganizerPassword() {
    const remembered = hasRememberedOrganizerAccess();
    els.passwordForm.classList.remove('hidden');
    document.body.classList.add('baba-password-is-open');
    els.passwordInput.value = remembered ? ADMIN_PASSWORD : '';
    if (els.rememberOrganizer) els.rememberOrganizer.checked = remembered;
    els.passwordFeedback.textContent = '';
    window.setTimeout(() => {
      els.passwordInput.focus();
      if (remembered) els.passwordInput.select();
    }, 40);
  }

  function closeOrganizerPassword() {
    els.passwordForm.classList.add('hidden');
    document.body.classList.remove('baba-password-is-open');
    els.passwordInput.value = '';
    els.passwordFeedback.textContent = '';
  }

  function setMode(nextMode) {
    mode = nextMode;
    sessionStorage.setItem(MODE_KEY, nextMode);
    document.body.classList.add('baba-app-mode');
    document.body.classList.toggle('baba-player-mode', nextMode === 'player');
    document.body.classList.toggle('baba-locked-viewer', isForcedViewerMode());
    els.gateway.classList.add('hidden');
    els.app.classList.remove('hidden');
    closeOrganizerPassword();
    if (nextMode === 'player') setActiveTab('dashboard');
    render();
  }

  function resetMode() {
    mode = null;
    sessionStorage.removeItem(MODE_KEY);
    document.body.classList.remove('baba-app-mode');
    document.body.classList.remove('baba-player-mode');
    document.body.classList.remove('baba-locked-viewer');
    els.gateway.classList.remove('hidden');
    els.app.classList.add('hidden');
    closeOrganizerPassword();
    if (els.rememberOrganizer) els.rememberOrganizer.checked = hasRememberedOrganizerAccess();
  }

  function logout() {
    showToast('O Baba permanece aberto neste link.');
  }

  function createBaba(dateISO = todayISO()) {
    if (!requireOrganizer()) return;
    const current = getActiveBaba();
    if (current && current.status !== 'finalizado') {
      const ok = confirm('Ja existe um baba aberto. Criar outro vai trocar o baba ativo. Continuar?');
      if (!ok) return;
    }

    const [year, month, day] = dateISO.split('-').map(Number);
    const baba = {
      id: newId('baba'),
      dataISO: dateISO,
      dataCompleta: formatDate(dateISO),
      dia: day,
      mes: month,
      ano: year,
      status: 'aberto',
      jogadoresPresentes: [],
      visitantes: [],
      pagamentos: {},
      teams: [],
      filaTimes: [],
      jogoAtual: null,
      jogos: [],
      rankingDoBaba: {},
      campeaoDoBaba: null,
      lastResult: null,
      pendingTieBreak: null,
      teamRevealIndex: 0,
      undoStack: [],
      criadoEm: Date.now(),
      finalizadoEm: null,
    };

    state.babas.unshift(baba);
    state.activeBabaId = baba.id;
    saveState('Baba de hoje criado com data automatica.');
    setActiveTab('organizer');
  }

  function updateBabaDate() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    const dateISO = els.dateInput.value || todayISO();
    const [year, month, day] = dateISO.split('-').map(Number);
    Object.assign(baba, {
      dataISO: dateISO,
      dataCompleta: formatDate(dateISO),
      dia: day,
      mes: month,
      ano: year,
    });
    saveState('Data do baba atualizada.');
  }

  function addPlayer(event) {
    event.preventDefault();
    if (!requireOrganizer()) return;
    const nome = els.playerName.value.trim();
    if (!nome) return;
    const type = els.playerType.value;

    if (type === 'visitante') {
      const baba = getActiveBaba();
      if (!baba) return showToast('Crie um baba antes de cadastrar visitantes.');
      if (baba.status === 'finalizado') return showToast('Este baba ja foi finalizado.');
      if (visitorTeamHasGames(baba)) return showToast('O time Visitante ja jogou. Cadastre novos visitantes no proximo baba.');
      baba.visitantes = Array.isArray(baba.visitantes) ? baba.visitantes : [];
      const visitor = {
        id: newId('visitor'),
        nome,
        tipo: 'visitante',
        ativo: true,
        visitante: true,
        criadoEm: Date.now(),
      };
      baba.visitantes.push(visitor);
      baba.pagamentos = baba.pagamentos && typeof baba.pagamentos === 'object' && !Array.isArray(baba.pagamentos) ? baba.pagamentos : {};
      baba.pagamentos[visitor.id] = false;
      if (baba.teams?.length) ensureVisitorTeam(baba);
      els.playerName.value = '';
      els.playerType.value = 'jogador';
      saveState('Visitante cadastrado apenas para o baba atual.');
      return;
    }

    state.players.push({
      id: newId('player'),
      nome,
      tipo: type === 'goleiro' ? 'goleiro' : 'jogador',
      ativo: true,
      criadoEm: Date.now(),
    });
    els.playerName.value = '';
    els.playerType.value = 'jogador';
    saveState('Jogador cadastrado na lista fixa.');
  }

  function togglePlayerActive(playerId) {
    if (!requireOrganizer()) return;
    const player = getPlayer(playerId);
    if (!player) return;
    player.ativo = !player.ativo;

    if (!player.ativo) {
      state.babas.forEach((baba) => {
        if (baba.status !== 'finalizado') {
          baba.jogadoresPresentes = baba.jogadoresPresentes.filter((id) => id !== playerId);
          if (baba.pagamentos) delete baba.pagamentos[playerId];
        }
      });
    }
    saveState(player.ativo ? 'Jogador reativado.' : 'Jogador removido da lista ativa.');
  }

  function deletePlayer(playerId) {
    if (!requireOrganizer()) return;
    const ok = confirm('Remover este jogador da lista fixa? O historico antigo continuara exibindo o nome quando possivel.');
    if (!ok) return;
    state.players = state.players.filter((player) => player.id !== playerId);
    state.babas.forEach((baba) => {
      if (baba.status !== 'finalizado') {
        baba.jogadoresPresentes = baba.jogadoresPresentes.filter((id) => id !== playerId);
        if (baba.pagamentos) delete baba.pagamentos[playerId];
        baba.teams = [];
        baba.filaTimes = [];
        baba.jogoAtual = null;
      }
    });
    saveState('Jogador removido.');
  }

  function deleteVisitor(playerId) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return;
    if (baba.jogoAtual && [baba.jogoAtual.timeA, baba.jogoAtual.timeB].includes(VISITOR_TEAM_ID)) {
      showToast('Finalize o jogo dos visitantes antes de remover.');
      return;
    }
    if (visitorTeamHasGames(baba)) {
      showToast('O time Visitante ja jogou. Nao remova visitantes deste baba.');
      return;
    }
    baba.visitantes = (baba.visitantes || []).filter((player) => player.id !== playerId);
    if (baba.pagamentos) delete baba.pagamentos[playerId];
    const visitorTeam = getTeam(baba, VISITOR_TEAM_ID);
    if (visitorTeam) visitorTeam.jogadores = visitorTeam.jogadores.filter((id) => id !== playerId);
    removeVisitorTeamIfEmpty(baba);
    saveState('Visitante removido do baba atual.');
  }

  function togglePresent(playerId, checked) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if (baba.status === 'finalizado') return showToast('Este baba ja foi finalizado.');

    const presentSet = new Set(baba.jogadoresPresentes || []);
    baba.pagamentos = baba.pagamentos && typeof baba.pagamentos === 'object' && !Array.isArray(baba.pagamentos) ? baba.pagamentos : {};
    if (checked) {
      presentSet.add(playerId);
      if (!(playerId in baba.pagamentos)) baba.pagamentos[playerId] = false;
    }
    else {
      presentSet.delete(playerId);
      delete baba.pagamentos[playerId];
    }
    baba.jogadoresPresentes = Array.from(presentSet);
    if (baba.teams?.length) {
      saveState('Presenca atualizada. Os times sorteados foram mantidos.');
      return;
    }

    baba.teams = [];
    baba.filaTimes = [];
    baba.jogoAtual = null;
    baba.jogos = [];
    baba.lastResult = null;
    baba.pendingTieBreak = null;
    baba.teamRevealIndex = 0;
    baba.status = 'aberto';
    saveState('Lista de presentes atualizada.');
  }

  function resetGoalImagePreview() {
    if (!els.goalImagePreview) return;
    els.goalImagePreview.innerHTML = `
      <svg aria-hidden="true" focusable="false"><use href="#baba-image"></use></svg>
      <span>Adicionar foto</span>
    `;
    els.goalImagePreview.classList.remove('has-image');
  }

  function setPlainButtonLabel(button, label) {
    if (!button) return;
    const textNode = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.nodeValue = label;
    else button.append(document.createTextNode(label));
  }

  function setGoalImagePreview(src) {
    if (!src || !els.goalImagePreview) {
      resetGoalImagePreview();
      return;
    }
    els.goalImagePreview.innerHTML = `<img src="${escapeHTML(src)}" alt="">`;
    els.goalImagePreview.classList.add('has-image');
  }

  function setGoalFormMode(goal = null) {
    editingGoalId = goal?.id || null;
    if (els.goalFormTitle) {
      els.goalFormTitle.innerHTML = `<svg class="baba-card-icon" aria-hidden="true" focusable="false"><use href="#${goal ? 'baba-pencil' : 'baba-plus'}"></use></svg>${goal ? 'Editar meta de compra' : 'Nova meta de compra'}`;
    }
    if (els.goalFormSubtitle) els.goalFormSubtitle.textContent = goal ? 'Atualizar produto' : 'Produto do Baba';
    setPlainButtonLabel(els.goalSubmit, goal ? 'Salvar meta' : 'Cadastrar meta');
    els.goalCancelEdit?.classList.toggle('hidden', !goal);
  }

  function resetPurchaseGoalForm() {
    els.goalForm?.reset();
    resetGoalImagePreview();
    setGoalFormMode(null);
  }

  function previewGoalImage() {
    const file = els.goalImage?.files?.[0];
    if (!file) {
      resetGoalImagePreview();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      els.goalImagePreview.innerHTML = `<img src="${reader.result}" alt="">`;
      els.goalImagePreview.classList.add('has-image');
    };
    reader.onerror = resetGoalImagePreview;
    reader.readAsDataURL(file);
  }

  function compressGoalImage(dataUrl) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        let maxSide = 520;
        let quality = 0.68;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(dataUrl);
          return;
        }
        let output = dataUrl;
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          output = canvas.toDataURL('image/jpeg', quality);
          if (output.length < 260000) break;
          quality = Math.max(0.42, quality - 0.08);
          maxSide = Math.max(320, Math.round(maxSide * 0.88));
        }
        resolve(output);
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  function readGoalImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve('');
        return;
      }
      if (!String(file.type || '').startsWith('image/')) {
        reject(new Error('Arquivo invalido.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          resolve(await compressGoalImage(String(reader.result || '')));
        } catch (error) {
          resolve(String(reader.result || ''));
        }
      };
      reader.onerror = () => reject(new Error('Nao foi possivel ler a foto.'));
      reader.readAsDataURL(file);
    });
  }

  async function addPurchaseGoal(event) {
    event.preventDefault();
    if (!requireOrganizer()) return;
    const editingGoal = editingGoalId ? state.purchaseGoals.find((item) => item.id === editingGoalId) : null;
    const nome = els.goalName?.value.trim() || '';
    const descricao = els.goalDescription?.value.trim() || '';
    const prioridade = normalizeGoalPriority(els.goalPriority?.value);
    const valor = parseMoneyValue(els.goalTarget?.value);
    const arrecadado = parseMoneyValue(els.goalCollected?.value);

    if (!nome || !valor) {
      showToast('Informe pelo menos o nome e o valor da meta.');
      return;
    }

    let foto = '';
    try {
      const selectedFile = els.goalImage?.files?.[0];
      foto = selectedFile ? await readGoalImage(selectedFile) : (editingGoal?.foto || '');
    } catch (error) {
      showToast(error.message || 'Nao foi possivel salvar a foto.');
      return;
    }

    if (editingGoal) {
      Object.assign(editingGoal, {
        nome,
        descricao,
        prioridade,
        valor,
        arrecadado,
        foto,
        atualizadoEm: Date.now(),
      });
      resetPurchaseGoalForm();
      saveState('Meta atualizada.');
      setActiveTab('goals');
      return;
    }

    state.purchaseGoals.unshift({
      id: newId('goal'),
      nome,
      descricao,
      prioridade,
      valor,
      arrecadado,
      foto,
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
    });

    resetPurchaseGoalForm();
    saveState('Meta cadastrada.');
    setActiveTab('goals');
  }

  function editPurchaseGoal(goalId) {
    if (!requireOrganizer()) return;
    const goal = state.purchaseGoals.find((item) => item.id === goalId);
    if (!goal) return;
    setGoalFormMode(goal);
    if (els.goalName) els.goalName.value = goal.nome || '';
    if (els.goalDescription) els.goalDescription.value = goal.descricao || '';
    if (els.goalPriority) els.goalPriority.value = normalizeGoalPriority(goal.prioridade);
    if (els.goalTarget) els.goalTarget.value = Number(goal.valor || 0);
    if (els.goalCollected) els.goalCollected.value = Number(goal.arrecadado || 0);
    if (els.goalImage) els.goalImage.value = '';
    setGoalImagePreview(goal.foto);
    els.goalForm?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  function deletePurchaseGoal(goalId) {
    if (!requireOrganizer()) return;
    const goal = state.purchaseGoals.find((item) => item.id === goalId);
    if (!goal) return;
    const ok = confirm(`Remover a meta "${goal.nome}"?`);
    if (!ok) return;
    state.purchaseGoals = state.purchaseGoals.filter((item) => item.id !== goalId);
    if (editingGoalId === goalId) resetPurchaseGoalForm();
    saveState('Meta removida.');
  }

  function updatePurchaseGoalCollected(goalId, value) {
    if (!requireOrganizer()) return;
    const goal = state.purchaseGoals.find((item) => item.id === goalId);
    if (!goal) return;
    goal.arrecadado = parseMoneyValue(value);
    goal.atualizadoEm = Date.now();
    saveState('Valor arrecadado atualizado.');
  }

  function getPaymentPlayers(baba = getActiveBaba()) {
    const fixedPlayers = state.players;
    const visitors = (baba?.visitantes || []).filter((player) => player?.ativo !== false);
    return [...fixedPlayers, ...visitors];
  }

  function paymentPriceForPlayer(player) {
    return player?.tipo === 'goleiro' ? GOALKEEPER_BABA_PRICE : PLAYER_BABA_PRICE;
  }

  function getPaymentStats(baba) {
    const players = getPaymentPlayers(baba);
    return players.reduce((stats, player) => {
      const price = paymentPriceForPlayer(player);
      const paid = isPlayerPaidThisMonth(player.id, baba);
      stats.expected += price;
      if (paid) {
        stats.paid += price;
        stats.paidCount += 1;
      }
      stats.players += 1;
      return stats;
    }, { players: 0, paidCount: 0, expected: 0, paid: 0 });
  }

  function getBabaAccountBalance() {
    return getPaymentStats(getActiveBaba()).paid;
  }

  function playerPaymentTypeLabel(player) {
    if (player?.tipo === 'goleiro') return 'Goleiro';
    if (player?.tipo === 'visitante' || player?.visitante) return 'Visitante';
    return 'Jogador';
  }

  function reportContextLabel(baba = getActiveBaba()) {
    if (!baba) return 'Sem baba ativo';
    return baba.dataCompleta || formatBabaDateLong(baba.dataISO) || formatDate(baba.dataISO);
  }

  function reportSummaryItems(baba = getActiveBaba()) {
    return [
      ['Baba', reportContextLabel(baba)],
      ['Presentes', String(baba?.jogadoresPresentes?.length || 0)],
      ['Times', String(baba?.teams?.length || 0)],
      ['Jogos', String(baba?.jogos?.length || 0)],
    ];
  }

  function getStandingsSnapshot(baba = getActiveBaba()) {
    if (!baba?.teams?.length) return [];
    const match = baba.jogoAtual;
    const liveStats = new Map();
    (baba.teams || []).forEach((team) => {
      liveStats.set(team.id, {
        ...team,
        saldo: Number(team.golsPro || 0) - Number(team.golsContra || 0),
        isLive: false,
      });
    });

    if (match) {
      recomputeLiveScore(match);
      const liveA = liveStats.get(match.timeA);
      const liveB = liveStats.get(match.timeB);
      const scoreA = Number(match.placarA || 0);
      const scoreB = Number(match.placarB || 0);
      if (liveA && liveB) {
        liveA.golsPro += scoreA;
        liveA.golsContra += scoreB;
        liveB.golsPro += scoreB;
        liveB.golsContra += scoreA;
        liveA.isLive = true;
        liveB.isLive = true;

        if (scoreA > scoreB) {
          liveA.pontos += 3;
          liveA.vitorias += 1;
          liveB.derrotas += 1;
        } else if (scoreB > scoreA) {
          liveB.pontos += 3;
          liveB.vitorias += 1;
          liveA.derrotas += 1;
        } else if (match.iniciadoEm || match.goalEvents?.length) {
          liveA.pontos += 1;
          liveB.pontos += 1;
          liveA.empates += 1;
          liveB.empates += 1;
        }

        liveA.saldo = liveA.golsPro - liveA.golsContra;
        liveB.saldo = liveB.golsPro - liveB.golsContra;
      }
    }

    return Array.from(liveStats.values()).sort((a, b) => (
      b.pontos - a.pontos ||
      b.saldo - a.saldo ||
      b.golsPro - a.golsPro ||
      a.name.localeCompare(b.name)
    ));
  }

  function rankingRowsForPdf(items = []) {
    return items.map((stats, index) => [
      index + 1,
      stats.nome || playerName(stats.jogadorId),
      stats.totalGols || 0,
      stats.totalVitorias || 0,
      stats.totalEmpates || 0,
      stats.totalDerrotas || 0,
      `${stats.aproveitamento || 0}%`,
      stats.totalTitulosBaba || 0,
    ]);
  }

  function goalkeeperRowsForPdf(items = []) {
    return items.map((stats, index) => [
      index + 1,
      stats.nome || playerName(stats.jogadorId),
      stats.jogos || 0,
      stats.golsSofridos || 0,
      stats.mediaSofridos || '0.0',
      stats.totalBabas || 0,
    ]);
  }

  function scorersRowsForPdf(baba = getActiveBaba(), limit = null) {
    const rows = getDailyRankingList(baba, 'goals')
      .filter((stats) => stats.totalGols > 0)
      .map((stats, index) => [
        index + 1,
        stats.nome,
        stats.totalGols,
        stats.totalVitorias,
        stats.mediaGols,
        `${stats.aproveitamento}%`,
      ]);
    return Number.isFinite(limit) ? rows.slice(0, limit) : rows;
  }

  function standingsRowsForPdf(baba = getActiveBaba()) {
    return getStandingsSnapshot(baba).map((team, index) => [
      index + 1,
      team.name,
      team.pontos,
      team.golsPro,
      team.saldo,
      team.vitorias,
      team.empates,
      team.derrotas,
      team.isLive ? 'Ao vivo' : '',
    ]);
  }

  function teamRosterRowsForPdf(baba = getActiveBaba()) {
    const teams = getStandingsSnapshot(baba);
    return teams.map((team) => {
      const sourceTeam = getTeam(baba, team.id) || team;
      const players = (sourceTeam.jogadores || [])
        .map((playerId) => getBabaPlayer(baba, playerId))
        .filter(Boolean);
      const goalkeepers = players.filter((player) => player.tipo === 'goleiro').length;
      const fieldPlayers = Math.max(0, players.length - goalkeepers);
      return [
        team.name,
        players.map((player) => player.nome).join(', ') || '-',
        fieldPlayers,
        goalkeepers,
      ];
    });
  }

  function goalRankingRowsForPdf(items = []) {
    return items.map((stats, index) => [
      index + 1,
      stats.nome || playerName(stats.jogadorId),
      stats.totalGols || 0,
      stats.totalVitorias || 0,
      `${stats.aproveitamento || 0}%`,
      stats.totalBabas || 0,
    ]);
  }

  function paymentRowsForPdf(baba = getActiveBaba(), paidOnly = true) {
    return getPaymentPlayers(baba)
      .filter((player) => isPlayerPaidThisMonth(player.id, baba) === paidOnly)
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((player, index) => [
        index + 1,
        player.nome,
        playerPaymentTypeLabel(player),
        formatCurrency(paymentPriceForPlayer(player)),
      ]);
  }

  function currentGamesRowsForPdf(baba = getActiveBaba()) {
    return (baba?.jogos || []).map((game) => {
      const teamA = getTeam(baba, game.timeA);
      const teamB = getTeam(baba, game.timeB);
      return [
        game.numeroJogo,
        `${teamA?.name || game.timeANome || 'Time'} x ${teamB?.name || game.timeBNome || 'Time'}`,
        `${game.placarA} x ${game.placarB}`,
        resultStatusLabel(game),
        `Fica: ${teamDetailName(baba, game.timeQueContinuou)} / Sai: ${teamNamesFromValue(baba, game.timeQueSaiu)}`,
        game.motivoSaida || '-',
      ];
    });
  }

  function teamDetailName(baba, teamId, fallback = '-') {
    return getTeam(baba, teamId)?.name || fallback;
  }

  function activeYearForReport(baba = getActiveBaba()) {
    const year = Number(String(baba?.dataISO || todayISO()).slice(0, 4));
    return Number.isFinite(year) && year > 0 ? year : new Date().getFullYear();
  }

  function calculateYearlyRanking(year, { includeActive = true } = {}) {
    const ranking = {};
    state.babas
      .filter((baba) => baba.status === 'finalizado' && Number(String(baba.dataISO || '').slice(0, 4)) === Number(year))
      .forEach((baba) => {
        Object.values(calculateDailyRanking(baba)).forEach((stats) => mergeRankingStats(ranking, stats));
      });

    const active = getActiveBaba();
    const activeYear = Number(String(active?.dataISO || '').slice(0, 4));
    if (includeActive && active && active.status !== 'finalizado' && activeYear === Number(year)) {
      Object.values(calculateCurrentBabaRanking(active)).forEach((stats) => mergeRankingStats(ranking, stats));
    }

    Object.values(ranking).forEach(finalizeStats);
    return ranking;
  }

  function buildBabaPdfReport(type) {
    const baba = getActiveBaba();
    const now = new Date().toLocaleString('pt-BR');
    const baseSummary = reportSummaryItems(baba);
    const metricLabel = RANKING_MODES.find((item) => item.id === rankingMode)?.label || 'Gols';
    const currentMonth = activeMonthKey(baba);
    const monthlyHistoryKey = selectedMonthlyKey || getAvailableMonthKeys()[0] || currentMonth;
    const reportYear = activeYearForReport(baba);
    const report = {
      type,
      generatedAt: now,
      eyebrow: 'Baba Amigos do Henrique',
      title: '',
      subtitle: reportContextLabel(baba),
      fileName: `baba-${type}.pdf`,
      summary: baseSummary,
      icon: 'report',
      sections: [],
    };

    if (type === 'payments') {
      const stats = getPaymentStats(baba);
      const pending = Math.max(0, stats.expected - stats.paid);
      report.title = 'Lista de pagamentos';
      report.subtitle = `${paymentMonthLabel()} - vencimento ${paymentDueDateLabel()}`;
      report.icon = 'wallet';
      report.summary = [
        ['Esperado', formatCurrency(stats.expected)],
        ['Pago', formatCurrency(stats.paid)],
        ['Pendente', formatCurrency(pending)],
        ['Confirmados', `${stats.paidCount}/${stats.players}`],
      ];
      report.sections = [
        {
          title: 'Jogadores que pagaram',
          note: 'Confirmados no mes',
          icon: 'check-circle',
          maxRows: PDF_ROW_LIMITS.payments,
          columns: ['#', 'Jogador', 'Tipo', 'Valor'],
          rows: paymentRowsForPdf(baba, true),
          empty: 'Nenhum pagamento confirmado ainda.',
        },
        {
          title: 'Pendentes',
          note: 'Ainda em aberto',
          icon: 'alert-circle',
          maxRows: PDF_ROW_LIMITS.payments,
          columns: ['#', 'Jogador', 'Tipo', 'Valor'],
          rows: paymentRowsForPdf(baba, false),
          empty: 'Nenhum pagamento pendente.',
        },
      ];
      return report;
    }

    if (type === 'standings') {
      report.title = 'Tabela de times';
      report.subtitle = `Classificacao, elencos e rankings por gols - ${reportContextLabel(baba)}`;
      report.icon = 'table';
      report.summary = [
        ...baseSummary,
        ['Ano', String(reportYear)],
      ];
      report.sections = [
        {
          title: 'Classificacao',
          note: 'Pontos, gols e saldo',
          icon: 'table',
          wide: true,
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.standings,
          columns: ['Pos', 'Time', 'Pts', 'GP', 'SG', 'V', 'E', 'D', 'Status'],
          rows: standingsRowsForPdf(baba),
          empty: 'Sorteie os times para gerar a tabela.',
        },
        {
          title: 'Jogadores por time',
          note: 'Elencos sorteados',
          icon: 'users',
          wide: true,
          columns: ['Time', 'Jogadores', 'Linha', 'Goleiros'],
          rows: teamRosterRowsForPdf(baba),
          empty: 'Nenhum jogador distribuido nos times.',
        },
        {
          title: `Ranking do ano ${reportYear}`,
          note: 'Classificado por gols',
          icon: 'trophy',
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.rankings,
          columns: ['Pos', 'Jogador', 'Gols', 'V', 'Aprov.', 'Babas'],
          rows: goalRankingRowsForPdf(sortRanking(calculateYearlyRanking(reportYear, { includeActive: true }), 'goals')),
          empty: 'Sem gols registrados neste ano.',
        },
        {
          title: 'Ranking geral',
          note: 'Classificado por gols',
          icon: 'chart',
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.rankings,
          columns: ['Pos', 'Jogador', 'Gols', 'V', 'Aprov.', 'Babas'],
          rows: goalRankingRowsForPdf(sortRanking(calculateGeneralRanking(), 'goals')),
          empty: 'Sem dados no ranking geral.',
        },
      ];
      return report;
    }

    if (type === 'current-history') {
      report.title = 'Historico do baba atual';
      report.subtitle = `Jogos finalizados - ${reportContextLabel(baba)}`;
      report.icon = 'history';
      report.sections = [
        {
          title: 'Jogos finalizados',
          note: 'Ultimos jogos',
          icon: 'history',
          maxRows: PDF_ROW_LIMITS.currentHistory,
          columns: ['Jogo', 'Partida', 'Placar', 'Resultado', 'Rodizio', 'Motivo'],
          rows: currentGamesRowsForPdf(baba),
          empty: 'Nenhum jogo finalizado neste baba.',
        },
      ];
      return report;
    }

    if (type === 'daily-scorers') {
      report.title = 'Artilheiros do dia';
      report.subtitle = `Ranking de gols - ${reportContextLabel(baba)}`;
      report.icon = 'target';
      report.sections = [
        {
          title: 'Ranking de artilharia',
          note: 'Ordenado por gols',
          icon: 'target',
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.dailyScorers,
          columns: ['Pos', 'Jogador', 'Gols', 'V', 'Media', 'Aprov.'],
          rows: scorersRowsForPdf(baba),
          empty: 'Sem gols no baba atual.',
        },
      ];
      return report;
    }

    if (type === 'rankings') {
      report.title = 'Rankings do baba';
      report.subtitle = `Criterio atual: ${metricLabel}`;
      report.icon = 'chart';
      report.summary = [
        ...baseSummary,
        ['Criterio', metricLabel],
      ];
      report.sections = [
        {
          title: `Mes - ${monthLabel(currentMonth)}`,
          note: `Top ${PDF_ROW_LIMITS.rankings}`,
          icon: 'calendar',
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.rankings,
          columns: ['Pos', 'Jogador', 'Gols', 'V', 'E', 'D', 'Aprov.', 'Tit.'],
          rows: rankingRowsForPdf(sortRanking(calculateMonthlyRanking(currentMonth, { includeActive: true }), rankingMode)),
          empty: 'Sem dados no ranking do mes.',
        },
        {
          title: 'Ranking geral',
          note: `Top ${PDF_ROW_LIMITS.rankings}`,
          icon: 'chart',
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.rankings,
          columns: ['Pos', 'Jogador', 'Gols', 'V', 'E', 'D', 'Aprov.', 'Tit.'],
          rows: rankingRowsForPdf(sortRanking(calculateGeneralRanking(), rankingMode)),
          empty: 'Sem dados no ranking geral.',
        },
        {
          title: 'Ranking do dia',
          note: `Top ${PDF_ROW_LIMITS.rankings}`,
          icon: 'target',
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.rankings,
          columns: ['Pos', 'Jogador', 'Gols', 'V', 'E', 'D', 'Aprov.', 'Tit.'],
          rows: rankingRowsForPdf(getDailyRankingList(baba, rankingMode)),
          empty: 'Sem dados no ranking do dia.',
        },
        {
          title: 'Melhor goleiro',
          note: `Top ${PDF_ROW_LIMITS.goalkeeper}`,
          icon: 'shield',
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.goalkeeper,
          columns: ['Pos', 'Goleiro', 'Jogos', 'Sofridos', 'Media', 'Babas'],
          rows: goalkeeperRowsForPdf(calculateGoalkeeperRanking({ includeActive: true })),
          empty: 'Sem jogos com goleiros ainda.',
        },
        {
          title: `Historico - ${monthLabel(monthlyHistoryKey)}`,
          note: `Top ${PDF_ROW_LIMITS.rankings}`,
          icon: 'history',
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.rankings,
          columns: ['Pos', 'Jogador', 'Gols', 'V', 'E', 'D', 'Aprov.', 'Tit.'],
          rows: rankingRowsForPdf(sortRanking(calculateMonthlyRanking(monthlyHistoryKey, { includeActive: monthlyHistoryKey === activeMonthKey() }), rankingMode)),
          empty: 'Sem historico mensal para exportar.',
        },
      ];
      return report;
    }

    return null;
  }

  function pdfIcon(name = 'report') {
    const icons = {
      report: '<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/><path d="M9 11h6"/><path d="M9 15h6"/>',
      wallet: '<path d="M4 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4z"/><path d="M4 7V5a2 2 0 0 1 2-2h11"/><path d="M16 13h.01"/>',
      table: '<path d="M4 5h16v14H4z"/><path d="M4 10h16"/><path d="M10 5v14"/>',
      target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
      history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/><path d="M12 7v5l3 2"/>',
      chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-3"/>',
      calendar: '<path d="M5 4h14v16H5z"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M5 9h14"/>',
      shield: '<path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-5"/>',
      'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
      'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 17h.01"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.8"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
      trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M5 6H3a3 3 0 0 0 4 3"/><path d="M19 6h2a3 3 0 0 1-4 3"/>',
      ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/><path d="M12 7V3"/><path d="M16 10l4-1"/><path d="M14.5 15l2.5 4"/><path d="M9.5 15L7 19"/><path d="M8 10L4 9"/>',
    };
    return `<span class="pdf-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.report}</svg></span>`;
  }

  function pdfSummaryIcon(label) {
    const normalized = String(label || '').toLowerCase();
    if (normalized.includes('pago') || normalized.includes('confirm')) return 'check-circle';
    if (normalized.includes('pend')) return 'alert-circle';
    if (normalized.includes('esper')) return 'wallet';
    if (normalized.includes('presente')) return 'users';
    if (normalized.includes('time')) return 'shield';
    if (normalized.includes('jogo')) return 'ball';
    if (normalized.includes('criterio')) return 'chart';
    if (normalized.includes('baba')) return 'calendar';
    return 'report';
  }

  function limitPdfRows(rows = [], maxRows = null) {
    const list = Array.isArray(rows) ? rows : [];
    if (!Number.isFinite(maxRows) || maxRows <= 0 || list.length <= maxRows) {
      return { rows: list, hidden: 0 };
    }
    return { rows: list.slice(0, maxRows), hidden: list.length - maxRows };
  }

  function renderPdfTable(section) {
    const columns = section.columns || [];
    const result = limitPdfRows(section.rows, section.maxRows);
    const rows = result.rows;
    if (!rows.length) return `<div class="pdf-empty">${escapeHTML(section.empty || 'Sem dados para exibir.')}</div>`;
    const mobileCards = rows.map((row, index) => {
      const firstCell = row[0] ?? '';
      const title = (row[1] ?? firstCell) || `Item ${index + 1}`;
      const eyebrow = firstCell ? `${columns[0] || 'Item'} ${firstCell}` : `Item ${index + 1}`;
      const isGold = Boolean(section.highlightTop && index === 0);
      return `
        <article class="pdf-mobile-card ${isGold ? 'is-pdf-gold' : ''}">
          <div class="pdf-mobile-card-title">
            <span>${escapeHTML(eyebrow)}</span>
            <strong>${escapeHTML(title)}</strong>
          </div>
          <dl>
            ${columns.map((column, columnIndex) => `
              <div>
                <dt>${escapeHTML(column)}</dt>
                <dd>${escapeHTML(row[columnIndex] ?? '-')}</dd>
              </div>
            `).join('')}
          </dl>
        </article>
      `;
    }).join('');
    const hiddenRow = result.hidden ? `
      <tfoot>
        <tr><td colspan="${columns.length}">+ ${result.hidden} registros continuam salvos no sistema. PDF otimizado para uma pagina.</td></tr>
      </tfoot>
    ` : '';

    return `
      <div class="pdf-table-wrap" role="region" aria-label="Tabela do relatorio">
        <table class="pdf-table pdf-table--cols-${Math.min(columns.length, 9)}">
          <thead>
            <tr>${columns.map((column) => `<th>${escapeHTML(column)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map((row, index) => `
              <tr class="${section.highlightTop && index === 0 ? 'is-pdf-gold' : ''}">${row.map((cell) => `<td>${escapeHTML(cell ?? '-')}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
          ${hiddenRow}
        </table>
      </div>
      <div class="pdf-mobile-list" aria-label="Lista para celular">
        ${mobileCards}
      </div>
    `;
  }

  function renderPdfDocument(report) {
    const headerImage = new URL('img/baba-pdf-report-header-pro.png', window.location.href).href;
    const summary = report.summary.map(([label, value]) => `
      <article>
        ${pdfIcon(pdfSummaryIcon(label))}
        <div>
          <span>${escapeHTML(label)}</span>
          <strong>${escapeHTML(value)}</strong>
        </div>
      </article>
    `).join('');
    const sectionLayout = report.sections.length > 1 ? 'pdf-sections--grid' : 'pdf-sections--single';
    const sections = report.sections.map((section) => `
      <section class="pdf-section ${section.wide ? 'pdf-section--wide' : ''}">
        <div class="pdf-section-head">
          <h2>${pdfIcon(section.icon || report.icon)}<span>${escapeHTML(section.title)}</span></h2>
          ${section.note ? `<p>${escapeHTML(section.note)}</p>` : ''}
        </div>
        ${renderPdfTable(section)}
      </section>
    `).join('');

    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHTML(report.fileName)}</title>
  <style>
    @page { size: A4 portrait; margin: 7mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #172033;
      background:
        radial-gradient(780px 420px at 8% -8%, rgba(20, 164, 106, .14), transparent 62%),
        radial-gradient(720px 380px at 92% 0%, rgba(250, 204, 21, .16), transparent 58%),
        #eef5f2;
      font-family: Inter, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .pdf-page {
      display: grid;
      gap: 10px;
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      padding: 14px;
    }
    .pdf-hero {
      position: relative;
      overflow: hidden;
      min-height: 118px;
      border: 1px solid rgba(255, 255, 255, .38);
      border-radius: 12px;
      padding: 18px;
      color: #ffffff;
      background:
        linear-gradient(90deg, rgba(4, 15, 12, .92), rgba(4, 15, 12, .72) 48%, rgba(4, 15, 12, .16)),
        var(--pdf-hero-bg) center / cover no-repeat;
      box-shadow: 0 12px 26px rgba(15, 23, 42, .10);
    }
    .pdf-hero__content {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 6px;
      max-width: 72%;
    }
    .pdf-hero__badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: #d9f99d;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .pdf-hero .pdf-icon {
      width: 26px;
      height: 26px;
      color: #facc15;
      background: rgba(255, 255, 255, .14);
      border-color: rgba(255, 255, 255, .22);
    }
    .pdf-hero h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      line-height: .98;
    }
    .pdf-hero p {
      margin: 0;
      color: rgba(255, 255, 255, .86);
      font-size: 11px;
      font-weight: 700;
    }
    .pdf-preload {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }
    .pdf-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }
    .pdf-summary article {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      border: 1px solid #dbe5ef;
      border-radius: 8px;
      padding: 9px 10px;
      background: #ffffff;
    }
    .pdf-summary article > div { min-width: 0; }
    .pdf-summary span {
      display: block;
      color: #64748b;
      font-size: 8px;
      font-weight: 900;
      letter-spacing: .05em;
      text-transform: uppercase;
    }
    .pdf-summary strong {
      display: block;
      margin-top: 2px;
      color: #172033;
      font-size: 14px;
      line-height: 1.1;
      overflow-wrap: anywhere;
    }
    .pdf-icon {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: 1px solid #cdebd8;
      border-radius: 7px;
      color: #0f766e;
      background: #ecfdf5;
    }
    .pdf-icon svg {
      width: 14px;
      height: 14px;
    }
    .pdf-sections {
      display: grid;
      gap: 8px;
    }
    .pdf-sections--grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }
    .pdf-section--wide {
      grid-column: 1 / -1;
    }
    .pdf-section {
      overflow: hidden;
      border: 1px solid #dbe5ef;
      border-radius: 8px;
      background: #ffffff;
      break-inside: avoid-page;
      box-shadow: 0 12px 26px rgba(15, 23, 42, .07);
    }
    .pdf-section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid #e7edf5;
      padding: 9px 10px;
      background: #f8fbff;
    }
    .pdf-section h2 {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
    }
    .pdf-section h2 {
      margin: 0;
      color: #172033;
      font-size: 13px;
      line-height: 1.1;
    }
    .pdf-section h2 span {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .pdf-section p {
      margin: 0;
      color: #64748b;
      font-size: 8px;
      font-weight: 800;
      text-align: right;
      white-space: nowrap;
    }
    .pdf-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 8.3px;
      line-height: 1.12;
    }
    th {
      color: #52647c;
      background: #f3f7fb;
      font-size: 7px;
      font-weight: 900;
      letter-spacing: .04em;
      text-align: left;
      text-transform: uppercase;
    }
    th, td {
      border-bottom: 1px solid #edf1f6;
      padding: 5px 6px;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    tbody tr:nth-child(even) td { background: #fbfdff; }
    tbody tr:last-child td { border-bottom: 0; }
    tbody tr.is-pdf-gold td {
      border-color: rgba(214, 161, 0, .22);
      color: #5f4100;
      background: linear-gradient(90deg, rgba(255, 247, 205, .96), rgba(255, 251, 235, .88));
      font-weight: 900;
    }
    tbody tr.is-pdf-gold td:first-child {
      color: #ffffff;
      background: linear-gradient(135deg, #b77900, #facc15);
    }
    tfoot td {
      color: #64748b;
      background: #f8fbff;
      font-size: 7.5px;
      font-weight: 800;
      text-align: center;
    }
    td:first-child, th:first-child { width: 28px; text-align: center; font-weight: 900; }
    .pdf-table--cols-8,
    .pdf-table--cols-9 {
      font-size: 7.5px;
    }
    .pdf-table--cols-8 th,
    .pdf-table--cols-9 th {
      font-size: 6.5px;
    }
    .pdf-table--cols-8 th,
    .pdf-table--cols-8 td,
    .pdf-table--cols-9 th,
    .pdf-table--cols-9 td {
      padding: 4px;
    }
    .pdf-table-wrap {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .pdf-mobile-list {
      display: none;
      gap: 9px;
      padding: 10px;
    }
    .pdf-mobile-card {
      overflow: hidden;
      border: 1px solid #dbe5ef;
      border-radius: 8px;
      background: #ffffff;
      break-inside: avoid;
    }
    .pdf-mobile-card.is-pdf-gold {
      border-color: rgba(214, 161, 0, .38);
      box-shadow: 0 10px 24px rgba(214, 161, 0, .12);
    }
    .pdf-mobile-card.is-pdf-gold .pdf-mobile-card-title {
      background: linear-gradient(135deg, #fff2b7, #fffbea);
    }
    .pdf-mobile-card.is-pdf-gold .pdf-mobile-card-title span {
      color: #986b00;
    }
    .pdf-mobile-card-title {
      display: grid;
      gap: 3px;
      padding: 10px 11px;
      background: linear-gradient(135deg, #f7fbff, #eefcf6);
      border-bottom: 1px solid #e7edf5;
    }
    .pdf-mobile-card-title span {
      color: #0f766e;
      font-size: 8px;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .pdf-mobile-card-title strong {
      color: #172033;
      font-size: 13px;
      line-height: 1.15;
      overflow-wrap: anywhere;
    }
    .pdf-mobile-card dl {
      display: grid;
      gap: 0;
      margin: 0;
      padding: 0;
    }
    .pdf-mobile-card dl div {
      display: grid;
      grid-template-columns: 94px minmax(0, 1fr);
      gap: 8px;
      align-items: start;
      border-bottom: 1px solid #edf1f6;
      padding: 8px 11px;
    }
    .pdf-mobile-card dl div:nth-child(even) { background: #fbfdff; }
    .pdf-mobile-card dl div:last-child { border-bottom: 0; }
    .pdf-mobile-card dt {
      color: #64748b;
      font-size: 8px;
      font-weight: 900;
      letter-spacing: .05em;
      line-height: 1.2;
      text-transform: uppercase;
    }
    .pdf-mobile-card dd {
      margin: 0;
      color: #172033;
      font-size: 10px;
      font-weight: 800;
      line-height: 1.25;
      text-align: right;
      overflow-wrap: anywhere;
    }
    .pdf-empty {
      padding: 14px;
      color: #64748b;
      font-size: 11px;
      font-weight: 800;
      background: #ffffff;
    }
    .pdf-footer {
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 8px;
      font-weight: 800;
      padding: 0 2px 2px;
    }
    @media screen and (max-width: 720px) {
      body { background: #ffffff; }
      .pdf-page {
        gap: 10px;
        padding: 10px;
      }
      .pdf-hero {
        border-radius: 12px;
        padding: 14px;
      }
      .pdf-hero__content { max-width: 100%; }
      .pdf-hero h1 {
        font-size: 22px;
        line-height: 1.05;
      }
      .pdf-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .pdf-summary article {
        padding: 9px;
      }
      .pdf-section-head {
        display: grid;
        align-items: start;
        gap: 5px;
        padding: 11px 12px;
      }
      .pdf-section p {
        text-align: left;
        white-space: normal;
      }
      .pdf-sections--grid { grid-template-columns: 1fr; }
      .pdf-table-wrap { display: none; }
      .pdf-mobile-list { display: grid; }
      .pdf-footer {
        display: grid;
        gap: 2px;
        text-align: center;
      }
    }
    @media screen and (max-width: 430px) {
      .pdf-mobile-card dl div {
        grid-template-columns: 1fr;
        gap: 3px;
      }
      .pdf-mobile-card dd {
        text-align: left;
      }
    }
    @media print {
      body { background: #ffffff; }
      .pdf-page {
        gap: 5px;
        max-width: none;
        min-height: auto;
        padding: 0;
      }
      .pdf-hero {
        min-height: 29mm;
        border-radius: 8px;
        padding: 9px 10px;
        box-shadow: none;
      }
      .pdf-hero__content {
        gap: 4px;
        max-width: 70%;
      }
      .pdf-hero__badge { font-size: 7px; }
      .pdf-hero .pdf-icon {
        width: 19px;
        height: 19px;
      }
      .pdf-hero h1 {
        font-size: 20px;
        line-height: 1.05;
      }
      .pdf-hero p {
        font-size: 8.2px;
        line-height: 1.25;
      }
      .pdf-summary {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 5px;
      }
      .pdf-summary--count-5 {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }
      .pdf-summary article {
        gap: 5px;
        border-radius: 6px;
        padding: 5px 6px;
      }
      .pdf-summary span { font-size: 5.9px; }
      .pdf-summary strong { font-size: 9.2px; }
      .pdf-icon {
        width: 18px;
        height: 18px;
        border-radius: 5px;
      }
      .pdf-icon svg {
        width: 11px;
        height: 11px;
      }
      .pdf-sections {
        gap: 5px;
      }
      .pdf-sections--grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .pdf-section {
        border-radius: 6px;
        box-shadow: none;
        break-inside: avoid-page;
      }
      .pdf-section--wide {
        grid-column: 1 / -1;
      }
      .pdf-section-head {
        gap: 4px;
        padding: 5px 6px;
      }
      .pdf-section h2 {
        gap: 4px;
        font-size: 9px;
      }
      .pdf-section p {
        font-size: 6.4px;
        line-height: 1.25;
        text-align: right;
      }
      .pdf-table {
        display: table;
        font-size: 6.8px;
        line-height: 1.08;
      }
      th { font-size: 5.6px; }
      th, td {
        padding: 2.8px 3px;
      }
      td:first-child, th:first-child { width: 20px; }
      .pdf-table--cols-8,
      .pdf-table--cols-9 {
        font-size: 6.1px;
      }
      .pdf-table--cols-8 th,
      .pdf-table--cols-9 th {
        font-size: 5.2px;
      }
      .pdf-table--cols-8 th,
      .pdf-table--cols-8 td,
      .pdf-table--cols-9 th,
      .pdf-table--cols-9 td {
        padding: 2.4px 2.5px;
      }
      tfoot td { font-size: 5.8px; }
      .pdf-table-wrap { display: block; overflow: visible; }
      .pdf-mobile-list { display: none !important; }
      .pdf-empty {
        padding: 8px;
        font-size: 7px;
      }
      .pdf-footer {
        font-size: 6px;
        padding-top: 1px;
      }
    }
  </style>
</head>
<body>
  <main class="pdf-page pdf-report--${escapeHTML(report.type)}">
    <header class="pdf-hero" style="--pdf-hero-bg: url('${escapeHTML(headerImage)}')">
      <div class="pdf-hero__content">
        <span class="pdf-hero__badge">${pdfIcon(report.icon)}${escapeHTML(report.eyebrow)}</span>
        <h1>${escapeHTML(report.title)}</h1>
        <p>${escapeHTML(report.subtitle)} - gerado em ${escapeHTML(report.generatedAt)}</p>
      </div>
      <img class="pdf-preload" data-pdf-cover src="${escapeHTML(headerImage)}" alt="">
    </header>
    <section class="pdf-summary pdf-summary--count-${Math.min(report.summary.length, 5)}">${summary}</section>
    <section class="pdf-sections ${sectionLayout}">${sections}</section>
    <footer class="pdf-footer">
      <span>Baba Amigos do Henrique</span>
      <span>Exportacao em PDF</span>
    </footer>
  </main>
</body>
</html>`;
  }

  function exportBabaPdf(type) {
    const report = buildBabaPdfReport(type);
    if (!report) return showToast('Relatorio nao encontrado para exportar.');
    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) return showToast('Permita pop-ups para exportar o PDF.');
    pdfWindow.document.open();
    pdfWindow.document.write(renderPdfDocument(report));
    pdfWindow.document.close();

    const printReport = () => {
      try {
        pdfWindow.focus();
        pdfWindow.print();
        showToast('PDF pronto. Escolha salvar como PDF na janela de impressao.');
      } catch (error) {
        showToast('PDF aberto em nova janela.');
      }
    };

    const cover = pdfWindow.document.querySelector('[data-pdf-cover]');
    if (cover && !cover.complete) {
      cover.addEventListener('load', () => window.setTimeout(printReport, 250), { once: true });
      cover.addEventListener('error', () => window.setTimeout(printReport, 250), { once: true });
      return;
    }
    window.setTimeout(printReport, 350);
  }

  function toggleBabaPayment(playerId) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const player = getPaymentPlayers(baba).find((item) => item.id === playerId) || getPlayer(playerId);
    if (!player) return showToast('Jogador nao encontrado para registrar o pagamento.');
    const record = getMonthlyPaymentRecord();
    record.pagamentos[playerId] = !isPlayerPaidThisMonth(playerId, baba);
    record.atualizadoEm = Date.now();
    if (baba) {
      baba.pagamentos = baba.pagamentos && typeof baba.pagamentos === 'object' && !Array.isArray(baba.pagamentos) ? baba.pagamentos : {};
      baba.pagamentos[playerId] = record.pagamentos[playerId];
    }
    saveState(record.pagamentos[playerId] ? `${player.nome} pagou o mes atual.` : `${player.nome} ficou pendente no mes atual.`);
  }

  function drawTeams() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if (baba.status === 'finalizado') return showToast('Este baba ja foi finalizado.');
    if (baba.teams?.length) {
      setActiveTab('teams');
      showToast('Times ja sorteados. Os jogadores novos nao alteram os times prontos.');
      return;
    }

    baba.visitantes = Array.isArray(baba.visitantes) ? baba.visitantes : [];
    const presentPlayers = (baba.jogadoresPresentes || [])
      .map(getPlayer)
      .filter((player) => player?.ativo);
    const visitorPlayers = baba.visitantes.filter((player) => player?.ativo);

    if (presentPlayers.length < 2) {
      showToast('Marque pelo menos 2 jogadores presentes para sortear.');
      return;
    }

    const goalkeepers = shuffle(presentPlayers.filter((player) => player.tipo === 'goleiro'));
    const fieldPlayers = shuffle(presentPlayers.filter((player) => player.tipo !== 'goleiro'));

    if (fieldPlayers.length < 8) {
      showToast('Marque pelo menos 8 jogadores de linha para deixar Time 1 e Time 2 completos.');
      return;
    }

    const linePlayersPerTeam = 4;
    const teamCount = Math.min(TEAM_NAMES.length, Math.max(2, Math.ceil(fieldPlayers.length / linePlayersPerTeam)));
    const teams = TEAM_NAMES.slice(0, teamCount).map((name, index) => makeEmptyTeam(`team_${index + 1}`, name));

    teams.forEach((team, index) => {
      const start = index * linePlayersPerTeam;
      team.jogadores.push(...fieldPlayers.slice(start, start + linePlayersPerTeam).map((player) => player.id));
    });

    fieldPlayers.slice(teamCount * linePlayersPerTeam).forEach((player, index) => {
      teams[index % teams.length].jogadores.push(player.id);
    });

    goalkeepers.forEach((player, index) => {
      teams[index % teams.length].jogadores.push(player.id);
    });

    if (visitorPlayers.length) {
      teams.push(makeEmptyTeam(VISITOR_TEAM_ID, VISITOR_TEAM_NAME, {
        jogadores: visitorPlayers.map((player) => player.id),
        tipo: 'visitante',
      }));
    }

    baba.teams = teams;
    baba.filaTimes = getSequentialTeamIds(teams);
    baba.jogoAtual = null;
    baba.jogos = [];
    baba.lastResult = null;
    baba.pendingTieBreak = null;
    baba.teamRevealIndex = 0;
    baba.status = 'times';
    baba.undoStack = [];
    saveState('Times sorteados: Time 1 e Time 2 com 4 jogadores de linha.');
    setActiveTab('teams');
  }

  function advanceTeamReveal() {
    const baba = getActiveBaba();
    if (!baba?.teams?.length) return;
    baba.teamRevealIndex = Math.min((baba.teamRevealIndex || 0) + 1, baba.teams.length - 1);
    saveState();
  }

  function restartTeamReveal() {
    const baba = getActiveBaba();
    if (!baba?.teams?.length) return;
    baba.teamRevealIndex = 0;
    saveState();
  }

  function startFirstGame() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba || baba.teams.length < 2) return showToast('Sorteie os times antes de iniciar.');
    if (baba.jogoAtual) return showToast('Ja existe um jogo em andamento.');

    const firstGame = !(baba.jogos?.length);
    const teamIds = getSequentialTeamIds(baba.teams);
    let teamAId = null;
    let teamBId = null;
    let order = [];

    if (firstGame && teamIds.includes('team_1') && teamIds.includes('team_2')) {
      teamAId = 'team_1';
      teamBId = 'team_2';
      order = teamIds.filter((id) => id !== teamAId && id !== teamBId);
    } else {
      order = baba.filaTimes.length >= 2 ? [...baba.filaTimes] : teamIds;
      teamAId = order.shift();
      teamBId = order.shift();
    }

    baba.filaTimes = order;
    baba.jogoAtual = buildMatch(baba, teamAId, teamBId);
    startMatchTimer(baba.jogoAtual);
    baba.status = 'jogando';
    saveState('Primeiro jogo iniciado.');
    setActiveTab('dashboard');
  }

  function buildMatch(baba, teamAId, teamBId) {
    return {
      numeroJogo: (baba.jogos?.length || 0) + 1,
      timeA: teamAId,
      timeB: teamBId,
      status: 'preparado',
      placarA: 0,
      placarB: 0,
      gols: [],
      goalEvents: [],
      durationSeconds: 8 * 60,
      timerRemainingSeconds: 8 * 60,
      timerStartedAt: null,
      timerRunning: false,
      iniciadoEm: null,
    };
  }

  function startMatchTimer(match) {
    if (!match) return;
    match.timerRemainingSeconds = Math.max(1, Number(match.timerRemainingSeconds ?? match.durationSeconds ?? 8 * 60));
    match.timerStartedAt = Date.now();
    match.timerRunning = true;
    match.status = 'em_andamento';
    match.iniciadoEm = match.iniciadoEm || Date.now();
  }

  function pauseMatchTimer() {
    if (!requireOrganizer()) return;
    const match = getActiveBaba()?.jogoAtual;
    if (!match) return;
    if (match.timerRunning) {
      match.timerRemainingSeconds = getRemainingSeconds(match);
      match.timerStartedAt = null;
      match.timerRunning = false;
      match.status = 'pausado';
      saveState('Cronometro pausado.');
      return;
    }
    startMatchTimer(match);
    saveState('Cronometro retomado.');
  }

  function editMatchTime() {
    if (!requireOrganizer()) return;
    const match = getActiveBaba()?.jogoAtual;
    if (!match) return;
    const current = Math.ceil(getRemainingSeconds(match) / 60);
    const answer = window.prompt('Novo tempo restante em minutos:', String(current || 8));
    if (answer === null) return;
    const minutes = Number(String(answer).replace(',', '.'));
    if (!Number.isFinite(minutes) || minutes <= 0) return showToast('Tempo invalido.');
    match.timerRemainingSeconds = Math.round(minutes * 60);
    match.durationSeconds = Math.max(match.durationSeconds || 0, match.timerRemainingSeconds);
    if (match.timerRunning) match.timerStartedAt = Date.now();
    saveState('Tempo atualizado.');
  }

  function startPreparedMatch() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const match = baba?.jogoAtual;
    if (!match) return showToast('Nao existe partida preparada.');
    startMatchTimer(match);
    baba.status = 'jogando';
    saveState('Partida iniciada.');
  }

  function startNextGame() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if (baba.jogoAtual) return showToast('Finalize o jogo atual antes do proximo.');
    if (!baba.teams || baba.teams.length < 2) return showToast('Sorteie os times primeiro.');
    startFirstGame();
  }

  function aggregateGoalEvents(events = []) {
    const byPlayer = new Map();
    events.forEach((event) => {
      if (!event?.jogadorId || !event?.time) return;
      const key = `${event.jogadorId}:${event.time}`;
      const current = byPlayer.get(key) || {
        jogadorId: event.jogadorId,
        jogadorNome: event.jogadorNome || playerName(event.jogadorId),
        quantidade: 0,
        time: event.time,
        timeNome: event.timeNome || '',
      };
      current.quantidade += 1;
      byPlayer.set(key, current);
    });
    return Array.from(byPlayer.values());
  }

  function recomputeLiveScore(match) {
    if (!match) return;
    if (!Array.isArray(match.goalEvents)) match.goalEvents = [];
    match.placarA = 0;
    match.placarB = 0;
    if (!match.goalEvents.length) {
      match.gols = [];
      return;
    }
    (match.goalEvents || []).forEach((event) => {
      if (event.time === match.timeA) match.placarA += 1;
      if (event.time === match.timeB) match.placarB += 1;
    });
    match.gols = aggregateGoalEvents(match.goalEvents || []);
  }

  function openGoalPicker(teamId) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const match = baba?.jogoAtual;
    const team = getTeam(baba, teamId);
    if (!match || !team) return showToast('Inicie um jogo primeiro.');
    if (![match.timeA, match.timeB].includes(teamId)) return showToast('Esse time nao esta em campo.');

    goalTeamId = teamId;
    els.goalModalTitle.textContent = `Gol do ${team.name}`;
    const playersHTML = team.jogadores.map((playerId) => `
      <button class="baba-goal-player" type="button" data-goal-player-id="${playerId}">
        <strong>${playerPaymentNameHTML(playerId, baba)}</strong>
        <small>${escapeHTML(team.name)}</small>
      </button>
    `).join('');
    const fieldPlayers = team.jogadores.filter((playerId) => getBabaPlayer(baba, playerId)?.tipo !== 'goleiro');
    const externalPlayerHTML = fieldPlayers.length <= 3 ? `
      <button class="baba-goal-player" type="button" data-goal-player-id="${EXTERNAL_GOAL_SCORER_ID}">
        <strong>Jogador de fora</strong>
        <small>Gol sem artilheiro cadastrado</small>
      </button>
    ` : '';
    els.goalPlayerList.innerHTML = `${playersHTML}${externalPlayerHTML}`;
    els.goalModal.classList.remove('hidden');
  }

  function closeGoalPicker() {
    goalTeamId = null;
    els.goalModal.classList.add('hidden');
  }

  function registerGoal(playerId) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const match = baba?.jogoAtual;
    const team = getTeam(baba, goalTeamId);
    const isExternalPlayer = playerId === EXTERNAL_GOAL_SCORER_ID;
    const player = isExternalPlayer ? null : getBabaPlayer(baba, playerId);
    if (!match || !team || (!isExternalPlayer && !player)) return;

    match.goalEvents = match.goalEvents || [];
    const elapsed = Math.max(0, Number(match.durationSeconds || 8 * 60) - getRemainingSeconds(match));
    match.goalEvents.push({
      id: newId('goal'),
      jogadorId: player?.id || null,
      jogadorNome: player?.nome || 'Jogador de fora',
      external: isExternalPlayer,
      time: team.id,
      timeNome: team.name,
      minuto: Math.max(1, Math.ceil(elapsed / 60)),
      registradoEm: Date.now(),
    });
    recomputeLiveScore(match);
    closeGoalPicker();
    saveState(isExternalPlayer ? 'Gol de jogador de fora registrado.' : `Gol de ${player.nome} registrado.`);
  }

  function undoLastGoal() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const match = baba?.jogoAtual;
    if (!match?.goalEvents?.length) return showToast('Nenhum gol para desfazer.');
    const removed = match.goalEvents.pop();
    recomputeLiveScore(match);
    saveState(`Gol de ${removed.jogadorNome || 'jogador'} desfeito.`);
  }

  function finishMatch(event) {
    event?.preventDefault();
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const match = baba?.jogoAtual;
    if (!baba || !match) return showToast('Nao existe jogo em andamento.');

    recomputeLiveScore(match);
    const scoreA = Number(match.placarA || 0);
    const scoreB = Number(match.placarB || 0);
    const teamA = getTeam(baba, match.timeA);
    const teamB = getTeam(baba, match.timeB);
    if (!teamA || !teamB) return showToast('Times do jogo nao encontrados.');

    const goals = match.gols || aggregateGoalEvents(match.goalEvents || []);

    baba.undoStack = normalizeUndoStack(baba.undoStack);
    baba.undoStack.push(createUndoSnapshot(baba));
    if (baba.undoStack.length > 10) baba.undoStack.shift();

    const empate = scoreA === scoreB;
    let vencedor = null;
    let perdedor = null;
    let timeQueContinuou = null;
    let timeQueSaiu = null;
    let decididoPorSorteio = false;
    let motivoSaida = 'derrota';
    let pendingTieBreak = null;
    let nextMatchPair = null;

    teamA.golsPro += scoreA;
    teamA.golsContra += scoreB;
    teamB.golsPro += scoreB;
    teamB.golsContra += scoreA;

    if (empate) {
      teamA.pontos += 1;
      teamB.pontos += 1;
      teamA.empates += 1;
      teamB.empates += 1;
      motivoSaida = baba.teams.length >= 4 ? 'empate: dois times sairam' : 'empate aguardando criterio';

      if (baba.teams.length >= 4) {
        timeQueContinuou = null;
        timeQueSaiu = `${teamA.id},${teamB.id}`;
        const nextQueue = [...(baba.filaTimes || []), teamA.id, teamB.id];
        const nextA = nextQueue.shift();
        const nextB = nextQueue.shift();
        baba.filaTimes = nextQueue;
        nextMatchPair = nextA && nextB ? [nextA, nextB] : null;
      } else if (baba.teams.length === 3) {
        decididoPorSorteio = true;
        motivoSaida = 'empate aguardando impar/par';
        pendingTieBreak = {
          gameNumber: match.numeroJogo,
          tiedTeams: [teamA.id, teamB.id],
          queue: [...(baba.filaTimes || [])],
          criterioDesempate: 'impar_par',
          createdAt: Date.now(),
        };
      } else {
        decididoPorSorteio = true;
        const sorted = shuffle([teamA.id, teamB.id]);
        timeQueContinuou = sorted[0];
        timeQueSaiu = sorted[1];
        motivoSaida = 'sorteio por empate';
      }
    } else if (scoreA > scoreB) {
      vencedor = teamA.id;
      perdedor = teamB.id;
      timeQueContinuou = teamA.id;
      timeQueSaiu = teamB.id;
      teamA.pontos += 3;
      teamA.vitorias += 1;
      teamB.derrotas += 1;
    } else {
      vencedor = teamB.id;
      perdedor = teamA.id;
      timeQueContinuou = teamB.id;
      timeQueSaiu = teamA.id;
      teamB.pontos += 3;
      teamB.vitorias += 1;
      teamA.derrotas += 1;
    }

    const savedGame = {
      numeroJogo: match.numeroJogo,
      dataHora: Date.now(),
      timeA: teamA.id,
      timeB: teamB.id,
      timeANome: teamA.name,
      timeBNome: teamB.name,
      placarA: scoreA,
      placarB: scoreB,
      gols: goals,
      goalEvents: match.goalEvents || [],
      vencedor,
      perdedor,
      empate,
      resultado: empate ? 'empate' : 'vitoria',
      timeQueContinuou,
      timeQueSaiu,
      motivoSaida,
      decididoPorSorteio,
      criterioDesempate: pendingTieBreak ? 'impar_par' : (empate && decididoPorSorteio ? 'sorteio' : null),
      pendingTieBreak: Boolean(pendingTieBreak),
      finalizadoEm: Date.now(),
    };

    baba.jogos.push(savedGame);
    baba.rankingDoBaba = calculateDailyRanking(baba);

    baba.lastResult = {
      jogo: savedGame.numeroJogo,
      timeA: teamA.id,
      timeB: teamB.id,
      placarA: scoreA,
      placarB: scoreB,
      resumo: `${teamA.name} ${scoreA} x ${scoreB} ${teamB.name}`,
      empate,
      resultado: savedGame.resultado,
      timeQueContinuou,
      timeQueSaiu,
      motivoSaida,
      decididoPorSorteio,
      criterioDesempate: savedGame.criterioDesempate,
    };

    if (pendingTieBreak) {
      baba.pendingTieBreak = pendingTieBreak;
      baba.jogoAtual = null;
      baba.status = 'empate_pendente';
    } else if (nextMatchPair) {
      baba.pendingTieBreak = null;
      baba.jogoAtual = buildMatch(baba, nextMatchPair[0], nextMatchPair[1]);
      baba.status = 'preparado';
    } else {
      const nextQueue = [...(baba.filaTimes || []), timeQueSaiu].filter(Boolean);
      const nextTeamId = nextQueue.shift();
      baba.filaTimes = nextQueue;
      baba.pendingTieBreak = null;
      if (nextTeamId && timeQueContinuou) {
        baba.jogoAtual = buildMatch(baba, timeQueContinuou, nextTeamId);
        baba.status = 'preparado';
      } else {
        baba.jogoAtual = null;
        baba.status = 'times';
      }
    }

    if (pendingTieBreak) {
      saveState('Empate salvo. Defina no impar/par quem fica em quadra.');
    } else {
      saveState(empate && baba.teams.length >= 4 ? 'Empate salvo. Os dois times sairam e os proximos entraram.' : 'Jogo salvo. Proxima partida preparada.');
    }
  }

  function resolveThreeTeamTie(keepTeamId) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const pending = baba?.pendingTieBreak;
    if (!baba || !pending) return showToast('Nao ha empate pendente para decidir.');

    const route = getPendingTieBreakRoute(baba, pending);
    if (!route.nextTeamId || route.tiedTeamIds.length < 2) return showToast('Nao foi possivel montar o proximo jogo.');

    const chosen = String(keepTeamId || '').trim();
    if (!route.tiedTeamIds.includes(chosen)) return showToast('Escolha o time que venceu no impar/par.');

    const out = route.tiedTeamIds.find((id) => id !== chosen);
    const resolvedAt = Date.now();
    baba.filaTimes = [...route.remainingQueue, out].filter(Boolean);
    baba.jogoAtual = buildMatch(baba, chosen, route.nextTeamId);
    baba.pendingTieBreak = null;
    baba.status = 'preparado';

    const savedGames = baba.jogos || [];
    const resolvedGame = savedGames.find((game) => String(game.numeroJogo) === String(pending.gameNumber))
      || savedGames[savedGames.length - 1];
    if (resolvedGame) {
      resolvedGame.timeQueContinuou = chosen;
      resolvedGame.timeQueSaiu = out;
      resolvedGame.timeQueEntrou = route.nextTeamId;
      resolvedGame.motivoSaida = 'impar/par no empate';
      resolvedGame.decididoPorSorteio = true;
      resolvedGame.criterioDesempate = 'impar_par';
      resolvedGame.pendingTieBreak = false;
      resolvedGame.desempateResolvidoEm = resolvedAt;
    }

    baba.lastResult = {
      ...(baba.lastResult || {}),
      timeQueContinuou: chosen,
      timeQueSaiu: out,
      timeQueEntrou: route.nextTeamId,
      motivoSaida: 'impar/par no empate',
      decididoPorSorteio: true,
      criterioDesempate: 'impar_par',
      desempateResolvidoEm: resolvedAt,
    };
    baba.rankingDoBaba = calculateDailyRanking(baba);
    saveState(`${getTeam(baba, chosen)?.name || 'Time'} continua pelo impar/par.`);
  }

  function undoLastGame() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const lastSnapshot = baba?.undoStack?.pop();
    if (!lastSnapshot) return showToast('Nao ha jogo para desfazer.');
    if (typeof lastSnapshot === 'string') {
      const restored = JSON.parse(lastSnapshot);
      const index = state.babas.findIndex((item) => item.id === restored.id);
      if (index >= 0) state.babas[index] = restored;
    } else {
      baba.teams = JSON.parse(JSON.stringify(lastSnapshot.teams || []));
      baba.filaTimes = [...(lastSnapshot.filaTimes || [])];
      baba.jogoAtual = lastSnapshot.jogoAtual ? JSON.parse(JSON.stringify(lastSnapshot.jogoAtual)) : null;
      baba.jogos = (baba.jogos || []).slice(0, Number(lastSnapshot.jogosLength || 0));
      baba.lastResult = lastSnapshot.lastResult ? JSON.parse(JSON.stringify(lastSnapshot.lastResult)) : null;
      baba.pendingTieBreak = lastSnapshot.pendingTieBreak ? JSON.parse(JSON.stringify(lastSnapshot.pendingTieBreak)) : null;
      baba.status = lastSnapshot.status || 'jogando';
      baba.teamRevealIndex = Number(lastSnapshot.teamRevealIndex || 0);
      baba.campeaoDoBaba = lastSnapshot.campeaoDoBaba ? JSON.parse(JSON.stringify(lastSnapshot.campeaoDoBaba)) : null;
      baba.finalizadoEm = lastSnapshot.finalizadoEm || null;
      baba.rankingDoBaba = calculateDailyRanking(baba);
    }
    saveState('Ultimo jogo desfeito.');
  }

  function finishBaba() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if (!baba.teams?.length) return showToast('Sorteie os times antes de finalizar.');
    if (baba.pendingTieBreak) return showToast('Resolva o empate no impar/par antes de finalizar o baba.');
    if (baba.jogoAtual) {
      const ok = confirm('Existe um jogo em andamento. Finalizar o baba sem salvar esse jogo?');
      if (!ok) return;
      baba.jogoAtual = null;
    }

    const champions = calculateChampions(baba);
    baba.campeaoDoBaba = {
      times: champions.map((team) => team.id),
      nomes: champions.map((team) => team.name),
      jogadores: champions.flatMap((team) => team.jogadores),
      definidoEm: Date.now(),
    };
    baba.rankingDoBaba = calculateDailyRanking(baba);
    baba.status = 'finalizado';
    baba.finalizadoEm = Date.now();
    saveState('Baba finalizado e salvo no historico.');
    setActiveTab('history');
  }

  function resetCurrentBaba() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return;
    const ok = confirm('Resetar apenas o baba atual? O historico finalizado sera mantido.');
    if (!ok) return;
    state.babas = state.babas.filter((item) => item.id !== baba.id);
    state.activeBabaId = state.babas.find((item) => item.status !== 'finalizado')?.id || null;
    saveState('Baba atual resetado.');
  }

  function deleteHistoryBaba(babaId) {
    if (!requireOrganizer()) return;
    const baba = state.babas.find((item) => item.id === babaId && item.status === 'finalizado');
    if (!baba) return;
    const ok = confirm(`Excluir o baba de ${baba.dataCompleta} do historico?`);
    if (!ok) return;
    state.babas = state.babas.filter((item) => item.id !== babaId);
    if (selectedHistoryId === babaId) selectedHistoryId = null;
    if (state.activeBabaId === babaId) {
      state.activeBabaId = state.babas.find((item) => item.status !== 'finalizado')?.id || null;
    }
    saveState('Baba removido do historico.');
  }

  function calculateChampions(baba) {
    const teams = [...(baba.teams || [])];
    if (!teams.length) return [];

    teams.sort((a, b) => (
      b.pontos - a.pontos ||
      b.vitorias - a.vitorias ||
      (b.golsPro - b.golsContra) - (a.golsPro - a.golsContra) ||
      b.golsPro - a.golsPro
    ));

    const best = teams[0];
    return teams.filter((team) => (
      team.pontos === best.pontos &&
      team.vitorias === best.vitorias &&
      (team.golsPro - team.golsContra) === (best.golsPro - best.golsContra) &&
      team.golsPro === best.golsPro
    ));
  }

  function calculateDailyRanking(baba) {
    const ranking = {};
    const playerIds = new Set([...(baba?.jogadoresPresentes || [])]);
    (baba?.teams || []).forEach((team) => (team.jogadores || []).forEach((id) => playerIds.add(id)));
    (baba?.visitantes || []).forEach((player) => playerIds.add(player.id));

    playerIds.forEach((playerId) => {
      ranking[playerId] = makeEmptyPlayerStats(playerId, playerName(playerId, baba));
      ranking[playerId].totalBabas = 1;
    });

    (baba.jogos || []).forEach((game) => {
      const teamA = getTeam(baba, game.timeA);
      const teamB = getTeam(baba, game.timeB);
      if (!teamA || !teamB) return;

      if (game.empate) {
        [...teamA.jogadores, ...teamB.jogadores].forEach((id) => ensureStats(ranking, id, baba).totalEmpates += 1);
      } else {
        const winTeam = getTeam(baba, game.vencedor);
        const loseTeam = getTeam(baba, game.perdedor);
        winTeam?.jogadores.forEach((id) => ensureStats(ranking, id, baba).totalVitorias += 1);
        loseTeam?.jogadores.forEach((id) => ensureStats(ranking, id, baba).totalDerrotas += 1);
      }

      (game.gols || []).forEach((goal) => {
        ensureStats(ranking, goal.jogadorId, baba).totalGols += Number(goal.quantidade || 0);
      });
    });

    if (baba.campeaoDoBaba?.jogadores) {
      baba.campeaoDoBaba.jogadores.forEach((id) => ensureStats(ranking, id, baba).totalTitulosBaba += 1);
    }

    Object.values(ranking).forEach(finalizeStats);
    return ranking;
  }

  function calculateGeneralRanking() {
    if (state.playerStats && Object.keys(state.playerStats).length) {
      const persisted = JSON.parse(JSON.stringify(state.playerStats));
      Object.values(persisted).forEach(finalizeStats);
      return persisted;
    }
    const ranking = {};
    state.players.forEach((player) => {
      ranking[player.id] = makeEmptyPlayerStats(player.id, player.nome);
    });

    state.babas.filter((baba) => baba.status === 'finalizado').forEach((baba) => {
      const playerIds = new Set([...(baba.jogadoresPresentes || [])]);
      (baba.teams || []).forEach((team) => (team.jogadores || []).forEach((id) => playerIds.add(id)));
      (baba.visitantes || []).forEach((player) => playerIds.add(player.id));
      playerIds.forEach((id) => ensureStats(ranking, id, baba).totalBabas += 1);
      if (baba.campeaoDoBaba?.jogadores) {
        baba.campeaoDoBaba.jogadores.forEach((id) => ensureStats(ranking, id, baba).totalTitulosBaba += 1);
      }

      (baba.jogos || []).forEach((game) => {
        const teamA = getTeam(baba, game.timeA);
        const teamB = getTeam(baba, game.timeB);
        if (!teamA || !teamB) return;

        if (game.empate) {
          [...teamA.jogadores, ...teamB.jogadores].forEach((id) => ensureStats(ranking, id, baba).totalEmpates += 1);
        } else {
          getTeam(baba, game.vencedor)?.jogadores.forEach((id) => ensureStats(ranking, id, baba).totalVitorias += 1);
          getTeam(baba, game.perdedor)?.jogadores.forEach((id) => ensureStats(ranking, id, baba).totalDerrotas += 1);
        }

        (game.gols || []).forEach((goal) => {
          ensureStats(ranking, goal.jogadorId, baba).totalGols += Number(goal.quantidade || 0);
        });
      });
    });

    Object.values(ranking).forEach(finalizeStats);
    return ranking;
  }

  function mergeRankingStats(ranking, stats) {
    if (!stats?.jogadorId) return;
    const target = ranking[stats.jogadorId] || makeEmptyPlayerStats(stats.jogadorId, stats.nome);
    target.nome = target.nome || stats.nome;
    target.totalGols += Number(stats.totalGols || 0);
    target.totalVitorias += Number(stats.totalVitorias || 0);
    target.totalEmpates += Number(stats.totalEmpates || 0);
    target.totalDerrotas += Number(stats.totalDerrotas || 0);
    target.totalJogos += Number(stats.totalJogos || 0);
    target.totalBabas += Number(stats.totalBabas || 0);
    target.totalTitulosBaba += Number(stats.totalTitulosBaba || 0);
    ranking[stats.jogadorId] = target;
  }

  function calculateMonthlyRanking(monthKey, { includeActive = false } = {}) {
    const persisted = state.monthlyStats?.[monthKey];
    const ranking = persisted ? JSON.parse(JSON.stringify(persisted)) : {};
    if (!persisted) {
      state.babas
        .filter((baba) => baba.status === 'finalizado' && monthKeyFromISO(baba.dataISO) === monthKey)
        .forEach((baba) => {
          Object.values(calculateDailyRanking(baba)).forEach((stats) => mergeRankingStats(ranking, stats));
        });
    }

    const active = getActiveBaba();
    if (includeActive && active && active.status !== 'finalizado' && monthKeyFromISO(active.dataISO) === monthKey) {
      Object.values(calculateCurrentBabaRanking(active)).forEach((stats) => mergeRankingStats(ranking, stats));
    }

    Object.values(ranking).forEach(finalizeStats);
    return ranking;
  }

  function ensureGoalkeeperStats(ranking, player, baba) {
    if (!player?.id) return null;
    if (!ranking[player.id]) {
      ranking[player.id] = {
        jogadorId: player.id,
        nome: player.nome || playerName(player.id, baba),
        jogos: 0,
        golsSofridos: 0,
        mediaSofridos: 0,
        totalBabas: 0,
        _babas: new Set(),
      };
    }
    if (!(ranking[player.id]._babas instanceof Set)) ranking[player.id]._babas = new Set();
    if (baba?.id) ranking[player.id]._babas.add(baba.id);
    return ranking[player.id];
  }

  function addGoalkeeperGameStats(ranking, baba, team, goalsAgainst) {
    (team?.jogadores || []).forEach((playerId) => {
      const player = getBabaPlayer(baba, playerId);
      if (player?.tipo !== 'goleiro') return;
      const stats = ensureGoalkeeperStats(ranking, player, baba);
      if (!stats) return;
      stats.jogos += 1;
      stats.golsSofridos += Number(goalsAgainst || 0);
    });
  }

  function collectGoalkeeperRankingFromBaba(ranking, baba, { includeLive = false } = {}) {
    (baba?.jogos || []).forEach((game) => {
      const teamA = getTeam(baba, game.timeA);
      const teamB = getTeam(baba, game.timeB);
      if (!teamA || !teamB) return;
      addGoalkeeperGameStats(ranking, baba, teamA, game.placarB);
      addGoalkeeperGameStats(ranking, baba, teamB, game.placarA);
    });

    const match = includeLive ? baba?.jogoAtual : null;
    const hasLiveData = Boolean(match && (match.iniciadoEm || (match.goalEvents || []).length));
    if (!hasLiveData) return;
    const teamA = getTeam(baba, match.timeA);
    const teamB = getTeam(baba, match.timeB);
    if (!teamA || !teamB) return;
    addGoalkeeperGameStats(ranking, baba, teamA, match.placarB);
    addGoalkeeperGameStats(ranking, baba, teamB, match.placarA);
  }

  function calculateGoalkeeperRanking({ includeActive = true } = {}) {
    const ranking = {};
    const persisted = Object.values(state.playerStats || {}).filter((stats) => Number(stats.goalkeeperGames || 0) > 0);
    if (persisted.length) {
      persisted.forEach((stats) => {
        ranking[stats.jogadorId || stats.playerId] = {
          jogadorId: stats.jogadorId || stats.playerId,
          nome: stats.nome || stats.name || playerName(stats.jogadorId || stats.playerId),
          jogos: Number(stats.goalkeeperGames || 0),
          golsSofridos: Number(stats.goalsConceded || 0),
          totalBabas: Number(stats.totalBabas || 0),
          _persistedBabas: Number(stats.totalBabas || 0),
          _babas: new Set(),
        };
      });
    } else {
      state.babas
        .filter((baba) => baba.status === 'finalizado')
        .forEach((baba) => collectGoalkeeperRankingFromBaba(ranking, baba));
    }

    const active = getActiveBaba();
    if (includeActive && active && active.status !== 'finalizado') {
      collectGoalkeeperRankingFromBaba(ranking, active, { includeLive: true });
    }

    return Object.values(ranking)
      .map((stats) => {
        stats.totalBabas = Number(stats._persistedBabas || 0) + (stats._babas?.size || 0);
        delete stats._babas;
        delete stats._persistedBabas;
        stats.mediaSofridos = stats.jogos ? Number((stats.golsSofridos / stats.jogos).toFixed(2)) : 0;
        return stats;
      })
      .filter((stats) => stats.jogos > 0)
      .sort((a, b) => (
        a.golsSofridos - b.golsSofridos ||
        a.mediaSofridos - b.mediaSofridos ||
        b.jogos - a.jogos ||
        a.nome.localeCompare(b.nome)
      ));
  }

  function getAvailableMonthKeys() {
    const keys = new Set();
    state.babas.forEach((baba) => {
      const key = monthKeyFromISO(baba.dataISO);
      if (key) keys.add(key);
    });
    const activeKey = activeMonthKey();
    if (activeKey) keys.add(activeKey);
    Object.keys(state.monthlyPayments || {}).forEach((key) => keys.add(key));
    Object.keys(state.monthlyStats || {}).forEach((key) => keys.add(key));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }

  function makeEmptyPlayerStats(playerId, name) {
    return {
      jogadorId: playerId,
      nome: name || playerName(playerId),
      totalGols: 0,
      totalVitorias: 0,
      totalEmpates: 0,
      totalDerrotas: 0,
      totalJogos: 0,
      totalBabas: 0,
      totalTitulosBaba: 0,
      mediaGols: 0,
      aproveitamento: 0,
    };
  }

  function ensureStats(ranking, playerId, baba = getActiveBaba()) {
    if (!ranking[playerId]) ranking[playerId] = makeEmptyPlayerStats(playerId, playerName(playerId, baba));
    return ranking[playerId];
  }

  function finalizeStats(stats) {
    const games = stats.totalVitorias + stats.totalEmpates + stats.totalDerrotas;
    const points = stats.totalVitorias * 3 + stats.totalEmpates;
    stats.totalJogos = games;
    stats.mediaGols = stats.totalBabas ? Number((stats.totalGols / stats.totalBabas).toFixed(2)) : 0;
    stats.aproveitamento = games ? Math.round((points / (games * 3)) * 100) : 0;
    return stats;
  }

  function render() {
    const baba = getActiveBaba();
    renderHeader(baba);
    renderMetrics(baba);
    renderPlayersAdmin();
    renderPresentList(baba);
    renderGoalsAndPayments(baba);
    renderTeams(baba);
    renderDashboard(baba);
    renderStandings(baba);
    renderDailyTopScorers(baba);
    renderCurrentGames(baba);
    renderRankings(baba);
    renderHistory();
    renderTimerOnly();
  }

  function setFlowButton(button, state) {
    if (!button) return;
    const classes = ['is-flow-primary', 'is-flow-complete', 'is-flow-next', 'is-flow-disabled', 'is-flow-neutral', 'is-flow-danger'];
    button.classList.remove(...classes);
    button.classList.add(`is-flow-${state.variant || 'neutral'}`);
    button.disabled = Boolean(state.disabled);
    button.classList.toggle('hidden', Boolean(state.hidden));
    if (state.label) {
      button.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) node.nodeValue = state.label;
      });
      if (!button.querySelector(':scope > .baba-btn-icon') && !button.textContent.trim()) button.textContent = state.label;
    }
    button.setAttribute('aria-disabled', state.disabled ? 'true' : 'false');
  }

  function renderOrganizerControl(baba) {
    const hasOpenBaba = Boolean(baba && baba.status !== 'finalizado');
    const hasPresentPlayers = Boolean((baba?.jogadoresPresentes || []).length);
    const hasDrawnTeams = Boolean((baba?.teams || []).length);
    const hasFinishedGame = Boolean((baba?.jogos || []).length);
    const canDrawTeams = hasOpenBaba && hasPresentPlayers;
    const canOpenTeams = hasOpenBaba && hasDrawnTeams;

    if (els.dateDisplay) els.dateDisplay.textContent = formatBabaDateLong(baba?.dataISO || todayISO());

    setFlowButton(els.markPresent, {
      variant: !hasOpenBaba ? 'disabled' : (hasPresentPlayers ? 'complete' : 'primary'),
      disabled: !hasOpenBaba,
    });
    setFlowButton(els.drawTeams, {
      variant: !canDrawTeams ? 'disabled' : (hasDrawnTeams ? 'complete' : 'next'),
      disabled: !canDrawTeams,
    });
    setFlowButton(els.startFirstGame, {
      variant: !canOpenTeams ? 'disabled' : 'next',
      disabled: !canOpenTeams,
    });
    setFlowButton(els.undoGame, {
      variant: 'neutral',
      hidden: !hasFinishedGame,
      disabled: !hasFinishedGame,
    });
    setFlowButton(els.finishBaba, {
      variant: 'neutral',
      disabled: !hasOpenBaba,
    });
    setFlowButton(els.resetCurrent, {
      variant: 'danger',
      disabled: !hasOpenBaba,
    });
  }

  function renderHeader(baba) {
    if (baba) {
      els.activeStatus.textContent = baba.status === 'finalizado' ? `Finalizado em ${baba.dataCompleta}` : `Baba aberto - ${baba.dataCompleta}`;
      els.activeSubtitle.textContent = baba.status === 'finalizado'
        ? 'Baba salvo no historico. Crie um novo baba para a proxima rodada.'
        : 'Marque os presentes, sorteie os times e deixe o rodizio trabalhar.';
      if (els.dateInput) els.dateInput.value = baba.dataISO || todayISO();
    } else {
      els.activeStatus.textContent = 'Nenhum baba aberto';
      els.activeSubtitle.textContent = 'Crie o baba de hoje para iniciar a convocacao e o sorteio dos times.';
      if (els.dateInput) els.dateInput.value = todayISO();
    }

    const hasOpenBaba = Boolean(baba && baba.status !== 'finalizado');
    els.createToday.classList.toggle('hidden', hasOpenBaba);
    els.saveHistory.classList.toggle('hidden', !hasOpenBaba);
    els.saveHistory.textContent = 'Finalizar e Salvar';
    renderOrganizerControl(baba);
  }

  function renderMetrics(baba) {
    const current = baba?.jogoAtual;
    const teamA = getTeam(baba, current?.timeA);
    const teamB = getTeam(baba, current?.timeB);
    const nextTeam = getTeam(baba, baba?.filaTimes?.[0]);

    els.fieldTeamA.innerHTML = teamA ? teamDetailButton(baba, teamA) : teamLabel(teamA);
    els.fieldTeamB.innerHTML = teamB ? teamDetailButton(baba, teamB) : teamLabel(teamB);
    els.liveScore.innerHTML = current ? scoreBadgeHTML(current.placarA, current.placarB) : scoreBadgeHTML(0, 0);
    els.metricPresent.textContent = String(baba?.jogadoresPresentes?.length || 0);
    els.metricTeams.textContent = String(baba?.teams?.length || 0);
    els.metricGames.textContent = String(baba?.jogos?.length || 0);
    els.metricNextTeam.textContent = nextTeam?.name || '-';
  }

  function renderPlayersAdmin() {
    const baba = getActiveBaba();
    const visitors = baba?.visitantes || [];
    const fixedHTML = state.players.length ? state.players.map((player) => {
      const paid = playerPaymentState(player.id, baba, { force: true }) === 'paid';
      const meta = [
        player.tipo === 'goleiro' ? '<small class="baba-goalie-pill">Goleiro</small>' : '',
        player.ativo ? '' : '<small class="baba-status-pill">Inativo</small>',
      ].filter(Boolean).join('');
      return `
      <div class="baba-player-admin">
        <div class="baba-player-admin__info">
          <strong>${playerPaymentNameHTML(player.id, baba, { name: player.nome, force: true })}</strong>
          ${meta ? `<div class="baba-player-admin__meta">${meta}</div>` : ''}
        </div>
        <div class="baba-player-admin__actions">
          <button class="baba-mini-btn" type="button" data-action="toggle-payment" data-id="${player.id}">${paid ? 'Pagamento pendente' : 'Pagamento pago'}</button>
          <button class="baba-mini-btn" type="button" data-action="toggle-player" data-id="${player.id}">${player.ativo ? 'Desativar' : 'Ativar'}</button>
          <button class="baba-mini-btn danger" type="button" data-action="delete-player" data-id="${player.id}">Excluir</button>
        </div>
      </div>
    `;
    }).join('') : '<div class="baba-empty">Cadastre a lista fixa de jogadores do baba.</div>';

    const visitorHTML = visitors.length ? visitors.map((player) => `
      <div class="baba-player-admin">
        <div class="baba-player-admin__info">
          <strong>${playerPaymentNameHTML(player.id, baba, { name: player.nome, force: true })}</strong>
          <div class="baba-player-admin__meta"><small class="baba-visitor-pill">Visitante do baba atual</small></div>
        </div>
        <div class="baba-player-admin__actions">
          <button class="baba-mini-btn" type="button" data-action="toggle-payment" data-id="${player.id}">${playerPaymentState(player.id, baba, { force: true }) === 'paid' ? 'Pagamento pendente' : 'Pagamento pago'}</button>
          <button class="baba-mini-btn danger" type="button" data-action="delete-visitor" data-id="${player.id}">Remover</button>
        </div>
      </div>
    `).join('') : '<div class="baba-empty">Visitantes aparecem aqui e somem no proximo baba.</div>';

    els.playersAdminList.innerHTML = `
      <div class="baba-admin-section">
        <span>Lista fixa</span>
        ${fixedHTML}
      </div>
      <div class="baba-admin-section">
        <span>Visitantes do baba</span>
        ${visitorHTML}
      </div>
    `;
  }

  function renderPresentList(baba) {
    const activePlayers = state.players.filter((player) => player.ativo);
    const present = new Set(baba?.jogadoresPresentes || []);
    els.presentCountLabel.textContent = `${present.size} marcados`;

    if (!activePlayers.length) {
      els.presentList.innerHTML = '<div class="baba-empty">Cadastre jogadores para montar a lista de presenca.</div>';
      return;
    }

    els.presentList.innerHTML = activePlayers.map((player) => {
      const checked = present.has(player.id);
      return `
        <label class="baba-present-item ${checked ? 'is-checked' : ''}">
          <input type="checkbox" data-present-id="${player.id}" ${checked ? 'checked' : ''} ${!isOrganizer() ? 'disabled' : ''}>
          <span>
            <strong>${playerPaymentNameHTML(player.id, baba, { name: player.nome, force: Boolean(baba) })}</strong>
            ${player.tipo === 'goleiro' ? '<small>Goleiro</small>' : ''}
          </span>
        </label>
      `;
    }).join('');
  }

  function renderGoalsAndPayments(baba) {
    renderGoalsSummary();
    renderPurchaseGoals();
    renderPayments(baba);
  }

  function renderGoalsSummary() {
    if (!els.goalsSummary) return;
    const goals = state.purchaseGoals || [];
    const balance = getBabaAccountBalance();
    const target = goals.reduce((sum, goal) => sum + Number(goal.valor || 0), 0);
    const collected = goals.reduce((sum, goal) => sum + Number(goal.arrecadado || 0), 0);
    const remaining = Math.max(0, target - collected);
    const progress = target ? Math.min(100, Math.round((collected / target) * 100)) : 0;

    els.goalsSummary.innerHTML = `
      <article>
        <span>Saldo da conta</span>
        <strong>${formatCurrency(balance)}</strong>
        <small>Pagamentos confirmados</small>
      </article>
      <article>
        <span>Metas ativas</span>
        <strong>${goals.length}</strong>
        <small>Produtos cadastrados</small>
      </article>
      <article>
        <span>Arrecadado</span>
        <strong>${formatCurrency(collected)}</strong>
        <small>${progress}% do total</small>
      </article>
      <article>
        <span>Falta</span>
        <strong>${formatCurrency(remaining)}</strong>
        <small>Para bater as metas</small>
      </article>
    `;
  }

  function goalImageHTML(goal) {
    if (goal.foto) {
      return `<img src="${escapeHTML(goal.foto)}" alt="${escapeHTML(goal.nome)}">`;
    }
    return `<svg aria-hidden="true" focusable="false"><use href="#baba-image"></use></svg>`;
  }

  function renderPurchaseGoals() {
    if (!els.goalsList) return;
    const goals = [...(state.purchaseGoals || [])].sort((a, b) => (
      goalPriorityMeta(b.prioridade).value - goalPriorityMeta(a.prioridade).value ||
      Number(b.atualizadoEm || b.criadoEm || 0) - Number(a.atualizadoEm || a.criadoEm || 0)
    ));
    if (els.goalsCountLabel) els.goalsCountLabel.textContent = `${goals.length} metas`;

    if (!goals.length) {
      els.goalsList.innerHTML = '<div class="baba-empty">Nenhuma meta cadastrada ainda. Use o painel do organizador para adicionar o primeiro produto.</div>';
      return;
    }

    els.goalsList.innerHTML = goals.map((goal) => {
      const target = Number(goal.valor || 0);
      const collected = Number(goal.arrecadado || 0);
      const remaining = Math.max(0, target - collected);
      const progress = target ? Math.min(100, Math.round((collected / target) * 100)) : 0;
      const priority = goalPriorityMeta(goal.prioridade);
      return `
        <article class="baba-goal-card">
          <div class="baba-goal-card__image">
            ${goalImageHTML(goal)}
          </div>
          <div class="baba-goal-card__body">
            <div class="baba-goal-card__title">
              <strong>${escapeHTML(goal.nome)}</strong>
              <div class="baba-goal-card__badges">
                <span class="is-priority-${priority.id === 'alta' ? 'high' : priority.id === 'baixa' ? 'low' : 'medium'}">${priority.label}</span>
                <span>${progress}%</span>
              </div>
            </div>
            ${goal.descricao ? `<p>${escapeHTML(goal.descricao)}</p>` : ''}
            <div class="baba-goal-progress" aria-label="Progresso da meta ${progress}%">
              <span style="width: ${progress}%"></span>
            </div>
            <div class="baba-goal-money">
              <span><small>Valor</small><b>${formatCurrency(target)}</b></span>
              <span><small>Arrecadado</small><b>${formatCurrency(collected)}</b></span>
              <span><small>Falta</small><b>${formatCurrency(remaining)}</b></span>
            </div>
            ${isOrganizer() ? `
              <div class="baba-goal-inline-edit">
                <label>
                  <span>Atualizar arrecadado</span>
                  <input type="number" min="0" step="0.01" value="${collected}" data-goal-collected-id="${goal.id}">
                </label>
                <button class="baba-mini-btn" type="button" data-action="edit-goal" data-id="${goal.id}">Editar</button>
                <button class="baba-mini-btn" type="button" data-action="save-goal-collected" data-id="${goal.id}">Salvar</button>
                <button class="baba-mini-btn danger" type="button" data-action="delete-goal" data-id="${goal.id}">Excluir</button>
              </div>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  function renderPayments(baba) {
    if (!els.paymentSummary || !els.paymentList) return;

    const monthKey = currentPaymentMonthKey();
    const players = getPaymentPlayers(baba);
    const stats = getPaymentStats(baba);
    const pending = Math.max(0, stats.expected - stats.paid);
    const pendingCount = Math.max(0, stats.players - stats.paidCount);

    els.paymentSummary.innerHTML = `
      <article>
        <span>Esperado</span>
        <strong>${formatCurrency(stats.expected)}</strong>
        <small>${stats.players} jogadores - ${paymentMonthLabel(monthKey)}</small>
      </article>
      <article>
        <span>Pago</span>
        <strong>${formatCurrency(stats.paid)}</strong>
        <small>${stats.paidCount} confirmados</small>
      </article>
      <article>
        <span>Vence dia 30</span>
        <strong>${formatCurrency(pending)}</strong>
        <small>${pendingCount} faltando - ${paymentDueDateLabel(monthKey)}</small>
      </article>
    `;

    if (!players.length) {
      els.paymentList.innerHTML = '<div class="baba-empty">Cadastre a lista fixa para controlar os pagamentos mensais.</div>';
      return;
    }

    els.paymentList.innerHTML = players.map((player) => {
      const paid = isPlayerPaidThisMonth(player.id, baba);
      const price = paymentPriceForPlayer(player);
      const label = player.tipo === 'goleiro' ? 'Goleiro' : (player.visitante ? 'Visitante' : 'Jogador');
      return `
        <div class="baba-payment-item ${paid ? 'is-paid' : 'is-unpaid'}">
          <div class="baba-payment-main">
            <strong class="baba-payment-name ${paid ? 'is-paid' : 'is-unpaid'}">${escapeHTML(player.nome)}</strong>
            <small>${label} - ${formatCurrency(price)}</small>
          </div>
          <span class="baba-payment-status ${paid ? 'is-paid' : 'is-unpaid'}">${paid ? 'Pago' : 'Nao pagou'}</span>
          ${isOrganizer() ? `<button class="baba-mini-btn" type="button" data-action="toggle-payment" data-id="${player.id}">${paid ? 'Pagamento pendente' : 'Pagamento pago'}</button>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderTeams(baba) {
    if (!baba?.teams?.length) {
      els.teamsGrid.innerHTML = '<div class="baba-card"><div class="baba-empty">Nenhum time sorteado ainda.</div></div>';
      return;
    }

    const index = Math.min(Math.max(Number(baba.teamRevealIndex || 0), 0), baba.teams.length - 1);
    const fullyRevealed = index >= baba.teams.length - 1;

    const renderTeamCard = (team, position, { reveal = false } = {}) => `
      <article class="baba-team ${reveal ? 'baba-team--reveal' : ''}">
        <div>
          <small>${fullyRevealed ? 'Time sorteado' : `Time ${position + 1} de ${baba.teams.length}`}</small>
          <h3>${teamDetailButton(baba, team)}</h3>
        </div>
        <div class="baba-team__stats">
          <span><b>${team.pontos}</b>Pts</span>
          <span><b>${team.vitorias}</b>Vit</span>
          <span><b>${team.empates}</b>Emp</span>
          <span><b>${team.golsPro - team.golsContra}</b>Saldo</span>
        </div>
        <div class="baba-team__players">
          ${team.jogadores.map((id) => `<span class="baba-pill">${playerPaymentNameHTML(id, baba)}</span>`).join('')}
        </div>
      </article>
    `;

    if (fullyRevealed) {
      const startHTML = isOrganizer() && !baba.jogoAtual ? '<button class="baba-primary baba-start-game-btn" type="button" data-action="start-first-live">Iniciar primeiro jogo</button>' : '';
      els.teamsGrid.innerHTML = `
        ${baba.teams.map((team, position) => renderTeamCard(team, position)).join('')}
        <div class="baba-team-reveal-actions baba-team-reveal-actions--all">
          ${startHTML}
          <button class="baba-secondary" type="button" data-action="restart-team-reveal">Rever sorteio</button>
          <span>Todos os times foram revelados. Clique no nome de qualquer time para ver os jogadores.</span>
        </div>
      `;
      return;
    }

    const team = baba.teams[index];
    els.teamsGrid.innerHTML = `
      ${renderTeamCard(team, index, { reveal: true })}
      <div class="baba-team-reveal-actions baba-team-reveal-actions--single">
        <button class="baba-primary" type="button" data-action="advance-team-reveal">Ver proximo time</button>
        <span>Avance para revelar o proximo time sorteado.</span>
      </div>
    `;
  }

  function renderStandings(baba) {
    if (!baba?.teams?.length) {
      els.standingsList.innerHTML = '<div class="baba-empty">Sorteie os times para ver a tabela.</div>';
      if (els.tableTopScorers) els.tableTopScorers.innerHTML = '';
      return;
    }

    const match = baba.jogoAtual;
    const liveStats = new Map();
    (baba.teams || []).forEach((team) => {
      liveStats.set(team.id, {
        ...team,
        saldo: Number(team.golsPro || 0) - Number(team.golsContra || 0),
        isLive: false,
      });
    });

    if (match) {
      recomputeLiveScore(match);
      const liveA = liveStats.get(match.timeA);
      const liveB = liveStats.get(match.timeB);
      const scoreA = Number(match.placarA || 0);
      const scoreB = Number(match.placarB || 0);
      if (liveA && liveB) {
        liveA.golsPro += scoreA;
        liveA.golsContra += scoreB;
        liveB.golsPro += scoreB;
        liveB.golsContra += scoreA;
        liveA.isLive = true;
        liveB.isLive = true;

        if (scoreA > scoreB) {
          liveA.pontos += 3;
          liveA.vitorias += 1;
          liveB.derrotas += 1;
        } else if (scoreB > scoreA) {
          liveB.pontos += 3;
          liveB.vitorias += 1;
          liveA.derrotas += 1;
        } else if (match.iniciadoEm || match.goalEvents?.length) {
          liveA.pontos += 1;
          liveB.pontos += 1;
          liveA.empates += 1;
          liveB.empates += 1;
        }

        liveA.saldo = liveA.golsPro - liveA.golsContra;
        liveB.saldo = liveB.golsPro - liveB.golsContra;
      }
    }

    const teams = Array.from(liveStats.values()).sort((a, b) => (
      b.pontos - a.pontos ||
      b.saldo - a.saldo ||
      b.golsPro - a.golsPro ||
      a.name.localeCompare(b.name)
    ));

    els.standingsList.innerHTML = `
      <div class="baba-table">
        <div class="baba-table__row baba-table__head">
          <span>Pos</span><span>Time</span><span>Pts</span><span>GP</span><span>SG</span><span>V</span><span>E</span><span>D</span>
        </div>
        ${teams.map((team, index) => `
          <div class="baba-table__row ${team.isLive ? 'is-live' : ''} ${index === 0 ? 'is-first baba-gold-leader' : ''}">
            <span class="baba-position-label">
              <b class="baba-position-badge ${index === 0 ? 'is-first' : ''}">${index + 1}º</b>
              <small>${index + 1}º lugar</small>
            </span>
            ${teamDetailButton(baba, team)}
            <b>${team.pontos}</b>
            <span>${team.golsPro}</span>
            <span>${team.saldo}</span>
            <span>${team.vitorias}</span>
            <span>${team.empates}</span>
            <span>${team.derrotas}</span>
          </div>
        `).join('')}
      </div>
    `;
    renderTableTopScorers(baba);
  }

  function renderTableTopScorers(baba) {
    if (!els.tableTopScorers) return;
    const top = getDailyRankingList(baba)
      .filter((stats) => stats.totalGols > 0)
      .slice(0, 4);
    if (!top.length) {
      els.tableTopScorers.innerHTML = `
        <div class="baba-table-scorers__head">
          <span>Top 4 artilheiros</span>
          <small>Baba atual</small>
        </div>
        <div class="baba-empty">Sem gols registrados na tabela.</div>
      `;
      return;
    }
    els.tableTopScorers.innerHTML = `
      <div class="baba-table-scorers__head">
        <span>Top 4 artilheiros</span>
        <small>Baba atual</small>
      </div>
      <div class="baba-table-scorer-grid">
        ${top.map((stats, index) => `
          <div class="baba-table-scorer ${index === 0 ? 'is-first baba-gold-leader' : ''}">
            <span>${index + 1}º lugar</span>
            <strong>${playerPaymentNameHTML(stats.jogadorId, getActiveBaba(), { name: stats.nome, force: Boolean(getActiveBaba()) })}</strong>
            <span>${stats.totalGols} gol${stats.totalGols === 1 ? '' : 's'}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function getSortedGeneralRanking() {
    return sortRanking(calculateGeneralRanking(), 'goals');
  }

  function getDailyRankingList(baba, metric = 'goals') {
    const ranking = calculateCurrentBabaRanking(baba);
    return sortRanking(ranking, metric);
  }

  function calculateCurrentBabaRanking(baba) {
    const ranking = calculateDailyRanking(baba || { jogadoresPresentes: [], jogos: [], teams: [] });
    const liveEvents = baba?.jogoAtual?.goalEvents || [];
    liveEvents.forEach((goal) => {
      ensureStats(ranking, goal.jogadorId, baba).totalGols += 1;
    });
    Object.values(ranking).forEach(finalizeStats);
    return ranking;
  }

  function renderDailyTopScorers(baba) {
    const top = getDailyRankingList(baba, 'goals')
      .filter((stats) => stats.totalGols > 0);
    if (!top.length) {
      els.dailyTopScorers.innerHTML = '<div class="baba-empty">Sem gols no baba atual.</div>';
      return;
    }
    els.dailyTopScorers.innerHTML = renderRankingList(top, 'Sem gols no baba atual.', {
      compact: true,
      expandKey: 'daily-top-scorers',
      limit: 4,
    });
  }

  function renderCurrentGames(baba) {
    const games = baba?.jogos || [];
    if (!games.length) {
      els.currentGamesList.innerHTML = '<div class="baba-empty">Nenhum jogo finalizado neste baba.</div>';
      return;
    }
    els.currentGamesList.innerHTML = games.slice().reverse().map((game) => `
      <div class="baba-history-item baba-history-item--compact">
        <span>
          <strong>Jogo ${game.numeroJogo}: ${matchLineHTML(baba, getTeam(baba, game.timeA), game.placarA, game.placarB, getTeam(baba, game.timeB), true)}</strong>
          <small>${formatTime(game.finalizadoEm)}</small>
        </span>
        <button class="baba-mini-btn" type="button" data-current-game="${game.numeroJogo}">
          <svg class="baba-btn-icon" aria-hidden="true" focusable="false"><use href="#baba-ball"></use></svg>Gols
        </button>
      </div>
    `).join('');
  }

  function openTeamDetail(teamId, babaId = null) {
    const baba = getBabaById(babaId) || getActiveBaba();
    const team = getTeam(baba, teamId);
    if (!team) return;

    const dailyRanking = calculateCurrentBabaRanking(baba);
    const general = getSortedGeneralRanking();
    const position = new Map(general.map((stats, index) => [stats.jogadorId, index + 1]));
    const generalById = new Map(general.map((stats) => [stats.jogadorId, stats]));

    els.teamDetailTitle.textContent = team.name;
    els.teamDetailList.innerHTML = team.jogadores.map((playerId) => {
      const player = getBabaPlayer(baba, playerId);
      const dayGoals = dailyRanking[playerId]?.totalGols || 0;
      const generalGoals = generalById.get(playerId)?.totalGols || 0;
      const rank = position.get(playerId) || '-';
      return `
        <div class="baba-row">
          <div>
            <strong>${playerPaymentNameHTML(playerId, baba, { name: player?.nome || playerName(playerId, baba) })}</strong>
            ${player?.tipo === 'goleiro' ? '<small>Goleiro</small>' : ''}
          </div>
          <div class="baba-player-mini-stats">
            <span>${dayGoals} hoje</span>
            <span>${generalGoals} geral</span>
            <span>#${rank}</span>
          </div>
        </div>
      `;
    }).join('');
    els.teamDetailModal.classList.remove('hidden');
  }

  function openCurrentGameDetail(gameNumber) {
    const baba = getActiveBaba();
    const game = (baba?.jogos || []).find((item) => String(item.numeroJogo) === String(gameNumber));
    if (!game) return;

    const events = game.goalEvents || [];
    els.gameDetailTitle.textContent = `Jogo ${game.numeroJogo}`;
    els.gameDetailList.innerHTML = `
      <div class="baba-row">
        <strong>${matchLineHTML(baba, getTeam(baba, game.timeA), game.placarA, game.placarB, getTeam(baba, game.timeB))}</strong>
        <b class="baba-result-tag ${game.empate ? 'is-draw' : 'is-win'}">${game.empate ? resultStatusLabel(game) : 'Vitoria'}</b>
      </div>
      ${game.empate ? `
        <div class="baba-row">
          <span>Criterio do empate</span>
          <b>${escapeHTML(resultStatusLabel(game))}</b>
        </div>
      ` : ''}
      ${events.length ? events.map((goal) => `
        <div class="baba-row">
          <div>
            <strong>${playerPaymentNameHTML(goal.jogadorId, baba, { name: goal.jogadorNome })}</strong>
            <small>${escapeHTML(goal.timeNome)}</small>
          </div>
          <b>${goal.minuto ? `${goal.minuto}'` : '-'}</b>
        </div>
      `).join('') : '<div class="baba-empty">Sem gols registrados neste jogo.</div>'}
    `;
    els.gameDetailModal.classList.remove('hidden');
  }

  function renderDashboard(baba) {
    const match = baba?.jogoAtual;
    const teamA = getTeam(baba, match?.timeA);
    const teamB = getTeam(baba, match?.timeB);
    if (els.matchNumberPill) els.matchNumberPill.textContent = match ? `Jogo ${match.numeroJogo}` : 'Jogo 0';

    if (baba?.pendingTieBreak) {
      els.currentMatchPanel.className = 'baba-current-match-panel';
      const route = getPendingTieBreakRoute(baba, baba.pendingTieBreak);
      const tied = route.tiedTeams.map((team) => team.name).filter(Boolean).join(' x ');
      const choiceCards = route.tiedTeams.map((team) => {
        const out = route.tiedTeams.find((item) => item.id !== team.id);
        return `
          <article class="baba-tiebreak-option">
            <div class="baba-tiebreak-option__main">
              <span>Continua em quadra</span>
              <strong>${teamDetailButton(baba, team)}</strong>
            </div>
            <div class="baba-tiebreak-option__route">
              <span>Sai para a fila</span>
              <b>${teamDetailButton(baba, out, '-')}</b>
            </div>
            <button class="baba-tiebreak-confirm" type="button" data-action="choose-three-team-keep" data-team-id="${team.id}">
              Confirmar ${escapeHTML(team.name)}
            </button>
          </article>
        `;
      }).join('');
      els.currentMatchPanel.innerHTML = `
        <div class="baba-tiebreak-panel">
          <div class="baba-tiebreak-hero">
            <img src="img/baba-impar-par-tiebreak.png" alt="">
            <div>
              <span class="baba-kicker"><svg aria-hidden="true" focusable="false"><use href="#baba-whistle"></use></svg>Empate com 3 times</span>
              <h3>Defina no impar/par quem fica.</h3>
              <p>${escapeHTML(tied)} empataram. O vencedor do impar/par continua em quadra; o outro vai para a fila.</p>
            </div>
          </div>
          <div class="baba-tiebreak-route">
            <div>
              <span>Proximo adversario</span>
              <strong>${teamDetailButton(baba, route.nextTeam, 'Aguardando')}</strong>
            </div>
            <div>
              <span>Decisao</span>
              <strong>Impar/par entre os times empatados</strong>
            </div>
          </div>
          ${isOrganizer()
            ? `<div class="baba-tiebreak-options">${choiceCards}</div>`
            : '<div class="baba-empty">O organizador vai selecionar aqui o time que venceu no impar/par.</div>'}
        </div>
      `;
    } else if (!match || !teamA || !teamB) {
      els.currentMatchPanel.className = 'baba-current-match-panel';
      const canStart = isOrganizer() && baba?.teams?.length >= 2;
      els.currentMatchPanel.innerHTML = `
        <div class="baba-empty">Nenhum jogo iniciado.</div>
        ${canStart ? '<div class="baba-live-actions baba-live-actions--single"><button class="baba-primary baba-start-game-btn" type="button" data-action="start-first-live">Iniciar primeiro jogo</button></div>' : ''}
      `;
    } else {
      els.currentMatchPanel.className = 'baba-current-match-panel';
      const remaining = getRemainingSeconds(match);
      const isPrepared = !match.timerRunning && !match.iniciadoEm;
      const isOver = remaining === 0 && match.iniciadoEm;
      const timerLabel = isPrepared ? 'Aguardando inicio' : (remaining ? formatCountdown(remaining) : 'Tempo esgotado');
      const scoreA = Number(match.placarA || 0);
      const scoreB = Number(match.placarB || 0);
      let organizerControls = '';
      if (isOrganizer()) {
        organizerControls = isPrepared ? `
          <div class="baba-live-actions baba-live-actions--single">
            <button class="baba-live-main-btn baba-start-game-btn" type="button" data-action="start-prepared-match">Iniciar primeiro jogo</button>
            <button class="baba-live-control-btn" type="button" data-action="edit-time">Editar tempo</button>
          </div>
        ` : isOver ? `
          <div class="baba-live-actions baba-live-actions--single">
            <button class="baba-live-control-btn" type="button" data-action="edit-time">Editar tempo</button>
            <button class="baba-live-control-btn baba-live-control-btn--danger" type="button" data-action="finish-live-match">Finalizar jogo</button>
          </div>
        ` : `
          <div class="baba-live-actions">
            <div class="baba-live-goal-actions">
              <button class="baba-goal-btn" type="button" data-action="open-goal-picker" data-team-id="${teamA.id}">Gol ${escapeHTML(teamA.name)}</button>
              <button class="baba-goal-btn" type="button" data-action="open-goal-picker" data-team-id="${teamB.id}">Gol ${escapeHTML(teamB.name)}</button>
            </div>
            <div class="baba-live-secondary-actions">
              <button class="baba-live-control-btn" type="button" data-action="pause-time">${match.timerRunning ? 'Pausar' : 'Retomar'}</button>
              <button class="baba-live-control-btn" type="button" data-action="edit-time">Editar tempo</button>
              <button class="baba-live-control-btn" type="button" data-action="undo-goal">Desfazer gol</button>
              <button class="baba-live-control-btn baba-live-control-btn--danger" type="button" data-action="finish-live-match">Finalizar jogo</button>
            </div>
          </div>
        `;
      }
      els.currentMatchPanel.innerHTML = `
        <div class="baba-match-live ${isPrepared ? 'is-prepared' : ''}">
          <div class="baba-timer ${isOver ? 'is-over' : ''}" id="current-timer">
            <svg class="baba-live-icon" aria-hidden="true" focusable="false"><use href="#baba-clock"></use></svg>
            <span class="baba-timer__text">${timerLabel}</span>
          </div>
          <div class="baba-live-scoreboard">
            <strong class="baba-live-team baba-live-team--home">${teamDetailButton(baba, teamA)}</strong>
            <div class="baba-live-score" aria-label="Placar ${scoreA} a ${scoreB}">
              <span>${scoreA}</span>
              <small>x</small>
              <span>${scoreB}</span>
            </div>
            <strong class="baba-live-team baba-live-team--away">${teamDetailButton(baba, teamB)}</strong>
          </div>
          ${organizerControls}
          <div class="baba-match-live__meta">
            <span class="baba-pill">Inicio: ${match.iniciadoEm ? formatTime(match.iniciadoEm) : 'pendente'}</span>
            <span class="baba-pill">${teamA.jogadores.length} x ${teamB.jogadores.length} jogadores</span>
          </div>
        </div>
      `;
    }

    if (!baba?.filaTimes?.length) {
      els.queueList.innerHTML = '<div class="baba-empty">Sem times aguardando.</div>';
    } else {
      els.queueList.innerHTML = baba.filaTimes.map((teamId, index) => {
        const team = getTeam(baba, teamId);
        return `
          <div class="baba-row">
            <div>
              <strong>${teamDetailButton(baba, team)}</strong>
              <small>${index === 0 ? 'Proximo a entrar' : 'Aguardando'}</small>
            </div>
            <b>#${index + 1}</b>
          </div>
        `;
      }).join('');
    }

    if (!baba?.lastResult) {
      els.lastResultPill.textContent = 'Sem resultado';
      els.lastResultPanel.innerHTML = '<div class="baba-empty">Finalize um jogo para ver quem fica em campo e quem sai.</div>';
    } else {
      const keep = getTeam(baba, baba.lastResult.timeQueContinuou);
      const outNames = teamNamesFromValue(baba, baba.lastResult.timeQueSaiu);
      const resultTeamA = getTeam(baba, baba.lastResult.timeA);
      const resultTeamB = getTeam(baba, baba.lastResult.timeB);
      const resultLine = resultTeamA && resultTeamB
        ? matchLineHTML(baba, resultTeamA, baba.lastResult.placarA, baba.lastResult.placarB, resultTeamB)
        : escapeHTML(baba.lastResult.resumo);
      els.lastResultPill.textContent = `Jogo ${baba.lastResult.jogo}`;
      const keepHTML = keep ? teamDetailButton(baba, keep, '-') : '<span class="baba-result-pending">Aguardando impar/par</span>';
      const outHTML = baba.lastResult.timeQueSaiu ? (teamButtonsFromValue(baba, baba.lastResult.timeQueSaiu) || escapeHTML(outNames)) : '<span class="baba-result-pending">Aguardando decisao</span>';
      els.lastResultPanel.innerHTML = `
        <div class="baba-row">
          <div>
            <strong>${resultLine}</strong>
            <small><span class="baba-result-tag ${baba.lastResult.empate || baba.lastResult.decididoPorSorteio ? 'is-draw' : 'is-win'}">${resultStatusLabel(baba.lastResult)}</span></small>
          </div>
        </div>
        <div class="baba-row"><span>Continua em campo</span><b>${keepHTML}</b></div>
        <div class="baba-row"><span>Saiu para a fila</span><b>${outHTML}</b></div>
        <div class="baba-row"><span>Motivo</span><b>${escapeHTML(baba.lastResult.motivoSaida)}</b></div>
      `;
    }
  }

  function renderRankings(baba) {
    renderRankingFilters();
    const general = sortRanking(calculateGeneralRanking(), rankingMode);
    const daily = getDailyRankingList(baba, rankingMode);
    const currentMonth = activeMonthKey(baba);
    if (currentMonth && !state.monthlyStats?.[currentMonth]) {
      window.BabaRepository?.loadMonthStats?.(currentMonth).catch(() => {});
    }
    const monthly = sortRanking(calculateMonthlyRanking(currentMonth, { includeActive: true }), rankingMode);
    const goalkeepers = calculateGoalkeeperRanking({ includeActive: true });
    if (els.monthlyRankingLabel) els.monthlyRankingLabel.textContent = monthLabel(currentMonth);
    if (els.monthlyRankingList) {
      els.monthlyRankingList.innerHTML = renderRankingList(monthly, rankingEmptyMessage('neste mes'), {
        expandKey: 'monthly-current',
        metric: rankingMode,
      });
    }
    els.rankingList.innerHTML = renderRankingList(general, rankingEmptyMessage('no ranking geral'), {
      expandKey: 'general',
      metric: rankingMode,
    });
    els.dailyRankingList.innerHTML = renderRankingList(daily, rankingEmptyMessage('no baba atual'), {
      expandKey: 'daily',
      metric: rankingMode,
    });
    if (els.goalkeeperRankingList) {
      els.goalkeeperRankingList.innerHTML = renderGoalkeeperRankingList(goalkeepers, 'Ainda nao ha jogos com goleiros para montar este ranking.', {
        expandKey: 'goalkeepers',
      });
    }
    renderMonthlyHistory();
  }

  function renderMonthlyHistory() {
    if (!els.monthlyHistoryTabs || !els.monthlyHistoryRanking) return;
    const keys = getAvailableMonthKeys();
    if (!keys.length) {
      els.monthlyHistoryTabs.innerHTML = '';
      els.monthlyHistoryRanking.innerHTML = '<div class="baba-empty">Sem historico mensal ainda.</div>';
      return;
    }
    if (!selectedMonthlyKey || !keys.includes(selectedMonthlyKey)) selectedMonthlyKey = keys[0];
    if (!state.monthlyStats?.[selectedMonthlyKey]) {
      window.BabaRepository?.loadMonthStats?.(selectedMonthlyKey).catch(() => {});
    }
    els.monthlyHistoryTabs.innerHTML = keys.map((key) => `
      <button class="${key === selectedMonthlyKey ? 'active' : ''}" type="button" data-month-key="${key}">${escapeHTML(monthLabel(key))}</button>
    `).join('');
    const ranking = sortRanking(calculateMonthlyRanking(selectedMonthlyKey, { includeActive: selectedMonthlyKey === activeMonthKey() }), rankingMode);
    els.monthlyHistoryRanking.innerHTML = renderRankingList(ranking, rankingEmptyMessage('neste mes'), {
      expandKey: `month-${selectedMonthlyKey}`,
      metric: rankingMode,
    });
  }

  function rankingEmptyMessage(scope) {
    if (rankingMode === 'goals') return `Ainda nao ha gols ${scope}.`;
    const option = RANKING_MODES.find((item) => item.id === rankingMode);
    const label = (option?.label || 'dados').toLowerCase();
    return `Ainda nao ha dados de ${label} ${scope}.`;
  }

  function renderRankingFilters() {
    if (!els.rankingFilterControls) return;
    els.rankingFilterControls.innerHTML = RANKING_MODES.map((modeOption) => `
      <button class="${rankingMode === modeOption.id ? 'active' : ''}" type="button" data-ranking-mode="${modeOption.id}" aria-pressed="${rankingMode === modeOption.id ? 'true' : 'false'}">
        <svg aria-hidden="true" focusable="false"><use href="#${modeOption.icon}"></use></svg>
        <span>${modeOption.label}</span>
      </button>
    `).join('');
  }

  function rankingMetricValue(stats, metric = 'goals') {
    if (metric === 'wins') return Number(stats.totalVitorias || 0);
    if (metric === 'losses') return Number(stats.totalDerrotas || 0);
    if (metric === 'titles') return Number(stats.totalTitulosBaba || 0);
    if (metric === 'efficiency') return Number(stats.aproveitamento || 0);
    return Number(stats.totalGols || 0);
  }

  function hasRankingMetric(stats, metric = 'goals') {
    if (metric === 'efficiency') return Number(stats.totalJogos || 0) > 0;
    return rankingMetricValue(stats, metric) > 0;
  }

  function rankingMetricDisplay(stats, metric = 'goals') {
    const value = rankingMetricValue(stats, metric);
    if (metric === 'wins') return { value, label: value === 1 ? 'vitoria' : 'vitorias' };
    if (metric === 'losses') return { value, label: value === 1 ? 'derrota' : 'derrotas' };
    if (metric === 'titles') return { value, label: value === 1 ? 'titulo' : 'titulos' };
    if (metric === 'efficiency') return { value: `${value}%`, label: 'aprov.' };
    return { value, label: value === 1 ? 'gol' : 'gols' };
  }

  function sortRanking(ranking, metric = 'goals') {
    return Object.values(ranking || {})
      .filter((stats) => hasRankingMetric(stats, metric))
      .sort((a, b) => {
        if (metric === 'wins') {
          return b.totalVitorias - a.totalVitorias || b.totalGols - a.totalGols || b.aproveitamento - a.aproveitamento || a.nome.localeCompare(b.nome);
        }
        if (metric === 'losses') {
          return b.totalDerrotas - a.totalDerrotas || b.totalGols - a.totalGols || a.nome.localeCompare(b.nome);
        }
        if (metric === 'titles') {
          return b.totalTitulosBaba - a.totalTitulosBaba || b.totalVitorias - a.totalVitorias || b.totalGols - a.totalGols || a.nome.localeCompare(b.nome);
        }
        if (metric === 'efficiency') {
          return b.aproveitamento - a.aproveitamento || b.totalVitorias - a.totalVitorias || b.totalGols - a.totalGols || a.totalDerrotas - b.totalDerrotas || a.nome.localeCompare(b.nome);
        }
        return b.totalGols - a.totalGols || b.totalVitorias - a.totalVitorias || b.aproveitamento - a.aproveitamento || a.nome.localeCompare(b.nome);
      });
  }

  function getRankingVisibleItems(items, { expandKey = '', limit = 4 } = {}) {
    const safeLimit = Math.max(1, Number(limit || 4));
    const expanded = Boolean(expandKey && expandedRankingKeys.has(expandKey));
    return {
      expanded,
      visibleItems: expanded ? items : items.slice(0, safeLimit),
      limit: safeLimit,
    };
  }

  function rankingToggleHTML(expandKey, total, limit, expanded) {
    if (!expandKey || total <= limit) return '';
    return `
      <div class="baba-ranking-footer">
        <button class="baba-list-toggle" type="button" data-rank-toggle="${escapeHTML(expandKey)}">
          ${expanded ? 'Mostrar menos' : 'Ver tabela completa'}
        </button>
      </div>
    `;
  }

  function renderRankingList(items, emptyMessage, options = {}) {
    if (!items.length) return `<div class="baba-empty">${escapeHTML(emptyMessage)}</div>`;
    const { visibleItems, limit, expanded } = getRankingVisibleItems(items, options);
    const metric = options.metric || 'goals';
    const stat = (iconId, label) => `
      <span>
        <svg aria-hidden="true" focusable="false"><use href="#${iconId}"></use></svg>
        ${label}
      </span>
    `;
    const cards = visibleItems.map((stats, index) => {
      const position = index + 1;
      const topClass = position <= 3 ? ` baba-ranking-card--top${position}` : '';
      const icon = position === 1 ? 'baba-trophy' : 'baba-ball';
      const score = rankingMetricDisplay(stats, metric);
      return `
        <div class="baba-ranking-card${topClass}">
          <div class="baba-ranking-card__main">
            <span class="baba-ranking-position">${position}</span>
            <div>
              <div class="baba-ranking-title">
                <svg aria-hidden="true" focusable="false"><use href="#${icon}"></use></svg>
                <strong>${playerPaymentNameHTML(stats.jogadorId, getActiveBaba(), { name: stats.nome, force: Boolean(getActiveBaba()) })}</strong>
              </div>
              <div class="stats">
                ${stat('baba-ball', `${stats.totalGols} gols`)}
                ${stat('baba-check', `${stats.totalVitorias} V`)}
                ${stat('baba-dash', `${stats.totalEmpates} E`)}
                ${stat('baba-x', `${stats.totalDerrotas} D`)}
                ${stat('baba-calendar', `${stats.totalBabas} babas`)}
                ${stat('baba-chart', `${stats.mediaGols} media`)}
                ${stat('baba-trophy', `${stats.totalTitulosBaba} titulos`)}
                ${stat('baba-table-icon', `${stats.aproveitamento}%`)}
              </div>
            </div>
          </div>
          <div class="baba-ranking-score">
            <strong>${score.value}</strong>
            <span>${score.label}</span>
          </div>
        </div>
      `;
    }).join('');
    return `${cards}${rankingToggleHTML(options.expandKey, items.length, limit, expanded)}`;
  }

  function renderGoalkeeperRankingList(items, emptyMessage, options = {}) {
    if (!items.length) return `<div class="baba-empty">${escapeHTML(emptyMessage)}</div>`;
    const { visibleItems, limit, expanded } = getRankingVisibleItems(items, options);
    const cards = visibleItems.map((stats, index) => {
      const position = index + 1;
      const topClass = position <= 3 ? ` baba-ranking-card--top${position}` : '';
      return `
        <div class="baba-ranking-card baba-goalkeeper-card${topClass}">
          <div class="baba-ranking-card__main">
            <span class="baba-ranking-position">${position}</span>
            <div>
              <div class="baba-ranking-title">
                <svg aria-hidden="true" focusable="false"><use href="#${position === 1 ? 'baba-trophy' : 'baba-save'}"></use></svg>
                <strong>${playerPaymentNameHTML(stats.jogadorId, getActiveBaba(), { name: stats.nome, force: Boolean(getActiveBaba()) })}</strong>
              </div>
              <div class="stats">
                <span><svg aria-hidden="true" focusable="false"><use href="#baba-x"></use></svg>${stats.golsSofridos} sofridos</span>
                <span><svg aria-hidden="true" focusable="false"><use href="#baba-play"></use></svg>${stats.jogos} jogos</span>
                <span><svg aria-hidden="true" focusable="false"><use href="#baba-chart"></use></svg>${stats.mediaSofridos} media</span>
                <span><svg aria-hidden="true" focusable="false"><use href="#baba-calendar"></use></svg>${stats.totalBabas} babas</span>
              </div>
            </div>
          </div>
          <div class="baba-ranking-score">
            <strong>${stats.golsSofridos}</strong>
            <span>sofridos</span>
          </div>
        </div>
      `;
    }).join('');
    return `${cards}${rankingToggleHTML(options.expandKey, items.length, limit, expanded)}`;
  }

  function renderHistory() {
    const finished = state.babas.filter((baba) => baba.status === 'finalizado');
    els.historyCountLabel.textContent = `${finished.length} salvos`;
    if (!finished.length) {
      els.historyList.innerHTML = '<div class="baba-empty">Nenhum baba finalizado ainda.</div>';
      els.historyDetail.innerHTML = '<div class="baba-empty">Finalize um baba para consultar os detalhes.</div>';
      return;
    }

    if (!selectedHistoryId || !finished.some((baba) => baba.id === selectedHistoryId)) {
      selectedHistoryId = finished[0].id;
    }

    const historyItems = finished.map((baba) => `
      <button class="baba-history-item ${baba.id === selectedHistoryId ? 'active' : ''}" type="button" data-history-id="${baba.id}">
        <span>
          <strong>${escapeHTML(baba.dataCompleta)}</strong>
          <small>${escapeHTML(baba.campeaoDoBaba?.nomes?.join(', ') || 'Sem campeao')}</small>
        </span>
        <span class="baba-history-actions">
          <b>${baba.jogos?.length || 0} jogos</b>
          ${isOrganizer() ? `<span class="baba-mini-btn danger" data-action="delete-history" data-id="${baba.id}">Excluir</span>` : ''}
        </span>
      </button>
    `).join('');
    const moreButton = window.BabaRepository?.hasMoreHistory?.()
      ? '<button class="baba-btn secondary" type="button" data-history-more>Carregar historico anterior</button>'
      : '';
    els.historyList.innerHTML = `${historyItems}${moreButton}`;

    const selected = finished.find((baba) => baba.id === selectedHistoryId);
    if (selected && !selected.__detailLoaded && window.BabaRepository?.loadBaba) {
      els.historyDetail.innerHTML = '<div class="baba-empty">Carregando placares, times e gols...</div>';
      if (!loadingHistoryIds.has(selected.id)) {
        loadingHistoryIds.add(selected.id);
        window.BabaRepository.loadBaba(selected.id)
          .catch((error) => showToast(error.message || 'Nao foi possivel carregar este baba.'))
          .finally(() => loadingHistoryIds.delete(selected.id));
      }
      return;
    }
    renderHistoryDetail(selected);
  }

  function renderHistoryDetail(baba) {
    if (!baba) return;
    els.historyDetailLabel.textContent = baba.dataCompleta;
    const championNames = baba.campeaoDoBaba?.nomes?.join(', ') || 'Sem campeao';
    const championPlayers = (baba.campeaoDoBaba?.jogadores || []).map((id) => playerPaymentNameHTML(id, baba)).join(', ') || '-';

    els.historyDetail.innerHTML = `
      <div class="baba-stack">
        <div class="baba-row"><span>Campeao do baba</span><b>${escapeHTML(championNames)}</b></div>
        <div class="baba-row"><span>Jogadores campeoes</span><b>${championPlayers}</b></div>
        <div class="baba-row"><span>Presentes</span><b>${baba.jogadoresPresentes?.length || 0}</b></div>
        <div class="baba-row"><span>Finalizado</span><b>${formatTime(baba.finalizadoEm)}</b></div>
        ${(baba.teams || []).map((team) => `
          <div class="baba-row">
            <div>
              <strong>${teamDetailButton(baba, team)} - ${team.pontos} pts</strong>
              <small>V:${team.vitorias} E:${team.empates} D:${team.derrotas} GP:${team.golsPro} GC:${team.golsContra}</small>
            </div>
          </div>
        `).join('')}
        ${(baba.jogos || []).map((game) => `
          <div class="baba-row">
            <div>
              <strong>Jogo ${game.numeroJogo}: ${matchLineHTML(baba, getTeam(baba, game.timeA), game.placarA, game.placarB, getTeam(baba, game.timeB), true)}</strong>
              <small>Continua: ${teamDetailButton(baba, getTeam(baba, game.timeQueContinuou), '-')} | Saiu: ${teamButtonsFromValue(baba, game.timeQueSaiu)} | ${escapeHTML(game.motivoSaida || '-')}</small>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function setActiveTab(tab) {
    const safeTab = !isOrganizer() && tab === 'organizer' ? 'dashboard' : tab;
    $$('.baba-tabs [data-tab]').forEach((button) => button.classList.toggle('active', button.dataset.tab === safeTab));
    const isMoreTab = ['teams', 'goals', 'organizer'].includes(safeTab);
    els.moreToggle?.classList.toggle('active', isMoreTab);
    els.moreToggle?.setAttribute('aria-expanded', 'false');
    els.moreMenu?.classList.add('hidden');
    $$('.baba-view').forEach((view) => view.classList.toggle('active', view.dataset.view === safeTab));
  }

  function getTabsStickyTop(tabs) {
    const top = Number.parseFloat(window.getComputedStyle(tabs).top);
    return Number.isFinite(top) ? top : 0;
  }

  function ensureTabsStickySentinel() {
    const tabs = $('.baba-tabs');
    if (!tabs) return null;
    if (!tabsStickySentinel || !tabsStickySentinel.isConnected) {
      tabsStickySentinel = document.createElement('span');
      tabsStickySentinel.className = 'baba-tabs-sticky-sentinel';
      tabsStickySentinel.setAttribute('aria-hidden', 'true');
      tabs.before(tabsStickySentinel);
    }
    return tabsStickySentinel;
  }

  function updateTabsStickyState() {
    const tabs = $('.baba-tabs');
    const sentinel = ensureTabsStickySentinel();
    if (!tabs || !sentinel) return;
    const stuck = window.scrollY > 0 && sentinel.getBoundingClientRect().top <= getTabsStickyTop(tabs) + 1;
    document.body.classList.toggle('baba-tabs-stuck', stuck);
  }

  function scheduleTabsStickyState() {
    if (tabsScrollFrame) return;
    tabsScrollFrame = window.requestAnimationFrame(() => {
      tabsScrollFrame = null;
      updateTabsStickyState();
    });
  }

  function wireTabsStickyState() {
    ensureTabsStickySentinel();
    updateTabsStickyState();
    window.addEventListener('scroll', scheduleTabsStickyState, { passive: true });
    window.addEventListener('resize', scheduleTabsStickyState);
  }

  async function shareBabaLink() {
    const shareUrl = new URL('baba.html', window.location.href);
    shareUrl.searchParams.set('view', 'player');
    const url = shareUrl.href;
    const shareData = {
      title: 'Baba Amigos de Henrique',
      text: 'Acompanhe o Baba Amigos de Henrique ao vivo: times, placar, ranking e historico.',
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showToast('Link do Baba compartilhado.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast('Link do Baba copiado.');
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }

    window.prompt('Copie o link direto do Baba:', url);
  }

  function babaAssistantIcon(name = 'spark') {
    const icons = {
      spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M5 15l.9 2.4L8 18l-2.1.6L5 21l-.9-2.4L2 18l2.1-.6L5 15Z"/><path d="M19 14l.9 2.4L22 17l-2.1.6L19 20l-.9-2.4L16 17l2.1-.6L19 14Z"/>',
      send: '<path d="M4 12 20 4l-4 16-3.5-6.5L4 12Z"/><path d="m12.5 13.5 7-9"/>',
      close: '<path d="M6 6l12 12M18 6 6 18"/>',
      ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 5h-5L8 10l4-3Z"/><path d="M12 7V3M16 10l4-1M14.5 15l2.5 4M9.5 15 7 19M8 10 4 9"/>',
      chart: '<path d="M4 19h16"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-4"/>',
    };
    return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.spark}</svg>`;
  }

  function initBabaAssistant() {
    const existing = document.getElementById('baba-ai-assistant');
    if (existing) {
      babaAssistant.els = {
        root: existing,
        toggle: existing.querySelector('#baba-ai-toggle'),
        panel: existing.querySelector('#baba-ai-panel'),
        close: existing.querySelector('#baba-ai-close'),
        messages: existing.querySelector('#baba-ai-messages'),
        form: existing.querySelector('#baba-ai-form'),
        input: existing.querySelector('#baba-ai-input'),
      };
      return;
    }

    const root = document.createElement('section');
    root.id = 'baba-ai-assistant';
    root.className = 'baba-ai-assistant';
    root.setAttribute('aria-label', 'IA do Baba');
    root.innerHTML = `
      <button id="baba-ai-toggle" class="baba-ai-toggle" type="button" aria-expanded="false" aria-controls="baba-ai-panel" title="IA do Baba">
        <span class="baba-ai-toggle__icon">${babaAssistantIcon('spark')}</span>
        <span class="baba-ai-toggle__text">IA do Baba</span>
      </button>
      <aside id="baba-ai-panel" class="baba-ai-panel" aria-hidden="true">
        <header class="baba-ai-head">
          <span class="baba-ai-avatar">${babaAssistantIcon('spark')}</span>
          <span>
            <strong>IA do Baba</strong>
            <small>Pergunte sobre jogadores, gols, partidas e pagamentos.</small>
          </span>
          <button id="baba-ai-close" class="baba-ai-close" type="button" aria-label="Fechar IA do Baba">${babaAssistantIcon('close')}</button>
        </header>
        <div id="baba-ai-messages" class="baba-ai-messages" role="log" aria-live="polite"></div>
        <div class="baba-ai-suggestions" aria-label="Sugestoes rapidas">
          ${BABA_ASSISTANT_QUICK_QUESTIONS.map((question) => `<button type="button" data-ai-question="${escapeHTML(question)}">${escapeHTML(question)}</button>`).join('')}
        </div>
        <form id="baba-ai-form" class="baba-ai-form">
          <input id="baba-ai-input" type="text" autocomplete="off" placeholder="Pergunte sobre o baba..." aria-label="Pergunta para IA do Baba">
          <button type="submit" aria-label="Enviar pergunta">${babaAssistantIcon('send')}</button>
        </form>
      </aside>
    `;
    document.body.appendChild(root);
    babaAssistant.els = {
      root,
      toggle: root.querySelector('#baba-ai-toggle'),
      panel: root.querySelector('#baba-ai-panel'),
      close: root.querySelector('#baba-ai-close'),
      messages: root.querySelector('#baba-ai-messages'),
      form: root.querySelector('#baba-ai-form'),
      input: root.querySelector('#baba-ai-input'),
    };
    renderBabaAssistantMessages();
  }

  function openBabaAssistant() {
    initBabaAssistant();
    babaAssistant.open = true;
    document.body.classList.add('baba-ai-is-open');
    babaAssistant.els.root?.classList.add('is-open');
    babaAssistant.els.toggle?.setAttribute('aria-expanded', 'true');
    babaAssistant.els.panel?.setAttribute('aria-hidden', 'false');
    if (!babaAssistant.messages.length) {
      babaAssistant.messages.push({
        role: 'bot',
        text: 'Fala! Sou a IA do Baba.\n\nPosso analisar gols, vitorias, ranking, desempenho, partidas, presencas e pagamentos.\n\nPergunte algo como:\n- Quem fez mais gols?\n- Quem esta em melhor fase?\n- Quem ainda nao pagou?\n- Compare Carlos e Joao.',
      });
      renderBabaAssistantMessages();
    }
    window.setTimeout(() => babaAssistant.els.input?.focus(), 80);
  }

  function closeBabaAssistant() {
    babaAssistant.open = false;
    document.body.classList.remove('baba-ai-is-open');
    babaAssistant.els.root?.classList.remove('is-open');
    babaAssistant.els.toggle?.setAttribute('aria-expanded', 'false');
    babaAssistant.els.panel?.setAttribute('aria-hidden', 'true');
  }

  function formatBabaAssistantText(text) {
    return escapeHTML(text)
      .replace(/\n- /g, '<br><span class="baba-ai-bullet">- ')
      .replace(/\n/g, '<br>')
      .replace(/(<span class="baba-ai-bullet">- [^<]*(?:<br>|$))/g, '$1</span>');
  }

  function renderBabaAssistantMessages() {
    initBabaAssistant();
    const messages = babaAssistant.messages.map((message) => `
      <article class="baba-ai-message is-${message.role}">
        ${message.role === 'bot' ? `<span class="baba-ai-message__avatar">${babaAssistantIcon('spark')}</span>` : ''}
        <div>${formatBabaAssistantText(message.text)}</div>
      </article>
    `).join('');
    const typing = babaAssistant.typing ? `
      <article class="baba-ai-message is-bot is-typing">
        <span class="baba-ai-message__avatar">${babaAssistantIcon('chart')}</span>
        <div><span></span><span></span><span></span></div>
      </article>
    ` : '';
    if (babaAssistant.els.messages) {
      babaAssistant.els.messages.innerHTML = messages + typing;
      babaAssistant.els.messages.scrollTop = babaAssistant.els.messages.scrollHeight;
    }
  }

  function normalizeAssistantText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\w\s/-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function assistantAllPlayers() {
    const players = new Map();
    state.players.forEach((player) => {
      if (player?.id) players.set(player.id, player);
    });
    state.babas.forEach((baba) => {
      (baba.visitantes || []).forEach((player) => {
        if (player?.id && !players.has(player.id)) players.set(player.id, player);
      });
    });
    return Array.from(players.values());
  }

  function assistantFindPlayers(question) {
    const normalized = normalizeAssistantText(question);
    return assistantAllPlayers()
      .map((player) => ({ player, key: normalizeAssistantText(player.nome) }))
      .filter(({ key }) => key.length >= 3 && normalized.includes(key))
      .map(({ player }) => player);
  }

  function assistantLatestBabas(limit = Infinity) {
    return state.babas
      .filter((baba) => baba && (baba.status === 'finalizado' || baba.id === state.activeBabaId))
      .slice()
      .sort((a, b) => {
        const dateSort = String(b.dataISO || '').localeCompare(String(a.dataISO || ''));
        if (dateSort) return dateSort;
        return Number(b.finalizadoEm || b.criadoEm || 0) - Number(a.finalizadoEm || a.criadoEm || 0);
      })
      .slice(0, limit);
  }

  function assistantDateFromQuestion(normalized) {
    const brDate = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
    if (brDate) {
      const day = brDate[1].padStart(2, '0');
      const month = brDate[2].padStart(2, '0');
      const year = brDate[3] ? String(Number(brDate[3]) < 100 ? 2000 + Number(brDate[3]) : brDate[3]) : String(new Date().getFullYear());
      return `${year}-${month}-${day}`;
    }
    const dayOnly = normalized.match(/\bdia\s+(\d{1,2})\b/);
    if (dayOnly) {
      const active = getActiveBaba();
      const base = active?.dataISO || todayISO();
      return `${base.slice(0, 8)}${dayOnly[1].padStart(2, '0')}`;
    }
    return '';
  }

  function assistantMonthFromQuestion(normalized) {
    const monthNames = [
      ['janeiro', '01'], ['fevereiro', '02'], ['marco', '03'], ['abril', '04'],
      ['maio', '05'], ['junho', '06'], ['julho', '07'], ['agosto', '08'],
      ['setembro', '09'], ['outubro', '10'], ['novembro', '11'], ['dezembro', '12'],
    ];
    const named = monthNames.find(([name]) => normalized.includes(name));
    if (named) {
      const yearMatch = normalized.match(/\b(20\d{2})\b/);
      return `${yearMatch?.[1] || new Date().getFullYear()}-${named[1]}`;
    }
    if (normalized.includes('mes passado')) {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      return currentPaymentMonthKey(date);
    }
    if (normalized.includes('este mes') || normalized.includes('mes atual') || normalized.includes('no mes')) {
      return activeMonthKey();
    }
    return '';
  }

  function assistantResolvePeriod(question) {
    const normalized = normalizeAssistantText(question);
    const active = getActiveBaba();
    const exactDate = assistantDateFromQuestion(normalized);
    const wantsActiveBaba = normalized.includes('baba atual') || normalized.includes('jogo atual') || normalized.includes('partida atual');
    if (normalized.includes('hoje') || normalized.includes('dia de hoje') || wantsActiveBaba) {
      const todayBabas = state.babas.filter((baba) => baba.dataISO === todayISO());
      const babas = wantsActiveBaba && active ? [active] : (todayBabas.length ? todayBabas : (active ? [active] : []));
      return { label: wantsActiveBaba ? 'baba atual' : 'hoje', babas };
    }
    if (normalized.includes('ontem')) {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      const iso = todayISOFromDate(date);
      return { label: 'ontem', babas: state.babas.filter((baba) => baba.dataISO === iso) };
    }
    if (exactDate) {
      return { label: `dia ${formatDate(exactDate)}`, babas: state.babas.filter((baba) => baba.dataISO === exactDate) };
    }
    const lastMany = normalized.match(/ultimos?\s+(\d+)\s+babas?/);
    if (lastMany) {
      const amount = Math.max(1, Math.min(20, Number(lastMany[1])));
      return { label: `ultimos ${amount} babas`, babas: assistantLatestBabas(amount) };
    }
    if (normalized.includes('ultimo baba') || normalized.includes('ultima rodada')) {
      return { label: 'ultimo baba', babas: assistantLatestBabas(1) };
    }
    const monthKey = assistantMonthFromQuestion(normalized);
    if (monthKey) {
      const includeActive = active && monthKeyFromISO(active.dataISO) === monthKey;
      return {
        label: monthLabel(monthKey),
        babas: state.babas.filter((baba) => monthKeyFromISO(baba.dataISO) === monthKey && (baba.status === 'finalizado' || (includeActive && baba.id === active.id))),
      };
    }
    return { label: 'ranking geral', babas: assistantLatestBabas() };
  }

  function todayISOFromDate(date) {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function assistantRankingForBabas(babas) {
    const ranking = {};
    (babas || []).forEach((baba) => {
      const daily = baba.id === state.activeBabaId && baba.status !== 'finalizado'
        ? calculateCurrentBabaRanking(baba)
        : calculateDailyRanking(baba);
      Object.values(daily).forEach((stats) => mergeRankingStats(ranking, stats));
    });
    Object.values(ranking).forEach(finalizeStats);
    return ranking;
  }

  function assistantRankingForQuestion(question) {
    const period = assistantResolvePeriod(question);
    const ranking = period.label === 'ranking geral'
      ? assistantRankingForBabas(period.babas)
      : assistantRankingForBabas(period.babas);
    return { period, ranking };
  }

  function assistantTopLine(items, metric, periodLabel) {
    if (!items.length) return `Ainda nao existem dados suficientes para esse criterio em ${periodLabel}.`;
    const top = items[0];
    const second = items[1];
    const metricDisplay = rankingMetricDisplay(top, metric);
    const gap = second ? rankingMetricValue(top, metric) - rankingMetricValue(second, metric) : 0;
    const gapText = second && gap > 0 ? ` Ele tem ${gap} de vantagem sobre ${second.nome}, que aparece em segundo com ${rankingMetricDisplay(second, metric).value}.` : '';
    return `${top.nome} lidera em ${periodLabel}, com ${metricDisplay.value} ${metricDisplay.label}.${gapText}`;
  }

  function assistantDescribeStats(stats) {
    if (!stats) return 'Sem estatisticas registradas.';
    return `${stats.totalGols || 0} gols, ${stats.totalVitorias || 0} vitorias, ${stats.totalEmpates || 0} empates, ${stats.totalDerrotas || 0} derrotas, ${stats.aproveitamento || 0}% de aproveitamento e ${stats.totalBabas || 0} babas.`;
  }

  function assistantPerformanceScore(stats, recent = null) {
    if (!stats) return 0;
    const recentBoost = recent ? (Number(recent.totalGols || 0) * 2.2) + (Number(recent.totalVitorias || 0) * 1.6) + (Number(recent.aproveitamento || 0) * .16) : 0;
    return (Number(stats.totalGols || 0) * 4)
      + (Number(stats.totalVitorias || 0) * 3)
      + (Number(stats.totalTitulosBaba || 0) * 5)
      + (Number(stats.aproveitamento || 0) * .35)
      + (Number(stats.totalBabas || 0) * 1.2)
      - (Number(stats.totalDerrotas || 0) * .7)
      + recentBoost;
  }

  function assistantBestPlayer(question) {
    const { period, ranking } = assistantRankingForQuestion(question);
    const recentRanking = assistantRankingForBabas(assistantLatestBabas(5));
    const players = Object.values(ranking).filter((stats) => Number(stats.totalJogos || 0) > 0 || Number(stats.totalGols || 0) > 0);
    if (!players.length) return `Ainda nao existem dados suficientes para definir o melhor jogador em ${period.label}.`;
    const scored = players
      .map((stats) => ({ stats, score: assistantPerformanceScore(stats, recentRanking[stats.jogadorId]) }))
      .sort((a, b) => b.score - a.score || b.stats.totalGols - a.stats.totalGols || b.stats.totalVitorias - a.stats.totalVitorias || a.stats.nome.localeCompare(b.stats.nome));
    const best = scored[0].stats;
    babaAssistant.context.players = [best.jogadorId];
    babaAssistant.context.topic = 'best';
    return `Considerando uma analise calculada de gols, vitorias, aproveitamento, presenca, titulos e fase recente, ${best.nome} aparece como melhor jogador em ${period.label}.\n\nNumeros dele: ${assistantDescribeStats(best)}\n\nCriterio usado: gols e vitorias pesam mais, aproveitamento e regularidade ajudam, e os ultimos 5 babas entram como fase recente.`;
  }

  function assistantLowestPerformance(question) {
    const { period, ranking } = assistantRankingForQuestion(question);
    const players = Object.values(ranking).filter((stats) => Number(stats.totalBabas || 0) >= 1 && Number(stats.totalJogos || 0) > 0);
    if (!players.length) return `Ainda nao ha dados suficientes para avaliar desempenho em ${period.label}.`;
    const enough = players.filter((stats) => stats.totalBabas >= 5);
    const base = enough.length ? enough : players;
    const recentRanking = assistantRankingForBabas(assistantLatestBabas(5));
    const lowest = base
      .map((stats) => ({ stats, score: assistantPerformanceScore(stats, recentRanking[stats.jogadorId]) }))
      .sort((a, b) => a.score - b.score || a.stats.aproveitamento - b.stats.aproveitamento || a.stats.nome.localeCompare(b.stats.nome))[0].stats;
    babaAssistant.context.players = [lowest.jogadorId];
    babaAssistant.context.topic = 'lowest';
    return `Pelos dados registrados, ${lowest.nome} aparece com o desempenho estatistico mais baixo em ${period.label}${enough.length ? ' entre jogadores com pelo menos 5 participacoes' : ''}.\n\nNumeros: ${assistantDescribeStats(lowest)}\n\nIsso nao significa que ele seja ruim; e apenas uma leitura esportiva dos dados atuais.`;
  }

  function assistantRecentPhase(question) {
    const latest = assistantLatestBabas(5);
    const previous = assistantLatestBabas(10).slice(5);
    const recent = assistantRankingForBabas(latest);
    const before = assistantRankingForBabas(previous);
    const recentItems = Object.values(recent).filter((stats) => stats.totalJogos > 0 || stats.totalGols > 0);
    if (!recentItems.length) return 'Ainda nao ha dados suficientes nos ultimos babas para analisar fase recente.';
    const improved = recentItems
      .map((stats) => {
        const prev = before[stats.jogadorId];
        return {
          stats,
          recentScore: assistantPerformanceScore(stats),
          delta: assistantPerformanceScore(stats) - assistantPerformanceScore(prev),
          prev,
        };
      })
      .sort((a, b) => b.recentScore - a.recentScore || b.delta - a.delta || a.stats.nome.localeCompare(b.stats.nome))[0];
    babaAssistant.context.players = [improved.stats.jogadorId];
    babaAssistant.context.topic = 'recent';
    const previousText = improved.prev ? `Nos 5 anteriores tinha ${improved.prev.totalGols || 0} gols e ${improved.prev.totalVitorias || 0} vitorias.` : 'Nao encontrei 5 babas anteriores suficientes para comparar toda a evolucao.';
    return `${improved.stats.nome} esta em melhor fase recente pelos ultimos ${latest.length} babas.\n\nNeste recorte: ${assistantDescribeStats(improved.stats)}\n${previousText}\n\nUsei gols, vitorias, aproveitamento e volume de jogos para chegar nessa analise.`;
  }

  function assistantPaymentAnswer(question) {
    if (!isOrganizer()) {
      return 'Pagamentos sao informacao administrativa. Entre como organizador para consultar quem pagou, pendencias e valores.';
    }
    const baba = getActiveBaba();
    const normalized = normalizeAssistantText(question);
    const players = getPaymentPlayers(baba);
    if (!players.length) return 'Nao encontrei jogadores cadastrados para calcular pagamentos.';
    const playerAsked = assistantFindPlayers(question)[0] || (/\bele\b|\bela\b/.test(normalized) ? getPlayer(babaAssistant.context.players[0]) : null);
    if (playerAsked) {
      const paid = isPlayerPaidThisMonth(playerAsked.id, baba);
      const value = formatCurrency(paymentPriceForPlayer(playerAsked));
      babaAssistant.context.players = [playerAsked.id];
      return paid
        ? `${playerAsked.nome} esta marcado como pago no mes atual. Valor registrado: ${value}.`
        : `${playerAsked.nome} ainda consta como pendente no mes atual. Valor esperado: ${value}.`;
    }
    const paid = players.filter((player) => isPlayerPaidThisMonth(player.id, baba));
    const pending = players.filter((player) => !isPlayerPaidThisMonth(player.id, baba));
    const stats = getPaymentStats(baba);
    const pendingValue = Math.max(0, stats.expected - stats.paid);
    const asksPerformance = normalized.includes('gol') || normalized.includes('vitor') || normalized.includes('ganh') || normalized.includes('aproveitamento');
    if (asksPerformance && (normalized.includes('nao pag') || normalized.includes('devend') || normalized.includes('pendente'))) {
      const { period, ranking } = assistantRankingForQuestion(question);
      const pendingIds = new Set(pending.map((player) => player.id));
      const metric = normalized.includes('vitor') || normalized.includes('ganh') ? 'wins' : (normalized.includes('aproveitamento') ? 'efficiency' : 'goals');
      const items = sortRanking(ranking, metric).filter((item) => pendingIds.has(item.jogadorId));
      if (!items.length) return `Nao encontrei desempenho registrado em ${period.label} entre jogadores pendentes de pagamento.`;
      const top = items[0];
      babaAssistant.context.players = [top.jogadorId];
      return `${top.nome} lidera entre os jogadores pendentes de pagamento em ${period.label}: ${assistantDescribeStats(top)}\n\nPagamento dele ainda consta como pendente no mes atual.`;
    }
    if (asksPerformance && (normalized.includes('ja pag') || normalized.includes('pagaram') || normalized.includes('pagou'))) {
      const { period, ranking } = assistantRankingForQuestion(question);
      const paidIds = new Set(paid.map((player) => player.id));
      const metric = normalized.includes('vitor') || normalized.includes('ganh') ? 'wins' : (normalized.includes('aproveitamento') ? 'efficiency' : 'goals');
      const items = sortRanking(ranking, metric).filter((item) => paidIds.has(item.jogadorId));
      if (!items.length) return `Nao encontrei desempenho registrado em ${period.label} entre jogadores que ja pagaram.`;
      const top = items[0];
      babaAssistant.context.players = [top.jogadorId];
      return `${top.nome} lidera entre os jogadores com pagamento confirmado em ${period.label}: ${assistantDescribeStats(top)}.`;
    }
    if (normalized.includes('quem pagou') || normalized.includes('ja pagou') || normalized.includes('pagaram')) {
      if (!paid.length) return 'Ainda nao encontrei pagamentos confirmados no mes atual.';
      return `Pagamentos confirmados no mes atual (${paid.length}/${players.length}):\n- ${paid.map((player) => `${player.nome} (${formatCurrency(paymentPriceForPlayer(player))})`).join('\n- ')}\n\nTotal recebido: ${formatCurrency(stats.paid)}.`;
    }
    if (normalized.includes('arrecad') || normalized.includes('receb')) {
      return `Arrecadacao do mes atual: ${formatCurrency(stats.paid)} recebidos de ${formatCurrency(stats.expected)} esperados.\n\nFalta receber: ${formatCurrency(pendingValue)}.`;
    }
    if (!pending.length) return `Todos os ${players.length} jogadores esperados estao marcados como pagos no mes atual. Total recebido: ${formatCurrency(stats.paid)}.`;
    return `Ainda existem ${pending.length} pagamentos pendentes:\n- ${pending.map((player) => `${player.nome} - ${formatCurrency(paymentPriceForPlayer(player))}`).join('\n- ')}\n\nTotal pendente: ${formatCurrency(pendingValue)}.`;
  }

  function assistantComparePlayers(question) {
    const normalized = normalizeAssistantText(question);
    let players = assistantFindPlayers(question);
    if (players.length < 2 && babaAssistant.context.players.length >= 2 && (normalized.includes('fase') || normalized.includes('melhor') || normalized.includes('compare'))) {
      players = babaAssistant.context.players.map((id) => getPlayer(id)).filter(Boolean);
    }
    if (players.length < 2) return 'Para comparar, me diga dois nomes. Exemplo: "Compare Carlos e Joao".';
    const selected = players.slice(0, 2);
    const { period, ranking } = assistantRankingForQuestion(question);
    const statsA = ranking[selected[0].id] || makeEmptyPlayerStats(selected[0].id, selected[0].nome);
    const statsB = ranking[selected[1].id] || makeEmptyPlayerStats(selected[1].id, selected[1].nome);
    const scoreA = assistantPerformanceScore(statsA);
    const scoreB = assistantPerformanceScore(statsB);
    const winner = scoreA === scoreB ? null : (scoreA > scoreB ? statsA : statsB);
    babaAssistant.context.players = selected.map((player) => player.id);
    babaAssistant.context.topic = 'compare';
    const verdict = winner
      ? `${winner.nome} leva vantagem pelo criterio combinado de gols, vitorias, aproveitamento e regularidade.`
      : 'Os dois ficam muito proximos pelo criterio combinado.';
    return `Comparacao em ${period.label}:\n\n${statsA.nome}:\n- ${assistantDescribeStats(statsA)}\n\n${statsB.nome}:\n- ${assistantDescribeStats(statsB)}\n\n${verdict}`;
  }

  function assistantPlayerAnswer(question) {
    const normalized = normalizeAssistantText(question);
    const asked = assistantFindPlayers(question)[0] || (/\bele\b|\bela\b|\bdele\b|\bdela\b/.test(normalized) ? getPlayer(babaAssistant.context.players[0]) : null);
    if (!asked) return '';
    const { period, ranking } = assistantRankingForQuestion(question);
    const stats = ranking[asked.id] || makeEmptyPlayerStats(asked.id, asked.nome);
    babaAssistant.context.players = [asked.id];
    if (normalized.includes('pag')) return assistantPaymentAnswer(question);
    if (normalized.includes('gol')) return `${asked.nome} tem ${stats.totalGols || 0} gols em ${period.label}. Media: ${stats.mediaGols || 0} por baba.`;
    if (normalized.includes('vitor') || normalized.includes('ganh')) return `${asked.nome} tem ${stats.totalVitorias || 0} vitorias em ${period.label}, com ${stats.aproveitamento || 0}% de aproveitamento.`;
    if (normalized.includes('perd')) return `${asked.nome} tem ${stats.totalDerrotas || 0} derrotas em ${period.label}.`;
    if (normalized.includes('aproveitamento') || normalized.includes('desempenho')) return `${asked.nome} em ${period.label}: ${assistantDescribeStats(stats)}`;
    return `${asked.nome} em ${period.label}: ${assistantDescribeStats(stats)}`;
  }

  function assistantPresenceAnswer(question) {
    const normalized = normalizeAssistantText(question);
    const period = assistantResolvePeriod(question);
    if (!period.babas.length) return `Nao encontrei babas registrados para ${period.label}.`;
    if (normalized.includes('quem jogou') || normalized.includes('quem veio') || normalized.includes('presentes')) {
      const names = new Set();
      period.babas.forEach((baba) => (baba.jogadoresPresentes || []).forEach((id) => names.add(playerName(id, baba))));
      if (!names.size) return `Nao encontrei presencas registradas em ${period.label}.`;
      return `Participaram em ${period.label} (${names.size}):\n- ${Array.from(names).sort((a, b) => a.localeCompare(b)).join('\n- ')}`;
    }
    if (normalized.includes('nao veio') || normalized.includes('faltou')) {
      const active = period.babas[0];
      const present = new Set(period.babas.flatMap((baba) => baba.jogadoresPresentes || []));
      const absent = state.players.filter((player) => player.ativo !== false && !present.has(player.id));
      if (!absent.length) return `Nao encontrei faltas em ${period.label}.`;
      return `Jogadores sem presenca registrada em ${period.label}:\n- ${absent.map((player) => player.nome || playerName(player.id, active)).join('\n- ')}`;
    }
    const ranking = assistantRankingForBabas(period.babas);
    const top = Object.values(ranking).filter((stats) => stats.totalBabas > 0).sort((a, b) => b.totalBabas - a.totalBabas || a.nome.localeCompare(b.nome))[0];
    if (!top) return `Nao encontrei presencas suficientes em ${period.label}.`;
    babaAssistant.context.players = [top.jogadorId];
    return `${top.nome} e quem mais participou em ${period.label}, com ${top.totalBabas} presencas registradas.`;
  }

  function assistantTeamAnswer(question) {
    const normalized = normalizeAssistantText(question);
    const period = assistantResolvePeriod(question);
    if (!period.babas.length) return `Nao encontrei babas para analisar times em ${period.label}.`;
    const teamRows = [];
    period.babas.forEach((baba) => {
      (baba.teams || []).forEach((team) => {
        if (!team?.id) return;
        let row = teamRows.find((item) => item.name === team.name);
        if (!row) {
          row = { name: team.name, gols: 0, vitorias: 0, derrotas: 0, empates: 0, jogadores: new Set() };
          teamRows.push(row);
        }
        row.gols += Number(team.golsPro || 0);
        row.vitorias += Number(team.vitorias || 0);
        row.derrotas += Number(team.derrotas || 0);
        row.empates += Number(team.empates || 0);
        (team.jogadores || []).forEach((id) => row.jogadores.add(playerName(id, baba)));
      });
    });
    if (!teamRows.length) return `Ainda nao existem times sorteados em ${period.label}.`;
    const namedTeam = teamRows.find((team) => normalized.includes(normalizeAssistantText(team.name)));
    if (namedTeam && (normalized.includes('quem jogou') || normalized.includes('formacao') || normalized.includes('jogadores'))) {
      return `${namedTeam.name} em ${period.label} teve estes jogadores registrados:\n- ${Array.from(namedTeam.jogadores).sort((a, b) => a.localeCompare(b)).join('\n- ')}`;
    }
    const metric = normalized.includes('gol') ? 'gols' : 'vitorias';
    const best = teamRows.sort((a, b) => b[metric] - a[metric] || b.gols - a.gols || a.name.localeCompare(b.name))[0];
    return `${best.name} lidera entre os times em ${period.label}, com ${best.vitorias} vitorias, ${best.gols} gols, ${best.empates} empates e ${best.derrotas} derrotas.`;
  }

  function answerBabaAssistantQuestion(question) {
    const normalized = normalizeAssistantText(question);
    if (!normalized) return 'Digite uma pergunta sobre gols, vitorias, jogadores, times, presencas ou pagamentos.';
    if (normalized.includes('ajuda') || normalized.includes('o que voce faz')) {
      return 'Posso consultar os dados reais do baba e responder sobre gols, vitorias, ranking, desempenho, fase recente, presencas, times e pagamentos.\n\nExemplos:\n- Quem fez mais gols?\n- Quem mais ganhou neste mes?\n- Compare dois jogadores\n- Quem esta em melhor fase?\n- Quem ainda nao pagou?';
    }
    const mentionedPlayers = assistantFindPlayers(question);
    const hasPayment = /\bpag|devend|pendente|arrecad|receb|mensal/.test(normalized);
    const hasCompare = normalized.includes('compare')
      || normalized.includes('comparacao')
      || /\bmelhor\b.*\bou\b/.test(normalized)
      || (mentionedPlayers.length >= 2 && (normalized.includes(' ou ') || normalized.includes(' entre ') || normalized.includes('mais gols') || normalized.includes('mais vitorias') || normalized.includes('ganha mais')));
    const hasTeam = /\btime\b|\btimes\b|barcelona|real madrid|arsenal|psg|chelsea|visitante/.test(normalized);
    const hasPresence = /presenca|particip|quem jogou|quem veio|faltou|nao veio|frequencia/.test(normalized);
    const hasRecent = /fase|recent|ultimamente|melhorou|evoluiu|caiu de rendimento/.test(normalized);
    const hasLowest = /pior|menor desempenho|mais perdeu|menos ganhou/.test(normalized);
    const playerDirect = assistantPlayerAnswer(question);

    if (hasPayment) return assistantPaymentAnswer(question);
    if (hasCompare) return assistantComparePlayers(question);
    if (playerDirect && !/quem\s+/.test(normalized)) return playerDirect;
    if (hasPresence) return assistantPresenceAnswer(question);
    if (hasTeam) return assistantTeamAnswer(question);
    if (hasRecent) return assistantRecentPhase(question);
    if (hasLowest) return assistantLowestPerformance(question);
    if (/melhor jogador|melhor desempenho|mais decisivo/.test(normalized)) return assistantBestPlayer(question);

    const { period, ranking } = assistantRankingForQuestion(question);
    if (normalized.includes('vitoria') || normalized.includes('ganhou') || normalized.includes('ganhar')) {
      const items = sortRanking(ranking, 'wins');
      if (items[0]) babaAssistant.context.players = [items[0].jogadorId];
      return assistantTopLine(items, 'wins', period.label);
    }
    if (normalized.includes('derrota') || normalized.includes('perdeu')) {
      const items = sortRanking(ranking, 'losses');
      if (items[0]) babaAssistant.context.players = [items[0].jogadorId];
      return assistantTopLine(items, 'losses', period.label);
    }
    if (normalized.includes('aproveitamento') || normalized.includes('eficiencia')) {
      const items = sortRanking(ranking, 'efficiency');
      if (items[0]) babaAssistant.context.players = [items[0].jogadorId];
      return assistantTopLine(items, 'efficiency', period.label);
    }
    if (normalized.includes('goleiro')) {
      const goalkeepers = calculateGoalkeeperRanking({ includeActive: true });
      if (!goalkeepers.length) return 'Ainda nao encontrei jogos suficientes com goleiros para montar esse ranking.';
      const top = goalkeepers[0];
      return `${top.nome} aparece como melhor goleiro pelo criterio de menos gols sofridos: ${top.golsSofridos} sofridos em ${top.jogos} jogos, media ${top.mediaSofridos}.`;
    }
    if (normalized.includes('gol') || normalized.includes('artilheiro') || normalized.includes('marcou')) {
      const items = sortRanking(ranking, 'goals');
      if (items[0]) babaAssistant.context.players = [items[0].jogadorId];
      return assistantTopLine(items, 'goals', period.label);
    }
    return 'Ainda nao consegui identificar a consulta. Tente perguntar sobre gols, vitorias, desempenho, fase recente, times, presencas ou pagamentos.';
  }

  function submitBabaAssistantQuestion(question) {
    const text = String(question || '').trim();
    if (!text) return;
    openBabaAssistant();
    babaAssistant.messages.push({ role: 'user', text });
    babaAssistant.typing = true;
    renderBabaAssistantMessages();
    if (babaAssistant.els.input) babaAssistant.els.input.value = '';
    window.setTimeout(() => {
      const answer = answerBabaAssistantQuestion(text);
      babaAssistant.typing = false;
      babaAssistant.messages.push({ role: 'bot', text: answer });
      renderBabaAssistantMessages();
    }, 420);
  }

  function wireBabaAssistant() {
    initBabaAssistant();
    if (babaAssistant.wired) return;
    babaAssistant.wired = true;
    babaAssistant.els.toggle?.addEventListener('click', () => (babaAssistant.open ? closeBabaAssistant() : openBabaAssistant()));
    babaAssistant.els.close?.addEventListener('click', closeBabaAssistant);
    babaAssistant.els.form?.addEventListener('submit', (event) => {
      event.preventDefault();
      submitBabaAssistantQuestion(babaAssistant.els.input?.value);
    });
    babaAssistant.els.root?.addEventListener('click', (event) => {
      const suggestion = event.target.closest('[data-ai-question]');
      if (suggestion) submitBabaAssistantQuestion(suggestion.dataset.aiQuestion);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && babaAssistant.open) closeBabaAssistant();
      if (event.key === 'Escape' && !els.passwordForm.classList.contains('hidden')) closeOrganizerPassword();
    });
  }

  function wireEvents() {
    wireBabaAssistant();
    els.enterOrganizer.addEventListener('click', openOrganizerPassword);
    els.enterPlayer.addEventListener('click', () => setMode('player'));
    els.closePassword?.addEventListener('click', closeOrganizerPassword);
    els.passwordForm.addEventListener('click', (event) => {
      if (event.target === els.passwordForm) closeOrganizerPassword();
    });
    els.passwordForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (els.passwordInput.value === ADMIN_PASSWORD) {
        rememberOrganizerAccess(Boolean(els.rememberOrganizer?.checked));
        setMode('organizer');
      }
      else {
        els.passwordFeedback.textContent = 'Senha incorreta.';
        els.passwordInput.select();
      }
    });
    els.logoutBtn.addEventListener('click', logout);
    els.modeReset.addEventListener('click', resetMode);
    els.createToday.addEventListener('click', () => createBaba(todayISO()));
    els.saveHistory.addEventListener('click', () => {
      const baba = getActiveBaba();
      if (!baba) return showToast('Crie um baba primeiro.');
      if (baba.status === 'finalizado') return showToast('Este baba ja esta salvo no historico.');
      finishBaba();
    });
    els.markPresent.addEventListener('click', () => els.presentModal.classList.remove('hidden'));
    els.drawTeams.addEventListener('click', drawTeams);
    els.startFirstGame.addEventListener('click', startFirstGame);
    els.undoGame.addEventListener('click', undoLastGame);
    els.finishBaba.addEventListener('click', finishBaba);
    els.resetCurrent.addEventListener('click', resetCurrentBaba);
    els.playerForm.addEventListener('submit', addPlayer);
    els.goalForm?.addEventListener('submit', addPurchaseGoal);
    els.goalCancelEdit?.addEventListener('click', resetPurchaseGoalForm);
    els.goalImage?.addEventListener('change', previewGoalImage);
    els.shareFab.addEventListener('click', shareBabaLink);
    els.closePresentModal.addEventListener('click', () => els.presentModal.classList.add('hidden'));
    els.closeGoalModal.addEventListener('click', closeGoalPicker);
    els.closeTeamDetailModal.addEventListener('click', () => els.teamDetailModal.classList.add('hidden'));
    els.closeGameDetailModal.addEventListener('click', () => els.gameDetailModal.classList.add('hidden'));
    els.presentModal.addEventListener('click', (event) => {
      if (event.target === els.presentModal) els.presentModal.classList.add('hidden');
    });
    els.goalModal.addEventListener('click', (event) => {
      if (event.target === els.goalModal) closeGoalPicker();
    });
    els.teamDetailModal.addEventListener('click', (event) => {
      if (event.target === els.teamDetailModal) els.teamDetailModal.classList.add('hidden');
    });
    els.gameDetailModal.addEventListener('click', (event) => {
      if (event.target === els.gameDetailModal) els.gameDetailModal.classList.add('hidden');
    });

    $$('.baba-tabs [data-tab]').forEach((button) => {
      button.addEventListener('click', () => setActiveTab(button.dataset.tab));
    });

    els.moreToggle?.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = els.moreMenu?.classList.contains('hidden');
      els.moreMenu?.classList.toggle('hidden', !willOpen);
      els.moreToggle?.setAttribute('aria-expanded', String(Boolean(willOpen)));
    });

    els.headerManage?.addEventListener('click', () => setActiveTab('organizer'));

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.baba-more-nav')) {
        els.moreMenu?.classList.add('hidden');
        els.moreToggle?.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('change', (event) => {
      const input = event.target.closest('[data-present-id]');
      if (input) togglePresent(input.dataset.presentId, input.checked);
    });

    document.addEventListener('click', (event) => {
      const exportButton = event.target.closest('[data-export-pdf]');
      if (exportButton) return exportBabaPdf(exportButton.dataset.exportPdf);

      const rankingToggle = event.target.closest('[data-rank-toggle]');
      if (rankingToggle) {
        const key = rankingToggle.dataset.rankToggle;
        if (expandedRankingKeys.has(key)) expandedRankingKeys.delete(key);
        else expandedRankingKeys.add(key);
        render();
        return;
      }

      const rankingModeButton = event.target.closest('[data-ranking-mode]');
      if (rankingModeButton) {
        rankingMode = rankingModeButton.dataset.rankingMode || 'goals';
        expandedRankingKeys.clear();
        render();
        return;
      }

      const actionButton = event.target.closest('[data-action]');
      if (actionButton?.dataset.action === 'toggle-player') return togglePlayerActive(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'delete-player') return deletePlayer(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'delete-visitor') return deleteVisitor(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'edit-goal') return editPurchaseGoal(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'delete-goal') return deletePurchaseGoal(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'save-goal-collected') {
        const input = document.querySelector(`[data-goal-collected-id="${actionButton.dataset.id}"]`);
        return updatePurchaseGoalCollected(actionButton.dataset.id, input?.value);
      }
      if (actionButton?.dataset.action === 'toggle-payment') return toggleBabaPayment(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'delete-history') return deleteHistoryBaba(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'open-goal-picker') return openGoalPicker(actionButton.dataset.teamId);
      if (actionButton?.dataset.action === 'undo-goal') return undoLastGoal();
      if (actionButton?.dataset.action === 'finish-live-match') return finishMatch(event);
      if (actionButton?.dataset.action === 'start-first-live') return startFirstGame();
      if (actionButton?.dataset.action === 'start-prepared-match') return startPreparedMatch();
      if (actionButton?.dataset.action === 'pause-time') return pauseMatchTimer();
      if (actionButton?.dataset.action === 'edit-time') return editMatchTime();
      if (actionButton?.dataset.action === 'choose-three-team-keep') return resolveThreeTeamTie(actionButton.dataset.teamId);
      if (actionButton?.dataset.action === 'resolve-three-team-tie') return resolveThreeTeamTie(actionButton.dataset.teamId);
      if (actionButton?.dataset.action === 'advance-team-reveal') return advanceTeamReveal();
      if (actionButton?.dataset.action === 'restart-team-reveal') return restartTeamReveal();

      const goalPlayerButton = event.target.closest('[data-goal-player-id]');
      if (goalPlayerButton) return registerGoal(goalPlayerButton.dataset.goalPlayerId);

      const teamButton = event.target.closest('[data-team-detail-id]');
      if (teamButton) return openTeamDetail(teamButton.dataset.teamDetailId, teamButton.dataset.teamDetailBabaId);

      const currentGameButton = event.target.closest('[data-current-game]');
      if (currentGameButton) return openCurrentGameDetail(currentGameButton.dataset.currentGame);

      const historyButton = event.target.closest('[data-history-id]');
      if (historyButton) {
        selectedHistoryId = historyButton.dataset.historyId;
        renderHistory();
      }

      const historyMoreButton = event.target.closest('[data-history-more]');
      if (historyMoreButton) {
        historyMoreButton.disabled = true;
        window.BabaRepository?.loadMoreHistory?.()
          .catch((error) => showToast(error.message || 'Nao foi possivel carregar o historico anterior.'))
          .finally(() => { historyMoreButton.disabled = false; });
      }

      const monthButton = event.target.closest('[data-month-key]');
      if (monthButton) {
        selectedMonthlyKey = monthButton.dataset.monthKey;
        renderMonthlyHistory();
      }
    });

    window.addEventListener('cloud-data-updated', () => {
      state = readState();
      render();
    });
    window.addEventListener('cloud-data-refresh-requested', () => {
      state = readState();
      render();
    });
  }

  function boot() {
    if (hasBooted) return;
    hasBooted = true;
    wireEvents();
    if (!timerTick) timerTick = setInterval(renderTimerOnly, 1000);
    const savedMode = sessionStorage.getItem(MODE_KEY);
    document.body.classList.toggle('baba-locked-viewer', isForcedViewerMode());
    if (isForcedViewerMode()) setMode('player');
    else if (savedMode === 'organizer' || savedMode === 'player') setMode(savedMode);
    else resetMode();
    render();
    wireTabsStickyState();
    document.getElementById('initial-loader')?.remove();
  }

  const backendTimer = setInterval(() => {
    if (window.BackendInitialized) {
      clearInterval(backendTimer);
      state = readState();
      boot();
    }
  }, 100);

  setTimeout(() => {
    if (!window.BackendInitialized && window.location.protocol === 'file:') {
      window.BackendInitialized = true;
      state = readState();
      boot();
      document.getElementById('initial-loader')?.remove();
    }
  }, 1500);
})();
