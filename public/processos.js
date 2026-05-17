const init = () => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton) { mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('open')); }

    const addOrderBtn = document.getElementById('add-order-btn');
    const processTabButtons = Array.from(document.querySelectorAll('.process-tab-btn[data-tab]'));
    const processPanels = Array.from(document.querySelectorAll('.process-panel[data-panel]'));
    const urlParams = new URLSearchParams(window.location.search);
    let currentTab = urlParams.get('tab') || 'quadro';

    const columns = {
        todo: document.getElementById('column-todo'),
        doing: document.getElementById('column-doing'),
        done: document.getElementById('column-done')
    };
    const kanbanDeadlineFilter = document.getElementById('kanban-deadline-filter');

    const orderModal = document.getElementById('order-modal');
    const orderForm = document.getElementById('order-form');
    const orderModalTitle = document.getElementById('order-modal-title');
    const cancelOrderBtn = document.getElementById('cancel-order-btn');
    const orderDescriptionInput = document.getElementById('order-description');
    const orderClientSelect = document.getElementById('order-client');
    const orderClientSearchInput = document.getElementById('order-client-search');

    // Quick Add Client
    const quickAddClientBtn = document.getElementById('quick-add-client-btn');
    const quickClientModal = document.getElementById('quick-client-modal');
    const quickClientForm = document.getElementById('quick-client-form');
    const cancelQuickClientBtn = document.getElementById('cancel-quick-client-btn');
    const quickClientNameInput = document.getElementById('quick-client-name');
    const quickClientPhoneInput = document.getElementById('quick-client-phone');
    const quickClientInstagramInput = document.getElementById('quick-client-instagram');
    const orderDeadlineInput = document.getElementById('order-deadline');
    const orderClientContactInput = document.getElementById('order-client-contact');
    const orderChecklistContainer = document.getElementById('order-checklist');
    const orderNotesInput = document.getElementById('order-notes');
    const orderTotalValueInput = document.getElementById('order-total-value');
    const orderAmountPaidInput = document.getElementById('order-amount-paid');
    const orderIsPaidCheckbox = document.getElementById('order-is-paid');
    const cuttingDetailsSection = document.getElementById('cutting-details-section');
    const cuttingSubtasksContainer = document.getElementById('cutting-subtasks-container');
    const addCuttingItemBtn = document.getElementById('add-cutting-item-btn');
    // Novos elementos de corte/personalização
    const cuttingTotalBadge = document.getElementById('cutting-total-badge');
    const cuttingValidationMsg = document.getElementById('cutting-validation-msg');
    const hasPersonalizationCheckbox = document.getElementById('has-personalization');
    const personalizationContainer = document.getElementById('personalization-container');
    const personalizationNamesInput = document.getElementById('personalization-names');
    const namesCounter = document.getElementById('names-counter');
    const copyNamesBtn = document.getElementById('copy-names-btn');

    const tasksContainer = document.getElementById('tasks-container');
    const cuttingTasksContainer = document.getElementById('cutting-tasks-container');
    const finishingTasksContainer = document.getElementById('finishing-tasks-container');
    const ordersHistoryContainer = document.getElementById('orders-history-container');
    const cuttingModal = document.getElementById('cutting-modal');
    const cuttingModalTitle = document.getElementById('cutting-modal-title');
    const cuttingModalSubtitle = document.getElementById('cutting-modal-subtitle');
    const closeCuttingModalBtn = document.getElementById('close-cutting-modal-btn');
    const cuttingChecklistContainer = document.getElementById('cutting-checklist-container');
    const saveCutsBtn = document.getElementById('save-cuts-btn');
    const saveCutsFooterBtn = document.getElementById('save-cuts-footer-btn');
    const saveCutsQuickBtn = document.getElementById('save-cuts-quick-btn');
    const cuttingFooterTotal = document.getElementById('cutting-footer-total');
    const cuttingSnackbar = document.getElementById('cutting-snackbar');
    const cutDeleteConfirmModal = document.getElementById('cut-delete-confirm-modal');
    const cutDeleteConfirmBtn = document.getElementById('cut-delete-confirm-btn');
    const cutDeleteCancelBtn = document.getElementById('cut-delete-cancel-btn');
    const finishingModal = document.getElementById('finishing-modal');
    const finishingModalTitle = document.getElementById('finishing-modal-title');
    const finishingModalSubtitle = document.getElementById('finishing-modal-subtitle');
    const closeFinishingModalBtn = document.getElementById('close-finishing-modal-btn');
    const finishingModalBody = document.getElementById('finishing-modal-body');
    const orderPrintTypeSelect = document.getElementById('order-print-type');
    const orderColorsContainer = document.getElementById('order-colors-container');
    const addColorBtn = document.getElementById('add-color-btn');

    // Art Only Mode Refs
    const isArtOnlyCheckbox = document.getElementById('is-art-only');
    const artOnlyBlock = document.getElementById('art-only-block');
    const artOnlyImagesPreview = document.getElementById('art-only-images-preview');
    const artOnlyImageInput = document.getElementById('art-only-image-input');
    const addArtOnlyImageBtn = document.getElementById('add-art-only-image-btn');
    const paymentSection = document.getElementById('payment-section');
    const productionSection = document.getElementById('production-section');
    const printTypeSection = document.getElementById('print-type-section');
    const colorsSection = document.getElementById('colors-section');
    let activeArtOnlyImages = [];

    // printing UI / notes / conditional block
    const orderPrintingBlock = document.getElementById('order-printing-block');
    const orderDtfImageInput = document.getElementById('order-dtf-image-input');
    const orderAddDtfImageBtn = document.getElementById('order-add-dtf-image-btn');
    const orderPrintingImagesContainer = document.getElementById('order-printing-images');
    const orderPrintQuantityInput = document.getElementById('order-print-quantity');
    const orderPrintingNotesInput = document.getElementById('order-printing-notes');
    const checkAllDtfImagesBtn = document.getElementById('check-all-dtf-images-btn');
    const clearDtfImagesBtn = document.getElementById('clear-dtf-images-btn');
    let activeDtfImages = []; // temp storage while modal is open
    let cuttingSnackbarTimer = null;
    let pendingDeleteSubtaskId = null;
    const cutDebounceTimers = new Map();
    const expandedCutCards = new Set();
    let cuttingChecklistStatusFilter = 'all';
    let cuttingChecklistSearchFilter = '';
    let cuttingChecklistSizeFilter = 'all';
    let cuttingChecklistTypeFilter = 'all';
    let isCutSavePending = false;
    let activeFinishingOrderId = null;
    let finishingTypeFilter = 'all';
    let finishingSizeFilter = 'all';
    // toggle visibility of DTF block based on select
    const togglePrintingBlock = () => {
        if (!orderPrintingBlock || !orderPrintTypeSelect) return;
        if (orderPrintTypeSelect.value === 'dtf') orderPrintingBlock.classList.remove('hidden');
        else orderPrintingBlock.classList.add('hidden');
    };
    // attach change handler so block appears when user selects DTF
    if (orderPrintTypeSelect) orderPrintTypeSelect.addEventListener('change', togglePrintingBlock);
    // make sure block reflects initial state
    togglePrintingBlock();


    const copyTextSafe = async (textToCopy) => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            return true;
        } catch (_) {
            try {
                const temp = document.createElement('textarea');
                temp.value = textToCopy;
                temp.setAttribute('readonly', '');
                temp.style.position = 'fixed';
                temp.style.opacity = '0';
                document.body.appendChild(temp);
                temp.select();
                const ok = document.execCommand('copy');
                temp.remove();
                return ok;
            } catch (__) {
                return false;
            }
        }
    };

    const pickColorWithEyeDropper = async () => {
        if (!window.EyeDropper) {
            alert('EyeDropper API não disponível no seu navegador.');
            return null;
        }
        try {
            const eye = new EyeDropper();
            const result = await eye.open();
            return result?.sRGBHex ? result.sRGBHex.toUpperCase() : null;
        } catch (err) {
            console.warn('Eyedropper cancelado/falhou', err);
            return null;
        }
    };

    // Toggle Art Only Mode
    const toggleArtOnlyMode = () => {
        if (!isArtOnlyCheckbox) return;
        const isArt = isArtOnlyCheckbox.checked;
        const deadlineLabel = document.querySelector('label[for="order-deadline"]');

        if (isArt) {
            if (paymentSection) paymentSection.classList.add('hidden');
            if (productionSection) productionSection.classList.add('hidden');
            if (printTypeSection) printTypeSection.classList.add('hidden');
            if (colorsSection) colorsSection.classList.add('hidden');
            if (artOnlyBlock) artOnlyBlock.classList.remove('hidden');
            if (deadlineLabel) deadlineLabel.textContent = "Data de Entrega da Arte";
            // Disable required on hidden fields if any (total value is required)
            if (orderTotalValueInput) orderTotalValueInput.removeAttribute('required');
        } else {
            if (paymentSection) paymentSection.classList.remove('hidden');
            if (productionSection) productionSection.classList.remove('hidden');
            if (printTypeSection) printTypeSection.classList.remove('hidden');
            if (colorsSection) colorsSection.classList.remove('hidden');
            if (artOnlyBlock) artOnlyBlock.classList.add('hidden');
            if (deadlineLabel) deadlineLabel.textContent = "Prazo de Entrega";
            if (orderTotalValueInput) orderTotalValueInput.setAttribute('required', 'true');
        }
    };
    if (isArtOnlyCheckbox) isArtOnlyCheckbox.addEventListener('change', toggleArtOnlyMode);

    // Art Only Image Handlers
    const renderArtOnlyPreviews = () => {
        if (!artOnlyImagesPreview) return;
        artOnlyImagesPreview.innerHTML = '';
        activeArtOnlyImages.forEach((img, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'relative w-24 h-24 rounded overflow-hidden border border-white/10';
            const imageEl = document.createElement('img');
            imageEl.src = img;
            imageEl.className = 'w-full h-full object-cover';
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'absolute top-1 right-1 bg-black/60 text-white rounded px-1';
            del.innerHTML = '&times;';
            del.onclick = (e) => { e.stopPropagation(); activeArtOnlyImages.splice(idx, 1); renderArtOnlyPreviews(); };
            wrap.appendChild(imageEl);
            wrap.appendChild(del);
            artOnlyImagesPreview.appendChild(wrap);
        });
    };

    if (addArtOnlyImageBtn && artOnlyImageInput) {
        addArtOnlyImageBtn.addEventListener('click', () => artOnlyImageInput.click());
        artOnlyImageInput.addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    activeArtOnlyImages.push(ev.target.result);
                    renderArtOnlyPreviews();
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        });
    }

    const artTasksContainer = document.getElementById('art-tasks-container');
    const artModal = document.getElementById('art-modal');
    const artModalTitle = document.getElementById('art-modal-title');
    const closeArtModalBtn = document.getElementById('close-art-modal-btn');
    const artBriefingInput = document.getElementById('art-briefing');
    const artReferencesContainer = document.getElementById('art-references-container');
    const addArtImageBtn = document.getElementById('add-art-image-btn');
    const artImageInput = document.getElementById('art-image-input');
    // saveArtBtn removido da lógica antiga, agora usamos o controle de versões
    const saveArtBtn = document.getElementById('save-art-btn');

    let productionOrders = JSON.parse(localStorage.getItem('production_orders')) || [];
    const DONE_RETENTION_DAYS = 30;
    const DONE_RETENTION_MS = DONE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    let editingOrderId = null;
    let activeCuttingOrderId = null;
    let activeArtOrderId = null;

    window.disableRealtimePageReload = true;

    const syncProcessDataFromCloud = () => {
        productionOrders = JSON.parse(localStorage.getItem('production_orders')) || [];
        clients = JSON.parse(localStorage.getItem('clients')) || [];
        populateClientSelect();
        renderProcessBoard();
        applyDragScroll();
    };

    window.addEventListener('cloud-data-updated', syncProcessDataFromCloud);
    window.addEventListener('beforeunload', () => { window.disableRealtimePageReload = false; });

    // API interna da página
    window.PsyzonApp = {
        productionOrders,
        clients,
        saveOrders: () => saveOrders(),
        renderKanban: () => renderKanban(),
        renderTasks: () => renderTasks()
    };



    const getAuthenticatedUid = () => {
        try {
            return window.firebaseAuth?.currentUser?.()?.uid || '';
        } catch {
            return '';
        }
    };

    const checklistItems = { art: "Arte/Design Aprovado", mockup: "Mockup Aprovado", fabric: "Malha/Tecido Comprado", cutting: "Corte Realizado", sewing: "Costura Realizada", printing: "Estampa/Bordado Realizado", finishing: "Acabamento e Embalagem" };
    const sizeOptions = { adulto: ['PP', 'P', 'M', 'G', 'GG', 'EXG', 'G1', 'G2'], infantil: ['1 a 2 anos', '3 a 4 anos', '5 a 6 anos', '7 a 8 anos', '9 a 10 anos'] };

    const VALID_ART_STATUS = new Set(['em_criacao', 'ajuste_interno', 'finalizada']);
    const LEGACY_STATUS_MAP_V6 = {
        aprovada: 'finalizada',
        finalizada: 'finalizada',
        enviada: 'ajuste_interno',
        alteracoes_solicitadas: 'ajuste_interno',
        rascunho: 'em_criacao'
    };
    const normalizeText = (value) => String(value || '').trim();
    const sanitizeHtml = (value) => normalizeText(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const resolveArtVisualStatus = (status) => VALID_ART_STATUS.has(status) ? status : 'em_criacao';
    const migrateOrderStatusToV6 = (order) => {
        if (!order || typeof order !== 'object') return false;
        if (order.schemaVersion === 6 || order.migratedToV6 === true) return false;

        let changed = false;
        const current = normalizeText(order?.art?.status);
        if (!VALID_ART_STATUS.has(current)) {
            if (!order.art || typeof order.art !== 'object') {
                order.art = order.art || {};
                changed = true;
            }
            if (!current) {
                order.art.status = 'em_criacao';
                changed = true;
            } else if (LEGACY_STATUS_MAP_V6[current]) {
                order.art.status = LEGACY_STATUS_MAP_V6[current];
                changed = true;
            }
        }

        order.schemaVersion = 6;
        order.migratedToV6 = true;
        return true;
    };
    const applyArtChecklistStatusConsistency = (order, nextStatus) => {
        if (!order?.checklist?.art) return;
        if (nextStatus === 'finalizada') {
            order.checklist.art.completed = true;
            order.checklist.art.completedAt = Date.now();
            return;
        }
        if (nextStatus === 'em_criacao' || nextStatus === 'ajuste_interno') {
            order.checklist.art.completed = false;
            order.checklist.art.completedAt = null;
        }
    };
    const categoryIcons = {
        art: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>`,
        mockup: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`,
        fabric: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>`,
        cutting: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121M12 12l2.879 2.879M12 12L9.121 14.879M12 12L14.879 9.121M4 4h.01M4 10h.01M4 16h.01M10 4h.01M16 4h.01M10 10h.01M10 16h.01M16 10h.01M16 16h.01" /></svg>`,
        sewing: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>`,
        printing: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>`,
        finishing: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`
    };

    const enableDragScroll = (el) => {
        let isDown = false;
        let startX;
        let scrollLeft;
        el.addEventListener('mousedown', (e) => {
            isDown = true;
            el.classList.add('active');
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
            el.style.cursor = 'grabbing';
        });
        el.addEventListener('mouseleave', () => {
            isDown = false;
            el.classList.remove('active');
            el.style.cursor = 'grab';
        });
        el.addEventListener('mouseup', () => {
            isDown = false;
            el.classList.remove('active');
            el.style.cursor = 'grab';
        });
        el.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX) * 2;
            el.scrollLeft = scrollLeft - walk;
        });
        el.style.cursor = 'grab';
    };

    const applyDragScroll = () => {
        document.querySelectorAll('.overflow-x-auto').forEach(el => {
            if (!el.dataset.dragScroll) {
                enableDragScroll(el);
                el.dataset.dragScroll = 'true';
            }
        });
    };

    // Refresh views on save
    const normalizeHistoryFlags = () => {
        const now = Date.now();
        productionOrders.forEach((order) => {
            if (order.status === 'done') {
                if (!order.completedAt) order.completedAt = now;
                const age = now - Number(order.completedAt || now);
                if (age > DONE_RETENTION_MS) order.inHistory = true;
            }
        });
    };

    normalizeHistoryFlags();
    productionOrders.forEach((order) => {
        migrateOrderStatusToV6(order);
    });
    localStorage.setItem('production_orders', JSON.stringify(productionOrders));

    const saveOrders = () => {
        normalizeHistoryFlags();
        localStorage.setItem('production_orders', JSON.stringify(productionOrders));
        // Mantém o quadro sincronizado quando alterações acontecem em outras abas (Cortes/Artes/DTF)
        renderProcessBoard();
        applyDragScroll();
    };
    const formatCurrency = (amount) => amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const validTabs = new Set(['quadro', 'afazeres', 'artes', 'cortes', 'finalizacao', 'dtf', 'historico-pedidos']);
    if (!validTabs.has(currentTab)) currentTab = 'quadro';

    const renderProcessBoard = () => {
        switch (currentTab) {
            case 'afazeres':
                renderTasks();
                break;
            case 'artes':
                renderArtTasks();
                break;
            case 'cortes':
                renderCuttingTasks();
                break;
            case 'finalizacao':
                renderFinishingTasks();
                break;
            case 'dtf':
                renderDTFTasks();
                break;
            case 'historico-pedidos':
                renderOrdersHistory();
                break;
            case 'quadro':
            default:
                renderKanban();
                break;
        }
    };

    const setActiveTab = (tabName) => {
        if (!validTabs.has(tabName)) return;
        currentTab = tabName;
        localStorage.setItem('processos_tab', currentTab);

        processTabButtons.forEach((btn) => {
            const active = btn.dataset.tab === tabName;
            btn.classList.toggle('active-tab', active);
            btn.setAttribute('aria-selected', String(active));
        });

        processPanels.forEach((panel) => {
            const active = panel.dataset.panel === tabName;
            panel.classList.toggle('active', active);
            panel.classList.toggle('hidden', !active);
        });

        renderProcessBoard();
    };

    processTabButtons.forEach((btn) => {
        btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
    });

    const populateClientSelect = () => {
        clients = JSON.parse(localStorage.getItem('clients')) || [];
        orderClientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        if (orderClientSearchInput) orderClientSearchInput.value = '';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            orderClientSelect.appendChild(option);
        });
    };

    if (orderClientSearchInput) {
        orderClientSearchInput.addEventListener('input', () => {
            const term = orderClientSearchInput.value.toLowerCase();
            Array.from(orderClientSelect.options).forEach(opt => {
                if (!opt.value) return;
                opt.style.display = opt.textContent.toLowerCase().includes(term) ? '' : 'none';
            });
        });
    }

    if (quickAddClientBtn && quickClientModal && quickClientForm && cancelQuickClientBtn) {
        quickAddClientBtn.addEventListener('click', () => {
            quickClientModal.classList.remove('hidden');
            quickClientNameInput.focus();
        });

        cancelQuickClientBtn.addEventListener('click', () => {
            quickClientModal.classList.add('hidden');
            quickClientForm.reset();
        });

        quickClientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const clientName = quickClientNameInput.value.trim();
            if (!clientName) return;

            let phoneStr = quickClientPhoneInput.value.trim();
            const instaStr = quickClientInstagramInput.value.trim();
            if (instaStr && !phoneStr) {
                phoneStr = instaStr;
            } else if (instaStr && phoneStr) {
                phoneStr = phoneStr + " " + instaStr;
            }

            const newClient = {
                id: Date.now(),
                name: clientName,
                gender: "not_informed",
                phone: phoneStr,
                email: "",
                totalIncome: 0,
                netProfit: 0
            };

            clients = JSON.parse(localStorage.getItem('clients')) || [];
            clients.push(newClient);
            localStorage.setItem('clients', JSON.stringify(clients));

            populateClientSelect(); // Refresh list to include new client

            // Auto-select the newly created client
            orderClientSelect.value = newClient.id.toString();

            quickClientModal.classList.add('hidden');
            quickClientForm.reset();
        });
    }

    const renderChecklist = (checklistData = {}) => {
        orderChecklistContainer.innerHTML = '';
        for (const key in checklistItems) {
            const task = checklistData[key] || { completed: false, deadline: '' };
            const isDisabled = key === 'cutting' ? 'disabled' : '';
            const itemHtml = `<div class="flex items-center gap-3 bg-white/5 p-2 rounded-md hover:bg-white/10"><input type="checkbox" data-key="${key}" class="checklist-item-status w-5 h-5 rounded text-cyan-500" ${task.completed ? 'checked' : ''} ${isDisabled}><label class="flex-1 text-white">${checklistItems[key]}</label><input type="date" data-key="${key}" value="${task.deadline || ''}" class="checklist-item-deadline bg-white/10 p-1 rounded-md text-xs"></div>`;
            orderChecklistContainer.innerHTML += itemHtml;
        }
    };

    const openModal = (orderId = null) => {
        editingOrderId = orderId;
        populateClientSelect();
        orderForm.reset();
        cuttingSubtasksContainer.innerHTML = '';
        cuttingDetailsSection.classList.remove('hidden');
        // reset DTF temp
        activeDtfImages = [];
        if (orderPrintingImagesContainer) orderPrintingImagesContainer.innerHTML = '';
        if (orderPrintQuantityInput) orderPrintQuantityInput.value = '';
        // reset Art Only temp
        activeArtOnlyImages = [];
        // reset Personalization
        if (hasPersonalizationCheckbox) hasPersonalizationCheckbox.checked = false;
        if (personalizationContainer) personalizationContainer.classList.add('hidden');
        if (personalizationNamesInput) personalizationNamesInput.value = '';

        if (artOnlyImagesPreview) artOnlyImagesPreview.innerHTML = '';
        if (isArtOnlyCheckbox) isArtOnlyCheckbox.checked = false;

        if (orderId) {
            const order = productionOrders.find(o => o.id === orderId);
            orderModalTitle.textContent = "Editar Pedido";
            orderDescriptionInput.value = order.description;
            orderClientSelect.value = order.clientId;
            orderDeadlineInput.value = order.deadline;
            orderNotesInput.value = order.notes || '';
            if (orderClientContactInput) orderClientContactInput.value = order.clientContact || '';
            orderTotalValueInput.value = order.totalValue || '';
            orderAmountPaidInput.value = order.amountPaid || '';
            orderIsPaidCheckbox.checked = order.isPaid || false;
            renderChecklist(order.checklist);

            const cuttingTask = order.checklist && order.checklist.cutting;
            if (cuttingTask) {
                if (cuttingTask.subtasks) cuttingTask.subtasks.forEach(sub => renderCuttingSubtask(sub));
                // Carregar Personalização
                if (cuttingTask.personalization) {
                    if (hasPersonalizationCheckbox) {
                        hasPersonalizationCheckbox.checked = cuttingTask.personalization.hasNames;
                        if (cuttingTask.personalization.hasNames) personalizationContainer.classList.remove('hidden');
                    }
                    if (personalizationNamesInput) personalizationNamesInput.value = cuttingTask.personalization.names || '';
                }
            }
            updateCuttingTotals(); // Atualiza validação inicial

            orderPrintTypeSelect.value = order.printType || 'dtf';
            renderColors(order.colors || []);
            // load printing data if present
            if (order.printing && Array.isArray(order.printing.images)) {
                activeDtfImages = order.printing.images.slice();
                renderOrderPrintingPreviews(activeDtfImages);
            }
            if (order.printing && typeof order.printing.total !== 'undefined') {
                orderPrintQuantityInput.value = order.printing.total;
            }
            if (order.printing && typeof order.printing.notes !== 'undefined' && orderPrintingNotesInput) {
                orderPrintingNotesInput.value = order.printing.notes;
            }
            // Art Only check
            if (order.isArtOnly) {
                if (isArtOnlyCheckbox) isArtOnlyCheckbox.checked = true;
                if (order.art && order.art.images) activeArtOnlyImages = order.art.images.slice();
                renderArtOnlyPreviews();
            }

            // ensure DTF block visibility
            togglePrintingBlock();
        } else {
            if (orderClientContactInput) orderClientContactInput.value = '';
            orderModalTitle.textContent = "Novo Pedido de Produção";
            const defaultChecklist = Object.keys(checklistItems).reduce((acc, key) => ({ ...acc, [key]: { completed: false, deadline: '' } }), {});
            renderChecklist(defaultChecklist);
            orderPrintTypeSelect.value = 'dtf';
            renderColors([]);
            activeDtfImages = [];
            if (orderPrintingImagesContainer) orderPrintingImagesContainer.innerHTML = '';
            if (orderPrintQuantityInput) orderPrintQuantityInput.value = '';
            if (orderPrintingNotesInput) orderPrintingNotesInput.value = '';
            togglePrintingBlock();
        }
        toggleArtOnlyMode(); // Apply visibility based on checkbox state
        orderModal.classList.remove('hidden');
        // Adicione aqui:
        const cancelBtn = document.getElementById('cancel-order-btn');
        if (cancelBtn) {
            cancelBtn.onclick = function (e) {
                e.preventDefault();
                closeModal();
            };
        }
    };

    const closeModal = () => {
        orderModal.classList.add('hidden');
        editingOrderId = null;
    };

    // --- NOVA LÓGICA DE CORTES (MINI-CARDS) ---
    const renderCuttingSubtask = (subtask = {}) => {
        const subtaskId = subtask.id || Date.now() + Math.random();
        const item = document.createElement('div');
        item.className = 'cut-item-card';
        item.dataset.subtaskId = subtaskId;

        const genders = ['Feminina', 'Masculina', 'Infantil'];
        const variations = ['Normal', 'Babylook', 'Oversized', 'Regata', 'Manga Longa', 'Gola Polo'];

        // Compatibilidade com dados antigos
        const currentGender = subtask.gender || (genders.includes(subtask.type) ? subtask.type : 'Masculina');
        const currentVariation = subtask.variation || subtask.style || 'Normal';

        const isInfantil = currentGender === 'Infantil';
        const currentSizeList = isInfantil ? sizeOptions.infantil : sizeOptions.adulto;

        item.innerHTML = `
            <div class="cut-header grid grid-cols-3 gap-2">
                <select class="subtask-gender cut-select">${genders.map(g => `<option ${currentGender === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
                <select class="subtask-size cut-select">${currentSizeList.map(s => `<option ${subtask.size === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
                <select class="subtask-variation cut-select">${variations.map(v => `<option ${currentVariation === v ? 'selected' : ''}>${v}</option>`).join('')}</select>
            </div>
            <div class="mt-2 flex items-center gap-2">
                <input type="color" class="subtask-color-picker w-10 h-10 p-0 border-0" value="${isHex(subtask.color) ? subtask.color.toUpperCase() : '#000000'}" title="Selecionar cor do corte">
                <input type="text" class="subtask-color-hex cut-inline-input !w-28" value="${isHex(subtask.color) ? subtask.color.toUpperCase() : ''}" placeholder="#RRGGBB">
                <button type="button" class="subtask-eye-dropper-btn px-2 py-1 rounded bg-white/5 text-xs" title="Capturar cor da tela"><span class="syt-img-icon tiny icon-target" aria-hidden="true"></span></button>
            </div>
            <div class="flex items-center justify-between mt-2">
                <div class="qty-control">
                    <button type="button" class="qty-btn minus">-</button>
                    <input type="number" class="subtask-total qty-input" value="${subtask.total || 0}" min="0">
                    <button type="button" class="qty-btn plus">+</button>
                </div>
                <div class="cut-actions flex gap-3 text-xs">
                    <button type="button" class="dup-btn text-cyan-400">Duplicar</button>
                    <button type="button" class="del-btn text-red-400">Excluir</button>
                </div>
            </div>
            <input type="text" class="subtask-notes w-full mt-2 bg-transparent border-b border-white/10 text-xs text-gray-400 focus:border-cyan-500 outline-none" placeholder="Observação (ex: Gola Polo)" value="${subtask.notes || ''}">
        `;

        // Event Listeners do Card
        const qtyInput = item.querySelector('.subtask-total');
        const colorPickerInput = item.querySelector('.subtask-color-picker');
        const colorHexInput = item.querySelector('.subtask-color-hex');
        item.querySelector('.plus').onclick = () => { qtyInput.value = parseInt(qtyInput.value || 0) + 1; updateCuttingTotals(); };
        item.querySelector('.minus').onclick = () => { qtyInput.value = Math.max(0, parseInt(qtyInput.value || 0) - 1); updateCuttingTotals(); };
        qtyInput.oninput = updateCuttingTotals;

        colorPickerInput.oninput = () => {
            colorHexInput.value = (colorPickerInput.value || '').toUpperCase();
        };
        colorHexInput.oninput = () => {
            let value = (colorHexInput.value || '').trim();
            if (value && !value.startsWith('#')) value = `#${value}`;
            value = value.toUpperCase();
            colorHexInput.value = value;
            if (isHex(value)) colorPickerInput.value = value;
        };
        item.querySelector('.subtask-eye-dropper-btn').onclick = async () => {
            const pickedColor = await pickColorWithEyeDropper();
            if (!pickedColor) return;
            colorHexInput.value = pickedColor;
            colorPickerInput.value = pickedColor;
        };

        item.querySelector('.del-btn').onclick = () => {
            if (confirm('Excluir este item de corte?')) { item.remove(); updateCuttingTotals(); }
        };

        item.querySelector('.dup-btn').onclick = () => {
            const cloneData = {
                gender: item.querySelector('.subtask-gender').value,
                size: item.querySelector('.subtask-size').value,
                variation: item.querySelector('.subtask-variation').value,
                color: item.querySelector('.subtask-color-hex').value,
                total: parseInt(qtyInput.value),
                notes: item.querySelector('.subtask-notes').value
            };
            renderCuttingSubtask(cloneData);
            updateCuttingTotals();
        };

        // Atualiza tamanhos ao mudar gênero
        item.querySelector('.subtask-gender').onchange = (e) => {
            const sel = e.target.value;
            const sizeSel = item.querySelector('.subtask-size');
            const list = sel === 'Infantil' ? sizeOptions.infantil : sizeOptions.adulto;
            const currentSize = sizeSel.value;
            sizeSel.innerHTML = list.map(s => `<option ${currentSize === s ? 'selected' : ''}>${s}</option>`).join('');
        };

        cuttingSubtasksContainer.appendChild(item);
        updateCuttingTotals();
    };

    // Validação e Totais
    const updateCuttingTotals = () => {
        let totalCuts = 0;
        document.querySelectorAll('.subtask-total').forEach(inp => totalCuts += parseInt(inp.value || 0));

        if (cuttingTotalBadge) cuttingTotalBadge.textContent = `Total: ${totalCuts}`;

        // Validação com Total do Pedido (se houver campo de qtd total de impressão ou se for calculado)
        // Como o sistema original não tinha um campo "Total do Pedido" explícito além do printing.total, vamos usar esse ou criar um alerta visual apenas.
        // O prompt pede validação. Vamos assumir que o usuário deve preencher o total em algum lugar ou que a soma É o total.
        // Se houver nomes, validamos nomes vs totalCuts.

        if (personalizationNamesInput) {
            const names = personalizationNamesInput.value.split('\n').filter(l => l.trim() !== '');
            const namesCount = names.length;
            if (namesCounter) {
                namesCounter.textContent = `${namesCount} nomes / ${totalCuts} peças`;
                namesCounter.className = namesCount === totalCuts ? 'text-green-400 font-bold' : 'text-red-400 font-bold';
            }
        }
    };

    // Listeners antigos removidos ou adaptados
    cuttingSubtasksContainer.addEventListener('change', (e) => {
        // atualiza lista de tamanhos quando trocar gênero (Feminina/Masculina/Infantil)
        if (e.target.classList.contains('subtask-gender')) {
            const selectedType = e.target.value;
            const sizeSelect = e.target.closest('.grid').querySelector('.subtask-size');
            const newSizeList = selectedType === 'Infantil' ? sizeOptions.infantil : sizeOptions.adulto;
            sizeSelect.innerHTML = newSizeList.map(s => `<option>${s}</option>`).join('');
        }
    });

    addCuttingItemBtn.addEventListener('click', () => renderCuttingSubtask());

    // Personalização Listeners
    if (hasPersonalizationCheckbox) {
        hasPersonalizationCheckbox.addEventListener('change', () => {
            personalizationContainer.classList.toggle('hidden', !hasPersonalizationCheckbox.checked);
        });
    }
    if (personalizationNamesInput) {
        personalizationNamesInput.addEventListener('input', updateCuttingTotals);
    }
    if (copyNamesBtn) {
        copyNamesBtn.addEventListener('click', () => {
            if (personalizationNamesInput) {
                copyTextSafe(personalizationNamesInput.value).then((ok) => alert(ok ? 'Lista copiada!' : 'Não foi possível copiar a lista.'));
            }
        });
    }

    // --- FIX: Listeners que estavam faltando ---
    if (addOrderBtn) addOrderBtn.addEventListener('click', () => openModal());

    // DTF Image Handlers (Order Modal)
    if (orderAddDtfImageBtn && orderDtfImageInput) {
        orderAddDtfImageBtn.addEventListener('click', () => orderDtfImageInput.click());
        orderDtfImageInput.addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    activeDtfImages.push(ev.target.result);
                    renderOrderPrintingPreviews(activeDtfImages);
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        });
    }
    if (clearDtfImagesBtn) {
        clearDtfImagesBtn.addEventListener('click', () => {
            activeDtfImages = [];
            renderOrderPrintingPreviews(activeDtfImages);
        });
    }

    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentEditingOrder = editingOrderId
                ? productionOrders.find(o => o.id === editingOrderId)
                : null;
            const currentEditingSubtasks = currentEditingOrder?.checklist?.cutting?.subtasks || [];

            const checklist = {};
            document.querySelectorAll('.checklist-item-status').forEach(item => {
                const key = item.dataset.key;
                const deadlineInput = document.querySelector(`.checklist-item-deadline[data-key="${key}"]`);
                checklist[key] = { completed: item.checked, deadline: deadlineInput.value || null };
            });

            const subtasks = [];
            cuttingSubtasksContainer.querySelectorAll('.cut-item-card').forEach(row => {
                const totalInput = row.querySelector('.subtask-total');
                if (totalInput && totalInput.value) {
                    const existingSubtask = currentEditingSubtasks.find(s => s.id == row.dataset.subtaskId);
                    subtasks.push({
                        id: parseFloat(row.dataset.subtaskId) || Date.now() + Math.random(),
                        gender: row.querySelector('.subtask-gender').value,
                        variation: row.querySelector('.subtask-variation').value,
                        color: row.querySelector('.subtask-color-hex').value,
                        size: row.querySelector('.subtask-size').value,
                        total: parseInt(totalInput.value) || 0,
                        cut: existingSubtask ? existingSubtask.cut : 0,
                        notes: row.querySelector('.subtask-notes').value
                    });
                }
            });

            checklist.cutting = checklist.cutting || {};
            checklist.cutting.completed = subtasks.length === 0;
            checklist.cutting.subtasks = subtasks;
            // Salvar Personalização
            checklist.cutting.personalization = {
                hasNames: hasPersonalizationCheckbox ? hasPersonalizationCheckbox.checked : false,
                names: personalizationNamesInput ? personalizationNamesInput.value : ''
            };

            // coleta cores dos inputs reais (hex text inputs ou compatíveis)
            const colors = orderColorsContainer
                ? Array.from(orderColorsContainer.querySelectorAll('.color-hex, .color-input'))
                    .map(i => (i.value || '').trim())
                    .filter(v => v)
                : [];

            const isArtOnly = isArtOnlyCheckbox ? isArtOnlyCheckbox.checked : false;

            const orderData = {
                description: orderDescriptionInput.value,
                clientId: parseInt(orderClientSelect.value) || null,
                deadline: orderDeadlineInput.value,
                checklist: checklist,
                notes: orderNotesInput.value.trim(),
                clientContact: orderClientContactInput ? orderClientContactInput.value.trim() : '',
                totalValue: parseFloat(orderTotalValueInput.value) || 0,
                amountPaid: parseFloat(orderAmountPaidInput.value) || 0,
                isPaid: orderIsPaidCheckbox.checked,
                printType: isArtOnly ? 'art' : (orderPrintTypeSelect ? orderPrintTypeSelect.value : 'dtf'),
                isArtOnly: isArtOnly,
                // shirtType removido conforme solicitado
                colors: colors,
                printing: {
                    images: activeDtfImages.slice(),
                    total: parseInt(orderPrintQuantityInput?.value) || (checklist.printing && checklist.printing.total ? parseInt(checklist.printing.total) : 0),
                    notes: orderPrintingNotesInput ? (orderPrintingNotesInput.value || '').trim() : ''
                }
            };

            if (isArtOnly) {
                orderData.art = {
                    images: activeArtOnlyImages.slice()
                }
            };
            if (editingOrderId) {
                const orderIndex = productionOrders.findIndex(o => o.id === editingOrderId);
                productionOrders[orderIndex] = { ...productionOrders[orderIndex], ...orderData };
            } else {
                const newOrder = { id: Date.now(), status: 'todo', ...orderData };
                productionOrders.push(newOrder);

                // HOOK HIPOCAMPO: Pedido Criado
            }
            saveOrders();
            renderKanban();
            renderArtTasks();
            closeModal();
        });
    }

    // --- KANBAN MOBILE TABS LOGIC ---
    const mobileTabs = document.querySelectorAll('.mobile-kanban-tab');
    const columnWrappers = {
        'column-todo': document.getElementById('wrapper-todo'),
        'column-doing': document.getElementById('wrapper-doing'),
        'column-done': document.getElementById('wrapper-done')
    };

    mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            mobileTabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked
            tab.classList.add('active');

            // Hide all columns on mobile
            Object.values(columnWrappers).forEach(wrapper => {
                if (wrapper) wrapper.classList.remove('active-mobile-view');
            });

            // Show target column
            const targetId = tab.dataset.target;
            if (columnWrappers[targetId]) columnWrappers[targetId].classList.add('active-mobile-view');
        });
    });

    const createOrderCard = (order) => {
        const client = clients.find(c => c.id === order.clientId);
        const card = document.createElement('div');
        // Adicionada a classe syt-process-card para o novo estilo
        const borderClass = order.isArtOnly ? 'border-l-4 border-purple-500' : 'border-l-4 border-cyan-500';
        card.className = `kanban-card syt-process-card is-collapsed ${borderClass}`;
        card.setAttribute('draggable', false);
        card.dataset.id = order.id;

        // --- Cálculos ---
        // Data
        const deadline = new Date(order.deadline + "T03:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = deadline - today;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // Progresso do Processo
        const totalTasks = order.checklist ? Object.keys(order.checklist).length : 0;
        const completedTasks = order.checklist ? Object.values(order.checklist).filter(task => task.completed).length : 0;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Financeiro
        const total = order.totalValue || 0;
        const paid = order.amountPaid || 0;
        const due = Math.max(0, total - paid);
        const paidPercent = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
        const isPaymentDone = total > 0 && due <= 0.01;
        const paymentStatusText = isPaymentDone ? 'Pagamento concluído' : 'Pagamento pendente';
        const paymentStatusClass = isPaymentDone ? 'is-paid' : 'is-pending';

        // --- Badges e Textos ---
        let deadlineText = `${diffDays} dias`;
        if (diffDays < 0) { deadlineText = `${Math.abs(diffDays)}d atrasado`; }
        else if (diffDays === 0) { deadlineText = `Hoje`; }
        else if (diffDays === 1) { deadlineText = `Amanhã`; }

        // --- Estrutura HTML do Novo Card ---
        card.innerHTML = `
            <div class="syt-card-header">
                <div class="syt-card-title-block">
                    <h3 class="syt-card-title">${order.description}</h3>
                    <p class="syt-card-client">${client ? client.name : 'Sem cliente'}</p>
                    <p class="syt-card-deadline">Entrega: ${deadlineText}</p>
                </div>
                <div class="syt-header-actions">
                    <button class="syt-collapse-btn" title="Abrir/fechar card" aria-label="Abrir ou fechar detalhes" aria-expanded="false">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                    <button onclick="event.stopPropagation(); window.openOrderModal(${order.id})" class="syt-edit-btn" title="Editar Pedido">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                    </button>
                    <button onclick="event.stopPropagation(); window.removeOrder(${order.id})" class="syt-edit-btn syt-delete-btn" title="Deletar Card">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m-9 0v14a1 1 0 001 1h8a1 1 0 001-1V6"/><path stroke-linecap="round" stroke-linejoin="round" d="M10 11v6M14 11v6"/></svg>
                    </button>
                </div>
            </div>

            <div class="syt-card-body">
            <div class="syt-badges-row">
                <span class="syt-pill syt-pill-tech">${order.printType ? order.printType.toUpperCase() : 'N/A'}</span>
                <span class="syt-pill syt-pill-pay ${paymentStatusClass}">${paymentStatusText.toUpperCase()}</span>
                <span class="syt-pill syt-pill-deadline">${deadlineText}</span>
            </div>

            <div class="syt-card-meta-grid" aria-label="Resumo do pedido">
                <section>
                    <div class="syt-payment-block">
                        <div class="syt-block-header">
                            <span class="label">Financeiro</span>
                            <span class="value">${paidPercent.toFixed(0)}%</span>
                        </div>
                        <div class="syt-payment-details">
                            <div class="syt-payment-chip"><span>Total</span> <strong>${total > 0 ? formatCurrency(total) : '—'}</strong></div>
                            <div class="syt-payment-chip"><span>Pago</span> <strong>${formatCurrency(paid)}</strong></div>
                            <div class="syt-payment-chip"><span>Falta</span> <strong class="due">${formatCurrency(due)}</strong></div>
                        </div>
                        <div class="syt-payment-progress"><div class="syt-progress-bar-bg"><div class="syt-progress-bar-fg" style="width: ${paidPercent}%"></div></div></div>
                    </div>

                    <div class="syt-payment-status ${paymentStatusClass}">
                        <span class="syt-status-dot"></span>
                        <span>${paymentStatusText}</span>
                    </div>
                </section>

                <section class="syt-meta-item syt-meta-progress">
                    <div class="syt-block-header">
                        <span class="label">Produção</span>
                        <span class="value">${Math.round(progress)}%</span>
                    </div>
                    <div class="syt-progress-bar-sm-bg">
                        <div class="syt-progress-bar-sm-fg" style="width: ${progress}%"></div>
                    </div>
                </section>
            </div>

            <div class="flex flex-wrap gap-2 mt-3">
                ${order.status === 'todo' ? `<button class="syt-action-btn secondary" onclick="event.stopPropagation(); window.moveOrderStatus(${order.id}, 'doing')">Transferir para Andamento</button>` : ''}
                ${order.status === 'doing' ? `<button class="syt-action-btn secondary" onclick="event.stopPropagation(); window.moveOrderStatus(${order.id}, 'done')">Transferir para Concluído</button>` : ''}
                ${order.status === 'done' ? `<button class="syt-action-btn secondary" onclick="event.stopPropagation(); window.transferDoneToHistory(${order.id})">Transferir concluído para Histórico</button>` : ''}
            </div>

            <div class="syt-card-footer">
                <button class="syt-action-btn primary" onclick="event.stopPropagation(); window.openOrderModal(${order.id})">Receber pagamento</button>
                <button class="syt-action-btn secondary" onclick="event.stopPropagation(); window.openOrderModal(${order.id})">Ver detalhes <span aria-hidden="true">→</span></button>
            </div>
            </div>
        `;

        const setCollapsedState = (collapsed) => {
            card.classList.toggle('is-collapsed', collapsed);
            const collapseBtn = card.querySelector('.syt-collapse-btn');
            if (collapseBtn) {
                collapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            }
        };

        setCollapsedState(true);

        const toggleCard = () => {
            const isCollapsed = card.classList.contains('is-collapsed');
            setCollapsedState(!isCollapsed);
        };

        card.addEventListener('click', (event) => {
            if (event.target.closest('button,a,input,select,textarea,label')) return;
            toggleCard();
        });

        const collapseBtn = card.querySelector('.syt-collapse-btn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleCard();
            });
        }

        return card;
    };

    window.removeOrder = (orderId) => {
        if (confirm('Tem certeza que deseja excluir permanentemente este card/pedido?')) {
            productionOrders = productionOrders.filter(o => o.id !== orderId);
            saveOrders();
            renderKanban();
        }
    };

    window.openOrderModal = (orderId) => openModal(orderId);

    const moveOrderStatus = (orderId, newStatus) => {
        const order = productionOrders.find((item) => item.id === Number(orderId));
        if (!order || order.status === newStatus) return;
        order.status = newStatus;
        if (newStatus === 'done') {
            order.completedAt = Date.now();
            order.inHistory = false;
        } else {
            order.completedAt = null;
            order.sentToHistoryAt = null;
            order.inHistory = false;
        }
        saveOrders();
        renderKanban();
        if (currentTab === 'historico-pedidos') renderOrdersHistory();
    };

    window.moveOrderStatus = (orderId, newStatus) => moveOrderStatus(orderId, newStatus);

    const transferDoneToHistory = (orderId) => {
        const order = productionOrders.find((item) => item.id === Number(orderId));
        if (!order || order.status !== 'done') return;
        order.inHistory = true;
        order.sentToHistoryAt = Date.now();
        saveOrders();
        renderKanban();
        if (currentTab === 'historico-pedidos') renderOrdersHistory();
    };

    window.transferDoneToHistory = (orderId) => transferDoneToHistory(orderId);

    const getOrderDeadlineDate = (order) => {
        if (!order?.deadline) return null;
        const date = new Date(`${order.deadline}T00:00:00`);
        if (Number.isNaN(date.getTime())) return null;
        return date;
    };

    const filterOrdersByDeadlineMode = (orders, mode) => {
        if (!mode || mode === 'all') return orders;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return orders.filter((order) => {
            const deadlineDate = getOrderDeadlineDate(order);
            if (mode === 'no-deadline') return !deadlineDate;
            if (!deadlineDate) return false;

            const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000);
            if (mode === 'overdue') return diffDays < 0;
            if (mode === 'today') return diffDays === 0;
            if (mode === 'next7') return diffDays >= 0 && diffDays <= 7;
            if (mode === 'future') return diffDays > 7;
            return true;
        });
    };

    const sortOrdersByNearestDeadline = (orders) => [...orders].sort((a, b) => {
        const dateA = getOrderDeadlineDate(a);
        const dateB = getOrderDeadlineDate(b);

        if (!dateA && !dateB) return Number(a.id || 0) - Number(b.id || 0);
        if (!dateA) return 1;
        if (!dateB) return -1;

        if (dateA.getTime() === dateB.getTime()) return Number(a.id || 0) - Number(b.id || 0);
        return dateA - dateB;
    });

    const renderKanban = () => {
        Object.values(columns).forEach(col => { if (col) col.innerHTML = ''; });

        // --- Filtro de URL (ex: vindo do Dashboard "A Receber") ---
        const urlParams = new URLSearchParams(window.location.search);
        const filterMode = urlParams.get('filter');

        // --- Botão Limpar Filtro (Melhoria de UX) ---
        const headerTitle = document.querySelector('h1');
        let clearBtn = document.getElementById('clear-filter-btn');

        if (filterMode === 'receivables') {
            if (!clearBtn && headerTitle) {
                clearBtn = document.createElement('button');
                clearBtn.id = 'clear-filter-btn';
                clearBtn.className = 'ml-4 text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded hover:bg-red-500/30 transition-colors align-middle';
                clearBtn.textContent = 'Limpar filtro (A Receber)';
                clearBtn.onclick = () => { window.history.replaceState({}, document.title, window.location.pathname); renderKanban(); };
                headerTitle.appendChild(clearBtn);
            }
        } else if (clearBtn) { clearBtn.remove(); }

        const quadroFilterMode = kanbanDeadlineFilter?.value || 'all';
        const filteredOrders = productionOrders.filter(order => {
            if (filterMode === 'receivables') {
                const total = order.totalValue || 0;
                const paid = order.amountPaid || 0;
                const pending = total - paid;
                if (order.isPaid || pending <= 0.01) return false;
            }
            if (order.status === 'done' && order.inHistory) return false;
            return true;
        });

        const orderedCards = sortOrdersByNearestDeadline(filterOrdersByDeadlineMode(filteredOrders, quadroFilterMode));

        orderedCards.forEach(order => {
            if (columns[order.status]) {
                const card = createOrderCard(order);
                columns[order.status].appendChild(card);
            }
        });

        // Update Mobile Tab Badges
        const counts = { todo: 0, doing: 0, done: 0 };
        productionOrders.forEach(o => {
            if (o.status === 'done' && o.inHistory) return;
            if (counts[o.status] !== undefined) counts[o.status]++;
        });

        mobileTabs.forEach(tab => {
            const target = tab.dataset.target.replace('column-', '');
            const label = target === 'todo' ? 'A Fazer' : (target === 'doing' ? 'Em Andamento' : 'Concluído');
            tab.textContent = `${label} (${counts[target]})`;
        });
    };

    if (kanbanDeadlineFilter) {
        kanbanDeadlineFilter.addEventListener('change', () => {
            if (currentTab === 'quadro') renderKanban();
        });
    }


    const renderOrdersHistory = () => {
        if (!ordersHistoryContainer) return;
        const doneOrders = [...productionOrders]
            .filter(order => order.status === 'done' && order.inHistory)
            .sort((a, b) => Number(b.sentToHistoryAt || b.completedAt || b.id) - Number(a.sentToHistoryAt || a.completedAt || a.id));

        if (doneOrders.length === 0) {
            ordersHistoryContainer.innerHTML = '<div class="glass-card p-6 text-center text-gray-400">Nenhum pedido concluído no histórico ainda.</div>';
            return;
        }

        ordersHistoryContainer.innerHTML = doneOrders.map((order) => {
            const client = clients.find((c) => c.id === order.clientId);
            const total = order.totalValue || 0;
            const paid = order.amountPaid || 0;
            const finishedAt = new Date(Number(order.sentToHistoryAt || order.completedAt || order.id)).toLocaleDateString('pt-BR');
            return `
                <div class="glass-card p-4 border border-green-500/20">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                            <h3 class="text-lg font-bold text-white">${order.description}</h3>
                            <p class="text-sm text-cyan-300">${client ? client.name : 'Sem cliente'}</p>
                        </div>
                        <span class="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Concluído</span>
                    </div>
                    <div class="mt-3 text-sm text-gray-300 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <p><strong>Entrega:</strong> ${order.deadline ? new Date(order.deadline + 'T03:00:00').toLocaleDateString('pt-BR') : '—'}</p>
                        <p><strong>Total:</strong> ${formatCurrency(total)}</p>
                        <p><strong>Pago:</strong> ${formatCurrency(paid)}</p>
                    </div>
                    <p class="mt-2 text-xs text-gray-400">Registrado no histórico em ${finishedAt}.</p>
                </div>
            `;
        }).join('');
    };


    const dragState = {
        card: null,
        pointerId: null,
        pointerType: null,
        originColumn: null,
        ghost: null,
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        activeColumn: null,
        autoScrollRaf: null,
        autoScrollVelocity: 0,
        hasBodyLock: false
    };

    const dragListeners = [];

    const addDragListener = (target, eventName, handler, options) => {
        target.addEventListener(eventName, handler, options);
        dragListeners.push({ target, eventName, handler, options });
    };

    const removeDragListeners = () => {
        while (dragListeners.length) {
            const { target, eventName, handler, options } = dragListeners.pop();
            target.removeEventListener(eventName, handler, options);
        }
    };

    const clearColumnHighlights = () => {
        document.querySelectorAll('.kanban-column').forEach((column) => {
            column.classList.remove('drag-over', 'bg-white/5', 'bg-white/10');
        });
        dragState.activeColumn = null;
    };

    const stopAutoScroll = () => {
        if (dragState.autoScrollRaf) {
            cancelAnimationFrame(dragState.autoScrollRaf);
            dragState.autoScrollRaf = null;
        }
        dragState.autoScrollVelocity = 0;
    };

    const runAutoScroll = () => {
        if (!dragState.isDragging) {
            stopAutoScroll();
            return;
        }

        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const topZone = 80;
        const bottomZone = 120;
        const maxSpeed = 22;
        let velocity = 0;

        if (dragState.currentY <= topZone) {
            const intensity = Math.min(1, (topZone - dragState.currentY) / topZone);
            velocity = -Math.max(1, intensity * maxSpeed);
        } else if (dragState.currentY >= viewportHeight - bottomZone) {
            const intensity = Math.min(1, (dragState.currentY - (viewportHeight - bottomZone)) / bottomZone);
            velocity = Math.max(1, intensity * maxSpeed);
        }

        dragState.autoScrollVelocity = velocity;
        if (velocity !== 0) {
            window.scrollBy(0, velocity);
        }

        dragState.autoScrollRaf = requestAnimationFrame(runAutoScroll);
    };

    const updateColumnHighlight = (x, y) => {
        clearColumnHighlights();
        const target = document.elementFromPoint(x, y);
        const column = target ? target.closest('.kanban-column') : null;
        if (column) {
            column.classList.add('drag-over');
            dragState.activeColumn = column;
        }
    };

    const moveGhost = (x, y) => {
        if (!dragState.ghost) return;
        dragState.ghost.style.left = `${x - (dragState.ghost.offsetWidth / 2)}px`;
        dragState.ghost.style.top = `${y - (dragState.ghost.offsetHeight / 2)}px`;
    };

    const cleanupDrag = ({ shouldDrop = false } = {}) => {
        const card = dragState.card;

        if (shouldDrop && dragState.isDragging && card) {
            const dropTarget = document.elementFromPoint(dragState.currentX, dragState.currentY);
            const dropColumn = dropTarget ? dropTarget.closest('.kanban-column') : null;

            if (dropColumn) {
                const newStatus = dropColumn.id.replace('column-', '');
                const orderId = Number(card.dataset.id);
                const order = productionOrders.find((item) => item.id === orderId);
                if (order && order.status !== newStatus) {
                    order.status = newStatus;
                    saveOrders();
                    renderKanban();
                    if (navigator.vibrate) navigator.vibrate([40]);
                }
            }
        }

        stopAutoScroll();
        removeDragListeners();
        clearColumnHighlights();

        if (dragState.ghost) {
            dragState.ghost.remove();
            dragState.ghost = null;
        }

        if (card) {
            card.classList.remove('kanban-card-dragging', 'opacity-30');
            card.style.userSelect = '';
            card.style.touchAction = '';
            if (dragState.pointerId !== null && card.hasPointerCapture?.(dragState.pointerId)) {
                try { card.releasePointerCapture(dragState.pointerId); } catch (_) { }
            }
        }

        if (dragState.hasBodyLock) {
            document.body.classList.remove('is-dragging-kanban');
            dragState.hasBodyLock = false;
        }

        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.style.cursor = '';

        dragState.card = null;
        dragState.pointerId = null;
        dragState.pointerType = null;
        dragState.originColumn = null;
        dragState.isDragging = false;
        dragState.startX = 0;
        dragState.startY = 0;
        dragState.currentX = 0;
        dragState.currentY = 0;
    };

    const startDragging = () => {
        const card = dragState.card;
        if (!card || dragState.isDragging) return;

        dragState.isDragging = true;
        if (navigator.vibrate && dragState.pointerType !== 'mouse') navigator.vibrate(25);

        card.classList.add('kanban-card-dragging');
        card.style.userSelect = 'none';
        card.style.touchAction = 'none';

        const rect = card.getBoundingClientRect();
        const ghost = card.cloneNode(true);
        ghost.classList.add('kanban-card-ghost');
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        document.body.appendChild(ghost);
        dragState.ghost = ghost;

        moveGhost(dragState.currentX, dragState.currentY);
        document.body.classList.add('is-dragging-kanban');
        dragState.hasBodyLock = true;
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.cursor = 'grabbing';

        stopAutoScroll();
        dragState.autoScrollRaf = requestAnimationFrame(runAutoScroll);
        updateColumnHighlight(dragState.currentX, dragState.currentY);
    };

    const handlePointerMove = (event) => {
        if (!dragState.card || event.pointerId !== dragState.pointerId) return;

        dragState.currentX = event.clientX;
        dragState.currentY = event.clientY;

        if (!dragState.isDragging) {
            const deltaX = Math.abs(event.clientX - dragState.startX);
            const deltaY = Math.abs(event.clientY - dragState.startY);
            const activationDistance = dragState.pointerType === 'mouse' ? 5 : 10;
            if (deltaX >= activationDistance || deltaY >= activationDistance) {
                startDragging();
            }
        }

        if (!dragState.isDragging) return;
        if (event.cancelable) event.preventDefault();

        moveGhost(event.clientX, event.clientY);
        updateColumnHighlight(event.clientX, event.clientY);
    };

    const handlePointerEnd = (event) => {
        if (!dragState.card || event.pointerId !== dragState.pointerId) return;
        dragState.currentX = event.clientX;
        dragState.currentY = event.clientY;
        cleanupDrag({ shouldDrop: true });
    };

    const handlePointerCancel = (event) => {
        if (!dragState.card || event.pointerId !== dragState.pointerId) return;
        cleanupDrag({ shouldDrop: false });
    };

    const handlePointerDown = (event) => {
        const card = event.target.closest('.kanban-card');
        if (!card) return;
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        if (event.target.closest('button, a, input, textarea, select, label, .btn-action')) return;

        cleanupDrag({ shouldDrop: false });

        dragState.card = card;
        dragState.pointerId = event.pointerId;
        dragState.pointerType = event.pointerType || 'mouse';
        dragState.originColumn = card.closest('.kanban-column');
        dragState.startX = event.clientX;
        dragState.startY = event.clientY;
        dragState.currentX = event.clientX;
        dragState.currentY = event.clientY;

        card.setPointerCapture?.(event.pointerId);

        addDragListener(window, 'pointermove', handlePointerMove, { passive: false });
        addDragListener(window, 'pointerup', handlePointerEnd, { passive: false });
        addDragListener(window, 'pointercancel', handlePointerCancel, { passive: false });
        addDragListener(window, 'blur', () => cleanupDrag({ shouldDrop: false }));
        addDragListener(window, 'pagehide', () => cleanupDrag({ shouldDrop: false }));
        addDragListener(card, 'lostpointercapture', () => cleanupDrag({ shouldDrop: false }));
    };

    if (window.matchMedia('(min-width: 768px)').matches) {
        document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    }
    // Duplicate checkPrefillData function removed to fix redeclaration error.

    const renderTasks = () => {
        tasksContainer.innerHTML = '';
        const allTasks = [];
        productionOrders.forEach(order => {
            if (order.status !== 'done' && order.checklist) {
                for (const key in order.checklist) {
                    if (checklistItems[key]) {
                        const task = order.checklist[key];
                        if (!task.completed && task.deadline) {
                            allTasks.push({ orderId: order.id, taskKey: key, description: order.description, clientId: order.clientId, taskName: checklistItems[key], deadline: task.deadline });
                        }
                    }
                }
            }
        });
        const dueSoonFilter = urlParams.get('filter') === 'due2days';
        const visibleTasks = dueSoonFilter
            ? allTasks.filter((task) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const deadline = new Date(`${task.deadline}T00:00:00`);
                const diff = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
                // Allow diff <= 2 to include negative values (overdue tasks)
                return Number.isFinite(diff) && diff <= 2;
            })
            : allTasks;

        // Sort tasks by nearest deadline first
        visibleTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        const groupedTasks = visibleTasks.reduce((acc, task) => {
            const groupName = task.taskName;
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(task);
            return acc;
        }, {});

        if (visibleTasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'glass-card p-10 flex flex-col items-center justify-center text-center text-gray-400 w-full min-h-[300px] md:col-span-2 xl:col-span-3 border border-white/5';
            emptyState.innerHTML = `<svg class="w-16 h-16 mb-4 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"/></svg><p class="text-lg font-medium text-white/50">${dueSoonFilter ? 'Nenhuma tarefa vencendo em até 2 dias ou atrasada.' : 'Nenhuma tarefa pendente encontrada.'}</p><p class="text-sm mt-2 text-white/30">Bom trabalho! Tudo está em dia.</p>`;
            tasksContainer.appendChild(emptyState);
            return;
        }

        for (const groupKey in checklistItems) {
            const groupName = checklistItems[groupKey];
            if (groupedTasks[groupName]) {
                const tasks = groupedTasks[groupName];
                const card = document.createElement('div');
                card.className = 'glass-card flex flex-col overflow-hidden border border-white/10 shadow-xl bg-gray-900/50 backdrop-blur-md';
                let tasksHTML = tasks.map(task => {
                    const client = clients.find(c => c.id === task.clientId);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const deadlineDate = new Date(`${task.deadline}T00:00:00`);
                    const isOverdue = deadlineDate < today;
                    let borderClass = isOverdue ? 'border-red-500' : 'border-cyan-500/50';
                    let textClass = isOverdue ? 'text-red-400/80' : 'text-cyan-300/80';
                    let bgClass = isOverdue ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-white/5 hover:bg-white/10';
                    let alertHtml = isOverdue ? '<span class="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 px-2 py-0.5 rounded ml-2 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse"><svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Atrasado</span>' : '';

                    return `<div class="group flex flex-col justify-between p-4 border-l-4 ${borderClass} ${bgClass} transition-colors duration-200 cursor-pointer border-b border-white/5 last:border-0 relative overflow-hidden">
                        ${isOverdue ? '<div class="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>' : ''}
                        <label class="flex items-start gap-3 cursor-pointer w-full relative z-10">
                            <input type="checkbox" data-order-id="${task.orderId}" data-task-key="${task.taskKey}" class="task-checkbox mt-0.5 w-5 h-5 rounded ${isOverdue ? 'text-red-500 focus:ring-red-600 border-red-500/30 bg-red-500/10' : 'text-cyan-500 focus:ring-cyan-600 bg-gray-800 border-gray-600'} transition-all cursor-pointer">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center flex-wrap gap-y-1">
                                    <p class="font-bold text-sm text-gray-100 ${isOverdue ? 'text-red-100' : 'group-hover:text-white'} transition-colors truncate">${task.description}</p>
                                    ${alertHtml}
                                </div>
                                <p class="text-xs ${textClass} mt-1 font-medium flex items-center gap-1.5 w-full truncate">
                                    <svg class="w-3 h-3 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <span class="truncate">${client ? client.name : 'Cliente não encontrado'}</span>
                                </p>
                            </div>
                        </label>
                        <div class="mt-3 flex items-center text-[11px] font-medium tracking-wide ${isOverdue ? 'text-red-400' : 'text-gray-400'} ml-8">
                            <svg class="w-3.5 h-3.5 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            ${new Date(task.deadline + 'T03:00:00').toLocaleDateString('pt-BR')}
                        </div>
                    </div>`;
                }).join('');
                card.innerHTML = `<div class="p-4 bg-gradient-to-r from-gray-800 to-gray-800/50 border-b border-white/10 flex items-center justify-between"><div class="flex items-center gap-3"><div class="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg shadow-inner ring-1 ring-cyan-500/30">${categoryIcons[groupKey]}</div><h2 class="text-base font-bold text-white tracking-wide uppercase">${groupName}</h2></div><span class="flex items-center justify-center bg-gray-900 border border-white/10 text-cyan-400 font-bold text-xs h-7 w-7 rounded-full shadow-inner">${tasks.length}</span></div><div class="flex flex-col divide-y divide-white/5">${tasksHTML}</div>`;
                tasksContainer.appendChild(card);
            }
        }
    };

    if (tasksContainer) {
        tasksContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const checkbox = e.target;
                const orderId = parseInt(checkbox.dataset.orderId);
                const taskKey = checkbox.dataset.taskKey;
                const order = productionOrders.find(o => o.id === orderId);
                if (order && order.checklist[taskKey]) {
                    order.checklist[taskKey].completed = checkbox.checked;
                    saveOrders();
                    renderTasks();
                }
            }
        });
    }

    const renderCuttingTasks = () => {
        cuttingTasksContainer.innerHTML = '';

        const getOrderCardHtml = (order) => {
            const client = clients.find(c => c.id === order.clientId);
            const subtasks = order.checklist.cutting.subtasks || [];
            const totalToCut = subtasks.reduce((acc, sub) => acc + sub.total, 0);
            const totalCut = subtasks.reduce((acc, sub) => acc + sub.cut, 0);

            const colors = order.colors || [];
            const colorsHtml = colors.map(c => {
                const safeBg = /^#([0-9A-F]{3}){1,2}$/i.test(c.trim()) ? `background:${c}` : '';
                return `<div class="flex items-center gap-2"><div class="w-6 h-6 rounded-sm border" style="${safeBg}"></div><span class="text-xs text-gray-300">${c}</span></div>`;
            }).join('');

            return `
                <article class="glass-card p-4 flex flex-col gap-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold">${order.description}</p>
                            <p class="text-sm text-cyan-300">${client ? client.name : 'Cliente'}</p>
                            <p class="text-xs text-gray-400">Prazo: ${order.deadline ? new Date(order.deadline + "T03:00:00").toLocaleDateString('pt-BR') : ''}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold">${totalCut} / ${totalToCut}</p>
                            <p class="text-xs text-gray-400">Peças Cortadas</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-3 items-center">
                        ${colorsHtml || '<span class="text-xs text-gray-500">Sem cores definidas</span>'}
                    </div>
                    <div class="flex justify-end">
                        <button data-order-id="${order.id}" class="open-checklist-btn btn-shine py-2 px-4 rounded-lg text-sm">Abrir Checklist</button>
                    </div>
                </article>
            `;
        };

        const cutOrders = productionOrders.filter(order =>
            !order.isArtOnly &&
            order.status !== 'done' &&
            !order.inHistory &&
            order.checklist &&
            order.checklist.cutting
        );
        const pendingCutOrders = cutOrders.filter(order => !order.checklist.cutting.completed);
        const completedCutOrders = cutOrders.filter(order => order.checklist.cutting.completed);

        if (cutOrders.length === 0) {
            cuttingTasksContainer.innerHTML = '<div class="glass-card p-6 text-center text-gray-400">Nenhuma tarefa de corte encontrada.</div>';
            return;
        }

        const buildSection = (title, subtitle, orders, toneClass = '') => {
            const section = document.createElement('section');
            section.className = `cutting-board-row ${toneClass}`.trim();
            const cardsHtml = orders.length
                ? orders.map(getOrderCardHtml).join('')
                : '<div class="glass-card p-4 text-sm text-gray-400">Nenhum pedido nesta fileira.</div>';
            section.innerHTML = `
                <header class="cutting-board-row-head">
                    <div>
                        <h3>${title}</h3>
                        <p>${subtitle}</p>
                    </div>
                    <span class="task-badge">${orders.length}</span>
                </header>
                <div class="cutting-board-row-grid">${cardsHtml}</div>
            `;
            return section;
        };

        cuttingTasksContainer.appendChild(buildSection('Cortando agora', 'Pedidos que ainda estão em andamento.', pendingCutOrders));
        cuttingTasksContainer.appendChild(buildSection('Corte concluído', 'Pedidos finalizados (você ainda pode editar).', completedCutOrders, 'is-completed'));
    };

    if (cuttingTasksContainer) {
        cuttingTasksContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('open-checklist-btn')) {
                openCuttingModal(parseInt(e.target.dataset.orderId));
            }
        });
    }

    const buildFinishingVerificationEntries = (order) => {
        const subtasks = order?.checklist?.cutting?.subtasks || [];
        const entries = [];

        subtasks.forEach((subtask) => {
            const total = Math.max(parseInt(subtask.total || 0, 10) || 0, 0);
            for (let i = 0; i < total; i += 1) {
                entries.push({
                    size: String(subtask.size || '-').trim() || '-',
                    color: String(subtask.colorName || subtask.color || '-').trim() || '-',
                    type: String(subtask.variation || subtask.gender || subtask.age || '-').trim() || '-'
                });
            }
        });

        return entries;
    };

    const normalizeFinishingVerification = (order) => {
        const entries = buildFinishingVerificationEntries(order);
        const raw = order.finishingVerification || {};
        const rawItems = Array.isArray(raw.items) ? raw.items : [];

        const items = entries.map((entry, index) => {
            const current = rawItems[index] || {};
            return {
                ...entry,
                personName: String(current.personName || '').trim(),
                isOk: !!current.isOk
            };
        });

        return { items };
    };

    const getUniqueValues = (list = []) => Array.from(new Set(list.map((v) => String(v || '-').trim() || '-'))).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const renderFinishingVerificationRows = (orderId, verification) => {
        const allItems = verification.items || [];
        const sizeOptions = getUniqueValues(allItems.map((item) => item.size));
        const typeOptions = getUniqueValues(allItems.map((item) => item.type));

        const filtered = allItems.filter((item) => {
            if (finishingSizeFilter !== 'all' && item.size !== finishingSizeFilter) return false;
            if (finishingTypeFilter !== 'all' && item.type !== finishingTypeFilter) return false;
            return true;
        });

        const options = (vals, selected) => [`<option value="all">Todos</option>`, ...vals.map((v) => `<option value="${sanitizeHtml(v)}" ${v === selected ? 'selected' : ''}>${sanitizeHtml(v)}</option>`)].join('');

        const rows = filtered.length ? filtered.map((item, index) => {
            const originalIndex = allItems.indexOf(item);
            return `
            <div class="finishing-verification-item">
              <div class="finishing-verification-meta">
                <span><strong>TAM:</strong> ${sanitizeHtml(item.size)}</span>
                <span><strong>Cor:</strong> ${sanitizeHtml(item.color)}</span>
                <span><strong>Tipo:</strong> ${sanitizeHtml(item.type)}</span>
              </div>
              <label class="finishing-name-label" for="finish-name-${orderId}-${originalIndex}">Nome</label>
              <input id="finish-name-${orderId}-${originalIndex}" type="text" class="finishing-name-input" value="${sanitizeHtml(item.personName)}" placeholder="Digite o nome da pessoa" data-action="edit-finish-name" data-order-id="${orderId}" data-item-index="${originalIndex}">
              <label><input type="checkbox" data-action="toggle-finish-ok" data-order-id="${orderId}" data-item-index="${originalIndex}" ${item.isOk ? 'checked' : ''}> Tudo OK</label>
            </div>`;
        }).join('') : '<div class="glass-card p-4 text-sm text-gray-300">Nenhuma peça encontrada para os filtros selecionados.</div>';

        return `
            <section class="cutting-section-card">
              <div class="cutting-section-head"><h3>Filtros</h3><span class="cutting-status-chip">${filtered.length}/${allItems.length}</span></div>
              <div class="finishing-filter-grid">
                <label>
                  <span>Tamanho</span>
                  <select data-action="finishing-filter-size" class="cut-filter-search">${options(sizeOptions, finishingSizeFilter)}</select>
                </label>
                <label>
                  <span>Tipo</span>
                  <select data-action="finishing-filter-type" class="cut-filter-search">${options(typeOptions, finishingTypeFilter)}</select>
                </label>
              </div>
            </section>
            <div class="finishing-verification-list">${rows}</div>
        `;
    };

    const renderFinishingModal = (orderId) => {
        if (!finishingModal || !finishingModalBody) return;
        const order = productionOrders.find((item) => item.id === orderId);
        if (!order) return;

        activeFinishingOrderId = orderId;
        const verification = normalizeFinishingVerification(order);
        order.finishingVerification = verification;

        const client = clients.find(c => c.id === order.clientId);
        finishingModalTitle.textContent = `Finalização: ${order.description}`;
        finishingModalSubtitle.textContent = `${client ? client.name : 'Cliente'} • ${verification.items.length} peça(s)`;

        const totalOk = verification.items.filter((item) => item.isOk).length;
        finishingModalBody.innerHTML = `
            <section class="cutting-section-card">
                <div class="cutting-section-head"><h3>Status</h3><span class="cutting-status-chip ${totalOk === verification.items.length && verification.items.length ? 'is-ok' : ''}">${totalOk}/${verification.items.length}</span></div>
                <p class="text-sm ${totalOk === verification.items.length && verification.items.length ? 'text-green-300' : 'text-cyan-200'}">${totalOk === verification.items.length && verification.items.length ? 'Tudo certo! Todas as peças estão com Tudo OK.' : 'Marque Tudo OK nas peças para concluir a finalização.'}</p>
            </section>
            ${renderFinishingVerificationRows(order.id, verification)}
        `;

        finishingModal.classList.remove('hidden');
    };

    const closeFinishingModal = () => {
        activeFinishingOrderId = null;
        if (finishingModal) finishingModal.classList.add('hidden');
    };

    const renderFinishingTasks = () => {
        if (!finishingTasksContainer) return;
        finishingTasksContainer.innerHTML = '';

        const getOrderReadiness = (order) => {
            const checklist = order?.checklist || {};
            const total = Object.keys(checklistItems).length;
            let done = 0;
            Object.keys(checklistItems).forEach((key) => {
                if (checklist[key]?.completed) done += 1;
            });

            const subtasks = checklist?.cutting?.subtasks || [];
            const totalCut = subtasks.reduce((acc, item) => acc + (parseInt(item.total || 0, 10) || 0), 0);
            const cutDone = subtasks.reduce((acc, item) => acc + (parseInt(item.cut || 0, 10) || 0), 0);
            const hasCutting = subtasks.length > 0;
            const cuttingDone = hasCutting && totalCut > 0 && cutDone >= totalCut;
            const dtfDone = order.printType !== 'dtf' || !!order?.printing?.completed;
            const verification = normalizeFinishingVerification(order);
            const totalVerificationItems = verification.items.length;
            const doneVerificationItems = verification.items.filter((item) => item.isOk).length;
            const verificationReady = totalVerificationItems > 0 && doneVerificationItems === totalVerificationItems;
            const ready = done === total && cuttingDone && dtfDone && verificationReady;

            return { done, total, totalCut, cutDone, hasCutting, cuttingDone, dtfDone, verification, totalVerificationItems, doneVerificationItems, verificationReady, ready };
        };

        const activeOrders = productionOrders.filter((order) => !order.isArtOnly && order.status !== 'done' && !order.inHistory);

        if (!activeOrders.length) {
            finishingTasksContainer.innerHTML = '<div class="glass-card p-6 text-center text-gray-400">Nenhum pedido ativo para validar na finalização.</div>';
            return;
        }

        const rows = activeOrders.map((order) => ({ order, readiness: getOrderReadiness(order) }));
        const pending = rows.filter((row) => !row.readiness.ready);
        const readyRows = rows.filter((row) => row.readiness.ready);

        const section = (title, subtitle, list, emptyText, tone = '') => {
            const shell = document.createElement('section');
            shell.className = `finishing-board-row ${tone}`.trim();
            shell.innerHTML = `
                <header class="finishing-board-row-head">
                    <div>
                        <h3>${title}</h3>
                        <p>${subtitle}</p>
                    </div>
                    <span class="task-badge">${list.length}</span>
                </header>
                <div class="finishing-board-row-grid">
                    ${list.length ? list.map(({ order, readiness }) => {
                        const client = clients.find(c => c.id === order.clientId);
                        const deadline = order.deadline ? new Date(order.deadline + 'T03:00:00').toLocaleDateString('pt-BR') : 'Sem prazo';
                        const progressPct = Math.round((readiness.done / Math.max(readiness.total, 1)) * 100);
                        return `
                            <article class="glass-card finishing-card">
                                <div class="finishing-card-head">
                                    <div>
                                        <p class="font-bold">${sanitizeHtml(order.description || 'Pedido')}</p>
                                        <p class="text-sm text-cyan-300">${sanitizeHtml(client ? client.name : 'Cliente')}</p>
                                        <p class="text-xs text-gray-400">Prazo: ${sanitizeHtml(deadline)}</p>
                                    </div>
                                    <span class="finishing-pill ${readiness.ready ? 'is-ok' : 'is-pending'}">${readiness.ready ? 'Pronto para entrega' : 'Em conferência'}</span>
                                </div>
                                <div class="finishing-kpis">
                                    <div><span>Checklist</span><strong>${readiness.done}/${readiness.total}</strong></div>
                                    <div><span>Cortes</span><strong>${readiness.hasCutting ? `${readiness.cutDone}/${readiness.totalCut}` : 'Sem corte'}</strong></div>
                                    <div><span>Tudo OK</span><strong>${readiness.doneVerificationItems}/${Math.max(readiness.totalVerificationItems, 0)}</strong></div>
                                    <div><span>DTF</span><strong>${readiness.dtfDone ? 'OK' : 'Pendente'}</strong></div>
                                </div>
                                <div class="finishing-progress"><span style="width:${progressPct}%"></span></div>
                                <button type="button" class="cutting-add-btn" data-action="open-finishing-modal" data-order-id="${order.id}">Abrir janela de finalização</button>
                            </article>`;
                    }).join('') : `<div class="glass-card p-4 text-sm text-gray-400">${emptyText}</div>`}
                </div>`;
            return shell;
        };

        finishingTasksContainer.appendChild(section('Finalização pendente', 'Pedidos que ainda precisam de revisão para entrega.', pending, 'Nenhum pedido pendente de finalização.'));
        finishingTasksContainer.appendChild(section('Prontos para entregar', 'Pedidos com checklist validado e produção concluída.', readyRows, 'Nenhum pedido pronto para entrega no momento.', 'is-completed'));
    };

    if (finishingTasksContainer) {
        finishingTasksContainer.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-action="open-finishing-modal"]');
            if (!trigger) return;
            finishingTypeFilter = 'all';
            finishingSizeFilter = 'all';
            renderFinishingModal(parseInt(trigger.dataset.orderId, 10));
        });
    }

    if (finishingModalBody) {
        finishingModalBody.addEventListener('change', (event) => {
            const input = event.target;
            const action = input?.dataset?.action;
            if (action === 'finishing-filter-size') {
                finishingSizeFilter = String(input.value || 'all');
                if (activeFinishingOrderId !== null) renderFinishingModal(activeFinishingOrderId);
                return;
            }
            if (action === 'finishing-filter-type') {
                finishingTypeFilter = String(input.value || 'all');
                if (activeFinishingOrderId !== null) renderFinishingModal(activeFinishingOrderId);
                return;
            }

            if (!['toggle-finish-ok', 'edit-finish-name'].includes(action)) return;

            const orderId = parseInt(input.dataset.orderId, 10);
            const itemIndex = parseInt(input.dataset.itemIndex, 10);
            const order = productionOrders.find((item) => item.id === orderId);
            if (!order || Number.isNaN(itemIndex)) return;

            order.finishingVerification = normalizeFinishingVerification(order);
            const item = order.finishingVerification.items[itemIndex];
            if (!item) return;

            if (action === 'toggle-finish-ok') item.isOk = !!input.checked;
            else item.personName = String(input.value || '').trim();

            saveOrders();
            renderFinishingTasks();
            if (activeFinishingOrderId !== null) renderFinishingModal(activeFinishingOrderId);
        });

        finishingModalBody.addEventListener('input', (event) => {
            const input = event.target;
            if (input?.dataset?.action !== 'edit-finish-name') return;
            const orderId = parseInt(input.dataset.orderId, 10);
            const itemIndex = parseInt(input.dataset.itemIndex, 10);
            const order = productionOrders.find((item) => item.id === orderId);
            if (!order || Number.isNaN(itemIndex)) return;
            order.finishingVerification = normalizeFinishingVerification(order);
            const item = order.finishingVerification.items[itemIndex];
            if (!item) return;
            item.personName = String(input.value || '').trim();
            saveOrders();
        });
    }

    const getCuttingTotalPieces = (subtasks = []) => subtasks.reduce((acc, sub) => acc + (parseInt(sub.total, 10) || 0), 0);

    const getCutSectionStatus = (ok) => ok ? '<span class="cutting-status-chip is-ok">Completo</span>' : '<span class="cutting-status-chip">Pendente</span>';
    const getCutColorChip = (subtask = {}) => {
        const rawColor = String(subtask.color || '').trim();
        const safeColor = isHex(rawColor) ? rawColor.toUpperCase() : '';
        const colorLabel = safeColor
            ? String(subtask.colorName || subtask.colorLabel || '').trim() || 'Cor'
            : rawColor || 'Cor';

        return `
            <span class="cut-chip cut-chip-color" ${safeColor ? `data-color="${safeColor}"` : ''}>
                <span class="cut-color-swatch" style="${safeColor ? `--cut-color:${safeColor};` : ''}" aria-hidden="true"></span>
                <span class="cut-chip-label">${sanitizeHtml(colorLabel)}</span>
            </span>
        `;
    };

    const renderCutCards = (order) => {
        const subtasks = order?.checklist?.cutting?.subtasks || [];
        const normalizedSearch = cuttingChecklistSearchFilter.trim().toLowerCase();
        const filteredSubtasks = subtasks.filter((subtask) => {
            const cut = parseInt(subtask.cut || 0, 10);
            const total = parseInt(subtask.total || 0, 10);
            const isDone = total > 0 && cut >= total;
            if (cuttingChecklistStatusFilter === 'done' && !isDone) return false;
            if (cuttingChecklistStatusFilter === 'pending' && isDone) return false;
            const sizeValue = String(subtask.gender === 'Infantil' ? (subtask.age || subtask.size || '-') : (subtask.size || '-')).trim() || '-';
            const typeValue = String(subtask.variation || '-').trim() || '-';
            if (cuttingChecklistSizeFilter !== 'all' && sizeValue !== cuttingChecklistSizeFilter) return false;
            if (cuttingChecklistTypeFilter !== 'all' && typeValue !== cuttingChecklistTypeFilter) return false;
            if (!normalizedSearch) return true;

            const searchableFields = [subtask.size, subtask.age, subtask.gender, subtask.variation, subtask.color, subtask.colorName, subtask.notes]
                .map((value) => String(value || '').toLowerCase());
            return searchableFields.some((value) => value.includes(normalizedSearch));
        });

        const validSubtaskIds = new Set(subtasks.map((sub) => String(sub.id)));
        expandedCutCards.forEach((id) => { if (!validSubtaskIds.has(id)) expandedCutCards.delete(id); });
        const colors = order.colors || [];
        const colorsHtml = colors.length
            ? colors.map(c => {
                const safeBg = /^#([0-9A-F]{3}){1,2}$/i.test((c || '').trim()) ? `background:${c}` : '';
                return `<span class="cutting-color-item"><span class="swatch" style="${safeBg}"></span>${sanitizeHtml(c)}</span>`;
            }).join('')
            : '<span class="cutting-status-chip">Sem cores</span>';

        const sizeFilterOptions = getUniqueValues(subtasks.map((subtask) => subtask.gender === 'Infantil' ? (subtask.age || subtask.size || '-') : (subtask.size || '-')));
        const typeFilterOptions = getUniqueValues(subtasks.map((subtask) => subtask.variation || '-'));
        const filterOptionsHtml = (values, selected) => [`<option value="all">Todos</option>`, ...values.map((v) => `<option value="${sanitizeHtml(v)}" ${String(v) === String(selected) ? 'selected' : ''}>${sanitizeHtml(v)}</option>`)].join('');

        const cutsHtml = filteredSubtasks.length ? filteredSubtasks.map((subtask) => {
            const isInf = subtask.gender === 'Infantil';
            const sizeLabel = isInf ? `Idade: ${subtask.age || subtask.size || '-'}` : `Tam: ${subtask.size || '-'}`;
            const statusOk = parseInt(subtask.cut || 0, 10) >= parseInt(subtask.total || 0, 10) && parseInt(subtask.total || 0, 10) > 0;
            const note = String(subtask.notes || '');
            const preview = note ? sanitizeHtml(note).replace(/\n/g, " ") : "";
            const cardKey = String(subtask.id);
            const isExpanded = expandedCutCards.has(cardKey);
            return `
                <article class="cut-card ${isExpanded ? 'is-expanded' : ''}" role="listitem" data-subtask-id="${subtask.id}">
                    <div class="cut-card-summary">
                        <div class="cut-summary-main">
                            <p class="cut-size-title">${sanitizeHtml(sizeLabel)}</p>
                            <div class="cut-card-meta cut-card-meta-compact">
                                <span class="cut-chip">${sanitizeHtml(subtask.variation || 'Modelo')}</span>
                                ${getCutColorChip(subtask)}
                            </div>
                        </div>
                        <div class="cut-summary-side">
                            <span class="cut-compact-count"><strong>${parseInt(subtask.cut || 0, 10)}</strong>/${parseInt(subtask.total || 0, 10)}</span>
                            ${getCutSectionStatus(statusOk)}
                            <button type="button" class="cut-expand-btn" data-action="toggle-cut-expand" aria-expanded="${isExpanded ? 'true' : 'false'}" aria-label="${isExpanded ? 'Fechar detalhes do corte' : 'Abrir detalhes do corte'}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </button>
                        </div>
                    </div>

                    <div class="cut-card-details" ${isExpanded ? '' : 'hidden'}>
                        <div class="cut-card-actions">
                            <button type="button" class="cut-icon-action" data-action="duplicate-cut" aria-label="Duplicar corte">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2" stroke-width="1.8"></rect><rect x="5" y="5" width="10" height="10" rx="2" stroke-width="1.8"></rect></svg>
                            </button>
                            <button type="button" class="cut-icon-action danger" data-action="delete-cut" aria-label="Excluir corte">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 7h16" stroke-width="1.8"/><path d="M10 11v6M14 11v6" stroke-width="1.8"/><path d="M6 7l1 12h10l1-12" stroke-width="1.8"/><path d="M9 7V4h6v3" stroke-width="1.8"/></svg>
                            </button>
                        </div>
                        <div class="cut-card-meta">
                            <span class="cut-chip">${sanitizeHtml(subtask.gender || 'Sexo')}</span>
                            <span class="cut-chip">${sanitizeHtml(subtask.variation || 'Estilo')}</span>
                            ${getCutColorChip(subtask)}
                        </div>
                        <div class="cut-control-row">
                            <div class="cut-stepper" data-subtask-id="${subtask.id}">
                                <button type="button" class="cut-step-btn" data-action="decrease-cut" aria-label="Diminuir quantidade">−</button>
                                <input type="number" min="0" class="cut-quantity-input" data-subtask-id="${subtask.id}" value="${parseInt(subtask.cut || 0, 10)}">
                                <button type="button" class="cut-step-btn" data-action="increase-cut" aria-label="Aumentar quantidade">+</button>
                                <span class="cut-step-total">/ ${parseInt(subtask.total || 0, 10)}</span>
                            </div>
                            <p class="cut-subtotal">Subtotal: <strong>${parseInt(subtask.total || 0, 10)} peça(s)</strong></p>
                        </div>
                        <div class="cut-note-box ${note ? 'is-expanded has-content' : ''}">
                            <button type="button" class="cut-note-toggle" data-action="toggle-note">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M8 10h8M8 14h5" stroke-width="1.8" stroke-linecap="round"/><path d="M7 4h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-5l-4 3v-3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" stroke-width="1.8" stroke-linejoin="round"/></svg>
                                <span>Adicionar observação (opcional)</span>
                            </button>
                            <p class="cut-note-preview">${preview}</p>
                            <textarea class="cut-note-input" data-subtask-id="${subtask.id}" rows="2" placeholder="Adicionar observação (opcional)">${sanitizeHtml(note)}</textarea>
                        </div>
                    </div>
                </article>
            `;
        }).join('') : '<div class="glass-card p-4 text-sm text-gray-300">Nenhum corte encontrado para os filtros aplicados.</div>';

        const totalPieces = getCuttingTotalPieces(subtasks);

        cuttingChecklistContainer.innerHTML = `
            <section class="cutting-section-card">
                <div class="cutting-section-head"><h3>Resumo</h3>${getCutSectionStatus(totalPieces > 0)}</div>
                <p class="text-sm text-gray-300">${subtasks.length} cortes • ${totalPieces} peças</p>
            </section>

            <section class="cutting-section-card">
                <div class="cutting-section-head"><h3>Cores</h3>${getCutSectionStatus(colors.length > 0)}</div>
                <div class="cutting-color-list">${colorsHtml}</div>
            </section>

            <section class="cutting-section-card cutting-section-card-cortes">
                <div class="cutting-section-head"><h3>Cortes</h3>${getCutSectionStatus(subtasks.length > 0)}</div>
                <div class="cut-filter-bar">
                    <div class="cut-filter-pills" role="group" aria-label="Filtrar cortes por status">
                        <button type="button" class="cut-filter-btn ${cuttingChecklistStatusFilter === 'all' ? 'is-active' : ''}" data-action="filter-status" data-filter="all">Todos</button>
                        <button type="button" class="cut-filter-btn ${cuttingChecklistStatusFilter === 'pending' ? 'is-active' : ''}" data-action="filter-status" data-filter="pending">Em andamento</button>
                        <button type="button" class="cut-filter-btn ${cuttingChecklistStatusFilter === 'done' ? 'is-active' : ''}" data-action="filter-status" data-filter="done">Concluídos</button>
                    </div>
                    <div class="finishing-filter-grid">
                      <label><span>Tamanho</span><select data-action="cut-filter-size" class="cut-filter-search">${filterOptionsHtml(sizeFilterOptions, cuttingChecklistSizeFilter)}</select></label>
                      <label><span>Tipo</span><select data-action="cut-filter-type" class="cut-filter-search">${filterOptionsHtml(typeFilterOptions, cuttingChecklistTypeFilter)}</select></label>
                    </div>
                    <input type="search" id="cut-filter-search" class="cut-filter-search" value="${sanitizeHtml(cuttingChecklistSearchFilter)}" placeholder="Filtrar por tamanho, cor, observação..." aria-label="Filtrar cortes por texto">
                </div>
                <div class="cut-cards-list" role="list">${cutsHtml}</div>
                <button type="button" class="cutting-add-btn" data-action="toggle-add-cut">+ Adicionar corte</button>
                <form id="add-cut-form" class="cut-form hidden">
                    <div class="cut-form-group">
                        <span>Estilo</span>
                        <div class="segmented" data-field="variation">
                            <button type="button" class="is-active" data-value="Gola Polo">Gola Polo</button>
                            <button type="button" data-value="Comum">Comum</button>
                            <button type="button" data-value="Regata">Regata</button>
                        </div>
                    </div>
                    <div class="cut-form-group">
                        <span>Sexo</span>
                        <div class="segmented" data-field="gender">
                            <button type="button" class="is-active" data-value="Feminino">Feminino</button>
                            <button type="button" data-value="Masculino">Masculino</button>
                            <button type="button" data-value="Infantil">Infantil</button>
                        </div>
                    </div>
                    <div class="cut-form-group" id="cut-size-group">
                        <span>Tamanho</span>
                        <div class="size-chips" data-field="size">
                            ${sizeOptions.adulto.map((size, index) => `<button type="button" class="${index === 2 ? 'is-active' : ''}" data-value="${size}">${size}</button>`).join('')}
                        </div>
                    </div>
                    <div class="cut-form-group hidden" id="cut-age-group">
                        <span>Idade</span>
                        <input type="text" id="cut-age-input" class="cut-inline-input" placeholder="Ex.: 7 a 8 anos">
                    </div>
                    <div class="cut-form-group">
                        <span>Cor</span>
                        <div class="color-swatches" data-field="color">
                            <button type="button" class="is-active" data-value="Sem cor">Sem cor</button>
                            ${colors.map(c => `<button type="button" data-value="${sanitizeHtml(c)}" style="${/^#([0-9A-F]{3}){1,2}$/i.test((c || '').trim()) ? `--sw:${c}` : ''}">${sanitizeHtml(c)}</button>`).join('')}
                        </div>
                    </div>
                    <div class="cut-form-row">
                        <label>Quantidade</label>
                        <div class="cut-stepper compact">
                            <button type="button" data-action="form-minus">−</button>
                            <input id="cut-form-qty" type="number" min="1" value="1">
                            <button type="button" data-action="form-plus">+</button>
                        </div>
                    </div>
                    <input type="text" id="cut-form-note" class="cut-inline-input" placeholder="Observação (opcional)">
                    <div class="cut-form-actions">
                        <button type="button" data-action="cancel-add-cut">Cancelar</button>
                        <button type="submit">Adicionar</button>
                    </div>
                </form>
            </section>
        `;

        if (cuttingFooterTotal) cuttingFooterTotal.textContent = String(totalPieces);
    };

    const syncCuttingMeta = (order) => {
        const subtasks = order?.checklist?.cutting?.subtasks || [];
        const totalPieces = getCuttingTotalPieces(subtasks);
        const client = clients.find(c => c.id === order.clientId);
        cuttingModalTitle.textContent = `Pedido: ${order.description} (${client ? client.name : 'Cliente'})`;
        if (cuttingModalSubtitle) {
            const prazo = order.deadline ? new Date(order.deadline + 'T03:00:00').toLocaleDateString('pt-BR') : '-';
            cuttingModalSubtitle.textContent = `Prazo ${prazo} • ${totalPieces} peças`;
        }
        if (cuttingFooterTotal) cuttingFooterTotal.textContent = String(totalPieces);
    };

    const setCutSavePending = (pending) => {
        isCutSavePending = Boolean(pending);
        [saveCutsBtn, saveCutsFooterBtn, saveCutsQuickBtn].forEach((btn) => {
            if (!btn) return;
            btn.disabled = isCutSavePending;
            btn.classList.toggle('is-loading', isCutSavePending);
            btn.setAttribute('aria-busy', isCutSavePending ? 'true' : 'false');
        });
    };

    const showCuttingSnackbar = (message, type = 'success') => {
        if (!cuttingSnackbar) return;
        cuttingSnackbar.textContent = message;
        cuttingSnackbar.dataset.type = type;
        cuttingSnackbar.classList.add('is-visible');
        if (cuttingSnackbarTimer) clearTimeout(cuttingSnackbarTimer);
        cuttingSnackbarTimer = setTimeout(() => {
            cuttingSnackbar.classList.remove('is-visible');
            cuttingSnackbar.removeAttribute('data-type');
        }, 2600);
    };

    const queueCutSave = () => {
        setCutSavePending(true);
        return new Promise((resolve) => {
            setTimeout(() => {
                setCutSavePending(false);
                resolve();
            }, 240);
        });
    };

    const openCutDeleteConfirmation = (subtaskId) => {
        pendingDeleteSubtaskId = subtaskId;
        if (cutDeleteConfirmModal) cutDeleteConfirmModal.classList.remove('hidden');
    };

    const closeCutDeleteConfirmation = () => {
        pendingDeleteSubtaskId = null;
        if (cutDeleteConfirmModal) cutDeleteConfirmModal.classList.add('hidden');
    };

    const openCuttingModal = (orderId) => {
        activeCuttingOrderId = orderId;
        cuttingChecklistStatusFilter = 'all';
        cuttingChecklistSearchFilter = '';
        cuttingChecklistSizeFilter = 'all';
        cuttingChecklistTypeFilter = 'all';
        const order = productionOrders.find(o => o.id === orderId);
        if (!order) return;
        setCutSavePending(false);
        closeCutDeleteConfirmation();
        if (cuttingSnackbar) cuttingSnackbar.classList.remove('is-visible');
        expandedCutCards.clear();
        syncCuttingMeta(order);
        renderCutCards(order);
        cuttingModal.classList.remove('hidden');
    };

    const saveCuts = async () => {
        const order = productionOrders.find(o => o.id === activeCuttingOrderId);
        if (!order || isCutSavePending) return;

        try {
            await queueCutSave();
            const subtasks = order?.checklist?.cutting?.subtasks || [];
            order.checklist.cutting.completed = subtasks.length > 0 && subtasks.every(s => (parseInt(s.cut || 0, 10) >= parseInt(s.total || 0, 10)));
            saveOrders();
            closeCuttingModal();
            renderCuttingTasks();
            renderKanban();
            showCuttingSnackbar('Cortes salvos com sucesso.', 'success');
        } catch (error) {
            console.error('Erro ao salvar cortes:', error);
            setCutSavePending(false);
            showCuttingSnackbar('Não foi possível salvar os cortes agora.', 'error');
        }
    };

    if (cuttingChecklistContainer) {
        cuttingChecklistContainer.addEventListener('click', (e) => {
            const order = productionOrders.find(o => o.id === activeCuttingOrderId);
            if (!order) return;
            const subtasks = order.checklist.cutting.subtasks || [];
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;
            const action = actionBtn.dataset.action;

            if (action === 'toggle-add-cut') {
                const form = document.getElementById('add-cut-form');
                if (form) form.classList.toggle('hidden');
                return;
            }

            if (action === 'cancel-add-cut') {
                const form = document.getElementById('add-cut-form');
                if (form) form.classList.add('hidden');
                return;
            }

            if (action === 'toggle-note') {
                const noteBox = actionBtn.closest('.cut-note-box');
                if (noteBox) noteBox.classList.toggle('is-expanded');
                return;
            }

            if (action === 'filter-status') {
                cuttingChecklistStatusFilter = actionBtn.dataset.filter || 'all';
                renderCutCards(order);
                return;
            }

            if (action === 'toggle-cut-expand') {
                const card = actionBtn.closest('.cut-card');
                const details = card?.querySelector('.cut-card-details');
                if (!card || !details) return;
                const cardId = String(card.dataset.subtaskId || '');
                const willExpand = details.hasAttribute('hidden');
                if (willExpand) {
                    details.removeAttribute('hidden');
                    card.classList.add('is-expanded');
                    expandedCutCards.add(cardId);
                } else {
                    details.setAttribute('hidden', 'hidden');
                    card.classList.remove('is-expanded');
                    expandedCutCards.delete(cardId);
                }
                actionBtn.setAttribute('aria-expanded', String(willExpand));
                return;
            }

            if (action === 'form-minus' || action === 'form-plus') {
                const qty = document.getElementById('cut-form-qty');
                if (!qty) return;
                const now = parseInt(qty.value || '1', 10);
                qty.value = String(action === 'form-plus' ? now + 1 : Math.max(1, now - 1));
                return;
            }

            const card = e.target.closest('.cut-card');
            if (!card) return;
            const subtaskId = parseFloat(card.dataset.subtaskId);
            const subtask = subtasks.find(s => s.id === subtaskId);
            if (!subtask) return;

            if (action === 'duplicate-cut') {
                subtasks.push({ ...subtask, id: Date.now() + Math.random() });
            }

            if (action === 'delete-cut') {
                expandedCutCards.delete(String(subtaskId));
                openCutDeleteConfirmation(subtaskId);
                return;
            }

            if (action === 'increase-cut' || action === 'decrease-cut') {
                const val = parseInt(subtask.cut || 0, 10);
                const next = action === 'increase-cut' ? val + 1 : Math.max(0, val - 1);
                subtask.cut = Math.min(next, parseInt(subtask.total || 0, 10));

                if (cutDebounceTimers.has(subtaskId)) clearTimeout(cutDebounceTimers.get(subtaskId));
                const timer = setTimeout(() => {
                    saveOrders();
                    cutDebounceTimers.delete(subtaskId);
                }, 200);
                cutDebounceTimers.set(subtaskId, timer);
            } else {
                saveOrders();
            }

            syncCuttingMeta(order);
            renderCutCards(order);
            renderCuttingTasks();
        });

        cuttingChecklistContainer.addEventListener('input', (e) => {
            const order = productionOrders.find(o => o.id === activeCuttingOrderId);
            if (!order) return;
            const subtasks = order.checklist.cutting.subtasks || [];

            if (e.target.id === 'cut-filter-search') {
                cuttingChecklistSearchFilter = String(e.target.value || '');
                renderCutCards(order);
                return;
            }
            if (e.target.dataset.action === 'cut-filter-size') {
                cuttingChecklistSizeFilter = String(e.target.value || 'all');
                renderCutCards(order);
                return;
            }
            if (e.target.dataset.action === 'cut-filter-type') {
                cuttingChecklistTypeFilter = String(e.target.value || 'all');
                renderCutCards(order);
                return;
            }

            if (e.target.classList.contains('cut-quantity-input')) {
                const id = parseFloat(e.target.dataset.subtaskId);
                const subtask = subtasks.find(s => s.id === id);
                if (!subtask) return;
                const limit = parseInt(subtask.total || 0, 10);
                subtask.cut = Math.min(Math.max(0, parseInt(e.target.value || 0, 10)), limit);

                if (cutDebounceTimers.has(id)) clearTimeout(cutDebounceTimers.get(id));
                const timer = setTimeout(() => {
                    saveOrders();
                    cutDebounceTimers.delete(id);
                }, 200);
                cutDebounceTimers.set(id, timer);
            }

            if (e.target.classList.contains('cut-note-input') && e.target.dataset.subtaskId) {
                const id = parseFloat(e.target.dataset.subtaskId);
                const subtask = subtasks.find(s => s.id === id);
                if (subtask) {
                    subtask.notes = e.target.value;
                    const noteBox = e.target.closest('.cut-note-box');
                    const preview = noteBox?.querySelector('.cut-note-preview');
                    if (preview) preview.textContent = String(subtask.notes || '').replace(/\n/g, ' ');
                    if (noteBox) noteBox.classList.toggle('has-content', Boolean(String(subtask.notes || '').trim()));
                }
            }

            syncCuttingMeta(order);
        });

        cuttingChecklistContainer.addEventListener('change', (e) => {
            const order = productionOrders.find(o => o.id === activeCuttingOrderId);
            if (!order) return;
            saveOrders();
            syncCuttingMeta(order);
        });

        cuttingChecklistContainer.addEventListener('submit', (e) => {
            if (e.target.id !== 'add-cut-form') return;
            e.preventDefault();
            const order = productionOrders.find(o => o.id === activeCuttingOrderId);
            if (!order) return;

            const getActiveValue = (selector) => {
                const el = e.target.querySelector(`${selector} .is-active`);
                return el ? el.dataset.value : '';
            };

            const gender = getActiveValue('.segmented[data-field="gender"]') || 'Feminino';
            const variation = getActiveValue('.segmented[data-field="variation"]') || 'Comum';
            const size = gender === 'Infantil'
                ? (document.getElementById('cut-age-input')?.value || 'Infantil')
                : (getActiveValue('.size-chips[data-field="size"]') || 'M');
            const color = getActiveValue('.color-swatches[data-field="color"]') || 'Sem cor';
            const total = Math.max(1, parseInt(document.getElementById('cut-form-qty')?.value || '1', 10));
            const notes = document.getElementById('cut-form-note')?.value || '';

            order.checklist.cutting.subtasks = order.checklist.cutting.subtasks || [];
            order.checklist.cutting.subtasks.push({
                id: Date.now() + Math.random(),
                gender,
                variation,
                size,
                total,
                cut: 0,
                color,
                age: gender === 'Infantil' ? size : '',
                notes
            });

            saveOrders();
            syncCuttingMeta(order);
            renderCutCards(order);
            renderCuttingTasks();
        });

        cuttingChecklistContainer.addEventListener('click', (e) => {
            const segmentedBtn = e.target.closest('.segmented button, .size-chips button, .color-swatches button');
            if (!segmentedBtn) return;
            const group = segmentedBtn.parentElement;
            Array.from(group.children).forEach(btn => btn.classList.remove('is-active'));
            segmentedBtn.classList.add('is-active');

            if (group.dataset.field === 'gender') {
                const isInf = segmentedBtn.dataset.value === 'Infantil';
                const sizeGroup = document.getElementById('cut-size-group');
                const ageGroup = document.getElementById('cut-age-group');
                if (sizeGroup) sizeGroup.classList.toggle('hidden', isInf);
                if (ageGroup) ageGroup.classList.toggle('hidden', !isInf);
            }
        });
    }

    // Listener para salvar cortes
    if (saveCutsBtn) saveCutsBtn.addEventListener('click', saveCuts);
    if (saveCutsFooterBtn) saveCutsFooterBtn.addEventListener('click', saveCuts);
    if (saveCutsQuickBtn) saveCutsQuickBtn.addEventListener('click', saveCuts);

    if (cutDeleteCancelBtn) cutDeleteCancelBtn.addEventListener('click', closeCutDeleteConfirmation);
    if (cutDeleteConfirmModal) {
        cutDeleteConfirmModal.addEventListener('click', (e) => {
            if (e.target === cutDeleteConfirmModal) closeCutDeleteConfirmation();
        });
    }
    if (cutDeleteConfirmBtn) {
        cutDeleteConfirmBtn.addEventListener('click', () => {
            const order = productionOrders.find(o => o.id === activeCuttingOrderId);
            if (!order || pendingDeleteSubtaskId === null) {
                closeCutDeleteConfirmation();
                return;
            }

            const subtasks = order.checklist?.cutting?.subtasks || [];
            order.checklist.cutting.subtasks = subtasks.filter((s) => s.id !== pendingDeleteSubtaskId);
            saveOrders();
            syncCuttingMeta(order);
            renderCutCards(order);
            renderCuttingTasks();
            closeCutDeleteConfirmation();
            showCuttingSnackbar('Corte removido com sucesso.', 'success');
        });
    }

    if (closeFinishingModalBtn) closeFinishingModalBtn.addEventListener('click', closeFinishingModal);
    if (finishingModal) {
        finishingModal.addEventListener('click', (e) => { if (e.target === finishingModal) closeFinishingModal(); });
    }

    const closeCuttingModal = () => {
        cutDebounceTimers.forEach((timer) => clearTimeout(timer));
        cutDebounceTimers.clear();
        closeCutDeleteConfirmation();
        cuttingModal.classList.add('hidden');
        activeCuttingOrderId = null;
    };

    const renderArtTasks = () => {
        if (window.ArteControl && typeof window.ArteControl.render === 'function') {
            window.ArteControl.render();
            return;
        }
        artTasksContainer.innerHTML = '';

        // Mostra apenas pedidos que ainda possuem arte pendente
        const artOrders = productionOrders.filter(order => {
            if (order.status === 'done') return false;

            const artChecklist = order.checklist && order.checklist.art;
            const artCompleted = artChecklist && artChecklist.completed === true;
            const hasArtStep = Boolean(order.isArtOnly || artChecklist);

            return hasArtStep && !artCompleted;
        });

        if (artOrders.length === 0) {
            artTasksContainer.innerHTML = '<div class="glass-card p-6 text-center text-gray-400">Nenhum pedido pendente para arte.</div>';
            return;
        }

        // Mobile Filter Header (Injected dynamically)
        if (!document.getElementById('art-mobile-filters')) {
            const filterHTML = `
                <div id="art-mobile-filters" class="flex gap-2 overflow-x-auto pb-2 mb-4 md:hidden no-scrollbar">
                    <button class="px-3 py-1 rounded-full bg-cyan-600 text-white text-xs font-bold whitespace-nowrap">Todos</button>
                    <button class="px-3 py-1 rounded-full bg-white/10 text-gray-400 text-xs font-bold whitespace-nowrap">Pendentes</button>
                    <button class="px-3 py-1 rounded-full bg-white/10 text-gray-400 text-xs font-bold whitespace-nowrap">Aprovados</button>
                </div>`;
            artTasksContainer.insertAdjacentHTML('beforebegin', filterHTML);
        }

        const createArtCard = (order) => {
            const client = clients.find(c => c.id === order.clientId);
            const artData = order.art || {};
            const artControl = order.artControl || { versions: [] };
            const lastVersion = artControl.versions.length > 0 ? artControl.versions[artControl.versions.length - 1] : null;

            let statusClass = 'bg-gray-700 text-gray-300';
            let statusText = 'Em criação';

            if (lastVersion) {
                if (lastVersion.status === 'finalizada') { statusClass = 'bg-green-500/20 text-green-400 border border-green-500/30'; statusText = `Finalizada V${lastVersion.version}`; }
                else if (lastVersion.status === 'ajuste_interno') { statusClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/30'; statusText = `Ajuste interno V${lastVersion.version}`; }
            }

            // Thumb logic
            const thumbSrc = (lastVersion && lastVersion.images[0]) ? lastVersion.images[0] : (order.art?.images?.[0] || '');
            const deadlineDate = order.deadline ? new Date(order.deadline) : null;
            const deadlineLabel = deadlineDate && !Number.isNaN(deadlineDate.getTime())
                ? deadlineDate.toLocaleDateString('pt-BR').slice(0, 5)
                : 'Sem prazo';
            const isLate = deadlineDate && deadlineDate < new Date() && (!lastVersion || lastVersion.status !== 'approved');

            // New Compact Card HTML
            const card = document.createElement('div');
            card.className = `art-card-compact`;
            card.innerHTML = `
                <div class="art-card-header">
                    <div>
                        <h3 class="art-card-title">${order.description}</h3>
                        <p class="art-card-subtitle">${client ? client.name : 'Cliente'}</p>
                    </div>
                    <span class="art-card-badge ${statusClass}">${statusText}</span>
                </div>
                
                <div class="art-card-body">
                    <div class="art-thumb-wrap">
                        ${thumbSrc ? `<img src="${thumbSrc}" class="art-thumb" onerror="this.remove(); this.nextElementSibling.style.display='flex';">` : ''}<span class="art-thumb-placeholder" ${thumbSrc ? 'style="display:none"' : ''}>Sem prévia</span>
                    </div>
                    <div class="art-info-grid">
                        <div class="art-info-item ${isLate ? 'is-late' : ''}">
                            <span class="text-gray-500">Prazo:</span>
                            <span class="text-white font-medium">${deadlineLabel}</span>
                        </div>
                        <div class="art-info-item">
                            <span class="text-gray-500">Versões:</span>
                            <span class="text-white font-medium">${artControl.versions.length}</span>
                        </div>
                    </div>
                </div>

                <div class="art-card-actions">
                    <button data-order-id="${order.id}" class="open-art-modal-btn art-btn-action primary">Gerenciar</button>
                    
                </div>
            `;
            return card;
        };

        const container = document.createElement('div');
        // Use simple flex column for mobile, grid for desktop
        container.className = 'flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-3';
        artOrders.forEach(order => container.appendChild(createArtCard(order)));
        artTasksContainer.appendChild(container);
    };

    // --- NOVO CONTROLE DE ARTES (INTERNO) ---
    const formatArtDate = (value) => {
        const d = new Date(value || Date.now());
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString('pt-BR');
    };
    const ensureArtStructure = (order) => {
        order.art = order.art || {};
        order.artControl = order.artControl || {};
        order.art.notes = order.art.notes || order.notes || '';
        order.art.status = order.art.status || 'em_criacao';
        order.art.activeVersionId = order.art.activeVersionId || null;
        order.artControl.versions = Array.isArray(order.artControl.versions) ? order.artControl.versions : [];
        order.artControl.versions = order.artControl.versions.map((ver, idx) => ({
            id: ver.id || `v_${order.id}_${ver.version || idx + 1}`,
            version: ver.version || ver.versionNumber || idx + 1,
            versionNumber: ver.versionNumber || ver.version || idx + 1,
            createdAt: ver.createdAt || Date.now(),
            status: ['em_criacao', 'ajuste_interno', 'finalizada'].includes(ver.status) ? ver.status : 'em_criacao',
            previewUrl: ver.previewUrl || (Array.isArray(ver.images) ? ver.images[0] : ver.imageUrl) || '',
            images: Array.isArray(ver.images) ? ver.images : (ver.previewUrl ? [ver.previewUrl] : []),
            history: Array.isArray(ver.history) ? ver.history : []
        }));
        const active = order.artControl.versions.find((v) => v.id === order.art.activeVersionId) || order.artControl.versions[order.artControl.versions.length - 1] || null;
        order.art.activeVersionId = active?.id || null;
    };
    const statusChip = (status) => {
        const map = { em_criacao: 'Em criação', ajuste_interno: 'Ajuste interno', finalizada: 'Finalizada' };
        return map[resolveArtVisualStatus(status)] || 'Em criação';
    };
    const openArtControlModal = (orderId) => {
        activeArtOrderId = orderId;
        const order = productionOrders.find((o) => o.id === orderId);
        const client = clients.find((c) => c.id === order.clientId);
        if (!order) return;
        ensureArtStructure(order);

        const shell = document.getElementById('art-modal-shell');
        shell.innerHTML = `
            <div class="artx-modal-header">
                <div>
                    <h2 class="text-3xl font-bold">Gestão de Arte: ${order.description}</h2>
                    <p class="text-sm text-gray-300">${client?.name || 'Cliente'} · Prazo ${order.deadline || 'não definido'}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span id="art-global-status" class="artx-badge-pill">${statusChip(order.art.status)}</span>
                    <button id="close-art-modal-btn" class="artx-icon-btn" type="button"><svg class="syt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M18 6L6 18"/></svg></button>
                </div>
            </div>
            <div class="artx-modal-content">
                <section class="glass-card artx-glass-card artx-brief-card">
                    <div class="flex items-center justify-between gap-3 mb-3">
                        <h3 class="font-semibold">Briefing / Notas</h3>
                        <div class="flex gap-2">
                            <button id="btn-copy-brief" class="artx-btn-soft">Copiar briefing</button>
                            <button id="btn-edit-notes" class="artx-btn-soft">Editar notas</button>
                        </div>
                    </div>
                    <p id="art-notes-text" class="text-sm text-gray-200">${order.art.notes || 'Sem anotações ainda.'}</p>
                </section>
                <section class="artx-versions-wrap">
                    <div class="artx-versions-head"><h3 class="font-semibold">Timeline de Versões</h3></div>
                    <div id="art-versions-list" class="artx-versions-list"></div>
                </section>
            </div>
            <footer class="artx-modal-footer">
                <div class="text-xs text-gray-400">Fluxo interno de produção sem compartilhamento externo.</div>
                <div class="artx-footer-actions">
                    <input type="file" id="new-version-input" class="hidden" accept="image/*">
                    <button id="btn-new-version" class="btn-shine py-3 px-5 rounded-xl">Nova versão</button>
                    <button id="save-art-btn" class="btn-shine py-3 px-5 rounded-xl">Salvar como finalizada</button>
                </div>
            </footer>
        `;

        renderArtVersionsList(order);
        shell.querySelector('#close-art-modal-btn').onclick = () => artModal.classList.add('hidden');
        shell.querySelector('#btn-new-version').onclick = () => shell.querySelector('#new-version-input').click();
        shell.querySelector('#new-version-input').onchange = (e) => handleNewVersionUpload(e, order);
        shell.querySelector('#btn-copy-brief').onclick = async () => {
            const ok = await copyTextSafe(order.art.notes || 'Sem briefing cadastrado.');
            alert(ok ? 'Briefing copiado.' : 'Não foi possível copiar.');
        };
        shell.querySelector('#btn-edit-notes').onclick = () => {
            const value = prompt('Atualizar briefing/notas:', order.art.notes || '');
            if (value === null) return;
            order.art.notes = value.trim();
            order.notes = order.art.notes;
            saveOrders();
            openArtControlModal(order.id);
        };
        shell.querySelector('#save-art-btn').onclick = () => {
            order.art.status = 'finalizada';
            applyArtChecklistStatusConsistency(order, 'finalizada');
            saveOrders();
            renderArtTasks();
            artModal.classList.add('hidden');
        };

        artModal.classList.remove('hidden');
    };

    const renderArtVersionsList = (order) => {
        const container = document.getElementById('art-versions-list');
        if (!container) return;
        container.innerHTML = '';
        const versions = [...order.artControl.versions].sort((a, b) => (b.versionNumber || b.version) - (a.versionNumber || a.version));
        if (!versions.length) {
            container.innerHTML = '<div class="glass-card artx-glass-card p-6 text-gray-400">Nenhuma versão criada ainda.</div>';
            return;
        }

        versions.forEach((ver) => {
            const last = Array.isArray(ver.history) && ver.history.length ? ver.history[ver.history.length - 1] : null;
            const card = document.createElement('article');
            card.className = 'artx-version-card';
            card.innerHTML = `
                <div class="artx-version-thumb">${ver.previewUrl ? `<img src="${ver.previewUrl}" alt="Versão ${ver.versionNumber}">` : '<span>Sem preview</span>'}</div>
                <div class="artx-version-main">
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <h4 class="text-xl font-bold">Versão ${ver.versionNumber}</h4>
                            <p class="text-xs text-gray-400">Criada em ${formatArtDate(ver.createdAt)}</p>
                        </div>
                        <div class="flex items-center gap-2"><span class="artx-badge-pill">${statusChip(ver.status)}</span></div>
                    </div>
                    <p class="text-xs text-gray-400 mt-2">Última atividade: ${last ? `${last.action} · ${last.comment || ''}` : 'created'}</p>
                    <div class="artx-version-actions">
                        ${ver.status !== 'em_criacao' ? '<button class="artx-btn-soft" data-action="set-creating">Em criação</button>' : ''}
                        ${ver.status !== 'ajuste_interno' ? '<button class="artx-btn-soft" data-action="set-adjust">Ajuste interno</button>' : ''}
                        ${ver.status !== 'finalizada' ? '<button class="artx-btn-soft" data-action="set-final">Finalizada</button>' : ''}
                        <button class="artx-btn-soft" data-action="details">Ver histórico</button>
                    </div>
                    <div class="artx-version-details hidden">
                        <p class="text-sm text-gray-200"><strong>Última atividade:</strong> ${last ? `${last.action} · ${last.comment || ''}` : 'criação da versão'}</p>
                    </div>
                </div>
            `;
            const setStatus = (nextStatus, note) => {
                ver.status = nextStatus;
                order.art.status = nextStatus;
                ver.history.push({ action: 'status', date: Date.now(), user: 'Interno', comment: note });
                applyArtChecklistStatusConsistency(order, nextStatus);
                saveOrders();
                renderArtVersionsList(order);
                renderArtTasks();
            };
            const btnCreating = card.querySelector('[data-action="set-creating"]');
            if (btnCreating) btnCreating.onclick = () => setStatus('em_criacao', 'Retornada para criação');
            const btnAdjust = card.querySelector('[data-action="set-adjust"]');
            if (btnAdjust) btnAdjust.onclick = () => setStatus('ajuste_interno', 'Ajuste interno solicitado');
            const btnFinal = card.querySelector('[data-action="set-final"]');
            if (btnFinal) btnFinal.onclick = () => setStatus('finalizada', 'Versão finalizada internamente');
            card.querySelector('[data-action="details"]').onclick = () => card.querySelector('.artx-version-details').classList.toggle('hidden');
            container.appendChild(card);
        });
    };

    const handleNewVersionUpload = (e, order) => {
        const file = e.target.files[0];
        if (!file) return;
        ensureArtStructure(order);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const num = order.artControl.versions.length + 1;
            const id = `v_${order.id}_${num}_${Date.now()}`;
            const newVersion = {
                id,
                version: num,
                versionNumber: num,
                images: [ev.target.result],
                previewUrl: ev.target.result,
                status: 'em_criacao',
                createdAt: Date.now(),
                history: [{ action: 'created', date: Date.now(), user: 'Admin' }]
            };
            order.artControl.versions.push(newVersion);
            order.art.activeVersionId = id;
            order.art.status = 'em_criacao';
            saveOrders();
            renderArtVersionsList(order);
            renderArtTasks();
        };
        reader.readAsDataURL(file);
    };

    // Remove listeners antigos de artImageInput e artReferencesContainer pois a UI mudou completamente
    // Mantemos apenas o listener de abrir o modal

    if (artTasksContainer && !(window.ArteControl && window.ArteControl.enabled)) {
        artTasksContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('open-art-modal-btn')) {
                openArtControlModal(parseInt(e.target.dataset.orderId));
            }
        });
    }
    // closeArtModalBtn agora é tratado dentro de openArtControlModal dinamicamente ou via delegate global

    const checkPrefillData = () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'new_order') {
            const prefillData = JSON.parse(sessionStorage.getItem('prefill_order_form'));
            if (prefillData) {
                openModal();
                orderDescriptionInput.value = prefillData.description;
                orderClientSelect.value = prefillData.clientId;
                sessionStorage.removeItem('prefill_order_form');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    };

    checkPrefillData();

    const dtfTasksContainer = document.getElementById('dtf-tasks-container');

    function renderDTFTasks() {
        dtfTasksContainer.innerHTML = '';
        // filtra pedidos DTF não concluídos (por status e por printing.completed)
        const dtfOrders = productionOrders.filter(order =>
            order.printType === 'dtf' &&
            order.status !== 'done' &&
            !(order.printing && order.printing.completed)
        );
        if (dtfOrders.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'glass-card p-6 text-center text-gray-400';
            empty.textContent = 'Nenhum pedido DTF pendente.';
            dtfTasksContainer.appendChild(empty);
            return;
        }

        dtfOrders.forEach(order => {
            const client = clients.find(c => c.id === order.clientId);
            const deadline = order.deadline ? new Date(order.deadline + "T03:00:00").toLocaleDateString('pt-BR') : '';
            const images = (order.printing && Array.isArray(order.printing.images) && order.printing.images.length) ? order.printing.images : ((order.art && order.art.images) || []);
            const colors = order.colors || [];
            const printQty = (order.printing && order.printing.total) ? order.printing.total : (order.checklist && order.checklist.printing && order.checklist.printing.total) || '';
            const printNotes = (order.printing && order.printing.notes) ? order.printing.notes : '';

            const card = document.createElement('div');
            card.className = 'dtf-card glass-card p-4 flex flex-col gap-3';
            card.style.width = '100%';
            card.style.boxSizing = 'border-box';

            // head
            const head = document.createElement('div');
            head.className = 'flex justify-between items-start gap-2';
            const left = document.createElement('div');
            const title = document.createElement('p'); title.className = 'font-bold text-sm'; title.textContent = order.description;
            const clientP = document.createElement('p'); clientP.className = 'text-xs text-cyan-300'; clientP.textContent = client ? client.name : 'Cliente';
            const deadlineP = document.createElement('p'); deadlineP.className = 'text-2xs text-gray-400'; deadlineP.textContent = `Prazo: ${deadline}`;
            left.appendChild(title);
            left.appendChild(clientP);
            left.appendChild(deadlineP);

            const right = document.createElement('div');
            const tag = document.createElement('span'); tag.className = 'px-2 py-1 rounded bg-cyan-600/20 text-cyan-400 text-xs font-bold'; tag.textContent = 'DTF';
            right.appendChild(tag);

            head.appendChild(left);
            head.appendChild(right);
            card.appendChild(head);

            // printing notes (aparece direto no card)
            if (printNotes && printNotes.trim()) {
                const notesEl = document.createElement('div');
                notesEl.className = 'dtf-notes text-xs text-gray-300';
                notesEl.textContent = `Observações: ${printNotes}`;
                card.appendChild(notesEl);
            }

            // images grid
            if (images && images.length) {
                const imgsWrap = document.createElement('div');
                imgsWrap.className = 'grid grid-cols-2 gap-2';
                images.forEach(src => {
                    const imgWrap = document.createElement('div');
                    imgWrap.className = 'w-full h-28 overflow-hidden rounded';
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = 'Arte DTF';
                    img.className = 'w-full h-full object-cover';
                    imgWrap.appendChild(img);
                    imgsWrap.appendChild(imgWrap);
                });
                card.appendChild(imgsWrap);
            }

            // colors
            if (colors && colors.length) {
                const colorsWrap = document.createElement('div');
                colorsWrap.className = 'flex gap-2 flex-wrap';
                colors.forEach(c => {
                    const span = document.createElement('span');
                    span.className = 'px-2 py-1 rounded bg-white/10 border border-white/20 text-xs';
                    span.textContent = c;
                    colorsWrap.appendChild(span);
                });
                card.appendChild(colorsWrap);
            }

            // footer: separado checkbox + qty + Pedido Feito button
            const footer = document.createElement('div');
            footer.className = 'flex items-center justify-between gap-2';

            // left side: checkbox "Separado" + qty
            const leftFooter = document.createElement('div');
            leftFooter.className = 'flex items-center gap-3';

            // Separado checkbox
            const separatedId = `dtf-separated-${order.id}`;
            const separatedWrapper = document.createElement('label');
            separatedWrapper.className = 'flex items-center gap-2 text-xs';
            const separatedCheckbox = document.createElement('input');
            separatedCheckbox.type = 'checkbox';
            separatedCheckbox.className = 'dtf-separated-checkbox';
            separatedCheckbox.checked = !!(order.printing && order.printing.separated);
            separatedCheckbox.dataset.orderId = order.id;
            const separatedLabel = document.createElement('span');
            separatedLabel.textContent = 'Separado';
            separatedWrapper.appendChild(separatedCheckbox);
            separatedWrapper.appendChild(separatedLabel);

            // quantity badge
            const qty = document.createElement('span');
            qty.className = 'px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs';
            qty.textContent = `Qtd: ${printQty || ''}`;

            leftFooter.appendChild(separatedWrapper);
            leftFooter.appendChild(qty);

            footer.appendChild(leftFooter);

            // right side: actions (Pedido Feito)
            const actions = document.createElement('div');
            actions.className = 'flex items-center gap-2';

            const doneBtn = document.createElement('button');
            doneBtn.type = 'button';
            doneBtn.className = 'text-xs px-2 py-1 rounded bg-green-600 text-white';
            doneBtn.textContent = 'Pedido Feito';
            doneBtn.title = 'Marcar impressão como concluída e remover do Controle de DTF';
            doneBtn.addEventListener('click', () => {
                if (!confirm('Marcar este DTF como concluído e remover do Controle de DTF?')) return;
                order.printing = order.printing || {};
                order.printing.completed = true;
                // opcional: atualizar status também (comente se não quiser alterar status global)
                // order.status = 'done';
                saveOrders();
                renderDTFTasks();
            });

            actions.appendChild(doneBtn);
            footer.appendChild(actions);

            card.appendChild(footer);

            // handler: toggle separado checkbox
            separatedCheckbox.addEventListener('change', (e) => {
                const oid = parseInt(e.target.dataset.orderId, 10);
                const o = productionOrders.find(x => x.id === oid);
                if (!o) return;
                o.printing = o.printing || {};
                o.printing.separated = !!e.target.checked;
                saveOrders();
                // atualização visual mínima sem recriar tudo
                // (re-render para garantir consistência)
                renderDTFTasks();
            });

            dtfTasksContainer.appendChild(card);
        });
    }

    // render previews for DTF images inside modal (fix: function missing -> define it)
    function renderOrderPrintingPreviews(images = []) {
        if (!orderPrintingImagesContainer) return;
        orderPrintingImagesContainer.innerHTML = '';
        images.forEach((img, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'relative w-24 h-24 rounded overflow-hidden border border-white/10';
            wrap.style.minWidth = '96px';
            wrap.style.minHeight = '96px';
            const imageEl = document.createElement('img');
            imageEl.src = img;
            imageEl.className = 'w-full h-full object-cover';
            imageEl.alt = `Arte DTF ${idx + 1}`;
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'absolute top-1 right-1 bg-black/60 text-white rounded px-1';
            del.innerHTML = '&times;';
            del.title = 'Remover';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                activeDtfImages.splice(idx, 1);
                renderOrderPrintingPreviews(activeDtfImages);
            });
            wrap.appendChild(imageEl);
            wrap.appendChild(del);
            orderPrintingImagesContainer.appendChild(wrap);
        });
    }

    // DEBUG — lista elementos ausentes
    ['add-order-btn', 'tab-quadro', 'tab-afazeres', 'tab-cortes', 'tab-finalizacao', 'view-quadro', 'view-afazeres', 'view-cortes', 'view-finalizacao', 'order-modal', 'cancel-order-btn', 'close-cutting-modal-btn', 'close-finishing-modal-btn', 'close-art-modal-btn']
        .forEach(id => {
            if (!document.getElementById(id)) console.warn(`processos.js: elemento ausente no DOM -> #${id}`);
        });

    // Listener delegado para fechar modais mesmo que o botão seja adicionado dinamicamente
    document.addEventListener('click', (e) => {
        const btn = e.target;
        // Fechar modal de pedido
        if (btn.id === 'cancel-order-btn' || btn.closest && btn.closest('[data-action="close-order-modal"]')) {
            e.preventDefault();
            if (orderModal) {
                orderModal.classList.add('hidden');
                console.log('processos.js: orderModal fechado (delegado)');
            }
            editingOrderId = null;
        }
        // Fechar modal de corte
        if (btn.id === 'close-cutting-modal-btn' || btn.closest && btn.closest('[data-action="close-cutting-modal"]')) {
            e.preventDefault();
            const modal = document.getElementById('cutting-modal');
            if (modal) { modal.classList.add('hidden'); console.log('processos.js: cuttingModal fechado (delegado)'); }
            activeCuttingOrderId = null;
        }
        // Fechar modal de finalização
        if (btn.id === 'close-finishing-modal-btn' || btn.closest && btn.closest('[data-action="close-finishing-modal"]')) {
            e.preventDefault();
            const modal = document.getElementById('finishing-modal');
            if (modal) { modal.classList.add('hidden'); console.log('processos.js: finishingModal fechado (delegado)'); }
            activeFinishingOrderId = null;
        }
        // Fechar modal de arte
        if (btn.id === 'close-art-modal-btn' || btn.closest && btn.closest('[data-action="close-art-modal"]')) {
            e.preventDefault();
            const modal = document.getElementById('art-modal');
            if (modal) { modal.classList.add('hidden'); console.log('processos.js: artModal fechado (delegado)'); }
            activeArtOrderId = null;
        }
    });

    // Registrar erros JS visíveis no console para diagnóstico rápido
    window.addEventListener('error', (ev) => {
        console.error('processos.js - erro detectado:', ev.message, 'em', ev.filename, 'linha', ev.lineno);
    });

    // Diagnóstico e correção temporária de overlays que cobrem a tela
    (function detectAndFixOverlays() {
        const modalIds = ['order-modal', 'cutting-modal', 'finishing-modal', 'art-modal', 'art-image-fullscreen-modal'];
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // lista elementos fullscreen visíveis que podem estar cobrindo a tela
        const candidates = Array.from(document.body.querySelectorAll('*')).filter(el => {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            const r = el.getBoundingClientRect();
            // cobrir quase toda a viewport ou posicionamento fixed/full
            return (r.width >= vw - 2 && r.height >= vh - 2) || (cs.position === 'fixed' && r.top <= 0 && r.left <= 0 && r.bottom >= vh && r.right >= vw);
        });

        if (candidates.length) {
            console.warn('processos.js: possíveis overlays fullscreen encontrados:', candidates);
            candidates.forEach(el => {
                const z = getComputedStyle(el).zIndex || 'auto';
                console.warn(' ->', el.tagName, el.id || el.className, 'zIndex=', z);
            });
        } else {
            console.log('processos.js: nenhum overlay fullscreen detectado automaticamente.');
        }

        // Auto-fix: desativa pointer-events em overlays que NÃO são os modais conhecidos
        candidates.forEach(el => {
            if (!modalIds.includes(el.id)) {
                // marcar para restaurar se necessário
                if (!el.dataset._overlayPatched) {
                    el.dataset._overlayPatched = '1';
                    el._oldPointerEvents = el.style.pointerEvents || '';
                    el.style.pointerEvents = 'none';
                    el.style.userSelect = 'auto';
                    console.warn('processos.js: pointer-events disabled em', el);
                }
            } else {
                // garante que modais estejam acima e recebam eventos
                el.style.zIndex = '99999';
                el.style.pointerEvents = 'auto';
            }
        });

        // helper para depurar cliques: mostra elemento que recebe o clique
        document.addEventListener('click', (ev) => {
            const top = document.elementFromPoint(ev.clientX, ev.clientY);
            if (top) {
                console.log('processos.js: elemento no ponto do clique ->', top.tagName, top.id || top.className);
            }
        }, { capture: true });

        // Expor função para restaurar overlays (usar no console se precisar)
        window.__restoreOverlays = () => {
            document.querySelectorAll('[data-_overlayPatched="1"]').forEach(el => {
                el.style.pointerEvents = el._oldPointerEvents || '';
                delete el.dataset._overlayPatched;
                delete el._oldPointerEvents;
                console.log('processos.js: restaurado pointer-events em', el);
            });
        };
    })();

    // Helpers de cor
    const isHex = (v) => /^#([0-9A-F]{3}){1,2}$/i.test((v || '').trim());
    const hexToRgb = (hex) => {
        if (!hex) return null;
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(h => h + h).join('');
        const int = parseInt(hex, 16);
        return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
    };
    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    const rgbToCmyk = (r, g, b) => {
        if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
        const rn = r / 255, gn = g / 255, bn = b / 255;
        const k = 1 - Math.max(rn, gn, bn);
        const c = Math.round(((1 - rn - k) / (1 - k)) * 100);
        const m = Math.round(((1 - gn - k) / (1 - k)) * 100);
        const y = Math.round(((1 - bn - k) / (1 - k)) * 100);
        return { c: Math.max(0, c), m: Math.max(0, m), y: Math.max(0, y), k: Math.round(k * 100) };
    };
    const formatCMYK = (cmyk) => `C:${cmyk.c}% M:${cmyk.m}% Y:${cmyk.y}% K:${cmyk.k}%`;

    // Renderizador avançado de cores (swatch + colorpicker + hex + CMYK + eyedropper)
    function renderColors(colors = []) {
        if (!orderColorsContainer) return;
        orderColorsContainer.innerHTML = '';
        colors.forEach((color, idx) => {
            const safeColor = color && typeof color === 'string' ? color.trim() : '';
            const hex = isHex(color) ? color.toUpperCase() : (isHex(safeColor) ? safeColor.toUpperCase() : '');
            const rgb = hex ? hexToRgb(hex) : { r: 0, g: 0, b: 0 };
            const cmyk = hex ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : { c: 0, m: 0, y: 0, k: 100 };
            const colorHtml = `
            <div class="color-entry flex items-center gap-2 mb-2" data-idx="${idx}">
                <div class="color-swatch w-10 h-10 rounded border" style="background:${hex || 'transparent'};min-width:40px;min-height:40px"></div>
                <input type="color" class="color-picker w-10 h-10 p-0 border-0" value="${hex || '#000000'}" title="Abrir seletor de cor">
                <input type="text" class="color-hex p-1 rounded bg-white/10 border border-white/20 text-xs w-28" value="${hex || ''}" placeholder="#RRGGBB">
                <button type="button" class="eye-dropper-btn px-2 py-1 rounded bg-white/5 text-xs" title="Eyedropper"><span class="syt-img-icon tiny icon-target" aria-hidden="true"></span></button>
                <div class="cmyk text-xs text-gray-300 ml-2">${hex ? formatCMYK(cmyk) : 'CMYK N/A'}</div>
                <button type="button" class="remove-color-btn text-red-500 hover:text-red-400 ml-4 px-2 py-1 rounded" data-idx="${idx}">×</button>
            </div>
        `;
            orderColorsContainer.insertAdjacentHTML('beforeend', colorHtml);
        });
    }

    // +Cor: cria nova cor padrão
    if (addColorBtn) {
        addColorBtn.addEventListener('click', () => {
            const current = Array.from(orderColorsContainer.querySelectorAll('.color-hex')).map(i => i.value);
            // adiciona um placeholder hex para facilitar escolha
            renderColors([...current, '#000000']);
        });
    }

    // Delegate para interações dentro do container de cores
    if (orderColorsContainer) {
        // click (remove, eyedropper)
        orderColorsContainer.addEventListener('click', async (e) => {
            const target = e.target;
            // remover cor
            if (target.classList.contains('remove-color-btn')) {
                const idx = parseInt(target.dataset.idx, 10);
                const colors = Array.from(orderColorsContainer.querySelectorAll('.color-hex')).map(i => i.value);
                colors.splice(idx, 1);
                renderColors(colors);
                return;
            }

            // eyedropper (usa API se disponível)
            if (target.classList.contains('eye-dropper-btn')) {
                const entry = target.closest('.color-entry');
                if (!entry) return;
                const hexInput = entry.querySelector('.color-hex');
                const colorPicker = entry.querySelector('.color-picker');

                const picked = await pickColorWithEyeDropper();
                if (picked) {
                    if (hexInput) hexInput.value = picked;
                    if (colorPicker) colorPicker.value = picked;
                    // update swatch + CMYK
                    const sw = entry.querySelector('.color-swatch');
                    if (sw) sw.style.background = picked;
                    const cmykEl = entry.querySelector('.cmyk');
                    if (cmykEl) {
                        const rgb = hexToRgb(picked);
                        const cmyk = rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : { c: 0, m: 0, y: 0, k: 100 };
                        cmykEl.textContent = formatCMYK(cmyk);
                    }
                }
                return;
            }
        });

        // input (color picker or hex text changes) - delegação
        orderColorsContainer.addEventListener('input', (e) => {
            const target = e.target;
            const entry = target.closest('.color-entry');
            if (!entry) return;

            const sw = entry.querySelector('.color-swatch');
            const colorPicker = entry.querySelector('.color-picker');
            const hexInput = entry.querySelector('.color-hex');
            const cmykEl = entry.querySelector('.cmyk');

            if (target.classList.contains('color-picker')) {
                // sync picker -> hex
                const v = (target.value || '').toUpperCase();
                if (hexInput) hexInput.value = v;
                if (sw) sw.style.background = v;
                if (cmykEl) {
                    const rgb = hexToRgb(v);
                    const cmyk = rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : { c: 0, m: 0, y: 0, k: 100 };
                    cmykEl.textContent = formatCMYK(cmyk);
                }
            }

            if (target.classList.contains('color-hex')) {
                let v = (target.value || '').trim();
                if (v && !v.startsWith('#')) v = '#' + v;
                v = v.toUpperCase();
                // update picker if valid hex
                if (isHex(v)) {
                    if (colorPicker) colorPicker.value = v;
                    if (sw) sw.style.background = v;
                    if (cmykEl) {
                        const rgb = hexToRgb(v);
                        const cmyk = rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : { c: 0, m: 0, y: 0, k: 100 };
                        cmykEl.textContent = formatCMYK(cmyk);
                    }
                }
            }
        });

        // blur on hex input: normalize value (adds # and uppercase)
        orderColorsContainer.addEventListener('blur', (e) => {
            const target = e.target;
            if (!target.classList || !target.classList.contains('color-hex')) return;
            let v = (target.value || '').trim();
            if (!v) return;
            if (!v.startsWith('#')) v = '#' + v;
            v = v.toUpperCase();
            target.value = v;
            // trigger input handler to sync UI
            const ev = new Event('input', { bubbles: true });
            target.dispatchEvent(ev);
        }, true);
    } // end if (orderColorsContainer)

    // Assistentes externos removidos na versão 6.0.0.

    // Inicializa a aba selecionada (persistida) após registrar todos os renderizadores
    // Evita erro de TDZ: "Cannot access 'renderArtTasks' before initialization"
    setActiveTab(currentTab);

    // Assistentes externos removidos na versão 6.0.0

}; // end init

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
//
