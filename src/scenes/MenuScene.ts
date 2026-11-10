// =============================================================
// MenuScene — menu principal com as 5 opções do jogo.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_TITLE, GAME_WIDTH, BUTTON, SOUNDS } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { Button, ButtonGroup } from '../ui/Button';
import { textStyle, theme } from '../ui/Theme';
import { goToScene } from '../ui/Transition';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create(): void {
    // Música do menu (se já estiver tocando, continua de onde estava)
    AudioManager.get().playMusic(SOUNDS.MUSIC_MENU);

    this.add.text(GAME_WIDTH / 2, 100, GAME_TITLE, textStyle(48, theme.text.title, true)).setOrigin(0.5);

    // Lista de opções: texto do botão e cena que ele abre
    const options = [
      { label: 'Jogar', scene: SCENES.LEVEL_SELECT },
      { label: 'Como Jogar', scene: SCENES.HOW_TO_PLAY },
      { label: 'Progresso', scene: SCENES.PROGRESS },
      { label: 'Configurações', scene: SCENES.SETTINGS },
      { label: 'Ajuda', scene: SCENES.HELP },
    ];

    const firstY = 220;
    const buttons = options.map(
      (option, i) =>
        new Button(this, GAME_WIDTH / 2, firstY + i * BUTTON.spacing, option.label, () =>
          goToScene(this, option.scene),
        ),
    );

    new ButtonGroup(this, buttons);
  }
}
