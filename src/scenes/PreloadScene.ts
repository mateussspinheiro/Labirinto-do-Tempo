// =============================================================
// PreloadScene — carrega os assets (imagens e sons) e mostra
// uma barra de carregamento enquanto isso acontece.
// Por enquanto as imagens são formas desenhadas pelo próprio código
// (texturas geradas), então não dependemos de arquivos externos.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, MAZE_COLORS, TEXTURES, TILE_SIZE } from '../config/constants';
import { textStyle } from '../ui/Theme';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    this.createLoadingBar();

    // Aqui entram os this.load.image(...) / this.load.audio(...) do jogo.
  }

  create(): void {
    this.generateTextures();
    this.scene.start(SCENES.WELCOME);
  }

  /** Desenha a barra de carregamento e a atualiza com o progresso do loader. */
  private createLoadingBar(): void {
    const barWidth = 400;
    const barHeight = 24;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2;

    this.add.text(GAME_WIDTH / 2, y - 40, 'Carregando...', textStyle(24)).setOrigin(0.5);

    // Moldura da barra
    this.add.rectangle(x, y, barWidth, barHeight).setOrigin(0).setStrokeStyle(2, COLORS.primary);
    // Preenchimento: começa com largura 0 e cresce conforme o progresso (0 a 1)
    const fill = this.add.rectangle(x + 2, y + 2, 0, barHeight - 4, COLORS.primary).setOrigin(0);

    this.load.on('progress', (value: number) => {
      fill.width = (barWidth - 4) * value;
    });
  }

  /**
   * Gera texturas simples desenhando com Graphics e salvando como imagem.
   * Depois cada objeto do jogo usa a textura pelo nome (TEXTURES.*).
   */
  private generateTextures(): void {
    const g = this.make.graphics({}, false); // "pincel" que não aparece na tela

    // Parede: quadrado com borda escura
    g.fillStyle(MAZE_COLORS.wallBorder).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(MAZE_COLORS.wall).fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    g.generateTexture(TEXTURES.WALL, TILE_SIZE, TILE_SIZE);
    g.clear();

    // Chão: quadrado escuro com uma linha sutil
    g.fillStyle(MAZE_COLORS.floorLine).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(MAZE_COLORS.floor).fillRect(1, 1, TILE_SIZE - 1, TILE_SIZE - 1);
    g.generateTexture(TEXTURES.FLOOR, TILE_SIZE, TILE_SIZE);
    g.clear();

    // Jogador: círculo verde
    g.fillStyle(MAZE_COLORS.player).fillCircle(12, 12, 12);
    g.generateTexture(TEXTURES.PLAYER, 24, 24);
    g.clear();

    // Cristal: losango azul-claro com um brilho
    g.fillStyle(MAZE_COLORS.crystal).fillPoints(
      [new Phaser.Math.Vector2(10, 0), new Phaser.Math.Vector2(20, 12), new Phaser.Math.Vector2(10, 24), new Phaser.Math.Vector2(0, 12)],
      true,
    );
    g.fillStyle(MAZE_COLORS.crystalShine).fillRect(7, 6, 3, 6);
    g.generateTexture(TEXTURES.CRYSTAL, 20, 24);
    g.clear();

    // Portal bloqueado: anel cinza
    g.lineStyle(5, MAZE_COLORS.portalLocked).strokeCircle(14, 14, 11);
    g.generateTexture(TEXTURES.PORTAL_LOCKED, 28, 28);
    g.clear();

    // Portal liberado: anel roxo com núcleo dourado
    g.fillStyle(MAZE_COLORS.portalCore).fillCircle(14, 14, 6);
    g.lineStyle(5, MAZE_COLORS.portalOpen).strokeCircle(14, 14, 11);
    g.generateTexture(TEXTURES.PORTAL_OPEN, 28, 28);

    g.destroy();
  }
}
