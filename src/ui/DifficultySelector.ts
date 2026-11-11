// =============================================================
// DifficultySelector.ts — seletor das 4 dificuldades
// (Fácil, Médio, Difícil, Expert), lado a lado.
//   - Teclado: com o seletor em foco, setas ←/→ trocam a dificuldade
//     e Enter passa para a próxima.
//   - Mouse: clique na dificuldade desejada.
// Abaixo dele aparece a descrição e o que muda em cada modo.
// =============================================================
import Phaser from 'phaser';
import { DIFFICULTIES, GLOW, SOUNDS } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import type { DifficultyId } from '../types';
import type { Focusable } from './Button';
import { drawPanel } from './Panel';
import { addGlow, textStyle, theme, titleStyle } from './Theme';

const SEGMENT_HEIGHT = 40;
const GAP = 8;
const CORNER = 8;

export class DifficultySelector extends Phaser.GameObjects.Container implements Focusable {
  private index: number;
  private focused = false;
  private segmentWidth: number;
  private onChange: (id: DifficultyId) => void;

  private segments: Phaser.GameObjects.Graphics[] = [];
  private labels: Phaser.GameObjects.Text[] = [];
  private title: Phaser.GameObjects.Text;
  private description: Phaser.GameObjects.Text;
  private arrows: Phaser.GameObjects.Text;

  public onHover?: () => void;

  /**
   * @param x,y      centro do seletor
   * @param width    largura total
   * @param current  dificuldade inicial
   * @param onChange chamada quando o jogador escolhe outra dificuldade
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    current: DifficultyId,
    onChange: (id: DifficultyId) => void,
  ) {
    super(scene, x, y);
    this.onChange = onChange;
    this.index = Math.max(
      0,
      DIFFICULTIES.findIndex((d) => d.id === current),
    );
    this.segmentWidth = (width - GAP * (DIFFICULTIES.length - 1)) / DIFFICULTIES.length;

    this.title = scene.add
      .text(-width / 2, -SEGMENT_HEIGHT / 2 - 16, 'DIFICULDADE', titleStyle(12, theme.text.muted))
      .setOrigin(0, 0.5)
      .setLetterSpacing(4);
    this.arrows = scene.add
      .text(width / 2, -SEGMENT_HEIGHT / 2 - 16, '◀  ▶', titleStyle(12, theme.text.title))
      .setOrigin(1, 0.5);
    this.description = scene.add.text(0, SEGMENT_HEIGHT / 2 + 18, '', textStyle(15, theme.text.muted)).setOrigin(0.5);
    this.add([this.title, this.arrows, this.description]);

    // Um "botão" para cada dificuldade
    DIFFICULTIES.forEach((difficulty, i) => {
      const segX = -width / 2 + this.segmentWidth / 2 + i * (this.segmentWidth + GAP);
      const g = scene.add.graphics({ x: segX });
      const label = scene.add.text(segX, 0, difficulty.nome.toUpperCase(), titleStyle(13)).setOrigin(0.5);
      const zone = scene.add.zone(segX, 0, this.segmentWidth, SEGMENT_HEIGHT).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.onHover?.());
      zone.on('pointerdown', () => this.select(i));
      addGlow(g, difficulty.cor, GLOW.soft);
      this.segments.push(g);
      this.labels.push(label);
      this.add([g, label, zone]);
    });

    scene.add.existing(this);
    this.refresh();
  }

  // ---- Métodos do Focusable (navegação por teclado) ----

  /** Setas ←/→: dificuldade anterior/seguinte. */
  adjust(direction: number): void {
    this.select(Phaser.Math.Clamp(this.index + direction, 0, DIFFICULTIES.length - 1));
  }

  /** Enter: passa para a próxima dificuldade (e volta para a primeira no fim). */
  press(): void {
    this.select((this.index + 1) % DIFFICULTIES.length);
  }

  isEnabled(): boolean {
    return true;
  }

  setFocused(value: boolean): this {
    this.focused = value;
    this.refresh();
    return this;
  }

  // ---- Funções internas ----

  private select(i: number): void {
    if (i === this.index) return;
    this.index = i;
    AudioManager.get().playSfx(SOUNDS.CLICK);
    this.refresh();
    this.onChange(DIFFICULTIES[i].id);
  }

  /** Redesenha: a escolhida fica colorida; as outras, apagadas. */
  private refresh(): void {
    DIFFICULTIES.forEach((difficulty, i) => {
      const selected = i === this.index;
      const g = this.segments[i];
      g.clear();
      drawPanel(g, 0, 0, this.segmentWidth, SEGMENT_HEIGHT, {
        fill: selected ? difficulty.cor : theme.colors.buttonIdle,
        fillAlpha: selected ? 0.22 : 0.8,
        border: selected ? difficulty.cor : theme.colors.buttonBorder,
        borderWidth: selected ? 2.5 : 1,
        corner: CORNER,
      });
      g.filters?.internal.list.forEach((filter) => (filter.active = selected));
      this.labels[i].setColor(selected ? '#ffffff' : theme.text.muted);
    });

    // Descrição do modo escolhido e o que ele muda
    const d = DIFFICULTIES[this.index];
    this.description.setText(
      `${d.descricao}  ·  tempo ×${d.tempo}  ·  monstros ×${d.velocidade}  ·  pontos ×${d.pontos}`,
    );

    // Em foco: título destacado e setas visíveis
    this.title.setColor(this.focused ? theme.text.title : theme.text.muted);
    this.arrows.setVisible(this.focused);
  }
}
