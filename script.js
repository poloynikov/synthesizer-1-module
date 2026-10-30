const bpm = 122;
const stepLength = 60 / bpm / 4;
const instruments = ["drums", "bass", "chords", "melody"];
const baseVolume = { drums: -6, bass: -9, chords: -12, melody: -11 };

const settings = {
  drums: { volume: 82, frequency: 100, speed: 100, on: true },
  bass: { volume: 80, frequency: 100, speed: 100, on: true },
  chords: { volume: 67, frequency: 100, speed: 100, on: true },
  melody: { volume: 72, frequency: 100, speed: 100, on: true },
};

const fxOn = {
  drums: [false, false],
  bass: [false, false],
  chords: [true, false],
  melody: [false, false],
};

const channels = {};
const parts = {};
const effects = {};
const sounds = {};
let master;
let audioReady = false;
let playing = false;
let loading = false;
let masterVolume = 70;

function paintSlider(slider) {
  const min = Number(slider.min);
  const max = Number(slider.max);
  const percent = ((Number(slider.value) - min) / (max - min)) * 100;
  slider.style.backgroundImage = `linear-gradient(to right, #f0418f ${percent}%, #f59ec9 ${percent}%)`;
}

function setMasterVolume() {
  if (audioReady && playing) {
    master.gain.rampTo(Math.pow(masterVolume / 100, 1.4) * 0.85, 0.06);
  }
}

function setInstrumentVolume(name) {
  if (!audioReady) return;
  const level = Math.max(0.001, settings[name].volume / 100);
  channels[name].volume.rampTo(baseVolume[name] + 20 * Math.log10(level), 0.05);
  channels[name].mute = !settings[name].on;
}

function setEffect(name, number, on) {
  fxOn[name][number] = on;
  if (!audioReady) return;

  if ((name === "chords" || name === "melody") && number === 1) return;

  const amount = {
    drums: [0.34, 0.22],
    bass: [0.45, 0.38],
    chords: [0.35, 0],
    melody: [0.42, 0],
  };
  effects[name][number].wet.rampTo(on ? amount[name][number] : 0, 0.07);
}

document.querySelectorAll(".kiss-slider").forEach(paintSlider);

const masterSlider = document.querySelector("#masterVolume");
masterSlider.addEventListener("input", () => {
  masterVolume = Number(masterSlider.value);
  document.querySelector("#masterValue").textContent = masterVolume + "%";
  paintSlider(masterSlider);
  setMasterVolume();
});

document.querySelectorAll(".instrument-card").forEach((card) => {
  const name = card.dataset.instrument;
  const button = card.querySelector(".instrument-button");

  button.addEventListener("click", () => {
    settings[name].on = !settings[name].on;
    button.classList.toggle("active", settings[name].on);
    button.setAttribute("aria-pressed", String(settings[name].on));
    setInstrumentVolume(name);
  });

  card.querySelectorAll(".fx-button").forEach((fxButton, number) => {
    fxButton.addEventListener("click", () => {
      const on = !fxButton.classList.contains("active");
      fxButton.classList.toggle("active", on);
      fxButton.setAttribute("aria-pressed", String(on));
      setEffect(name, number, on);
    });
  });

  card.querySelectorAll("input[data-param]").forEach((slider) => {
    slider.addEventListener("input", () => {
      const param = slider.dataset.param;
      const value = Number(slider.value);
      settings[name][param] = value;
      card.querySelector(`[data-value="${param}"]`).textContent =
        param === "speed" ? (value / 100).toFixed(2) + "×" : value + "%";
      paintSlider(slider);

      if (param === "volume") setInstrumentVolume(name);
      if (param === "speed" && audioReady)
        parts[name].playbackRate = value / 100;
    });
  });
});

const progression = [
  { root: "B1", chord: ["B3", "D#4", "F#4", "A#4"] },
  { root: "G#1", chord: ["G#3", "B3", "D#4", "F#4"] },
  { root: "E2", chord: ["E3", "G#3", "B3", "D#4"] },
  { root: "F#1", chord: ["F#3", "A#3", "C#4", "E4"] },
];

const melodyBars = [
  [
    [0, "F#5", 2, 0.88],
    [3, "G#5", 1, 0.67],
    [4, "A#5", 1, 0.76],
    [6, "F#5", 2, 0.92],
    [10, "D#5", 1, 0.66],
    [12, "F#5", 2, 0.9],
    [15, "G#5", 1, 0.7],
  ],
  [
    [0, "B5", 2, 0.85],
    [3, "A#5", 1, 0.68],
    [4, "G#5", 2, 0.82],
    [8, "F#5", 2, 0.84],
    [11, "D#5", 1, 0.66],
    [12, "F#5", 2, 0.86],
    [15, "A#5", 1, 0.72],
  ],
  [
    [0, "G#5", 2, 0.88],
    [2, "F#5", 1, 0.71],
    [3, "E5", 1, 0.72],
    [4, "F#5", 2, 0.9],
    [7, "G#5", 1, 0.68],
    [8, "B5", 2, 0.86],
    [12, "G#5", 1, 0.72],
    [14, "F#5", 2, 0.8],
  ],
  [
    [0, "C#6", 2, 0.78],
    [3, "B5", 1, 0.68],
    [4, "A#5", 2, 0.79],
    [8, "F#5", 2, 0.86],
    [10, "A#5", 1, 0.69],
    [11, "G#5", 1, 0.67],
    [12, "F#5", 2, 0.84],
    [15, "D#5", 1, 0.65],
  ],
  [
    [0, "F#5", 2, 0.89],
    [2, "A#5", 1, 0.77],
    [3, "B5", 1, 0.71],
    [4, "A#5", 2, 0.88],
    [8, "F#5", 2, 0.91],
    [11, "D#5", 1, 0.68],
    [12, "F#5", 1, 0.77],
    [13, "G#5", 1, 0.7],
    [14, "A#5", 2, 0.84],
  ],
  [
    [0, "B5", 2, 0.87],
    [4, "G#5", 2, 0.83],
    [7, "F#5", 1, 0.68],
    [8, "G#5", 1, 0.79],
    [9, "A#5", 1, 0.64],
    [10, "B5", 2, 0.86],
    [14, "F#5", 2, 0.8],
  ],
  [
    [0, "G#5", 2, 0.88],
    [3, "F#5", 1, 0.67],
    [4, "E5", 2, 0.84],
    [8, "B5", 2, 0.88],
    [11, "G#5", 1, 0.7],
    [12, "F#5", 1, 0.71],
    [13, "E5", 1, 0.63],
    [14, "F#5", 2, 0.83],
  ],
  [
    [0, "A#5", 2, 0.86],
    [3, "C#6", 1, 0.73],
    [4, "B5", 2, 0.85],
    [8, "A#5", 1, 0.75],
    [9, "G#5", 1, 0.68],
    [10, "F#5", 2, 0.87],
    [12, "D#5", 1, 0.64],
    [13, "F#5", 1, 0.71],
    [14, "G#5", 1, 0.73],
    [15, "A#5", 1, 0.72],
  ],
];

function stepTime(bar, step) {
  return `${bar}:${Math.floor(step / 4)}:${step % 4}`;
}

function frequency(note) {
  return Tone.Frequency(note).toFrequency();
}

function makeDrumNotes() {
  const notes = [];
  for (let bar = 0; bar < 8; bar++) {
    for (const step of [0, 4, 8, 12]) {
      notes.push({
        time: stepTime(bar, step),
        hit: "kick",
        volume: step === 0 ? 0.92 : 0.79,
      });
    }
    if (bar === 3 || bar === 7) {
      notes.push({ time: stepTime(bar, 15), hit: "kick", volume: 0.42 });
    }

    for (const step of [4, 12]) {
      notes.push({ time: stepTime(bar, step), hit: "clap", volume: 0.76 });
    }
    if (bar === 3 || bar === 7) {
      notes.push({ time: stepTime(bar, 14), hit: "clap", volume: 0.34 });
    }

    for (let step = 0; step < 16; step += 2) {
      notes.push({
        time: stepTime(bar, step),
        hit: "hat",
        volume: step % 4 === 2 ? 0.51 : 0.26,
      });
    }
    for (const step of [7, 15]) {
      notes.push({ time: stepTime(bar, step), hit: "hat", volume: 0.24 });
    }
    notes.push({ time: stepTime(bar, 6), hit: "openHat", volume: 0.3 });
  }
  return notes;
}

function makeBassNotes() {
  const notes = [];
  const patterns = [
    [
      [0, 1.8, 1],
      [3, 0.7, 0.7],
      [6, 1.2, 0.79],
      [8, 1.7, 0.96],
      [11, 0.7, 0.67],
      [14, 1, 0.77],
    ],
    [
      [0, 1.7, 1],
      [3, 0.8, 0.67],
      [5, 1, 0.74],
      [8, 1.9, 0.93],
      [12, 0.7, 0.72],
      [14, 1, 0.8],
    ],
    [
      [0, 1.7, 1],
      [2, 0.7, 0.65],
      [6, 1.3, 0.82],
      [8, 1.7, 0.93],
      [11, 0.8, 0.69],
      [14, 1, 0.78],
    ],
    [
      [0, 1.6, 1],
      [3, 0.8, 0.7],
      [6, 1.1, 0.77],
      [8, 1.9, 0.93],
      [12, 0.8, 0.76],
      [15, 0.8, 0.68],
    ],
  ];
  for (let bar = 0; bar < 8; bar++) {
    const root = frequency(progression[bar % 4].root);
    for (const [step, length, volume] of patterns[bar % 4]) {
      const octave = step === 11 || step === 14 || step === 15 ? 2 : 1;
      notes.push({
        time: stepTime(bar, step),
        hz: root * octave,
        duration: length * stepLength,
        volume,
      });
    }
  }
  return notes;
}

function makeChordNotes() {
  const notes = [];
  for (let bar = 0; bar < 8; bar++) {
    const chord = progression[bar % 4].chord.map(frequency);
    for (const step of [2, 6, 10, 14]) {
      notes.push({
        time: stepTime(bar, step),
        chord,
        duration: stepLength * (step === 14 ? 1 : 1.4),
        volume: step === 6 ? 0.72 : 0.62,
        pad: false,
      });
    }
    notes.push({
      time: stepTime(bar, 0),
      chord,
      duration: stepLength * 10,
      volume: 0.3,
      pad: true,
    });
  }
  return notes;
}

function makeMelodyNotes() {
  const notes = [];
  melodyBars.forEach((barNotes, bar) => {
    barNotes.forEach(([step, note, length, volume], index) => {
      notes.push({
        time: stepTime(bar, step),
        hz: frequency(note),
        duration: length * stepLength * 0.8,
        volume,
        sparkle: index === 0 || (bar > 3 && index === 4),
      });
    });
  });
  return notes;
}

function makePart(name, notes, playNote) {
  const part = new Tone.Part((time, note) => {
    if (settings[name].on) playNote(time, note);
  }, notes);
  part.loop = true;
  part.loopEnd = "8m";
  part.playbackRate = settings[name].speed / 100;
  part.start(0);
  parts[name] = part;
}

function createAudio() {
  if (Tone.getContext) Tone.getContext().lookAhead = 0.18;

  const limiter = new Tone.Limiter(-1.5).toDestination();
  master = new Tone.Gain(0).connect(limiter);

  for (const name of instruments) {
    const pan = name === "chords" ? -0.1 : name === "melody" ? 0.1 : 0;
    const volume =
      baseVolume[name] + 20 * Math.log10(settings[name].volume / 100);
    channels[name] = new Tone.Channel({ volume, pan }).connect(master);
    channels[name].mute = !settings[name].on;
  }

  const distortion = new Tone.Distortion(0.25);
  const room = new Tone.FeedbackDelay(0.072, 0.18);
  const drumBus = new Tone.Gain().chain(distortion, room, channels.drums);
  effects.drums = [distortion, room];

  const bassPhaser = new Tone.Phaser({
    frequency: 0.35,
    octaves: 2,
    baseFrequency: 220,
    Q: 2,
    stages: 2,
  });
  const bassVibrato = new Tone.Vibrato({ frequency: 4.5, depth: 0.04 });
  const bassPump = new Tone.Gain(1);
  const bassBus = new Tone.Gain().chain(
    bassPump,
    bassPhaser,
    bassVibrato,
    channels.bass,
  );
  effects.bass = [bassPhaser, bassVibrato];

  const chorus = new Tone.Chorus(2.5, 2.0, 0.32).start();
  const chordFilter = new Tone.Filter(3200, "lowpass");
  const chordPump = new Tone.Gain(1);
  const chordBus = new Tone.Gain().chain(
    chordPump,
    chordFilter,
    chorus,
    channels.chords,
  );
  effects.chords = [chorus];

  const melodyPhaser = new Tone.Phaser({
    frequency: 0.45,
    octaves: 1.5,
    baseFrequency: 750,
    Q: 2,
    stages: 2,
  });
  const melodyDelay = new Tone.FeedbackDelay("8n", 0.18);
  melodyDelay.wet.value = 0.11;
  const melodyBus = new Tone.Gain().chain(
    melodyPhaser,
    melodyDelay,
    channels.melody,
  );
  effects.melody = [melodyPhaser];

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.038,
    octaves: 5,
    envelope: { attack: 0.003, decay: 0.18, sustain: 0, release: 0.09 },
    volume: -1,
  }).connect(drumBus);
  const clapFilter = new Tone.Filter(1900, "highpass").connect(drumBus);
  const clap = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.002, decay: 0.095, sustain: 0, release: 0.03 },
    volume: -11,
  }).connect(clapFilter);
  const hatFilter = new Tone.Filter(6500, "highpass").connect(drumBus);
  const hat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.034, sustain: 0, release: 0.015 },
    volume: -22,
  }).connect(hatFilter);
  const openHat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.115, sustain: 0, release: 0.04 },
    volume: -24,
  }).connect(hatFilter);

  const bass = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { type: "lowpass", Q: 1.8, rolloff: -12 },
    envelope: { attack: 0.006, decay: 0.1, sustain: 0.4, release: 0.09 },
    filterEnvelope: {
      attack: 0.004,
      decay: 0.12,
      sustain: 0.23,
      release: 0.1,
      baseFrequency: 110,
      octaves: 3.7,
    },
    portamento: 0.016,
    volume: -5,
  }).connect(bassBus);
  const sub = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.006, decay: 0.075, sustain: 0.46, release: 0.065 },
    volume: -13,
  }).connect(bassBus);

  const stabs = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.008, decay: 0.1, sustain: 0.19, release: 0.09 },
    volume: -17,
  }).connect(chordBus);
  stabs.maxPolyphony = 8;
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.065, decay: 0.22, sustain: 0.46, release: 0.3 },
    volume: -21,
  }).connect(chordBus);
  pad.maxPolyphony = 5;
  const chordPitch = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.006, decay: 0.1, sustain: 0.05, release: 0.1 },
    volume: -21,
  }).connect(chordBus);

  const lead = new Tone.FMSynth({
    harmonicity: 2.0,
    modulationIndex: 3.6,
    oscillator: { type: "sine" },
    modulation: { type: "sine" },
    envelope: { attack: 0.008, decay: 0.13, sustain: 0.23, release: 0.1 },
    modulationEnvelope: {
      attack: 0.006,
      decay: 0.09,
      sustain: 0.2,
      release: 0.08,
    },
    volume: -7,
  }).connect(melodyBus);
  const shine = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.004, decay: 0.09, sustain: 0.06, release: 0.085 },
    volume: -17,
  }).connect(melodyBus);
  const harmony = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.005, decay: 0.09, sustain: 0.12, release: 0.08 },
    volume: -18,
  }).connect(melodyBus);

  Object.assign(sounds, {
    kick,
    clap,
    hat,
    openHat,
    bass,
    sub,
    stabs,
    pad,
    chordPitch,
    lead,
    shine,
    harmony,
  });

  function pump(time) {
    bassPump.gain.cancelScheduledValues(time);
    bassPump.gain.setValueAtTime(0.66, time);
    bassPump.gain.linearRampToValueAtTime(1, time + 0.14);
    chordPump.gain.cancelScheduledValues(time);
    chordPump.gain.setValueAtTime(0.59, time);
    chordPump.gain.linearRampToValueAtTime(1, time + 0.14);
  }

  makePart("drums", makeDrumNotes(), (time, note) => {
    const factor = settings.drums.frequency / 100;
    if (note.hit === "kick") {
      pump(time);
      kick.triggerAttackRelease(52 * factor, 0.13, time, note.volume);
    } else if (note.hit === "clap") {
      clapFilter.frequency.setValueAtTime(1900 * factor, time);
      clap.triggerAttackRelease(0.09, time, note.volume);
    } else if (note.hit === "hat") {
      hat.triggerAttackRelease(0.034, time, note.volume);
    } else {
      openHat.triggerAttackRelease(0.11, time, note.volume);
    }
  });

  makePart("bass", makeBassNotes(), (time, note) => {
    const factor = settings.bass.frequency / 100;
    const duration = note.duration / (settings.bass.speed / 100);
    bass.triggerAttackRelease(note.hz * factor, duration, time, note.volume);
    sub.triggerAttackRelease(
      note.hz * factor,
      duration * 0.88,
      time,
      note.volume * 0.72,
    );
  });

  makePart("chords", makeChordNotes(), (time, note) => {
    const factor = settings.chords.frequency / 100;
    const duration = note.duration / (settings.chords.speed / 100);
    const frequencies = note.chord.map((hz) => hz * factor);
    if (note.pad) {
      pad.triggerAttackRelease(
        frequencies.slice(1),
        duration,
        time,
        note.volume,
      );
    } else {
      stabs.triggerAttackRelease(
        frequencies.slice(0, 3),
        duration,
        time,
        note.volume,
      );
      if (fxOn.chords[1]) {
        chordPitch.triggerAttackRelease(
          frequencies[3] * 2,
          duration * 0.8,
          time,
          note.volume * 0.45,
        );
      }
    }
  });

  makePart("melody", makeMelodyNotes(), (time, note) => {
    const frequency = (note.hz * settings.melody.frequency) / 100;
    const duration = note.duration / (settings.melody.speed / 100);
    lead.triggerAttackRelease(frequency, duration, time, note.volume);
    if (note.sparkle)
      shine.triggerAttackRelease(
        frequency * 2,
        0.085,
        time,
        note.volume * 0.56,
      );
    if (fxOn.melody[1]) {
      harmony.triggerAttackRelease(
        frequency * 1.4983,
        duration * 0.8,
        time,
        note.volume * 0.44,
      );
    }
  });

  Tone.Transport.bpm.value = bpm;
  Tone.Transport.timeSignature = 4;
  Tone.Transport.swing = 0.055;
  Tone.Transport.swingSubdivision = "16n";
  audioReady = true;

  document.querySelectorAll(".instrument-card").forEach((card) => {
    const name = card.dataset.instrument;
    card.querySelectorAll(".fx-button").forEach((button, index) => {
      setEffect(name, index, button.classList.contains("active"));
    });
  });
}

document.querySelector(".play").addEventListener("click", async () => {
  if (playing || loading) return;
  if (typeof Tone === "undefined") {
    alert("Tone.js не загрузился. Проверь подключение к интернету.");
    return;
  }

  loading = true;
  try {
    await Tone.start();
    if (!audioReady) createAudio();
    Tone.Transport.position = 0;
    playing = true;
    setMasterVolume();
    Tone.Transport.start("+0.15");
  } catch (error) {
    console.error(error);
    playing = false;
    alert("Не получилось включить звук.");
  }
  loading = false;
});

document.querySelector(".stop").addEventListener("click", () => {
  if (audioReady) {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    master.gain.rampTo(0, 0.035);
    sounds.bass.triggerRelease();
    sounds.sub.triggerRelease();
    sounds.stabs.releaseAll();
    sounds.pad.releaseAll();
    sounds.chordPitch.triggerRelease();
    sounds.lead.triggerRelease();
    sounds.shine.triggerRelease();
    sounds.harmony.triggerRelease();
  }
  playing = false;
});
