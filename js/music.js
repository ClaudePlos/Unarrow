/* Muzyka w tle w stylu chiptune z gier na Amigę — bez plików audio,
 * wszystko syntezowane i sekwencjonowane w locie na WebAudio.
 *
 * Naśladuje ograniczenia Paula (4-kanałowego chipu dźwiękowego Amigi):
 * bas (triangle), szybkie arpeggio udające akord na jednym kanale — to
 * klasyczna sztuczka trackerowa, bo Paula nie grała prawdziwych akordów na
 * jednym kanale — melodia prowadząca (square) i perkusja z szumu.
 *
 * Progresja Am–F–C–G w naturalnej gamie a-moll (same białe klawisze —
 * stąd F, nie F#, także nad akordem G: typowe zapożyczenie eolskie w tej
 * właśnie progresji, brzmi znajomo z mnóstwa piosenek).
 */
(function (global) {
  'use strict';

  const TEMPO = 132;                 // uderzeń na minutę
  const STEP_DUR = 60 / TEMPO / 4;   // czas jednej szesnastki w sekundach
  const BAR_STEPS = 16;
  const BARS = 4;
  const PATTERN_STEPS = BAR_STEPS * BARS;

  const SCHEDULE_AHEAD = 0.1;  // sekund do przodu, ile wolno zaplanować
  const LOOKAHEAD_MS = 25;     // co ile sprawdzamy zegar (ms)

  // Standardowe numery MIDI (A4 = 69 = 440 Hz), tylko białe klawisze.
  const NOTE = {
    C2: 36, D2: 38, E2: 40, F2: 41, G2: 43, A2: 45, B2: 47,
    C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59,
    C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71,
    C5: 72, D5: 74, E5: 76, F5: 77, G5: 79
  };

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // Jeden akord na bar: root w oktawie basu, third = 3 (moll) albo 4 (dur).
  const CHORDS = [
    { root: NOTE.A2, third: 3 },  // Am
    { root: NOTE.F2, third: 4 },  // F
    { root: NOTE.C3, third: 4 },  // C
    { root: NOTE.G2, third: 4 }   // G
  ];

  // Melodia prowadząca: 4 takty po 16 szesnastek, null = pauza.
  // Ostatni takt kończy się zbiegiem G5→A4, prowadzącym z powrotem do
  // otwierającego A4 pierwszego taktu — pętla domyka się bez szwu.
  const LEAD_BARS = [
    [NOTE.A4, null, NOTE.C5, null, NOTE.E5, null, NOTE.C5, NOTE.A4,
     null, NOTE.E5, null, NOTE.C5, null, NOTE.A4, null, null],
    [NOTE.F4, null, NOTE.A4, null, NOTE.C5, null, NOTE.A4, NOTE.F4,
     null, NOTE.C5, null, NOTE.A4, null, NOTE.F4, null, NOTE.G4],
    [NOTE.C5, null, NOTE.E5, null, NOTE.G5, null, NOTE.E5, NOTE.C5,
     null, NOTE.G5, null, NOTE.E5, null, NOTE.C5, null, NOTE.D5],
    [NOTE.G4, null, NOTE.B4, null, NOTE.D5, null, NOTE.B4, NOTE.G4,
     null, NOTE.G5, NOTE.F5, NOTE.E5, NOTE.D5, NOTE.C5, NOTE.B4, NOTE.A4]
  ];

  // Bas: ósemki na parzystych szesnastkach, wzór "R,-,5,R,O,5,R,5" —
  // charakterystyczny "galop" trzymający napęd bez grania na każdej nucie.
  const BASS_SLOTS = ['R', null, '5', 'R', 'O', '5', 'R', '5'];

  function bassNoteAt(bar, step) {
    if (step % 2 !== 0) return null;
    const slot = BASS_SLOTS[step / 2];
    if (!slot) return null;
    const chord = CHORDS[bar];
    if (slot === 'R') return chord.root;
    if (slot === '5') return chord.root + 7;
    return chord.root + 12; // 'O' — oktawa
  }

  // Arpeggio: root-third-fifth-third w kółko, oktawę nad basem — sztuczka
  // udająca akord na pojedynczym kanale, tak jak w prawdziwych modułach.
  function arpNoteAt(bar, step) {
    const chord = CHORDS[bar];
    const cycle = [0, chord.third, 7, chord.third];
    return chord.root + 12 + cycle[step % 4];
  }

  function isKickStep(bar, step) { return step === 0 || step === 8 || (bar === 3 && step === 10); }
  function isSnareStep(step) { return step === 4 || step === 12; }
  function isHatStep(bar, step) {
    if (step % 2 === 0) return true;
    return bar === 3 && step >= 12; // wypełnienie w ostatnim takcie przed pętlą
  }

  let muted = false;
  let unlocked = false;
  let timerId = null;
  let nextNoteTime = 0;
  let currentStep = 0;
  let noiseBuf = null;

  function noiseBuffer(ac) {
    if (!noiseBuf) {
      const len = ac.sampleRate; // 1 sekunda białego szumu, wystarczy na krótkie uderzenia
      noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  function playTone(freq, t, dur, type, peak) {
    if (muted) return;
    const ac = global.Sfx.context();
    if (!ac) return;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function playKick(t) {
    if (muted) return;
    const ac = global.Sfx.context();
    if (!ac) return;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.09);
    amp.gain.setValueAtTime(0.32, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    osc.connect(amp).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  function playNoise(t, dur, filterType, freq, q, peak) {
    if (muted) return;
    const ac = global.Sfx.context();
    if (!ac) return;
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac);
    const filt = ac.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.value = freq;
    if (q) filt.Q.value = q;
    const amp = ac.createGain();
    amp.gain.setValueAtTime(peak, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(amp).connect(ac.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  const playLead = (freq, t) => playTone(freq, t, 0.16, 'square', 0.075);
  const playBass = (freq, t) => playTone(freq, t, 0.16, 'triangle', 0.13);
  const playArp = (freq, t) => playTone(freq, t, 0.075, 'square', 0.045);
  const playSnare = (t) => playNoise(t, 0.11, 'bandpass', 1800, 0.9, 0.22);
  const playHat = (t, accent) => playNoise(t, 0.035, 'highpass', 7000, null, accent ? 0.09 : 0.05);

  function scheduleStep(step, t) {
    const bar = Math.floor(step / BAR_STEPS);
    const local = step % BAR_STEPS;

    const lead = LEAD_BARS[bar][local];
    if (lead != null) playLead(midiToFreq(lead), t);

    const bass = bassNoteAt(bar, local);
    if (bass != null) playBass(midiToFreq(bass), t);

    playArp(midiToFreq(arpNoteAt(bar, local)), t);

    if (isKickStep(bar, local)) playKick(t);
    if (isSnareStep(local)) playSnare(t);
    if (isHatStep(bar, local)) playHat(t, local % 8 === 0);
  }

  function tick() {
    const ac = global.Sfx.context();
    if (!ac) return;
    while (nextNoteTime < ac.currentTime + SCHEDULE_AHEAD) {
      scheduleStep(currentStep, nextNoteTime);
      nextNoteTime += STEP_DUR;
      currentStep = (currentStep + 1) % PATTERN_STEPS;
    }
  }

  function startScheduler() {
    if (timerId) return;
    const ac = global.Sfx.context();
    if (!ac) return;
    nextNoteTime = ac.currentTime + 0.05;
    timerId = setInterval(tick, LOOKAHEAD_MS);
  }

  function stopScheduler() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  // W ukrytej karcie nie ma sensu dalej odpytywać zegara — i tak nikt nie
  // usłyszy. Po powrocie sekwencer wznawia się od bieżącego miejsca w pętli.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopScheduler();
    else if (unlocked) startScheduler();
  });

  global.Music = {
    setMuted(v) { muted = !!v; },
    isMuted() { return muted; },
    unlock() {
      if (!global.Sfx || !global.Sfx.context()) return;
      unlocked = true;
      if (!document.hidden) startScheduler();
    }
  };
})(window);
