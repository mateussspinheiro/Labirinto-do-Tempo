// =============================================================
// main.ts — ponto de entrada do jogo.
// Carrega as fontes e cria o Phaser.Game com as configurações
// gerais e a lista de cenas.
// =============================================================
import Phaser from 'phaser';
// Fontes incluídas no projeto (pacotes @fontsource, licença OFL):
// o Vite copia os arquivos das fontes para o build, então funcionam offline.
import '@fontsource/orbitron/500.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import '@fontsource/exo-2/400.css';
import '@fontsource/exo-2/700.css';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { WelcomeScene } from './scenes/WelcomeScene';
import { MenuScene } from './scenes/MenuScene';
import { MenuArtScene } from './scenes/MenuArtScene';
import { LevelMapScene } from './scenes/LevelMapScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { PauseScene } from './scenes/PauseScene';
import { ResultScene } from './scenes/ResultScene';
import { HowToPlayScene } from './scenes/HowToPlayScene';
import { ProgressScene } from './scenes/ProgressScene';
import { SettingsScene } from './scenes/SettingsScene';
import { HelpScene } from './scenes/HelpScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // usa WebGL se disponível (necessário para o brilho neon), senão Canvas
  parent: 'game', // <div id="game"> do index.html
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  // Canvas transparente: a cor de fundo vem da página (o tema troca essa
  // cor no modo alto contraste, veja applyAccessibility em Theme.ts)
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT, // estica mantendo a proporção 4:3
    autoCenter: Phaser.Scale.CENTER_BOTH, // centraliza na tela
  },
  physics: {
    default: 'arcade', // física simples (caixas de colisão retangulares)
    arcade: {
      gravity: { x: 0, y: 0 }, // jogo visto de cima: sem gravidade
      debug: false,
    },
  },
  // A primeira cena da lista é a que inicia automaticamente.
  // A ordem também define quem é desenhado por cima (o último fica no topo).
  scene: [
    BootScene,
    PreloadScene,
    WelcomeScene,
    MenuScene,
    MenuArtScene,
    LevelMapScene,
    GameScene,
    HudScene,
    PauseScene,
    ResultScene,
    HowToPlayScene,
    ProgressScene,
    SettingsScene,
    HelpScene,
  ],
};

/**
 * O Phaser desenha os textos assim que eles são criados. Por isso,
 * esperamos as fontes terminarem de carregar ANTES de criar o jogo
 * (senão os primeiros textos sairiam com a fonte reserva, Arial).
 */
async function loadFonts(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load('700 20px Orbitron'),
      document.fonts.load('900 20px Orbitron'),
      document.fonts.load('500 20px Orbitron'),
      document.fonts.load('400 20px "Exo 2"'),
      document.fonts.load('700 20px "Exo 2"'),
    ]);
  } catch {
    // Se falhar, o jogo segue com a fonte reserva
  }
}

loadFonts().then(() => {
  const game = new Phaser.Game(config);

  // Só no modo de desenvolvimento (npm run dev): deixa o jogo acessível
  // no console do navegador (digite "game") para ajudar a depurar.
  if (import.meta.env.DEV) {
    (window as unknown as { game: Phaser.Game }).game = game;
  }
});
