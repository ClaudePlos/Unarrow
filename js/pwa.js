/* Rejestracja service workera — wyłącznie przy serwowaniu po HTTP(S).
   Z file:// przeglądarki i tak odmawiają, a próba sypnęłaby błędem w konsoli. */
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.warn('Nie udało się zarejestrować service workera:', err);
    });
  });
})();
