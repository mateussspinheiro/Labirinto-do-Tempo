// =============================================================
// MenuScene — menu principal.
//   - à esquerda: ilustração animada (MenuArtScene, em paralelo);
//   - à direita: as 5 opções do jogo;
//   - embaixo: o seletor de dificuldade (Fácil, Médio, Difícil, Expert).
// =============================================================
import Phaser from 'phaser';
import { SCENES, BUTTON, GAME_TITLE, GAME_WIDTH, GLOW, MENU_ART_FRAME, SOUNDS } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { getCurrentDifficulty, setCurrentDifficulty } from '../systems/Difficulty';
import { Button, ButtonGroup } from '../ui/Button';
import { DifficultySelector } from '../ui/DifficultySelector';
import { addTechBackground } from '../ui/TechBackground';
import { addGlow, cssColor, setGradient, theme, titleStyle } from '../ui/Theme';
import { goToScene } from '../ui/Transition';

/** Centro da coluna de botões (à direita da ilustração). */
const BUTTONS_X = 610;
const FIRST_BUTTON_Y = 170;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create(): void {
    // Música do menu (se já estiver tocando, continua de onde estava)
    AudioManager.get().playMusic(SOUNDS.MUSIC_MENU);
    addTechBackground(this);

    // ---- Título ----
    const title = this.add
      .text(GAME_WIDTH / 2, 62, GAME_TITLE.toUpperCase(), titleStyle(38))
      .setOrigin(0.5)
      .setLetterSpacing(4);
    setGradient(title, '#ffffff', cssColor(theme.colors.primary));
    addGlow(title, theme.colors.primary, GLOW.title);
    const line = this.add.graphics();
    line.lineStyle(2, theme.colors.secondary, 1).lineBetween(GAME_WIDTH / 2 - 200, 96, GAME_WIDTH / 2 + 200, 96);
    addGlow(line, theme.colors.secondary, GLOW.soft);

    // ---- Ilustração animada (cena separada, desenhada por cima) ----
    this.scene.launch(SCENES.MENU_ART);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop(SCENES.MENU_ART));

    // ---- Opções: texto do botão e cena que ele abre ----
    const options = [
      { label: 'Jogar', scene: SCENES.LEVEL_MAP },
      { label: 'Como Jogar', scene: SCENES.HOW_TO_PLAY },
      { label: 'Progresso', scene: SCENES.PROGRESS },
      { label: 'Configurações', scene: SCENES.SETTINGS },
      { label: 'Ajuda', scene: SCENES.HELP },
    ];
    const buttons = options.map(
      (option, i) =>
        new Button(
          this,
          BUTTONS_X,
          FIRST_BUTTON_Y + i * BUTTON.spacing,
          option.label,
          () => goToScene(this, option.scene),
          { width: 300 },
        ),
    );

    // ---- Dificuldade (salva assim que muda) ----
    const selectorY = MENU_ART_FRAME.y + MENU_ART_FRAME.height + 60;
    const selector = new DifficultySelector(
      this,
      GAME_WIDTH / 2,
      selectorY,
      GAME_WIDTH - 60,
      getCurrentDifficulty().id,
      (id) => setCurrentDifficulty(id),
    );

    new ButtonGroup(this, [...buttons, selector]);
  }
}
