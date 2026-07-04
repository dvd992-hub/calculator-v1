/* ============================================================
   js/i18n.js — Internationalisation module
   Strategy: auto-detect from navigator.language on first visit,
   allow manual override via toggle button, persist choice in
   localStorage so the preference survives page reloads.
   ============================================================ */

// Supported locale codes (must match filenames in /i18n/)
const SUPPORTED_LANGS = ['en', 'it'];

// In-memory cache: { en: {...}, it: {...} }
const translations = {};

// Currently active locale
let currentLang = 'en';

/* ── Language detection ─────────────────────────────────────
   Priority order:
   1. localStorage  — user has explicitly chosen a language before
   2. navigator.language — browser / OS preference
   3. 'en'          — safe default
   ──────────────────────────────────────────────────────────── */
function detectLanguage() {
  // 1. Persisted preference
  const saved = localStorage.getItem('calc_lang');
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

  // 2. Browser language (e.g. "it-IT" → "it", "en-US" → "en")
  const browserLang = navigator.language.slice(0, 2).toLowerCase();
  if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;

  // 3. Fallback
  return 'en';
}

/* ── Load a locale file asynchronously ─────────────────────
   Fetches /i18n/<lang>.json and caches the result.
   ──────────────────────────────────────────────────────────── */
async function loadLocale(lang) {
  if (translations[lang]) return; // already cached

  const res  = await fetch('i18n/' + lang + '.json');
  translations[lang] = await res.json();
}

/* ── Apply translations to the DOM ─────────────────────────
   Looks for every element with data-i18n="key" and sets its
   textContent to the matching translation string.
   ──────────────────────────────────────────────────────────── */
function applyTranslations(lang) {
  const t = translations[lang] || {};

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });

  // Update the toggle button label to show the OTHER available language
  const btn = document.getElementById('lang-btn');
  if (btn && t['lang_toggle']) btn.textContent = t['lang_toggle'];

  // Keep the <html lang> attribute in sync for accessibility
  document.documentElement.lang = lang;

  currentLang = lang;
}

/* ── Public: initialise i18n on page load ──────────────────── */
async function initI18n() {
  const lang = detectLanguage();
  await loadLocale(lang);
  applyTranslations(lang);
}

/* ── Public: toggle between EN and IT ──────────────────────
   Called by the lang-btn onClick handler in index.html.
   ──────────────────────────────────────────────────────────── */
async function toggleLang() {
  const next = currentLang === 'en' ? 'it' : 'en';

  await loadLocale(next);       // fetch if not yet cached
  applyTranslations(next);

  // Persist the choice so next visit uses the same language
  localStorage.setItem('calc_lang', next);
}

/* ── Helper: translate a single key in JS code ─────────────
   Use this inside script.js when you need a translated string
   outside the DOM (e.g. dynamic error messages).
   ──────────────────────────────────────────────────────────── */
function t(key) {
  return (translations[currentLang] || {})[key] || key;
}

// Bootstrap i18n as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', initI18n);
