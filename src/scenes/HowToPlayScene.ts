// =============================================================
// HowToPlayScene — tela "Como Jogar": objetivo, controles,
// cristais, portal, tempo e obstáculos, cada um com um ícone.
// Os ícones usam as mesmas imagens do jogo (jogador, cristal,
// portal, inimigo) ou são desenhados aqui (teclas e relógio).
//
// Pode ser aberta pelo menu ou pela pausa (fromPause = true): nesse
// caso o botão de voltar retorna para a pausa, e não para o menu.
// =============================================================
import Phaser from 'phaser';
import { SCENES, ANIMS, TEXTURES } from '../config/constants';
import { ButtonGroup } from '../ui/Button';
import { addScreenFrame } from '../ui/ScreenFrame';
import { textStyle, theme } from '../ui/Theme';

export interface HowToPlayData {
  fromPause?: boolean;
}

/** Um tópico da explicação. */
interface Topic {
  title: string;
  text: string;
  /** Desenha o ícone com centro em (x, y). */
  drawIcon: (x: number, y: number) => void;
}

/** Layout em 2 colunas × 3 linhas. */
const COLUMN_X = [30, 420];
const ROW_Y = [125, 250, 375];
const ICON_OFFSET = 40; // centro do ícone em relação ao início do bloco
const TEXT_OFFSET = 85; // onde começa o texto
const TEXT_WIDTH = 290;

export class HowToPlayScene extends Phaser.Scene {
  private fromPause = false;

  constructor() {
    super(SCENES.HOW_TO_PLAY);
  }

  init(data: HowToPlayData): void {
    this.fromPause = data?.fromPause === true;
  }

  create(): void {
    const backButton = this.fromPause
      ? addScreenFrame(this, 'Como Jogar', {
          onBack: () => this.backToPause(),
          backLabel: 'Voltar à pausa',
        })
      : addScreenFrame(this, 'Como Jogar');
    if (this.fromPause) this.scene.bringToTop();

    const topics: Topic[] = [
      {
        title: 'Objetivo',
        text: 'Colete os 3 cristais e entre no portal antes do tempo acabar.',
        drawIcon: (x, y) => this.add.sprite(x, y, TEXTURES.PLAYER, 0).setScale(1.6).play(ANIMS.PLAYER_DOWN.key),
      },
      {
        title: 'Controles',
        text: 'Setas ou WASD movem. ESC ou P pausa. + / - volume e M silencia.',
        drawIcon: (x, y) => this.drawArrowKeys(x, y),
      },
      {
        title: 'Cristais',
        text: 'Encoste nos cristais para coletá-los. O HUD mostra quantos você tem.',
        drawIcon: (x, y) => this.add.image(x, y, TEXTURES.CRYSTAL).setScale(1.6),
      },
      {
        title: 'Portal',
        text: 'Fica cinza (bloqueado) até juntar os 3 cristais; depois brilha e libera a saída.',
        drawIcon: (x, y) => {
          this.add.image(x - 14, y, TEXTURES.PORTAL_LOCKED).setScale(1.1);
          this.add.image(x + 16, y, TEXTURES.PORTAL_OPEN).setScale(1.1);
        },
      },
      {
        title: 'Tempo',
        text: 'O cronômetro não para. Nos últimos 10 segundos ele fica vermelho.',
        drawIcon: (x, y) => this.drawClock(x, y),
      },
      {
        title: 'Obstáculos',
        text: 'Inimigos patrulham os corredores. Encostar em um tira 5 segundos.',
        // Sprite animado (o mesmo "flutuar" do jogo)
        drawIcon: (x, y) => this.add.sprite(x, y, TEXTURES.ENEMY, 0).setScale(1.6).play(ANIMS.ENEMY.key),
      },
    ];

    // Distribui os tópicos: coluna = i % 2, linha = i / 2
    topics.forEach((topic, i) => {
      const x = COLUMN_X[i % 2];
      const y = ROW_Y[Math.floor(i / 2)];

      // Moldura do ícone
      this.add.circle(x + ICON_OFFSET, y + 30, 32, theme.colors.panel).setStrokeStyle(2, theme.colors.buttonBorder);
      topic.drawIcon(x + ICON_OFFSET, y + 30);

      this.add.text(x + TEXT_OFFSET, y, topic.title, textStyle(20, theme.text.title, true));
      this.add.text(x + TEXT_OFFSET, y + 28, topic.text, { ...textStyle(16), wordWrap: { width: TEXT_WIDTH } });
    });

    new ButtonGroup(this, [backButton]);
  }

  /** Desenha as 4 setas do teclado (teclas com um triângulo dentro). */
  private drawArrowKeys(x: number, y: number): void {
    const g = this.add.graphics();
    const size = 15;
    // Posições das teclas: cima, esquerda, baixo, direita
    const keys = [
      { dx: 0, dy: -9, angle: -90 },
      { dx: -17, dy: 9, angle: 180 },
      { dx: 0, dy: 9, angle: 90 },
      { dx: 17, dy: 9, angle: 0 },
    ];
    for (const key of keys) {
      const kx = x + key.dx;
      const ky = y + key.dy;
      g.fillStyle(theme.colors.buttonIdle).fillRoundedRect(kx - size / 2, ky - size / 2, size, size, 3);
      g.lineStyle(1, theme.colors.buttonBorder).strokeRoundedRect(kx - size / 2, ky - size / 2, size, size, 3);
      // Triângulo apontando na direção da seta
      const r = Phaser.Math.DegToRad(key.angle);
      const tip = new Phaser.Math.Vector2(kx + Math.cos(r) * 4, ky + Math.sin(r) * 4);
      const left = new Phaser.Math.Vector2(kx + Math.cos(r + 2.4) * 4, ky + Math.sin(r + 2.4) * 4);
      const right = new Phaser.Math.Vector2(kx + Math.cos(r - 2.4) * 4, ky + Math.sin(r - 2.4) * 4);
      g.fillStyle(theme.colors.accent).fillTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y);
    }
  }

  /** Desenha um relógio simples (círculo com dois ponteiros). */
  private drawClock(x: number, y: number): void {
    const g = this.add.graphics();
    g.fillStyle(theme.colors.background).fillCircle(x, y, 18);
    g.lineStyle(3, theme.colors.primary).strokeCircle(x, y, 18);
    g.lineStyle(3, theme.colors.accent);
    g.lineBetween(x, y, x, y - 12); // ponteiro dos minutos
    g.lineBetween(x, y, x + 8, y + 4); // ponteiro das horas
  }

  /** Fecha esta tela e mostra a pausa de novo. */
  private backToPause(): void {
    this.scene.wake(SCENES.PAUSE);
    this.scene.stop();
  }
}
