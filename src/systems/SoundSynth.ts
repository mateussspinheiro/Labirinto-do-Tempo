// =============================================================
// SoundSynth.ts — gera os sons do jogo pelo código, usando a
// Web Audio API (sem precisar de arquivos de áudio).
//
// COMO FUNCIONA
// Um som digital é uma lista de números (amostras) entre -1 e 1.
// Tocando 44.100 amostras por segundo, ouvimos o som. Aqui:
//   1. cada som é descrito como uma sequência de NOTAS
//      (frequência em Hz + duração em segundos);
//   2. para cada nota, calculamos as amostras de uma ONDA
//      (senoidal, quadrada ou triangular) — é o "timbre";
//   3. aplicamos um ENVELOPE (o volume sobe rápido no início e cai
//      no fim) para a nota não "estalar";
//   4. guardamos tudo em um AudioBuffer (objeto da Web Audio API) e
//      registramos no cache de áudio do Phaser com a chave do som.
// Depois disso o Phaser toca o som gerado como se fosse um arquivo.
//
// TROCAR POR ARQUIVOS DE ÁUDIO
// Coloque os arquivos em public/assets/audio e carregue-os na
// PreloadScene com a MESMA chave (ex.: SOUNDS.CRYSTAL). Esta classe
// só gera os sons cujas chaves ainda não estiverem no cache.
// =============================================================
import Phaser from 'phaser';
import { SOUNDS } from '../config/constants';

/** Formato da onda: muda o "timbre" do som. */
type Wave = 'sine' | 'square' | 'triangle';

/** Uma nota: frequência (Hz) e duração (s). Frequência 0 = silêncio (pausa). */
type Note = [frequency: number, duration: number];

/** Uma "voz" (instrumento): sequência de notas tocadas com uma onda e um volume. */
interface Voice {
  wave: Wave;
  volume: number; // 0 a 1
  notes: Note[];
}

/** Frequências (Hz) das notas musicais usadas. O número é a oitava. */
const N = {
  G2: 98.0,
  A2: 110.0,
  C3: 130.81,
  F2: 87.31,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
  E6: 1318.5,
};

/** Taxa de amostragem: quantas amostras por segundo. */
const SAMPLE_RATE = 44100;

// ---------------- Receitas dos sons ----------------

/** Repete uma lista de notas várias vezes (útil para as músicas). */
function repeat(notes: Note[], times: number): Note[] {
  return Array.from({ length: times }, () => notes).flat();
}

/** Arpejo de um acorde: toca as notas uma por uma, em colcheias. */
function arpeggio(chord: number[], noteDuration: number): Note[] {
  return chord.map((frequency): Note => [frequency, noteDuration]);
}

// Música do menu: calma, 4 acordes (Dó, Lá menor, Fá, Sol) em arpejo.
const MENU_EIGHTH = 0.3; // duração de cada nota do arpejo
const MENU_BAR = MENU_EIGHTH * 8; // um compasso = 8 notas
const MENU_MUSIC: Voice[] = [
  {
    wave: 'triangle',
    volume: 0.22,
    notes: [
      ...arpeggio([N.C4, N.E4, N.G4, N.E4, N.C5, N.G4, N.E4, N.G4], MENU_EIGHTH),
      ...arpeggio([N.A3, N.C4, N.E4, N.C4, N.A4, N.E4, N.C4, N.E4], MENU_EIGHTH),
      ...arpeggio([N.F3, N.A3, N.C4, N.A3, N.F4, N.C4, N.A3, N.C4], MENU_EIGHTH),
      ...arpeggio([N.G3, N.D4, N.G4, N.D4, N.G4, N.D4, N.G3, N.D4], MENU_EIGHTH),
    ],
  },
  // Baixo: uma nota longa por compasso
  {
    wave: 'sine',
    volume: 0.3,
    notes: [
      [N.C3, MENU_BAR],
      [N.A2, MENU_BAR],
      [N.F2, MENU_BAR],
      [N.G2, MENU_BAR],
    ],
  },
];

// Música da partida: mais rápida e com mais tensão (Lá menor, Fá, Dó, Sol).
const GAME_EIGHTH = 0.2;
const GAME_MUSIC: Voice[] = [
  {
    wave: 'square',
    volume: 0.1, // onda quadrada é "forte": volume menor
    notes: [
      ...arpeggio([N.A3, N.C4, N.E4, N.A4, N.E4, N.C4, N.A3, N.E4], GAME_EIGHTH),
      ...arpeggio([N.F3, N.A3, N.C4, N.F4, N.C4, N.A3, N.F3, N.C4], GAME_EIGHTH),
      ...arpeggio([N.C4, N.E4, N.G4, N.C5, N.G4, N.E4, N.C4, N.G4], GAME_EIGHTH),
      ...arpeggio([N.G3, N.D4, N.G4, N.D4, N.G3, N.D4, N.G4, N.D4], GAME_EIGHTH),
    ],
  },
  // Baixo "pulsando": a nota do acorde em todas as colcheias
  {
    wave: 'triangle',
    volume: 0.35,
    notes: [
      ...repeat([[N.A2, GAME_EIGHTH]], 8),
      ...repeat([[N.F2, GAME_EIGHTH]], 8),
      ...repeat([[N.C3, GAME_EIGHTH]], 8),
      ...repeat([[N.G2, GAME_EIGHTH]], 8),
    ],
  },
];

/** Todas as receitas: chave do som → vozes que o compõem. */
const RECIPES: Record<string, Voice[]> = {
  [SOUNDS.MUSIC_MENU]: MENU_MUSIC,
  [SOUNDS.MUSIC_GAME]: GAME_MUSIC,
  // Cristal: duas notas agudas subindo ("plim!")
  [SOUNDS.CRYSTAL]: [
    {
      wave: 'sine',
      volume: 0.5,
      notes: [
        [N.A5, 0.07],
        [N.E6, 0.14],
      ],
    },
  ],
  // Portal liberado: arpejo subindo
  [SOUNDS.PORTAL]: [
    {
      wave: 'triangle',
      volume: 0.5,
      notes: [
        [N.C5, 0.09],
        [N.E5, 0.09],
        [N.G5, 0.09],
        [N.C6, 0.3],
      ],
    },
  ],
  // Dano: notas graves descendo, com onda quadrada ("áspera")
  [SOUNDS.HIT]: [
    {
      wave: 'square',
      volume: 0.3,
      notes: [
        [N.E3, 0.08],
        [N.C3, 0.08],
        [N.A2, 0.16],
      ],
    },
  ],
  // Vitória: pequena fanfarra
  [SOUNDS.VICTORY]: [
    {
      wave: 'square',
      volume: 0.22,
      notes: [
        [N.C5, 0.12],
        [N.E5, 0.12],
        [N.G5, 0.12],
        [N.C6, 0.12],
        [0, 0.06],
        [N.G5, 0.1],
        [N.C6, 0.5],
      ],
    },
  ],
  // Derrota: notas descendo devagar
  [SOUNDS.DEFEAT]: [
    {
      wave: 'triangle',
      volume: 0.45,
      notes: [
        [N.G4, 0.25],
        [N.E4, 0.25],
        [N.C4, 0.25],
        [N.G3, 0.6],
      ],
    },
  ],
  // Clique dos botões: um "tic" curtinho
  [SOUNDS.CLICK]: [{ wave: 'square', volume: 0.15, notes: [[N.A4, 0.035]] }],
};

// ---------------- Geração das amostras ----------------

/** Valor da onda (entre -1 e 1) em um ponto do ciclo (phase: 0 a 1). */
function waveValue(wave: Wave, phase: number): number {
  switch (wave) {
    case 'sine':
      return Math.sin(2 * Math.PI * phase);
    case 'square':
      return phase < 0.5 ? 1 : -1;
    case 'triangle':
      return 4 * Math.abs(phase - 0.5) - 1;
  }
}

/** Duração total de uma voz (soma das durações das notas). */
function voiceDuration(voice: Voice): number {
  return voice.notes.reduce((total, [, duration]) => total + duration, 0);
}

/** Escreve as amostras de uma voz no array "samples" (somando, para misturar vozes). */
function renderVoice(samples: Float32Array, voice: Voice): void {
  const attack = 0.005 * SAMPLE_RATE; // 5 ms para o volume subir
  let start = 0; // posição (em amostras) onde a nota atual começa

  for (const [frequency, duration] of voice.notes) {
    const length = Math.floor(duration * SAMPLE_RATE);

    if (frequency > 0) {
      for (let i = 0; i < length && start + i < samples.length; i++) {
        const phase = ((i * frequency) / SAMPLE_RATE) % 1; // posição dentro do ciclo da onda
        // Envelope: sobe rápido no início e cai até 0 no fim da nota
        const envelope = Math.min(1, i / attack) * (1 - i / length);
        samples[start + i] += waveValue(voice.wave, phase) * envelope * voice.volume;
      }
    }
    start += length;
  }
}

/** Cria um AudioBuffer (Web Audio API) misturando todas as vozes. */
function createBuffer(context: BaseAudioContext, voices: Voice[]): AudioBuffer {
  const duration = Math.max(...voices.map(voiceDuration));
  const buffer = context.createBuffer(1, Math.ceil(duration * SAMPLE_RATE), SAMPLE_RATE); // 1 canal (mono)
  const samples = buffer.getChannelData(0);

  voices.forEach((voice) => renderVoice(samples, voice));

  // Garante que nenhuma amostra passe de -1..1 (evita distorção)
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Phaser.Math.Clamp(samples[i], -1, 1);
  }
  return buffer;
}

export class SoundSynth {
  /**
   * Gera todos os sons que ainda não foram carregados de arquivo
   * e os registra no cache de áudio do Phaser.
   */
  static generateMissingSounds(game: Phaser.Game): void {
    // Só funciona com Web Audio (todos os navegadores modernos usam).
    if (!(game.sound instanceof Phaser.Sound.WebAudioSoundManager)) return;
    const context = game.sound.context;

    for (const [key, voices] of Object.entries(RECIPES)) {
      if (game.cache.audio.exists(key)) continue; // já veio de um arquivo
      game.cache.audio.add(key, createBuffer(context, voices));
    }
  }
}
