// =============================================================
// Slider.ts — controle deslizante reutilizável (usado no volume).
//
// Mostra um rótulo, uma barra com preenchimento, uma "bolinha" e a
// porcentagem. O valor vai de 0 a 1.
//   - Mouse: clique ou arraste sobre a barra.
//   - Teclado: com o slider selecionado, setas ←/→ mudam 10%.
// Sempre que o valor muda, chama a função onChange(valor).
// =============================================================
import Phaser from 'phaser';
import { AUDIO, COLORS, SLIDER, TEXT_COLORS } from '../config/constants';
import type { Focusable } from './Button';
import { textStyle } from './Theme';

export class Slider extends Phaser.GameObjects.Container implements Focusable {
  private value: number;
  private onChange: (value: number) => void;
  private dragging = false;

  private labelText: Phaser.GameObjects.Text;
  private valueText: Phaser.GameObjects.Text;
  private fill: Phaser.GameObjects.Rectangle;
  private handle: Phaser.GameObjects.Arc;

  public onHover?: () => void;

  /**
   * @param x,y      centro da barra na tela
   * @param label    texto acima da barra (ex.: "Música")
   * @param value    valor inicial (0 a 1)
   * @param onChange chamada quando o jogador muda o valor
   */
  constructor(scene: Phaser.Scene, x: number, y: number, label: string, value: number, onChange: (value: number) => void) {
    super(scene, x, y);
    this.value = value;
    this.onChange = onChange;

    const half = SLIDER.width / 2;

    // Rótulo à esquerda e porcentagem à direita, acima da barra
    this.labelText = scene.add.text(-half, -24, label, textStyle(SLIDER.fontSize, TEXT_COLORS.normal, true)).setOrigin(0, 0.5);
    this.valueText = scene.add.text(half, -24, '', textStyle(SLIDER.fontSize, TEXT_COLORS.normal, true)).setOrigin(1, 0.5);

    // Barra de fundo, preenchimento (parte "cheia") e bolinha
    const track = scene.add.rectangle(0, 0, SLIDER.width, SLIDER.trackHeight, COLORS.buttonIdle).setStrokeStyle(1, COLORS.buttonBorder);
    this.fill = scene.add.rectangle(-half, 0, 0, SLIDER.trackHeight, COLORS.primary).setOrigin(0, 0.5);
    this.handle = scene.add.circle(0, 0, SLIDER.handleRadius, COLORS.accent);

    // Área invisível maior que a barra, para facilitar o clique
    const hitArea = scene.add.rectangle(0, 0, SLIDER.width + SLIDER.handleRadius * 2, SLIDER.handleRadius * 3, 0x000000, 0);

    this.add([this.labelText, this.valueText, track, this.fill, this.handle, hitArea]);
    scene.add.existing(this);

    // ---- Mouse ----
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => this.onHover?.());
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.setFromPointer(pointer);
    });
    // Enquanto o botão do mouse estiver apertado, acompanha o arraste
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging && pointer.isDown) this.setFromPointer(pointer);
    });
    scene.input.on('pointerup', () => (this.dragging = false));

    this.redraw();
  }

  getValue(): number {
    return this.value;
  }

  /** Muda o valor (0 a 1). Se notify = true, avisa o onChange. */
  setValue(value: number, notify = true): void {
    const newValue = Math.round(Phaser.Math.Clamp(value, 0, 1) * 100) / 100;
    if (newValue === this.value) return;
    this.value = newValue;
    this.redraw();
    if (notify) this.onChange(this.value);
  }

  // ---- Métodos do Focusable (navegação por teclado) ----

  /** Setas ←/→: muda o valor em 10%. */
  adjust(direction: number): void {
    this.setValue(this.value + direction * AUDIO.step);
  }

  press(): void {
    // Enter não faz nada no slider (o ajuste é pelas setas)
  }

  isEnabled(): boolean {
    return true;
  }

  setFocused(value: boolean): this {
    this.labelText.setColor(value ? TEXT_COLORS.title : TEXT_COLORS.normal);
    this.handle.setStrokeStyle(value ? 4 : 0, COLORS.primary);
    this.handle.setRadius(value ? SLIDER.handleRadius + 2 : SLIDER.handleRadius);
    return this;
  }

  // ---- Funções internas ----

  /** Converte a posição do mouse em valor (0 = ponta esquerda, 1 = direita). */
  private setFromPointer(pointer: Phaser.Input.Pointer): void {
    const left = this.x - SLIDER.width / 2;
    this.setValue((pointer.x - left) / SLIDER.width);
  }

  /** Atualiza o desenho conforme o valor atual. */
  private redraw(): void {
    const half = SLIDER.width / 2;
    this.fill.width = SLIDER.width * this.value;
    this.handle.x = -half + SLIDER.width * this.value;
    this.valueText.setText(`${Math.round(this.value * 100)}%`);
  }
}
