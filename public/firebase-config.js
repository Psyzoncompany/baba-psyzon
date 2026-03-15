// c:\Users\AAAA\Desktop\sitey-caixa\firebase-config.js

// Importa as funções do Firebase (versão compat para facilitar o uso com scripts existentes)
import { onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, serverTimestamp, deleteField } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { app, auth, db } from "./js/firebase-init.js";


const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Persistência padrão: sessão (morre ao fechar o navegador)
// Só usa persistência local se o usuário marcar "Lembrar dispositivo"
const setAuthPersistence = async (remember = false) => {
    try {
        const mode = remember ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, mode);
    } catch (error) {
        console.warn('Não foi possível definir persistência de auth:', error);
    }
};

// Som de sucesso sutil (Web Audio API)
let audioCtx = null;
const unlockAudio = () => {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
};
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

const playSuccessSound = () => {
    try {
        if (!audioCtx) unlockAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota A5
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime); // Volume baixo (5%)
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) { }
};

// State for automatic cloud sync
let hasUnsavedChanges = false;
let initialSnapshot = "{}"; // Armazena o estado inicial para comparação
let autosaveTimer = null;
let autosaveInFlight = null;
let unsubscribeCloudSync = null;
const activeListeners = [];
const AUTOSAVE_DELAY_MS = 900;
let floatingSaveButton = null;
let realtimeRefreshTimer = null;

const registerActiveListener = (unsubscribe) => {
    if (typeof unsubscribe !== 'function') return;
    activeListeners.push(unsubscribe);
};

const cleanupActiveListeners = () => {
    activeListeners.forEach((unsubscribe) => {
        try {
            unsubscribe();
        } catch (error) {
            console.warn('Falha ao encerrar listener ativo:', error);
        }
    });
    activeListeners.length = 0;
};

const isIndexPage = () => {
    const path = window.location.pathname || '';
    return path === '/' || path.endsWith('/index.html') || path.endsWith('index.html');
};

const updateFloatingSaveButtonState = () => {
    if (!floatingSaveButton) return;
    const isDirty = hasUnsavedChanges;
    floatingSaveButton.style.display = isDirty ? 'inline-flex' : 'none';
    floatingSaveButton.classList.toggle('unsaved', isDirty);
    floatingSaveButton.setAttribute('aria-label', isDirty ? 'Salvar alterações pendentes' : 'Tudo salvo');
    floatingSaveButton.title = isDirty ? 'Salvar alterações pendentes' : 'Tudo salvo';
    document.body.classList.toggle('has-manual-save-fab', isDirty);
};

const ensureFloatingSaveButton = () => {
    if (!isIndexPage() || window.location.pathname.endsWith('login.html')) {
        document.body.classList.remove('has-manual-save-fab');
        return;
    }
    if (floatingSaveButton?.isConnected) {
        updateFloatingSaveButtonState();
        return;
    }

    const existingBtn = document.getElementById('floating-save-btn');
    if (existingBtn) {
        floatingSaveButton = existingBtn;
        updateFloatingSaveButtonState();
        return;
    }

    const btn = document.createElement('button');
    btn.id = 'floating-save-btn';
    btn.type = 'button';
    btn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" aria-labelledby="cloudTitle cloudDesc" role="img">
    <title id="cloudTitle">Salvar na Nuvem</title>
    <desc id="cloudDesc">Ícone animado circular de um site enviando dados para a nuvem.</desc>

    <style>
        /* 🌀 Animação do anel externo */
        .anim-ring {
            animation: spin 5s linear infinite;
            transform-origin: 100px 100px;
        }

        /* ⬆️ Animação da seta de upload */
        .anim-arrow {
            animation: upload-arrow 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* ☁️ Pulo da Nuvem ao receber o dado */
        .anim-cloud {
            animation: cloud-bounce 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            transform-origin: 100px 68px; /* Centro da nuvem */
        }

        /* 💧 Efeito de confirmação (Ripple) na nuvem */
        .anim-ripple {
            animation: cloud-ripple 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            transform-origin: 100px 68px;
        }

        /* 🎬 Keyframes */
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes upload-arrow {
            0%, 15% { transform: translateY(16px); opacity: 0; }
            25% { transform: translateY(4px); opacity: 1; }
            40% { transform: translateY(-12px); opacity: 1; }
            45%, 100% { transform: translateY(-16px); opacity: 0; }
        }

        @keyframes cloud-bounce {
            0%, 38% { transform: scale(1); }
            42% { transform: scale(1.06); }
            48%, 100% { transform: scale(1); }
        }

        @keyframes cloud-ripple {
            0%, 40% { r: 0; opacity: 0; stroke-width: 3px; }
            42% { opacity: 0.6; }
            60%, 100% { r: 24; opacity: 0; stroke-width: 0px; }
        }

        /* 🛑 Respeito à preferência do usuário de não ter animações */
        @media (prefers-reduced-motion: reduce) {
            .anim-ring, .anim-arrow, .anim-cloud, .anim-ripple {
                animation: none !important;
            }
            .anim-arrow { opacity: 1; transform: translateY(-6px); }
        }
    </style>

    <!-- 1) ⭕ CÍRCULO EXTERNO -->
    <g id="ring-container">
        <circle cx="100" cy="100" r="86" fill="currentColor" opacity="0.03" />
        <circle cx="100" cy="100" r="86" stroke="currentColor" stroke-width="2" fill="none" opacity="0.1" />
        <circle class="anim-ring" cx="100" cy="100" r="86" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="140 400" fill="none" opacity="0.9" />
    </g>

    <!-- 2) 🌐 NAVEGADOR / SITE -->
    <g id="browser">
        <!-- Corpo da janela -->
        <rect x="50" y="110" width="100" height="54" rx="6" stroke="currentColor" stroke-width="4" fill="none" opacity="0.8" />
        
        <!-- Barra superior -->
        <line x1="50" y1="126" x2="150" y2="126" stroke="currentColor" stroke-width="2" opacity="0.4" />
        
        <!-- Botões de controle da janela (pontinhos) -->
        <circle cx="62" cy="118" r="2" fill="currentColor" opacity="0.5"/>
        <circle cx="70" cy="118" r="2" fill="currentColor" opacity="0.5"/>
        <circle cx="78" cy="118" r="2" fill="currentColor" opacity="0.5"/>
        
        <!-- Conteúdo do site (linhas abstratas) -->
        <line x1="62" y1="140" x2="138" y2="140" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3" />
        <line x1="62" y1="152" x2="100" y2="152" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3" />
    </g>

    <!-- 3) ⬆️ SETA DE UPLOAD (Animada) -->
    <g class="anim-arrow" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
        <line x1="100" y1="104" x2="100" y2="88" />
        <polyline points="92 96 100 88 108 96" />
    </g>

    <!-- 4) 💧 RIPPLE DA NUVEM -->
    <circle class="anim-ripple" cx="100" cy="68" r="0" fill="none" stroke="currentColor" stroke-width="2" />

    <!-- 5) ☁️ NUVEM GEOMÉTRICA (Animada) -->
    <g class="anim-cloud" fill="currentColor" opacity="0.95">
        <!-- Estrutura feita de círculos perfeitamente alinhados -->
        <circle cx="100" cy="60" r="16" /> <!-- Centro -->
        <circle cx="84" cy="70" r="12" />  <!-- Esquerda -->
        <circle cx="116" cy="70" r="12" /> <!-- Direita -->
        <!-- Base retangular para unir tudo e arredondar os cantos inferiores -->
        <rect x="72" y="70" width="56" height="12" rx="6" />
    </g>

</svg>
    `;
    btn.addEventListener('click', () => saveToCloud({ force: true }));
    document.body.appendChild(btn);

    floatingSaveButton = btn;
    updateFloatingSaveButtonState();
};

// Chaves de UI/estado temporário que NÃO devem marcar o estado como alterado
// Ex.: aba ativa da tela de processos.
const NON_PERSISTENT_DIRTY_KEYS = new Set([
    'processos_tab',
    'prefill_order_form'
]);

// Helper para criar um snapshot determinístico (ordena chaves para garantir comparação correta)
const getSnapshot = (data) => {
    const sortObj = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(sortObj);
        return Object.keys(obj).sort().reduce((acc, key) => {
            if (NON_PERSISTENT_DIRTY_KEYS.has(key)) return acc;
            acc[key] = sortObj(obj[key]);
            return acc;
        }, {});
    };
    return JSON.stringify(sortObj(data));
};
const parseLocalJson = (key, fallback = []) => {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (_) {
        return fallback;
    }
};

const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${deadline}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / 86400000);
};

const collectPendingChecklistTasks = () => {
    const orders = parseLocalJson('production_orders', []);
    const clients = parseLocalJson('clients', []);
    const checklistLabels = {
        sewing: 'Costura',
        cutting: 'Corte',
        printing: 'Estampa',
        embroidery: 'Bordado',
        finishing: 'Acabamento',
        expedition: 'Expedição'
    };

    const tasks = [];
    orders.forEach((order) => {
        if (!order || order.status === 'done' || !order.checklist) return;
        Object.entries(order.checklist).forEach(([taskKey, task]) => {
            if (!task || task.completed || !task.deadline) return;
            const daysUntil = getDaysUntilDeadline(task.deadline);
            if (daysUntil === null) return;
            const client = clients.find((item) => String(item.id) === String(order.clientId));
            tasks.push({
                orderId: order.id,
                orderDescription: order.description || 'Pedido sem descrição',
                taskKey,
                taskName: checklistLabels[taskKey] || taskKey,
                clientName: client?.name || 'Cliente',
                deadline: task.deadline,
                daysUntil
            });
        });
    });
    return tasks;
};

const createGlobalCalculator = () => {
    if (document.body.dataset.globalCalculatorReady === 'true') return;
    if (window.location.pathname.endsWith('login.html')) return;
    if (window.location.pathname.includes('/pessoal/')) return;
    if (document.getElementById('calculator-fab')) return;
    document.body.dataset.globalCalculatorReady = 'true';

    const fab = document.createElement('button');
    fab.id = 'calculator-fab-global';
    fab.className = 'calculator-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Abrir calculadora');
    fab.title = 'Calculadora';
    fab.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" aria-labelledby="calcTitle calcDesc" role="img">
            <title id="calcTitle">Calculadora Animada</title>
            <desc id="calcDesc">Ícone animado circular de uma calculadora minimalista com um dedo calculando continuamente.</desc>

            <style>
                /* Animações CSS embutidas no SVG */
                .anim-ring {
                    animation: spin 4s linear infinite;
                    transform-origin: 100px 100px;
                }
                
                .anim-finger {
                    animation: tap 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                .anim-button {
                    animation: button-press 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    transform-origin: 120px 130px; /* Centro do botão ativo */
                }

                .anim-ripple {
                    animation: ripple-expand 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    transform-origin: 120px 130px;
                }

                /* Keyframes */
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes tap {
                    0%, 15% { transform: translate(35px, 35px); opacity: 0; }
                    22% { opacity: 1; }
                    30% { transform: translate(0px, 0px); opacity: 1; }
                    34% { transform: translate(-1px, 2px) scale(0.96); opacity: 1; } /* Press */
                    42% { transform: translate(0px, 0px) scale(1); opacity: 1; } /* Release */
                    55% { transform: translate(35px, 35px); opacity: 0; }
                    100% { transform: translate(35px, 35px); opacity: 0; }
                }

                @keyframes button-press {
                    0%, 30% { transform: scale(1); opacity: 0.9; }
                    34% { transform: scale(0.85); opacity: 1; } /* Afunda */
                    42%, 100% { transform: scale(1); opacity: 0.9; }
                }

                @keyframes ripple-expand {
                    0%, 30% { r: 0; opacity: 0; stroke-width: 4px; }
                    32% { opacity: 0.5; }
                    48% { r: 26; opacity: 0; stroke-width: 0px; }
                    100% { r: 26; opacity: 0; stroke-width: 0px; }
                }

                /* Respeito à preferência do usuário de não ter animações */
                @media (prefers-reduced-motion: reduce) {
                    .anim-ring, .anim-finger, .anim-button, .anim-ripple {
                        animation: none !important;
                    }
                    .anim-finger { opacity: 0; } /* Esconde o dedo se não houver animação */
                }
            </style>

            <!-- 1) CÍRCULO EXTERNO (Fundo + Anel Animado) -->
            <g id="ring-container">
                <!-- Fundo sutil -->
                <circle cx="100" cy="100" r="86" fill="currentColor" opacity="0.03" />
                <circle cx="100" cy="100" r="86" stroke="currentColor" stroke-width="2" fill="none" opacity="0.1" />
                <!-- Anel que gira -->
                <circle class="anim-ring" cx="100" cy="100" r="86" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="140 400" fill="none" opacity="0.9" />
            </g>

            <!-- 2) CALCULADORA MINIMALISTA -->
            <g id="calculator">
                <!-- Corpo -->
                <rect x="60" y="42" width="80" height="116" rx="12" stroke="currentColor" stroke-width="4" fill="none" opacity="0.8" />
                
                <!-- Display -->
                <rect x="72" y="56" width="56" height="22" rx="4" fill="currentColor" opacity="0.15" />
                <!-- Linhas do Display (Simulando números) -->
                <line x1="78" y1="63" x2="96" y2="63" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4" />
                <line x1="78" y1="71" x2="118" y2="71" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7" />

                <!-- Grade de Botões (Inativos) -->
                <!-- Linha 1 -->
                <rect x="72" y="88" width="16" height="12" rx="4" fill="currentColor" opacity="0.2" />
                <rect x="92" y="88" width="16" height="12" rx="4" fill="currentColor" opacity="0.2" />
                <rect x="112" y="88" width="16" height="12" rx="4" fill="currentColor" opacity="0.2" />
                <!-- Linha 2 -->
                <rect x="72" y="106" width="16" height="12" rx="4" fill="currentColor" opacity="0.2" />
                <rect x="92" y="106" width="16" height="12" rx="4" fill="currentColor" opacity="0.2" />
                <!-- Ícone sutil de '+' no botão lateral -->
                <g opacity="0.4">
                    <rect x="112" y="106" width="16" height="12" rx="4" fill="currentColor" opacity="0.5" />
                    <path d="M117 112 h6 M120 109 v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
                </g>
                <!-- Linha 3 -->
                <rect x="72" y="124" width="16" height="12" rx="4" fill="currentColor" opacity="0.2" />
                <rect x="92" y="124" width="16" height="12" rx="4" fill="currentColor" opacity="0.2" />
                
                <!-- Botão Ativo (Animado) -->
                <rect id="button-active" class="anim-button" x="112" y="124" width="16" height="12" rx="4" fill="currentColor" opacity="0.9" />
            </g>

            <!-- 3) EFEITO RIPPLE -->
            <circle id="ripple" class="anim-ripple" cx="120" cy="130" r="0" fill="none" stroke="currentColor" stroke-width="2" />

            <!-- 4) DEDO / MÃO MINIMALISTA (Animado) -->
            <g class="anim-finger">
                <!-- Rotacionado para vir da diagonal inferior direita -->
                <g transform="translate(120, 130) rotate(-40)">
                    <!-- Restante da mão (palma/outros dedos juntos) -->
                    <rect x="7" y="14" width="22" height="26" rx="6" fill="currentColor" opacity="0.5" />
                    <!-- Dedo indicador em destaque -->
                    <rect x="-6" y="-4" width="12" height="42" rx="6" fill="currentColor" opacity="0.95" />
                </g>
            </g>

        </svg>
    `;

    const modal = document.createElement('div');
    modal.id = 'calculator-modal-global';
    modal.className = 'calculator-modal hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="calculator-sheet">
        <div class="calculator-head">
          <h2>Calculadora</h2>
          <button id="calculator-close-global" type="button" aria-label="Fechar calculadora">✕</button>
        </div>
        <div class="calculator-screen-wrap">
          <p id="calculator-expression-global" class="calculator-expression">0</p>
          <p id="calculator-display-global" class="calculator-display">0</p>
        </div>
        <div class="calculator-grid">
          <button data-calc-action="clear">AC</button>
          <button data-calc-action="backspace">⌫</button>
          <button data-calc-action="percent">%</button>
          <button data-calc-value="/" class="is-op">÷</button>
          <button data-calc-value="7">7</button><button data-calc-value="8">8</button><button data-calc-value="9">9</button><button data-calc-value="*" class="is-op">×</button>
          <button data-calc-value="4">4</button><button data-calc-value="5">5</button><button data-calc-value="6">6</button><button data-calc-value="-" class="is-op">−</button>
          <button data-calc-value="1">1</button><button data-calc-value="2">2</button><button data-calc-value="3">3</button><button data-calc-value="+" class="is-op">+</button>
          <button data-calc-action="toggle-sign">±</button><button data-calc-value="0">0</button><button data-calc-value=".">.</button><button data-calc-action="equals" class="is-equals">=</button>
        </div>
        <div class="calculator-history-head"><strong>Histórico</strong><button id="calculator-clear-history-global" type="button">Limpar</button></div>
        <ul id="calculator-history-global" class="calculator-history"></ul>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#calculator-close-global');
    const expressionEl = modal.querySelector('#calculator-expression-global');
    const displayEl = modal.querySelector('#calculator-display-global');
    const historyEl = modal.querySelector('#calculator-history-global');
    const clearHistoryBtn = modal.querySelector('#calculator-clear-history-global');

    const HISTORY_KEY = 'dashboardCalculatorHistory';
    const operators = new Set(['+', '-', '*', '/']);
    let expression = '';

    const formatResult = (value) => {
        if (!Number.isFinite(value)) return 'Erro';
        const fixed = Math.abs(value) >= 1 ? Number(value.toFixed(8)) : Number(value.toPrecision(8));
        return fixed.toLocaleString('pt-BR', { maximumFractionDigits: 8 });
    };

    const sanitizeExpression = (raw) => raw.replace(/,/g, '.').replace(/[^0-9+\-*/().]/g, '');
    const evaluateExpression = (raw) => {
        const clean = sanitizeExpression(raw);
        if (!clean) return null;
        try {
            return Function(`"use strict"; return (${clean});`)();
        } catch (_) {
            return null;
        }
    };
    const readHistory = () => {
        try {
            const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    };
    const writeHistory = (entries) => localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 20)));
    const renderHistory = () => {
        const entries = readHistory();
        historyEl.innerHTML = entries.length
            ? entries.map((item) => `<li><span>${item.expression}</span><strong>${item.result}</strong></li>`).join('')
            : '<li class="calculator-history-empty">Sem cálculos ainda.</li>';
    };
    const setExpression = (value) => {
        expression = value || '';
        expressionEl.textContent = expression || '0';
        const result = evaluateExpression(expression);
        displayEl.textContent = result === null ? '0' : formatResult(Number(result));
    };
    const appendValue = (value) => {
        if (value === '.') {
            const lastChunk = expression.split(/[+\-*/]/).pop();
            if (lastChunk.includes('.')) return;
        }
        if (operators.has(value)) {
            const last = expression.slice(-1);
            if (!expression && value !== '-') return;
            if (operators.has(last)) expression = expression.slice(0, -1);
        }
        setExpression(expression + value);
    };
    const applyPercent = () => {
        const result = evaluateExpression(expression);
        if (result === null) return;
        setExpression(String(Number(result) / 100));
    };
    const toggleSign = () => {
        const result = evaluateExpression(expression);
        if (result === null) return;
        setExpression(String(Number(result) * -1));
    };
    const finalize = () => {
        const result = evaluateExpression(expression);
        if (result === null) return;
        const formatted = formatResult(Number(result));
        const entries = readHistory();
        entries.unshift({ expression: expression || '0', result: formatted, at: Date.now() });
        writeHistory(entries);
        renderHistory();
        setExpression(String(Number(result)));
    };

    modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.add('hidden'); });
    fab.addEventListener('click', () => modal.classList.remove('hidden'));
    closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));
    modal.querySelectorAll('[data-calc-value]').forEach((btn) => btn.addEventListener('click', () => appendValue(btn.getAttribute('data-calc-value') || '')));
    modal.querySelectorAll('[data-calc-action]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-calc-action');
            if (action === 'clear') setExpression('');
            if (action === 'backspace') setExpression(expression.slice(0, -1));
            if (action === 'percent') applyPercent();
            if (action === 'toggle-sign') toggleSign();
            if (action === 'equals') finalize();
        });
    });
    clearHistoryBtn?.addEventListener('click', () => {
        writeHistory([]);
        renderHistory();
    });

    renderHistory();
    setExpression('');
};


const createFloatingNotes = () => {
    if (document.body.dataset.floatingNotesReady === 'true') return;
    if (window.location.pathname.endsWith('login.html')) return;
    if (window.location.pathname.includes('/pessoal/')) return;
    document.body.dataset.floatingNotesReady = 'true';

    const fab = document.createElement('button');
    fab.id = 'notes-fab-global';
    fab.className = 'notes-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Abrir bloco de anotações');
    fab.title = 'Anotações';
    fab.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" aria-labelledby="notaTitle notaDesc" role="img">
    <title id="notaTitle">Bloco de Notas Animado</title>
    <desc id="notaDesc">Ícone animado circular de um bloco de notas minimalista com uma caneta escrevendo continuamente.</desc>

    <style>
        /* 🌀 Animação do anel externo */
        .anim-ring {
            animation: spin 4s linear infinite;
            transform-origin: 100px 100px;
        }
        
        /* ✍️ Animação da caneta se movendo */
        .anim-pen {
            animation: write 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* 📏 Animação da linha sendo desenhada */
        .anim-line {
            animation: draw-line 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* 💧 Efeito de ripple ao tocar no papel */
        .anim-ripple {
            animation: touch-ripple 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            transform-origin: 76px 104px;
        }

        /* 🎬 Keyframes */
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes write {
            0%, 15% { transform: translate(90px, 130px); opacity: 0; }
            25% { transform: translate(76px, 104px); opacity: 1; } /* Toca no papel */
            60% { transform: translate(124px, 104px); opacity: 1; } /* Termina linha */
            75% { transform: translate(140px, 120px); opacity: 0; } /* Sai */
            100% { transform: translate(90px, 130px); opacity: 0; }
        }

        @keyframes draw-line {
            0%, 24% { stroke-dashoffset: 48; opacity: 0; }
            25% { opacity: 0.8; }
            60% { stroke-dashoffset: 0; opacity: 0.8; }
            80% { stroke-dashoffset: 0; opacity: 0.8; }
            90%, 100% { stroke-dashoffset: 0; opacity: 0; }
        }

        @keyframes touch-ripple {
            0%, 23% { r: 0; opacity: 0; stroke-width: 3px; }
            25% { opacity: 0.4; }
            40% { r: 14; opacity: 0; stroke-width: 0px; }
            100% { r: 14; opacity: 0; stroke-width: 0px; }
        }

        /* 🛑 Respeito à preferência do usuário de não ter animações */
        @media (prefers-reduced-motion: reduce) {
            .anim-ring, .anim-pen, .anim-line, .anim-ripple {
                animation: none !important;
            }
            .anim-pen { opacity: 0; } 
            .anim-line { stroke-dashoffset: 0; opacity: 0.8; }
        }
    </style>

    <!-- 1) ⭕ CÍRCULO EXTERNO -->
    <g id="ring-container">
        <circle cx="100" cy="100" r="86" fill="currentColor" opacity="0.03" />
        <circle cx="100" cy="100" r="86" stroke="currentColor" stroke-width="2" fill="none" opacity="0.1" />
        <circle class="anim-ring" cx="100" cy="100" r="86" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="140 400" fill="none" opacity="0.9" />
    </g>

    <!-- 2) 📋 BLOCO DE NOTAS MINIMALISTA -->
    <g id="notepad">
        <!-- Prancheta/Papel -->
        <rect x="64" y="44" width="72" height="100" rx="8" stroke="currentColor" stroke-width="4" fill="none" opacity="0.8" />
        
        <!-- Clipe superior -->
        <rect x="80" y="38" width="40" height="12" rx="4" fill="currentColor" opacity="0.4" />
        <rect x="90" y="34" width="20" height="6" rx="3" fill="currentColor" opacity="0.9" />

        <!-- Linhas estáticas -->
        <line x1="76" y1="68" x2="124" y2="68" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3" />
        <line x1="76" y1="86" x2="106" y2="86" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3" />

        <!-- Linha sendo escrita (Animada) -->
        <line class="anim-line" x1="76" y1="104" x2="124" y2="104" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.8" stroke-dasharray="48" stroke-dashoffset="48" />
    </g>

    <!-- 3) 💧 EFEITO RIPPLE -->
    <circle class="anim-ripple" cx="76" cy="104" r="0" fill="none" stroke="currentColor" stroke-width="2" />

    <!-- 4) 🖊️ CANETA MINIMALISTA (Animada) -->
    <g class="anim-pen">
        <g transform="rotate(35)">
            <!-- Ponta -->
            <path d="M 0 0 L -3 -8 L 3 -8 Z" fill="currentColor" opacity="0.95" />
            <!-- Corpo -->
            <rect x="-3" y="-32" width="6" height="24" rx="2" stroke="currentColor" stroke-width="2" fill="none" opacity="0.8" />
            <!-- Borracha/Topo -->
            <rect x="-3" y="-38" width="6" height="6" rx="2" fill="currentColor" opacity="0.5" />
        </g>
    </g>

</svg>
`;

    const modal = document.createElement('div');
    modal.id = 'notes-modal-global';
    modal.className = 'notes-modal hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="notes-sheet">
        <div class="notes-head">
          <div>
            <h2>Anotações</h2>
            <p class="notes-subtitle">Bloco rápido estilo iPhone, agora com abas</p>
          </div>
          <button id="notes-close-global" type="button" aria-label="Fechar bloco de anotações">✕</button>
        </div>

        <div class="notes-tabs-wrap">
          <div id="notes-tabs-global" class="notes-tabs" role="tablist" aria-label="Abas de anotações"></div>
          <button id="notes-add-tab-global" type="button" class="notes-tab-add" aria-label="Adicionar nova aba">+ Nova</button>
        </div>

        <textarea id="notes-content-global" class="notes-textarea" placeholder="Escreva aqui o que você precisa fazer..."></textarea>

        <div class="notes-footer">
          <div class="notes-meta">
            <span id="notes-status-global" class="notes-status">Salvo</span>
            <span id="notes-updated-at-global" class="notes-updated-at">Agora</span>
          </div>
          <div class="notes-actions">
            <button id="notes-rename-tab-global" type="button">Renomear aba</button>
            <button id="notes-delete-tab-global" type="button">Excluir aba</button>
            <button id="notes-clear-global" type="button">Limpar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(modal);

    const NOTES_KEY = 'floatingQuickNotesV2';
    const textarea = modal.querySelector('#notes-content-global');
    const closeBtn = modal.querySelector('#notes-close-global');
    const clearBtn = modal.querySelector('#notes-clear-global');
    const addTabBtn = modal.querySelector('#notes-add-tab-global');
    const renameTabBtn = modal.querySelector('#notes-rename-tab-global');
    const deleteTabBtn = modal.querySelector('#notes-delete-tab-global');
    const tabsContainer = modal.querySelector('#notes-tabs-global');
    const statusEl = modal.querySelector('#notes-status-global');
    const updatedAtEl = modal.querySelector('#notes-updated-at-global');
    let saveTimer = null;

    const makeTab = (title = 'Nota') => ({
        id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title,
        content: '',
        updatedAt: Date.now()
    });

    let notesState = {
        activeId: null,
        tabs: [makeTab('Nota 1')]
    };

    const getActiveTab = () => notesState.tabs.find((tab) => tab.id === notesState.activeId) || notesState.tabs[0];

    const setStatus = (textStatus) => {
        if (statusEl) statusEl.textContent = textStatus;
    };

    const formatUpdatedAt = (timestamp) => {
        if (!timestamp) return 'Agora';
        return `Atualizado ${new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const persist = () => {
        try {
            localStorage.setItem(NOTES_KEY, JSON.stringify(notesState));
            setStatus('Salvo');
            const activeTab = getActiveTab();
            if (updatedAtEl) updatedAtEl.textContent = formatUpdatedAt(activeTab?.updatedAt);
        } catch (_) {
            setStatus('Erro ao salvar');
        }
    };

    const scheduleSave = () => {
        setStatus('Salvando...');
        clearTimeout(saveTimer);
        saveTimer = setTimeout(persist, 260);
    };

    const renderTabs = () => {
        if (!tabsContainer) return;
        tabsContainer.innerHTML = notesState.tabs.map((tab) => `
            <button type="button" class="notes-tab-btn ${tab.id === notesState.activeId ? 'is-active' : ''}" data-note-id="${tab.id}" role="tab" aria-selected="${tab.id === notesState.activeId ? 'true' : 'false'}" title="${tab.title}">
              ${tab.title}
            </button>
        `).join('');
    };

    const syncActiveToTextarea = () => {
        const activeTab = getActiveTab();
        if (!activeTab || !textarea) return;
        notesState.activeId = activeTab.id;
        textarea.value = activeTab.content || '';
        if (updatedAtEl) updatedAtEl.textContent = formatUpdatedAt(activeTab.updatedAt);
        renderTabs();
    };

    const loadState = () => {
        try {
            const parsed = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
            if (parsed && Array.isArray(parsed.tabs) && parsed.tabs.length) {
                notesState = {
                    activeId: parsed.activeId || parsed.tabs[0]?.id || null,
                    tabs: parsed.tabs.map((tab, idx) => ({
                        id: tab?.id || `note-${Date.now()}-${idx}`,
                        title: (tab?.title || `Nota ${idx + 1}`).slice(0, 22),
                        content: tab?.content || '',
                        updatedAt: tab?.updatedAt || Date.now()
                    }))
                };
                return;
            }
        } catch (_) { }
        notesState = {
            activeId: null,
            tabs: [makeTab('Nota 1')]
        };
    };

    loadState();
    if (!notesState.activeId && notesState.tabs[0]) notesState.activeId = notesState.tabs[0].id;
    syncActiveToTextarea();
    persist();

    window.addEventListener('cloud-data-updated', () => {
        // Se o usuário estiver digitando, evita sobrescrever o rascunho aberto.
        if (!modal.classList.contains('hidden') || saveTimer) return;
        const previous = JSON.stringify(notesState);
        loadState();
        const next = JSON.stringify(notesState);
        if (next !== previous) {
            syncActiveToTextarea();
            setStatus('Atualizado da nuvem');
        }
    });

    tabsContainer?.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-note-id]');
        if (!btn) return;
        const noteId = btn.getAttribute('data-note-id');
        const exists = notesState.tabs.some((tab) => tab.id === noteId);
        if (!exists) return;
        notesState.activeId = noteId;
        syncActiveToTextarea();
    });

    addTabBtn?.addEventListener('click', () => {
        const nextIndex = notesState.tabs.length + 1;
        const newTab = makeTab(`Nota ${nextIndex}`);
        notesState.tabs.push(newTab);
        notesState.activeId = newTab.id;
        syncActiveToTextarea();
        scheduleSave();
    });

    renameTabBtn?.addEventListener('click', () => {
        const activeTab = getActiveTab();
        if (!activeTab) return;
        const value = prompt('Nome da aba:', activeTab.title || '');
        if (value === null) return;
        const title = value.trim().slice(0, 22) || activeTab.title || 'Nota';
        activeTab.title = title;
        activeTab.updatedAt = Date.now();
        syncActiveToTextarea();
        scheduleSave();
    });

    deleteTabBtn?.addEventListener('click', () => {
        if (notesState.tabs.length <= 1) {
            alert('Você precisa manter pelo menos 1 aba de nota.');
            return;
        }
        const activeTab = getActiveTab();
        if (!activeTab) return;
        const confirmed = confirm(`Excluir a aba "${activeTab.title}"?`);
        if (!confirmed) return;
        notesState.tabs = notesState.tabs.filter((tab) => tab.id !== activeTab.id);
        notesState.activeId = notesState.tabs[0]?.id || null;
        syncActiveToTextarea();
        scheduleSave();
    });

    if (textarea) {
        textarea.addEventListener('input', () => {
            const activeTab = getActiveTab();
            if (!activeTab) return;
            activeTab.content = textarea.value;
            activeTab.updatedAt = Date.now();
            if (updatedAtEl) updatedAtEl.textContent = formatUpdatedAt(activeTab.updatedAt);
            scheduleSave();
        });
    }

    clearBtn?.addEventListener('click', () => {
        const activeTab = getActiveTab();
        if (!activeTab || !textarea) return;
        activeTab.content = '';
        activeTab.updatedAt = Date.now();
        textarea.value = '';
        if (updatedAtEl) updatedAtEl.textContent = formatUpdatedAt(activeTab.updatedAt);
        scheduleSave();
    });

    const closeModal = () => {
        clearTimeout(saveTimer);
        persist();
        modal.classList.add('hidden');
    };

    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    fab.addEventListener('click', () => {
        syncActiveToTextarea();
        modal.classList.remove('hidden');
    });

    closeBtn?.addEventListener('click', closeModal);

    window.addEventListener('beforeunload', () => {
        clearTimeout(saveTimer);
        persist();
    });
};

const createDueSoonTasksFab = () => {
    if (document.body.dataset.dueSoonFabReady === 'true') return;
    if (window.location.pathname.endsWith('login.html')) return;
    if (window.location.pathname.includes('/pessoal/')) return;
    document.body.dataset.dueSoonFabReady = 'true';

    const dueFab = document.createElement('button');
    dueFab.id = 'due-soon-fab';
    dueFab.className = 'due-soon-fab';
    dueFab.type = 'button';
    dueFab.title = 'Afazeres vencendo em até 2 dias';
    dueFab.innerHTML = `
        <span class="due-soon-fab__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" aria-labelledby="todoTitle todoDesc" role="img">
                <title id="todoTitle">Lista de Afazeres</title>
                <desc id="todoDesc">Ícone animado circular de uma lista de tarefas sendo preenchida com checkmarks por uma caneta.</desc>

                <style>
                    /* 🌀 Animação do anel externo */
                    .anim-ring {
                        animation: spin 6s linear infinite;
                        transform-origin: 100px 100px;
                    }

                    /* ✍️ Animação da caneta marcando as opções */
                    .anim-pen {
                        animation: pen-move 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    }

                    /* ✔️ Animação dos checkmarks se desenhando */
                    .anim-check-1 { animation: draw-check-1 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                    .anim-check-2 { animation: draw-check-2 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                    .anim-check-3 { animation: draw-check-3 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }

                    /* 💧 Efeitos Ripple para cada caixa marcada */
                    .anim-ripple-1 { animation: ripple-1 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; transform-origin: 76px 76px; }
                    .anim-ripple-2 { animation: ripple-2 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; transform-origin: 76px 106px; }
                    .anim-ripple-3 { animation: ripple-3 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; transform-origin: 76px 136px; }

                    /* 🎬 Keyframes */
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    @keyframes pen-move {
                        0%, 5% { transform: translate(160px, 160px); opacity: 0; }
                        10% { transform: translate(80px, 80px); opacity: 1; } /* Caixa 1 */
                        18% { transform: translate(80px, 80px); opacity: 1; }
                        25% { transform: translate(80px, 110px); opacity: 1; } /* Caixa 2 */
                        33% { transform: translate(80px, 110px); opacity: 1; }
                        40% { transform: translate(80px, 140px); opacity: 1; } /* Caixa 3 */
                        48% { transform: translate(80px, 140px); opacity: 1; }
                        55%, 100% { transform: translate(160px, 180px); opacity: 0; }
                    }

                    @keyframes draw-check-1 {
                        0%, 12% { stroke-dashoffset: 24; opacity: 0; }
                        13% { opacity: 1; stroke-dashoffset: 24; }
                        18%, 80% { stroke-dashoffset: 0; opacity: 1; }
                        85%, 100% { stroke-dashoffset: 0; opacity: 0; }
                    }

                    @keyframes draw-check-2 {
                        0%, 27% { stroke-dashoffset: 24; opacity: 0; }
                        28% { opacity: 1; stroke-dashoffset: 24; }
                        33%, 80% { stroke-dashoffset: 0; opacity: 1; }
                        85%, 100% { stroke-dashoffset: 0; opacity: 0; }
                    }

                    @keyframes draw-check-3 {
                        0%, 42% { stroke-dashoffset: 24; opacity: 0; }
                        43% { opacity: 1; stroke-dashoffset: 24; }
                        48%, 80% { stroke-dashoffset: 0; opacity: 1; }
                        85%, 100% { stroke-dashoffset: 0; opacity: 0; }
                    }

                    @keyframes ripple-1 {
                        0%, 12% { r: 0; opacity: 0; stroke-width: 3px; }
                        14% { opacity: 0.6; }
                        24%, 100% { r: 16; opacity: 0; stroke-width: 0px; }
                    }
                    @keyframes ripple-2 {
                        0%, 27% { r: 0; opacity: 0; stroke-width: 3px; }
                        29% { opacity: 0.6; }
                        39%, 100% { r: 16; opacity: 0; stroke-width: 0px; }
                    }
                    @keyframes ripple-3 {
                        0%, 42% { r: 0; opacity: 0; stroke-width: 3px; }
                        44% { opacity: 0.6; }
                        54%, 100% { r: 16; opacity: 0; stroke-width: 0px; }
                    }

                    /* 🛑 Respeito à preferência do usuário de não ter animações */
                    @media (prefers-reduced-motion: reduce) {
                        .anim-ring, .anim-pen, .anim-ripple-1, .anim-ripple-2, .anim-ripple-3 { animation: none !important; }
                        .anim-check-1, .anim-check-2, .anim-check-3 { animation: none !important; stroke-dashoffset: 0; opacity: 1; }
                        .anim-pen { opacity: 0; } 
                    }
                </style>

                <!-- 1) ⭕ CÍRCULO EXTERNO -->
                <g id="ring-container">
                    <circle cx="100" cy="100" r="86" fill="currentColor" opacity="0.03" />
                    <circle cx="100" cy="100" r="86" stroke="currentColor" stroke-width="2" fill="none" opacity="0.1" />
                    <circle class="anim-ring" cx="100" cy="100" r="86" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="140 400" fill="none" opacity="0.9" />
                </g>

                <!-- 2) 📋 PRANCHETA / LISTA -->
                <g id="clipboard">
                    <!-- Corpo da prancheta -->
                    <rect x="54" y="36" width="92" height="128" rx="8" stroke="currentColor" stroke-width="4" fill="none" opacity="0.8" />
                    
                    <!-- Clipe superior -->
                    <path d="M 80 36 V 30 C 80 26 84 26 84 26 H 116 C 116 26 120 26 120 30 V 36" fill="none" stroke="currentColor" stroke-width="4" opacity="0.5" stroke-linecap="round" stroke-linejoin="round" />
                    <rect x="86" y="32" width="28" height="8" rx="4" fill="currentColor" opacity="0.9" />

                    <!-- Linha 1 (Caixa + Texto) -->
                    <rect x="68" y="68" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2" fill="none" opacity="0.4" />
                    <line x1="94" y1="76" x2="134" y2="76" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3" />

                    <!-- Linha 2 (Caixa + Texto) -->
                    <rect x="68" y="98" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2" fill="none" opacity="0.4" />
                    <line x1="94" y1="106" x2="124" y2="106" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3" />

                    <!-- Linha 3 (Caixa + Texto) -->
                    <rect x="68" y="128" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2" fill="none" opacity="0.4" />
                    <line x1="94" y1="136" x2="114" y2="136" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3" />
                </g>

                <!-- 3) ✔️ CHECKMARKS ANIMADOS -->
                <g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9">
                    <path class="anim-check-1" d="M 72 76 L 75 80 L 81 72" stroke-dasharray="24" stroke-dashoffset="24" />
                    <path class="anim-check-2" d="M 72 106 L 75 110 L 81 102" stroke-dasharray="24" stroke-dashoffset="24" />
                    <path class="anim-check-3" d="M 72 136 L 75 140 L 81 132" stroke-dasharray="24" stroke-dashoffset="24" />
                </g>

                <!-- 4) 💧 EFEITOS RIPPLE (Pulsos) -->
                <circle class="anim-ripple-1" cx="76" cy="76" r="0" fill="none" stroke="currentColor" stroke-width="2" />
                <circle class="anim-ripple-2" cx="76" cy="106" r="0" fill="none" stroke="currentColor" stroke-width="2" />
                <circle class="anim-ripple-3" cx="76" cy="136" r="0" fill="none" stroke="currentColor" stroke-width="2" />

                <!-- 5) 🖊️ CANETA MINIMALISTA -->
                <g class="anim-pen">
                    <g transform="rotate(35)">
                        <!-- Ponta -->
                        <path d="M 0 0 L -3 -8 L 3 -8 Z" fill="currentColor" opacity="0.95" />
                        <!-- Corpo -->
                        <rect x="-3" y="-32" width="6" height="24" rx="2" stroke="currentColor" stroke-width="2" fill="none" opacity="0.8" />
                        <!-- Borracha/Topo -->
                        <rect x="-3" y="-38" width="6" height="6" rx="2" fill="currentColor" opacity="0.5" />
                    </g>
                </g>

            </svg>
        </span>
        <span id="due-soon-fab-count" class="due-soon-fab__count">0</span>
    `;
    dueFab.addEventListener('click', () => {
        window.location.href = 'processos.html?tab=afazeres&filter=due2days';
    });
    document.body.appendChild(dueFab);

    const refreshCount = () => {
        const countEl = document.getElementById('due-soon-fab-count');
        if (!countEl) return;
        const tasks = collectPendingChecklistTasks().filter((task) => task.daysUntil >= 0 && task.daysUntil <= 2);
        countEl.textContent = String(tasks.length);
        dueFab.classList.toggle('is-empty', tasks.length === 0);
    };

    window.addEventListener('storage', refreshCount);
    setInterval(refreshCount, 60000);
    refreshCount();
};

const setupAutomaticTaskReminders = () => {
    if (window.__taskReminderInitialized) return;
    window.__taskReminderInitialized = true;

    const ONE_DAY_KEY = 'taskDueOneDayReminderSeen';
    const showTaskReminder = (task) => {
        const message = `${task.taskName} (${task.clientName}) vence em 1 dia.`;
        const toast = document.createElement('div');
        toast.className = 'global-reminder-toast';

        const icon = document.createElement('span');
        icon.className = 'global-reminder-toast__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>';

        const text = document.createElement('span');
        text.className = 'global-reminder-toast__text';
        text.textContent = message;

        let container = document.getElementById('global-reminder-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'global-reminder-container';
            document.body.appendChild(container);
        }

        toast.appendChild(icon);
        toast.appendChild(text);
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 40);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    };

    const remind = () => {
        const today = new Date().toISOString().split('T')[0];
        let seen;
        try {
            seen = JSON.parse(localStorage.getItem(ONE_DAY_KEY) || '{}');
        } catch (_) {
            seen = {};
        }
        if (seen.__lastDate !== today) seen = { __lastDate: today };

        const tasks = collectPendingChecklistTasks().filter((task) => task.daysUntil === 1);
        tasks.forEach((task) => {
            const taskId = `${task.orderId}:${task.taskKey}:${task.deadline}`;
            if (seen[taskId]) return;
            seen[taskId] = true;
            showTaskReminder(task);
        });
        localStorage.setItem(ONE_DAY_KEY, JSON.stringify(seen));
    };

    remind();
    setInterval(remind, 1800000);
};

// --- BACKEND REAL (Memória + Firestore) ---
// Substitui o localStorage real por um armazenamento em memória conectado à nuvem
let memoryStore = {};
window.BackendInitialized = false;

const CLOUD_CACHE_PREFIX = 'sitey_cloud_cache_v1_';
const getCloudCacheKey = (uid) => `${CLOUD_CACHE_PREFIX}${uid}`;

const saveUserCache = (uid, data) => {
    if (!uid) return;
    try {
        nativeLocalStorage.setItem(getCloudCacheKey(uid), JSON.stringify({
            updatedAt: Date.now(),
            data
        }));
    } catch (error) {
        console.warn('Falha ao salvar cache local da nuvem:', error);
    }
};

const loadUserCache = (uid) => {
    if (!uid) return null;
    try {
        const raw = nativeLocalStorage.getItem(getCloudCacheKey(uid));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.data && typeof parsed.data === 'object' ? parsed.data : null;
    } catch (error) {
        console.warn('Falha ao ler cache local da nuvem:', error);
        return null;
    }
};

const hideInitialLoader = () => {
    const loader = document.getElementById('initial-loader');
    if (loader) loader.remove();
};

const scheduleRealtimePageRefresh = ({ source = 'cloud', hasRemoteChange = false } = {}) => {
    // Atualiza automaticamente as páginas para refletir mudanças vindas de outros dispositivos
    // sem exigir reload manual do usuário.
    if (source !== 'cloud' || !hasRemoteChange) return;
    if (!window.BackendInitialized) return;
    if (window.location.pathname.endsWith('login.html')) return;
    if (document.visibilityState !== 'visible') return;
    if (window.disableRealtimePageReload === true) return;

    clearTimeout(realtimeRefreshTimer);
    realtimeRefreshTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cloud-data-refresh-requested', {
            detail: { source, hasRemoteChange }
        }));
    }, 120);
};

const bootstrapBackendUI = () => {
    window.BackendInitialized = true;
    createGlobalCalculator();
    createFloatingNotes();
    createDueSoonTasksFab();
    setupAutomaticTaskReminders();
    hideInitialLoader();
    window.dispatchEvent(new CustomEvent('backend-ready'));
};

const applyCloudState = (uid, data, { source = 'cloud' } = {}) => {
    const nextStore = (data && typeof data === 'object') ? data : {};

    // --- VERIFICAÇÃO DE FORCE LOGOUT REMOTO ---
    const remoteForceLogout = nextStore['__forceLogoutAt'];
    if (remoteForceLogout) {
        if (!window.BackendInitialized) {
            // Primeiro carregamento após login: aceita o comando existente para não entrar em loop
            nativeLocalStorage.setItem('__myForceLogoutAt', String(remoteForceLogout));
        } else {
            const myForceLogout = nativeLocalStorage.getItem('__myForceLogoutAt');
            // Se este dispositivo NÃO foi o que disparou o comando, força logout
            if (String(remoteForceLogout) !== String(myForceLogout)) {
                console.warn('🔒 Force logout remoto detectado! Desconectando este dispositivo...');
                nativeLocalStorage.removeItem('psyzon_remember_device');
                signOut(auth);
                return false;
            }
        }
    }

    const nextSnapshot = getSnapshot(nextStore);
    const hasRemoteChange = nextSnapshot !== initialSnapshot;

    // Evita sobrescrever alterações locais ainda não salvas.
    if (hasUnsavedChanges && hasRemoteChange) {
        console.warn('⚠️ Atualização remota adiada porque existem alterações locais pendentes.');
        return false;
    }

    memoryStore = nextStore;
    saveUserCache(uid, memoryStore);
    initialSnapshot = nextSnapshot;
    hasUnsavedChanges = false;

    if (!window.BackendInitialized) {
        bootstrapBackendUI();
    } else {
        window.dispatchEvent(new CustomEvent('cloud-data-updated', { detail: { source } }));
        scheduleRealtimePageRefresh({ source, hasRemoteChange });
    }

    return true;
};

const stopCloudSync = () => {
    if (typeof unsubscribeCloudSync === 'function') {
        unsubscribeCloudSync();
        unsubscribeCloudSync = null;
    }
    cleanupActiveListeners();
};

const saveToCloud = async ({ silent = false, force = false } = {}) => {
    if (!auth.currentUser) return;
    if (!force && !hasUnsavedChanges) return;
    if (autosaveInFlight) return autosaveInFlight;

    const uid = auth.currentUser.uid;
    const previousSnapshot = initialSnapshot;
    const shouldRestoreDirtyOnError = hasUnsavedChanges;

    // UX: ao clicar em salvar manualmente, ocultamos o botão imediatamente
    // e restauramos o estado somente se o salvamento falhar.
    hasUnsavedChanges = false;
    initialSnapshot = getSnapshot(memoryStore);
    updateFloatingSaveButtonState();

    autosaveInFlight = (async () => {
        try {
            await setDoc(doc(db, "users", uid), memoryStore, { merge: true });
            saveUserCache(uid, memoryStore);
            initialSnapshot = getSnapshot(memoryStore);
            hasUnsavedChanges = false;
            updateFloatingSaveButtonState();
            if (!silent) playSuccessSound();
        } catch (e) {
            initialSnapshot = previousSnapshot;
            hasUnsavedChanges = shouldRestoreDirtyOnError;
            updateFloatingSaveButtonState();
            console.error("❌ Erro ao salvar na nuvem:", e);
            if (!silent) alert("Erro ao salvar na nuvem. Verifique sua conexão.");
        } finally {
            autosaveInFlight = null;
        }
    })();

    return autosaveInFlight;
};

const scheduleAutoSave = () => {
    if (!auth.currentUser || !hasUnsavedChanges) return;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
        saveToCloud({ silent: true });
    }, AUTOSAVE_DELAY_MS);
};

const syncDraftCache = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    saveUserCache(uid, memoryStore);
};

const checkDirtyState = () => {
    syncDraftCache();
    const currentSnapshot = getSnapshot(memoryStore);
    hasUnsavedChanges = currentSnapshot !== initialSnapshot;
    updateFloatingSaveButtonState();
    if (hasUnsavedChanges && !isIndexPage()) scheduleAutoSave();
};

// Interceptador do localStorage (Mágica para fazer o site funcionar com a nuvem)
// IMPORTANTE: chaves internas do Firebase Auth devem continuar no localStorage nativo
// para evitar perda de sessão entre páginas (loop voltando para login).
const nativeLocalStorage = window.localStorage;
const isFirebaseStorageKey = (key) => typeof key === 'string' && (
    key.startsWith('firebase:') ||
    key.startsWith('__firebase') ||
    key.startsWith('firebaseLocalStorageDb') ||
    key.includes('firebase')
);

window.isLocalMode = nativeLocalStorage.getItem('forceLocalMode') === 'true';
window.__nativeLS = nativeLocalStorage;

if (!window.isLocalMode) {
    Object.defineProperty(window, 'localStorage', {
        value: {
            getItem: (key) => {
                if (isFirebaseStorageKey(key)) return nativeLocalStorage.getItem(key);
                const val = memoryStore[key];
                if (val === undefined) return null;
                // Se for objeto, retorna string JSON (comportamento padrão do localStorage)
                return typeof val === 'object' ? JSON.stringify(val) : val;
            },
            setItem: (key, value) => {
                if (isFirebaseStorageKey(key)) {
                    nativeLocalStorage.setItem(key, value);
                    return;
                }

                const stringValue = String(value);
                // Verifica se o valor realmente mudou para evitar "falsos positivos" de alterações não salvas
                const currentValue = memoryStore[key];
                const currentString = typeof currentValue === 'object' ? JSON.stringify(currentValue) : (currentValue === undefined ? null : String(currentValue));

                // Se o valor for idêntico, não faz nada (não marca como não salvo)
                // Nota: localStorage sempre armazena strings. Se currentString for null (undefined), é mudança.
                if (currentString === stringValue) return;

                try {
                    // Tenta salvar como objeto JSON puro para o Firestore
                    memoryStore[key] = JSON.parse(stringValue);
                } catch (e) {
                    // Se não for JSON, salva como string
                    memoryStore[key] = stringValue;
                }
                checkDirtyState();
            },
            removeItem: (key) => {
                if (isFirebaseStorageKey(key)) {
                    nativeLocalStorage.removeItem(key);
                    return;
                }

                if (!(key in memoryStore)) return; // Se a chave não existe, não faz nada (evita ficar vermelho à toa)
                delete memoryStore[key];
                if (auth.currentUser) {
                    // Remove o campo específico no Firestore
                    updateDoc(doc(db, "users", auth.currentUser.uid), {
                        [key]: deleteField()
                    }).catch(err => console.error("Erro ao deletar campo:", err));
                }
                checkDirtyState();
            },
            clear: () => {
                memoryStore = {};
                checkDirtyState();
                // Não limpa o storage nativo para preservar sessão Firebase
            },
            key: (index) => {
                const keys = Object.keys(memoryStore);
                return keys[index] || null;
            },
            get length() {
                return Object.keys(memoryStore).length;
            }
        },
        writable: true
    });
}

// --- AUTENTICAÇÃO E CARREGAMENTO INICIAL ---

if (window.isLocalMode) {
    console.log("🔥 RODANDO EM MODO LOCAL (SEM NUVEM) 🔥");
    window.BackendInitialized = true;
    bootstrapBackendUI();

    window.firebaseAuth = {
        login: async () => { },
        loginWithGoogle: async () => { },
        logout: () => {
            nativeLocalStorage.removeItem('forceLocalMode');
            window.location.href = '/login.html';
        },
        currentUser: () => ({ uid: 'local_user' }),
    };

    if (window.location.pathname.endsWith('login.html')) {
        window.location.href = '/index.html';
    }
} else {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            ensureFloatingSaveButton();
            // Se estivermos na página de login, redireciona para index
            if (window.location.pathname.endsWith('login.html')) {
                window.location.href = '/index.html';
                return;
            }

            // O loader agora já existe no HTML (id="initial-loader") para aparecer instantaneamente.
            // Não precisamos criá-lo aqui, apenas garantir que ele não seja removido antes da hora.

            const cachedData = loadUserCache(user.uid);
            if (cachedData) {
                applyCloudState(user.uid, cachedData, { source: 'cache' });
            }

            try {
                const docRef = doc(db, "users", user.uid);
                stopCloudSync();

                unsubscribeCloudSync = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        applyCloudState(user.uid, docSnap.data(), { source: docSnap.metadata.fromCache ? 'cache' : 'cloud' });
                        if (!docSnap.metadata.fromCache) {
                            console.log("✅ Dados sincronizados em tempo real.");
                        }
                    } else {
                        applyCloudState(user.uid, {}, { source: 'cloud' });
                        console.log("ℹ️ Novo usuário ou sem dados.");
                    }
                }, (error) => {
                    console.error('Erro no listener de sincronização em tempo real:', error);
                });
                registerActiveListener(unsubscribeCloudSync);

            } catch (error) {
                console.error("Erro crítico ao carregar dados:", error);
                // Evita tela presa no loader quando a rede oscila.
                if (!window.BackendInitialized) {
                    bootstrapBackendUI();
                }
            }
        } else {
            // Não logado
            stopCloudSync();
            window.BackendInitialized = false;
            memoryStore = {};
            clearTimeout(autosaveTimer);
            if (!window.location.pathname.endsWith('login.html')) {
                window.location.href = '/login.html';
            }
        }
    });
}

// Expõe funções de auth globalmente para uso nos botões
// (Apenas se NÃO estiver no modo local, pois o modo local já definiu o seu proprio firebaseAuth acima)
if (!window.isLocalMode) {
    window.firebaseAuth = {
        login: async (email, password, remember = false) => {
            await setAuthPersistence(remember);
            return signInWithEmailAndPassword(auth, email, password);
        },
        signup: async (email, password, remember = false) => {
            await setAuthPersistence(remember);
            return createUserWithEmailAndPassword(auth, email, password);
        },
        loginWithGoogle: async () => {
            try {
                return await signInWithPopup(auth, googleProvider);
            } catch (error) {
                const fallbackCodes = new Set([
                    'auth/popup-blocked',
                    'auth/cancelled-popup-request',
                    'auth/popup-closed-by-user'
                ]);
                if (fallbackCodes.has(error?.code)) {
                    return signInWithRedirect(auth, googleProvider);
                }
                throw error;
            }
        },
        logout: () => {
            nativeLocalStorage.removeItem('psyzon_remember_device');
            return signOut(auth);
        },
        currentUser: () => auth.currentUser,
    };
}

// IA removida para otimizar carregamento do site.
