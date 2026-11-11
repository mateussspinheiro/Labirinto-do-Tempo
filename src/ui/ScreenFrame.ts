// =============================================================
// ScreenFrame.ts — moldura padrão das telas secundárias.
// Toda tela secundária tem: o fundo tecnológico animado, o nome do
// jogo, o título da tela com brilho neon e um botão
// "Voltar ao menu" (que também funciona com a tecla ESC).
// =============================================================
import Phaser from 'phaser';
import { GAME_TITLE, GAME_WIDTH, GAME_HEIGHT, GLOW, SCENES } from '../config/constants';
import { Button } from './Button';
import { addTechBackground } from './TechBackground';
import { addGlow, theme, titleStyle } from './Theme';
import { goToScene } from './Transition';

/** Posição vertical do botão de voltar (rodapé da tela). */
const BACK_BUTTON_Y = GAME_HEIGHT - 45;

/** Opções para telas abertas fora do menu (ex.: "Como Jogar" aberto pela pausa). */
export interface ScreenFrameOptions {
  /** O que fazer ao voltar (padrão: ir para o menu). */
  onBack?: () => void;
  /** Texto do botão (padrão: "Voltar ao menu"). */
  backLabel?: string;
}

/**
 * Desenha o fundo, o cabeçalho e o botão de voltar.
 * @returns o botão de voltar, para a cena incluir no seu ButtonGroup.
 */
export function addScreenFrame(scene: Phaser.Scene, screenTitle: string, options: ScreenFrameOptions = {}): Button {
  // Grade plana e discreta: estas telas têm bastante texto para ler
  addTechBackground(scene, { variant: 'game' });

  // Nome do jogo pequeno, com linhas decorativas dos lados
  scene.add
    .text(GAME_WIDTH / 2, 26, GAME_TITLE.toUpperCase(), titleStyle(12, theme.text.muted))
    .setOrigin(0.5)
    .setLetterSpacing(6);
  const lines = scene.add.graphics();
  lines.lineStyle(1, theme.colors.primary, 0.6);
  lines.lineBetween(GAME_WIDTH / 2 - 260, 26, GAME_WIDTH / 2 - 150, 26);
  lines.lineBetween(GAME_WIDTH / 2 + 150, 26, GAME_WIDTH / 2 + 260, 26);

  // Título da tela com brilho neon
  const title = scene.add.text(GAME_WIDTH / 2, 62, screenTitle.toUpperCase(), titleStyle(30)).setOrigin(0.5);
  title.setLetterSpacing(3);
  addGlow(title, theme.colors.primary, GLOW.title);

  const goBack = options.onBack ?? (() => goToScene(scene, SCENES.MENU));
  scene.input.keyboard?.on('keydown-ESC', goBack);

  return new Button(scene, GAME_WIDTH / 2, BACK_BUTTON_Y, options.backLabel ?? 'Voltar ao menu', goBack);
}
