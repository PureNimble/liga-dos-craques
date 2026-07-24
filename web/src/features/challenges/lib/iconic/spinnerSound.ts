const SOUNDS = {
  tick: '/sounds/tick-typewriter.wav',
  land: '/sounds/land-slam.ogg',
  achievement: '/sounds/denielcz-achievement-unlocked-463070.mp3',
} as const;

type SoundName = keyof typeof SOUNDS;

let ctx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
const loading = new Map<SoundName, Promise<void>>();

const MUTED_KEY = 'iconic:muted';

let muted: boolean | null = null;

/** Sound preference, persisted to localStorage (falls back to false if unavailable). */
export function isMuted(): boolean {
  if (muted === null) {
    try {
      muted = localStorage.getItem(MUTED_KEY) === '1';
    } catch {
      muted = false;
    }
  }
  return muted;
}

/** Sets and persists the sound preference. */
export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTED_KEY, value ? '1' : '0');
    // eslint-disable-next-line no-empty
  } catch {
  }
}

function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  ctx = new window.AudioContext();
  return ctx;
}

function load(c: AudioContext, name: SoundName): Promise<void> {
  const pending = loading.get(name);
  if (pending) return pending;

  const p = fetch(SOUNDS[name])
    .then((r) => r.arrayBuffer())
    .then((bytes) => c.decodeAudioData(bytes))
    .then((buffer) => {
      buffers.set(name, buffer);
    })
    .catch(() => {
    });

  loading.set(name, p);
  return p;
}

function play(name: SoundName, volume: number): void {
  if (isMuted()) return;
  const c = audioContext();
  if (!c || c.state !== 'running') return;

  const buffer = buffers.get(name);
  if (!buffer) {
    void load(c, name);
    return;
  }

  const source = c.createBufferSource();
  const gain = c.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(c.destination);
  source.start();
}

/** Creates/resumes the audio context and preloads samples; must be called from a user gesture. */
export function primeTickAudio(): void {
  if (isMuted()) return;
  const c = audioContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  void load(c, 'tick');
  void load(c, 'land');
}

/** Short click for each card passing the center. */
export function playTick(): void {
  play('tick', 0.45);
}

/** Impact sound when the reel settles on the drawn goal. */
export function playLand(): void {
  play('land', 0.9);
}

/** Prepares the achievement audio; must be called from within the "Consegui!" click. */
export function primeAchievementAudio(): void {
  if (isMuted()) return;
  const c = audioContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  void load(c, 'achievement');
}

/** Plays the achievement fanfare, awaiting the sample instead of giving up early. */
export async function playAchievement(): Promise<void> {
  if (isMuted()) return;
  const c = audioContext();
  if (!c) return;
  if (c.state === 'suspended') await c.resume();
  await load(c, 'achievement');
  play('achievement', 0.7);
}

let noiseBuffer: AudioBuffer | null = null;

let spinNodes: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

function noise(c: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(c.sampleRate * 1.5);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

/** Plays a continuous filtered-noise whir while the reel spins, fading in pitch/volume over `durationS`. */
export function startSpin(durationS: number): void {
  if (isMuted()) return;
  const c = audioContext();
  if (!c || c.state !== 'running') return;
  stopSpin();

  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.7;

  const gain = c.createGain();
  const now = c.currentTime;
  filter.frequency.setValueAtTime(1500, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + durationS);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.15);
  gain.gain.linearRampToValueAtTime(0.0001, now + durationS);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start();
  src.stop(now + durationS + 0.05);
  spinNodes = { src, gain };
}

/** Cuts the whir with a short fade to avoid an abrupt stop. */
export function stopSpin(): void {
  if (!spinNodes || !ctx) {
    spinNodes = null;
    return;
  }
  const { src, gain } = spinNodes;
  spinNodes = null;
  try {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
    src.stop(now + 0.1);
    // eslint-disable-next-line no-empty
  } catch {
  }
}
