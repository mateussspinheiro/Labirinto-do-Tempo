// =============================================================
// HowToPlayScene — tela "Como Jogar" (conteúdo será preenchido nas próximas etapas).
// Pode ser aberta pelo menu ou pela pausa (fromPause = true): nesse
// caso o botão de voltar retorna para a pausa, e não para o menu.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, TEXT_COLORS } from '../config/constants';
import { ButtonGroup } from '../ui/Button';
import { addScreenFrame } from '../ui/ScreenFrame';
import { textStyle } from '../ui/Theme';

export interface HowToPlayData {
  fromPause?: boolean;
}

export class HowToPlayScene extends Phaser.Scene {
  private fromPause = false;

  constructor() {
    super(SCENES.HOW_TO_PLAY);
  }

  init(data: HowToPlayData): void {
    this.fromPause = data?.fromPause === true;
  }

  create(): void {
    const backButton = this.fromPause
      ? addScreenFrame(this, 'Como Jogar', { onBack: () => this.backToPause(), backLabel: 'Voltar à pausa', opaque: true })
      : addScreenFrame(this, 'Como Jogar');
    if (this.fromPause) this.scene.bringToTop();

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Em construção...', textStyle(22, TEXT_COLORS.muted)).setOrigin(0.5);
    new ButtonGroup(this, [backButton]);
  }

  /** Fecha esta tela e mostra a pausa de novo. */
  private backToPause(): void {
    this.scene.wake(SCENES.PAUSE);
    this.scene.stop();
  }
}
