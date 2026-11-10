// =============================================================
// PauseScene — menu de pausa, aberto por cima da partida (ESC ou P).
//
// A GameScene fica PAUSADA (this.scene.pause): o update, a física,
// o cronômetro (this.time) e as animações dela param. Ao continuar,
// ela é retomada (this.scene.resume) exatamente de onde parou.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, BUTTON } from '../config/constants';
import { Button, ButtonGroup } from '../ui/Button';
import { textStyle, theme } from '../ui/Theme';
import type { HowToPlayData } from './HowToPlayScene';

/** Dados recebidos da GameScene. */
export interface PauseSceneData {
  levelId: number;
}

export class PauseScene extends Phaser.Scene {
  private levelId = 1;

  constructor() {
    super(SCENES.PAUSE);
  }

  init(data: PauseSceneData): void {
    this.levelId = data.levelId;
  }

  create(): void {
    // Garante que a pausa é desenhada por cima da partida e do HUD
    this.scene.bringToTop();

    const centerX = GAME_WIDTH / 2;

    // Fundo semitransparente: dá para ver a partida "congelada" atrás
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, theme.colors.background, 0.75).setOrigin(0);
    this.add.rectangle(centerX, GAME_HEIGHT / 2, 360, 400, theme.colors.panel).setStrokeStyle(3, theme.colors.buttonBorder);
    this.add.text(centerX, 150, 'Pausado', textStyle(40, theme.text.title, true)).setOrigin(0.5);

    const firstY = 230;
    const buttons = [
      new Button(this, centerX, firstY, 'Continuar', () => this.resumeGame()),
      new Button(this, centerX, firstY + BUTTON.spacing, 'Reiniciar', () => this.restartLevel()),
      new Button(this, centerX, firstY + BUTTON.spacing * 2, 'Como Jogar', () => this.openHowToPlay()),
      new Button(this, centerX, firstY + BUTTON.spacing * 3, 'Menu', () => this.goToMenu()),
    ];
    new ButtonGroup(this, buttons);

    // ESC ou P também continuam a partida
    this.input.keyboard?.on('keydown-ESC', () => this.resumeGame());
    this.input.keyboard?.on('keydown-P', () => this.resumeGame());
  }

  /** Fecha a pausa e retoma a partida. */
  private resumeGame(): void {
    this.scene.resume(SCENES.GAME);
    this.scene.stop();
  }

  /** Recomeça a mesma fase do zero. */
  private restartLevel(): void {
    // start() fecha esta cena e reinicia a GameScene (que reabre o HUD)
    this.scene.start(SCENES.GAME, { levelId: this.levelId });
  }

  /** Abre "Como Jogar" por cima; ao voltar, a pausa reaparece. */
  private openHowToPlay(): void {
    const data: HowToPlayData = { fromPause: true };
    this.scene.sleep(); // esconde a pausa (sem fechá-la)
    this.scene.launch(SCENES.HOW_TO_PLAY, data);
  }

  private goToMenu(): void {
    this.scene.stop(SCENES.GAME); // fechar a partida também fecha o HUD
    this.scene.start(SCENES.MENU);
  }
}
