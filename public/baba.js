(() => {
  const STORAGE_KEY = 'psyzon_baba_state_v1';
  const TEAM_NAMES = ['Time 1', 'Time 2', 'Time 3', 'Time 4', 'Time 5'];
  const MODE_KEY = 'psyzon_baba_mode';
  const VIEW_KEY = 'psyzon_baba_last_view';
  const VALID_VIEWS = new Set(['dashboard', 'table', 'ranking', 'history', 'teams', 'organizer', 'access', 'players']);
  const BABA_THEME_KEY = 'psyzon_baba_theme';
  const BACKUP_SCHEMA = 'baba-amigos-backup';
  const BACKUP_VERSION = 1;
  const MAX_BACKUP_FILE_SIZE = 25 * 1024 * 1024;
  const VISITOR_TEAM_ID = 'team_visitante';
  const VISITOR_TEAM_NAME = 'Visitante';
  const EXTERNAL_GOAL_SCORER_ID = '__external_goal_scorer__';
  const PLAYER_BABA_PRICE = 15;
  const GOALKEEPER_BABA_PRICE = 7;
  const PAYMENT_DUE_DAY = 10;
  const PLAYER_STATUS = Object.freeze({
    REGULAR: 'regular',
    NOVICE: 'novice',
    GUEST: 'guest',
    DISABLED: 'disabled',
  });
  const PLAYER_STATUS_OPTIONS = Object.freeze([
    { id: PLAYER_STATUS.REGULAR, label: 'Regular' },
    { id: PLAYER_STATUS.NOVICE, label: 'Novato' },
    { id: PLAYER_STATUS.GUEST, label: 'Convidado' },
    { id: PLAYER_STATUS.DISABLED, label: 'Desativado' },
  ]);
  const DRAW_SOUND_KEY = 'psyzon_baba_draw_sound';
  const MATCH_MODES = {
    ONLINE: 'ONLINE',
    MANUAL: 'MANUAL',
  };
  const NOVICE_EXIT_POLICY = Object.freeze({
    mode: 'manual',
    description: 'O jogador deixa de ser novato quando o organizador remove manualmente a condição.',
  });
  const TEAM_VISUALS = [
    { logo: 'img/baba-team-1-flamengo.jpg', accent: '#d53445' },
    { logo: 'img/baba-team-2-palmeiras.webp', accent: '#148552' },
    { logo: 'img/baba-team-3-vasco.png', accent: '#b8a46f' },
    { logo: 'img/baba-team-4-corinthians.png', accent: '#111827' },
    { logo: 'img/baba-time-5.png', accent: '#2563a8' },
  ];
  const GOAL_PRIORITIES = [
    { id: 'alta', label: 'Alta', value: 3 },
    { id: 'media', label: 'Media', value: 2 },
    { id: 'baixa', label: 'Baixa', value: 1 },
  ];
  const RANKING_MODES = [
    { id: 'stars', label: 'Melhores', icon: 'baba-trophy' },
    { id: 'goals', label: 'Gols', icon: 'baba-ball' },
    { id: 'wins', label: 'Vitórias', icon: 'baba-check' },
    { id: 'losses', label: 'Derrotas', icon: 'baba-x' },
    { id: 'worst', label: 'Pior jogador', icon: 'baba-x' },
    { id: 'titles', label: 'Títulos', icon: 'baba-trophy' },
    { id: 'efficiency', label: 'Aproveitamento', icon: 'baba-chart' },
  ];
  const RANKING_SCOPES = [
    { id: 'monthly', label: 'Do mês', icon: 'baba-calendar' },
    { id: 'general', label: 'Geral', icon: 'baba-chart' },
    { id: 'daily', label: 'Do dia', icon: 'baba-trophy' },
    { id: 'goalkeeper', label: 'Goleiro', icon: 'baba-save' },
    { id: 'history', label: 'Histórico', icon: 'baba-history-icon' },
  ];
  const PDF_ROW_LIMITS = {
    payments: 18,
    standings: 12,
    currentHistory: 24,
    dailyScorers: 26,
    rankings: 8,
  };
  const BABA_ASSISTANT_QUICK_QUESTIONS = [
    'Quem fez mais gols?',
    'Quem mais ganhou?',
    'Quem e o melhor jogador?',
    'Quem está em melhor fase?',
    'Quem ainda não pagou?',
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
    passwordFeedback: $('#password-feedback'),
    organizerGoogleLogin: $('#organizer-google-login'),
    organizerEmailLogin: $('#organizer-email-login'),
    organizerPasswordLogin: $('#organizer-password-login'),
    organizerEmailLoginBtn: $('#organizer-email-login-btn'),
    closePassword: $('#close-organizer-password'),
    playerCodeForm: $('#player-code-form'),
    playerCodeInput: $('#player-access-code'),
    playerCodeFeedback: $('#player-code-feedback'),
    rememberPlayerCode: $('#remember-player-code'),
    closePlayerCode: $('#close-player-code'),
    generatePlayerCode: $('#generate-player-code'),
    copyPlayerCode: $('#copy-player-code'),
    playerAccessCodeOutput: $('#player-access-code-output'),
    playerAccessAdminFeedback: $('#player-access-admin-feedback'),
    commissionAccessForm: $('#commission-access-form'),
    commissionAccessEmail: $('#commission-access-email'),
    commissionAccessPassword: $('#commission-access-password'),
    commissionAccessPasswordConfirm: $('#commission-access-password-confirm'),
    saveCommissionAccess: $('#save-commission-access'),
    commissionAccessFeedback: $('#commission-access-feedback'),
    modeReset: $('#mode-reset-btn'),
    themeToggle: $('#baba-theme-toggle'),
    logoutBtn: $('#baba-logout-btn'),
    moreToggle: $('#baba-more-toggle'),
    moreMenu: $('#baba-more-menu'),
    bottomNav: $('.baba-bottom-nav'),
    bottomMoreToggle: $('[data-bottom-more]'),
    mobileMoreMenu: $('#baba-mobile-more-menu'),
    headerManage: $('[data-header-tab="organizer"]'),
    createToday: $('#create-today-btn'),
    organizerCreateToday: $('#organizer-create-today-btn'),
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
    continuePresentDraw: $('#continue-present-draw'),
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
    currentGamesTitleLabel: $('#current-games-title-label'),
    lastResultPill: $('#last-result-pill'),
    lastResultPanel: $('#last-result-panel'),
    teamsGrid: $('#teams-grid'),
    drawStatusDescription: $('#draw-status-description'),
    drawSaveState: $('#draw-save-state'),
    drawReviewButton: $('#draw-review-button'),
    drawSaveButton: $('#draw-save-button'),
    drawProgress: $('#draw-progress'),
    drawReadyPanel: $('#draw-ready-panel'),
    drawResultsSection: $('#draw-results-section'),
    drawTeamsProgress: $('#draw-teams-progress'),
    drawActionBar: $('#draw-action-bar'),
    drawSecondaryControls: $('#draw-secondary-controls'),
    drawAnnouncer: $('#draw-announcer'),
    drawOverlay: $('#team-draw-overlay'),
    drawOverlayPanel: $('#team-draw-overlay .baba-draw-overlay__panel'),
    drawOverlayStep: $('#draw-overlay-step'),
    drawOverlayTitle: $('#draw-overlay-title'),
    drawOverlayDescription: $('#draw-overlay-description'),
    drawOverlayProgressBar: $('#draw-overlay-progress-bar'),
    drawOverlayContent: $('#draw-overlay-content'),
    drawOverlayActions: $('#draw-overlay-actions'),
    drawOverlayAnnouncer: $('#draw-overlay-announcer'),
    drawSkipButton: $('#draw-skip-button'),
    drawCloseButton: $('#draw-close-button'),
    drawSoundToggle: $('#draw-sound-toggle'),
    rankingList: $('#ranking-list'),
    dailyRankingList: $('#daily-ranking-list'),
    rankingFilterControls: $('#ranking-filter-controls'),
    rankingScopeControls: $('#ranking-scope-controls'),
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
    exportBackupJSON: $('#export-backup-json'),
    importBackupJSON: $('#import-backup-json'),
    backupJSONFile: $('#backup-json-file'),
    organizerFab: $('#baba-organizer-fab'),
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
    playerDetailModal: $('#player-detail-modal'),
    playerDetailTitle: $('#player-detail-title'),
    playerDetailContent: $('#player-detail-content'),
    closePlayerDetailModal: $('#close-player-detail-modal'),
    gameDetailModal: $('#game-detail-modal'),
    gameDetailTitle: $('#game-detail-title'),
    gameDetailList: $('#game-detail-list'),
    closeGameDetailModal: $('#close-game-detail-modal'),
    gameEditModal: $('#game-edit-modal'),
    gameEditForm: $('#game-edit-form'),
    gameEditTitle: $('#game-edit-title'),
    gameEditContent: $('#game-edit-content'),
    closeGameEditModal: $('#close-game-edit-modal'),
    historyEditModal: $('#history-edit-modal'),
    historyEditForm: $('#history-edit-form'),
    historyEditDate: $('#history-edit-date'),
    historyEditGoals: $('#history-edit-goals'),
    closeHistoryEditModal: $('#close-history-edit-modal'),
  };
  const moreMenuHome = els.moreMenu?.parentElement || null;

  let state = readState();
  let mode = null;
  let selectedHistoryId = null;
  let selectedMonthlyKey = null;
  let rankingMode = 'goals';
  let rankingScope = 'monthly';
  let performanceCache = null;
  let authoritativeHistoryRankings = null;
  let authoritativeHistoryRankingsPromise = null;
  const expandedRankingKeys = new Set();
  const loadingHistoryIds = new Set();
  const renderedHTMLCache = new WeakMap();
  const componentRenderSignatures = new Map();
  let toastTimer = null;
  let goalTeamId = null;
  let editingGoalId = null;
  let timerTick = null;
  let wakeLockSentinel = null;
  let queuePointerDrag = null;
  let queueNativeDragTeamId = null;
  let hasBooted = false;
  let tabsStickySentinel = null;
  let tabsScrollFrame = null;
  let cloudApplyTimer = null;
  let lastRenderedStateSignature = '';
  let pendingActionButton = null;
  let savingButtonState = null;
  let savingButtonFallbackTimer = null;
  let manualStatsSaveTimer = null;
  let goalCelebrationTimer = null;
  let babaAudioContext = null;
  let selectedTeamDetail = null;
  let selectedPlayerDetail = null;
  let selectedGameEdit = null;
  let selectedHistoryEdit = null;
  const playerPaymentFilters = { query: '', payment: 'all', status: 'all', novice: 'all' };
  let drawExperience = null;
  let drawSequenceToken = 0;
  let recentlyRevealedTeamId = null;
  let teamDetailOpener = null;
  let playerDetailOpener = null;
  let drawSoundEnabled = localStorage.getItem(DRAW_SOUND_KEY) === 'true';
  let pdfExportInProgress = false;
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

  function getBabaAudioContext() {
    if (babaAudioContext) return babaAudioContext;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    babaAudioContext = new AudioContextClass();
    return babaAudioContext;
  }

  function scheduleWhistleTone(context, startAt, frequency, endFrequency, duration, volume = .16) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startAt + duration);
    gain.gain.setValueAtTime(.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + .025);
    gain.gain.setValueAtTime(volume, Math.max(startAt + .025, startAt + duration - .055));
    gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + .02);
  }

  function playBabaWhistle(type = 'goal') {
    try {
      const context = getBabaAudioContext();
      if (!context) return;
      const play = () => {
        const startAt = context.currentTime + .025;
        if (type === 'finish') {
          scheduleWhistleTone(context, startAt, 980, 900, .25, .18);
          scheduleWhistleTone(context, startAt + .34, 940, 850, .23, .18);
          scheduleWhistleTone(context, startAt + .66, 900, 760, .52, .2);
          return;
        }
        scheduleWhistleTone(context, startAt, 1180, 1460, .14, .16);
        scheduleWhistleTone(context, startAt + .19, 1480, 1840, .2, .18);
      };
      if (context.state === 'suspended') {
        context.resume().then(play).catch(() => {});
      } else {
        play();
      }
    } catch (error) {
      console.warn('Não foi possível reproduzir o apito:', error);
    }
  }

  function unlockBabaAudio() {
    try {
      const context = getBabaAudioContext();
      if (context?.state === 'suspended') context.resume().catch(() => {});
    } catch (error) {
      // O navegador pode bloquear audio ate uma interacao valida.
    }
  }

  function renderTimerOnly() {
    const baba = getActiveBaba();
    const match = baba?.jogoAtual;
    const timerEl = $('#current-timer');
    if (!timerEl || !match) return;
    const remaining = getRemainingSeconds(match);
    if (remaining === 0 && match.timerRunning) {
      playBabaWhistle('finish');
      match.timerRunning = false;
      match.timerRemainingSeconds = 0;
      match.timerStartedAt = null;
      render();
      return;
    }
    const isPrepared = !match.timerRunning && !match.iniciadoEm;
    const timerText = timerEl.querySelector('.baba-timer__text');
    const nextText = isPrepared ? 'Aguardando início' : (remaining ? formatCountdown(remaining) : 'Tempo esgotado');
    if (timerText) timerText.textContent = nextText;
    else timerEl.textContent = nextText;
    timerEl.classList.toggle('is-over', remaining === 0 && !isPrepared);
    timerEl.classList.toggle('is-paused', !isPrepared && remaining > 0 && !match.timerRunning);
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function stableControlSelector(element) {
    if (!element) return '';
    if (element.id) return `#${CSS.escape(element.id)}`;
    const attributes = ['data-present-id', 'data-move-player-id', 'data-add-player-team', 'data-team-add-select', 'data-goal-collected-id'];
    const attribute = attributes.find((name) => element.hasAttribute?.(name));
    return attribute ? `[${attribute}="${CSS.escape(element.getAttribute(attribute))}"]` : '';
  }

  function supportsTextSelection(element) {
    if (!element || typeof element.setSelectionRange !== 'function') return false;
    if (element instanceof HTMLTextAreaElement) return true;
    if (!(element instanceof HTMLInputElement)) return false;
    return ['text', 'search', 'url', 'tel', 'password'].includes(String(element.type || '').toLowerCase());
  }

  function actionButtonSelector(button) {
    if (!button) return '';
    if (button.id) return `#${CSS.escape(button.id)}`;
    const parts = ['data-action', 'data-id', 'data-team-id', 'data-history-id']
      .filter((name) => button.hasAttribute(name))
      .map((name) => `[${name}="${CSS.escape(button.getAttribute(name))}"]`);
    if (parts.length) return `button${parts.join('')}`;
    return button.form?.id && button.type === 'submit'
      ? `#${CSS.escape(button.form.id)} button[type="submit"]`
      : '';
  }

  function rememberActionButton(event) {
    const button = event.target.closest?.('button');
    if (!button || button.disabled) return;
    pendingActionButton = button;
    queueMicrotask(() => {
      if (pendingActionButton === button) pendingActionButton = null;
    });
  }

  function clearSavingButton() {
    clearTimeout(savingButtonFallbackTimer);
    if (!savingButtonState) return;
    const wasDrawSave = savingButtonState.selector === '#draw-save-button';
    const button = document.querySelector(savingButtonState.selector);
    if (button) {
      button.innerHTML = savingButtonState.html;
      button.disabled = savingButtonState.disabled;
      button.removeAttribute('aria-busy');
    }
    savingButtonState = null;
    if (wasDrawSave && els.drawSaveState) {
      els.drawSaveState.textContent = 'Salvo com sucesso';
      els.drawSaveState.className = 'baba-save-state is-success';
    }
  }

  function markActionButtonSaving() {
    const selector = actionButtonSelector(pendingActionButton);
    pendingActionButton = null;
    if (!selector) return;
    const button = document.querySelector(selector);
    if (!button) return;
    clearSavingButton();
    savingButtonState = { selector, html: button.innerHTML, disabled: button.disabled };
    button.textContent = 'Salvando...';
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (selector === '#draw-save-button' && els.drawSaveState) {
      els.drawSaveState.textContent = 'Salvando...';
      els.drawSaveState.className = 'baba-save-state is-saving';
    }
    savingButtonFallbackTimer = setTimeout(clearSavingButton, 2500);
  }

  function setHTML(element, html) {
    if (!element) return false;
    const nextHTML = String(html ?? '');
    if (renderedHTMLCache.get(element) === nextHTML || element.innerHTML === nextHTML) {
      renderedHTMLCache.set(element, nextHTML);
      return false;
    }

    const active = element.contains(document.activeElement) ? document.activeElement : null;
    const activeSelector = stableControlSelector(active);
    const selection = active && 'selectionStart' in active
      ? { start: active.selectionStart, end: active.selectionEnd }
      : null;
    const scrollTop = element.scrollTop;
    element.innerHTML = nextHTML;
    renderedHTMLCache.set(element, nextHTML);
    element.scrollTop = scrollTop;

    if (activeSelector) {
      const replacement = element.querySelector(activeSelector);
      replacement?.focus({ preventScroll: true });
      if (replacement && selection && supportsTextSelection(replacement)) {
        replacement.setSelectionRange(selection.start, selection.end);
      }
    }
    return true;
  }

  function renderHash(value) {
    let hash = 2166136261;
    const source = String(value ?? '');
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function reconcileKeyedChildren(container, items) {
    if (!container) return;
    renderedHTMLCache.delete(container);
    const existing = new Map(Array.from(container.children)
      .filter((node) => node.dataset.renderKey)
      .map((node) => [node.dataset.renderKey, node]));

    items.forEach((item, index) => {
      const signature = renderHash(item.signature ?? item.html);
      let node = existing.get(item.key);
      if (!node || node.dataset.renderSignature !== signature) {
        const template = document.createElement('template');
        template.innerHTML = String(item.html || '').trim();
        const replacement = template.content.firstElementChild;
        if (!replacement) return;
        replacement.dataset.renderKey = item.key;
        replacement.dataset.renderSignature = signature;
        if (node) node.replaceWith(replacement);
        node = replacement;
      }
      existing.delete(item.key);
      const currentAtIndex = container.children[index];
      if (currentAtIndex !== node) container.insertBefore(node, currentAtIndex || null);
    });

    existing.forEach((node) => node.remove());
  }

  function renderStateSignature(value = state) {
    if (!value) return '';
    const clean = JSON.parse(JSON.stringify(value));
    delete clean.updatedAt;
    return JSON.stringify(clean);
  }

  function renderComponent(key, payload, callback) {
    const signature = renderStateSignature({ mode, payload });
    if (componentRenderSignatures.get(key) === signature) return false;
    componentRenderSignatures.set(key, signature);
    callback();
    return true;
  }

  function secureRandom() {
    if (window.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      window.crypto.getRandomValues(value);
      return value[0] / 4294967296;
    }
    return Math.random();
  }

  function shuffle(items) {
    return window.BabaManagementCore.shuffleItems(items, secureRandom);
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
      playerStats: {},
      monthlyStats: {},
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
        paymentUpdatedAtMs: safe.paymentUpdatedAtMs && typeof safe.paymentUpdatedAtMs === 'object' && !Array.isArray(safe.paymentUpdatedAtMs)
          ? safe.paymentUpdatedAtMs
          : {},
        atualizadoEm: Number(safe.atualizadoEm || safe.updatedAt || Date.now()),
        mergeSchemaVersion: Math.max(0, Number(safe.mergeSchemaVersion || 0)),
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
    next.players.forEach((player) => applyPlayerStatus(player, getPlayerStatus(player), { preserveAudit: true }));
    next.babas = Array.isArray(next.babas) ? next.babas : [];
    next.monthlyPayments = normalizeMonthlyPayments(next.monthlyPayments);
    next.playerStats = next.playerStats && typeof next.playerStats === 'object' && !Array.isArray(next.playerStats) ? next.playerStats : {};
    next.monthlyStats = next.monthlyStats && typeof next.monthlyStats === 'object' && !Array.isArray(next.monthlyStats) ? next.monthlyStats : {};
    next.purchaseGoals = Array.isArray(next.purchaseGoals)
      ? next.purchaseGoals.map(normalizePurchaseGoal).filter(Boolean)
      : [];
    next.babas.forEach((baba) => {
      baba.visitantes = Array.isArray(baba.visitantes) ? baba.visitantes : [];
      baba.participantFlags = baba.participantFlags && typeof baba.participantFlags === 'object' && !Array.isArray(baba.participantFlags)
        ? baba.participantFlags
        : {};
      baba.pagamentos = baba.pagamentos && typeof baba.pagamentos === 'object' && !Array.isArray(baba.pagamentos) ? baba.pagamentos : {};
      baba.undoStack = normalizeUndoStack(baba.undoStack);
      baba.matchMode = normalizeMatchMode(baba.matchMode);
      if (baba.matchMode === MATCH_MODES.MANUAL) ensureManualStats(baba);
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

  function subtractStatsFromRanking(ranking, stats) {
    const playerId = stats?.jogadorId || stats?.playerId;
    const target = playerId ? ranking?.[playerId] : null;
    if (!target) return;
    [
      'totalGols',
      'totalVitorias',
      'totalEmpates',
      'totalDerrotas',
      'totalJogos',
      'totalBabas',
      'totalTitulosBaba',
      'goalkeeperGames',
      'goalsConceded',
    ].forEach((field) => {
      target[field] = Math.max(0, Number(target[field] || 0) - Number(stats[field] || 0));
    });
    finalizeStats(target);
  }

  const persistedStatFields = [
    'totalGols',
    'totalVitorias',
    'totalEmpates',
    'totalDerrotas',
    'totalJogos',
    'totalBabas',
    'totalTitulosBaba',
    'goalkeeperGames',
    'goalsConceded',
  ];

  function addStatsToRanking(ranking, stats) {
    const playerId = stats?.jogadorId || stats?.playerId;
    if (!ranking || !playerId) return;
    const target = ranking[playerId] || makeEmptyPlayerStats(playerId, stats.nome || playerName(playerId));
    persistedStatFields.forEach((field) => {
      target[field] = Number(target[field] || 0) + Number(stats[field] || 0);
    });
    target.jogadorId = playerId;
    target.nome = stats.nome || target.nome || playerName(playerId);
    ranking[playerId] = target;
    finalizeStats(target);
  }

  function forEachPersistedBabaStat(baba, callback) {
    Object.values(calculateDailyRanking(baba)).forEach(callback);
    const goalkeeperRanking = {};
    collectGoalkeeperRankingFromBaba(goalkeeperRanking, baba);
    Object.values(goalkeeperRanking).forEach((stats) => callback({
      jogadorId: stats.jogadorId,
      nome: stats.nome,
      goalkeeperGames: Number(stats.jogos || 0),
      goalsConceded: Number(stats.golsSofridos || 0),
    }));
  }

  function revisePersistedStatsForBaba(previousBaba, nextBaba) {
    const hasGeneralStats = Boolean(state.playerStats && Object.keys(state.playerStats).length);
    const previousMonth = monthKeyFromISO(previousBaba?.dataISO);
    const nextMonth = monthKeyFromISO(nextBaba?.dataISO);
    const previousMonthlyStats = previousMonth ? state.monthlyStats?.[previousMonth] : null;
    const nextMonthlyStats = nextMonth ? state.monthlyStats?.[nextMonth] : null;
    if (!hasGeneralStats && !previousMonthlyStats && !nextMonthlyStats) return;

    if (previousBaba?.status === 'finalizado') {
      forEachPersistedBabaStat(previousBaba, (stats) => {
        if (hasGeneralStats) subtractStatsFromRanking(state.playerStats, stats);
        if (previousMonthlyStats) subtractStatsFromRanking(previousMonthlyStats, stats);
      });
    }
    if (nextBaba?.status === 'finalizado') {
      forEachPersistedBabaStat(nextBaba, (stats) => {
        if (hasGeneralStats) addStatsToRanking(state.playerStats, stats);
        if (nextMonthlyStats) addStatsToRanking(nextMonthlyStats, stats);
      });
    }
  }

  function applyDeletedBabaToPersistedStats(baba) {
    const monthKey = monthKeyFromISO(baba?.dataISO);
    const hasGeneralStats = state.playerStats && Object.keys(state.playerStats).length;
    const monthlyStats = monthKey ? state.monthlyStats?.[monthKey] : null;

    if (!hasGeneralStats && !monthlyStats) return;

    forEachPersistedBabaStat(baba, (stats) => {
      if (hasGeneralStats) subtractStatsFromRanking(state.playerStats, stats);
      if (monthlyStats) subtractStatsFromRanking(monthlyStats, stats);
    });

    if (!hasFinishedBabas()) state.playerStats = {};
    if (monthKey && !hasFinishedBabasInMonth(monthKey) && state.monthlyStats) delete state.monthlyStats[monthKey];
  }

  function saveState(message) {
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
    markActionButtonSaving();
    if (message) showToast(message);
  }

  function scheduleManualStatsSave() {
    state.updatedAt = Date.now();
    render();
    clearTimeout(manualStatsSaveTimer);
    manualStatsSaveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      markActionButtonSaving();
    }, 500);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 3200);
  }

  function backupImageField(key) {
    const normalized = String(key || '').toLowerCase().replace(/[^a-z]/g, '');
    return ['foto', 'fotos', 'imagem', 'imagens', 'image', 'images', 'imagedata', 'photo', 'photos', 'avatar', 'avatars', 'logo', 'logos', 'thumbnail', 'capa'].includes(normalized);
  }

  function stripImagesFromBackup(value, report = { removed: 0 }) {
    if (typeof value === 'string') {
      if (/^(?:data:image\/|blob:)/i.test(value.trim())) {
        report.removed += 1;
        return undefined;
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => stripImagesFromBackup(item, report)).filter((item) => item !== undefined);
    }
    if (!value || typeof value !== 'object') return value;

    const clean = {};
    Object.entries(value).forEach(([key, entry]) => {
      if (['__proto__', 'prototype', 'constructor', '__detailLoaded'].includes(key)) return;
      if (backupImageField(key)) {
        if (entry) report.removed += 1;
        return;
      }
      const sanitized = stripImagesFromBackup(entry, report);
      if (sanitized !== undefined) clean[key] = sanitized;
    });
    return clean;
  }

  function backupSummary(value) {
    const source = value || {};
    return {
      jogadores: Array.isArray(source.players) ? source.players.length : 0,
      babas: Array.isArray(source.babas) ? source.babas.length : 0,
      historicos: Array.isArray(source.babas) ? source.babas.filter((baba) => baba?.status === 'finalizado').length : 0,
      rankings: source.playerStats && typeof source.playerStats === 'object' ? Object.keys(source.playerStats).length : 0,
      metas: Array.isArray(source.purchaseGoals) ? source.purchaseGoals.length : 0,
    };
  }

  function createBackupEnvelope(source, options = {}) {
    const imageReport = { removed: 0 };
    const data = stripImagesFromBackup(JSON.parse(JSON.stringify(source || createEmptyState())), imageReport);
    return {
      schema: BACKUP_SCHEMA,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      imagesIncluded: false,
      cloudHistoryComplete: options.cloudHistoryComplete !== false,
      summary: backupSummary(data),
      data,
      imagesRemoved: imageReport.removed,
    };
  }

  async function completeStateForBackup() {
    const backupState = normalizeState(JSON.parse(JSON.stringify(state)));
    const repository = window.BabaRepository;
    let cloudHistoryComplete = true;
    if (!repository?.loadBaba) return { backupState, cloudHistoryComplete };

    try {
      let pageCount = 0;
      while (repository.hasMoreHistory?.() && pageCount < 200) {
        const page = await repository.loadMoreHistory?.();
        pageCount += 1;
        if (!Array.isArray(page) || !page.length) break;
      }
      if (repository.hasMoreHistory?.()) cloudHistoryComplete = false;

      const metadata = Array.isArray(window.__babaRemoteMetadata) ? window.__babaRemoteMetadata : [];
      const byId = new Map((backupState.babas || []).map((baba) => [baba.id, baba]));
      const idsToLoad = metadata
        .filter((item) => item?.id && !item.deleted && !byId.get(item.id)?.__detailLoaded)
        .map((item) => item.id);

      for (let index = 0; index < idsToLoad.length; index += 4) {
        const batch = idsToLoad.slice(index, index + 4);
        const results = await Promise.allSettled(batch.map((id) => repository.loadBaba(id)));
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value?.id) byId.set(result.value.id, result.value);
          else if (result.status === 'rejected') cloudHistoryComplete = false;
        });
      }
      backupState.babas = [...byId.values()].sort((a, b) => Number(b.criadoEm || 0) - Number(a.criadoEm || 0));
    } catch (error) {
      console.warn('Não foi possível carregar todo o histórico remoto para o backup:', error);
      cloudHistoryComplete = false;
    }
    return { backupState, cloudHistoryComplete };
  }

  function backupFilename() {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `backup-baba-${stamp}.json`;
  }

  function setBackupButtonBusy(button, busy, label) {
    if (!button) return;
    const text = button.querySelector('span');
    if (text && !button.dataset.defaultLabel) button.dataset.defaultLabel = text.textContent;
    if (text) text.textContent = busy ? label : button.dataset.defaultLabel;
    button.disabled = busy;
    button.setAttribute('aria-busy', String(Boolean(busy)));
  }

  async function exportBackupJSON() {
    if (!requireOrganizer()) return;
    setBackupButtonBusy(els.exportBackupJSON, true, 'Preparando...');
    showToast('Preparando backup completo sem imagens...');
    try {
      const { backupState, cloudHistoryComplete } = await completeStateForBackup();
      const backup = createBackupEnvelope(backupState, { cloudHistoryComplete });
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backupFilename();
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      const warning = cloudHistoryComplete ? '' : ' Os dados disponiveis foram salvos, mas parte do historico da nuvem nao respondeu.';
      showToast(`Backup JSON exportado sem imagens.${warning}`);
    } catch (error) {
      console.error('Falha ao exportar backup JSON:', error);
      showToast('Não foi possível exportar o backup agora.');
    } finally {
      setBackupButtonBusy(els.exportBackupJSON, false, '');
    }
  }

  function importedBackupState(parsed) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Arquivo JSON invalido.');
    if (parsed.schema === BACKUP_SCHEMA && Number(parsed.version || 0) > BACKUP_VERSION) {
      throw new Error('Este backup foi criado por uma versao mais nova do sistema.');
    }
    const source = parsed.schema === BACKUP_SCHEMA ? parsed.data : (parsed.data || parsed.state || parsed.dados || parsed);
    if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('O arquivo nao contem dados do Baba.');
    const recognized = ['players', 'babas', 'purchaseGoals', 'monthlyPayments', 'playerStats', 'monthlyStats']
      .some((key) => Object.prototype.hasOwnProperty.call(source, key));
    if (!recognized) throw new Error('O arquivo nao foi reconhecido como um backup do Baba.');
    if (source.players != null && !Array.isArray(source.players)) throw new Error('A lista de jogadores do backup e invalida.');
    if (source.babas != null && !Array.isArray(source.babas)) throw new Error('O historico do backup e invalido.');

    const imageReport = { removed: 0 };
    const clean = stripImagesFromBackup(source, imageReport);
    const next = normalizeState(clean);
    if (next.activeBabaId && !next.babas.some((baba) => baba.id === next.activeBabaId)) next.activeBabaId = null;
    next.updatedAt = Date.now();
    return { next, imageReport };
  }

  async function importBackupJSON(file) {
    if (!requireOrganizer()) return;
    if (!file) return;
    if (file.size > MAX_BACKUP_FILE_SIZE) {
      showToast('O arquivo ultrapassa o limite de 25 MB. Use um backup sem imagens.');
      return;
    }

    setBackupButtonBusy(els.importBackupJSON, true, 'Validando...');
    try {
      const parsed = JSON.parse(await file.text());
      const { next, imageReport } = importedBackupState(parsed);
      const summary = backupSummary(next);
      const playerLabel = summary.jogadores === 1 ? 'jogador' : 'jogadores';
      const babaLabel = summary.babas === 1 ? 'baba' : 'babas';
      const historyLabel = summary.historicos === 1 ? 'historico' : 'historicos';
      const ok = window.confirm(
        `Importar este backup com ${summary.jogadores} ${playerLabel}, ${summary.babas} ${babaLabel} e ${summary.historicos} ${historyLabel}?\n\nOs dados atuais deste dispositivo e da sincronizacao serao substituidos.`,
      );
      if (!ok) return;

      state = next;
      selectedHistoryId = null;
      selectedMonthlyKey = null;
      expandedRankingKeys.clear();
      componentRenderSignatures.clear();
      saveState(`Backup importado com sucesso${imageReport.removed ? `; ${imageReport.removed} imagem(ns) ignorada(s)` : ''}.`);
    } catch (error) {
      console.error('Falha ao importar backup JSON:', error);
      showToast(error instanceof SyntaxError ? 'O arquivo selecionado não é um JSON válido.' : (error.message || 'Não foi possível importar o backup.'));
    } finally {
      if (els.backupJSONFile) els.backupJSONFile.value = '';
      setBackupButtonBusy(els.importBackupJSON, false, '');
    }
  }

  function applyCloudState(nextState) {
    const next = nextState
      ? normalizeState(JSON.parse(JSON.stringify(nextState)))
      : readState();
    const signature = renderStateSignature(next);
    if (signature === lastRenderedStateSignature) return;
    if (nextState) {
      state = next;
    } else {
      state = next;
    }
    render();
  }

  function scheduleCloudStateApply(nextState = null) {
    clearTimeout(cloudApplyTimer);
    cloudApplyTimer = setTimeout(() => applyCloudState(nextState), 60);
  }

  function showGoalCelebration(playerName, team) {
    const player = String(playerName || '').trim();
    if (!player) return;
    let celebration = document.getElementById('baba-goal-celebration');
    if (!celebration) {
      celebration = document.createElement('div');
      celebration.id = 'baba-goal-celebration';
      celebration.className = 'baba-goal-celebration';
      celebration.setAttribute('aria-live', 'polite');
      document.body.appendChild(celebration);
    }
    const teamNumber = getTeamNumber(team);
    if (teamNumber) celebration.dataset.teamNumber = String(teamNumber);
    else delete celebration.dataset.teamNumber;
    celebration.innerHTML = `
      <div class="baba-goal-fireworks" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="baba-goal-celebration__card">
        <small>Gol confirmado</small>
        <strong>${escapeHTML(player)}</strong>
        <span>${escapeHTML(team?.name || 'Time')}</span>
      </div>
    `;
    clearTimeout(goalCelebrationTimer);
    celebration.classList.remove('is-showing');
    void celebration.offsetWidth;
    celebration.classList.add('is-showing');
    goalCelebrationTimer = setTimeout(() => {
      celebration.classList.remove('is-showing');
    }, 2500);
  }

  function getActiveBaba() {
    return state.babas.find((baba) => baba.id === state.activeBabaId) || null;
  }

  function getLatestFinishedBaba() {
    return state.babas
      .filter((baba) => baba.status === 'finalizado')
      .sort((a, b) => (
        String(b.dataISO || '').localeCompare(String(a.dataISO || ''))
        || Number(b.finalizadoEm || b.criadoEm || 0) - Number(a.finalizadoEm || a.criadoEm || 0)
      ))[0] || null;
  }

  function getDisplayedBaba() {
    return getActiveBaba() || getLatestFinishedBaba();
  }

  function hasBabaStartedMatch(baba) {
    return Boolean((baba?.jogos || []).length || baba?.jogoAtual?.iniciadoEm);
  }

  function applyBabaTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('baba-dark-theme', isDark);
    if (!els.themeToggle) return;
    els.themeToggle.setAttribute('aria-pressed', String(isDark));
    els.themeToggle.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
    els.themeToggle.title = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';
  }

  function toggleBabaTheme() {
    const nextTheme = document.body.classList.contains('baba-dark-theme') ? 'light' : 'dark';
    if (window.ThemeProvider) {
      window.ThemeProvider.setPreferences({ mode: nextTheme });
      return;
    }
    localStorage.setItem(BABA_THEME_KEY, nextTheme);
    applyBabaTheme(nextTheme);
  }

  function getBabaById(id) {
    return state.babas.find((baba) => baba.id === id) || null;
  }

  function getPlayer(id) {
    return state.players.find((player) => player.id === id) || null;
  }

  function getPlayerStatus(player) {
    if (!player) return PLAYER_STATUS.REGULAR;
    if (Object.values(PLAYER_STATUS).includes(player.status)) return player.status;
    if (player.ativo === false) return PLAYER_STATUS.DISABLED;
    if (player.convidado === true || player.visitante === true || player.tipo === 'visitante') return PLAYER_STATUS.GUEST;
    if (player.novato === true || player.noviceActive === true) return PLAYER_STATUS.NOVICE;
    return PLAYER_STATUS.REGULAR;
  }

  function applyPlayerStatus(player, status, { preserveAudit = false } = {}) {
    if (!player) return PLAYER_STATUS.REGULAR;
    const safeStatus = Object.values(PLAYER_STATUS).includes(status) ? status : PLAYER_STATUS.REGULAR;
    player.status = safeStatus;
    player.ativo = safeStatus !== PLAYER_STATUS.DISABLED;
    player.novato = safeStatus === PLAYER_STATUS.NOVICE;
    player.noviceActive = player.novato;
    player.convidado = safeStatus === PLAYER_STATUS.GUEST;
    if (!preserveAudit) {
      player.statusUpdatedAtMs = Date.now();
      if (player.novato) player.noviceSinceMs = player.noviceSinceMs || Date.now();
      player.noviceReason = player.novato ? 'manual-mark' : 'manual-removal';
      player.noviceReasonImportId = null;
    }
    return safeStatus;
  }

  function playerStatusLabel(player) {
    const status = getPlayerStatus(player);
    return PLAYER_STATUS_OPTIONS.find((option) => option.id === status)?.label || 'Regular';
  }

  function getVisitor(baba, id) {
    return (baba?.visitantes || []).find((player) => player.id === id) || null;
  }

  function getBabaPlayer(baba, id) {
    const player = getPlayer(id) || getVisitor(baba, id);
    if (player) return player;
    const snapshot = baba?.participantFlags?.[id];
    if (!snapshot?.typedName) return null;
    return {
      id,
      nome: snapshot.typedName,
      tipo: snapshot.goalkeeper ? 'goleiro' : 'jogador',
      visitante: Boolean(snapshot.guest),
      convidado: Boolean(snapshot.guest),
      ativo: true,
    };
  }

  function getParticipantFlags(baba, playerId) {
    const player = getBabaPlayer(baba, playerId);
    const stored = baba?.participantFlags?.[playerId] || {};
    return {
      guest: Boolean(stored.guest || getPlayerStatus(player) === PLAYER_STATUS.GUEST || player?.visitante || player?.tipo === 'visitante'),
      goalkeeper: Boolean(stored.goalkeeper || player?.tipo === 'goleiro'),
      novice: Boolean(stored.novice || player?.novato),
      typedName: stored.typedName || player?.nome || '',
    };
  }

  function isBabaGoalkeeper(baba, playerId) {
    return getParticipantFlags(baba, playerId).goalkeeper;
  }

  function getTeam(baba, id) {
    return baba?.teams?.find((team) => team.id === id) || null;
  }

  function isTeamInRotation(team) {
    return Boolean(team && !team.retiradoDoBaba);
  }

  function getRotationTeams(baba) {
    return (baba?.teams || []).filter(isTeamInRotation);
  }

  function sanitizeTeamQueue(baba, queue = baba?.filaTimes || []) {
    const seen = new Set();
    return (queue || []).filter((teamId) => {
      const team = getTeam(baba, teamId);
      if (!isTeamInRotation(team) || seen.has(teamId)) return false;
      seen.add(teamId);
      return true;
    });
  }

  function applyTeamQueueOrder(queue, message = 'Ordem da fila atualizada.') {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    const nextQueue = sanitizeTeamQueue(baba, queue);
    const currentQueue = sanitizeTeamQueue(baba);
    if (nextQueue.length !== currentQueue.length
      || nextQueue.some((teamId, index) => teamId !== currentQueue[index])) {
      baba.filaTimes = nextQueue;
      if (baba.pendingTieBreak) baba.pendingTieBreak.queue = [...nextQueue];
      saveState(message);
    }
  }

  function moveQueuedTeam(teamId, destination) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    const queue = sanitizeTeamQueue(baba);
    const currentIndex = queue.indexOf(teamId);
    if (currentIndex < 0) return;
    queue.splice(currentIndex, 1);
    if (destination === 'end') queue.push(teamId);
    else queue.unshift(teamId);
    const team = getTeam(baba, teamId);
    applyTeamQueueOrder(
      queue,
      destination === 'end'
        ? `${team?.name || 'Time'} foi para o fim da fila.`
        : `${team?.name || 'Time'} será o próximo a entrar.`,
    );
  }

  function queueOrderFromDOM() {
    return Array.from(els.queueList?.querySelectorAll('[data-queue-team-id]') || [])
      .map((item) => item.dataset.queueTeamId)
      .filter(Boolean);
  }

  function clearQueueDragStyles() {
    els.queueList?.querySelectorAll('.queue-item').forEach((item) => {
      item.classList.remove('is-dragging', 'is-drag-over');
    });
  }

  function placeQueueItemAtPointer(draggedItem, clientX, clientY) {
    if (!draggedItem || !els.queueList) return;
    const target = document.elementFromPoint(clientX, clientY)?.closest?.('[data-queue-team-id]');
    if (!target || target === draggedItem || target.parentElement !== els.queueList) return;
    els.queueList.querySelectorAll('.queue-item').forEach((item) => item.classList.remove('is-drag-over'));
    target.classList.add('is-drag-over');
    const targetRect = target.getBoundingClientRect();
    const insertAfter = clientY > targetRect.top + targetRect.height / 2;
    els.queueList.insertBefore(draggedItem, insertAfter ? target.nextSibling : target);
  }

  function beginQueuePointerDrag(event) {
    const handle = event.target.closest?.('[data-queue-drag-handle]');
    if (!handle || !isOrganizer()) return;
    const item = handle.closest('[data-queue-team-id]');
    if (!item) return;
    const startX = event.clientX;
    const startY = event.clientY;
    queuePointerDrag = {
      item,
      handle,
      pointerId: event.pointerId,
      startX,
      startY,
      active: false,
      holdTimer: window.setTimeout(() => {
        if (!queuePointerDrag || queuePointerDrag.pointerId !== event.pointerId) return;
        queuePointerDrag.active = true;
        item.classList.add('is-dragging');
        handle.setPointerCapture?.(event.pointerId);
        navigator.vibrate?.(25);
      }, 280),
    };
  }

  function moveQueuePointerDrag(event) {
    if (!queuePointerDrag || queuePointerDrag.pointerId !== event.pointerId) return;
    if (!queuePointerDrag.active) {
      const moved = Math.hypot(
        event.clientX - queuePointerDrag.startX,
        event.clientY - queuePointerDrag.startY,
      );
      if (moved > 10) {
        clearTimeout(queuePointerDrag.holdTimer);
        queuePointerDrag = null;
      }
      return;
    }
    event.preventDefault();
    placeQueueItemAtPointer(queuePointerDrag.item, event.clientX, event.clientY);
  }

  function finishQueuePointerDrag(event, cancelled = false) {
    if (!queuePointerDrag || queuePointerDrag.pointerId !== event.pointerId) return;
    clearTimeout(queuePointerDrag.holdTimer);
    const wasActive = queuePointerDrag.active;
    queuePointerDrag.handle.releasePointerCapture?.(event.pointerId);
    queuePointerDrag = null;
    if (!wasActive) return;
    const order = queueOrderFromDOM();
    clearQueueDragStyles();
    if (cancelled) return render();
    applyTeamQueueOrder(order);
  }

  function teamHasActiveRoute(baba, teamId) {
    return [baba?.jogoAtual?.timeA, baba?.jogoAtual?.timeB].includes(teamId)
      || (baba?.pendingTieBreak?.tiedTeams || []).includes(teamId);
  }

  function getTeamNumber(teamOrId) {
    const id = typeof teamOrId === 'string' ? teamOrId : teamOrId?.id;
    const match = String(id || '').match(/^team_(\d+)$/i);
    return match ? Number(match[1]) : null;
  }

  function teamNumberDataAttribute(teamOrId) {
    const number = getTeamNumber(teamOrId);
    return number ? ` data-team-number="${number}"` : '';
  }

  function getPlayerTeam(baba, playerId) {
    return (baba?.teams || []).find((team) => (team.jogadores || []).includes(playerId)) || null;
  }

  function gameTeamPlayers(baba, game, teamId) {
    if (teamId === game?.timeA && Array.isArray(game.jogadoresTimeA)) return game.jogadoresTimeA;
    if (teamId === game?.timeB && Array.isArray(game.jogadoresTimeB)) return game.jogadoresTimeB;
    return getTeam(baba, teamId)?.jogadores || [];
  }

  function teamOrderValue(team) {
    if (!team) return 9999;
    if (team.id === VISITOR_TEAM_ID || team.tipo === 'visitante') return 9998;
    const match = String(team.id || '').match(/^team_(\d+)$/);
    return match ? Number(match[1]) : 9997;
  }

  function getSequentialTeamIds(teams = []) {
    return [...teams]
      .filter(isTeamInRotation)
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

  function normalizeMatchMode(value) {
    return String(value || '').toUpperCase() === MATCH_MODES.MANUAL ? MATCH_MODES.MANUAL : MATCH_MODES.ONLINE;
  }

  function isManualMode(baba) {
    return normalizeMatchMode(baba?.matchMode) === MATCH_MODES.MANUAL;
  }

  function makeEmptyManualTeamStats() {
    return {
      wins: 0,
      draws: 0,
      losses: 0,
      playerGoals: {},
    };
  }

  function getManualTeamStats(team) {
    const safe = team && typeof team.manualStats === 'object' && !Array.isArray(team.manualStats)
      ? team.manualStats
      : {};
    const stats = {
      wins: Math.max(0, Number(safe.wins ?? safe.vitorias ?? team?.vitorias ?? 0) || 0),
      draws: Math.max(0, Number(safe.draws ?? safe.empates ?? team?.empates ?? 0) || 0),
      losses: Math.max(0, Number(safe.losses ?? safe.derrotas ?? team?.derrotas ?? 0) || 0),
      playerGoals: safe.playerGoals && typeof safe.playerGoals === 'object' && !Array.isArray(safe.playerGoals)
        ? { ...safe.playerGoals }
        : {},
    };
    (team?.jogadores || []).forEach((playerId) => {
      stats.playerGoals[playerId] = Math.max(0, Number(stats.playerGoals[playerId] || 0) || 0);
    });
    return stats;
  }

  function manualTeamGoals(team) {
    const stats = getManualTeamStats(team);
    return (team?.jogadores || []).reduce((sum, playerId) => sum + Number(stats.playerGoals[playerId] || 0), 0);
  }

  function applyManualStatsToTeam(team) {
    if (!team) return null;
    const stats = getManualTeamStats(team);
    team.manualStats = stats;
    team.vitorias = stats.wins;
    team.empates = stats.draws;
    team.derrotas = stats.losses;
    team.pontos = (stats.wins * 3) + stats.draws;
    team.golsPro = manualTeamGoals(team);
    team.golsContra = 0;
    return team;
  }

  function ensureManualStats(baba) {
    if (!baba) return baba;
    baba.matchMode = normalizeMatchMode(baba.matchMode);
    if (baba.matchMode !== MATCH_MODES.MANUAL) return baba;
    baba.jogoAtual = null;
    baba.jogos = [];
    baba.filaTimes = [];
    baba.lastResult = null;
    baba.pendingTieBreak = null;
    (baba.teams || []).forEach(applyManualStatsToTeam);
    return baba;
  }

  function getUnassignedPresentPlayers(baba) {
    if (!baba) return [];
    const assignedIds = new Set((baba.teams || []).flatMap((team) => team.jogadores || []));
    return (baba.jogadoresPresentes || [])
      .map(getPlayer)
      .filter((player) => player?.ativo && !assignedIds.has(player.id));
  }

  function getNextTeamIdentity(baba) {
    const highestTeamNumber = Math.max(0, ...(baba?.teams || []).map((team) => {
      const match = String(team.id || '').match(/^team_(\d+)$/);
      return match ? Number(match[1]) : 0;
    }));
    const number = highestTeamNumber + 1;
    return {
      id: `team_${number}`,
      name: configuredTeamName(number),
    };
  }

  function configuredTeamName(number) {
    return window.BabaTeamTheme?.getTeam?.(number)?.name
      || TEAM_NAMES[number - 1]
      || `Time ${number}`;
  }

  function applyConfiguredTeamIdentities() {
    (state.babas || []).forEach((baba) => {
      const namesById = new Map();
      (baba.teams || []).forEach((team) => {
        if (team?.id !== VISITOR_TEAM_ID && team?.tipo !== 'visitante') {
          const number = getTeamNumber(team);
          if (number) {
            const configured = window.BabaTeamTheme?.getTeam?.(number);
            team.name = configured?.name || configuredTeamName(number);
            if (configured?.logo) team.logo = configured.logo;
          }
        }
        if (team?.id && team?.name) namesById.set(team.id, team.name);
      });
      [...(baba.jogos || []), baba.jogoAtual].filter(Boolean).forEach((game) => {
        game.timeANome = namesById.get(game.timeA) || game.timeANome;
        game.timeBNome = namesById.get(game.timeB) || game.timeBNome;
      });
      if (Array.isArray(baba.campeaoDoBaba?.times)) {
        baba.campeaoDoBaba.nomes = baba.campeaoDoBaba.times
          .map((teamId) => namesById.get(teamId))
          .filter(Boolean);
      }
    });
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
    team.jogadores = baba.visitantes.filter((player) => !player.foraDoBaba).map((player) => player.id);
    const inCurrentMatch = [baba.jogoAtual?.timeA, baba.jogoAtual?.timeB].includes(team.id);
    if (!inCurrentMatch && isTeamInRotation(team) && getRotationTeams(baba).length >= 2 && !(baba.filaTimes || []).includes(team.id)) {
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
    if (!key) return 'Mês atual';
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
    return `<button class="baba-team-link team-pill" type="button" data-team-detail-id="${team.id}" data-team-detail-baba-id="${baba?.id || ''}"${teamNumberDataAttribute(team)}>${escapeHTML(team.name)}</button>`;
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
      <span class="baba-score-boxes scoreboard__score ${compact ? 'baba-score-boxes--compact' : ''}" aria-label="Placar ${Number(scoreA || 0)} a ${Number(scoreB || 0)}">
        <b class="baba-score-box score-number baba-score-box--${stateA}">${Number(scoreA || 0)}</b>
        <span>x</span>
        <b class="baba-score-box score-number baba-score-box--${stateB}">${Number(scoreB || 0)}</b>
      </span>
    `;
  }

  function matchLineHTML(baba, teamA, scoreA, scoreB, teamB, compact = false) {
    return `
      <span class="baba-match-line match-row__teams ${compact ? 'baba-match-line--compact' : ''}">
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
    if (record.decididoPorSorteio) return 'Empate: rodízio definido por sorteio';
    if (record.empate || record.resultado === 'empate') return 'Empate';
    return 'Resultado normal';
  }

  function getPendingTieBreakRoute(baba, pending = baba?.pendingTieBreak) {
    const tiedTeamIds = (pending?.tiedTeams || []).filter((id) => isTeamInRotation(getTeam(baba, id)));
    const tiedTeams = tiedTeamIds.map((id) => getTeam(baba, id)).filter(Boolean);
    const sourceQueue = sanitizeTeamQueue(baba, pending?.queue || baba?.filaTimes || []);
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
      state.monthlyPayments[key] = { pagamentos: {}, paymentUpdatedAtMs: {}, atualizadoEm: Date.now(), mergeSchemaVersion: 2 };
    }
    const record = state.monthlyPayments[key];
    record.pagamentos = record.pagamentos && typeof record.pagamentos === 'object' && !Array.isArray(record.pagamentos)
      ? record.pagamentos
      : {};
    record.paymentUpdatedAtMs = record.paymentUpdatedAtMs && typeof record.paymentUpdatedAtMs === 'object' && !Array.isArray(record.paymentUpdatedAtMs)
      ? record.paymentUpdatedAtMs
      : {};
    record.atualizadoEm = Number(record.atualizadoEm || Date.now());
    record.mergeSchemaVersion = Math.max(0, Number(record.mergeSchemaVersion || 0));
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
    const player = getBabaPlayer(baba, playerId);
    const status = getPlayerStatus(player);
    if (status === PLAYER_STATUS.NOVICE) return 'novice';
    if (status === PLAYER_STATUS.GUEST) return 'guest';
    if (status === PLAYER_STATUS.DISABLED) return 'disabled';
    const key = currentPaymentMonthKey();
    if (hasMonthlyPaymentRecord(playerId, key)) return state.monthlyPayments[key].pagamentos[playerId] ? 'paid' : 'unpaid';
    if (hasPaymentRecord(baba, playerId)) return baba.pagamentos[playerId] ? 'paid' : 'unpaid';
    return force || getPlayer(playerId) || playerAppearsInBaba(baba, playerId) ? 'unpaid' : null;
  }

  function playerPaymentNameHTML(playerId, baba = getActiveBaba(), options = {}) {
    const name = options.name || playerName(playerId, baba);
    const paymentState = playerPaymentState(playerId, baba, options);
    const team = getPlayerTeam(baba, playerId);
    const identity = playerNameWithStarsHTML(playerId, baba, { name, rating: options.rating });
    if (!paymentState) return `<span class="baba-player-identity"${teamNumberDataAttribute(team)}>${identity}</span>`;
    const label = ({
      paid: 'Pago',
      unpaid: 'Não pagou',
      novice: 'Novato',
      guest: 'Convidado',
      disabled: 'Desativado',
    })[paymentState] || 'Não pagou';
    return `
      <span class="baba-player-payment is-${paymentState}"${teamNumberDataAttribute(team)}>
        <span class="baba-player-payment__name">${identity}</span>
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

  async function requestSiteWakeLock() {
    if (!mode || document.visibilityState !== 'visible' || wakeLockSentinel || !('wakeLock' in navigator)) return;
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      }, { once: true });
    } catch (error) {
      wakeLockSentinel = null;
    }
  }

  async function releaseSiteWakeLock() {
    const sentinel = wakeLockSentinel;
    wakeLockSentinel = null;
    try {
      await sentinel?.release?.();
    } catch (error) {
      // O navegador também pode liberar o bloqueio automaticamente ao ocultar a página.
    }
  }

  function authenticatedAdmin() {
    const user = window.firebaseAuth?.currentUser?.();
    return user && user.uid !== 'local_user' ? user : null;
  }

  function waitForAccessRepository(timeoutMs = 4000) {
    if (window.BabaAccessRepository) return Promise.resolve(window.BabaAccessRepository);
    return new Promise((resolve) => {
      const finish = () => resolve(window.BabaAccessRepository || null);
      window.addEventListener('baba-access-ready', finish, { once: true });
      window.setTimeout(finish, timeoutMs);
    });
  }

  function openOrganizerPassword() {
    els.passwordForm.classList.remove('hidden');
    document.body.classList.add('baba-password-is-open');
    els.passwordFeedback.textContent = '';
    window.setTimeout(() => els.organizerGoogleLogin?.focus(), 40);
  }

  function closeOrganizerPassword() {
    els.passwordForm.classList.add('hidden');
    document.body.classList.remove('baba-password-is-open');
    els.passwordFeedback.textContent = '';
  }

  function openPlayerCode() {
    els.playerCodeForm?.classList.remove('hidden');
    document.body.classList.add('baba-password-is-open');
    if (els.playerCodeFeedback) els.playerCodeFeedback.textContent = '';
    window.setTimeout(() => els.playerCodeInput?.focus(), 40);
  }

  function closePlayerCode() {
    els.playerCodeForm?.classList.add('hidden');
    document.body.classList.remove('baba-password-is-open');
    if (els.playerCodeInput) els.playerCodeInput.value = '';
    if (els.playerCodeFeedback) els.playerCodeFeedback.textContent = '';
  }

  function setMode(nextMode, options = {}) {
    mode = nextMode;
    sessionStorage.setItem(MODE_KEY, nextMode);
    if (options.rememberDevice !== false) localStorage.setItem(MODE_KEY, nextMode);
    else if (options.rememberDevice === false) localStorage.removeItem(MODE_KEY);
    document.body.classList.add('baba-app-mode');
    document.body.classList.toggle('baba-player-mode', nextMode === 'player');
    document.body.classList.toggle('baba-locked-viewer', isForcedViewerMode());
    els.gateway.classList.add('hidden');
    els.app.classList.remove('hidden');
    els.bottomNav?.classList.remove('hidden');
    closeOrganizerPassword();
    closePlayerCode();
    const candidateView = options.view || localStorage.getItem(VIEW_KEY) || 'dashboard';
    const savedView = VALID_VIEWS.has(candidateView) ? candidateView : 'dashboard';
    setActiveTab(nextMode === 'player' && ['organizer', 'access', 'players'].includes(savedView) ? 'dashboard' : savedView);
    if (nextMode === 'organizer') refreshCommissionAccess();
    requestSiteWakeLock();
    render();
  }

  function resetMode() {
    mode = null;
    releaseSiteWakeLock();
    sessionStorage.removeItem(MODE_KEY);
    localStorage.removeItem(MODE_KEY);
    document.body.classList.remove('baba-app-mode');
    document.body.classList.remove('baba-player-mode');
    document.body.classList.remove('baba-locked-viewer');
    els.gateway.classList.remove('hidden');
    els.app.classList.add('hidden');
    els.bottomNav?.classList.add('hidden');
    els.mobileMoreMenu?.classList.add('hidden');
    closeOrganizerPassword();
    closePlayerCode();
  }

  async function logout() {
    if (mode === 'player') window.BabaAccessRepository?.clearPlayerAccess?.();
    if (authenticatedAdmin()) await window.firebaseAuth?.logout?.().catch?.(() => {});
    resetMode();
    showToast('Acesso encerrado neste dispositivo.');
  }

  async function loginOrganizerWithGoogle() {
    if (els.organizerGoogleLogin) els.organizerGoogleLogin.disabled = true;
    els.passwordFeedback.textContent = 'Conectando com o Google...';
    try {
      const result = await window.firebaseAuth?.loginWithGoogle?.(true);
      const user = result?.user || authenticatedAdmin();
      if (user) setMode('organizer', { rememberDevice: true });
    } catch (error) {
      const messages = {
        'auth/unauthorized-domain': 'Este domínio precisa ser autorizado no Firebase Authentication.',
        'auth/operation-not-allowed': 'Ative o provedor Google no Firebase Authentication.',
        'auth/popup-closed-by-user': 'O login foi cancelado antes de concluir.',
        'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente novamente.',
      };
      els.passwordFeedback.textContent = messages[error?.code] || error?.message || 'Não foi possível entrar com o Google.';
    } finally {
      if (els.organizerGoogleLogin) els.organizerGoogleLogin.disabled = false;
    }
  }

  function organizerAuthMessage(error) {
    const messages = {
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/wrong-password': 'E-mail ou senha incorretos.',
      'auth/user-not-found': 'E-mail ou senha incorretos.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
      'auth/operation-not-allowed': 'Ative o provedor E-mail/senha no Firebase Authentication.',
      'auth/email-already-in-use': 'Este e-mail já pertence a outra conta do sistema.',
      'auth/provider-already-linked': 'O acesso por senha já está vinculado a esta conta.',
      'auth/requires-recent-login': 'Entre novamente com o Google e repita a alteração.',
      'auth/requires-google-reauth': 'Por segurança, saia e entre novamente com o Google para alterar este acesso.',
      'auth/google-owner-required': 'Somente a sessão aberta pelo Google pode alterar este acesso.',
    };
    return messages[error?.code] || error?.message || 'Não foi possível concluir o acesso.';
  }

  async function loginOrganizerWithEmail(event) {
    event.preventDefault();
    if (!els.organizerEmailLogin?.reportValidity() || !els.organizerPasswordLogin?.reportValidity()) return;
    if (els.organizerEmailLoginBtn) els.organizerEmailLoginBtn.disabled = true;
    els.passwordFeedback.textContent = 'Entrando...';
    try {
      const result = await window.firebaseAuth?.loginWithEmailPassword?.(
        els.organizerEmailLogin.value,
        els.organizerPasswordLogin.value,
      );
      const user = result?.user || authenticatedAdmin();
      if (user) setMode('organizer', { rememberDevice: true });
    } catch (error) {
      els.passwordFeedback.textContent = organizerAuthMessage(error);
      els.organizerPasswordLogin?.select();
    } finally {
      if (els.organizerEmailLoginBtn) els.organizerEmailLoginBtn.disabled = false;
    }
  }

  async function refreshCommissionAccess() {
    if (!els.commissionAccessForm || !authenticatedAdmin()) return;
    try {
      const info = await window.firebaseAuth?.accountAccessInfo?.();
      if (els.commissionAccessEmail) els.commissionAccessEmail.value = info?.email || '';
      if (els.saveCommissionAccess) {
        els.saveCommissionAccess.textContent = info?.hasPassword ? 'Trocar senha da comissão' : 'Criar acesso da comissão';
        els.saveCommissionAccess.disabled = !info?.canManage;
      }
      if (els.commissionAccessPassword) els.commissionAccessPassword.disabled = !info?.canManage;
      if (els.commissionAccessPasswordConfirm) els.commissionAccessPasswordConfirm.disabled = !info?.canManage;
      if (els.commissionAccessFeedback) {
        els.commissionAccessFeedback.textContent = info?.canManage
          ? (info?.hasPassword
            ? 'Acesso ativo e sincronizado. Digite uma nova senha somente se quiser trocá-la.'
            : 'Use o e-mail acima como login e crie a senha que será entregue à comissão.')
          : 'Para criar ou trocar esta senha, saia e entre com o botão Google.';
      }
    } catch (error) {
      if (els.commissionAccessFeedback) els.commissionAccessFeedback.textContent = organizerAuthMessage(error);
    }
  }

  async function saveCommissionAccess(event) {
    event.preventDefault();
    const password = els.commissionAccessPassword?.value || '';
    const confirmation = els.commissionAccessPasswordConfirm?.value || '';
    if (!els.commissionAccessPassword?.reportValidity() || !els.commissionAccessPasswordConfirm?.reportValidity()) return;
    if (password !== confirmation) {
      els.commissionAccessFeedback.textContent = 'As duas senhas precisam ser iguais.';
      els.commissionAccessPasswordConfirm?.select();
      return;
    }
    if (els.saveCommissionAccess) els.saveCommissionAccess.disabled = true;
    els.commissionAccessFeedback.textContent = 'Salvando acesso...';
    try {
      const result = await window.firebaseAuth?.saveCommissionLogin?.(els.commissionAccessEmail?.value, password);
      els.commissionAccessPassword.value = '';
      els.commissionAccessPasswordConfirm.value = '';
      els.commissionAccessFeedback.textContent = result?.created
        ? 'Acesso criado. A comissão já pode entrar com este e-mail e a nova senha.'
        : 'Senha atualizada. Os dados continuam vinculados à mesma conta Google.';
      if (els.saveCommissionAccess) els.saveCommissionAccess.textContent = 'Trocar senha da comissão';
    } catch (error) {
      els.commissionAccessFeedback.textContent = organizerAuthMessage(error);
    } finally {
      if (els.saveCommissionAccess) els.saveCommissionAccess.disabled = false;
    }
  }

  async function submitPlayerCode(event) {
    event.preventDefault();
    if (!window.BabaAccessRepository) {
      els.playerCodeFeedback.textContent = 'O validador ainda está carregando. Tente novamente.';
      return;
    }
    const submit = els.playerCodeForm?.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    els.playerCodeFeedback.textContent = 'Validando código...';
    try {
      const result = await window.BabaAccessRepository.verifyPlayerCode(els.playerCodeInput?.value, {
        remember: els.rememberPlayerCode?.checked !== false,
      });
      if (!result.valid) {
        els.playerCodeFeedback.textContent = result.reason;
        els.playerCodeInput?.select();
        return;
      }
      els.playerCodeFeedback.textContent = 'Sincronizando histórico do organizador...';
      const syncedState = await window.BabaRepository?.refreshAccountData?.(result.accountId);
      state = syncedState ? normalizeState(syncedState) : readState();
      setMode('player', { rememberDevice: els.rememberPlayerCode?.checked !== false });
    } catch (error) {
      els.playerCodeFeedback.textContent = error?.message || 'Não foi possível validar o código.';
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  async function generatePlayerAccessCode() {
    if (!authenticatedAdmin()) return openOrganizerPassword();
    if (els.generatePlayerCode) els.generatePlayerCode.disabled = true;
    if (els.playerAccessAdminFeedback) els.playerAccessAdminFeedback.textContent = 'Gerando código seguro...';
    try {
      const result = await window.BabaAccessRepository?.generatePlayerCode?.();
      if (!result?.code) throw new Error('O gerador de código não foi carregado.');
      els.playerAccessCodeOutput.textContent = result.code;
      els.playerAccessCodeOutput.dataset.code = result.code;
      els.copyPlayerCode.disabled = false;
      els.playerAccessAdminFeedback.textContent = 'Código fixo da conta ativo. Ele não muda em novas consultas.';
    } catch (error) {
      els.playerAccessAdminFeedback.textContent = error?.message || 'Não foi possível gerar o código.';
    } finally {
      if (els.generatePlayerCode) els.generatePlayerCode.disabled = false;
    }
  }

  async function restorePlayerAccessCodeForOrganizer() {
    const repository = await waitForAccessRepository();
    const savedCode = repository?.getSavedPlayerCode?.();
    if (!savedCode || !els.playerAccessCodeOutput) return;
    try {
      const result = await repository.verifyPlayerCode(savedCode, { remember: true });
      if (!result?.valid || mode !== 'organizer') return;
      els.playerAccessCodeOutput.textContent = result.code;
      els.playerAccessCodeOutput.dataset.code = result.code;
      if (els.copyPlayerCode) els.copyPlayerCode.disabled = false;
      if (els.playerAccessAdminFeedback) els.playerAccessAdminFeedback.textContent = 'Código ativo restaurado neste dispositivo.';
    } catch (error) {
      // A tela administrativa continua utilizável mesmo quando a rede está indisponível.
    }
  }

  async function copyPlayerAccessCode() {
    const code = els.playerAccessCodeOutput?.dataset.code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      els.playerAccessAdminFeedback.textContent = `Código ${code} copiado.`;
    } catch (error) {
      els.playerAccessAdminFeedback.textContent = `Código: ${code}`;
    }
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
      matchMode: MATCH_MODES.ONLINE,
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
      drawBatchCount: 0,
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

  function setBabaMatchMode(nextMode) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if (baba.status === 'finalizado') return showToast('Este baba ja foi finalizado.');
    if ((baba.teams || []).length || (baba.jogos || []).length || baba.jogoAtual) {
      return showToast('Escolha o modo de anotacao antes de sortear os times.');
    }
    baba.matchMode = normalizeMatchMode(nextMode);
    if (isManualMode(baba)) ensureManualStats(baba);
    saveState(isManualMode(baba) ? 'Modo Manual selecionado.' : 'Modo Pelo Site selecionado.');
  }

  function openDrawSetup() {
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if ((baba.teams || []).length) return createLateArrivalTeam();
    setActiveTab('teams');
  }

  function updateManualStat(teamId, field, delta, playerId = '', babaId = null) {
    if (!requireOrganizer()) return;
    const baba = babaId ? getBabaById(babaId) : getActiveBaba();
    if (!baba || !isManualMode(baba)) return;
    if (baba.status === 'finalizado' && !babaId) return showToast('Abra o historico para corrigir este baba.');
    const team = getTeam(baba, teamId);
    if (!team) return;
    const previousBaba = baba.status === 'finalizado' ? JSON.parse(JSON.stringify(baba)) : null;
    const stats = getManualTeamStats(team);
    const amount = Number(delta || 0);
    if (field === 'goals') {
      const id = String(playerId || '');
      if (!id || !(team.jogadores || []).includes(id)) return;
      stats.playerGoals[id] = Math.max(0, Number(stats.playerGoals[id] || 0) + amount);
    } else {
      const key = field === 'wins' ? 'wins' : field === 'draws' ? 'draws' : field === 'losses' ? 'losses' : '';
      if (!key) return;
      stats[key] = Math.max(0, Number(stats[key] || 0) + amount);
    }
    team.manualStats = stats;
    applyManualStatsToTeam(team);
    refreshBabaDerivedData(baba);
    if (baba.status === 'finalizado') {
      revisePersistedStatsForBaba(previousBaba, baba);
      saveState('Estatisticas do historico atualizadas.');
    }
    else scheduleManualStatsSave();
  }

  function normalizePlayerNameKey(value) {
    return String(value || '')
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('pt-BR');
  }

  function findPlayerWithSameName(name, baba = getActiveBaba()) {
    const key = normalizePlayerNameKey(name);
    if (!key) return null;
    return [
      ...(state.players || []),
      ...(baba?.visitantes || []),
    ].find((player) => normalizePlayerNameKey(player?.nome) === key) || null;
  }

  function addPlayer(event) {
    event.preventDefault();
    if (!requireOrganizer()) return;
    const nome = els.playerName.value.trim().replace(/\s+/g, ' ');
    if (!nome) return;
    const type = els.playerType.value;
    const duplicate = findPlayerWithSameName(nome);
    if (duplicate) {
      showToast(`Já existe um jogador chamado ${duplicate.nome}.`);
      els.playerName.setCustomValidity('Este nome já está cadastrado. Use um nome diferente.');
      els.playerName.reportValidity();
      els.playerName.select();
      return;
    }
    els.playerName.setCustomValidity('');

    if (type === 'visitante') {
      const baba = getActiveBaba();
      if (!baba) return showToast('Crie um baba antes de cadastrar visitantes.');
      if (baba.status === 'finalizado') return showToast('Este baba ja foi finalizado.');
      baba.visitantes = Array.isArray(baba.visitantes) ? baba.visitantes : [];
      const visitor = {
        id: newId('visitor'),
        nome,
        tipo: 'visitante',
        status: PLAYER_STATUS.GUEST,
        ativo: true,
        convidado: true,
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
      status: PLAYER_STATUS.REGULAR,
      ativo: true,
      novato: false,
      convidado: false,
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
    const nextStatus = getPlayerStatus(player) === PLAYER_STATUS.DISABLED
      ? PLAYER_STATUS.REGULAR
      : PLAYER_STATUS.DISABLED;
    applyPlayerStatus(player, nextStatus);

    if (nextStatus === PLAYER_STATUS.DISABLED) {
      state.babas.forEach((baba) => {
        if (baba.status !== 'finalizado') {
          baba.jogadoresPresentes = baba.jogadoresPresentes.filter((id) => id !== playerId);
          if (baba.pagamentos) delete baba.pagamentos[playerId];
        }
      });
    }
    saveState(player.ativo ? 'Jogador reativado.' : 'Jogador removido da lista ativa.');
  }

  function togglePlayerNovice(playerId) {
    if (!requireOrganizer()) return;
    const player = getPlayer(playerId);
    if (!player) return;
    const nextStatus = getPlayerStatus(player) === PLAYER_STATUS.NOVICE
      ? PLAYER_STATUS.REGULAR
      : PLAYER_STATUS.NOVICE;
    applyPlayerStatus(player, nextStatus);
    if (window.BabaImportRepository?.currentUser?.()) {
      window.BabaImportRepository.recordPlayerStatus?.(playerId, player.novato, {
        babaId: getActiveBaba()?.id || null,
        reason: player.novato ? 'manual-mark' : 'manual-removal',
      }).catch((error) => console.warn('Não foi possível registrar o histórico de novato:', error));
    }
    saveState(player.novato ? `${player.nome} marcado como novato.` : `${player.nome} deixou de ser marcado como novato.`);
  }

  function setPlayerStatus(playerId, status) {
    if (!requireOrganizer()) return;
    const player = getPlayer(playerId);
    if (!player) return showToast('Jogador não encontrado.');
    const previousStatus = getPlayerStatus(player);
    const nextStatus = applyPlayerStatus(player, status);
    if (nextStatus === previousStatus) return;

    state.babas.forEach((baba) => {
      baba.participantFlags = baba.participantFlags && typeof baba.participantFlags === 'object'
        ? baba.participantFlags
        : {};
      if (baba.status !== 'finalizado') {
        baba.participantFlags[playerId] = {
          ...(baba.participantFlags[playerId] || {}),
          guest: nextStatus === PLAYER_STATUS.GUEST,
          novice: nextStatus === PLAYER_STATUS.NOVICE,
          typedName: player.nome,
        };
      }
      if (nextStatus === PLAYER_STATUS.DISABLED && baba.status !== 'finalizado') {
        baba.jogadoresPresentes = (baba.jogadoresPresentes || []).filter((id) => id !== playerId);
        (baba.teams || []).forEach((team) => {
          team.jogadores = (team.jogadores || []).filter((id) => id !== playerId);
        });
        if (baba.jogoAtual) {
          baba.jogoAtual.jogadoresTimeA = (baba.jogoAtual.jogadoresTimeA || []).filter((id) => id !== playerId);
          baba.jogoAtual.jogadoresTimeB = (baba.jogoAtual.jogadoresTimeB || []).filter((id) => id !== playerId);
        }
      }
    });

    if (window.BabaImportRepository?.currentUser?.()) {
      window.BabaImportRepository.recordPlayerStatus?.(playerId, nextStatus === PLAYER_STATUS.NOVICE, {
        babaId: getActiveBaba()?.id || null,
        reason: `status-${nextStatus}`,
      }).catch((error) => console.warn('Não foi possível registrar a mudança de status:', error));
    }
    saveState(`${player.nome} definido como ${playerStatusLabel(player).toLowerCase()}.`);
    window.BabaPublicSync?.flushPending?.();
  }

  function deletePlayer(playerId) {
    if (!requireOrganizer()) return;
    const ok = confirm('Remover este jogador da lista fixa? O historico antigo continuara exibindo o nome quando possivel.');
    if (!ok) return;
    state.players = state.players.filter((player) => player.id !== playerId);
    state.babas.forEach((baba) => {
      if (baba.status !== 'finalizado') {
        baba.jogadoresPresentes = (baba.jogadoresPresentes || []).filter((id) => id !== playerId);
        if (baba.pagamentos) delete baba.pagamentos[playerId];
        if (baba.participantFlags) delete baba.participantFlags[playerId];
        (baba.teams || []).forEach((team) => {
          team.jogadores = (team.jogadores || []).filter((id) => id !== playerId);
          if (team.manualStats?.playerGoals) delete team.manualStats.playerGoals[playerId];
        });
        if (baba.jogoAtual) {
          baba.jogoAtual.jogadoresTimeA = (baba.jogoAtual.jogadoresTimeA || []).filter((id) => id !== playerId);
          baba.jogoAtual.jogadoresTimeB = (baba.jogoAtual.jogadoresTimeB || []).filter((id) => id !== playerId);
        }
      }
    });
    saveState('Jogador removido.');
    const deletion = window.BabaRepository?.softDeletePlayer?.(playerId);
    deletion?.catch?.((error) => console.error('Falha ao excluir jogador sincronizado:', error));
    window.BabaPublicSync?.flushPending?.();
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
      showToast('O time Visitante já jogou. Não remova visitantes deste baba.');
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
      if (!checked) {
        preserveStartedMatchRosters(baba);
        (baba.teams || []).forEach((team) => {
          team.jogadores = (team.jogadores || []).filter((id) => id !== playerId);
        });
        refreshPreparedMatchRosters(baba);
      }
      saveState('Presença atualizada. Os times sorteados foram mantidos.');
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
      reader.onerror = () => reject(new Error('Não foi possível ler a foto.'));
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
      showToast(error.message || 'Não foi possível salvar a foto.');
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

  function isPaymentEligiblePlayer(player) {
    return Boolean(player) && getPlayerStatus(player) === PLAYER_STATUS.REGULAR;
  }

  function isNovicePlayer(player) {
    return Boolean(player) && getPlayerStatus(player) === PLAYER_STATUS.NOVICE;
  }

  function isDisabledPlayer(player) {
    return Boolean(player) && getPlayerStatus(player) === PLAYER_STATUS.DISABLED;
  }

  function isPlayerVisibleInRanking(playerId) {
    const fixedPlayer = getPlayer(playerId);
    if (fixedPlayer) {
      const status = getPlayerStatus(fixedPlayer);
      return status !== PLAYER_STATUS.GUEST && status !== PLAYER_STATUS.DISABLED;
    }
    return !state.babas.some((baba) => (
      Boolean(getVisitor(baba, playerId))
      || Boolean(baba.participantFlags?.[playerId]?.guest)
    ));
  }

  function paymentPriceForPlayer(player) {
    return player?.tipo === 'goleiro' ? GOALKEEPER_BABA_PRICE : PLAYER_BABA_PRICE;
  }

  function getPaymentStats(baba) {
    const players = getPaymentPlayers(baba).filter(isPaymentEligiblePlayer);
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

  function playerPaymentTypeLabel(player, baba = getActiveBaba()) {
    const flags = getParticipantFlags(baba, player?.id);
    const labels = [];
    if (flags.novice) labels.push('NOVATO');
    if (flags.guest) labels.push('CONVIDADO');
    if (flags.goalkeeper) labels.push('GOLEIRO');
    return labels.length ? labels.join(' · ') : 'JOGADOR';
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

  function pdfTeamRow(cells, teamOrId) {
    const row = cells;
    row.teamNumber = getTeamNumber(teamOrId);
    return row;
  }

  function pdfPlayerTeam(baba, playerId) {
    return getPlayerTeam(baba || getActiveBaba(), playerId);
  }

  function pdfMatchCell(teamA, teamB, fallbackA = 'Time', fallbackB = 'Time') {
    return {
      type: 'match',
      teams: [
        { name: teamA?.name || fallbackA, number: getTeamNumber(teamA) },
        { name: teamB?.name || fallbackB, number: getTeamNumber(teamB) },
      ],
    };
  }

  function pdfCellText(cell) {
    if (cell?.type === 'match') return cell.teams.map((team) => team.name).join(' x ');
    return cell ?? '-';
  }

  function renderPdfCell(cell) {
    if (cell?.type !== 'match') return escapeHTML(pdfCellText(cell));
    return `<span class="pdf-match-cell">${cell.teams.map((team, index) => {
      const number = Number(team.number);
      const teamClass = number >= 1 && number <= 4 ? ` pdf-team-${number}` : '';
      return `${index ? '<b>x</b>' : ''}<span class="pdf-team-chip${teamClass}">${escapeHTML(team.name)}</span>`;
    }).join('')}</span>`;
  }

  function performanceForPdfPlayer(stats, baba, ratingMap = null) {
    if (isBabaGoalkeeper(baba, stats.jogadorId)) return goalkeeperPerformanceMap().get(stats.jogadorId) || null;
    return ratingMap?.get(stats.jogadorId) || defaultPlayerPerformance(stats.jogadorId, baba);
  }

  function rankingRowsForPdf(items = [], baba = getActiveBaba(), ratingMap = null) {
    return items.map((stats, index) => pdfTeamRow([
      index + 1,
      pdfPlayerCell(stats.jogadorId, stats.nome || playerName(stats.jogadorId), baba, performanceForPdfPlayer(stats, baba, ratingMap)),
      stats.totalGols || 0,
      stats.totalVitorias || 0,
      stats.totalEmpates || 0,
      stats.totalDerrotas || 0,
      `${stats.aproveitamento || 0}%`,
      stats.totalTitulosBaba || 0,
    ], pdfPlayerTeam(baba, stats.jogadorId)));
  }

  function goalkeeperRowsForPdf(items = [], baba = getActiveBaba()) {
    const ratings = goalkeeperPerformanceMap();
    return items.map((stats, index) => pdfTeamRow([
      index + 1,
      pdfPlayerCell(stats.jogadorId, stats.nome || playerName(stats.jogadorId), baba, ratings.get(stats.jogadorId)),
      stats.derrotas || 0,
      stats.vitorias || 0,
      stats.empates || 0,
      stats.jogos || 0,
      stats.golsSofridos || 0,
      stats.totalBabas || 0,
    ], pdfPlayerTeam(baba, stats.jogadorId)));
  }

  function scorersRowsForPdf(baba = getActiveBaba(), limit = null) {
    const ranking = calculateCurrentBabaRanking(baba);
    const ratings = performanceMap(Object.values(ranking), {
      completedBabas: baba?.status === 'finalizado' ? 1 : 0,
      cacheKey: `pdf-daily-${baba?.id || 'none'}`,
    });
    const rows = sortRanking(ranking, 'goals')
      .filter((stats) => stats.totalGols > 0)
      .map((stats, index) => pdfTeamRow([
        index + 1,
        pdfPlayerCell(stats.jogadorId, stats.nome, baba, performanceForPdfPlayer(stats, baba, ratings)),
        stats.totalGols,
        stats.totalVitorias,
        stats.mediaGols,
        `${stats.aproveitamento}%`,
      ], pdfPlayerTeam(baba, stats.jogadorId)));
    return Number.isFinite(limit) ? rows.slice(0, limit) : rows;
  }

  function standingsRowsForPdf(baba = getActiveBaba()) {
    return getStandingsSnapshot(baba).map((team, index) => pdfTeamRow([
      index + 1,
      team.name,
      team.pontos,
      team.golsPro,
      team.saldo,
      team.vitorias,
      team.empates,
      team.derrotas,
    ], team));
  }

  function teamRosterRowsForPdf(baba = getActiveBaba()) {
    const teams = getStandingsSnapshot(baba);
    return teams.map((team) => {
      const sourceTeam = getTeam(baba, team.id) || team;
      const players = (sourceTeam.jogadores || [])
        .map((playerId) => getBabaPlayer(baba, playerId))
        .filter(Boolean);
      const goalkeepers = players.filter((player) => isBabaGoalkeeper(baba, player.id)).length;
      const fieldPlayers = Math.max(0, players.length - goalkeepers);
      return pdfTeamRow([
        team.name,
        players.length ? {
          type: 'roster',
          players: players.map((player) => pdfPlayerCell(player.id, player.nome, baba)),
        } : '-',
        fieldPlayers,
        goalkeepers,
      ], team);
    });
  }

  function goalRankingRowsForPdf(items = [], baba = getActiveBaba(), ratingMap = null) {
    return items.map((stats, index) => pdfTeamRow([
      index + 1,
      pdfPlayerCell(stats.jogadorId, stats.nome || playerName(stats.jogadorId), baba, performanceForPdfPlayer(stats, baba, ratingMap)),
      stats.totalGols || 0,
      stats.totalVitorias || 0,
      `${stats.aproveitamento || 0}%`,
      stats.totalBabas || 0,
    ], pdfPlayerTeam(baba, stats.jogadorId)));
  }

  function paymentRowsForPdf(baba = getActiveBaba(), mode = 'paid') {
    return getPaymentPlayers(baba)
      .filter((player) => {
        if (mode === 'novice') return isNovicePlayer(player);
        if (mode === 'disabled') return isDisabledPlayer(player);
        if (!isPaymentEligiblePlayer(player)) return false;
        return mode === 'paid'
          ? isPlayerPaidThisMonth(player.id, baba)
          : !isPlayerPaidThisMonth(player.id, baba);
      })
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((player, index) => pdfTeamRow([
        index + 1,
        pdfPlayerCell(player.id, player.nome, baba),
        playerPaymentTypeLabel(player, baba),
        mode === 'novice'
          ? 'NOVATO'
          : (mode === 'disabled' ? 'DESATIVADO' : formatCurrency(paymentPriceForPlayer(player))),
      ], pdfPlayerTeam(baba, player.id)));
  }

  function currentGamesRowsForPdf(baba = getActiveBaba()) {
    return (baba?.jogos || []).map((game) => {
      const teamA = getTeam(baba, game.timeA);
      const teamB = getTeam(baba, game.timeB);
      return [
        game.numeroJogo,
        pdfMatchCell(teamA, teamB, game.timeANome || 'Time', game.timeBNome || 'Time'),
        `${game.placarA} x ${game.placarB}`,
        resultStatusLabel(game),
        game.motivoSaida || '-',
      ];
    });
  }

  function activeYearForReport(baba = getActiveBaba()) {
    const year = Number(String(baba?.dataISO || todayISO()).slice(0, 4));
    return Number.isFinite(year) && year > 0 ? year : new Date().getFullYear();
  }

  function calculateYearlyRanking(year, { includeActive = false } = {}) {
    const ranking = {};
    state.babas
      .filter((baba) => baba.status === 'finalizado' && Number(String(baba.dataISO || '').slice(0, 4)) === Number(year))
      .forEach((baba) => {
        Object.values(getFinishedBabaRanking(baba)).forEach((stats) => mergeRankingStats(ranking, stats));
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
      eyebrow: 'Baba Psyzon',
      title: '',
      subtitle: reportContextLabel(baba),
      fileName: `baba-${type}-${baba?.dataISO || todayISO()}.pdf`,
      brand: 'Baba Psyzon',
      summary: baseSummary,
      icon: 'report',
      sections: [],
    };

    if (type === 'payments') {
      const stats = getPaymentStats(baba);
      const pending = Math.max(0, stats.expected - stats.paid);
      report.title = 'Lista de pagamento';
      report.fileName = 'Lista de pagamento.pdf';
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
          note: 'Confirmados no mes - regras de cobrança preservadas',
          icon: 'check-circle',
          maxRows: PDF_ROW_LIMITS.payments,
          columns: ['#', 'Jogador', 'Tipo', 'Valor'],
          rows: paymentRowsForPdf(baba, 'paid'),
          empty: 'Nenhum pagamento confirmado ainda.',
        },
        {
          title: 'Jogadores pendentes',
          note: 'Somente jogadores regulares em cobrança',
          icon: 'alert-circle',
          maxRows: PDF_ROW_LIMITS.payments,
          columns: ['#', 'Jogador', 'Tipo', 'Valor'],
          rows: paymentRowsForPdf(baba, 'pending'),
          empty: 'Nenhum pagamento pendente.',
        },
        {
          title: 'Novatos',
          note: 'Lista separada, sem cobrança',
          icon: 'users',
          maxRows: PDF_ROW_LIMITS.payments,
          columns: ['#', 'Jogador', 'Tipo', 'Situação'],
          rows: paymentRowsForPdf(baba, 'novice'),
          empty: 'Nenhum novato cadastrado.',
        },
        {
          title: 'Jogadores desativados',
          note: 'Fora da cobranca mensal',
          icon: 'user-x',
          maxRows: PDF_ROW_LIMITS.payments,
          columns: ['#', 'Jogador', 'Tipo', 'Situacao'],
          rows: paymentRowsForPdf(baba, 'disabled'),
          empty: 'Nenhum jogador desativado.',
        },
      ];
      return report;
    }

    if (type === 'standings') {
      const dailyStats = calculateCurrentBabaRanking(baba);
      const generalStats = calculateGeneralRanking();
      const dailyRatings = performanceMap(Object.values(dailyStats), {
        completedBabas: baba?.status === 'finalizado' ? 1 : 0,
        cacheKey: `pdf-standings-daily-${baba?.id || 'none'}`,
      });
      report.title = 'Tabela de times';
      report.subtitle = `Classificação, elencos e rankings por gols - ${reportContextLabel(baba)}`;
      report.icon = 'table';
      report.summary = [
        ...baseSummary,
        ['Criterio', 'Gols'],
      ];
      report.sections = [
        {
          title: 'Classificação',
          note: 'Pontos, gols e saldo',
          icon: 'table',
          wide: true,
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.standings,
          columns: ['Pos', 'Time', 'Pts', 'GP', 'SG', 'V', 'E', 'D'],
          nowrapColumns: [1],
          rows: standingsRowsForPdf(baba),
          empty: 'Sorteie os times para gerar a tabela.',
        },
        {
          title: 'Jogadores por time',
          note: 'Elencos sorteados',
          icon: 'users',
          wide: true,
          wideFirstColumn: true,
          nowrapColumns: [0],
          columns: ['Time', 'Jogadores', 'Linha', 'Goleiros'],
          rows: teamRosterRowsForPdf(baba),
          empty: 'Nenhum jogador distribuido nos times.',
        },
        {
          title: 'Ranking do dia',
          note: 'Classificado por gols',
          icon: 'trophy',
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.rankings,
          columns: ['Pos', 'Jogador', 'Gols', 'V', 'Aprov.', 'Babas'],
          rows: goalRankingRowsForPdf(sortRanking(dailyStats, 'goals'), baba, dailyRatings),
          empty: 'Sem gols registrados no baba atual.',
        },
        {
          title: 'Ranking geral',
          note: 'Classificado por gols',
          icon: 'chart',
          highlightTop: true,
          maxRows: PDF_ROW_LIMITS.rankings,
          columns: ['Pos', 'Jogador', 'Gols', 'V', 'Aprov.', 'Babas'],
          rows: goalRankingRowsForPdf(sortRanking(generalStats, 'goals'), baba, generalPerformanceMap()),
          empty: 'Sem dados no ranking geral.',
        },
      ];
      return report;
    }

    if (type === 'current-history') {
      report.title = 'Histórico do baba atual';
      report.subtitle = `Jogos finalizados - ${reportContextLabel(baba)}`;
      report.icon = 'history';
      report.sections = [
        {
          title: 'Jogos finalizados',
          note: 'Últimos jogos',
          icon: 'history',
          maxRows: PDF_ROW_LIMITS.currentHistory,
          columns: ['Jogo', 'Partida', 'Placar', 'Resultado', 'Motivo'],
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
          wide: true,
          maxRows: PDF_ROW_LIMITS.dailyScorers,
          columns: ['Pos', 'Jogador', 'Gols', 'V', 'Media', 'Aprov.'],
          nowrapColumns: [1],
          rows: scorersRowsForPdf(baba),
          empty: 'Sem gols no baba atual.',
        },
      ];
      return report;
    }

    if (type === 'rankings') {
      const monthlyStats = calculateMonthlyRanking(currentMonth, { includeActive: false });
      const generalStats = calculateGeneralRanking();
      const dailyStats = calculateCurrentBabaRanking(baba);
      const historyStats = calculateMonthlyRanking(monthlyHistoryKey, { includeActive: false });
      const generalRatings = generalPerformanceMap();
      const monthlyRatings = performanceMap(Object.values(monthlyStats), {
        completedBabas: completedBabaCount((item) => monthKeyFromISO(item.dataISO) === currentMonth),
        cacheKey: `pdf-month-${currentMonth}`,
      });
      const dailyRatings = performanceMap(Object.values(dailyStats), {
        completedBabas: baba?.status === 'finalizado' ? 1 : 0,
        cacheKey: `pdf-daily-ranking-${baba?.id || 'none'}`,
      });
      const historyRatings = performanceMap(Object.values(historyStats), {
        completedBabas: completedBabaCount((item) => monthKeyFromISO(item.dataISO) === monthlyHistoryKey),
        cacheKey: `pdf-history-${monthlyHistoryKey}`,
      });
      const rankingColumns = ['Pos', 'Jogador', 'Gols', 'V', 'E', 'D', 'Aprov.', 'Tit.'];
      const metricNote = `Classificado por ${metricLabel.toLowerCase()}`;
      const rankingPdfSections = {
        monthly: {
          title: `Ranking do mês - ${monthLabel(currentMonth)}`,
          note: metricNote,
          icon: 'calendar',
          columns: rankingColumns,
          rows: rankingRowsForPdf(sortRanking(monthlyStats, rankingMode, monthlyRatings, baba), baba, monthlyRatings),
          empty: 'Sem dados no ranking do mês.',
        },
        general: {
          title: 'Ranking geral',
          note: metricNote,
          icon: 'chart',
          columns: rankingColumns,
          rows: rankingRowsForPdf(sortRanking(generalStats, rankingMode, generalRatings, baba), baba, generalRatings),
          empty: 'Sem dados no ranking geral.',
        },
        daily: {
          title: 'Ranking do dia',
          note: metricNote,
          icon: 'target',
          columns: rankingColumns,
          rows: rankingRowsForPdf(sortRanking(dailyStats, rankingMode, dailyRatings, baba), baba, dailyRatings),
          empty: 'Sem dados no ranking do dia.',
        },
        goalkeeper: {
          title: 'Ranking de goleiros',
          note: 'Menos derrotas, depois mais vitórias',
          icon: 'shield',
          columns: ['Pos', 'Goleiro', 'Derrotas', 'Vitórias', 'Empates', 'Jogos', 'Sofridos', 'Babas'],
          rows: goalkeeperRowsForPdf(calculateGoalkeeperRanking({ includeActive: false }), baba),
          empty: 'Sem jogos com goleiros ainda.',
        },
        history: {
          title: `Histórico mensal - ${monthLabel(monthlyHistoryKey)}`,
          note: metricNote,
          icon: 'history',
          columns: rankingColumns,
          rows: rankingRowsForPdf(sortRanking(historyStats, rankingMode, historyRatings, baba), baba, historyRatings),
          empty: 'Sem histórico mensal para exportar.',
        },
      };
      const selectedScope = rankingPdfSections[rankingScope] ? rankingScope : 'monthly';
      const selectedSection = rankingPdfSections[selectedScope];
      const goalkeeperReport = selectedScope === 'goalkeeper';
      report.title = selectedSection.title;
      report.subtitle = goalkeeperReport ? selectedSection.note : `Critério atual: ${metricLabel}`;
      report.fileName = `ranking-${selectedScope}-${baba?.dataISO || todayISO()}.pdf`;
      report.icon = selectedSection.icon;
      report.summary = [
        ...baseSummary,
        ['Critério', goalkeeperReport ? 'Menos derrotas' : metricLabel],
      ];
      report.sections = [{
        ...selectedSection,
        wide: true,
        highlightTop: true,
        maxRows: goalkeeperReport ? 24 : 26,
      }];
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

  function pdfTeamClass(row) {
    const number = Number(row?.teamNumber);
    return number >= 1 && number <= 4 ? `pdf-team-row pdf-team-${number}` : '';
  }

  function renderPdfTable(section) {
    const columns = section.columns || [];
    const nowrapColumns = new Set(section.nowrapColumns || []);
    const result = limitPdfRows(section.rows, section.maxRows);
    const rows = result.rows;
    if (!rows.length) return `<div class="pdf-empty">${escapeHTML(section.empty || 'Sem dados para exibir.')}</div>`;
    const mobileCards = rows.map((row, index) => {
      const firstCell = row[0] ?? '';
      const title = pdfCellText((row[1] ?? firstCell) || `Item ${index + 1}`);
      const eyebrow = firstCell ? `${columns[0] || 'Item'} ${firstCell}` : `Item ${index + 1}`;
      const isGold = Boolean(section.highlightTop && index === 0);
      const teamClass = pdfTeamClass(row);
      return `
        <article class="pdf-mobile-card ${isGold ? 'is-pdf-gold' : ''} ${teamClass}">
          <div class="pdf-mobile-card-title">
            <span>${escapeHTML(eyebrow)}</span>
            <strong>${escapeHTML(title)}</strong>
          </div>
          <dl>
            ${columns.map((column, columnIndex) => `
              <div>
                <dt>${escapeHTML(column)}</dt>
                <dd>${renderPdfCell(row[columnIndex])}</dd>
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
        <table class="pdf-table pdf-table--cols-${Math.min(columns.length, 9)} ${section.wideFirstColumn ? 'pdf-table--wide-first' : ''}">
          <thead>
            <tr>${columns.map((column, columnIndex) => `<th class="${nowrapColumns.has(columnIndex) ? 'pdf-cell--nowrap' : ''}">${escapeHTML(column)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map((row, index) => {
              const teamClass = pdfTeamClass(row);
              return `<tr class="${section.highlightTop && index === 0 ? 'is-pdf-gold' : ''} ${teamClass}">${row.map((cell, cellIndex) => `<td class="${nowrapColumns.has(cellIndex) ? 'pdf-cell--nowrap' : ''}">${renderPdfCell(cell)}</td>`).join('')}</tr>`;
            }).join('')}
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
    const headerImage = new URL('img/baba-pdf-liquid-glass-v1.png', window.location.href).href;
    const appFont = new URL('fonts/InterVariable.woff2?v=4.1', window.location.href).href;
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
    const sections = report.sections.map((section, index) => `
      <section class="pdf-section ${section.wide ? 'pdf-section--wide' : ''}">
        <div class="pdf-section-head">
          <div class="pdf-section-title">
            <span class="pdf-section-index">${String(index + 1).padStart(2, '0')}</span>
            <h2>${pdfIcon(section.icon || report.icon)}<span>${escapeHTML(section.title)}</span></h2>
          </div>
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
    @font-face {
      font-family: "Baba Apple UI";
      src: url("${appFont}") format("woff2");
      font-style: normal;
      font-weight: 400 600;
      font-display: swap;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #13263a;
      background:
        radial-gradient(760px 440px at 0% 0%, rgba(8, 127, 108, .18), transparent 62%),
        radial-gradient(680px 420px at 100% 4%, rgba(214, 162, 29, .16), transparent 58%),
        linear-gradient(145deg, #e8f0f4, #f7fafc 48%, #e9f2f1);
      font-family: "Baba Apple UI", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .pdf-page {
      display: grid;
      gap: 12px;
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      padding: 18px;
    }
    .pdf-hero {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      min-height: 154px;
      display: flex;
      align-items: flex-end;
      border: 1px solid rgba(255, 255, 255, .62);
      border-radius: 22px;
      padding: 24px;
      color: #ffffff;
      background:
        linear-gradient(90deg, rgba(7, 31, 56, .94), rgba(7, 31, 56, .72) 54%, rgba(7, 31, 56, .08)),
        var(--pdf-hero-bg) center / cover no-repeat;
      box-shadow: 0 22px 46px rgba(7, 31, 56, .2), inset 0 1px 0 rgba(255, 255, 255, .5);
    }
    .pdf-hero::before,
    .pdf-hero::after {
      content: "";
      position: absolute;
      z-index: 0;
      border: 1px solid rgba(255, 255, 255, .24);
      border-radius: 999px;
      background: linear-gradient(145deg, rgba(255, 255, 255, .2), rgba(255, 255, 255, .035));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .36);
      transform: rotate(-14deg);
    }
    .pdf-hero::before {
      width: 260px;
      height: 64px;
      top: -20px;
      right: 12%;
    }
    .pdf-hero::after {
      width: 190px;
      height: 54px;
      right: -28px;
      bottom: 12px;
    }
    .pdf-hero__content {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 8px;
      max-width: 68%;
    }
    .pdf-hero__badge {
      width: max-content;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      border: 1px solid rgba(255, 255, 255, .26);
      border-radius: 999px;
      padding: 4px 9px 4px 5px;
      color: #ffffff;
      background: rgba(255, 255, 255, .12);
      font-size: 9px;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
      backdrop-filter: blur(12px) saturate(130%);
    }
    .pdf-hero .pdf-icon {
      width: 25px;
      height: 25px;
      border: 0;
      color: #ffe08a;
      background: rgba(255, 255, 255, .13);
    }
    .pdf-hero h1 {
      margin: 0;
      color: #ffffff;
      font-size: 30px;
      line-height: 1;
      letter-spacing: -.035em;
    }
    .pdf-hero p {
      margin: 0;
      color: rgba(239, 248, 255, .84);
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
      gap: 10px;
    }
    .pdf-summary article {
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      min-height: 66px;
      border: 1px solid rgba(255, 255, 255, .9);
      border-radius: 16px;
      padding: 11px 12px;
      background: linear-gradient(145deg, rgba(255, 255, 255, .92), rgba(240, 248, 249, .68));
      box-shadow: 0 12px 30px rgba(20, 42, 68, .1), inset 0 1px 0 #ffffff;
      backdrop-filter: blur(18px) saturate(130%);
    }
    .pdf-summary article::after {
      content: "";
      position: absolute;
      width: 54px;
      height: 54px;
      right: -22px;
      bottom: -26px;
      border-radius: 50%;
      background: rgba(8, 127, 108, .08);
    }
    .pdf-summary article:nth-child(even)::after {
      background: rgba(214, 162, 29, .1);
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
      color: #071f38;
      font-size: 15px;
      line-height: 1.1;
      overflow-wrap: anywhere;
    }
    .pdf-icon {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid rgba(8, 127, 108, .14);
      border-radius: 10px;
      color: #087f6c;
      background: linear-gradient(145deg, #effcf8, #dcefeb);
    }
    .pdf-icon svg {
      width: 14px;
      height: 14px;
    }
    .pdf-sections {
      display: grid;
      gap: 10px;
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
      border: 1px solid rgba(255, 255, 255, .9);
      border-radius: 16px;
      background: rgba(255, 255, 255, .82);
      break-inside: avoid-page;
      box-shadow: 0 16px 34px rgba(20, 42, 68, .1), inset 0 1px 0 #ffffff;
      backdrop-filter: blur(18px) saturate(125%);
    }
    .pdf-section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid rgba(15, 35, 58, .09);
      padding: 11px 12px;
      background: linear-gradient(110deg, rgba(231, 245, 242, .9), rgba(255, 255, 255, .76) 58%, rgba(255, 248, 223, .62));
    }
    .pdf-section-title {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pdf-section-index {
      color: rgba(7, 31, 56, .42);
      font-size: 8px;
      font-weight: 900;
      letter-spacing: .08em;
    }
    .pdf-section h2 {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
    }
    .pdf-section h2 {
      margin: 0;
      color: #071f38;
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
      color: #31556a;
      background: #e9f2f2;
      font-size: 7px;
      font-weight: 900;
      letter-spacing: .04em;
      text-align: left;
      text-transform: uppercase;
    }
    th, td {
      border-bottom: 1px solid rgba(15, 35, 58, .075);
      padding: 6px 7px;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    .pdf-cell--nowrap {
      overflow: hidden;
      white-space: nowrap;
      overflow-wrap: normal;
      word-break: normal;
      text-overflow: ellipsis;
    }
    tbody tr:nth-child(even) td { background: rgba(242, 247, 249, .72); }
    tbody tr:hover td { background: #edf8f5; }
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
    .pdf-table--wide-first td:first-child,
    .pdf-table--wide-first th:first-child {
      width: 74px;
      text-align: left;
    }
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
      border: 1px solid rgba(255, 255, 255, .92);
      border-radius: 14px;
      background: rgba(255, 255, 255, .86);
      break-inside: avoid;
      box-shadow: 0 12px 28px rgba(20, 42, 68, .09), inset 0 1px 0 #ffffff;
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
      background: linear-gradient(135deg, #edf8f5, #f8fbff 68%, #fff8df);
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
    .pdf-team-1 {
      --pdf-team-bg: #d71920;
      --pdf-team-fg: #ffffff;
      --pdf-team-border: #a80f17;
      --pdf-team-line: rgba(255, 255, 255, .28);
      --pdf-team-shadow: rgba(215, 25, 32, .28);
    }
    .pdf-team-2 {
      --pdf-team-bg: #08783f;
      --pdf-team-fg: #ffffff;
      --pdf-team-border: #04562c;
      --pdf-team-line: rgba(255, 255, 255, .28);
      --pdf-team-shadow: rgba(8, 120, 63, .28);
    }
    .pdf-team-3 {
      --pdf-team-bg: #ffffff;
      --pdf-team-fg: #111827;
      --pdf-team-border: #111827;
      --pdf-team-line: rgba(17, 24, 39, .2);
      --pdf-team-shadow: rgba(17, 24, 39, .16);
    }
    .pdf-team-4 {
      --pdf-team-bg: #111318;
      --pdf-team-fg: #ffffff;
      --pdf-team-border: #000000;
      --pdf-team-line: rgba(255, 255, 255, .28);
      --pdf-team-shadow: rgba(17, 19, 24, .28);
    }
    tbody tr.pdf-team-row td {
      border-color: var(--pdf-team-line) !important;
      color: var(--pdf-team-fg) !important;
      background: var(--pdf-team-bg) !important;
      font-weight: 900;
    }
    tbody tr.pdf-team-row.is-pdf-gold td:first-child {
      color: var(--pdf-team-fg) !important;
      background: var(--pdf-team-bg) !important;
      box-shadow: inset 4px 0 0 #facc15;
    }
    .pdf-mobile-card.pdf-team-row {
      border-color: var(--pdf-team-border);
      color: var(--pdf-team-fg);
      background: var(--pdf-team-bg);
      box-shadow: 0 12px 28px var(--pdf-team-shadow);
    }
    .pdf-mobile-card.pdf-team-row .pdf-mobile-card-title,
    .pdf-mobile-card.pdf-team-row.is-pdf-gold .pdf-mobile-card-title,
    .pdf-mobile-card.pdf-team-row dl div,
    .pdf-mobile-card.pdf-team-row dl div:nth-child(even) {
      border-color: var(--pdf-team-line);
      color: var(--pdf-team-fg);
      background: var(--pdf-team-bg);
    }
    .pdf-mobile-card.pdf-team-row :is(.pdf-mobile-card-title span, .pdf-mobile-card-title strong, dt, dd) {
      color: var(--pdf-team-fg) !important;
      font-weight: 900;
    }
    .pdf-mobile-card.pdf-team-row.is-pdf-gold {
      outline: 2px solid #facc15;
      outline-offset: -2px;
    }
    .pdf-match-cell {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
    }
    .pdf-match-cell > b {
      color: #64748b;
      font-weight: 900;
    }
    .pdf-team-chip {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--pdf-team-border, #cbd5e1);
      border-radius: 999px;
      padding: 2px 6px;
      color: var(--pdf-team-fg, #172033);
      background: var(--pdf-team-bg, #f8fafc);
      font-weight: 900;
      white-space: nowrap;
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
      border-top: 1px solid rgba(15, 35, 58, .1);
      color: #64748b;
      font-size: 8px;
      font-weight: 800;
      padding: 8px 4px 2px;
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
        min-height: 0;
        gap: 5px;
        border-radius: 6px;
        padding: 5px 6px;
        box-shadow: none;
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
      .pdf-section-title {
        gap: 4px;
      }
      .pdf-section-index {
        font-size: 5.5px;
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
      <span>Baba Psyzon</span>
      <span>Exportacao em PDF</span>
    </footer>
  </main>
</body>
</html>`;
  }

  function normalizeBabaPdfReport(report) {
    return {
      ...report,
      footer: 'Baba Psyzon - relatório atualizado no momento da exportação',
      sections: report.sections.map((section) => ({
        ...section,
        rows: (section.rows || []).map((sourceRow) => {
          const row = sourceRow.map((cell) => pdfCellText(cell));
          row.teamNumber = sourceRow.teamNumber;
          return row;
        }),
      })),
    };
  }

  async function exportBabaPdf(type, triggerButton = null) {
    if (pdfExportInProgress) {
      showToast('Aguarde o PDF atual terminar de ser gerado.');
      return;
    }
    const report = buildBabaPdfReport(type);
    if (!report) return showToast('Relatorio nao encontrado para exportar.');
    if (!window.PsyzonPdf?.exportReport) {
      showToast('O gerador de PDF não carregou. Atualize a página e tente novamente.');
      return;
    }

    pdfExportInProgress = true;
    const exportButtons = $$('[data-export-pdf]');
    const previousStates = exportButtons.map((button) => ({ button, disabled: button.disabled }));
    exportButtons.forEach((button) => { button.disabled = true; });
    triggerButton?.classList.add('is-exporting');
    triggerButton?.setAttribute('aria-busy', 'true');

    try {
      const result = await window.PsyzonPdf.exportReport(normalizeBabaPdfReport(report));
      showToast(`PDF exportado com ${result.pages} pagina${result.pages === 1 ? '' : 's'}.`);
    } catch (error) {
      console.error('Falha ao gerar o PDF do Baba:', error);
      showToast(error.message || 'Não foi possível gerar o PDF agora.');
    } finally {
      pdfExportInProgress = false;
      previousStates.forEach(({ button, disabled }) => {
        if (button.isConnected) button.disabled = disabled;
      });
      triggerButton?.classList.remove('is-exporting');
      triggerButton?.removeAttribute('aria-busy');
    }
  }

  function toggleBabaPayment(playerId) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const player = getPaymentPlayers(baba).find((item) => item.id === playerId) || getPlayer(playerId);
    if (!player) return showToast('Jogador não encontrado para registrar o pagamento.');
    if (!isPaymentEligiblePlayer(player)) {
      return showToast(`${player.nome} está como ${playerStatusLabel(player).toLowerCase()} e não entra na cobrança.`);
    }
    const record = getMonthlyPaymentRecord();
    const changedAt = Date.now();
    record.pagamentos[playerId] = !isPlayerPaidThisMonth(playerId, baba);
    record.paymentUpdatedAtMs[playerId] = changedAt;
    record.atualizadoEm = changedAt;
    record.mergeSchemaVersion = 2;
    if (baba) {
      baba.pagamentos = baba.pagamentos && typeof baba.pagamentos === 'object' && !Array.isArray(baba.pagamentos) ? baba.pagamentos : {};
      baba.pagamentos[playerId] = record.pagamentos[playerId];
    }
    saveState(record.pagamentos[playerId] ? `${player.nome} pagou o mês atual.` : `${player.nome} ficou pendente no mês atual.`);
    window.BabaRepository?.setMonthlyPayment?.(
      currentPaymentMonthKey(),
      playerId,
      record.pagamentos[playerId],
      changedAt,
    ).catch((error) => {
      console.error('Falha ao salvar pagamento mensal imediatamente:', error);
      showToast('Pagamento salvo neste dispositivo e aguardando sincronização.');
    });
    window.BabaPublicSync?.flushPending?.();
  }

  function drawTeams() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if (baba.status === 'finalizado') return showToast('Este baba ja foi finalizado.');
    if (baba.teams?.length) {
      return createLateArrivalTeam(baba);
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

    const fieldPlayers = presentPlayers.filter((player) => player.tipo !== 'goleiro');

    if (fieldPlayers.length < 8) {
      showToast('Marque pelo menos 8 jogadores de linha para deixar Time 1 e Time 2 completos.');
      return;
    }

    const linePlayersPerTeam = 4;
    const groups = window.BabaManagementCore.buildRandomTeamGroups(presentPlayers, {
      fieldPlayersPerTeam: linePlayersPerTeam,
      minTeams: 2,
      maxTeams: TEAM_NAMES.length,
      random: secureRandom,
    });
    const drawTimestamp = Date.now();
    const teams = groups.map((players, index) => makeEmptyTeam(`team_${index + 1}`, configuredTeamName(index + 1), {
      jogadores: players.map((player) => player.id),
      drawBatch: 1,
      sorteadoEm: drawTimestamp,
    }));

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
    baba.drawBatchCount = 1;
    baba.status = 'times';
    baba.undoStack = [];
    if (isManualMode(baba)) {
      (baba.teams || []).forEach((team) => {
        team.manualStats = makeEmptyManualTeamStats();
        applyManualStatsToTeam(team);
      });
      ensureManualStats(baba);
    }
    setActiveTab('teams');
    beginDrawExperience(baba);
    saveState('Times sorteados: Time 1 e Time 2 com 4 jogadores de linha.');
  }

  function createLateArrivalTeam(baba = getActiveBaba()) {
    if (!requireOrganizer()) return;
    if (!baba || baba.status === 'finalizado') return showToast('Este baba nao pode mais ser alterado.');
    if (!(baba.teams || []).length) return drawTeams();

    const availablePlayers = getUnassignedPresentPlayers(baba);
    if (!availablePlayers.length) {
      showToast('Marque como presentes os jogadores que chegaram depois e ainda estao sem time.');
      return;
    }

    const firstNewTeamIndex = baba.teams.length;
    const nextBatch = Math.max(
      Number(baba.drawBatchCount || 0),
      ...(baba.teams || []).map((team) => Number(team.drawBatch || 1)),
    ) + 1;
    const groups = window.BabaManagementCore.buildRandomTeamGroups(availablePlayers, {
      fieldPlayersPerTeam: 4,
      minTeams: 1,
      random: secureRandom,
    });
    const drawTimestamp = Date.now();
    const newTeams = groups.map((players) => {
      const identity = getNextTeamIdentity(baba);
      const team = makeEmptyTeam(identity.id, identity.name, {
        jogadores: players.map((player) => player.id),
        drawBatch: nextBatch,
        sorteadoEm: drawTimestamp,
        lateArrival: true,
      });
      if (isManualMode(baba)) {
        team.manualStats = makeEmptyManualTeamStats();
        applyManualStatsToTeam(team);
      }
      baba.teams.push(team);
      return team;
    });
    const newTeamIds = newTeams.map((team) => team.id);
    baba.filaTimes = Array.from(new Set([...(baba.filaTimes || []), ...newTeamIds]));
    if (baba.pendingTieBreak) {
      baba.pendingTieBreak.queue = Array.from(new Set([...(baba.pendingTieBreak.queue || baba.filaTimes || []), ...newTeamIds]));
    }
    baba.teamRevealIndex = firstNewTeamIndex;
    baba.drawBatchCount = nextBatch;
    if (isManualMode(baba)) ensureManualStats(baba);
    baba.rankingDoBaba = calculateDailyRanking(baba);
    setActiveTab('teams');
    saveState(`Sorteio ${nextBatch} concluido: ${availablePlayers.length} jogador${availablePlayers.length === 1 ? '' : 'es'} que ${availablePlayers.length === 1 ? 'chegou' : 'chegaram'} depois ${availablePlayers.length === 1 ? 'entrou' : 'entraram'} em ${newTeams.length} novo${newTeams.length === 1 ? '' : 's'} time${newTeams.length === 1 ? '' : 's'}, no fim da fila.`);
    beginDrawExperience(baba, { startIndex: firstNewTeamIndex });
  }

  function assignPlayerToTeam(playerId, teamId, babaId = null) {
    if (!requireOrganizer()) return;
    const baba = babaId ? getBabaById(babaId) : getActiveBaba();
    const targetTeam = getTeam(baba, teamId);
    const player = getBabaPlayer(baba, playerId);
    const editingHistory = Boolean(babaId && baba?.status === 'finalizado');
    if (!baba || (baba.status === 'finalizado' && !editingHistory)) return showToast('Este baba nao pode mais ser alterado.');
    if (!targetTeam || !player) return showToast('Jogador ou time nao encontrado.');
    const previousBaba = editingHistory ? JSON.parse(JSON.stringify(baba)) : null;

    const previousTeam = getPlayerTeam(baba, playerId);
    if (editingHistory) window.BabaManagementCore.rewriteHistoricalRosters(baba, playerId, targetTeam.id);
    else preserveStartedMatchRosters(baba);
    let preservedManualGoals = 0;
    (baba.teams || []).forEach((team) => {
      preservedManualGoals += Number(team.manualStats?.playerGoals?.[playerId] || 0);
      if (team.manualStats?.playerGoals) delete team.manualStats.playerGoals[playerId];
      team.jogadores = (team.jogadores || []).filter((id) => id !== playerId);
    });
    targetTeam.jogadores = [...(targetTeam.jogadores || []), playerId];
    if (isManualMode(baba) && preservedManualGoals) {
      const stats = getManualTeamStats(targetTeam);
      stats.playerGoals[playerId] = preservedManualGoals;
      targetTeam.manualStats = stats;
    }

    if (getPlayer(playerId)) {
      baba.jogadoresPresentes = Array.from(new Set([...(baba.jogadoresPresentes || []), playerId]));
      baba.pagamentos = baba.pagamentos && typeof baba.pagamentos === 'object' ? baba.pagamentos : {};
      if (!(playerId in baba.pagamentos)) baba.pagamentos[playerId] = false;
    } else {
      player.foraDoBaba = false;
    }
    if (isManualMode(baba)) ensureManualStats(baba);
    if (editingHistory) {
      refreshBabaDerivedData(baba);
      revisePersistedStatsForBaba(previousBaba, baba);
    }
    else {
      refreshPreparedMatchRosters(baba);
      baba.rankingDoBaba = calculateDailyRanking(baba);
    }
    const message = previousTeam && previousTeam.id !== targetTeam.id
      ? `${player.nome} movido de ${previousTeam.name} para ${targetTeam.name}.`
      : `${player.nome} adicionado ao ${targetTeam.name}.`;
    saveState(message);
  }

  function preserveStartedMatchRosters(baba) {
    const match = baba?.jogoAtual;
    if (!match?.iniciadoEm) return;
    if (!Array.isArray(match.jogadoresTimeA)) {
      match.jogadoresTimeA = [...(getTeam(baba, match.timeA)?.jogadores || [])];
    }
    if (!Array.isArray(match.jogadoresTimeB)) {
      match.jogadoresTimeB = [...(getTeam(baba, match.timeB)?.jogadores || [])];
    }
  }

  function refreshPreparedMatchRosters(baba) {
    const match = baba?.jogoAtual;
    if (!match) return;
    match.jogadoresTimeA = [...(getTeam(baba, match.timeA)?.jogadores || [])];
    match.jogadoresTimeB = [...(getTeam(baba, match.timeB)?.jogadores || [])];
  }

  function removePlayerFromTeam(playerId, babaId = null) {
    if (!requireOrganizer()) return;
    const baba = babaId ? getBabaById(babaId) : getActiveBaba();
    const player = getBabaPlayer(baba, playerId);
    const team = getPlayerTeam(baba, playerId);
    const editingHistory = Boolean(babaId && baba?.status === 'finalizado');
    if (!baba || (baba.status === 'finalizado' && !editingHistory)) return showToast('Este baba nao pode mais ser alterado.');
    if (!player || !team) return showToast('Jogador nao encontrado em um time.');
    if (!window.confirm(`Retirar ${player.nome} do ${team.name}? A presenca no baba sera mantida.`)) return;
    const previousBaba = editingHistory ? JSON.parse(JSON.stringify(baba)) : null;

    if (editingHistory) window.BabaManagementCore.rewriteHistoricalRosters(baba, playerId, null);
    else preserveStartedMatchRosters(baba);
    team.jogadores = (team.jogadores || []).filter((id) => id !== playerId);
    if (isManualMode(baba)) ensureManualStats(baba);
    if (editingHistory) {
      refreshBabaDerivedData(baba);
      revisePersistedStatsForBaba(previousBaba, baba);
    }
    else {
      refreshPreparedMatchRosters(baba);
      baba.rankingDoBaba = calculateDailyRanking(baba);
    }
    selectedPlayerDetail = null;
    els.playerDetailModal?.classList.add('hidden');
    saveState(`${player.nome} retirado do ${team.name}. Ele continua disponivel para outro time.`);
  }

  function removePlayerFromCurrentBaba(playerId) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const player = getBabaPlayer(baba, playerId);
    const team = getPlayerTeam(baba, playerId);
    if (!baba || baba.status === 'finalizado') return showToast('Este baba nao pode mais ser alterado.');
    if (!player || !team) return showToast('Jogador nao encontrado em um time.');
    if (!window.confirm(`Remover ${player.nome} do ${team.name} e da presenca deste baba?`)) return;

    preserveStartedMatchRosters(baba);
    team.jogadores = (team.jogadores || []).filter((id) => id !== playerId);
    baba.jogadoresPresentes = (baba.jogadoresPresentes || []).filter((id) => id !== playerId);
    if (player.visitante) player.foraDoBaba = true;
    if (baba.pagamentos) delete baba.pagamentos[playerId];
    if (isManualMode(baba)) ensureManualStats(baba);
    refreshPreparedMatchRosters(baba);
    baba.rankingDoBaba = calculateDailyRanking(baba);
    selectedPlayerDetail = null;
    els.playerDetailModal?.classList.add('hidden');
    saveState(`${player.nome} removido do baba. As partidas ja encerradas foram preservadas.`);
  }

  function toggleTeamRotation(teamId) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const team = getTeam(baba, teamId);
    if (!baba || baba.status === 'finalizado') return showToast('Este baba nao pode mais ser alterado.');
    if (!team || team.id === VISITOR_TEAM_ID || team.tipo === 'visitante') return showToast('Time nao encontrado.');
    if (teamHasActiveRoute(baba, team.id)) return showToast('Este time esta em uma partida ou desempate e nao pode ser retirado agora.');

    if (team.retiradoDoBaba) {
      team.retiradoDoBaba = false;
      team.retiradoEm = null;
      baba.filaTimes = sanitizeTeamQueue(baba, [...(baba.filaTimes || []), team.id]);
      if (baba.pendingTieBreak) {
        baba.pendingTieBreak.queue = sanitizeTeamQueue(baba, [...(baba.pendingTieBreak.queue || []), team.id]);
      }
      saveState(`${team.name} voltou ao baba e entrou no fim da fila.`);
      return;
    }

    const ok = window.confirm(`Retirar ${team.name} do baba? Os dados do time e dos jogadores serao mantidos, mas ele nao entrara nos proximos jogos.`);
    if (!ok) return;
    team.retiradoDoBaba = true;
    team.retiradoEm = Date.now();
    baba.filaTimes = sanitizeTeamQueue(baba);
    if (baba.pendingTieBreak) baba.pendingTieBreak.queue = sanitizeTeamQueue(baba, baba.pendingTieBreak.queue);
    saveState(`${team.name} retirado do baba. Os dados foram preservados.`);
  }

  function deleteTeamFromBaba(teamId) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const team = getTeam(baba, teamId);
    if (!baba || baba.status === 'finalizado') return showToast('Este baba nao pode mais ser alterado.');
    if (!team || team.id === VISITOR_TEAM_ID || team.tipo === 'visitante') return showToast('Time nao encontrado.');
    if (teamHasActiveRoute(baba, team.id)) return showToast('Este time esta em uma partida ou desempate e nao pode ser excluido agora.');

    const ok = window.confirm(`Excluir ${team.name} deste baba? O time, seus jogadores neste baba e todas as partidas dele serao apagados. Essa acao nao pode ser desfeita.`);
    if (!ok) return;

    const playerIds = new Set(team.jogadores || []);
    baba.teams = (baba.teams || []).filter((item) => item.id !== team.id);
    baba.filaTimes = sanitizeTeamQueue(baba, (baba.filaTimes || []).filter((id) => id !== team.id));
    if (baba.pendingTieBreak) {
      baba.pendingTieBreak.queue = sanitizeTeamQueue(baba, (baba.pendingTieBreak.queue || []).filter((id) => id !== team.id));
    }
    baba.jogos = (baba.jogos || []).filter((game) => game.timeA !== team.id && game.timeB !== team.id);
    baba.jogadoresPresentes = (baba.jogadoresPresentes || []).filter((id) => !playerIds.has(id));
    baba.visitantes = (baba.visitantes || []).filter((player) => !playerIds.has(player.id));
    playerIds.forEach((id) => {
      if (baba.pagamentos) delete baba.pagamentos[id];
    });

    if (isManualMode(baba)) ensureManualStats(baba);
    else rebuildTeamStatsFromGames(baba);
    baba.rankingDoBaba = calculateDailyRanking(baba);
    baba.lastResult = lastResultFromGame(baba, baba.jogos[baba.jogos.length - 1]);
    baba.campeaoDoBaba = null;
    baba.undoStack = [];
    baba.teamRevealIndex = Math.max(0, Math.min(Number(baba.teamRevealIndex || 0), baba.teams.length - 1));
    if (!baba.jogoAtual && getRotationTeams(baba).length < 2) baba.status = 'times';
    if (selectedTeamDetail?.teamId === team.id) {
      selectedTeamDetail = null;
      els.teamDetailModal?.classList.add('hidden');
    }
    if (selectedPlayerDetail && playerIds.has(selectedPlayerDetail.playerId)) {
      selectedPlayerDetail = null;
      els.playerDetailModal?.classList.add('hidden');
    }
    saveState(`${team.name} e seus dados neste baba foram excluidos.`);
  }

  function advanceTeamReveal() {
    const baba = getActiveBaba();
    if (!baba?.teams?.length) return;
    if (drawExperience) return advanceDrawExperience();
    beginDrawExperience(baba, { review: true });
  }

  function restartTeamReveal() {
    const baba = getActiveBaba();
    if (!baba?.teams?.length) return;
    setActiveTab('teams');
    beginDrawExperience(baba, { review: true });
  }

  function startFirstGame(event) {
    event?.preventDefault?.();
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if (baba.status === 'finalizado') return showToast('Este baba ja foi finalizado.');
    if (isManualMode(baba)) return showToast('No modo Manual, atualize as estatisticas direto no Ao Vivo.');
    if (baba.pendingTieBreak) return showToast('Resolva o impar/par antes de iniciar outra partida.');
    if (getRotationTeams(baba).length < 2) return showToast('Sao necessarios dois times ativos para iniciar.');
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
      const queue = sanitizeTeamQueue(baba);
      order = queue.length >= 2 ? queue : teamIds;
      teamAId = order.shift();
      teamBId = order.shift();
    }

    if (!getTeam(baba, teamAId) || !getTeam(baba, teamBId)) {
      return showToast('Não foi possível definir os dois times da partida.');
    }

    baba.filaTimes = order.filter((teamId) => teamId !== teamAId && teamId !== teamBId);
    baba.jogoAtual = buildMatch(baba, teamAId, teamBId);
    startMatchTimer(baba.jogoAtual);
    baba.status = 'jogando';
    saveState(firstGame ? 'Primeiro jogo iniciado.' : 'Partida iniciada.');
    setActiveTab('dashboard');
  }

  function buildMatch(baba, teamAId, teamBId) {
    const highestSavedNumber = Math.max(0, ...(baba.jogos || []).map((game) => Number(game.numeroJogo || 0)));
    const nextGameNumber = Math.max(highestSavedNumber, Number(baba.jogoAtual?.numeroJogo || 0)) + 1;
    return {
      numeroJogo: nextGameNumber,
      timeA: teamAId,
      timeB: teamBId,
      jogadoresTimeA: [...(getTeam(baba, teamAId)?.jogadores || [])],
      jogadoresTimeB: [...(getTeam(baba, teamBId)?.jogadores || [])],
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
      saveState('Cronômetro pausado.');
      return;
    }
    startMatchTimer(match);
    saveState('Cronômetro retomado.');
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
    if (!match) return showToast('Não existe partida preparada.');
    startMatchTimer(match);
    baba.status = 'jogando';
    saveState('Partida iniciada.');
  }

  function startNextGame() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if (baba.jogoAtual) return showToast('Finalize o jogo atual antes do próximo.');
    if (getRotationTeams(baba).length < 2) return showToast('Sao necessarios dois times ativos para iniciar.');
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
    const teamTone = teamId === match.timeA ? 'a' : 'b';
    els.goalModal.dataset.teamTone = teamTone;
    const teamNumber = getTeamNumber(team);
    if (teamNumber) els.goalModal.dataset.teamNumber = String(teamNumber);
    else delete els.goalModal.dataset.teamNumber;
    els.goalModalTitle.textContent = `Gol do ${team.name}`;
    const goalPlayers = team.jogadores
      .map((playerId, originalIndex) => {
        const player = getBabaPlayer(baba, playerId);
        return { playerId, player, originalIndex, isGoalkeeper: player?.tipo === 'goleiro' };
      })
      .sort((a, b) => Number(b.isGoalkeeper) - Number(a.isGoalkeeper) || a.originalIndex - b.originalIndex);
    const playersHTML = goalPlayers.map(({ playerId, player, isGoalkeeper }) => {
      const displayName = `${isGoalkeeper ? '(G) ' : ''}${player?.nome || playerName(playerId, baba)}`;
      return `
        <button class="baba-goal-player ${isGoalkeeper ? 'baba-goal-player--goalkeeper' : ''}" type="button" data-goal-player-id="${playerId}"${teamNumberDataAttribute(team)} aria-label="Marcar gol de ${escapeHTML(displayName)}">
          <strong>${escapeHTML(displayName)}</strong>
        </button>
      `;
    }).join('');
    const externalPlayerHTML = `
      <button class="baba-goal-player baba-goal-player--external" type="button" data-goal-player-id="${EXTERNAL_GOAL_SCORER_ID}">
        <strong>Não marcar jogador</strong>
        <small>Gol sem artilheiro no ranking</small>
      </button>
    `;
    els.goalPlayerList.innerHTML = `${playersHTML}${externalPlayerHTML}`;
    els.goalModal.classList.remove('hidden');
  }

  function closeGoalPicker() {
    goalTeamId = null;
    delete els.goalModal.dataset.teamTone;
    delete els.goalModal.dataset.teamNumber;
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
    playBabaWhistle('goal');
    closeGoalPicker();
    if (!isExternalPlayer) showGoalCelebration(player.nome, team);
    saveState(isExternalPlayer ? 'Gol de jogador de fora registrado.' : `Gol de ${player.nome} registrado.`);
  }

  function undoLastGoal() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const match = baba?.jogoAtual;
    if (!match?.goalEvents?.length) return showToast('Nenhum gol para desfazer.');
    const lastGoal = match.goalEvents[match.goalEvents.length - 1];
    const scorer = lastGoal?.external ? 'gol sem artilheiro' : `gol de ${lastGoal?.jogadorNome || 'jogador'}`;
    const ok = window.confirm(`Tem certeza que deseja desfazer o ${scorer}?`);
    if (!ok) return;
    const removed = match.goalEvents.pop();
    recomputeLiveScore(match);
    saveState(removed.external ? 'Gol sem artilheiro desfeito.' : `Gol de ${removed.jogadorNome || 'jogador'} desfeito.`);
  }

  function finishMatch(event) {
    event?.preventDefault();
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const match = baba?.jogoAtual;
    if (!baba || !match) return showToast('Não existe jogo em andamento.');

    recomputeLiveScore(match);
    const scoreA = Number(match.placarA || 0);
    const scoreB = Number(match.placarB || 0);
    const teamA = getTeam(baba, match.timeA);
    const teamB = getTeam(baba, match.timeB);
    if (!teamA || !teamB) return showToast('Times do jogo nao encontrados.');
    const rotationTeamCount = getRotationTeams(baba).length;
    baba.filaTimes = sanitizeTeamQueue(baba);
    const ok = window.confirm('Tem certeza que deseja finalizar jogo?');
    if (!ok) return;
    playBabaWhistle('finish');

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
      motivoSaida = rotationTeamCount >= 4 ? 'empate: dois times sairam' : 'empate aguardando criterio';

      if (rotationTeamCount >= 4) {
        timeQueContinuou = null;
        timeQueSaiu = `${teamA.id},${teamB.id}`;
        const nextQueue = sanitizeTeamQueue(baba, [...(baba.filaTimes || []), teamA.id, teamB.id]);
        const nextA = nextQueue.shift();
        const nextB = nextQueue.shift();
        baba.filaTimes = nextQueue;
        nextMatchPair = nextA && nextB ? [nextA, nextB] : null;
      } else if (rotationTeamCount === 3) {
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
      jogadoresTimeA: [...gameTeamPlayers(baba, match, teamA.id)],
      jogadoresTimeB: [...gameTeamPlayers(baba, match, teamB.id)],
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
      const nextQueue = sanitizeTeamQueue(baba, [...(baba.filaTimes || []), timeQueSaiu].filter(Boolean));
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
      saveState(empate && rotationTeamCount >= 4 ? 'Empate salvo. Os dois times sairam e os proximos entraram.' : 'Jogo salvo. Proxima partida preparada.');
    }
  }

  function resolveThreeTeamTie(keepTeamId) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    const pending = baba?.pendingTieBreak;
    if (!baba || !pending) return showToast('Não há empate pendente para decidir.');

    const route = getPendingTieBreakRoute(baba, pending);
    if (!route.nextTeamId || route.tiedTeamIds.length < 2) return showToast('Não foi possível montar o próximo jogo.');

    const chosen = String(keepTeamId || '').trim();
    if (!route.tiedTeamIds.includes(chosen)) return showToast('Escolha o time que venceu no impar/par.');

    const out = route.tiedTeamIds.find((id) => id !== chosen);
    const resolvedAt = Date.now();
    baba.filaTimes = sanitizeTeamQueue(baba, [...route.remainingQueue, out].filter(Boolean));
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
    if (!lastSnapshot) return showToast('Não há jogo para desfazer.');
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
    saveState('Último jogo desfeito.');
  }

  function rebuildTeamStatsFromGames(baba) {
    (baba?.teams || []).forEach((team) => {
      team.pontos = 0;
      team.golsPro = 0;
      team.golsContra = 0;
      team.vitorias = 0;
      team.empates = 0;
      team.derrotas = 0;
    });

    (baba?.jogos || []).forEach((game) => {
      const teamA = getTeam(baba, game.timeA);
      const teamB = getTeam(baba, game.timeB);
      if (!teamA || !teamB) return;
      const scoreA = Number(game.placarA || 0);
      const scoreB = Number(game.placarB || 0);
      teamA.golsPro += scoreA;
      teamA.golsContra += scoreB;
      teamB.golsPro += scoreB;
      teamB.golsContra += scoreA;

      if (scoreA === scoreB) {
        teamA.pontos += 1;
        teamB.pontos += 1;
        teamA.empates += 1;
        teamB.empates += 1;
      } else if (scoreA > scoreB) {
        teamA.pontos += 3;
        teamA.vitorias += 1;
        teamB.derrotas += 1;
      } else {
        teamB.pontos += 3;
        teamB.vitorias += 1;
        teamA.derrotas += 1;
      }
    });
  }

  function lastResultFromGame(baba, game) {
    if (!game) return null;
    const teamA = getTeam(baba, game.timeA);
    const teamB = getTeam(baba, game.timeB);
    const scoreA = Number(game.placarA || 0);
    const scoreB = Number(game.placarB || 0);
    return {
      jogo: game.numeroJogo,
      timeA: game.timeA,
      timeB: game.timeB,
      placarA: scoreA,
      placarB: scoreB,
      resumo: `${teamA?.name || game.timeANome || 'Time'} ${scoreA} x ${scoreB} ${teamB?.name || game.timeBNome || 'Time'}`,
      empate: Boolean(game.empate || scoreA === scoreB),
      resultado: game.resultado || (scoreA === scoreB ? 'empate' : 'vitoria'),
      timeQueContinuou: game.timeQueContinuou || null,
      timeQueSaiu: game.timeQueSaiu || null,
      motivoSaida: game.motivoSaida || '-',
      decididoPorSorteio: Boolean(game.decididoPorSorteio),
      criterioDesempate: game.criterioDesempate || null,
    };
  }

  function refreshBabaDerivedData(baba) {
    if (!baba) return;
    if (isManualMode(baba)) {
      (baba.teams || []).forEach(applyManualStatsToTeam);
    } else {
      rebuildTeamStatsFromGames(baba);
    }
    if (baba.status === 'finalizado') {
      const champions = calculateChampions(baba);
      baba.campeaoDoBaba = {
        times: champions.map((team) => team.id),
        nomes: champions.map((team) => team.name),
        jogadores: champions.flatMap((team) => team.jogadores || []),
        definidoEm: Date.now(),
      };
    }
    delete baba.golOverrides;
    baba.rankingDoBaba = calculateDailyRanking(baba);
    const games = baba.jogos || [];
    baba.lastResult = lastResultFromGame(baba, games[games.length - 1]);
    baba.importedTotalGoals = (baba.jogos || []).reduce(
      (total, game) => total + Number(game.placarA || 0) + Number(game.placarB || 0),
      0,
    );
    baba.undoStack = [];
  }

  function gameEditPlayerOptions(baba, game, teamId, selectedId) {
    const ids = new Set(gameTeamPlayers(baba, game, teamId));
    if (selectedId && selectedId !== EXTERNAL_GOAL_SCORER_ID) ids.add(selectedId);
    const players = [...ids]
      .map((id) => getBabaPlayer(baba, id))
      .filter(Boolean)
      .sort((a, b) => a.nome.localeCompare(b.nome));
    return `
      <option value="${EXTERNAL_GOAL_SCORER_ID}"${selectedId === EXTERNAL_GOAL_SCORER_ID ? ' selected' : ''}>Sem artilheiro</option>
      ${players.map((player) => `<option value="${escapeHTML(player.id)}"${selectedId === player.id ? ' selected' : ''}>${escapeHTML(player.nome)}</option>`).join('')}
    `;
  }

  function gameEditTeamHTML(baba, game, side) {
    const isA = side === 'A';
    const teamId = isA ? game.timeA : game.timeB;
    const team = getTeam(baba, teamId);
    const score = selectedGameEdit[`score${side}`];
    const scorers = selectedGameEdit[`scorers${side}`];
    const goals = scorers.length
      ? scorers.map((playerId, index) => `
        <label class="baba-game-edit-goal">
          <span>${index + 1}</span>
          <select data-game-edit-scorer="${side}" aria-label="Artilheiro do gol ${index + 1} do ${escapeHTML(team?.name || `Time ${side}`)}">
            ${gameEditPlayerOptions(baba, game, teamId, playerId)}
          </select>
        </label>
      `).join('')
      : '<div class="baba-game-edit-empty">Nenhum gol neste placar.</div>';
    return `
      <section class="baba-game-edit-team"${teamNumberDataAttribute(team)}>
        <header>
          <strong>${escapeHTML(team?.name || `Time ${side}`)}</strong>
          <div class="baba-game-edit-score-control">
            <button type="button" data-action="change-game-edit-score" data-side="${side}" data-delta="-1" aria-label="Diminuir placar do ${escapeHTML(team?.name || `Time ${side}`)}">-</button>
            <input class="baba-game-edit-score" type="number" min="0" max="99" step="1" required data-game-edit-score="${side}" value="${score}" aria-label="Placar do ${escapeHTML(team?.name || `Time ${side}`)}">
            <button type="button" data-action="change-game-edit-score" data-side="${side}" data-delta="1" aria-label="Aumentar placar do ${escapeHTML(team?.name || `Time ${side}`)}">+</button>
          </div>
        </header>
        <div class="baba-game-edit-goals">${goals}</div>
      </section>
    `;
  }

  function renderGameEditModal() {
    if (!selectedGameEdit) return;
    const baba = getBabaById(selectedGameEdit.babaId);
    const game = (baba?.jogos || []).find((item) => String(item.numeroJogo) === String(selectedGameEdit.gameNumber));
    if (!baba || !game) return closeGameEditModal();
    els.gameEditTitle.textContent = `Editar jogo ${game.numeroJogo}`;
    setHTML(els.gameEditContent, `${gameEditTeamHTML(baba, game, 'A')}${gameEditTeamHTML(baba, game, 'B')}`);
  }

  function openFinishedGameEditor(gameNumber, targetBabaId = null) {
    if (!requireOrganizer()) return;
    const baba = targetBabaId ? getBabaById(targetBabaId) : getActiveBaba();
    if (!baba) return showToast('Baba nao encontrado.');
    if (baba.status !== 'finalizado' && baba.id !== state.activeBabaId) return showToast('Este baba nao pode ser alterado.');
    if (isManualMode(baba)) return showToast('Edite as estatisticas manuais pelo elenco do time.');
    const game = (baba.jogos || []).find((item) => String(item.numeroJogo) === String(gameNumber));
    if (!game) return showToast('Partida nao encontrada.');
    const scoreA = Number(game.placarA || 0);
    const scoreB = Number(game.placarB || 0);
    selectedGameEdit = {
      babaId: baba.id,
      gameNumber: game.numeroJogo,
      opener: document.activeElement,
      scoreA,
      scoreB,
      scorersA: window.BabaManagementCore.scorerSelections(game.goalEvents, game.timeA, scoreA, EXTERNAL_GOAL_SCORER_ID),
      scorersB: window.BabaManagementCore.scorerSelections(game.goalEvents, game.timeB, scoreB, EXTERNAL_GOAL_SCORER_ID),
    };
    els.gameEditModal.classList.remove('hidden');
    renderGameEditModal();
    window.requestAnimationFrame(() => els.gameEditModal.querySelector('input')?.focus({ preventScroll: true }));
  }

  function closeGameEditModal() {
    const opener = selectedGameEdit?.opener;
    selectedGameEdit = null;
    els.gameEditModal?.classList.add('hidden');
    window.requestAnimationFrame(() => opener?.isConnected && opener.focus({ preventScroll: true }));
  }

  function updateGameEditScore(side, value) {
    if (!selectedGameEdit || !['A', 'B'].includes(side)) return;
    try {
      const score = window.BabaManagementCore.parseScore(value);
      const current = Array.from(els.gameEditContent.querySelectorAll(`[data-game-edit-scorer="${side}"]`)).map((select) => select.value);
      selectedGameEdit[`score${side}`] = score;
      selectedGameEdit[`scorers${side}`] = Array.from(
        { length: score },
        (_, index) => current[index] || selectedGameEdit[`scorers${side}`][index] || EXTERNAL_GOAL_SCORER_ID,
      );
      renderGameEditModal();
    } catch (error) {
      showToast(error.message);
    }
  }

  function saveFinishedGameEdit(event) {
    event.preventDefault();
    if (!selectedGameEdit || !requireOrganizer()) return;
    const baba = getBabaById(selectedGameEdit.babaId);
    const game = (baba?.jogos || []).find((item) => String(item.numeroJogo) === String(selectedGameEdit.gameNumber));
    if (!baba || !game) return closeGameEditModal();
    const previousBaba = baba.status === 'finalizado' ? JSON.parse(JSON.stringify(baba)) : null;
    let scoreA;
    let scoreB;
    try {
      scoreA = window.BabaManagementCore.parseScore(els.gameEditContent.querySelector('[data-game-edit-score="A"]')?.value);
      scoreB = window.BabaManagementCore.parseScore(els.gameEditContent.querySelector('[data-game-edit-score="B"]')?.value);
    } catch (error) {
      return showToast(error.message);
    }
    const scorerIds = (side, score) => Array.from(els.gameEditContent.querySelectorAll(`[data-game-edit-scorer="${side}"]`))
      .map((select) => select.value)
      .slice(0, score)
      .concat(Array(Math.max(0, score - els.gameEditContent.querySelectorAll(`[data-game-edit-scorer="${side}"]`).length)).fill(EXTERNAL_GOAL_SCORER_ID));
    const existingEvents = game.goalEvents || [];
    const historicalIds = new Set([
      ...gameTeamPlayers(baba, game, game.timeA),
      ...gameTeamPlayers(baba, game, game.timeB),
      ...existingEvents.map((goal) => goal.jogadorId).filter(Boolean),
    ]);
    const playersById = Object.fromEntries([
      ...state.players,
      ...(baba.visitantes || []),
      ...[...historicalIds].map((id) => getBabaPlayer(baba, id)).filter(Boolean),
    ].map((player) => [player.id, player]));
    const teamA = getTeam(baba, game.timeA);
    const teamB = getTeam(baba, game.timeB);
    game.goalEvents = [
      ...window.BabaManagementCore.buildGoalEvents({
        existingEvents, teamId: game.timeA, teamName: teamA?.name || game.timeANome || 'Time A',
        scorerIds: scorerIds('A', scoreA), externalScorerId: EXTERNAL_GOAL_SCORER_ID,
        playersById, createId: () => newId('goal'),
      }),
      ...window.BabaManagementCore.buildGoalEvents({
        existingEvents, teamId: game.timeB, teamName: teamB?.name || game.timeBNome || 'Time B',
        scorerIds: scorerIds('B', scoreB), externalScorerId: EXTERNAL_GOAL_SCORER_ID,
        playersById, createId: () => newId('goal'),
      }),
    ];
    game.placarA = scoreA;
    game.placarB = scoreB;
    game.gols = aggregateGoalEvents(game.goalEvents);
    game.empate = scoreA === scoreB;
    game.resultado = game.empate ? 'empate' : 'vitoria';
    game.vencedor = game.empate ? null : (scoreA > scoreB ? game.timeA : game.timeB);
    game.perdedor = game.empate ? null : (scoreA > scoreB ? game.timeB : game.timeA);
    refreshBabaDerivedData(baba);
    if (previousBaba) revisePersistedStatsForBaba(previousBaba, baba);
    closeGameEditModal();
    saveState(`Jogo ${game.numeroJogo} corrigido para ${scoreA} x ${scoreB}.`);
  }

  function deleteCurrentGame(gameNumber) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba || baba.status === 'finalizado') return showToast('Este baba nao pode mais ser alterado.');
    const game = (baba.jogos || []).find((item) => String(item.numeroJogo) === String(gameNumber));
    if (!game) return showToast('Partida nao encontrada.');
    if (String(baba.pendingTieBreak?.gameNumber || '') === String(game.numeroJogo)) {
      return showToast('Resolva o desempate desta partida antes de exclui-la.');
    }
    const teamA = getTeam(baba, game.timeA);
    const teamB = getTeam(baba, game.timeB);
    const ok = window.confirm(`Excluir o Jogo ${game.numeroJogo}: ${teamA?.name || 'Time'} ${game.placarA || 0} x ${game.placarB || 0} ${teamB?.name || 'Time'}?`);
    if (!ok) return;

    baba.jogos = (baba.jogos || []).filter((item) => String(item.numeroJogo) !== String(game.numeroJogo));
    rebuildTeamStatsFromGames(baba);
    baba.rankingDoBaba = calculateDailyRanking(baba);
    baba.lastResult = lastResultFromGame(baba, baba.jogos[baba.jogos.length - 1]);
    baba.campeaoDoBaba = null;
    baba.undoStack = [];
    els.gameDetailModal?.classList.add('hidden');
    saveState(`Jogo ${game.numeroJogo} excluido e ranking recalculado.`);
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
    if (isManualMode(baba)) ensureManualStats(baba);

    const previousBaba = JSON.parse(JSON.stringify(baba));
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
    revisePersistedStatsForBaba(previousBaba, baba);
    saveState('Baba finalizado e salvo no histórico.');
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
    authoritativeHistoryRankings?.delete(babaId);
    if (selectedHistoryId === babaId) selectedHistoryId = null;
    if (state.activeBabaId === babaId) {
      state.activeBabaId = state.babas.find((item) => item.status !== 'finalizado')?.id || null;
    }
    applyDeletedBabaToPersistedStats(baba);
    saveState('Baba removido do historico.');
  }

  function historyEditablePlayers(baba) {
    const ids = new Set([...(baba?.jogadoresPresentes || [])]);
    (baba?.teams || []).forEach((team) => {
      (team.jogadores || []).forEach((id) => ids.add(id));
      Object.keys(team.manualStats?.playerGoals || {}).forEach((id) => ids.add(id));
    });
    (baba?.visitantes || []).forEach((player) => ids.add(player.id));
    (baba?.jogos || []).forEach((game) => {
      (game.goalEvents || []).forEach((goal) => { if (goal?.jogadorId) ids.add(goal.jogadorId); });
      (game.gols || []).forEach((goal) => { if (goal?.jogadorId) ids.add(goal.jogadorId); });
    });
    return [...ids]
      .map((id) => getBabaPlayer(baba, id) || { id, nome: playerName(id, baba) })
      .filter((player) => player?.id)
      .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));
  }

  function openHistorySummaryEditor(babaId) {
    if (!requireOrganizer()) return;
    const baba = getBabaById(babaId);
    if (!baba || baba.status !== 'finalizado') return showToast('Baba finalizado nao encontrado.');
    const ranking = calculateDailyRanking(baba);
    selectedHistoryEdit = { babaId: baba.id, opener: document.activeElement };
    els.historyEditDate.value = baba.dataISO || '';
    setHTML(els.historyEditGoals, historyEditablePlayers(baba).map((player) => {
      const team = getPlayerTeam(baba, player.id);
      const goals = Number(ranking[player.id]?.totalGols || 0);
      return `
        <label class="baba-history-edit-player"${teamNumberDataAttribute(team)}>
          <span><strong>${playerNameWithStarsHTML(player.id, baba, { name: player.nome })}</strong><small>${escapeHTML(team?.name || 'Sem time')}</small></span>
          <input type="number" min="0" max="99" step="1" inputmode="numeric" value="${goals}" data-history-player-goals="${escapeHTML(player.id)}" aria-label="Gols de ${escapeHTML(player.nome)}">
        </label>
      `;
    }).join('') || '<div class="baba-empty">Nenhum jogador registrado neste baba.</div>');
    els.historyEditModal.classList.remove('hidden');
    window.requestAnimationFrame(() => els.historyEditDate?.focus({ preventScroll: true }));
  }

  function closeHistorySummaryEditor() {
    const opener = selectedHistoryEdit?.opener;
    selectedHistoryEdit = null;
    els.historyEditModal?.classList.add('hidden');
    window.requestAnimationFrame(() => opener?.isConnected && opener.focus({ preventScroll: true }));
  }

  function validBabaDate(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, year, month, day] = match.map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return { iso: value, year, month, day };
  }

  function setManualHistoricalGoals(baba, playerId, goals, playerNameValue) {
    const team = (baba.teams || []).find((item) => (item.jogadores || []).includes(playerId))
      || (baba.teams || []).find((item) => Object.prototype.hasOwnProperty.call(item.manualStats?.playerGoals || {}, playerId));
    if (!team) {
      if (goals) throw new Error(`${playerNameValue} precisa estar em um time para receber gols.`);
      return;
    }
    const stats = getManualTeamStats(team);
    stats.playerGoals[playerId] = goals;
    team.manualStats = stats;
  }

  function saveHistorySummaryEdit(event) {
    event.preventDefault();
    if (!selectedHistoryEdit || !requireOrganizer()) return;
    const source = getBabaById(selectedHistoryEdit.babaId);
    if (!source || source.status !== 'finalizado') return closeHistorySummaryEditor();
    const date = validBabaDate(els.historyEditDate?.value);
    if (!date) return showToast('Informe uma data valida para o baba.');
    const edited = JSON.parse(JSON.stringify(source));
    const goalInputs = Array.from(els.historyEditGoals.querySelectorAll('[data-history-player-goals]'));
    try {
      goalInputs.forEach((input) => {
        const playerId = input.dataset.historyPlayerGoals;
        const player = getBabaPlayer(edited, playerId) || { id: playerId, nome: playerName(playerId, edited) };
        const goals = window.BabaManagementCore.parseScore(input.value);
        if (isManualMode(edited)) {
          setManualHistoricalGoals(edited, playerId, goals, player.nome);
        } else {
          window.BabaManagementCore.setHistoricalPlayerGoals({
            baba: edited,
            playerId,
            playerName: player.nome,
            targetGoals: goals,
            createId: () => newId('goal'),
          });
        }
      });
    } catch (error) {
      return showToast(error.message || 'Nao foi possivel atualizar os gols.');
    }
    Object.assign(edited, {
      dataISO: date.iso,
      dataCompleta: formatDate(date.iso),
      dia: date.day,
      mes: date.month,
      ano: date.year,
    });
    (edited.jogos || []).forEach((game) => {
      if (Array.isArray(game.goalEvents)) game.gols = aggregateGoalEvents(game.goalEvents);
    });
    refreshBabaDerivedData(edited);
    const index = state.babas.findIndex((baba) => baba.id === edited.id);
    if (index < 0) return closeHistorySummaryEditor();
    revisePersistedStatsForBaba(source, edited);
    state.babas[index] = edited;
    closeHistorySummaryEditor();
    saveState(`Historico de ${edited.dataCompleta} atualizado.`);
  }

  function editHistoryTeamRoster(babaId, teamId) {
    if (!requireOrganizer()) return;
    const baba = getBabaById(babaId);
    if (!baba || baba.status !== 'finalizado') return showToast('Baba finalizado nao encontrado.');
    openTeamDetail(teamId, babaId);
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
    if (isManualMode(baba)) {
      ensureManualStats(baba);
      const playerIds = new Set([...(baba?.jogadoresPresentes || [])]);
      (baba?.teams || []).forEach((team) => (team.jogadores || []).forEach((id) => playerIds.add(id)));
      (baba?.visitantes || []).forEach((player) => playerIds.add(player.id));
      playerIds.forEach((playerId) => {
        ranking[playerId] = makeEmptyPlayerStats(playerId, playerName(playerId, baba));
        ranking[playerId].totalBabas = 1;
      });
      (baba?.teams || []).forEach((team) => {
        const teamStats = getManualTeamStats(team);
        (team.jogadores || []).forEach((playerId) => {
          const stats = ensureStats(ranking, playerId, baba);
          stats.totalVitorias += Number(teamStats.wins || 0);
          stats.totalEmpates += Number(teamStats.draws || 0);
          stats.totalDerrotas += Number(teamStats.losses || 0);
          if (isBabaGoalkeeper(baba, playerId)) {
            stats.goalkeeperGames += Number(teamStats.wins || 0) + Number(teamStats.draws || 0) + Number(teamStats.losses || 0);
          }
          ranking[playerId] = stats;
        });
        Object.entries(teamStats.playerGoals || {}).forEach(([playerId, goals]) => {
          ensureStats(ranking, playerId, baba).totalGols += Number(goals || 0);
        });
      });
      if (baba?.campeaoDoBaba?.jogadores) {
        baba.campeaoDoBaba.jogadores.forEach((id) => ensureStats(ranking, id, baba).totalTitulosBaba += 1);
      }
      Object.values(ranking).forEach(finalizeStats);
      return ranking;
    }

    const playerIds = new Set([...(baba?.jogadoresPresentes || [])]);
    (baba?.teams || []).forEach((team) => (team.jogadores || []).forEach((id) => playerIds.add(id)));
    (baba?.visitantes || []).forEach((player) => playerIds.add(player.id));

    playerIds.forEach((playerId) => {
      ranking[playerId] = makeEmptyPlayerStats(playerId, playerName(playerId, baba));
      ranking[playerId].totalBabas = 1;
    });

    (baba.jogos || []).forEach((game) => {
      const teamAPlayers = gameTeamPlayers(baba, game, game.timeA);
      const teamBPlayers = gameTeamPlayers(baba, game, game.timeB);

      if (game.empate) {
        [...teamAPlayers, ...teamBPlayers].forEach((id) => ensureStats(ranking, id, baba).totalEmpates += 1);
      } else {
        gameTeamPlayers(baba, game, game.vencedor).forEach((id) => ensureStats(ranking, id, baba).totalVitorias += 1);
        gameTeamPlayers(baba, game, game.perdedor).forEach((id) => ensureStats(ranking, id, baba).totalDerrotas += 1);
      }

      (game.gols || []).forEach((goal) => {
        if (!goal?.jogadorId || goal.external) return;
        ensureStats(ranking, goal.jogadorId, baba).totalGols += Number(goal.quantidade || 0);
      });
    });

    if (baba.campeaoDoBaba?.jogadores) {
      baba.campeaoDoBaba.jogadores.forEach((id) => ensureStats(ranking, id, baba).totalTitulosBaba += 1);
    }

    Object.values(ranking).forEach(finalizeStats);
    return ranking;
  }

  function hasFinishedBabas() {
    return state.babas.some((baba) => baba.status === 'finalizado');
  }

  function hasFinishedBabasInMonth(monthKey) {
    return Boolean(monthKey) && state.babas.some((baba) => baba.status === 'finalizado' && monthKeyFromISO(baba.dataISO) === monthKey);
  }

  function getFinishedBabaRanking(baba) {
    if (!baba || baba.status !== 'finalizado') return {};
    if (baba.__detailLoaded) return calculateDailyRanking(baba);
    const saved = baba.rankingDoBaba && typeof baba.rankingDoBaba === 'object' && !Array.isArray(baba.rankingDoBaba)
      ? baba.rankingDoBaba
      : null;
    if (saved && Object.keys(saved).length) return JSON.parse(JSON.stringify(saved));
    return calculateDailyRanking(baba);
  }

  function calculateGeneralRanking() {
    const persisted = state.playerStats && typeof state.playerStats === 'object' && !Array.isArray(state.playerStats)
      ? state.playerStats
      : {};
    if (Object.keys(persisted).length) {
      const ranking = JSON.parse(JSON.stringify(persisted));
      Object.entries(ranking).forEach(([playerId, stats]) => {
        stats.jogadorId = stats.jogadorId || stats.playerId || playerId;
        finalizeStats(stats);
      });
      return ranking;
    }
    if (!hasFinishedBabas()) return {};
    const ranking = {};
    state.babas.filter((baba) => baba.status === 'finalizado').forEach((baba) => {
      Object.values(getFinishedBabaRanking(baba)).forEach((stats) => mergeRankingStats(ranking, stats));
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
    target.totalMvps += Number(stats.totalMvps || 0);
    target.totalCartoesAmarelos += Number(stats.totalCartoesAmarelos || 0);
    target.totalCartoesVermelhos += Number(stats.totalCartoesVermelhos || 0);
    target.goalkeeperGames = Number(target.goalkeeperGames || 0) + Number(stats.goalkeeperGames || 0);
    target.goalsConceded = Number(target.goalsConceded || 0) + Number(stats.goalsConceded || 0);
    ranking[stats.jogadorId] = target;
  }

  function calculateMonthlyRanking(monthKey, { includeActive = false } = {}) {
    const persisted = state.monthlyStats?.[monthKey];
    const ranking = persisted && typeof persisted === 'object' && !Array.isArray(persisted)
      ? JSON.parse(JSON.stringify(persisted))
      : {};
    if (!Object.keys(ranking).length) {
      state.babas
        .filter((baba) => baba.status === 'finalizado' && monthKeyFromISO(baba.dataISO) === monthKey)
        .forEach((baba) => {
          Object.values(getFinishedBabaRanking(baba)).forEach((stats) => mergeRankingStats(ranking, stats));
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
        vitorias: 0,
        empates: 0,
        derrotas: 0,
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

  function addGoalkeeperGameStats(ranking, baba, team, goalsAgainst, result = 'draw') {
    (team?.jogadores || []).forEach((playerId) => {
      const player = getBabaPlayer(baba, playerId);
      if (!isBabaGoalkeeper(baba, playerId)) return;
      const stats = ensureGoalkeeperStats(ranking, player, baba);
      if (!stats) return;
      stats.jogos += 1;
      stats.golsSofridos += Number(goalsAgainst || 0);
      if (result === 'win') stats.vitorias += 1;
      else if (result === 'loss') stats.derrotas += 1;
      else stats.empates += 1;
    });
  }

  function goalkeeperTeamResult(game, teamId) {
    const scoreA = Number(game?.placarA || 0);
    const scoreB = Number(game?.placarB || 0);
    if (scoreA === scoreB || game?.empate) return 'draw';
    const winnerId = game?.vencedor || (scoreA > scoreB ? game.timeA : game.timeB);
    return winnerId === teamId ? 'win' : 'loss';
  }

  function collectGoalkeeperRankingFromBaba(ranking, baba, { includeLive = false } = {}) {
    (baba?.jogos || []).forEach((game) => {
      const teamA = getTeam(baba, game.timeA);
      const teamB = getTeam(baba, game.timeB);
      if (!teamA || !teamB) return;
      addGoalkeeperGameStats(ranking, baba, teamA, game.placarB, goalkeeperTeamResult(game, teamA.id));
      addGoalkeeperGameStats(ranking, baba, teamB, game.placarA, goalkeeperTeamResult(game, teamB.id));
    });

    const match = includeLive ? baba?.jogoAtual : null;
    const hasLiveData = Boolean(match && (match.iniciadoEm || (match.goalEvents || []).length));
    if (!hasLiveData) return;
    const teamA = getTeam(baba, match.timeA);
    const teamB = getTeam(baba, match.timeB);
    if (!teamA || !teamB) return;
    addGoalkeeperGameStats(ranking, baba, teamA, match.placarB, goalkeeperTeamResult(match, teamA.id));
    addGoalkeeperGameStats(ranking, baba, teamB, match.placarA, goalkeeperTeamResult(match, teamB.id));
  }

  function calculateGoalkeeperRanking({ includeActive = false } = {}) {
    const ranking = {};
    const persistedGoalkeepers = Object.values(state.playerStats || {})
      .filter((stats) => Number(stats.goalkeeperGames || 0) > 0);
    if (persistedGoalkeepers.length) {
      persistedGoalkeepers.forEach((stats) => {
        const playerId = stats.jogadorId || stats.playerId;
        ranking[playerId] = {
          jogadorId: playerId,
          nome: stats.nome || stats.name || playerName(playerId),
          jogos: Number(stats.goalkeeperGames || 0),
          vitorias: Number(stats.totalVitorias || 0),
          empates: Number(stats.totalEmpates || 0),
          derrotas: Number(stats.totalDerrotas || 0),
          golsSofridos: Number(stats.goalsConceded || 0),
          totalBabas: Number(stats.totalBabas || 0),
          _babas: new Set(),
        };
      });
    } else {
      state.babas
        .filter((baba) => baba.status === 'finalizado')
        .forEach((baba) => {
          const savedGoalkeepers = Object.values(getFinishedBabaRanking(baba))
            .filter((stats) => Number(stats.goalkeeperGames || 0) > 0);
          if (!savedGoalkeepers.length) {
            collectGoalkeeperRankingFromBaba(ranking, baba);
            return;
          }
          savedGoalkeepers.forEach((stats) => {
            const playerId = stats.jogadorId || stats.playerId;
            if (!ranking[playerId]) {
              ranking[playerId] = {
                jogadorId: playerId,
                nome: stats.nome || stats.name || playerName(playerId, baba),
                jogos: 0,
                vitorias: 0,
                empates: 0,
                derrotas: 0,
                golsSofridos: 0,
                totalBabas: 0,
                _babas: new Set(),
              };
            }
            ranking[playerId].jogos += Number(stats.goalkeeperGames || 0);
            ranking[playerId].vitorias += Number(stats.totalVitorias || 0);
            ranking[playerId].empates += Number(stats.totalEmpates || 0);
            ranking[playerId].derrotas += Number(stats.totalDerrotas || 0);
            ranking[playerId].golsSofridos += Number(stats.goalsConceded || 0);
            ranking[playerId]._babas.add(baba.id);
          });
        });
    }

    const active = getActiveBaba();
    if (includeActive && active && active.status !== 'finalizado') {
      collectGoalkeeperRankingFromBaba(ranking, active, { includeLive: true });
    }

    const eligible = Object.values(ranking)
      .map((stats) => {
        stats.totalBabas = Number(stats.totalBabas || stats._babas?.size || 0);
        delete stats._babas;
        stats.mediaSofridos = stats.jogos ? Number((stats.golsSofridos / stats.jogos).toFixed(2)) : 0;
        return stats;
      })
      .filter((stats) => stats.jogos > 0 && isPlayerVisibleInRanking(stats.jogadorId));
    return window.BabaManagementCore.sortGoalkeeperRanking(eligible);
  }

  function getAvailableMonthKeys() {
    const keys = new Set();
    Object.keys(state.monthlyStats || {}).forEach((key) => keys.add(key));
    state.babas.filter((baba) => baba.status === 'finalizado').forEach((baba) => {
      const key = monthKeyFromISO(baba.dataISO);
      if (key) keys.add(key);
    });
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
      totalMvps: 0,
      totalCartoesAmarelos: 0,
      totalCartoesVermelhos: 0,
      goalkeeperGames: 0,
      goalsConceded: 0,
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

  function completedBabaCount(predicate = null) {
    const loadedCount = state.babas.filter((baba) => baba.status === 'finalizado' && (!predicate || predicate(baba))).length;
    if (predicate) return loadedCount;
    const persistedCount = Math.max(0, ...Object.values(state.playerStats || {}).map((stats) => Number(stats.totalBabas || 0)));
    return Math.max(loadedCount, persistedCount);
  }

  function resetPerformanceCache() {
    performanceCache = { general: null, goalkeeper: null, scoped: new Map() };
  }

  function performanceMap(items, { completedBabas = 0, goalkeeper = false, cacheKey = '' } = {}) {
    const engine = window.BabaPerformanceStars;
    if (!engine) return new Map();
    if (!performanceCache) resetPerformanceCache();
    if (cacheKey && performanceCache.scoped.has(cacheKey)) return performanceCache.scoped.get(cacheKey);
    const map = engine.mapRatings(items, { completedBabas, goalkeeper });
    if (cacheKey) performanceCache.scoped.set(cacheKey, map);
    return map;
  }

  function generalPerformanceMap() {
    if (!performanceCache) resetPerformanceCache();
    if (!performanceCache.general) {
      performanceCache.general = performanceMap(Object.values(calculateGeneralRanking()), {
        completedBabas: completedBabaCount(),
        cacheKey: 'general-field',
      });
    }
    return performanceCache.general;
  }

  function goalkeeperPerformanceMap() {
    if (!performanceCache) resetPerformanceCache();
    if (!performanceCache.goalkeeper) {
      performanceCache.goalkeeper = performanceMap(calculateGoalkeeperRanking({ includeActive: false }), {
        completedBabas: completedBabaCount(),
        goalkeeper: true,
        cacheKey: 'general-goalkeeper',
      });
    }
    return performanceCache.goalkeeper;
  }

  function defaultPlayerPerformance(playerId, baba = getDisplayedBaba()) {
    if (!playerId) return null;
    return isBabaGoalkeeper(baba, playerId)
      ? goalkeeperPerformanceMap().get(playerId) || null
      : generalPerformanceMap().get(playerId) || null;
  }

  function performanceStarsHTML(performance, { compact = false } = {}) {
    const value = Math.max(0, Math.min(5, Number(performance?.displayStars ?? performance?.stars ?? 0)));
    const tone = performance?.displayTone || performance?.tone || 'gray';
    const title = performance?.title || 'Sem estrela';
    const label = `${title}: ${String(value).replace('.', ',')} de 5 estrelas`;
    const icons = Array.from({ length: 5 }, (_, index) => {
      const filled = value >= index + 1;
      const half = !filled && value >= index + 0.5;
      const stateClass = filled ? 'is-full' : (half ? 'is-half' : 'is-empty');
      const mask = half ? ' mask="url(#baba-star-half-mask)"' : '';
      return `
        <span class="baba-performance-star ${stateClass}" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <use class="baba-performance-star__empty" href="#baba-performance-star"></use>
            ${filled || half ? `<use class="baba-performance-star__fill" href="#baba-performance-star"${mask}></use><use class="baba-performance-star__shine" href="#baba-performance-star"${mask}></use>` : ''}
            <g class="baba-performance-star__particles">
              <circle cx="4" cy="5" r="1"></circle><circle cx="20" cy="7" r=".8"></circle><circle cx="19" cy="19" r=".65"></circle>
            </g>
          </svg>
        </span>
      `;
    }).join('');
    return `<span class="baba-performance-stars is-${tone}${compact ? ' is-compact' : ''}" role="img" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}">${icons}</span>`;
  }

  function playerNameWithStarsHTML(playerId, baba = getDisplayedBaba(), options = {}) {
    const name = options.name || playerName(playerId, baba);
    const performance = options.rating === undefined ? defaultPlayerPerformance(playerId, baba) : options.rating;
    const babaId = options.babaId || baba?.id || '';
    return `<span class="baba-player-name-line is-clickable" role="button" tabindex="0" data-player-detail-id="${escapeHTML(playerId)}"${babaId ? ` data-player-detail-baba-id="${escapeHTML(babaId)}"` : ''} aria-label="Abrir card de ${escapeHTML(name)}"><span class="baba-player-name-text">${escapeHTML(name)}</span>${performanceStarsHTML(performance, { compact: true })}</span>`;
  }

  function pdfPlayerCell(playerId, name, baba = getDisplayedBaba(), performance = undefined) {
    const rating = performance === undefined ? defaultPlayerPerformance(playerId, baba) : performance;
    return {
      type: 'player',
      text: name || playerName(playerId, baba),
      stars: Number(rating?.displayStars ?? rating?.stars ?? 0),
      starTone: rating?.displayTone || rating?.tone || 'none',
      goalkeeper: Boolean(rating?.goalkeeper),
    };
  }

  function render() {
    resetPerformanceCache();
    const scrollPosition = { x: window.scrollX, y: window.scrollY };
    const baba = getDisplayedBaba();
    const activeBase = baba ? {
      id: baba.id,
      dataISO: baba.dataISO,
      status: baba.status,
      matchMode: baba.matchMode,
      jogadoresPresentes: baba.jogadoresPresentes,
      visitantes: baba.visitantes,
      teams: baba.teams,
      filaTimes: baba.filaTimes,
      jogoAtual: baba.jogoAtual,
      jogos: baba.jogos,
      lastResult: baba.lastResult,
      pendingTieBreak: baba.pendingTieBreak,
      teamRevealIndex: baba.teamRevealIndex,
      pagamentos: baba.pagamentos,
    } : null;

    renderComponent('header', activeBase && {
      id: activeBase.id,
      dataISO: activeBase.dataISO,
      status: activeBase.status,
      matchMode: activeBase.matchMode,
      presentes: activeBase.jogadoresPresentes,
      times: activeBase.teams,
      jogos: activeBase.jogos?.length,
      jogoAtual: activeBase.jogoAtual,
      pendingTieBreak: activeBase.pendingTieBreak,
    }, () => renderHeader(baba));
    renderComponent('metrics', activeBase && {
      status: activeBase.status,
      matchMode: activeBase.matchMode,
      presentes: activeBase.jogadoresPresentes,
      times: activeBase.teams,
      fila: activeBase.filaTimes,
      jogos: activeBase.jogos?.length,
    }, () => renderMetrics(baba));
    renderComponent('players-admin', {
      players: state.players,
      visitors: baba?.visitantes,
      payments: baba?.pagamentos,
      monthlyPayments: state.monthlyPayments,
      month: currentPaymentMonthKey(),
      activeBabaId: state.activeBabaId,
    }, () => renderPlayersAdmin(baba));
    renderComponent('present-list', {
      players: state.players,
      presentes: baba?.jogadoresPresentes,
      teams: baba?.teams,
      payments: baba?.pagamentos,
      monthlyPayments: state.monthlyPayments,
      paymentMonth: currentPaymentMonthKey(),
      status: baba?.status,
    }, () => renderPresentList(baba));
    renderComponent('goals-payments', {
      goals: state.purchaseGoals,
      monthlyPayments: state.monthlyPayments,
      month: currentPaymentMonthKey(),
      players: state.players,
      visitors: baba?.visitantes,
      payments: baba?.pagamentos,
    }, () => renderGoalsAndPayments(baba));
    renderComponent('teams', {
      teams: baba?.teams,
      players: state.players,
      visitors: baba?.visitantes,
      present: baba?.jogadoresPresentes,
      status: baba?.status,
      matchMode: baba?.matchMode,
      reveal: baba?.teamRevealIndex,
      currentGame: baba?.jogoAtual,
    }, () => renderDrawTeams(baba));
    renderComponent('dashboard', {
      teams: baba?.teams,
      currentGame: baba?.jogoAtual,
      pendingTieBreak: baba?.pendingTieBreak,
      status: baba?.status,
      matchMode: baba?.matchMode,
    }, () => renderDashboard(baba));
    renderComponent('standings', { teams: baba?.teams, currentGame: baba?.jogoAtual, matchMode: baba?.matchMode }, () => renderStandings(baba));
    renderComponent('daily-scorers', {
      ...activeBase,
      expanded: expandedRankingKeys.has('daily-top-scorers'),
    }, () => renderDailyTopScorers(baba));
    renderComponent('current-games', { id: baba?.id, games: baba?.jogos, teams: baba?.teams, matchMode: baba?.matchMode }, () => renderCurrentGames(baba));
    renderComponent('rankings', {
      babas: state.babas,
      players: state.players,
      rankingMode,
      rankingScope,
      expanded: [...expandedRankingKeys],
      selectedMonthlyKey,
    }, () => renderRankings(baba));
    renderComponent('history', { babas: state.babas, players: state.players, selectedHistoryId }, renderHistory);
    renderOpenManagementModals();
    renderTimerOnly();
    if (hasBooted && (window.scrollX !== scrollPosition.x || window.scrollY !== scrollPosition.y)) {
      window.scrollTo(scrollPosition.x, scrollPosition.y);
    }
    lastRenderedStateSignature = renderStateSignature(state);
  }

  function setFlowButton(button, state) {
    if (!button) return;
    const classes = ['is-flow-primary', 'is-flow-complete', 'is-flow-next', 'is-flow-disabled', 'is-flow-neutral', 'is-flow-danger'];
    button.classList.remove(...classes);
    button.classList.add(`is-flow-${state.variant || 'neutral'}`);
    button.classList.remove('btn--primary', 'btn--success', 'btn--danger');
    if (state.variant === 'primary' || state.variant === 'next') button.classList.add('btn--primary');
    if (state.variant === 'complete') button.classList.add('btn--success');
    if (state.variant === 'danger') button.classList.add('btn--danger');
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
    const unassignedPresentCount = hasDrawnTeams ? getUnassignedPresentPlayers(baba).length : 0;
    const canDrawTeams = hasOpenBaba && hasPresentPlayers;
    const canCreateLateTeam = hasOpenBaba && hasDrawnTeams && unassignedPresentCount > 0;
    const canOpenTeams = hasOpenBaba && hasDrawnTeams;
    const canStartGame = canOpenTeams && !isManualMode(baba) && getRotationTeams(baba).length >= 2 && !baba?.jogoAtual && !baba?.pendingTieBreak;
    const startGameLabel = hasFinishedGame ? 'Iniciar partida' : 'Iniciar primeiro jogo';

    if (els.dateDisplay) els.dateDisplay.textContent = formatBabaDateLong(baba?.dataISO || todayISO());
    setFlowButton(els.organizerCreateToday, {
      variant: 'primary',
      hidden: hasOpenBaba,
      disabled: hasOpenBaba,
      label: 'Iniciar Baba',
    });

    setFlowButton(els.markPresent, {
      variant: !hasOpenBaba ? 'disabled' : (hasPresentPlayers ? 'complete' : 'primary'),
      disabled: !hasOpenBaba,
    });
    setFlowButton(els.drawTeams, {
      variant: hasDrawnTeams
        ? (canCreateLateTeam ? 'next' : 'disabled')
        : (!canDrawTeams ? 'disabled' : 'next'),
      disabled: hasDrawnTeams ? !canCreateLateTeam : !canDrawTeams,
      label: hasDrawnTeams
        ? `Criar novo time${unassignedPresentCount ? ` (${unassignedPresentCount})` : ''}`
        : 'Escolher modo e sortear',
    });
    els.drawTeams.title = hasDrawnTeams
      ? (canCreateLateTeam
        ? `${unassignedPresentCount} jogador${unassignedPresentCount === 1 ? '' : 'es'} presente${unassignedPresentCount === 1 ? '' : 's'} e sem time`
        : 'Marque os jogadores que chegaram depois para criar outro time')
      : 'Escolha o modo de anotacao antes de sortear os times iniciais';
    setFlowButton(els.startFirstGame, {
      variant: !canStartGame ? 'disabled' : 'next',
      hidden: isManualMode(baba),
      disabled: !canStartGame,
      label: startGameLabel,
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
      const modeLabel = isManualMode(baba) ? 'Modo: Manual' : 'Modo: Pelo Site';
      els.activeSubtitle.textContent = baba.status === 'finalizado'
        ? `Baba salvo no histórico. ${modeLabel}.`
        : `${modeLabel}. Marque os presentes, sorteie os times e deixe o rodízio trabalhar.`;
      if (els.dateInput) els.dateInput.value = baba.dataISO || todayISO();
    } else {
      els.activeStatus.textContent = 'Nenhum baba aberto';
      els.activeSubtitle.textContent = 'Crie o baba de hoje para iniciar a convocação e o sorteio dos times.';
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

    setHTML(els.fieldTeamA, teamA ? teamDetailButton(baba, teamA) : teamLabel(teamA));
    setHTML(els.fieldTeamB, teamB ? teamDetailButton(baba, teamB) : teamLabel(teamB));
    setHTML(els.liveScore, current ? scoreBadgeHTML(current.placarA, current.placarB) : scoreBadgeHTML(0, 0));
    els.metricPresent.textContent = String(baba?.jogadoresPresentes?.length || 0);
    els.metricTeams.textContent = String(baba?.teams?.length || 0);
    els.metricGames.textContent = isManualMode(baba) ? 'Manual' : String(baba?.jogos?.length || 0);
    els.metricNextTeam.textContent = nextTeam?.name || '-';
  }

  function renderPlayersAdmin(baba = getActiveBaba()) {
    const visitors = baba?.visitantes || [];
    const normalizePlayerFilterText = (value) => String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
    const playerAdminItemHTML = (player, { visitor = false } = {}) => {
      const paymentState = playerPaymentState(player.id, baba, { force: true });
      const paid = paymentState === 'paid';
      const active = player.ativo !== false;
      const price = paymentPriceForPlayer(player);
      const status = visitor ? PLAYER_STATUS.GUEST : getPlayerStatus(player);
      const typeLabel = player.tipo === 'goleiro' ? 'Goleiro' : (visitor || player.visitante ? 'Convidado' : 'Jogador');
      const paymentLabel = paymentState === 'paid'
        ? '<small class="baba-payment-status is-paid">Pago</small>'
        : paymentState === 'unpaid'
          ? '<small class="baba-payment-status is-unpaid">Não pagou</small>'
          : `<small class="baba-status-pill is-${status}">${escapeHTML(playerStatusLabel(player))}</small>`;
      const meta = [
        `<small>${typeLabel} - ${formatCurrency(price)}</small>`,
        paymentLabel,
      ].filter(Boolean).join('');
      const paymentButtonLabel = paid ? 'Pagamento pendente' : 'Pagamento pago';
      const canCharge = isPaymentEligiblePlayer(player);
      const statusOptions = PLAYER_STATUS_OPTIONS.map((option) => (
        `<option value="${option.id}"${option.id === status ? ' selected' : ''}>${option.label}</option>`
      )).join('');

      return `
      <div class="baba-player-admin is-${paymentState || 'unpaid'}" data-player-filter-row data-player-name="${escapeHTML(normalizePlayerFilterText(player.nome))}" data-player-payment="${paymentState || 'unpaid'}" data-player-status="${status}" data-player-novice="${status === PLAYER_STATUS.NOVICE ? 'yes' : 'no'}">
        <div class="baba-player-admin__info">
          <strong>${playerPaymentNameHTML(player.id, baba, { name: player.nome, force: true })}</strong>
          ${meta ? `<div class="baba-player-admin__meta">${meta}</div>` : ''}
        </div>
        <div class="baba-player-admin__actions">
          <button class="baba-mini-btn" type="button" data-action="toggle-payment" data-id="${player.id}" ${canCharge ? '' : 'disabled'}>${canCharge ? paymentButtonLabel : playerStatusLabel(player)}</button>
          ${visitor
            ? `<button class="baba-mini-btn danger" type="button" data-action="delete-visitor" data-id="${player.id}">Remover</button>`
            : `
              <label class="baba-player-status-control">
                <span>Definir jogador</span>
                <select data-player-status-id="${player.id}" aria-label="Definir situação de ${escapeHTML(player.nome)}">${statusOptions}</select>
              </label>
              <button class="baba-mini-btn danger" type="button" data-action="delete-player" data-id="${player.id}">Excluir</button>
            `}
        </div>
      </div>
    `;
    };

    const playerItems = [
      ...state.players.map((player) => ({ player, visitor: false })),
      ...visitors.map((player) => ({ player, visitor: true })),
    ].sort((a, b) => (
      Number(b.player?.ativo !== false) - Number(a.player?.ativo !== false)
      || String(a.player?.nome || '').localeCompare(String(b.player?.nome || ''), 'pt-BR', { sensitivity: 'base' })
    ));
    const playersHTML = playerItems.map(({ player, visitor }) => playerAdminItemHTML(player, { visitor })).join('');

    setHTML(els.playersAdminList, `
      <div class="baba-admin-section">
        <div class="baba-player-filter-head">
          <span>Jogadores do baba</span>
          <small data-player-filter-count>${playerItems.length} jogadores</small>
        </div>
        <div class="baba-player-filters" aria-label="Filtros da lista de pagamentos">
          <input type="search" data-player-list-filter="query" value="${escapeHTML(playerPaymentFilters.query)}" placeholder="Pesquisar por nome" aria-label="Pesquisar jogador por nome">
          <select data-player-list-filter="payment" aria-label="Filtrar por pagamento">
            <option value="all"${playerPaymentFilters.payment === 'all' ? ' selected' : ''}>Pagamento: todos</option>
            <option value="paid"${playerPaymentFilters.payment === 'paid' ? ' selected' : ''}>Pagou</option>
            <option value="unpaid"${playerPaymentFilters.payment === 'unpaid' ? ' selected' : ''}>Não pagou</option>
          </select>
          <select data-player-list-filter="novice" aria-label="Filtrar por novato">
            <option value="all"${playerPaymentFilters.novice === 'all' ? ' selected' : ''}>Novato: todos</option>
            <option value="yes"${playerPaymentFilters.novice === 'yes' ? ' selected' : ''}>Somente novatos</option>
            <option value="no"${playerPaymentFilters.novice === 'no' ? ' selected' : ''}>Não novatos</option>
          </select>
          <select data-player-list-filter="status" aria-label="Filtrar por situação">
            <option value="all"${playerPaymentFilters.status === 'all' ? ' selected' : ''}>Situação: todos</option>
            <option value="regular"${playerPaymentFilters.status === 'regular' ? ' selected' : ''}>Regulares</option>
            <option value="novice"${playerPaymentFilters.status === 'novice' ? ' selected' : ''}>Novatos</option>
            <option value="guest"${playerPaymentFilters.status === 'guest' ? ' selected' : ''}>Convidados</option>
            <option value="disabled"${playerPaymentFilters.status === 'disabled' ? ' selected' : ''}>Desativados</option>
          </select>
        </div>
        ${playersHTML || '<div class="baba-empty">Cadastre jogadores para controlar a lista e os pagamentos mensais.</div>'}
      </div>
    `);
    applyPlayerPaymentFilters();
  }

  function applyPlayerPaymentFilters() {
    if (!els.playersAdminList) return;
    const query = String(playerPaymentFilters.query || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
    let visibleCount = 0;
    els.playersAdminList.querySelectorAll('[data-player-filter-row]').forEach((row) => {
      const matches = (!query || row.dataset.playerName.includes(query))
        && (playerPaymentFilters.payment === 'all' || row.dataset.playerPayment === playerPaymentFilters.payment)
        && (playerPaymentFilters.novice === 'all' || row.dataset.playerNovice === playerPaymentFilters.novice)
        && (playerPaymentFilters.status === 'all' || row.dataset.playerStatus === playerPaymentFilters.status);
      row.hidden = !matches;
      if (matches) visibleCount += 1;
    });
    const count = els.playersAdminList.querySelector('[data-player-filter-count]');
    if (count) count.textContent = `${visibleCount} de ${els.playersAdminList.querySelectorAll('[data-player-filter-row]').length} jogadores`;
  }

  function renderPresentList(baba) {
    const activePlayers = state.players
      .filter((player) => player.ativo)
      .sort((a, b) => (
        Number(isPlayerPaidThisMonth(b.id, baba)) - Number(isPlayerPaidThisMonth(a.id, baba))
        || String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR', { sensitivity: 'base' })
      ));
    const present = new Set(baba?.jogadoresPresentes || []);
    const assignedIds = new Set((baba?.teams || []).flatMap((team) => team.jogadores || []));
    const assignedPresentCount = [...present].filter((playerId) => assignedIds.has(playerId)).length;
    const pendingDrawCount = [...present].filter((playerId) => !assignedIds.has(playerId)).length;
    els.presentCountLabel.textContent = baba?.teams?.length
      ? `${assignedPresentCount} em times · ${pendingDrawCount} aguardando sorteio`
      : `${present.size} marcados para o primeiro sorteio`;
    if (els.continuePresentDraw) {
      els.continuePresentDraw.disabled = !isOrganizer() || !baba || (baba.teams?.length ? pendingDrawCount < 1 : present.size < 1);
      els.continuePresentDraw.innerHTML = baba?.teams?.length
        ? `<svg class="baba-btn-icon" aria-hidden="true"><use href="#baba-shuffle"></use></svg>Sortear recem-chegados${pendingDrawCount ? ` (${pendingDrawCount})` : ''}`
        : `<svg class="baba-btn-icon" aria-hidden="true"><use href="#baba-next"></use></svg>Revisar primeiro sorteio${present.size ? ` (${present.size})` : ''}`;
    }

    if (!activePlayers.length) {
      setHTML(els.presentList, '<div class="baba-empty">Cadastre jogadores para montar a lista de presença.</div>');
      return;
    }

    setHTML(els.presentList, activePlayers.map((player) => {
      const checked = present.has(player.id);
      const team = getPlayerTeam(baba, player.id);
      const arrivalStatus = checked && baba?.teams?.length
        ? (team ? team.name : 'Sem time - pronto para o novo time')
        : '';
      return `
        <label class="baba-present-item ${checked ? 'is-checked' : ''}"${teamNumberDataAttribute(team)}>
          <input type="checkbox" data-present-id="${player.id}" ${checked ? 'checked' : ''} ${!isOrganizer() ? 'disabled' : ''}>
          <span>
            <strong>${playerPaymentNameHTML(player.id, baba, { name: player.nome, force: Boolean(baba) })}</strong>
            ${player.tipo === 'goleiro' ? '<small>Goleiro</small>' : ''}
            ${arrivalStatus ? `<small>${escapeHTML(arrivalStatus)}</small>` : ''}
          </span>
        </label>
      `;
    }).join(''));
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

    setHTML(els.goalsSummary, `
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
    `);
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
      setHTML(els.goalsList, '<div class="baba-empty">Nenhuma meta cadastrada ainda. Use o painel do organizador para adicionar o primeiro produto.</div>');
      return;
    }

    setHTML(els.goalsList, goals.map((goal) => {
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
            <progress class="baba-goal-progress" max="100" value="${progress}" aria-label="Progresso da meta ${progress}%"></progress>
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
    }).join(''));
  }

  function renderPayments(baba) {
    if (!els.paymentSummary) return;

    const monthKey = currentPaymentMonthKey();
    const stats = getPaymentStats(baba);
    const pending = Math.max(0, stats.expected - stats.paid);
    const pendingCount = Math.max(0, stats.players - stats.paidCount);

    setHTML(els.paymentSummary, `
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
        <span>Vence dia ${PAYMENT_DUE_DAY}</span>
        <strong>${formatCurrency(pending)}</strong>
        <small>${pendingCount} faltando - ${paymentDueDateLabel(monthKey)}</small>
      </article>
    `);

    if (els.paymentList) setHTML(els.paymentList, '');
  }

  function exportTeamsTxt() {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba?.teams?.length) return showToast('Sorteie os times antes de exportar.');
    const lines = [
      'BABA PSYZON - TIMES E JOGADORES',
      `Data: ${reportContextLabel(baba)}`,
      '',
    ];
    (baba.teams || []).forEach((team) => {
      lines.push(String(team.name || 'Time').toUpperCase());
      const names = (team.jogadores || [])
        .map((playerId) => getBabaPlayer(baba, playerId)?.nome || playerName(playerId, baba))
        .filter(Boolean);
      if (names.length) names.forEach((name) => lines.push(`- ${name}`));
      else lines.push('- Sem jogadores');
      lines.push('');
    });
    const assigned = new Set((baba.teams || []).flatMap((team) => team.jogadores || []));
    const unassigned = [...(baba.jogadoresPresentes || []), ...(baba.visitantes || []).map((player) => player.id)]
      .filter((playerId, index, list) => !assigned.has(playerId) && list.indexOf(playerId) === index)
      .map((playerId) => getBabaPlayer(baba, playerId)?.nome || playerName(playerId, baba));
    if (unassigned.length) {
      lines.push('SEM TIME');
      unassigned.forEach((name) => lines.push(`- ${name}`));
      lines.push('');
    }
    lines.push('Formato preparado para identificação por IA em ficha manual.');

    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `times-baba-${baba.dataISO || todayISO()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Arquivo TXT dos times exportado.');
  }

  function renderTeams(baba) {
    if (!baba?.teams?.length) {
      setHTML(els.teamsGrid, '<div class="baba-card"><div class="baba-empty">Nenhum time sorteado ainda.</div></div>');
      return;
    }

    const index = Math.min(Math.max(Number(baba.teamRevealIndex || 0), 0), baba.teams.length - 1);
    const fullyRevealed = index >= baba.teams.length - 1;
    const lateArrivalCount = getUnassignedPresentPlayers(baba).length;
    const createLateTeamHTML = isOrganizer() ? `
      <button class="baba-secondary" type="button" data-action="export-teams-txt" title="Exportar nomes e times em TXT para identificação por IA">Exportar times em TXT</button>
      <button class="baba-secondary" type="button" data-action="create-late-team" ${lateArrivalCount ? '' : 'disabled'} title="${lateArrivalCount ? `Sortear somente ${lateArrivalCount} jogador${lateArrivalCount === 1 ? '' : 'es'} que ${lateArrivalCount === 1 ? 'chegou' : 'chegaram'} depois` : 'Marque os jogadores que chegaram depois como presentes'}">
        Sortear recem-chegados${lateArrivalCount ? ` (${lateArrivalCount})` : ''}
      </button>
    ` : '';

    const assignedIds = new Set((baba.teams || []).flatMap((team) => team.jogadores || []));
    const availablePlayers = [
      ...state.players.filter((player) => player.ativo && !assignedIds.has(player.id)),
      ...(baba.visitantes || []).filter((player) => player.ativo && !assignedIds.has(player.id)),
    ];
    const playerCardHTML = (team, playerId) => {
      const player = getBabaPlayer(baba, playerId);
      const typeLabel = player?.tipo === 'goleiro' ? 'Goleiro' : (player?.visitante ? 'Visitante' : 'Jogador');
      const playerCard = `
        <button class="baba-team-player-card" type="button" data-player-detail-id="${playerId}" data-player-detail-team-id="${team.id}" data-player-detail-baba-id="${baba.id}"${teamNumberDataAttribute(team)}>
          <span class="baba-team-player-card__identity">
            <strong>${playerNameWithStarsHTML(playerId, baba, { name: player?.nome || playerName(playerId, baba) })}</strong>
            <small>${typeLabel}</small>
          </span>
          <span class="baba-team-player-card__hint">${isOrganizer() ? 'Ver e gerenciar' : 'Ver desempenho'} ›</span>
        </button>
      `;
      if (!canManage || !isManualMode(baba)) return playerCard;
      const stats = getManualTeamStats(team);
      return `
        <div class="baba-manual-player-row">
          ${playerCard}
          ${manualCounterHTML({ teamId: team.id, babaId: baba.id, field: 'goals', playerId, value: stats.playerGoals[playerId] || 0, label: 'Gols' })}
        </div>
      `;
    };
    const addPlayerHTML = (team) => isOrganizer() ? `
      <div class="baba-roster-add">
        <strong>Adicionar jogador ao time</strong>
        <div class="baba-roster-add__controls">
          <select data-team-add-select="${team.id}" aria-label="Jogador para adicionar ao ${escapeHTML(team.name)}" ${availablePlayers.length ? '' : 'disabled'}>
          <option value="">${availablePlayers.length ? 'Selecione...' : 'Todos ja estao em times'}</option>
          ${availablePlayers.map((player) => `<option value="${player.id}">${escapeHTML(player.nome)}</option>`).join('')}
          </select>
          <button class="baba-secondary" type="button" data-action="add-player-to-team" data-team-id="${team.id}" ${availablePlayers.length ? '' : 'disabled'}>Adicionar</button>
        </div>
      </div>
    ` : '';

    const teamManagementHTML = (team) => {
      if (!isOrganizer() || baba.status === 'finalizado' || team.id === VISITOR_TEAM_ID || team.tipo === 'visitante') return '';
      const blocked = teamHasActiveRoute(baba, team.id);
      const blockedTitle = blocked ? 'Aguarde a partida ou o desempate deste time terminar' : '';
      return `
        <div class="baba-team__management">
          ${team.retiradoDoBaba ? '<span class="baba-team-status">Fora da fila - dados preservados</span>' : ''}
          <div class="baba-team__management-actions">
            <button class="baba-secondary" type="button" data-action="toggle-team-rotation" data-team-id="${team.id}" ${blocked ? 'disabled' : ''} title="${blockedTitle}">
              ${team.retiradoDoBaba ? 'Voltar para fila' : 'Retirar do baba'}
            </button>
            <button class="baba-mini-btn danger" type="button" data-action="delete-team-from-baba" data-team-id="${team.id}" ${blocked ? 'disabled' : ''} title="${blockedTitle}">Excluir time</button>
          </div>
        </div>
      `;
    };

    const hasStartedMatch = hasBabaStartedMatch(baba);
    const renderTeamCard = (team, position, { reveal = false } = {}) => `
      <article class="baba-team ${reveal ? 'baba-team--reveal' : ''} ${team.retiradoDoBaba ? 'is-withdrawn' : ''}"${teamNumberDataAttribute(team)}>
        <div>
          <small>${fullyRevealed ? (Number(team.drawBatch || 1) > 1 ? `Sorteio ${team.drawBatch} · recem-chegados` : 'Time sorteado') : `Time ${position + 1} de ${baba.teams.length}`}</small>
          <h3>${teamDetailButton(baba, team)}</h3>
        </div>
        ${hasStartedMatch ? `<div class="baba-team__stats">
          <span><b>${team.pontos}</b>Pts</span>
          <span><b>${team.vitorias}</b>Vit</span>
          <span><b>${team.empates}</b>Emp</span>
          <span><b>${team.golsPro - team.golsContra}</b>Saldo</span>
        </div>` : ''}
        <div class="baba-team__players">
          ${team.jogadores.map((id) => playerCardHTML(team, id)).join('') || '<span class="baba-empty">Sem jogadores</span>'}
        </div>
        ${addPlayerHTML(team)}
        ${teamManagementHTML(team)}
      </article>
    `;

    if (fullyRevealed) {
      const startLabel = baba.jogos?.length ? 'Iniciar partida' : 'Iniciar primeiro jogo';
      const startHTML = isOrganizer() && !baba.jogoAtual && getRotationTeams(baba).length >= 2 ? `<button class="baba-primary baba-start-game-btn" type="button" data-action="start-first-live">${startLabel}</button>` : '';
      const items = baba.teams.map((team, position) => ({
        key: `team:${team.id}`,
        signature: JSON.stringify({ team, availablePlayers, organizer: isOrganizer(), fullyRevealed }),
        html: renderTeamCard(team, position),
      }));
      items.push({
        key: 'team-actions:all',
        signature: `${Boolean(startHTML)}:${baba.status}:${lateArrivalCount}:${isOrganizer()}`,
        html: `<div class="baba-team-reveal-actions baba-team-reveal-actions--all">
          ${startHTML}
          ${createLateTeamHTML}
          <button class="baba-secondary" type="button" data-action="restart-team-reveal">Rever sorteio</button>
          <span>Todos os times foram revelados. Clique no nome de qualquer time para ver os jogadores.</span>
        </div>`,
      });
      reconcileKeyedChildren(els.teamsGrid, items);
      return;
    }

    const team = baba.teams[index];
    reconcileKeyedChildren(els.teamsGrid, [
      {
        key: `team:${team.id}`,
        signature: JSON.stringify({ team, availablePlayers, organizer: isOrganizer(), reveal: true }),
        html: renderTeamCard(team, index, { reveal: true }),
      },
      {
        key: 'team-actions:single',
        signature: `${index}:${baba.teams.length}:${lateArrivalCount}:${isOrganizer()}`,
        html: `<div class="baba-team-reveal-actions baba-team-reveal-actions--single">
        <button class="baba-primary" type="button" data-action="advance-team-reveal">Ver próximo time</button>
        ${createLateTeamHTML}
        <span>Avance para revelar o próximo time sorteado.</span>
        </div>`,
      },
    ]);
  }

  function teamVisualMeta(team) {
    if (team?.id === VISITOR_TEAM_ID || team?.tipo === 'visitante') {
      return { number: 'visitor', logo: '', accent: '#0a8f76', visitor: true };
    }
    const number = getTeamNumber(team) || 1;
    const visual = TEAM_VISUALS[(number - 1) % TEAM_VISUALS.length];
    const custom = window.BabaTeamTheme?.getTeam?.(number);
    return {
      number,
      logo: custom?.logo || team?.logo || visual.logo,
      accent: custom?.color || visual.accent,
      visitor: false,
    };
  }

  function teamShieldHTML(team, className = 'baba-team-result__shield') {
    const visual = teamVisualMeta(team);
    return visual.visitor
      ? `<span class="${className}"><svg aria-hidden="true" focusable="false"><use href="#baba-users"></use></svg></span>`
      : `<span class="${className}"><img src="${escapeHTML(visual.logo)}" alt="" loading="lazy"></span>`;
  }

  function drawCurrentStep(baba) {
    if (!baba || !(baba.jogadoresPresentes || []).length) return 1;
    if (!(baba.teams || []).length || drawExperience) return 2;
    if (!baba.jogoAtual && baba.status !== 'jogando' && baba.status !== 'finalizado') return 3;
    return 4;
  }

  function renderDrawProgress(baba) {
    if (!els.drawProgress) return;
    const steps = ['Jogadores presentes', 'Sorteio dos times', 'Conferência', isManualMode(baba) ? 'Atualizar estatísticas' : 'Iniciar jogos'];
    const current = drawCurrentStep(baba);
    setHTML(els.drawProgress, `
      <ol class="baba-draw-steps">
        ${steps.map((label, index) => {
          const step = index + 1;
          const complete = step < current || (baba?.status === 'finalizado' && step === current);
          return `<li class="baba-draw-step ${complete ? 'is-complete' : ''} ${step === current ? 'is-current' : ''}" ${step === current ? 'aria-current="step"' : ''}>
            <span class="baba-draw-step__marker">${complete ? '<svg aria-hidden="true"><use href="#baba-check"></use></svg>' : step}</span>
            <span>${label}</span>
          </li>`;
        }).join('')}
      </ol>
      <div class="baba-draw-progress__mobile">
        <div class="baba-draw-progress__mobile-copy"><span>${steps[current - 1]}</span><span>Etapa ${current} de 4</span></div>
        <progress class="baba-draw-progress__mobile-bar" max="4" value="${current}" aria-label="Progresso: etapa ${current} de 4"></progress>
      </div>
    `);
  }

  function renderDrawReadyPanel(baba) {
    if (!els.drawReadyPanel) return;
    const presentPlayers = (baba?.jogadoresPresentes || []).map(getPlayer).filter((player) => player?.ativo);
    const fieldPlayers = presentPlayers.filter((player) => player.tipo !== 'goleiro');
    const goalkeepers = presentPlayers.filter((player) => player.tipo === 'goleiro');
    const estimatedTeams = Math.min(TEAM_NAMES.length, Math.max(2, Math.ceil(fieldPlayers.length / 4)));
    const canDraw = Boolean(baba && baba.status !== 'finalizado' && presentPlayers.length >= 2 && fieldPlayers.length >= 8);
    let warning = '';
    if (!baba) warning = 'Crie o baba de hoje antes de montar os times.';
    else if (presentPlayers.length < 2) warning = 'Marque pelo menos 2 jogadores presentes para continuar.';
    else if (fieldPlayers.length < 8) warning = `Faltam ${8 - fieldPlayers.length} jogador${8 - fieldPlayers.length === 1 ? '' : 'es'} de linha para completar os dois primeiros times.`;
    else if (!goalkeepers.length) warning = 'Nenhum goleiro esta marcado. O sorteio pode continuar sem alterar as regras atuais.';

    const selectedMode = normalizeMatchMode(baba?.matchMode);
    const modeLocked = Boolean((baba?.teams || []).length || (baba?.jogos || []).length || baba?.jogoAtual);
    setHTML(els.drawReadyPanel, `
      <div class="baba-draw-ready__content">
        <span class="baba-draw-ready__icon"><svg aria-hidden="true"><use href="#baba-shuffle"></use></svg></span>
        <h2>Tudo pronto para o sorteio</h2>
        <p>Revise os numeros abaixo. A distribuicao dos jogadores e dos goleiros segue exatamente as regras atuais do baba.</p>
        <div class="baba-draw-ready__metrics">
          <span class="baba-draw-ready__metric"><strong>${presentPlayers.length}</strong>Presentes</span>
          <span class="baba-draw-ready__metric"><strong>${estimatedTeams}</strong>Times</span>
          <span class="baba-draw-ready__metric"><strong>${goalkeepers.length}</strong>Goleiros</span>
        </div>
        <div class="baba-match-mode-card">
          <div>
            <strong>Modo de Anotacao</strong>
            <small>Escolha antes do sorteio como este baba sera registrado.</small>
          </div>
          <div class="baba-match-mode-options" role="radiogroup" aria-label="Modo de anotacao">
            <button type="button" data-action="set-match-mode" data-match-mode="ONLINE" aria-pressed="${selectedMode === MATCH_MODES.ONLINE}" ${modeLocked ? 'disabled' : ''}>
              <span>${selectedMode === MATCH_MODES.ONLINE ? '●' : '○'}</span>
              <strong>Pelo Site</strong>
              <small>Registrar placares e gols durante cada partida.</small>
            </button>
            <button type="button" data-action="set-match-mode" data-match-mode="MANUAL" aria-pressed="${selectedMode === MATCH_MODES.MANUAL}" ${modeLocked ? 'disabled' : ''}>
              <span>${selectedMode === MATCH_MODES.MANUAL ? '●' : '○'}</span>
              <strong>Manual (Papel/PDF)</strong>
              <small>Anotar no papel e atualizar estatisticas finais no Ao Vivo.</small>
            </button>
          </div>
        </div>
        ${warning ? `<div class="baba-draw-ready__notice" role="note">${escapeHTML(warning)}</div>` : ''}
        ${isOrganizer() ? `<button class="baba-draw-ready__button" type="button" data-action="begin-team-draw" ${canDraw ? '' : 'disabled'}>
          <svg aria-hidden="true"><use href="#baba-shuffle"></use></svg><span>Sortear times</span>
        </button>` : '<div class="baba-draw-ready__notice" role="note">Aguardando o organizador iniciar o sorteio.</div>'}
      </div>
    `);
  }

  function playerResultRowHTML(baba, team, playerId) {
    const player = getBabaPlayer(baba, playerId);
    const name = player?.nome || playerName(playerId, baba);
    const goalkeeper = player?.tipo === 'goleiro';
    const position = goalkeeper ? 'Goleiro' : (player?.visitante ? 'Visitante' : 'Jogador de linha');
    return `
      <button class="baba-team-player-card" type="button" data-player-detail-id="${playerId}" data-player-detail-team-id="${team.id}" data-player-detail-baba-id="${baba.id}"${teamNumberDataAttribute(team)} aria-label="Abrir detalhes de ${escapeHTML(name)}">
        <span class="baba-player-row__avatar" aria-hidden="true">${escapeHTML(playerInitials(name))}</span>
        <span class="baba-player-row__copy"><strong>${playerNameWithStarsHTML(playerId, baba, { name })}</strong><small>${position}</small></span>
        ${goalkeeper
          ? '<span class="baba-goalkeeper-badge"><svg aria-hidden="true"><use href="#baba-shield"></use></svg>GOLEIRO</span>'
          : '<span class="baba-player-row__chevron" aria-hidden="true">›</span>'}
      </button>
    `;
  }

  function teamResultCardHTML(baba, team) {
    const playerCount = (team.jogadores || []).length;
    const canManage = isOrganizer() && baba.status !== 'finalizado';
    const hasStartedMatch = hasBabaStartedMatch(baba);
    const playerCountText = hasStartedMatch
      ? `<span>${playerCount} jogador${playerCount === 1 ? '' : 'es'}${team.retiradoDoBaba ? ' · fora da fila' : ''}</span>`
      : (team.retiradoDoBaba ? '<span>Fora da fila</span>' : '');
    return `
      <article class="baba-team ${team.retiradoDoBaba ? 'is-withdrawn' : ''} ${team.id === recentlyRevealedTeamId ? 'is-recently-revealed' : ''}" tabindex="0"${teamNumberDataAttribute(team)} aria-label="${escapeHTML(team.name)}">
        <header class="baba-team-result__header">
          ${teamShieldHTML(team)}
          <span class="baba-team-result__identity">
            <small>${Number(team.drawBatch || 1) > 1 ? `Sorteio ${team.drawBatch} · recem-chegados` : 'Time sorteado'}</small>
            <strong>${escapeHTML(team.name)}</strong>
            ${playerCountText}
          </span>
          ${canManage ? `<button class="baba-team-menu-button" type="button" data-action="open-team-management" data-team-id="${team.id}" aria-label="Editar elenco do ${escapeHTML(team.name)}" title="Editar elenco">
            <svg aria-hidden="true" focusable="false"><use href="#baba-dots"></use></svg>
          </button>` : ''}
        </header>
        ${hasStartedMatch ? `<div class="baba-team__stats" aria-label="Estatisticas do ${escapeHTML(team.name)}">
          <span><b>${Number(team.pontos || 0)}</b>Pontos</span>
          <span><b>${Number(team.vitorias || 0)}</b>Vitórias</span>
          <span><b>${Number(team.empates || 0)}</b>Empates</span>
          <span><b>${Number(team.golsPro || 0) - Number(team.golsContra || 0)}</b>Saldo</span>
        </div>` : ''}
        <div class="baba-team__players">
          ${(team.jogadores || []).map((id) => playerResultRowHTML(baba, team, id)).join('') || '<span class="baba-empty">Sem jogadores neste time.</span>'}
        </div>
      </article>
    `;
  }

  function emptyTeamPlaceholderHTML(position) {
    return `
      <article class="baba-team-placeholder" aria-label="Time ${position + 1} aguardando sorteio">
        <span class="baba-team-placeholder__shield"><svg aria-hidden="true"><use href="#baba-shuffle"></use></svg></span>
        <strong>Time ${position + 1}</strong>
        <small>Aguardando sorteio</small>
        <span class="baba-team-placeholder__skeleton" aria-hidden="true"><i></i><i></i><i></i></span>
      </article>
    `;
  }

  function renderDrawActionBars(baba) {
    if (!els.drawActionBar || !els.drawSecondaryControls) return;
    const hasTeams = Boolean((baba?.teams || []).length);
    els.drawActionBar.classList.toggle('hidden', !hasTeams);
    els.drawSecondaryControls.classList.toggle('hidden', !hasTeams);
    if (!hasTeams) {
      setHTML(els.drawActionBar, '');
      setHTML(els.drawSecondaryControls, '');
      return;
    }

    const lateArrivalCount = getUnassignedPresentPlayers(baba).length;
    const manual = isManualMode(baba);
    const canStart = isOrganizer() && !manual && baba.status !== 'finalizado' && !baba.jogoAtual && !baba.pendingTieBreak && getRotationTeams(baba).length >= 2 && !drawExperience;
    const startLabel = baba.jogos?.length ? 'Iniciar partida' : 'Iniciar primeiro jogo';
    setHTML(els.drawActionBar, `
      <div class="baba-draw-action-bar__secondary">
        <button type="button" data-action="open-present-editor"><svg aria-hidden="true"><use href="#baba-users"></use></svg>Editar jogadores</button>
        <button type="button" data-action="create-late-team" ${lateArrivalCount && !drawExperience ? '' : 'disabled'} title="${lateArrivalCount ? `Sortear somente ${lateArrivalCount} jogador(es) presente(s) e sem time` : 'Nenhum jogador presente esta sem time'}"><svg aria-hidden="true"><use href="#baba-shuffle"></use></svg>Sortear recem-chegados${lateArrivalCount ? ` (${lateArrivalCount})` : ''}</button>
      </div>
      <div class="baba-draw-action-bar__primary">
        ${manual
          ? '<button class="baba-draw-action-bar__start is-available" type="button" data-action="open-dashboard"><svg class="baba-btn-icon" aria-hidden="true"><use href="#baba-table-icon"></use></svg>Atualizar estatisticas</button>'
          : `<button class="baba-draw-action-bar__start ${canStart ? 'is-available' : ''}" type="button" data-action="start-first-live" ${canStart ? '' : 'disabled'}><svg class="baba-btn-icon" aria-hidden="true"><use href="#baba-play"></use></svg>${baba.jogoAtual ? 'Jogo em andamento' : startLabel}</button>`}
      </div>
    `);
    setHTML(els.drawSecondaryControls, `
      <span class="baba-draw-secondary__status"><i aria-hidden="true"></i><span>${baba.status === 'finalizado' ? 'Baba salvo no histórico.' : 'Resultado atual preservado e sincronizado automaticamente.'}</span></span>
      <span>${lateArrivalCount ? `${lateArrivalCount} jogador${lateArrivalCount === 1 ? '' : 'es'} ainda ${lateArrivalCount === 1 ? 'esta' : 'estao'} sem time.` : 'Todos os presentes estao distribuidos.'}</span>
    `);
  }

  function renderDrawOverlay(baba) {
    const experience = drawExperience;
    if (!els.drawOverlay || !experience || experience.babaId !== baba?.id) {
      els.drawOverlay?.classList.add('hidden');
      document.body.classList.remove('baba-draw-modal-open');
      return;
    }

    const team = baba.teams[experience.currentIndex];
    if (!team) return finalizeDrawExperience();
    const visual = teamVisualMeta(team);
    const firstIndex = Number(experience.firstIndex || 0);
    const lastIndex = Number.isFinite(experience.lastIndex) ? experience.lastIndex : baba.teams.length - 1;
    const total = Math.max(1, lastIndex - firstIndex + 1);
    const batchPosition = experience.currentIndex - firstIndex;
    const playerIds = team.jogadores || [];
    const shownPlayerIds = playerIds.slice(0, experience.visiblePlayers);
    const teamProgress = experience.phase === 'complete'
      ? 1
      : experience.phase === 'reveal' && playerIds.length ? experience.visiblePlayers / playerIds.length : experience.phase === 'shuffle' ? .35 : .08;
    const overallProgress = ((batchPosition + teamProgress) / total) * 100;

    els.drawOverlay.classList.remove('hidden');
    document.body.classList.add('baba-draw-modal-open');
    els.drawOverlay.dataset.teamNumber = String(visual.number);
    els.drawOverlayStep.textContent = `Sorteando time ${batchPosition + 1} de ${total}`;
    els.drawOverlayProgressBar.value = Math.max(2, overallProgress);
    els.drawSkipButton.classList.toggle('hidden', experience.phase === 'complete');
    els.drawCloseButton.classList.toggle('hidden', experience.phase !== 'complete');
    els.drawSoundToggle.setAttribute('aria-pressed', String(drawSoundEnabled));
    els.drawSoundToggle.setAttribute('aria-label', drawSoundEnabled ? 'Desativar sons do sorteio' : 'Ativar sons do sorteio');
    els.drawSoundToggle.title = drawSoundEnabled ? 'Desativar sons' : 'Ativar sons';

    if (experience.phase === 'countdown') {
      els.drawOverlayTitle.textContent = 'Preparando o sorteio';
      els.drawOverlayDescription.textContent = 'A distribuicao ja foi concluida com seguranca. Agora vamos revelar o resultado.';
      setHTML(els.drawOverlayContent, `<div class="baba-draw-countdown"><strong>${experience.countdown}</strong></div>`);
      setHTML(els.drawOverlayActions, '');
      return;
    }

    if (experience.phase === 'shuffle') {
      const chips = shuffle(playerIds.map((id) => playerName(id, baba))).slice(0, 8);
      els.drawOverlayTitle.textContent = 'Embaralhando jogadores';
      els.drawOverlayDescription.textContent = `Definindo a apresentacao do ${team.name}.`;
      setHTML(els.drawOverlayContent, `
        <div class="baba-draw-shuffle">
          <span class="baba-draw-shuffle__ball"><svg aria-hidden="true"><use href="#baba-ball"></use></svg></span>
          <div class="baba-draw-shuffle__chips">${chips.map((name) => `<span>${escapeHTML(name)}</span>`).join('')}</div>
        </div>
      `);
      setHTML(els.drawOverlayActions, '');
      return;
    }

    els.drawOverlayTitle.textContent = experience.phase === 'complete' ? `${team.name} confirmado` : `${team.name} sorteado`;
    els.drawOverlayDescription.textContent = `${shownPlayerIds.length} de ${playerIds.length} jogadores revelados.`;
    setHTML(els.drawOverlayContent, `
      <div class="baba-draw-reveal">
        <div class="baba-draw-reveal__team">
          ${teamShieldHTML(team, 'baba-draw-reveal__shield')}
          <small>Time sorteado</small>
          <strong>${escapeHTML(team.name)}</strong>
        </div>
        <div class="baba-draw-reveal__players">
          ${shownPlayerIds.map((playerId) => {
            const player = getBabaPlayer(baba, playerId);
            const name = player?.nome || playerName(playerId, baba);
            const goalkeeper = player?.tipo === 'goleiro';
            return `<div class="baba-draw-reveal-player ${goalkeeper ? 'is-goalkeeper' : ''}">
              <span class="baba-draw-reveal-player__avatar">${escapeHTML(playerInitials(name))}</span>
              <span class="baba-draw-reveal-player__copy"><strong>${playerNameWithStarsHTML(playerId, baba, { name })}</strong><small>${goalkeeper ? 'Goleiro' : (player?.visitante ? 'Visitante' : 'Jogador de linha')}</small></span>
              ${goalkeeper ? '<span class="baba-goalkeeper-badge"><svg aria-hidden="true"><use href="#baba-shield"></use></svg>GOLEIRO</span>' : '<svg width="16" height="16" aria-hidden="true"><use href="#baba-check"></use></svg>'}
            </div>`;
          }).join('')}
        </div>
        ${experience.phase === 'complete' ? '<div class="baba-draw-reveal__celebration"><svg aria-hidden="true"><use href="#baba-check"></use></svg>Time confirmado</div>' : ''}
      </div>
    `);
    setHTML(els.drawOverlayActions, experience.phase === 'complete' ? `
      <button class="is-primary" type="button" data-action="${experience.currentIndex === lastIndex ? 'finish-draw-experience' : 'advance-draw-experience'}">
        <svg class="baba-btn-icon" aria-hidden="true"><use href="#${experience.currentIndex === lastIndex ? 'baba-check' : 'baba-next'}"></use></svg>
        ${experience.currentIndex === lastIndex ? 'Conferir resultado' : 'Ver próximo time'}
      </button>
    ` : '');
  }

  function renderDrawTeams(baba) {
    const hasTeams = Boolean((baba?.teams || []).length);
    const isDrawing = Boolean(drawExperience && drawExperience.babaId === baba?.id);
    const revealedIds = isDrawing ? drawExperience.revealedTeamIds : new Set((baba?.teams || []).map((team) => team.id));
    const revealedCount = revealedIds.size;

    renderDrawProgress(baba);
    els.drawReadyPanel?.classList.toggle('hidden', hasTeams);
    els.drawResultsSection?.classList.toggle('hidden', !hasTeams);
    if (!hasTeams) renderDrawReadyPanel(baba);

    if (els.drawStatusDescription) {
      els.drawStatusDescription.textContent = !hasTeams
        ? 'Marque os presentes e prepare o sorteio dos times.'
        : isDrawing
          ? `Revelando o time ${drawExperience.currentIndex + 1} de ${baba.teams.length}.`
          : baba.status === 'finalizado'
            ? 'Resultado salvo no histórico do baba.'
            : isManualMode(baba)
              ? 'Confira os jogadores e atualize as estatísticas no Ao Vivo.'
              : 'Confira os jogadores antes de iniciar o primeiro jogo.';
    }
    if (els.drawTeamsProgress) els.drawTeamsProgress.textContent = `${revealedCount} de ${baba?.teams?.length || 0} times sorteados`;
    if (els.drawReviewButton) els.drawReviewButton.classList.toggle('hidden', !hasTeams || isDrawing);
    if (els.drawSaveButton) {
      const canSave = isOrganizer() && hasTeams && baba.status !== 'finalizado' && !isDrawing;
      els.drawSaveButton.disabled = !canSave;
      els.drawSaveButton.setAttribute('aria-disabled', String(!canSave));
    }
    if (els.drawSaveState && baba?.status === 'finalizado') {
      els.drawSaveState.textContent = 'Salvo com sucesso';
      els.drawSaveState.className = 'baba-save-state is-success';
    } else if (els.drawSaveState && !els.drawSaveState.classList.contains('is-saving')) {
      els.drawSaveState.textContent = '';
      els.drawSaveState.className = 'baba-save-state';
    }

    if (hasTeams) {
      const items = baba.teams.map((team, position) => {
        const revealed = revealedIds.has(team.id);
        return {
          key: `draw-team:${team.id}`,
          signature: JSON.stringify({ team, revealed, organizer: isOrganizer(), recent: team.id === recentlyRevealedTeamId }),
          html: revealed ? teamResultCardHTML(baba, team) : emptyTeamPlaceholderHTML(position),
        };
      });
      reconcileKeyedChildren(els.teamsGrid, items);
    } else {
      reconcileKeyedChildren(els.teamsGrid, []);
    }

    renderDrawActionBars(baba);
    renderDrawOverlay(baba);
  }

  function waitForDrawStep(milliseconds, token) {
    return new Promise((resolve) => window.setTimeout(() => resolve(token === drawSequenceToken), milliseconds));
  }

  function refreshDrawExperience() {
    const baba = getActiveBaba();
    if (baba) renderDrawTeams(baba);
  }

  function playDrawTone(frequency = 480, duration = .05) {
    if (!drawSoundEnabled) return;
    try {
      babaAudioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = babaAudioContext.createOscillator();
      const gain = babaAudioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, babaAudioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.035, babaAudioContext.currentTime + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, babaAudioContext.currentTime + duration);
      oscillator.connect(gain).connect(babaAudioContext.destination);
      oscillator.start();
      oscillator.stop(babaAudioContext.currentTime + duration + .01);
    } catch (error) {
      drawSoundEnabled = false;
      localStorage.setItem(DRAW_SOUND_KEY, 'false');
    }
  }

  async function runDrawExperience(token = drawSequenceToken) {
    const experience = drawExperience;
    const baba = getActiveBaba();
    if (!experience || !baba || experience.babaId !== baba.id || token !== drawSequenceToken) return;
    const team = baba.teams[experience.currentIndex];
    if (!team) return finalizeDrawExperience();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      if (!reducedMotion) {
        for (let count = 3; count >= 1; count -= 1) {
          if (!drawExperience || token !== drawSequenceToken) return;
          experience.phase = 'countdown';
          experience.countdown = count;
          refreshDrawExperience();
          playDrawTone(320 + (3 - count) * 70, .045);
          if (!(await waitForDrawStep(520, token))) return;
        }
        experience.phase = 'shuffle';
        refreshDrawExperience();
        if (!(await waitForDrawStep(1650, token))) return;
      }

      experience.phase = 'reveal';
      experience.visiblePlayers = 0;
      refreshDrawExperience();
      const playerIds = team.jogadores || [];
      for (let index = 0; index < playerIds.length; index += 1) {
        if (!drawExperience || token !== drawSequenceToken) return;
        experience.visiblePlayers = index + 1;
        const player = getBabaPlayer(baba, playerIds[index]);
        if (els.drawOverlayAnnouncer) els.drawOverlayAnnouncer.textContent = `${player?.nome || playerName(playerIds[index], baba)} sorteado para ${team.name}.`;
        playDrawTone(player?.tipo === 'goleiro' ? 660 : 520, .055);
        refreshDrawExperience();
        if (!reducedMotion && !(await waitForDrawStep(190, token))) return;
      }

      experience.phase = 'complete';
      experience.revealedTeamIds.add(team.id);
      recentlyRevealedTeamId = team.id;
      if (els.drawAnnouncer) els.drawAnnouncer.textContent = `${team.name} revelado com ${playerIds.length} jogadores.`;
      playDrawTone(760, .11);
      refreshDrawExperience();
    } catch (error) {
      console.error('Falha apenas na apresentacao do sorteio:', error);
      experience.visiblePlayers = (team.jogadores || []).length;
      experience.phase = 'complete';
      experience.revealedTeamIds.add(team.id);
      refreshDrawExperience();
      showToast('A animacao foi abreviada. O resultado do sorteio foi preservado.');
    }
  }

  function beginDrawExperience(baba = getActiveBaba(), { review = false, startIndex = 0 } = {}) {
    if (!baba?.teams?.length) return;
    const firstIndex = Math.min(Math.max(Number(startIndex || 0), 0), baba.teams.length - 1);
    drawSequenceToken += 1;
    drawExperience = {
      babaId: baba.id,
      currentIndex: firstIndex,
      firstIndex,
      lastIndex: baba.teams.length - 1,
      phase: 'countdown',
      countdown: 3,
      visiblePlayers: 0,
      revealedTeamIds: new Set(baba.teams.slice(0, firstIndex).map((team) => team.id)),
      opener: document.activeElement,
      review,
    };
    recentlyRevealedTeamId = null;
    renderDrawTeams(baba);
    const token = drawSequenceToken;
    window.requestAnimationFrame(() => {
      els.drawOverlayPanel?.focus({ preventScroll: true });
      runDrawExperience(token);
    });
  }

  function skipDrawAnimation() {
    const baba = getActiveBaba();
    if (!drawExperience || !baba) return;
    const team = baba.teams[drawExperience.currentIndex];
    if (!team) return;
    drawSequenceToken += 1;
    drawExperience.visiblePlayers = (team.jogadores || []).length;
    drawExperience.phase = 'complete';
    drawExperience.revealedTeamIds.add(team.id);
    recentlyRevealedTeamId = team.id;
    if (els.drawOverlayAnnouncer) els.drawOverlayAnnouncer.textContent = `Animacao pulada. ${team.name} revelado.`;
    refreshDrawExperience();
  }

  function advanceDrawExperience() {
    const baba = getActiveBaba();
    if (!drawExperience || !baba || drawExperience.phase !== 'complete') return;
    if (drawExperience.currentIndex >= drawExperience.lastIndex) return finalizeDrawExperience();
    drawSequenceToken += 1;
    drawExperience.currentIndex += 1;
    drawExperience.phase = 'countdown';
    drawExperience.countdown = 3;
    drawExperience.visiblePlayers = 0;
    refreshDrawExperience();
    const token = drawSequenceToken;
    window.requestAnimationFrame(() => runDrawExperience(token));
  }

  function finalizeDrawExperience() {
    const experience = drawExperience;
    if (!experience) return;
    const opener = experience.opener;
    const baba = getActiveBaba();
    drawSequenceToken += 1;
    drawExperience = null;
    recentlyRevealedTeamId = baba?.teams?.[baba.teams.length - 1]?.id || recentlyRevealedTeamId;
    els.drawOverlay?.classList.add('hidden');
    document.body.classList.remove('baba-draw-modal-open');
    if (baba) renderDrawTeams(baba);
    if (els.drawAnnouncer) els.drawAnnouncer.textContent = 'Sorteio concluido. Todos os times estao disponiveis para conferencia.';
    window.requestAnimationFrame(() => {
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      else els.drawReviewButton?.focus({ preventScroll: true });
    });
  }

  function closeDrawExperience() {
    if (!drawExperience) return;
    if (drawExperience.phase !== 'complete') {
      if (els.drawOverlayAnnouncer) els.drawOverlayAnnouncer.textContent = 'Aguarde a revelacao terminar ou use Pular animacao.';
      return;
    }
    finalizeDrawExperience();
  }

  function toggleDrawSound() {
    drawSoundEnabled = !drawSoundEnabled;
    localStorage.setItem(DRAW_SOUND_KEY, String(drawSoundEnabled));
    if (drawSoundEnabled) {
      playDrawTone(540, .08);
      babaAudioContext?.resume?.().catch?.(() => {});
    }
    refreshDrawExperience();
  }

  function renderStandings(baba) {
    if (!baba?.teams?.length) {
      setHTML(els.standingsList, '<div class="baba-empty">Sorteie os times para ver a tabela.</div>');
      setHTML(els.tableTopScorers, '');
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

    const manual = isManualMode(baba);
    setHTML(els.standingsList, `
      <div class="baba-table baba-standings-table ${manual ? 'is-manual' : ''}" role="table" aria-label="Classificação dos times" aria-rowcount="${teams.length + 1}">
        <div class="baba-table__row baba-table__head" role="row">
          <span role="columnheader" title="Posição">Pos</span>
          <span role="columnheader">Time</span>
          <span role="columnheader" title="Pontos">Pts</span>
          <span role="columnheader" title="Gols pro">GP</span>
          ${manual ? '' : '<span role="columnheader" title="Saldo de gols">SG</span>'}
          <span role="columnheader" title="Vitórias">V</span>
          <span role="columnheader" title="Empates">E</span>
          <span role="columnheader" title="Derrotas">D</span>
        </div>
        ${teams.map((team, index) => `
          <div class="baba-table__row ${team.isLive ? 'is-live' : ''} ${index === 0 ? 'is-first baba-gold-leader' : ''} ${teams.length > 1 && index === teams.length - 1 ? 'is-last' : ''}"${teamNumberDataAttribute(team)} role="row" aria-label="${escapeHTML(team.name)}, ${index + 1}º lugar, ${team.pontos} pontos">
            <span class="baba-position-label" role="cell">
              <b class="baba-position-badge ${index === 0 ? 'is-first' : ''} ${teams.length > 1 && index === teams.length - 1 ? 'is-last' : ''}" title="${teams.length > 1 && index === teams.length - 1 ? 'Último colocado' : `${index + 1}º colocado`}">${index + 1}º</b>
            </span>
            <span class="baba-standings-team" role="cell">
              ${teamDetailButton(baba, team)}
              ${team.isLive ? '<small class="baba-standings-live">Em jogo</small>' : ''}
            </span>
            <span class="baba-standings-stat baba-standings-stat--points" role="cell" aria-label="Pontos">
              <small aria-hidden="true">Pts</small><strong>${team.pontos}</strong>
            </span>
            <span class="baba-standings-stat baba-standings-stat--goals" role="cell" aria-label="Gols pro">
              <small aria-hidden="true">GP</small><strong>${team.golsPro}</strong>
            </span>
            ${manual ? '' : `<span class="baba-standings-stat baba-standings-stat--balance" role="cell" aria-label="Saldo de gols">
              <small aria-hidden="true">SG</small><strong>${team.saldo > 0 ? '+' : ''}${team.saldo}</strong>
            </span>`}
            <span class="baba-standings-stat baba-standings-stat--wins" role="cell" aria-label="Vitórias">
              <small aria-hidden="true">V</small><strong>${team.vitorias}</strong>
            </span>
            <span class="baba-standings-stat baba-standings-stat--draws" role="cell" aria-label="Empates">
              <small aria-hidden="true">E</small><strong>${team.empates}</strong>
            </span>
            <span class="baba-standings-stat baba-standings-stat--losses" role="cell" aria-label="Derrotas">
              <small aria-hidden="true">D</small><strong>${team.derrotas}</strong>
            </span>
          </div>
        `).join('')}
      </div>
      <p class="baba-standings-legend"><b>Pts</b> pontos <span>•</span> <b>GP</b> gols pro <span>•</span> <b>SG</b> saldo <span>•</span> <b>V</b> vitorias <span>•</span> <b>E</b> empates <span>•</span> <b>D</b> derrotas</p>
    `);
    renderTableTopScorers(baba);
  }

  function renderTableTopScorers(baba) {
    if (!els.tableTopScorers) return;
    const top = getDailyRankingList(baba)
      .filter((stats) => stats.totalGols > 0)
      .slice(0, 4);
    if (!top.length) {
      setHTML(els.tableTopScorers, `
        <div class="baba-table-scorers__head">
          <span>Top 4 artilheiros</span>
          <small>Baba atual</small>
        </div>
        <div class="baba-empty">Sem gols registrados na tabela.</div>
      `);
      return;
    }
    setHTML(els.tableTopScorers, `
      <div class="baba-table-scorers__head">
        <span>Top 4 artilheiros</span>
        <small>Baba atual</small>
      </div>
      <div class="baba-table-scorer-grid">
        ${top.map((stats, index) => `
          <div class="baba-table-scorer ${index === 0 ? 'is-first baba-gold-leader' : ''}"${teamNumberDataAttribute(getPlayerTeam(baba, stats.jogadorId))}>
            <span>${index + 1}º lugar</span>
            <strong>${playerPaymentNameHTML(stats.jogadorId, baba, { name: stats.nome, force: Boolean(baba) })}</strong>
            <span>${stats.totalGols} gol${stats.totalGols === 1 ? '' : 's'}</span>
          </div>
        `).join('')}
      </div>
    `);
  }

  function getSortedGeneralRanking() {
    return sortRanking(calculateGeneralRanking(), 'goals');
  }

  function getDailyRankingList(baba, metric = 'goals') {
    const ranking = calculateCurrentBabaRanking(baba);
    if (metric !== 'stars') return sortRanking(ranking, metric);
    const ratingMap = performanceMap(Object.values(ranking), {
      completedBabas: baba?.status === 'finalizado' ? 1 : 0,
      cacheKey: `daily-ranking-${baba?.id || 'none'}`,
    });
    return sortRanking(ranking, metric, ratingMap, baba);
  }

  function calculateCurrentBabaRanking(baba) {
    const ranking = calculateDailyRanking(baba || { jogadoresPresentes: [], jogos: [], teams: [] });
    if (isManualMode(baba)) return ranking;
    const liveEvents = baba?.jogoAtual?.goalEvents || [];
    liveEvents.forEach((goal) => {
      if (!goal?.jogadorId || goal.external) return;
      ensureStats(ranking, goal.jogadorId, baba).totalGols += 1;
    });
    Object.values(ranking).forEach(finalizeStats);
    return ranking;
  }

  function renderDailyTopScorers(baba) {
    const top = getDailyRankingList(baba, 'goals')
      .filter((stats) => stats.totalGols > 0);
    if (!top.length) {
      setHTML(els.dailyTopScorers, '<div class="baba-empty">Sem gols no baba atual.</div>');
      return;
    }
    setHTML(els.dailyTopScorers, renderRankingList(top, 'Sem gols no baba atual.', {
      compact: true,
      expandKey: 'daily-top-scorers',
      limit: 4,
    }));
  }

  function renderCurrentGames(baba) {
    if (els.currentGamesTitleLabel) {
      els.currentGamesTitleLabel.textContent = baba?.status === 'finalizado' ? 'Histórico do último baba' : 'Histórico do baba atual';
    }
    if (baba?.status === 'finalizado' && !baba.__detailLoaded && window.BabaRepository?.loadBaba) {
      setHTML(els.currentGamesList, '<div class="baba-empty">Carregando o ultimo baba...</div>');
      if (!loadingHistoryIds.has(baba.id)) {
        loadingHistoryIds.add(baba.id);
        window.BabaRepository.loadBaba(baba.id)
          .catch((error) => showToast(error.message || 'Nao foi possivel carregar o ultimo baba.'))
          .finally(() => loadingHistoryIds.delete(baba.id));
      }
      return;
    }
    if (isManualMode(baba)) {
      ensureManualStats(baba);
      const teams = baba?.teams || [];
      if (!teams.length) {
        setHTML(els.currentGamesList, '<div class="baba-empty">Sorteie os times para ver o resumo manual.</div>');
        return;
      }
      setHTML(els.currentGamesList, teams.map((team) => {
        const stats = getManualTeamStats(team);
        const goals = manualTeamGoals(team);
        return `
          <div class="baba-history-item baba-history-item--compact"${teamNumberDataAttribute(team)}>
            <div>
              <strong>${teamDetailButton(baba, team)}</strong>
              <small>V:${stats.wins} E:${stats.draws} D:${stats.losses} - ${goals} gol${goals === 1 ? '' : 's'}</small>
            </div>
          </div>
        `;
      }).join(''));
      return;
    }

    const games = baba?.jogos || [];
    if (!games.length) {
      setHTML(els.currentGamesList, '<div class="baba-empty">Nenhum jogo finalizado neste baba.</div>');
      return;
    }
    setHTML(els.currentGamesList, games.slice().reverse().map((game) => `
      <div class="baba-history-item baba-history-item--compact baba-current-history-game match-row">
        <div class="baba-current-history-game__main match-row__teams">
          <div class="baba-current-history-game__meta match-row__meta">
            <span>Jogo ${game.numeroJogo}</span>
            <small>${formatTime(game.finalizadoEm)}</small>
          </div>
          <strong class="baba-current-history-game__match">${matchLineHTML(baba, getTeam(baba, game.timeA), game.placarA, game.placarB, getTeam(baba, game.timeB), true)}</strong>
        </div>
        <div class="baba-current-history-game__actions match-row__actions">
          <button class="baba-mini-btn" type="button" data-current-game="${game.numeroJogo}">
            <svg class="baba-btn-icon" aria-hidden="true" focusable="false"><use href="#baba-ball"></use></svg>Gols
          </button>
          ${isOrganizer() && (baba?.status === 'finalizado' || baba?.id === state.activeBabaId) ? `<button class="baba-mini-btn" type="button" data-action="edit-current-game" data-game-number="${game.numeroJogo}" data-baba-id="${escapeHTML(baba.id)}">Editar</button>` : ''}
          ${isOrganizer() && baba?.status !== 'finalizado' && baba?.id === state.activeBabaId ? `<button class="baba-mini-btn danger" type="button" data-action="delete-current-game" data-game-number="${game.numeroJogo}">Excluir</button>` : ''}
        </div>
      </div>
    `).join(''));
  }

  function openTeamDetail(teamId, babaId = null) {
    const baba = getBabaById(babaId) || getActiveBaba();
    const team = getTeam(baba, teamId);
    if (!team) return;

    teamDetailOpener = document.activeElement;
    selectedTeamDetail = { teamId: team.id, babaId: baba.id };
    els.teamDetailModal.classList.remove('hidden');
    renderOpenTeamDetail();
    window.requestAnimationFrame(() => els.teamDetailModal.querySelector('.baba-modal__panel')?.focus({ preventScroll: true }));
  }

  function closeTeamDetail() {
    const opener = teamDetailOpener;
    teamDetailOpener = null;
    selectedTeamDetail = null;
    delete els.teamDetailModal.dataset.teamNumber;
    els.teamDetailModal.classList.add('hidden');
    window.requestAnimationFrame(() => opener?.isConnected && opener.focus({ preventScroll: true }));
  }

  function renderOpenTeamDetail() {
    if (!selectedTeamDetail || els.teamDetailModal.classList.contains('hidden')) return;
    const baba = getBabaById(selectedTeamDetail.babaId) || getActiveBaba();
    const team = getTeam(baba, selectedTeamDetail.teamId);
    if (!baba || !team) return closeTeamDetail();

    const dailyRanking = calculateCurrentBabaRanking(baba);
    const general = getSortedGeneralRanking();
    const position = new Map(general.map((stats, index) => [stats.jogadorId, index + 1]));
    const generalById = new Map(general.map((stats) => [stats.jogadorId, stats]));
    const editingHistory = baba.status === 'finalizado';
    const canManage = isOrganizer() && (editingHistory || (baba.id === state.activeBabaId && baba.status !== 'finalizado'));
    const canManageActiveTeam = canManage && !editingHistory && team.id !== VISITOR_TEAM_ID && team.tipo !== 'visitante';
    const teamManagementBlocked = teamHasActiveRoute(baba, team.id);
    const assignedIds = new Set((baba.teams || []).flatMap((item) => item.jogadores || []));
    const availablePlayers = [
      ...state.players.filter((player) => (editingHistory || player.ativo) && !assignedIds.has(player.id)),
      ...(baba.visitantes || []).filter((player) => (editingHistory || (player.ativo && !player.foraDoBaba)) && !assignedIds.has(player.id)),
    ];

    els.teamDetailTitle.textContent = team.name;
    const teamNumber = getTeamNumber(team);
    if (teamNumber) els.teamDetailModal.dataset.teamNumber = String(teamNumber);
    else delete els.teamDetailModal.dataset.teamNumber;
    const playersHTML = team.jogadores.map((playerId) => {
      const player = getBabaPlayer(baba, playerId);
      const dayGoals = dailyRanking[playerId]?.totalGols || 0;
      const generalGoals = generalById.get(playerId)?.totalGols || 0;
      const rank = position.get(playerId) || '-';
      return `
        <button class="baba-team-player-card" type="button" data-player-detail-id="${playerId}" data-player-detail-team-id="${team.id}" data-player-detail-baba-id="${baba.id}"${teamNumberDataAttribute(team)}>
          <span class="baba-team-player-card__identity">
            <strong>${playerNameWithStarsHTML(playerId, baba, { name: player?.nome || playerName(playerId, baba) })}</strong>
            <small>${player?.tipo === 'goleiro' ? 'Goleiro' : (player?.visitante ? 'Visitante' : 'Jogador')}</small>
          </span>
          <div class="baba-player-mini-stats">
            <span>${dayGoals} gols hoje</span>
            <span>${generalGoals} gols geral</span>
            <span>#${rank}</span>
          </div>
        </button>
      `;
    }).join('') || '<div class="baba-empty">Este time esta sem jogadores.</div>';

    setHTML(els.teamDetailList, `
      <div class="baba-roster-summary">
        <span><small>Jogadores</small><b>${team.jogadores.length}</b></span>
        <span><small>Pontos</small><b>${Number(team.pontos || 0)}</b></span>
        <span><small>Vitórias</small><b>${Number(team.vitorias || 0)}</b></span>
        <span><small>Saldo</small><b>${Number(team.golsPro || 0) - Number(team.golsContra || 0)}</b></span>
      </div>
      ${canManage && isManualMode(baba) ? `
        <div class="baba-manual-team-stats">
          ${manualCounterHTML({ teamId: team.id, babaId: baba.id, field: 'wins', value: getManualTeamStats(team).wins, label: 'Vitorias' })}
          ${manualCounterHTML({ teamId: team.id, babaId: baba.id, field: 'draws', value: getManualTeamStats(team).draws, label: 'Empates' })}
          ${manualCounterHTML({ teamId: team.id, babaId: baba.id, field: 'losses', value: getManualTeamStats(team).losses, label: 'Derrotas' })}
        </div>
      ` : ''}
      ${canManage ? `
        <div class="baba-roster-add">
          <strong>Adicionar jogador ao ${escapeHTML(team.name)}</strong>
          <small>Ideal para quem chegou atrasado ou ficou sem time no sorteio.</small>
          <div class="baba-roster-add__controls">
            <select data-team-add-select="${team.id}" ${availablePlayers.length ? '' : 'disabled'}>
              <option value="">${availablePlayers.length ? 'Selecione um jogador...' : 'Nenhum jogador disponivel'}</option>
              ${availablePlayers.map((player) => `<option value="${player.id}">${escapeHTML(player.nome)}</option>`).join('')}
            </select>
            <button class="baba-primary" type="button" data-action="add-player-to-team" data-team-id="${team.id}" data-baba-id="${baba.id}" ${availablePlayers.length ? '' : 'disabled'}>Adicionar</button>
          </div>
        </div>
      ` : ''}
      ${canManageActiveTeam ? `
        <div class="baba-drawer-management">
          <div class="baba-drawer-management__heading">
            <strong>Gerenciar time</strong>
            <small>Abra um jogador abaixo para trocar de time ou remove-lo. Partidas encerradas continuam preservadas.</small>
          </div>
          <div class="baba-drawer-management__actions">
            <button type="button" data-action="toggle-team-rotation" data-team-id="${team.id}" ${teamManagementBlocked ? 'disabled' : ''} title="${teamManagementBlocked ? 'Aguarde a partida ou o desempate terminar' : ''}">${team.retiradoDoBaba ? 'Voltar para fila' : 'Retirar time do baba'}</button>
            <button class="danger" type="button" data-action="delete-team-from-baba" data-team-id="${team.id}" ${teamManagementBlocked ? 'disabled' : ''} title="${teamManagementBlocked ? 'Aguarde a partida ou o desempate terminar' : ''}">Excluir time</button>
          </div>
        </div>
      ` : ''}
      <div class="baba-roster-list">${playersHTML}</div>
    `);
  }

  function playerInitials(name) {
    return String(name || 'J')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'J';
  }

  function openPlayerDetail(playerId, babaId = null) {
    const baba = getBabaById(babaId) || getActiveBaba();
    const player = getBabaPlayer(baba, playerId);
    if (!baba || !player) return showToast('Jogador não encontrado.');
    playerDetailOpener = document.activeElement;
    selectedPlayerDetail = { playerId, babaId: baba.id };
    els.playerDetailModal.classList.remove('hidden');
    renderOpenPlayerDetail();
    window.requestAnimationFrame(() => els.playerDetailModal.querySelector('button, [tabindex]')?.focus({ preventScroll: true }));
  }

  function closePlayerDetail() {
    const opener = playerDetailOpener;
    playerDetailOpener = null;
    selectedPlayerDetail = null;
    delete els.playerDetailModal.dataset.teamNumber;
    els.playerDetailModal.classList.add('hidden');
    window.requestAnimationFrame(() => opener?.isConnected && opener.focus({ preventScroll: true }));
  }

  function renderOpenPlayerDetail() {
    if (!selectedPlayerDetail || els.playerDetailModal.classList.contains('hidden')) return;
    const baba = getBabaById(selectedPlayerDetail.babaId) || getActiveBaba();
    const player = getBabaPlayer(baba, selectedPlayerDetail.playerId);
    if (!baba || !player) return closePlayerDetail();
    const team = getPlayerTeam(baba, player.id);
    const today = calculateCurrentBabaRanking(baba)[player.id] || makeEmptyPlayerStats(player.id, player.nome);
    const general = calculateGeneralRanking()[player.id] || makeEmptyPlayerStats(player.id, player.nome);
    const editingHistory = baba.status === 'finalizado';
    const canManage = isOrganizer() && (editingHistory || (baba.id === state.activeBabaId && baba.status !== 'finalizado'));
    const teamOptions = (baba.teams || []).filter((item) => item.id !== team?.id).map((item) => (
      `<option value="${item.id}">${escapeHTML(item.name)}</option>`
    )).join('');
    const typeLabel = player.tipo === 'goleiro' ? 'Goleiro' : (player.visitante ? 'Visitante' : 'Jogador');

    els.playerDetailTitle.textContent = player.nome;
    const teamNumber = getTeamNumber(team);
    if (teamNumber) els.playerDetailModal.dataset.teamNumber = String(teamNumber);
    else delete els.playerDetailModal.dataset.teamNumber;
    setHTML(els.playerDetailContent, `
      <div class="baba-player-profile">
        <span class="baba-player-profile__avatar">${escapeHTML(playerInitials(player.nome))}</span>
        <span class="baba-player-profile__copy">
          <strong>${playerNameWithStarsHTML(player.id, baba, { name: player.nome })}</strong>
          <span>${typeLabel} · ${escapeHTML(team?.name || 'Sem time')}</span>
        </span>
      </div>
      <div class="baba-player-stats-grid">
        <span class="baba-player-stat"><small>Gols hoje</small><b>${today.totalGols}</b></span>
        <span class="baba-player-stat"><small>Vitórias hoje</small><b>${today.totalVitorias}</b></span>
        <span class="baba-player-stat"><small>Aproveitamento hoje</small><b>${today.aproveitamento}%</b></span>
        <span class="baba-player-stat"><small>Gols no histórico</small><b>${general.totalGols}</b></span>
        <span class="baba-player-stat"><small>Vitórias no histórico</small><b>${general.totalVitorias}</b></span>
        <span class="baba-player-stat"><small>Aproveitamento geral</small><b>${general.aproveitamento}%</b></span>
      </div>
      ${canManage ? `
        <div class="baba-player-management">
          <strong>Gerenciar neste baba</strong>
          <small>Jogos ja encerrados e seus gols permanecem intactos.</small>
          <div class="baba-player-management__move">
            <select id="player-detail-team-select" ${teamOptions ? '' : 'disabled'}>
              <option value="">${teamOptions ? 'Mover para outro time...' : 'Não há outro time disponível'}</option>
              ${teamOptions}
            </select>
            <button class="baba-primary" type="button" data-action="move-player-from-card" data-id="${player.id}" data-baba-id="${baba.id}" ${teamOptions ? '' : 'disabled'}>Mover jogador</button>
          </div>
          <div class="baba-player-management__actions">
            ${team ? `<button class="baba-secondary" type="button" data-action="remove-player-from-team" data-id="${player.id}" data-baba-id="${baba.id}">Retirar do time</button>` : ''}
            ${editingHistory ? '' : `<button class="baba-mini-btn danger" type="button" data-action="remove-player-from-baba" data-id="${player.id}">Saiu do baba</button>`}
          </div>
        </div>
      ` : ''}
    `);
  }

  function renderOpenManagementModals() {
    renderOpenTeamDetail();
    renderOpenPlayerDetail();
  }

  function openCurrentGameDetail(gameNumber) {
    const baba = getDisplayedBaba();
    const game = (baba?.jogos || []).find((item) => String(item.numeroJogo) === String(gameNumber));
    if (!game) return;

    const events = game.goalEvents || [];
    els.gameDetailTitle.textContent = `Jogo ${game.numeroJogo}`;
    els.gameDetailList.innerHTML = `
      <div class="baba-row">
        <strong>${matchLineHTML(baba, getTeam(baba, game.timeA), game.placarA, game.placarB, getTeam(baba, game.timeB))}</strong>
        <b class="baba-result-tag ${game.empate ? 'is-draw' : 'is-win'}">${game.empate ? resultStatusLabel(game) : 'Vitória'}</b>
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

  function manualCounterHTML({ teamId, field, value, playerId = '', label, babaId = '' }) {
    const playerAttr = playerId ? ` data-player-id="${escapeHTML(playerId)}"` : '';
    const babaAttr = babaId ? ` data-baba-id="${escapeHTML(babaId)}"` : '';
    return `
      <div class="baba-manual-counter">
        <span>${escapeHTML(label)}</span>
        <div class="baba-manual-stepper" aria-label="${escapeHTML(label)}">
          <button type="button" data-action="manual-stat" data-team-id="${escapeHTML(teamId)}" data-manual-field="${escapeHTML(field)}" data-delta="-1"${playerAttr}${babaAttr} aria-label="Diminuir ${escapeHTML(label)}">-</button>
          <strong>${Number(value || 0)}</strong>
          <button type="button" data-action="manual-stat" data-team-id="${escapeHTML(teamId)}" data-manual-field="${escapeHTML(field)}" data-delta="1"${playerAttr}${babaAttr} aria-label="Aumentar ${escapeHTML(label)}">+</button>
        </div>
      </div>
    `;
  }

  function renderManualDashboard(baba) {
    ensureManualStats(baba);
    if (els.matchNumberPill) els.matchNumberPill.textContent = 'Manual';
    els.currentMatchPanel.className = 'baba-current-match-panel baba-manual-live';
    const teams = (baba?.teams || []).filter((team) => team.id !== VISITOR_TEAM_ID || (team.jogadores || []).length);
    if (!teams.length) {
      setHTML(els.currentMatchPanel, '<div class="baba-empty">Sorteie os times para atualizar as estatisticas manuais.</div>');
    } else {
      setHTML(els.currentMatchPanel, `
        <div class="baba-manual-mode-strip"><span>Modo</span><strong>Manual</strong></div>
        <div class="baba-manual-team-grid">
          ${teams.map((team) => {
            const stats = getManualTeamStats(team);
            const totalGoals = manualTeamGoals(team);
            const visual = teamVisualMeta(team);
            return `
              <article class="baba-manual-team-card"${teamNumberDataAttribute(team)}>
                <header>
                  ${teamShieldHTML(team, 'baba-manual-team-card__shield')}
                  <span>
                    <small>${visual.visitor ? 'Visitantes' : `Colete ${visual.number}`}</small>
                    <strong>${escapeHTML(team.name)}</strong>
                  </span>
                  <b>${totalGoals} gol${totalGoals === 1 ? '' : 's'}</b>
                </header>
                <div class="baba-manual-team-stats">
                  ${manualCounterHTML({ teamId: team.id, babaId: baba.id, field: 'wins', value: stats.wins, label: 'Vitorias' })}
                  ${manualCounterHTML({ teamId: team.id, babaId: baba.id, field: 'draws', value: stats.draws, label: 'Empates' })}
                  ${manualCounterHTML({ teamId: team.id, babaId: baba.id, field: 'losses', value: stats.losses, label: 'Derrotas' })}
                </div>
                <div class="baba-manual-player-list">
                  <span>Jogadores</span>
                  ${(team.jogadores || []).map((playerId) => {
                    const player = getBabaPlayer(baba, playerId);
                    const name = player?.nome || playerName(playerId, baba);
                    return `
                      <div class="baba-manual-player-row">
                        <strong>${playerPaymentNameHTML(playerId, baba, { name, force: true })}</strong>
                        ${manualCounterHTML({ teamId: team.id, babaId: baba.id, field: 'goals', playerId, value: stats.playerGoals[playerId] || 0, label: 'Gols' })}
                      </div>
                    `;
                  }).join('') || '<div class="baba-empty">Sem jogadores neste time.</div>'}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `);
    }

    setHTML(els.queueList, '<div class="baba-empty">Modo Manual ativo. Nao ha fila de partidas.</div>');
    setHTML(els.currentGamesList, '<div class="baba-empty">Modo Manual ativo. Os confrontos individuais nao sao registrados.</div>');
    els.lastResultPill.textContent = 'Manual';
    setHTML(els.lastResultPanel, '<div class="baba-empty">Atualize vitorias, empates, derrotas e gols diretamente nos cards do Ao Vivo.</div>');
  }

  function renderDashboard(baba) {
    [els.queueList, els.currentGamesList, els.lastResultPanel].forEach((element) => {
      element?.closest('.baba-card')?.classList.toggle('hidden', isManualMode(baba));
    });
    if (isManualMode(baba)) {
      renderManualDashboard(baba);
      return;
    }

    const match = baba?.jogoAtual;
    const teamA = getTeam(baba, match?.timeA);
    const teamB = getTeam(baba, match?.timeB);
    if (els.matchNumberPill) els.matchNumberPill.textContent = match ? `Jogo ${match.numeroJogo}` : 'Jogo 0';

    if (baba?.pendingTieBreak) {
      els.currentMatchPanel.className = 'baba-current-match-panel';
      const route = getPendingTieBreakRoute(baba, baba.pendingTieBreak);
      const tied = route.tiedTeams.map((team) => team.name).filter(Boolean).join(' x ');
      const choiceCards = route.tiedTeams.map((team) => `
        <button class="baba-tiebreak-choice" type="button" data-action="choose-three-team-keep" data-team-id="${team.id}"${teamNumberDataAttribute(team)} aria-label="${escapeHTML(team.name)} venceu o impar ou par">
          <span>Vencedor</span>
          <strong>${escapeHTML(team.name)}</strong>
          <small>Continua em quadra</small>
        </button>
      `).join('');
      setHTML(els.currentMatchPanel, `
        <div class="baba-tiebreak-panel baba-tiebreak-panel--compact">
          <div class="baba-tiebreak-compact-head">
            <span class="baba-tiebreak-compact-head__icon" aria-hidden="true"><svg><use href="#baba-whistle"></use></svg></span>
            <div>
              <span class="baba-kicker">Desempate</span>
              <h3>Definir impar/par</h3>
              <p>${escapeHTML(tied)} empataram. Toque no time que venceu.</p>
            </div>
          </div>
          ${isOrganizer()
            ? `<div class="baba-tiebreak-options">${choiceCards}</div>`
            : '<div class="baba-empty">Aguardando o organizador definir o vencedor.</div>'}
        </div>
      `);
    } else if (!match || !teamA || !teamB) {
      els.currentMatchPanel.className = 'baba-current-match-panel';
      const canStart = isOrganizer() && baba?.status !== 'finalizado' && getRotationTeams(baba).length >= 2;
      const startLabel = baba?.jogos?.length ? 'Iniciar partida' : 'Iniciar primeiro jogo';
      setHTML(els.currentMatchPanel, `
        <div class="baba-empty">${baba?.status === 'finalizado' ? 'Baba finalizado. O último resultado permanece disponível abaixo.' : 'Nenhum jogo iniciado.'}</div>
        ${canStart ? `<div class="baba-live-actions baba-live-actions--single"><button class="baba-primary baba-start-game-btn" type="button" data-action="start-first-live">${startLabel}</button></div>` : ''}
      `);
    } else {
      els.currentMatchPanel.className = 'baba-current-match-panel';
      const remaining = getRemainingSeconds(match);
      const isPrepared = !match.timerRunning && !match.iniciadoEm;
      const isOver = remaining === 0 && match.iniciadoEm;
      const isPaused = !isPrepared && !isOver && !match.timerRunning;
      const timerLabel = isPrepared ? 'Aguardando início' : (remaining ? formatCountdown(remaining) : 'Tempo esgotado');
      const scoreA = Number(match.placarA || 0);
      const scoreB = Number(match.placarB || 0);
      let organizerControls = '';
      if (isOrganizer()) {
        const startLabel = match.numeroJogo === 1 && !(baba.jogos?.length) ? 'Iniciar primeiro jogo' : 'Iniciar partida';
        organizerControls = isPrepared ? `
          <div class="baba-live-actions baba-live-actions--single">
            <button class="baba-live-main-btn baba-start-game-btn" type="button" data-action="start-prepared-match">${startLabel}</button>
            <button class="baba-live-control-btn" type="button" data-action="edit-time">Editar tempo</button>
          </div>
        ` : isOver ? `
          <div class="baba-live-actions baba-live-actions--single">
            <button class="baba-live-control-btn" type="button" data-action="edit-time">Editar tempo</button>
            <button class="baba-live-control-btn baba-live-control-btn--danger" type="button" data-action="finish-live-match">Finalizar jogo</button>
          </div>
        ` : `
          <div class="baba-live-actions">
            <div class="baba-live-secondary-actions">
              <button class="baba-live-control-btn baba-pause-toggle ${match.timerRunning ? 'is-running' : 'is-paused'}" type="button" data-action="pause-time" aria-pressed="${match.timerRunning ? 'false' : 'true'}">
                <svg class="baba-btn-icon" aria-hidden="true" focusable="false"><use href="#${match.timerRunning ? 'baba-pause' : 'baba-play'}"></use></svg>
                <span>${match.timerRunning ? 'Pausar' : 'Retomar'}</span>
              </button>
              <button class="baba-live-control-btn" type="button" data-action="edit-time">Editar tempo</button>
              <button class="baba-live-control-btn" type="button" data-action="undo-goal">Desfazer gol</button>
              <button class="baba-live-control-btn baba-live-control-btn--danger" type="button" data-action="finish-live-match">Finalizar jogo</button>
            </div>
          </div>
        `;
      }
      setHTML(els.currentMatchPanel, `
        <div class="baba-match-live ${isPrepared ? 'is-prepared' : ''}">
          <div class="baba-timer ${isOver ? 'is-over' : ''} ${isPaused ? 'is-paused' : ''}" id="current-timer">
            <svg class="baba-live-icon" aria-hidden="true" focusable="false"><use href="#baba-clock"></use></svg>
            <span class="baba-timer__text">${timerLabel}</span>
          </div>
          <div class="baba-live-scoreboard scoreboard">
            <div class="baba-live-team-column"${teamNumberDataAttribute(teamA)}>
              <strong class="baba-live-team baba-live-team--home scoreboard__team">${teamDetailButton(baba, teamA)}</strong>
              ${isOrganizer() && !isPrepared && !isOver ? `<button class="baba-goal-btn" type="button" data-action="open-goal-picker" data-team-id="${teamA.id}"${teamNumberDataAttribute(teamA)}>Marcar gol do ${escapeHTML(teamA.name)}</button>` : ''}
            </div>
            <div class="baba-live-score scoreboard__score" aria-label="Placar ${scoreA} a ${scoreB}">
              <span class="score-number">${scoreA}</span>
              <small>x</small>
              <span class="score-number">${scoreB}</span>
            </div>
            <div class="baba-live-team-column"${teamNumberDataAttribute(teamB)}>
              <strong class="baba-live-team baba-live-team--away scoreboard__team">${teamDetailButton(baba, teamB)}</strong>
              ${isOrganizer() && !isPrepared && !isOver ? `<button class="baba-goal-btn" type="button" data-action="open-goal-picker" data-team-id="${teamB.id}"${teamNumberDataAttribute(teamB)}>Marcar gol do ${escapeHTML(teamB.name)}</button>` : ''}
            </div>
          </div>
          ${organizerControls}
          <div class="baba-match-live__meta">
            <span class="baba-pill">Início: ${match.iniciadoEm ? formatTime(match.iniciadoEm) : 'pendente'}</span>
          </div>
        </div>
      `);
    }

    const visibleQueue = sanitizeTeamQueue(baba);
    if (!visibleQueue.length) {
      setHTML(els.queueList, '<div class="baba-empty">Sem times aguardando.</div>');
    } else {
      setHTML(els.queueList, visibleQueue.map((teamId, index) => {
        const team = getTeam(baba, teamId);
        return `
          <div class="baba-row queue-item" data-queue-team-id="${team.id}"${teamNumberDataAttribute(team)}>
            <div class="queue-item__team">
              <strong>${teamDetailButton(baba, team)}</strong>
              <small class="queue-item__status">${index === 0 ? 'Próximo a entrar' : 'Aguardando'}</small>
            </div>
            ${isOrganizer() ? `
              <div class="queue-item__controls" aria-label="Controles da fila">
                ${index > 0 ? `
                  <button class="queue-item__quick" type="button" data-action="queue-make-next" data-team-id="${team.id}" title="Tornar o próximo a entrar" aria-label="Tornar ${escapeHTML(team.name)} o próximo a entrar">
                    <svg aria-hidden="true" focusable="false"><use href="#baba-arrow-up"></use></svg>
                    <span>Próximo</span>
                  </button>
                ` : ''}
                ${index < visibleQueue.length - 1 ? `
                  <button class="queue-item__quick" type="button" data-action="queue-move-end" data-team-id="${team.id}" title="Mandar para o fim da fila" aria-label="Mandar ${escapeHTML(team.name)} para o fim da fila">
                    <svg aria-hidden="true" focusable="false"><use href="#baba-arrow-down"></use></svg>
                    <span>Fim</span>
                  </button>
                ` : ''}
                <b class="queue-item__position">#${index + 1}</b>
                <button class="queue-item__drag" type="button" draggable="true" data-queue-drag-handle aria-label="Segure e arraste ${escapeHTML(team.name)} para reorganizar a fila" title="Segure e arraste para reorganizar">
                  <svg aria-hidden="true" focusable="false"><use href="#baba-grip"></use></svg>
                </button>
              </div>
            ` : `<b class="queue-item__position">#${index + 1}</b>`}
          </div>
        `;
      }).join(''));
    }

    if (!baba?.lastResult) {
      els.lastResultPill.textContent = 'Sem resultado';
      setHTML(els.lastResultPanel, '<div class="baba-empty">Finalize um jogo para ver quem fica em campo e quem sai.</div>');
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
      const outHTML = baba.lastResult.timeQueSaiu ? (teamButtonsFromValue(baba, baba.lastResult.timeQueSaiu) || escapeHTML(outNames)) : '<span class="baba-result-pending">Aguardando decisão</span>';
      setHTML(els.lastResultPanel, `
        <div class="baba-row">
          <div>
            <strong>${resultLine}</strong>
            <small><span class="baba-result-tag ${baba.lastResult.empate || baba.lastResult.decididoPorSorteio ? 'is-draw' : 'is-win'}">${resultStatusLabel(baba.lastResult)}</span></small>
          </div>
        </div>
        <div class="baba-row"><span>Continua em campo</span><b>${keepHTML}</b></div>
        <div class="baba-row"><span>Saiu para a fila</span><b>${outHTML}</b></div>
        <div class="baba-row"><span>Motivo</span><b>${escapeHTML(baba.lastResult.motivoSaida)}</b></div>
      `);
    }
  }

  function renderRankings(baba) {
    renderRankingFilters();
    renderRankingScopeControls();
    const generalRanking = calculateGeneralRanking();
    const dailyRanking = calculateCurrentBabaRanking(baba);
    const currentMonth = activeMonthKey(baba);
    const monthlyRanking = calculateMonthlyRanking(currentMonth, { includeActive: false });
    const goalkeepers = calculateGoalkeeperRanking({ includeActive: false });
    const generalRatings = generalPerformanceMap();
    const monthlyRatings = performanceMap(Object.values(monthlyRanking), {
      completedBabas: completedBabaCount((item) => monthKeyFromISO(item.dataISO) === currentMonth),
      cacheKey: `month-${currentMonth}`,
    });
    const dailyRatings = performanceMap(Object.values(dailyRanking), {
      completedBabas: baba?.status === 'finalizado' ? 1 : 0,
      cacheKey: `daily-${baba?.id || 'none'}`,
    });
    const general = sortRanking(generalRanking, rankingMode, generalRatings, baba);
    const daily = sortRanking(dailyRanking, rankingMode, dailyRatings, baba);
    const monthly = sortRanking(monthlyRanking, rankingMode, monthlyRatings, baba);
    if (els.monthlyRankingLabel) els.monthlyRankingLabel.textContent = `${monthLabel(currentMonth)} - babas salvos`;
    if (els.monthlyRankingList) {
      setHTML(els.monthlyRankingList, renderRankingList(monthly, rankingEmptyMessage('neste mes'), {
        expandKey: 'monthly-current',
        metric: rankingMode,
        ratingMap: monthlyRatings,
      }));
    }
    setHTML(els.rankingList, renderRankingList(general, rankingEmptyMessage('no ranking geral'), {
      expandKey: 'general',
      metric: rankingMode,
      ratingMap: generalRatings,
    }));
    setHTML(els.dailyRankingList, renderRankingList(daily, rankingEmptyMessage('no baba atual'), {
      expandKey: 'daily',
      metric: rankingMode,
      ratingMap: dailyRatings,
    }));
    if (els.goalkeeperRankingList) {
      setHTML(els.goalkeeperRankingList, renderGoalkeeperRankingList(goalkeepers, 'Ainda não há jogos com goleiros para montar este ranking.', {
        expandKey: 'goalkeepers',
        ratingMap: goalkeeperPerformanceMap(),
      }));
    }
    renderMonthlyHistory();
  }

  function renderRankingScopeControls() {
    if (!els.rankingScopeControls) return;
    if (!RANKING_SCOPES.some((item) => item.id === rankingScope)) rankingScope = 'monthly';
    const buttons = RANKING_SCOPES.map((scope) => `
      <button class="${rankingScope === scope.id ? 'active' : ''}" type="button" data-ranking-scope="${scope.id}" aria-pressed="${rankingScope === scope.id ? 'true' : 'false'}">
        <svg aria-hidden="true" focusable="false"><use href="#${scope.icon}"></use></svg>
        <span>${scope.label}</span>
      </button>
    `).join('');
    const select = `<label class="baba-ranking-compact-select"><span>Exibir</span><select data-ranking-scope-select>${RANKING_SCOPES.map((scope) => `<option value="${scope.id}"${rankingScope === scope.id ? ' selected' : ''}>${scope.label}</option>`).join('')}</select></label>`;
    setHTML(els.rankingScopeControls, `${select}${buttons}`);
    $$('[data-ranking-card]').forEach((card) => {
      card.classList.toggle('hidden', card.dataset.rankingCard !== rankingScope);
    });
    const goalkeeperActive = rankingScope === 'goalkeeper';
    els.rankingFilterControls?.classList.toggle('hidden', goalkeeperActive);
    const toolbarCopy = $('[data-ranking-toolbar-copy]');
    if (toolbarCopy) {
      const title = toolbarCopy.querySelector('strong');
      const subtitle = toolbarCopy.querySelector('span');
      if (title) title.textContent = goalkeeperActive ? 'Ranking de goleiros' : 'Ordenar ranking';
      if (subtitle) subtitle.textContent = goalkeeperActive ? 'Menos derrotas, mais vitórias' : 'Escolha o critério';
    }
  }

  function renderMonthlyHistory() {
    if (!els.monthlyHistoryTabs || !els.monthlyHistoryRanking) return;
    const keys = getAvailableMonthKeys();
    if (!keys.length) {
      setHTML(els.monthlyHistoryTabs, '');
      setHTML(els.monthlyHistoryRanking, '<div class="baba-empty">Sem histórico mensal ainda.</div>');
      return;
    }
    if (!selectedMonthlyKey || !keys.includes(selectedMonthlyKey)) selectedMonthlyKey = keys[0];
    setHTML(els.monthlyHistoryTabs, keys.map((key) => `
      <button class="${key === selectedMonthlyKey ? 'active' : ''}" type="button" data-month-key="${key}">${escapeHTML(monthLabel(key))}</button>
    `).join(''));
    const monthlyRanking = calculateMonthlyRanking(selectedMonthlyKey, { includeActive: false });
    const ratingMap = performanceMap(Object.values(monthlyRanking), {
      completedBabas: completedBabaCount((item) => monthKeyFromISO(item.dataISO) === selectedMonthlyKey),
      cacheKey: `history-month-${selectedMonthlyKey}`,
    });
    const ranking = sortRanking(monthlyRanking, rankingMode, ratingMap, getDisplayedBaba());
    setHTML(els.monthlyHistoryRanking, renderRankingList(ranking, rankingEmptyMessage('neste mês'), {
      expandKey: `month-${selectedMonthlyKey}`,
      metric: rankingMode,
      ratingMap,
    }));
  }

  function rankingEmptyMessage(scope) {
    if (rankingMode === 'stars') return `Ainda não há partidas suficientes para o ranking de melhores jogadores ${scope}.`;
    if (rankingMode === 'goals') return `Ainda não há gols ${scope}.`;
    const option = RANKING_MODES.find((item) => item.id === rankingMode);
    const label = (option?.label || 'dados').toLowerCase();
    return `Ainda não há dados de ${label} ${scope}.`;
  }

  function renderRankingFilters() {
    if (!els.rankingFilterControls) return;
    const buttons = RANKING_MODES.map((modeOption) => `
      <button class="${rankingMode === modeOption.id ? 'active' : ''}" type="button" data-ranking-mode="${modeOption.id}" aria-pressed="${rankingMode === modeOption.id ? 'true' : 'false'}">
        <svg aria-hidden="true" focusable="false"><use href="#${modeOption.icon}"></use></svg>
        <span>${modeOption.label}</span>
      </button>
    `).join('');
    const select = `<label class="baba-ranking-compact-select"><span>Ordenar por</span><select data-ranking-mode-select>${RANKING_MODES.map((option) => `<option value="${option.id}"${rankingMode === option.id ? ' selected' : ''}>${option.label}</option>`).join('')}</select></label>`;
    setHTML(els.rankingFilterControls, `${select}${buttons}`);
  }

  function rankingRating(stats, ratingMap = null, baba = getDisplayedBaba()) {
    if (isBabaGoalkeeper(baba, stats?.jogadorId)) return goalkeeperPerformanceMap().get(stats.jogadorId) || null;
    return ratingMap?.get(stats?.jogadorId) || (stats?.jogadorId ? defaultPlayerPerformance(stats.jogadorId, baba) : null);
  }

  function rankingMetricValue(stats, metric = 'goals', rating = null) {
    if (metric === 'stars') return Number(rating?.displayStars ?? rating?.stars ?? 0);
    if (metric === 'wins') return Number(stats.totalVitorias || 0);
    if (metric === 'losses') return Number(stats.totalDerrotas || 0);
    if (metric === 'worst') return Number(stats.totalDerrotas || 0);
    if (metric === 'titles') return Number(stats.totalTitulosBaba || 0);
    if (metric === 'efficiency') return Number(stats.aproveitamento || 0);
    return Number(stats.totalGols || 0);
  }

  function hasRankingMetric(stats, metric = 'goals', rating = null) {
    if (metric === 'stars') return Number(stats.totalJogos || stats.jogos || 0) > 0;
    if (metric === 'worst') return Number(stats.totalJogos || 0) > 0;
    if (metric === 'efficiency') return Number(stats.totalJogos || 0) > 0;
    return rankingMetricValue(stats, metric, rating) > 0;
  }

  function rankingMetricDisplay(stats, metric = 'goals', rating = null) {
    const value = rankingMetricValue(stats, metric, rating);
    if (metric === 'stars') return { value: String(value).replace('.', ','), label: value === 1 ? 'estrela' : 'estrelas' };
    if (metric === 'wins') return { value, label: value === 1 ? 'vitória' : 'vitórias' };
    if (metric === 'losses') return { value, label: value === 1 ? 'derrota' : 'derrotas' };
    if (metric === 'worst') {
      const goals = Number(stats.totalGols || 0);
      return { value, label: `${value === 1 ? 'derrota' : 'derrotas'} • ${goals} ${goals === 1 ? 'gol' : 'gols'}` };
    }
    if (metric === 'titles') return { value, label: value === 1 ? 'título' : 'títulos' };
    if (metric === 'efficiency') return { value: `${value}%`, label: 'aprov.' };
    return { value, label: value === 1 ? 'gol' : 'gols' };
  }

  function sortRanking(ranking, metric = 'goals', ratingMap = null, baba = getDisplayedBaba()) {
    return Object.values(ranking || {})
      .filter((stats) => isPlayerVisibleInRanking(stats.jogadorId) && hasRankingMetric(stats, metric, rankingRating(stats, ratingMap, baba)))
      .sort((a, b) => {
        if (metric === 'stars') {
          return window.BabaPerformanceStars.comparePerformance(
            a,
            b,
            rankingRating(a, ratingMap, baba),
            rankingRating(b, ratingMap, baba),
          );
        }
        if (metric === 'wins') {
          return b.totalVitorias - a.totalVitorias || b.totalGols - a.totalGols || b.aproveitamento - a.aproveitamento || a.nome.localeCompare(b.nome);
        }
        if (metric === 'losses') {
          return b.totalDerrotas - a.totalDerrotas || b.totalGols - a.totalGols || a.nome.localeCompare(b.nome);
        }
        if (metric === 'worst') {
          return b.totalDerrotas - a.totalDerrotas || a.totalGols - b.totalGols || a.nome.localeCompare(b.nome);
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
    const contextBaba = options.baba || getDisplayedBaba();
    const stat = (iconId, label) => `
      <span>
        <svg aria-hidden="true" focusable="false"><use href="#${iconId}"></use></svg>
        ${label}
      </span>
    `;
    const cards = visibleItems.map((stats, index) => {
      const position = index + 1;
      const topClass = position <= 3 ? ` baba-ranking-card--top${position}` : '';
      const lastClass = items.length > 1 && index === items.length - 1 ? ' baba-ranking-card--last' : '';
      const icon = position === 1 ? 'baba-trophy' : 'baba-ball';
      const playerTeam = getPlayerTeam(contextBaba, stats.jogadorId);
      const rating = isBabaGoalkeeper(contextBaba, stats.jogadorId)
        ? goalkeeperPerformanceMap().get(stats.jogadorId)
        : options.ratingMap?.get(stats.jogadorId);
      const score = rankingMetricDisplay(stats, metric, rating);
      return `
        <div class="baba-ranking-card${topClass}${lastClass}"${teamNumberDataAttribute(playerTeam)}>
          <div class="baba-ranking-card__main">
            <span class="baba-ranking-position">${position}</span>
            <div>
              <div class="baba-ranking-title">
                <svg aria-hidden="true" focusable="false"><use href="#${icon}"></use></svg>
                <strong>${playerPaymentNameHTML(stats.jogadorId, contextBaba, { name: stats.nome, force: Boolean(contextBaba), rating })}</strong>
              </div>
              <div class="stats">
                ${stat('baba-ball', `${stats.totalGols} gols`)}
                ${stat('baba-check', `${stats.totalVitorias} V`)}
                ${stat('baba-dash', `${stats.totalEmpates} E`)}
                ${stat('baba-x', `${stats.totalDerrotas} D`)}
                ${stat('baba-calendar', `${stats.totalBabas} babas`)}
                ${stat('baba-chart', `${stats.mediaGols} media`)}
                ${stat('baba-trophy', `${stats.totalTitulosBaba} títulos`)}
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
    const contextBaba = options.baba || getDisplayedBaba();
    const cards = visibleItems.map((stats, index) => {
      const position = index + 1;
      const topClass = position <= 3 ? ` baba-ranking-card--top${position}` : '';
      const lastClass = items.length > 1 && index === items.length - 1 ? ' baba-ranking-card--last' : '';
      const playerTeam = getPlayerTeam(contextBaba, stats.jogadorId);
      const rating = options.ratingMap?.get(stats.jogadorId) || goalkeeperPerformanceMap().get(stats.jogadorId);
      return `
        <div class="baba-ranking-card baba-goalkeeper-card${topClass}${lastClass}"${teamNumberDataAttribute(playerTeam)}>
          <div class="baba-ranking-card__main">
            <span class="baba-ranking-position">${position}</span>
            <div>
              <div class="baba-ranking-title">
                <svg aria-hidden="true" focusable="false"><use href="#${position === 1 ? 'baba-trophy' : 'baba-save'}"></use></svg>
                <strong>${playerPaymentNameHTML(stats.jogadorId, contextBaba, { name: stats.nome, force: Boolean(contextBaba), rating })}</strong>
              </div>
              <div class="stats">
                <span><svg aria-hidden="true" focusable="false"><use href="#baba-x"></use></svg>${stats.derrotas} derrotas</span>
                <span><svg aria-hidden="true" focusable="false"><use href="#baba-check"></use></svg>${stats.vitorias} vitórias</span>
                <span><svg aria-hidden="true" focusable="false"><use href="#baba-dash"></use></svg>${stats.empates} empates</span>
                <span><svg aria-hidden="true" focusable="false"><use href="#baba-play"></use></svg>${stats.jogos} jogos</span>
                <span><svg aria-hidden="true" focusable="false"><use href="#baba-save"></use></svg>${stats.golsSofridos} sofridos</span>
                <span><svg aria-hidden="true" focusable="false"><use href="#baba-calendar"></use></svg>${stats.totalBabas} babas</span>
              </div>
            </div>
          </div>
          <div class="baba-ranking-score">
            <strong>${stats.derrotas}</strong>
            <span>${stats.derrotas === 1 ? 'derrota' : 'derrotas'}</span>
          </div>
        </div>
      `;
    }).join('');
    return `${cards}${rankingToggleHTML(options.expandKey, items.length, limit, expanded)}`;
  }

  function renderHistory() {
    const finished = state.babas
      .filter((baba) => baba.status === 'finalizado')
      .sort((a, b) => (
        String(b.dataISO || '').localeCompare(String(a.dataISO || ''))
        || Number(b.finalizadoEm || b.criadoEm || 0) - Number(a.finalizadoEm || a.criadoEm || 0)
      ));
    els.historyCountLabel.textContent = `${finished.length} salvos`;
    if (!finished.length) {
      els.historyDetail.classList.add('baba-empty');
      setHTML(els.historyList, '<div class="baba-empty">Nenhum baba finalizado ainda.</div>');
      setHTML(els.historyDetail, 'Finalize um baba para consultar os detalhes.');
      return;
    }

    if (!selectedHistoryId || !finished.some((baba) => baba.id === selectedHistoryId)) {
      selectedHistoryId = finished[0].id;
    }

    const historyItems = finished.map((baba) => `
      <button class="baba-history-item ${baba.id === selectedHistoryId ? 'active' : ''}" type="button" data-history-id="${baba.id}">
        <span class="baba-history-item__identity">
          <i class="baba-history-item__date">${escapeHTML(String(baba.dia || '').padStart(2, '0'))}</i>
          <span>
          <strong>${escapeHTML(baba.dataCompleta)}</strong>
          <small>${escapeHTML(baba.campeaoDoBaba?.nomes?.join(', ') || 'Sem campeão')}</small>
          </span>
        </span>
        <span class="baba-history-actions">
          <b>${baba.jogos?.length || 0} jogos</b>
          ${isOrganizer() ? `<span class="baba-mini-btn danger" data-action="delete-history" data-id="${baba.id}">Excluir</span>` : ''}
        </span>
      </button>
    `).join('');
    const moreButton = window.BabaRepository?.hasMoreHistory?.()
      ? '<button class="baba-btn secondary" type="button" data-history-more>Carregar histórico anterior</button>'
      : '';
    setHTML(els.historyList, `${historyItems}${moreButton}`);

    const selected = finished.find((baba) => baba.id === selectedHistoryId);
    if (selected && !selected.__detailLoaded && window.BabaRepository?.loadBaba) {
      els.historyDetail.classList.add('baba-empty');
      setHTML(els.historyDetail, 'Carregando placares, times e gols...');
      if (!loadingHistoryIds.has(selected.id)) {
        loadingHistoryIds.add(selected.id);
        window.BabaRepository.loadBaba(selected.id)
          .catch((error) => showToast(error.message || 'Não foi possível carregar este baba.'))
          .finally(() => loadingHistoryIds.delete(selected.id));
      }
      return;
    }
    renderHistoryDetail(selected);
  }

  function renderHistoryDetail(baba) {
    if (!baba) return;
    els.historyDetail.classList.remove('baba-empty');
    els.historyDetailLabel.textContent = baba.dataCompleta;
    const championNames = baba.campeaoDoBaba?.nomes?.join(', ') || 'Sem campeão';
    const championPlayersData = (baba.campeaoDoBaba?.jogadores || []).map((id) => ({
      id,
      name: getBabaPlayer(baba, id)?.nome
        || baba.rankingDoBaba?.[id]?.nome
        || state.playerStats?.[id]?.nome
        || 'Jogador removido',
    }));
    const championPlayers = championPlayersData.length
      ? championPlayersData.map((player) => `<span class="baba-history-champion-chip">${playerNameWithStarsHTML(player.id, baba, { name: player.name })}</span>`).join('')
      : '<span class="baba-history-muted">Nenhum jogador informado</span>';
    const teams = (baba.teams || []).map((team) => `
      <article class="baba-history-team"${teamNumberDataAttribute(team)}>
        <header>
          <strong>${teamDetailButton(baba, team)}</strong>
          <b>${Number(team.pontos || 0)} pts</b>
          ${isOrganizer() ? `<button class="baba-mini-btn baba-history-team-edit" type="button" data-action="edit-history-roster" data-baba-id="${baba.id}" data-team-id="${team.id}">Editar elenco</button>` : ''}
        </header>
        <div>
          <span><small>Vitórias</small><b>${Number(team.vitorias || 0)}</b></span>
          <span><small>Empates</small><b>${Number(team.empates || 0)}</b></span>
          <span><small>Derrotas</small><b>${Number(team.derrotas || 0)}</b></span>
          <span><small>Saldo</small><b>${Number(team.golsPro || 0) - Number(team.golsContra || 0)}</b></span>
        </div>
      </article>
    `).join('');
    const games = (baba.jogos || []).map((game) => `
      <article class="baba-history-match">
        <span>Jogo ${game.numeroJogo}</span>
        <strong>${matchLineHTML(baba, getTeam(baba, game.timeA), game.placarA, game.placarB, getTeam(baba, game.timeB), true)}</strong>
        <small>${escapeHTML(resultStatusLabel(game))}</small>
        ${isOrganizer() ? `<button class="baba-mini-btn" type="button" data-action="edit-history-game" data-baba-id="${baba.id}" data-game-number="${game.numeroJogo}">Editar</button>` : ''}
      </article>
    `).join('');

    setHTML(els.historyDetail, `
      <div class="baba-history-detail-pro">
        <section class="baba-history-hero">
          <div class="baba-history-hero__copy">
            <small>Campeão do baba</small>
            <h3>${escapeHTML(championNames)}</h3>
            <p>${escapeHTML(baba.dataCompleta)} · finalizado às ${formatTime(baba.finalizadoEm)}</p>
            ${isOrganizer() ? `<button class="baba-secondary baba-history-hero__edit" type="button" data-action="edit-history-summary" data-baba-id="${baba.id}">Editar data e gols</button>` : ''}
          </div>
          <div class="baba-history-kpis">
            <span><b>${baba.jogadoresPresentes?.length || 0}</b><small>presentes</small></span>
            <span><b>${baba.teams?.length || 0}</b><small>times</small></span>
            <span><b>${baba.jogos?.length || 0}</b><small>jogos</small></span>
          </div>
        </section>
        <section class="baba-history-section">
          <div class="baba-history-section__title"><strong>Jogadores campeões</strong><small>${championPlayersData.length} jogadores</small></div>
          <div class="baba-history-champions">${championPlayers}</div>
        </section>
        <section class="baba-history-section">
          <div class="baba-history-section__title"><strong>Desempenho dos times</strong><small>Tabela final</small></div>
          <div class="baba-history-teams">${teams || '<div class="baba-empty">Nenhum time salvo.</div>'}</div>
        </section>
        <section class="baba-history-section">
          <div class="baba-history-section__title"><strong>Partidas</strong><small>Ordem dos jogos</small></div>
          <div class="baba-history-matches">${games || '<div class="baba-empty">Nenhuma partida salva.</div>'}</div>
        </section>
      </div>
    `);
  }

  function restoreMoreMenuHome() {
    if (!els.moreMenu) return;
    els.moreMenu.classList.remove('is-floating');
    els.moreMenu.style.removeProperty('--baba-more-menu-top');
    els.moreMenu.style.removeProperty('--baba-more-menu-left');
    if (moreMenuHome && els.moreMenu.parentElement !== moreMenuHome) moreMenuHome.appendChild(els.moreMenu);
  }

  function closeMoreMenu({ restoreFocus = false } = {}) {
    els.moreMenu?.classList.add('hidden');
    els.moreToggle?.setAttribute('aria-expanded', 'false');
    restoreMoreMenuHome();
    if (restoreFocus) els.moreToggle?.focus({ preventScroll: true });
  }

  function positionMoreMenu() {
    if (!els.moreMenu || !els.moreToggle) return;
    if (els.moreMenu.classList.contains('hidden')) return;

    if (els.moreMenu.parentElement !== document.body) document.body.appendChild(els.moreMenu);
    els.moreMenu.classList.add('is-floating');
    const headerRect = document.querySelector('.baba-unified-header')?.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.visualViewport?.height || document.documentElement.clientHeight;
    const margin = 8;
    const menuWidth = Math.min(240, viewportWidth - (margin * 2));
    const toggleRect = els.moreToggle.getBoundingClientRect();
    const preferredLeft = toggleRect.right - menuWidth;
    const left = Math.min(
      viewportWidth - menuWidth - margin,
      Math.max(margin, preferredLeft),
    );
    const preferredTop = (headerRect?.bottom || els.moreToggle.getBoundingClientRect().bottom) + 8;
    const menuHeight = Math.min(els.moreMenu.scrollHeight, viewportHeight - (margin * 2));
    const top = Math.max(margin, Math.min(preferredTop, viewportHeight - menuHeight - margin));
    els.moreMenu.style.setProperty('--baba-more-menu-top', `${top}px`);
    els.moreMenu.style.setProperty('--baba-more-menu-left', `${left}px`);
  }

  function setActiveTab(tab) {
    const organizerViews = ['organizer', 'access', 'players'];
    const safeTab = !isOrganizer() && organizerViews.includes(tab) ? 'dashboard' : (VALID_VIEWS.has(tab) ? tab : 'dashboard');
    localStorage.setItem(VIEW_KEY, safeTab);
    document.body.dataset.babaView = safeTab;
    $$('.baba-tabs [data-tab], #baba-more-menu [data-tab], .baba-bottom-nav [data-tab], #baba-mobile-more-menu [data-tab]').forEach((button) => button.classList.toggle('active', button.dataset.tab === safeTab));
    const isMoreTab = ['teams', 'table', 'ranking', 'history'].includes(safeTab);
    els.moreToggle?.classList.toggle('active', isMoreTab);
    els.bottomMoreToggle?.classList.toggle('active', isMoreTab);
    els.mobileMoreMenu?.classList.add('hidden');
    els.bottomMoreToggle?.setAttribute('aria-expanded', 'false');
    closeMoreMenu();
    $$('.baba-view').forEach((view) => view.classList.toggle('active', view.dataset.view === safeTab));
    window.BabaRepository?.activateView?.(safeTab);
    if (safeTab === 'teams') renderDrawTeams(getDisplayedBaba());
  }

  function focusableElements(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hidden && !element.closest('.hidden'));
  }

  function trapDialogFocus(event, container) {
    if (event.key !== 'Tab') return;
    const focusable = focusableElements(container);
    if (!focusable.length) {
      event.preventDefault();
      container.querySelector('[tabindex="-1"]')?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleDialogKeydown(event) {
    if (!els.historyEditModal?.classList.contains('hidden')) {
      if (event.key === 'Escape') { event.preventDefault(); closeHistorySummaryEditor(); return; }
      trapDialogFocus(event, els.historyEditModal);
      return;
    }
    if (!els.playerCodeForm?.classList.contains('hidden')) {
      if (event.key === 'Escape') { event.preventDefault(); closePlayerCode(); return; }
      trapDialogFocus(event, els.playerCodeForm);
      return;
    }
    if (!els.passwordForm?.classList.contains('hidden')) {
      if (event.key === 'Escape') { event.preventDefault(); closeOrganizerPassword(); return; }
      trapDialogFocus(event, els.passwordForm);
      return;
    }
    if (!els.drawOverlay?.classList.contains('hidden')) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawExperience();
        return;
      }
      trapDialogFocus(event, els.drawOverlay);
      return;
    }
    if (!els.playerDetailModal?.classList.contains('hidden')) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePlayerDetail();
        return;
      }
      trapDialogFocus(event, els.playerDetailModal);
      return;
    }
    if (!els.teamDetailModal?.classList.contains('hidden')) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeTeamDetail();
        return;
      }
      trapDialogFocus(event, els.teamDetailModal);
    }
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
      title: 'Baba Psyzon',
      text: 'Acompanhe o Baba Psyzon ao vivo: times, placar, ranking e histórico.',
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
    return `${stats.totalGols || 0} gols, ${stats.totalVitorias || 0} vitórias, ${stats.totalEmpates || 0} empates, ${stats.totalDerrotas || 0} derrotas, ${stats.aproveitamento || 0}% de aproveitamento e ${stats.totalBabas || 0} babas.`;
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
    const previousText = improved.prev ? `Nos 5 anteriores tinha ${improved.prev.totalGols || 0} gols e ${improved.prev.totalVitorias || 0} vitórias.` : 'Não encontrei 5 babas anteriores suficientes para comparar toda a evolução.';
    return `${improved.stats.nome} esta em melhor fase recente pelos ultimos ${latest.length} babas.\n\nNeste recorte: ${assistantDescribeStats(improved.stats)}\n${previousText}\n\nUsei gols, vitorias, aproveitamento e volume de jogos para chegar nessa analise.`;
  }

  function assistantPaymentAnswer(question) {
    if (!isOrganizer()) {
      return 'Pagamentos sao informacao administrativa. Entre como organizador para consultar quem pagou, pendencias e valores.';
    }
    const baba = getActiveBaba();
    const normalized = normalizeAssistantText(question);
    const players = getPaymentPlayers(baba).filter(isPaymentEligiblePlayer);
    if (!players.length) return 'Não encontrei jogadores cadastrados para calcular pagamentos.';
    const playerAsked = assistantFindPlayers(question)[0] || (/\bele\b|\bela\b/.test(normalized) ? getPlayer(babaAssistant.context.players[0]) : null);
    if (playerAsked) {
      if (!isPaymentEligiblePlayer(playerAsked)) {
        return `${playerAsked.nome} está como ${playerStatusLabel(playerAsked).toLowerCase()} e não entra nos cálculos de pagamento deste mês.`;
      }
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
      if (!items.length) return `Não encontrei desempenho registrado em ${period.label} entre jogadores pendentes de pagamento.`;
      const top = items[0];
      babaAssistant.context.players = [top.jogadorId];
      return `${top.nome} lidera entre os jogadores pendentes de pagamento em ${period.label}: ${assistantDescribeStats(top)}\n\nPagamento dele ainda consta como pendente no mes atual.`;
    }
    if (asksPerformance && (normalized.includes('ja pag') || normalized.includes('pagaram') || normalized.includes('pagou'))) {
      const { period, ranking } = assistantRankingForQuestion(question);
      const paidIds = new Set(paid.map((player) => player.id));
      const metric = normalized.includes('vitor') || normalized.includes('ganh') ? 'wins' : (normalized.includes('aproveitamento') ? 'efficiency' : 'goals');
      const items = sortRanking(ranking, metric).filter((item) => paidIds.has(item.jogadorId));
      if (!items.length) return `Não encontrei desempenho registrado em ${period.label} entre jogadores que já pagaram.`;
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
    if (normalized.includes('vitor') || normalized.includes('ganh')) return `${asked.nome} tem ${stats.totalVitorias || 0} vitórias em ${period.label}, com ${stats.aproveitamento || 0}% de aproveitamento.`;
    if (normalized.includes('perd')) return `${asked.nome} tem ${stats.totalDerrotas || 0} derrotas em ${period.label}.`;
    if (normalized.includes('aproveitamento') || normalized.includes('desempenho')) return `${asked.nome} em ${period.label}: ${assistantDescribeStats(stats)}`;
    return `${asked.nome} em ${period.label}: ${assistantDescribeStats(stats)}`;
  }

  function assistantPresenceAnswer(question) {
    const normalized = normalizeAssistantText(question);
    const period = assistantResolvePeriod(question);
    if (!period.babas.length) return `Não encontrei babas registrados para ${period.label}.`;
    if (normalized.includes('quem jogou') || normalized.includes('quem veio') || normalized.includes('presentes')) {
      const names = new Set();
      period.babas.forEach((baba) => (baba.jogadoresPresentes || []).forEach((id) => names.add(playerName(id, baba))));
      if (!names.size) return `Não encontrei presenças registradas em ${period.label}.`;
      return `Participaram em ${period.label} (${names.size}):\n- ${Array.from(names).sort((a, b) => a.localeCompare(b)).join('\n- ')}`;
    }
    if (normalized.includes('nao veio') || normalized.includes('faltou')) {
      const active = period.babas[0];
      const present = new Set(period.babas.flatMap((baba) => baba.jogadoresPresentes || []));
      const absent = state.players.filter((player) => player.ativo !== false && !present.has(player.id));
      if (!absent.length) return `Não encontrei faltas em ${period.label}.`;
      return `Jogadores sem presenca registrada em ${period.label}:\n- ${absent.map((player) => player.nome || playerName(player.id, active)).join('\n- ')}`;
    }
    const ranking = assistantRankingForBabas(period.babas);
    const top = Object.values(ranking).filter((stats) => stats.totalBabas > 0).sort((a, b) => b.totalBabas - a.totalBabas || a.nome.localeCompare(b.nome))[0];
    if (!top) return `Não encontrei presenças suficientes em ${period.label}.`;
    babaAssistant.context.players = [top.jogadorId];
    return `${top.nome} e quem mais participou em ${period.label}, com ${top.totalBabas} presencas registradas.`;
  }

  function assistantTeamAnswer(question) {
    const normalized = normalizeAssistantText(question);
    const period = assistantResolvePeriod(question);
    if (!period.babas.length) return `Não encontrei babas para analisar times em ${period.label}.`;
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
      return `${top.nome} aparece como melhor goleiro pelo critério de menos derrotas e mais vitórias: ${top.derrotas} derrotas e ${top.vitorias} vitórias em ${top.jogos} jogos.`;
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
    babaAssistant.els.close?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeBabaAssistant();
      babaAssistant.els.toggle?.focus({ preventScroll: true });
    });
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
      if (event.key === 'Escape' && !els.playerDetailModal?.classList.contains('hidden')) closePlayerDetail();
      else if (event.key === 'Escape' && !els.teamDetailModal.classList.contains('hidden')) closeTeamDetail();
    });
  }

  function wireEvents() {
    document.addEventListener('pointerdown', (event) => {
      unlockBabaAudio();
      requestSiteWakeLock();
      beginQueuePointerDrag(event);
    }, { passive: true });
    document.addEventListener('pointermove', moveQueuePointerDrag, { passive: false });
    document.addEventListener('pointerup', (event) => finishQueuePointerDrag(event));
    document.addEventListener('pointercancel', (event) => finishQueuePointerDrag(event, true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestSiteWakeLock();
    });
    window.addEventListener('pagehide', releaseSiteWakeLock);
    window.addEventListener('pageshow', requestSiteWakeLock);

    els.queueList?.addEventListener('dragstart', (event) => {
      const handle = event.target.closest?.('[data-queue-drag-handle]');
      const item = handle?.closest?.('[data-queue-team-id]');
      if (!item || !isOrganizer()) return event.preventDefault();
      queueNativeDragTeamId = item.dataset.queueTeamId;
      item.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', queueNativeDragTeamId);
    });
    els.queueList?.addEventListener('dragover', (event) => {
      if (!queueNativeDragTeamId) return;
      const draggedItem = els.queueList.querySelector(`[data-queue-team-id="${CSS.escape(queueNativeDragTeamId)}"]`);
      const target = event.target.closest?.('[data-queue-team-id]');
      if (!draggedItem || !target || target === draggedItem) return;
      event.preventDefault();
      els.queueList.querySelectorAll('.queue-item').forEach((item) => item.classList.remove('is-drag-over'));
      target.classList.add('is-drag-over');
      const rect = target.getBoundingClientRect();
      els.queueList.insertBefore(draggedItem, event.clientY > rect.top + rect.height / 2 ? target.nextSibling : target);
    });
    els.queueList?.addEventListener('drop', (event) => {
      if (!queueNativeDragTeamId) return;
      event.preventDefault();
      const order = queueOrderFromDOM();
      queueNativeDragTeamId = null;
      clearQueueDragStyles();
      applyTeamQueueOrder(order);
    });
    els.queueList?.addEventListener('dragend', () => {
      const order = queueOrderFromDOM();
      const hadDrag = Boolean(queueNativeDragTeamId);
      queueNativeDragTeamId = null;
      clearQueueDragStyles();
      if (hadDrag) applyTeamQueueOrder(order);
    });
    wireBabaAssistant();
    document.addEventListener('click', rememberActionButton, true);
    els.enterOrganizer.addEventListener('click', () => {
      if (authenticatedAdmin()) setMode('organizer', { rememberDevice: true });
      else openOrganizerPassword();
    });
    els.enterPlayer.addEventListener('click', openPlayerCode);
    els.closePassword?.addEventListener('click', closeOrganizerPassword);
    els.closePlayerCode?.addEventListener('click', closePlayerCode);
    els.passwordForm.addEventListener('click', (event) => {
      if (event.target === els.passwordForm) closeOrganizerPassword();
    });
    els.passwordForm.addEventListener('submit', loginOrganizerWithEmail);
    els.organizerGoogleLogin?.addEventListener('click', loginOrganizerWithGoogle);
    els.commissionAccessForm?.addEventListener('submit', saveCommissionAccess);
    els.playerCodeForm?.addEventListener('submit', submitPlayerCode);
    els.playerCodeForm?.addEventListener('click', (event) => {
      if (event.target === els.playerCodeForm) closePlayerCode();
    });
    els.playerCodeInput?.addEventListener('input', () => {
      els.playerCodeInput.value = window.BabaAccessRepository?.formatCode?.(els.playerCodeInput.value) || els.playerCodeInput.value.toUpperCase();
    });
    els.generatePlayerCode?.addEventListener('click', generatePlayerAccessCode);
    els.copyPlayerCode?.addEventListener('click', copyPlayerAccessCode);
    els.logoutBtn?.addEventListener('click', logout);
    els.modeReset.addEventListener('click', resetMode);
    els.themeToggle?.addEventListener('click', toggleBabaTheme);
    els.exportBackupJSON?.addEventListener('click', exportBackupJSON);
    els.importBackupJSON?.addEventListener('click', () => {
      if (!requireOrganizer()) return;
      els.backupJSONFile?.click();
    });
    els.backupJSONFile?.addEventListener('change', () => importBackupJSON(els.backupJSONFile.files?.[0]));
    els.organizerFab?.addEventListener('click', () => {
      if (!requireOrganizer()) return;
      setActiveTab('organizer');
      window.requestAnimationFrame(() => {
        document.querySelector('[data-view="organizer"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    els.createToday.addEventListener('click', () => createBaba(todayISO()));
    els.organizerCreateToday?.addEventListener('click', () => createBaba(todayISO()));
    els.saveHistory.addEventListener('click', () => {
      const baba = getActiveBaba();
      if (!baba) return showToast('Crie um baba primeiro.');
      if (baba.status === 'finalizado') return showToast('Este baba ja esta salvo no historico.');
      finishBaba();
    });
    els.markPresent.addEventListener('click', () => els.presentModal.classList.remove('hidden'));
    els.drawTeams.addEventListener('click', openDrawSetup);
    els.startFirstGame.addEventListener('click', startFirstGame);
    els.undoGame.addEventListener('click', undoLastGame);
    els.finishBaba.addEventListener('click', finishBaba);
    els.resetCurrent.addEventListener('click', resetCurrentBaba);
    els.playerForm.addEventListener('submit', addPlayer);
    els.playerName.addEventListener('input', () => els.playerName.setCustomValidity(''));
    els.goalForm?.addEventListener('submit', addPurchaseGoal);
    els.goalCancelEdit?.addEventListener('click', resetPurchaseGoalForm);
    els.goalImage?.addEventListener('change', previewGoalImage);
    els.shareFab.addEventListener('click', shareBabaLink);
    els.closePresentModal.addEventListener('click', () => els.presentModal.classList.add('hidden'));
    els.closeGoalModal.addEventListener('click', closeGoalPicker);
    els.closeTeamDetailModal.addEventListener('click', closeTeamDetail);
    els.closePlayerDetailModal?.addEventListener('click', closePlayerDetail);
    els.closeGameDetailModal.addEventListener('click', () => els.gameDetailModal.classList.add('hidden'));
    els.closeGameEditModal?.addEventListener('click', closeGameEditModal);
    els.gameEditForm?.addEventListener('submit', saveFinishedGameEdit);
    els.closeHistoryEditModal?.addEventListener('click', closeHistorySummaryEditor);
    els.historyEditForm?.addEventListener('submit', saveHistorySummaryEdit);
    els.drawSkipButton?.addEventListener('click', skipDrawAnimation);
    els.drawCloseButton?.addEventListener('click', closeDrawExperience);
    els.drawSoundToggle?.addEventListener('click', toggleDrawSound);
    document.addEventListener('keydown', handleDialogKeydown);
    els.presentModal.addEventListener('click', (event) => {
      if (event.target === els.presentModal) els.presentModal.classList.add('hidden');
    });
    els.goalModal.addEventListener('click', (event) => {
      if (event.target === els.goalModal) closeGoalPicker();
    });
    els.teamDetailModal.addEventListener('click', (event) => {
      if (event.target === els.teamDetailModal) closeTeamDetail();
    });
    els.playerDetailModal?.addEventListener('click', (event) => {
      if (event.target === els.playerDetailModal) closePlayerDetail();
    });
    els.gameDetailModal.addEventListener('click', (event) => {
      if (event.target === els.gameDetailModal) els.gameDetailModal.classList.add('hidden');
    });
    els.gameEditModal?.addEventListener('click', (event) => {
      if (event.target === els.gameEditModal) closeGameEditModal();
    });
    els.historyEditModal?.addEventListener('click', (event) => {
      if (event.target === els.historyEditModal) closeHistorySummaryEditor();
    });

    $$('.baba-tabs [data-tab], .baba-bottom-nav [data-tab], #baba-mobile-more-menu [data-tab]').forEach((button) => {
      button.addEventListener('click', () => setActiveTab(button.dataset.tab));
    });

    $$('[data-open-view]').forEach((button) => {
      button.addEventListener('click', () => setActiveTab(button.dataset.openView));
    });

    els.bottomMoreToggle?.addEventListener('click', () => {
      const willOpen = els.mobileMoreMenu?.classList.contains('hidden');
      els.mobileMoreMenu?.classList.toggle('hidden', !willOpen);
      els.bottomMoreToggle?.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    $$('[data-close-bottom-more]').forEach((button) => {
      button.addEventListener('click', () => {
        els.mobileMoreMenu?.classList.add('hidden');
        els.bottomMoreToggle?.setAttribute('aria-expanded', 'false');
      });
    });

    els.moreToggle?.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = els.moreMenu?.classList.contains('hidden');
      if (willOpen) {
        els.moreMenu?.classList.remove('hidden');
        els.moreToggle?.setAttribute('aria-expanded', 'true');
        positionMoreMenu();
        window.requestAnimationFrame(positionMoreMenu);
      } else {
        closeMoreMenu();
      }
    });

    els.drawActionBar?.addEventListener('click', (event) => {
      const startButton = event.target.closest('[data-action="start-first-live"]');
      if (!startButton || startButton.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      startFirstGame(event);
    });

    els.headerManage?.addEventListener('click', () => setActiveTab('organizer'));

    document.addEventListener('click', (event) => {
      if (event.target.closest('#baba-more-menu [role="menuitem"]')) return closeMoreMenu();
      if (!event.target.closest('.baba-more-nav, #baba-more-menu')) closeMoreMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !els.moreMenu?.classList.contains('hidden')) closeMoreMenu({ restoreFocus: true });
      if (event.key === 'Escape' && !els.mobileMoreMenu?.classList.contains('hidden')) {
        els.mobileMoreMenu.classList.add('hidden');
        els.bottomMoreToggle?.setAttribute('aria-expanded', 'false');
      }
      if (event.key === 'Escape' && !els.gameEditModal?.classList.contains('hidden')) closeGameEditModal();
    });

    window.addEventListener('resize', positionMoreMenu);
    window.addEventListener('scroll', positionMoreMenu, { passive: true });
    window.visualViewport?.addEventListener('resize', positionMoreMenu);

    document.addEventListener('change', (event) => {
      const gameScore = event.target.closest('[data-game-edit-score]');
      if (gameScore) return updateGameEditScore(gameScore.dataset.gameEditScore, gameScore.value);
      const gameScorer = event.target.closest('[data-game-edit-scorer]');
      if (gameScorer && selectedGameEdit) {
        const side = gameScorer.dataset.gameEditScorer;
        selectedGameEdit[`scorers${side}`] = Array.from(
          els.gameEditContent.querySelectorAll(`[data-game-edit-scorer="${side}"]`),
        ).map((select) => select.value);
        return;
      }
      const rankingModeSelect = event.target.closest('[data-ranking-mode-select]');
      if (rankingModeSelect) {
        rankingMode = RANKING_MODES.some((item) => item.id === rankingModeSelect.value) ? rankingModeSelect.value : 'goals';
        expandedRankingKeys.clear();
        render();
        return;
      }
      const rankingScopeSelect = event.target.closest('[data-ranking-scope-select]');
      if (rankingScopeSelect) {
        rankingScope = RANKING_SCOPES.some((item) => item.id === rankingScopeSelect.value) ? rankingScopeSelect.value : 'monthly';
        expandedRankingKeys.clear();
        render();
        return;
      }
      const playerStatusSelect = event.target.closest('[data-player-status-id]');
      if (playerStatusSelect) return setPlayerStatus(playerStatusSelect.dataset.playerStatusId, playerStatusSelect.value);
      const playerFilter = event.target.closest('[data-player-list-filter]');
      if (playerFilter) {
        playerPaymentFilters[playerFilter.dataset.playerListFilter] = playerFilter.value;
        applyPlayerPaymentFilters();
      }
      const input = event.target.closest('[data-present-id]');
      if (input) togglePresent(input.dataset.presentId, input.checked);
      const moveSelect = event.target.closest('[data-move-player-id]');
      if (moveSelect) assignPlayerToTeam(moveSelect.dataset.movePlayerId, moveSelect.value);
      const addSelect = event.target.closest('[data-add-player-team]');
      if (addSelect?.value) assignPlayerToTeam(addSelect.value, addSelect.dataset.addPlayerTeam);
    });

    document.addEventListener('input', (event) => {
      const playerFilter = event.target.closest('[data-player-list-filter="query"]');
      if (!playerFilter) return;
      playerPaymentFilters.query = playerFilter.value;
      applyPlayerPaymentFilters();
    });

    document.addEventListener('click', (event) => {
      const exportButton = event.target.closest('[data-export-pdf]');
      if (exportButton) return exportBabaPdf(exportButton.dataset.exportPdf, exportButton);

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

      const rankingScopeButton = event.target.closest('[data-ranking-scope]');
      if (rankingScopeButton) {
        rankingScope = RANKING_SCOPES.some((item) => item.id === rankingScopeButton.dataset.rankingScope)
          ? rankingScopeButton.dataset.rankingScope
          : 'monthly';
        expandedRankingKeys.clear();
        render();
        return;
      }

      const actionButton = event.target.closest('[data-action]');
      if (actionButton?.dataset.action === 'queue-make-next') return moveQueuedTeam(actionButton.dataset.teamId, 'next');
      if (actionButton?.dataset.action === 'queue-move-end') return moveQueuedTeam(actionButton.dataset.teamId, 'end');
      if (actionButton?.dataset.action === 'set-match-mode') return setBabaMatchMode(actionButton.dataset.matchMode);
      if (actionButton?.dataset.action === 'manual-stat') {
        return updateManualStat(
          actionButton.dataset.teamId,
          actionButton.dataset.manualField,
          Number(actionButton.dataset.delta || 0),
          actionButton.dataset.playerId || '',
          actionButton.dataset.babaId || null,
        );
      }
      if (actionButton?.dataset.action === 'open-dashboard') return setActiveTab('dashboard');
      if (actionButton?.dataset.action === 'begin-team-draw') return drawTeams();
      if (actionButton?.dataset.action === 'finish-and-save-draw') return finishBaba();
      if (actionButton?.dataset.action === 'open-present-editor') {
        if (!requireOrganizer()) return;
        els.presentModal.classList.remove('hidden');
        return window.requestAnimationFrame(() => els.presentModal.querySelector('input, button')?.focus({ preventScroll: true }));
      }
      if (actionButton?.dataset.action === 'continue-present-draw') {
        if (!requireOrganizer()) return;
        const baba = getActiveBaba();
        els.presentModal.classList.add('hidden');
        if (baba?.teams?.length) return createLateArrivalTeam(baba);
        return setActiveTab('teams');
      }
      if (actionButton?.dataset.action === 'open-team-management') return openTeamDetail(actionButton.dataset.teamId);
      if (actionButton?.dataset.action === 'export-teams-txt') return exportTeamsTxt();
      if (actionButton?.dataset.action === 'advance-draw-experience') return advanceDrawExperience();
      if (actionButton?.dataset.action === 'finish-draw-experience') return finalizeDrawExperience();
      if (actionButton?.dataset.action === 'toggle-player') return togglePlayerActive(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'toggle-player-novice') return togglePlayerNovice(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'delete-player') return deletePlayer(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'delete-visitor') return deleteVisitor(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'create-late-team') return createLateArrivalTeam();
      if (actionButton?.dataset.action === 'toggle-team-rotation') return toggleTeamRotation(actionButton.dataset.teamId);
      if (actionButton?.dataset.action === 'delete-team-from-baba') return deleteTeamFromBaba(actionButton.dataset.teamId);
      if (actionButton?.dataset.action === 'add-player-to-team') {
        const select = actionButton.closest('.baba-roster-add')?.querySelector(`[data-team-add-select="${CSS.escape(actionButton.dataset.teamId)}"]`);
        if (!select?.value) return showToast('Selecione um jogador para adicionar.');
        return assignPlayerToTeam(select.value, actionButton.dataset.teamId, actionButton.dataset.babaId || null);
      }
      if (actionButton?.dataset.action === 'move-player-from-card') {
        const select = document.getElementById('player-detail-team-select');
        if (!select?.value) return showToast('Selecione o time de destino.');
        return assignPlayerToTeam(actionButton.dataset.id, select.value, actionButton.dataset.babaId || null);
      }
      if (actionButton?.dataset.action === 'remove-player-from-team') return removePlayerFromTeam(actionButton.dataset.id, actionButton.dataset.babaId || null);
      if (actionButton?.dataset.action === 'remove-player-from-baba') return removePlayerFromCurrentBaba(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'edit-goal') return editPurchaseGoal(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'delete-goal') return deletePurchaseGoal(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'save-goal-collected') {
        const input = document.querySelector(`[data-goal-collected-id="${actionButton.dataset.id}"]`);
        return updatePurchaseGoalCollected(actionButton.dataset.id, input?.value);
      }
      if (actionButton?.dataset.action === 'toggle-payment') return toggleBabaPayment(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'delete-history') return deleteHistoryBaba(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'edit-history-summary') return openHistorySummaryEditor(actionButton.dataset.babaId);
      if (actionButton?.dataset.action === 'edit-current-game') return openFinishedGameEditor(actionButton.dataset.gameNumber, actionButton.dataset.babaId || null);
      if (actionButton?.dataset.action === 'edit-history-game') return openFinishedGameEditor(actionButton.dataset.gameNumber, actionButton.dataset.babaId);
      if (actionButton?.dataset.action === 'edit-history-roster') return editHistoryTeamRoster(actionButton.dataset.babaId, actionButton.dataset.teamId);
      if (actionButton?.dataset.action === 'cancel-game-edit') return closeGameEditModal();
      if (actionButton?.dataset.action === 'cancel-history-edit') return closeHistorySummaryEditor();
      if (actionButton?.dataset.action === 'change-game-edit-score') {
        const side = actionButton.dataset.side;
        const current = Number(selectedGameEdit?.[`score${side}`] || 0);
        return updateGameEditScore(side, Math.max(0, Math.min(99, current + Number(actionButton.dataset.delta || 0))));
      }
      if (actionButton?.dataset.action === 'delete-current-game') return deleteCurrentGame(actionButton.dataset.gameNumber);
      if (actionButton?.dataset.action === 'reset-mode') return resetMode();
      if (actionButton?.dataset.action === 'logout') return logout();
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

      const playerButton = event.target.closest('[data-player-detail-id]');
      if (playerButton) return openPlayerDetail(playerButton.dataset.playerDetailId, playerButton.dataset.playerDetailBabaId);

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
          .catch((error) => showToast(error.message || 'Não foi possível carregar o histórico anterior.'))
          .finally(() => { historyMoreButton.disabled = false; });
      }

      const monthButton = event.target.closest('[data-month-key]');
      if (monthButton) {
        selectedMonthlyKey = monthButton.dataset.monthKey;
        renderMonthlyHistory();
        window.BabaRepository?.loadMonthStats?.(selectedMonthlyKey)
          .catch((error) => showToast(error.message || 'Não foi possível carregar o ranking deste mês.'));
      }
    });

    window.addEventListener('baba-remote-state-ready', (event) => {
      scheduleCloudStateApply(event.detail?.state || null);
    });
    window.addEventListener('baba-save-progress', (event) => {
      if (!event.detail?.saving) clearSavingButton();
    });
  }

  function applyCommittedImport({ baba, newPlayers = [], updatedPlayers = [] } = {}) {
    if (!baba?.id) throw new Error('Baba importado inválido.');
    newPlayers.forEach((player) => {
      if (player?.id && !state.players.some((item) => item.id === player.id)) state.players.push(player);
    });
    updatedPlayers.forEach((player) => {
      const index = state.players.findIndex((item) => item.id === player.id);
      if (index >= 0) state.players[index] = player;
    });
    state.babas = state.babas.filter((item) => item.id !== baba.id);
    state.babas.unshift(baba);
    state.activeBabaId = baba.id;
    selectedHistoryId = baba.id;
    saveState('Baba importado e salvo no histórico.');
    setActiveTab('history');
  }

  function applyRevertedImport({ babaId, removedPlayerIds = [], noviceDeactivatedPlayerIds = [] } = {}) {
    const baba = state.babas.find((item) => item.id === babaId);
    if (baba) applyDeletedBabaToPersistedStats(baba);
    state.babas = state.babas.filter((item) => item.id !== babaId);
    const removable = new Set(removedPlayerIds);
    state.players = state.players.filter((player) => !removable.has(player.id));
    const deactivateNovice = new Set(noviceDeactivatedPlayerIds);
    state.players.forEach((player) => {
      if (!deactivateNovice.has(player.id)) return;
      applyPlayerStatus(player, PLAYER_STATUS.REGULAR);
      player.noviceReason = 'import-reverted';
      player.noviceReasonImportId = null;
    });
    if (state.activeBabaId === babaId) state.activeBabaId = state.babas.find((item) => item.status !== 'finalizado')?.id || state.babas[0]?.id || null;
    if (selectedHistoryId === babaId) selectedHistoryId = null;
    saveState('Importação desfeita; dados reutilizados foram preservados.');
  }

  window.BabaImportHost = Object.freeze({
    getState: () => state,
    isOrganizer,
    showToast,
    newId,
    formatDate,
    noviceExitPolicy: NOVICE_EXIT_POLICY,
    applyCommittedImport,
    applyRevertedImport,
  });
  window.dispatchEvent(new CustomEvent('baba-import-host-ready'));

  async function boot() {
    if (hasBooted) return;
    hasBooted = true;
    const savedTheme = window.ThemeProvider?.getResolvedMode?.() || localStorage.getItem(BABA_THEME_KEY) || 'light';
    applyBabaTheme(savedTheme);
    window.ThemeProvider?.subscribe?.(({ resolvedMode }) => applyBabaTheme(resolvedMode));
    window.BabaTeamTheme?.subscribe?.(() => {
      applyConfiguredTeamIdentities();
      render();
      window.BabaHtmlTools?.polishDom?.();
    });
    document.body.dataset.babaView = document.querySelector('.baba-view.active')?.dataset.view || 'dashboard';
    window.BabaRepository?.activateView?.(document.body.dataset.babaView);
    wireEvents();
    if (!timerTick) timerTick = setInterval(renderTimerOnly, 1000);
    const sessionMode = sessionStorage.getItem(MODE_KEY);
    const rememberedMode = localStorage.getItem(MODE_KEY);
    const savedMode = sessionMode || rememberedMode;
    document.body.classList.toggle('baba-locked-viewer', isForcedViewerMode());
    if (isForcedViewerMode()) setMode('player', { rememberDevice: false });
    else if (authenticatedAdmin()) {
      setMode('organizer', { rememberDevice: true });
      restorePlayerAccessCodeForOrganizer();
      refreshCommissionAccess();
    }
    else if (savedMode === 'player') {
      const accessRepository = await waitForAccessRepository();
      const restored = await accessRepository?.restorePlayerAccess?.();
      if (restored?.valid) {
        try {
          const syncedState = await window.BabaRepository?.refreshAccountData?.(restored.accountId);
          state = syncedState ? normalizeState(syncedState) : readState();
        } catch (error) {
          state = readState();
          showToast('Sem conexão: exibindo a última cópia sincronizada deste organizador.');
        }
        setMode('player', { rememberDevice: true });
      }
      else resetMode();
    } else resetMode();
    render();
    window.BabaImportUI?.mount?.();
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

  window.addEventListener('firebase-auth-state', (event) => {
    if (!hasBooted) return;
    if (event.detail?.authenticated) {
      state = readState();
      setMode('organizer', { rememberDevice: true });
      restorePlayerAccessCodeForOrganizer();
      refreshCommissionAccess();
    }
    else if (mode === 'organizer') resetMode();
  });

  window.addEventListener('firebase-auth-error', (event) => {
    if (!hasBooted) return;
    openOrganizerPassword();
    const messages = {
      'auth/unauthorized-domain': 'Este domínio precisa ser autorizado no Firebase Authentication.',
      'auth/operation-not-allowed': 'Ative o provedor Google no Firebase Authentication.',
    };
    els.passwordFeedback.textContent = messages[event.detail?.code]
      || event.detail?.message
      || 'Não foi possível concluir o login com o Google.';
  });

  setTimeout(() => {
    if (!window.BackendInitialized && window.location.protocol === 'file:') {
      window.BackendInitialized = true;
      state = readState();
      boot();
      document.getElementById('initial-loader')?.remove();
    }
  }, 1500);
})();
