// =============================================================
// GameScene — a partida: monta o labirinto da fase, controla o
// jogador, os cristais e o portal. Recebe o id da fase pela
// LevelSelectScene e abre a HudScene em paralelo.
//
// Toda informação para o HUD sai daqui como EVENTO em this.game.events.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_EVENTS, CRYSTALS_TO_UNLOCK, LEVEL_END_DELAY, GAME_WIDTH, GAME_HEIGHT, TEXT_COLORS } from '../config/constants';
import { Crystal } from '../entities/Crystal';
import { Player } from '../entities/Player';
import { Portal } from '../entities/Portal';
import { getLevel } from '../levels';
import { LevelLoader } from '../systems/LevelLoader';
import type { LevelData } from '../types';
import { textStyle } from '../ui/Theme';
import type { HudSceneData } from './HudScene';

/** Dados recebidos ao iniciar a cena. */
export interface GameSceneData {
  levelId: number;
}

export class GameScene extends Phaser.Scene {
  private level!: LevelData;
  private player!: Player;
  private portal!: Portal;
  private crystalsCollected = 0;
  /** Vira true quando a fase termina, para ignorar novos eventos. */
  private finished = false;

  constructor() {
    super(SCENES.GAME);
  }

  init(data: GameSceneData): void {
    // Se a fase não existir (não deveria acontecer), volta para a fase 1
    this.level = getLevel(data.levelId) ?? getLevel(1)!;
    // A mesma instância da cena é reaproveitada: zera o estado a cada partida
    this.crystalsCollected = 0;
    this.finished = false;
  }

  create(): void {
    // 1) Monta o labirinto a partir do mapa de texto
    const loaded = new LevelLoader(this, this.level).load();

    // 2) Portal e cristais (criados antes do jogador para ficarem "por baixo" dele)
    this.portal = new Portal(this, loaded.portal.x, loaded.portal.y);
    const crystals = loaded.crystals.map((pos) => new Crystal(this, pos.x, pos.y));

    // 3) Jogador na posição 'P' do mapa
    this.player = new Player(this, loaded.playerStart.x, loaded.playerStart.y, loaded.offset);

    // 4) Física: colisão com paredes e "sobreposição" (overlap) com os objetos.
    //    collider = bloqueia o movimento; overlap = só avisa que encostou.
    this.physics.add.collider(this.player, loaded.walls);
    this.physics.add.overlap(this.player, crystals, (_player, crystal) => this.collectCrystal(crystal as Crystal));
    this.physics.add.overlap(this.player, this.portal, () => this.enterPortal());

    // 5) Abre o HUD em paralelo (launch não fecha esta cena)
    const hudData: HudSceneData = { totalCrystals: CRYSTALS_TO_UNLOCK };
    this.scene.launch(SCENES.HUD, hudData);

    // Ao sair desta cena (por qualquer motivo), fecha o HUD junto
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop(SCENES.HUD));

    // Temporário: ESC volta para a seleção de fases
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.LEVEL_SELECT));
  }

  update(): void {
    if (this.finished) return;
    this.player.updateMovement();
  }

  /** Jogador encostou em um cristal. */
  private collectCrystal(crystal: Crystal): void {
    if (!crystal.collect()) return; // já tinha sido coletado

    this.crystalsCollected++;
    this.game.events.emit(GAME_EVENTS.CRYSTAL_COLLECTED, this.crystalsCollected, CRYSTALS_TO_UNLOCK);

    if (this.crystalsCollected >= CRYSTALS_TO_UNLOCK) {
      this.portal.unlock();
      this.game.events.emit(GAME_EVENTS.PORTAL_UNLOCKED);
    }
  }

  /** Jogador encostou no portal: só conclui a fase se ele estiver liberado. */
  private enterPortal(): void {
    if (this.finished || !this.portal.isUnlocked()) return;
    this.finished = true;
    this.player.halt();

    // Temporário: mensagem de vitória e volta para a seleção de fases
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Fase concluída!', textStyle(44, TEXT_COLORS.success, true))
      .setOrigin(0.5)
      .setStroke('#000000', 6);
    this.time.delayedCall(LEVEL_END_DELAY, () => this.scene.start(SCENES.LEVEL_SELECT));
  }
}
