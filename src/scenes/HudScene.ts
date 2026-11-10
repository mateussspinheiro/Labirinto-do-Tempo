// =============================================================
// HudScene — HUD (informações na tela) que roda EM PARALELO à
// GameScene. Ela não tem nenhuma regra de jogo: só escuta os
// eventos emitidos pela GameScene e atualiza os textos.
// Mostra: cristais, estado do portal e tempo restante.
// =============================================================
import Phaser from 'phaser';
import {
  SCENES,
  GAME_EVENTS,
  GAME_WIDTH,
  GAME_HEIGHT,
  HUD,
  HUD_HEIGHT,
  TEXT_COLORS,
  TIME_WARNING_SECONDS,
} from '../config/constants';
import { formatTime, textStyle } from '../ui/Theme';

/** Dados iniciais enviados pela GameScene ao abrir o HUD. */
export interface HudSceneData {
  totalCrystals: number;
  timeLimit: number;
}

export class HudScene extends Phaser.Scene {
  private crystalText!: Phaser.GameObjects.Text;
  private portalText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private totalCrystals = 0;
  private timeLimit = 0;

  constructor() {
    super(SCENES.HUD);
  }

  init(data: HudSceneData): void {
    this.totalCrystals = data.totalCrystals;
    this.timeLimit = data.timeLimit;
  }

  create(): void {
    // Faixa de fundo no topo da tela
    this.add.rectangle(0, 0, GAME_WIDTH, HUD_HEIGHT, HUD.background).setOrigin(0).setStrokeStyle(2, HUD.border);

    const middleY = HUD_HEIGHT / 2;
    this.crystalText = this.add.text(16, middleY, '', textStyle(HUD.fontSize, TEXT_COLORS.normal, true)).setOrigin(0, 0.5);
    this.portalText = this.add.text(190, middleY, '', textStyle(HUD.fontSize, TEXT_COLORS.muted, true)).setOrigin(0, 0.5);
    this.timeText = this.add.text(420, middleY, '', textStyle(HUD.fontSize, TEXT_COLORS.normal, true)).setOrigin(0, 0.5);

    this.updateCrystals(0, this.totalCrystals);
    this.portalText.setText('Portal: bloqueado');
    this.updateTime(this.timeLimit);

    // ---- Escuta os eventos da GameScene ----
    const events = this.game.events;
    events.on(GAME_EVENTS.CRYSTAL_COLLECTED, this.updateCrystals, this);
    events.on(GAME_EVENTS.PORTAL_UNLOCKED, this.showPortalUnlocked, this);
    events.on(GAME_EVENTS.TIME_CHANGED, this.updateTime, this);
    events.on(GAME_EVENTS.PLAYER_HIT, this.showHit, this);

    // this.game.events é compartilhado por todas as cenas: ao fechar o HUD
    // precisamos remover os "ouvintes", senão eles se acumulam a cada partida.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      events.off(GAME_EVENTS.CRYSTAL_COLLECTED, this.updateCrystals, this);
      events.off(GAME_EVENTS.PORTAL_UNLOCKED, this.showPortalUnlocked, this);
      events.off(GAME_EVENTS.TIME_CHANGED, this.updateTime, this);
      events.off(GAME_EVENTS.PLAYER_HIT, this.showHit, this);
    });
  }

  private updateCrystals(collected: number, total: number): void {
    this.crystalText.setText(`Cristais: ${collected}/${total}`);
    // Pequeno "pulo" do texto para dar feedback
    this.tweens.add({ targets: this.crystalText, scale: 1.25, duration: 120, yoyo: true });
  }

  /** Atualiza o cronômetro; nos últimos segundos ele fica vermelho. */
  private updateTime(secondsLeft: number): void {
    this.timeText.setText(`Tempo: ${formatTime(secondsLeft)}`);
    this.timeText.setColor(secondsLeft <= TIME_WARNING_SECONDS ? TEXT_COLORS.danger : TEXT_COLORS.normal);
  }

  /** Mostra "-5s" subindo e sumindo ao lado do tempo. */
  private showHit(secondsLost: number): void {
    const label = this.add
      .text(this.timeText.x + this.timeText.width + 12, HUD_HEIGHT / 2, `-${secondsLost}s`, textStyle(HUD.fontSize, TEXT_COLORS.danger, true))
      .setOrigin(0, 0.5);
    this.tweens.add({ targets: label, y: label.y + 30, alpha: 0, duration: 900, onComplete: () => label.destroy() });
  }

  private showPortalUnlocked(): void {
    this.portalText.setText('Portal: liberado').setColor(TEXT_COLORS.portalOpen);

    // Mensagem grande no meio da tela que some sozinha
    const message = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Portal liberado!', textStyle(40, TEXT_COLORS.portalOpen, true))
      .setOrigin(0.5)
      .setStroke('#000000', 6)
      .setScale(0.5);
    this.tweens.add({ targets: message, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: message,
      alpha: 0,
      delay: HUD.messageDuration,
      duration: 400,
      onComplete: () => message.destroy(),
    });
  }
}
