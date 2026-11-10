// =============================================================
// ProgressScene — mostra o progresso salvo no localStorage:
// fases concluídas, melhores tempos, pontuações e estrelas.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH } from '../config/constants';
import { LEVELS } from '../levels';
import { SaveManager } from '../systems/SaveManager';
import { ButtonGroup } from '../ui/Button';
import { addScreenFrame } from '../ui/ScreenFrame';
import { formatTime, starsText, textStyle, theme } from '../ui/Theme';

/** Posição x de cada coluna da tabela. */
const COLUMNS = [50, 360, 480, 600, 710];
const HEADER_Y = 150;
const ROW_HEIGHT = 56;

export class ProgressScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PROGRESS);
  }

  create(): void {
    const backButton = addScreenFrame(this, 'Progresso');

    // ---- Cabeçalho da tabela ----
    this.add.text(GAME_WIDTH / 2, 108, 'Seus melhores resultados em cada fase', textStyle(16, theme.text.muted)).setOrigin(0.5);
    const headers = ['Fase', 'Situação', 'Tempo', 'Pontos', 'Estrelas'];
    headers.forEach((header, i) => {
      this.add.text(COLUMNS[i], HEADER_Y, header, textStyle(18, theme.text.muted, true)).setOrigin(i === 0 ? 0 : 0.5, 0.5);
    });
    this.add.rectangle(GAME_WIDTH / 2, HEADER_Y + 22, GAME_WIDTH - 80, 2, theme.colors.buttonBorder);

    // ---- Uma linha por fase ----
    let totalScore = 0;
    let completedCount = 0;

    LEVELS.forEach((level, i) => {
      const y = HEADER_Y + 60 + i * ROW_HEIGHT;
      const progress = SaveManager.getLevelProgress(level.id);
      const unlocked = SaveManager.isLevelUnlocked(level.id);

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
        this.add.text(COLUMNS[c], y, cell, textStyle(c === 0 ? 16 : 18, c === 1 ? color : theme.text.normal)).setOrigin(c === 0 ? 0 : 0.5, 0.5);
      });
    });

    // ---- Resumo ----
    const summaryY = HEADER_Y + 60 + LEVELS.length * ROW_HEIGHT + 20;
    this.add
      .text(GAME_WIDTH / 2, summaryY, `Fases concluídas: ${completedCount}/${LEVELS.length}   ·   Pontuação total: ${totalScore}`, textStyle(20, theme.text.title, true))
      .setOrigin(0.5);

    new ButtonGroup(this, [backButton]);
  }
}
