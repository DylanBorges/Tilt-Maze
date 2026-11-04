import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEVELS } from '../levels/levelsData';
import {
  clampDeadzone,
  clampDownwardBoost,
  clampGravityMultiplier,
  clampSensitivity,
} from '../sensors/sensorMath';
import { GameSettings, PlayerProgress } from '../types/game';

const PROGRESS_STORAGE_KEY = '@tilt_maze:progress_v1';
const SETTINGS_STORAGE_KEY = '@tilt_maze:settings_v1';

export const DEFAULT_PROGRESS: PlayerProgress = {
  completedLevels: [],
  bestTimesMs: {},
  highestUnlockedLevel: 1,
};

export const DEFAULT_SETTINGS: GameSettings = {
  sensitivity: 1.0,
  gravityMultiplier: 1.25,
  downwardBoost: 1.2,
  deadzone: 0.035,
  postureMode: 'handheld',
  virtualControlType: 'joystick',
  calibration: { x: 0, y: 0 },
  showVirtualControls: true,
  invertX: false,
  invertY: false,
};

/**
 * Valida e sanitiza um objeto bruto de progresso carregado do armazenamento local.
 */
export function sanitizeProgress(raw: unknown): PlayerProgress {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PROGRESS, bestTimesMs: {} };
  }

  const record = raw as Record<string, unknown>;
  const validLevelIds = new Set(LEVELS.map((l) => l.id));

  const completedLevels: number[] = Array.isArray(record.completedLevels)
    ? Array.from(
        new Set(
          record.completedLevels.filter(
            (id): id is number =>
              typeof id === 'number' &&
              Number.isInteger(id) &&
              validLevelIds.has(id)
          )
        )
      ).sort((a, b) => a - b)
    : [];

  const bestTimesMs: Record<number, number> = {};
  if (record.bestTimesMs && typeof record.bestTimesMs === 'object') {
    for (const [key, value] of Object.entries(
      record.bestTimesMs as Record<string, unknown>
    )) {
      const levelId = Number(key);
      if (
        Number.isInteger(levelId) &&
        validLevelIds.has(levelId) &&
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value > 0
      ) {
        bestTimesMs[levelId] = Math.floor(value);
      }
    }
  }

  const maxCompleted =
    completedLevels.length > 0 ? Math.max(...completedLevels) : 0;
  const rawHighest =
    typeof record.highestUnlockedLevel === 'number' &&
    Number.isInteger(record.highestUnlockedLevel)
      ? record.highestUnlockedLevel
      : 1;

  const highestUnlockedLevel = Math.max(
    1,
    Math.min(LEVELS.length, Math.max(rawHighest, maxCompleted + 1))
  );

  return {
    completedLevels,
    bestTimesMs,
    highestUnlockedLevel,
  };
}

/**
 * Valida e sanitiza um objeto bruto de configurações carregado do armazenamento local.
 */
export function sanitizeSettings(raw: unknown): GameSettings {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_SETTINGS,
      calibration: { ...DEFAULT_SETTINGS.calibration },
    };
  }

  const record = raw as Record<string, unknown>;
  const sensitivity =
    typeof record.sensitivity === 'number'
      ? clampSensitivity(record.sensitivity)
      : DEFAULT_SETTINGS.sensitivity;

  const gravityMultiplier =
    typeof record.gravityMultiplier === 'number'
      ? clampGravityMultiplier(record.gravityMultiplier)
      : DEFAULT_SETTINGS.gravityMultiplier;

  const downwardBoost =
    typeof record.downwardBoost === 'number'
      ? clampDownwardBoost(record.downwardBoost)
      : DEFAULT_SETTINGS.downwardBoost;

  const deadzone =
    typeof record.deadzone === 'number'
      ? clampDeadzone(record.deadzone)
      : DEFAULT_SETTINGS.deadzone;

  const postureMode = 'handheld';

  const virtualControlType =
    record.virtualControlType === 'dpad'
      ? 'dpad'
      : DEFAULT_SETTINGS.virtualControlType;

  let calX = 0;
  let calY = 0;
  if (record.calibration && typeof record.calibration === 'object') {
    const cal = record.calibration as Record<string, unknown>;
    if (typeof cal.x === 'number' && Number.isFinite(cal.x)) {
      calX = Math.max(-0.8, Math.min(0.8, cal.x));
    }
    if (typeof cal.y === 'number' && Number.isFinite(cal.y)) {
      calY = Math.max(-0.8, Math.min(0.8, cal.y));
    }
  }

  const showVirtualControls =
    typeof record.showVirtualControls === 'boolean'
      ? record.showVirtualControls
      : DEFAULT_SETTINGS.showVirtualControls;

  const invertX =
    typeof record.invertX === 'boolean'
      ? record.invertX
      : DEFAULT_SETTINGS.invertX;

  const invertY =
    typeof record.invertY === 'boolean'
      ? record.invertY
      : DEFAULT_SETTINGS.invertY;

  return {
    sensitivity,
    gravityMultiplier,
    downwardBoost,
    deadzone,
    postureMode,
    virtualControlType,
    calibration: { x: calX, y: calY },
    showVirtualControls,
    invertX,
    invertY,
  };
}

export async function loadPlayerProgress(): Promise<PlayerProgress> {
  try {
    const rawJson = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!rawJson) {
      return { ...DEFAULT_PROGRESS, bestTimesMs: {} };
    }
    const parsed: unknown = JSON.parse(rawJson);
    return sanitizeProgress(parsed);
  } catch {
    return { ...DEFAULT_PROGRESS, bestTimesMs: {} };
  }
}

export async function savePlayerProgress(
  progress: PlayerProgress
): Promise<void> {
  try {
    const sanitized = sanitizeProgress(progress);
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Falha silenciosa segura caso o armazenamento esteja indisponível
  }
}

export async function loadGameSettings(): Promise<GameSettings> {
  try {
    const rawJson = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!rawJson) {
      return {
        ...DEFAULT_SETTINGS,
        calibration: { ...DEFAULT_SETTINGS.calibration },
      };
    }
    const parsed: unknown = JSON.parse(rawJson);
    return sanitizeSettings(parsed);
  } catch {
    return {
      ...DEFAULT_SETTINGS,
      calibration: { ...DEFAULT_SETTINGS.calibration },
    };
  }
}

export async function saveGameSettings(settings: GameSettings): Promise<void> {
  try {
    const sanitized = sanitizeSettings(settings);
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Falha silenciosa segura
  }
}

/**
 * Calcula o novo estado de progresso após a conclusão de uma fase.
 */
export function computeUpdatedProgressOnCompletion(
  current: PlayerProgress,
  levelId: number,
  elapsedMs: number
): { nextProgress: PlayerProgress; isNewRecord: boolean; bestTimeMs: number } {
  const safeTime = Math.max(100, Math.floor(elapsedMs));
  const previousBest = current.bestTimesMs[levelId];
  const isNewRecord = previousBest === undefined || safeTime < previousBest;
  const bestTimeMs = isNewRecord ? safeTime : previousBest;

  const completedSet = new Set(current.completedLevels);
  completedSet.add(levelId);

  const nextUnlocked = Math.min(
    LEVELS.length,
    Math.max(current.highestUnlockedLevel, levelId + 1)
  );

  const nextProgress: PlayerProgress = {
    completedLevels: Array.from(completedSet).sort((a, b) => a - b),
    bestTimesMs: {
      ...current.bestTimesMs,
      [levelId]: bestTimeMs,
    },
    highestUnlockedLevel: nextUnlocked,
  };

  return { nextProgress, isNewRecord, bestTimeMs };
}
