import * as Tone from 'tone';

let initialized = false;

// Synths
let droneSynth: Tone.FMSynth;
let fractureSynth: Tone.PolySynth;
let networkSynth: Tone.PolySynth;
let crystalSynth: Tone.PolySynth;
let fluidNoise: Tone.Noise;
let fluidFilter: Tone.Filter;
let transcendenceSynth: Tone.PolySynth;
let hoverSynth: Tone.MembraneSynth;
let clickSynth: Tone.MembraneSynth;

export const initAudio = async () => {
  if (initialized) return;
  await Tone.start();
  
  // Phase 1: Origin Drone (Deep Sub-bass)
  droneSynth = new Tone.FMSynth({
    harmonicity: 0.5,
    modulationIndex: 1.2,
    oscillator: { type: 'sine' },
    envelope: { attack: 2, decay: 1, sustain: 1, release: 3 },
    volume: -20
  }).toDestination();

  // Phase 2: Fracture (Glassy granular sound)
  fractureSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.5 },
    volume: -15
  }).toDestination();

  // Phase 3: Network (Digital Chimes)
  networkSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 1 },
    volume: -22
  }).toDestination();
  
  // Phase 4: Crystal (Pure sine chords)
  crystalSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 1, decay: 0.5, sustain: 1, release: 2 },
    volume: -15
  }).toDestination();

  // Phase 5: Fluid (Noise sweep)
  fluidFilter = new Tone.Filter(400, 'lowpass').toDestination();
  fluidNoise = new Tone.Noise('pink').connect(fluidFilter);
  fluidNoise.volume.value = -30;

  // Phase 6: Transcendence (Majestic pad)
  transcendenceSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 },
    volume: -25
  }).toDestination();

  // UI Sounds
  hoverSynth = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 1,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
    volume: -25
  }).toDestination();

  clickSynth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 2,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.2 },
    volume: -15
  }).toDestination();

  initialized = true;
};

export const playHoverSound = () => {
  if (!initialized) return;
  hoverSynth.triggerAttackRelease("C3", "32n");
};

export const playClickSound = () => {
  if (!initialized) return;
  clickSynth.triggerAttackRelease("G3", "16n");
};

let currentPhase = -1;

export const setPhaseSound = (phase: number) => {
  if (!initialized) return;
  if (phase === currentPhase) return;
  
  const now = Tone.now();

  // Stop previous sounds gracefully
  if (currentPhase === 1 && droneSynth) droneSynth.triggerRelease(now);
  if (currentPhase === 5 && fluidNoise) fluidNoise.stop(now + 1);
  if (currentPhase === 6 && transcendenceSynth) transcendenceSynth.releaseAll(now);

  currentPhase = phase;

  switch (phase) {
    case 1:
      droneSynth.triggerAttack("C2", now);
      break;
    case 2:
      // Glass crackle effect
      fractureSynth.triggerAttackRelease(["C6", "E6", "G6", "C7"], "8n", now);
      setTimeout(() => fractureSynth.triggerAttackRelease(["D6", "F#6", "A6"], "16n"), 150);
      setTimeout(() => fractureSynth.triggerAttackRelease(["E6", "G#6", "B6"], "32n"), 300);
      break;
    case 3:
      // Arpeggiated network chime
      networkSynth.triggerAttackRelease("C5", "16n", now);
      networkSynth.triggerAttackRelease("E5", "16n", now + 0.1);
      networkSynth.triggerAttackRelease("G5", "16n", now + 0.2);
      networkSynth.triggerAttackRelease("C6", "16n", now + 0.3);
      break;
    case 4:
      crystalSynth.triggerAttackRelease(["C5", "G5", "D6"], "2n", now);
      break;
    case 5:
      fluidNoise.start(now);
      fluidNoise.volume.rampTo(-20, 1, now);
      fluidFilter.frequency.rampTo(2000, 2, now);
      break;
    case 6:
      transcendenceSynth.triggerAttackRelease(["C4", "G4", "C5", "E5"], "1m", now);
      break;
  }
};

