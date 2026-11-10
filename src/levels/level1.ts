// =============================================================
// Fase 1 — labirinto pequeno, bastante tempo e só 1 inimigo.
// # parede · . chão · P jogador · C cristal · X portal · E inimigo
// =============================================================
import type { LevelData } from '../types';

export const level1: LevelData = {
  id: 1,
  nome: 'Primeiros Passos',
  tempoLimite: 90,
  velocidadeObstaculos: 60,
  mapa: [
    '###############',
    '#P....#.......#',
    '#.###.#.#####.#',
    '#.#.....#...#.#',
    '#.#.###.#.#.#.#',
    '#...#C..#.#..C#',
    '###.#####.###.#',
    '#.....#...#...#',
    '#.###.#.###.#.#',
    '#C..#...E...#X#',
    '###############',
  ],
};
