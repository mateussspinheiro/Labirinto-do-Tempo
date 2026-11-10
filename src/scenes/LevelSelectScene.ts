// =============================================================
// LevelSelectScene — escolha da fase.
// Cada fase da lista LEVELS vira um botão que inicia a GameScene.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, BUTTON, SOUNDS } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { LEVELS } from '../levels';
import { Button, ButtonGroup } from '../ui/Button';
import { addScreenFrame } from '../ui/ScreenFrame';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.LEVEL_SELECT);
  }

  create(): void {
    AudioManager.get().playMusic(SOUNDS.MUSIC_MENU);
    const backButton = addScreenFrame(this, 'Escolha a fase');

    const firstY = 180;
    const levelButtons = LEVELS.map(
      (level, i) =>
        new Button(this, GAME_WIDTH / 2, firstY + i * BUTTON.spacing * 1.3, `Fase ${level.id}: ${level.nome}`, () =>
          this.scene.start(SCENES.GAME, { levelId: level.id }),
        { width: 400 }),
    );

    new ButtonGroup(this, [...levelButtons, backButton]);
  }
}
