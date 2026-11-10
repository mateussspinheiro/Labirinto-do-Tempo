// =============================================================
// SettingsScene — configurações do jogo, em duas colunas:
//   - Áudio: três sliders (volume geral, música e efeitos) e mudo.
//     Cada mudança vai para o AudioManager, que aplica na hora e
//     salva no localStorage.
//   - Acessibilidade: alto contraste e texto maior (Theme.ts).
//   - Progresso: apagar o progresso (com confirmação).
// =============================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, SOUNDS } from '../config/constants';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { Button, ButtonGroup } from '../ui/Button';
import { showConfirmDialog } from '../ui/ConfirmDialog';
import { addScreenFrame } from '../ui/ScreenFrame';
import { Slider } from '../ui/Slider';
import { setHighContrast, setLargeText, textStyle, theme } from '../ui/Theme';

/** Intervalo mínimo (ms) entre os sons de teste ao arrastar o slider. */
const PREVIEW_INTERVAL = 150;
/** Centro de cada coluna. */
const LEFT_X = 220;
const RIGHT_X = 590;
const COLUMN_BUTTON_WIDTH = 300;

/** Dados ao reabrir a tela (para manter o foco no botão que foi usado). */
interface SettingsSceneData {
  focusIndex?: number;
}

export class SettingsScene extends Phaser.Scene {
  private lastPreview = 0;
  private focusIndex = 0;

  constructor() {
    super(SCENES.SETTINGS);
  }

  init(data: SettingsSceneData): void {
    this.focusIndex = data?.focusIndex ?? 0;
  }

  create(): void {
    const audio = AudioManager.get();
    const settings = audio.getSettings();

    // Música de fundo continua tocando: assim dá para ouvir o efeito dos sliders
    audio.playMusic(SOUNDS.MUSIC_MENU);

    const backButton = addScreenFrame(this, 'Configurações');

    // ================= Coluna da esquerda: ÁUDIO =================
    this.add.text(LEFT_X, 120, 'Áudio', textStyle(24, theme.text.muted, true)).setOrigin(0.5);

    // Cada slider chama o método correspondente do AudioManager
    const masterSlider = new Slider(this, LEFT_X, 190, 'Volume geral', settings.volumeGeral, (value) => {
      audio.setMasterVolume(value);
      this.previewSound();
    });
    const musicSlider = new Slider(this, LEFT_X, 260, 'Música', settings.volumeMusica, (value) => audio.setMusicVolume(value));
    const sfxSlider = new Slider(this, LEFT_X, 330, 'Efeitos', settings.volumeEfeitos, (value) => {
      audio.setSfxVolume(value);
      this.previewSound();
    });

    // Botão de mudo: o texto mostra o estado atual
    const muteLabel = () => (audio.getSettings().mudo ? 'Som: desligado' : 'Som: ligado');
    const muteButton = new Button(this, LEFT_X, 400, muteLabel(), () => {
      audio.toggleMute();
      muteButton.setText(muteLabel());
    }, { width: COLUMN_BUTTON_WIDTH });

    // ============ Coluna da direita: ACESSIBILIDADE e PROGRESSO ============
    this.add.text(RIGHT_X, 120, 'Acessibilidade', textStyle(24, theme.text.muted, true)).setOrigin(0.5);

    const onOff = (value: boolean) => (value ? 'sim' : 'não');
    // Ao mudar a aparência, a tela é reaberta para já mostrar o novo visual
    const contrastButton = new Button(this, RIGHT_X, 180, `Alto contraste: ${onOff(theme.highContrast)}`, () => {
      setHighContrast(!theme.highContrast);
      this.scene.restart({ focusIndex: 4 });
    }, { width: COLUMN_BUTTON_WIDTH });
    const largeTextButton = new Button(this, RIGHT_X, 246, `Texto maior: ${onOff(theme.largeText)}`, () => {
      setLargeText(!theme.largeText);
      this.scene.restart({ focusIndex: 5 });
    }, { width: COLUMN_BUTTON_WIDTH });

    this.add.text(RIGHT_X, 330, 'Progresso', textStyle(24, theme.text.muted, true)).setOrigin(0.5);
    const clearButton = new Button(this, RIGHT_X, 400, 'Apagar progresso', () =>
      showConfirmDialog(this, 'Apagar todo o progresso?\nFases concluídas e recordes serão perdidos.', 'Sim, apagar', group, () => {
        SaveManager.clearProgress();
        this.showToast('Progresso apagado.');
      }),
    { width: COLUMN_BUTTON_WIDTH });

    // Dica dos atalhos de volume
    this.add
      .text(GAME_WIDTH / 2, 470, 'Durante a partida: + / - mudam o volume geral · M liga/desliga o som', textStyle(16, theme.text.muted))
      .setOrigin(0.5);

    // Ordem da navegação pelo teclado (os índices 4 e 5 são usados no restart acima)
    const group = new ButtonGroup(
      this,
      [masterSlider, musicSlider, sfxSlider, muteButton, contrastButton, largeTextButton, clearButton, backButton],
      this.focusIndex,
    );
  }

  /** Mensagem curta que aparece e some sozinha. */
  private showToast(message: string): void {
    const toast = this.add.text(RIGHT_X, 445, message, textStyle(18, theme.text.success, true)).setOrigin(0.5);
    this.tweens.add({ targets: toast, alpha: 0, delay: 1500, duration: 400, onComplete: () => toast.destroy() });
  }

  /** Toca um efeito curto para o jogador ouvir o volume escolhido. */
  private previewSound(): void {
    if (this.time.now - this.lastPreview < PREVIEW_INTERVAL) return;
    this.lastPreview = this.time.now;
    AudioManager.get().playSfx(SOUNDS.CRYSTAL);
  }
}
