/* ============================================
   Finanças Pessoais – Main Application JS
   ============================================ */

// ─── 1. Constants & Configuration ───────────────────────────
const STORAGE_KEYS = {
  transactions: 'pessoal_transactions',
  categories: 'pessoal_categories',
  settings: 'pessoal_settings',
  bills: 'pessoal_bills',
  billPayments: 'pessoal_bill_payments'
};

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'alimentacao', name: 'Alimentação', icon: 'fa-utensils', color: '#f97316' },
  { id: 'transporte', name: 'Transporte', icon: 'fa-car', color: '#3b82f6' },
  { id: 'lazer', name: 'Lazer', icon: 'fa-gamepad', color: '#8b5cf6' },
  { id: 'contas', name: 'Contas', icon: 'fa-file-invoice', color: '#eab308' },
  { id: 'compras', name: 'Compras', icon: 'fa-bag-shopping', color: '#ec4899' },
  { id: 'saude', name: 'Saúde', icon: 'fa-heart-pulse', color: '#14b8a6' },
  { id: 'educacao', name: 'Educação', icon: 'fa-graduation-cap', color: '#6366f1' },
  { id: 'moradia', name: 'Moradia', icon: 'fa-house', color: '#f43f5e' },
  { id: 'outros', name: 'Outros', icon: 'fa-ellipsis', color: '#6b7280' }
];

const DEFAULT_INCOME_CATEGORIES = [
  { id: 'salario', name: 'Salário', icon: 'fa-money-bill-wave', color: '#10b981' },
  { id: 'freelance', name: 'Freelance', icon: 'fa-laptop-code', color: '#06b6d4' },
  { id: 'investimentos', name: 'Investimentos', icon: 'fa-chart-line', color: '#8b5cf6' },
  { id: 'outros_receita', name: 'Outros', icon: 'fa-plus-circle', color: '#6b7280' }
];

const ITEMS_PER_PAGE = 15;
const PDF_PAGE_BOTTOM = 275;
const PDF_TOP_MARGIN = 20;
const PDF_DESC_MAX_LEN = 35;
const CHART_COLORS = {
  grid: 'rgba(148,163,184,0.08)',
  text: '#94a3b8',
  green: '#10b981',
  red: '#ef4444',
  cyan: '#06b6d4',
  purple: '#8b5cf6',
  yellow: '#eab308'
};

let chartInstances = {};
let currentSection = 'overview';
let currentPage = {};
let overviewPeriod = 'month'; // 'month' or 'year'
let notifications = [];

const MAX_NOTIFICATIONS = 50;
const MAX_BADGE_COUNT = 9;
const HIGH_SPENDING_THRESHOLD = 0.8;

// ─── 2. Data Management ────────────────────────────────────

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.transactions);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTransactions(data) {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : { alertThreshold: 500 };
  } catch { return { alertThreshold: 500 }; }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function loadCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.categories);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const defaults = {
    expense: [...DEFAULT_EXPENSE_CATEGORIES],
    income: [...DEFAULT_INCOME_CATEGORIES]
  };
  saveCategories(defaults);
  return defaults;
}

function saveCategories(cats) {
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(cats));
}

// ─── Bills Data Management ─────────────────────────────────

function loadBills() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.bills);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBills(data) {
  localStorage.setItem(STORAGE_KEYS.bills, JSON.stringify(data));
}

function loadBillPayments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.billPayments);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBillPayments(data) {
  localStorage.setItem(STORAGE_KEYS.billPayments, JSON.stringify(data));
}

function addBill(bill) {
  const all = loadBills();
  bill.id = uid();
  bill.createdAt = new Date().toISOString();
  all.push(bill);
  saveBills(all);
  return bill;
}

function updateBill(id, updates) {
  const all = loadBills();
  const idx = all.findIndex(b => b.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates };
  saveBills(all);
  return all[idx];
}

function deleteBill(id) {
  saveBills(loadBills().filter(b => b.id !== id));
  const payments = loadBillPayments().filter(p => p.billId !== id);
  saveBillPayments(payments);
}

function markBillPaid(billId, month) {
  const payments = loadBillPayments();
  const existing = payments.find(p => p.billId === billId && p.month === month);
  if (existing) return existing;
  const bill = loadBills().find(b => b.id === billId);
  const payment = {
    id: uid(),
    billId,
    month,
    paidDate: getToday(),
    paidAmount: bill ? bill.amount : 0
  };
  payments.push(payment);
  saveBillPayments(payments);
  return payment;
}

function unmarkBillPaid(billId, month) {
  const payments = loadBillPayments().filter(p => !(p.billId === billId && p.month === month));
  saveBillPayments(payments);
}

function isBillPaid(billId, month) {
  return loadBillPayments().some(p => p.billId === billId && p.month === month);
}

function getBillStatus(bill, month) {
  if (isBillPaid(bill.id, month)) return 'paid';
  const now = new Date();
  const [y, m] = month.split('-').map(Number);
  const dueDate = new Date(y, m - 1, bill.dueDay);
  if (now > dueDate) return 'overdue';
  const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 3) return 'due-soon';
  return 'pending';
}

function addTransaction(tx) {
  const all = loadTransactions();
  tx.id = uid();
  tx.createdAt = new Date().toISOString();
  all.push(tx);
  saveTransactions(all);
  checkSpendingAlert(tx);
  return tx;
}

function updateTransaction(id, updates) {
  const all = loadTransactions();
  const idx = all.findIndex(t => t.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates };
  saveTransactions(all);
  return all[idx];
}

function deleteTransaction(id) {
  const all = loadTransactions();
  saveTransactions(all.filter(t => t.id !== id));
}

function getCategory(type, catId) {
  const cats = loadCategories();
  const list = type === 'income' ? cats.income : cats.expense;
  return list.find(c => c.id === catId) || { id: catId, name: catId, icon: 'fa-circle', color: '#6b7280' };
}

function getAllCategories(type) {
  const cats = loadCategories();
  return type === 'income' ? cats.income : cats.expense;
}

// ─── 3. Utility Functions ──────────────────────────────────

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function formatDateISO(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function getToday() {
  return formatDateISO(new Date());
}

function getMonthRange(date) {
  const d = new Date(date || Date.now());
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: formatDateISO(start), end: formatDateISO(end) };
}

function getYearRange(date) {
  const d = new Date(date || Date.now());
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear(), 11, 31);
  return { start: formatDateISO(start), end: formatDateISO(end) };
}

function getMonthLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function calcTrend(current, previous) {
  if (previous === 0) return current > 0 ? { pct: 100, dir: 'up' } : { pct: 0, dir: 'up' };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return { pct: Math.abs(pct).toFixed(1), dir: pct >= 0 ? 'up' : 'down' };
}

function filterByDateRange(transactions, from, to) {
  return transactions.filter(t => {
    if (from && t.date < from) return false;
    if (to && t.date > to) return false;
    return true;
  });
}

function filterBySearch(transactions, query) {
  if (!query) return transactions;
  const q = query.toLowerCase();
  return transactions.filter(t =>
    t.description.toLowerCase().includes(q) ||
    getCategory(t.type, t.category).name.toLowerCase().includes(q)
  );
}

function sortByDate(transactions, asc = false) {
  return [...transactions].sort((a, b) => asc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
}

function paginate(arr, page, perPage = ITEMS_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(arr.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    items: arr.slice((safePage - 1) * perPage, safePage * perPage),
    page: safePage,
    totalPages,
    total: arr.length
  };
}

// ─── 4. Spending Alert ─────────────────────────────────────

function checkSpendingAlert(tx) {
  if (tx.type !== 'expense') return;
  const settings = loadSettings();
  if (tx.amount >= settings.alertThreshold) {
    showToast(`Gasto alto detectado: ${formatCurrency(tx.amount)} — ${escapeHtml(tx.description)}`, 'warning');
    addNotification(`Gasto alto: ${formatCurrency(tx.amount)} — ${tx.description}`, 'warning');
  }
}

// ─── 5. Navigation ─────────────────────────────────────────

function navigate(section) {
  currentSection = section;
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.classList.toggle('active', link.dataset.section === section);
  });
  renderSection(section);
  closeSidebar();
}

function renderSection(section) {
  const main = document.getElementById('mainContent');
  destroyAllCharts();
  switch (section) {
    case 'overview': renderOverview(main); break;
    case 'income': renderIncome(main); break;
    case 'expenses': renderExpenses(main); break;
    case 'bills': renderBills(main); break;
    case 'cashflow': renderCashFlow(main); break;
    case 'reports': renderReports(main); break;
    case 'settings': renderSettings(main); break;
    default: renderOverview(main);
  }
}

// ─── 6. Overview Section ───────────────────────────────────

function renderOverview(container) {
  const all = loadTransactions();
  const now = new Date();
  const isYear = overviewPeriod === 'year';

  const currentRange = isYear ? getYearRange(now) : getMonthRange(now);
  const prevDate = isYear
    ? new Date(now.getFullYear() - 1, 0, 1)
    : new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevRange = isYear ? getYearRange(prevDate) : getMonthRange(prevDate);

  const periodLabel = isYear ? 'do Ano' : 'do Mês';

  const currentIncome = all.filter(t => t.type === 'income' && t.date >= currentRange.start && t.date <= currentRange.end).reduce((s, t) => s + t.amount, 0);
  const currentExpense = all.filter(t => t.type === 'expense' && t.date >= currentRange.start && t.date <= currentRange.end).reduce((s, t) => s + t.amount, 0);
  const prevIncome = all.filter(t => t.type === 'income' && t.date >= prevRange.start && t.date <= prevRange.end).reduce((s, t) => s + t.amount, 0);
  const prevExpense = all.filter(t => t.type === 'expense' && t.date >= prevRange.start && t.date <= prevRange.end).reduce((s, t) => s + t.amount, 0);

  const totalIncome = all.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savings = currentIncome - currentExpense;
  const spendPct = currentIncome > 0 ? ((currentExpense / currentIncome) * 100).toFixed(1) : 0;

  const incTrend = calcTrend(currentIncome, prevIncome);
  const expTrend = calcTrend(currentExpense, prevExpense);
  const savTrend = calcTrend(savings, prevIncome - prevExpense);

  const periodTx = all.filter(t => t.date >= currentRange.start && t.date <= currentRange.end);
  const recentTx = sortByDate(periodTx).slice(0, isYear ? 10 : 5);

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Visão Geral</h2>
      <div class="period-filters">
        <button class="period-btn ${overviewPeriod === 'month' ? 'active' : ''}" data-period="month">Mês</button>
        <button class="period-btn ${overviewPeriod === 'year' ? 'active' : ''}" data-period="year">Ano</button>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon" style="background:rgba(6,182,212,0.12);color:#06b6d4">
          <i class="fa-solid fa-wallet"></i>
        </div>
        <div class="summary-info">
          <div class="summary-label">Saldo Atual</div>
          <div class="summary-value ${balance < 0 ? 'negative-balance' : ''}">${formatCurrency(balance)}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon" style="background:rgba(16,185,129,0.12);color:#10b981">
          <i class="fa-solid fa-arrow-trend-up"></i>
        </div>
        <div class="summary-info">
          <div class="summary-label">Receitas ${periodLabel}</div>
          <div class="summary-value amount-income">${formatCurrency(currentIncome)}</div>
          <div class="summary-trend ${incTrend.dir === 'up' ? 'trend-up' : 'trend-down'}">
            <i class="fa-solid fa-arrow-${incTrend.dir === 'up' ? 'up' : 'down'}"></i> ${incTrend.pct}%
          </div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">
          <i class="fa-solid fa-arrow-trend-down"></i>
        </div>
        <div class="summary-info">
          <div class="summary-label">Despesas ${periodLabel}</div>
          <div class="summary-value amount-expense">${formatCurrency(currentExpense)}</div>
          <div class="summary-trend ${expTrend.dir === 'up' ? 'trend-down' : 'trend-up'}">
            <i class="fa-solid fa-arrow-${expTrend.dir === 'up' ? 'up' : 'down'}"></i> ${expTrend.pct}%
          </div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon" style="background:rgba(139,92,246,0.12);color:#8b5cf6">
          <i class="fa-solid fa-piggy-bank"></i>
        </div>
        <div class="summary-info">
          <div class="summary-label">Economia ${periodLabel}</div>
          <div class="summary-value ${savings < 0 ? 'negative-balance' : ''}">${formatCurrency(savings)}</div>
          <div class="summary-trend ${savTrend.dir === 'up' ? 'trend-up' : 'trend-down'}">
            <i class="fa-solid fa-arrow-${savTrend.dir === 'up' ? 'up' : 'down'}"></i> ${savTrend.pct}%
          </div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon" style="background:rgba(234,179,8,0.12);color:#eab308">
          <i class="fa-solid fa-percent"></i>
        </div>
        <div class="summary-info">
          <div class="summary-label">% de Gastos</div>
          <div class="summary-value">${spendPct}%</div>
          <div class="progress-bar-container" style="margin-top:8px">
            <div class="progress-bar-fill" style="width:${Math.min(spendPct, 100)}%;background:${spendPct > 80 ? '#ef4444' : spendPct > 60 ? '#eab308' : '#10b981'}"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card">
        <div class="card-header"><h3 class="card-title">Receitas vs Despesas</h3></div>
        <div class="chart-wrapper"><canvas id="chartBar"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">Evolução do Saldo</h3></div>
        <div class="chart-wrapper"><canvas id="chartLine"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">Gastos por Categoria</h3></div>
        <div class="chart-wrapper"><canvas id="chartDoughnut"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Transações Recentes</h3>
        <button class="btn btn-outline btn-sm" onclick="navigate('cashflow')">Ver todas</button>
      </div>
      ${recentTx.length ? `
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
          <tbody>
            ${recentTx.map(tx => {
              const cat = getCategory(tx.type, tx.category);
              return `<tr>
                <td>${formatDate(tx.date)}</td>
                <td>${escapeHtml(tx.description)}</td>
                <td><span class="category-tag" style="background:${cat.color}22;color:${cat.color}"><i class="fa-solid ${cat.icon}"></i> ${escapeHtml(cat.name)}</span></td>
                <td class="${tx.type === 'income' ? 'amount-income' : 'amount-expense'}">${tx.type === 'income' ? '+' : '-'} ${formatCurrency(tx.amount)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>` : '<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>Nenhuma transação encontrada</p></div>'}
    </div>
  `;

  // Wire up period buttons
  container.querySelectorAll('.period-btn[data-period]').forEach(btn => {
    btn.addEventListener('click', () => {
      overviewPeriod = btn.dataset.period;
      destroyAllCharts();
      renderOverview(container);
    });
  });

  renderOverviewCharts(all, isYear);
}

// ─── 7. Chart Rendering ────────────────────────────────────

function destroyAllCharts() {
  Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch {} });
  chartInstances = {};
}

function chartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: CHART_COLORS.text, font: { family: "'Inter', sans-serif", size: 12 } } }
    },
    scales: {
      x: { ticks: { color: CHART_COLORS.text }, grid: { color: CHART_COLORS.grid } },
      y: { ticks: { color: CHART_COLORS.text, callback: v => formatCurrency(v) }, grid: { color: CHART_COLORS.grid } }
    }
  };
}

function renderOverviewCharts(all, isYear) {
  const months = [];
  const now = new Date();

  if (isYear) {
    // Show all 12 months of the current year
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 1);
      months.push({ date: d, label: d.toLocaleDateString('pt-BR', { month: 'short' }), range: getMonthRange(d) });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ date: d, label: d.toLocaleDateString('pt-BR', { month: 'short' }), range: getMonthRange(d) });
    }
  }

  const incomeData = months.map(m => all.filter(t => t.type === 'income' && t.date >= m.range.start && t.date <= m.range.end).reduce((s, t) => s + t.amount, 0));
  const expenseData = months.map(m => all.filter(t => t.type === 'expense' && t.date >= m.range.start && t.date <= m.range.end).reduce((s, t) => s + t.amount, 0));

  // Bar chart
  const barEl = document.getElementById('chartBar');
  if (barEl) {
    chartInstances.bar = new Chart(barEl, {
      type: 'bar',
      data: {
        labels: months.map(m => m.label),
        datasets: [
          { label: 'Receitas', data: incomeData, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
          { label: 'Despesas', data: expenseData, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 }
        ]
      },
      options: chartDefaults()
    });
  }

  // Line chart – balance evolution
  const lineMonths = [];
  if (isYear) {
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 1);
      lineMonths.push({ label: d.toLocaleDateString('pt-BR', { month: 'short' }), range: getMonthRange(d) });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      lineMonths.push({ label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), range: getMonthRange(d) });
    }
  }

  let runBal = 0;
  const balData = lineMonths.map(m => {
    const inc = all.filter(t => t.type === 'income' && t.date >= m.range.start && t.date <= m.range.end).reduce((s, t) => s + t.amount, 0);
    const exp = all.filter(t => t.type === 'expense' && t.date >= m.range.start && t.date <= m.range.end).reduce((s, t) => s + t.amount, 0);
    runBal += inc - exp;
    return runBal;
  });

  const lineEl = document.getElementById('chartLine');
  if (lineEl) {
    const opts = chartDefaults();
    chartInstances.line = new Chart(lineEl, {
      type: 'line',
      data: {
        labels: lineMonths.map(m => m.label),
        datasets: [{
          label: 'Saldo',
          data: balData,
          borderColor: CHART_COLORS.cyan,
          backgroundColor: 'rgba(6,182,212,0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: CHART_COLORS.cyan
        }]
      },
      options: opts
    });
  }

  // Doughnut – expenses by category for the selected period
  const periodRange = isYear ? getYearRange(now) : getMonthRange(now);
  const periodExpenses = all.filter(t => t.type === 'expense' && t.date >= periodRange.start && t.date <= periodRange.end);
  const catTotals = {};
  periodExpenses.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const doughEl = document.getElementById('chartDoughnut');
  const emptyLabel = isYear ? 'Sem despesas este ano' : 'Sem despesas este mês';
  if (doughEl && catEntries.length) {
    chartInstances.doughnut = new Chart(doughEl, {
      type: 'doughnut',
      data: {
        labels: catEntries.map(([id]) => getCategory('expense', id).name),
        datasets: [{
          data: catEntries.map(([, v]) => v),
          backgroundColor: catEntries.map(([id]) => getCategory('expense', id).color),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { color: CHART_COLORS.text, font: { family: "'Inter', sans-serif", size: 12 }, padding: 12 } }
        }
      }
    });
  } else if (doughEl) {
    doughEl.parentElement.innerHTML = `<div class="empty-state" style="padding:40px 0"><i class="fa-solid fa-chart-pie"></i><p>${emptyLabel}</p></div>`;
  }
}

// ─── 8. Income Section ─────────────────────────────────────

function renderIncome(container) {
  currentPage.income = currentPage.income || 1;
  const all = loadTransactions().filter(t => t.type === 'income');
  const cats = getAllCategories('income');

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i class="fa-solid fa-arrow-trend-up" style="color:var(--accent-green)"></i> Receitas</h2>
      <button class="btn btn-success" onclick="openTransactionModal('income')"><i class="fa-solid fa-plus"></i> Nova Receita</button>
    </div>
    <div class="filter-bar">
      <input type="date" class="form-input" id="incFilterFrom" />
      <input type="date" class="form-input" id="incFilterTo" />
      <select class="form-select" id="incFilterCat">
        <option value="">Todas categorias</option>
        ${cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
      <input type="text" class="form-input" id="incFilterSearch" placeholder="Buscar..." />
    </div>
    <div id="incomeTableArea"></div>
  `;

  renderIncomeTable();
  ['incFilterFrom', 'incFilterTo', 'incFilterCat', 'incFilterSearch'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => { currentPage.income = 1; renderIncomeTable(); });
  });
}

function renderIncomeTable() {
  let items = loadTransactions().filter(t => t.type === 'income');
  const from = document.getElementById('incFilterFrom')?.value;
  const to = document.getElementById('incFilterTo')?.value;
  const cat = document.getElementById('incFilterCat')?.value;
  const search = document.getElementById('incFilterSearch')?.value;
  if (from || to) items = filterByDateRange(items, from, to);
  if (cat) items = items.filter(t => t.category === cat);
  items = filterBySearch(items, search);
  items = sortByDate(items);
  const total = items.reduce((s, t) => s + t.amount, 0);
  const paged = paginate(items, currentPage.income);

  const area = document.getElementById('incomeTableArea');
  if (!area) return;
  area.innerHTML = paged.items.length ? `
    <div class="table-container">
      <table class="data-table">
        <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th style="width:100px">Ações</th></tr></thead>
        <tbody>${paged.items.map(tx => {
          const c = getCategory('income', tx.category);
          return `<tr>
            <td>${formatDate(tx.date)}</td>
            <td>${escapeHtml(tx.description)}</td>
            <td><span class="category-tag" style="background:${c.color}22;color:${c.color}"><i class="fa-solid ${c.icon}"></i> ${escapeHtml(c.name)}</span></td>
            <td class="amount-income">+ ${formatCurrency(tx.amount)}</td>
            <td>
              <button class="btn-icon edit" onclick="openTransactionModal('income','${tx.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon delete" onclick="confirmDelete('${tx.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;flex-wrap:wrap;gap:8px">
      <span style="color:var(--text-secondary);font-size:0.85rem">${paged.total} registro(s) — Total: <strong class="amount-income">${formatCurrency(total)}</strong></span>
      ${renderPagination(paged, 'income')}
    </div>
  ` : '<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>Nenhuma receita encontrada</p></div>';
}

// ─── 9. Expenses Section ───────────────────────────────────

function renderExpenses(container) {
  currentPage.expenses = currentPage.expenses || 1;
  const cats = getAllCategories('expense');

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i class="fa-solid fa-arrow-trend-down" style="color:var(--accent-red)"></i> Despesas</h2>
      <button class="btn btn-danger" onclick="openTransactionModal('expense')"><i class="fa-solid fa-plus"></i> Nova Despesa</button>
    </div>
    <div class="filter-bar">
      <input type="date" class="form-input" id="expFilterFrom" />
      <input type="date" class="form-input" id="expFilterTo" />
      <select class="form-select" id="expFilterCat">
        <option value="">Todas categorias</option>
        ${cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
      <input type="text" class="form-input" id="expFilterSearch" placeholder="Buscar..." />
    </div>
    <div id="expenseTableArea"></div>
    <div id="expenseCategoryBreakdown" style="margin-top:24px"></div>
  `;

  renderExpenseTable();
  renderExpenseCategoryBreakdown();
  ['expFilterFrom', 'expFilterTo', 'expFilterCat', 'expFilterSearch'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => { currentPage.expenses = 1; renderExpenseTable(); });
  });
}

function renderExpenseTable() {
  let items = loadTransactions().filter(t => t.type === 'expense');
  const from = document.getElementById('expFilterFrom')?.value;
  const to = document.getElementById('expFilterTo')?.value;
  const cat = document.getElementById('expFilterCat')?.value;
  const search = document.getElementById('expFilterSearch')?.value;
  if (from || to) items = filterByDateRange(items, from, to);
  if (cat) items = items.filter(t => t.category === cat);
  items = filterBySearch(items, search);
  items = sortByDate(items);
  const total = items.reduce((s, t) => s + t.amount, 0);
  const paged = paginate(items, currentPage.expenses);

  const area = document.getElementById('expenseTableArea');
  if (!area) return;
  area.innerHTML = paged.items.length ? `
    <div class="table-container">
      <table class="data-table">
        <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th style="width:100px">Ações</th></tr></thead>
        <tbody>${paged.items.map(tx => {
          const c = getCategory('expense', tx.category);
          return `<tr>
            <td>${formatDate(tx.date)}</td>
            <td>${escapeHtml(tx.description)}</td>
            <td><span class="category-tag" style="background:${c.color}22;color:${c.color}"><i class="fa-solid ${c.icon}"></i> ${escapeHtml(c.name)}</span></td>
            <td class="amount-expense">- ${formatCurrency(tx.amount)}</td>
            <td>
              <button class="btn-icon edit" onclick="openTransactionModal('expense','${tx.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon delete" onclick="confirmDelete('${tx.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;flex-wrap:wrap;gap:8px">
      <span style="color:var(--text-secondary);font-size:0.85rem">${paged.total} registro(s) — Total: <strong class="amount-expense">${formatCurrency(total)}</strong></span>
      ${renderPagination(paged, 'expenses')}
    </div>
  ` : '<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>Nenhuma despesa encontrada</p></div>';
}

function renderExpenseCategoryBreakdown() {
  const thisMonth = getMonthRange(new Date());
  const expenses = loadTransactions().filter(t => t.type === 'expense' && t.date >= thisMonth.start && t.date <= thisMonth.end);
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  if (!total) return;
  const catTotals = {};
  expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  const el = document.getElementById('expenseCategoryBreakdown');
  if (!el) return;
  el.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Gastos por Categoria (Mês Atual)</h3></div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${sorted.map(([catId, amount]) => {
          const c = getCategory('expense', catId);
          const pct = ((amount / total) * 100).toFixed(1);
          return `<div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.85rem">
              <span style="color:${c.color}"><i class="fa-solid ${c.icon}"></i> ${escapeHtml(c.name)}</span>
              <span style="color:var(--text-secondary)">${formatCurrency(amount)} (${pct}%)</span>
            </div>
            <div class="progress-bar-container"><div class="progress-bar-fill" style="width:${pct}%;background:${c.color}"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

// ─── 9b. Monthly Bills Section ─────────────────────────────

const BILL_CATEGORIES = [
  { id: 'aluguel', name: 'Aluguel', icon: 'fa-house', color: '#f43f5e' },
  { id: 'energia', name: 'Energia', icon: 'fa-bolt', color: '#eab308' },
  { id: 'agua', name: 'Água', icon: 'fa-droplet', color: '#3b82f6' },
  { id: 'internet', name: 'Internet', icon: 'fa-wifi', color: '#06b6d4' },
  { id: 'telefone', name: 'Telefone', icon: 'fa-phone', color: '#8b5cf6' },
  { id: 'streaming', name: 'Streaming', icon: 'fa-tv', color: '#ec4899' },
  { id: 'seguro', name: 'Seguro', icon: 'fa-shield-halved', color: '#14b8a6' },
  { id: 'cartao', name: 'Cartão de Crédito', icon: 'fa-credit-card', color: '#f97316' },
  { id: 'emprestimo', name: 'Empréstimo', icon: 'fa-landmark', color: '#6366f1' },
  { id: 'outros_conta', name: 'Outros', icon: 'fa-file-invoice', color: '#6b7280' }
];

function getBillCategory(catId) {
  return BILL_CATEGORIES.find(c => c.id === catId) || { id: catId, name: catId, icon: 'fa-file-invoice', color: '#6b7280' };
}

let billsMonth = '';

function renderBills(container) {
  const now = new Date();
  if (!billsMonth) billsMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const bills = loadBills();
  const payments = loadBillPayments();
  const [y, m] = billsMonth.split('-').map(Number);

  const totalBills = bills.reduce((s, b) => s + b.amount, 0);
  const paidBills = bills.filter(b => isBillPaid(b.id, billsMonth));
  const totalPaid = paidBills.reduce((s, b) => s + b.amount, 0);
  const totalPending = totalBills - totalPaid;
  const overdueBills = bills.filter(b => getBillStatus(b, billsMonth) === 'overdue');

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i class="fa-solid fa-file-invoice-dollar" style="color:var(--accent-yellow)"></i> Contas Mensais</h2>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input type="month" class="form-input" id="billsMonthPicker" value="${billsMonth}" style="max-width:200px" />
        <button class="btn btn-primary" onclick="openBillModal()"><i class="fa-solid fa-plus"></i> Nova Conta</button>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon" style="background:rgba(234,179,8,0.12);color:#eab308">
          <i class="fa-solid fa-file-invoice-dollar"></i>
        </div>
        <div class="summary-info">
          <div class="summary-label">Total de Contas</div>
          <div class="summary-value">${formatCurrency(totalBills)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${bills.length} conta(s)</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon" style="background:rgba(16,185,129,0.12);color:#10b981">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <div class="summary-info">
          <div class="summary-label">Pagas</div>
          <div class="summary-value amount-income">${formatCurrency(totalPaid)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${paidBills.length} de ${bills.length}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">
          <i class="fa-solid fa-clock"></i>
        </div>
        <div class="summary-info">
          <div class="summary-label">Pendentes</div>
          <div class="summary-value amount-expense">${formatCurrency(totalPending)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${bills.length - paidBills.length} pendente(s)</div>
        </div>
      </div>
      ${overdueBills.length > 0 ? `
      <div class="summary-card" style="border-color:var(--accent-red)">
        <div class="summary-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div class="summary-info">
          <div class="summary-label">Atrasadas</div>
          <div class="summary-value amount-expense">${overdueBills.length}</div>
          <div style="font-size:0.75rem;color:var(--accent-red);margin-top:2px">${formatCurrency(overdueBills.reduce((s, b) => s + b.amount, 0))}</div>
        </div>
      </div>` : ''}
    </div>

    ${bills.length > 0 ? `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Suas Contas</h3>
      </div>
      <div class="bills-list">
        ${bills.map(bill => {
          const cat = getBillCategory(bill.category);
          const status = getBillStatus(bill, billsMonth);
          const statusLabels = { paid: 'Paga', overdue: 'Atrasada', 'due-soon': 'Vence em breve', pending: 'Pendente' };
          return `<div class="bill-item bill-status-${status}">
            <div class="bill-item-left">
              <div class="bill-icon" style="background:${cat.color}22;color:${cat.color}">
                <i class="fa-solid ${cat.icon}"></i>
              </div>
              <div class="bill-info">
                <div class="bill-name">${escapeHtml(bill.name)}</div>
                <div class="bill-meta">
                  <span class="category-tag" style="background:${cat.color}22;color:${cat.color};font-size:0.7rem;padding:2px 8px">${escapeHtml(cat.name)}</span>
                  <span style="color:var(--text-muted);font-size:0.75rem">Vence dia ${bill.dueDay}</span>
                </div>
              </div>
            </div>
            <div class="bill-item-right">
              <div class="bill-amount">${formatCurrency(bill.amount)}</div>
              <span class="bill-status-badge status-${status}">${statusLabels[status]}</span>
              <div class="bill-actions">
                ${status !== 'paid'
                  ? `<button class="btn btn-success btn-sm" onclick="handleMarkBillPaid('${bill.id}')" title="Marcar como paga"><i class="fa-solid fa-check"></i></button>`
                  : `<button class="btn btn-outline btn-sm" onclick="handleUnmarkBillPaid('${bill.id}')" title="Desmarcar pagamento"><i class="fa-solid fa-rotate-left"></i></button>`
                }
                <button class="btn-icon edit" onclick="openBillModal('${bill.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete" onclick="confirmDeleteBill('${bill.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : `
    <div class="card">
      <div class="empty-state" style="padding:48px 0">
        <i class="fa-solid fa-file-invoice-dollar" style="font-size:3rem;color:var(--text-muted);margin-bottom:16px"></i>
        <p>Nenhuma conta mensal cadastrada</p>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px">Clique em "Nova Conta" para adicionar suas contas fixas</p>
      </div>
    </div>`}
  `;

  document.getElementById('billsMonthPicker').addEventListener('input', (e) => {
    billsMonth = e.target.value;
    renderBills(container);
  });
}

function openBillModal(editId) {
  const isEdit = !!editId;
  const bill = isEdit ? loadBills().find(b => b.id === editId) : null;

  openModal(`
    <div class="modal-header">
      <h3 class="modal-title">${isEdit ? 'Editar' : 'Nova'} Conta Mensal</h3>
      <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Nome da conta *</label>
        <input type="text" class="form-input" id="billName" placeholder="Ex: Aluguel, Internet..." value="${bill ? escapeHtml(bill.name) : ''}" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Valor mensal (R$) *</label>
          <input type="number" class="form-input" id="billAmount" placeholder="0,00" step="0.01" min="0.01" value="${bill ? bill.amount : ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Dia de vencimento *</label>
          <input type="number" class="form-input" id="billDueDay" placeholder="1-31" min="1" max="31" value="${bill ? bill.dueDay : ''}" required />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-select" id="billCategory">
          ${BILL_CATEGORIES.map(c => `<option value="${c.id}" ${bill && bill.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="billNotes" placeholder="Observações opcionais...">${bill && bill.notes ? escapeHtml(bill.notes) : ''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveBillFromModal('${editId || ''}')"><i class="fa-solid fa-check"></i> Salvar</button>
    </div>
  `);
}

function saveBillFromModal(editId) {
  const name = document.getElementById('billName')?.value.trim();
  const amount = parseFloat(document.getElementById('billAmount')?.value);
  const dueDay = parseInt(document.getElementById('billDueDay')?.value, 10);
  const category = document.getElementById('billCategory')?.value;
  const notes = document.getElementById('billNotes')?.value.trim();

  if (!name || isNaN(amount) || amount <= 0 || isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
    showToast('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  const data = { name, amount, dueDay, category, notes };

  if (editId) {
    updateBill(editId, data);
    showToast('Conta atualizada!', 'success');
  } else {
    addBill(data);
    showToast('Conta adicionada!', 'success');
  }

  closeModal();
  navigate('bills');
}

function handleMarkBillPaid(billId) {
  markBillPaid(billId, billsMonth);
  showToast('Conta marcada como paga!', 'success');
  navigate('bills');
}

function handleUnmarkBillPaid(billId) {
  unmarkBillPaid(billId, billsMonth);
  showToast('Pagamento desmarcado', 'info');
  navigate('bills');
}

function confirmDeleteBill(id) {
  openConfirmModal('Deseja excluir esta conta mensal?', () => {
    deleteBill(id);
    showToast('Conta excluída', 'success');
    navigate('bills');
  });
}

// ─── Mobile Push Notifications ─────────────────────────────

function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ─── Mobile Push Notification Rate Limiting ────────────────
// Only allow push notifications twice per day: once in the morning and once in the afternoon.
const PUSH_LIMIT_KEY = 'pessoal_push_limit';
const MORNING_END_HOUR = 12;

function canSendPushNotification() {
  const ls = window.__nativeLS || window.localStorage;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const period = now.getHours() < MORNING_END_HOUR ? 'morning' : 'afternoon';

  let state;
  try {
    state = JSON.parse(ls.getItem(PUSH_LIMIT_KEY) || '{}');
  } catch { state = {}; }

  if (state.date !== today) {
    state = { date: today };
  }

  if (state[period]) return false;

  state[period] = true;
  ls.setItem(PUSH_LIMIT_KEY, JSON.stringify(state));
  return true;
}

function sendPushNotification(title, body, icon) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!canSendPushNotification()) return;
  try {
    new Notification(title, {
      body: body,
      icon: icon || '../img/logo.png',
      badge: '../img/logo.png',
      tag: 'bills-' + Date.now(),
      vibrate: [200, 100, 200]
    });
  } catch (e) {
    // Fallback for environments that don't support Notification constructor options
  }
}

function checkBillNotifications() {
  const bills = loadBills();
  if (bills.length === 0) return;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let dueSoonCount = 0;
  let overdueCount = 0;
  const overdueNames = [];
  const dueSoonNames = [];

  bills.forEach(bill => {
    const status = getBillStatus(bill, currentMonth);
    if (status === 'overdue') {
      overdueCount++;
      overdueNames.push(bill.name);
    } else if (status === 'due-soon') {
      dueSoonCount++;
      dueSoonNames.push(bill.name);
    }
  });

  if (overdueCount > 0) {
    const msg = `Você tem ${overdueCount} conta(s) atrasada(s): ${overdueNames.join(', ')}`;
    addNotification(msg, 'danger');
    sendPushNotification('⚠️ Contas Atrasadas', msg);
  }

  if (dueSoonCount > 0) {
    const msg = `${dueSoonCount} conta(s) vencem em breve: ${dueSoonNames.join(', ')}`;
    addNotification(msg, 'warning');
    sendPushNotification('📅 Contas a Vencer', msg);
  }

  const paidCount = bills.filter(b => isBillPaid(b.id, currentMonth)).length;
  if (paidCount > 0 && paidCount < bills.length) {
    addNotification(`${paidCount} de ${bills.length} contas pagas este mês`, 'info');
  } else if (paidCount === bills.length && bills.length > 0) {
    addNotification('Todas as contas do mês estão pagas! 🎉', 'success');
    sendPushNotification('✅ Contas em dia', 'Todas as contas do mês estão pagas!');
  }
}

function seedSampleBills() {
  if (loadBills().length > 0) return;
  const sampleBills = [
    { name: 'Aluguel', amount: 1800, dueDay: 1, category: 'aluguel', notes: '' },
    { name: 'Conta de Luz', amount: 185, dueDay: 10, category: 'energia', notes: '' },
    { name: 'Internet', amount: 120, dueDay: 15, category: 'internet', notes: '' },
    { name: 'Netflix + Spotify', amount: 55.80, dueDay: 5, category: 'streaming', notes: '' },
    { name: 'Conta de Água', amount: 85, dueDay: 8, category: 'agua', notes: '' }
  ];
  const bills = sampleBills.map(b => ({ ...b, id: uid(), createdAt: new Date().toISOString() }));
  saveBills(bills);
}

// ─── 10. Cash Flow Section ─────────────────────────────────

function renderCashFlow(container) {
  const now = new Date();
  const monthVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i class="fa-solid fa-money-bill-transfer" style="color:var(--accent)"></i> Fluxo de Caixa</h2>
      <input type="month" class="form-input" id="cfMonth" value="${monthVal}" style="max-width:200px" />
    </div>
    <div id="cashFlowTable"></div>
  `;

  renderCashFlowTable();
  document.getElementById('cfMonth').addEventListener('input', renderCashFlowTable);
}

function renderCashFlowTable() {
  const monthInput = document.getElementById('cfMonth');
  if (!monthInput) return;
  const [y, m] = monthInput.value.split('-').map(Number);
  const range = getMonthRange(new Date(y, m - 1, 1));

  const all = loadTransactions();
  // Calculate balance before this month
  let priorBal = 0;
  all.forEach(t => {
    if (t.date < range.start) {
      priorBal += t.type === 'income' ? t.amount : -t.amount;
    }
  });

  const monthTx = sortByDate(all.filter(t => t.date >= range.start && t.date <= range.end), true);
  let runBal = priorBal;

  const area = document.getElementById('cashFlowTable');
  if (!area) return;
  area.innerHTML = monthTx.length ? `
    <div class="table-container">
      <table class="data-table">
        <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Valor</th><th>Saldo</th></tr></thead>
        <tbody>
          <tr style="background:rgba(6,182,212,0.06)">
            <td colspan="5" style="font-weight:600;color:var(--text-secondary)">Saldo anterior</td>
            <td class="${priorBal < 0 ? 'negative-balance' : ''}" style="font-weight:700">${formatCurrency(priorBal)}</td>
          </tr>
          ${monthTx.map(tx => {
            const cat = getCategory(tx.type, tx.category);
            runBal += tx.type === 'income' ? tx.amount : -tx.amount;
            return `<tr>
              <td>${formatDate(tx.date)}</td>
              <td>${escapeHtml(tx.description)}</td>
              <td><span class="badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}">${tx.type === 'income' ? 'Entrada' : 'Saída'}</span></td>
              <td><span class="category-tag" style="background:${cat.color}22;color:${cat.color}"><i class="fa-solid ${cat.icon}"></i> ${escapeHtml(cat.name)}</span></td>
              <td class="${tx.type === 'income' ? 'amount-income' : 'amount-expense'}">${tx.type === 'income' ? '+' : '-'} ${formatCurrency(tx.amount)}</td>
              <td class="${runBal < 0 ? 'negative-balance' : ''}" style="font-weight:600">${formatCurrency(runBal)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  ` : '<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>Sem transações neste período</p></div>';
}

// ─── 11. Reports Section ───────────────────────────────────

let activeReport = 'monthly';

function renderReports(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i class="fa-solid fa-file-lines" style="color:var(--accent-purple)"></i> Relatórios</h2>
      <div class="export-btns">
        <button class="btn btn-danger btn-sm" onclick="exportPDF()"><i class="fa-solid fa-file-pdf"></i> Exportar PDF</button>
        <button class="btn btn-success btn-sm" onclick="exportExcel()"><i class="fa-solid fa-file-excel"></i> Exportar Excel</button>
      </div>
    </div>
    <div class="report-selector">
      <button class="report-type-btn active" data-report="monthly">Resumo Mensal</button>
      <button class="report-type-btn" data-report="category">Gastos por Categoria</button>
      <button class="report-type-btn" data-report="comparison">Comparação entre Meses</button>
      <button class="report-type-btn" data-report="evolution">Evolução Financeira</button>
    </div>
    <div id="reportContent"></div>
  `;

  container.querySelectorAll('.report-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.report-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeReport = btn.dataset.report;
      renderReportContent();
    });
  });

  renderReportContent();
}

function renderReportContent() {
  const el = document.getElementById('reportContent');
  if (!el) return;
  destroyAllCharts();
  switch (activeReport) {
    case 'monthly': renderMonthlyReport(el); break;
    case 'category': renderCategoryReport(el); break;
    case 'comparison': renderComparisonReport(el); break;
    case 'evolution': renderEvolutionReport(el); break;
  }
}

function renderMonthlyReport(el) {
  const now = new Date();
  const range = getMonthRange(now);
  const all = loadTransactions();
  const month = all.filter(t => t.date >= range.start && t.date <= range.end);
  const income = month.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = month.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;

  const catTotals = {};
  month.filter(t => t.type === 'expense').forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const label = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  el.innerHTML = `
    <div class="card" style="margin-bottom:20px">
      <h3 class="card-title" style="margin-bottom:16px;text-transform:capitalize">Resumo — ${label}</h3>
      <div class="summary-grid" style="margin-bottom:0">
        <div class="summary-card">
          <div class="summary-info"><div class="summary-label">Total Receitas</div><div class="summary-value amount-income">${formatCurrency(income)}</div></div>
        </div>
        <div class="summary-card">
          <div class="summary-info"><div class="summary-label">Total Despesas</div><div class="summary-value amount-expense">${formatCurrency(expense)}</div></div>
        </div>
        <div class="summary-card">
          <div class="summary-info"><div class="summary-label">Economia</div><div class="summary-value ${savings < 0 ? 'negative-balance' : ''}">${formatCurrency(savings)}</div></div>
        </div>
      </div>
    </div>
    ${topCats.length ? `
    <div class="card">
      <h3 class="card-title" style="margin-bottom:16px">Top Categorias de Gasto</h3>
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>Categoria</th><th>Total</th><th>%</th></tr></thead>
          <tbody>${topCats.map(([id, amt]) => {
            const c = getCategory('expense', id);
            const pct = expense > 0 ? ((amt / expense) * 100).toFixed(1) : 0;
            return `<tr><td><span class="category-tag" style="background:${c.color}22;color:${c.color}"><i class="fa-solid ${c.icon}"></i> ${escapeHtml(c.name)}</span></td><td class="amount-expense">${formatCurrency(amt)}</td><td>${pct}%</td></tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>` : ''}
  `;
}

function renderCategoryReport(el) {
  const range = getMonthRange(new Date());
  const expenses = loadTransactions().filter(t => t.type === 'expense' && t.date >= range.start && t.date <= range.end);
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const catTotals = {};
  expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  el.innerHTML = `
    <div class="charts-grid" style="margin-bottom:20px">
      <div class="card"><div class="card-header"><h3 class="card-title">Distribuição</h3></div><div class="chart-wrapper"><canvas id="reportPie"></canvas></div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">Detalhamento</h3></div>
      ${sorted.length ? `<div class="table-container"><table class="data-table"><thead><tr><th>Categoria</th><th>Total</th><th>%</th></tr></thead><tbody>
        ${sorted.map(([id, amt]) => {
          const c = getCategory('expense', id);
          const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : 0;
          return `<tr><td><span class="category-tag" style="background:${c.color}22;color:${c.color}"><i class="fa-solid ${c.icon}"></i> ${escapeHtml(c.name)}</span></td><td>${formatCurrency(amt)}</td><td>${pct}%</td></tr>`;
        }).join('')}
      </tbody></table></div>` : '<div class="empty-state"><p>Sem dados</p></div>'}
    </div>
  `;

  if (sorted.length) {
    chartInstances.reportPie = new Chart(document.getElementById('reportPie'), {
      type: 'pie',
      data: {
        labels: sorted.map(([id]) => getCategory('expense', id).name),
        datasets: [{ data: sorted.map(([, v]) => v), backgroundColor: sorted.map(([id]) => getCategory('expense', id).color), borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: CHART_COLORS.text, font: { family: "'Inter',sans-serif" } } } } }
    });
  }
}

function renderComparisonReport(el) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('pt-BR', { month: 'short' }), range: getMonthRange(d) });
  }
  const all = loadTransactions();
  const incData = months.map(m => all.filter(t => t.type === 'income' && t.date >= m.range.start && t.date <= m.range.end).reduce((s, t) => s + t.amount, 0));
  const expData = months.map(m => all.filter(t => t.type === 'expense' && t.date >= m.range.start && t.date <= m.range.end).reduce((s, t) => s + t.amount, 0));

  el.innerHTML = '<div class="card"><div class="card-header"><h3 class="card-title">Comparação Mensal</h3></div><div class="chart-wrapper" style="height:350px"><canvas id="reportComparison"></canvas></div></div>';

  chartInstances.reportComparison = new Chart(document.getElementById('reportComparison'), {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        { label: 'Receitas', data: incData, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
        { label: 'Despesas', data: expData, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 }
      ]
    },
    options: chartDefaults()
  });
}

function renderEvolutionReport(el) {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), range: getMonthRange(d) });
  }
  const all = loadTransactions();
  let bal = 0;
  const balData = months.map(m => {
    const inc = all.filter(t => t.type === 'income' && t.date >= m.range.start && t.date <= m.range.end).reduce((s, t) => s + t.amount, 0);
    const exp = all.filter(t => t.type === 'expense' && t.date >= m.range.start && t.date <= m.range.end).reduce((s, t) => s + t.amount, 0);
    bal += inc - exp;
    return bal;
  });

  el.innerHTML = '<div class="card"><div class="card-header"><h3 class="card-title">Evolução Financeira</h3></div><div class="chart-wrapper" style="height:350px"><canvas id="reportEvolution"></canvas></div></div>';

  chartInstances.reportEvolution = new Chart(document.getElementById('reportEvolution'), {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [{
        label: 'Saldo Acumulado',
        data: balData,
        borderColor: CHART_COLORS.cyan,
        backgroundColor: 'rgba(6,182,212,0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: CHART_COLORS.cyan
      }]
    },
    options: chartDefaults()
  });
}

// ─── 12. Settings Section ──────────────────────────────────

function renderSettings(container) {
  const settings = loadSettings();
  const cats = loadCategories();

  function catListHTML(type) {
    const list = type === 'income' ? cats.income : cats.expense;
    return list.map(c => `
      <div class="category-item">
        <div class="category-item-info">
          <span style="color:${c.color}"><i class="fa-solid ${c.icon}"></i></span>
          <span>${escapeHtml(c.name)}</span>
        </div>
        <button class="btn-icon delete" onclick="deleteCategory('${type}','${c.id}')" title="Remover"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');
  }

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i class="fa-solid fa-gear" style="color:var(--text-secondary)"></i> Configurações</h2>
    </div>
    <div class="settings-grid">
      <div class="settings-section">
        <h3><i class="fa-solid fa-bell"></i> Alertas</h3>
        <div class="form-group">
          <label class="form-label">Limite de gasto para alerta (R$)</label>
          <input type="number" class="form-input" id="alertThreshold" value="${settings.alertThreshold}" min="0" step="50" />
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveAlertSettings()"><i class="fa-solid fa-check"></i> Salvar</button>
      </div>

      <div class="settings-section">
        <h3><i class="fa-solid fa-tags"></i> Categorias de Despesa</h3>
        <div class="category-list" id="expCatList">${catListHTML('expense')}</div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <input type="text" class="form-input" id="newExpCatName" placeholder="Nome da categoria" style="flex:1" />
          <button class="btn btn-primary btn-sm" onclick="addCategory('expense')"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>

      <div class="settings-section">
        <h3><i class="fa-solid fa-tags"></i> Categorias de Receita</h3>
        <div class="category-list" id="incCatList">${catListHTML('income')}</div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <input type="text" class="form-input" id="newIncCatName" placeholder="Nome da categoria" style="flex:1" />
          <button class="btn btn-primary btn-sm" onclick="addCategory('income')"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>

      <div class="settings-section">
        <h3><i class="fa-solid fa-database"></i> Dados</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-outline btn-sm" onclick="exportAllData()"><i class="fa-solid fa-download"></i> Exportar todos os dados</button>
          <label class="btn btn-outline btn-sm" style="cursor:pointer"><i class="fa-solid fa-upload"></i> Importar dados <input type="file" accept=".json" id="importFile" style="display:none" onchange="importData(event)" /></label>
          <button class="btn btn-danger btn-sm" onclick="clearAllData()"><i class="fa-solid fa-trash"></i> Limpar todos os dados</button>
        </div>
      </div>
    </div>
  `;
}

function saveAlertSettings() {
  const val = parseFloat(document.getElementById('alertThreshold')?.value);
  if (isNaN(val) || val < 0) { showToast('Valor inválido', 'error'); return; }
  const s = loadSettings();
  s.alertThreshold = val;
  saveSettings(s);
  showToast('Configurações salvas!', 'success');
}

function sanitizeCategoryId(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function addCategory(type) {
  const inputId = type === 'income' ? 'newIncCatName' : 'newExpCatName';
  const name = document.getElementById(inputId)?.value.trim();
  if (!name) { showToast('Informe o nome da categoria', 'error'); return; }
  const cats = loadCategories();
  const list = type === 'income' ? cats.income : cats.expense;
  const id = sanitizeCategoryId(name);
  if (list.find(c => c.id === id)) { showToast('Categoria já existe', 'warning'); return; }
  list.push({ id, name, icon: 'fa-tag', color: '#6b7280' });
  saveCategories(cats);
  showToast('Categoria adicionada!', 'success');
  renderSettings(document.getElementById('mainContent'));
}

function deleteCategory(type, catId) {
  const cats = loadCategories();
  if (type === 'income') cats.income = cats.income.filter(c => c.id !== catId);
  else cats.expense = cats.expense.filter(c => c.id !== catId);
  saveCategories(cats);
  showToast('Categoria removida', 'success');
  renderSettings(document.getElementById('mainContent'));
}

function exportAllData() {
  const data = {
    transactions: loadTransactions(),
    categories: loadCategories(),
    settings: loadSettings(),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `financas-pessoais-backup-${getToday()}.json`);
  showToast('Dados exportados!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.transactions) saveTransactions(data.transactions);
      if (data.categories) saveCategories(data.categories);
      if (data.settings) saveSettings(data.settings);
      showToast('Dados importados com sucesso!', 'success');
      navigate(currentSection);
    } catch {
      showToast('Arquivo inválido', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  openConfirmModal('Tem certeza que deseja apagar TODOS os dados?', () => {
    localStorage.removeItem(STORAGE_KEYS.transactions);
    localStorage.removeItem(STORAGE_KEYS.categories);
    localStorage.removeItem(STORAGE_KEYS.settings);
    showToast('Dados apagados', 'success');
    navigate('overview');
  });
}

// ─── 13. Pagination Helper ─────────────────────────────────

function renderPagination(paged, sectionKey) {
  if (paged.totalPages <= 1) return '';
  let html = '<div class="pagination">';
  html += `<button class="page-btn" onclick="goToPage('${sectionKey}',${paged.page - 1})" ${paged.page <= 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>`;
  for (let i = 1; i <= paged.totalPages; i++) {
    if (paged.totalPages > 7 && i > 2 && i < paged.totalPages - 1 && Math.abs(i - paged.page) > 1) {
      if (i === 3 || i === paged.totalPages - 2) html += '<span style="color:var(--text-muted);padding:0 4px">…</span>';
      continue;
    }
    html += `<button class="page-btn ${i === paged.page ? 'active' : ''}" onclick="goToPage('${sectionKey}',${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="goToPage('${sectionKey}',${paged.page + 1})" ${paged.page >= paged.totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>`;
  html += '</div>';
  return html;
}

function goToPage(sectionKey, page) {
  currentPage[sectionKey] = page;
  if (sectionKey === 'income') renderIncomeTable();
  else if (sectionKey === 'expenses') renderExpenseTable();
}

// ─── 14. Modal System ──────────────────────────────────────

function openModal(content) {
  document.getElementById('modalContainer').innerHTML = content;
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modalContainer').innerHTML = '';
}

function openTransactionModal(type, editId) {
  const isEdit = !!editId;
  let tx = isEdit ? loadTransactions().find(t => t.id === editId) : null;
  const txType = tx ? tx.type : type;
  const cats = getAllCategories(txType);

  openModal(`
    <div class="modal-header">
      <h3 class="modal-title">${isEdit ? 'Editar' : 'Nova'} ${txType === 'income' ? 'Receita' : 'Despesa'}</h3>
      <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <div class="type-toggle">
          <button class="type-toggle-btn ${txType === 'income' ? 'active-income' : ''}" data-type="income" onclick="switchModalType('income')">
            <i class="fa-solid fa-arrow-up"></i> Receita
          </button>
          <button class="type-toggle-btn ${txType === 'expense' ? 'active-expense' : ''}" data-type="expense" onclick="switchModalType('expense')">
            <i class="fa-solid fa-arrow-down"></i> Despesa
          </button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data *</label>
          <input type="date" class="form-input" id="txDate" value="${tx ? tx.date : getToday()}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Valor *</label>
          <input type="number" class="form-input" id="txAmount" placeholder="0,00" step="0.01" min="0.01" value="${tx ? tx.amount : ''}" required />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Descrição *</label>
        <input type="text" class="form-input" id="txDesc" placeholder="Ex: Supermercado" value="${tx ? escapeHtml(tx.description) : ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-select" id="txCategory">
          ${cats.map(c => `<option value="${c.id}" ${tx && tx.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="txNotes" placeholder="Observações opcionais...">${tx && tx.notes ? escapeHtml(tx.notes) : ''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveTransaction('${editId || ''}')"><i class="fa-solid fa-check"></i> Salvar</button>
    </div>
  `);
}

function switchModalType(type) {
  document.querySelectorAll('.type-toggle-btn').forEach(btn => {
    btn.classList.remove('active-income', 'active-expense');
    if (btn.dataset.type === type) btn.classList.add(type === 'income' ? 'active-income' : 'active-expense');
  });
  const cats = getAllCategories(type);
  const sel = document.getElementById('txCategory');
  if (sel) {
    sel.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
}

function getModalType() {
  const btn = document.querySelector('.type-toggle-btn.active-income, .type-toggle-btn.active-expense');
  if (!btn) return 'expense';
  return btn.dataset.type;
}

function saveTransaction(editId) {
  const type = getModalType();
  const date = document.getElementById('txDate')?.value;
  const amount = parseFloat(document.getElementById('txAmount')?.value);
  const description = document.getElementById('txDesc')?.value.trim();
  const category = document.getElementById('txCategory')?.value;
  const notes = document.getElementById('txNotes')?.value.trim();

  if (!date || !description || isNaN(amount) || amount <= 0) {
    showToast('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  const data = { type, date, amount, description, category, notes };

  if (editId) {
    updateTransaction(editId, data);
    showToast('Transação atualizada!', 'success');
  } else {
    addTransaction(data);
    showToast('Transação adicionada!', 'success');
  }

  closeModal();
  navigate(currentSection);
}

function confirmDelete(id) {
  openConfirmModal('Deseja excluir esta transação?', () => {
    deleteTransaction(id);
    showToast('Transação excluída', 'success');
    navigate(currentSection);
  });
}

function openConfirmModal(message, onConfirm) {
  openModal(`
    <div class="modal-header">
      <h3 class="modal-title">Confirmação</h3>
      <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body" style="text-align:center;padding:32px 24px">
      <i class="fa-solid fa-triangle-exclamation" style="font-size:2.5rem;color:var(--accent-yellow);margin-bottom:16px"></i>
      <p style="font-size:1rem;margin-bottom:4px">${message}</p>
      <p style="font-size:0.85rem;color:var(--text-secondary)">Esta ação não pode ser desfeita.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" id="confirmActionBtn">Confirmar</button>
    </div>
  `);
  document.getElementById('confirmActionBtn').addEventListener('click', () => { closeModal(); onConfirm(); });
}

// ─── 15. Toast Notification System ─────────────────────────

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-message">${escapeHtml(message)}</span>
    <span class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

// ─── 16. Export Functions ──────────────────────────────────

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportPDF() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const all = loadTransactions();
    const now = new Date();
    const range = getMonthRange(now);
    const month = all.filter(t => t.date >= range.start && t.date <= range.end);
    const income = month.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = month.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    doc.setFontSize(18);
    doc.text('Relatório Financeiro Pessoal', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    doc.text(`Período: ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`, 14, 36);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Resumo do Mês', 14, 48);
    doc.setFontSize(10);
    doc.text(`Receitas: ${formatCurrency(income)}`, 14, 56);
    doc.text(`Despesas: ${formatCurrency(expense)}`, 14, 62);
    doc.text(`Economia: ${formatCurrency(income - expense)}`, 14, 68);

    // Transaction table
    let y = 80;
    doc.setFontSize(12);
    doc.text('Transações', 14, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('DATA', 14, y);
    doc.text('DESCRIÇÃO', 40, y);
    doc.text('TIPO', 110, y);
    doc.text('VALOR', 140, y);
    y += 6;
    doc.setTextColor(0);

    const sorted = sortByDate(month);
    sorted.forEach(tx => {
      if (y > PDF_PAGE_BOTTOM) { doc.addPage(); y = PDF_TOP_MARGIN; }
      doc.text(formatDate(tx.date), 14, y);
      doc.text(tx.description.substring(0, PDF_DESC_MAX_LEN), 40, y);
      doc.text(tx.type === 'income' ? 'Receita' : 'Despesa', 110, y);
      doc.text(formatCurrency(tx.amount), 140, y);
      y += 6;
    });

    doc.save(`relatorio-pessoal-${getToday()}.pdf`);
    showToast('PDF exportado!', 'success');
  } catch (err) {
    showToast('Erro ao gerar PDF', 'error');
    console.error(err);
  }
}

function exportExcel() {
  try {
    const all = sortByDate(loadTransactions(), true);
    const data = all.map(tx => ({
      Data: formatDate(tx.date),
      Descrição: tx.description,
      Tipo: tx.type === 'income' ? 'Receita' : 'Despesa',
      Categoria: getCategory(tx.type, tx.category).name,
      Valor: tx.amount,
      Notas: tx.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transações');
    XLSX.writeFile(wb, `financas-pessoais-${getToday()}.xlsx`);
    showToast('Excel exportado!', 'success');
  } catch (err) {
    showToast('Erro ao gerar Excel', 'error');
    console.error(err);
  }
}

// ─── 17. Sidebar Mobile Toggle ─────────────────────────────

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

// ─── 18. Global Search ─────────────────────────────────────

function handleGlobalSearch(query) {
  if (!query || query.length < 2) return;
  // Navigate to cashflow view and let the table display all matches
  // This is a lightweight approach – filter the cashflow view
  if (currentSection !== 'cashflow') navigate('cashflow');
  // We'll re-filter in cashflow if needed
}

// ─── 19. Sample Data Seeder ────────────────────────────────

function seedSampleData() {
  if (loadTransactions().length > 0) return;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const mm = String(m + 1).padStart(2, '0');
  const samples = [
    { type: 'income', description: 'Salário', amount: 5500, category: 'salario', date: `${y}-${mm}-05` },
    { type: 'income', description: 'Freelance website', amount: 1200, category: 'freelance', date: `${y}-${mm}-12` },
    { type: 'expense', description: 'Aluguel', amount: 1800, category: 'moradia', date: `${y}-${mm}-01` },
    { type: 'expense', description: 'Supermercado Pão de Açúcar', amount: 480, category: 'alimentacao', date: `${y}-${mm}-03` },
    { type: 'expense', description: 'Conta de luz', amount: 185, category: 'contas', date: `${y}-${mm}-10` },
    { type: 'expense', description: 'Gasolina', amount: 250, category: 'transporte', date: `${y}-${mm}-08` },
    { type: 'expense', description: 'Curso Udemy', amount: 79.90, category: 'educacao', date: `${y}-${mm}-15` },
    { type: 'expense', description: 'Netflix + Spotify', amount: 55.80, category: 'lazer', date: `${y}-${mm}-05` },
    { type: 'expense', description: 'Farmácia', amount: 120, category: 'saude', date: `${y}-${mm}-07` },
    { type: 'expense', description: 'Roupa nova', amount: 199, category: 'compras', date: `${y}-${mm}-18` },

    // Previous month
    { type: 'income', description: 'Salário', amount: 5500, category: 'salario', date: formatDateISO(new Date(y, m - 1, 5)) },
    { type: 'income', description: 'Dividendos', amount: 320, category: 'investimentos', date: formatDateISO(new Date(y, m - 1, 15)) },
    { type: 'expense', description: 'Aluguel', amount: 1800, category: 'moradia', date: formatDateISO(new Date(y, m - 1, 1)) },
    { type: 'expense', description: 'Supermercado Extra', amount: 520, category: 'alimentacao', date: formatDateISO(new Date(y, m - 1, 4)) },
    { type: 'expense', description: 'Internet', amount: 120, category: 'contas', date: formatDateISO(new Date(y, m - 1, 10)) },
    { type: 'expense', description: 'Uber', amount: 95, category: 'transporte', date: formatDateISO(new Date(y, m - 1, 12)) },
    { type: 'expense', description: 'Cinema', amount: 60, category: 'lazer', date: formatDateISO(new Date(y, m - 1, 20)) },

    // Two months ago
    { type: 'income', description: 'Salário', amount: 5200, category: 'salario', date: formatDateISO(new Date(y, m - 2, 5)) },
    { type: 'expense', description: 'Aluguel', amount: 1800, category: 'moradia', date: formatDateISO(new Date(y, m - 2, 1)) },
    { type: 'expense', description: 'Supermercado', amount: 450, category: 'alimentacao', date: formatDateISO(new Date(y, m - 2, 6)) },
    { type: 'expense', description: 'Conta de água', amount: 85, category: 'contas', date: formatDateISO(new Date(y, m - 2, 8)) }
  ];

  const txs = samples.map(s => ({
    ...s,
    id: uid(),
    createdAt: new Date().toISOString(),
    notes: ''
  }));

  saveTransactions(txs);
}

// ─── 20. Notification System ───────────────────────────────

function addNotification(message, type = 'info') {
  const icons = { warning: 'fa-triangle-exclamation', info: 'fa-circle-info', danger: 'fa-circle-xmark', success: 'fa-circle-check' };
  notifications.unshift({ id: uid(), message, type, icon: icons[type] || icons.info, time: new Date().toISOString() });
  if (notifications.length > MAX_NOTIFICATIONS) notifications.pop();
  updateNotificationBadge();
  renderNotificationList();
}

function updateNotificationBadge() {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;
  const count = notifications.length;
  badge.textContent = count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count;
  badge.classList.toggle('hidden', count === 0);
}

function renderNotificationList() {
  const list = document.getElementById('notificationList');
  if (!list) return;
  if (notifications.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:24px 0"><i class="fa-solid fa-bell-slash"></i><p>Nenhuma notificação</p></div>';
    return;
  }
  list.innerHTML = notifications.map(n => {
    const timeAgo = getTimeAgo(n.time);
    return `<div class="notification-item">
      <div class="notif-icon ${n.type}"><i class="fa-solid ${n.icon}"></i></div>
      <div class="notif-content">
        <div class="notif-text">${escapeHtml(n.message)}</div>
        <div class="notif-time">${timeAgo}</div>
      </div>
    </div>`;
  }).join('');
}

function getTimeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

function toggleNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  if (panel) panel.classList.toggle('hidden');
}

function generateMonthlyNotifications() {
  const all = loadTransactions();
  const now = new Date();
  const thisMonth = getMonthRange(now);
  const settings = loadSettings();

  const monthExpenses = all.filter(t => t.type === 'expense' && t.date >= thisMonth.start && t.date <= thisMonth.end);
  const monthIncome = all.filter(t => t.type === 'income' && t.date >= thisMonth.start && t.date <= thisMonth.end);
  const totalExpense = monthExpenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthIncome.reduce((s, t) => s + t.amount, 0);

  // Check recurring expenses (bills) due this month
  const billCategories = monthExpenses.filter(t => t.category === 'contas');
  if (billCategories.length > 0) {
    const billTotal = billCategories.reduce((s, t) => s + t.amount, 0);
    addNotification(`Você tem ${billCategories.length} conta(s) este mês totalizando ${formatCurrency(billTotal)}`, 'info');
  }

  // High spending alert
  if (totalIncome > 0 && totalExpense / totalIncome > HIGH_SPENDING_THRESHOLD) {
    addNotification(`Atenção: seus gastos representam ${((totalExpense / totalIncome) * 100).toFixed(0)}% da sua receita este mês`, 'warning');
  }

  // Savings positive
  if (totalIncome > totalExpense && totalIncome > 0) {
    addNotification(`Boa notícia! Você está economizando ${formatCurrency(totalIncome - totalExpense)} este mês`, 'success');
  }

  // Alert threshold check on individual high expenses
  const highExpenses = monthExpenses.filter(t => t.amount >= settings.alertThreshold);
  if (highExpenses.length > 0) {
    addNotification(`${highExpenses.length} despesa(s) acima do limite de ${formatCurrency(settings.alertThreshold)} detectada(s)`, 'danger');
  }
}

// ─── 21. User Profile Photo ────────────────────────────────

function updateUserAvatar() {
  const avatarEl = document.getElementById('userAvatar');
  if (!avatarEl) return;

  const user = typeof window.firebaseAuth?.currentUser === 'function'
    ? window.firebaseAuth.currentUser()
    : null;

  if (user && user.photoURL) {
    const img = document.createElement('img');
    img.src = user.photoURL;
    img.alt = user.displayName || 'Perfil';
    img.referrerPolicy = 'no-referrer';
    avatarEl.textContent = '';
    avatarEl.appendChild(img);
  } else if (user && user.displayName) {
    const initials = user.displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const div = document.createElement('div');
    div.style.cssText = 'width:36px;height:36px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;color:#fff';
    div.textContent = initials;
    avatarEl.textContent = '';
    avatarEl.appendChild(div);
  }
}

// ─── 22. Initialization ────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Navigation links
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.section);
    });
  });

  // Sidebar toggle
  document.getElementById('sidebarToggleBtn').addEventListener('click', openSidebar);
  document.getElementById('sidebarCloseBtn').addEventListener('click', closeSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  // Modal close on overlay click
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Global search
  let searchTimeout;
  document.getElementById('globalSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => handleGlobalSearch(e.target.value.trim()), 400);
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (typeof window.firebaseAuth?.logout === 'function') {
      window.firebaseAuth.logout();
    } else {
      window.location.href = '../login.html';
    }
  });

  // Notification panel toggle
  const notifBtn = document.getElementById('notificationBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', toggleNotificationPanel);
  }

  // Clear notifications
  const clearNotifBtn = document.getElementById('clearNotificationsBtn');
  if (clearNotifBtn) {
    clearNotifBtn.addEventListener('click', () => {
      notifications = [];
      updateNotificationBadge();
      renderNotificationList();
    });
  }

  // Close notification panel when clicking outside
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('notificationPanel');
    const btn = document.getElementById('notificationBtn');
    if (panel && !panel.classList.contains('hidden') && !panel.contains(e.target) && !btn.contains(e.target)) {
      panel.classList.add('hidden');
    }
  });

  // Resize handler for charts
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      Object.values(chartInstances).forEach(c => { try { c.resize(); } catch {} });
    }, 250);
  });

  // Load user avatar from Firebase auth
  updateUserAvatar();
  setTimeout(updateUserAvatar, 1500);
  setTimeout(updateUserAvatar, 4000);

  // Real-time Firebase sync: re-render current section when remote data changes
  window.addEventListener('cloud-data-refresh-requested', () => {
    renderSection(currentSection);
  });

  // Initialise the app after Firebase/cloud data is ready.
  // seedSampleData and seedSampleBills MUST run after the backend is ready so they
  // don't write to localStorage before real Firestore data is loaded — doing so would
  // set hasUnsavedChanges=true and block applyCloudState from loading the user's data,
  // which caused auto-save to stop working and data to be lost on page refresh.
  function initApp() {
    seedSampleData();
    seedSampleBills();
    requestNotificationPermission();
    generateMonthlyNotifications();
    checkBillNotifications();
    navigate('overview');
  }

  if (window.BackendInitialized) {
    initApp();
  } else {
    // Fallback: if Firebase is slow or offline, start with empty state after 2.5 s
    const fallbackTimer = setTimeout(initApp, 2500);
    window.addEventListener('backend-ready', () => {
      clearTimeout(fallbackTimer);
      initApp();
    }, { once: true });
  }
});