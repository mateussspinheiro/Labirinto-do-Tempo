// =============================================================
// GameScene — a partida: monta o labirinto da fase, controla o
// jogador, os cristais, o portal, os obstáculos e o cronômetro.
// Recebe o id da fase pelo mapa de fases (LevelMapScene), aplica a
// dificuldade escolhida e abre a HudScene em paralelo.
//
// Toda informação para o HUD sai daqui como EVENTO em this.game.events.
// =============================================================
import Phaser from 'phaser';
import {
  SCENES,
  GAME_EVENTS,
  CRYSTALS_TO_UNLOCK,
  LEVEL_END_DELAY,
  GLOW,
  SOUNDS,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '../config/constants';
import { Crystal } from '../entities/Crystal';
import { Obstacle } from '../entities/Obstacle';
import { Player } from '../entities/Player';
import { Portal } from '../entities/Portal';
import { getLevel } from '../levels';
import { AudioManager } from '../systems/AudioManager';
import { enemySpeed, getCurrentDifficulty, levelTime } from '../systems/Difficulty';
import { LevelLoader } from '../systems/LevelLoader';
import { SaveManager } from '../systems/SaveManager';
import { ScoreCalculator } from '../systems/ScoreCalculator';
import type { Difficulty, LevelData, LevelResult } from '../types';
import { addTechBackground } from '../ui/TechBackground';
import { addGlow, theme, titleStyle } from '../ui/Theme';
import type { HudSceneData } from './HudScene';
import type { PauseSceneData } from './PauseScene';
import { goToScene } from '../ui/Transition';

/** Dados recebidos ao iniciar a cena. */
export interface GameSceneData {
  levelId: number;
}

export class GameScene extends Phaser.Scene {
  private level!: LevelData;
  private difficulty!: Difficulty;
  /** Tempo total da fase já ajustado pela dificuldade. */
  private timeLimit = 0;
  private player!: Player;
  private portal!: Portal;
  private crystalsCollected = 0;
  /** Segundos restantes no cronômetro. */
  private timeLeft = 0;
  /** Quantas vezes o jogador foi atingido (entra na pontuação). */
  private damageCount = 0;
  /** Vira true quando a fase termina, para ignorar novos eventos. */
  private finished = false;

  constructor() {
    super(SCENES.GAME);
  }

  init(data: GameSceneData): void {
    // Se a fase não existir (não deveria acontecer), volta para a fase 1
    this.level = getLevel(data.levelId) ?? getLevel(1)!;
    this.difficulty = getCurrentDifficulty();
    this.timeLimit = levelTime(this.level, this.difficulty);
    // A mesma instância da cena é reaproveitada: zera o estado a cada partida
    this.crystalsCollected = 0;
    this.timeLeft = this.timeLimit;
    this.damageCount = 0;
    this.finished = false;
  }

  create(): void {
    // 1) Fundo tecnológico e o labirinto montado a partir do mapa de texto
    addTechBackground(this, { variant: 'game' });
    const loaded = new LevelLoader(this, this.level).load();

    // 2) Portal e cristais (criados antes do jogador para ficarem "por baixo" dele)
    this.portal = new Portal(this, loaded.portal.x, loaded.portal.y);
    const crystals = loaded.crystals.map((pos) => new Crystal(this, pos.x, pos.y));

    // 3) Jogador na posição 'P' do mapa e inimigos nas posições 'E'
    this.player = new Player(this, loaded.playerStart.x, loaded.playerStart.y, loaded.offset);
    // A velocidade dos monstros depende da dificuldade
    const speed = enemySpeed(this.level, this.difficulty);
    const obstacles = loaded.enemies.map((path) => new Obstacle(this, path, speed));

    // 4) Física: colisão com paredes e "sobreposição" (overlap) com os objetos.
    //    collider = bloqueia o movimento; overlap = só avisa que encostou.
    this.physics.add.collider(this.player, loaded.walls);
    this.physics.add.overlap(this.player, crystals, (_player, crystal) => this.collectCrystal(crystal as Crystal));
    this.physics.add.overlap(this.player, this.portal, () => this.enterPortal());
    this.physics.add.overlap(this.player, obstacles, () => this.hitPlayer());

    // 5) Abre o HUD em paralelo (launch não fecha esta cena)
    // Primeira vez na fase 1? O HUD mostra a dica do objetivo.
    const showTip = this.level.id === 1 && SaveManager.shouldShowTip();
    if (showTip) SaveManager.markTipShown();
    const hudData: HudSceneData = { totalCrystals: CRYSTALS_TO_UNLOCK, timeLimit: this.timeLimit, showTip };
    this.scene.launch(SCENES.HUD, hudData);

    // 6) Cronômetro: a cada 1 segundo chama tick(). O relógio da cena
    //    (this.time) para sozinho quando a cena é pausada.
    this.time.addEvent({ delay: 1000, loop: true, callback: this.tick, callbackScope: this });

    // 7) Música da partida e teclas de volume
    AudioManager.get().playMusic(SOUNDS.MUSIC_GAME);
    this.input.keyboard?.on('keydown', this.handleVolumeKeys, this);

    // 8) Pausa: ESC ou P
    this.input.keyboard?.on('keydown-ESC', this.pauseGame, this);
    this.input.keyboard?.on('keydown-P', this.pauseGame, this);

    // Ao voltar da pausa, "solta" todas as teclas: se o jogador soltou
    // uma seta durante a pausa, a cena pausada não percebeu.
    const onResume = () => this.input.keyboard?.resetKeys();
    this.events.on(Phaser.Scenes.Events.RESUME, onResume);

    // Ao sair desta cena (por qualquer motivo): fecha o HUD junto e
    // remove o ouvinte acima (os eventos da cena continuam existindo
    // entre uma partida e outra, então não podem se acumular).
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, onResume);
      this.scene.stop(SCENES.HUD);
    });
  }

  /** Pausa a partida e abre o menu de pausa por cima. */
  private pauseGame(): void {
    if (this.finished) return;
    const data: PauseSceneData = { levelId: this.level.id };
    this.scene.pause(); // para update, física, cronômetro e animações desta cena
    this.scene.launch(SCENES.PAUSE, data);
  }

  /**
   * Teclas de volume durante a partida:
   *   + (ou =)  aumenta o volume geral em 10%
   *   -         diminui o volume geral em 10%
   *   M         liga/desliga o som
   * Usamos event.key (o caractere digitado), que funciona em qualquer
   * layout de teclado e também no teclado numérico.
   */
  private handleVolumeKeys(event: KeyboardEvent): void {
    const audio = AudioManager.get();
    switch (event.key) {
      case '+':
      case '=':
        audio.stepMasterVolume(1);
        break;
      case '-':
      case '_':
        audio.stepMasterVolume(-1);
        break;
      case 'm':
      case 'M':
        audio.toggleMute();
        break;
    }
  }

  update(): void {
    if (this.finished) return;
    this.player.updateMovement();
  }

  /** Passou 1 segundo. */
  private tick(): void {
    if (this.finished) return;
    this.changeTime(-1);
  }

  /** Soma (ou subtrai) segundos do cronômetro e verifica se acabou. */
  private changeTime(seconds: number): void {
    this.timeLeft = Math.max(0, this.timeLeft + seconds);
    this.game.events.emit(GAME_EVENTS.TIME_CHANGED, this.timeLeft);
    if (this.timeLeft <= 0) this.endLevel(false);
  }

  /** Jogador encostou em um cristal. */
  private collectCrystal(crystal: Crystal): void {
    if (this.finished || !crystal.collect()) return; // já tinha sido coletado

    this.crystalsCollected++;
    AudioManager.get().playSfx(SOUNDS.CRYSTAL);
    this.game.events.emit(GAME_EVENTS.CRYSTAL_COLLECTED, this.crystalsCollected, CRYSTALS_TO_UNLOCK);

    if (this.crystalsCollected >= CRYSTALS_TO_UNLOCK) {
      this.portal.unlock();
      AudioManager.get().playSfx(SOUNDS.PORTAL);
      this.game.events.emit(GAME_EVENTS.PORTAL_UNLOCKED);
    }
  }

  /** Um inimigo tocou no jogador: perde tempo, pisca e fica invencível. */
  private hitPlayer(): void {
    if (this.finished || this.player.isInvulnerable()) return;

    this.damageCount++;
    this.player.hurt();
    AudioManager.get().playSfx(SOUNDS.HIT);
    this.cameras.main.shake(150, 0.008); // tremidinha na tela
    // Quantos segundos o dano tira depende da dificuldade
    this.game.events.emit(GAME_EVENTS.PLAYER_HIT, this.difficulty.dano);
    this.changeTime(-this.difficulty.dano);
  }

  /** Jogador encostou no portal: só conclui a fase se ele estiver liberado. */
  private enterPortal(): void {
    if (this.finished || !this.portal.isUnlocked()) return;
    this.endLevel(true);
  }

  /** Termina a fase (vitória ou derrota) e vai para a tela de resultado. */
  private endLevel(victory: boolean): void {
    if (this.finished) return;
    this.finished = true;
    this.player.halt();
    this.physics.pause(); // congela inimigos e jogador

    // Som: para a música e toca a vinheta de vitória ou derrota
    const audio = AudioManager.get();
    audio.stopMusic();
    audio.playSfx(victory ? SOUNDS.VICTORY : SOUNDS.DEFEAT);

    const score = ScoreCalculator.calculate(
      victory,
      this.timeLeft,
      this.timeLimit,
      this.damageCount,
      this.difficulty.pontos,
    );
    const result: LevelResult = {
      levelId: this.level.id,
      difficultyId: this.difficulty.id,
      victory,
      timeLeft: this.timeLeft,
      timeUsed: this.timeLimit - this.timeLeft,
      timeLimit: this.timeLimit,
      damage: this.damageCount,
      points: score.points,
      stars: score.stars,
      newRecord: false,
    };
    // Salva o progresso (só conta se venceu) e descobre se foi recorde
    result.newRecord = SaveManager.saveResult(result);

    // Mensagem rápida antes de trocar de tela
    const text = victory ? 'FASE CONCLUÍDA!' : 'TEMPO ESGOTADO!';
    const color = victory ? theme.colors.primary : theme.colors.danger;
    const message = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, text, titleStyle(38, victory ? theme.text.success : theme.text.danger))
      .setOrigin(0.5)
      .setStroke('#000000', 6)
      .setDepth(20)
      .setScale(0.4);
    addGlow(message, color, GLOW.title);
    this.tweens.add({ targets: message, scale: 1, duration: 350, ease: 'Back.easeOut' });

    // O HUD escurece junto (goToScene escurece todas as cenas visíveis)
    this.time.delayedCall(LEVEL_END_DELAY, () => goToScene(this, SCENES.RESULT, result));
  }
}
