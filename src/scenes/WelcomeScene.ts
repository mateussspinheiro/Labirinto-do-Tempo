// =============================================================
// WelcomeScene — tela de boas-vindas.
// Pede um clique ou Enter: os navegadores só liberam o áudio
// depois da primeira interação do usuário.
// =============================================================
import Phaser from 'phaser';
import { SCENES, ANIMS, GAME_TITLE, GAME_WIDTH, GAME_HEIGHT, TEXTURES } from '../config/constants';
import { textStyle, theme } from '../ui/Theme';
import { goToScene } from '../ui/Transition';

export class WelcomeScene extends Phaser.Scene {
  constructor() {
    super(SCENES.WELCOME);
  }

  create(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, GAME_TITLE, textStyle(52, theme.text.title, true)).setOrigin(0.5);

    // Decoração: Lucas andando em direção ao portal, com cristais no caminho
    const y = GAME_HEIGHT / 2 + 10;
    const portal = this.add.image(GAME_WIDTH / 2 + 150, y, TEXTURES.PORTAL_OPEN).setScale(1.5);
    this.tweens.add({ targets: portal, angle: 360, duration: 3000, repeat: -1 });
    [-60, 0, 60].forEach((dx, i) => {
      const crystal = this.add.image(GAME_WIDTH / 2 + dx, y, TEXTURES.CRYSTAL);
      this.tweens.add({ targets: crystal, y: y - 5, duration: 600, delay: i * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    this.add.sprite(GAME_WIDTH / 2 - 150, y, TEXTURES.PLAYER, ANIMS.PLAYER_SIDE.idle).setScale(1.5).setFlipX(true).play(ANIMS.PLAYER_SIDE.key);

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, 'Clique ou pressione Enter para começar', textStyle(22))
      .setOrigin(0.5);

    // Texto "piscando" para chamar a atenção
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    // Primeira interação: clique em qualquer lugar ou Enter
    this.input.once('pointerdown', () => this.start());
    this.input.keyboard?.once('keydown-ENTER', () => this.start());
  }

  private start(): void {
    goToScene(this, SCENES.MENU);
  }
}
