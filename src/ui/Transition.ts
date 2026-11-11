// =============================================================
// Transition.ts — troca de tela com "fade" (escurece e clareia).
//
// Em vez de this.scene.start(...), as cenas chamam goToScene(...):
//   1. todas as cenas visíveis escurecem juntas (fadeOut) — por
//      exemplo a partida e o HUD, ou o menu e a sua ilustração;
//   2. quando termina, a próxima cena é iniciada;
//   3. a câmera da próxima cena começa escura e clareia (fadeIn).
// =============================================================
import Phaser from 'phaser';
import { FADE_MS } from '../config/constants';
import { theme } from './Theme';

/** Componentes vermelho, verde e azul (0-255) da cor de fundo atual. */
function backgroundRGB(): [number, number, number] {
  const color = Phaser.Display.Color.IntegerToColor(theme.colors.background);
  return [color.red, color.green, color.blue];
}

/**
 * Vai para outra cena com fade.
 * @param from          cena atual
 * @param key           chave da próxima cena (SCENES.*)
 * @param data          dados enviados para o init() da próxima cena
 * @param onBeforeStart algo a fazer logo antes de trocar (ex.: fechar outra cena)
 */
export function goToScene(from: Phaser.Scene, key: string, data?: object, onBeforeStart?: () => void): void {
  const camera = from.cameras.main;
  // Se já está trocando de tela, ignora (evita cliques/teclas repetidos)
  if (camera.fadeEffect.isRunning) return;

  // Escurece todas as cenas que estão aparecendo na tela
  // (rodando ou pausadas; cenas paradas ou dormindo não aparecem)
  const visibleScenes = from.scene.manager
    .getScenes(false)
    .filter((scene) => (scene.sys.isActive() || scene.sys.isPaused()) && scene.sys.isVisible());
  for (const scene of visibleScenes) scene.cameras.main.fadeOut(FADE_MS, ...backgroundRGB());

  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    onBeforeStart?.();
    from.scene.start(key, data);

    // Quando a próxima cena terminar o create(), ela "clareia"
    const next = from.scene.get(key);
    next.events.once(Phaser.Scenes.Events.CREATE, () => next.cameras.main.fadeIn(FADE_MS, ...backgroundRGB()));
  });
}
