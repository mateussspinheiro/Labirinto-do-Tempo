// =============================================================
// WelcomeScene — tela de boas-vindas.
// Fundo tecnológico, título com degradê e brilho neon, um subtítulo
// "digitado" letra por letra e o Rafael correndo até o portal.
//
// Pede um clique ou Enter: os navegadores só liberam o áudio
// depois da primeira interação do usuário.
// =============================================================
import Phaser from 'phaser';
import { SCENES, ANIMS, GAME_TITLE, GAME_WIDTH, GAME_HEIGHT, GLOW, TEXTURES } from '../config/constants';
import { addTechBackground } from '../ui/TechBackground';
import { addGlow, cssColor, setGradient, textStyle, theme, titleStyle } from '../ui/Theme';
import { goToScene } from '../ui/Transition';

const SUBTITLE = 'Colete os cristais. Fuja dos monstros. Vença o tempo.';
const TYPE_SPEED_MS = 35; // intervalo entre cada letra "digitada"

export class WelcomeScene extends Phaser.Scene {
  constructor() {
    super(SCENES.WELCOME);
  }

  create(): void {
    addTechBackground(this);
    const centerX = GAME_WIDTH / 2;

    // ---- Título em duas linhas, com degradê e brilho ----
    const [firstWord, ...rest] = GAME_TITLE.toUpperCase().split(' ');
    const line1 = this.add.text(centerX, 130, firstWord, titleStyle(64)).setOrigin(0.5).setLetterSpacing(6);
    const line2 = this.add.text(centerX, 200, rest.join(' '), titleStyle(40)).setOrigin(0.5).setLetterSpacing(10);
    setGradient(line1, '#ffffff', cssColor(theme.colors.primary));
    setGradient(line2, cssColor(theme.colors.primary), cssColor(theme.colors.secondary));
    addGlow(line1, theme.colors.primary, GLOW.title);
    addGlow(line2, theme.colors.secondary, GLOW.title);

    // O título "respira" (pulsa devagar)
    this.tweens.add({
      targets: [line1, line2],
      scale: 1.03,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ---- Subtítulo digitado letra por letra ----
    const subtitle = this.add.text(centerX, 250, '', textStyle(17, theme.text.muted)).setOrigin(0.5);
    let typed = 0;
    this.time.addEvent({
      delay: TYPE_SPEED_MS,
      repeat: SUBTITLE.length - 1,
      callback: () => subtitle.setText(SUBTITLE.slice(0, ++typed)),
    });

    this.createRunningHero(330);

    // ---- Convite para começar (piscando) ----
    const hint = this.add
      .text(centerX, 470, 'PRESSIONE ENTER OU CLIQUE PARA INICIAR', titleStyle(15, theme.text.normal))
      .setOrigin(0.5)
      .setLetterSpacing(3);
    this.tweens.add({ targets: hint, alpha: 0.25, duration: 650, yoyo: true, repeat: -1 });

    this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 14, 'v2.0', titleStyle(11, theme.text.muted)).setOrigin(1, 1);

    // Primeira interação: clique em qualquer lugar ou Enter
    this.input.once('pointerdown', () => this.start());
    this.input.keyboard?.once('keydown-ENTER', () => this.start());
  }

  /** Rafael correndo em direção ao portal, passando pelos cristais. */
  private createRunningHero(y: number): void {
    const centerX = GAME_WIDTH / 2;

    // Plataforma neon onde ele corre
    const floor = this.add.graphics();
    floor.lineStyle(2, theme.colors.primary, 0.8).lineBetween(centerX - 230, y + 26, centerX + 230, y + 26);
    addGlow(floor, theme.colors.primary, GLOW.soft);

    const portal = this.add.image(centerX + 190, y, TEXTURES.PORTAL_OPEN).setScale(1.6);
    addGlow(portal, theme.colors.secondary, GLOW.soft);
    this.tweens.add({ targets: portal, angle: 360, duration: 3000, repeat: -1 });

    [-70, 0, 70].forEach((dx, i) => {
      const crystal = this.add.image(centerX + dx, y, TEXTURES.CRYSTAL);
      addGlow(crystal, theme.colors.primary, GLOW.soft);
      this.tweens.add({
        targets: crystal,
        y: y - 6,
        duration: 600,
        delay: i * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Rafael (andando de lado, virado para a direita) e um monstro atrás dele
    this.add
      .sprite(centerX - 170, y, TEXTURES.PLAYER, ANIMS.PLAYER_SIDE.idle)
      .setScale(1.6)
      .setFlipX(true)
      .play(ANIMS.PLAYER_SIDE.key);
    const monster = this.add
      .sprite(centerX - 225, y, TEXTURES.ENEMY, 0)
      .setScale(1.4)
      .play(ANIMS.ENEMY.key);
    this.tweens.add({
      targets: monster,
      x: monster.x + 12,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private start(): void {
    goToScene(this, SCENES.MENU);
  }
}
