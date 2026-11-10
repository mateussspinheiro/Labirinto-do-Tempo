// =============================================================
// ScreenFrame.ts — moldura padrão das telas secundárias.
// Toda tela secundária mostra o título do jogo, o nome da tela e
// um botão "Voltar ao menu" (que também funciona com a tecla ESC).
// =============================================================
import Phaser from 'phaser';
import { COLORS, GAME_TITLE, GAME_WIDTH, GAME_HEIGHT, SCENES, TEXT_COLORS } from '../config/constants';
import { Button } from './Button';
import { textStyle } from './Theme';

/** Posição vertical do botão de voltar (rodapé da tela). */
const BACK_BUTTON_Y = GAME_HEIGHT - 50;

/** Opções para telas abertas fora do menu (ex.: "Como Jogar" aberto pela pausa). */
export interface ScreenFrameOptions {
  /** O que fazer ao voltar (padrão: ir para o menu). */
  onBack?: () => void;
  /** Texto do botão (padrão: "Voltar ao menu"). */
  backLabel?: string;
  /** Desenha um fundo opaco (quando a tela abre por cima da partida). */
  opaque?: boolean;
}

/**
 * Desenha o cabeçalho e o botão de voltar.
 * @returns o botão de voltar, para a cena incluir no seu ButtonGroup.
 */
export function addScreenFrame(scene: Phaser.Scene, screenTitle: string, options: ScreenFrameOptions = {}): Button {
  if (options.opaque) {
    scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background).setOrigin(0);
  }

  scene.add.text(GAME_WIDTH / 2, 30, GAME_TITLE, textStyle(20, TEXT_COLORS.muted, true)).setOrigin(0.5);
  scene.add.text(GAME_WIDTH / 2, 70, screenTitle, textStyle(36, TEXT_COLORS.title, true)).setOrigin(0.5);

  const goBack = options.onBack ?? (() => scene.scene.start(SCENES.MENU));
  scene.input.keyboard?.on('keydown-ESC', goBack);

  return new Button(scene, GAME_WIDTH / 2, BACK_BUTTON_Y, options.backLabel ?? 'Voltar ao menu', goBack);
}
