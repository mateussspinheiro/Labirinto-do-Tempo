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
  background: 0x05070f, // quase preto azulado
  backgroundTop: 0x070b1d, // topo do degradê do fundo
  backgroundBottom: 0x12051f, // base do degradê (roxo escuro)
  panel: 0x0a1226,
  primary: 0x00e5ff, // ciano neon
  secondary: 0xff2bd6, // magenta neon
  accent: 0xffd54f, // dourado (destaques)
  grid: 0x1de9ff, // linhas da grade do fundo
  buttonIdle: 0x0a1630,
  buttonFocus: 0x0f2f4f,
  buttonDisabled: 0x0b0f1c,
  buttonBorder: 0x2a7fa8,
  danger: 0xff4d6d,
  hudBackground: 0x050a18,
  hudBorder: 0x00e5ff,
};

/** As mesmas cores em formato texto (CSS), usadas pelos objetos de texto. */
export const TEXT_COLORS = {
  title: '#7df9ff', // ciano claro
  normal: '#e6f1ff',
  success: '#5dffa0',
  danger: '#ff4d6d',
  portalOpen: '#e07bff',
  muted: '#7f9cc8',
  disabled: '#3d4a66',
  highlight: '#ffd54f',
  secondary: '#ff6be6',
};

// ---------------- Acessibilidade ----------------

/** Alto contraste: fundo preto, texto branco e destaques em amarelo forte. */
export const HIGH_CONTRAST_COLORS: typeof COLORS = {
  background: 0x000000,
  backgroundTop: 0x000000,
  backgroundBottom: 0x000000,
  panel: 0x000000,
  primary: 0x00e5ff,
  secondary: 0xffffff,
  accent: 0xffff00,
  grid: 0x000000,
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
  highlight: '#ffff00',
  secondary: '#ffffff',
};

/** "Texto maior": todas as fontes ficam 20% maiores. */
export const LARGE_TEXT_SCALE = 1.2;

/**
 * Fontes (incluídas no projeto pelo pacote @fontsource, licença OFL):
 *  - TITLE: Orbitron, com cara de tecnologia, para títulos, botões e números;
 *  - BODY: Exo 2, mais fácil de ler, para os textos corridos.
 */
export const FONTS = {
  TITLE: 'Orbitron, Arial, sans-serif',
  BODY: '"Exo 2", Arial, sans-serif',
};

/** Tamanhos padrão dos botões. */
export const BUTTON = {
  width: 280,
  height: 48,
  fontSize: 17,
  spacing: 60, // distância vertical entre botões empilhados
  corner: 12, // tamanho do "corte" diagonal nos cantos
};

/** Força do brilho neon (filtro Glow do Phaser 4). */
export const GLOW = {
  title: 4,
  soft: 3,
  strong: 8,
};

/** Tamanhos do controle deslizante (Slider). */
export const SLIDER = {
  width: 300,
  trackHeight: 10,
  handleRadius: 10,
  fontSize: 14,
};

// ---------------- Labirinto ----------------

/** Tamanho de cada quadrado (tile) do labirinto, em pixels. */
export const TILE_SIZE = 32;

/** Altura da faixa do HUD no topo da tela (o labirinto fica abaixo dela). */
export const HUD_HEIGHT = 52;

/** Símbolos usados nos mapas de texto das fases. */
export const MAP_CHARS = {
  WALL: '#',
  FLOOR: '.',
  PLAYER: 'P',
  CRYSTAL: 'C',
  PORTAL: 'X',
  ENEMY: 'E',
} as const;

/** Cores de efeitos visuais (as imagens em si estão em public/assets/images). */
export const EFFECT_COLORS = {
  star: 0xffd54f,
  starEmpty: 0x3a3f5c,
  crystalParticles: [0x4dd0e1, 0xe0f7fa, 0xffffff],
  portalParticles: [0xba68c8, 0xffd54f, 0xffffff],
};

/**
 * Chaves das texturas (imagens) usadas no jogo. Cada uma corresponde
 * a um arquivo em public/assets/images (gerados por scripts/gerar-sprites.mjs).
 */
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
  PARTICLE: 'particle',
} as const;

/** Tamanho de cada quadro das spritesheets (jogador e inimigo). */
export const FRAME_SIZE = 32;

/**
 * Animações. Os números são os quadros da spritesheet do jogador:
 * 0-2 = de frente (baixo), 3-5 = de costas (cima), 6-8 = de lado.
 * Em cada direção: quadro 0 = parado, 1 e 2 = passos.
 */
export const ANIMS = {
  PLAYER_DOWN: { key: 'player-down', frames: [1, 0, 2, 0], idle: 0 },
  PLAYER_UP: { key: 'player-up', frames: [4, 3, 5, 3], idle: 3 },
  PLAYER_SIDE: { key: 'player-side', frames: [7, 6, 8, 6], idle: 6 },
  ENEMY: { key: 'enemy-float', frames: [0, 1] },
  playerFrameRate: 8,
  enemyFrameRate: 4,
} as const;

/** Tela de carregamento: tempo mínimo (ms) para a animação aparecer inteira. */
export const LOADING = {
  minDuration: 2200,
  segments: 24, // quantidade de "gomos" da barra
  messages: [
    'Inicializando núcleo temporal...',
    'Gerando labirintos...',
    'Carregando cristais de energia...',
    'Calibrando portais...',
    'Despertando os monstros...',
    'Sistema pronto!',
  ],
};

/** Duração (ms) do escurecimento (fade) nas trocas de tela. */
export const FADE_MS = 250;

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

// ---------------- Dificuldades ----------------

/**
 * Modos de dificuldade. Cada um multiplica o tempo da fase e a
 * velocidade dos monstros, define quantos segundos o dano tira e
 * multiplica a pontuação final (quanto mais difícil, mais pontos).
 * Cada dificuldade tem o seu próprio progresso salvo.
 */
export const DIFFICULTIES = [
  {
    id: 'facil',
    nome: 'Fácil',
    cor: 0x5dffa0,
    descricao: 'Mais tempo e monstros lentos',
    tempo: 1.4,
    velocidade: 0.7,
    dano: 3,
    pontos: 0.8,
  },
  {
    id: 'medio',
    nome: 'Médio',
    cor: 0x00e5ff,
    descricao: 'O desafio equilibrado',
    tempo: 1.0,
    velocidade: 1.0,
    dano: 5,
    pontos: 1.0,
  },
  {
    id: 'dificil',
    nome: 'Difícil',
    cor: 0xffa726,
    descricao: 'Menos tempo e monstros rápidos',
    tempo: 0.85,
    velocidade: 1.3,
    dano: 7,
    pontos: 1.3,
  },
  {
    id: 'expert',
    nome: 'Expert',
    cor: 0xff4d6d,
    descricao: 'Para mestres do labirinto',
    tempo: 0.7,
    velocidade: 1.5,
    dano: 10,
    pontos: 1.6,
  },
] as const;

/** Dificuldade usada na primeira vez que o jogo é aberto. */
export const DEFAULT_DIFFICULTY = 'medio';

/** Posição e tamanho do quadro com a ilustração animada do menu. */
export const MENU_ART_FRAME = { x: 30, y: 128, width: 390, height: 318 };

// ---------------- Mapa de fases ----------------

export const LEVEL_MAP = {
  nodeRadius: 36, // tamanho do hexágono de cada fase
  areaLeft: 110, // área onde os nós são distribuídos
  areaRight: 690,
  rowY: 300, // altura central da linha de fases
  zigzag: 70, // sobe/desce alternado entre as fases
  walkMs: 450, // tempo do Rafael andando de uma fase para outra
};

// ---------------- Obstáculos ----------------

export const OBSTACLE = {
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
  MENU_ART: 'MenuArtScene',
  LEVEL_MAP: 'LevelMapScene',
  GAME: 'GameScene',
  HUD: 'HudScene',
  PAUSE: 'PauseScene',
  RESULT: 'ResultScene',
  HOW_TO_PLAY: 'HowToPlayScene',
  PROGRESS: 'ProgressScene',
  SETTINGS: 'SettingsScene',
  HELP: 'HelpScene',
} as const;
