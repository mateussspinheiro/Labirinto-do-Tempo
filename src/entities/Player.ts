// =============================================================
// Player.ts — o jogador (Lucas).
// Usa a física arcade: definimos a velocidade e o Phaser move o
// sprite e impede que ele atravesse as paredes (collider na GameScene).
// =============================================================
import Phaser from 'phaser';
import { PLAYER, TEXTURES, TILE_SIZE } from '../config/constants';
import type { Point } from '../types';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  /** Canto do labirinto na tela, usado para saber onde fica o centro dos corredores. */
  private mazeOffset: Point;

  constructor(scene: Phaser.Scene, x: number, y: number, mazeOffset: Point) {
    super(scene, x, y, TEXTURES.PLAYER);
    this.mazeOffset = mazeOffset;

    // Adiciona à cena (desenho) e à física (corpo de colisão)
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Caixa de colisão menor que o tile e centralizada no sprite
    this.setSize(PLAYER.bodySize, PLAYER.bodySize);

    // Teclas: setas e WASD
    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  }

  /** Chamado a cada quadro pela GameScene: lê o teclado e define a velocidade. */
  updateMovement(): void {
    // -1, 0 ou 1 em cada eixo, conforme as teclas pressionadas
    const dx = Number(this.cursors.right.isDown || this.wasd.right.isDown) - Number(this.cursors.left.isDown || this.wasd.left.isDown);
    const dy = Number(this.cursors.down.isDown || this.wasd.down.isDown) - Number(this.cursors.up.isDown || this.wasd.up.isDown);

    // Vetor normalizado: andar na diagonal não fica mais rápido
    const direction = new Phaser.Math.Vector2(dx, dy).normalize();
    let vx = direction.x * PLAYER.speed;
    let vy = direction.y * PLAYER.speed;

    // "Ajuda nas curvas": andando só na horizontal, o jogador é puxado
    // suavemente para o meio do corredor (e vice-versa). Assim ele não
    // fica preso na quina das paredes ao entrar em um corredor lateral.
    if (dx !== 0 && dy === 0) vy = this.pullToLane(this.y, this.mazeOffset.y);
    if (dy !== 0 && dx === 0) vx = this.pullToLane(this.x, this.mazeOffset.x);

    this.setVelocity(vx, vy);
  }

  /** Para o jogador (usado ao terminar a fase). Não usamos o nome "stop" porque o Sprite já tem um. */
  halt(): void {
    this.setVelocity(0, 0);
  }

  /** Velocidade que leva a coordenada até o centro do tile mais próximo. */
  private pullToLane(value: number, offset: number): number {
    const laneCenter = offset + Math.floor((value - offset) / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    // Quanto mais longe do centro, mais forte o puxão (limitado à velocidade normal)
    return Phaser.Math.Clamp((laneCenter - value) * PLAYER.cornerAssist, -PLAYER.speed, PLAYER.speed);
  }
}
