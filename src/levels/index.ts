// =============================================================
// levels/index.ts — lista de todas as fases do jogo, em ordem.
// Para criar uma fase nova: crie o arquivo levelN.ts e adicione aqui.
// =============================================================
import type { LevelData } from '../types';
import { level1 } from './level1';

export const LEVELS: LevelData[] = [level1];

/** Procura uma fase pelo id (retorna undefined se não existir). */
export function getLevel(id: number): LevelData | undefined {
  return LEVELS.find((level) => level.id === id);
}
