// =============================================================
// BootScene — primeira cena a rodar.
// Faz as configurações iniciais e chama a PreloadScene.
// =============================================================
import Phaser from 'phaser';
import { SCENES } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  create(): void {
    // Evita que o menu do botão direito do navegador apareça sobre o jogo.
    this.input.mouse?.disableContextMenu();

    // Cria o AudioManager (ele já carrega o volume salvo no localStorage)
    AudioManager.init(this.game);

    this.scene.start(SCENES.PRELOAD);
  }
}
