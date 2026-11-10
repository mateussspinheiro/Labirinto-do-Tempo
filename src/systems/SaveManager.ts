// =============================================================
// SaveManager.ts — lê e grava dados no localStorage do navegador.
// Guarda duas coisas, em chaves separadas:
//   - configurações (volume etc.);
//   - progresso: fases concluídas, melhor tempo e melhor pontuação.
//
// O localStorage guarda apenas TEXTO. Por isso convertemos os
// objetos para JSON ao salvar (JSON.stringify) e de volta ao
// carregar (JSON.parse).
// =============================================================
import { AUDIO, STORAGE_KEYS } from '../config/constants';
import type { LevelProgress, LevelResult, SaveData, Settings } from '../types';

/** Configurações usadas na primeira vez que o jogo é aberto. */
const DEFAULT_SETTINGS: Settings = {
  volumeGeral: AUDIO.defaultMaster,
  volumeMusica: AUDIO.defaultMusic,
  volumeEfeitos: AUDIO.defaultSfx,
  mudo: false,
  altoContraste: false,
  textoGrande: false,
};

export class SaveManager {
  // ---------------- Configurações ----------------

  /** Carrega as configurações; se não houver nada salvo, usa o padrão. */
  static loadSettings(): Settings {
    const saved = SaveManager.read<Partial<Settings>>(STORAGE_KEYS.SETTINGS);
    // Junta o padrão com o que foi salvo: se faltar algum campo
    // (ex.: versão antiga do jogo), o valor padrão é usado.
    return { ...DEFAULT_SETTINGS, ...saved };
  }

  /**
   * Salva só os campos informados, mantendo os outros como estão.
   * Assim o AudioManager (volumes) e o Theme (acessibilidade) gravam
   * suas partes sem apagar a parte um do outro.
   */
  static saveSettings(changes: Partial<Settings>): void {
    SaveManager.write(STORAGE_KEYS.SETTINGS, { ...SaveManager.loadSettings(), ...changes });
  }

  // ---------------- Progresso ----------------

  static loadProgress(): SaveData {
    return SaveManager.read<SaveData>(STORAGE_KEYS.PROGRESS) ?? { levels: {} };
  }

  /** Progresso de uma fase (undefined se o jogador nunca a concluiu). */
  static getLevelProgress(levelId: number): LevelProgress | undefined {
    return SaveManager.loadProgress().levels[levelId];
  }

  /** A fase 1 está sempre liberada; as outras, só depois de concluir a anterior. */
  static isLevelUnlocked(levelId: number): boolean {
    return levelId === 1 || SaveManager.getLevelProgress(levelId - 1)?.completed === true;
  }

  /**
   * Registra o resultado de uma partida vencida, guardando só os
   * MELHORES valores (menor tempo, maior pontuação, mais estrelas).
   * @returns true se a pontuação foi um novo recorde
   */
  static saveResult(result: LevelResult): boolean {
    if (!result.victory) return false;

    const data = SaveManager.loadProgress();
    const previous = data.levels[result.levelId];
    const newRecord = !previous || result.points > previous.bestScore;

    data.levels[result.levelId] = {
      completed: true,
      bestTime: previous ? Math.min(previous.bestTime, result.timeUsed) : result.timeUsed,
      bestScore: previous ? Math.max(previous.bestScore, result.points) : result.points,
      bestStars: previous ? Math.max(previous.bestStars, result.stars) : result.stars,
    };

    SaveManager.write(STORAGE_KEYS.PROGRESS, data);
    return newRecord;
  }

  /** Se a dica "Colete os 3 cristais..." ainda não foi mostrada. */
  static shouldShowTip(): boolean {
    return SaveManager.loadProgress().tipShown !== true;
  }

  static markTipShown(): void {
    const data = SaveManager.loadProgress();
    data.tipShown = true;
    SaveManager.write(STORAGE_KEYS.PROGRESS, data);
  }

  /** Apaga todo o progresso (as configurações de volume continuam). */
  static clearProgress(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    } catch {
      // Sem acesso ao localStorage: não há o que apagar
    }
  }

  // ---------------- Funções auxiliares ----------------

  /** Lê e converte o JSON salvo. Retorna null se não existir ou estiver corrompido. */
  private static read<T>(key: string): T | null {
    try {
      const text = localStorage.getItem(key);
      return text ? (JSON.parse(text) as T) : null;
    } catch {
      // Pode falhar em modo anônimo ou se o texto salvo estiver inválido
      return null;
    }
  }

  private static write(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Sem localStorage (ex.: bloqueado pelo navegador): o jogo continua sem salvar
    }
  }
}
