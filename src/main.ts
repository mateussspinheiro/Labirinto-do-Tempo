// =============================================================
// main.ts — ponto de entrada do jogo.
// Cria o Phaser.Game com as configurações gerais e a lista de cenas.
// =============================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/constants';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { WelcomeScene } from './scenes/WelcomeScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { ResultScene } from './scenes/ResultScene';
import { HowToPlayScene } from './scenes/HowToPlayScene';
import { ProgressScene } from './scenes/ProgressScene';
import { SettingsScene } from './scenes/SettingsScene';
import { HelpScene } from './scenes/HelpScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // usa WebGL se disponível, senão Canvas
  parent: 'game', // <div id="game"> do index.html
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
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
  scene: [
    BootScene,
    PreloadScene,
    WelcomeScene,
    MenuScene,
    LevelSelectScene,
    GameScene,
    HudScene,
    ResultScene,
    HowToPlayScene,
    ProgressScene,
    SettingsScene,
    HelpScene,
  ],
};

const game = new Phaser.Game(config);

// Só no modo de desenvolvimento (npm run dev): deixa o jogo acessível
// no console do navegador (digite "game") para ajudar a depurar.
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}
