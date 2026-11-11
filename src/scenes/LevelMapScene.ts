// =============================================================
// LevelMapScene — mapa de fases (aberto pelo botão "Jogar").
//
// As fases aparecem como hexágonos numerados ligados por um caminho
// neon. O trecho já liberado brilha e tem "energia" correndo por ele;
// o trecho bloqueado fica tracejado e apagado. Embaixo de cada fase
// aparecem as estrelas conquistadas.
//
// O Rafael fica em cima da fase selecionada: ao trocar de fase com
// as setas (ou o mouse), ele anda pelo caminho até ela.
// Enter (ou clique) começa a fase.
//
// O progresso mostrado é o da dificuldade escolhida no menu.
// =============================================================
import Phaser from 'phaser';
import { SCENES, ANIMS, GAME_WIDTH, GLOW, LEVEL_MAP, MAP_CHARS, SOUNDS, TEXTURES } from '../config/constants';
import { LEVELS } from '../levels';
import { AudioManager } from '../systems/AudioManager';
import { enemySpeed, getCurrentDifficulty, levelTime } from '../systems/Difficulty';
import { SaveManager } from '../systems/SaveManager';
import type { Difficulty, LevelData } from '../types';
import { ButtonGroup } from '../ui/Button';
import { LevelNode, type LevelNodeState } from '../ui/LevelNode';
import { addPanel } from '../ui/Panel';
import { addScreenFrame } from '../ui/ScreenFrame';
import { addGlow, cssColor, formatTime, starsText, textStyle, theme, titleStyle } from '../ui/Theme';
import { goToScene } from '../ui/Transition';
import type { GameSceneData } from './GameScene';

const INFO_Y = 478; // painel de informações da fase
const HERO_OFFSET_Y = -LEVEL_MAP.nodeRadius - 26; // Rafael fica acima do hexágono
const ENERGY_DOTS = 6;

export class LevelMapScene extends Phaser.Scene {
  private difficulty!: Difficulty;
  private path!: Phaser.Curves.Spline;
  private hero!: Phaser.GameObjects.Sprite;
  /** Posição do Rafael no caminho (t: 0 = primeira fase, 1 = última). */
  private walker = { t: 0 };
  private walkTween?: Phaser.Tweens.Tween;
  private infoTitle!: Phaser.GameObjects.Text;
  private infoDetails!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.LEVEL_MAP);
  }

  create(): void {
    AudioManager.get().playMusic(SOUNDS.MUSIC_MENU);
    this.difficulty = getCurrentDifficulty();
    const backButton = addScreenFrame(this, 'Mapa de Fases');
    this.createDifficultyChip();

    // Posição de cada fase e a curva que passa por todas elas
    const points = this.nodePositions(LEVELS.length);
    this.path = new Phaser.Curves.Spline(points.length > 1 ? points : [points[0], points[0]]);

    // Até qual fase o caminho está liberado
    const unlockedCount = LEVELS.filter((level) => SaveManager.isLevelUnlocked(this.difficulty.id, level.id)).length;
    this.drawPath(unlockedCount);

    // Painel de informações (preenchido quando uma fase é selecionada)
    addPanel(this, GAME_WIDTH / 2, INFO_Y, 600, 66, { corner: 14 });
    this.infoTitle = this.add
      .text(GAME_WIDTH / 2, INFO_Y - 13, '', titleStyle(15))
      .setOrigin(0.5)
      .setLetterSpacing(2);
    this.infoDetails = this.add.text(GAME_WIDTH / 2, INFO_Y + 14, '', textStyle(15, theme.text.muted)).setOrigin(0.5);

    // Hexágonos das fases
    const nodes = LEVELS.map((level, i) => {
      const progress = SaveManager.getLevelProgress(this.difficulty.id, level.id);
      let state: LevelNodeState = 'locked';
      if (progress?.completed) state = 'completed';
      else if (SaveManager.isLevelUnlocked(this.difficulty.id, level.id)) state = 'available';

      return new LevelNode(
        this,
        points[i].x,
        points[i].y,
        level.id,
        state,
        progress?.bestStars ?? 0,
        () => goToScene(this, SCENES.GAME, { levelId: level.id } satisfies GameSceneData),
        () => this.onLevelFocused(level, i),
      );
    });

    // Rafael começa na última fase liberada (a próxima a jogar)
    const startIndex = Math.max(0, unlockedCount - 1);
    this.walker = { t: this.tOfNode(startIndex) };
    const start = this.path.getPoint(this.walker.t);
    this.hero = this.add
      .sprite(start.x, start.y + HERO_OFFSET_Y, TEXTURES.PLAYER, ANIMS.PLAYER_DOWN.idle)
      .setScale(1.6)
      .setDepth(5);
    // Ele "flutua" levemente enquanto espera
    this.tweens.add({
      targets: this.hero,
      scaleY: 1.66,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    new ButtonGroup(this, [...nodes, backButton], startIndex);
  }

  // ---------------- Layout ----------------

  /**
   * Distribui as fases da esquerda para a direita, subindo e descendo
   * em zigue-zague. (Com mais fases no futuro, basta adicioná-las em
   * LEVELS: o espaçamento se ajusta sozinho.)
   */
  private nodePositions(count: number): Phaser.Math.Vector2[] {
    return Array.from({ length: count }, (_, i) => {
      const x =
        count === 1
          ? GAME_WIDTH / 2
          : LEVEL_MAP.areaLeft + (i * (LEVEL_MAP.areaRight - LEVEL_MAP.areaLeft)) / (count - 1);
      const y = LEVEL_MAP.rowY + (i % 2 === 0 ? LEVEL_MAP.zigzag : -LEVEL_MAP.zigzag);
      return new Phaser.Math.Vector2(x, y);
    });
  }

  /** Posição (t de 0 a 1) da fase i no caminho. */
  private tOfNode(i: number): number {
    return LEVELS.length > 1 ? i / (LEVELS.length - 1) : 0;
  }

  /**
   * Desenha o caminho: base escura, trecho liberado em neon (com
   * pontos de energia correndo) e trecho bloqueado tracejado.
   */
  private drawPath(unlockedCount: number): void {
    const unlockedT = this.tOfNode(Math.max(0, unlockedCount - 1));
    const samples = this.path.getSpacedPoints(160);

    // Base larga e escura (a "estrada")
    const base = this.add.graphics();
    base.lineStyle(14, theme.colors.buttonIdle, 0.9).strokePoints(samples);

    // Trecho liberado em neon / trecho bloqueado tracejado
    const lit = this.add.graphics();
    lit.lineStyle(4, theme.colors.primary, 1);
    const dashed = this.add.graphics();
    dashed.lineStyle(2, theme.colors.buttonBorder, 0.7);
    for (let i = 0; i < samples.length - 1; i++) {
      const t = i / (samples.length - 1);
      if (t < unlockedT) lit.lineBetween(samples[i].x, samples[i].y, samples[i + 1].x, samples[i + 1].y);
      else if (i % 4 < 2) dashed.lineBetween(samples[i].x, samples[i].y, samples[i + 1].x, samples[i + 1].y);
    }
    addGlow(lit, theme.colors.primary, GLOW.soft);

    // Pontos de energia percorrendo o trecho liberado, sem parar
    if (unlockedT <= 0) return;
    for (let i = 0; i < ENERGY_DOTS; i++) {
      const dot = this.add.circle(0, 0, 3, 0xffffff);
      addGlow(dot, theme.colors.primary, GLOW.soft);
      const progress = { t: i / ENERGY_DOTS };
      this.tweens.add({
        targets: progress,
        t: 1 + i / ENERGY_DOTS,
        duration: 3000,
        repeat: -1,
        onUpdate: () => {
          const point = this.path.getPoint((progress.t % 1) * unlockedT);
          dot.setPosition(point.x, point.y);
        },
      });
    }
  }

  /** "Etiqueta" com a dificuldade atual, no canto de cima. */
  private createDifficultyChip(): void {
    const color = this.difficulty.cor;
    const chip = addPanel(this, GAME_WIDTH / 2, 108, 230, 30, {
      fill: color,
      fillAlpha: 0.15,
      border: color,
      corner: 8,
      brackets: undefined,
    });
    addGlow(chip, color, GLOW.soft);
    this.add
      .text(GAME_WIDTH / 2, 108, `DIFICULDADE: ${this.difficulty.nome.toUpperCase()}`, titleStyle(12, cssColor(color)))
      .setOrigin(0.5)
      .setLetterSpacing(2);
    this.add
      .text(GAME_WIDTH / 2, 132, 'mude a dificuldade no menu principal', textStyle(12, theme.text.muted))
      .setOrigin(0.5);
  }

  // ---------------- Seleção ----------------

  /** Uma fase foi selecionada: atualiza o painel e leva o Rafael até ela. */
  private onLevelFocused(level: LevelData, index: number): void {
    const progress = SaveManager.getLevelProgress(this.difficulty.id, level.id);
    const enemies = level.mapa.join('').split(MAP_CHARS.ENEMY).length - 1;
    const time = formatTime(levelTime(level, this.difficulty));
    const speed = enemySpeed(level, this.difficulty);

    this.infoTitle.setText(`FASE ${level.id}  ·  ${level.nome.toUpperCase()}`);
    const record = progress
      ? `Recorde ${progress.bestScore} pts ${starsText(progress.bestStars)}`
      : 'Ainda não concluída';
    this.infoDetails.setText(
      `Tempo ${time}  ·  ${enemies} monstro(s) a ${speed} px/s  ·  ${record}  ·  ENTER para jogar`,
    );

    this.walkHeroTo(this.tOfNode(index));
  }

  /** Anima o Rafael andando pelo caminho até a posição t. */
  private walkHeroTo(targetT: number): void {
    if (!this.hero || targetT === this.walker.t) return;

    // Se ele ainda estava andando para outra fase, muda de rumo dali mesmo
    this.walkTween?.stop();
    this.hero.setFlipX(targetT > this.walker.t).play(ANIMS.PLAYER_SIDE.key, true);
    this.walkTween = this.tweens.add({
      targets: this.walker,
      t: targetT,
      duration: LEVEL_MAP.walkMs,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const point = this.path.getPoint(this.walker.t);
        this.hero.setPosition(point.x, point.y + HERO_OFFSET_Y);
      },
      onComplete: () => {
        // Chegou: para de andar e olha para a frente
        this.hero.anims.stop();
        this.hero.setFrame(ANIMS.PLAYER_DOWN.idle).setFlipX(false);
      },
    });
  }
}
