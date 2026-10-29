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
