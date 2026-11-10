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

/** Caminho de patrulha de um inimigo: ele vai e volta entre "a" e "b". */
export interface PatrolPath {
  a: Point;
  b: Point;
}

/** Configurações do jogador (salvas no localStorage). Volumes vão de 0 a 1. */
export interface Settings {
  volumeGeral: number;
  volumeMusica: number;
  volumeEfeitos: number;
  mudo: boolean;
  /** Acessibilidade: cores de alto contraste. */
  altoContraste: boolean;
  /** Acessibilidade: textos 20% maiores. */
  textoGrande: boolean;
}

/** Resultado de uma partida, enviado para a ResultScene. */
export interface LevelResult {
  levelId: number;
  victory: boolean;
  /** Segundos que sobraram no cronômetro. */
  timeLeft: number;
  /** Segundos que o jogador levou (tempoLimite - timeLeft). */
  timeUsed: number;
  /** Quantas vezes o jogador foi atingido. */
  damage: number;
  points: number;
  /** 0 a 3 (derrota = 0). */
  stars: number;
  /** true se bateu a melhor pontuação salva desta fase. */
  newRecord: boolean;
}

/** Progresso salvo de uma fase. */
export interface LevelProgress {
  completed: boolean;
  /** Menor tempo (em segundos) para concluir a fase. */
  bestTime: number;
  bestScore: number;
  bestStars: number;
}

/** Tudo o que é salvo sobre o progresso: uma entrada por fase (chave = id). */
export interface SaveData {
  levels: Record<number, LevelProgress>;
  /** Se a dica inicial da fase 1 já foi mostrada. */
  tipShown?: boolean;
}
