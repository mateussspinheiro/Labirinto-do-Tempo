// =============================================================
// PreloadScene — carrega os assets (imagens) com uma tela de
// carregamento animada no estilo "sistema futurista":
//   - anel hexagonal girando com um cristal no centro;
//   - barra feita de "gomos" que acendem, com uma luz que percorre
//     a parte já carregada;
//   - porcentagem e mensagens de status ("Calibrando portais...").
//
// Como os arquivos do jogo são pequenos, eles carregam quase na
// hora. Para a animação não "piscar", a barra leva no mínimo
// LOADING.minDuration ms para encher.
//
// Imagens: pixel art em public/assets/images (npm run sprites).
// Sons:    gerados pelo código (SoundSynth), sem arquivos.
// =============================================================
import Phaser from 'phaser';
import { SCENES, ANIMS, FRAME_SIZE, GAME_TITLE, GAME_WIDTH, GLOW, LOADING, TEXTURES } from '../config/constants';
import { SoundSynth } from '../systems/SoundSynth';
import { addTechBackground } from '../ui/TechBackground';
import { addGlow, textStyle, theme, titleStyle } from '../ui/Theme';
import { goToScene } from '../ui/Transition';

/** Pasta das imagens (relativa a public/). */
const IMAGES = 'assets/images/';

/** Medidas da barra de carregamento. */
const BAR = { y: 400, width: 440, height: 16, gap: 4, skew: 5 };
const SPINNER_Y = 255;

export class PreloadScene extends Phaser.Scene {
  /** Progresso real do carregamento (0 a 1), informado pelo Phaser. */
  private realProgress = 0;
  /** Progresso mostrado na tela (limitado pelo tempo mínimo). */
  private shownProgress = 0;
  private startTime = 0;
  private finished = false;

  private bar!: Phaser.GameObjects.Graphics;
  private percentText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.PRELOAD);
  }

  preload(): void {
    this.createLoadingScreen();
    this.load.on('progress', (value: number) => (this.realProgress = value));

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

  /** Chamado quando todos os arquivos terminaram de carregar. */
  create(): void {
    this.createAnimations();
    // Gera só os sons que não vieram de arquivo
    SoundSynth.generateMissingSounds(this.game);
  }

  // ================= Tela de carregamento =================

  private createLoadingScreen(): void {
    addTechBackground(this);

    const centerX = GAME_WIDTH / 2;

    // Nome do jogo
    const title = this.add
      .text(centerX, 120, GAME_TITLE.toUpperCase(), titleStyle(26))
      .setOrigin(0.5)
      .setLetterSpacing(6);
    addGlow(title, theme.colors.primary, GLOW.title);

    this.createSpinner(centerX, SPINNER_Y);

    // Barra (redesenhada a cada quadro), porcentagem e mensagem
    this.bar = this.add.graphics();
    addGlow(this.bar, theme.colors.primary, GLOW.soft);
    this.percentText = this.add
      .text(centerX + BAR.width / 2, BAR.y - 26, '0%', titleStyle(16, theme.text.title))
      .setOrigin(1, 0.5);
    this.add
      .text(centerX - BAR.width / 2, BAR.y - 26, 'CARREGANDO', titleStyle(13, theme.text.muted))
      .setOrigin(0, 0.5)
      .setLetterSpacing(4);
    this.messageText = this.add.text(centerX, BAR.y + 36, '', textStyle(16, theme.text.muted)).setOrigin(0.5);

    // Cantoneiras em volta da barra
    const frame = this.add.graphics().lineStyle(2, theme.colors.secondary, 0.9);
    const left = centerX - BAR.width / 2 - 14;
    const right = centerX + BAR.width / 2 + 14;
    const top = BAR.y - 14;
    const bottom = BAR.y + BAR.height + 14;
    frame.lineBetween(left, top, left + 18, top).lineBetween(left, top, left, top + 18);
    frame.lineBetween(right, bottom, right - 18, bottom).lineBetween(right, bottom, right, bottom - 18);

    // A animação roda no evento UPDATE da cena (funciona durante o preload)
    this.events.on(Phaser.Scenes.Events.UPDATE, this.updateLoading, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.events.off(Phaser.Scenes.Events.UPDATE, this.updateLoading, this),
    );
  }

  /** Anel hexagonal girando + arco interno girando ao contrário + cristal no centro. */
  private createSpinner(x: number, y: number): void {
    const outer = this.add.graphics({ x, y });
    outer.lineStyle(3, theme.colors.primary, 1);
    outer.strokePoints(this.hexagon(62), true);
    // Pequenos "dentes" nos vértices do hexágono
    for (const point of this.hexagon(70)) outer.fillStyle(theme.colors.primary, 1).fillCircle(point.x, point.y, 3);
    addGlow(outer, theme.colors.primary, GLOW.soft);

    const inner = this.add.graphics({ x, y });
    inner.lineStyle(4, theme.colors.secondary, 1);
    inner.beginPath();
    inner.arc(0, 0, 44, 0, Math.PI * 1.3);
    inner.strokePath();
    addGlow(inner, theme.colors.secondary, GLOW.soft);

    // Cristal desenhado (as imagens ainda estão carregando)
    const crystal = this.add.graphics({ x, y });
    crystal
      .fillStyle(theme.colors.primary, 1)
      .fillPoints(
        [
          new Phaser.Math.Vector2(0, -22),
          new Phaser.Math.Vector2(15, 0),
          new Phaser.Math.Vector2(0, 22),
          new Phaser.Math.Vector2(-15, 0),
        ],
        true,
      );
    crystal.fillStyle(0xffffff, 0.8).fillRect(-5, -10, 4, 10);
    addGlow(crystal, theme.colors.primary, GLOW.strong);

    this.tweens.add({ targets: outer, angle: 360, duration: 6000, repeat: -1 });
    this.tweens.add({ targets: inner, angle: -360, duration: 1600, repeat: -1 });
    this.tweens.add({ targets: crystal, scale: 1.15, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Vértices de um hexágono de "raio" r, centrado em (0, 0). */
  private hexagon(r: number): Phaser.Math.Vector2[] {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = Phaser.Math.DegToRad(60 * i - 90);
      return new Phaser.Math.Vector2(Math.cos(angle) * r, Math.sin(angle) * r);
    });
  }

  /** A cada quadro: avança o progresso mostrado e redesenha a barra. */
  private updateLoading(time: number): void {
    // O progresso mostrado cresce com o tempo (enche em LOADING.minDuration),
    // mas nunca passa do progresso real do carregamento
    if (this.startTime === 0) this.startTime = time; // o primeiro quadro marca o início
    const elapsed = time - this.startTime;
    this.shownProgress = Math.min(this.realProgress, elapsed / LOADING.minDuration, 1);

    this.drawBar(time);
    this.percentText.setText(`${Math.floor(this.shownProgress * 100)}%`);
    const messageIndex = Math.min(
      LOADING.messages.length - 1,
      Math.floor(this.shownProgress * (LOADING.messages.length - 1)),
    );
    this.messageText.setText(LOADING.messages[messageIndex]);

    // Tudo carregado e barra cheia: vai para a tela de boas-vindas
    if (this.shownProgress >= 1 && !this.finished) {
      this.finished = true;
      this.messageText.setColor(theme.text.success);
      this.time.delayedCall(350, () => goToScene(this, SCENES.WELCOME));
    }
  }

  /**
   * Desenha os gomos da barra. Os acesos ficam em ciano; uma "luz"
   * mais clara percorre os gomos acesos, dando sensação de energia.
   */
  private drawBar(time: number): void {
    const g = this.bar;
    g.clear();
    const segmentWidth = (BAR.width - BAR.gap * (LOADING.segments - 1)) / LOADING.segments;
    const lit = Math.floor(this.shownProgress * LOADING.segments);
    const scan = lit > 0 ? Math.floor(time / 70) % lit : -1; // gomo onde a "luz" está

    for (let i = 0; i < LOADING.segments; i++) {
      const x = GAME_WIDTH / 2 - BAR.width / 2 + i * (segmentWidth + BAR.gap);
      // Paralelogramo (inclinado), para o visual ficar mais dinâmico
      const points = [
        new Phaser.Math.Vector2(x + BAR.skew, BAR.y),
        new Phaser.Math.Vector2(x + segmentWidth + BAR.skew, BAR.y),
        new Phaser.Math.Vector2(x + segmentWidth, BAR.y + BAR.height),
        new Phaser.Math.Vector2(x, BAR.y + BAR.height),
      ];
      if (i < lit) {
        const isScan = Math.abs(i - scan) <= 1;
        g.fillStyle(isScan ? 0xffffff : theme.colors.primary, isScan ? 1 : 0.9).fillPoints(points, true);
      } else {
        g.lineStyle(1, theme.colors.buttonBorder, 0.6).strokePoints(points, true);
      }
    }
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
