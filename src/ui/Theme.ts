// =============================================================
// Theme.ts — aparência (cores e textos) em um só lugar, incluindo
// as opções de ACESSIBILIDADE:
//   - alto contraste: troca a paleta de cores por uma de contraste forte;
//   - texto maior: aumenta todas as fontes em 20%.
//
// Todas as telas pegam as cores em theme.colors / theme.text e os
// estilos de texto em textStyle(). Como as cenas são recriadas toda
// vez que abrem, basta mudar o "theme" para a próxima tela já sair
// com a nova aparência.
// =============================================================
import Phaser from 'phaser';
import {
  COLORS,
  FONT_FAMILY,
  HIGH_CONTRAST_COLORS,
  HIGH_CONTRAST_TEXT_COLORS,
  LARGE_TEXT_SCALE,
  TEXT_COLORS,
} from '../config/constants';
import { SaveManager } from '../systems/SaveManager';

/** Tema atual. Começa com as cores normais; muda com applyAccessibility(). */
export const theme = {
  colors: { ...COLORS },
  text: { ...TEXT_COLORS },
  highContrast: false,
  largeText: false,
};

/** Carrega as opções salvas (chamado uma vez, na BootScene). */
export function loadAccessibility(): void {
  const settings = SaveManager.loadSettings();
  applyAccessibility(settings.altoContraste, settings.textoGrande);
}

/** Liga/desliga o alto contraste e salva a escolha. */
export function setHighContrast(value: boolean): void {
  applyAccessibility(value, theme.largeText);
  SaveManager.saveSettings({ altoContraste: value });
}

/** Liga/desliga o texto maior e salva a escolha. */
export function setLargeText(value: boolean): void {
  applyAccessibility(theme.highContrast, value);
  SaveManager.saveSettings({ textoGrande: value });
}

/** Copia a paleta escolhida para dentro do objeto "theme". */
function applyAccessibility(highContrast: boolean, largeText: boolean): void {
  theme.highContrast = highContrast;
  theme.largeText = largeText;
  Object.assign(theme.colors, highContrast ? HIGH_CONTRAST_COLORS : COLORS);
  Object.assign(theme.text, highContrast ? HIGH_CONTRAST_TEXT_COLORS : TEXT_COLORS);

  // Cor de fundo da página (o canvas do jogo é transparente)
  document.body.style.backgroundColor = '#' + theme.colors.background.toString(16).padStart(6, '0');
}

/**
 * Cria o estilo de um texto.
 * @param size  tamanho da fonte em pixels (aumenta 20% com "texto maior")
 * @param color cor no formato CSS ('#ffffff')
 * @param bold  se o texto fica em negrito
 */
export function textStyle(
  size: number,
  color: string = theme.text.normal,
  bold = false,
): Phaser.Types.GameObjects.Text.TextStyle {
  const finalSize = Math.round(size * (theme.largeText ? LARGE_TEXT_SCALE : 1));
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${finalSize}px`,
    color,
    fontStyle: bold ? 'bold' : 'normal',
  };
}

/** Estrelas em texto (ex.: 2 → "★★☆"). */
export function starsText(stars: number, max = 3): string {
  return '★'.repeat(stars) + '☆'.repeat(Math.max(0, max - stars));
}

/** Formata segundos como "mm:ss" (ex.: 75 → "01:15"). */
export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
