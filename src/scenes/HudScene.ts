// =============================================================
// HudScene — HUD (informações na tela) que roda EM PARALELO à
// GameScene. Ela não tem nenhuma regra de jogo: só escuta os
// eventos emitidos pela GameScene e atualiza a interface.
// Mostra: cristais (3 ícones que acendem), estado do portal,
// tempo restante (número + barra) e o volume.
// =============================================================
import Phaser from 'phaser';
import {
  SCENES,
  AUDIO_EVENTS,
  FIRST_TIP,
  GAME_EVENTS,
  GAME_WIDTH,
  GAME_HEIGHT,
  GLOW,
  HUD,
  HUD_HEIGHT,
  TEXTURES,
  TIME_WARNING_SECONDS,
} from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { Settings } from '../types';
import { addPanel } from '../ui/Panel';
import { addGlow, formatTime, textStyle, theme, titleStyle } from '../ui/Theme';

/** Posições (x) de cada bloco do HUD. */
const CRYSTALS_X = 26;
const CRYSTAL_SPACING = 30;
const PORTAL_X = 165;
const TIME_X = 400;
const TIME_BAR_WIDTH = 150;
const VOLUME_X = 690;

/** Dados iniciais enviados pela GameScene ao abrir o HUD. */
export interface HudSceneData {
  totalCrystals: number;
  timeLimit: number;
  /** Mostrar a dica inicial do objetivo (primeira vez na fase 1). */
  showTip: boolean;
}

export class HudScene extends Phaser.Scene {
  private crystalIcons: Phaser.GameObjects.Image[] = [];
  private portalIcon!: Phaser.GameObjects.Image;
  private portalText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private timeBar!: Phaser.GameObjects.Graphics;
  private volumeIcon!: Phaser.GameObjects.Graphics;
  private volumeText!: Phaser.GameObjects.Text;
  private volumeGroup!: Phaser.GameObjects.Container;
  private totalCrystals = 0;
  private timeLimit = 0;
  private showTip = false;

  constructor() {
    super(SCENES.HUD);
  }

  init(data: HudSceneData): void {
    this.totalCrystals = data.totalCrystals;
    this.timeLimit = data.timeLimit;
    this.showTip = data.showTip;
  }

  create(): void {
    this.createBar();
    const middleY = HUD_HEIGHT / 2;

    // ---- Cristais: um ícone por cristal, apagado até ser coletado ----
    this.crystalIcons = [];
    for (let i = 0; i < this.totalCrystals; i++) {
      const icon = this.add.image(CRYSTALS_X + i * CRYSTAL_SPACING, middleY, TEXTURES.CRYSTAL).setScale(0.9);
      addGlow(icon, theme.colors.primary, GLOW.soft);
      this.crystalIcons.push(icon);
    }
    this.updateCrystals(0);

    // ---- Portal: ícone + estado ----
    this.portalIcon = this.add.image(PORTAL_X, middleY, TEXTURES.PORTAL_LOCKED).setScale(0.9);
    this.portalText = this.add
      .text(PORTAL_X + 22, middleY, 'BLOQUEADO', titleStyle(12, theme.text.muted))
      .setOrigin(0, 0.5)
      .setLetterSpacing(2);

    // ---- Tempo: número + barra que esvazia ----
    this.timeText = this.add.text(TIME_X, middleY - 6, '', titleStyle(22, theme.text.normal)).setOrigin(0.5);
    this.timeBar = this.add.graphics();
    this.updateTime(this.timeLimit);

    // ---- Volume: ícone + porcentagem, dentro de um container
    //      (assim conseguimos "pulsar" os dois juntos quando o volume muda)
    this.volumeIcon = this.add.graphics();
    this.volumeText = this.add.text(18, 0, '', titleStyle(15, theme.text.normal)).setOrigin(0, 0.5);
    this.volumeGroup = this.add.container(VOLUME_X, middleY, [this.volumeIcon, this.volumeText]);
    this.drawVolume(AudioManager.get().getSettings());

    if (this.showTip) this.showFirstTip();

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

  /** Faixa do HUD: fundo escuro, linha neon embaixo e divisórias entre os blocos. */
  private createBar(): void {
    const g = this.add.graphics();
    g.fillStyle(theme.colors.hudBackground, 0.92).fillRect(0, 0, GAME_WIDTH, HUD_HEIGHT);
    g.lineStyle(1, theme.colors.buttonBorder, 0.6);
    for (const x of [130, 290, 520, 650]) g.lineBetween(x, 10, x, HUD_HEIGHT - 10);

    const line = this.add.graphics();
    line.lineStyle(2, theme.colors.hudBorder, 1).lineBetween(0, HUD_HEIGHT - 1, GAME_WIDTH, HUD_HEIGHT - 1);
    addGlow(line, theme.colors.hudBorder, GLOW.soft);
  }

  /** Acende um ícone para cada cristal coletado (o total já é o número de ícones). */
  private updateCrystals(collected: number): void {
    this.crystalIcons.forEach((icon, i) => {
      const lit = i < collected;
      icon.setAlpha(lit ? 1 : 0.25);
      icon.filters?.internal.list.forEach((filter) => (filter.active = lit));
      // O ícone que acabou de acender dá um "pulo"
      if (i === collected - 1) this.tweens.add({ targets: icon, scale: 1.5, duration: 140, yoyo: true });
    });
  }

  /** Atualiza o cronômetro e a barra; nos últimos segundos tudo fica vermelho. */
  private updateTime(secondsLeft: number): void {
    const warning = secondsLeft <= TIME_WARNING_SECONDS;
    const color = warning ? theme.colors.danger : theme.colors.primary;
    this.timeText.setText(formatTime(secondsLeft));
    this.timeText.setColor(warning ? theme.text.danger : theme.text.normal);

    const ratio = Phaser.Math.Clamp(secondsLeft / this.timeLimit, 0, 1);
    const left = TIME_X - TIME_BAR_WIDTH / 2;
    this.timeBar.clear();
    this.timeBar.fillStyle(theme.colors.buttonIdle, 1).fillRect(left, HUD_HEIGHT - 14, TIME_BAR_WIDTH, 4);
    this.timeBar.fillStyle(color, 1).fillRect(left, HUD_HEIGHT - 14, TIME_BAR_WIDTH * ratio, 4);

    // Nos últimos segundos, o número "bate" como um coração
    if (warning && secondsLeft > 0) this.tweens.add({ targets: this.timeText, scale: 1.2, duration: 120, yoyo: true });
  }

  /** Mostra "-5s" subindo e sumindo ao lado do tempo. */
  private showHit(secondsLost: number): void {
    const label = this.add
      .text(TIME_X + 60, HUD_HEIGHT / 2, `-${secondsLost}s`, titleStyle(16, theme.text.danger))
      .setOrigin(0, 0.5);
    this.tweens.add({ targets: label, y: label.y + 34, alpha: 0, duration: 900, onComplete: () => label.destroy() });
  }

  /** O volume mudou (teclas + / - / M): redesenha e destaca o indicador. */
  private onVolumeChanged(settings: Settings): void {
    this.drawVolume(settings);

    // Destaque: o indicador cresce, fica colorido e depois volta ao normal
    this.volumeText.setColor(theme.text.title);
    this.tweens.killTweensOf(this.volumeGroup);
    this.volumeGroup.setScale(1);
    this.tweens.add({
      targets: this.volumeGroup,
      scale: 1.3,
      duration: 120,
      yoyo: true,
      hold: 500, // fica grande por meio segundo
      onComplete: () => this.volumeText.setColor(theme.text.normal),
    });
  }

  /**
   * Desenha o ícone de alto-falante conforme o volume:
   * mudo ou 0% → com um "X"; até 50% → 1 onda; acima → 2 ondas.
   */
  private drawVolume(settings: Settings): void {
    const silent = settings.mudo || settings.volumeGeral === 0;
    const g = this.volumeIcon;
    const color = silent ? theme.colors.buttonBorder : theme.colors.primary;
    g.clear();

    // Corpo do alto-falante: um retângulo e um trapézio (o "cone")
    g.fillStyle(color);
    g.fillRect(-12, -4, 5, 8);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(-7, -4),
        new Phaser.Math.Vector2(-1, -9),
        new Phaser.Math.Vector2(-1, 9),
        new Phaser.Math.Vector2(-7, 4),
      ],
      true,
    );

    if (silent) {
      // "X" vermelho de mudo
      g.lineStyle(2, theme.colors.danger);
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

    this.volumeText.setText(settings.mudo ? 'MUDO' : `${Math.round(settings.volumeGeral * 100)}%`);
  }

  /** Dica rápida do objetivo, na parte de baixo da tela; some sozinha. */
  private showFirstTip(): void {
    const y = GAME_HEIGHT - 40;
    const text = this.add.text(GAME_WIDTH / 2, y, FIRST_TIP, textStyle(20, theme.text.title, true)).setOrigin(0.5);
    const box = addPanel(this, 0, 0, text.width + 50, text.height + 22, {
      border: theme.colors.accent,
      brackets: theme.colors.accent,
      corner: 10,
    }).setPosition(GAME_WIDTH / 2, y);
    text.setDepth(1); // texto por cima da caixa

    // Aparece subindo, fica alguns segundos e desaparece
    [box, text].forEach((obj) => obj.setAlpha(0).setY(y + 20));
    this.tweens.add({ targets: [box, text], alpha: 1, y, duration: 400, ease: 'Quad.easeOut' });
    this.tweens.add({
      targets: [box, text],
      alpha: 0,
      delay: HUD.tipDuration,
      duration: 500,
      onComplete: () => [box, text].forEach((obj) => obj.destroy()),
    });
  }

  private showPortalUnlocked(): void {
    this.portalIcon.setTexture(TEXTURES.PORTAL_OPEN);
    addGlow(this.portalIcon, theme.colors.secondary, GLOW.soft);
    this.tweens.add({ targets: this.portalIcon, angle: 360, duration: 3000, repeat: -1 });
    this.portalText.setText('LIBERADO').setColor(theme.text.portalOpen);

    // Mensagem grande no meio da tela que some sozinha
    const message = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PORTAL LIBERADO!', titleStyle(36, theme.text.portalOpen))
      .setOrigin(0.5)
      .setStroke('#000000', 6)
      .setScale(0.5);
    addGlow(message, theme.colors.secondary, GLOW.title);
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
