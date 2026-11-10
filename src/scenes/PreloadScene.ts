// =============================================================
// PreloadScene — carrega os assets (imagens e sons) e mostra
// uma barra de carregamento enquanto isso acontece.
// Por enquanto as imagens são formas desenhadas pelo próprio código
// (texturas geradas), então não dependemos de arquivos externos.
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, MAZE_COLORS, TEXTURES, TILE_SIZE } from '../config/constants';
import { SoundSynth } from '../systems/SoundSynth';
import { textStyle, theme } from '../ui/Theme';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    this.createLoadingBar();

    // ---- ÁUDIO ----
    // Os sons são gerados pelo código (SoundSynth). Para usar arquivos
    // de verdade, coloque-os em public/assets/audio e descomente as
    // linhas abaixo (a chave deve ser a mesma de SOUNDS):
    //
    // this.load.audio(SOUNDS.MUSIC_MENU, 'assets/audio/music-menu.ogg');
    // this.load.audio(SOUNDS.MUSIC_GAME, 'assets/audio/music-game.ogg');
    // this.load.audio(SOUNDS.CRYSTAL, 'assets/audio/crystal.ogg');
    // this.load.audio(SOUNDS.PORTAL, 'assets/audio/portal.ogg');
    // this.load.audio(SOUNDS.HIT, 'assets/audio/hit.ogg');
    // this.load.audio(SOUNDS.VICTORY, 'assets/audio/victory.ogg');
    // this.load.audio(SOUNDS.DEFEAT, 'assets/audio/defeat.ogg');
    // this.load.audio(SOUNDS.CLICK, 'assets/audio/click.ogg');
  }

  create(): void {
    this.generateTextures();
    // Gera só os sons que não vieram de arquivo
    SoundSynth.generateMissingSounds(this.game);
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
    this.add.rectangle(x, y, barWidth, barHeight).setOrigin(0).setStrokeStyle(2, theme.colors.primary);
    // Preenchimento: começa com largura 0 e cresce conforme o progresso (0 a 1)
    const fill = this.add.rectangle(x + 2, y + 2, 0, barHeight - 4, theme.colors.primary).setOrigin(0);

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

    // Parede: quadrado com borda escura (versão normal e de alto contraste)
    const drawWall = (key: string, border: number, fill: number) => {
      g.fillStyle(border).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      g.fillStyle(fill).fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      g.generateTexture(key, TILE_SIZE, TILE_SIZE);
      g.clear();
    };
    drawWall(TEXTURES.WALL, MAZE_COLORS.wallBorder, MAZE_COLORS.wall);
    drawWall(TEXTURES.WALL_HC, MAZE_COLORS.wallBorderHighContrast, MAZE_COLORS.wallHighContrast);

    // Chão: quadrado escuro com uma linha sutil (normal e alto contraste)
    const drawFloor = (key: string, line: number, fill: number) => {
      g.fillStyle(line).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      g.fillStyle(fill).fillRect(1, 1, TILE_SIZE - 1, TILE_SIZE - 1);
      g.generateTexture(key, TILE_SIZE, TILE_SIZE);
      g.clear();
    };
    drawFloor(TEXTURES.FLOOR, MAZE_COLORS.floorLine, MAZE_COLORS.floor);
    drawFloor(TEXTURES.FLOOR_HC, MAZE_COLORS.floorLineHighContrast, MAZE_COLORS.floorHighContrast);

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
    g.clear();

    // Inimigo: bolinha vermelha com dois olhos
    g.fillStyle(MAZE_COLORS.enemy).fillCircle(12, 12, 12);
    g.fillStyle(MAZE_COLORS.enemyEye).fillCircle(8, 10, 3).fillCircle(16, 10, 3);
    g.generateTexture(TEXTURES.ENEMY, 24, 24);

    g.destroy();
  }
}
