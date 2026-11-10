// =============================================================
// WelcomeScene — tela de boas-vindas.
// Pede um clique ou Enter: os navegadores só liberam o áudio
// depois da primeira interação do usuário.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, TEXT_COLORS, FONT_FAMILY } from '../config/constants';

export class WelcomeScene extends Phaser.Scene {
  constructor() {
    super(SCENES.WELCOME);
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'Labirinto do Tempo', {
        fontFamily: FONT_FAMILY,
        fontSize: '52px',
        fontStyle: 'bold',
        color: TEXT_COLORS.title,
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Clique ou pressione Enter para começar', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: TEXT_COLORS.normal,
      })
      .setOrigin(0.5);

    // Texto "piscando" para chamar a atenção
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
  }
}
