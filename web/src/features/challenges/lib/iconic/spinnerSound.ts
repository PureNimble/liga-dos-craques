/**
 * Sons do spinner. Amostras CC0 (OpenGameArt: Brian MacIntosh, rubberduck) em
 * `public/sounds`. Trocar de som é mudar o caminho aqui.
 */
const SOUNDS = {
  tick: '/sounds/tick-typewriter.wav',
  land: '/sounds/land-slam.ogg',
  achievement: '/sounds/denielcz-achievement-unlocked-463070.mp3',
} as const;

type SoundName = keyof typeof SOUNDS;

/** Contexto de áudio partilhado, criado à primeira utilização. */
let ctx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
const loading = new Map<SoundName, Promise<void>>();

const MUTED_KEY = 'iconic:muted';

/** Em cache: durante uma rodada o tick é chamado dezenas de vezes e não vale a
    pena ir ao localStorage de cada vez. */
let muted: boolean | null = null;

/** Preferência de som (persistida). O localStorage pode estar indisponível
    (modo privado, storage bloqueado), por isso nunca deita a app abaixo. */
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

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTED_KEY, value ? '1' : '0');
  } catch {
    // Sem persistência disponível — a preferência vale só para esta sessão.
  }
}

function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  ctx = new window.AudioContext();
  return ctx;
}

/** Descarrega e descodifica uma amostra (uma vez só). Falhar é aceitável: sem
    som, o spinner funciona na mesma. */
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
      // Formato não suportado ou ficheiro em falta — segue sem este som.
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
    void load(c, name); // ainda a carregar: este toque perde-se, os próximos não
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

/**
 * Cria/retoma o contexto e pré-carrega as amostras. Tem de ser chamado a partir
 * de um gesto do utilizador (o clique em "Rodar") — os browsers bloqueiam áudio
 * iniciado fora de um.
 */
export function primeTickAudio(): void {
  if (isMuted()) return;
  const c = audioContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  void load(c, 'tick');
  void load(c, 'land');
}

/** Clique curto a cada carta que passa pelo centro. */
export function playTick(): void {
  play('tick', 0.45);
}

/** Impacto ao assentar no golo sorteado. */
export function playLand(): void {
  play('land', 0.9);
}

/**
 * Prepara o áudio da conquista. Tem de ser chamado dentro do clique em
 * "Consegui!" — o som só toca depois da resposta do servidor, já fora do gesto.
 */
export function primeAchievementAudio(): void {
  if (isMuted()) return;
  const c = audioContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  void load(c, 'achievement');
}

/**
 * Fanfarra da conquista. Ao contrário do tick, espera pela amostra em vez de
 * desistir: toca uma única vez e não pode falhar por chegar cedo demais.
 */
export async function playAchievement(): Promise<void> {
  if (isMuted()) return;
  const c = audioContext();
  if (!c) return;
  if (c.state === 'suspended') await c.resume();
  await load(c, 'achievement');
  play('achievement', 0.7);
}

/** Ruído branco em cache — base do whir do spin (gerado, sem ficheiro). */
let noiseBuffer: AudioBuffer | null = null;

/** Nós do whir atualmente a tocar, para os podermos parar mais cedo. */
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

/**
 * Whir contínuo enquanto o carrossel roda: ruído filtrado cuja frequência e
 * volume descem ao longo de `durationS`, como uma roda a perder força. Os ticks
 * (cartas a passar) e o land tocam por cima. Silencioso se não houver áudio.
 */
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

/** Corta o whir com um fade curtíssimo (evita o clique de parar a seco). */
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
  } catch {
    // já parado — segue.
  }
}
