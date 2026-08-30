/* Deterministyczny generator liczb pseudolosowych (mulberry32).
   Dzięki niemu ten sam poziom zawsze wygląda tak samo. */
(function (global) {
  'use strict';

  function makeRng(seed) {
    let a = seed >>> 0;
    const rnd = function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rnd.int = function (n) { return Math.floor(rnd() * n); };
    rnd.pick = function (arr) { return arr[rnd.int(arr.length)]; };
    rnd.range = function (lo, hi) { return lo + rnd.int(hi - lo + 1); };
    return rnd;
  }

  global.makeRng = makeRng;
})(window);
