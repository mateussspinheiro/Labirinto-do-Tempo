// =============================================================
// SaveManager.ts — lê e grava dados no localStorage do navegador.
//
// O localStorage guarda apenas TEXTO. Por isso convertemos os
// objetos para JSON ao salvar (JSON.stringify) e de volta ao
// carregar (JSON.parse).
// =============================================================
import { AUDIO, STORAGE_KEYS } from '../config/constants';
import type { Settings } from '../types';

/** Configurações usadas na primeira vez que o jogo é aberto. */
export const DEFAULT_SETTINGS: Settings = {
  volumeGeral: AUDIO.defaultMaster,
  volumeMusica: AUDIO.defaultMusic,
  volumeEfeitos: AUDIO.defaultSfx,
  mudo: false,
};

export class SaveManager {
  /** Carrega as configurações; se não houver nada salvo, usa o padrão. */
  static loadSettings(): Settings {
    const saved = SaveManager.read<Partial<Settings>>(STORAGE_KEYS.SETTINGS);
    // Junta o padrão com o que foi salvo: se faltar algum campo
    // (ex.: versão antiga do jogo), o valor padrão é usado.
    return { ...DEFAULT_SETTINGS, ...saved };
  }

  static saveSettings(settings: Settings): void {
    SaveManager.write(STORAGE_KEYS.SETTINGS, settings);
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
