(() => {
  'use strict';

  const COLORS = {
    navy: [10, 35, 64],
    navySoft: [28, 58, 88],
    emerald: [13, 148, 113],
    emeraldDark: [8, 104, 82],
    emeraldSoft: [232, 248, 242],
    text: [20, 37, 58],
    muted: [91, 107, 128],
    line: [218, 227, 236],
    surface: [247, 250, 252],
    white: [255, 255, 255],
    gold: [201, 146, 28],
    goldSoft: [255, 248, 224],
    danger: [190, 45, 68],
  };

  const TEAM_COLORS = {
    1: [213, 52, 69],
    2: [20, 133, 82],
    3: [184, 164, 111],
    4: [17, 24, 39],
    5: [37, 99, 168],
  };

  const PAGE = {
    marginX: 14,
    top: 18,
    bottom: 282,
    footerY: 289,
  };

  function setColor(doc, method, color) {
    doc[method](color[0], color[1], color[2]);
  }

  function cleanText(value) {
    if (value === null || value === undefined || value === '') return '-';
    if (value?.type === 'match' && Array.isArray(value.teams)) {
      return value.teams.map((team) => team?.name || 'Time').join(' x ');
    }
    if (value?.type === 'roster' && Array.isArray(value.players)) {
      return value.players.map((player) => player?.text || 'Jogador').join(', ');
    }
    if (typeof value === 'object' && value.text !== undefined) return cleanText(value.text);
    return String(value).replace(/\s+/g, ' ').trim() || '-';
  }

  const STAR_COLORS = Object.freeze({
    gray: [100, 116, 139],
    bronze: [180, 108, 38],
    silver: [113, 128, 150],
    gold: [211, 153, 25],
    diamond: [10, 166, 190],
    none: [203, 213, 225],
  });

  function drawPdfStar(doc, centerX, centerY, radius, tone = 'gray', style = 'fill') {
    const points = [];
    for (let index = 0; index < 10; index += 1) {
      const angle = (-Math.PI / 2) + (index * Math.PI / 5);
      const pointRadius = index % 2 ? radius * .43 : radius;
      points.push([centerX + (Math.cos(angle) * pointRadius), centerY + (Math.sin(angle) * pointRadius)]);
    }
    const deltas = points.slice(1).map((point, index) => [point[0] - points[index][0], point[1] - points[index][1]]);
    deltas.push([points[0][0] - points[points.length - 1][0], points[0][1] - points[points.length - 1][1]]);
    const color = STAR_COLORS[tone] || STAR_COLORS.gray;
    if (style === 'empty') {
      setColor(doc, 'setDrawColor', STAR_COLORS.none);
      doc.setLineWidth(.22);
      doc.lines(deltas, points[0][0], points[0][1], [1, 1], 'S', true);
      return;
    }
    setColor(doc, 'setFillColor', color);
    doc.lines(deltas, points[0][0], points[0][1], [1, 1], 'F', true);
  }

  function drawPdfHalfStar(doc, centerX, centerY, radius, tone) {
    if (doc.saveGraphicsState && doc.restoreGraphicsState && doc.clip) {
      doc.saveGraphicsState();
      doc.rect(centerX - radius - .1, centerY - radius - .1, radius + .1, (radius * 2) + .2);
      doc.clip();
      doc.discardPath?.();
      drawPdfStar(doc, centerX, centerY, radius, tone, 'fill');
      doc.restoreGraphicsState();
      return;
    }
    drawPdfStar(doc, centerX, centerY, radius * .72, tone, 'fill');
  }

  function drawPdfRating(doc, value, x, centerY, radius, tone) {
    const rating = Math.max(0, Math.min(5, Number(value) || 0));
    const step = radius * 2.05;
    for (let index = 0; index < 5; index += 1) {
      const centerX = x + (index * step);
      drawPdfStar(doc, centerX, centerY, radius, tone, 'empty');
      if (rating >= index + 1) drawPdfStar(doc, centerX, centerY, radius, tone, 'fill');
      else if (rating >= index + .5) drawPdfHalfStar(doc, centerX, centerY, radius, tone);
    }
  }

  function drawPdfPlayerCell(doc, value, x, y, width, rowHeight, { padding = 2.5 } = {}) {
    const name = cleanText(value);
    const stars = Math.max(0, Math.min(5, Number(value?.stars || 0)));
    const radius = Math.max(.55, Math.min(1.05, rowHeight * .16));
    const starStep = radius * 2.05;
    const starWidth = (5 * starStep) + .5;
    const availableTextWidth = Math.max(5, width - (padding * 2) - starWidth);
    const text = doc.splitTextToSize(name, availableTextWidth)[0] || '-';
    const baseline = y + (rowHeight * .67);
    setColor(doc, 'setTextColor', COLORS.text);
    doc.text(text, x + padding, baseline);
    let starX = x + padding + Math.min(doc.getTextWidth(text), availableTextWidth) + radius + .7;
    drawPdfRating(doc, stars, starX, y + (rowHeight * .5), radius, value?.starTone);
  }

  function drawPdfRosterCell(doc, value, x, y, width, rowHeight) {
    const players = Array.isArray(value?.players) ? value.players : [];
    const right = x + width - 2;
    let cursor = x + 2;
    const commaWidth = doc.getTextWidth(', ');
    players.some((player, index) => {
      const stars = Math.max(0, Math.min(5, Number(player?.stars || 0)));
      const radius = Math.max(.48, Math.min(.85, rowHeight * .14));
      const starStep = radius * 2;
      const name = cleanText(player);
      const remaining = right - cursor - (5 * starStep) - (index < players.length - 1 ? commaWidth : 0);
      if (remaining < 4) return true;
      const text = doc.splitTextToSize(name, remaining)[0] || '-';
      doc.text(text, cursor, y + (rowHeight * .67));
      cursor += doc.getTextWidth(text) + radius + .4;
      drawPdfRating(doc, stars, cursor, y + (rowHeight * .5), radius, player?.starTone);
      cursor += 5 * starStep;
      if (index < players.length - 1 && cursor + commaWidth <= right) {
        setColor(doc, 'setTextColor', COLORS.text);
        doc.text(', ', cursor, y + (rowHeight * .67));
        cursor += commaWidth;
      }
      return cursor >= right;
    });
  }

  function cleanFileName(value) {
    const base = String(value || 'relatorio.pdf')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
  }

  function teamNumberFromRow(row) {
    const value = Number(row?.teamNumber || row?._teamNumber || 0);
    return Number.isInteger(value) && TEAM_COLORS[value] ? value : 0;
  }

  function isNumericColumn(label) {
    return /^(#|pos|pts|gp|gc|sg|v|e|d|gols?|jogos?|linha|goleiros?|babas?|tit\.?|m[eé]dia|aprov\.?|%)$/i.test(cleanText(label));
  }

  function columnWeight(label) {
    const text = cleanText(label).toLowerCase();
    if (/jogadores|descri|observa/.test(text)) return 2.4;
    if (/partida/.test(text)) return 1.8;
    if (/jogador|goleiro|categoria|resultado|motivo/.test(text)) return 1.45;
    if (/time|tipo/.test(text)) return 1.15;
    return 1;
  }

  function calculateColumnWidths(columns, totalWidth) {
    const widths = new Array(columns.length).fill(null);
    const flexible = [];
    let fixedWidth = 0;

    columns.forEach((column, index) => {
      const label = cleanText(column).toLowerCase();
      let width = null;
      if (index === 0 && /^(#|pos|jogo)$/.test(label)) width = 14;
      else if (/^(valor|saldo)$/.test(label)) width = 28;
      else if (/^(aprov\.?|aproveitamento)$/.test(label)) width = 22;
      else if (isNumericColumn(label)) width = 17;

      if (width !== null) {
        widths[index] = width;
        fixedWidth += width;
      } else {
        flexible.push(index);
      }
    });

    if (!flexible.length) {
      const even = totalWidth / Math.max(1, columns.length);
      return widths.map(() => even);
    }

    const available = Math.max(32 * flexible.length, totalWidth - fixedWidth);
    const weightTotal = flexible.reduce((sum, index) => sum + columnWeight(columns[index]), 0);
    flexible.forEach((index) => {
      widths[index] = available * (columnWeight(columns[index]) / weightTotal);
    });

    const currentTotal = widths.reduce((sum, width) => sum + width, 0);
    const scale = totalWidth / currentTotal;
    return widths.map((width) => width * scale);
  }

  function drawPaymentIcon(doc, x, y, kind = 'check') {
    const disabled = kind === 'disabled';
    setColor(doc, 'setFillColor', disabled ? [254, 242, 242] : COLORS.emeraldSoft);
    setColor(doc, 'setDrawColor', disabled ? [254, 202, 202] : [177, 224, 207]);
    doc.setLineWidth(.35);
    doc.roundedRect(x, y, 8.5, 8.5, 2, 2, 'FD');
    setColor(doc, 'setDrawColor', disabled ? [220, 38, 38] : (kind === 'pending' ? COLORS.emeraldDark : COLORS.emerald));
    doc.setLineWidth(.55);
    doc.circle(x + 4.25, y + 4.25, 2.25, 'S');
    if (disabled) {
      doc.line(x + 2.8, y + 2.8, x + 5.7, y + 5.7);
      doc.line(x + 5.7, y + 2.8, x + 2.8, y + 5.7);
    } else if (kind === 'pending') {
      doc.line(x + 4.25, y + 2.7, x + 4.25, y + 4.8);
      doc.circle(x + 4.25, y + 6.05, .18, 'F');
    } else if (kind === 'wallet') {
      doc.roundedRect(x + 2.05, y + 2.45, 4.4, 3.5, .6, .6, 'S');
      doc.line(x + 2.7, y + 3.15, x + 5.7, y + 3.15);
    } else {
      doc.line(x + 2.75, y + 4.2, x + 3.85, y + 5.25);
      doc.line(x + 3.85, y + 5.25, x + 5.85, y + 3.1);
    }
  }

  function drawPaymentClassificationBadges(doc, value, x, y, width, rowHeight) {
    const labels = cleanText(value).split(/\s*[·|-]\s*/).map((label) => label.trim().toUpperCase()).filter(Boolean);
    const palette = {
      NOVATO: { fill: [30, 94, 178], text: [255, 255, 255], stroke: [21, 72, 142] },
      CONVIDADO: { fill: [126, 74, 18], text: [255, 251, 235], stroke: [102, 58, 12] },
      GOLEIRO: { fill: [5, 120, 87], text: [255, 255, 255], stroke: [4, 92, 68] },
      JOGADOR: { fill: [232, 239, 246], text: [44, 62, 86], stroke: [190, 204, 220] },
    };
    doc.setFont('helvetica', 'bold');
    let fontSize = rowHeight < 5 ? 3.8 : 4.25;
    doc.setFontSize(fontSize);
    let widths = labels.map((label) => doc.getTextWidth(label) + 2.2);
    const gaps = Math.max(0, labels.length - 1) * .7;
    const available = Math.max(8, width - 5);
    const total = widths.reduce((sum, item) => sum + item, 0) + gaps;
    if (total > available) {
      const scale = Math.max(.68, available / total);
      fontSize *= scale;
      doc.setFontSize(fontSize);
      widths = labels.map((label) => doc.getTextWidth(label) + 1.6);
    }
    let cursor = x + 2.5;
    const badgeHeight = Math.min(3.5, Math.max(2.8, rowHeight - 1.1));
    labels.forEach((label, index) => {
      const colors = palette[label] || palette.JOGADOR;
      const badgeWidth = Math.min(widths[index], Math.max(3, (x + width - 2) - cursor));
      if (badgeWidth <= 3) return;
      setColor(doc, 'setFillColor', colors.fill);
      setColor(doc, 'setDrawColor', colors.stroke);
      doc.setLineWidth(.2);
      doc.roundedRect(cursor, y + ((rowHeight - badgeHeight) / 2), badgeWidth, badgeHeight, 1, 1, 'FD');
      setColor(doc, 'setTextColor', colors.text);
      doc.text(label, cursor + (badgeWidth / 2), y + (rowHeight * .65), { align: 'center' });
      cursor += badgeWidth + .7;
    });
  }

  function createPaymentReport(report, JsPdf) {
    const doc = new JsPdf({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    const headerY = 10;

    doc.setProperties({
      title: cleanText(report.title),
      subject: cleanText(report.subtitle),
      author: cleanText(report.brand || report.eyebrow || 'Baba Psyzon'),
      creator: 'Psyzon PDF',
      keywords: 'pagamentos, baba, relatorio',
    });
    doc.setLanguage?.('pt-BR');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    setColor(doc, 'setTextColor', COLORS.emerald);
    doc.text(cleanText(report.eyebrow || report.brand || 'Baba Psyzon').toUpperCase(), margin, headerY);
    doc.setFontSize(16);
    setColor(doc, 'setTextColor', COLORS.text);
    doc.text(cleanText(report.title), margin, headerY + 8);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    setColor(doc, 'setTextColor', COLORS.muted);
    doc.text(
      `${cleanText(report.subtitle)} - gerado em ${cleanText(report.generatedAt || new Date().toLocaleString('pt-BR'))}`,
      margin,
      headerY + 14,
    );
    setColor(doc, 'setDrawColor', [210, 225, 238]);
    doc.setLineWidth(.45);
    doc.line(margin, headerY + 17, pageWidth - margin, headerY + 17);

    const summaryY = headerY + 20;
    const summaryGap = 2.6;
    const cardWidth = (contentWidth - (summaryGap * 3)) / 4;
    const cardHeight = 15.5;
    (report.summary || []).slice(0, 4).forEach((item, index) => {
      const x = margin + (index * (cardWidth + summaryGap));
      setColor(doc, 'setFillColor', [251, 253, 255]);
      setColor(doc, 'setDrawColor', [211, 224, 238]);
      doc.setLineWidth(.5);
      doc.roundedRect(x, summaryY, cardWidth, cardHeight, 2.5, 2.5, 'FD');
      const label = cleanText(item?.[0]);
      drawPaymentIcon(
        doc,
        x + 3.2,
        summaryY + 3.5,
        /pend/i.test(label) ? 'pending' : (/esper/i.test(label) ? 'wallet' : 'check'),
      );
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      setColor(doc, 'setTextColor', [91, 109, 137]);
      doc.text(label.toUpperCase(), x + 14.2, summaryY + 6.1);
      doc.setFontSize(9.8);
      setColor(doc, 'setTextColor', [25, 38, 60]);
      doc.text(cleanText(item?.[1]), x + 14.2, summaryY + 11.7);
    });

    const sections = (report.sections || []).slice(0, 4);
    const sectionTop = summaryY + cardHeight + 2.4;
    const sectionGap = 2.6;
    const footerY = pageHeight - 10.5;
    const tableBottom = footerY - 4;
    const gridColumns = sections.length > 3 ? 2 : Math.max(1, sections.length);
    const gridRows = Math.ceil(sections.length / gridColumns);
    const sectionWidth = (contentWidth - (sectionGap * Math.max(0, gridColumns - 1))) / gridColumns;
    const sectionHeight = (tableBottom - sectionTop - (sectionGap * Math.max(0, gridRows - 1))) / Math.max(1, gridRows);

    sections.forEach((section, sectionIndex) => {
      const gridColumn = sectionIndex % gridColumns;
      const gridRow = Math.floor(sectionIndex / gridColumns);
      const x = margin + (gridColumn * (sectionWidth + sectionGap));
      const y = sectionTop + (gridRow * (sectionHeight + sectionGap));
      const sourceRows = Array.isArray(section.rows) ? section.rows : [];
      const headerHeight = 13.2;
      const columnHeight = 6;
      const availableRowsHeight = sectionHeight - headerHeight - columnHeight - .6;
      const maxRowSlots = Math.max(1, Math.floor(availableRowsHeight / 2.9));
      const configuredLimit = Math.max(1, Number(section.maxRows || sourceRows.length || 1));
      const isTruncated = sourceRows.length > Math.min(configuredLimit, maxRowSlots);
      const visibleLimit = Math.max(1, Math.min(configuredLimit, maxRowSlots - (isTruncated ? 1 : 0)));
      const rows = sourceRows.slice(0, visibleLimit);
      const omittedRows = Math.max(0, sourceRows.length - rows.length);
      const occupiedSlots = Math.max(1, rows.length + (omittedRows ? 1 : 0));
      const rowHeight = rows.length
        ? Math.min(5.8, availableRowsHeight / occupiedSlots)
        : 8;

      setColor(doc, 'setFillColor', COLORS.white);
      setColor(doc, 'setDrawColor', [210, 225, 238]);
      doc.setLineWidth(.5);
      doc.roundedRect(x, y, sectionWidth, sectionHeight, 2.8, 2.8, 'FD');

      setColor(doc, 'setFillColor', [247, 250, 253]);
      doc.roundedRect(x + .3, y + .3, sectionWidth - .6, headerHeight, 2.5, 2.5, 'F');
      const sectionLabel = `${cleanText(section.icon)} ${cleanText(section.title)}`;
      drawPaymentIcon(
        doc,
        x + 3.2,
        y + 2.3,
        /desativ|user-x/i.test(sectionLabel)
          ? 'disabled'
          : (sectionIndex === 0 ? 'check' : (sectionIndex === 1 ? 'pending' : 'wallet')),
      );
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.6);
      setColor(doc, 'setTextColor', [26, 37, 57]);
      doc.text(doc.splitTextToSize(cleanText(section.title), sectionWidth - 17)[0] || '-', x + 13.5, y + 5.7);
      if (section.note) {
        doc.setFontSize(6.2);
        setColor(doc, 'setTextColor', [91, 109, 137]);
        doc.text(doc.splitTextToSize(cleanText(section.note), sectionWidth - 17)[0] || '', x + 13.5, y + 10.3);
      }

      const columns = Array.isArray(section.columns) ? section.columns.map(cleanText) : [];
      const widths = [9, sectionWidth * .43, sectionWidth * .28, sectionWidth * .22];
      const widthsTotal = widths.reduce((sum, width) => sum + width, 0);
      widths[1] += sectionWidth - widthsTotal;
      let currentY = y + headerHeight;
      setColor(doc, 'setFillColor', [235, 242, 249]);
      doc.rect(x + .3, currentY, sectionWidth - .6, columnHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      setColor(doc, 'setTextColor', [75, 96, 125]);
      let columnX = x;
      columns.forEach((column, columnIndex) => {
        const rightAligned = columnIndex === 3;
        doc.text(
          column.toUpperCase(),
          rightAligned ? columnX + widths[columnIndex] - 3 : columnX + 3,
          currentY + 4,
          { align: rightAligned ? 'right' : 'left' },
        );
        columnX += widths[columnIndex];
      });
      currentY += columnHeight;

      if (!rows.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        setColor(doc, 'setTextColor', COLORS.muted);
        doc.text(cleanText(section.empty || 'Nenhum registro.'), x + 4, currentY + 5.3);
      } else {
        rows.forEach((sourceRow, rowIndex) => {
          const row = Array.isArray(sourceRow) ? sourceRow : [];
          setColor(doc, 'setFillColor', rowIndex % 2 ? [249, 251, 253] : COLORS.white);
          doc.rect(x + .3, currentY, sectionWidth - .6, rowHeight, 'F');
          setColor(doc, 'setDrawColor', [222, 230, 239]);
          doc.setLineWidth(.2);
          doc.line(x + .3, currentY + rowHeight, x + sectionWidth - .3, currentY + rowHeight);
          let cellX = x;
          row.slice(0, 4).forEach((cell, cellIndex) => {
            const rightAligned = cellIndex === 3;
            doc.setFont('helvetica', cellIndex === 0 ? 'bold' : 'normal');
            doc.setFontSize(rowHeight < 5 ? 5.7 : 6.5);
            if (cell?.type === 'player') {
              drawPdfPlayerCell(doc, cell, cellX, currentY, widths[cellIndex], rowHeight, { padding: 3 });
              cellX += widths[cellIndex];
              return;
            }
            if (cellIndex === 2) {
              drawPaymentClassificationBadges(doc, cell, cellX, currentY, widths[cellIndex], rowHeight);
              cellX += widths[cellIndex];
              return;
            }
            setColor(doc, 'setTextColor', [20, 37, 58]);
            const value = doc.splitTextToSize(cleanText(cell), widths[cellIndex] - 5)[0] || '-';
            doc.text(
              value,
              rightAligned ? cellX + widths[cellIndex] - 3 : cellX + 3,
              currentY + (rowHeight * .67),
              { align: rightAligned ? 'right' : 'left' },
            );
            cellX += widths[cellIndex];
          });
          currentY += rowHeight;
        });
        if (omittedRows) {
          setColor(doc, 'setFillColor', [247, 250, 253]);
          doc.rect(x + .3, currentY, sectionWidth - .6, rowHeight, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          setColor(doc, 'setTextColor', [75, 96, 125]);
          doc.text(`+ ${omittedRows} jogador${omittedRows === 1 ? '' : 'es'} nao exibido${omittedRows === 1 ? '' : 's'}`, x + 3, currentY + (rowHeight * .67));
        }
      }
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    setColor(doc, 'setTextColor', [75, 96, 125]);
    doc.text(cleanText(report.brand || report.eyebrow || 'Baba Psyzon'), margin + .5, footerY);
    doc.text('Exportacao em PDF', pageWidth - margin - .5, footerY, { align: 'right' });
    return doc;
  }

  function createStandingsReport(report, JsPdf) {
    const doc = new JsPdf({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    doc.setProperties({
      title: cleanText(report.title),
      subject: cleanText(report.subtitle),
      author: cleanText(report.brand || 'Baba Psyzon'),
      creator: 'Psyzon PDF',
      keywords: 'tabela, times, baba, classificacao',
    });
    doc.setLanguage?.('pt-BR');

    setColor(doc, 'setFillColor', [3, 19, 29]);
    doc.roundedRect(margin, 8, contentWidth, 35, 3.5, 3.5, 'F');
    setColor(doc, 'setDrawColor', [184, 164, 111]);
    doc.setLineWidth(.8);
    doc.line(margin + 1, 9, margin + contentWidth - 1, 9);
    setColor(doc, 'setFillColor', [18, 74, 75]);
    doc.circle(pageWidth - margin - 20, 25, 22, 'F');
    setColor(doc, 'setDrawColor', [205, 230, 88]);
    doc.setLineWidth(.8);
    doc.roundedRect(pageWidth - margin - 47, 14, 31, 21, 2.5, 2.5, 'S');
    doc.line(pageWidth - margin - 47, 21, pageWidth - margin - 16, 21);
    doc.line(pageWidth - margin - 37, 14, pageWidth - margin - 37, 35);
    doc.line(pageWidth - margin - 27, 14, pageWidth - margin - 27, 35);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    setColor(doc, 'setTextColor', [205, 230, 88]);
    doc.text(cleanText(report.eyebrow || report.brand || 'Baba Psyzon').toUpperCase(), margin + 6, 17);
    doc.setFontSize(18);
    setColor(doc, 'setTextColor', COLORS.white);
    doc.text(cleanText(report.title), margin + 6, 28);
    doc.setFontSize(7.5);
    setColor(doc, 'setTextColor', [218, 226, 232]);
    doc.text(`${cleanText(report.subtitle)} - gerado em ${cleanText(report.generatedAt)}`, margin + 6, 35);

    const summaries = (report.summary || []).slice(0, 5);
    const summaryGap = 2.2;
    const summaryTop = 46;
    const summaryHeight = 14;
    const summaryWidth = (contentWidth - (summaryGap * Math.max(0, summaries.length - 1))) / Math.max(1, summaries.length);
    summaries.forEach((item, index) => {
      const x = margin + (index * (summaryWidth + summaryGap));
      setColor(doc, 'setFillColor', [248, 251, 253]);
      setColor(doc, 'setDrawColor', [210, 225, 238]);
      doc.setLineWidth(.4);
      doc.roundedRect(x, summaryTop, summaryWidth, summaryHeight, 2.3, 2.3, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.7);
      setColor(doc, 'setTextColor', COLORS.muted);
      doc.text(cleanText(item?.[0]).toUpperCase(), x + 4, summaryTop + 5.2);
      doc.setFontSize(8.5);
      setColor(doc, 'setTextColor', COLORS.text);
      doc.text(doc.splitTextToSize(cleanText(item?.[1]), summaryWidth - 8)[0] || '-', x + 4, summaryTop + 10.5);
    });

    const sections = (report.sections || []).slice(0, 4);
    const panelGap = 3;
    const panelTop = 63;
    const footerY = pageHeight - 7;
    const panelWidth = (contentWidth - panelGap) / 2;
    const panelHeight = ((footerY - panelTop - 4) - panelGap) / 2;

    sections.forEach((section, index) => {
      const column = index % 2;
      const rowIndex = Math.floor(index / 2);
      const x = margin + (column * (panelWidth + panelGap));
      const y = panelTop + (rowIndex * (panelHeight + panelGap));
      const columns = Array.isArray(section.columns) ? section.columns.map(cleanText) : [];
      const sourceRows = Array.isArray(section.rows) ? section.rows : [];
      const rows = sourceRows.slice(0, Math.min(Number(section.maxRows || 12), 12));
      const widths = calculateColumnWidths(columns, panelWidth - 1);

      setColor(doc, 'setFillColor', COLORS.white);
      setColor(doc, 'setDrawColor', [210, 225, 238]);
      doc.setLineWidth(.45);
      doc.roundedRect(x, y, panelWidth, panelHeight, 2.8, 2.8, 'FD');
      setColor(doc, 'setFillColor', [7, 45, 57]);
      doc.roundedRect(x + .2, y + .2, panelWidth - .4, 13, 2.6, 2.6, 'F');
      setColor(doc, 'setFillColor', index === 0 ? [205, 230, 88] : [184, 164, 111]);
      doc.roundedRect(x + 3, y + 2.3, 5.5, 5.5, 1.4, 1.4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      setColor(doc, 'setTextColor', COLORS.white);
      doc.text(doc.splitTextToSize(cleanText(section.title), panelWidth - 15)[0] || '-', x + 11, y + 5.5);
      if (section.note) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.4);
        setColor(doc, 'setTextColor', [188, 217, 220]);
        doc.text(doc.splitTextToSize(cleanText(section.note), panelWidth - 15)[0] || '', x + 11, y + 10);
      }

      const tableY = y + 14;
      const headerHeight = 5.5;
      setColor(doc, 'setFillColor', [235, 242, 249]);
      doc.rect(x + .4, tableY, panelWidth - .8, headerHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(columns.length >= 7 ? 4.5 : 5.1);
      setColor(doc, 'setTextColor', [75, 96, 125]);
      let cellX = x + .5;
      columns.forEach((columnLabel, columnIndex) => {
        const numeric = isNumericColumn(columnLabel);
        doc.text(
          cleanText(columnLabel).toUpperCase(),
          numeric ? cellX + widths[columnIndex] - 1.5 : cellX + 1.5,
          tableY + 3.7,
          { align: numeric ? 'right' : 'left' },
        );
        cellX += widths[columnIndex];
      });

      if (!rows.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.3);
        setColor(doc, 'setTextColor', COLORS.muted);
        doc.text(cleanText(section.empty || 'Nenhum registro.'), x + 4, tableY + 12);
        return;
      }

      const availableHeight = panelHeight - 10 - headerHeight - 1;
      const rowHeight = Math.min(6.1, Math.max(4.35, availableHeight / rows.length));
      let currentY = tableY + headerHeight;
      rows.forEach((sourceRow, sourceIndex) => {
        const row = Array.isArray(sourceRow) ? sourceRow : [];
        setColor(doc, 'setFillColor', sourceIndex % 2 ? [249, 251, 253] : COLORS.white);
        doc.rect(x + .4, currentY, panelWidth - .8, rowHeight, 'F');
        const teamNumber = teamNumberFromRow(sourceRow);
        if (teamNumber) {
          setColor(doc, 'setFillColor', TEAM_COLORS[teamNumber]);
          doc.rect(x + .4, currentY, 1.2, rowHeight, 'F');
        }
        cellX = x + .5;
        row.slice(0, columns.length).forEach((cell, cellIndex) => {
          const numeric = isNumericColumn(columns[cellIndex]);
          const maxWidth = Math.max(3, widths[cellIndex] - 3);
          doc.setFont('helvetica', cellIndex === 0 ? 'bold' : 'normal');
          doc.setFontSize(columns.length >= 7 ? 4.7 : (rowHeight < 5 ? 4.8 : 5.4));
          if (cell?.type === 'player') {
            drawPdfPlayerCell(doc, cell, cellX, currentY, widths[cellIndex], rowHeight, { padding: 1.5 });
            cellX += widths[cellIndex];
            return;
          }
          if (cell?.type === 'roster') {
            setColor(doc, 'setTextColor', COLORS.text);
            drawPdfRosterCell(doc, cell, cellX, currentY, widths[cellIndex], rowHeight);
            cellX += widths[cellIndex];
            return;
          }
          const value = doc.splitTextToSize(cleanText(cell), maxWidth)[0] || '-';
          setColor(doc, 'setTextColor', COLORS.text);
          doc.text(
            value,
            numeric ? cellX + widths[cellIndex] - 1.5 : cellX + 1.8,
            currentY + (rowHeight * .66),
            { align: numeric ? 'right' : 'left' },
          );
          cellX += widths[cellIndex];
        });
        currentY += rowHeight;
      });
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    setColor(doc, 'setTextColor', COLORS.muted);
    doc.text(cleanText(report.brand || 'Baba Psyzon'), margin, footerY);
    doc.text('Tabela completa em uma página', pageWidth - margin, footerY, { align: 'right' });
    return doc;
  }

  function createReport(report) {
    const JsPdf = window.jspdf?.jsPDF;
    if (!JsPdf) throw new Error('O gerador de PDF não foi carregado. Atualize a página e tente novamente.');
    if (!report || !Array.isArray(report.sections)) throw new Error('Os dados do relatório estão incompletos.');
    if (report.type === 'payments') return createPaymentReport(report, JsPdf);
    if (report.type === 'standings') return createStandingsReport(report, JsPdf);

    const doc = new JsPdf({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    let cursorY = margin;

    doc.setProperties({
      title: cleanText(report.title),
      subject: cleanText(report.subtitle),
      author: cleanText(report.brand || report.eyebrow || 'Psyzon'),
      creator: 'Psyzon PDF',
      keywords: 'relatório, psyzon, dados',
    });
    doc.setLanguage?.('pt-BR');

    const drawHero = () => {
      const heroHeight = 35;
      setColor(doc, 'setFillColor', [3, 19, 29]);
      doc.roundedRect(margin, cursorY, contentWidth, heroHeight, 3.5, 3.5, 'F');
      setColor(doc, 'setDrawColor', [78, 99, 106]);
      doc.setLineWidth(.65);
      doc.roundedRect(margin, cursorY, contentWidth, heroHeight, 3.5, 3.5, 'S');

      setColor(doc, 'setFillColor', [17, 35, 40]);
      setColor(doc, 'setDrawColor', [74, 91, 92]);
      doc.roundedRect(margin + 5, cursorY + 4.5, 9, 9, 2.2, 2.2, 'FD');
      setColor(doc, 'setDrawColor', [222, 193, 25]);
      doc.setLineWidth(.65);
      doc.roundedRect(margin + 7.6, cursorY + 7.1, 4.4, 3.7, .6, .6, 'S');
      doc.line(margin + 8.2, cursorY + 7.8, margin + 11.25, cursorY + 7.8);

      setColor(doc, 'setTextColor', [20, 200, 160]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(cleanText(report.eyebrow || report.brand || 'Relatório').toUpperCase(), margin + 16, cursorY + 8);

      setColor(doc, 'setTextColor', COLORS.white);
      doc.setFontSize(16);
      doc.text(cleanText(report.title), margin + 16, cursorY + 16.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(cleanText(report.subtitle), 145).slice(0, 2), margin + 16, cursorY + 23);
      doc.setFontSize(7);
      setColor(doc, 'setTextColor', [190, 210, 226]);
      doc.text(`Atualizado em ${cleanText(report.generatedAt || new Date().toLocaleString('pt-BR'))}`, margin + 16, cursorY + 31);
      cursorY += heroHeight + 6;
    };

    const drawSummary = () => {
      const items = Array.isArray(report.summary) ? report.summary : [];
      if (!items.length) return;
      const columns = Math.min(6, Math.max(1, items.length));
      const gap = 3;
      const cardWidth = (contentWidth - (gap * (columns - 1))) / columns;
      const cardHeight = 16;

      items.forEach((item, index) => {
        if (index > 0 && index % columns === 0) cursorY += cardHeight + gap;
        const column = index % columns;
        const x = margin + (column * (cardWidth + gap));
        setColor(doc, 'setFillColor', COLORS.surface);
        setColor(doc, 'setDrawColor', COLORS.line);
        doc.setLineWidth(.25);
        doc.roundedRect(x, cursorY, cardWidth, cardHeight, 2.5, 2.5, 'FD');
        setColor(doc, 'setFillColor', index === 1 ? COLORS.emerald : COLORS.navySoft);
        doc.roundedRect(x, cursorY, 2.2, cardHeight, 1.1, 1.1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.7);
        setColor(doc, 'setTextColor', COLORS.muted);
        doc.text(cleanText(item?.[0]).toUpperCase(), x + 5, cursorY + 5.5);

        doc.setFontSize(9.5);
        setColor(doc, 'setTextColor', COLORS.text);
        const valueLines = doc.splitTextToSize(cleanText(item?.[1]), cardWidth - 8).slice(0, 2);
        doc.text(valueLines, x + 5, cursorY + 11.5);
      });
      cursorY += cardHeight + 5;
    };

    const drawSectionHeader = (section, index, width, x, y) => {
      const title = cleanText(section.title);
      setColor(doc, 'setFillColor', COLORS.emeraldSoft);
      setColor(doc, 'setDrawColor', [197, 230, 218]);
      doc.setLineWidth(.25);
      doc.roundedRect(x, y, width, 12, 2.2, 2.2, 'FD');
      setColor(doc, 'setFillColor', COLORS.emerald);
      doc.roundedRect(x + 2.5, y + 1.8, 5.4, 5.4, 1.4, 1.4, 'F');
      setColor(doc, 'setTextColor', COLORS.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(String(index), x + 5.2, y + 5.5, { align: 'center' });
      setColor(doc, 'setTextColor', COLORS.text);
      doc.setFontSize(width < 95 ? 7.2 : 9);
      doc.text(doc.splitTextToSize(title, width - 14)[0] || '-', x + 10, y + 5.1);
      if (section.note) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(width < 95 ? 5.2 : 6.2);
        setColor(doc, 'setTextColor', COLORS.muted);
        doc.text(doc.splitTextToSize(cleanText(section.note), width - 14)[0] || '', x + 10, y + 9.6);
      }
    };

    const drawTableHeader = (columns, widths, width, x, y) => {
      setColor(doc, 'setFillColor', COLORS.navy);
      doc.roundedRect(x, y, width, 7, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(columns.length >= 7 ? 4.2 : (width < 95 ? 4.8 : 6.2));
      setColor(doc, 'setTextColor', COLORS.white);
      let curX = x;
      columns.forEach((column, i) => {
        const alignRight = isNumericColumn(column) || /valor|saldo/i.test(cleanText(column));
        doc.text(
          cleanText(column).toUpperCase(),
          alignRight ? curX + widths[i] - 2 : curX + 2,
          y + 4.6,
          { align: alignRight ? 'right' : 'left' },
        );
        curX += widths[i];
      });
    };

    drawHero();
    drawSummary();

    const sections = report.sections.slice(0, 6);
    if (!sections.length) return doc;

    const availableHeight = pageHeight - margin - 5 - cursorY;
    const numSections = sections.length;
    const gapX = 4;
    const cols = numSections === 1 ? 1 : (numSections <= 3 ? numSections : (numSections <= 4 ? 2 : 3));
    const sectionWidth = (contentWidth - (gapX * (cols - 1))) / cols;
    const sectionRows = Math.ceil(numSections / cols);
    const sectionHeight = (availableHeight - (4 * (sectionRows - 1))) / sectionRows;
    
    sections.forEach((section, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + (col * (sectionWidth + gapX));
      const y = cursorY + (row * (sectionHeight + 4));
      let currentY = y;

      drawSectionHeader(section, i + 1, sectionWidth, x, currentY);
      currentY += 13;

      const columns = Array.isArray(section.columns) ? section.columns.map(cleanText) : [];
      const sourceRows = Array.isArray(section.rows) ? section.rows : [];
      const requestedLimit = Number(section.maxRows || sourceRows.length);
      const rows = sourceRows.slice(0, requestedLimit > 0 ? requestedLimit : sourceRows.length);
      const widths = calculateColumnWidths(columns, sectionWidth);
      
      drawTableHeader(columns, widths, sectionWidth, x, currentY);
      currentY += 8;

      if (!columns.length || !rows.length) {
        setColor(doc, 'setFillColor', COLORS.surface);
        setColor(doc, 'setDrawColor', COLORS.line);
        doc.roundedRect(x, currentY, sectionWidth, Math.max(12, sectionHeight - 15), 1.8, 1.8, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        setColor(doc, 'setTextColor', COLORS.muted);
        doc.text(cleanText(section.empty || 'Nenhum registro.'), x + 3, currentY + 7);
        return;
      }

      const availableRowsHeight = Math.max(4, sectionHeight - 21);
      const minRowHeight = 3.25;
      const maxRows = Math.max(1, Math.floor(availableRowsHeight / (minRowHeight + 0.35)));
      const visibleRows = rows.slice(0, maxRows);
      const omitted = sourceRows.length - visibleRows.length;
      const omissionSpace = omitted > 0 ? 3.5 : 0;
      const rowHeight = Math.min(6.5, Math.max(minRowHeight, (availableRowsHeight - omissionSpace) / visibleRows.length - 0.35));

      visibleRows.forEach((sourceRow, rowIndex) => {
        const isTop = Boolean(section.highlightTop && rowIndex === 0);
        setColor(doc, 'setFillColor', isTop ? COLORS.goldSoft : (rowIndex % 2 ? COLORS.surface : COLORS.white));
        setColor(doc, 'setDrawColor', COLORS.line);
        doc.setLineWidth(.2);
        doc.roundedRect(x, currentY, sectionWidth, rowHeight, 1.3, 1.3, 'FD');

        const teamNumber = teamNumberFromRow(sourceRow);
        if (teamNumber) {
          setColor(doc, 'setFillColor', TEAM_COLORS[teamNumber]);
          doc.roundedRect(x, currentY, 1.6, rowHeight, .8, .8, 'F');
        } else if (isTop) {
          setColor(doc, 'setFillColor', COLORS.gold);
          doc.roundedRect(x, currentY, 1.6, rowHeight, .8, .8, 'F');
        }

        let curX = x;
        sourceRow.forEach((cell, cellIndex) => {
          const label = columns[cellIndex];
          const alignRight = isNumericColumn(label) || /valor|saldo/i.test(cleanText(label));
          const text = cleanText(cell);
          doc.setFont('helvetica', cellIndex === 0 || (section.highlightTop && rowIndex === 0) ? 'bold' : 'normal');
          doc.setFontSize(Math.min(columns.length >= 6 ? 5.8 : 6.4, Math.max(4, rowHeight * 1.05)));
          if (cell?.type === 'player') {
            drawPdfPlayerCell(doc, cell, curX, currentY, widths[cellIndex], rowHeight);
            curX += widths[cellIndex];
            return;
          }
          if (cell?.type === 'roster') {
            setColor(doc, 'setTextColor', COLORS.text);
            drawPdfRosterCell(doc, cell, curX, currentY, widths[cellIndex], rowHeight);
            curX += widths[cellIndex];
            return;
          }
          setColor(doc, 'setTextColor', /^-\s*(R\$)?/i.test(text) ? COLORS.danger : COLORS.text);
          doc.text(
            doc.splitTextToSize(text, Math.max(7, widths[cellIndex] - 4)).slice(0, 1),
            alignRight ? curX + widths[cellIndex] - 2 : curX + 2.5,
            currentY + (rowHeight * .68),
            { align: alignRight ? 'right' : 'left' },
          );
          curX += widths[cellIndex];
        });
        currentY += rowHeight + 0.35;
      });

      if (omitted > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(5.2);
        setColor(doc, 'setTextColor', COLORS.muted);
        doc.text(`+ ${omitted} linha${omitted > 1 ? 's' : ''} omitida${omitted > 1 ? 's' : ''}`, x + (sectionWidth / 2), currentY + 3, { align: 'center' });
      }
    });

    setColor(doc, 'setDrawColor', COLORS.line);
    doc.setLineWidth(.25);
    doc.line(margin, pageHeight - margin - 4, pageWidth - margin, pageHeight - margin - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setColor(doc, 'setTextColor', COLORS.muted);
    doc.text(cleanText(report.footer || report.brand || report.eyebrow || 'Psyzon'), margin, pageHeight - margin);
    doc.text('Relatorio completo em uma pagina', pageWidth - margin, pageHeight - margin, { align: 'right' });

    return doc;
  }

  async function exportReport(report) {
    await document.fonts?.ready?.catch?.(() => {});
    const doc = createReport(report);
    doc.save(cleanFileName(report.fileName || report.title));
    return { pages: doc.getNumberOfPages(), fileName: cleanFileName(report.fileName || report.title) };
  }

  window.PsyzonPdf = Object.freeze({ createReport, exportReport });
})();
