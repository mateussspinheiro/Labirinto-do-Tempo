// =============================================================
// types/index.ts — tipos (formatos de dados) usados no jogo.
// =============================================================

/** Dados de uma fase: o mapa em texto e suas regras. */
export interface LevelData {
  id: number;
  nome: string;
  /** Tempo para terminar a fase, em segundos. */
  tempoLimite: number;
  /** Velocidade dos obstáculos (inimigos), em pixels por segundo. */
  velocidadeObstaculos: number;
  /**
   * Mapa: cada string é uma linha e cada caractere é um tile.
   * # parede · . chão · P jogador · C cristal · X portal · E inimigo
   */
  mapa: string[];
}

/** Um ponto na tela (em pixels). */
export interface Point {
  x: number;
  y: number;
}
