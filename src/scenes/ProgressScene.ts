// =============================================================
// ProgressScene — mostra o progresso salvo no localStorage:
// fases concluídas, melhores tempos, pontuações e estrelas.
// Cada dificuldade tem o seu próprio progresso: o seletor no topo
// troca qual dificuldade a tabela mostra.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH } from '../config/constants';
import { LEVELS } from '../levels';
import { getCurrentDifficulty } from '../systems/Difficulty';
import { SaveManager } from '../systems/SaveManager';
import type { DifficultyId } from '../types';
import { ButtonGroup } from '../ui/Button';
import { DifficultySelector } from '../ui/DifficultySelector';
import { addPanel } from '../ui/Panel';
import { addScreenFrame } from '../ui/ScreenFrame';
import { formatTime, starsText, textStyle, theme, titleStyle } from '../ui/Theme';

/** Posição x de cada coluna da tabela. */
const COLUMNS = [80, 370, 485, 600, 705];
const HEADER_Y = 222;
const ROW_HEIGHT = 50;

export class ProgressScene extends Phaser.Scene {
  /** Textos da tabela (apagados e recriados ao trocar a dificuldade). */
  private table!: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.PROGRESS);
  }

  create(): void {
    const backButton = addScreenFrame(this, 'Progresso');

    const selector = new DifficultySelector(
      this,
      GAME_WIDTH / 2,
      130,
      GAME_WIDTH - 100,
      getCurrentDifficulty().id,
      (id) => this.drawTable(id),
    );

    addPanel(this, GAME_WIDTH / 2, 312, GAME_WIDTH - 60, 250, { corner: 16 });
    this.table = this.add.container(0, 0);
    this.drawTable(getCurrentDifficulty().id);

    new ButtonGroup(this, [selector, backButton], 1);
  }

  /** Monta a tabela de uma dificuldade. */
  private drawTable(difficulty: DifficultyId): void {
    this.table.removeAll(true);
    const add = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      this.table.add(obj);
      return obj;
    };

    // ---- Cabeçalho ----
    const headers = ['FASE', 'SITUAÇÃO', 'TEMPO', 'PONTOS', 'ESTRELAS'];
    headers.forEach((header, i) => {
      add(this.add.text(COLUMNS[i], HEADER_Y, header, titleStyle(12, theme.text.muted)))
        .setOrigin(i === 0 ? 0 : 0.5, 0.5)
        .setLetterSpacing(2);
    });
    add(this.add.rectangle(GAME_WIDTH / 2, HEADER_Y + 18, GAME_WIDTH - 110, 1, theme.colors.primary, 0.6));

    // ---- Uma linha por fase ----
    let totalScore = 0;
    let completedCount = 0;

    LEVELS.forEach((level, i) => {
      const y = HEADER_Y + 50 + i * ROW_HEIGHT;
      const progress = SaveManager.getLevelProgress(difficulty, level.id);
      const unlocked = SaveManager.isLevelUnlocked(difficulty, level.id);

      let status = 'Bloqueada';
      let color: string = theme.text.disabled;
      if (progress?.completed) {
        status = 'Concluída';
        color = theme.text.success;
        totalScore += progress.bestScore;
        completedCount++;
      } else if (unlocked) {
        status = 'Liberada';
        color = theme.text.normal;
      }

      const cells = [
        `${level.id}. ${level.nome}`,
        status,
        progress ? formatTime(progress.bestTime) : '--:--',
        progress ? String(progress.bestScore) : '-',
        starsText(progress?.bestStars ?? 0),
      ];
      cells.forEach((cell, c) => {
        const style =
          c === 0 || c === 1 ? textStyle(16, c === 1 ? color : theme.text.normal) : titleStyle(15, theme.text.normal);
        add(this.add.text(COLUMNS[c], y, cell, style)).setOrigin(c === 0 ? 0 : 0.5, 0.5);
      });
    });

    // ---- Resumo ----
    add(
      this.add.text(
        GAME_WIDTH / 2,
        HEADER_Y + 50 + LEVELS.length * ROW_HEIGHT + 10,
        `FASES CONCLUÍDAS ${completedCount}/${LEVELS.length}   ·   PONTUAÇÃO TOTAL ${totalScore}`,
        titleStyle(14, theme.text.title),
      ),
    )
      .setOrigin(0.5)
      .setLetterSpacing(1);
  }
}
