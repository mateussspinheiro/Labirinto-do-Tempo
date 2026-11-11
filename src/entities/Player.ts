// =============================================================
// Player.ts — o jogador (Rafael, o personagem principal).
// Usa a física arcade: definimos a velocidade e o Phaser move o
// sprite e impede que ele atravesse as paredes (collider na GameScene).
// A animação de andar muda conforme a direção (frente, costas, lado).
// =============================================================
import Phaser from 'phaser';
import { ANIMS, OBSTACLE, PLAYER, TEXTURES, TILE_SIZE } from '../config/constants';
import type { Point } from '../types';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  /** Canto do labirinto na tela, usado para saber onde fica o centro dos corredores. */
  private mazeOffset: Point;
  private invulnerable = false;
  /** Última animação usada: define o quadro "parado" quando o jogador para. */
  private facing: (typeof ANIMS)['PLAYER_DOWN' | 'PLAYER_UP' | 'PLAYER_SIDE'] = ANIMS.PLAYER_DOWN;

  constructor(scene: Phaser.Scene, x: number, y: number, mazeOffset: Point) {
    super(scene, x, y, TEXTURES.PLAYER, ANIMS.PLAYER_DOWN.idle);
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
    const dx =
      Number(this.cursors.right.isDown || this.wasd.right.isDown) -
      Number(this.cursors.left.isDown || this.wasd.left.isDown);
    const dy =
      Number(this.cursors.down.isDown || this.wasd.down.isDown) - Number(this.cursors.up.isDown || this.wasd.up.isDown);

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
    this.updateAnimation(dx, dy);
  }

  /**
   * Escolhe a animação pela direção das teclas:
   * horizontal → de lado (espelhado para a direita), cima → costas, baixo → frente.
   * Sem tecla nenhuma, para a animação no quadro "parado".
   */
  private updateAnimation(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) {
      this.anims.stop();
      this.setFrame(this.facing.idle);
      return;
    }
    if (dx !== 0) {
      this.facing = ANIMS.PLAYER_SIDE;
      this.setFlipX(dx > 0); // o desenho olha para a esquerda; espelha para a direita
    } else {
      this.facing = dy < 0 ? ANIMS.PLAYER_UP : ANIMS.PLAYER_DOWN;
      this.setFlipX(false);
    }
    this.anims.play(this.facing.key, true); // true = não reinicia se já estiver tocando
  }

  /** Se está invencível (logo depois de levar dano). */
  isInvulnerable(): boolean {
    return this.invulnerable;
  }

  /**
   * Jogador foi atingido: pisca e fica invencível por alguns instantes,
   * para não perder tempo várias vezes seguidas pelo mesmo inimigo.
   */
  hurt(): void {
    this.invulnerable = true;
    const blinks = Math.floor(OBSTACLE.invulnerableMs / (OBSTACLE.blinkMs * 2));
    this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      duration: OBSTACLE.blinkMs,
      yoyo: true,
      repeat: blinks - 1,
      onComplete: () => {
        this.setAlpha(1);
        this.invulnerable = false;
      },
    });
  }

  /** Para o jogador (usado ao terminar a fase). Não usamos o nome "stop" porque o Sprite já tem um. */
  halt(): void {
    this.setVelocity(0, 0);
    this.anims.stop();
  }

  /** Velocidade que leva a coordenada até o centro do tile mais próximo. */
  private pullToLane(value: number, offset: number): number {
    const laneCenter = offset + Math.floor((value - offset) / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    // Quanto mais longe do centro, mais forte o puxão (limitado à velocidade normal)
    return Phaser.Math.Clamp((laneCenter - value) * PLAYER.cornerAssist, -PLAYER.speed, PLAYER.speed);
  }
}
