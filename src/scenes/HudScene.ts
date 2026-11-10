// =============================================================
// HudScene — HUD (informações na tela) que roda EM PARALELO à
// GameScene. Ela não tem nenhuma regra de jogo: só escuta os
// eventos emitidos pela GameScene e atualiza os textos.
// Mostra: cristais, estado do portal, tempo restante e o volume.
// =============================================================
import Phaser from 'phaser';
import {
  SCENES,
  AUDIO_EVENTS,
  COLORS,
  GAME_EVENTS,
  GAME_WIDTH,
  GAME_HEIGHT,
  HUD,
  HUD_HEIGHT,
  TEXT_COLORS,
  TIME_WARNING_SECONDS,
} from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { Settings } from '../types';
import { formatTime, textStyle } from '../ui/Theme';

/** Posição do indicador de volume (canto direito do HUD). */
const VOLUME_X = 680;

/** Dados iniciais enviados pela GameScene ao abrir o HUD. */
export interface HudSceneData {
  totalCrystals: number;
  timeLimit: number;
}

export class HudScene extends Phaser.Scene {
  private crystalText!: Phaser.GameObjects.Text;
  private portalText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private volumeIcon!: Phaser.GameObjects.Graphics;
  private volumeText!: Phaser.GameObjects.Text;
  private volumeGroup!: Phaser.GameObjects.Container;
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

    // Indicador de volume: ícone + porcentagem, dentro de um container
    // (assim conseguimos "pulsar" os dois juntos quando o volume muda)
    this.volumeIcon = this.add.graphics();
    this.volumeText = this.add.text(18, 0, '', textStyle(HUD.fontSize, TEXT_COLORS.normal, true)).setOrigin(0, 0.5);
    this.volumeGroup = this.add.container(VOLUME_X, middleY, [this.volumeIcon, this.volumeText]);
    this.drawVolume(AudioManager.get().getSettings());

    // ---- Escuta os eventos da GameScene ----
    const events = this.game.events;
    events.on(GAME_EVENTS.CRYSTAL_COLLECTED, this.updateCrystals, this);
    events.on(GAME_EVENTS.PORTAL_UNLOCKED, this.showPortalUnlocked, this);
    events.on(GAME_EVENTS.TIME_CHANGED, this.updateTime, this);
    events.on(GAME_EVENTS.PLAYER_HIT, this.showHit, this);
    events.on(AUDIO_EVENTS.VOLUME_CHANGED, this.onVolumeChanged, this);

    // this.game.events é compartilhado por todas as cenas: ao fechar o HUD
    // precisamos remover os "ouvintes", senão eles se acumulam a cada partida.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      events.off(GAME_EVENTS.CRYSTAL_COLLECTED, this.updateCrystals, this);
      events.off(GAME_EVENTS.PORTAL_UNLOCKED, this.showPortalUnlocked, this);
      events.off(GAME_EVENTS.TIME_CHANGED, this.updateTime, this);
      events.off(GAME_EVENTS.PLAYER_HIT, this.showHit, this);
      events.off(AUDIO_EVENTS.VOLUME_CHANGED, this.onVolumeChanged, this);
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

  /** O volume mudou (teclas + / - / M): redesenha e destaca o indicador. */
  private onVolumeChanged(settings: Settings): void {
    this.drawVolume(settings);

    // Destaque: o indicador cresce, fica amarelo e depois volta ao normal
    this.volumeText.setColor(TEXT_COLORS.title);
    this.tweens.killTweensOf(this.volumeGroup);
    this.volumeGroup.setScale(1);
    this.tweens.add({
      targets: this.volumeGroup,
      scale: 1.35,
      duration: 120,
      yoyo: true,
      hold: 500, // fica grande por meio segundo
      onComplete: () => this.volumeText.setColor(TEXT_COLORS.normal),
    });
  }

  /**
   * Desenha o ícone de alto-falante conforme o volume:
   * mudo ou 0% → com um "X"; até 50% → 1 onda; acima → 2 ondas.
   */
  private drawVolume(settings: Settings): void {
    const silent = settings.mudo || settings.volumeGeral === 0;
    const g = this.volumeIcon;
    const color = silent ? COLORS.buttonBorder : COLORS.primary;
    g.clear();

    // Corpo do alto-falante: um retângulo e um trapézio (o "cone")
    g.fillStyle(color);
    g.fillRect(-12, -4, 5, 8);
    g.fillPoints([new Phaser.Math.Vector2(-7, -4), new Phaser.Math.Vector2(-1, -9), new Phaser.Math.Vector2(-1, 9), new Phaser.Math.Vector2(-7, 4)], true);

    if (silent) {
      // "X" vermelho de mudo
      g.lineStyle(2, COLORS.danger);
      g.lineBetween(3, -5, 11, 5);
      g.lineBetween(3, 5, 11, -5);
    } else {
      // Ondas sonoras: arcos à direita do alto-falante
      g.lineStyle(2, color);
      const waves = settings.volumeGeral > 0.5 ? 2 : 1;
      for (let i = 1; i <= waves; i++) {
        g.beginPath();
        g.arc(-1, 0, 4 + i * 4, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45));
        g.strokePath();
      }
    }

    this.volumeText.x = 18;
    this.volumeText.setText(settings.mudo ? 'Mudo' : `${Math.round(settings.volumeGeral * 100)}%`);
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
