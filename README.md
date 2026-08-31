# Unarrow

An arrow-removal logic puzzle. / Łamigłówka logiczna ze strzałkami.

**[▶ Play now](https://claudeplos.github.io/Unarrow/)** — works instantly in
the browser, phone included, nothing to install.
**[▶ Zagraj teraz](https://claudeplos.github.io/Unarrow/)** — działa od razu
w przeglądarce, także na telefonie. Nic nie trzeba instalować.

[![Unarrow board](docs/screenshot.png)](https://claudeplos.github.io/Unarrow/)

Plain JavaScript, one `<canvas>`, zero dependencies, zero build step. /
Czysty JavaScript, jeden `<canvas>`, zero zależności i zero kroku budowania.

Bilingual: English (default) and Polski, switchable in the game and in this
document. / Dwujęzyczna: angielski (domyślny) i polski, przełączalne w grze
i w tym dokumencie.

**Jump to:** [English](#english) · [Polski](#polski)

---

# English

## Table of contents

* [Play now](https://claudeplos.github.io/Unarrow/)
* [Rules](#rules)
* [Running it](#running-it)
* [Controls](#controls)
* [Localization](#localization)
* [Background music](#background-music)
* [Installing as an app](#installing-as-an-app)
* [Project structure](#project-structure)
* [Data model](#data-model)
* [Board generator](#board-generator)
* [Level progression](#level-progression)
* [Drawing](#drawing)
* [Slide-out animation](#slide-out-animation)
* [Hit-testing an arrow](#hit-testing-an-arrow)
* [Module API](#module-api)
* [Persisted state](#persisted-state)
* [Testing](#testing)
* [Tunable constants](#tunable-constants)
* [Browser support](#browser-support)
* [Known limitations](#known-limitations)

---

## Rules

* Click an arrow — it slides out along its own track, off the board.
* That only works if **the straight path ahead of its head**, all the way to
  the edge, is completely clear.
* A blocked arrow shakes red and stays put. Clear whatever is in its way
  first.
* Removing an arrow only ever frees up cells, so **the layout can never be
  broken** — every level can always be finished, regardless of click order.
  The challenge is finding that order, not the risk of locking yourself out.

The shape of an arrow's body doesn't matter for its own movement — it only
matters as an obstacle for the others.

## Running it

### In the browser

**https://claudeplos.github.io/Unarrow/** — the `main` branch, hosted on
GitHub Pages.

On iPhone and Android, use *Share → Add to Home Screen* after opening it —
the game gets its own icon, launches full-screen with no address bar, and
works offline. Details in [Installing as an app](#installing-as-an-app).

Touch is fully supported: an arrow is removed by tapping it, and the hit
target is enlarged enough to aim with a finger.

### Locally

No dependencies, no build step. Just open the file:

```
xdg-open index.html      # or just drag it into a browser
```

All scripts load as plain `<script>` tags (not ES modules), so the game also
works from `file://`, no local server needed. Optionally:

```
npx http-server . -p 8080   # then http://localhost:8080
```

A note for iOS: opening these files from the Files app doesn't work well —
Safari struggles with local HTML that loads separate CSS and JS files. Use
the hosted version on a phone.

## Controls

| action | effect |
| --- | --- |
| click / tap an arrow | try to remove it |
| <kbd>H</kbd> or the lightbulb button | hint — highlights a random arrow that can be removed right now |
| <kbd>R</kbd> or the refresh button | restart the same board |
| <kbd>Esc</kbd> | close the rules window |
| the speaker button | mutes sound effects **and** background music with one click |
| the ⓘ button | rules of the game |
| the language button | switch between English and Polish |

Hovering an arrow highlights it in **neutral grey**, never red. That's
deliberate: the color under the cursor can't give away whether an arrow is
removable, because that's the whole puzzle. Red is reserved for the hint and
for a blocked arrow's shake.

## Localization

The game ships in English (the default) and Polish, switchable with the
language button in the bottom-left corner. It shows the code of the language
a click will switch *to* — so in English mode it reads "PL", and vice versa.

Every piece of UI text — button labels, the rules dialog, the win screen —
lives in one dictionary in `js/i18n.js`, tagged onto DOM elements with
`data-i18n`, `data-i18n-html` (for strings containing `<strong>`/`<kbd>`),
and `data-i18n-title` (sets `title` *and* `aria-label` together) attributes.
Switching language just re-walks those elements and swaps their text — no
reload, no flicker beyond the swap itself.

The choice persists in `localStorage` (`unarrow.lang`) the same way the mute
setting does, so it's remembered on the next visit but always defaults to
English for a first-time visitor.

The win screen's stats line (time, moves, mistakes, hints) is built
dynamically in `js/game.js`, not by the generic `data-i18n` mechanism, so a
language switch while that screen is showing re-renders it too. In practice
that only reaches a player through keyboard activation of the language
button: the win overlay's full-screen backdrop blocks *pointer* clicks to
the HUD behind it, the same as it always has for every other HUD button —
but a keyboard user tabbing to the button and pressing Enter isn't stopped
by that, since CSS `pointer-events` only gates pointer input.

One thing that does **not** follow the in-page toggle: the installed app's
name and description, defined in `manifest.webmanifest`. PWA manifests are
static files with no cross-browser way to localize dynamically, so the
installed icon's label always reads in English — consistent with English
being the default anyway.

## Background music

A looping chiptune track plays in the background — generated and sequenced
on the fly with WebAudio (`js/music.js`), zero audio files in the repo, just
like the sound effects.

It mimics the constraints of the Amiga's real 4-channel sound chip (Paula):
bass (`triangle`), a lead melody (`square`), and drums made of band-passed
noise, plus an arpeggio channel cycling root-third-fifth-third — a classic
tracker trick for faking a chord on a single channel, since Paula genuinely
couldn't play one at once.

An Am–F–C–G progression, four bars in 4/4 at 132 beats per minute, in the
natural A-minor scale — hence F, not F#, even over the G chord (a common
Aeolian borrowing in exactly this progression, familiar from a lot of pop
songs). The last bar ends with a run leading back into the opening note of
bar one, so the loop closes without an audible seam.

### How it plays

The sequencer uses standard *lookahead scheduling*: every 25 ms it checks
the `AudioContext` clock and schedules, 100 ms ahead, every note whose time
has come — timing notes with plain `setTimeout` alone would drift with the
JS engine's small delays and produce audible jitter. Music and sound effects
share one `AudioContext` (`Sfx.context()`), so there's no second, independent
audio clock and no doubled unlock cost on iOS.

The sequencer stops on a hidden tab (`visibilitychange`) — nobody would hear
it anyway — and resumes from wherever the loop was on return, without
catching up. Muting works the same way as in `js/sfx.js`: `Music` doesn't
stop the sequencer, each note-playing function just checks the mute flag and
creates nothing if it's set — so unmuting comes back exactly on the beat,
without chasing the loop.

## Installing as an app

The game is a progressive web app, so it can be added to the home screen and
played without a network connection.

**iPhone / iPad** — open the game in Safari, then *Share* → *Add to Home
Screen*. iOS doesn't read the manifest for display mode or the name under
the icon, which is why `index.html` also carries separate
`apple-mobile-web-app-*` meta tags and an `apple-touch-icon`. Without them,
tapping the icon would just open plain Safari with an address bar.

**Android / desktop** — Chrome will offer to install it, or use *menu* →
*Install app*.

After the first visit, `sw.js` caches the whole game in the browser, so
later launches work **without a connection** — on a plane, on the subway,
anywhere.

### How the cache works

The strategy is **stale-while-revalidate**: the response comes back
instantly from cache (offline works, startup is fast), while a fresh version
downloads in the background and takes effect on the next launch. Plain
cache-first would glue a player to an old version until the cache number was
bumped by hand.

So shipping changes needs no extra step — they arrive on their own, one
launch later. The `CACHE` constant in `sw.js` only needs bumping when **the
list of files** to precache changes, since that's what forces a fresh
`addAll()` and a cleanup of the old cache.

The service worker only registers over HTTPS and on `localhost` — browsers
require that. From `file://`, `js/pwa.js` silently backs off instead of
spamming the console with an error.

## Project structure

| file | role |
| --- | --- |
| `index.html` | page structure and UI markup |
| `css/style.css` | interface look (HUD, modal dialogs) |
| `js/rng.js` | deterministic PRNG (mulberry32) |
| `js/geometry.js` | polyline math: arc length, slicing, hit-testing |
| `js/generator.js` | board generator with a solvability guarantee |
| `js/sfx.js` | sound effects synthesized on WebAudio |
| `js/music.js` | chiptune background music, sequenced on WebAudio |
| `js/i18n.js` | bilingual UI strings (English/Polish) and DOM translation |
| `js/game.js` | game state, drawing, input handling |
| `js/pwa.js` | service worker registration |
| `manifest.webmanifest` | progressive web app metadata |
| `sw.js` | service worker — cache and offline mode |
| `icons/` | app icons (192, 512, apple-touch, favicon) |
| `docs/screenshot.png` | screenshot used in this README |

Load order in `index.html` matters: `rng` → `generator` → `geometry` →
`sfx` → `music` → `i18n` → `game` → `pwa`. `music.js` calls `Sfx.context()`,
so it has to load after `sfx.js`. Each file exposes a single object on
`window`.

## Data model

The board is a `size × size` **grid of points**. Arrows travel along grid
edges, and every coordinate is an integer in `0 .. size-1`.

The generator returns a board object:

```js
{
  size:   12,             // grid side, in points
  level:  7,              // level number
  angle:  -0.043,         // board tilt in radians (± ~5.4°)
  arrows: [ /* … */ ]
}
```

A single arrow:

```js
{
  id:   3,
  dir:  { x: 0, y: -1 },                          // head direction, one of four
  cells: [[8,9], [7,9], [6,9], [6,8], [6,7]],     // tail to head
  exitPath: [[8,9], [7,9], [6,9], [6,8], [6,7], [6,-3]]   // + a line off the board
}
```

`cells` holds **every point it passes through**, not just the corners:
consecutive entries are always neighbors on the grid. That's not a stylistic
choice — the list doubles as the set of cells the arrow occupies, so it has
to be dense. The list's last step always matches `dir`, since that's what
determines which way the head points.

Because every step is axis-aligned, two arrows can only cross at a grid
point. That's why **disjoint point sets are enough** to detect collisions —
there's no need to test segment intersections.

`js/game.js` adds derived fields to each arrow: `cum` (cumulative arc length
along `exitPath`), `bodyLen`, `total`, `status`
(`idle` → `leaving` → `gone`), and `progress`.

## Board generator

The heart of the project is `js/generator.js`. Boards are built
**backwards**: the first arrow placed is the one that gets removed **last**.

```
for each attempt:
    pick a random direction d and head position h
    reject if h is occupied
    compute the exit track: points from h+d off the edge
    reject if the exit track touches any arrow already placed
    grow a tail backward from h: 1–4 segments of 1–3 steps each,
        each one perpendicular to the last,
        avoiding occupied cells, its own cells, and its own exit track
    reject if the body came out shorter than 3 points
    commit: mark the cells as occupied
finally: reverse the list
```

Why this works. Call the placement order `p₁, p₂, …, pₙ`. The condition
placement enforces means arrow `pₖ`'s exit track is clear of `p₁ … pₖ₋₁`. So
on the full board, `pₙ` can be removed, then `pₙ₋₁`, and so on — **the
reverse of the placement order is a valid solution by construction**.
Solvability falls out of how the board is built, not from checking it
afterward: there's no solver here filtering out bad boards.

What's more, removing an arrow only ever **frees** cells, and the
removability condition is monotonic in occupancy. Once an arrow becomes
removable, it stays removable forever, so **no sequence of player moves can
lead to a dead end**. The game doesn't need undo, and doesn't have one.

Two invariants are enforced while placing arrows:

1. Arrow bodies never overlap.
2. An arrow's body never crosses its own exit track — otherwise the arrow
   would run into itself while sliding out.

Randomness is seeded from the level number (`js/rng.js`, mulberry32), so
"level 7" always looks the same, and the *restart* button reloads the exact
same puzzle. Because random packing is uneven, `generate()` tries up to six
seeds and keeps the best-filled board — without that, density would jump
around between neighboring levels.

## Level progression

`Generator.levelSpec(level)` sets the grid size and target arrow count:

```js
size   = min(9 + floor((level - 1) / 2), 17)
arrows = min(6 + round((level - 1) * 2.2), 40)
```

| level | grid | arrows |
| --- | --- | --- |
| 1 | 9×9 | 6 |
| 5 | 11×11 | 15 |
| 10 | 13×13 | 26 |
| 15 | 16×16 | 37 |
| 17 and up | 17×17 | 40 |

The arrow count is a **target, not a guarantee** — on a dense board the
generator may fail to fit the last few, and hands back however many it
managed once it runs out of attempts. There's no fixed number of levels;
past 17, puzzles only differ by their random seed.

## Drawing

Everything runs on one `<canvas>` in **grid coordinate space**, where 1 unit
is the spacing between grid points. That means there isn't a single pixel
conversion anywhere in the drawing code — thicknesses and lengths are given
directly in grid units and scale themselves.

A canvas transform handles the scale, centering, and tilt:

```js
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // screen pixel density
ctx.translate(cx, cy);                    // window center
ctx.rotate(angle);                        // board tilt
ctx.scale(scale, scale);                  // grid unit → pixels
ctx.translate(-half, -half);              // grid center to window center
```

The scale is chosen so the **rotated** board still fits the window — hence
the `|cos θ| + |sin θ|` factor in `layout()`.

Layers, bottom to top: the white card with its shadow, the circuit-board
pattern, grid dots, resting arrows, arrows in motion. Everything but the
card's shadow is drawn clipped to its rounded rectangle, so sliding arrows
tuck under the edge instead of spilling onto the background.

The circuit-board pattern is random traces starting from a **coarse jittered
grid**, not pure randomness — otherwise they'd clump into a few patches and
leave bare stretches.

## Slide-out animation

An arrow's track is `exitPath`: its own body, extended by a straight line
running three cells past the board edge. At progress `p`, the slice of the
polyline drawn is `[p, p + bodyLen]`, clamped to the track's length:

```
p = 0            → [0, bodyLen]        full body at its starting spot
p increases      → [p, p + bodyLen]    the arrow crawls along its own track
head reaches end → [p, total]          the tail catches up to the end
p ≥ total        → status 'gone'
```

All the work lives in `Geo.slice()`. The effect is that the arrow **crawls
out along its own shape** — the tail faithfully retraces every turn the head
made.

An arrow stops blocking others **the moment it's clicked**, not once its
animation finishes, so you can click a run of arrows without waiting.

## Hit-testing an arrow

The pointer position is converted to grid coordinates by inverting the view
transform (`screenToGrid`), then the nearest polyline within a radius of
`STROKE / 2 + HIT_SLOP` is found. The `HIT_SLOP` margin makes the target big
enough to aim with a finger on a phone.

## Module API

Each file exposes a single object on `window`:

```js
makeRng(seed)                 // → a rnd() function with .int(n), .pick(arr), .range(lo, hi)

Geo.measure(pts)              // → array of cumulative arc lengths
Geo.pointAt(pts, cum, s)      // → point on the polyline at arc length s
Geo.slice(pts, cum, a, b)     // → the polyline slice between a and b
Geo.distToPolyline(x, y, pts) // → distance from a point to the polyline

Generator.generate(level)     // → a board object
Generator.levelSpec(level)    // → { size, arrows }
Generator.DIRS                // → the four axis-aligned directions

Sfx.setMuted(v)  Sfx.isMuted()  Sfx.unlock()  Sfx.context()
Sfx.release()    Sfx.blocked()  Sfx.hint()  Sfx.win()

Music.setMuted(v)  Music.isMuted()  Music.unlock()

I18N.lang()        // → 'en' or 'pl', the active language
I18N.t(key)        // → the string for `key` in the active language
I18N.setLang(lang) // → switches language and re-applies every data-i18n* element
```

`Sfx.unlock()` and `Music.unlock()` are called on the first click, since
browsers won't let an `AudioContext` start without a user gesture.
`Sfx.context()` returns (creating it if needed) the shared `AudioContext`
that `js/music.js` also uses — one context for the whole game, one unlock.
Everything is synthesized from oscillators and filtered noise — there are no
audio files in the repository.

`js/game.js` also exposes a handle for automated testing and console
debugging:

```js
window.__unarrow.state              // the full game state
window.__unarrow.loadLevel(n)       // jump to level n
window.__unarrow.gridToScreen(x, y) // grid coordinates → window pixels
window.__unarrow.firstRemovable()   // → { id, point } or null
```

## Persisted state

Progress lives in `localStorage`, every write wrapped in `try/catch` — in
private browsing the game still works, it just won't remember state between
sessions.

| key | meaning |
| --- | --- |
| `unarrow.level` | the highest level reached, loaded on startup |
| `unarrow.muted` | `'1'` when sound is muted |
| `unarrow.lang` | `'en'` or `'pl'`, the chosen UI language (default `'en'`) |
| `unarrow.seen` | `'1'` once the rules dialog has been closed |

## Testing

There's no test framework. The generator's logic is easy to check straight
from Node — just stub out `window`:

```js
globalThis.window = globalThis;
require('./js/rng.js');
require('./js/generator.js');

const puzzle = window.Generator.generate(12);
// check: no overlapping cells, simulated removal clears the board
```

The interactive layer was tested with synthetic `PointerEvent`s in headless
Chromium, using the `window.__unarrow` handle to aim:

```js
const a = window.__unarrow.firstRemovable();
const [x, y] = window.__unarrow.gridToScreen(a.point[0], a.point[1]);
canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
```

Looped until the board is empty, this clears levels 1 and 12 without a
single missed click. The test scripts aren't part of the repository.

## Tunable constants

All at the top of `js/game.js`, in grid units (except times, which are in
seconds):

| constant | value | meaning |
| --- | --- | --- |
| `PAD` | `1.15` | margin of the white card around the grid |
| `STROKE` | `0.38` | arrow stroke thickness |
| `HEAD_LEN` | `0.74` | arrowhead length |
| `HEAD_HALF` | `0.46` | half the arrowhead width |
| `HIT_SLOP` | `0.26` | margin when hit-testing an arrow |
| `SPEED` | `19` | slide-out speed (grid units per second) |
| `SHAKE_TIME` | `0.42` | how long a blocked arrow shakes |
| `HINT_TIME` | `1.9` | how long a hint stays lit |

The palette sits right next to it, in `COLORS`.

## Browser support

Required: Canvas 2D, Pointer Events, `localStorage`, WebAudio. Offline mode
and installability add Service Worker and Cache Storage, available only over
HTTPS and on `localhost`; missing them doesn't break the game itself, it
just loses installability and offline play. Works in current versions of
Chrome, Firefox, Safari, and Edge, phones included. Drawing accounts for
`devicePixelRatio` (capped at 2.5, so fill rate doesn't blow out on
high-density screens). Missing WebAudio silences sound but doesn't break the
game.

## Known limitations

* The look was reverse-engineered from a screenshot by eye — the board's
  tilt, the circuit-board background, and the arrow proportions are an
  approximation, not a 1:1 copy.
* `window.__unarrow` exposes the full game state. Handy for debugging, but
  worth gating behind a flag in a production build.
* No undo — deliberately, since by construction of the generator no move can
  ever break a puzzle.
* The arrow count on a level can come out a few short of the target when the
  generator fails to fit them all.
* The installed app's name and description (`manifest.webmanifest`) don't
  follow the in-page language toggle — PWA manifests are static, with no
  cross-browser way to localize them dynamically, so the installed icon's
  label stays in English regardless of which language is active on the page.

---

# Polski

## Spis treści

* [Zagraj teraz](https://claudeplos.github.io/Unarrow/)
* [Zasady](#zasady)
* [Uruchomienie](#uruchomienie)
* [Sterowanie](#sterowanie)
* [Lokalizacja](#lokalizacja)
* [Muzyka w tle](#muzyka-w-tle)
* [Instalacja jako aplikacja](#instalacja-jako-aplikacja)
* [Struktura projektu](#struktura-projektu)
* [Model danych](#model-danych)
* [Generator plansz](#generator-plansz)
* [Progresja poziomów](#progresja-poziomów)
* [Rysowanie](#rysowanie)
* [Animacja wysuwania](#animacja-wysuwania)
* [Trafianie w strzałkę](#trafianie-w-strzałkę)
* [API modułów](#api-modułów)
* [Zapis stanu](#zapis-stanu)
* [Testowanie](#testowanie)
* [Stałe do strojenia](#stałe-do-strojenia)
* [Wsparcie przeglądarek](#wsparcie-przeglądarek)
* [Znane ograniczenia](#znane-ograniczenia)

---

## Zasady

* Kliknij strzałkę — wysunie się ona po swoim torze poza planszę.
* Uda się to **tylko wtedy, gdy prosta droga przed grotem**, aż do krawędzi
  planszy, jest całkowicie pusta.
* Zablokowana strzałka zadrga na czerwono i zostaje. Najpierw trzeba usunąć to,
  co stoi jej na drodze.
* Usunięcie strzałki jedynie zwalnia pola, więc **układu nie da się zepsuć** —
  każdy poziom zawsze da się dokończyć, niezależnie od kolejności klikania.
  Wyzwaniem jest znalezienie tej kolejności, a nie ryzyko zablokowania się.

Kształt ciała strzałki nie ma znaczenia dla jej własnego ruchu — liczy się
wyłącznie jako przeszkoda dla pozostałych.

## Uruchomienie

### W przeglądarce

**https://claudeplos.github.io/Unarrow/** — wersja z gałęzi `main`, hostowana
na GitHub Pages.

Na iPhonie i Androidzie warto po wejściu użyć *Udostępnij → Dodaj do ekranu
początkowego* — gra dostanie własną ikonę, uruchomi się na pełnym ekranie bez
paska adresu i będzie działać offline. Szczegóły w sekcji
[Instalacja jako aplikacja](#instalacja-jako-aplikacja).

Sterowanie dotykiem jest obsłużone: strzałkę usuwa się dotknięciem, a cel
trafienia jest powiększony na tyle, żeby dało się celować palcem.

### Lokalnie

Nie ma zależności ani kroku budowania. Wystarczy otworzyć plik:

```
xdg-open index.html      # albo po prostu przeciągnąć do przeglądarki
```

Wszystkie skrypty ładowane są zwykłymi tagami `<script>` (nie modułami ES),
więc gra działa również z `file://`, bez lokalnego serwera. Opcjonalnie:

```
npx http-server . -p 8080   # potem http://localhost:8080
```

Uwaga dla iOS: nie da się sensownie otworzyć tych plików z aplikacji *Pliki* —
Safari kiepsko radzi sobie z lokalnym HTML-em ładującym osobne pliki CSS i JS.
Na telefonie korzystaj z wersji hostowanej.

## Sterowanie

| akcja | efekt |
| --- | --- |
| kliknięcie / dotknięcie strzałki | próba usunięcia |
| <kbd>H</kbd> lub przycisk żarówki | podpowiedź — podświetla losową strzałkę, którą da się teraz usunąć |
| <kbd>R</kbd> lub przycisk odświeżenia | ta sama plansza od nowa |
| <kbd>Esc</kbd> | zamknięcie okna z zasadami |
| przycisk głośnika | wyciszenie efektów **i** muzyki w tle jednym kliknięciem |
| przycisk ⓘ | zasady gry |
| przycisk języka | przełączenie między angielskim a polskim |

Najechanie myszą podświetla strzałkę **neutralnym szarym** kolorem, nigdy
czerwonym. To celowe: kolor pod kursorem nie może zdradzać, czy strzałka jest
usuwalna, bo to właśnie jest zagadka. Czerwień zarezerwowana jest dla
podpowiedzi i dla drgania zablokowanej strzałki.

## Lokalizacja

Gra działa w dwóch językach — angielskim (domyślnym) i polskim — przełączanych
przyciskiem języka w lewym dolnym rogu. Przycisk pokazuje kod języka, na który
przełączy kliknięcie, nie język bieżący — w trybie angielskim widnieje więc
„PL", i odwrotnie.

Każdy fragment tekstu interfejsu — etykiety przycisków, okno zasad, ekran
wygranej — siedzi w jednym słowniku w `js/i18n.js`, dowiązanym do elementów
DOM atrybutami `data-i18n`, `data-i18n-html` (dla treści z `<strong>`/`<kbd>`)
i `data-i18n-title` (ustawia jednocześnie `title` i `aria-label`). Zmiana
języka to tylko ponowne przejście po tych elementach i podmiana tekstu — bez
przeładowania strony i bez migotania poza samą podmianą.

Wybór zapisywany jest w `localStorage` (`unarrow.lang`) tak samo jak
wyciszenie — zapamiętywany na kolejną wizytę, ale zawsze domyślnie angielski
przy pierwszym wejściu.

Linijka statystyk na ekranie wygranej (czas, ruchy, pomyłki, podpowiedzi)
budowana jest dynamicznie w `js/game.js`, nie przez ogólny mechanizm
`data-i18n`, więc zmiana języka w trakcie jej wyświetlania też ją odświeża —
w praktyce dociera to do gracza wyłącznie przez aktywację przycisku języka
z klawiatury, bo pełnoekranowe tło nakładki wygranej blokuje kliknięcia
*wskaźnikiem* w HUD pod spodem (tak samo jak zawsze blokowało pozostałe
przyciski HUD); użytkownika nawigującego klawiaturą (Tab + Enter) to nie
zatrzymuje, bo CSS-owe `pointer-events` blokuje wyłącznie wejście ze
wskaźnika.

Jednej rzeczy przełącznik w stronie **nie** dotyczy: nazwy i opisu
zainstalowanej aplikacji, zdefiniowanych w `manifest.webmanifest`. Manifesty
PWA to statyczne pliki bez wsparcia dla dynamicznej zmiany języka
międzyprzeglądarkowo, więc etykieta zainstalowanej ikony zawsze jest po
angielsku — spójnie z tym, że angielski i tak jest domyślny.

## Muzyka w tle

W tle leci zapętlona kompozycja w stylu chiptune z gier na Amigę — cała
wygenerowana i zsekwencjonowana w locie na WebAudio (`js/music.js`), zero
plików audio w repozytorium, tak samo jak efekty dźwiękowe.

Naśladuje ograniczenie prawdziwego 4-kanałowego chipu dźwiękowego Amigi
(Paula): bas (`triangle`), melodia prowadząca (`square`) i perkusja z szumu
filtrowanego pasmowo, plus kanał arpeggio grający root-tercja-kwinta-tercja
w kółko na szesnastkach — to klasyczna sztuczka trackerowa udająca akord na
pojedynczym kanale, bo Paula naprawdę zagrać akordu na raz nie potrafiła.

Progresja Am–F–C–G, cztery takty w metrum 4/4 przy 132 uderzeniach na
minutę, w naturalnej gamie a-moll — stąd F, nie F#, również nad akordem G
(typowe zapożyczenie eolskie w tej właśnie progresji, znajome z mnóstwa
piosenek). Ostatni takt kończy się zbiegiem nut prowadzącym z powrotem do
otwierającej nuty pierwszego taktu, więc pętla domyka się bez słyszalnego
szwu.

### Jak to gra

Sekwencer korzysta ze standardowej techniki *lookahead scheduling*: co 25 ms
sprawdza zegar `AudioContext` i planuje z wyprzedzeniem 100 ms wszystkie
nuty, których czas nadszedł — próbkowanie samym `setTimeout` w rytm nut
gubiłoby się w drobnych opóźnieniach silnika JS i dawało słyszalny jitter.
Muzyka i efekty dźwiękowe współdzielą jeden `AudioContext` (`Sfx.context()`),
więc nie ma dwóch niezależnych zegarów audio ani podwójnego kosztu
odblokowania na iOS.

W ukrytej karcie sekwencer się zatrzymuje (`visibilitychange`) — i tak nikt
by nie usłyszał, a po powrocie wznawia się od bieżącego miejsca w pętli, bez
nadrabiania zaległości. Wyciszenie działa tak samo jak w `js/sfx.js`: `Music`
nie zatrzymuje sekwencera, tylko każda z funkcji odtwarzających nutę
sprawdza flagę wyciszenia i w razie potrzeby nic nie tworzy — dzięki temu
odciszenie wraca dokładnie w takt, bez doganiania pętli.

## Instalacja jako aplikacja

Gra jest aplikacją progresywną (PWA), więc da się ją dodać do ekranu
początkowego i grać bez sieci.

**iPhone / iPad** — otwórz grę w Safari, potem *Udostępnij* → *Dodaj do ekranu
początkowego*. iOS nie czyta z manifestu ani trybu wyświetlania, ani nazwy pod
ikoną, dlatego w `index.html` siedzą osobne meta tagi `apple-mobile-web-app-*`
i `apple-touch-icon`. Bez nich stuknięcie w ikonę otwierałoby zwykłe Safari
z paskiem adresu.

**Android / desktop** — Chrome sam zaproponuje instalację, albo *menu* →
*Zainstaluj aplikację*.

Po pierwszym wejściu `sw.js` wrzuca całą grę do cache przeglądarki, więc
kolejne uruchomienia działają **bez połączenia** — w samolocie, w metrze,
gdziekolwiek.

### Jak działa cache

Strategia to **stale-while-revalidate**: odpowiedź idzie natychmiast z cache
(offline działa, start jest szybki), a świeża wersja pobierana jest w tle
i wchodzi w życie przy następnym uruchomieniu. Zwykłe cache-first potrafiłoby
przykleić gracza do starej wersji aż do ręcznej zmiany numeru cache.

Wypuszczając zmiany nie trzeba więc nic robić — dojdą same, z jednym
uruchomieniem opóźnienia. Stałą `CACHE` w `sw.js` podbija się tylko przy
**zmianie listy plików** do wstępnego zapisania, bo to ona wymusza ponowne
`addAll()` i sprzątnięcie starego cache.

Service worker rejestruje się wyłącznie po HTTPS i na `localhost` — tak
wymagają przeglądarki. Z `file://` `js/pwa.js` po cichu odpuszcza, żeby nie
sypać błędem w konsoli.

## Struktura projektu

| plik | rola |
| --- | --- |
| `index.html` | struktura strony i interfejsu |
| `css/style.css` | wygląd interfejsu (HUD, okna modalne) |
| `js/rng.js` | deterministyczny PRNG (mulberry32) |
| `js/geometry.js` | operacje na łamanych: długość łuku, wycinek, trafianie |
| `js/generator.js` | generator plansz z gwarancją rozwiązywalności |
| `js/sfx.js` | efekty dźwiękowe syntezowane na WebAudio |
| `js/music.js` | muzyka w tle w stylu chiptune, sekwencjonowana na WebAudio |
| `js/i18n.js` | dwujęzyczne teksty interfejsu (EN/PL) i podmiana treści w DOM |
| `js/game.js` | stan gry, rysowanie, obsługa wejścia |
| `js/pwa.js` | rejestracja service workera |
| `manifest.webmanifest` | metadane aplikacji progresywnej |
| `sw.js` | service worker — cache i tryb offline |
| `icons/` | ikony aplikacji (192, 512, apple-touch, favicon) |
| `docs/screenshot.png` | zrzut ekranu do README |

Kolejność ładowania w `index.html` jest istotna: `rng` → `generator` →
`geometry` → `sfx` → `music` → `i18n` → `game` → `pwa`. `music.js` wywołuje
`Sfx.context()`, więc musi się załadować po `sfx.js`. Każdy plik wystawia
jeden obiekt w `window`.

## Model danych

Plansza to **krata punktów** `size × size`. Strzałki biegną po krawędziach
kraty, a wszystkie współrzędne są całkowite w zakresie `0 .. size-1`.

Generator zwraca obiekt planszy:

```js
{
  size:   12,             // bok kraty w punktach
  level:  7,              // numer poziomu
  angle:  -0.043,         // przekrzywienie planszy w radianach (± ~5,4°)
  arrows: [ /* … */ ]
}
```

Pojedyncza strzałka:

```js
{
  id:   3,
  dir:  { x: 0, y: -1 },                          // kierunek grotu, jeden z czterech
  cells: [[8,9], [7,9], [6,9], [6,8], [6,7]],     // od ogona do grotu
  exitPath: [[8,9], [7,9], [6,9], [6,8], [6,7], [6,-3]]   // + prosta poza planszę
}
```

`cells` zawiera **każdy mijany punkt**, nie tylko wierzchołki załamań: kolejne
pozycje są zawsze sąsiadami na kracie. To nie jest kwestia gustu — lista służy
jednocześnie za zbiór pól zajętych przez strzałkę, więc musi być gęsta.
Ostatni krok listy zawsze zgadza się z `dir`, bo to on wyznacza zwrot grotu.

Ponieważ każdy krok jest osiowy, dwie strzałki mogą się przeciąć wyłącznie
w punkcie kraty. Dlatego **rozłączność zbiorów punktów w zupełności wystarcza**
za wykrywanie kolizji — nie ma potrzeby badać przecięć odcinków.

`js/game.js` dokłada do każdej strzałki pola pochodne: `cum` (skumulowane
długości łuku `exitPath`), `bodyLen`, `total`, `status`
(`idle` → `leaving` → `gone`) i `progress`.

## Generator plansz

Sedno projektu leży w `js/generator.js`. Plansze budowane są **od tyłu**:
jako pierwszą kładziemy strzałkę, która zostanie usunięta jako **ostatnia**.

```
dla każdej próby:
    wylosuj kierunek d i pozycję grotu h
    odrzuć, jeśli h jest zajęte
    wyznacz tor wyjścia: punkty od h+d aż poza krawędź
    odrzuć, jeśli tor wyjścia dotyka którejkolwiek już położonej strzałki
    zapuść ogon wstecz od h: 1–4 odcinki po 1–3 kroki,
        każdy kolejny prostopadły do poprzedniego,
        omijając pola zajęte, własne i własny tor wyjścia
    odrzuć, jeśli ciało wyszło krótsze niż 3 punkty
    zatwierdź: oznacz pola jako zajęte
na koniec: odwróć listę
```

Dlaczego to działa. Oznaczmy kolejność układania `p₁, p₂, …, pₙ`. Z warunku
przy dokładaniu wynika, że tor wyjścia `pₖ` jest wolny od `p₁ … pₖ₋₁`. Zatem na
pełnej planszy da się usunąć `pₙ`, potem `pₙ₋₁` i tak dalej — **odwrotna
kolejność układania jest z definicji poprawnym rozwiązaniem**. Rozwiązywalność
wynika więc z konstrukcji, a nie z weryfikacji po fakcie: nie ma tu żadnego
solvera odsiewającego złe plansze.

Co więcej, usunięcie strzałki wyłącznie **zwalnia** pola, a warunek usuwalności
jest monotoniczny względem zajętości. Raz usuwalna strzałka pozostaje usuwalna
na zawsze, więc **żadna kolejność ruchów gracza nie prowadzi w ślepy zaułek**.
Gra nie potrzebuje cofania ruchu i go nie ma.

Dwa niezmienniki pilnowane przy układaniu:

1. Ciała strzałek nigdy się nie nakładają.
2. Ciało strzałki nigdy nie wchodzi na własny tor wyjścia — inaczej przy
   wysuwaniu strzałka wpadłaby sama na siebie.

Losowanie zasilane jest numerem poziomu (`js/rng.js`, mulberry32), więc
„poziom 7" zawsze wygląda tak samo, a przycisk *od nowa* wczytuje tę samą
układankę. Ponieważ losowe upychanie bywa nierówne, `generate()` próbuje do
sześciu ziaren i bierze najlepiej wypełnioną planszę — bez tego gęstość
potrafiła skakać między sąsiednimi poziomami.

## Progresja poziomów

`Generator.levelSpec(level)` wyznacza rozmiar kraty i docelową liczbę strzałek:

```js
size   = min(9 + floor((level - 1) / 2), 17)
arrows = min(6 + round((level - 1) * 2.2), 40)
```

| poziom | krata | strzałek |
| --- | --- | --- |
| 1 | 9×9 | 6 |
| 5 | 11×11 | 15 |
| 10 | 13×13 | 26 |
| 15 | 16×16 | 37 |
| 17 i wyżej | 17×17 | 40 |

Liczba strzałek jest **celem, nie gwarancją** — przy gęstej planszy generator
może nie zmieścić ostatnich kilku i po wyczerpaniu prób oddaje tyle, ile udało
się ułożyć. Poziomów nie ma skończonej liczby; powyżej 17 układanki różnią się
już tylko losowaniem.

## Rysowanie

Wszystko idzie na jeden `<canvas>` w **układzie współrzędnych siatki**, gdzie
1 jednostka to odstęp między punktami kraty. Dzięki temu w kodzie rysującym nie
ma ani jednego przeliczenia na piksele — grubości i długości podane są wprost
w jednostkach siatki i skalują się same.

Za skalę, wyśrodkowanie i przekrzywienie odpowiada transformacja canvasu:

```js
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // gęstość ekranu
ctx.translate(cx, cy);                    // środek okna
ctx.rotate(angle);                        // przekrzywienie planszy
ctx.scale(scale, scale);                  // jednostka siatki → piksele
ctx.translate(-half, -half);              // środek kraty do środka okna
```

Skala dobierana jest tak, żeby **obrócona** plansza mieściła się w oknie —
stąd czynnik `|cos θ| + |sin θ|` w `layout()`.

Warstwy, od spodu: biała karta z cieniem, wzór płytki drukowanej, punkty kraty,
strzałki leżące, strzałki w ruchu. Wszystko poza cieniem karty rysowane jest
w obcięciu do jej zaokrąglonego prostokąta, więc wysuwane strzałki chowają się
pod krawędź zamiast wyjeżdżać na tło.

Wzór płytki drukowanej to losowe ścieżki startujące ze **zgrubnej kraty
z drganiem**, nie z czystego losowania — inaczej zbijały się w kilka kęp
i zostawiały puste połacie.

## Animacja wysuwania

Tor strzałki to `exitPath`: jej własne ciało, przedłużone prostą wybiegającą
trzy pola poza krawędź planszy. Przy postępie `p` rysowany jest wycinek łamanej
od `p` do `p + bodyLen`, przycięty do długości toru:

```
p = 0            → [0, bodyLen]        całe ciało w miejscu wyjściowym
p rośnie         → [p, p + bodyLen]    strzałka pełznie po własnym torze
grot dobija      → [p, total]          ogon dociąga się do końca
p ≥ total        → status 'gone'
```

Cała robota siedzi w `Geo.slice()`. Efekt jest taki, że strzałka **wypełza po
swoim własnym kształcie** — ogon wiernie powtarza zakręty, które przeszedł grot.

Strzałka przestaje blokować inne **w chwili kliknięcia**, a nie po zakończeniu
animacji, więc da się klikać seriami bez czekania.

## Trafianie w strzałkę

Pozycja wskaźnika przeliczana jest do współrzędnych siatki odwrotnością
transformacji widoku (`screenToGrid`), a potem szukamy najbliższej łamanej
w promieniu `STROKE / 2 + HIT_SLOP`. Zapas `HIT_SLOP` daje na tyle duży cel,
żeby dało się grać palcem na telefonie.

## API modułów

Każdy plik wystawia jeden obiekt w `window`:

```js
makeRng(seed)                 // → funkcja rnd() z .int(n), .pick(arr), .range(lo, hi)

Geo.measure(pts)              // → tablica skumulowanych długości łuku
Geo.pointAt(pts, cum, s)      // → punkt na łamanej w odległości s
Geo.slice(pts, cum, a, b)     // → wycinek łamanej między a i b
Geo.distToPolyline(x, y, pts) // → odległość punktu od łamanej

Generator.generate(level)     // → obiekt planszy
Generator.levelSpec(level)    // → { size, arrows }
Generator.DIRS                // → cztery kierunki osiowe

Sfx.setMuted(v)  Sfx.isMuted()  Sfx.unlock()  Sfx.context()
Sfx.release()    Sfx.blocked()  Sfx.hint()  Sfx.win()

Music.setMuted(v)  Music.isMuted()  Music.unlock()

I18N.lang()        // → 'en' albo 'pl', aktywny język
I18N.t(key)        // → tekst dla klucza `key` w aktywnym języku
I18N.setLang(lang) // → przełącza język i odświeża wszystkie elementy data-i18n*
```

`Sfx.unlock()` i `Music.unlock()` wołane są przy pierwszym kliknięciu, bo
przeglądarki nie pozwalają wystartować `AudioContext` bez gestu użytkownika.
`Sfx.context()` zwraca (i w razie potrzeby zakłada) współdzielony
`AudioContext`, z którego korzysta też `js/music.js` — jeden kontekst na całą
grę, jedno odblokowanie. Wszystko syntezowane jest oscylatorami i filtrowanym
szumem — w repozytorium nie ma żadnych plików audio.

Dodatkowo `js/game.js` wystawia uchwyt do testów i debugowania z konsoli:

```js
window.__unarrow.state              // pełny stan gry
window.__unarrow.loadLevel(n)       // przeskocz na poziom n
window.__unarrow.gridToScreen(x, y) // współrzędne siatki → piksele okna
window.__unarrow.firstRemovable()   // → { id, point } albo null
```

## Zapis stanu

Postęp trzymany jest w `localStorage`, każdy zapis w `try/catch` — w trybie
prywatnym gra działa, tylko nie pamięta stanu między sesjami.

| klucz | znaczenie |
| --- | --- |
| `unarrow.level` | najwyższy osiągnięty poziom, wczytywany przy starcie |
| `unarrow.muted` | `'1'` gdy dźwięk wyciszony |
| `unarrow.lang` | `'en'` albo `'pl'`, wybrany język interfejsu (domyślnie `'en'`) |
| `unarrow.seen` | `'1'` gdy okno z zasadami zostało już zamknięte |

## Testowanie

Nie ma frameworka testowego. Logikę generatora da się sprawdzić prosto
z Node — wystarczy podstawić `window`:

```js
globalThis.window = globalThis;
require('./js/rng.js');
require('./js/generator.js');

const puzzle = window.Generator.generate(12);
// sprawdź: brak nakładających się pól, symulacja usuwania opróżnia planszę
```

Warstwę interaktywną testowano przez syntetyczne `PointerEvent` w headless
Chromium, korzystając z uchwytu `window.__unarrow` do wskazania celu:

```js
const a = window.__unarrow.firstRemovable();
const [x, y] = window.__unarrow.gridToScreen(a.point[0], a.point[1]);
canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
```

Pętla powtarzana aż do opróżnienia planszy przechodzi poziomy 1 i 12 bez
chybionego kliknięcia. Skrypty testowe nie są częścią repozytorium.

## Stałe do strojenia

Wszystkie na górze `js/game.js`, w jednostkach siatki (poza czasami w sekundach):

| stała | wartość | znaczenie |
| --- | --- | --- |
| `PAD` | `1.15` | margines białej karty wokół kraty |
| `STROKE` | `0.38` | grubość kreski strzałki |
| `HEAD_LEN` | `0.74` | długość grotu |
| `HEAD_HALF` | `0.46` | połowa szerokości grotu |
| `HIT_SLOP` | `0.26` | zapas przy trafianiu w strzałkę |
| `SPEED` | `19` | prędkość wysuwania (jednostek na sekundę) |
| `SHAKE_TIME` | `0.42` | czas drgania zablokowanej strzałki |
| `HINT_TIME` | `1.9` | jak długo świeci podpowiedź |

Paleta siedzi obok, w `COLORS`.

## Wsparcie przeglądarek

Wymagane: Canvas 2D, Pointer Events, `localStorage`, WebAudio. Tryb offline
i instalacja dokładają Service Worker oraz Cache Storage, dostępne wyłącznie po
HTTPS i na `localhost`; ich brak nie psuje samej gry, znika tylko instalacja
i granie bez sieci. Działa w bieżących
wersjach Chrome, Firefox, Safari i Edge, również na telefonach. Rysowanie
uwzględnia `devicePixelRatio` (ograniczony do 2,5, żeby nie przepalać wypełnienia
na ekranach o dużej gęstości). Brak WebAudio wycisza dźwięki, ale nie psuje gry.

## Znane ograniczenia

* Wygląd odtworzono ze zrzutu ekranu „na oko" — przekrzywienie planszy, tło
  płytki drukowanej i proporcje strzałek to przybliżenie, nie kopia 1:1.
* `window.__unarrow` wystawia pełny stan gry. Wygodne przy debugowaniu, ale
  w buildzie produkcyjnym warto schować to za flagą.
* Brak cofania ruchu — świadomie, bo z konstrukcji generatora żaden ruch nie
  może zepsuć układanki.
* Liczba strzałek na poziomie bywa o kilka mniejsza od docelowej, gdy generator
  nie zdoła ich upchnąć.
* Nazwa i opis zainstalowanej aplikacji (`manifest.webmanifest`) nie podążają
  za przełącznikiem języka w stronie — manifesty PWA są statyczne i nie mają
  międzyprzeglądarkowego sposobu na dynamiczną lokalizację, więc etykieta
  zainstalowanej ikony zawsze zostaje po angielsku, niezależnie od aktywnego
  języka strony.
