// =============================================================
// Effects.ts — efeitos visuais reutilizáveis.
// =============================================================
import Phaser from 'phaser';
import { TEXTURES } from '../config/constants';

/**
 * Explosão de partículas: vários quadradinhos coloridos saem do ponto
 * (x, y) em todas as direções, encolhendo até sumir.
 * Usada ao coletar um cristal e quando o portal é liberado.
 */
export function burstParticles(scene: Phaser.Scene, x: number, y: number, colors: number[], amount = 16): void {
  const emitter = scene.add.particles(x, y, TEXTURES.PARTICLE, {
    speed: { min: 60, max: 170 }, // velocidade inicial (px/s)
    lifespan: 550, // cada partícula vive 0,55 s
    scale: { start: 1.6, end: 0 }, // encolhe até sumir
    tint: colors, // cor sorteada da lista
    emitting: false, // não emite sozinho: só no explode()
  });
  emitter.setDepth(10); // por cima do labirinto e do jogador
  emitter.explode(amount);
  // Depois que as partículas somem, remove o emissor da cena
  scene.time.delayedCall(700, () => emitter.destroy());
}
