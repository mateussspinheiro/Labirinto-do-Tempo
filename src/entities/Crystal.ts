// =============================================================
// Crystal.ts — cristal coletável. São 3 por fase.
// Fica flutuando levemente; ao ser coletado, cresce, some e é destruído.
// =============================================================
import Phaser from 'phaser';
import { TEXTURES } from '../config/constants';

export class Crystal extends Phaser.Physics.Arcade.Image {
  private collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURES.CRYSTAL);
    scene.add.existing(this);
    // Corpo estático: não se move, só serve para detectar o toque do jogador
    scene.physics.add.existing(this, true);

    // Animação de "flutuar" para chamar a atenção
    scene.tweens.add({ targets: this, y: y - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Coleta o cristal. Retorna false se ele já tinha sido coletado. */
  collect(): boolean {
    if (this.collected) return false;
    this.collected = true;

    // Desliga a colisão na hora, para não contar duas vezes
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;

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
