(function registerManualScoreSheetCore(root, factory) {
  const template = root?.BabaManualTemplate
    || (typeof module === 'object' && module.exports ? require('./baba-manual-template.js') : null);
  const core = factory(template);
  if (typeof module === 'object' && module.exports) module.exports = core;
  if (root) root.BabaManualCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, (template) => {
  if (!template) throw new Error('Template da sumula manual nao carregado.');

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const round = (value, digits = 4) => Number(Number(value || 0).toFixed(digits));
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function scaleRegion(region, width, height) {
    return {
      ...region,
      x: Math.round((region.x / template.sourceWidth) * width),
      y: Math.round((region.y / template.sourceHeight) * height),
      width: Math.max(1, Math.round((region.width / template.sourceWidth) * width)),
      height: Math.max(1, Math.round((region.height / template.sourceHeight) * height)),
    };
  }

  function pixelLuminance(data, index) {
    return (0.2126 * data[index]) + (0.7152 * data[index + 1]) + (0.0722 * data[index + 2]);
  }

  function percentile(values, ratio) {
    if (!values.length) return 255;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)))];
  }

  function analyzeBox(imageData, sourceBox) {
    const box = scaleRegion(sourceBox, imageData.width, imageData.height);
    const margin = Math.max(2, Math.round(Math.min(box.width, box.height) * 0.2));
    const left = clamp(box.x + margin, 0, imageData.width - 1);
    const top = clamp(box.y + margin, 0, imageData.height - 1);
    const right = clamp(box.x + box.width - margin, left + 1, imageData.width);
    const bottom = clamp(box.y + box.height - margin, top + 1, imageData.height);
    const luminances = [];

    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        luminances.push(pixelLuminance(imageData.data, ((y * imageData.width) + x) * 4));
      }
    }

    const background = percentile(luminances, 0.82);
    const darkThreshold = clamp(background - 42, 72, 188);
    const rowHits = new Array(Math.max(1, bottom - top)).fill(0);
    const columnHits = new Array(Math.max(1, right - left)).fill(0);
    let darkPixels = 0;

    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        const luminance = pixelLuminance(imageData.data, ((y * imageData.width) + x) * 4);
        if (luminance >= darkThreshold) continue;
        darkPixels += 1;
        rowHits[y - top] += 1;
        columnHits[x - left] += 1;
      }
    }

    const totalPixels = Math.max(1, (right - left) * (bottom - top));
    const darkRatio = darkPixels / totalPixels;
    const rowCoverage = rowHits.filter((count) => count >= Math.max(2, (right - left) * 0.12)).length / rowHits.length;
    const columnCoverage = columnHits.filter((count) => count >= Math.max(2, (bottom - top) * 0.12)).length / columnHits.length;
    const strokeMark = darkRatio >= 0.055 && rowCoverage >= 0.48 && columnCoverage >= 0.48;
    const marked = darkRatio >= 0.12 || strokeMark;
    const confidence = marked
      ? clamp(0.55 + (darkRatio * 1.6) + (Math.min(rowCoverage, columnCoverage) * 0.25), 0, 0.99)
      : clamp(0.95 - (darkRatio * 2.4), 0.5, 0.99);

    return {
      marked,
      confidence: round(confidence),
      darkRatio: round(darkRatio),
      rowCoverage: round(rowCoverage),
      columnCoverage: round(columnCoverage),
      region: box,
    };
  }

  function borderEvidence(imageData, sourceBox) {
    const box = scaleRegion(sourceBox, imageData.width, imageData.height);
    const band = Math.max(1, Math.round(Math.min(box.width, box.height) * 0.13));
    let dark = 0;
    let total = 0;
    for (let y = box.y; y < box.y + box.height; y += 1) {
      if (y < 0 || y >= imageData.height) continue;
      for (let x = box.x; x < box.x + box.width; x += 1) {
        if (x < 0 || x >= imageData.width) continue;
        const onBorder = x < box.x + band || x >= box.x + box.width - band
          || y < box.y + band || y >= box.y + box.height - band;
        if (!onBorder) continue;
        total += 1;
        if (pixelLuminance(imageData.data, ((y * imageData.width) + x) * 4) < 205) dark += 1;
      }
    }
    return total ? dark / total : 0;
  }

  function analyzeTemplate(imageData) {
    const sampledBoxes = template.allBoxes.filter((_, index) => index % 5 === 0);
    const evidences = sampledBoxes.map((box) => borderEvidence(imageData, box));
    const detected = evidences.filter((score) => score >= 0.16).length;
    const matchRatio = detected / Math.max(1, evidences.length);
    return {
      matched: matchRatio >= 0.58,
      confidence: round(clamp((matchRatio - 0.35) / 0.65, 0, 0.99)),
      boxesDetected: detected,
      boxesSampled: evidences.length,
      matchRatio: round(matchRatio),
    };
  }

  function analyzeMarks(imageData) {
    const templateMatch = analyzeTemplate(imageData);
    const teams = template.teams.map((team) => {
      const resultDetails = Object.fromEntries(Object.entries(team.results).map(([field, boxes]) => {
        const details = boxes.map((box) => analyzeBox(imageData, box));
        return [field, details];
      }));
      const jogadores = team.jogadores.map((player) => {
        const goalDetails = player.goals.map((box) => analyzeBox(imageData, box));
        return {
          slot: player.slot,
          tipo: player.tipo,
          gols: goalDetails.filter((box) => box.marked).length,
          goalDetails,
          nameRegion: scaleRegion(player.nameRegion, imageData.width, imageData.height),
        };
      });
      return {
        id: team.id,
        nome: team.nome,
        cor: team.cor,
        accent: team.accent,
        vitorias: resultDetails.vitorias.filter((box) => box.marked).length,
        empates: resultDetails.empates.filter((box) => box.marked).length,
        derrotas: resultDetails.derrotas.filter((box) => box.marked).length,
        resultDetails,
        jogadores,
      };
    });
    return { templateMatch, teams };
  }

  function cleanOcrText(value) {
    return String(value || '')
      .replace(/[|_[\]{}<>]/g, ' ')
      .replace(/\b(JOGADOR|GOLEIRO|NOME|GOLS?|MARCADO(?:S)?)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[\s:;,.\-]+|[\s:;,.\-]+$/g, '')
      .trim();
  }

  function normalizeName(value) {
    return cleanOcrText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function levenshtein(left, right) {
    const a = String(left || '');
    const b = String(right || '');
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      let diagonal = previous[0];
      previous[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const old = previous[j];
        previous[j] = Math.min(
          previous[j] + 1,
          previous[j - 1] + 1,
          diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
        diagonal = old;
      }
    }
    return previous[b.length];
  }

  function nameSimilarity(left, right) {
    const a = normalizeName(left);
    const b = normalizeName(right);
    if (!a || !b) return 0;
    if (a === b) return 1;
    const maxLength = Math.max(a.length, b.length);
    return maxLength ? 1 - (levenshtein(a, b) / maxLength) : 0;
  }

  function findPlayerMatches(name, players, limit = 3) {
    const normalized = normalizeName(name);
    if (!normalized) return [];
    return (players || [])
      .map((player) => ({
        id: player.id,
        nome: player.nome,
        tipo: player.tipo || 'jogador',
        score: nameSimilarity(normalized, player.nome),
      }))
      .filter((candidate) => candidate.score >= 0.56)
      .sort((a, b) => b.score - a.score || String(a.nome).localeCompare(String(b.nome), 'pt-BR'))
      .slice(0, limit)
      .map((candidate) => ({ ...candidate, score: round(candidate.score) }));
  }

  function parseBrazilianDate(value) {
    const text = String(value || '').trim();
    const isoMatch = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    const brMatch = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
    let year;
    let month;
    let day;
    if (isoMatch) [, year, month, day] = isoMatch;
    else if (brMatch) {
      [, day, month, year] = brMatch;
      if (String(year).length === 2) year = `20${year}`;
    } else return '';
    const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(`${iso}T12:00:00`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? '' : iso;
  }

  function createDraft(markAnalysis, ocr = {}, file = {}) {
    const ocrTeams = Array.isArray(ocr.teams) ? ocr.teams : [];
    return {
      schema: 'baba-manual-score-sheet',
      schemaVersion: 1,
      templateId: template.id,
      templateVersion: template.version,
      source: {
        fileName: file.name || '',
        fileType: file.type || '',
        fileSize: Number(file.size || 0),
      },
      dataISO: parseBrazilianDate(ocr.data) || new Date().toISOString().slice(0, 10),
      local: cleanOcrText(ocr.local),
      responsavel: cleanOcrText(ocr.responsavel),
      ocrEngine: ocr.engine || 'manual-review',
      ocrConfidence: Number(ocr.confidence || 0),
      templateConfidence: Number(markAnalysis.templateMatch?.confidence || 0),
      teams: markAnalysis.teams.map((team, teamIndex) => ({
        nome: team.nome,
        cor: team.cor,
        accent: team.accent,
        vitorias: team.vitorias,
        empates: team.empates,
        derrotas: team.derrotas,
        jogadores: team.jogadores.map((player, playerIndex) => {
          const ocrPlayer = ocrTeams[teamIndex]?.jogadores?.[playerIndex] || {};
          return {
            slot: player.slot,
            tipo: player.tipo,
            nome: cleanOcrText(ocrPlayer.nome),
            gols: player.gols,
            confidence: Number(ocrPlayer.confidence || 0),
            playerId: ocrPlayer.playerId || '',
          };
        }),
      })),
    };
  }

  function validateDraft(draft) {
    const errors = [];
    const warnings = [];
    if (!parseBrazilianDate(draft?.dataISO)) errors.push({ path: 'dataISO', message: 'Informe uma data valida.' });
    if (!Array.isArray(draft?.teams) || draft.teams.length !== 4) {
      errors.push({ path: 'teams', message: 'A sumula precisa conter os quatro times.' });
    }
    (draft?.teams || []).forEach((team, teamIndex) => {
      if (!String(team.nome || '').trim()) errors.push({ path: `teams.${teamIndex}.nome`, message: `Nome do Time ${teamIndex + 1} nao identificado.` });
      ['vitorias', 'empates', 'derrotas'].forEach((field) => {
        const value = Number(team[field]);
        if (!Number.isInteger(value) || value < 0 || value > 8) {
          errors.push({ path: `teams.${teamIndex}.${field}`, message: `${field} do Time ${teamIndex + 1} fora do intervalo de 0 a 8.` });
        }
      });
      (team.jogadores || []).forEach((player, playerIndex) => {
        if (!String(player.nome || '').trim()) {
          errors.push({
            path: `teams.${teamIndex}.jogadores.${playerIndex}.nome`,
            message: `${player.slot || `Jogador ${playerIndex + 1}`} do Time ${teamIndex + 1} nao identificado.`,
          });
        } else if (Number(player.confidence || 0) < 0.8) {
          warnings.push({
            path: `teams.${teamIndex}.jogadores.${playerIndex}.nome`,
            message: `Confirme o nome "${player.nome}" (confianca abaixo de 80%).`,
          });
        }
        const goals = Number(player.gols);
        if (!Number.isInteger(goals) || goals < 0 || goals > 10) {
          errors.push({ path: `teams.${teamIndex}.jogadores.${playerIndex}.gols`, message: 'Quantidade de gols fora do intervalo de 0 a 10.' });
        }
      });
    });
    const totalWins = (draft?.teams || []).reduce((sum, team) => sum + Number(team.vitorias || 0), 0);
    const totalLosses = (draft?.teams || []).reduce((sum, team) => sum + Number(team.derrotas || 0), 0);
    const totalDraws = (draft?.teams || []).reduce((sum, team) => sum + Number(team.empates || 0), 0);
    if (totalWins !== totalLosses) {
      warnings.push({ path: 'teams', message: `O total de vitorias (${totalWins}) difere do total de derrotas (${totalLosses}).` });
    }
    if (totalDraws % 2 !== 0) warnings.push({ path: 'teams', message: 'O total de empates deveria ser par, pois cada empate envolve dois times.' });
    if (Number(draft?.templateConfidence || 0) < 0.55) {
      warnings.push({ path: 'template', message: 'O enquadramento do PDF oficial ficou com baixa confianca. Revise os campos destacados.' });
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  function canonicalDraft(draft) {
    return {
      schema: 'baba-manual-score-sheet',
      version: 1,
      templateId: draft.templateId || template.id,
      dataISO: draft.dataISO,
      teams: (draft.teams || []).map((team) => ({
        nome: String(team.nome || '').trim(),
        cor: String(team.cor || '').trim(),
        vitorias: Number(team.vitorias || 0),
        empates: Number(team.empates || 0),
        derrotas: Number(team.derrotas || 0),
        jogadores: (team.jogadores || []).map((player) => ({
          nome: String(player.nome || '').trim(),
          tipo: player.tipo === 'goleiro' ? 'goleiro' : 'jogador',
          gols: Number(player.gols || 0),
        })),
      })),
    };
  }

  function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  async function sha256(value) {
    const input = String(value || '');
    if (globalThis.crypto?.subtle) {
      const bytes = new TextEncoder().encode(input);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
      return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    if (typeof require === 'function') return require('node:crypto').createHash('sha256').update(input).digest('hex');
    throw new Error('SHA-256 indisponivel neste ambiente.');
  }

  async function fingerprintDraft(draft) {
    return sha256(stableStringify(canonicalDraft(draft)));
  }

  function solveLinearSystem(matrix, vector) {
    const size = vector.length;
    const rows = matrix.map((row, index) => [...row, vector[index]]);
    for (let column = 0; column < size; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < size; row += 1) {
        if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row;
      }
      if (Math.abs(rows[pivot][column]) < 1e-10) throw new Error('Nao foi possivel calcular a perspectiva da folha.');
      [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
      const divisor = rows[column][column];
      for (let cell = column; cell <= size; cell += 1) rows[column][cell] /= divisor;
      for (let row = 0; row < size; row += 1) {
        if (row === column) continue;
        const factor = rows[row][column];
        for (let cell = column; cell <= size; cell += 1) rows[row][cell] -= factor * rows[column][cell];
      }
    }
    return rows.map((row) => row[size]);
  }

  function perspectiveTransform(destination, source) {
    const matrix = [];
    const vector = [];
    for (let index = 0; index < 4; index += 1) {
      const { x: u, y: v } = destination[index];
      const { x, y } = source[index];
      matrix.push([u, v, 1, 0, 0, 0, -x * u, -x * v]);
      vector.push(x);
      matrix.push([0, 0, 0, u, v, 1, -y * u, -y * v]);
      vector.push(y);
    }
    return solveLinearSystem(matrix, vector);
  }

  function warpPerspective(imageData, quad, destinationWidth, destinationHeight) {
    const destination = [
      { x: 0, y: 0 },
      { x: destinationWidth - 1, y: 0 },
      { x: destinationWidth - 1, y: destinationHeight - 1 },
      { x: 0, y: destinationHeight - 1 },
    ];
    const transform = perspectiveTransform(destination, quad);
    const output = new Uint8ClampedArray(destinationWidth * destinationHeight * 4);
    const source = imageData.data;
    for (let y = 0; y < destinationHeight; y += 1) {
      for (let x = 0; x < destinationWidth; x += 1) {
        const denominator = (transform[6] * x) + (transform[7] * y) + 1;
        const sourceX = clamp(Math.round(((transform[0] * x) + (transform[1] * y) + transform[2]) / denominator), 0, imageData.width - 1);
        const sourceY = clamp(Math.round(((transform[3] * x) + (transform[4] * y) + transform[5]) / denominator), 0, imageData.height - 1);
        const sourceIndex = ((sourceY * imageData.width) + sourceX) * 4;
        const targetIndex = ((y * destinationWidth) + x) * 4;
        output[targetIndex] = source[sourceIndex];
        output[targetIndex + 1] = source[sourceIndex + 1];
        output[targetIndex + 2] = source[sourceIndex + 2];
        output[targetIndex + 3] = 255;
      }
    }
    return { data: output, width: destinationWidth, height: destinationHeight };
  }

  function detectPaperQuad(imageData) {
    const { width, height, data } = imageData;
    const ratio = width / Math.max(1, height);
    const a4Ratio = template.canonicalWidth / template.canonicalHeight;
    if (Math.abs(ratio - a4Ratio) < 0.045) {
      return {
        confidence: 0.98,
        quad: [
          { x: 0, y: 0 },
          { x: width - 1, y: 0 },
          { x: width - 1, y: height - 1 },
          { x: 0, y: height - 1 },
        ],
      };
    }

    const step = Math.max(3, Math.round(Math.max(width, height) / 520));
    const samples = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) samples.push(pixelLuminance(data, ((y * width) + x) * 4));
    }
    const lightThreshold = clamp(percentile(samples, 0.62) - 8, 150, 232);
    const rows = [];
    for (let y = 0; y < height; y += step) {
      let first = -1;
      let last = -1;
      let lightCount = 0;
      for (let x = 0; x < width; x += step) {
        const index = ((y * width) + x) * 4;
        const maximum = Math.max(data[index], data[index + 1], data[index + 2]);
        const minimum = Math.min(data[index], data[index + 1], data[index + 2]);
        const saturation = maximum ? (maximum - minimum) / maximum : 0;
        if (pixelLuminance(data, index) < lightThreshold || saturation > 0.38) continue;
        if (first < 0) first = x;
        last = x;
        lightCount += 1;
      }
      const sampledWidth = Math.ceil(width / step);
      if (lightCount / sampledWidth >= 0.48 && last > first) rows.push({ y, first, last, coverage: lightCount / sampledWidth });
    }
    if (rows.length < Math.max(8, height / step * 0.25)) {
      return {
        confidence: 0.25,
        quad: [
          { x: 0, y: 0 },
          { x: width - 1, y: 0 },
          { x: width - 1, y: height - 1 },
          { x: 0, y: height - 1 },
        ],
      };
    }
    const median = (values) => percentile(values, 0.5);
    const topRows = rows.slice(0, Math.max(3, Math.round(rows.length * 0.12)));
    const bottomRows = rows.slice(-Math.max(3, Math.round(rows.length * 0.12)));
    let top = median(topRows.map((row) => row.y));
    let bottom = median(bottomRows.map((row) => row.y));
    const estimatedHeight = Math.max(1, bottom - top);
    top = clamp(top - estimatedHeight * 0.13, 0, height - 1);
    bottom = clamp(bottom + estimatedHeight * 0.04, top + 1, height - 1);
    const topLeft = clamp(median(topRows.map((row) => row.first)) - width * 0.02, 0, width - 1);
    const topRight = clamp(median(topRows.map((row) => row.last)) + width * 0.02, 0, width - 1);
    const bottomLeft = clamp(median(bottomRows.map((row) => row.first)) - width * 0.02, 0, width - 1);
    const bottomRight = clamp(median(bottomRows.map((row) => row.last)) + width * 0.02, 0, width - 1);
    const pageArea = (((topRight - topLeft) + (bottomRight - bottomLeft)) / 2) * (bottom - top);
    return {
      confidence: round(clamp(pageArea / (width * height), 0.3, 0.94)),
      quad: [
        { x: topLeft, y: top },
        { x: topRight, y: top },
        { x: bottomRight, y: bottom },
        { x: bottomLeft, y: bottom },
      ],
    };
  }

  function enhanceImageData(imageData) {
    const output = new Uint8ClampedArray(imageData.data.length);
    const samples = [];
    for (let index = 0; index < imageData.data.length; index += 64) samples.push(pixelLuminance(imageData.data, index));
    const low = percentile(samples, 0.04);
    const high = Math.max(low + 30, percentile(samples, 0.96));
    const range = high - low;
    for (let index = 0; index < imageData.data.length; index += 4) {
      const luminance = pixelLuminance(imageData.data, index);
      const normalized = clamp(((luminance - low) / range) * 255, 0, 255);
      const contrasted = normalized < 150
        ? clamp((normalized - 128) * 1.12 + 128, 0, 255)
        : clamp((normalized - 128) * 1.04 + 128, 0, 255);
      output[index] = contrasted;
      output[index + 1] = contrasted;
      output[index + 2] = contrasted;
      output[index + 3] = 255;
    }
    return { data: output, width: imageData.width, height: imageData.height };
  }

  return Object.freeze({
    template,
    scaleRegion,
    analyzeBox,
    analyzeTemplate,
    analyzeMarks,
    cleanOcrText,
    normalizeName,
    nameSimilarity,
    findPlayerMatches,
    parseBrazilianDate,
    createDraft,
    validateDraft,
    canonicalDraft,
    stableStringify,
    sha256,
    fingerprintDraft,
    perspectiveTransform,
    warpPerspective,
    detectPaperQuad,
    enhanceImageData,
  });
});
