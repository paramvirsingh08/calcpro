/**
 * CalcPro — Scientific Calculator & Converter
 * Built by Paramvir Singh
 * Features: Basic calc, Scientific calc, Unit Converter, Math Notes
 *           Keyboard support, History, Dark/Light Theme
 */

(function () {
    'use strict';

    // ===================================================
    //  DOM REFERENCES
    // ===================================================
    const $ = (id) => document.getElementById(id);

    // Tabs
    const tabBar = $('tabBar');
    const tabIndicator = $('tabIndicator');
    const panels = {
        basic: $('basicPanel'),
        scientific: $('scientificPanel'),
        converter: $('converterPanel'),
        notes: $('notesPanel')
    };
    const historyPanel = $('historyPanel');

    // Basic Calculator
    const inputBox = $('inputBox');
    const expressionEl = $('expression');
    const buttonsGrid = $('buttonsGrid');

    // Scientific Calculator
    const sciInputBox = $('sciInputBox');
    const sciExpression = $('sciExpression');
    const sciButtonsGrid = $('sciButtonsGrid');
    const sciStdButtonsGrid = $('sciStdButtonsGrid');
    const angleToggle = $('angleToggle');
    const angleLabel = $('angleLabel');

    // Converter
    const categoryPills = $('categoryPills');
    const fromValue = $('fromValue');
    const fromUnit = $('fromUnit');
    const toValue = $('toValue');
    const toUnit = $('toUnit');
    const swapBtn = $('swapBtn');
    const formulaText = $('formulaText');
    const formulaLabel = $('formulaLabel');
    const currencyMeta = $('currencyMeta');
    const rateStatus = $('rateStatus');
    const refreshRateBtn = $('refreshRateBtn');

    // Notes
    const notesGrid = $('notesGrid');
    const notesSearch = $('notesSearch');

    // History
    const historyList = $('historyList');
    const historyEmpty = $('historyEmpty');
    const clearHistoryBtn = $('clearHistoryBtn');

    // Theme
    const themeToggle = $('themeToggle');
    const themeIcon = $('themeIcon');

    // ===================================================
    //  STATE
    // ===================================================
    let currentTab = 'basic';
    let angleMode = 'DEG'; // DEG or RAD

    // Calculator state (shared between basic & scientific)
    const calcState = {
        currentInput: '',
        fullExpression: '',
        lastResult: null,
        shouldResetOnNext: false,
        pendingPower: false  // for xⁿ
    };

    let history = [];
    const MAX_HISTORY = 30;
    const MAX_DISPLAY_LENGTH = 15;

    // ===================================================
    //  INITIALIZATION
    // ===================================================
    function init() {
        loadTheme();
        loadHistory();
        renderHistory();
        setupTabs();
        setupBasicCalc();
        setupScientificCalc();
        setupConverter();
        setupNotes();
        setupKeyboard();
        fetchLiveCurrencyRates();
        createAmbientParticles();
        setupCardParallax();
        setTimeout(() => updateTabIndicator(false), 50);
        themeToggle.addEventListener('click', toggleTheme);
        clearHistoryBtn.addEventListener('click', clearHistory);
    }

    // ===================================================
    //  TAB MANAGEMENT & ANIMATED INDICATOR
    // ===================================================
    function setupTabs() {
        tabBar.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (!tab || tab.classList.contains('active')) return;

            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
        window.addEventListener('resize', () => updateTabIndicator(false));
    }

    function updateTabIndicator(smooth = true) {
        if (!tabIndicator) return;
        const activeTab = tabBar.querySelector('.tab.active');
        if (!activeTab) {
            tabIndicator.style.opacity = '0';
            return;
        }
        if (!smooth) {
            tabIndicator.style.transition = 'none';
        }
        tabIndicator.style.width = `${activeTab.offsetWidth}px`;
        tabIndicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
        tabIndicator.style.opacity = '1';
        if (!smooth) {
            requestAnimationFrame(() => {
                tabIndicator.style.transition = '';
            });
        }
    }

    function switchTab(tabName) {
        currentTab = tabName;

        // Update tab buttons
        tabBar.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabName);
            t.setAttribute('aria-selected', t.dataset.tab === tabName);
        });

        // Slide the indicator pill
        updateTabIndicator(true);

        // Update panels
        Object.entries(panels).forEach(([name, panel]) => {
            panel.classList.toggle('active', name === tabName);
        });

        // History: show only for basic & scientific
        const showHistory = (tabName === 'basic' || tabName === 'scientific');
        historyPanel.classList.toggle('hidden', !showHistory);
    }

    // ===================================================
    //  AMBIENT PARTICLES & 3D CARD PARALLAX
    // ===================================================
    function createAmbientParticles() {
        const container = $('particlesContainer');
        if (!container) return;
        const symbols = ['+', '−', '×', '÷', 'π', '√', '₹', '$', '€', '%', 'e', '∫', '≈', '≠', 'φ', '∞'];
        const count = 20;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'ambient-particle';
            el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            el.style.left = `${Math.random() * 100}%`;
            el.style.top = `${Math.random() * 100}%`;
            el.style.fontSize = `${16 + Math.random() * 26}px`;
            el.style.setProperty('--dur', `${14 + Math.random() * 16}s`);
            el.style.setProperty('--op', `${0.06 + Math.random() * 0.12}`);
            el.style.setProperty('--blur', `${Math.random() * 2}px`);
            el.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 60}px`);
            el.style.setProperty('--drift-y', `${-30 - Math.random() * 50}px`);
            el.style.setProperty('--drift-x2', `${(Math.random() - 0.5) * 80}px`);
            el.style.setProperty('--drift-y2', `${-60 - Math.random() * 70}px`);
            el.style.setProperty('--rot', `${(Math.random() - 0.5) * 40}deg`);
            el.style.setProperty('--rot2', `${(Math.random() - 0.5) * 60}deg`);
            el.style.animationDelay = `-${Math.random() * 15}s`;
            container.appendChild(el);
        }
    }

    function setupCardParallax() {
        if (window.matchMedia('(hover: none)').matches) return;

        const cards = document.querySelectorAll('.glass-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);

                // Subtle 3D card tilt
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const tiltX = ((y - centerY) / centerY) * -3.5;
                const tiltY = ((x - centerX) / centerX) * 3.5;
                card.style.setProperty('--card-tilt-x', `${tiltX.toFixed(2)}deg`);
                card.style.setProperty('--card-tilt-y', `${tiltY.toFixed(2)}deg`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--card-tilt-x', '0deg');
                card.style.setProperty('--card-tilt-y', '0deg');
            });
        });
    }

    // ===================================================
    //  THEME MANAGEMENT
    // ===================================================
    function loadTheme() {
        const saved = localStorage.getItem('calc-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        themeIcon.textContent = saved === 'dark' ? '🌙' : '☀️';
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('calc-theme', next);
        themeIcon.style.transform = 'rotate(360deg) scale(0)';
        setTimeout(() => {
            themeIcon.textContent = next === 'dark' ? '🌙' : '☀️';
            themeIcon.style.transform = 'rotate(0deg) scale(1)';
        }, 200);
    }

    // ===================================================
    //  BASIC CALCULATOR
    // ===================================================
    function setupBasicCalc() {
        buttonsGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn');
            if (!btn) return;
            handleCalcInput(btn.dataset.value, inputBox, expressionEl);
            setRipple(btn, e);
        });
    }

    // ===================================================
    //  SCIENTIFIC CALCULATOR
    // ===================================================
    function setupScientificCalc() {
        // Standard buttons
        sciStdButtonsGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn');
            if (!btn) return;
            handleCalcInput(btn.dataset.value, sciInputBox, sciExpression);
            setRipple(btn, e);
        });

        // Scientific buttons
        sciButtonsGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn');
            if (!btn) return;
            handleSciAction(btn.dataset.action);
            setRipple(btn, e);
        });

        // Angle toggle (Animated Slider)
        if (angleToggle) {
            angleToggle.addEventListener('click', (e) => {
                const opt = e.target.closest('.slider-opt');
                if (opt) {
                    angleMode = opt.dataset.mode;
                } else {
                    angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
                }
                angleToggle.classList.toggle('rad', angleMode === 'RAD');
                angleToggle.querySelectorAll('.slider-opt').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === angleMode);
                });
            });
        }
    }

    function handleSciAction(action) {
        const display = sciInputBox;
        const exprEl = sciExpression;
        let val = parseFloat(calcState.currentInput || display.value);

        if (isNaN(val) && !['pi', 'euler'].includes(action)) {
            val = 0;
        }

        let result;
        let label;

        switch (action) {
            // Trigonometric
            case 'sin':
                label = `sin(${val}${angleMode === 'DEG' ? '°' : ''})`;
                result = Math.sin(toRadians(val));
                break;
            case 'cos':
                label = `cos(${val}${angleMode === 'DEG' ? '°' : ''})`;
                result = Math.cos(toRadians(val));
                break;
            case 'tan':
                label = `tan(${val}${angleMode === 'DEG' ? '°' : ''})`;
                if (angleMode === 'DEG' && (val % 180 === 90)) {
                    showCalcError(display); return;
                }
                result = Math.tan(toRadians(val));
                break;
            case 'asin':
                if (val < -1 || val > 1) { showCalcError(display); return; }
                label = `sin⁻¹(${val})`;
                result = fromRadians(Math.asin(val));
                break;
            case 'acos':
                if (val < -1 || val > 1) { showCalcError(display); return; }
                label = `cos⁻¹(${val})`;
                result = fromRadians(Math.acos(val));
                break;
            case 'atan':
                label = `tan⁻¹(${val})`;
                result = fromRadians(Math.atan(val));
                break;

            // Logarithmic
            case 'log':
                if (val <= 0) { showCalcError(display); return; }
                label = `log(${val})`;
                result = Math.log10(val);
                break;
            case 'ln':
                if (val <= 0) { showCalcError(display); return; }
                label = `ln(${val})`;
                result = Math.log(val);
                break;

            // Powers & Roots
            case 'sqrt':
                if (val < 0) { showCalcError(display); return; }
                label = `√(${val})`;
                result = Math.sqrt(val);
                break;
            case 'cbrt':
                label = `∛(${val})`;
                result = Math.cbrt(val);
                break;
            case 'square':
                label = `(${val})²`;
                result = val * val;
                break;
            case 'cube':
                label = `(${val})³`;
                result = val * val * val;
                break;
            case 'power':
                // Set up power mode — next number will be the exponent
                calcState.pendingPower = true;
                calcState.fullExpression = String(val) + '**';
                calcState.currentInput = '';
                updateCalcDisplay(display, '');
                updateCalcExpression(exprEl, val + ' ^');
                return;
            case 'exp10':
                label = `10^(${val})`;
                result = Math.pow(10, val);
                break;
            case 'expE':
                label = `e^(${val})`;
                result = Math.exp(val);
                break;

            // Other
            case 'factorial':
                if (val < 0 || !Number.isInteger(val) || val > 170) { showCalcError(display); return; }
                label = `${val}!`;
                result = factorial(val);
                break;
            case 'reciprocal':
                if (val === 0) { showCalcError(display); return; }
                label = `1/(${val})`;
                result = 1 / val;
                break;
            case 'abs':
                label = `|${val}|`;
                result = Math.abs(val);
                break;
            case 'pi':
                label = 'π';
                result = Math.PI;
                break;
            case 'euler':
                label = 'e';
                result = Math.E;
                break;
            default:
                return;
        }

        if (!isFinite(result)) {
            showCalcError(display);
            return;
        }

        const formatted = formatResult(result);
        updateCalcExpression(exprEl, label + ' =');
        display.classList.add('result-animate');
        const container = display.closest('.display-container');
        if (container) {
            container.classList.remove('shimmer');
            void container.offsetWidth;
            container.classList.add('shimmer');
            setTimeout(() => container.classList.remove('shimmer'), 700);
        }
        setTimeout(() => display.classList.remove('result-animate'), 400);

        calcState.currentInput = formatted;
        calcState.lastResult = result;
        calcState.fullExpression = formatted;
        calcState.shouldResetOnNext = true;

        updateCalcDisplay(display, formatted);
        addToHistory(label, formatted);
    }

    function toRadians(val) {
        return angleMode === 'DEG' ? val * (Math.PI / 180) : val;
    }

    function fromRadians(val) {
        return angleMode === 'DEG' ? val * (180 / Math.PI) : val;
    }

    function factorial(n) {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    // ===================================================
    //  SHARED CALCULATOR LOGIC
    // ===================================================
    function handleCalcInput(value, display, exprEl) {
        switch (value) {
            case 'AC':     calcClearAll(display, exprEl); break;
            case 'DEL':    calcDeleteLast(display); break;
            case '=':      calcEvaluate(display, exprEl); break;
            case '+/-':    calcToggleSign(display); break;
            case '%':      calcPercent(display); break;
            case '+': case '-': case '*': case '/':
                calcOperator(value, display, exprEl); break;
            case '.':      calcDecimal(display); break;
            default:       calcNumber(value, display); break;
        }
    }

    function calcClearAll(display, exprEl) {
        calcState.currentInput = '';
        calcState.fullExpression = '';
        calcState.lastResult = null;
        calcState.shouldResetOnNext = false;
        calcState.pendingPower = false;
        updateCalcDisplay(display, '');
        updateCalcExpression(exprEl, '');
        clearActiveOperators();
    }

    function calcDeleteLast(display) {
        if (calcState.shouldResetOnNext) {
            calcState.currentInput = '';
            calcState.fullExpression = '';
            calcState.shouldResetOnNext = false;
            updateCalcDisplay(display, '');
            return;
        }
        calcState.currentInput = calcState.currentInput.slice(0, -1);
        calcState.fullExpression = calcState.fullExpression.slice(0, -1);
        updateCalcDisplay(display, calcState.currentInput || '');
    }

    function calcNumber(num, display) {
        if (calcState.shouldResetOnNext) {
            calcState.fullExpression = calcState.pendingPower
                ? calcState.fullExpression
                : '';
            calcState.shouldResetOnNext = false;
        }
        if (calcState.currentInput.replace(/[^0-9.]/g, '').length >= MAX_DISPLAY_LENGTH) return;

        calcState.currentInput += num;
        calcState.fullExpression += num;
        updateCalcDisplay(display, calcState.currentInput);
        clearActiveOperators();
    }

    function calcOperator(op, display, exprEl) {
        if (calcState.shouldResetOnNext) {
            calcState.fullExpression = String(calcState.lastResult);
            calcState.shouldResetOnNext = false;
        }
        calcState.pendingPower = false;

        if (calcState.fullExpression && /[+\-*/]$/.test(calcState.fullExpression)) {
            calcState.fullExpression = calcState.fullExpression.slice(0, -1) + op;
        } else if (calcState.fullExpression) {
            calcState.fullExpression += op;
        } else if (op === '-') {
            calcState.fullExpression = '-';
            calcState.currentInput = '-';
            updateCalcDisplay(display, '-');
            return;
        } else {
            return;
        }

        calcState.currentInput = '';
        updateCalcExpression(exprEl, formatExpressionDisplay(calcState.fullExpression));
        highlightOperator(op);
    }

    function calcDecimal(display) {
        if (calcState.shouldResetOnNext) {
            calcState.fullExpression = '0';
            calcState.currentInput = '0';
            calcState.shouldResetOnNext = false;
        }
        const parts = calcState.fullExpression.split(/[+\-*/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.includes('.')) return;

        if (!calcState.currentInput || calcState.currentInput === '-') {
            calcState.currentInput += '0.';
            calcState.fullExpression += '0.';
        } else {
            calcState.currentInput += '.';
            calcState.fullExpression += '.';
        }
        updateCalcDisplay(display, calcState.currentInput);
    }

    function calcPercent(display) {
        if (!calcState.currentInput || isNaN(parseFloat(calcState.currentInput))) return;
        const percentValue = parseFloat(calcState.currentInput) / 100;
        calcState.currentInput = String(percentValue);
        const match = calcState.fullExpression.match(/(\d+\.?\d*)$/);
        if (match) {
            calcState.fullExpression = calcState.fullExpression.slice(0, -match[0].length) + calcState.currentInput;
        }
        updateCalcDisplay(display, calcState.currentInput);
    }

    function calcToggleSign(display) {
        if (!calcState.currentInput || calcState.currentInput === '0') return;
        if (calcState.currentInput.startsWith('-')) {
            calcState.currentInput = calcState.currentInput.slice(1);
        } else {
            calcState.currentInput = '-' + calcState.currentInput;
        }
        const match = calcState.fullExpression.match(/-?\d+\.?\d*$/);
        if (match) {
            calcState.fullExpression = calcState.fullExpression.slice(0, calcState.fullExpression.length - match[0].length) + calcState.currentInput;
        }
        updateCalcDisplay(display, calcState.currentInput);
    }

    function calcEvaluate(display, exprEl) {
        if (!calcState.fullExpression) return;

        let expr = calcState.fullExpression.replace(/[+\-*/]$/, '');
        if (!expr) return;

        try {
            const result = safeEval(expr);
            if (result === null || result === undefined || !isFinite(result)) {
                showCalcError(display);
                return;
            }

            const formatted = formatResult(result);
            addToHistory(formatExpressionDisplay(expr), formatted);

            updateCalcExpression(exprEl, formatExpressionDisplay(expr) + ' =');
            display.classList.add('result-animate');
            const container = display.closest('.display-container');
            if (container) {
                container.classList.remove('shimmer');
                void container.offsetWidth;
                container.classList.add('shimmer');
                setTimeout(() => container.classList.remove('shimmer'), 700);
            }
            setTimeout(() => display.classList.remove('result-animate'), 400);

            calcState.currentInput = formatted;
            calcState.lastResult = result;
            calcState.fullExpression = formatted;
            calcState.shouldResetOnNext = true;
            calcState.pendingPower = false;

            updateCalcDisplay(display, formatted);
            clearActiveOperators();
        } catch (e) {
            showCalcError(display);
        }
    }

    function safeEval(expr) {
        // Allow: digits, operators, dots, parens, ** (power)
        if (!/^[\d+\-*/.() ]+$/.test(expr)) return null;
        try {
            return new Function('return (' + expr + ')')();
        } catch (e) {
            return null;
        }
    }

    // ===== Display helpers (Sliding Text Reveal) =====
    function updateCalcDisplay(display, value, isResult = false) {
        display.value = value;
        display.classList.remove('error');

        const digitsEl = display.parentElement ? display.parentElement.querySelector('.display-digits') : null;
        if (!digitsEl) return;

        // Dynamic font sizing
        if (value.length > 14) digitsEl.style.fontSize = '1.6rem';
        else if (value.length > 11) digitsEl.style.fontSize = '1.9rem';
        else if (value.length > 8) digitsEl.style.fontSize = '2.2rem';
        else digitsEl.style.fontSize = '2.6rem';

        if (!value || value === '0') {
            digitsEl.innerHTML = '<span class="digit-slot"><span class="digit-char placeholder">0</span></span>';
            return;
        }

        const chars = String(value).split('');

        if (isResult) {
            // Full cascading Sliding Text Reveal (like Jitter template)
            digitsEl.innerHTML = chars.map((char, i) =>
                `<span class="digit-slot"><span class="digit-char slide-cascade" style="--char-i: ${i}">${escapeHtml(char)}</span></span>`
            ).join('');
        } else {
            // Compare with existing slots
            const currentSlots = digitsEl.querySelectorAll('.digit-slot');
            const currentChars = Array.from(currentSlots).map(s => s.textContent.trim());

            // If we just appended a character (e.g. "7" -> "75")
            if (chars.length === currentChars.length + 1 && currentChars.length > 0 && currentChars[0] !== '0') {
                const newSlot = document.createElement('span');
                newSlot.className = 'digit-slot';
                newSlot.innerHTML = `<span class="digit-char slide-in">${escapeHtml(chars[chars.length - 1])}</span>`;
                digitsEl.appendChild(newSlot);
            } else {
                // Render with newest character animated
                digitsEl.innerHTML = chars.map((char, i) => {
                    const isNewest = (i === chars.length - 1);
                    return `<span class="digit-slot"><span class="digit-char ${isNewest ? 'slide-in' : ''}">${escapeHtml(char)}</span></span>`;
                }).join('');
            }
        }
    }

    function updateCalcExpression(exprEl, text) {
        if (exprEl) exprEl.textContent = text;
    }

    function formatExpressionDisplay(expr) {
        let result = '';
        for (let i = 0; i < expr.length; i++) {
            const ch = expr[i];
            if (ch === '*' && expr[i + 1] === '*') {
                result += ' ^ ';
                i++; // skip next *
            } else if (ch === '*') {
                result += ' × ';
            } else if (ch === '/') {
                result += ' ÷ ';
            } else if (ch === '+') {
                result += ' + ';
            } else if (ch === '-' && i > 0 && /[\d)]/.test(expr[i - 1])) {
                result += ' − ';
            } else {
                result += ch;
            }
        }
        return result.replace(/\s+/g, ' ').trim();
    }

    function formatResult(num) {
        if (Number.isInteger(num) && Math.abs(num) < 1e15) {
            return num.toString();
        }
        if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
            return num.toExponential(6);
        }
        const rounded = parseFloat(num.toPrecision(12));
        let str = rounded.toString();
        if (str.includes('.') && str.split('.')[1].length > 10) {
            str = rounded.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
        }
        return str;
    }

    function showCalcError(display) {
        display.classList.add('error');
        display.value = 'Error';
        const digitsEl = display.parentElement ? display.parentElement.querySelector('.display-digits') : null;
        if (digitsEl) {
            digitsEl.innerHTML = '<span class="digit-slot"><span class="digit-char slide-in" style="color:var(--error-color)">Error</span></span>';
        }
        setTimeout(() => {
            const exprEl = display === inputBox ? expressionEl : sciExpression;
            calcClearAll(display, exprEl);
        }, 1200);
    }

    function highlightOperator(op) {
        clearActiveOperators();
        const opMap = { '+': 'btnAdd', '-': 'btnSubtract', '*': 'btnMultiply', '/': 'btnDivide' };
        const btn = $(opMap[op]);
        if (btn) btn.classList.add('active');
    }

    function clearActiveOperators() {
        document.querySelectorAll('.btn-operator').forEach(b => b.classList.remove('active'));
    }

    function setRipple(btn, e) {
        btn.classList.remove('btn-active-pop');
        void btn.offsetWidth;
        btn.classList.add('btn-active-pop');
        setTimeout(() => btn.classList.remove('btn-active-pop'), 220);

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2.2;
        const x = (e && e.clientX ? e.clientX - rect.left : rect.width / 2) - size / 2;
        const y = (e && e.clientY ? e.clientY - rect.top : rect.height / 2) - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'btn-burst-wave';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    }

    // ===================================================
    //  KEYBOARD SUPPORT
    // ===================================================
    function setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Don't capture keys in converter/notes inputs
            if (e.target.tagName === 'INPUT' && e.target.type !== 'text') return;
            if (e.target.id === 'notesSearch' || e.target.id === 'fromValue') return;

            const key = e.key;
            let value = null, btnId = null;

            if (key >= '0' && key <= '9') { value = key; btnId = 'btn' + key; }
            else if (key === '.') { value = '.'; btnId = 'btnDot'; }
            else if (key === '+') { value = '+'; btnId = 'btnAdd'; }
            else if (key === '-') { value = '-'; btnId = 'btnSubtract'; }
            else if (key === '*') { value = '*'; btnId = 'btnMultiply'; }
            else if (key === '/') { e.preventDefault(); value = '/'; btnId = 'btnDivide'; }
            else if (key === '%') { value = '%'; btnId = 'btnPercent'; }
            else if (key === 'Enter' || key === '=') { e.preventDefault(); value = '='; btnId = 'btnEquals'; }
            else if (key === 'Backspace') { value = 'DEL'; btnId = 'btnDEL'; }
            else if (key === 'Escape' || key === 'Delete') { value = 'AC'; btnId = 'btnAC'; }

            if (value !== null) {
                const display = currentTab === 'scientific' ? sciInputBox : inputBox;
                const exprEl = currentTab === 'scientific' ? sciExpression : expressionEl;
                handleCalcInput(value, display, exprEl);

                if (btnId) {
                    const btn = $(btnId);
                    if (btn) {
                        setRipple(btn, null);
                        btn.classList.add('key-active');
                        setTimeout(() => btn.classList.remove('key-active'), 150);
                    }
                }
            }
        });
    }

    // ===================================================
    //  HISTORY
    // ===================================================
    function loadHistory() {
        try {
            const saved = localStorage.getItem('calcpro-history');
            history = saved ? JSON.parse(saved) : [];
        } catch { history = []; }
    }

    function saveHistory() {
        localStorage.setItem('calcpro-history', JSON.stringify(history));
    }

    function addToHistory(expr, result) {
        history.unshift({ expression: expr, result: result, timestamp: Date.now() });
        if (history.length > MAX_HISTORY) history.pop();
        saveHistory();
        renderHistory();
    }

    function clearHistory() {
        history = [];
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        const oldItems = historyList.querySelectorAll('.history-item');
        oldItems.forEach(item => item.remove());

        if (history.length === 0) {
            historyEmpty.style.display = 'flex';
            return;
        }
        historyEmpty.style.display = 'none';

        history.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.setAttribute('role', 'button');
            div.setAttribute('tabindex', '0');
            div.innerHTML = `
                <div class="history-expression">${escapeHtml(item.expression)}</div>
                <div class="history-result">= ${escapeHtml(item.result)}</div>
            `;
            div.addEventListener('click', () => {
                const display = currentTab === 'scientific' ? sciInputBox : inputBox;
                const exprEl = currentTab === 'scientific' ? sciExpression : expressionEl;
                calcState.currentInput = item.result;
                calcState.fullExpression = item.result;
                calcState.shouldResetOnNext = true;
                updateCalcDisplay(display, item.result);
                updateCalcExpression(exprEl, item.expression + ' =');
            });
            historyList.appendChild(div);
        });
    }

    // ===================================================
    //  UNIT & CURRENCY CONVERTER
    // ===================================================
    // Currency rates (base: USD) — defaults provide instant offline functionality
    let currencyRates = {
        USD: 1,
        INR: 94.5939,
        EUR: 0.8903,
        GBP: 0.7467,
        JPY: 158.10,
        AED: 3.6725,
        CAD: 1.4048,
        AUD: 1.4232,
        SAR: 3.7500,
        CNY: 6.6893,
        SGD: 1.2774,
        CHF: 0.8245,
        KWD: 0.3096,
        QAR: 3.6400,
        PKR: 277.00,
        BDT: 123.71,
        NPR: 151.34,
        RUB: 82.00,
        BRL: 5.0246,
        KRW: 1326.14,
        TRY: 49.64,
        ZAR: 16.37,
        NZD: 1.7558,
        THB: 33.59,
        MYR: 4.0807,
        IDR: 18030.16,
        VND: 25846.70,
        PHP: 63.39,
        EGP: 54.39,
        OMR: 0.3845
    };
    let isLiveRates = false;

    async function fetchLiveCurrencyRates() {
        if (refreshRateBtn) refreshRateBtn.classList.add('spinning');
        try {
            const res = await fetch('https://open.er-api.com/v6/latest/USD');
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            if (data && data.rates) {
                Object.keys(currencyRates).forEach(code => {
                    if (data.rates[code] !== undefined) {
                        currencyRates[code] = data.rates[code];
                    }
                });
                isLiveRates = true;
                if (rateStatus) {
                    rateStatus.className = 'rate-status';
                    rateStatus.textContent = '🟢 Live rates';
                }
                if (currentCategory === 'currency') {
                    convert();
                }
            }
        } catch (err) {
            console.warn('Using offline currency rates:', err.message);
            isLiveRates = false;
            if (rateStatus) {
                rateStatus.className = 'rate-status offline';
                rateStatus.textContent = '🟡 Offline rates';
            }
        } finally {
            if (refreshRateBtn) {
                setTimeout(() => refreshRateBtn.classList.remove('spinning'), 500);
            }
        }
    }

    const conversionData = {
        length: {
            units: [
                { name: 'Meter (m)', factor: 1 },
                { name: 'Kilometer (km)', factor: 1000 },
                { name: 'Centimeter (cm)', factor: 0.01 },
                { name: 'Millimeter (mm)', factor: 0.001 },
                { name: 'Mile', factor: 1609.344 },
                { name: 'Yard', factor: 0.9144 },
                { name: 'Foot', factor: 0.3048 },
                { name: 'Inch', factor: 0.0254 }
            ]
        },
        currency: {
            isCurrency: true,
            units: [
                { code: 'USD', name: 'USD ($) · US Dollar', symbol: '$' },
                { code: 'INR', name: 'INR (₹) · Indian Rupee', symbol: '₹' },
                { code: 'EUR', name: 'EUR (€) · Euro', symbol: '€' },
                { code: 'GBP', name: 'GBP (£) · British Pound', symbol: '£' },
                { code: 'JPY', name: 'JPY (¥) · Japanese Yen', symbol: '¥' },
                { code: 'AED', name: 'AED (د.إ) · UAE Dirham', symbol: 'د.إ' },
                { code: 'CAD', name: 'CAD (C$) · Canadian Dollar', symbol: 'C$' },
                { code: 'AUD', name: 'AUD (A$) · Australian Dollar', symbol: 'A$' },
                { code: 'SAR', name: 'SAR (﷼) · Saudi Riyal', symbol: '﷼' },
                { code: 'CNY', name: 'CNY (¥) · Chinese Yuan', symbol: '¥' },
                { code: 'SGD', name: 'SGD (S$) · Singapore Dollar', symbol: 'S$' },
                { code: 'CHF', name: 'CHF (Fr) · Swiss Franc', symbol: 'Fr' },
                { code: 'KWD', name: 'KWD (KD) · Kuwaiti Dinar', symbol: 'KD' },
                { code: 'QAR', name: 'QAR (QR) · Qatari Riyal', symbol: 'QR' },
                { code: 'PKR', name: 'PKR (₨) · Pakistani Rupee', symbol: '₨' },
                { code: 'BDT', name: 'BDT (৳) · Bangladeshi Taka', symbol: '৳' },
                { code: 'NPR', name: 'NPR (₨) · Nepalese Rupee', symbol: '₨' },
                { code: 'RUB', name: 'RUB (₽) · Russian Ruble', symbol: '₽' },
                { code: 'BRL', name: 'BRL (R$) · Brazilian Real', symbol: 'R$' },
                { code: 'KRW', name: 'KRW (₩) · South Korean Won', symbol: '₩' },
                { code: 'TRY', name: 'TRY (₺) · Turkish Lira', symbol: '₺' },
                { code: 'ZAR', name: 'ZAR (R) · South African Rand', symbol: 'R' },
                { code: 'NZD', name: 'NZD (NZ$) · New Zealand Dollar', symbol: 'NZ$' },
                { code: 'THB', name: 'THB (฿) · Thai Baht', symbol: '฿' },
                { code: 'MYR', name: 'MYR (RM) · Malaysian Ringgit', symbol: 'RM' },
                { code: 'IDR', name: 'IDR (Rp) · Indonesian Rupiah', symbol: 'Rp' },
                { code: 'VND', name: 'VND (₫) · Vietnamese Dong', symbol: '₫' },
                { code: 'PHP', name: 'PHP (₱) · Philippine Peso', symbol: '₱' },
                { code: 'EGP', name: 'EGP (E£) · Egyptian Pound', symbol: 'E£' },
                { code: 'OMR', name: 'OMR (OMR) · Omani Rial', symbol: 'OMR' }
            ]
        },
        weight: {
            units: [
                { name: 'Kilogram (kg)', factor: 1 },
                { name: 'Gram (g)', factor: 0.001 },
                { name: 'Milligram (mg)', factor: 0.000001 },
                { name: 'Pound (lb)', factor: 0.45359237 },
                { name: 'Ounce (oz)', factor: 0.028349523125 },
                { name: 'Metric Ton', factor: 1000 }
            ]
        },
        temperature: {
            special: true,
            units: [
                { name: 'Celsius (°C)' },
                { name: 'Fahrenheit (°F)' },
                { name: 'Kelvin (K)' }
            ]
        },
        area: {
            units: [
                { name: 'Square Meter (m²)', factor: 1 },
                { name: 'Square Kilometer (km²)', factor: 1e6 },
                { name: 'Square Foot (ft²)', factor: 0.09290304 },
                { name: 'Acre', factor: 4046.8564224 },
                { name: 'Hectare', factor: 10000 },
                { name: 'Square Inch (in²)', factor: 0.00064516 }
            ]
        },
        volume: {
            units: [
                { name: 'Liter (L)', factor: 1 },
                { name: 'Milliliter (mL)', factor: 0.001 },
                { name: 'Cubic Meter (m³)', factor: 1000 },
                { name: 'Gallon (US)', factor: 3.785411784 },
                { name: 'Cup (US)', factor: 0.2365882365 },
                { name: 'Fluid Ounce (US)', factor: 0.029573529563 }
            ]
        },
        speed: {
            units: [
                { name: 'Meter/s (m/s)', factor: 1 },
                { name: 'Kilometer/h (km/h)', factor: 0.277777778 },
                { name: 'Miles/h (mph)', factor: 0.44704 },
                { name: 'Knots', factor: 0.514444 },
                { name: 'Foot/s (ft/s)', factor: 0.3048 }
            ]
        },
        time: {
            units: [
                { name: 'Second (s)', factor: 1 },
                { name: 'Minute (min)', factor: 60 },
                { name: 'Hour (hr)', factor: 3600 },
                { name: 'Day', factor: 86400 },
                { name: 'Week', factor: 604800 },
                { name: 'Month (30d)', factor: 2592000 },
                { name: 'Year (365d)', factor: 31536000 }
            ]
        },
        data: {
            units: [
                { name: 'Byte (B)', factor: 1 },
                { name: 'Kilobyte (KB)', factor: 1024 },
                { name: 'Megabyte (MB)', factor: 1048576 },
                { name: 'Gigabyte (GB)', factor: 1073741824 },
                { name: 'Terabyte (TB)', factor: 1099511627776 }
            ]
        }
    };

    let currentCategory = 'length';

    function setupConverter() {
        // Category pills
        categoryPills.addEventListener('click', (e) => {
            const pill = e.target.closest('.pill');
            if (!pill) return;
            currentCategory = pill.dataset.category;
            categoryPills.querySelectorAll('.pill').forEach(p =>
                p.classList.toggle('active', p.dataset.category === currentCategory)
            );
            populateUnits();
        });

        // Input events
        fromValue.addEventListener('input', convert);
        fromUnit.addEventListener('change', convert);
        toUnit.addEventListener('change', convert);

        // Swap
        swapBtn.addEventListener('click', () => {
            swapBtn.classList.remove('swapping');
            void swapBtn.offsetWidth;
            swapBtn.classList.add('swapping');
            setTimeout(() => swapBtn.classList.remove('swapping'), 520);

            const fromIdx = fromUnit.selectedIndex;
            const toIdx = toUnit.selectedIndex;
            fromUnit.selectedIndex = toIdx;
            toUnit.selectedIndex = fromIdx;
            convert();
        });

        // Refresh live rates button
        if (refreshRateBtn) {
            refreshRateBtn.addEventListener('click', () => {
                fetchLiveCurrencyRates();
            });
        }

        // Initialize
        populateUnits();
    }

    function populateUnits() {
        const data = conversionData[currentCategory];
        fromUnit.innerHTML = '';
        toUnit.innerHTML = '';

        data.units.forEach((unit, i) => {
            const opt1 = new Option(unit.name, i);
            const opt2 = new Option(unit.name, i);
            fromUnit.add(opt1);
            toUnit.add(opt2);
        });

        if (data.isCurrency) {
            if (currencyMeta) currencyMeta.style.display = 'inline-flex';
            if (formulaLabel) formulaLabel.textContent = 'Exchange Rate:';
            fromUnit.selectedIndex = 0; // USD
            toUnit.selectedIndex = 1;   // INR
            fromValue.value = '1';
            convert();
        } else {
            if (currencyMeta) currencyMeta.style.display = 'none';
            if (formulaLabel) formulaLabel.textContent = 'Formula:';
            if (data.units.length > 1) {
                toUnit.selectedIndex = 1;
            }
            fromValue.value = '';
            toValue.value = '';
            formulaText.textContent = 'Enter a value to convert';
        }
    }

    function convert() {
        const val = parseFloat(fromValue.value);
        if (isNaN(val)) {
            toValue.value = '';
            formulaText.textContent = currentCategory === 'currency'
                ? 'Enter an amount to convert'
                : 'Enter a value to convert';
            return;
        }

        const data = conversionData[currentCategory];
        const fromIdx = parseInt(fromUnit.value);
        const toIdx = parseInt(toUnit.value);

        if (isNaN(fromIdx) || isNaN(toIdx)) return;

        let result;
        let formula;

        if (data.isCurrency) {
            const fromUnitObj = data.units[fromIdx];
            const toUnitObj = data.units[toIdx];
            const fromCode = fromUnitObj.code;
            const toCode = toUnitObj.code;

            const fromRate = currencyRates[fromCode] || 1;
            const toRate = currencyRates[toCode] || 1;

            // Value in USD = val / fromRate; Target = (val / fromRate) * toRate
            result = (val / fromRate) * toRate;
            const unitRate = toRate / fromRate;

            formula = `1 ${fromCode} = ${formatCurrencyRate(unitRate)} ${toCode}`;
            toValue.value = formatCurrencyResult(result);
            formulaText.textContent = formula;
            return;
        }

        if (data.special) {
            // Temperature conversion
            result = convertTemperature(val, fromIdx, toIdx);
            formula = getTemperatureFormula(fromIdx, toIdx);
        } else {
            const fromFactor = data.units[fromIdx].factor;
            const toFactor = data.units[toIdx].factor;
            // Convert: value * fromFactor / toFactor
            result = (val * fromFactor) / toFactor;

            const fromName = data.units[fromIdx].name.split('(')[0].trim();
            const toName = data.units[toIdx].name.split('(')[0].trim();
            const ratio = fromFactor / toFactor;
            formula = `1 ${fromName} = ${formatConversionResult(ratio)} ${toName}`;
        }

        toValue.value = formatConversionResult(result);
        formulaText.textContent = formula;
    }

    function convertTemperature(val, fromIdx, toIdx) {
        // 0=Celsius, 1=Fahrenheit, 2=Kelvin
        // First convert to Celsius
        let celsius;
        if (fromIdx === 0) celsius = val;
        else if (fromIdx === 1) celsius = (val - 32) * 5 / 9;
        else celsius = val - 273.15;

        // Then convert from Celsius to target
        if (toIdx === 0) return celsius;
        else if (toIdx === 1) return (celsius * 9 / 5) + 32;
        else return celsius + 273.15;
    }

    function getTemperatureFormula(fromIdx, toIdx) {
        const names = ['°C', '°F', 'K'];
        const formulas = {
            '0-1': '°F = (°C × 9/5) + 32',
            '0-2': 'K = °C + 273.15',
            '1-0': '°C = (°F − 32) × 5/9',
            '1-2': 'K = (°F − 32) × 5/9 + 273.15',
            '2-0': '°C = K − 273.15',
            '2-1': '°F = (K − 273.15) × 9/5 + 32'
        };
        if (fromIdx === toIdx) return `${names[fromIdx]} = ${names[toIdx]}`;
        return formulas[`${fromIdx}-${toIdx}`] || '';
    }

    function formatConversionResult(num) {
        if (num === 0) return '0';
        if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-8 && num !== 0)) {
            return num.toExponential(6);
        }
        // Remove trailing zeros
        const str = parseFloat(num.toPrecision(10)).toString();
        return str;
    }

    function formatCurrencyResult(num) {
        if (num === 0) return '0.00';
        if (num >= 1000) {
            return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (num >= 1) {
            return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        } else {
            return num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
        }
    }

    function formatCurrencyRate(num) {
        if (num === 0) return '0';
        if (num >= 100) {
            return num.toFixed(2);
        } else if (num >= 1) {
            return num.toFixed(4);
        } else {
            return num.toFixed(6);
        }
    }

    // ===================================================
    //  MATH NOTES
    // ===================================================
    const mathNotes = [
        {
            icon: '📊',
            title: 'Algebra',
            formulas: [
                { name: 'Quadratic Formula', value: 'x = (−b ± √(b²−4ac)) / 2a' },
                { name: 'Square of Sum', value: '(a+b)² = a² + 2ab + b²' },
                { name: 'Square of Difference', value: '(a−b)² = a² − 2ab + b²' },
                { name: 'Difference of Squares', value: '(a+b)(a−b) = a² − b²' },
                { name: 'Cube of Sum', value: '(a+b)³ = a³ + 3a²b + 3ab² + b³' },
                { name: 'Exponent Product', value: 'aⁿ × aᵐ = aⁿ⁺ᵐ' },
                { name: 'Power of Power', value: '(aⁿ)ᵐ = aⁿˣᵐ' },
                { name: 'Log Product Rule', value: 'log(xy) = log(x) + log(y)' },
                { name: 'Log Quotient Rule', value: 'log(x/y) = log(x) − log(y)' },
                { name: 'Log Power Rule', value: 'log(xⁿ) = n·log(x)' },
                { name: 'Change of Base', value: 'logₐ(x) = log(x) / log(a)' }
            ]
        },
        {
            icon: '📐',
            title: 'Geometry',
            formulas: [
                { name: 'Circle Area', value: 'A = πr²' },
                { name: 'Circle Circumference', value: 'C = 2πr' },
                { name: 'Rectangle Area', value: 'A = l × w' },
                { name: 'Rectangle Perimeter', value: 'P = 2(l + w)' },
                { name: 'Triangle Area', value: 'A = ½ × b × h' },
                { name: "Heron's Formula", value: 'A = √(s(s−a)(s−b)(s−c))' },
                { name: 'Pythagorean Theorem', value: 'a² + b² = c²' },
                { name: 'Sphere Volume', value: 'V = (4/3)πr³' },
                { name: 'Sphere Surface Area', value: 'SA = 4πr²' },
                { name: 'Cylinder Volume', value: 'V = πr²h' },
                { name: 'Cone Volume', value: 'V = (1/3)πr²h' },
                { name: 'Trapezoid Area', value: 'A = ½(a+b) × h' }
            ]
        },
        {
            icon: '📈',
            title: 'Trigonometry',
            formulas: [
                { name: 'Pythagorean Identity', value: 'sin²θ + cos²θ = 1' },
                { name: 'Tangent', value: 'tan θ = sin θ / cos θ' },
                { name: '1 + tan²θ', value: '1 + tan²θ = sec²θ' },
                { name: '1 + cot²θ', value: '1 + cot²θ = csc²θ' },
                { name: 'Double Angle (sin)', value: 'sin(2θ) = 2·sin θ·cos θ' },
                { name: 'Double Angle (cos)', value: 'cos(2θ) = cos²θ − sin²θ' },
                { name: 'sin 0°', value: '0' },
                { name: 'sin 30°', value: '1/2' },
                { name: 'sin 45°', value: '√2 / 2 ≈ 0.7071' },
                { name: 'sin 60°', value: '√3 / 2 ≈ 0.8660' },
                { name: 'sin 90°', value: '1' },
                { name: 'cos 0°', value: '1' },
                { name: 'cos 30°', value: '√3 / 2 ≈ 0.8660' },
                { name: 'cos 45°', value: '√2 / 2 ≈ 0.7071' },
                { name: 'cos 60°', value: '1/2' },
                { name: 'cos 90°', value: '0' }
            ]
        },
        {
            icon: '∫',
            title: 'Calculus',
            formulas: [
                { name: 'Power Rule (deriv)', value: 'd/dx [xⁿ] = n·xⁿ⁻¹' },
                { name: 'Derivative of sin x', value: 'd/dx [sin x] = cos x' },
                { name: 'Derivative of cos x', value: 'd/dx [cos x] = −sin x' },
                { name: 'Derivative of tan x', value: 'd/dx [tan x] = sec²x' },
                { name: 'Derivative of eˣ', value: 'd/dx [eˣ] = eˣ' },
                { name: 'Derivative of ln x', value: 'd/dx [ln x] = 1/x' },
                { name: 'Chain Rule', value: 'd/dx [f(g(x))] = f\'(g(x))·g\'(x)' },
                { name: 'Product Rule', value: '(fg)\' = f\'g + fg\'' },
                { name: 'Power Rule (integral)', value: '∫xⁿ dx = xⁿ⁺¹/(n+1) + C' },
                { name: 'Integral of sin x', value: '∫sin x dx = −cos x + C' },
                { name: 'Integral of cos x', value: '∫cos x dx = sin x + C' },
                { name: 'Integral of eˣ', value: '∫eˣ dx = eˣ + C' },
                { name: 'Integral of 1/x', value: '∫(1/x) dx = ln|x| + C' }
            ]
        },
        {
            icon: '🔢',
            title: 'Constants',
            formulas: [
                { name: 'Pi (π)', value: '3.14159265358979' },
                { name: "Euler's Number (e)", value: '2.71828182845905' },
                { name: 'Golden Ratio (φ)', value: '1.61803398874989' },
                { name: '√2', value: '1.41421356237310' },
                { name: '√3', value: '1.73205080756888' },
                { name: 'Speed of Light (c)', value: '2.998 × 10⁸ m/s' },
                { name: 'Gravity (g)', value: '9.80665 m/s²' },
                { name: "Avogadro's Number", value: '6.022 × 10²³ mol⁻¹' },
                { name: "Planck's Constant (h)", value: '6.626 × 10⁻³⁴ J·s' },
                { name: "Boltzmann's Constant", value: '1.381 × 10⁻²³ J/K' }
            ]
        },
        {
            icon: '📊',
            title: 'Statistics',
            formulas: [
                { name: 'Mean', value: 'x̄ = Σxᵢ / n' },
                { name: 'Variance', value: 'σ² = Σ(xᵢ − x̄)² / n' },
                { name: 'Standard Deviation', value: 'σ = √(σ²)' },
                { name: 'Permutation', value: 'P(n,r) = n! / (n−r)!' },
                { name: 'Combination', value: 'C(n,r) = n! / (r!(n−r)!)' },
                { name: 'Probability', value: 'P(A) = n(A) / n(S)' },
                { name: 'Bayes Theorem', value: 'P(A|B) = P(B|A)·P(A) / P(B)' }
            ]
        }
    ];

    function setupNotes() {
        renderNotes(mathNotes);

        notesSearch.addEventListener('input', () => {
            const query = notesSearch.value.toLowerCase().trim();
            if (!query) {
                renderNotes(mathNotes);
                return;
            }
            const filtered = mathNotes.map(category => {
                const matchedFormulas = category.formulas.filter(f =>
                    f.name.toLowerCase().includes(query) ||
                    f.value.toLowerCase().includes(query)
                );
                if (matchedFormulas.length > 0 || category.title.toLowerCase().includes(query)) {
                    return {
                        ...category,
                        formulas: matchedFormulas.length > 0 ? matchedFormulas : category.formulas
                    };
                }
                return null;
            }).filter(Boolean);
            renderNotes(filtered, true);
        });
    }

    function renderNotes(notes, allOpen = false) {
        notesGrid.innerHTML = '';

        if (notes.length === 0) {
            notesGrid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:30px;">No formulas found</p>';
            return;
        }

        notes.forEach((cat, idx) => {
            const card = document.createElement('div');
            card.className = 'note-card' + (allOpen || idx === 0 ? ' open' : '');

            const formulasHTML = cat.formulas.map(f =>
                `<div class="note-formula">
                    <span class="note-formula-name">${escapeHtml(f.name)}</span>
                    <span class="note-formula-value">${escapeHtml(f.value)}</span>
                </div>`
            ).join('');

            card.innerHTML = `
                <div class="note-header">
                    <div class="note-header-left">
                        <span class="note-icon">${cat.icon}</span>
                        <span class="note-title">${escapeHtml(cat.title)}</span>
                    </div>
                    <span class="note-chevron">▼</span>
                </div>
                <div class="note-body">
                    <div class="note-content">${formulasHTML}</div>
                </div>
            `;

            // Toggle expand/collapse
            card.querySelector('.note-header').addEventListener('click', () => {
                card.classList.toggle('open');
            });

            notesGrid.appendChild(card);
        });
    }

    // ===================================================
    //  UTILITIES
    // ===================================================
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ===================================================
    //  START
    // ===================================================
    init();

})();