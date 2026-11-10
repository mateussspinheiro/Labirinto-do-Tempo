// =============================================================
// ProgressScene — tela "Progresso" (conteúdo será preenchido nas próximas etapas).
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, TEXT_COLORS } from '../config/constants';
import { ButtonGroup } from '../ui/Button';
import { addScreenFrame } from '../ui/ScreenFrame';
import { textStyle } from '../ui/Theme';

export class ProgressScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PROGRESS);
  }

  create(): void {
    const backButton = addScreenFrame(this, 'Progresso');
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Em construção...', textStyle(22, TEXT_COLORS.muted)).setOrigin(0.5);
    new ButtonGroup(this, [backButton]);
  }
}
