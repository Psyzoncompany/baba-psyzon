(() => {
  const SITE_VERSION = '6.1.5';
  window.PSYZON_SITE_VERSION = SITE_VERSION;

  function ensureStyles() {
    if (document.getElementById('site-version-styles')) return;
    const style = document.createElement('style');
    style.id = 'site-version-styles';
    style.textContent = `
      .site-version-footer{display:flex;justify-content:center;align-items:center;width:100%;padding:1.25rem 1rem calc(.75rem + env(safe-area-inset-bottom));position:relative;z-index:25;box-sizing:border-box}
      .site-version-link{display:inline-flex;align-items:center;gap:.48rem;min-height:2.25rem;padding:.42rem .85rem;border:1px solid var(--border,#e5e7eb);border-radius:var(--component-radius,10px);background:var(--card,#fff);box-shadow:var(--shadow-card-token,0 1px 2px rgba(15,23,42,.06));color:var(--primary,#2563eb);font:700 .72rem/1.2 var(--font-site,"Inter",system-ui,sans-serif);letter-spacing:0;text-transform:uppercase}
      .site-version-link::before{content:"";width:.45rem;height:.45rem;border-radius:50%;background:var(--primary,#2563eb);box-shadow:0 0 0 .22rem var(--focus-ring,rgba(37,99,235,.14))}
      body.baba-page .site-version-footer{padding-bottom:1.25rem}
      @media(max-width:768px){body:has(.bottom-nav) .site-version-footer{padding-bottom:calc(5rem + env(safe-area-inset-bottom))}}
    `;
    document.head.appendChild(style);
  }

  function mountVersionFooter() {
    if (document.querySelector('[data-site-version-footer]')) return;
    ensureStyles();
    const footer = document.createElement('footer');
    footer.className = 'site-version-footer';
    footer.dataset.siteVersionFooter = SITE_VERSION;
    footer.setAttribute('aria-label', 'Versao atual do sistema');
    footer.innerHTML = `<span class="site-version-link" aria-label="Versao atual ${SITE_VERSION}">Versao ${SITE_VERSION}</span>`;
    const bottomNavigation = document.querySelector('.bottom-nav');
    if (bottomNavigation) bottomNavigation.before(footer);
    else document.body.appendChild(footer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountVersionFooter, { once: true });
  } else {
    mountVersionFooter();
  }
})();
