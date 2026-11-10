// =============================================================
// LevelLoader.ts — converte o mapa de texto da fase em objetos.
//
// Percorre o mapa linha por linha, caractere por caractere:
//  - '#' vira uma parede com colisão (grupo estático da física);
//  - os outros símbolos viram chão e têm sua posição guardada
//    (jogador, cristais, portal, inimigos) para a GameScene criar
//    as entidades.
// =============================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, HUD_HEIGHT, MAP_CHARS, TEXTURES, TILE_SIZE } from '../config/constants';
import type { LevelData, PatrolPath, Point } from '../types';
import { theme } from '../ui/Theme';

/** Resultado da leitura do mapa. */
export interface LoadedLevel {
  walls: Phaser.Physics.Arcade.StaticGroup;
  playerStart: Point;
  crystals: Point[];
  portal: Point;
  /** Caminho de patrulha de cada inimigo 'E'. */
  enemies: PatrolPath[];
  /** Canto superior esquerdo do labirinto na tela (para centralizá-lo). */
  offset: Point;
}

export class LevelLoader {
  private scene: Phaser.Scene;
  private level: LevelData;
  private offset: Point;

  constructor(scene: Phaser.Scene, level: LevelData) {
    this.scene = scene;
    this.level = level;

    // Centraliza o labirinto na área abaixo do HUD
    const cols = level.mapa[0].length;
    const rows = level.mapa.length;
    this.offset = {
      x: Math.floor((GAME_WIDTH - cols * TILE_SIZE) / 2),
      y: HUD_HEIGHT + Math.floor((GAME_HEIGHT - HUD_HEIGHT - rows * TILE_SIZE) / 2),
    };
  }

  /** Monta o labirinto na cena e devolve as posições dos objetos. */
  load(): LoadedLevel {
    const walls = this.scene.physics.add.staticGroup();
    const result: LoadedLevel = {
      walls,
      playerStart: { x: 0, y: 0 },
      crystals: [],
      portal: { x: 0, y: 0 },
      enemies: [],
      offset: this.offset,
    };

    // No modo alto contraste, usa as imagens de parede/chão mais contrastantes
    const wallTexture = theme.highContrast ? TEXTURES.WALL_HC : TEXTURES.WALL;
    const floorTexture = theme.highContrast ? TEXTURES.FLOOR_HC : TEXTURES.FLOOR;

    this.level.mapa.forEach((line, row) => {
      [...line].forEach((char, col) => {
        const pos = this.tileToWorld(col, row);

        if (char === MAP_CHARS.WALL) {
          // Parede: imagem com corpo físico estático (não se move)
          walls.create(pos.x, pos.y, wallTexture);
          return;
        }

        // Qualquer outro símbolo tem chão por baixo
        this.scene.add.image(pos.x, pos.y, floorTexture);

        switch (char) {
          case MAP_CHARS.PLAYER:
            result.playerStart = pos;
            break;
          case MAP_CHARS.CRYSTAL:
            result.crystals.push(pos);
            break;
          case MAP_CHARS.PORTAL:
            result.portal = pos;
            break;
          case MAP_CHARS.ENEMY:
            result.enemies.push(this.findPatrolPath(col, row));
            break;
        }
      });
    });

    return result;
  }

  /**
   * Descobre o caminho de patrulha de um inimigo automaticamente:
   * mede o corredor reto na horizontal e na vertical a partir do 'E'
   * (até bater numa parede) e escolhe o mais comprido.
   */
  private findPatrolPath(col: number, row: number): PatrolPath {
    const isFree = (c: number, r: number) =>
      this.level.mapa[r]?.[c] !== undefined && this.level.mapa[r][c] !== MAP_CHARS.WALL;

    // Anda para cada lado enquanto não encontrar parede
    let left = col;
    while (isFree(left - 1, row)) left--;
    let right = col;
    while (isFree(right + 1, row)) right++;
    let up = row;
    while (isFree(col, up - 1)) up--;
    let down = row;
    while (isFree(col, down + 1)) down++;

    const horizontal = right - left;
    const vertical = down - up;

    if (horizontal >= vertical) {
      return { a: this.tileToWorld(left, row), b: this.tileToWorld(right, row) };
    }
    return { a: this.tileToWorld(col, up), b: this.tileToWorld(col, down) };
  }

  /** Converte coluna/linha do mapa para o centro do tile em pixels. */
  private tileToWorld(col: number, row: number): Point {
    return {
      x: this.offset.x + col * TILE_SIZE + TILE_SIZE / 2,
      y: this.offset.y + row * TILE_SIZE + TILE_SIZE / 2,
    };
  }
}
