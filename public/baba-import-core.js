(function initBabaImportCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BabaImportCore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const IMPORT_SCHEMA_VERSION = 1;
  const DEFAULT_MATCH_CONFIG = Object.freeze({
    automaticThreshold: 0.92,
    reviewThreshold: 0.80,
    ambiguityGap: 0.035,
    maxCandidates: 5,
  });
  const MONTHS = Object.freeze({
    janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
    julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
  });
  const ROLE_LABELS = Object.freeze({
    guest: 'CONVIDADO', goalkeeper: 'GOLEIRO', novice: 'NOVATO',
  });

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function normalizeWhitespace(value) {
    return String(value ?? '').replace(/[\u00a0\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function normalizeName(value, { keepAccents = false } = {}) {
    let result = normalizeWhitespace(value).toLocaleLowerCase('pt-BR');
    if (!keepAccents) result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return result
      .replace(/[‐‑‒–—―]/g, '-')
      .replace(/[^a-z0-9à-öø-ÿ' -]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeAlias(value) {
    return normalizeName(value).replace(/[ '\-]/g, '');
  }

  function sanitizeImportedText(value, maxLength = 100000) {
    return String(value ?? '')
      .slice(0, maxLength)
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/<\/?(?:script|style|iframe|object|embed)[^>]*>/gi, '')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  }

  function levenshteinDistance(left, right) {
    const a = Array.from(normalizeName(left));
    const b = Array.from(normalizeName(right));
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= b.length; j += 1) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
      previous = current;
    }
    return previous[b.length];
  }

  function levenshteinSimilarity(left, right) {
    const a = normalizeName(left);
    const b = normalizeName(right);
    const longest = Math.max(Array.from(a).length, Array.from(b).length);
    return longest ? 1 - (levenshteinDistance(a, b) / longest) : 1;
  }

  function jaroSimilarity(left, right) {
    const a = normalizeName(left);
    const b = normalizeName(right);
    if (a === b) return 1;
    if (!a.length || !b.length) return 0;
    const range = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
    const aMatch = Array(a.length).fill(false);
    const bMatch = Array(b.length).fill(false);
    let matches = 0;
    for (let i = 0; i < a.length; i += 1) {
      const start = Math.max(0, i - range);
      const end = Math.min(i + range + 1, b.length);
      for (let j = start; j < end; j += 1) {
        if (bMatch[j] || a[i] !== b[j]) continue;
        aMatch[i] = true;
        bMatch[j] = true;
        matches += 1;
        break;
      }
    }
    if (!matches) return 0;
    const aChars = [];
    const bChars = [];
    aMatch.forEach((matched, index) => { if (matched) aChars.push(a[index]); });
    bMatch.forEach((matched, index) => { if (matched) bChars.push(b[index]); });
    const transpositions = aChars.reduce((count, char, index) => count + (char !== bChars[index] ? 1 : 0), 0) / 2;
    return ((matches / a.length) + (matches / b.length) + ((matches - transpositions) / matches)) / 3;
  }

  function jaroWinklerSimilarity(left, right) {
    const a = normalizeName(left);
    const b = normalizeName(right);
    const jaro = jaroSimilarity(a, b);
    let prefix = 0;
    while (prefix < Math.min(4, a.length, b.length) && a[prefix] === b[prefix]) prefix += 1;
    return clamp(jaro + (prefix * 0.1 * (1 - jaro)));
  }

  function parseRoles(value) {
    const normalized = normalizeName(value);
    return {
      guest: /\b(convidad[oa]|visitante)\b/.test(normalized),
      goalkeeper: /\b(goleir[oa]|gol)\b/.test(normalized),
      novice: /\b(novat[oa])\b/.test(normalized),
    };
  }

  function mergeRoles(...roles) {
    return roles.reduce((result, item) => ({
      guest: result.guest || Boolean(item?.guest),
      goalkeeper: result.goalkeeper || Boolean(item?.goalkeeper),
      novice: result.novice || Boolean(item?.novice),
    }), { guest: false, goalkeeper: false, novice: false });
  }

  function roleLabels(roles) {
    return Object.entries(ROLE_LABELS).filter(([key]) => roles?.[key]).map(([, label]) => label);
  }

  function parseInteger(value) {
    const number = Number.parseInt(String(value ?? '').replace(/[^\d-]/g, ''), 10);
    return Number.isFinite(number) ? Math.max(0, number) : null;
  }

  function validISODate(year, month, day) {
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function toISODate(year, month, day) {
    if (!validISODate(year, month, day)) return null;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function parseDate(text) {
    const source = normalizeWhitespace(String(text || '').replace(/[—–]/g, ' '));
    let match = source.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b/);
    if (match) return toISODate(Number(match[3]), Number(match[2]), Number(match[1]));
    const normalized = normalizeName(source);
    match = normalized.match(/\b(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})\b/);
    if (!match) return null;
    const month = MONTHS[match[2]];
    return month ? toISODate(Number(match[3]), month, Number(match[1])) : null;
  }

  function stripListPrefix(value) {
    return String(value || '').replace(/^\s*(?:[*•\-]+|\d+\s*[ºª.)-])\s*/, '').trim();
  }

  function splitDashParts(value) {
    return String(value || '').split(/\s+(?:—|–|\|)\s+|\s+-\s+/).map(normalizeWhitespace).filter(Boolean);
  }

  function parsePlayerToken(value) {
    const source = stripListPrefix(value).replace(/[.;]+$/, '').trim();
    if (!source || /sem jogadores? (?:registrados?|cadastrados?)/i.test(source)) return null;
    const roleMatch = source.match(/\(([^)]+)\)\s*$/);
    const roleText = roleMatch?.[1] || '';
    const name = normalizeWhitespace(roleMatch ? source.slice(0, roleMatch.index) : source);
    if (!name) return null;
    return { name, typedName: name, roles: parseRoles(roleText) };
  }

  function parseScorerLine(line) {
    const clean = stripListPrefix(line);
    const parts = splitDashParts(clean);
    const goalPartIndex = parts.findIndex((part) => /\b\d+\s*gols?\b/i.test(part));
    const flexible = clean.match(/^(.+?)\s*[:=-]?\s*(\d+)\s*gols?\b(?:.*?\btime\s*(\d+)\b)?(.*)$/i)
      || clean.match(/^(\d+)\s*gols?\s*[-:|]?\s*(.+?)(?:\s*[-:|]?\s*time\s*(\d+)\b)?(.*)$/i);
    if (goalPartIndex < 0 && !flexible) return null;
    const structuredParts = goalPartIndex >= 0 && parts.length > 1;
    const goalsFirst = flexible && /^\d+\s*gols?/i.test(clean);
    let name = structuredParts ? parts[0] : (goalsFirst ? flexible[2] : flexible[1]);
    name = name.replace(/^(?:gols?|artilheiros?)\s*:\s*/i, '').replace(/^\d+\s*[ºª.)-]?\s*/, '').trim();
    if (!name || /^(?:total|gols marcados|destaque|artilheiro\s*:)/i.test(name)) return null;
    const teamPart = parts.find((part) => /\btime\s*\d+\b/i.test(part)) || clean;
    const teamMatch = teamPart?.match(/\btime\s*(\d+)\b/i);
    const goals = structuredParts ? parseInteger(parts[goalPartIndex]) : parseInteger(flexible[goalsFirst ? 1 : 2]);
    if (goals == null) return null;
    const roleText = structuredParts ? parts.filter((_, index) => index > goalPartIndex).join(' ') : (flexible?.[4] || '');
    return {
      name: normalizeWhitespace(name),
      typedName: normalizeWhitespace(name),
      teamKey: teamMatch ? `team_${Number(teamMatch[1])}` : null,
      teamName: teamMatch ? `Time ${Number(teamMatch[1])}` : '',
      goals,
      roles: parseRoles(roleText),
    };
  }

  function parseTeamHeader(line) {
    const clean = stripListPrefix(line);
    const match = clean.match(/^(?:classifica(?:cao)?\s*[:-]?\s*)?time\s*(\d+)\b/i);
    if (!match) return null;
    const number = Number(match[1]);
    const colorMatch = clean.match(/colete\s+([^—–|,;]+)/i);
    const parenthesizedColor = clean.match(/time\s*\d+\s*\(([^)]+)\)/i);
    const trailingColor = clean.match(/time\s*\d+\s*(?:[-—–|:]\s*|\s+)([a-zà-ÿ]+)(?=\s*(?:[-—–|,;]|$))/i);
    return {
      id: `team_${number}`,
      name: `Time ${number}`,
      order: number,
      vestColor: normalizeWhitespace(colorMatch?.[1] || parenthesizedColor?.[1] || trailingColor?.[1] || ''),
      wins: null,
      draws: null,
      losses: null,
      pointsInformed: null,
      goalsInformed: null,
      players: [],
      emptyReported: false,
    };
  }

  function applyTeamStats(team, value) {
    if (!team) return false;
    const source = normalizeWhitespace(value).toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const patterns = {
      wins: [/(?:vitorias?|vencidos?|ganhos?)\s*:?\s*(\d+)/i, /\b(\d+)\s*v\b/i],
      draws: [/(?:empates?)\s*:?\s*(\d+)/i, /\b(\d+)\s*e\b/i],
      losses: [/(?:derrotas?|perdidos?)\s*:?\s*(\d+)/i, /\b(\d+)\s*d\b/i],
      pointsInformed: [/(?:pontos?|pts?)\s*:?\s*(\d+)/i, /\b(\d+)\s*(?:pontos?|pts?)\b/i],
      goalsInformed: [/(?:gols?\s+(?:marcados?|feitos?)|gp)\s*:?\s*(\d+)/i, /\b(\d+)\s*gols?\s+(?:marcados?|feitos?)\b/i],
    };
    let found = false;
    Object.entries(patterns).forEach(([field, regexes]) => {
      const match = regexes.map((regex) => source.match(regex)).find(Boolean);
      if (match) { team[field] = Number(match[1]); found = true; }
    });
    return found;
  }

  function splitPlayerList(value) {
    const source = String(value || '').replace(/^\s*(?:jogadores?|elenco|escalacao)\s*:?\s*/i, '').trim();
    if (!source) return [];
    const tokens = [];
    let current = '';
    let depth = 0;
    for (const char of source) {
      if (char === '(') depth += 1;
      if (char === ')') depth = Math.max(0, depth - 1);
      if ((char === ',' || char === ';') && depth === 0) {
        if (current.trim()) tokens.push(current.trim());
        current = '';
      } else current += char;
    }
    if (current.trim()) tokens.push(current.trim());
    return tokens.map(parsePlayerToken).filter(Boolean);
  }

  function uniqueByNormalizedName(items) {
    const result = [];
    const positions = new Map();
    items.forEach((item) => {
      const key = normalizeAlias(item?.name);
      if (!key) return;
      if (positions.has(key)) {
        const current = result[positions.get(key)];
        current.roles = mergeRoles(current.roles, item.roles);
        if (item.goals != null) current.goals = Math.max(Number(current.goals || 0), Number(item.goals || 0));
        return;
      }
      positions.set(key, result.length);
      result.push({ ...item, roles: mergeRoles(item.roles) });
    });
    return result;
  }

  function parseZeroGoalBlock(lines, startIndex) {
    const chunks = [];
    let index = startIndex;
    const first = lines[index].replace(/^.*?sem gols registrados?\s*:?/i, '').trim();
    if (first) chunks.push(first);
    while (index + 1 < lines.length && !/^\s*(?:classifica|\d+\s*[ºª.)-]?\s*time|time\s*\d+\s+[-—–]\s+colete)/i.test(lines[index + 1])) {
      index += 1;
      const next = lines[index].trim();
      if (!next || /^[A-ZÁÉÍÓÚÇ ]{5,}$/.test(next)) break;
      chunks.push(next);
    }
    const source = chunks.join(' ').replace(/\.$/, '').replace(/\s+e\s+/gi, ', ');
    const tokens = [];
    let current = '';
    let depth = 0;
    for (const char of source) {
      if (char === '(') depth += 1;
      if (char === ')') depth = Math.max(0, depth - 1);
      if (char === ',' && depth === 0) {
        if (current.trim()) tokens.push(current.trim());
        current = '';
      } else current += char;
    }
    if (current.trim()) tokens.push(current.trim());
    return { players: tokens.map(parsePlayerToken).filter(Boolean).map((item) => ({ ...item, goals: 0 })), endIndex: index };
  }

  function pruneEmptyTeams(parsed) {
    if (!parsed || !Array.isArray(parsed.teams)) return parsed;
    if (!Array.isArray(parsed.ignoredTeams)) parsed.ignoredTeams = [];
    parsed.teams = parsed.teams.filter((team) => {
      const hasPlayers = Boolean(team.players?.length);
      const hasScorers = (parsed.scorers || []).some((scorer) => scorer.teamKey === team.id);
      const hasCompetitiveData = ['wins', 'draws', 'losses', 'pointsInformed', 'goalsInformed']
        .some((field) => Number(team[field] || 0) > 0);
      const shouldIgnore = !hasPlayers && !hasScorers && !hasCompetitiveData;
      if (shouldIgnore && !parsed.ignoredTeams.some((item) => item.id === team.id)) {
        parsed.ignoredTeams.push({ ...team, ignoreReason: team.emptyReported ? 'explicitly-empty' : 'empty' });
      }
      return !shouldIgnore;
    });
    return parsed;
  }

  function parseReport(input) {
    const originalText = sanitizeImportedText(input);
    const lines = originalText.split('\n').map((line) => line.trim());
    const result = {
      schemaVersion: IMPORT_SCHEMA_VERSION,
      date: parseDate(originalText),
      totalGoalsInformed: null,
      topScorerInformed: null,
      teams: [],
      ignoredTeams: [],
      scorers: [],
      zeroGoalPlayers: [],
      observations: [],
      sourceMeta: { length: originalText.length, lineCount: lines.length },
    };
    let section = '';
    let currentTeam = null;
    let readingPlayers = false;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line) continue;
      const normalized = normalizeName(line);
      if (/^(?:artilheiros?|goleadores?|gols do baba|quem marcou)$/.test(normalized)) { section = 'scorers'; currentTeam = null; readingPlayers = false; continue; }
      if (/^(?:classificacao(?: dos times)?|tabela(?: dos times)?|times|equipes)$/.test(normalized)) { section = 'teams'; readingPlayers = false; continue; }
      if (/^regra de pontuacao/.test(normalized)) { section = 'observations'; currentTeam = null; readingPlayers = false; continue; }
      if (/^(?:jogadores|elenco|escalacao)\s*:?$/.test(normalized) && currentTeam) { readingPlayers = true; continue; }
      if (/^sem gols registrados?\s*:?/i.test(line)) {
        const parsed = parseZeroGoalBlock(lines, index);
        result.zeroGoalPlayers.push(...parsed.players);
        index = parsed.endIndex;
        continue;
      }
      const totalMatch = line.match(/(?:total\s+(?:de\s+)?gols(?:\s+registrados?)?|gols\s+no\s+baba)\s*:?\s*(\d+)/i);
      if (totalMatch) { result.totalGoalsInformed = Number(totalMatch[1]); continue; }
      const topMatch = line.match(/^(?:artilheiro|maior goleador)\s*:?\s*(.+?)\s+(?:—|–|-|com\s+)?\s*(\d+)\s*gols?/i);
      if (topMatch) {
        result.topScorerInformed = { name: normalizeWhitespace(topMatch[1]), goals: Number(topMatch[2]) };
        continue;
      }

      const teamHeader = parseTeamHeader(line);
      if (teamHeader) {
        currentTeam = teamHeader;
        result.teams.push(teamHeader);
        section = 'teams';
        readingPlayers = false;
        applyTeamStats(currentTeam, line);
        const inlinePlayers = line.match(/(?:jogadores?|elenco|escalação)\s*:?\s*(.+)$/i);
        if (inlinePlayers) currentTeam.players.push(...splitPlayerList(inlinePlayers[1]));
        continue;
      }
      if (currentTeam && section === 'teams') {
        if (applyTeamStats(currentTeam, line)) {
          continue;
        }
        const rosterLine = line.match(/^(?:jogadores?|elenco|escalação)\s*:?\s*(.+)$/i);
        if (rosterLine) {
          readingPlayers = true;
          currentTeam.players.push(...splitPlayerList(rosterLine[1]));
          continue;
        }
        if (readingPlayers || /^[*•-]/.test(line)) {
          if (/sem jogadores? registrados?/i.test(line)) { currentTeam.emptyReported = true; continue; }
          const players = splitPlayerList(line);
          if (players.length) { currentTeam.players.push(...players); continue; }
        }
      }

      if (section === 'scorers' || /\b\d+\s*gols?\b/i.test(line)) {
        const scorers = line.split(/\s*;\s*/).map(parseScorerLine).filter(Boolean);
        if (scorers.length) { result.scorers.push(...scorers); continue; }
      }
      if (!/^(?:baba|regra de pontuacao|vitoria\s*=|empate\s*=|destaque)/i.test(normalized)) {
        result.observations.push(line);
      }
    }

    result.zeroGoalPlayers = result.zeroGoalPlayers
      .filter((player) => !result.scorers.some((scorer) => normalizeAlias(scorer.name) === normalizeAlias(player.name)));

    const scorerByName = new Map(result.scorers.map((item) => [normalizeAlias(item.name), item]));
    result.teams.forEach((team) => {
      team.players.forEach((player) => {
        const scorer = scorerByName.get(normalizeAlias(player.name));
        if (scorer) {
          player.roles = mergeRoles(player.roles, scorer.roles);
          scorer.roles = mergeRoles(scorer.roles, player.roles);
          if (!scorer.teamKey) { scorer.teamKey = team.id; scorer.teamName = team.name; }
        }
      });
    });
    result.zeroGoalPlayers.forEach((zero) => {
      const roster = result.teams.flatMap((team) => team.players).find((player) => normalizeAlias(player.name) === normalizeAlias(zero.name));
      if (roster) {
        zero.roles = mergeRoles(zero.roles, roster.roles);
        roster.roles = mergeRoles(roster.roles, zero.roles);
      }
    });
    return pruneEmptyTeams(result);
  }

  function scoreCandidate(typedName, player, aliases = []) {
    const official = player?.nome || player?.name || '';
    const typedAccented = normalizeName(typedName, { keepAccents: true });
    const officialAccented = normalizeName(official, { keepAccents: true });
    const typed = normalizeName(typedName);
    const candidate = normalizeName(official);
    const typedAlias = normalizeAlias(typedName);
    if (!typed || !candidate || !player?.id) return null;
    if (typedAccented === officialAccented) {
      return { player, score: 1, reason: 'Nome oficial idêntico', source: 'exact' };
    }
    if (typed === candidate) {
      return { player, score: 0.97, reason: 'Mesmo nome após normalização de acentos e espaços', source: 'normalized' };
    }
    const alias = aliases.find((item) => item?.active !== false
      && (item.playerId === player.id || item.jogadorId === player.id)
      && normalizeAlias(item.normalizedText || item.text || item.originalText) === typedAlias);
    if (alias) {
      return { player, score: 0.995, reason: 'Alias confirmado anteriormente', source: 'alias', aliasId: alias.id };
    }
    const levenshtein = levenshteinSimilarity(typed, candidate);
    const jaroWinkler = jaroWinklerSimilarity(typed, candidate);
    const containment = (typed.includes(candidate) || candidate.includes(typed)) ? Math.min(typed.length, candidate.length) / Math.max(typed.length, candidate.length) : 0;
    let score = (jaroWinkler * 0.62) + (levenshtein * 0.33) + (containment * 0.05);
    if (Math.min(typed.length, candidate.length) <= 2 && typed !== candidate) score = Math.min(score, 0.91);
    return {
      player,
      score: clamp(score),
      reason: `Similaridade textual (Jaro-Winkler ${Math.round(jaroWinkler * 100)}%, Levenshtein ${Math.round(levenshtein * 100)}%)`,
      source: 'fuzzy',
      metrics: { levenshtein, jaroWinkler, containment },
    };
  }

  function matchPlayerName(typedName, players, aliases = [], config = {}) {
    const settings = { ...DEFAULT_MATCH_CONFIG, ...config };
    const candidates = (players || [])
      .filter((player) => player && player.deleted !== true && player.ativo !== false && player.id)
      .map((player) => scoreCandidate(typedName, player, aliases))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || String(a.player.nome || '').localeCompare(String(b.player.nome || '')))
      .slice(0, settings.maxCandidates);
    const best = candidates[0] || null;
    const second = candidates[1] || null;
    const ambiguous = Boolean(best && second && (best.score - second.score) < settings.ambiguityGap && second.score >= settings.reviewThreshold);
    let status = 'new';
    if (best && !ambiguous && best.score >= settings.automaticThreshold) status = 'automatic';
    else if (best && best.score >= settings.reviewThreshold) status = 'review';
    return {
      typedName: normalizeWhitespace(typedName),
      normalizedName: normalizeName(typedName),
      status,
      confidence: best ? Number(best.score.toFixed(4)) : 0,
      reason: ambiguous ? 'Dois jogadores possuem pontuações muito próximas; escolha manual obrigatória.' : (best?.reason || 'Nenhuma correspondência confiável'),
      suggestedPlayerId: status === 'new' ? null : best?.player?.id || null,
      suggestedOfficialName: status === 'new' ? '' : best?.player?.nome || best?.player?.name || '',
      aliasId: best?.aliasId || null,
      ambiguous,
      candidates: candidates.map((candidate) => ({
        playerId: candidate.player.id,
        officialName: candidate.player.nome || candidate.player.name || '',
        confidence: Number(candidate.score.toFixed(4)),
        reason: candidate.reason,
        source: candidate.source,
        aliasId: candidate.aliasId || null,
      })),
    };
  }

  function collectPeople(parsed) {
    const records = new Map();
    const add = (person, context = {}) => {
      const key = normalizeAlias(person?.name);
      if (!key) return;
      const current = records.get(key) || {
        typedName: normalizeWhitespace(person.name),
        roles: { guest: false, goalkeeper: false, novice: false },
        teamKeys: [],
        goals: 0,
        contexts: [],
      };
      current.roles = mergeRoles(current.roles, person.roles);
      if (context.teamKey && !current.teamKeys.includes(context.teamKey)) current.teamKeys.push(context.teamKey);
      if (context.goals != null) current.goals = Math.max(current.goals, Number(context.goals || 0));
      if (context.context && !current.contexts.includes(context.context)) current.contexts.push(context.context);
      records.set(key, current);
    };
    (parsed?.teams || []).forEach((team) => (team.players || []).forEach((player) => add(player, { teamKey: team.id, context: 'roster' })));
    (parsed?.scorers || []).forEach((player) => add(player, { teamKey: player.teamKey, goals: player.goals, context: 'scorer' }));
    (parsed?.zeroGoalPlayers || []).forEach((player) => add(player, { goals: 0, context: 'zero-goals' }));
    return [...records.values()];
  }

  function resolvePeople(parsed, players, aliases = [], config = {}) {
    return collectPeople(parsed).map((person) => ({
      ...person,
      match: matchPlayerName(person.typedName, players, aliases, config),
      resolution: null,
    }));
  }

  function makeWarning(code, severity, message, path = '', details = {}) {
    return { id: `${code}:${path || 'root'}`, code, severity, message, path, details };
  }

  function validateStructuredReport(parsed) {
    const warnings = [];
    if (!parsed || parsed.schemaVersion !== IMPORT_SCHEMA_VERSION) {
      return [makeWarning('INVALID_SCHEMA', 'blocker', 'O resultado não corresponde ao schema de importação aceito.')];
    }
    if (!parsed.date) warnings.push(makeWarning('MISSING_DATE', 'blocker', 'A data do baba não foi identificada.', 'date'));
    if (!Array.isArray(parsed.teams) || !parsed.teams.length) warnings.push(makeWarning('MISSING_TEAMS', 'blocker', 'Nenhum time foi identificado.', 'teams'));
    (parsed.ignoredTeams || []).forEach((team) => {
      warnings.push(makeWarning('IGNORED_EMPTY_TEAM', 'info', `${team.name || 'Time vazio'} foi ignorado porque não teve jogadores nem participação no baba.`, 'ignoredTeams'));
    });

    const seenTeamIds = new Set();
    const playerTeams = new Map();
    let teamGoalsTotal = 0;
    (parsed.teams || []).forEach((team, teamIndex) => {
      const path = `teams.${teamIndex}`;
      if (!team.id || seenTeamIds.has(team.id)) warnings.push(makeWarning('DUPLICATE_TEAM', 'blocker', `O ${team.name || 'time'} está duplicado.`, path));
      seenTeamIds.add(team.id);
      if (!team.vestColor) warnings.push(makeWarning('MISSING_VEST_COLOR', 'warning', `${team.name || 'Um time'} está sem cor de colete.`, `${path}.vestColor`));
      ['wins', 'draws', 'losses'].forEach((field) => {
        if (team[field] == null) warnings.push(makeWarning('MISSING_TEAM_RESULT', 'blocker', `${team.name || 'Um time'} está sem ${field === 'wins' ? 'vitórias' : field === 'draws' ? 'empates' : 'derrotas'}.`, `${path}.${field}`));
      });
      if (!(team.players || []).length) {
        warnings.push(makeWarning('EMPTY_TEAM', 'warning', `${team.name || 'Um time'} está sem jogadores.`, `${path}.players`, { expectedEmpty: Boolean(team.emptyReported) }));
      }
      const calculatedPoints = (Number(team.wins || 0) * 3) + Number(team.draws || 0);
      team.calculatedPoints = calculatedPoints;
      if (team.pointsInformed != null && Number(team.pointsInformed) !== calculatedPoints) {
        warnings.push(makeWarning('POINTS_DIVERGENCE', 'blocker', `${team.name}: o texto informa ${team.pointsInformed} pontos, mas vitórias e empates resultam em ${calculatedPoints}.`, `${path}.pointsInformed`, { informed: team.pointsInformed, calculated: calculatedPoints }));
      }
      const scorerGoals = (parsed.scorers || []).filter((item) => item.teamKey === team.id).reduce((sum, item) => sum + Number(item.goals || 0), 0);
      team.calculatedGoals = scorerGoals;
      if (team.goalsInformed != null) teamGoalsTotal += Number(team.goalsInformed || 0);
      if (team.goalsInformed != null && Number(team.goalsInformed) !== scorerGoals) {
        warnings.push(makeWarning('TEAM_GOALS_DIVERGENCE', 'blocker', `${team.name}: os gols individuais somam ${scorerGoals}, mas o total informado do time é ${team.goalsInformed}.`, `${path}.goalsInformed`, { informed: team.goalsInformed, calculated: scorerGoals }));
      }
      const localNames = new Set();
      (team.players || []).forEach((player, playerIndex) => {
        const key = normalizeAlias(player.name);
        if (localNames.has(key)) warnings.push(makeWarning('DUPLICATE_PLAYER_IN_TEAM', 'blocker', `${player.name} aparece mais de uma vez no ${team.name}.`, `${path}.players.${playerIndex}`));
        localNames.add(key);
        const teams = playerTeams.get(key) || [];
        teams.push(team.name);
        playerTeams.set(key, teams);
      });
    });
    playerTeams.forEach((teams, key) => {
      if (new Set(teams).size > 1) warnings.push(makeWarning('PLAYER_IN_MULTIPLE_TEAMS', 'blocker', `O jogador “${key}” aparece em mais de um time: ${[...new Set(teams)].join(', ')}.`, 'teams'));
    });

    const rosterNames = new Set((parsed.teams || []).flatMap((team) => (team.players || []).map((player) => normalizeAlias(player.name))));
    const scorerNames = new Set();
    (parsed.scorers || []).forEach((scorer, index) => {
      const scorerKey = normalizeAlias(scorer.name);
      if (scorerNames.has(scorerKey)) warnings.push(makeWarning('DUPLICATE_SCORER', 'blocker', `${scorer.name} aparece mais de uma vez na lista de gols.`, `scorers.${index}`));
      scorerNames.add(scorerKey);
      if (!rosterNames.has(normalizeAlias(scorer.name))) warnings.push(makeWarning('SCORER_NOT_IN_ROSTER', 'blocker', `${scorer.name} possui gols, mas não aparece na lista de jogadores.`, `scorers.${index}`));
      if (scorer.teamKey && !seenTeamIds.has(scorer.teamKey)) warnings.push(makeWarning('SCORER_UNKNOWN_TEAM', 'blocker', `${scorer.name} está associado a um time não identificado.`, `scorers.${index}.teamKey`));
    });
    const zeroNames = new Set();
    (parsed.zeroGoalPlayers || []).forEach((player, index) => {
      const key = normalizeAlias(player.name);
      if (zeroNames.has(key)) warnings.push(makeWarning('DUPLICATE_ZERO_GOAL_PLAYER', 'blocker', `${player.name} aparece repetido na lista de jogadores sem gols.`, `zeroGoalPlayers.${index}`));
      zeroNames.add(key);
      if (!rosterNames.has(key)) warnings.push(makeWarning('ZERO_GOAL_PLAYER_NOT_IN_ROSTER', 'blocker', `${player.name} está na lista sem gols, mas não aparece em nenhum time.`, `zeroGoalPlayers.${index}`));
    });
    const individualGoals = (parsed.scorers || []).reduce((sum, item) => sum + Number(item.goals || 0), 0);
    parsed.calculatedTotalGoals = individualGoals;
    if (parsed.totalGoalsInformed != null && Number(parsed.totalGoalsInformed) !== individualGoals) {
      warnings.push(makeWarning('TOTAL_GOALS_DIVERGENCE', 'blocker', `Os gols individuais somam ${individualGoals}, mas o total informado é ${parsed.totalGoalsInformed}.`, 'totalGoalsInformed', { informed: parsed.totalGoalsInformed, calculated: individualGoals }));
    }
    if ((parsed.teams || []).every((team) => team.goalsInformed != null) && parsed.totalGoalsInformed != null && teamGoalsTotal !== Number(parsed.totalGoalsInformed)) {
      warnings.push(makeWarning('TEAM_TOTAL_DIVERGENCE', 'blocker', `A soma dos gols dos times é ${teamGoalsTotal}, mas o total informado é ${parsed.totalGoalsInformed}.`, 'teams', { informed: parsed.totalGoalsInformed, calculated: teamGoalsTotal }));
    }
    if (parsed.topScorerInformed) {
      const found = (parsed.scorers || []).find((item) => normalizeAlias(item.name) === normalizeAlias(parsed.topScorerInformed.name));
      if (!found || Number(found.goals) !== Number(parsed.topScorerInformed.goals)) warnings.push(makeWarning('TOP_SCORER_DIVERGENCE', 'warning', 'O artilheiro destacado não corresponde à lista de gols.', 'topScorerInformed'));
    }
    return warnings;
  }

  function validateResolutions(people, config = {}) {
    const settings = { ...DEFAULT_MATCH_CONFIG, ...config };
    const warnings = [];
    const resolvedIds = new Map();
    (people || []).forEach((person, index) => {
      const resolution = person.resolution;
      const match = person.match || {};
      if (!resolution) {
        if (match.status === 'automatic' && !match.ambiguous) return;
        warnings.push(makeWarning('PLAYER_REVIEW_REQUIRED', 'blocker', `Confirme a identidade de ${person.typedName}.`, `people.${index}`, { confidence: match.confidence }));
        return;
      }
      if (!['existing', 'new'].includes(resolution.type)) {
        warnings.push(makeWarning('INVALID_PLAYER_RESOLUTION', 'blocker', `A decisão para ${person.typedName} é inválida.`, `people.${index}`));
        return;
      }
      const key = resolution.type === 'existing' ? resolution.playerId : normalizeAlias(resolution.officialName || person.typedName);
      if (!key) warnings.push(makeWarning('MISSING_PLAYER_RESOLUTION', 'blocker', `A decisão para ${person.typedName} está incompleta.`, `people.${index}`));
      const prior = resolvedIds.get(key);
      if (prior && prior !== normalizeAlias(person.typedName)) warnings.push(makeWarning('DUPLICATE_RESOLUTION', 'blocker', `${person.typedName} e outro nome foram associados à mesma pessoa nesta importação.`, `people.${index}`));
      resolvedIds.set(key, normalizeAlias(person.typedName));
      if (resolution.type === 'existing' && Number(match.confidence || 0) < settings.reviewThreshold && !resolution.confirmedManually) {
        warnings.push(makeWarning('LOW_CONFIDENCE_UNCONFIRMED', 'blocker', `A associação de ${person.typedName} possui baixa confiança e precisa de confirmação manual.`, `people.${index}`));
      }
    });
    return warnings;
  }

  function buildAnalysis(text, players = [], aliases = [], config = {}) {
    const parsed = parseReport(text);
    const people = resolvePeople(parsed, players, aliases, config);
    people.forEach((person) => {
      if (person.match.status === 'automatic' && !person.match.ambiguous) {
        person.resolution = { type: 'existing', playerId: person.match.suggestedPlayerId, confirmedManually: false };
      }
    });
    const warnings = [...validateStructuredReport(parsed), ...validateResolutions(people, config)];
    return {
      schemaVersion: IMPORT_SCHEMA_VERSION,
      parsed,
      people,
      warnings,
      confidence: calculateAnalysisConfidence(parsed, people, warnings),
    };
  }

  function calculateAnalysisConfidence(parsed, people, warnings) {
    const parsingScore = [parsed?.date, parsed?.teams?.length, parsed?.scorers?.length].filter(Boolean).length / 3;
    const matchingScore = people?.length ? people.reduce((sum, person) => sum + Number(person.match?.confidence || 0), 0) / people.length : 0;
    const blockers = (warnings || []).filter((item) => item.severity === 'blocker').length;
    return Number(clamp(((parsingScore * 0.45) + (matchingScore * 0.55)) - (blockers * 0.08)).toFixed(4));
  }

  function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
  }

  async function sha256(value) {
    const source = String(value ?? '');
    if (globalThis.crypto?.subtle && typeof TextEncoder !== 'undefined') {
      const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
      return Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, '0')).join('');
    }
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
  }

  function isHighConfidenceAnalysis(analysis, config = {}) {
    const settings = { ...DEFAULT_MATCH_CONFIG, ...config };
    return Boolean(analysis
      && !(analysis.warnings || []).some((item) => item.severity === 'blocker')
      && (analysis.people || []).every((person) => person.resolution?.type === 'existing'
        && (person.match?.source === 'alias' || Number(person.match?.confidence || 0) >= settings.automaticThreshold))
      && Number(analysis.confidence || 0) >= settings.automaticThreshold);
  }

  return Object.freeze({
    IMPORT_SCHEMA_VERSION,
    DEFAULT_MATCH_CONFIG,
    ROLE_LABELS,
    normalizeWhitespace,
    normalizeName,
    normalizeAlias,
    sanitizeImportedText,
    levenshteinDistance,
    levenshteinSimilarity,
    jaroSimilarity,
    jaroWinklerSimilarity,
    parseRoles,
    mergeRoles,
    roleLabels,
    parseDate,
    parseReport,
    pruneEmptyTeams,
    matchPlayerName,
    collectPeople,
    resolvePeople,
    validateStructuredReport,
    validateResolutions,
    buildAnalysis,
    calculateAnalysisConfidence,
    stableStringify,
    sha256,
    isHighConfidenceAnalysis,
  });
}));
