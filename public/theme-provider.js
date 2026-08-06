(function initializeThemeProvider(window, document) {
  'use strict';

  const STORAGE_KEY = 'psyzon_ui_preferences_v1';
  const LEGACY_BABA_THEME_KEY = 'psyzon_baba_theme';
  const DEFAULTS = Object.freeze({
    mode: 'system',
    density: 'normal',
    radius: 'medium',
    motion: 'full',
    language: 'pt-BR',
  });
  const OPTIONS = Object.freeze({
    mode: new Set(['system', 'light', 'dark']),
    density: new Set(['compact', 'normal', 'comfortable']),
    radius: new Set(['small', 'medium', 'large']),
    motion: new Set(['full', 'reduced']),
    language: new Set(['pt-BR']),
  });
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)');
  const subscribers = new Set();

  function storage() {
    return window.__nativeLS || window.localStorage;
  }

  function normalize(candidate) {
    const source = candidate && typeof candidate === 'object' ? candidate : {};
    return Object.fromEntries(Object.entries(DEFAULTS).map(([key, fallback]) => [
      key,
      OPTIONS[key].has(source[key]) ? source[key] : fallback,
    ]));
  }

  function read() {
    try {
      const saved = JSON.parse(storage().getItem(STORAGE_KEY) || 'null');
      if (saved) return normalize(saved);
      const legacyMode = storage().getItem(LEGACY_BABA_THEME_KEY);
      return normalize(legacyMode === 'dark' || legacyMode === 'light' ? { mode: legacyMode } : null);
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  let preferences = read();

  function resolvedMode() {
    if (preferences.mode !== 'system') return preferences.mode;
    return systemDark?.matches ? 'dark' : 'light';
  }

  function apply({ announce = false } = {}) {
    const root = document.documentElement;
    const colorMode = resolvedMode();
    root.dataset.theme = 'minimal';
    root.dataset.colorMode = colorMode;
    root.dataset.density = preferences.density;
    root.dataset.radius = preferences.radius;
    root.dataset.motion = preferences.motion;
    root.lang = preferences.language === 'pt-BR' ? 'pt-br' : preferences.language;
    root.style.colorScheme = colorMode;
    document.body?.classList.toggle('baba-dark-theme', colorMode === 'dark');

    const themeColor = colorMode === 'dark' ? '#09090B' : '#F8FAFC';
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', themeColor));
    syncControls();

    if (announce) {
      const detail = { preferences: { ...preferences }, resolvedMode: colorMode };
      window.dispatchEvent(new CustomEvent('psyzon-theme-change', { detail }));
      subscribers.forEach((subscriber) => subscriber(detail));
    }
  }

  function persist() {
    try {
      storage().setItem(STORAGE_KEY, JSON.stringify(preferences));
      storage().setItem(LEGACY_BABA_THEME_KEY, resolvedMode());
    } catch (_) {
      // The active theme still works for this session when storage is unavailable.
    }
  }

  function setPreferences(next) {
    preferences = normalize({ ...preferences, ...(next || {}) });
    persist();
    apply({ announce: true });
    return { ...preferences };
  }

  function reset() {
    preferences = { ...DEFAULTS };
    persist();
    apply({ announce: true });
    return { ...preferences };
  }

  function syncControls() {
    document.querySelectorAll('[data-theme-settings] input[type="radio"]').forEach((input) => {
      input.checked = preferences[input.name] === input.value;
    });
    document.querySelectorAll('[data-theme-settings] select').forEach((select) => {
      if (Object.prototype.hasOwnProperty.call(preferences, select.name)) select.value = preferences[select.name];
    });
    document.querySelectorAll('[data-theme-current]').forEach((node) => {
      node.textContent = resolvedMode() === 'dark' ? 'Escuro' : 'Claro';
    });
  }

  function wireSettings() {
    document.querySelectorAll('[data-theme-settings]').forEach((form) => {
      if (form.dataset.themeSettingsReady === 'true') return;
      form.dataset.themeSettingsReady = 'true';
      form.addEventListener('change', (event) => {
        const control = event.target;
        if (!control?.name || !Object.prototype.hasOwnProperty.call(DEFAULTS, control.name)) return;
        setPreferences({ [control.name]: control.value });
      });
      form.querySelector('[data-theme-reset]')?.addEventListener('click', reset);
    });
    syncControls();
  }

  function renderIcons(scope = document) {
    if (!window.lucide?.createIcons) return;
    window.lucide.createIcons({
      root: scope,
      attrs: { 'aria-hidden': 'true', 'stroke-width': 1.8 },
    });
  }

  function initializeDom() {
    apply();
    wireSettings();
    renderIcons();
  }

  window.ThemeProvider = Object.freeze({
    getPreferences: () => ({ ...preferences }),
    getResolvedMode: resolvedMode,
    setPreferences,
    reset,
    apply,
    subscribe(callback) {
      if (typeof callback !== 'function') return () => {};
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
  });

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeDom, { once: true });
  else initializeDom();
  systemDark?.addEventListener?.('change', () => preferences.mode === 'system' && apply({ announce: true }));
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    preferences = read();
    apply({ announce: true });
  });
})(window, document);
