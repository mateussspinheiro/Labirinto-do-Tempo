// =============================================================
// Button.ts — botão reutilizável que funciona com mouse e teclado.
//
// - Button: painel com cantos cortados, borda neon e texto na fonte
//   Orbitron. Selecionado, ele acende (brilho + barra lateral).
// - ButtonGroup: junta vários botões (ou sliders) e deixa o jogador
//   escolher com as setas (ou W/S) e confirmar com Enter ou Espaço.
// =============================================================
import Phaser from 'phaser';
import { BUTTON, GLOW, SOUNDS } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { drawPanel } from './Panel';
import { addGlow, theme, titleStyle } from './Theme';

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
  /** Setas esquerda/direita (sliders e seletores usam). */
  adjust?(direction: number): void;
}

/** Opções de aparência do botão (todas opcionais). */
export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
}

export class Button extends Phaser.GameObjects.Container implements Focusable {
  private background: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private glow: Phaser.Filters.Glow | null;
  private onClick: () => void;
  private focused = false;
  private enabled = true;
  private buttonWidth: number;
  private buttonHeight: number;

  /** Chamado quando o mouse passa por cima (o ButtonGroup usa para mover o foco). */
  public onHover?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    options: ButtonOptions = {},
  ) {
    super(scene, x, y);
    this.onClick = onClick;
    this.buttonWidth = options.width ?? BUTTON.width;
    this.buttonHeight = options.height ?? BUTTON.height;

    // Fundo desenhado com Graphics (redesenhado a cada mudança de estado)
    this.background = scene.add.graphics();
    // Brilho neon: criado uma vez e só ligado quando o botão está selecionado
    this.glow = addGlow(this.background, theme.colors.primary, GLOW.soft);

    // Texto em maiúsculas, com espaço entre as letras (visual tecnológico)
    this.label = scene.add
      .text(0, 0, text.toUpperCase(), titleStyle(options.fontSize ?? BUTTON.fontSize, theme.text.normal))
      .setOrigin(0.5)
      .setLetterSpacing(2);

    // Área invisível que recebe o mouse
    const hitArea = scene.add.zone(0, 0, this.buttonWidth, this.buttonHeight).setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => this.onHover?.());
    hitArea.on('pointerdown', () => this.press());

    this.add([this.background, this.label, hitArea]);
    scene.add.existing(this);
    this.refresh();
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

  /** Habilita ou desabilita o botão (desabilitado fica apagado e não responde). */
  setEnabled(value: boolean): this {
    this.enabled = value;
    this.refresh();
    return this;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setText(text: string): this {
    this.label.setText(text.toUpperCase());
    return this;
  }

  /** Redesenha conforme o estado: normal, selecionado ou desabilitado. */
  private refresh(): void {
    const g = this.background;
    const w = this.buttonWidth;
    const h = this.buttonHeight;
    const active = this.enabled && this.focused;
    g.clear();

    if (!this.enabled) {
      drawPanel(g, 0, 0, w, h, {
        fill: theme.colors.buttonDisabled,
        fillAlpha: 0.8,
        border: theme.colors.buttonDisabled,
        borderWidth: 1,
        corner: BUTTON.corner,
      });
      this.label.setColor(theme.text.disabled);
    } else {
      drawPanel(g, 0, 0, w, h, {
        fill: active ? theme.colors.buttonFocus : theme.colors.buttonIdle,
        fillAlpha: active ? 0.95 : 0.8,
        border: active ? theme.colors.primary : theme.colors.buttonBorder,
        borderWidth: active ? 2.5 : 1.5,
        corner: BUTTON.corner,
      });
      if (active) {
        // Barra de destaque à esquerda e "seta" de seleção
        g.fillStyle(theme.colors.primary, 1).fillRect(-w / 2 + 6, -h / 2 + BUTTON.corner, 3, h - BUTTON.corner * 1.5);
        g.fillTriangle(w / 2 - 22, -5, w / 2 - 22, 5, w / 2 - 14, 0);
      }
      this.label.setColor(active ? theme.text.title : theme.text.normal);
    }

    if (this.glow) this.glow.active = active; // brilho só no botão selecionado
    this.setScale(active ? 1.04 : 1);
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
