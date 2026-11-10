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

// ---------------- Labirinto ----------------

/** Tamanho de cada quadrado (tile) do labirinto, em pixels. */
export const TILE_SIZE = 32;

/** Altura da faixa do HUD no topo da tela (o labirinto fica abaixo dela). */
export const HUD_HEIGHT = 48;

/** Símbolos usados nos mapas de texto das fases. */
export const MAP_CHARS = {
  WALL: '#',
  FLOOR: '.',
  PLAYER: 'P',
  CRYSTAL: 'C',
  PORTAL: 'X',
  ENEMY: 'E',
} as const;

/** Cores do labirinto (usadas para gerar as texturas). */
export const MAZE_COLORS = {
  wall: 0x3f51b5,
  wallBorder: 0x1a237e,
  floor: 0x1b2040,
  floorLine: 0x232a52,
  player: 0x4caf50,
};

/** Chaves das texturas (imagens) usadas no jogo. */
export const TEXTURES = {
  WALL: 'wall',
  FLOOR: 'floor',
  PLAYER: 'player',
} as const;

// ---------------- Jogador ----------------

export const PLAYER = {
  speed: 160, // pixels por segundo
  bodySize: 22, // caixa de colisão menor que o tile, para passar nos corredores
  cornerAssist: 8, // força da "ajuda nas curvas" (alinha o jogador ao corredor)
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
