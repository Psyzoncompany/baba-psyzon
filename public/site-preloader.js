/* PSYZON instant navigation warm-up.
   Prefetches the main static screens and their JS/CSS assets after the first paint,
   so moving between pages feels cached instead of loading from zero. */
(() => {
  const loaderScriptUrl = new URL(document.currentScript?.src || 'site-preloader.js', window.location.href);
  if (!document.querySelector('script[data-site-version-loader]')) {
    const versionScript = document.createElement('script');
    versionScript.src = new URL('site-version.js?v=6.0.46', loaderScriptUrl).href;
    versionScript.defer = true;
    versionScript.dataset.siteVersionLoader = 'true';
    document.head.appendChild(versionScript);
  }
  const ROOT_PAGE = 'index.html';
  const SITE_PAGES = [
    'central.html',
    'index.html',
    'clientes.html',
    'processos.html',
    'contas.html',
    'historico.html',
    'relatorios.html',
    'investimentos.html',
    'configuracoes.html',
    'versoes.html',
    'pessoal/pessoal.html'
  ];
  const SITE_ASSETS = [
    'style.css',
    'ui-liquid.css',
    'theme-toggle.js',
    'site-version.js',
    'firebase-config.js',
    'img/logo.png',
    'img/ui-icon-sheet.png',
    'icons/icon-180.png',
    'icons/icon-192.png',
    'icons/icon-512.png'
  ];

  const prefetched = new Set();
  const currentUrl = new URL(window.location.href);
  const rootUrl = new URL(currentUrl.pathname.includes('/pessoal/') ? '../' : './', currentUrl);

  const toUrl = (path) => new URL(path, rootUrl).href;

  const canPrefetch = (url) => {
    const next = new URL(url, window.location.href);
    return next.origin === currentUrl.origin && !prefetched.has(next.href);
  };

  const addHint = (url, as = 'fetch') => {
    if (!canPrefetch(url)) return;
    prefetched.add(url);
    const link = document.createElement('link');
    link.rel = as === 'document' ? 'prefetch' : 'preload';
    link.href = url;
    if (as !== 'document') link.as = as;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  const warm = (url) => {
    if (!canPrefetch(url)) return;
    prefetched.add(url);
    fetch(url, { method: 'GET', credentials: 'same-origin', cache: 'force-cache' }).catch(() => {});
  };

  const warmAll = () => {
    SITE_ASSETS.forEach((asset) => warm(toUrl(asset)));
    SITE_PAGES.forEach((page) => addHint(toUrl(page), 'document'));
    SITE_PAGES.forEach((page, index) => setTimeout(() => warm(toUrl(page)), 90 * index));
  };

  const scheduleWarmAll = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(warmAll, { timeout: 1600 });
    } else {
      setTimeout(warmAll, 700);
    }
  };

  const resolveAnchorUrl = (anchor) => {
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return null;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return null;
    const url = new URL(href, window.location.href);
    if (url.origin !== currentUrl.origin || !url.pathname.endsWith('.html')) return null;
    return url.href;
  };

  document.addEventListener('mouseover', (event) => {
    const url = resolveAnchorUrl(event.target.closest?.('a'));
    if (url) warm(url);
  }, { passive: true });

  document.addEventListener('touchstart', (event) => {
    const url = resolveAnchorUrl(event.target.closest?.('a'));
    if (url) warm(url);
  }, { passive: true });

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.('a');
    const url = resolveAnchorUrl(anchor);
    if (!url || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    document.documentElement.classList.add('site-is-leaving');
    warm(url || toUrl(ROOT_PAGE));
  });

  window.addEventListener('pageshow', () => {
    document.documentElement.classList.remove('site-is-leaving');
  });

  scheduleWarmAll();
})();
