// =============================================================
// Theme.ts — aparência (cores, fontes e brilho neon) em um só
// lugar, incluindo as opções de ACESSIBILIDADE:
//   - alto contraste: troca a paleta de cores por uma de contraste
//     forte e desliga os brilhos (fica mais nítido);
//   - texto maior: aumenta todas as fontes em 20%.
//
// Todas as telas pegam as cores em theme.colors / theme.text e os
// estilos de texto em textStyle() / titleStyle(). Como as cenas são
// recriadas toda vez que abrem, basta mudar o "theme" para a próxima
// tela já sair com a nova aparência.
// =============================================================
import Phaser from 'phaser';
import {
  COLORS,
  FONTS,
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
  document.body.style.backgroundColor = cssColor(theme.colors.background);
}

/** Tamanho final da fonte (20% maior com "texto maior"). */
function fontSize(size: number): string {
  return `${Math.round(size * (theme.largeText ? LARGE_TEXT_SCALE : 1))}px`;
}

/**
 * Estilo de texto comum (fonte Exo 2, fácil de ler).
 * @param size  tamanho da fonte em pixels
 * @param color cor no formato CSS ('#ffffff')
 * @param bold  se o texto fica em negrito
 */
export function textStyle(
  size: number,
  color: string = theme.text.normal,
  bold = false,
): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FONTS.BODY, fontSize: fontSize(size), color, fontStyle: bold ? 'bold' : 'normal' };
}

/** Estilo de título, botão ou número (fonte Orbitron, com cara de tecnologia). */
export function titleStyle(size: number, color: string = theme.text.title): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FONTS.TITLE, fontSize: fontSize(size), color, fontStyle: 'bold' };
}

/** Objeto do Phaser que aceita filtros (Text, Image, Sprite, Graphics...). */
type Filterable = Phaser.GameObjects.GameObject & {
  enableFilters(): unknown;
  filters: Phaser.Types.GameObjects.FiltersInternalExternal | null;
};

/**
 * Brilho neon em volta de um objeto, usando o filtro Glow do Phaser 4.
 * Só funciona no modo WebGL e fica desligado no alto contraste.
 * @returns o filtro criado (para ligar/desligar depois com .active), ou null
 */
export function addGlow(obj: Filterable, color: number, strength: number): Phaser.Filters.Glow | null {
  if (theme.highContrast || obj.scene.renderer.type !== Phaser.WEBGL) return null;
  obj.enableFilters();
  // Parâmetros: cor, força do brilho para fora, força para dentro
  const glow = obj.filters?.internal.addGlow(color, strength, 0) ?? null;
  // Reserva espaço em volta do objeto para o brilho não ficar "cortado"
  glow?.setPaddingOverride(null);
  return glow;
}

/**
 * Pinta um texto com degradê vertical (ex.: ciano em cima, magenta embaixo).
 * Usa o "context" de desenho do próprio texto (Canvas 2D).
 */
export function setGradient(text: Phaser.GameObjects.Text, top: string, bottom: string): void {
  if (theme.highContrast) return; // no alto contraste, cor sólida é mais legível
  const gradient = text.context.createLinearGradient(0, 0, 0, text.height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  text.setFill(gradient);
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

/** Converte uma cor 0xRRGGBB no texto CSS '#rrggbb'. */
export function cssColor(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}
