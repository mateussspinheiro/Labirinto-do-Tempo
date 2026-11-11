// =============================================================
// TechBackground.ts — fundo animado com visual futurista.
//
// Camadas (de trás para frente):
//   1. degradê do azul-escuro para o roxo;
//   2. "piso" de grade neon em perspectiva, que rola em direção ao
//      jogador (estilo synthwave/anos 80), com a linha do horizonte;
//   3. partículas de luz subindo devagar;
//   4. linhas de varredura (scanlines), como em uma tela antiga.
// No alto contraste o fundo fica preto liso (menos distração).
// =============================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { addGlow, theme } from './Theme';

export interface TechBackgroundOptions {
  /** 'menu': grade em perspectiva rolando; 'game': grade plana e discreta. */
  variant?: 'menu' | 'game';
}

const HORIZON_Y = GAME_HEIGHT * 0.6; // altura do horizonte
const VERTICAL_LINES = 18; // linhas que "fogem" para o horizonte
const HORIZONTAL_LINES = 10; // linhas que vêm em nossa direção
const GRID_SPEED = 0.00025; // velocidade da rolagem da grade
const PARTICLES = 26;
const PARTICLE_SPEED_MIN = 25; // px por segundo
const PARTICLE_SPEED_MAX = 70;
const SCANLINE_TEXTURE = 'scanline';

export function addTechBackground(scene: Phaser.Scene, options: TechBackgroundOptions = {}): void {
  const variant = options.variant ?? 'menu';

  // 1) Degradê de fundo (fillGradientStyle: cores dos 4 cantos)
  const base = scene.add.graphics();
  const { backgroundTop: top, backgroundBottom: bottom } = theme.colors;
  base.fillGradientStyle(top, top, bottom, bottom, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (theme.highContrast) return; // alto contraste: só o fundo liso

  // 2) Grade neon
  const grid = scene.add.graphics();
  if (variant === 'menu') {
    // Linha do horizonte com brilho magenta
    const horizon = scene.add.graphics();
    horizon.lineStyle(2, theme.colors.secondary, 0.9).lineBetween(0, HORIZON_Y, GAME_WIDTH, HORIZON_Y);
    addGlow(horizon, theme.colors.secondary, 4);

    // A grade é redesenhada a cada quadro com um deslocamento que cresce
    const draw = (time: number) => drawPerspectiveGrid(grid, (time * GRID_SPEED) % 1);
    scene.events.on(Phaser.Scenes.Events.UPDATE, draw);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, draw));
    drawPerspectiveGrid(grid, 0);
  } else {
    drawFlatGrid(grid);
  }

  // 3) Partículas de luz subindo
  for (let i = 0; i < PARTICLES; i++) {
    const dot = scene.add.rectangle(
      Phaser.Math.Between(0, GAME_WIDTH),
      Phaser.Math.Between(0, GAME_HEIGHT),
      2,
      2,
      i % 3 === 0 ? theme.colors.secondary : theme.colors.primary,
      Phaser.Math.FloatBetween(0.2, 0.7),
    );
    floatUp(scene, dot, Phaser.Math.FloatBetween(PARTICLE_SPEED_MIN, PARTICLE_SPEED_MAX));
  }

  // 4) Scanlines: uma textura de 1 linha escura a cada 3 px, repetida na tela toda
  if (!scene.textures.exists(SCANLINE_TEXTURE)) {
    const g = scene.make.graphics({}, false);
    g.fillStyle(0x000000, 0.35).fillRect(0, 0, 4, 1);
    g.generateTexture(SCANLINE_TEXTURE, 4, 3);
    g.destroy();
  }
  scene.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, SCANLINE_TEXTURE).setOrigin(0).setAlpha(0.5);
}

/**
 * Faz a partícula subir até sair da tela; quando chega, volta para
 * baixo em uma posição aleatória e sobe de novo (para sempre).
 * @param speed pixels por segundo
 */
function floatUp(scene: Phaser.Scene, dot: Phaser.GameObjects.Rectangle, speed: number): void {
  scene.tweens.add({
    targets: dot,
    y: -10,
    duration: ((dot.y + 10) / speed) * 1000,
    onComplete: () => {
      dot.setPosition(Phaser.Math.Between(0, GAME_WIDTH), GAME_HEIGHT + 10);
      floatUp(scene, dot, speed);
    },
  });
}

/**
 * Grade em perspectiva: linhas verticais saem do ponto de fuga (no
 * centro do horizonte) e linhas horizontais ficam mais espaçadas
 * quanto mais perto da parte de baixo da tela (efeito de profundidade).
 * @param offset 0 a 1, quanto a grade já rolou
 */
function drawPerspectiveGrid(g: Phaser.GameObjects.Graphics, offset: number): void {
  g.clear();
  const color = theme.colors.grid;
  const depth = GAME_HEIGHT - HORIZON_Y;

  // Linhas verticais (do ponto de fuga até a base, abrindo em leque)
  g.lineStyle(1, color, 0.25);
  for (let i = 0; i <= VERTICAL_LINES; i++) {
    const bottomX = (i / VERTICAL_LINES) * GAME_WIDTH * 3 - GAME_WIDTH;
    g.lineBetween(GAME_WIDTH / 2, HORIZON_Y, bottomX, GAME_HEIGHT);
  }

  // Linhas horizontais: z ao quadrado = mais juntas perto do horizonte
  for (let i = 0; i < HORIZONTAL_LINES; i++) {
    const z = (i + offset) / HORIZONTAL_LINES;
    const y = HORIZON_Y + depth * z * z;
    g.lineStyle(1, color, 0.08 + z * 0.35); // mais forte quanto mais perto
    g.lineBetween(0, y, GAME_WIDTH, y);
  }
}

/** Grade plana e discreta (fundo da partida, atrás do labirinto). */
function drawFlatGrid(g: Phaser.GameObjects.Graphics): void {
  const step = 40;
  g.lineStyle(1, theme.colors.grid, 0.06);
  for (let x = 0; x <= GAME_WIDTH; x += step) g.lineBetween(x, 0, x, GAME_HEIGHT);
  for (let y = 0; y <= GAME_HEIGHT; y += step) g.lineBetween(0, y, GAME_WIDTH, y);
}
