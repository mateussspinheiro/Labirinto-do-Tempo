// =============================================================
// ScoreCalculator.ts — calcula pontos e estrelas da partida.
//
//   pontos = 1000 + (tempo restante × 10) − (danos × 100), mínimo 0
//   estrelas: 3 se sobrou mais de 50% do tempo,
//             2 se sobrou mais de 25%, senão 1.
// Na derrota não há pontos nem estrelas.
// =============================================================
import { SCORE } from '../config/constants';

export interface Score {
  points: number;
  stars: number;
}

export class ScoreCalculator {
  /**
   * @param victory   se o jogador entrou no portal
   * @param timeLeft  segundos restantes no cronômetro
   * @param timeLimit tempo total da fase
   * @param damage    quantas vezes foi atingido
   */
  static calculate(victory: boolean, timeLeft: number, timeLimit: number, damage: number): Score {
    if (!victory) return { points: 0, stars: 0 };

    const points = Math.max(0, SCORE.base + timeLeft * SCORE.perSecondLeft - damage * SCORE.perDamage);

    const ratio = timeLeft / timeLimit; // fração do tempo que sobrou (0 a 1)
    let stars = 1;
    if (ratio > SCORE.threeStarsRatio) stars = 3;
    else if (ratio > SCORE.twoStarsRatio) stars = 2;

    return { points, stars };
  }
}
