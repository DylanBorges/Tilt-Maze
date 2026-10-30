export type CellCode = 0 | 1 | 2 | 3 | 4;

/**
 * 0 = Caminho livre (empty)
 * 1 = Parede sólida (wall)
 * 2 = Posição inicial (start)
 * 3 = Ponto de chegada (goal)
 * 4 = Armadilha / buraco perigoso (hazard)
 */
export const CELL_EMPTY: CellCode = 0;
export const CELL_WALL: CellCode = 1;
export const CELL_START: CellCode = 2;
export const CELL_GOAL: CellCode = 3;
export const CELL_HAZARD: CellCode = 4;

export interface GridCoordinate {
  row: number;
  col: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export type LevelDifficulty =
  | 'Iniciante'
  | 'Fácil'
  | 'Médio'
  | 'Difícil'
  | 'Especialista';

export interface LevelDefinition {
  id: number;
  name: string;
  subtitle: string;
  difficulty: LevelDifficulty;
  rows: number;
  cols: number;
  grid: CellCode[][];
  parTimeMs: number;
  accentColor: string;
}

export interface BallState {
  /** Posição horizontal em unidades da grade (0 até cols) */
  x: number;
  /** Posição vertical em unidades da grade (0 até rows) */
  y: number;
  /** Velocidade horizontal em unidades de grade por segundo */
  vx: number;
  /** Velocidade vertical em unidades de grade por segundo */
  vy: number;
  /** Raio da bolinha em unidades da grade */
  radius: number;
}

export type GameStatus =
  | 'playing'
  | 'paused'
  | 'completed';

export interface StepSimulationResult {
  ball: BallState;
  hitWall: boolean;
  hitHazard: boolean;
  reachedGoal: boolean;
}

export interface CalibrationOffset {
  x: number;
  y: number;
}

export interface GameSettings {
  /** Multiplicador de sensibilidade (0.4 a 2.5, padrão 1.0) */
  sensitivity: number;
  /** Multiplicador geral de gravidade/aceleração da bolinha (0.5 a 2.5, padrão 1.25) */
  gravityMultiplier: number;
  /** Reforço de aceleração para baixo / descida no eixo vertical (1.0 a 1.6, padrão 1.2) */
  downwardBoost: number;
  /** Tamanho da zona morta / zona neutra (0.01 a 0.12, padrão 0.035) */
  deadzone: number;
  /** Postura padrão recomendada para a posição neutra */
  postureMode: 'handheld' | 'table';
  /** Tipo de controle simulado na tela: Joystick flutuante ou D-Pad */
  virtualControlType: 'joystick' | 'dpad';
  /** Offset de calibração para posição neutra confortável */
  calibration: CalibrationOffset;
  /** Exibir controles simulados na tela para emulador/testes */
  showVirtualControls: boolean;
  /** Inverter eixo horizontal se desejado */
  invertX: boolean;
  /** Inverter eixo vertical se desejado */
  invertY: boolean;
}

export interface PlayerProgress {
  /** IDs das fases já concluídas */
  completedLevels: number[];
  /** Melhor tempo (em milissegundos) registrado por ID de fase */
  bestTimesMs: Record<number, number>;
  /** Maior ID de fase desbloqueada pelo jogador */
  highestUnlockedLevel: number;
}
