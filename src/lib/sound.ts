/** Synthesised sounds; no audio files. Everything is short and quiet by default. */
type Cue = 'stamp' | 'tick' | 'sold' | 'pass' | 'whistle' | 'goal' | 'click';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(ac: AudioContext, seconds: number): AudioBuffer {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function tone(ac: AudioContext, freq: number, start: number, dur: number, gain: number, type: OscillatorType = 'sine', endFreq?: number) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(ac.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function burst(ac: AudioContext, start: number, dur: number, gain: number, freq: number, q = 0.8) {
  const src = ac.createBufferSource();
  src.buffer = noise(ac, dur);
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(start);
}

export function play(cue: Cue) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  switch (cue) {
    case 'click':
      burst(ac, t, 0.04, 0.15, 2400, 2);
      break;
    case 'stamp':
      // A wood block meeting paper: a low knock and a dry slap.
      tone(ac, 130, t, 0.16, 0.5, 'sine', 55);
      burst(ac, t, 0.07, 0.35, 1400, 0.9);
      break;
    case 'pass':
      tone(ac, 330, t, 0.12, 0.12, 'triangle', 220);
      break;
    case 'tick':
      tone(ac, 1700, t, 0.035, 0.08, 'square');
      break;
    case 'sold':
      tone(ac, 90, t, 0.28, 0.7, 'sine', 40);
      burst(ac, t, 0.12, 0.5, 900, 0.7);
      tone(ac, 880, t + 0.06, 0.9, 0.12, 'sine');
      tone(ac, 1320, t + 0.06, 0.7, 0.06, 'sine');
      break;
    case 'whistle':
      tone(ac, 2600, t, 0.5, 0.12, 'sine', 2450);
      tone(ac, 2620, t + 0.55, 0.7, 0.12, 'sine', 2480);
      break;
    case 'goal':
      burst(ac, t, 1.6, 0.35, 700, 0.4);
      burst(ac, t + 0.1, 1.4, 0.2, 1800, 0.5);
      break;
  }
}
