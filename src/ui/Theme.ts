// =============================================================
// Theme.ts — estilo dos textos em um só lugar.
// Todas as telas pedem o estilo por aqui, assim fica fácil mudar
// a fonte de todo o jogo de uma vez.
// =============================================================
import Phaser from 'phaser';
import { FONT_FAMILY, TEXT_COLORS } from '../config/constants';

/**
 * Cria o estilo de um texto.
 * @param size  tamanho da fonte em pixels
 * @param color cor no formato CSS ('#ffffff')
 * @param bold  se o texto fica em negrito
 */
export function textStyle(
  size: number,
  color: string = TEXT_COLORS.normal,
  bold = false,
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    color,
    fontStyle: bold ? 'bold' : 'normal',
  };
}

/** Formata segundos como "mm:ss" (ex.: 75 → "01:15"). */
export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
