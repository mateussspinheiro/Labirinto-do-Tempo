// =============================================================
// Obstacle.ts — inimigo que patrulha entre dois pontos (A ↔ B).
// Anda em linha reta até o ponto alvo; ao chegar, troca o alvo.
// Ao tocar no jogador, tira tempo (a regra fica na GameScene).
// =============================================================
import Phaser from 'phaser';
import { OBSTACLE, TEXTURES } from '../config/constants';
import type { PatrolPath, Point } from '../types';

/** Distância (px) em que consideramos que o inimigo chegou ao ponto. */
const ARRIVE_DISTANCE = 2;

export class Obstacle extends Phaser.Physics.Arcade.Sprite {
  private path: PatrolPath;
  private target: Point;
  private speed: number;

  constructor(scene: Phaser.Scene, path: PatrolPath, speed: number) {
    super(scene, path.a.x, path.a.y, TEXTURES.ENEMY);
    this.path = path;
    this.target = path.b;
    this.speed = speed;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setSize(OBSTACLE.bodySize, OBSTACLE.bodySize);
    this.setImmovable(true); // o jogador não consegue empurrá-lo

    this.moveToTarget();
  }

  /** O Phaser chama preUpdate a cada quadro para objetos com física. */
  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    // Quanto o inimigo anda neste quadro (delta = ms desde o último quadro).
    // Se o alvo está mais perto que isso, ele chegaria/passaria do ponto.
    const step = (this.speed * delta) / 1000;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

    // Chegou ao alvo? Encaixa no ponto e vira para o outro lado.
    if (distance <= Math.max(ARRIVE_DISTANCE, step)) {
      this.body!.reset(this.target.x, this.target.y);
      this.target = this.target === this.path.a ? this.path.b : this.path.a;
      this.moveToTarget();
    }
  }

  /** Define a velocidade na direção do alvo atual. */
  private moveToTarget(): void {
    this.scene.physics.moveTo(this, this.target.x, this.target.y, this.speed);
    // Espelha o desenho conforme a direção horizontal
    this.setFlipX(this.target.x < this.x);
  }
}
