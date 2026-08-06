(function initializeBabaTeamTheme(window, document) {
  'use strict';

  const STORAGE_KEY = 'psyzon_baba_team_theme_v1';
  const DEFAULT_TEAMS = Object.freeze([
    Object.freeze({ number: 1, name: 'Time 1', club: 'Flamengo', color: '#E12A3F', logo: 'img/baba-team-1-flamengo.png' }),
    Object.freeze({ number: 2, name: 'Time 2', club: 'Palmeiras', color: '#078B56', logo: 'img/baba-team-2-palmeiras.png' }),
    Object.freeze({ number: 3, name: 'Time 3', club: 'Vasco', color: '#B8A46F', logo: 'img/baba-team-3-vasco.png' }),
    Object.freeze({ number: 4, name: 'Time 4', club: 'Corinthians', color: '#111827', logo: 'img/baba-team-4-corinthians.png' }),
    Object.freeze({ number: 5, name: 'Time 5', club: 'Azul', color: '#2563A8', logo: 'img/baba-time-5.png' }),
  ]);
  const DEFAULT_LOGOS = new Set(DEFAULT_TEAMS.map((team) => team.logo));
  const subscribers = new Set();

  function storage() {
    return window.__nativeLS || window.localStorage;
  }

  function normalizeColor(value, fallback) {
    const candidate = String(value || '').trim().toUpperCase();
    return /^#[0-9A-F]{6}$/.test(candidate) ? candidate : fallback;
  }

  function normalizeLogo(value, fallback) {
    const candidate = String(value || '').trim();
    if (DEFAULT_LOGOS.has(candidate)) return candidate;
    if (/^data:image\/(?:png|jpe?g|webp);base64,/i.test(candidate) && candidate.length <= 700000) return candidate;
    return fallback;
  }

  function normalize(source) {
    const custom = source && typeof source === 'object' ? source : {};
    return DEFAULT_TEAMS.map((fallback) => {
      const value = custom[fallback.number] && typeof custom[fallback.number] === 'object'
        ? custom[fallback.number]
        : {};
      return {
        ...fallback,
        color: normalizeColor(value.color, fallback.color),
        logo: normalizeLogo(value.logo, fallback.logo),
      };
    });
  }

  function read() {
    try {
      return normalize(JSON.parse(storage().getItem(STORAGE_KEY) || 'null'));
    } catch (_) {
      return normalize(null);
    }
  }

  let teams = read();

  function persist() {
    const payload = Object.fromEntries(teams.map((team) => [team.number, {
      color: team.color,
      logo: team.logo,
    }]));
    storage().setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function contrastColor(color) {
    const hex = color.slice(1);
    const channels = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
    const luminance = channels.reduce((total, channel, index) => {
      const linear = channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      return total + (linear * [.2126, .7152, .0722][index]);
    }, 0);
    return luminance > .46 ? '#111827' : '#FFFFFF';
  }

  function apply({ announce = false } = {}) {
    teams.forEach((team) => {
      document.documentElement.style.setProperty(`--team-${team.number}-custom-color`, team.color);
      document.documentElement.style.setProperty(`--team-${team.number}-custom-contrast`, contrastColor(team.color));
    });
    if (!announce) return;
    const detail = { teams: getTeams() };
    window.dispatchEvent(new CustomEvent('psyzon-team-theme-change', { detail }));
    subscribers.forEach((subscriber) => subscriber(detail));
  }

  function snapshot(team) {
    const crest = DEFAULT_TEAMS.find((candidate) => candidate.logo === team.logo);
    return { ...team, club: crest?.club || 'Personalizado' };
  }

  function getTeams() {
    return teams.map(snapshot);
  }

  function getDefaultTeams() {
    return DEFAULT_TEAMS.map((team) => ({ ...team }));
  }

  function getTeam(number) {
    const safeNumber = Math.max(1, Number(number) || 1);
    const team = teams[(safeNumber - 1) % teams.length];
    return team ? snapshot(team) : null;
  }

  function setTeam(number, patch) {
    const index = teams.findIndex((team) => team.number === Number(number));
    if (index < 0) return null;
    const fallback = DEFAULT_TEAMS[index];
    const current = teams[index];
    teams[index] = {
      ...current,
      color: normalizeColor(patch?.color ?? current.color, fallback.color),
      logo: normalizeLogo(patch?.logo ?? current.logo, fallback.logo),
    };
    persist();
    apply({ announce: true });
    return snapshot(teams[index]);
  }

  function resetTeam(number) {
    const index = DEFAULT_TEAMS.findIndex((team) => team.number === Number(number));
    if (index < 0) return null;
    teams[index] = { ...DEFAULT_TEAMS[index] };
    persist();
    apply({ announce: true });
    return snapshot(teams[index]);
  }

  function resetAll() {
    teams = normalize(null);
    persist();
    apply({ announce: true });
    return getTeams();
  }

  window.BabaTeamTheme = Object.freeze({
    storageKey: STORAGE_KEY,
    getTeams,
    getDefaultTeams,
    getTeam,
    setTeam,
    resetTeam,
    resetAll,
    apply,
    subscribe(callback) {
      if (typeof callback !== 'function') return () => {};
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
  });

  apply();
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    teams = read();
    apply({ announce: true });
  });
})(window, document);
