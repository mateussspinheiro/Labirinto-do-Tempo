// =============================================================
// MenuArtScene — ilustração animada do menu principal:
// Rafael correndo por uma cidade neon, pegando cristais, enquanto
// dois monstros correm atrás dele.
//
// Ela roda em PARALELO à MenuScene, em uma "janela" do tamanho do
// quadro (a câmera tem viewport = MENU_ART_FRAME). Tudo o que sai da
// janela é cortado automaticamente pela câmera.
// Nada aqui é regra de jogo: é só decoração.
// =============================================================
import Phaser from 'phaser';
import { SCENES, ANIMS, EFFECT_COLORS, GLOW, MENU_ART_FRAME, TEXTURES } from '../config/constants';
import { burstParticles } from '../ui/Effects';
import { addGlow, theme, titleStyle } from '../ui/Theme';

const W = MENU_ART_FRAME.width;
const H = MENU_ART_FRAME.height;
const GROUND_Y = H - 70; // altura do "chão" onde o Rafael corre
const HERO_X = W * 0.6;
const RUN_SPEED = 240; // velocidade com que o cenário passa (px/s)
const CRYSTAL_INTERVAL = 1100; // ms entre um cristal e outro
const SKYLINE_TEXTURE = 'menu-skyline';
const SKYLINE_HEIGHT = 120;

export class MenuArtScene extends Phaser.Scene {
  private skylineFar!: Phaser.GameObjects.TileSprite;
  private skylineNear!: Phaser.GameObjects.TileSprite;
  private ground!: Phaser.GameObjects.Graphics;
  private hero!: Phaser.GameObjects.Sprite;
  private counterText!: Phaser.GameObjects.Text;
  private collected = 0;
  private scroll = 0;

  constructor() {
    super(SCENES.MENU_ART);
  }

  create(): void {
    // A câmera só mostra o retângulo do quadro, na posição dele na tela
    this.cameras.main.setViewport(MENU_ART_FRAME.x, MENU_ART_FRAME.y, W, H);
    this.collected = 0;

    this.drawSky();
    this.createSkyline();
    this.ground = this.add.graphics();
    this.createCharacters();
    this.createFrame();

    // Um cristal novo a cada CRYSTAL_INTERVAL ms
    this.time.addEvent({ delay: CRYSTAL_INTERVAL, loop: true, callback: this.spawnCrystal, callbackScope: this });
  }

  update(_time: number, delta: number): void {
    // Tudo "anda" para a esquerda: parece que o Rafael corre para a direita
    this.scroll += (RUN_SPEED * delta) / 1000;
    this.skylineFar.tilePositionX = this.scroll * 0.15; // camada distante: devagar (paralaxe)
    this.skylineNear.tilePositionX = this.scroll * 0.4;
    this.drawGround();
  }

  // ---------------- Cenário ----------------

  /** Céu em degradê com um "sol" listrado (estilo synthwave). */
  private drawSky(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a0420, 0x0a0420, 0x2a0a3a, 0x2a0a3a, 1).fillRect(0, 0, W, GROUND_Y);
    sky.fillStyle(0x05070f, 1).fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Sol: círculo com listras horizontais "cortando" a parte de baixo
    const sun = this.add.graphics();
    sun.setPosition(W * 0.3, GROUND_Y - 70);
    sun.fillGradientStyle(0xffd54f, 0xffd54f, theme.colors.secondary, theme.colors.secondary, 1);
    sun.fillCircle(0, 0, 60);
    sun.fillStyle(0x2a0a3a, 1);
    for (let i = 0; i < 5; i++) sun.fillRect(-62, 8 + i * 11, 124, 2 + i);
  }

  /**
   * Prédios da cidade: desenhados uma vez em uma textura e repetidos
   * com TileSprite (que pode "rolar" a imagem com tilePositionX).
   */
  private createSkyline(): void {
    if (!this.textures.exists(SKYLINE_TEXTURE)) {
      const g = this.make.graphics({}, false);
      let x = 0;
      while (x < W) {
        const width = Phaser.Math.Between(26, 54);
        const height = Phaser.Math.Between(40, SKYLINE_HEIGHT);
        g.fillStyle(0x140a2a, 1).fillRect(x, SKYLINE_HEIGHT - height, width - 3, height);
        // Janelinhas acesas aleatórias
        for (let wy = SKYLINE_HEIGHT - height + 6; wy < SKYLINE_HEIGHT - 6; wy += 9) {
          for (let wx = x + 4; wx < x + width - 8; wx += 8) {
            if (Math.random() < 0.3) g.fillStyle(Math.random() < 0.5 ? 0x00e5ff : 0xff2bd6, 0.7).fillRect(wx, wy, 3, 4);
          }
        }
        x += width;
      }
      g.generateTexture(SKYLINE_TEXTURE, W, SKYLINE_HEIGHT);
      g.destroy();
    }
    // Duas camadas: a de trás menor e mais escura (sensação de profundidade)
    this.skylineFar = this.add
      .tileSprite(0, GROUND_Y - 40, W, SKYLINE_HEIGHT, SKYLINE_TEXTURE)
      .setOrigin(0, 1)
      .setAlpha(0.45)
      .setTileScale(0.7, 0.7);
    this.skylineNear = this.add.tileSprite(0, GROUND_Y, W, SKYLINE_HEIGHT, SKYLINE_TEXTURE).setOrigin(0, 1);
  }

  /** Chão: linha neon + grade em perspectiva que rola junto com a corrida. */
  private drawGround(): void {
    const g = this.ground;
    g.clear();
    g.lineStyle(2, theme.colors.primary, 1).lineBetween(0, GROUND_Y, W, GROUND_Y);

    // Linhas "deitadas" no chão, inclinadas a partir de um ponto de fuga
    const spacing = 40;
    const shift = this.scroll % spacing;
    g.lineStyle(1, theme.colors.primary, 0.35);
    for (let x = -W; x < W * 2; x += spacing) {
      const topX = x - shift;
      g.lineBetween(topX, GROUND_Y, W / 2 + (topX - W / 2) * 2.2, H);
    }
    for (let i = 1; i <= 3; i++) {
      const y = GROUND_Y + (i * i * (H - GROUND_Y)) / 9;
      g.lineBetween(0, y, W, y);
    }
  }

  // ---------------- Personagens ----------------

  private createCharacters(): void {
    // Rafael correndo (desenho de lado, espelhado para olhar à direita)
    this.hero = this.add
      .sprite(HERO_X, GROUND_Y - 46, TEXTURES.PLAYER, ANIMS.PLAYER_SIDE.idle)
      .setScale(3)
      .setFlipX(true)
      .play(ANIMS.PLAYER_SIDE.key);
    this.hero.anims.timeScale = 1.6; // corre mais rápido que no jogo

    // Dois monstros perseguindo: chegam perto e se afastam
    [70, 150].forEach((x, i) => {
      const monster = this.add
        .sprite(x, GROUND_Y - 44, TEXTURES.ENEMY, 0)
        .setScale(2.6 - i * 0.3)
        .play(ANIMS.ENEMY.key);
      this.tweens.add({
        targets: monster,
        x: x + 40,
        duration: 900 + i * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: monster,
        y: monster.y - 10,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    this.counterText = this.add
      .text(W - 14, 14, 'CRISTAIS 0', titleStyle(13, theme.text.title))
      .setOrigin(1, 0)
      .setLetterSpacing(2);
  }

  /** Um cristal aparece na direita e vem até o Rafael, que o "pega". */
  private spawnCrystal(): void {
    const high = Math.random() < 0.4; // alguns cristais ficam mais altos: ele pula
    const y = GROUND_Y - (high ? 110 : 50);
    const crystal = this.add.image(W + 20, y, TEXTURES.CRYSTAL).setScale(1.6);
    addGlow(crystal, theme.colors.primary, GLOW.soft);

    const distance = crystal.x - HERO_X;
    if (high) {
      // Pula um pouco antes de o cristal chegar
      this.time.delayedCall((distance / RUN_SPEED) * 1000 - 250, () => this.jump());
    }
    this.tweens.add({
      targets: crystal,
      x: HERO_X,
      duration: (distance / RUN_SPEED) * 1000,
      onComplete: () => {
        burstParticles(this, crystal.x, crystal.y, EFFECT_COLORS.crystalParticles, 12);
        crystal.destroy();
        this.collected++;
        this.counterText.setText(`CRISTAIS ${this.collected}`);
        this.tweens.add({ targets: this.counterText, scale: 1.2, duration: 100, yoyo: true });
      },
    });
  }

  private jump(): void {
    this.tweens.add({ targets: this.hero, y: this.hero.y - 60, duration: 250, yoyo: true, ease: 'Quad.easeOut' });
  }

  /** Moldura neon do quadro, com cantoneiras. */
  private createFrame(): void {
    const g = this.add.graphics();
    g.lineStyle(2, theme.colors.primary, 0.9).strokeRect(1, 1, W - 2, H - 2);
    g.lineStyle(3, theme.colors.secondary, 1);
    g.lineBetween(0, 0, 24, 0).lineBetween(0, 0, 0, 24);
    g.lineBetween(W, H, W - 24, H).lineBetween(W, H, W, H - 24);
  }
}
