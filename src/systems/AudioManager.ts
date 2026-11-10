// =============================================================
// AudioManager.ts — centraliza TODO o som do jogo.
//
// CONTROLE DE VOLUME (requisito da disciplina)
// Guardamos 4 configurações (todas salvas no localStorage):
//   volumeGeral   (0 a 1) → controla tudo
//   volumeMusica  (0 a 1) → só a música de fundo
//   volumeEfeitos (0 a 1) → só os efeitos (cristal, dano...)
//   mudo          (sim/não) → silencia tudo sem perder os valores
//
// O volume que você OUVE é uma multiplicação:
//   música  = volumeGeral × volumeMusica
//   efeito  = volumeGeral × volumeEfeitos
//   (e 0 se o mudo estiver ligado)
// Ex.: geral 80% e música 50% → a música toca a 0,8 × 0,5 = 40%.
//
// Para isso usamos o próprio Phaser:
//   - game.sound.volume = volumeGeral  (volume "mestre" do jogo)
//   - game.sound.mute   = mudo
//   - cada som toca com o seu volume de categoria (música ou efeito)
// O Phaser faz a multiplicação final automaticamente.
//
// Existe UMA instância só (padrão "singleton"), criada na BootScene
// com AudioManager.init(game) e acessada em qualquer cena com
// AudioManager.get().
// =============================================================
import Phaser from 'phaser';
import { AUDIO, AUDIO_EVENTS } from '../config/constants';
import type { Settings } from '../types';
import { SaveManager } from './SaveManager';

/** Tipo de som devolvido por game.sound.add(...) (tem volume ajustável). */
type GameSound = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound;

export class AudioManager {
  private static instance: AudioManager | null = null;

  private game: Phaser.Game;
  private settings: Settings;
  /** Música tocando agora (só uma por vez). */
  private music: GameSound | null = null;
  private musicKey: string | null = null;

  // ---------------- Criação (singleton) ----------------

  /** Cria o AudioManager. Chamado uma vez, na BootScene. */
  static init(game: Phaser.Game): AudioManager {
    AudioManager.instance = new AudioManager(game);
    return AudioManager.instance;
  }

  /** Acessa o AudioManager de qualquer lugar do jogo. */
  static get(): AudioManager {
    if (!AudioManager.instance) throw new Error('AudioManager.init() não foi chamado');
    return AudioManager.instance;
  }

  private constructor(game: Phaser.Game) {
    this.game = game;
    // Carrega o que foi salvo da última vez (ou os valores padrão)
    this.settings = SaveManager.loadSettings();
    this.applyToPhaser();
  }

  // ---------------- Leitura ----------------

  /** Cópia das configurações atuais (cópia para ninguém alterar "por fora"). */
  getSettings(): Settings {
    return { ...this.settings };
  }

  // ---------------- Alterar volumes ----------------

  setMasterVolume(value: number): void {
    this.settings.volumeGeral = AudioManager.normalize(value);
    this.onSettingsChanged();
  }

  setMusicVolume(value: number): void {
    this.settings.volumeMusica = AudioManager.normalize(value);
    this.onSettingsChanged();
  }

  setSfxVolume(value: number): void {
    this.settings.volumeEfeitos = AudioManager.normalize(value);
    this.onSettingsChanged();
  }

  /**
   * Teclas + e - da partida: sobe/desce o volume geral em 10%.
   * @param direction +1 para aumentar, -1 para diminuir
   */
  stepMasterVolume(direction: 1 | -1): void {
    // Se estava no mudo e o jogador mexeu no volume, tira do mudo
    this.settings.mudo = false;
    this.setMasterVolume(this.settings.volumeGeral + direction * AUDIO.step);
  }

  setMuted(muted: boolean): void {
    this.settings.mudo = muted;
    this.onSettingsChanged();
  }

  /** Tecla M: liga/desliga o som. */
  toggleMute(): void {
    this.setMuted(!this.settings.mudo);
  }

  // ---------------- Tocar sons ----------------

  /**
   * Toca uma música de fundo em loop. Se a mesma música já estiver
   * tocando, não faz nada (assim ela não reinicia ao trocar de tela).
   */
  playMusic(key: string): void {
    if (this.musicKey === key && this.music?.isPlaying) return;
    this.stopMusic();
    if (!this.game.cache.audio.exists(key)) return; // som não carregado/gerado

    this.music = this.game.sound.add(key, { loop: true, volume: this.settings.volumeMusica }) as GameSound;
    this.music.play();
    this.musicKey = key;
  }

  stopMusic(): void {
    this.music?.stop();
    this.music?.destroy();
    this.music = null;
    this.musicKey = null;
  }

  /** Toca um efeito sonoro uma vez, com o volume de efeitos. */
  playSfx(key: string): void {
    if (!this.game.cache.audio.exists(key)) return;
    this.game.sound.play(key, { volume: this.settings.volumeEfeitos });
  }

  // ---------------- Funções internas ----------------

  /** Sempre que algo muda: aplica no Phaser, salva e avisa as cenas (HUD). */
  private onSettingsChanged(): void {
    this.applyToPhaser();
    SaveManager.saveSettings(this.audioSettings());
    this.game.events.emit(AUDIO_EVENTS.VOLUME_CHANGED, this.getSettings());
  }

  /** Só os campos de áudio (o resto das configurações não é deste módulo). */
  private audioSettings(): Partial<Settings> {
    const { volumeGeral, volumeMusica, volumeEfeitos, mudo } = this.settings;
    return { volumeGeral, volumeMusica, volumeEfeitos, mudo };
  }

  /** Passa os valores atuais para o sistema de som do Phaser. */
  private applyToPhaser(): void {
    this.game.sound.volume = this.settings.volumeGeral; // volume mestre
    this.game.sound.mute = this.settings.mudo;
    this.music?.setVolume(this.settings.volumeMusica); // música já tocando
  }

  /** Garante valor entre 0 e 1 e arredonda (evita 0.30000000000000004). */
  private static normalize(value: number): number {
    return Math.round(Phaser.Math.Clamp(value, 0, 1) * 100) / 100;
  }
}
