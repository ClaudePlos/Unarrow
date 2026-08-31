/* Dwujęzyczny interfejs: angielski (domyślny) i polski.
 *
 * Bez frameworka — elementy oznaczone atrybutami data-i18n* niosą klucz do
 * słownika, apply() podmienia ich treść przy starcie i przy każdej zmianie
 * języka. Sam moduł nie dotyka localStorage: o zapamiętaniu wyboru decyduje
 * js/game.js, tak samo jak przy wyciszeniu dźwięku — jedno miejsce
 * odpowiada za trwałość stanu, ten moduł tylko go stosuje.
 */
(function (global) {
  'use strict';

  const STRINGS = {
    en: {
      pageTitle: 'Unarrow — an arrow-removal puzzle',
      metaDescription: 'A logic puzzle: clear the board by removing every arrow.',
      levelTitle: 'Level',
      leftCountTitle: 'Arrows left',
      infoBtnLabel: 'Rules',
      hintBtnLabel: 'Hint (H)',
      restartBtnLabel: 'Restart (R)',
      soundBtnLabel: 'Sound',
      langBtnLabel: 'Language',
      infoIntroHtml: 'The board is jammed with arrows. Your job is to <strong>remove them all</strong>.',
      infoRule1Html: 'Click an arrow — it slides out along its own track, off the board.',
      infoRule2Html: 'That only works if <strong>the straight path ahead of its head</strong>, all the way to the edge, is completely clear.',
      infoRule3Html: 'A blocked arrow shakes red. Clear whatever is in its way first.',
      infoRule4Html: 'Every level can be finished — the layout can never lock you out.',
      infoHintlineHtml: 'Shortcuts: <kbd>H</kbd> hint, <kbd>R</kbd> restart.',
      infoCloseBtn: 'Play',
      winTitle: 'Board clear!',
      nextBtn: 'Next level',
      stats: { time: 'Time', moves: 'moves', mistakes: 'mistakes', hints: 'hints' }
    },
    pl: {
      pageTitle: 'Unarrow — łamigłówka ze strzałkami',
      metaDescription: 'Łamigłówka logiczna: usuń z planszy wszystkie strzałki.',
      levelTitle: 'Poziom',
      leftCountTitle: 'Pozostałe strzałki',
      infoBtnLabel: 'Zasady gry',
      hintBtnLabel: 'Podpowiedź (H)',
      restartBtnLabel: 'Od nowa (R)',
      soundBtnLabel: 'Dźwięk',
      langBtnLabel: 'Język',
      infoIntroHtml: 'Plansza jest zastawiona strzałkami. Twoim zadaniem jest <strong>usunąć je wszystkie</strong>.',
      infoRule1Html: 'Kliknij strzałkę — wysunie się ona po swoim torze poza planszę.',
      infoRule2Html: 'Uda się to tylko wtedy, gdy <strong>prosta droga przed grotem</strong>, aż do krawędzi planszy, jest całkowicie pusta.',
      infoRule3Html: 'Zablokowana strzałka zadrga na czerwono. Usuń najpierw to, co stoi jej na drodze.',
      infoRule4Html: 'Każdy poziom da się ukończyć — nie da się zablokować układu na amen.',
      infoHintlineHtml: 'Skróty: <kbd>H</kbd> podpowiedź, <kbd>R</kbd> od nowa.',
      infoCloseBtn: 'Gramy',
      winTitle: 'Plansza czysta!',
      nextBtn: 'Następny poziom',
      stats: { time: 'Czas', moves: 'ruchów', mistakes: 'pomyłek', hints: 'podpowiedzi' }
    }
  };

  const OTHER = { en: 'pl', pl: 'en' };
  let lang = 'en';

  function apply() {
    const dict = STRINGS[lang];
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = dict[el.getAttribute('data-i18n')];
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      el.innerHTML = dict[el.getAttribute('data-i18n-html')];
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const text = dict[el.getAttribute('data-i18n-title')];
      el.title = text;
      el.setAttribute('aria-label', text);
    });

    const title = document.querySelector('title');
    if (title) title.textContent = dict.pageTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', dict.metaDescription);

    // Przycisk pokazuje kod języka, na który przełącza kliknięcie — nie
    // bieżący język — to on jest tu jedynym elementem nietłumaczonym wprost.
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
      langBtn.textContent = OTHER[lang].toUpperCase();
      langBtn.title = dict.langBtnLabel;
      langBtn.setAttribute('aria-label', dict.langBtnLabel);
    }
  }

  global.I18N = {
    lang() { return lang; },
    t(key) { return STRINGS[lang][key]; },
    setLang(next) {
      if (next !== 'en' && next !== 'pl') return;
      lang = next;
      apply();
    }
  };
})(window);
