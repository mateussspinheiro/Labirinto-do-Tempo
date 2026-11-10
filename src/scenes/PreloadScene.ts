// =============================================================
// PreloadScene — carrega os assets (imagens e sons) e mostra
// uma barra de carregamento enquanto isso acontece.
//
// Imagens: pixel art em public/assets/images, gerada pelo script
//          scripts/gerar-sprites.mjs (npm run sprites).
// Sons:    gerados pelo código (SoundSynth), sem arquivos.
// =============================================================
import Phaser from 'phaser';
import { SCENES, ANIMS, FRAME_SIZE, GAME_WIDTH, GAME_HEIGHT, TEXTURES } from '../config/constants';
import { SoundSynth } from '../systems/SoundSynth';
import { textStyle, theme } from '../ui/Theme';

/** Pasta das imagens (relativa a public/). */
const IMAGES = 'assets/images/';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    this.createLoadingBar();

    // ---- IMAGENS ----
    // Imagens simples (um quadro só)
    this.load.image(TEXTURES.WALL, IMAGES + 'wall.png');
    this.load.image(TEXTURES.FLOOR, IMAGES + 'floor.png');
    this.load.image(TEXTURES.WALL_HC, IMAGES + 'wall-hc.png');
    this.load.image(TEXTURES.FLOOR_HC, IMAGES + 'floor-hc.png');
    this.load.image(TEXTURES.CRYSTAL, IMAGES + 'crystal.png');
    this.load.image(TEXTURES.PORTAL_LOCKED, IMAGES + 'portal-locked.png');
    this.load.image(TEXTURES.PORTAL_OPEN, IMAGES + 'portal-open.png');
    this.load.image(TEXTURES.PARTICLE, IMAGES + 'particle.png');
    // Spritesheets: uma imagem com vários quadros lado a lado (para animar)
    const frameConfig = { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE };
    this.load.spritesheet(TEXTURES.PLAYER, IMAGES + 'player.png', frameConfig);
    this.load.spritesheet(TEXTURES.ENEMY, IMAGES + 'enemy.png', frameConfig);

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
    this.createAnimations();
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
   * Cria as animações (uma vez só; ficam disponíveis para todas as cenas).
   * Uma animação é uma lista de quadros da spritesheet tocada em sequência.
   */
  private createAnimations(): void {
    for (const anim of [ANIMS.PLAYER_DOWN, ANIMS.PLAYER_UP, ANIMS.PLAYER_SIDE]) {
      this.anims.create({
        key: anim.key,
        frames: this.anims.generateFrameNumbers(TEXTURES.PLAYER, { frames: [...anim.frames] }),
        frameRate: ANIMS.playerFrameRate,
        repeat: -1, // repete para sempre
      });
    }
    this.anims.create({
      key: ANIMS.ENEMY.key,
      frames: this.anims.generateFrameNumbers(TEXTURES.ENEMY, { frames: [...ANIMS.ENEMY.frames] }),
      frameRate: ANIMS.enemyFrameRate,
      repeat: -1,
    });
  }
}
