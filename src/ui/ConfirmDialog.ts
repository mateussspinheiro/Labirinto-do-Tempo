// =============================================================
// ConfirmDialog.ts — janela de confirmação ("Tem certeza?").
// Escurece a tela, mostra uma pergunta e dois botões.
// Enquanto está aberta, os botões da tela de baixo ficam inativos.
// =============================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { Button, ButtonGroup } from './Button';
import { textStyle, theme } from './Theme';

/** Profundidade (depth) alta para a janela ficar por cima de tudo. */
const DIALOG_DEPTH = 100;
const PANEL_WIDTH = 520;
const PANEL_HEIGHT = 240;

/**
 * Abre a janela de confirmação.
 * @param parentGroup grupo de botões da tela, desativado enquanto a janela está aberta
 * @param onConfirm   chamado se o jogador escolher "Sim"
 */
export function showConfirmDialog(
  scene: Phaser.Scene,
  message: string,
  confirmLabel: string,
  parentGroup: ButtonGroup,
  onConfirm: () => void,
): void {
  parentGroup.setActive(false);
  const centerX = GAME_WIDTH / 2;
  const centerY = GAME_HEIGHT / 2;

  // Fundo escuro que cobre a tela toda. Ele é "interativo" só para
  // bloquear cliques nos botões que ficaram por baixo.
  const shade = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, theme.colors.background, 0.8).setOrigin(0).setInteractive();
  const panel = scene.add.rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, theme.colors.panel).setStrokeStyle(3, theme.colors.accent);
  const text = scene.add
    .text(centerX, centerY - 50, message, { ...textStyle(22, theme.text.normal), align: 'center', wordWrap: { width: PANEL_WIDTH - 60 } })
    .setOrigin(0.5);

  const close = () => {
    dialogGroup.destroy();
    [shade, panel, text, yesButton, noButton].forEach((obj) => obj.destroy());
    parentGroup.setActive(true);
  };

  const yesButton = new Button(scene, centerX - 120, centerY + 60, confirmLabel, () => {
    close();
    onConfirm();
  }, { width: 210 });
  const noButton = new Button(scene, centerX + 120, centerY + 60, 'Cancelar', close, { width: 210 });

  [shade, panel, text, yesButton, noButton].forEach((obj) => obj.setDepth(DIALOG_DEPTH));

  // O foco começa em "Cancelar": a opção segura
  const dialogGroup = new ButtonGroup(scene, [yesButton, noButton], 1);
}
