// =============================================================
// ResultScene — tela de resultado (vitória ou derrota).
// Recebe os dados da partida da GameScene:
//   this.scene.start(SCENES.RESULT, resultado)
// Mostra tempo, pontos e estrelas, e os botões
// "Próxima fase", "Jogar de novo" e "Menu".
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, BUTTON, EFFECT_COLORS } from '../config/constants';
import { getLevel } from '../levels';
import { SaveManager } from '../systems/SaveManager';
import type { LevelResult } from '../types';
import { Button, ButtonGroup } from '../ui/Button';
import { formatTime, textStyle, theme } from '../ui/Theme';
import { goToScene } from '../ui/Transition';

const MAX_STARS = 3;

export class ResultScene extends Phaser.Scene {
  private result!: LevelResult;

  constructor() {
    super(SCENES.RESULT);
  }

  init(result: LevelResult): void {
    this.result = result;
  }

  create(): void {
    const r = this.result;
    const centerX = GAME_WIDTH / 2;

    // ---- Título ----
    const title = r.victory ? 'Vitória!' : 'Derrota';
    const titleColor = r.victory ? theme.text.success : theme.text.danger;
    this.add.text(centerX, 60, title, textStyle(52, titleColor, true)).setOrigin(0.5);
    const subtitle = r.victory ? `Você concluiu a fase ${r.levelId}!` : 'O tempo acabou. Tente de novo!';
    this.add.text(centerX, 112, subtitle, textStyle(22, theme.text.muted)).setOrigin(0.5);

    // ---- Estrelas (desenhadas pelo código) ----
    this.drawStars(centerX, 175, r.stars);

    // ---- Números da partida ----
    const lines = [
      `Tempo usado: ${formatTime(r.timeUsed)}`,
      `Tempo restante: ${formatTime(r.timeLeft)}`,
      `Danos sofridos: ${r.damage}`,
      `Pontuação: ${r.points}`,
    ];
    this.add.text(centerX, 290, lines.join('\n'), { ...textStyle(22), align: 'center', lineSpacing: 8 }).setOrigin(0.5);

    // ---- Recorde ----
    if (r.newRecord) {
      const record = this.add.text(centerX + 190, 175, 'Novo recorde!', textStyle(22, theme.text.title, true)).setOrigin(0.5).setAngle(-8);
      this.tweens.add({ targets: record, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    }

    // ---- Botões ----
    const nextLevel = getLevel(r.levelId + 1);
    const buttonsY = 420;

    const nextButton = new Button(this, centerX, buttonsY, 'Próxima fase', () =>
      goToScene(this, SCENES.GAME, { levelId: nextLevel!.id }),
    );
    // Só dá para avançar se existe uma próxima fase e ela está liberada
    nextButton.setEnabled(nextLevel !== undefined && SaveManager.isLevelUnlocked(nextLevel.id));

    const retryButton = new Button(this, centerX, buttonsY + BUTTON.spacing, 'Jogar de novo', () =>
      goToScene(this, SCENES.GAME, { levelId: r.levelId }),
    );
    const menuButton = new Button(this, centerX, buttonsY + BUTTON.spacing * 2, 'Menu', () => goToScene(this, SCENES.MENU));

    // Na derrota, o foco começa em "Jogar de novo"
    new ButtonGroup(this, [nextButton, retryButton, menuButton], nextButton.isEnabled() ? 0 : 1);
  }

  /** Desenha 3 estrelas: as conquistadas em amarelo, as outras apagadas. */
  private drawStars(centerX: number, y: number, earned: number): void {
    const spacing = 70;
    for (let i = 0; i < MAX_STARS; i++) {
      const x = centerX + (i - 1) * spacing;
      const filled = i < earned;
      const star = this.add.star(x, y, 5, 13, 30, filled ? EFFECT_COLORS.star : EFFECT_COLORS.starEmpty);

      // As estrelas conquistadas "surgem" uma depois da outra
      if (filled) {
        star.setScale(0);
        this.tweens.add({ targets: star, scale: 1, delay: 200 + i * 250, duration: 300, ease: 'Back.easeOut' });
      }
    }
  }
}
