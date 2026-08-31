# Unarrow

Łamigłówka logiczna: plansza jest zastawiona strzałkami, a Twoim zadaniem jest
usunąć je wszystkie.

### ▶ [Zagraj teraz](https://claudeplos.github.io/Unarrow/)

**https://claudeplos.github.io/Unarrow/** — działa od razu w przeglądarce, także
na telefonie. Nic nie trzeba instalować.

[![Plansza gry](docs/screenshot.png)](https://claudeplos.github.io/Unarrow/)

Czysty JavaScript, jeden `<canvas>`, zero zależności i zero kroku budowania.

---

## Spis treści

* [Zagraj teraz](https://claudeplos.github.io/Unarrow/)
* [Zasady](#zasady)
* [Uruchomienie](#uruchomienie)
* [Sterowanie](#sterowanie)
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

Najechanie myszą podświetla strzałkę **neutralnym szarym** kolorem, nigdy
czerwonym. To celowe: kolor pod kursorem nie może zdradzać, czy strzałka jest
usuwalna, bo to właśnie jest zagadka. Czerwień zarezerwowana jest dla
podpowiedzi i dla drgania zablokowanej strzałki.

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
| `js/game.js` | stan gry, rysowanie, obsługa wejścia |
| `js/pwa.js` | rejestracja service workera |
| `manifest.webmanifest` | metadane aplikacji progresywnej |
| `sw.js` | service worker — cache i tryb offline |
| `icons/` | ikony aplikacji (192, 512, apple-touch, favicon) |
| `docs/screenshot.png` | zrzut ekranu do README |

Kolejność ładowania w `index.html` jest istotna: `rng` → `generator` →
`geometry` → `sfx` → `music` → `game` → `pwa`. `music.js` wywołuje
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
