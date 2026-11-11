// =============================================================
// LevelNode.ts — uma fase no mapa de fases: hexágono com o número
// da fase e 3 estrelas embaixo. Tem três estados:
//   - concluída: ciano, com as estrelas conquistadas acesas;
//   - disponível: magenta, com um anel pulsando ("jogue aqui!");
//   - bloqueada: apagada, com um cadeado.
// Funciona com mouse e teclado (é um Focusable do ButtonGroup).
// =============================================================
import Phaser from 'phaser';
import { EFFECT_COLORS, GLOW, LEVEL_MAP, SOUNDS } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { Focusable } from './Button';
import { addGlow, cssColor, theme, titleStyle } from './Theme';

export type LevelNodeState = 'completed' | 'available' | 'locked';

const MAX_STARS = 3;

/** Vértices de um hexágono de "raio" r, centrado em (0, 0). */
export function hexagonPoints(r: number): Phaser.Math.Vector2[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = Phaser.Math.DegToRad(60 * i - 90);
    return new Phaser.Math.Vector2(Math.cos(angle) * r, Math.sin(angle) * r);
  });
}

export class LevelNode extends Phaser.GameObjects.Container implements Focusable {
  private nodeState: LevelNodeState;
  private shape: Phaser.GameObjects.Graphics;
  private glow: Phaser.Filters.Glow | null;
  private onSelect: () => void;
  private onFocus: () => void;
  private focused = false;

  public onHover?: () => void;

  /**
   * @param number   número mostrado no hexágono
   * @param stars    estrelas conquistadas (0 a 3)
   * @param onSelect Enter/clique: começar a fase
   * @param onFocus  quando a fase é selecionada (o mapa move o Rafael até ela)
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    number: number,
    state: LevelNodeState,
    stars: number,
    onSelect: () => void,
    onFocus: () => void,
  ) {
    super(scene, x, y);
    this.nodeState = state;
    this.onSelect = onSelect;
    this.onFocus = onFocus;
    const r = LEVEL_MAP.nodeRadius;
    const color = this.color();

    // Anel pulsando em volta da fase disponível
    if (state === 'available') {
      const ring = scene.add.graphics();
      ring.lineStyle(2, color, 1).strokePoints(hexagonPoints(r + 10), true);
      this.add(ring);
      scene.tweens.add({ targets: ring, scale: 1.25, alpha: 0, duration: 1200, repeat: -1 });
    }

    // Hexágono (redesenhado quando muda o foco)
    this.shape = scene.add.graphics();
    this.glow = addGlow(this.shape, color, GLOW.soft);
    this.add(this.shape);

    // Número da fase ou cadeado
    if (state === 'locked') {
      this.add(this.drawLock());
    } else {
      this.add(scene.add.text(0, 0, String(number), titleStyle(26, cssColor(color))).setOrigin(0.5));
    }

    // Estrelas embaixo do hexágono
    for (let i = 0; i < MAX_STARS; i++) {
      const filled = i < stars;
      const star = scene.add.star((i - 1) * 22, r + 20, 5, 4, 9, filled ? EFFECT_COLORS.star : EFFECT_COLORS.starEmpty);
      if (filled) addGlow(star, EFFECT_COLORS.star, GLOW.soft);
      this.add(star);
    }

    // Área de clique
    const zone = scene.add.zone(0, 0, r * 2, r * 2).setInteractive({ useHandCursor: state !== 'locked' });
    zone.on('pointerover', () => this.onHover?.());
    zone.on('pointerdown', () => this.press());
    this.add(zone);

    scene.add.existing(this);
    this.redraw();
  }

  // ---- Métodos do Focusable ----

  press(): void {
    if (!this.isEnabled()) return;
    AudioManager.get().playSfx(SOUNDS.CLICK);
    this.onSelect();
  }

  /** Fases bloqueadas não podem ser selecionadas. */
  isEnabled(): boolean {
    return this.nodeState !== 'locked';
  }

  setFocused(value: boolean): this {
    const changed = value && !this.focused;
    this.focused = value;
    this.redraw();
    if (changed) this.onFocus();
    return this;
  }

  // ---- Funções internas ----

  /** Cor conforme o estado. */
  private color(): number {
    if (this.nodeState === 'completed') return theme.colors.primary;
    if (this.nodeState === 'available') return theme.colors.secondary;
    return theme.colors.buttonBorder;
  }

  private redraw(): void {
    const g = this.shape;
    const r = LEVEL_MAP.nodeRadius;
    g.clear();
    g.fillStyle(this.nodeState === 'locked' ? theme.colors.buttonDisabled : theme.colors.panel, 0.95);
    g.fillPoints(hexagonPoints(r), true);
    g.lineStyle(this.focused ? 4 : 2.5, this.focused ? 0xffffff : this.color(), 1);
    g.strokePoints(hexagonPoints(r), true);
    // Hexágono interno fino (detalhe)
    g.lineStyle(1, this.color(), 0.5).strokePoints(hexagonPoints(r - 7), true);

    if (this.glow) this.glow.active = this.nodeState !== 'locked';
    this.setScale(this.focused ? 1.12 : 1);
  }

  /** Cadeado simples: arco (alça) + retângulo (corpo). */
  private drawLock(): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    const color = theme.colors.buttonBorder;
    g.lineStyle(3, color, 1);
    g.beginPath();
    g.arc(0, -4, 7, Math.PI, 0);
    g.strokePath();
    g.fillStyle(color, 1).fillRect(-10, -4, 20, 15);
    g.fillStyle(theme.colors.buttonDisabled, 1).fillRect(-2, 1, 4, 6);
    return g;
  }
}
