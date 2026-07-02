(() => {
  const STORAGE_KEY = 'psyzon_baba_state_v1';
  const ADMIN_PASSWORD = '153090';
  const TEAM_NAMES = ['Barcelona', 'Arsenal', 'Real Madrid', 'PSG', 'Chelsea'];
  const MODE_KEY = 'psyzon_baba_mode';
  const VISITOR_TEAM_ID = 'team_visitante';
  const VISITOR_TEAM_NAME = 'Visitante';
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
    modeReset: $('#mode-reset-btn'),
    logoutBtn: $('#baba-logout-btn'),
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
  let toastTimer = null;
  let goalTeamId = null;
  let editingGoalId = null;
  let timerTick = null;
  let hasBooted = false;
  let tabsStickySentinel = null;
  let tabsScrollFrame = null;

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

  function setMode(nextMode) {
    mode = nextMode;
    sessionStorage.setItem(MODE_KEY, nextMode);
    document.body.classList.toggle('baba-player-mode', nextMode === 'player');
    document.body.classList.toggle('baba-locked-viewer', isForcedViewerMode());
    els.gateway.classList.add('hidden');
    els.app.classList.remove('hidden');
    if (nextMode === 'player') setActiveTab('dashboard');
    render();
  }

  function resetMode() {
    mode = null;
    sessionStorage.removeItem(MODE_KEY);
    document.body.classList.remove('baba-player-mode');
    document.body.classList.remove('baba-locked-viewer');
    els.gateway.classList.remove('hidden');
    els.app.classList.add('hidden');
    els.passwordForm.classList.add('hidden');
    els.passwordInput.value = '';
    els.passwordFeedback.textContent = '';
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
    if (els.goalFormTitle) els.goalFormTitle.textContent = goal ? 'Editar meta de compra' : 'Nova meta de compra';
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
        const maxSide = 560;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(dataUrl);
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.64));
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

  function openDrawnTeams() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba?.teams?.length) return showToast('Sorteie os times antes de iniciar.');
    setActiveTab('teams');
    showToast('Confira os times sorteados e inicie o primeiro jogo por la.');
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
    els.goalPlayerList.innerHTML = team.jogadores.map((playerId) => `
      <button class="baba-goal-player" type="button" data-goal-player-id="${playerId}">
        <strong>${playerPaymentNameHTML(playerId, baba)}</strong>
        <small>${escapeHTML(team.name)}</small>
      </button>
    `).join('');
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
    const player = getBabaPlayer(baba, playerId);
    if (!match || !team || !player) return;

    match.goalEvents = match.goalEvents || [];
    const elapsed = Math.max(0, Number(match.durationSeconds || 8 * 60) - getRemainingSeconds(match));
    match.goalEvents.push({
      id: newId('goal'),
      jogadorId: player.id,
      jogadorNome: player.nome,
      time: team.id,
      timeNome: team.name,
      minuto: Math.max(1, Math.ceil(elapsed / 60)),
      registradoEm: Date.now(),
    });
    recomputeLiveScore(match);
    closeGoalPicker();
    saveState(`Gol de ${player.nome} registrado.`);
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

    baba.undoStack = baba.undoStack || [];
    baba.undoStack.push(JSON.stringify(baba));
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
      motivoSaida = baba.teams.length >= 4 ? 'empate: dois times sairam' : 'empate aguardando sorteio';

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
        pendingTieBreak = {
          gameNumber: match.numeroJogo,
          tiedTeams: [teamA.id, teamB.id],
          queue: [...(baba.filaTimes || [])],
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
      timeQueContinuou,
      timeQueSaiu,
      motivoSaida,
      decididoPorSorteio,
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
      saveState('Empate salvo. Sorteie o proximo confronto.');
    } else {
      saveState(empate && baba.teams.length >= 4 ? 'Empate salvo. Os dois times sairam e os proximos entraram.' : 'Jogo salvo. Proxima partida preparada.');
    }
  }

  function resolveThreeTeamTie() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const pending = baba?.pendingTieBreak;
    if (!baba || !pending) return showToast('Nao ha empate pendente para sortear.');

    const tiedTeams = pending.tiedTeams || [];
    const queue = [...(pending.queue || baba.filaTimes || [])];
    const nextTeamId = queue.shift();
    if (!nextTeamId || tiedTeams.length < 2) return showToast('Nao foi possivel montar o proximo jogo.');

    const chosen = shuffle(tiedTeams)[0];
    const out = tiedTeams.find((id) => id !== chosen);
    baba.filaTimes = [...queue, out].filter(Boolean);
    baba.jogoAtual = buildMatch(baba, chosen, nextTeamId);
    baba.pendingTieBreak = null;
    baba.status = 'preparado';
    baba.lastResult = {
      ...(baba.lastResult || {}),
      timeQueContinuou: chosen,
      timeQueSaiu: out,
      motivoSaida: 'sorteio por empate',
      decididoPorSorteio: true,
    };
    saveState(`${getTeam(baba, chosen)?.name || 'Time'} continua apos sorteio.`);
  }

  function undoLastGame() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const lastSnapshot = baba?.undoStack?.pop();
    if (!lastSnapshot) return showToast('Nao ha jogo para desfazer.');
    const restored = JSON.parse(lastSnapshot);
    const index = state.babas.findIndex((item) => item.id === restored.id);
    if (index >= 0) state.babas[index] = restored;
    saveState('Ultimo jogo desfeito.');
  }

  function finishBaba() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if (!baba.teams?.length) return showToast('Sorteie os times antes de finalizar.');
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
    const ranking = {};
    state.babas
      .filter((baba) => baba.status === 'finalizado' && monthKeyFromISO(baba.dataISO) === monthKey)
      .forEach((baba) => {
        Object.values(calculateDailyRanking(baba)).forEach((stats) => mergeRankingStats(ranking, stats));
      });

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
    state.babas
      .filter((baba) => baba.status === 'finalizado')
      .forEach((baba) => collectGoalkeeperRankingFromBaba(ranking, baba));

    const active = getActiveBaba();
    if (includeActive && active && active.status !== 'finalizado') {
      collectGoalkeeperRankingFromBaba(ranking, active, { includeLive: true });
    }

    return Object.values(ranking)
      .map((stats) => {
        stats.totalBabas = stats._babas?.size || 0;
        delete stats._babas;
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
      const startHTML = isOrganizer() && !baba.jogoAtual ? '<button class="baba-primary" type="button" data-action="start-first-live">Iniciar primeiro jogo</button>' : '';
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
        <button class="baba-mini-btn" type="button" data-current-game="${game.numeroJogo}">Gols</button>
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
        <b class="baba-result-tag ${game.empate ? 'is-draw' : 'is-win'}">${game.empate ? 'Empate' : 'Vitoria'}</b>
      </div>
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
      const tied = (baba.pendingTieBreak.tiedTeams || []).map((id) => getTeam(baba, id)?.name).filter(Boolean).join(' x ');
      els.currentMatchPanel.innerHTML = `
        <div class="baba-empty">Empate em ${escapeHTML(tied)}. Sorteie qual time continua e qual sera o proximo confronto.</div>
        ${isOrganizer() ? '<div class="baba-live-actions baba-live-actions--single"><button class="baba-primary" type="button" data-action="resolve-three-team-tie">Sortear proximo time</button></div>' : ''}
      `;
    } else if (!match || !teamA || !teamB) {
      els.currentMatchPanel.className = 'baba-current-match-panel';
      const canStart = isOrganizer() && baba?.teams?.length >= 2;
      els.currentMatchPanel.innerHTML = `
        <div class="baba-empty">Nenhum jogo iniciado.</div>
        ${canStart ? '<div class="baba-live-actions baba-live-actions--single"><button class="baba-primary" type="button" data-action="start-first-live">Iniciar primeiro jogo</button></div>' : ''}
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
            <button class="baba-live-main-btn" type="button" data-action="start-prepared-match">Iniciar partida</button>
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
        <div class="baba-match-live">
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
      els.lastResultPanel.innerHTML = `
        <div class="baba-row">
          <div>
            <strong>${resultLine}</strong>
            <small><span class="baba-result-tag ${baba.lastResult.decididoPorSorteio ? 'is-draw' : 'is-win'}">${baba.lastResult.decididoPorSorteio ? 'Empate: rodizio definido por sorteio' : 'Resultado normal'}</span></small>
          </div>
        </div>
        <div class="baba-row"><span>Continua em campo</span><b>${teamDetailButton(baba, keep, '-')}</b></div>
        <div class="baba-row"><span>Saiu para a fila</span><b>${teamButtonsFromValue(baba, baba.lastResult.timeQueSaiu) || escapeHTML(outNames)}</b></div>
        <div class="baba-row"><span>Motivo</span><b>${escapeHTML(baba.lastResult.motivoSaida)}</b></div>
      `;
    }
  }

  function renderRankings(baba) {
    renderRankingFilters();
    const general = sortRanking(calculateGeneralRanking(), rankingMode);
    const daily = getDailyRankingList(baba, rankingMode);
    const currentMonth = activeMonthKey(baba);
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

    els.historyList.innerHTML = finished.map((baba) => `
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

    renderHistoryDetail(finished.find((baba) => baba.id === selectedHistoryId));
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
    $$('.baba-tabs button').forEach((button) => button.classList.toggle('active', button.dataset.tab === safeTab));
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

  function wireEvents() {
    els.enterOrganizer.addEventListener('click', () => {
      els.passwordForm.classList.remove('hidden');
      els.passwordInput.focus();
    });
    els.enterPlayer.addEventListener('click', () => setMode('player'));
    els.passwordForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (els.passwordInput.value === ADMIN_PASSWORD) setMode('organizer');
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
    els.startFirstGame.addEventListener('click', openDrawnTeams);
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

    $$('.baba-tabs button').forEach((button) => {
      button.addEventListener('click', () => setActiveTab(button.dataset.tab));
    });

    document.addEventListener('change', (event) => {
      const input = event.target.closest('[data-present-id]');
      if (input) togglePresent(input.dataset.presentId, input.checked);
    });

    document.addEventListener('click', (event) => {
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
      if (actionButton?.dataset.action === 'resolve-three-team-tie') return resolveThreeTeamTie();
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
