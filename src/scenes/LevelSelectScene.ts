// =============================================================
// LevelSelectScene — escolha da fase.
// Cada fase da lista LEVELS vira um botão que inicia a GameScene.
// A fase só fica liberada depois de concluir a anterior
// (informação lida do SaveManager / localStorage).
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, SOUNDS } from '../config/constants';
import { LEVELS } from '../levels';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { Button, ButtonGroup } from '../ui/Button';
import { addScreenFrame } from '../ui/ScreenFrame';
import { formatTime, starsText, textStyle, theme } from '../ui/Theme';

/** Distância vertical entre as fases na lista. */
const ROW_HEIGHT = 110;

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.LEVEL_SELECT);
  }

  create(): void {
    AudioManager.get().playMusic(SOUNDS.MUSIC_MENU);
    const backButton = addScreenFrame(this, 'Escolha a fase');
    const centerX = GAME_WIDTH / 2;

    const levelButtons = LEVELS.map((level, i) => {
      const y = 160 + i * ROW_HEIGHT;
      const unlocked = SaveManager.isLevelUnlocked(level.id);
      const progress = SaveManager.getLevelProgress(level.id);

      const label = unlocked ? `Fase ${level.id}: ${level.nome}` : `Fase ${level.id}: bloqueada`;
      const button = new Button(this, centerX, y, label, () => this.scene.start(SCENES.GAME, { levelId: level.id }), { width: 460 });
      button.setEnabled(unlocked);

      // Linha de informação abaixo do botão
      let info = `Tempo: ${formatTime(level.tempoLimite)}  ·  Ainda não concluída`;
      if (!unlocked) info = `Conclua a fase ${level.id - 1} para liberar`;
      else if (progress) info = `${starsText(progress.bestStars)}  ·  Melhor tempo: ${formatTime(progress.bestTime)}  ·  Recorde: ${progress.bestScore} pts`;
      this.add.text(centerX, y + 40, info, textStyle(16, unlocked ? theme.text.muted : theme.text.disabled)).setOrigin(0.5);

      return button;
    });

    // O foco começa na última fase liberada (a "próxima" a jogar)
    const lastUnlocked = LEVELS.filter((level) => SaveManager.isLevelUnlocked(level.id)).length - 1;
    new ButtonGroup(this, [...levelButtons, backButton], lastUnlocked);
  }
}
