// =============================================================
// Panel.ts — formas com "cantos cortados" (chanfrados), típicas de
// interfaces futuristas. Usadas em botões, painéis e janelas.
//
//    ____________
//   /            |      cada canto superior-esquerdo e
//   |            |      inferior-direito é cortado na diagonal
//   |____________/
// =============================================================
import Phaser from 'phaser';
import { theme } from './Theme';

/** Pontos do contorno de um retângulo chanfrado centrado em (x, y). */
export function chamferPoints(
  x: number,
  y: number,
  width: number,
  height: number,
  corner: number,
): Phaser.Math.Vector2[] {
  const left = x - width / 2;
  const right = x + width / 2;
  const top = y - height / 2;
  const bottom = y + height / 2;
  return [
    new Phaser.Math.Vector2(left + corner, top),
    new Phaser.Math.Vector2(right, top),
    new Phaser.Math.Vector2(right, bottom - corner),
    new Phaser.Math.Vector2(right - corner, bottom),
    new Phaser.Math.Vector2(left, bottom),
    new Phaser.Math.Vector2(left, top + corner),
  ];
}

/** Estilo de desenho de um painel. */
export interface PanelStyle {
  fill: number;
  fillAlpha: number;
  border: number;
  borderWidth: number;
  corner: number;
  /** Desenha "cantoneiras" de destaque nos cantos (detalhe tecnológico). */
  brackets?: number;
}

/** Desenha (ou redesenha) um painel chanfrado em um Graphics. */
export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  style: PanelStyle,
): void {
  const points = chamferPoints(x, y, width, height, style.corner);
  g.fillStyle(style.fill, style.fillAlpha).fillPoints(points, true);
  g.lineStyle(style.borderWidth, style.border, 1).strokePoints(points, true);

  if (style.brackets !== undefined) {
    // Pequenos "L" nos cantos que não foram cortados
    const size = 14;
    const left = x - width / 2 - 4;
    const right = x + width / 2 + 4;
    const top = y - height / 2 - 4;
    const bottom = y + height / 2 + 4;
    g.lineStyle(2, style.brackets, 1);
    g.lineBetween(right - size, top, right, top).lineBetween(right, top, right, top + size);
    g.lineBetween(left, bottom - size, left, bottom).lineBetween(left, bottom, left + size, bottom);
  }
}

/**
 * Cria um painel pronto na cena (fundo escuro translúcido, borda neon).
 * @returns o Graphics do painel
 */
export function addPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  style: Partial<PanelStyle> = {},
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  drawPanel(g, x, y, width, height, {
    fill: theme.colors.panel,
    fillAlpha: 0.88,
    border: theme.colors.buttonBorder,
    borderWidth: 2,
    corner: 18,
    brackets: theme.colors.primary,
    ...style,
  });
  return g;
}
