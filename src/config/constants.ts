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

/**
 * Paleta de cores usada nas telas (formato 0xRRGGBB para o Phaser).
 * As cenas NÃO usam esta paleta direto: usam theme.colors (Theme.ts),
 * que troca para a paleta de alto contraste quando ela está ligada.
 */
export const COLORS = {
  background: 0x0b0e1a,
  panel: 0x161b33,
  primary: 0x4fc3f7,
  accent: 0xffd54f,
  buttonIdle: 0x283069,
  buttonFocus: 0x3949ab,
  buttonDisabled: 0x2a2d3e,
  buttonBorder: 0x7986cb,
  danger: 0xef5350,
  hudBackground: 0x0f1328,
  hudBorder: 0x3949ab,
};

/** As mesmas cores em formato texto (CSS), usadas pelos objetos de texto. */
export const TEXT_COLORS = {
  title: '#ffd54f',
  normal: '#e8eaf6',
  success: '#81c784',
  danger: '#ef5350',
  portalOpen: '#ce93d8',
  muted: '#9fa8da',
  disabled: '#5c6080',
};

// ---------------- Acessibilidade ----------------

/** Alto contraste: fundo preto, texto branco e destaques em amarelo forte. */
export const HIGH_CONTRAST_COLORS: typeof COLORS = {
  background: 0x000000,
  panel: 0x000000,
  primary: 0x00e5ff,
  accent: 0xffff00,
  buttonIdle: 0x000000,
  buttonFocus: 0x333300,
  buttonDisabled: 0x000000,
  buttonBorder: 0xffffff,
  danger: 0xff5252,
  hudBackground: 0x000000,
  hudBorder: 0xffffff,
};

export const HIGH_CONTRAST_TEXT_COLORS: typeof TEXT_COLORS = {
  title: '#ffff00',
  normal: '#ffffff',
  success: '#69f0ae',
  danger: '#ff5252',
  portalOpen: '#ff80ff',
  muted: '#ffffff',
  disabled: '#9e9e9e',
};

/** "Texto maior": todas as fontes ficam 20% maiores. */
export const LARGE_TEXT_SCALE = 1.2;

/** Fonte padrão de todos os textos. */
export const FONT_FAMILY = 'Arial, Helvetica, sans-serif';

/** Tamanhos padrão dos botões. */
export const BUTTON = {
  width: 280,
  height: 52,
  fontSize: 22,
  spacing: 66, // distância vertical entre botões empilhados
};

/** Tamanhos do controle deslizante (Slider). */
export const SLIDER = {
  width: 300,
  trackHeight: 10,
  handleRadius: 11,
  fontSize: 20,
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
  // Versões de alto contraste do labirinto: paredes claras e chão preto
  wallHighContrast: 0xe0e0e0,
  wallBorderHighContrast: 0x757575,
  floorHighContrast: 0x000000,
  floorLineHighContrast: 0x1a1a1a,
  player: 0x4caf50,
  crystal: 0x4dd0e1,
  crystalShine: 0xe0f7fa,
  portalLocked: 0x616161,
  portalOpen: 0xba68c8,
  portalCore: 0xffd54f,
  enemy: 0xe53935,
  enemyEye: 0xffffff,
  star: 0xffd54f,
  starEmpty: 0x3a3f5c,
};

/** Chaves das texturas (imagens) usadas no jogo. */
export const TEXTURES = {
  WALL: 'wall',
  FLOOR: 'floor',
  WALL_HC: 'wall-hc', // alto contraste
  FLOOR_HC: 'floor-hc',
  PLAYER: 'player',
  CRYSTAL: 'crystal',
  PORTAL_LOCKED: 'portal-locked',
  PORTAL_OPEN: 'portal-open',
  ENEMY: 'enemy',
} as const;

/** Quantidade de cristais necessária para liberar o portal. */
export const CRYSTALS_TO_UNLOCK = 3;

/**
 * Eventos que a GameScene emite em this.game.events.
 * A HudScene escuta esses eventos e só atualiza a interface.
 */
export const GAME_EVENTS = {
  CRYSTAL_COLLECTED: 'crystal-collected', // (coletados: number, total: number)
  PORTAL_UNLOCKED: 'portal-unlocked', // ()
  TIME_CHANGED: 'time-changed', // (segundosRestantes: number)
  PLAYER_HIT: 'player-hit', // (segundosPerdidos: number)
} as const;

/** Tamanhos e tempos do HUD (as cores ficam em COLORS.hud*). */
export const HUD = {
  fontSize: 20,
  messageDuration: 1800, // ms que a mensagem "Portal liberado!" fica na tela
  tipDuration: 4500, // ms que a dica inicial da fase 1 fica na tela
};

/** Dica mostrada na primeira vez que o jogador entra na fase 1. */
export const FIRST_TIP = 'Colete os 3 cristais e entre no portal';

/** Tempo (ms) entre o fim da fase (vitória ou derrota) e a tela de resultado. */
export const LEVEL_END_DELAY = 1200;

/** Cronômetro: a partir de quantos segundos restantes o tempo fica vermelho. */
export const TIME_WARNING_SECONDS = 10;

// ---------------- Obstáculos ----------------

export const OBSTACLE = {
  damageSeconds: 5, // segundos que o jogador perde ao ser tocado
  invulnerableMs: 1500, // tempo de invencibilidade depois do dano
  blinkMs: 100, // velocidade do "piscar" do jogador
  bodySize: 22,
};

// ---------------- Pontuação ----------------
// pontos = 1000 + (tempo restante × 10) − (danos × 100), mínimo 0

export const SCORE = {
  base: 1000,
  perSecondLeft: 10,
  perDamage: 100,
  threeStarsRatio: 0.5, // mais de 50% do tempo sobrando = 3 estrelas
  twoStarsRatio: 0.25, // mais de 25% = 2 estrelas; senão 1
};

// ---------------- Jogador ----------------

export const PLAYER = {
  speed: 160, // pixels por segundo
  bodySize: 22, // caixa de colisão menor que o tile, para passar nos corredores
  cornerAssist: 8, // força da "ajuda nas curvas" (alinha o jogador ao corredor)
};

// ---------------- Áudio ----------------

/**
 * Chaves (nomes) de todos os sons do jogo.
 * Se existir um arquivo carregado com essa chave, ele é usado;
 * senão o som é gerado pelo código (veja SoundSynth.ts).
 */
export const SOUNDS = {
  MUSIC_MENU: 'music-menu',
  MUSIC_GAME: 'music-game',
  CRYSTAL: 'sfx-crystal',
  PORTAL: 'sfx-portal',
  HIT: 'sfx-hit',
  VICTORY: 'sfx-victory',
  DEFEAT: 'sfx-defeat',
  CLICK: 'sfx-click',
} as const;

/** Valores do controle de volume. */
export const AUDIO = {
  defaultMaster: 0.8, // volume geral inicial (80%)
  defaultMusic: 0.6,
  defaultSfx: 0.8,
  step: 0.1, // + / - mudam o volume em 10%
};

/** Evento emitido em this.game.events sempre que o volume ou o mudo mudam. */
export const AUDIO_EVENTS = {
  VOLUME_CHANGED: 'volume-changed', // (settings: Settings)
} as const;

/** Chaves usadas no localStorage do navegador. */
export const STORAGE_KEYS = {
  SETTINGS: 'labirinto-do-tempo:settings',
  PROGRESS: 'labirinto-do-tempo:progress',
} as const;

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
