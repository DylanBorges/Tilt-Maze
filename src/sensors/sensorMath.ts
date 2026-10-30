import { GameSettings, Vector2D } from '../types/game';

export const LOW_PASS_ALPHA = 0.28;
export const DEFAULT_DEADZONE = 0.035;
export const MIN_DEADZONE = 0.01;
export const MAX_DEADZONE = 0.12;

export const MAX_TILT_MAGNITUDE = 1.8;
export const MIN_SENSITIVITY = 0.4;
export const MAX_SENSITIVITY = 2.5;

export const MIN_GRAVITY_MULTIPLIER = 0.5;
export const MAX_GRAVITY_MULTIPLIER = 2.5;
export const DEFAULT_GRAVITY_MULTIPLIER = 1.25;

export const MIN_DOWNWARD_BOOST = 1.0;
export const MAX_DOWNWARD_BOOST = 1.8;
export const DEFAULT_DOWNWARD_BOOST = 1.2;

/**
 * Offset padrão do eixo Y quando o celular é segurado naturalmente na mão
 * em modo retrato com ângulo de visão confortável (~40° a 50° em relação à horizontal).
 */
export const HANDHELD_NEUTRAL_PITCH_Y = 0.55;

export function clampSensitivity(value: number): number {
  if (!Number.isFinite(value)) return 1.0;
  return Math.max(
    MIN_SENSITIVITY,
    Math.min(MAX_SENSITIVITY, Math.round(value * 10) / 10)
  );
}

export function clampDeadzone(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DEADZONE;
  return Math.max(
    MIN_DEADZONE,
    Math.min(MAX_DEADZONE, Math.round(value * 1000) / 1000)
  );
}

export function clampGravityMultiplier(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_GRAVITY_MULTIPLIER;
  return Math.max(
    MIN_GRAVITY_MULTIPLIER,
    Math.min(MAX_GRAVITY_MULTIPLIER, Math.round(value * 10) / 10)
  );
}

export function clampDownwardBoost(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DOWNWARD_BOOST;
  return Math.max(
    MIN_DOWNWARD_BOOST,
    Math.min(MAX_DOWNWARD_BOOST, Math.round(value * 10) / 10)
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
export function applyDeadzone(
  value: number,
  deadzone: number = DEFAULT_DEADZONE
): number {
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
 * Processa a leitura do sensor aplicando:
 * 1. Filtragem passa-baixa de ruído
 * 2. Compensação de postura (Modo Na Mão em pé vs. Mesa deitado)
 * 3. Offset de calibração manual do usuário
 * 4. Zona morta suave configurável (deadzone)
 * 5. Reforço de descida vertical (downwardBoost)
 * 6. Multiplicador de sensibilidade e escala geral de gravidade
 */
export function processTiltInput(
  mappedRaw: Vector2D,
  previousSmoothed: Vector2D,
  settings: GameSettings
): { smoothed: Vector2D; tilt: Vector2D } {
  const smoothed = applyLowPassFilter(previousSmoothed, mappedRaw);

  // Se o modo for handheld (na mão / vertical), usamos a postura natural de ~45° como neutro.
  // Ao inclinar o topo para a frente (para a bolinha descer), smoothed.y DIMINUI no acelerômetro,
  // portanto a aceleração para baixo (+Y da tela) é proporcional a (postureOffsetY - smoothed.y).
  const postureOffsetY =
    settings.postureMode === 'handheld' ? HANDHELD_NEUTRAL_PITCH_Y : 0;

  const calibratedX = smoothed.x - (settings.calibration?.x ?? 0);
  const calibratedY =
    (postureOffsetY - smoothed.y) - (settings.calibration?.y ?? 0);

  const deadzone = clampDeadzone(settings.deadzone);
  let filteredX = applyDeadzone(calibratedX, deadzone);
  let filteredY = applyDeadzone(calibratedY, deadzone);

  // Reforço ergonômico para descida (quando Y > 0 / inclinação para frente)
  const downwardBoost = clampDownwardBoost(settings.downwardBoost);
  if (filteredY > 0) {
    filteredY *= downwardBoost;
  }

  const sensitivity = clampSensitivity(settings.sensitivity);
  const gravityScale = clampGravityMultiplier(settings.gravityMultiplier);

  let tiltX = filteredX * sensitivity * gravityScale;
  let tiltY = filteredY * sensitivity * gravityScale;

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
