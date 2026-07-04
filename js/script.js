/* ============================================================
   js/script.js — Scientific Calculator logic
   Handles: expression building with parentheses, binary operators,
   scientific functions, history, tab navigation, keyboard shortcuts.

   Architecture note:
   Instead of a simple prev/op/current state machine, we now maintain
   a full expression string (exprStr) that is evaluated via the safer
   Function() approach — this lets parentheses work naturally without
   writing a custom parser.
   ============================================================ */

// ── App state ────────────────────────────────────────────────
let current     = '0';    // Number shown on the main display row
let exprStr     = '';     // Full expression string being built (e.g. "(2+3)×4")
let justCalc    = false;  // True immediately after pressing '='
let openParens  = 0;      // Tracks unclosed '(' so we can auto-close on '='
let isDeg       = true;   // true = degrees mode, false = radians mode
let history     = [];     // Array of { expr: string, result: string }

// ── DOM references ───────────────────────────────────────────
const valEl  = document.getElementById('val');   // Main display value
const exprEl = document.getElementById('expr');  // Secondary expression row

// ── Formatting helper ────────────────────────────────────────
/**
 * Round away floating-point noise (e.g. 0.1+0.2 → 0.3, not 0.30000000000004).
 * Non-number values (error strings) are passed through unchanged.
 */
function fmt(n) {
  return typeof n === 'number'
    ? parseFloat(n.toPrecision(10)).toString()
    : n;
}

/**
 * Refresh the display. Truncates to 8 significant digits if the
 * string representation would overflow the display area (>12 chars).
 */
function updateDisplay() {
  let d = current;
  if (d.length > 12 && !isNaN(parseFloat(d))) {
    d = parseFloat(parseFloat(d).toPrecision(8)).toString();
  }
  valEl.textContent  = d;
  exprEl.textContent = exprStr;
}

// ── Safe expression evaluator ─────────────────────────────────
/**
 * Evaluate a math expression string safely.
 * We replace the display symbols with JS operators before evaluation.
 * Uses Function() in a controlled way — the input is only ever built
 * from our own button handlers (digits, operators, parens), never from
 * raw user text input, so injection risk is minimal.
 *
 * @param   {string} expr - expression string to evaluate
 * @returns {number|string} - numeric result or translated error string
 */
function evaluate(expr) {
  try {
    // Replace display-friendly symbols with JS equivalents
    const jsExpr = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**');   // power operator

    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + jsExpr + ')')();

    if (!isFinite(result)) return t('error');
    return result;
  } catch (_) {
    return t('error');
  }
}

// ── Digit and decimal input ──────────────────────────────────
/**
 * Append a digit to the current number and to the expression string.
 * If the user just finished a calculation (justCalc=true) start fresh.
 */
function inputDigit(d) {
  if (justCalc) {
    // Start a brand-new expression with this digit
    current  = d;
    exprStr  = d;
    justCalc = false;
  } else {
    current = current === '0' ? d : (current.length < 12 ? current + d : current);
    // If expression is empty or ended with ')', append the digit directly
    if (exprStr === '' || exprStr.endsWith(')')) {
      exprStr += d;
    } else {
      // Replace a trailing '0' in the expression (just typed) with new digit
      exprStr = exprStr === '0'
        ? d
        : exprStr + d;
    }
  }
  updateDisplay();
}

/**
 * Append a decimal point (only if the current token doesn't already have one).
 */
function inputDot() {
  if (justCalc) {
    current  = '0.';
    exprStr  = '0.';
    justCalc = false;
    updateDisplay();
    return;
  }
  if (!current.includes('.')) {
    current += '.';
    exprStr += '.';
  }
  updateDisplay();
}

// ── Operator input ───────────────────────────────────────────
/**
 * Append a binary operator to the expression string.
 * Resets 'current' to '0' so the next digit starts a new token.
 */
function inputOp(o) {
  justCalc = false;

  // Allow chaining: if the last char is already an operator, replace it.
  // Note: we use the Unicode minus '−' (U+2212) as display symbol, not ASCII '-',
  // so it must be included explicitly in the operator set check.
  if (exprStr && '+-×÷^−'.includes(exprStr.slice(-1))) {
    exprStr = exprStr.slice(0, -1);
  }

  exprStr += o;
  current  = '0';
  updateDisplay();
}

// ── Parenthesis input ────────────────────────────────────────
/**
 * Insert an opening parenthesis '(' into the expression.
 * Keeps a counter so we know how many are still open.
 */
function inputOpenParen() {
  if (justCalc) {
    // After '=', start a new expression with a parenthesis
    exprStr  = '(';
    current  = '0';
    justCalc = false;
  } else {
    exprStr += '(';
  }
  openParens++;
  current = '0';
  updateDisplay();
}

/**
 * Insert a closing parenthesis ')' only if there is a matching '(' open.
 * Prevents malformed expressions like "2 + 3)".
 */
function inputCloseParen() {
  if (openParens <= 0) return; // nothing to close
  exprStr += ')';
  openParens--;
  // Update current to reflect the value inside the parens (best-effort)
  const partial = evaluate(exprStr);
  if (typeof partial === 'number') current = fmt(partial);
  updateDisplay();
}

// ── Evaluate ('=') ───────────────────────────────────────────
/**
 * Evaluate the full expression string.
 * Auto-closes any unclosed parentheses before evaluation.
 */
function calculate() {
  if (!exprStr || exprStr === '') return;

  // Auto-close any unclosed parentheses
  const closing = ')'.repeat(openParens);
  const fullExpr = exprStr + closing;

  const result = evaluate(fullExpr);
  const resultStr = typeof result === 'number' ? fmt(result) : result;

  // Record to history (uses the visually-nice exprStr, not jsExpr)
  if (resultStr !== t('error')) addHistory(fullExpr + ' =', resultStr);

  exprEl.textContent = fullExpr + ' =';
  current    = resultStr;
  exprStr    = resultStr;   // so the next operator chains from the result
  openParens = 0;
  justCalc   = true;
  valEl.textContent = resultStr;
}

// ── Utility actions ──────────────────────────────────────────
/** Full reset: clear everything back to initial state. */
function clearAll() {
  current    = '0';
  exprStr    = '';
  openParens = 0;
  justCalc   = false;
  updateDisplay();
}

/** Flip the sign of the current numeric token. */
function toggleSign() {
  if (current === '0') return;
  if (current.startsWith('-')) {
    current = current.slice(1);
    // Remove leading '-' from the expression token too
    const idx = exprStr.lastIndexOf('-' + current.slice(1)); // before slice
    if (idx !== -1) exprStr = exprStr.slice(0, idx) + current;
  } else {
    current = '-' + current;
    // Find the last occurrence of the unsigned token in exprStr and negate it
    const lastIdx = exprStr.lastIndexOf(current.slice(1));
    if (lastIdx !== -1) {
      exprStr = exprStr.slice(0, lastIdx) + current + exprStr.slice(lastIdx + current.slice(1).length);
    }
  }
  updateDisplay();
}

/** Divide current value by 100 (e.g. 75 → 0.75). */
function percent() {
  const v = parseFloat(current);
  if (isNaN(v)) return;
  const pct = fmt(v / 100);
  // Replace the trailing token in exprStr with the percentage value
  exprStr = exprStr.slice(0, exprStr.length - current.length) + pct;
  current = pct;
  updateDisplay();
}

// ── Scientific functions ─────────────────────────────────────
/**
 * Apply a named scientific function to the current value.
 * The result replaces 'current' and a label is shown in the expression row.
 * Trig functions respect the isDeg flag.
 * Constants (pi, e) insert their value into the expression.
 *
 * @param {string} f - function key
 */
function sciFunc(f) {
  const v     = parseFloat(current);
  const toRad = isDeg ? Math.PI / 180 : 1;
  let r, label = '';

  switch (f) {
    // ── Trigonometry ──────────────────────────────────────────
    case 'sin':  r = Math.sin(v * toRad); label = 'sin(' + current + ')'; break;
    case 'cos':  r = Math.cos(v * toRad); label = 'cos(' + current + ')'; break;
    case 'tan':  r = Math.tan(v * toRad); label = 'tan(' + current + ')'; break;

    // ── Logarithms ────────────────────────────────────────────
    case 'log':  r = Math.log10(v);       label = 'log(' + current + ')'; break;
    case 'ln':   r = Math.log(v);         label = 'ln('  + current + ')'; break;

    // ── Algebra ───────────────────────────────────────────────
    case 'sqrt': r = Math.sqrt(v);        label = '√('   + current + ')'; break;
    case 'sq':   r = v * v;               label = current + '\u00B2'; break;
    case 'cube': r = v * v * v;           label = current + '\u00B3'; break;
    case 'inv':  r = v !== 0 ? 1/v : t('error'); label = '1/' + current; break;
    case 'abs':  r = Math.abs(v);         label = '|'    + current + '|'; break;

    // ── Constants: insert value into expression ───────────────
    case 'pi':
      current  = fmt(Math.PI);
      exprStr += fmt(Math.PI);
      justCalc = false;
      updateDisplay();
      return;
    case 'e':
      current  = fmt(Math.E);
      exprStr += fmt(Math.E);
      justCalc = false;
      updateDisplay();
      return;

    default: return;
  }

  const result = typeof r === 'number' ? fmt(r) : r;
  addHistory(label, result);

  current    = result;
  exprStr    = result;   // after a sci function, start fresh expression from result
  justCalc   = true;
  openParens = 0;
  exprEl.textContent = label + ' =';
  valEl.textContent  = result;
}

/**
 * Toggle between Degrees and Radians for trig functions.
 * Updates the DEG/RAD button label.
 */
function toggleDeg() {
  isDeg = !isDeg;
  document.getElementById('deg-btn').textContent = isDeg ? 'DEG' : 'RAD';
}

// ── History ──────────────────────────────────────────────────
/**
 * Add a completed calculation to the history array and re-render.
 * Keeps at most 30 entries; oldest are dropped automatically.
 */
function addHistory(expr, result) {
  history.unshift({ expr, result });
  if (history.length > 30) history.pop();
  renderHistory();
}

/**
 * Re-render the history list in the History panel.
 * Each row is clickable and loads the result back into the display.
 */
function renderHistory() {
  const el = document.getElementById('history-list');
  if (!el) return;

  if (history.length === 0) {
    el.innerHTML =
      '<div class="history-empty" data-i18n="history_empty">' +
      t('history_empty') + '</div>';
    return;
  }

  el.innerHTML = history.map((h, i) =>
    '<div class="hist-item" onclick="useHistory(' + i + ')">' +
      '<span class="hist-expr">'   + h.expr   + '</span>' +
      '<span class="hist-result">' + h.result + '</span>' +
    '</div>'
  ).join('');
}

/**
 * Load a past result back into the display and expression.
 * Switches to Standard tab for convenience.
 */
function useHistory(i) {
  current    = history[i].result;
  exprStr    = history[i].result;
  justCalc   = true;
  openParens = 0;
  exprEl.textContent = history[i].expr;
  valEl.textContent  = current;
  switchTab('std', document.getElementById('tab-std'));
}

/** Wipe the entire history list. */
function clearHistory() {
  history = [];
  renderHistory();
}

// ── Tab navigation ───────────────────────────────────────────
/**
 * Show one panel and hide the others.
 * @param {string}      tab - 'std' | 'sci' | 'hist'
 * @param {HTMLElement} btn - the clicked tab button element
 */
function switchTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-std').style.display  = tab === 'std'  ? '' : 'none';
  document.getElementById('panel-sci').style.display  = tab === 'sci'  ? '' : 'none';
  document.getElementById('panel-hist').style.display = tab === 'hist' ? '' : 'none';
}

// ── Keyboard shortcuts ───────────────────────────────────────
document.addEventListener('keydown', e => {
  if      ('0123456789'.includes(e.key)) inputDigit(e.key);
  else if (e.key === '.')                inputDot();
  else if (e.key === '+')               inputOp('+');
  else if (e.key === '-')               inputOp('−');
  else if (e.key === '*')               inputOp('×');
  else if (e.key === '/') { e.preventDefault(); inputOp('÷'); }
  else if (e.key === '^')              inputOp('^');
  else if (e.key === '(')              inputOpenParen();
  else if (e.key === ')')              inputCloseParen();
  else if (e.key === 'Enter' || e.key === '=') calculate();
  else if (e.key === 'Backspace') {
    // Remove last character from both current and exprStr
    if (exprStr.slice(-1) === '(') openParens = Math.max(0, openParens - 1);
    if (exprStr.slice(-1) === ')') openParens++;
    exprStr = exprStr.slice(0, -1);
    current = exprStr.match(/[\d.]+$/) ? exprStr.match(/[\d.]+$/)[0] : '0';
    updateDisplay();
  }
  else if (e.key === 'Escape') clearAll();
});
