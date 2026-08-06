(() => {
  const SITE_VERSION = '6.1.2';
  const scriptUrl = new URL(document.currentScript?.src || 'site-version.js', window.location.href);
  const versionsUrl = new URL('versoes.html', scriptUrl);

  window.PSYZON_SITE_VERSION = SITE_VERSION;

  function ensureStyles() {
    if (document.getElementById('site-version-styles')) return;
    const style = document.createElement('style');
    style.id = 'site-version-styles';
    style.textContent = `
      .site-version-footer{display:flex;justify-content:center;align-items:center;width:100%;padding:1.25rem 1rem calc(.75rem + env(safe-area-inset-bottom));position:relative;z-index:25;box-sizing:border-box}
      .site-version-link{display:inline-flex;align-items:center;gap:.48rem;min-height:2.25rem;padding:.42rem .85rem;border:1px solid var(--border,#e5e7eb);border-radius:var(--component-radius,10px);background:var(--card,#fff);box-shadow:var(--shadow-card-token,0 1px 2px rgba(15,23,42,.06));color:var(--primary,#2563eb);font:700 .72rem/1.2 var(--font-site,"Inter",system-ui,sans-serif);letter-spacing:0;text-decoration:none;text-transform:uppercase;transition:transform var(--transition-fast,.18s ease),background var(--transition-fast,.18s ease),border-color var(--transition-fast,.18s ease)}
      .site-version-link::before{content:"";width:.45rem;height:.45rem;border-radius:50%;background:var(--primary,#2563eb);box-shadow:0 0 0 .22rem var(--focus-ring,rgba(37,99,235,.14))}
      .site-version-link:hover,.site-version-link:focus-visible{transform:translateY(-1px);background:var(--secondary-hover,#f3f4f6);border-color:var(--primary,#2563eb);color:var(--primary-hover,#1d4ed8);outline:none}
      .site-version-link span{opacity:.76;font-size:.64rem;letter-spacing:.03em;text-transform:none}
      body.psyzon-login-page .site-version-footer{position:fixed;left:50%;bottom:max(.35rem,env(safe-area-inset-bottom));transform:translateX(-50%);width:auto;padding:.5rem;z-index:80}
      body.psyzon-login-page .site-version-link{background:var(--card,#fff)}
      body.baba-page .site-version-footer{padding-bottom:1.25rem}
      @media(max-width:768px){body:has(.bottom-nav) .site-version-footer{padding-bottom:calc(5rem + env(safe-area-inset-bottom))}.site-version-link span{display:none}}
      @media(prefers-reduced-motion:reduce){.site-version-link{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function mountVersionFooter() {
    if (document.querySelector('[data-site-version-footer]')) return;
    ensureStyles();
    const footer = document.createElement('footer');
    footer.className = 'site-version-footer';
    footer.dataset.siteVersionFooter = SITE_VERSION;
    footer.setAttribute('aria-label', 'Versão atual do sistema');
    footer.innerHTML = `<a class="site-version-link" href="${versionsUrl.href}" aria-label="Abrir novidades da versão ${SITE_VERSION}">Versão ${SITE_VERSION}<span>Ver atualizações</span></a>`;
    const bottomNavigation = document.querySelector('.bottom-nav');
    if (bottomNavigation) bottomNavigation.before(footer);
    else document.body.appendChild(footer);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountVersionFooter, { once: true });
  else mountVersionFooter();
})();
