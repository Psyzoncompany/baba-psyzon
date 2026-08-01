const core = window.BabaImportCore;

const uiState = {
  mounted: false,
  aliases: [],
  imports: [],
  analysis: null,
  originalText: '',
  textHash: '',
  duplicates: [],
  duplicateConfirmed: false,
  saving: false,
};

function host() {
  return window.BabaImportHost;
}

function repository() {
  return window.BabaImportRepository;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char]);
}

function newId(prefix) {
  return host()?.newId?.(prefix) || `${prefix}_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
}

function formatDate(iso) {
  if (!iso) return 'Data não identificada';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function setFeedback(message, tone = '') {
  const element = document.getElementById('baba-import-feedback');
  const status = document.getElementById('baba-import-status');
  if (element) {
    element.textContent = message;
    element.dataset.tone = tone;
  }
  if (status) {
    status.textContent = message || 'Aguardando relatório';
    status.dataset.tone = tone;
  }
}

function playerOptions(selectedId = '') {
  return [...(host()?.getState?.().players || [])]
    .filter((player) => player?.ativo !== false)
    .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'))
    .map((player) => `<option value="${escapeHTML(player.id)}"${player.id === selectedId ? ' selected' : ''}>${escapeHTML(player.nome)}</option>`)
    .join('');
}

function syncParsedPeople() {
  const analysis = uiState.analysis;
  if (!analysis) return;
  const parsed = analysis.parsed;
  parsed.teams.forEach((team) => { team.players = []; });
  const scorers = [];
  const zeroGoalPlayers = [];
  analysis.people.forEach((person) => {
    const teamKey = person.teamKeys?.[0] || null;
    const playerShape = { name: person.typedName, typedName: person.typedName, roles: { ...person.roles } };
    const team = parsed.teams.find((item) => item.id === teamKey);
    if (team) team.players.push(playerShape);
    const goals = Math.max(0, Number(person.goals || 0));
    if (goals > 0) {
      scorers.push({ ...playerShape, teamKey, teamName: team?.name || '', goals });
    } else zeroGoalPlayers.push({ ...playerShape, goals: 0 });
  });
  parsed.scorers = scorers;
  parsed.zeroGoalPlayers = zeroGoalPlayers;
}

function refreshValidation() {
  if (!uiState.analysis) return;
  syncParsedPeople();
  uiState.analysis.warnings = [
    ...core.validateStructuredReport(uiState.analysis.parsed),
    ...core.validateResolutions(uiState.analysis.people),
  ];
  if (uiState.duplicates.length && !uiState.duplicateConfirmed) {
    uiState.analysis.warnings.push({
      id: 'POSSIBLE_DUPLICATE:root',
      code: 'POSSIBLE_DUPLICATE',
      severity: 'blocker',
      path: '',
      message: `Já existe um baba semelhante cadastrado em ${formatDate(uiState.analysis.parsed.date)}. Confirme conscientemente para continuar.`,
      details: { importIds: uiState.duplicates.map((item) => item.id), babaIds: uiState.duplicates.map((item) => item.babaId) },
    });
  }
  uiState.analysis.confidence = core.calculateAnalysisConfidence(
    uiState.analysis.parsed,
    uiState.analysis.people,
    uiState.analysis.warnings,
  );
}

function findSimilarExistingBabas(analysis) {
  const state = host()?.getState?.();
  if (!state || !analysis?.parsed?.date) return [];
  const importedTeamIds = (analysis.parsed.teams || []).map((team) => team.id).sort();
  const importedTotal = Number(analysis.parsed.totalGoalsInformed ?? analysis.parsed.calculatedTotalGoals ?? 0);
  const resolvedIds = new Set((analysis.people || []).map((person) => person.resolution?.playerId || person.match?.suggestedPlayerId).filter(Boolean));
  return (state.babas || []).filter((baba) => {
    if (baba.dataISO !== analysis.parsed.date) return false;
    const teamIds = (baba.teams || []).map((team) => team.id).sort();
    const sameTeams = JSON.stringify(teamIds) === JSON.stringify(importedTeamIds);
    const total = (baba.teams || []).reduce((sum, team) => sum + Number(team.golsPro || 0), 0);
    const existingIds = new Set([...(baba.jogadoresPresentes || []), ...(baba.teams || []).flatMap((team) => team.jogadores || [])]);
    const overlap = resolvedIds.size ? [...resolvedIds].filter((id) => existingIds.has(id)).length / resolvedIds.size : 0;
    return sameTeams && total === importedTotal && (overlap >= .7 || !resolvedIds.size);
  }).map((baba) => ({ id: `existing_${baba.id}`, babaId: baba.id, eventDate: baba.dataISO, status: baba.status, source: 'existing-baba' }));
}

function warningIcon(severity) {
  if (severity === 'blocker') return '✕';
  if (severity === 'warning') return '!';
  return 'i';
}

function renderWarnings() {
  const warnings = uiState.analysis?.warnings || [];
  if (!warnings.length) return '<div class="baba-import-empty is-success"><span>✓</span><strong>Nenhuma inconsistência encontrada.</strong></div>';
  return `<div class="baba-import-warning-list">${warnings.map((warning) => `
    <div class="baba-import-warning is-${warning.severity}" role="${warning.severity === 'blocker' ? 'alert' : 'status'}">
      <span class="baba-import-warning__icon" aria-hidden="true">${warningIcon(warning.severity)}</span>
      <div><strong>${warning.severity === 'blocker' ? 'Correção obrigatória' : warning.severity === 'warning' ? 'Revisar' : 'Informação'}</strong><p>${escapeHTML(warning.message)}</p></div>
    </div>`).join('')}</div>`;
}

function renderTeam(team, index) {
  const goals = (uiState.analysis.parsed.scorers || []).filter((scorer) => scorer.teamKey === team.id).reduce((sum, scorer) => sum + Number(scorer.goals || 0), 0);
  return `<article class="baba-import-team" data-team-card="${index}">
    <div class="baba-import-team__head">
      <strong>${escapeHTML(team.name)}</strong>
      <span>${team.players.length} jogador${team.players.length === 1 ? '' : 'es'} · ${goals} gols · ${(Number(team.wins || 0) * 3) + Number(team.draws || 0)} pontos calculados</span>
    </div>
    <div class="baba-import-fields baba-import-fields--team">
      <label>Nome<input data-team-field="name" data-team-index="${index}" value="${escapeHTML(team.name)}"></label>
      <label>Cor do colete<input data-team-field="vestColor" data-team-index="${index}" value="${escapeHTML(team.vestColor)}"></label>
      <label>Vitórias<input type="number" min="0" data-team-field="wins" data-team-index="${index}" value="${Number(team.wins || 0)}"></label>
      <label>Empates<input type="number" min="0" data-team-field="draws" data-team-index="${index}" value="${Number(team.draws || 0)}"></label>
      <label>Derrotas<input type="number" min="0" data-team-field="losses" data-team-index="${index}" value="${Number(team.losses || 0)}"></label>
      <label>Pontos informados<input type="number" min="0" data-team-field="pointsInformed" data-team-index="${index}" value="${team.pointsInformed ?? ''}"></label>
      <label>Gols informados<input type="number" min="0" data-team-field="goalsInformed" data-team-index="${index}" value="${team.goalsInformed ?? ''}"></label>
    </div>
  </article>`;
}

function resolutionLabel(person) {
  if (person.resolution?.type === 'new') return { tone: 'new', text: 'Novo jogador / novato' };
  if (person.resolution?.type === 'existing') {
    const player = host()?.getState?.().players?.find((item) => item.id === person.resolution.playerId);
    return { tone: person.resolution.confirmedManually ? 'review' : 'success', text: `Vinculado a ${player?.nome || person.match.suggestedOfficialName || 'jogador existente'}` };
  }
  if (person.match?.ambiguous) return { tone: 'danger', text: 'Ambíguo — escolha obrigatória' };
  if (person.match?.status === 'review') return { tone: 'review', text: 'Aguardando confirmação' };
  return { tone: 'new', text: 'Possível jogador novo' };
}

function renderPerson(person, index) {
  const label = resolutionLabel(person);
  const suggested = person.match?.suggestedOfficialName;
  const teamOptions = uiState.analysis.parsed.teams.map((team) => `<option value="${escapeHTML(team.id)}"${person.teamKeys?.[0] === team.id ? ' selected' : ''}>${escapeHTML(team.name)}</option>`).join('');
  const candidates = person.match?.candidates || [];
  return `<article class="baba-import-person" data-person-card="${index}">
    <div class="baba-import-person__summary">
      <div><strong>Digitado: ${escapeHTML(person.typedName)}</strong><span class="baba-import-chip is-${label.tone}">${escapeHTML(label.text)}</span></div>
      <p>${suggested ? `Cadastro sugerido: <b>${escapeHTML(suggested)}</b> · ` : ''}Confiança: <b>${Math.round(Number(person.match?.confidence || 0) * 100)}%</b> · ${escapeHTML(person.match?.reason || '')}</p>
    </div>
    <div class="baba-import-fields baba-import-fields--person">
      <label>Nome digitado<input data-person-field="typedName" data-person-index="${index}" value="${escapeHTML(person.typedName)}"></label>
      <label>Time<select data-person-field="teamKey" data-person-index="${index}"><option value="">Sem time</option>${teamOptions}</select></label>
      <label>Gols<input type="number" min="0" data-person-field="goals" data-person-index="${index}" value="${Number(person.goals || 0)}"></label>
    </div>
    <fieldset class="baba-import-roles"><legend>Classificações independentes</legend>
      <label><input type="checkbox" data-person-role="guest" data-person-index="${index}"${person.roles?.guest ? ' checked' : ''}> Convidado</label>
      <label><input type="checkbox" data-person-role="goalkeeper" data-person-index="${index}"${person.roles?.goalkeeper ? ' checked' : ''}> Goleiro</label>
      <label><input type="checkbox" data-person-role="novice" data-person-index="${index}"${person.roles?.novice ? ' checked' : ''}${person.resolution?.type === 'new' ? ' disabled' : ''}> Novato</label>
    </fieldset>
    <div class="baba-import-person__actions">
      ${suggested ? `<button type="button" data-import-action="confirm-suggestion" data-person-index="${index}">Confirmar ${escapeHTML(suggested)}</button>` : ''}
      <label class="baba-import-player-choice"><span>Escolher outro jogador</span><select data-person-choice="${index}"><option value="">Selecione...</option>${playerOptions(person.resolution?.playerId || '')}</select></label>
      <button type="button" data-import-action="choose-player" data-person-index="${index}">Escolher</button>
      <button type="button" data-import-action="mark-new" data-person-index="${index}">Cadastrar como novato</button>
      ${person.resolution ? `<button type="button" data-import-action="undo-resolution" data-person-index="${index}">Desfazer associação</button>` : ''}
    </div>
    ${candidates.length > 1 ? `<details class="baba-import-candidates"><summary>Ver ${candidates.length} candidatos comparados</summary>${candidates.map((candidate) => `<div><span>${escapeHTML(candidate.officialName)}</span><b>${Math.round(candidate.confidence * 100)}%</b></div>`).join('')}</details>` : ''}
  </article>`;
}

function renderReview() {
  const review = document.getElementById('baba-import-review');
  const analysis = uiState.analysis;
  if (!review || !analysis) return;
  refreshValidation();
  const blockers = analysis.warnings.filter((warning) => warning.severity === 'blocker');
  const parsed = analysis.parsed;
  const guests = analysis.people.filter((person) => person.roles?.guest);
  const goalkeepers = analysis.people.filter((person) => person.roles?.goalkeeper);
  const novices = analysis.people.filter((person) => person.roles?.novice || person.resolution?.type === 'new');
  const topScorer = [...parsed.scorers].sort((a, b) => b.goals - a.goals)[0];
  const champion = [...parsed.teams].sort((a, b) => ((Number(b.wins || 0) * 3) + Number(b.draws || 0)) - ((Number(a.wins || 0) * 3) + Number(a.draws || 0)))[0];
  review.classList.remove('hidden');
  review.innerHTML = `
    <div class="baba-import-review__header">
      <div><span class="baba-import-eyebrow">CONFERÊNCIA ANTES DE SALVAR</span><h3>${formatDate(parsed.date)} · ${parsed.teams.length} times · ${analysis.people.length} jogadores</h3></div>
      <div class="baba-import-confidence" data-tone="${blockers.length ? 'danger' : analysis.confidence >= .92 ? 'success' : 'review'}"><strong>${Math.round(analysis.confidence * 100)}%</strong><span>confiança geral</span></div>
    </div>
    <section class="baba-import-section">
      <h4>Informações gerais</h4>
      <div class="baba-import-fields">
        <label>Data do baba<input id="baba-import-date" type="date" value="${escapeHTML(parsed.date || '')}"></label>
        <label>Total de gols informado<input id="baba-import-total-goals" type="number" min="0" value="${parsed.totalGoalsInformed ?? ''}"></label>
        <label>Observações<textarea id="baba-import-observations" rows="3">${escapeHTML(parsed.observations.join('\n'))}</textarea></label>
      </div>
      <div class="baba-import-kpis">
        <div><span>Total calculado</span><strong>${parsed.calculatedTotalGoals ?? 0} gols</strong></div>
        <div><span>Artilheiro</span><strong>${escapeHTML(topScorer ? `${topScorer.name} · ${topScorer.goals}` : 'Não identificado')}</strong></div>
        <div><span>Campeão provável</span><strong>${escapeHTML(champion ? `${champion.name} · ${(Number(champion.wins || 0) * 3) + Number(champion.draws || 0)} pts` : 'Não identificado')}</strong></div>
        <div><span>Classificações</span><strong>${guests.length} convidados · ${goalkeepers.length} goleiros · ${novices.length} novatos</strong></div>
      </div>
    </section>
    <section class="baba-import-section"><h4>Alertas e inconsistências</h4>${renderWarnings()}</section>
    ${uiState.duplicates.length ? `<section class="baba-import-section baba-import-duplicate"><h4>Possível baba duplicado</h4><p>Encontramos ${uiState.duplicates.length} importação semelhante para ${formatDate(parsed.date)}. Ela não será bloqueada se você confirmar que é um evento legítimo.</p><label><input id="baba-import-confirm-duplicate" type="checkbox"${uiState.duplicateConfirmed ? ' checked' : ''}> Confirmo que revisei o baba existente e quero continuar.</label></section>` : ''}
    <section class="baba-import-section"><h4>Times, resultados e coletes</h4><div class="baba-import-team-grid">${parsed.teams.map(renderTeam).join('')}</div></section>
    <section class="baba-import-section"><h4>Jogadores identificados e correções</h4><p class="baba-import-section__hint">Nenhum nome abaixo será alterado silenciosamente. Associações em amarelo ou vermelho exigem decisão.</p><div class="baba-import-people">${analysis.people.map(renderPerson).join('')}</div></section>
    <section class="baba-import-section baba-import-final">
      <div><h4>Resumo final</h4><p>${blockers.length ? `${blockers.length} pendência${blockers.length === 1 ? '' : 's'} impede${blockers.length === 1 ? '' : 'm'} o salvamento.` : 'Dados consistentes e prontos para a transação.'}</p></div>
      <button id="baba-import-confirm" class="baba-start-baba-btn" type="button"${blockers.length || uiState.saving ? ' disabled' : ''}>${uiState.saving ? 'Salvando...' : 'Confirmar e criar baba'}</button>
    </section>`;
  setFeedback(blockers.length ? `Revisão necessária: ${blockers.length} pendência${blockers.length === 1 ? '' : 's'}.` : 'Análise concluída. Revise e confirme.', blockers.length ? 'warning' : 'success');
}

async function maybeUseAI(text, deterministicAnalysis) {
  const endpoint = window.BABA_AI_ENDPOINT;
  if (!endpoint || !deterministicAnalysis.warnings.some((warning) => warning.severity === 'blocker')) return deterministicAnalysis;
  const user = window.firebaseAuth?.currentUser?.();
  const token = await user?.getIdToken?.();
  if (!token) return deterministicAnalysis;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, deterministic: deterministicAnalysis.parsed }),
    });
    if (!response.ok) return deterministicAnalysis;
    const data = await response.json();
    if (!data?.structured || data.structured.schemaVersion !== core.IMPORT_SCHEMA_VERSION) return deterministicAnalysis;
    const aiWarnings = core.validateStructuredReport(data.structured);
    const deterministicBlockers = deterministicAnalysis.warnings.filter((warning) => warning.severity === 'blocker').length;
    if (aiWarnings.filter((warning) => warning.severity === 'blocker').length >= deterministicBlockers) return deterministicAnalysis;
    const people = core.resolvePeople(data.structured, host()?.getState?.().players || [], uiState.aliases);
    people.forEach((person) => {
      if (person.match.status === 'automatic' && !person.match.ambiguous) person.resolution = { type: 'existing', playerId: person.match.suggestedPlayerId, confirmedManually: false };
    });
    return { schemaVersion: core.IMPORT_SCHEMA_VERSION, parsed: data.structured, people, warnings: [...aiWarnings, ...core.validateResolutions(people)], confidence: 0, extractionSource: 'ai-assisted' };
  } catch (error) {
    console.warn('Apoio de IA indisponível; mantendo análise determinística:', error);
    return deterministicAnalysis;
  }
}

async function analyzeImport() {
  if (!host()?.isOrganizer?.()) return host()?.showToast?.('Entre como organizador para importar babas.');
  const textarea = document.getElementById('baba-import-text');
  const text = core.sanitizeImportedText(textarea?.value || '');
  if (text.length < 20) return setFeedback('Cole um relatório com data, times e jogadores.', 'danger');
  setFeedback('Analisando texto e comparando todos os jogadores cadastrados...', 'working');
  const button = document.getElementById('baba-import-analyze');
  if (button) button.disabled = true;
  try {
    try { uiState.aliases = await repository()?.loadAliases?.() || []; } catch (error) { console.warn('Aliases não puderam ser carregados:', error); }
    let analysis = core.buildAnalysis(text, host()?.getState?.().players || [], uiState.aliases);
    analysis = await maybeUseAI(text, analysis);
    uiState.originalText = text;
    uiState.textHash = await core.sha256(text);
    uiState.analysis = analysis;
    uiState.duplicateConfirmed = false;
    try { uiState.imports = await repository()?.loadImports?.() || []; } catch (error) { console.warn('Histórico de imports não pôde ser carregado:', error); }
    uiState.duplicates = [
      ...(repository()?.findSimilarImports?.(uiState.imports, analysis, uiState.textHash) || []),
      ...findSimilarExistingBabas(analysis),
    ].filter((item, index, list) => list.findIndex((candidate) => candidate.babaId === item.babaId) === index);
    renderReview();
    const autoSave = document.getElementById('baba-import-auto-save')?.checked;
    if (autoSave && !uiState.duplicates.length && core.isHighConfidenceAnalysis(uiState.analysis)) await commitCurrentImport(true);
  } catch (error) {
    console.error('Falha ao analisar relatório:', error);
    setFeedback(error.message || 'Não foi possível analisar o relatório.', 'danger');
  } finally {
    if (button) button.disabled = false;
  }
}

function rematchPerson(person) {
  person.match = core.matchPlayerName(person.typedName, host()?.getState?.().players || [], uiState.aliases);
  person.resolution = person.match.status === 'automatic' && !person.match.ambiguous
    ? { type: 'existing', playerId: person.match.suggestedPlayerId, confirmedManually: false }
    : null;
}

function applyReviewChange(target) {
  if (!uiState.analysis) return;
  if (target.id === 'baba-import-date') uiState.analysis.parsed.date = target.value;
  else if (target.id === 'baba-import-total-goals') uiState.analysis.parsed.totalGoalsInformed = target.value === '' ? null : Math.max(0, Number(target.value));
  else if (target.id === 'baba-import-observations') uiState.analysis.parsed.observations = target.value.split('\n').map((line) => line.trim()).filter(Boolean);
  else if (target.id === 'baba-import-confirm-duplicate') uiState.duplicateConfirmed = target.checked;
  else if (target.dataset.teamField) {
    const team = uiState.analysis.parsed.teams[Number(target.dataset.teamIndex)];
    if (!team) return;
    const numeric = ['wins', 'draws', 'losses', 'pointsInformed', 'goalsInformed'].includes(target.dataset.teamField);
    team[target.dataset.teamField] = numeric ? (target.value === '' ? null : Math.max(0, Number(target.value))) : target.value.trim();
  } else if (target.dataset.personField) {
    const person = uiState.analysis.people[Number(target.dataset.personIndex)];
    if (!person) return;
    if (target.dataset.personField === 'typedName') {
      person.typedName = target.value.trim();
      rematchPerson(person);
    } else if (target.dataset.personField === 'teamKey') person.teamKeys = target.value ? [target.value] : [];
    else if (target.dataset.personField === 'goals') person.goals = Math.max(0, Number(target.value || 0));
  } else if (target.dataset.personRole) {
    const person = uiState.analysis.people[Number(target.dataset.personIndex)];
    if (person) person.roles[target.dataset.personRole] = target.checked;
  } else return;
  renderReview();
}

function handleResolutionAction(button) {
  const person = uiState.analysis?.people?.[Number(button.dataset.personIndex)];
  if (!person) return;
  if (button.dataset.importAction === 'confirm-suggestion' && person.match.suggestedPlayerId) {
    person.resolution = { type: 'existing', playerId: person.match.suggestedPlayerId, confirmedManually: true };
  } else if (button.dataset.importAction === 'choose-player') {
    const select = document.querySelector(`[data-person-choice="${button.dataset.personIndex}"]`);
    if (!select?.value) return host()?.showToast?.('Escolha um jogador cadastrado.');
    person.resolution = { type: 'existing', playerId: select.value, confirmedManually: true };
  } else if (button.dataset.importAction === 'mark-new') {
    person.roles.novice = true;
    person.resolution = { type: 'new', officialName: person.typedName, confirmedManually: true };
  } else if (button.dataset.importAction === 'undo-resolution') {
    person.resolution = null;
  }
  renderReview();
}

function buildImportedEntities({ confirmedByAdmin = true } = {}) {
  refreshValidation();
  const analysis = uiState.analysis;
  const timestamp = Date.now();
  const babaId = newId('baba');
  const importId = newId('import');
  const state = host().getState();
  const playerIds = new Map();
  const newPlayers = [];
  const updatedPlayers = [];
  analysis.people.forEach((person) => {
    if (person.resolution.type === 'existing') {
      playerIds.set(core.normalizeAlias(person.typedName), person.resolution.playerId);
      return;
    }
    const id = newId('player');
    const player = {
      id,
      nome: core.normalizeWhitespace(person.resolution.officialName || person.typedName),
      tipo: person.roles.goalkeeper ? 'goleiro' : 'jogador',
      ativo: true,
      novato: true,
      noviceActive: true,
      noviceSinceMs: timestamp,
      noviceReason: 'first-imported-baba',
      firstBabaId: babaId,
      firstBabaDate: analysis.parsed.date,
      criadoEm: timestamp,
    };
    newPlayers.push(player);
    playerIds.set(core.normalizeAlias(person.typedName), id);
  });
  analysis.people.forEach((person) => {
    if (person.resolution.type !== 'existing' || !person.roles.novice) return;
    const existing = state.players.find((player) => player.id === person.resolution.playerId);
    if (!existing || existing.novato) return;
    updatedPlayers.push({
      ...existing,
      novato: true,
      noviceActive: true,
      noviceSinceMs: timestamp,
      noviceReason: 'confirmed-in-import',
      noviceReasonImportId: importId,
    });
  });
  const updatedById = new Map(updatedPlayers.map((player) => [player.id, player]));
  const completeState = { ...state, players: [...state.players.map((player) => updatedById.get(player.id) || player), ...newPlayers] };
  const flags = {};
  analysis.people.forEach((person) => {
    const playerId = playerIds.get(core.normalizeAlias(person.typedName));
    flags[playerId] = { ...person.roles, novice: person.roles.novice || person.resolution.type === 'new', typedName: person.typedName };
  });
  const teams = analysis.parsed.teams.map((team) => {
    const members = analysis.people.filter((person) => person.teamKeys?.[0] === team.id);
    const jogadores = members.map((person) => playerIds.get(core.normalizeAlias(person.typedName))).filter(Boolean);
    const playerGoals = {};
    members.forEach((person) => { playerGoals[playerIds.get(core.normalizeAlias(person.typedName))] = Number(person.goals || 0); });
    const wins = Number(team.wins || 0);
    const draws = Number(team.draws || 0);
    const losses = Number(team.losses || 0);
    const goals = Object.values(playerGoals).reduce((sum, value) => sum + Number(value || 0), 0);
    return {
      id: team.id,
      name: team.name,
      jogadores,
      vestColor: team.vestColor || '',
      colete: team.vestColor || '',
      pontos: (wins * 3) + draws,
      golsPro: goals,
      golsContra: 0,
      vitorias: wins,
      empates: draws,
      derrotas: losses,
      manualStats: { wins, draws, losses, playerGoals },
    };
  });
  const sortedTeams = [...teams].sort((a, b) => b.pontos - a.pontos || b.vitorias - a.vitorias || b.golsPro - a.golsPro);
  const best = sortedTeams[0];
  const champions = best ? sortedTeams.filter((team) => team.pontos === best.pontos && team.vitorias === best.vitorias && team.golsPro === best.golsPro) : [];
  const [year, month, day] = analysis.parsed.date.split('-').map(Number);
  const baba = {
    id: babaId,
    dataISO: analysis.parsed.date,
    dataCompleta: formatDate(analysis.parsed.date),
    dia: day,
    mes: month,
    ano: year,
    status: 'finalizado',
    matchMode: 'MANUAL',
    jogadoresPresentes: [...playerIds.values()],
    visitantes: [],
    participantFlags: flags,
    pagamentos: Object.fromEntries([...playerIds.values()].map((id) => [id, false])),
    teams,
    filaTimes: [],
    jogoAtual: null,
    jogos: [],
    rankingDoBaba: {},
    campeaoDoBaba: {
      times: champions.map((team) => team.id),
      nomes: champions.map((team) => team.name),
      jogadores: champions.flatMap((team) => team.jogadores),
      definidoEm: timestamp,
    },
    lastResult: null,
    pendingTieBreak: null,
    teamRevealIndex: 0,
    undoStack: [],
    observacoes: analysis.parsed.observations.join('\n'),
    importedTotalGoals: Number(analysis.parsed.totalGoalsInformed ?? analysis.parsed.calculatedTotalGoals ?? 0),
    importId,
    criadoEm: timestamp,
    finalizadoEm: timestamp,
  };
  const championIds = new Set(baba.campeaoDoBaba.jogadores);
  teams.forEach((team) => {
    const games = team.vitorias + team.empates + team.derrotas;
    team.jogadores.forEach((playerId) => {
      const player = completeState.players.find((item) => item.id === playerId);
      const points = (team.vitorias * 3) + team.empates;
      baba.rankingDoBaba[playerId] = {
        jogadorId: playerId,
        nome: player?.nome || 'Jogador',
        totalGols: Number(team.manualStats.playerGoals[playerId] || 0),
        totalVitorias: team.vitorias,
        totalEmpates: team.empates,
        totalDerrotas: team.derrotas,
        totalJogos: games,
        totalBabas: 1,
        totalTitulosBaba: championIds.has(playerId) ? 1 : 0,
        goalkeeperGames: flags[playerId]?.goalkeeper ? games : 0,
        goalsConceded: 0,
        mediaGols: Number(team.manualStats.playerGoals[playerId] || 0),
        aproveitamento: games ? Math.round((points / (games * 3)) * 100) : 0,
      };
    });
  });
  const aliasesToCreate = analysis.people.flatMap((person) => {
    if (person.resolution.type !== 'existing' || (!person.resolution.confirmedManually && !confirmedByAdmin)) return [];
    const player = completeState.players.find((item) => item.id === person.resolution.playerId);
    if (!player || core.normalizeName(person.typedName, { keepAccents: true }) === core.normalizeName(player.nome, { keepAccents: true })) return [];
    if (uiState.aliases.some((alias) => alias.active !== false && alias.playerId === player.id && core.normalizeAlias(alias.normalizedText || alias.originalText) === core.normalizeAlias(person.typedName))) return [];
    return [{
      id: newId('alias'),
      originalText: person.typedName,
      playerId: player.id,
      officialNameSnapshot: player.nome,
      correctionSource: 'admin-import-confirmation',
      initialConfidence: person.match.confidence,
      usageCount: 0,
    }];
  });
  const usedAliasIds = analysis.people.map((person) => person.match?.candidates?.find((candidate) => candidate.source === 'alias')?.aliasId || person.match?.aliasId).filter(Boolean);
  return { importId, baba, newPlayers, updatedPlayers, aliasesToCreate, usedAliasIds, completeState };
}

async function commitCurrentImport(autoSaved = false) {
  if (!uiState.analysis || uiState.saving) return;
  refreshValidation();
  const blockers = uiState.analysis.warnings.filter((warning) => warning.severity === 'blocker');
  if (blockers.length) {
    renderReview();
    return host()?.showToast?.('Corrija as pendências antes de salvar.');
  }
  uiState.saving = true;
  renderReview();
  try {
    const entities = buildImportedEntities({ confirmedByAdmin: !autoSaved });
    await repository().commitImport({
      ...entities,
      state: entities.completeState,
      text: uiState.originalText,
      textHash: uiState.textHash,
      analysis: uiState.analysis,
      warnings: uiState.analysis.warnings,
      autoSaved,
    });
    host().applyCommittedImport({ baba: entities.baba, newPlayers: entities.newPlayers, updatedPlayers: entities.updatedPlayers });
    uiState.imports = await repository().loadImports();
    renderImportHistory();
    document.getElementById('baba-import-text').value = '';
    document.getElementById('baba-import-review').classList.add('hidden');
    uiState.analysis = null;
    setFeedback(`Baba de ${formatDate(entities.baba.dataISO)} criado com sucesso em uma única transação.`, 'success');
    host()?.showToast?.('Importação concluída e baba salvo no histórico.');
  } catch (error) {
    console.error('Falha ao confirmar importação:', error);
    setFeedback(error.message || 'A transação falhou; nenhum dado parcial foi salvo.', 'danger');
  } finally {
    uiState.saving = false;
    if (uiState.analysis) renderReview();
  }
}

async function renderAliases() {
  const container = document.getElementById('baba-import-aliases');
  if (!container) return;
  container.innerHTML = '<p>Carregando aliases...</p>';
  try {
    uiState.aliases = await repository().loadAliases();
    container.innerHTML = uiState.aliases.length ? `<h4>Aliases (${uiState.aliases.length})</h4>${uiState.aliases.map((alias) => `
      <div class="baba-import-management__row">
        <div><strong>${escapeHTML(alias.originalText)}</strong><span>→ ${escapeHTML(alias.officialNameSnapshot || alias.playerId)} · usado ${Number(alias.usageCount || 0)} vez(es)</span></div>
        <div class="baba-import-management__row-actions"><button type="button" data-import-action="edit-alias" data-alias-id="${escapeHTML(alias.id)}">Editar</button><button type="button" data-import-action="toggle-alias" data-alias-id="${escapeHTML(alias.id)}" data-alias-active="${alias.active !== false}">${alias.active === false ? 'Reativar' : 'Excluir'}</button></div>
      </div>`).join('')}` : '<p>Nenhum alias confirmado.</p>';
  } catch (error) {
    container.innerHTML = `<p class="is-danger">${escapeHTML(error.message || 'Não foi possível carregar aliases.')}</p>`;
  }
}

async function renderImportHistory() {
  const container = document.getElementById('baba-import-history');
  if (!container) return;
  container.innerHTML = '<p>Carregando histórico...</p>';
  try {
    uiState.imports = await repository().loadImports();
    container.innerHTML = uiState.imports.length ? `<h4>Importações (${uiState.imports.length})</h4>${uiState.imports.map((item) => `
      <div class="baba-import-management__row">
        <div><strong>${formatDate(item.eventDate)}</strong><span>${escapeHTML(item.status)} · ${Number(item.totalGoals || 0)} gols · ${Number(item.playerIds?.length || 0)} jogadores</span></div>
        ${item.status !== 'reverted' ? `<button type="button" data-import-action="revert-import" data-import-id="${escapeHTML(item.id)}">Desfazer importação</button>` : '<span class="baba-import-chip is-review">Revertida</span>'}
      </div>`).join('')}` : '<p>Nenhuma importação registrada.</p>';
  } catch (error) {
    container.innerHTML = `<p class="is-danger">${escapeHTML(error.message || 'Não foi possível carregar o histórico.')}</p>`;
  }
}

async function toggleAlias(button) {
  const active = button.dataset.aliasActive === 'true';
  if (active && !window.confirm('Excluir este alias? O histórico será preservado e ele deixará de ser usado nas próximas importações.')) return;
  await repository().updateAlias(button.dataset.aliasId, { active: !active });
  await renderAliases();
}

async function editAlias(button) {
  const alias = uiState.aliases.find((item) => item.id === button.dataset.aliasId);
  if (!alias) return;
  const value = window.prompt('Edite a variação do nome:', alias.originalText || '');
  if (value == null || !value.trim() || value.trim() === alias.originalText) return;
  await repository().updateAlias(alias.id, { originalText: value.trim() });
  await renderAliases();
}

async function revertImport(button) {
  const record = uiState.imports.find((item) => item.id === button.dataset.importId);
  if (!record) return;
  if (!window.confirm(`Desfazer a importação de ${formatDate(record.eventDate)}? O baba importado será removido do histórico e a ação ficará auditada.`)) return;
  const state = host().getState();
  const removablePlayerIds = (record.newPlayerIds || []).filter((playerId) => !state.babas.some((baba) => baba.id !== record.babaId
    && ((baba.jogadoresPresentes || []).includes(playerId) || (baba.teams || []).some((team) => (team.jogadores || []).includes(playerId)))));
  const result = await repository().revertImport(record.id, { removablePlayerIds });
  host().applyRevertedImport(result);
  await Promise.all([renderAliases(), renderImportHistory()]);
  host()?.showToast?.('Importação desfeita com auditoria. Dados reutilizados foram preservados.');
}

function wireEvents() {
  document.getElementById('baba-import-analyze')?.addEventListener('click', analyzeImport);
  document.getElementById('baba-import-load-aliases')?.addEventListener('click', renderAliases);
  document.getElementById('baba-import-load-history')?.addEventListener('click', renderImportHistory);
  document.getElementById('baba-import-review')?.addEventListener('change', (event) => applyReviewChange(event.target));
  document.getElementById('baba-import-review')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-import-action]');
    if (button) handleResolutionAction(button);
    if (event.target.closest('#baba-import-confirm')) commitCurrentImport(false);
  });
  document.getElementById('baba-import-root')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-import-action]');
    if (!button) return;
    try {
      if (button.dataset.importAction === 'toggle-alias') await toggleAlias(button);
      if (button.dataset.importAction === 'edit-alias') await editAlias(button);
      if (button.dataset.importAction === 'revert-import') await revertImport(button);
    } catch (error) {
      host()?.showToast?.(error.message || 'A operação administrativa falhou.');
    }
  });
}

function mount() {
  if (uiState.mounted || !core || !host() || !document.getElementById('baba-import-root')) return;
  uiState.mounted = true;
  wireEvents();
}

window.BabaImportUI = Object.freeze({ mount, analyzeImport });
window.addEventListener('baba-import-host-ready', mount);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
