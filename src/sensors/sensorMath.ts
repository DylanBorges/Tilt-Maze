import { GameSettings, Vector2D } from '../types/game';

export const LOW_PASS_ALPHA = 0.28;
export const SENSOR_DEADZONE = 0.025;
export const MAX_TILT_MAGNITUDE = 1.5;
export const MIN_SENSITIVITY = 0.4;
export const MAX_SENSITIVITY = 2.5;

export function clampSensitivity(value: number): number {
  if (!Number.isFinite(value)) return 1.0;
  return Math.max(
    MIN_SENSITIVITY,
    Math.min(MAX_SENSITIVITY, Math.round(value * 10) / 10)
  );
}

/**
 * Filtro passa-baixa exponencial para reduzir ruído de alta frequência do acelerômetro.
 */
export function applyLowPassFilter(
  previous: Vector2D,
  raw: Vector2D,
  alpha: number = LOW_PASS_ALPHA
): Vector2D {
  return {
    x: previous.x + alpha * (raw.x - previous.x),
    y: previous.y + alpha * (raw.y - previous.y),
  };
}

/**
 * Aplica zona morta suave para evitar deslocamentos involuntários quando o aparelho está quase plano.
 */
export function applyDeadzone(value: number, deadzone: number = SENSOR_DEADZONE): number {
  const abs = Math.abs(value);
  if (abs <= deadzone) {
    return 0;
  }
  const sign = value >= 0 ? 1 : -1;
  return sign * ((abs - deadzone) / (1 - deadzone));
}

/**
 * Converte leituras brutas do acelerômetro em vetor de movimento 2D no plano da tela.
 * No Android/Expo, inclinar o aparelho para a direita gera x negativo no sensor;
 * por padrão convertemos (-raw.x, raw.y) para coordenadas de tela (+X direita, +Y baixo).
 */
export function mapRawAccelerometerToScreenAxes(
  rawSensor: { x: number; y: number },
  invertX: boolean = false,
  invertY: boolean = false
): Vector2D {
  const mappedX = -rawSensor.x * (invertX ? -1 : 1);
  const mappedY = rawSensor.y * (invertY ? -1 : 1);
  return { x: mappedX, y: mappedY };
}

/**
 * Processa a leitura do sensor aplicando filtragem de ruído, calibração de posição neutra,
 * zona morta e multiplicador de sensibilidade configurável.
 */
export function processTiltInput(
  mappedRaw: Vector2D,
  previousSmoothed: Vector2D,
  settings: GameSettings
): { smoothed: Vector2D; tilt: Vector2D } {
  const smoothed = applyLowPassFilter(previousSmoothed, mappedRaw);

  const calibratedX = smoothed.x - (settings.calibration?.x ?? 0);
  const calibratedY = smoothed.y - (settings.calibration?.y ?? 0);

  const filteredX = applyDeadzone(calibratedX);
  const filteredY = applyDeadzone(calibratedY);

  const sensitivity = clampSensitivity(settings.sensitivity);
  let tiltX = filteredX * sensitivity;
  let tiltY = filteredY * sensitivity;

  const magnitude = Math.hypot(tiltX, tiltY);
  if (magnitude > MAX_TILT_MAGNITUDE) {
    const scale = MAX_TILT_MAGNITUDE / magnitude;
    tiltX *= scale;
    tiltY *= scale;
  }

  return {
    smoothed,
    tilt: { x: tiltX, y: tiltY },
  };
}
