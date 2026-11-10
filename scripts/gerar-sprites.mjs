// =============================================================
// gerar-sprites.mjs — gera as imagens (pixel art) do jogo.
//
// Uso:  npm run sprites
// Saída: arquivos .png em public/assets/images/
//
// COMO FUNCIONA
// Cada desenho é uma grade de 16×16 "pixels". Alguns são escritos
// como texto (cada letra é uma cor, '.' é transparente) e outros
// são calculados por fórmulas (tijolos da parede, anel do portal).
// Depois:
//   1. adicionamos um contorno escuro em volta do desenho (fica mais
//      fácil de enxergar sobre qualquer fundo);
//   2. ampliamos 2× (cada pixel vira um quadrado 2×2 → 32×32,
//      o tamanho do tile do jogo);
//   3. gravamos no formato PNG (usando só o Node, sem bibliotecas).
//
// Todas as imagens são originais, criadas por este script.
// Licença: CC0 (domínio público). Veja CREDITOS.md.
// =============================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT_DIR = new URL('../public/assets/images/', import.meta.url);
const SIZE = 16; // tamanho da grade de desenho
const SCALE = 2; // ampliação final (16 × 2 = 32 px)

// ---------------- Paleta (letra → cor) ----------------
const PALETTE = {
  '.': null, // transparente
  k: '#141428', // contorno
  // Jogador (Lucas)
  h: '#5d4037', // cabelo
  s: '#ffcc99', // pele
  e: '#1a1a2e', // olhos
  g: '#43a047', // camiseta
  G: '#2e7d32', // camiseta (sombra)
  b: '#1e88e5', // calça
  o: '#3e2723', // sapato
  // Cristal
  c: '#4dd0e1',
  C: '#00838f',
  w: '#e0f7fa',
  // Inimigo
  r: '#e53935',
  R: '#b71c1c',
  W: '#ffffff',
};

// ---------------- Desenhos em texto ----------------

// Jogador: parte de cima (cabeça e tronco) para cada direção
const PLAYER_TOP = {
  down: [
    '................',
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '....hsssssshh...',
    '....ssessess....',
    '....ssssssss....',
    '.....ssssss.....',
    '....gggggggg....',
    '...sggggggggs...',
    '...sggggggggs...',
    '...sGggggggGs...',
    '....GGGGGGGG....',
  ],
  up: [
    '................',
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '....hhhhhhhh....',
    '....hhhhhhhh....',
    '....hhhhhhhh....',
    '.....hssssh.....',
    '....gggggggg....',
    '...sggggggggs...',
    '...sggggggggs...',
    '...sGggggggGs...',
    '....GGGGGGGG....',
  ],
  // De lado (olhando para a esquerda; no jogo, espelhamos para a direita)
  side: [
    '................',
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '....sssshhhh....',
    '....sesshhhh....',
    '....ssssshhh....',
    '.....sssss......',
    '.....gggggg.....',
    '.....ggsggg.....',
    '.....ggsggg.....',
    '.....gGsggG.....',
    '.....GGGGGG.....',
  ],
};

// Pernas: 3 quadros de caminhada (parado, passo 1, passo 2)
const PLAYER_LEGS = {
  front: [
    ['.....bb..bb.....', '.....bb..bb.....', '.....bb..bb.....', '.....oo..oo.....'],
    ['.....bb..bb.....', '.....bb..bb.....', '.....oo..bb.....', '.........oo.....'],
    ['.....bb..bb.....', '.....bb..bb.....', '.....bb..oo.....', '.....oo.........'],
  ],
  side: [
    ['......bbbb......', '......bbbb......', '......bb.bb.....', '......oo.oo.....'],
    ['......bbbb......', '.....bb..bb.....', '....bb....bb....', '....oo....oo....'],
    ['......bbbb......', '......bbbb......', '.......bb.......', '.......ooo......'],
  ],
};

const CRYSTAL = [
  '................',
  '.......cc.......',
  '......cwcc......',
  '.....cwcccc.....',
  '....cwccccCc....',
  '...cwcccccCCc...',
  '..ccccccccCCCc..',
  '..CcccccccCCCC..',
  '...CccccccCCC...',
  '....CcccccCC....',
  '.....CcccCC.....',
  '......CcCC......',
  '.......CC.......',
  '................',
  '................',
  '................',
];

// Inimigo: "fantasminha" com 2 quadros (a barra de baixo balança)
const ENEMY_BODY = [
  '................',
  '................',
  '.....rrrrrr.....',
  '....rrrrrrrr....',
  '...rrrrrrrrrr...',
  '..rrWWrrrrWWrr..',
  '..rrWerrrrWerr..',
  '..rrrrrrrrrrrr..',
  '..rrrrrrrrrrrr..',
  '..rrrrRRRRrrrr..',
  '..rrrrrrrrrrrr..',
  '..rrrrrrrrrrrr..',
];
const ENEMY_FEET = [
  ['..RrrRRrrRRrrR..', '..R..RR..RR..R..', '................', '................'],
  ['..rRRrrRRrrRRr..', '...RR..RR..RR...', '................', '................'],
];

// ---------------- Funções de desenho ----------------

/** Converte '#rrggbb' em [r, g, b, 255]. */
function hex(color) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

/** Converte linhas de texto em uma grade de cores (null = transparente). */
function fromText(rows) {
  if (rows.length !== SIZE || rows.some((row) => row.length !== SIZE)) {
    throw new Error('Desenho precisa ter 16 linhas de 16 caracteres:\n' + rows.join('\n'));
  }
  return rows.map((row) => [...row].map((ch) => {
    if (!(ch in PALETTE)) throw new Error(`Letra sem cor na paleta: "${ch}"`);
    return PALETTE[ch] ? hex(PALETTE[ch]) : null;
  }));
}

/** Cria uma grade calculando a cor de cada pixel com uma função (x, y) → cor. */
function fromFunction(fn) {
  return Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => {
    const color = fn(x, y);
    return color ? hex(color) : null;
  }));
}

/** Pinta de escuro os pixels transparentes vizinhos do desenho (contorno). */
function outline(grid) {
  const result = grid.map((row) => row.slice());
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (grid[y][x]) continue;
      const neighbors = [grid[y - 1]?.[x], grid[y + 1]?.[x], grid[y]?.[x - 1], grid[y]?.[x + 1]];
      if (neighbors.some(Boolean)) result[y][x] = hex(PALETTE.k);
    }
  }
  return result;
}

/** Junta várias grades lado a lado (spritesheet com vários quadros). */
function sheet(grids) {
  return Array.from({ length: SIZE }, (_, y) => grids.flatMap((grid) => grid[y]));
}

// ---------------- Gravação em PNG ----------------

// Tabela do CRC32 (soma de verificação exigida pelo formato PNG)
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Um "pedaço" (chunk) do PNG: tamanho + tipo + dados + CRC. */
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

/** Amplia a grade (SCALE×) e grava como PNG RGBA. */
function savePng(name, grid) {
  const height = grid.length * SCALE;
  const width = grid[0].length * SCALE;

  // Cada linha da imagem começa com um byte de "filtro" (0 = nenhum)
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    for (let x = 0; x < width; x++) {
      const color = grid[Math.floor(y / SCALE)][Math.floor(x / SCALE)] ?? [0, 0, 0, 0];
      raw.set(color, rowStart + 1 + x * 4);
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // 8 bits por canal
  header[9] = 6; // RGBA

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // assinatura PNG
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(new URL(name, OUT_DIR), png);
  console.log('gerado', name, `${width}x${height}`);
}

// ---------------- Imagens calculadas ----------------

/** Parede de tijolos: linhas de argamassa a cada 4 px, tijolos alternados. */
function wall(brick, light, mortar) {
  return fromFunction((x, y) => {
    const row = Math.floor(y / 4);
    const shift = row % 2 === 0 ? 0 : 4; // tijolos desencontrados
    if (y % 4 === 3 || (x + shift) % 8 === 7) return mortar;
    if (y % 4 === 0) return light; // borda iluminada de cada tijolo
    return brick;
  });
}

/** Chão de pedra: cor base, borda sutil e algumas "pedrinhas" fixas. */
function floor(base, detail) {
  const speckles = new Set(['3,5', '10,2', '12,11', '6,12', '1,9', '8,8']);
  return fromFunction((x, y) => (x === 0 || y === 0 || speckles.has(`${x},${y}`) ? detail : base));
}

/** Portal: anel (distância do centro) com redemoinho e núcleo. */
function portal(open) {
  const center = 7.5;
  return fromFunction((x, y) => {
    const dx = x - center;
    const dy = y - center;
    const d = Math.hypot(dx, dy);
    if (d > 7.3) return null;
    if (!open) {
      if (d > 5) return d > 6.4 ? '#9e9e9e' : '#616161'; // anel cinza
      return null; // centro vazio
    }
    if (d > 5.2) return d > 6.4 ? '#e1bee7' : '#ba68c8'; // anel roxo
    if (d < 2.5) return '#ffd54f'; // núcleo dourado
    // Redemoinho: faixas que giram conforme o ângulo + a distância
    const angle = Math.atan2(dy, dx);
    return Math.sin(angle * 3 + d * 1.4) > 0 ? '#7b1fa2' : '#ce93d8';
  });
}

// ---------------- Gera tudo ----------------

mkdirSync(OUT_DIR, { recursive: true });

// Jogador: 9 quadros → [baixo ×3, cima ×3, lado ×3]
const playerFrames = [];
for (const [dir, legs] of [['down', 'front'], ['up', 'front'], ['side', 'side']]) {
  for (const legRows of PLAYER_LEGS[legs]) {
    playerFrames.push(outline(fromText([...PLAYER_TOP[dir], ...legRows])));
  }
}
savePng('player.png', sheet(playerFrames));

savePng('enemy.png', sheet(ENEMY_FEET.map((feet) => outline(fromText([...ENEMY_BODY, ...feet])))));
savePng('crystal.png', outline(fromText(CRYSTAL)));
savePng('portal-locked.png', portal(false));
savePng('portal-open.png', portal(true));
savePng('wall.png', wall('#3f51b5', '#5c6bc0', '#1a237e'));
savePng('floor.png', floor('#1b2040', '#232a52'));
// Versões de alto contraste
savePng('wall-hc.png', wall('#e0e0e0', '#ffffff', '#757575'));
savePng('floor-hc.png', floor('#000000', '#1a1a1a'));
// Partícula: quadradinho branco 3×3 (o jogo pinta com a cor desejada)
const white = hex('#ffffff');
savePng('particle.png', [[white, white, white], [white, white, white], [white, white, white]]);
