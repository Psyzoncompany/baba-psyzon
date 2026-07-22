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
    3: [51, 65, 85],
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
    if (typeof value === 'object' && value.text !== undefined) return cleanText(value.text);
    return String(value).replace(/\s+/g, ' ').trim() || '-';
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

  function createReport(report) {
    const JsPdf = window.jspdf?.jsPDF;
    if (!JsPdf) throw new Error('O gerador de PDF não foi carregado. Atualize a página e tente novamente.');
    if (!report || !Array.isArray(report.sections)) throw new Error('Os dados do relatório estão incompletos.');

    const doc = new JsPdf({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (PAGE.marginX * 2);
    let cursorY = PAGE.top;

    doc.setProperties({
      title: cleanText(report.title),
      subject: cleanText(report.subtitle),
      author: cleanText(report.brand || report.eyebrow || 'Psyzon'),
      creator: 'Psyzon PDF',
      keywords: 'relatório, psyzon, dados',
    });
    doc.setLanguage?.('pt-BR');

    const drawContinuationHeader = () => {
      setColor(doc, 'setFillColor', COLORS.navy);
      doc.rect(0, 0, pageWidth, 11, 'F');
      setColor(doc, 'setFillColor', COLORS.emerald);
      doc.rect(0, 0, pageWidth, 1.3, 'F');
      setColor(doc, 'setTextColor', COLORS.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(cleanText(report.brand || report.eyebrow || 'Psyzon'), PAGE.marginX, 7.2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(cleanText(report.title), pageWidth - PAGE.marginX, 7.2, { align: 'right' });
      cursorY = 17;
    };

    const addPage = () => {
      doc.addPage();
      drawContinuationHeader();
    };

    const ensureSpace = (height) => {
      if (cursorY + height <= PAGE.bottom) return false;
      addPage();
      return true;
    };

    const drawHero = () => {
      setColor(doc, 'setFillColor', COLORS.navy);
      doc.rect(0, 0, pageWidth, 45, 'F');
      setColor(doc, 'setFillColor', COLORS.emerald);
      doc.rect(0, 0, pageWidth, 2.5, 'F');
      doc.circle(pageWidth - 17, 18, 20, 'F');
      setColor(doc, 'setDrawColor', COLORS.white);
      doc.setLineWidth(.55);
      doc.circle(24, 20, 8, 'S');
      doc.circle(24, 20, 5.1, 'S');
      doc.line(20.3, 20, 27.7, 20);
      doc.line(24, 16.3, 24, 23.7);

      setColor(doc, 'setTextColor', COLORS.emerald);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(cleanText(report.eyebrow || report.brand || 'Relatório'), 38, 12.5);

      setColor(doc, 'setTextColor', COLORS.white);
      doc.setFontSize(18);
      const titleLines = doc.splitTextToSize(cleanText(report.title), 140).slice(0, 2);
      doc.text(titleLines, 38, 21.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const titleOffset = titleLines.length > 1 ? 5 : 0;
      doc.text(doc.splitTextToSize(cleanText(report.subtitle), 145).slice(0, 2), 38, 29 + titleOffset);
      doc.setFontSize(7);
      setColor(doc, 'setTextColor', [190, 210, 226]);
      doc.text(`Atualizado em ${cleanText(report.generatedAt || new Date().toLocaleString('pt-BR'))}`, 38, 40);
      cursorY = 51;
    };

    const drawSummary = () => {
      const items = Array.isArray(report.summary) ? report.summary : [];
      if (!items.length) return;
      const columns = Math.min(4, Math.max(1, items.length));
      const gap = 3;
      const cardWidth = (contentWidth - (gap * (columns - 1))) / columns;
      const cardHeight = 18;

      items.forEach((item, index) => {
        if (index > 0 && index % columns === 0) cursorY += cardHeight + gap;
        const column = index % columns;
        const x = PAGE.marginX + (column * (cardWidth + gap));
        setColor(doc, 'setFillColor', COLORS.surface);
        setColor(doc, 'setDrawColor', COLORS.line);
        doc.setLineWidth(.25);
        doc.roundedRect(x, cursorY, cardWidth, cardHeight, 2.5, 2.5, 'FD');
        setColor(doc, 'setFillColor', index === 1 ? COLORS.emerald : COLORS.navySoft);
        doc.roundedRect(x, cursorY, 2.2, cardHeight, 1.1, 1.1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.7);
        setColor(doc, 'setTextColor', COLORS.muted);
        doc.text(cleanText(item?.[0]).toUpperCase(), x + 6, cursorY + 6);

        doc.setFontSize(10.5);
        setColor(doc, 'setTextColor', COLORS.text);
        const valueLines = doc.splitTextToSize(cleanText(item?.[1]), cardWidth - 10).slice(0, 2);
        doc.text(valueLines, x + 6, cursorY + 12.4);
      });
      cursorY += cardHeight + 7;
    };

    const drawSectionHeader = (section, continuation = false) => {
      ensureSpace(16);
      const title = `${cleanText(section.title)}${continuation ? ' - continuação' : ''}`;
      setColor(doc, 'setFillColor', COLORS.emeraldSoft);
      setColor(doc, 'setDrawColor', [197, 230, 218]);
      doc.setLineWidth(.25);
      doc.roundedRect(PAGE.marginX, cursorY, contentWidth, 11, 2.2, 2.2, 'FD');
      setColor(doc, 'setFillColor', COLORS.emerald);
      doc.roundedRect(PAGE.marginX + 3, cursorY + 2.2, 6.5, 6.5, 1.7, 1.7, 'F');
      setColor(doc, 'setTextColor', COLORS.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.3);
      doc.text(String(section.index || ''), PAGE.marginX + 6.25, cursorY + 6.6, { align: 'center' });
      setColor(doc, 'setTextColor', COLORS.text);
      doc.setFontSize(10);
      doc.text(title, PAGE.marginX + 12, cursorY + 7);
      if (section.note) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        setColor(doc, 'setTextColor', COLORS.muted);
        doc.text(cleanText(section.note), pageWidth - PAGE.marginX - 3, cursorY + 7, { align: 'right' });
      }
      cursorY += 14;
    };

    const drawTableHeader = (columns, widths) => {
      setColor(doc, 'setFillColor', COLORS.navy);
      doc.roundedRect(PAGE.marginX, cursorY, contentWidth, 8.5, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.6);
      setColor(doc, 'setTextColor', COLORS.white);
      let x = PAGE.marginX;
      columns.forEach((column, index) => {
        const alignRight = isNumericColumn(column) || /valor|saldo/i.test(cleanText(column));
        doc.text(
          cleanText(column).toUpperCase(),
          alignRight ? x + widths[index] - 2.5 : x + 2.5,
          cursorY + 5.5,
          { align: alignRight ? 'right' : 'left' },
        );
        x += widths[index];
      });
      cursorY += 9.5;
    };

    const drawEmpty = (message) => {
      ensureSpace(18);
      setColor(doc, 'setFillColor', COLORS.surface);
      setColor(doc, 'setDrawColor', COLORS.line);
      doc.roundedRect(PAGE.marginX, cursorY, contentWidth, 15, 2.5, 2.5, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setColor(doc, 'setTextColor', COLORS.muted);
      doc.text(cleanText(message || 'Nenhum dado disponível.'), PAGE.marginX + 5, cursorY + 9);
      cursorY += 19;
    };

    const drawSection = (section, sectionIndex) => {
      const normalized = { ...section, index: sectionIndex + 1 };
      const columns = Array.isArray(section.columns) ? section.columns.map(cleanText) : [];
      const rows = Array.isArray(section.rows) ? section.rows : [];
      drawSectionHeader(normalized);
      if (!columns.length || !rows.length) {
        drawEmpty(section.empty);
        return;
      }

      const widths = calculateColumnWidths(columns, contentWidth);
      drawTableHeader(columns, widths);
      rows.forEach((sourceRow, rowIndex) => {
        const row = Array.isArray(sourceRow) ? sourceRow : [];
        const lines = row.map((cell, cellIndex) => doc.splitTextToSize(cleanText(cell), Math.max(7, widths[cellIndex] - 5)));
        const maxLines = Math.max(1, ...lines.map((cellLines) => cellLines.length));
        const rowHeight = Math.max(8.2, (maxLines * 3.5) + 4.1);

        if (cursorY + rowHeight > PAGE.bottom) {
          addPage();
          drawSectionHeader(normalized, true);
          drawTableHeader(columns, widths);
        }

        const isTop = Boolean(section.highlightTop && rowIndex === 0);
        setColor(doc, 'setFillColor', isTop ? COLORS.goldSoft : (rowIndex % 2 ? COLORS.surface : COLORS.white));
        setColor(doc, 'setDrawColor', COLORS.line);
        doc.setLineWidth(.2);
        doc.roundedRect(PAGE.marginX, cursorY, contentWidth, rowHeight, 1.3, 1.3, 'FD');

        const teamNumber = teamNumberFromRow(sourceRow);
        if (teamNumber) {
          setColor(doc, 'setFillColor', TEAM_COLORS[teamNumber]);
          doc.roundedRect(PAGE.marginX, cursorY, 1.8, rowHeight, .9, .9, 'F');
        } else if (isTop) {
          setColor(doc, 'setFillColor', COLORS.gold);
          doc.roundedRect(PAGE.marginX, cursorY, 1.8, rowHeight, .9, .9, 'F');
        }

        let x = PAGE.marginX;
        row.forEach((cell, cellIndex) => {
          const label = columns[cellIndex];
          const alignRight = isNumericColumn(label) || /valor|saldo/i.test(cleanText(label));
          const text = cleanText(cell);
          doc.setFont('helvetica', cellIndex === 0 || (section.highlightTop && rowIndex === 0) ? 'bold' : 'normal');
          doc.setFontSize(columns.length >= 8 ? 7.1 : 7.7);
          setColor(doc, 'setTextColor', /^-\s*(R\$)?/i.test(text) ? COLORS.danger : COLORS.text);
          const textY = cursorY + 3.2 + Math.max(0, (rowHeight - (lines[cellIndex].length * 3.5)) / 2);
          doc.text(
            lines[cellIndex],
            alignRight ? x + widths[cellIndex] - 2.5 : x + 2.8,
            textY,
            { align: alignRight ? 'right' : 'left', lineHeightFactor: 1.15 },
          );
          x += widths[cellIndex];
        });
        cursorY += rowHeight + 1.2;
      });
      cursorY += 5;
    };

    drawHero();
    drawSummary();
    report.sections.forEach(drawSection);

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      setColor(doc, 'setDrawColor', COLORS.line);
      doc.setLineWidth(.25);
      doc.line(PAGE.marginX, 285, pageWidth - PAGE.marginX, 285);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      setColor(doc, 'setTextColor', COLORS.muted);
      doc.text(cleanText(report.footer || report.brand || report.eyebrow || 'Psyzon'), PAGE.marginX, PAGE.footerY);
      doc.text(`Página ${page} de ${totalPages}`, pageWidth - PAGE.marginX, PAGE.footerY, { align: 'right' });
    }

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
