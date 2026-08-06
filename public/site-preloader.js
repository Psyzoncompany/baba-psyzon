/* PSYZON navigation warm-up.
   Warms only the destination the user points to, avoiding background request bursts. */
(() => {
  const loaderScriptUrl = new URL(document.currentScript?.src || 'site-preloader.js', window.location.href);
  if (!document.querySelector('script[data-site-version-loader]')) {
    const versionScript = document.createElement('script');
    versionScript.src = new URL('site-version.js?v=6.1.3', loaderScriptUrl).href;
    versionScript.defer = true;
    versionScript.dataset.siteVersionLoader = 'true';
    document.head.appendChild(versionScript);
  }
  const prefetched = new Set();
  const currentUrl = new URL(window.location.href);

  const canPrefetch = (url) => {
    const next = new URL(url, window.location.href);
    return next.origin === currentUrl.origin && !prefetched.has(next.href);
  };

  const warm = (url) => {
    if (!canPrefetch(url)) return;
    prefetched.add(url);
    fetch(url, { method: 'GET', credentials: 'same-origin', cache: 'force-cache' }).catch(() => {});
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
    warm(url);
  });

  window.addEventListener('pageshow', () => {
    document.documentElement.classList.remove('site-is-leaving');
  });
})();
