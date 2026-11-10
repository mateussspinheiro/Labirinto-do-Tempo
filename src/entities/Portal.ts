// =============================================================
// Portal.ts — saída da fase. Tem dois estados:
//  - bloqueado: cinza e parado (faltam cristais);
//  - liberado: colorido e pulsando (o jogador pode entrar).
// =============================================================
import Phaser from 'phaser';
import { TEXTURES } from '../config/constants';

export class Portal extends Phaser.Physics.Arcade.Image {
  private unlocked = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURES.PORTAL_LOCKED);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // corpo estático, só para detectar o toque
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  /** Libera o portal: troca a imagem e começa o brilho pulsando. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    this.setTexture(TEXTURES.PORTAL_OPEN);

    // Brilho pulsando: aumenta/diminui o tamanho e a transparência sem parar
    this.scene.tweens.add({
      targets: this,
      scale: 1.2,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Também gira devagar, como um redemoinho
    this.scene.tweens.add({ targets: this, angle: 360, duration: 3000, repeat: -1 });
  }
}
