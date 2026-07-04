# Scientific Calculator

A colourful, fully client-side calculator built with pure HTML, CSS, and JavaScript.
No frameworks, no build step, no external dependencies.

---

## Project structure

```
/
├── index.html              # Page markup and button layout
├── css/
│   └── style.css           # Lavender palette, colour-coded buttons, orange hover
├── js/
│   ├── i18n.js             # Internationalisation module (EN / IT)
│   └── script.js           # Calculator logic: expression engine, sci functions, history
├── i18n/
│   ├── en.json             # English UI strings
│   └── it.json             # Italian UI strings
├── assets/
│   └── favicon/
│       ├── favicon.svg     # Vector favicon (modern browsers)
│       └── favicon.ico     # Raster ICO — 16×16, 32×32, 48×48 (legacy fallback)
└── README.md               # This file
```

---

## Getting started

Drop all files into the same folder and open `index.html` in any modern browser.

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

> **Language toggle note**
> The i18n module fetches locale files via the `fetch` API.
> Some browsers block filesystem `fetch` requests for security reasons.
> If the EN / IT toggle does not work, serve the folder over HTTP instead:
>
> ```bash
> python3 -m http.server 8080
> # then visit http://localhost:8080
> ```
>
> VS Code users: the **Live Server** extension handles this automatically.

---

## Features

### Standard tab

Basic four-operation arithmetic with a clean, colour-coded keypad.

| Key   | Action                     |
|-------|----------------------------|
| AC    | Full reset                 |
| +/−   | Toggle sign of current value |
| %     | Divide current value by 100 |
| ÷ × − + | Binary operators        |
| =     | Evaluate                   |

### Scientific tab

Everything from Standard, plus:

| Button  | Function                                        |
|---------|-------------------------------------------------|
| sin( )  | Sine — respects DEG / RAD mode                  |
| cos( )  | Cosine — respects DEG / RAD mode                |
| tan( )  | Tangent — respects DEG / RAD mode               |
| log( )  | Base-10 logarithm                               |
| ln( )   | Natural logarithm                               |
| √( )    | Square root                                     |
| x²      | Square                                          |
| x³      | Cube                                            |
| 1/x     | Reciprocal                                      |
| |x|     | Absolute value                                  |
| xʸ      | General power — enter base, press xʸ, enter exp |
| π       | Insert π (3.14159265…)                          |
| e       | Insert e (2.71828182…)                          |
| (  )    | Parentheses — group sub-expressions             |
| DEG/RAD | Toggle angle unit for trig functions            |

Parentheses support full nesting, e.g. `(2 + 3) × (7 − 4) = 15`.
Pressing `=` with unclosed parentheses auto-closes them before evaluation.

### History tab

Stores the last 30 completed calculations in memory.
Click any row to reload its result into the display.
**Clear all** wipes the list.

---

## Internationalisation

Language is resolved in this priority order at startup:

1. **`localStorage` key `calc_lang`** — a language the user explicitly chose in a previous visit.
2. **`navigator.language`** — the browser or OS locale (`it-IT` → `it`, `en-US` → `en`).
3. **`en`** — safe fallback.

The toggle button in the top-right corner switches between **EN** and **IT** at any time.
The choice is written back to `localStorage` so it persists across sessions.

### Adding a new language

1. Copy `i18n/en.json` to `i18n/<code>.json` and translate the values.
2. Add the code string to `SUPPORTED_LANGS` in `js/i18n.js`.
3. Extend the `toggleLang()` function to cycle through the new locale.

---

## Keyboard shortcuts

| Key           | Action                          |
|---------------|---------------------------------|
| `0` – `9`     | Digit input                     |
| `.`           | Decimal point                   |
| `+` `-` `*`   | Add, subtract, multiply         |
| `/`           | Divide                          |
| `^`           | Power                           |
| `(` `)`       | Open / close parenthesis        |
| `Enter` / `=` | Evaluate                        |
| `Backspace`   | Delete last character           |
| `Escape`      | Full reset (same as AC)         |

---

## Design reference

| Element              | Colour                        |
|----------------------|-------------------------------|
| Page background      | `#e9d5ff` lavender            |
| Card surface         | `#f3e8ff` light lavender      |
| Display area         | `#ede9fe` mid lavender        |
| Digit buttons        | `#ffffff` white               |
| Operators            | `#7c3aed` violet              |
| Equals               | `#ec4899` pink                |
| AC / Clear           | `#dc2626` red                 |
| Utility (+/−, %)     | `#0891b2` teal                |
| Scientific functions | `#059669` emerald             |
| Constants (π, e)     | `#d97706` amber               |
| Parentheses ( )      | `#a855f7` light violet        |
| Universal hover      | `#f97316` orange              |

---

## Implementation notes

**Expression engine** — instead of the classic `prev / op / current` state machine, the calculator builds a full expression string that is evaluated in one pass using `Function()`. This makes parentheses and operator chaining work naturally without a custom parser.

**Floating-point rounding** — results are passed through `toPrecision(10)` to suppress noise like `0.1 + 0.2 = 0.30000000000000004`.

**i18n loading** — locale files are fetched lazily on first use and cached in memory, so switching languages does not reload the page or re-fetch a file twice.

---

## Known limitations

- Precision is capped at 10 significant digits (standard JS `Number` behaviour).
- Calculation history is in-memory only and is lost on page reload.
- `tan(90°)` returns a very large finite number rather than `Infinity` — a known floating-point artefact.

---

## Browser compatibility

| Browser | Minimum version |
|---------|----------------|
| Chrome  | 90+            |
| Firefox | 88+            |
| Safari  | 14+            |
| Edge    | 90+            |

APIs used: CSS Grid, `fetch`, `localStorage`, `navigator.language`, `Function()`.
No polyfills required.
