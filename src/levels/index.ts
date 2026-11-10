// =============================================================
// levels/index.ts — lista de todas as fases do jogo, em ordem.
// Para criar uma fase nova: crie o arquivo levelN.ts e adicione aqui.
// =============================================================
import type { LevelData } from '../types';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';

export const LEVELS: LevelData[] = [level1, level2, level3];

/** Procura uma fase pelo id (retorna undefined se não existir). */
export function getLevel(id: number): LevelData | undefined {
  return LEVELS.find((level) => level.id === id);
}
