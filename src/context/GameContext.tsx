import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  computeUpdatedProgressOnCompletion,
  DEFAULT_PROGRESS,
  DEFAULT_SETTINGS,
  loadGameSettings,
  loadPlayerProgress,
   sanitizeSettings,
  saveGameSettings,
  savePlayerProgress,
} from '../storage/storage';
import {
  CalibrationOffset,
  GameSettings,
  PlayerProgress,
} from '../types/game';

interface LevelCompletionReport {
  isNewRecord: boolean;
  bestTimeMs: number;
}

interface GameContextValue {
  progress: PlayerProgress;
  settings: GameSettings;
  isLoaded: boolean;
  recordLevelCompletion: (
    levelId: number,
    elapsedMs: number
  ) => Promise<LevelCompletionReport>;
  updateSettings: (partial: Partial<GameSettings>) => Promise<void>;
  calibratePosition: (offset: CalibrationOffset) => Promise<void>;
  resetCalibration: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      const [loadedProgress, loadedSettings] = await Promise.all([
        loadPlayerProgress(),
        loadGameSettings(),
      ]);
      if (!mounted) return;
      setProgress(loadedProgress);
      setSettings(loadedSettings);
      setIsLoaded(true);
    }
    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const recordLevelCompletion = useCallback(
    async (
      levelId: number,
      elapsedMs: number
    ): Promise<LevelCompletionReport> => {
      let report: LevelCompletionReport = {
        isNewRecord: true,
        bestTimeMs: elapsedMs,
      };

      setProgress((prev) => {
        const result = computeUpdatedProgressOnCompletion(
          prev,
          levelId,
          elapsedMs
        );
        report = {
          isNewRecord: result.isNewRecord,
          bestTimeMs: result.bestTimeMs,
        };
        savePlayerProgress(result.nextProgress);
        return result.nextProgress;
      });

      return report;
    },
    []
  );

  const updateSettings = useCallback(
    async (partial: Partial<GameSettings>) => {
      setSettings((prev) => {
        const next = sanitizeSettings({ ...prev, ...partial });
        saveGameSettings(next);
        return next;
      });
    },
    []
  );

  const calibratePosition = useCallback(
    async (offset: CalibrationOffset) => {
      await updateSettings({ calibration: offset });
    },
    [updateSettings]
  );

  const resetCalibration = useCallback(async () => {
    await updateSettings({ calibration: { x: 0, y: 0 } });
  }, [updateSettings]);

  const resetProgress = useCallback(async () => {
    const fresh: PlayerProgress = {
      completedLevels: [],
      bestTimesMs: {},
      highestUnlockedLevel: 1,
    };
    setProgress(fresh);
    await savePlayerProgress(fresh);
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      progress,
      settings,
      isLoaded,
      recordLevelCompletion,
      updateSettings,
      calibratePosition,
      resetCalibration,
      resetProgress,
    }),
    [
      progress,
      settings,
      isLoaded,
      recordLevelCompletion,
      updateSettings,
      calibratePosition,
      resetCalibration,
      resetProgress,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame deve ser usado dentro de um GameProvider.');
  }
  return ctx;
}
