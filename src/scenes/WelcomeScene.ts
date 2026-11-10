// =============================================================
// WelcomeScene — tela de boas-vindas.
// Pede um clique ou Enter: os navegadores só liberam o áudio
// depois da primeira interação do usuário.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_TITLE, GAME_WIDTH, GAME_HEIGHT, TEXT_COLORS } from '../config/constants';
import { textStyle } from '../ui/Theme';

export class WelcomeScene extends Phaser.Scene {
  constructor() {
    super(SCENES.WELCOME);
  }

  create(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, GAME_TITLE, textStyle(52, TEXT_COLORS.title, true)).setOrigin(0.5);

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Clique ou pressione Enter para começar', textStyle(22))
      .setOrigin(0.5);

    // Texto "piscando" para chamar a atenção
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    // Primeira interação: clique em qualquer lugar ou Enter
    this.input.once('pointerdown', () => this.start());
    this.input.keyboard?.once('keydown-ENTER', () => this.start());
  }

  private start(): void {
    this.scene.start(SCENES.MENU);
  }
}
