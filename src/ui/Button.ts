// =============================================================
// Button.ts — botão reutilizável que funciona com mouse e teclado.
//
// - Button: um retângulo com texto. Clique do mouse aciona o botão.
// - ButtonGroup: junta vários botões (ou sliders) e deixa o jogador
//   escolher com as setas (ou W/S) e confirmar com Enter ou Espaço.
// =============================================================
import Phaser from 'phaser';
import { BUTTON, COLORS, SOUNDS, TEXT_COLORS } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { textStyle } from './Theme';

/**
 * Qualquer elemento que pode receber o foco do teclado (botão ou slider).
 * É o "contrato" que o ButtonGroup usa para navegar entre eles.
 */
export interface Focusable {
  setFocused(value: boolean): unknown;
  isEnabled(): boolean;
  /** Enter/Espaço/clique. */
  press(): void;
  /** Avisado quando o mouse passa por cima. */
  onHover?: () => void;
  /** Setas esquerda/direita (só sliders usam). */
  adjust?(direction: number): void;
}

/** Opções de aparência do botão (todas opcionais). */
export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
}

export class Button extends Phaser.GameObjects.Container implements Focusable {
  private background: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private onClick: () => void;
  private focused = false;
  private enabled = true;

  /** Chamado quando o mouse passa por cima (o ButtonGroup usa para mover o foco). */
  public onHover?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, options: ButtonOptions = {}) {
    super(scene, x, y);
    this.onClick = onClick;

    const width = options.width ?? BUTTON.width;
    const height = options.height ?? BUTTON.height;

    // Fundo do botão (centralizado no ponto x,y do container)
    this.background = scene.add
      .rectangle(0, 0, width, height, COLORS.buttonIdle)
      .setStrokeStyle(2, COLORS.buttonBorder);

    this.label = scene.add.text(0, 0, text, textStyle(options.fontSize ?? BUTTON.fontSize, TEXT_COLORS.normal, true)).setOrigin(0.5);

    this.add([this.background, this.label]);
    scene.add.existing(this);

    // Eventos do mouse ficam no retângulo de fundo
    this.background.setInteractive({ useHandCursor: true });
    this.background.on('pointerover', () => this.onHover?.());
    this.background.on('pointerdown', () => this.press());
  }

  /** Aciona o botão (mesmo efeito do clique). */
  press(): void {
    if (!this.enabled) return;
    AudioManager.get().playSfx(SOUNDS.CLICK);
    // Pequena "afundada" visual para dar feedback do clique
    this.scene.tweens.add({ targets: this, scale: 0.95, duration: 60, yoyo: true });
    this.onClick();
  }

  /** Destaca (ou não) o botão quando ele está selecionado pelo teclado/mouse. */
  setFocused(value: boolean): this {
    this.focused = value;
    this.refresh();
    return this;
  }

  /** Habilita ou desabilita o botão (desabilitado fica cinza e não responde). */
  setEnabled(value: boolean): this {
    this.enabled = value;
    this.refresh();
    return this;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  /** Atualiza cores conforme o estado (normal, focado, desabilitado). */
  private refresh(): void {
    if (!this.enabled) {
      this.background.setFillStyle(COLORS.buttonDisabled);
      this.background.setStrokeStyle(2, COLORS.buttonDisabled);
      this.label.setColor(TEXT_COLORS.disabled);
      this.setScale(1);
      return;
    }
    this.background.setFillStyle(this.focused ? COLORS.buttonFocus : COLORS.buttonIdle);
    this.background.setStrokeStyle(this.focused ? 3 : 2, this.focused ? COLORS.accent : COLORS.buttonBorder);
    this.label.setColor(this.focused ? TEXT_COLORS.title : TEXT_COLORS.normal);
    this.setScale(this.focused ? 1.05 : 1);
  }
}

/**
 * Agrupa botões (e sliders) para navegação pelo teclado.
 * Setas cima/baixo (ou W/S) mudam a seleção; esquerda/direita (A/D)
 * ajustam o slider selecionado ou, num botão, também mudam a seleção.
 * Enter ou Espaço confirmam.
 */
export class ButtonGroup {
  private buttons: Focusable[];
  private index = 0;
  /** Quando false, o grupo ignora o teclado (ex.: com uma janela aberta por cima). */
  private active = true;
  private keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null;
  /** Tecla → ação. Guardamos para poder remover os "ouvintes" no destroy(). */
  private handlers: Record<string, () => void>;

  constructor(scene: Phaser.Scene, buttons: Focusable[], startIndex = 0) {
    this.buttons = buttons;

    // Quando o mouse passa em um botão, ele vira o selecionado
    buttons.forEach((button, i) => {
      button.onHover = () => this.focus(i);
    });

    const press = () => this.buttons[this.index]?.press();
    this.handlers = {
      'keydown-UP': () => this.move(-1),
      'keydown-W': () => this.move(-1),
      'keydown-DOWN': () => this.move(1),
      'keydown-S': () => this.move(1),
      'keydown-LEFT': () => this.sideways(-1),
      'keydown-A': () => this.sideways(-1),
      'keydown-RIGHT': () => this.sideways(1),
      'keydown-D': () => this.sideways(1),
      'keydown-ENTER': press,
      'keydown-SPACE': press,
    };

    // Registra cada tecla; a ação só roda se o grupo estiver ativo
    this.keyboard = scene.input.keyboard;
    for (const [event, action] of Object.entries(this.handlers)) {
      this.handlers[event] = () => {
        if (this.active) action();
      };
      this.keyboard?.on(event, this.handlers[event]);
    }

    this.focus(this.firstEnabled(startIndex));
  }

  /** Liga/desliga a navegação por teclado deste grupo. */
  setActive(active: boolean): void {
    this.active = active;
  }

  /** Remove os "ouvintes" do teclado (usado ao fechar uma janela). */
  destroy(): void {
    for (const [event, handler] of Object.entries(this.handlers)) {
      this.keyboard?.off(event, handler);
    }
  }

  /** Seleciona o botão de posição i. */
  focus(i: number): void {
    if (!this.buttons[i]?.isEnabled()) return;
    this.index = i;
    this.buttons.forEach((button, j) => button.setFocused(j === i));
  }

  /** Esquerda/direita: ajusta o slider selecionado ou muda de botão. */
  private sideways(direction: number): void {
    const current = this.buttons[this.index];
    if (current?.adjust) current.adjust(direction);
    else this.move(direction);
  }

  /** Move a seleção para o próximo botão habilitado (dá a volta no fim da lista). */
  private move(direction: number): void {
    const total = this.buttons.length;
    let next = this.index;
    for (let step = 0; step < total; step++) {
      next = (next + direction + total) % total;
      if (this.buttons[next].isEnabled()) {
        this.focus(next);
        return;
      }
    }
  }

  /** Primeiro botão habilitado a partir de "start" (caso o inicial esteja bloqueado). */
  private firstEnabled(start: number): number {
    const total = this.buttons.length;
    for (let step = 0; step < total; step++) {
      const i = (start + step) % total;
      if (this.buttons[i].isEnabled()) return i;
    }
    return start;
  }
}
