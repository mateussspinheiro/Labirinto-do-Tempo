// =============================================================
// constants.ts — todas as constantes do jogo ficam aqui.
// Assim não espalhamos "números mágicos" pelo código: se quiser
// mudar uma cor ou um tamanho, basta alterar neste arquivo.
// =============================================================

/** Título exibido nas telas. */
export const GAME_TITLE = 'Labirinto do Tempo';

/** Tamanho da tela do jogo (em pixels). O Phaser escala para caber na janela. */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

/** Paleta de cores usada nas telas (formato 0xRRGGBB para o Phaser). */
export const COLORS = {
  background: 0x0b0e1a,
  panel: 0x161b33,
  primary: 0x4fc3f7,
  accent: 0xffd54f,
  buttonIdle: 0x283069,
  buttonFocus: 0x3949ab,
  buttonDisabled: 0x2a2d3e,
  buttonBorder: 0x7986cb,
};

/** As mesmas cores em formato texto (CSS), usadas pelos objetos de texto. */
export const TEXT_COLORS = {
  title: '#ffd54f',
  normal: '#e8eaf6',
  muted: '#9fa8da',
  disabled: '#5c6080',
};

/** Fonte padrão de todos os textos. */
export const FONT_FAMILY = 'Arial, Helvetica, sans-serif';

/** Tamanhos padrão dos botões. */
export const BUTTON = {
  width: 280,
  height: 52,
  fontSize: 22,
  spacing: 66, // distância vertical entre botões empilhados
};

/** Nomes (chaves) das cenas, para evitar erros de digitação. */
export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  WELCOME: 'WelcomeScene',
  MENU: 'MenuScene',
  LEVEL_SELECT: 'LevelSelectScene',
  GAME: 'GameScene',
  HUD: 'HudScene',
  PAUSE: 'PauseScene',
  RESULT: 'ResultScene',
  HOW_TO_PLAY: 'HowToPlayScene',
  PROGRESS: 'ProgressScene',
  SETTINGS: 'SettingsScene',
  HELP: 'HelpScene',
} as const;
