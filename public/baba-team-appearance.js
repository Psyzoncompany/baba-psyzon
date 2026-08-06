(function initializeTeamAppearance(window, document) {
  'use strict';

  const api = window.BabaTeamTheme;
  const grid = document.querySelector('[data-team-theme-grid]');
  const status = document.querySelector('[data-team-theme-status]');
  if (!api || !grid) return;

  const crestOptions = api.getDefaultTeams().map((team) => ({
    label: team.club,
    value: team.logo,
  }));

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function announce(message) {
    if (!status) return;
    status.textContent = message;
    window.clearTimeout(announce.timeout);
    announce.timeout = window.setTimeout(() => { status.textContent = ''; }, 2600);
  }

  function logoOptions(team) {
    const isCustom = team.logo.startsWith('data:image/');
    return [
      ...crestOptions.map((option) => `<option value="${escapeHTML(option.value)}"${option.value === team.logo ? ' selected' : ''}>${escapeHTML(option.label)}</option>`),
      ...(isCustom ? ['<option value="custom" selected>Escudo personalizado</option>'] : []),
    ].join('');
  }

  function render() {
    grid.innerHTML = api.getTeams().map((team) => `
      <article class="team-theme-card" data-team-number="${team.number}" data-team-editor="${team.number}">
        <header class="team-theme-card__header">
          <span class="team-theme-card__crest"><img src="${escapeHTML(team.logo)}" alt="Escudo do ${escapeHTML(team.name)}"></span>
          <span><strong>${escapeHTML(team.name)}</strong><small>${escapeHTML(team.club)}</small></span>
        </header>
        <div class="team-theme-card__fields">
          <label class="team-theme-color">
            <span>Cor do time</span>
            <span class="team-theme-color__control">
              <input type="color" value="${escapeHTML(team.color)}" data-team-color="${team.number}" aria-label="Cor do ${escapeHTML(team.name)}">
              <output>${escapeHTML(team.color)}</output>
            </span>
          </label>
          <label>
            <span>Escudo</span>
            <select data-team-logo="${team.number}" aria-label="Escudo do ${escapeHTML(team.name)}">${logoOptions(team)}</select>
          </label>
        </div>
        <div class="team-theme-card__actions">
          <label class="team-theme-upload">
            <input type="file" accept="image/png,image/jpeg,image/webp" data-team-upload="${team.number}">
            <span>Enviar escudo</span>
          </label>
          <button class="secondary" type="button" data-team-reset="${team.number}">Restaurar</button>
        </div>
      </article>
    `).join('');
  }

  async function decodeImage(file) {
    if (typeof window.createImageBitmap === 'function') return window.createImageBitmap(file);
    const url = URL.createObjectURL(file);
    try {
      return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('A imagem selecionada não pôde ser aberta.'));
        image.src = url;
      });
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }

  async function optimizeImage(file) {
    if (!file?.type?.startsWith('image/')) throw new Error('Selecione uma imagem PNG, JPG ou WebP.');
    if (file.size > 5 * 1024 * 1024) throw new Error('O escudo deve ter no máximo 5 MB.');
    const bitmap = await decodeImage(file);
    const size = Math.min(256, Math.max(bitmap.width, bitmap.height));
    const scale = Math.min(size / bitmap.width, size / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, size, size);
    context.drawImage(bitmap, Math.round((size - width) / 2), Math.round((size - height) / 2), width, height);
    bitmap.close?.();
    return canvas.toDataURL('image/webp', .88);
  }

  grid.addEventListener('input', (event) => {
    const input = event.target.closest('[data-team-color]');
    if (!input) return;
    const number = Number(input.dataset.teamColor);
    document.documentElement.style.setProperty(`--team-${number}-custom-color`, input.value);
    input.closest('.team-theme-color')?.querySelector('output')?.replaceChildren(input.value.toUpperCase());
  });

  grid.addEventListener('change', async (event) => {
    const colorInput = event.target.closest('[data-team-color]');
    if (colorInput) {
      api.setTeam(Number(colorInput.dataset.teamColor), { color: colorInput.value });
      announce('Cor do time atualizada.');
      return;
    }

    const logoSelect = event.target.closest('[data-team-logo]');
    if (logoSelect && logoSelect.value !== 'custom') {
      api.setTeam(Number(logoSelect.dataset.teamLogo), { logo: logoSelect.value });
      render();
      announce('Escudo atualizado.');
      return;
    }

    const upload = event.target.closest('[data-team-upload]');
    if (!upload?.files?.[0]) return;
    try {
      const logo = await optimizeImage(upload.files[0]);
      api.setTeam(Number(upload.dataset.teamUpload), { logo });
      render();
      announce('Escudo personalizado salvo.');
    } catch (error) {
      announce(error.message || 'Não foi possível processar o escudo.');
    }
  });

  grid.addEventListener('click', (event) => {
    const reset = event.target.closest('[data-team-reset]');
    if (!reset) return;
    api.resetTeam(Number(reset.dataset.teamReset));
    render();
    announce('Time restaurado.');
  });

  document.querySelector('[data-team-reset-all]')?.addEventListener('click', () => {
    api.resetAll();
    render();
    announce('Todos os times foram restaurados.');
  });

  render();
})(window, document);
