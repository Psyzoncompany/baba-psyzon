(() => {
  const STORAGE_KEY = 'psyzon_baba_state_v1';
  const ADMIN_PASSWORD = '153090';
  const TEAM_NAMES = ['Barcelona', 'Arsenal', 'Real Madrid', 'PSG', 'Chelsea'];
  const MODE_KEY = 'psyzon_baba_mode';

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
    updateDate: $('#update-date-btn'),
    markPresent: $('#mark-present-btn'),
    drawTeams: $('#draw-teams-btn'),
    startFirstGame: $('#start-first-game-btn'),
    nextGame: $('#next-game-btn'),
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
    dailyTopScorers: $('#daily-top-scorers'),
    currentGamesList: $('#current-games-list'),
    lastResultPill: $('#last-result-pill'),
    lastResultPanel: $('#last-result-panel'),
    teamsGrid: $('#teams-grid'),
    rankingList: $('#ranking-list'),
    dailyRankingList: $('#daily-ranking-list'),
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
  let toastTimer = null;
  let goalTeamId = null;
  let timerTick = null;
  let hasBooted = false;

  function newId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function todayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
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
    timerEl.textContent = isPrepared ? 'Aguardando inicio' : (remaining ? formatCountdown(remaining) : 'Tempo esgotado');
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
      updatedAt: Date.now(),
    };
  }

  function normalizeState(value) {
    const next = value && typeof value === 'object' ? value : createEmptyState();
    next.version = 1;
    next.players = Array.isArray(next.players) ? next.players : [];
    next.babas = Array.isArray(next.babas) ? next.babas : [];
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

  function getTeam(baba, id) {
    return baba?.teams?.find((team) => team.id === id) || null;
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

  function playerName(id) {
    return getPlayer(id)?.nome || 'Jogador removido';
  }

  function isOrganizer() {
    return mode === 'organizer';
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
    els.gateway.classList.add('hidden');
    els.app.classList.remove('hidden');
    if (nextMode === 'player') setActiveTab('dashboard');
    render();
  }

  function resetMode() {
    mode = null;
    sessionStorage.removeItem(MODE_KEY);
    document.body.classList.remove('baba-player-mode');
    els.gateway.classList.remove('hidden');
    els.app.classList.add('hidden');
    els.passwordForm.classList.add('hidden');
    els.passwordInput.value = '';
    els.passwordFeedback.textContent = '';
  }

  function logout() {
    if (window.firebaseAuth?.logout) {
      window.firebaseAuth.logout();
      return;
    }
    window.location.href = 'login.html';
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

    state.players.push({
      id: newId('player'),
      nome,
      tipo: els.playerType.value === 'goleiro' ? 'goleiro' : 'jogador',
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
        baba.teams = [];
        baba.filaTimes = [];
        baba.jogoAtual = null;
      }
    });
    saveState('Jogador removido.');
  }

  function togglePresent(playerId, checked) {
    if (!requireOrganizer()) return;
    const baba = getActiveBaba();
    if (!baba) return showToast('Crie um baba primeiro.');
    if (baba.status === 'finalizado') return showToast('Este baba ja foi finalizado.');

    const presentSet = new Set(baba.jogadoresPresentes || []);
    if (checked) presentSet.add(playerId);
    else presentSet.delete(playerId);
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

    const presentPlayers = (baba.jogadoresPresentes || [])
      .map(getPlayer)
      .filter((player) => player?.ativo);

    if (presentPlayers.length < 2) {
      showToast('Marque pelo menos 2 jogadores presentes para sortear.');
      return;
    }

    const teamCount = Math.min(TEAM_NAMES.length, Math.max(2, Math.ceil(presentPlayers.length / 5)));
    const teams = TEAM_NAMES.slice(0, teamCount).map((name, index) => ({
      id: `team_${index + 1}`,
      name,
      jogadores: [],
      pontos: 0,
      golsPro: 0,
      golsContra: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
    }));

    const goalkeepers = shuffle(presentPlayers.filter((player) => player.tipo === 'goleiro'));
    const fieldPlayers = shuffle(presentPlayers.filter((player) => player.tipo !== 'goleiro'));

    goalkeepers.forEach((player, index) => {
      teams[index % teams.length].jogadores.push(player.id);
    });

    fieldPlayers.forEach((player) => {
      const target = [...teams].sort((a, b) => a.jogadores.length - b.jogadores.length)[0];
      target.jogadores.push(player.id);
    });

    baba.teams = teams;
    baba.filaTimes = shuffle(teams.map((team) => team.id));
    baba.jogoAtual = null;
    baba.jogos = [];
    baba.lastResult = null;
    baba.pendingTieBreak = null;
    baba.teamRevealIndex = 0;
    baba.status = 'times';
    baba.undoStack = [];
    saveState('Times sorteados com equilibrio e goleiros distribuidos.');
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

    const order = baba.filaTimes.length >= 2 ? [...baba.filaTimes] : shuffle(baba.teams.map((team) => team.id));
    const teamAId = order.shift();
    const teamBId = order.shift();
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
    if (!match.goalEvents.length) {
      match.gols = match.gols || [];
      return;
    }
    match.placarA = 0;
    match.placarB = 0;
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
        <strong>${escapeHTML(playerName(playerId))}</strong>
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
    const player = getPlayer(playerId);
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
    (baba.jogadoresPresentes || []).forEach((playerId) => {
      ranking[playerId] = makeEmptyPlayerStats(playerId, playerName(playerId));
      ranking[playerId].totalBabas = 1;
    });

    (baba.jogos || []).forEach((game) => {
      const teamA = getTeam(baba, game.timeA);
      const teamB = getTeam(baba, game.timeB);
      if (!teamA || !teamB) return;

      if (game.empate) {
        [...teamA.jogadores, ...teamB.jogadores].forEach((id) => ensureStats(ranking, id).totalEmpates += 1);
      } else {
        const winTeam = getTeam(baba, game.vencedor);
        const loseTeam = getTeam(baba, game.perdedor);
        winTeam?.jogadores.forEach((id) => ensureStats(ranking, id).totalVitorias += 1);
        loseTeam?.jogadores.forEach((id) => ensureStats(ranking, id).totalDerrotas += 1);
      }

      (game.gols || []).forEach((goal) => {
        ensureStats(ranking, goal.jogadorId).totalGols += Number(goal.quantidade || 0);
      });
    });

    if (baba.campeaoDoBaba?.jogadores) {
      baba.campeaoDoBaba.jogadores.forEach((id) => ensureStats(ranking, id).totalTitulosBaba += 1);
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
      (baba.jogadoresPresentes || []).forEach((id) => ensureStats(ranking, id).totalBabas += 1);
      if (baba.campeaoDoBaba?.jogadores) {
        baba.campeaoDoBaba.jogadores.forEach((id) => ensureStats(ranking, id).totalTitulosBaba += 1);
      }

      (baba.jogos || []).forEach((game) => {
        const teamA = getTeam(baba, game.timeA);
        const teamB = getTeam(baba, game.timeB);
        if (!teamA || !teamB) return;

        if (game.empate) {
          [...teamA.jogadores, ...teamB.jogadores].forEach((id) => ensureStats(ranking, id).totalEmpates += 1);
        } else {
          getTeam(baba, game.vencedor)?.jogadores.forEach((id) => ensureStats(ranking, id).totalVitorias += 1);
          getTeam(baba, game.perdedor)?.jogadores.forEach((id) => ensureStats(ranking, id).totalDerrotas += 1);
        }

        (game.gols || []).forEach((goal) => {
          ensureStats(ranking, goal.jogadorId).totalGols += Number(goal.quantidade || 0);
        });
      });
    });

    Object.values(ranking).forEach(finalizeStats);
    return ranking;
  }

  function makeEmptyPlayerStats(playerId, name) {
    return {
      jogadorId: playerId,
      nome: name || playerName(playerId),
      totalGols: 0,
      totalVitorias: 0,
      totalEmpates: 0,
      totalDerrotas: 0,
      totalBabas: 0,
      totalTitulosBaba: 0,
      mediaGols: 0,
      aproveitamento: 0,
    };
  }

  function ensureStats(ranking, playerId) {
    if (!ranking[playerId]) ranking[playerId] = makeEmptyPlayerStats(playerId, playerName(playerId));
    return ranking[playerId];
  }

  function finalizeStats(stats) {
    const games = stats.totalVitorias + stats.totalEmpates + stats.totalDerrotas;
    const points = stats.totalVitorias * 3 + stats.totalEmpates;
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
    renderTeams(baba);
    renderDashboard(baba);
    renderStandings(baba);
    renderDailyTopScorers(baba);
    renderCurrentGames(baba);
    renderRankings(baba);
    renderHistory();
    renderTimerOnly();
  }

  function renderHeader(baba) {
    if (baba) {
      els.activeStatus.textContent = baba.status === 'finalizado' ? `Finalizado em ${baba.dataCompleta}` : `Baba aberto - ${baba.dataCompleta}`;
      els.activeSubtitle.textContent = baba.status === 'finalizado'
        ? 'Baba salvo no historico. Crie um novo baba para a proxima rodada.'
        : 'Marque os presentes, sorteie os times e deixe o rodizio trabalhar.';
      els.dateInput.value = baba.dataISO || todayISO();
    } else {
      els.activeStatus.textContent = 'Nenhum baba aberto';
      els.activeSubtitle.textContent = 'Crie o baba de hoje para iniciar a convocacao e o sorteio dos times.';
      els.dateInput.value = todayISO();
    }

    const hasOpenBaba = Boolean(baba && baba.status !== 'finalizado');
    els.createToday.classList.toggle('hidden', hasOpenBaba);
    els.saveHistory.classList.toggle('hidden', !hasOpenBaba);
    els.saveHistory.textContent = 'Finalizar e Salvar Baba de Hoje';
  }

  function renderMetrics(baba) {
    const current = baba?.jogoAtual;
    const teamA = getTeam(baba, current?.timeA);
    const teamB = getTeam(baba, current?.timeB);
    const nextTeam = getTeam(baba, baba?.filaTimes?.[0]);

    els.fieldTeamA.innerHTML = teamA ? teamDetailButton(baba, teamA) : teamLabel(teamA);
    els.fieldTeamB.innerHTML = teamB ? teamDetailButton(baba, teamB) : teamLabel(teamB);
    els.liveScore.textContent = current ? `${current.placarA || 0} x ${current.placarB || 0}` : '0 x 0';
    els.metricPresent.textContent = String(baba?.jogadoresPresentes?.length || 0);
    els.metricTeams.textContent = String(baba?.teams?.length || 0);
    els.metricGames.textContent = String(baba?.jogos?.length || 0);
    els.metricNextTeam.textContent = nextTeam?.name || '-';
  }

  function renderPlayersAdmin() {
    if (!state.players.length) {
      els.playersAdminList.innerHTML = '<div class="baba-empty">Cadastre a lista fixa de jogadores do baba.</div>';
      return;
    }

    els.playersAdminList.innerHTML = state.players.map((player) => `
      <div class="baba-player-admin">
        <div>
          <strong>${escapeHTML(player.nome)}</strong>
          <small>${player.tipo === 'goleiro' ? 'Goleiro' : 'Jogador de linha'} ${player.ativo ? '' : '- inativo'}</small>
        </div>
        <div>
          <button class="baba-mini-btn" type="button" data-action="toggle-player" data-id="${player.id}">${player.ativo ? 'Desativar' : 'Ativar'}</button>
          <button class="baba-mini-btn danger" type="button" data-action="delete-player" data-id="${player.id}">Excluir</button>
        </div>
      </div>
    `).join('');
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
            <strong>${escapeHTML(player.nome)}</strong>
            <small>${player.tipo === 'goleiro' ? 'Goleiro' : 'Linha'}</small>
          </span>
        </label>
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
          ${team.jogadores.map((id) => `<span class="baba-pill">${escapeHTML(playerName(id))}</span>`).join('')}
        </div>
      </article>
    `;

    if (fullyRevealed) {
      els.teamsGrid.innerHTML = `
        ${baba.teams.map((team, position) => renderTeamCard(team, position)).join('')}
        <div class="baba-team-reveal-actions baba-team-reveal-actions--all">
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
      return;
    }

    const teams = [...baba.teams].sort((a, b) => (
      b.pontos - a.pontos ||
      (b.golsPro - b.golsContra) - (a.golsPro - a.golsContra) ||
      b.golsPro - a.golsPro ||
      a.name.localeCompare(b.name)
    ));

    els.standingsList.innerHTML = `
      <div class="baba-table">
        <div class="baba-table__row baba-table__head">
          <span>Time</span><span>Pts</span><span>GP</span><span>SG</span><span>V</span><span>E</span><span>D</span>
        </div>
        ${teams.map((team) => `
          <div class="baba-table__row">
            ${teamDetailButton(baba, team)}
            <b>${team.pontos}</b>
            <span>${team.golsPro}</span>
            <span>${team.golsPro - team.golsContra}</span>
            <span>${team.vitorias}</span>
            <span>${team.empates}</span>
            <span>${team.derrotas}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function getSortedGeneralRanking() {
    return sortRanking(calculateGeneralRanking());
  }

  function getDailyRankingList(baba) {
    const ranking = calculateCurrentBabaRanking(baba);
    return sortRanking(ranking);
  }

  function calculateCurrentBabaRanking(baba) {
    const ranking = calculateDailyRanking(baba || { jogadoresPresentes: [], jogos: [], teams: [] });
    const liveEvents = baba?.jogoAtual?.goalEvents || [];
    liveEvents.forEach((goal) => {
      ensureStats(ranking, goal.jogadorId).totalGols += 1;
    });
    Object.values(ranking).forEach(finalizeStats);
    return ranking;
  }

  function renderDailyTopScorers(baba) {
    const top = getDailyRankingList(baba)
      .filter((stats) => stats.totalGols > 0)
      .slice(0, 5);
    if (!top.length) {
      els.dailyTopScorers.innerHTML = '<div class="baba-empty">Sem gols no baba atual.</div>';
      return;
    }
    els.dailyTopScorers.innerHTML = top.map((stats, index) => `
      <div class="baba-row baba-row--compact">
        <strong>${index + 1}. ${escapeHTML(stats.nome)}</strong>
        <b>${stats.totalGols} gol${stats.totalGols === 1 ? '' : 's'}</b>
      </div>
    `).join('');
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
          <strong>Jogo ${game.numeroJogo}: ${teamDetailButton(baba, getTeam(baba, game.timeA), game.timeANome)} ${game.placarA} x ${game.placarB} ${teamDetailButton(baba, getTeam(baba, game.timeB), game.timeBNome)}</strong>
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
      const player = getPlayer(playerId);
      const dayGoals = dailyRanking[playerId]?.totalGols || 0;
      const generalGoals = generalById.get(playerId)?.totalGols || 0;
      const rank = position.get(playerId) || '-';
      return `
        <div class="baba-row">
          <div>
            <strong>${escapeHTML(player?.nome || playerName(playerId))}</strong>
            <small>${player?.tipo === 'goleiro' ? 'Goleiro' : 'Linha'}</small>
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
        <strong>${teamDetailButton(baba, getTeam(baba, game.timeA), game.timeANome)} ${game.placarA} x ${game.placarB} ${teamDetailButton(baba, getTeam(baba, game.timeB), game.timeBNome)}</strong>
        <b>${game.empate ? 'Empate' : 'Vitoria'}</b>
      </div>
      ${events.length ? events.map((goal) => `
        <div class="baba-row">
          <div>
            <strong>${escapeHTML(goal.jogadorNome)}</strong>
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
    els.matchNumberPill.textContent = match ? `Jogo ${match.numeroJogo}` : 'Jogo 0';

    if (baba?.pendingTieBreak) {
      const tied = (baba.pendingTieBreak.tiedTeams || []).map((id) => getTeam(baba, id)?.name).filter(Boolean).join(' x ');
      els.currentMatchPanel.innerHTML = `
        <div class="baba-empty">Empate em ${escapeHTML(tied)}. Sorteie qual time continua e qual sera o proximo confronto.</div>
        ${isOrganizer() ? '<div class="baba-live-actions baba-live-actions--single"><button class="baba-primary" type="button" data-action="resolve-three-team-tie">Sortear proximo time</button></div>' : ''}
      `;
    } else if (!match || !teamA || !teamB) {
      const canStart = isOrganizer() && baba?.teams?.length >= 2;
      els.currentMatchPanel.innerHTML = `
        <div class="baba-empty">Nenhum jogo iniciado.</div>
        ${canStart ? '<div class="baba-live-actions baba-live-actions--single"><button class="baba-primary" type="button" data-action="start-first-live">Iniciar primeiro jogo</button></div>' : ''}
      `;
    } else {
      const remaining = getRemainingSeconds(match);
      const isPrepared = !match.timerRunning && !match.iniciadoEm;
      const isOver = remaining === 0 && match.iniciadoEm;
      let organizerControls = '';
      if (isOrganizer()) {
        organizerControls = isPrepared ? `
          <div class="baba-live-actions baba-live-actions--single">
            <button class="baba-primary" type="button" data-action="start-prepared-match">Iniciar partida</button>
            <button class="baba-mini-btn" type="button" data-action="edit-time">Editar tempo</button>
          </div>
        ` : isOver ? `
          <div class="baba-live-actions baba-live-actions--single">
            <button class="baba-mini-btn" type="button" data-action="edit-time">Editar tempo</button>
            <button class="baba-primary" type="button" data-action="finish-live-match">Ir para proximo jogo</button>
          </div>
        ` : `
          <div class="baba-live-actions">
            <button class="baba-goal-btn" type="button" data-action="open-goal-picker" data-team-id="${teamA.id}">Gol ${escapeHTML(teamA.name)}</button>
            <button class="baba-goal-btn" type="button" data-action="open-goal-picker" data-team-id="${teamB.id}">Gol ${escapeHTML(teamB.name)}</button>
            <button class="baba-mini-btn" type="button" data-action="pause-time">${match.timerRunning ? 'Pausar' : 'Retomar'}</button>
            <button class="baba-mini-btn" type="button" data-action="edit-time">Editar tempo</button>
            <button class="baba-mini-btn" type="button" data-action="undo-goal">Desfazer gol</button>
            <button class="baba-primary" type="button" data-action="finish-live-match">${isOver ? 'Ir para proximo jogo' : 'Finalizar jogo'}</button>
          </div>
        `;
      }
      const goalLog = (match.goalEvents || []).slice(-5).reverse().map((goal) => `
        <span class="baba-pill">${escapeHTML(goal.jogadorNome)} ${goal.minuto ? `${goal.minuto}'` : ''} - ${escapeHTML(goal.timeNome)}</span>
      `).join('');
      els.currentMatchPanel.innerHTML = `
        <div class="baba-match-live">
          <div class="baba-timer ${isOver ? 'is-over' : ''}" id="current-timer">${isPrepared ? 'Aguardando inicio' : (remaining ? formatCountdown(remaining) : 'Tempo esgotado')}</div>
          <div class="baba-match-live__teams">
            <strong>${teamDetailButton(baba, teamA)}</strong>
            <span>${Number(match.placarA || 0)} x ${Number(match.placarB || 0)}</span>
            <strong>${teamDetailButton(baba, teamB)}</strong>
          </div>
          ${organizerControls}
          <div class="baba-match-live__meta">
            <span class="baba-pill">Inicio: ${match.iniciadoEm ? formatTime(match.iniciadoEm) : 'pendente'}</span>
            <span class="baba-pill">${teamA.jogadores.length} x ${teamB.jogadores.length} jogadores</span>
            ${goalLog || '<span class="baba-pill">Sem gols registrados</span>'}
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
      els.lastResultPill.textContent = `Jogo ${baba.lastResult.jogo}`;
      els.lastResultPanel.innerHTML = `
        <div class="baba-row">
          <div>
            <strong>${escapeHTML(baba.lastResult.resumo)}</strong>
            <small>${baba.lastResult.decididoPorSorteio ? 'Empate: rodizio definido por sorteio' : 'Resultado normal'}</small>
          </div>
        </div>
        <div class="baba-row"><span>Continua em campo</span><b>${teamDetailButton(baba, keep, '-')}</b></div>
        <div class="baba-row"><span>Saiu para a fila</span><b>${teamButtonsFromValue(baba, baba.lastResult.timeQueSaiu) || escapeHTML(outNames)}</b></div>
        <div class="baba-row"><span>Motivo</span><b>${escapeHTML(baba.lastResult.motivoSaida)}</b></div>
      `;
    }
  }

  function renderRankings(baba) {
    const general = sortRanking(calculateGeneralRanking());
    const daily = getDailyRankingList(baba);
    els.rankingList.innerHTML = renderRankingList(general, 'Ainda nao ha ranking geral. Finalize um baba para iniciar.');
    els.dailyRankingList.innerHTML = renderRankingList(daily, 'Ainda nao ha ranking do baba atual.');
  }

  function sortRanking(ranking) {
    return Object.values(ranking || {})
      .filter((stats) => Number(stats.totalGols || 0) > 0)
      .sort((a, b) => (
        b.totalGols - a.totalGols ||
        b.totalVitorias - a.totalVitorias ||
        b.aproveitamento - a.aproveitamento ||
        a.nome.localeCompare(b.nome)
      ));
  }

  function renderRankingList(items, emptyMessage) {
    if (!items.length) return `<div class="baba-empty">${emptyMessage}</div>`;
    return items.map((stats, index) => `
      <div class="baba-row">
        <div>
          <strong>${index + 1}. ${escapeHTML(stats.nome)}</strong>
          <div class="stats">
            <span>${stats.totalGols} gols</span>
            <span>${stats.totalVitorias} V</span>
            <span>${stats.totalEmpates} E</span>
            <span>${stats.totalDerrotas} D</span>
            <span>${stats.totalBabas} babas</span>
            <span>${stats.mediaGols} media</span>
            <span>${stats.totalTitulosBaba} titulos</span>
            <span>${stats.aproveitamento}%</span>
          </div>
        </div>
      </div>
    `).join('');
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
    const championPlayers = (baba.campeaoDoBaba?.jogadores || []).map(playerName).join(', ') || '-';

    els.historyDetail.innerHTML = `
      <div class="baba-stack">
        <div class="baba-row"><span>Campeao do baba</span><b>${escapeHTML(championNames)}</b></div>
        <div class="baba-row"><span>Jogadores campeoes</span><b>${escapeHTML(championPlayers)}</b></div>
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
              <strong>Jogo ${game.numeroJogo}: ${teamDetailButton(baba, getTeam(baba, game.timeA), game.timeANome)} ${game.placarA} x ${game.placarB} ${teamDetailButton(baba, getTeam(baba, game.timeB), game.timeBNome)}</strong>
              <small>Continua: ${teamDetailButton(baba, getTeam(baba, game.timeQueContinuou), '-')} | Saiu: ${teamButtonsFromValue(baba, game.timeQueSaiu)} | ${escapeHTML(game.motivoSaida || '-')}</small>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function setActiveTab(tab) {
    $$('.baba-tabs button').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
    $$('.baba-view').forEach((view) => view.classList.toggle('active', view.dataset.view === tab));
  }

  async function shareBabaLink() {
    const url = new URL('baba.html', window.location.href).href;
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
    els.updateDate.addEventListener('click', updateBabaDate);
    els.markPresent.addEventListener('click', () => els.presentModal.classList.remove('hidden'));
    els.drawTeams.addEventListener('click', drawTeams);
    els.startFirstGame.addEventListener('click', startFirstGame);
    els.nextGame.addEventListener('click', startNextGame);
    els.undoGame.addEventListener('click', undoLastGame);
    els.finishBaba.addEventListener('click', finishBaba);
    els.resetCurrent.addEventListener('click', resetCurrentBaba);
    els.playerForm.addEventListener('submit', addPlayer);
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
      const actionButton = event.target.closest('[data-action]');
      if (actionButton?.dataset.action === 'toggle-player') return togglePlayerActive(actionButton.dataset.id);
      if (actionButton?.dataset.action === 'delete-player') return deletePlayer(actionButton.dataset.id);
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
    if (savedMode === 'organizer' || savedMode === 'player') setMode(savedMode);
    else resetMode();
    render();
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
