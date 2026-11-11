// =============================================================
// ResultScene — tela de resultado (vitória ou derrota).
// Recebe os dados da partida da GameScene:
//   this.scene.start(SCENES.RESULT, resultado)
// Mostra estrelas, tempo, danos e pontos (com o multiplicador da
// dificuldade), e os botões "Próxima fase", "Jogar de novo",
// "Mapa de fases" e "Menu".
// =============================================================
import Phaser from 'phaser';
import { SCENES, EFFECT_COLORS, GAME_WIDTH, GLOW } from '../config/constants';
import { getLevel } from '../levels';
import { getDifficulty } from '../systems/Difficulty';
import { SaveManager } from '../systems/SaveManager';
import type { LevelResult } from '../types';
import { Button, ButtonGroup } from '../ui/Button';
import { addPanel } from '../ui/Panel';
import { addTechBackground } from '../ui/TechBackground';
import { addGlow, cssColor, formatTime, textStyle, theme, titleStyle } from '../ui/Theme';
import { goToScene } from '../ui/Transition';
import type { GameSceneData } from './GameScene';

const MAX_STARS = 3;
const PANEL_Y = 262;
const BUTTON_WIDTH = 260;

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
    const level = getLevel(r.levelId)!;
    const difficulty = getDifficulty(r.difficultyId);
    addTechBackground(this);

    // ---- Título ----
    const color = r.victory ? 0x5dffa0 : theme.colors.danger;
    const title = this.add
      .text(centerX, 52, r.victory ? 'VITÓRIA!' : 'DERROTA', titleStyle(50, cssColor(color)))
      .setOrigin(0.5)
      .setLetterSpacing(6);
    addGlow(title, color, GLOW.title);
    this.add
      .text(centerX, 98, `Fase ${level.id} · ${level.nome} · ${difficulty.nome}`, textStyle(17, theme.text.muted))
      .setOrigin(0.5);

    // ---- Painel com estrelas e números ----
    addPanel(this, centerX, PANEL_Y, 560, 230);
    this.drawStars(centerX, PANEL_Y - 68, r.stars);
    if (!r.victory) {
      this.add
        .text(centerX, PANEL_Y - 22, 'O tempo acabou. Tente de novo!', textStyle(16, theme.text.muted))
        .setOrigin(0.5);
    }

    // Quatro números em grade 2 × 2: rótulo pequeno + valor grande
    const stats = [
      { label: 'TEMPO USADO', value: formatTime(r.timeUsed) },
      { label: 'TEMPO RESTANTE', value: formatTime(r.timeLeft) },
      { label: 'DANOS SOFRIDOS', value: String(r.damage) },
      { label: `PONTOS (×${difficulty.pontos})`, value: String(r.points) },
    ];
    stats.forEach((stat, i) => {
      const x = centerX + (i % 2 === 0 ? -130 : 130);
      const y = PANEL_Y + 8 + Math.floor(i / 2) * 58;
      this.add.text(x, y, stat.label, titleStyle(11, theme.text.muted)).setOrigin(0.5).setLetterSpacing(2);
      this.add.text(x, y + 22, stat.value, titleStyle(24, theme.text.normal)).setOrigin(0.5);
    });

    // ---- Recorde ----
    if (r.newRecord) {
      const record = this.add
        .text(centerX + 210, PANEL_Y - 98, 'NOVO RECORDE!', titleStyle(14, theme.text.highlight))
        .setOrigin(0.5)
        .setAngle(-8);
      // (sem brilho: o filtro distorce texto girado)
      this.tweens.add({ targets: record, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    }

    // ---- Botões (grade 2 × 2) ----
    const nextLevel = getLevel(r.levelId + 1);
    const leftX = centerX - BUTTON_WIDTH / 2 - 10;
    const rightX = centerX + BUTTON_WIDTH / 2 + 10;
    const options = { width: BUTTON_WIDTH };

    const nextButton = new Button(
      this,
      leftX,
      435,
      'Próxima fase',
      () => goToScene(this, SCENES.GAME, { levelId: nextLevel!.id } satisfies GameSceneData),
      options,
    );
    // Só dá para avançar se existe uma próxima fase e ela está liberada
    nextButton.setEnabled(nextLevel !== undefined && SaveManager.isLevelUnlocked(r.difficultyId, nextLevel.id));

    const retryButton = new Button(
      this,
      rightX,
      435,
      'Jogar de novo',
      () => goToScene(this, SCENES.GAME, { levelId: r.levelId } satisfies GameSceneData),
      options,
    );
    const mapButton = new Button(this, leftX, 497, 'Mapa de fases', () => goToScene(this, SCENES.LEVEL_MAP), options);
    const menuButton = new Button(this, rightX, 497, 'Menu', () => goToScene(this, SCENES.MENU), options);

    // Na derrota (ou na última fase), o foco começa em "Jogar de novo"
    new ButtonGroup(this, [nextButton, retryButton, mapButton, menuButton], nextButton.isEnabled() ? 0 : 1);
  }

  /** Desenha 3 estrelas: as conquistadas em dourado (com brilho), as outras apagadas. */
  private drawStars(centerX: number, y: number, earned: number): void {
    const spacing = 70;
    for (let i = 0; i < MAX_STARS; i++) {
      const x = centerX + (i - 1) * spacing;
      const filled = i < earned;
      const star = this.add.star(x, y, 5, 12, 28, filled ? EFFECT_COLORS.star : EFFECT_COLORS.starEmpty);

      // As estrelas conquistadas "surgem" uma depois da outra
      if (filled) {
        addGlow(star, EFFECT_COLORS.star, GLOW.soft);
        star.setScale(0);
        this.tweens.add({ targets: star, scale: 1, delay: 200 + i * 250, duration: 300, ease: 'Back.easeOut' });
      }
    }
  }
}
