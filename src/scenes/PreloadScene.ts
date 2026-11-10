// =============================================================
// PreloadScene — carrega os assets (imagens e sons) e mostra
// uma barra de carregamento enquanto isso acontece.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, TEXT_COLORS, FONT_FAMILY } from '../config/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    this.createLoadingBar();

    // Aqui entram os this.load.image(...) / this.load.audio(...) do jogo.
  }

  create(): void {
    this.scene.start(SCENES.WELCOME);
  }

  /** Desenha a barra de carregamento e a atualiza com o progresso do loader. */
  private createLoadingBar(): void {
    const barWidth = 400;
    const barHeight = 24;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2;

    this.add
      .text(GAME_WIDTH / 2, y - 40, 'Carregando...', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: TEXT_COLORS.normal,
      })
      .setOrigin(0.5);

    // Moldura da barra
    this.add.rectangle(x, y, barWidth, barHeight).setOrigin(0).setStrokeStyle(2, COLORS.primary);
    // Preenchimento: começa com largura 0 e cresce conforme o progresso (0 a 1)
    const fill = this.add.rectangle(x + 2, y + 2, 0, barHeight - 4, COLORS.primary).setOrigin(0);

    this.load.on('progress', (value: number) => {
      fill.width = (barWidth - 4) * value;
    });
  }
}
