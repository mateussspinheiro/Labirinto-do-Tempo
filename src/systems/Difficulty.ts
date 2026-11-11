// =============================================================
// Difficulty.ts — dificuldade escolhida e como ela muda a fase.
//
// A dificuldade NÃO altera os mapas. Ela só multiplica:
//   tempo da fase       × difficulty.tempo
//   velocidade monstros × difficulty.velocidade
//   pontuação final     × difficulty.pontos
// e define quantos segundos o dano tira (difficulty.dano).
// =============================================================
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from '../config/constants';
import type { Difficulty, DifficultyId, LevelData } from '../types';
import { SaveManager } from './SaveManager';

/** Procura a dificuldade pelo id (se não existir, usa a padrão). */
export function getDifficulty(id: DifficultyId): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES.find((d) => d.id === DEFAULT_DIFFICULTY)!;
}

/** Dificuldade escolhida pelo jogador (salva nas configurações). */
export function getCurrentDifficulty(): Difficulty {
  return getDifficulty(SaveManager.loadSettings().dificuldade);
}

export function setCurrentDifficulty(id: DifficultyId): void {
  SaveManager.saveSettings({ dificuldade: id });
}

/** Tempo da fase (em segundos inteiros) nesta dificuldade. */
export function levelTime(level: LevelData, difficulty: Difficulty): number {
  return Math.round(level.tempoLimite * difficulty.tempo);
}

/** Velocidade dos monstros (px/s) nesta dificuldade. */
export function enemySpeed(level: LevelData, difficulty: Difficulty): number {
  return Math.round(level.velocidadeObstaculos * difficulty.velocidade);
}
