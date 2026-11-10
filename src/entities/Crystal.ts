// =============================================================
// Crystal.ts — cristal coletável. São 3 por fase.
// Fica flutuando levemente; ao ser coletado, solta partículas,
// cresce, some e é destruído.
// =============================================================
import Phaser from 'phaser';
import { EFFECT_COLORS, TEXTURES } from '../config/constants';
import { burstParticles } from '../ui/Effects';

/** Tamanho da área de toque do cristal (menor que a imagem). */
const BODY_SIZE = 20;

export class Crystal extends Phaser.Physics.Arcade.Image {
  private collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURES.CRYSTAL);
    scene.add.existing(this);
    // Corpo estático: não se move, só serve para detectar o toque do jogador
    scene.physics.add.existing(this, true);
    (this.body as Phaser.Physics.Arcade.StaticBody).setSize(BODY_SIZE, BODY_SIZE);

    // Animação de "flutuar" para chamar a atenção
    scene.tweens.add({ targets: this, y: y - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Coleta o cristal. Retorna false se ele já tinha sido coletado. */
  collect(): boolean {
    if (this.collected) return false;
    this.collected = true;

    // Desliga a colisão na hora, para não contar duas vezes
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;

    burstParticles(this.scene, this.x, this.y, EFFECT_COLORS.crystalParticles);

    // Pequena animação: cresce e desaparece; depois remove da cena
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scale: 1.8,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => this.destroy(),
    });
    return true;
  }
}
