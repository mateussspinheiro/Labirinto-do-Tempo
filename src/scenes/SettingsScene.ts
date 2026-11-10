// =============================================================
// SettingsScene — configurações de áudio.
// Três sliders (volume geral, música e efeitos) e um botão de mudo.
// Cada mudança vai para o AudioManager, que aplica na hora e salva
// no localStorage.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, SOUNDS, TEXT_COLORS } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { Button, ButtonGroup } from '../ui/Button';
import { addScreenFrame } from '../ui/ScreenFrame';
import { Slider } from '../ui/Slider';
import { textStyle } from '../ui/Theme';

/** Intervalo mínimo (ms) entre os sons de teste ao arrastar o slider. */
const PREVIEW_INTERVAL = 150;

export class SettingsScene extends Phaser.Scene {
  private lastPreview = 0;

  constructor() {
    super(SCENES.SETTINGS);
  }

  create(): void {
    const audio = AudioManager.get();
    const settings = audio.getSettings();
    const centerX = GAME_WIDTH / 2;

    // Música de fundo continua tocando: assim dá para ouvir o efeito dos sliders
    audio.playMusic(SOUNDS.MUSIC_MENU);

    const backButton = addScreenFrame(this, 'Configurações');
    this.add.text(centerX, 120, 'Áudio', textStyle(24, TEXT_COLORS.muted, true)).setOrigin(0.5);

    // ---- Sliders: cada um chama o método correspondente do AudioManager ----
    const masterSlider = new Slider(this, centerX, 180, 'Volume geral', settings.volumeGeral, (value) => {
      audio.setMasterVolume(value);
      this.previewSound();
    });
    const musicSlider = new Slider(this, centerX, 250, 'Música', settings.volumeMusica, (value) => audio.setMusicVolume(value));
    const sfxSlider = new Slider(this, centerX, 320, 'Efeitos', settings.volumeEfeitos, (value) => {
      audio.setSfxVolume(value);
      this.previewSound();
    });

    // ---- Botão de mudo: o texto mostra o estado atual ----
    const muteLabel = () => (audio.getSettings().mudo ? 'Som: desligado' : 'Som: ligado');
    const muteButton = new Button(this, centerX, 390, muteLabel(), () => {
      audio.toggleMute();
      muteButton.setText(muteLabel());
    });

    this.add
      .text(centerX, 450, 'Durante a partida: + / - mudam o volume geral · M liga/desliga o som', textStyle(16, TEXT_COLORS.muted))
      .setOrigin(0.5);

    new ButtonGroup(this, [masterSlider, musicSlider, sfxSlider, muteButton, backButton]);
  }

  /** Toca um efeito curto para o jogador ouvir o volume escolhido. */
  private previewSound(): void {
    if (this.time.now - this.lastPreview < PREVIEW_INTERVAL) return;
    this.lastPreview = this.time.now;
    AudioManager.get().playSfx(SOUNDS.CRYSTAL);
  }
}
