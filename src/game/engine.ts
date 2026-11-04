import { findCellByType } from '../levels/levelsData';
import {
  BallState,
  CELL_GOAL,
  CELL_HAZARD,
  CELL_START,
  CELL_WALL,
  GridCoordinate,
  LevelDefinition,
  StepSimulationResult,
  Vector2D,
} from '../types/game';

export const DEFAULT_BALL_RADIUS = 0.31;
const ACCELERATION_SCALE = 24.0;
const DAMPING_FACTOR = 3.8;
const MAX_SPEED = 8.5;
const WALL_RESTITUTION = 0.12;
const SUB_STEPS = 3;
const HAZARD_TRIGGER_DIST = 0.37;
const GOAL_TRIGGER_DIST = 0.42;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createInitialBallState(level: LevelDefinition): BallState {
  const start = findCellByType(level, CELL_START) ?? { row: 1, col: 1 };
  return {
    x: start.col + 0.5,
    y: start.row + 0.5,
    vx: 0,
    vy: 0,
    radius: DEFAULT_BALL_RADIUS,
  };
}

/**
 * Resolve colisões entre a bolinha (círculo) e as células de parede (AABB [c, c+1] x [r, r+1]).
 * Ordena paredes candidatas pela distância ao centro da célula para evitar travamentos em quinas internas.
 */
function resolveWallCollisions(
  ball: BallState,
  level: LevelDefinition
): boolean {
  let collided = false;
  const r = ball.radius;

  // Limites externos do tabuleiro
  if (ball.x - r < 0) {
    ball.x = r;
    if (ball.vx < 0) ball.vx = -ball.vx * WALL_RESTITUTION;
    collided = true;
  } else if (ball.x + r > level.cols) {
    ball.x = level.cols - r;
    if (ball.vx > 0) ball.vx = -ball.vx * WALL_RESTITUTION;
    collided = true;
  }

  if (ball.y - r < 0) {
    ball.y = r;
    if (ball.vy < 0) ball.vy = -ball.vy * WALL_RESTITUTION;
    collided = true;
  } else if (ball.y + r > level.rows) {
    ball.y = level.rows - r;
    if (ball.vy > 0) ball.vy = -ball.vy * WALL_RESTITUTION;
    collided = true;
  }

  const minRow = Math.max(0, Math.floor(ball.y - r - 1));
  const maxRow = Math.min(level.rows - 1, Math.ceil(ball.y + r + 1));
  const minCol = Math.max(0, Math.floor(ball.x - r - 1));
  const maxCol = Math.min(level.cols - 1, Math.ceil(ball.x + r + 1));

  const candidateWalls: { row: number; col: number; distSq: number }[] = [];

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (level.grid[row]?.[col] === CELL_WALL) {
        const cx = col + 0.5;
        const cy = row + 0.5;
        const dx = ball.x - cx;
        const dy = ball.y - cy;
        candidateWalls.push({ row, col, distSq: dx * dx + dy * dy });
      }
    }
  }

  candidateWalls.sort((a, b) => a.distSq - b.distSq);

  for (const wall of candidateWalls) {
    const minX = wall.col;
    const maxX = wall.col + 1;
    const minY = wall.row;
    const maxY = wall.row + 1;

    const closestX = clamp(ball.x, minX, maxX);
    const closestY = clamp(ball.y, minY, maxY);

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < r * r) {
      collided = true;
      const dist = Math.sqrt(distSq);

      let nx = 0;
      let ny = 0;

      if (dist > 1e-6) {
        nx = dx / dist;
        ny = dy / dist;
      } else {
        // Caso raro: centro da bolinha exatamente na borda/interior
        const toCenterX = ball.x - (wall.col + 0.5);
        const toCenterY = ball.y - (wall.row + 0.5);
        if (Math.abs(toCenterX) > Math.abs(toCenterY)) {
          nx = toCenterX >= 0 ? 1 : -1;
        } else {
          ny = toCenterY >= 0 ? 1 : -1;
        }
      }

      const overlap = r - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      const normalVelocity = ball.vx * nx + ball.vy * ny;
      if (normalVelocity < 0) {
        const impulse = -(1 + WALL_RESTITUTION) * normalVelocity;
        ball.vx += impulse * nx;
        ball.vy += impulse * ny;

        // Evita micro-vibrações quando a velocidade normal é muito baixa
        if (Math.abs(ball.vx) < 0.02) ball.vx = 0;
        if (Math.abs(ball.vy) < 0.02) ball.vy = 0;
      }
    }
  }

  return collided;
}

function checkCellTrigger(
  ball: BallState,
  level: LevelDefinition,
  targetCell: number,
  triggerDistance: number
): GridCoordinate | null {
  const minRow = Math.max(0, Math.floor(ball.y - 1));
  const maxRow = Math.min(level.rows - 1, Math.ceil(ball.y + 1));
  const minCol = Math.max(0, Math.floor(ball.x - 1));
  const maxCol = Math.min(level.cols - 1, Math.ceil(ball.x + 1));

  const maxDistSq = triggerDistance * triggerDistance;

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (level.grid[row]?.[col] === targetCell) {
        const cx = col + 0.5;
        const cy = row + 0.5;
        const dx = ball.x - cx;
        const dy = ball.y - cy;
        if (dx * dx + dy * dy <= maxDistSq) {
          return { row, col };
        }
      }
    }
  }
  return null;
}

/**
 * Executa um passo de simulação física 2D da bolinha no labirinto.
 * @param currentBall Estado atual da bolinha
 * @param level Definição da fase ativa
 * @param tilt Vetor de inclinação já calibrado e multiplicado pela sensibilidade
 * @param dtSeconds Intervalo de tempo em segundos
 */
export function stepBallPhysics(
  currentBall: BallState,
  level: LevelDefinition,
  tilt: Vector2D,
  dtSeconds: number
): StepSimulationResult {
  const clampedDt = clamp(dtSeconds, 0, 0.05);
  if (clampedDt <= 0) {
    return {
      ball: { ...currentBall },
      hitWall: false,
      hitHazard: false,
      reachedGoal: false,
    };
  }

  const nextBall: BallState = { ...currentBall };
  const subDt = clampedDt / SUB_STEPS;
  let hitWall = false;

  for (let i = 0; i < SUB_STEPS; i++) {
    const ax = tilt.x * ACCELERATION_SCALE;
    const ay = tilt.y * ACCELERATION_SCALE;

    nextBall.vx += ax * subDt;
    nextBall.vy += ay * subDt;

    const damping = Math.exp(-DAMPING_FACTOR * subDt);
    nextBall.vx *= damping;
    nextBall.vy *= damping;

    const speed = Math.hypot(nextBall.vx, nextBall.vy);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      nextBall.vx *= scale;
      nextBall.vy *= scale;
    }

    nextBall.x += nextBall.vx * subDt;
    nextBall.y += nextBall.vy * subDt;

    if (resolveWallCollisions(nextBall, level)) {
      hitWall = true;
    }

    const goalHit = checkCellTrigger(
      nextBall,
      level,
      CELL_GOAL,
      GOAL_TRIGGER_DIST
    );
    if (goalHit) {
      nextBall.x = goalHit.col + 0.5;
      nextBall.y = goalHit.row + 0.5;
      nextBall.vx = 0;
      nextBall.vy = 0;
      return {
        ball: nextBall,
        hitWall,
        hitHazard: false,
        reachedGoal: true,
      };
    }

    const hazardHit = checkCellTrigger(
      nextBall,
      level,
      CELL_HAZARD,
      HAZARD_TRIGGER_DIST
    );
    if (hazardHit) {
      const resetBall = createInitialBallState(level);
      return {
        ball: resetBall,
        hitWall: false,
        hitHazard: true,
        reachedGoal: false,
      };
    }
  }

  return {
    ball: nextBall,
    hitWall,
    hitHazard: false,
    reachedGoal: false,
  };
}

/**
 * Formata milissegundos no padrão MM:SS.cc (ex: 00:14.35)
 */
export function formatTimeMs(ms: number): string {
  const safeMs = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((safeMs % 1000) / 10);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const cc = String(centiseconds).padStart(2, '0');

  return `${mm}:${ss}.${cc}`;
}
