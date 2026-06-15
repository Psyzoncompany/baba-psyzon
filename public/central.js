document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const el = id => document.getElementById(id);

    const currentDateEl = el('current-date');
    const openSettingsBtn = el('open-settings-btn');
    const closeSettingsBtn = el('close-settings-btn');
    const settingsModal = el('settings-modal');
    const settingsForm = el('settings-form');
    const initialLoader = el('initial-loader');
    const mobileMenuButton = el('mobile-menu-button');
    const mobileMenu = el('mobile-menu');

    const metaDiaContent = el('meta-dia-content');
    const vencimentosContent = el('vencimentos-content');
    const contasAtrasoContent = el('contas-atraso-content');
    const acoesPedidosContent = el('acoes-pedidos-content');
    const artesPendentesContent = el('artes-pendentes-content');

    const settingPriceInput = el('setting-price');
    const settingCostInput = el('setting-cost');
    const settingDeadlineDaysInput = el('setting-deadline-days');
    const settingListLimitInput = el('setting-list-limit');
    const settingAutoOpenInput = el('setting-auto-open');

    const cashStatusDot = el('cash-status-dot');
    const cashStatusLabel = el('cash-status-label');
    const cashOperatorInput = el('cash-operator');
    const cashInitialAmountInput = el('cash-initial-amount');
    const openCashBtn = el('open-cash-btn');
    const closeCashBtn = el('close-cash-btn');
    const cashBalanceValue = el('cash-balance-value');
    const cashOpenedAt = el('cash-opened-at');
    const cashSalesValue = el('cash-sales-value');
    const cashSalesCount = el('cash-sales-count');
    const cashProductsCount = el('cash-products-count');
    const cashStockAlert = el('cash-stock-alert');
    const cashOrdersCount = el('cash-orders-count');
    const cashOrdersAlert = el('cash-orders-alert');

    const saleForm = el('sale-form');
    const saleProductSelect = el('sale-product');
    const saleQuantityInput = el('sale-quantity');
    const salePaymentSelect = el('sale-payment');
    const saleDiscountInput = el('sale-discount');
    const salePreview = el('sale-preview');
    const recentSalesList = el('recent-sales-list');

    const productForm = el('product-form');
    const productNameInput = el('product-name');
    const productSkuInput = el('product-sku');
    const productPriceInput = el('product-price');
    const productStockInput = el('product-stock');
    const productCategoryInput = el('product-category');
    const productsList = el('products-list');

    const movementForm = el('movement-form');
    const movementTypeInput = el('movement-type');
    const movementAmountInput = el('movement-amount');
    const movementNoteInput = el('movement-note');
    const cashMovementsList = el('cash-movements-list');

    const SETTINGS_KEY = 'boss_central_settings_v1';
    const PRODUCTS_KEY = 'psyzon_products_v1';
    const CASH_SESSION_KEY = 'psyzon_cash_session_v1';
    const CASH_SALES_KEY = 'psyzon_cash_sales_v1';

    let settings = {
        price: 100,
        cost: 35,
        deadlineDays: 3,
        listLimit: 5,
        autoOpen: false
    };

    let accountsDb = {};
    let productionOrders = [];
    let clients = [];
    let transactions = [];
    let products = [];
    let cashSales = [];
    let cashSession = createClosedSession();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const formatCurrency = amount => (Number(amount) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const todayKey = () => new Date().toISOString().split('T')[0];
    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));

    function createClosedSession() {
        return {
            isOpen: false,
            operator: '',
            openedAt: null,
            closedAt: null,
            initialAmount: 0,
            cashIn: 0,
            cashOut: 0,
            movements: []
        };
    }

    function normalizeNumber(value) {
        return Math.max(0, Number(value) || 0);
    }

    function loadJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.error(`Failed to load ${key}`, error);
            return fallback;
        }
    }

    function saveCashData() {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
        localStorage.setItem(CASH_SESSION_KEY, JSON.stringify(cashSession));
        localStorage.setItem(CASH_SALES_KEY, JSON.stringify(cashSales));
    }

    function loadData() {
        try {
            settings = { ...settings, ...loadJson(SETTINGS_KEY, {}) };
            accountsDb = loadJson('psyzon_accounts_db_v1', { accounts: [], monthly_records: {} });
            accountsDb.accounts = Array.isArray(accountsDb.accounts) ? accountsDb.accounts : [];
            accountsDb.monthly_records = accountsDb.monthly_records || {};
            productionOrders = loadJson('production_orders', []);
            clients = loadJson('clients', []);
            transactions = loadJson('transactions', []);
            products = loadJson(PRODUCTS_KEY, []);
            cashSession = { ...createClosedSession(), ...loadJson(CASH_SESSION_KEY, createClosedSession()) };
            cashSession.movements = Array.isArray(cashSession.movements) ? cashSession.movements : [];
            cashSales = loadJson(CASH_SALES_KEY, []);
            return true;
        } catch (error) {
            console.error('Failed to load data from localStorage', error);
            return false;
        }
    }

    function getTodaySales() {
        return cashSales.filter(sale => sale.date === todayKey());
    }

    function getCashBalance() {
        return cashSession.initialAmount + cashSession.cashIn - cashSession.cashOut;
    }

    function getOpenOrders() {
        return productionOrders.filter(order => order.status !== 'done');
    }

    function getLowStockProducts() {
        return products.filter(product => Number(product.stock) <= 2);
    }

    function getTodayAndTomorrowItems() {
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        const todayDay = today.getDate();
        const tomorrowDay = tomorrow.getDate();

        const dueBills = (accountsDb.accounts || [])
            .filter(acc => acc.due_day === todayDay || acc.due_day === tomorrowDay)
            .map(acc => {
                const record = accountsDb.monthly_records?.[monthKey]?.[acc.id];
                if (record?.status === 'pending' || !record) {
                    return {
                        type: 'bill',
                        name: acc.name,
                        amount: acc.amount,
                        due: acc.due_day === todayDay ? 'today' : 'tomorrow',
                        id: acc.id,
                        monthKey
                    };
                }
                return null;
            }).filter(Boolean);

        const dueOrders = productionOrders
            .filter(order => order.status !== 'done' && order.deadline)
            .map(order => {
                const deadline = new Date(`${order.deadline}T03:00:00`);
                if (deadline.getTime() === today.getTime() || deadline.getTime() === tomorrow.getTime()) {
                    return {
                        type: 'order',
                        name: order.description,
                        due: deadline.getTime() === today.getTime() ? 'today' : 'tomorrow',
                        id: order.id,
                        clientId: order.clientId
                    };
                }
                return null;
            }).filter(Boolean);

        return [...dueBills, ...dueOrders].sort((a, b) => {
            if (a.due < b.due) return -1;
            if (a.due > b.due) return 1;
            return (b.amount || 0) - (a.amount || 0);
        });
    }

    function getOrdersNeedingAction() {
        const actionDateLimit = new Date(today);
        actionDateLimit.setDate(today.getDate() + parseInt(settings.deadlineDays, 10));

        return productionOrders.filter(order => {
            if (order.status === 'done') return false;
            const deadline = new Date(`${order.deadline}T03:00:00`);
            if (deadline <= actionDateLimit) return true;
            return order.checklist && Object.values(order.checklist).some(task => !task.completed);
        });
    }

    function getPendingArts() {
        return productionOrders.filter(order => {
            if (order.status === 'done' || !order.artControl?.versions?.length) return false;
            const lastVersion = order.artControl.versions[order.artControl.versions.length - 1];
            return lastVersion.status === 'sent' || lastVersion.status === 'changes_requested';
        });
    }

    function getOverdueBills() {
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;

        return (accountsDb.accounts || []).map(acc => {
            const dueDate = new Date(year, month - 1, acc.due_day);
            if (dueDate < today) {
                const record = accountsDb.monthly_records?.[monthKey]?.[acc.id];
                if (record?.status === 'pending' || (!record && acc.type !== 'unique')) {
                    return {
                        id: acc.id,
                        name: acc.name,
                        amount: acc.amount,
                        dueDay: acc.due_day,
                        monthKey
                    };
                }
            }
            return null;
        }).filter(Boolean);
    }

    function calculateDailyGoal() {
        if (!settings.price || !settings.cost || settings.price <= settings.cost) {
            return { error: 'Configure preco medio e custo por peca para calcular a meta.' };
        }

        const marginPerPiece = settings.price - settings.cost;
        const monthlyExpenses = (accountsDb.accounts || [])
            .filter(acc => acc.type === 'fixed' || acc.type === 'installment')
            .reduce((sum, acc) => sum + acc.amount, 0);

        if (monthlyExpenses === 0) {
            return { error: 'Cadastre suas contas mensais fixas para calcular a meta.' };
        }

        let remainingDays = 0;
        const current = new Date(today);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        while (current <= endOfMonth) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) remainingDays++;
            current.setDate(current.getDate() + 1);
        }

        const monthlyGoalPieces = Math.ceil(monthlyExpenses / marginPerPiece);
        const dailyGoalPieces = Math.ceil(monthlyGoalPieces / Math.max(remainingDays, 1));

        return {
            pieces: dailyGoalPieces,
            revenue: dailyGoalPieces * settings.price,
            expenses: monthlyExpenses,
            margin: marginPerPiece
        };
    }

    function renderEmptyState(container, message, cta) {
        container.innerHTML = `<div class="text-center p-4 text-gray-500 text-sm">${message} ${cta ? `<br><button id="${cta.id || ''}" class="text-cyan-400 font-semibold">${cta.text}</button>` : ''}</div>`;
    }

    function renderList(container, items, renderItemFn) {
        if (items.length === 0) {
            renderEmptyState(container, 'Nenhum item encontrado.');
            return;
        }
        container.innerHTML = items.slice(0, settings.listLimit).map(renderItemFn).join('');
        if (items.length > settings.listLimit) {
            const seeAll = document.createElement('a');
            seeAll.href = '#';
            seeAll.className = 'block text-center text-cyan-400 text-xs font-semibold mt-2 p-1';
            seeAll.textContent = 'Ver tudo';
            container.appendChild(seeAll);
        }
    }

    function renderCashStatus() {
        const todaySales = getTodaySales();
        const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        const openOrders = getOpenOrders();
        const lowStock = getLowStockProducts();

        cashStatusDot.classList.toggle('is-open', cashSession.isOpen);
        cashStatusLabel.textContent = cashSession.isOpen ? `Caixa aberto por ${cashSession.operator || 'operador'}` : 'Caixa fechado';
        cashOperatorInput.value = cashSession.isOpen ? cashSession.operator : cashOperatorInput.value;
        cashInitialAmountInput.value = cashSession.isOpen ? cashSession.initialAmount : cashInitialAmountInput.value;
        openCashBtn.disabled = cashSession.isOpen;
        closeCashBtn.disabled = !cashSession.isOpen;

        cashBalanceValue.textContent = formatCurrency(getCashBalance());
        cashOpenedAt.textContent = cashSession.isOpen
            ? `Aberto em ${new Date(cashSession.openedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
            : 'Abra o caixa para vender';
        cashSalesValue.textContent = formatCurrency(todayTotal);
        cashSalesCount.textContent = `${todaySales.length} ${todaySales.length === 1 ? 'venda registrada' : 'vendas registradas'}`;
        cashProductsCount.textContent = products.length;
        cashStockAlert.textContent = lowStock.length
            ? `${lowStock.length} produto${lowStock.length > 1 ? 's' : ''} com estoque baixo`
            : products.length ? 'Estoque sem alerta critico' : 'Cadastre o primeiro produto';
        cashOrdersCount.textContent = openOrders.length;
        cashOrdersAlert.textContent = openOrders.length ? 'Acompanhe prazos e artes' : 'Sem pedidos pendentes';
    }

    function renderSaleSelect() {
        const availableProducts = products.filter(product => Number(product.stock) > 0);
        if (!availableProducts.length) {
            saleProductSelect.innerHTML = '<option value="">Cadastre produto com estoque</option>';
            renderSalePreview();
            return;
        }
        saleProductSelect.innerHTML = availableProducts.map(product => (
            `<option value="${product.id}">${escapeHtml(product.name)} - ${formatCurrency(product.price)} (${product.stock} un.)</option>`
        )).join('');
        renderSalePreview();
    }

    function renderSalePreview() {
        const product = products.find(item => item.id === saleProductSelect.value);
        if (!product) {
            salePreview.innerHTML = '<span>Selecione um produto para calcular a venda.</span>';
            return;
        }
        const quantity = Math.max(1, parseInt(saleQuantityInput.value, 10) || 1);
        const discount = normalizeNumber(saleDiscountInput.value);
        const subtotal = product.price * quantity;
        const total = Math.max(0, subtotal - discount);
        salePreview.innerHTML = `
            <span>Total previsto</span>
            <strong>${formatCurrency(total)}</strong>
            <small>${quantity} x ${formatCurrency(product.price)} ${discount ? `- ${formatCurrency(discount)} desc.` : ''}</small>
        `;
    }

    function renderRecentSales() {
        const recent = getTodaySales().slice(-5).reverse();
        if (!recent.length) {
            recentSalesList.innerHTML = '<div class="cash-empty">Nenhuma venda registrada hoje.</div>';
            return;
        }
        recentSalesList.innerHTML = recent.map(sale => `
            <div class="cash-list-item">
                <div>
                    <strong>${escapeHtml(sale.productName)}</strong>
                    <span>${sale.quantity} un. - ${escapeHtml(sale.paymentLabel)}</span>
                </div>
                <b>${formatCurrency(sale.total)}</b>
            </div>
        `).join('');
    }

    function renderProducts() {
        if (!products.length) {
            productsList.innerHTML = '<div class="cash-empty">Nenhum produto cadastrado.</div>';
            return;
        }
        productsList.innerHTML = products.slice().reverse().map(product => `
            <div class="cash-list-item">
                <div>
                    <strong>${escapeHtml(product.name)}</strong>
                    <span>${escapeHtml(product.sku || 'Sem SKU')} - ${escapeHtml(product.category || 'Sem categoria')}</span>
                </div>
                <div class="cash-list-actions">
                    <b>${formatCurrency(product.price)}</b>
                    <small>${product.stock} un.</small>
                    <button type="button" data-action="delete-product" data-id="${product.id}" class="action-button-sm">Excluir</button>
                </div>
            </div>
        `).join('');
    }

    function renderMovements() {
        const movements = cashSession.movements.slice(-5).reverse();
        if (!movements.length) {
            cashMovementsList.innerHTML = '<div class="cash-empty">Sem entradas ou sangrias nesta abertura.</div>';
            return;
        }
        cashMovementsList.innerHTML = movements.map(move => `
            <div class="cash-list-item">
                <div>
                    <strong>${move.type === 'in' ? 'Entrada' : 'Sangria'}</strong>
                    <span>${escapeHtml(move.note || 'Sem motivo')} - ${new Date(move.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <b class="${move.type === 'in' ? 'cash-positive' : 'cash-negative'}">${move.type === 'in' ? '+' : '-'} ${formatCurrency(move.amount)}</b>
            </div>
        `).join('');
    }

    function renderCashier() {
        renderCashStatus();
        renderSaleSelect();
        renderRecentSales();
        renderProducts();
        renderMovements();
    }

    function renderVencimentosCard() {
        renderList(vencimentosContent, getTodayAndTomorrowItems(), item => {
            const client = item.type === 'order' ? clients.find(c => c.id === item.clientId) : null;
            const isTomorrow = item.due === 'tomorrow';
            return `
                <div class="boss-card-list-item">
                    <div>
                        <p class="font-semibold">${escapeHtml(item.name)}</p>
                        <p class="text-xs ${isTomorrow ? 'text-yellow-400 font-bold' : 'text-gray-400'}">
                            ${item.type === 'bill' ? formatCurrency(item.amount) : escapeHtml(client?.name || '')} - Vence ${isTomorrow ? 'Amanha' : 'Hoje'}
                        </p>
                    </div>
                    ${item.type === 'bill'
                        ? `<button data-action="pay-bill" data-id="${item.id}" data-month="${item.monthKey}" class="action-button-sm">Pagar</button>`
                        : '<a href="processos.html" class="action-button-sm">Abrir</a>'
                    }
                </div>
            `;
        });
    }

    function renderContasAtrasoCard() {
        renderList(contasAtrasoContent, getOverdueBills(), item => `
            <div class="boss-card-list-item">
                <div>
                    <p class="font-semibold">${escapeHtml(item.name)}</p>
                    <p class="text-xs text-red-400">${formatCurrency(item.amount)} - Venceu dia ${item.dueDay}</p>
                </div>
                <button data-action="pay-bill" data-id="${item.id}" data-month="${item.monthKey}" class="action-button-sm bg-red-500/20 text-red-300">Pagar</button>
            </div>
        `);
    }

    function renderAcoesPedidosCard() {
        renderList(acoesPedidosContent, getOrdersNeedingAction(), item => {
            const client = clients.find(c => c.id === item.clientId);
            return `
                <div class="boss-card-list-item">
                    <div>
                        <p class="font-semibold">${escapeHtml(item.description)}</p>
                        <p class="text-xs text-gray-400">${escapeHtml(client?.name || 'Sem cliente')}</p>
                    </div>
                    <a href="processos.html" class="action-button-sm">Abrir</a>
                </div>
            `;
        });
    }

    function renderArtesPendentesCard() {
        renderList(artesPendentesContent, getPendingArts(), item => {
            const client = clients.find(c => c.id === item.clientId);
            return `
                <div class="boss-card-list-item">
                    <div>
                        <p class="font-semibold">${escapeHtml(item.description)}</p>
                        <p class="text-xs text-gray-400">${escapeHtml(client?.name || 'Sem cliente')}</p>
                    </div>
                    <a href="processos.html" class="action-button-sm">Abrir</a>
                </div>
            `;
        });
    }

    function renderMetaDiaCard() {
        const goal = calculateDailyGoal();
        if (goal.error) {
            renderEmptyState(metaDiaContent, goal.error, { text: 'Configurar agora', id: 'cta-config-goal' });
            const cta = el('cta-config-goal');
            if (cta) cta.onclick = event => {
                event.preventDefault();
                openSettings();
            };
            return;
        }
        metaDiaContent.innerHTML = `
            <p class="text-gray-400">Voce precisa vender hoje:</p>
            <p class="text-3xl font-bold text-cyan-400 my-1">${goal.pieces} ${goal.pieces > 1 ? 'pecas' : 'peca'}</p>
            <p class="text-gray-400">ou faturar <span class="font-semibold text-gray-300">${formatCurrency(goal.revenue)}</span></p>
        `;
    }

    function updateDashboard() {
        if (!loadData()) {
            if (initialLoader) initialLoader.textContent = 'Erro ao carregar dados.';
            return;
        }

        renderCashier();
        renderVencimentosCard();
        renderContasAtrasoCard();
        renderAcoesPedidosCard();
        renderArtesPendentesCard();
        renderMetaDiaCard();

        currentDateEl.textContent = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

        if (initialLoader) {
            initialLoader.style.opacity = '0';
            setTimeout(() => initialLoader.remove(), 300);
        }
    }

    function openSettings() {
        settingPriceInput.value = settings.price;
        settingCostInput.value = settings.cost;
        settingDeadlineDaysInput.value = settings.deadlineDays;
        settingListLimitInput.value = settings.listLimit;
        settingAutoOpenInput.checked = settings.autoOpen;
        settingsModal.classList.remove('hidden');
    }

    function closeSettings() {
        settingsModal.classList.add('hidden');
    }

    function saveSettings(event) {
        event.preventDefault();
        settings.price = normalizeNumber(settingPriceInput.value);
        settings.cost = normalizeNumber(settingCostInput.value);
        settings.deadlineDays = parseInt(settingDeadlineDaysInput.value, 10) || 3;
        settings.listLimit = parseInt(settingListLimitInput.value, 10) || 5;
        settings.autoOpen = settingAutoOpenInput.checked;

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        closeSettings();
        updateDashboard();
    }

    function openCash() {
        if (cashSession.isOpen) return;
        const operator = cashOperatorInput.value.trim() || 'Operador';
        cashSession = {
            ...createClosedSession(),
            isOpen: true,
            operator,
            openedAt: new Date().toISOString(),
            initialAmount: normalizeNumber(cashInitialAmountInput.value)
        };
        saveCashData();
        renderCashier();
    }

    function closeCash() {
        if (!cashSession.isOpen) return;
        cashSession.isOpen = false;
        cashSession.closedAt = new Date().toISOString();
        saveCashData();
        renderCashier();
    }

    function addProduct(event) {
        event.preventDefault();
        const name = productNameInput.value.trim();
        const price = normalizeNumber(productPriceInput.value);
        if (!name || price <= 0) {
            alert('Informe nome e preco validos.');
            return;
        }

        products.push({
            id: String(Date.now()),
            name,
            sku: productSkuInput.value.trim(),
            price,
            stock: parseInt(productStockInput.value, 10) || 0,
            category: productCategoryInput.value.trim(),
            createdAt: new Date().toISOString()
        });

        productForm.reset();
        productStockInput.value = 1;
        saveCashData();
        renderCashier();
    }

    function registerSale(event) {
        event.preventDefault();
        if (!cashSession.isOpen) {
            alert('Abra o caixa antes de registrar venda.');
            return;
        }

        const product = products.find(item => item.id === saleProductSelect.value);
        const quantity = Math.max(1, parseInt(saleQuantityInput.value, 10) || 1);
        if (!product) {
            alert('Selecione um produto cadastrado.');
            return;
        }
        if (product.stock < quantity) {
            alert('Estoque insuficiente para esta venda.');
            return;
        }

        const discount = normalizeNumber(saleDiscountInput.value);
        const subtotal = product.price * quantity;
        const total = Math.max(0, subtotal - discount);
        const paymentLabel = salePaymentSelect.options[salePaymentSelect.selectedIndex]?.textContent || salePaymentSelect.value;

        product.stock -= quantity;
        cashSales.push({
            id: String(Date.now()),
            date: todayKey(),
            createdAt: new Date().toISOString(),
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: product.price,
            discount,
            total,
            payment: salePaymentSelect.value,
            paymentLabel
        });

        if (salePaymentSelect.value === 'dinheiro') {
            cashSession.cashIn += total;
        }

        saleQuantityInput.value = 1;
        saleDiscountInput.value = 0;
        saveCashData();
        renderCashier();
    }

    function registerMovement(event) {
        event.preventDefault();
        if (!cashSession.isOpen) {
            alert('Abra o caixa antes de registrar movimentos.');
            return;
        }

        const amount = normalizeNumber(movementAmountInput.value);
        if (amount <= 0) {
            alert('Informe um valor valido.');
            return;
        }

        const type = movementTypeInput.value;
        if (type === 'in') cashSession.cashIn += amount;
        if (type === 'out') cashSession.cashOut += amount;

        cashSession.movements.push({
            id: String(Date.now()),
            type,
            amount,
            note: movementNoteInput.value.trim(),
            createdAt: new Date().toISOString()
        });

        movementForm.reset();
        saveCashData();
        renderCashier();
    }

    document.body.addEventListener('click', event => {
        const actionTarget = event.target.closest('[data-action]');
        const action = actionTarget?.dataset.action;
        if (!action) return;

        if (action === 'pay-bill') {
            const id = parseInt(actionTarget.dataset.id, 10);
            const monthKey = actionTarget.dataset.month;

            accountsDb.monthly_records[monthKey] = accountsDb.monthly_records[monthKey] || {};
            accountsDb.monthly_records[monthKey][id] = { status: 'paid', paid_date: todayKey() };

            const account = accountsDb.accounts.find(acc => acc.id === id);
            if (account && account.type === 'installment') {
                account.current_installment = Math.min(account.current_installment + 1, account.total_installments);
            }

            localStorage.setItem('psyzon_accounts_db_v1', JSON.stringify(accountsDb));
            updateDashboard();
        }

        if (action === 'delete-product') {
            const id = actionTarget.dataset.id;
            products = products.filter(product => product.id !== id);
            saveCashData();
            renderCashier();
        }
    });

    openSettingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    settingsForm.addEventListener('submit', saveSettings);
    openCashBtn.addEventListener('click', openCash);
    closeCashBtn.addEventListener('click', closeCash);
    productForm.addEventListener('submit', addProduct);
    saleForm.addEventListener('submit', registerSale);
    movementForm.addEventListener('submit', registerMovement);
    saleProductSelect.addEventListener('change', renderSalePreview);
    saleQuantityInput.addEventListener('input', renderSalePreview);
    saleDiscountInput.addEventListener('input', renderSalePreview);

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    }

    const handleCloudDataUpdated = () => updateDashboard();
    window.addEventListener('cloud-data-updated', handleCloudDataUpdated);
    window.addEventListener('cloud-data-refresh-requested', handleCloudDataUpdated);

    const checkBackend = setInterval(() => {
        if (window.BackendInitialized) {
            clearInterval(checkBackend);
            updateDashboard();
        }
    }, 100);

    setTimeout(() => {
        if (initialLoader && document.body.contains(initialLoader)) updateDashboard();
    }, 1200);
});
