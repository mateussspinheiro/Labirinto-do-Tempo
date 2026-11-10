// =============================================================
// GameScene — a partida: monta o labirinto da fase e controla o
// jogador. Recebe o id da fase pela LevelSelectScene.
// =============================================================
import Phaser from 'phaser';
import { SCENES } from '../config/constants';
import { Player } from '../entities/Player';
import { getLevel } from '../levels';
import { LevelLoader } from '../systems/LevelLoader';
import type { LevelData } from '../types';

/** Dados recebidos ao iniciar a cena. */
export interface GameSceneData {
  levelId: number;
}

export class GameScene extends Phaser.Scene {
  private level!: LevelData;
  private player!: Player;

  constructor() {
    super(SCENES.GAME);
  }

  init(data: GameSceneData): void {
    // Se a fase não existir (não deveria acontecer), volta para a fase 1
    this.level = getLevel(data.levelId) ?? getLevel(1)!;
  }

  create(): void {
    // 1) Monta o labirinto a partir do mapa de texto
    const loaded = new LevelLoader(this, this.level).load();

    // 2) Cria o jogador na posição 'P' do mapa
    this.player = new Player(this, loaded.playerStart.x, loaded.playerStart.y, loaded.offset);

    // 3) Colisão: o jogador não atravessa as paredes
    this.physics.add.collider(this.player, loaded.walls);

    // Temporário: ESC volta para a seleção de fases
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.LEVEL_SELECT));
  }

  update(): void {
    this.player.updateMovement();
  }
}
