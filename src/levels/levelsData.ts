import {
  CELL_EMPTY,
  CELL_GOAL,
  CELL_HAZARD,
  CELL_START,
  CellCode,
  GridCoordinate,
  LevelDefinition,
} from '../types/game';

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: 'Primeiros Passos',
    subtitle: 'Aprenda a controlar a inclinação do dispositivo por corredores largos.',
    difficulty: 'Iniciante',
    rows: 9,
    cols: 9,
    parTimeMs: 12000,
    accentColor: '#10B981',
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    id: 2,
    name: 'Curvas de Atenção',
    subtitle: 'Controle a velocidade nas curvas e evite cair nos buracos vermelhos.',
    difficulty: 'Fácil',
    rows: 11,
    cols: 9,
    parTimeMs: 18000,
    accentColor: '#3B82F6',
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 0, 0, 0, 4, 1],
      [1, 1, 1, 1, 1, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 1, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 4, 1, 1, 0, 1, 1, 0, 1],
      [1, 1, 1, 1, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 1, 4, 1, 0, 1],
      [1, 3, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    id: 3,
    name: 'Encruzilhada Perigosa',
    subtitle: 'Escolha o caminho certo e faça ajustes sutis para passar pelas armadilhas.',
    difficulty: 'Médio',
    rows: 13,
    cols: 11,
    parTimeMs: 25000,
    accentColor: '#F59E0B',
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 1, 0, 0, 0, 0, 4, 1],
      [1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1],
      [1, 4, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 4, 1],
      [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1],
      [1, 0, 1, 4, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 4, 1, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
      [1, 3, 0, 0, 0, 0, 0, 0, 0, 4, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    id: 4,
    name: 'Ziguezague de Precisão',
    subtitle: 'Corredores estreitos e mudanças rápidas de direção exigem mãos firmes.',
    difficulty: 'Difícil',
    rows: 13,
    cols: 11,
    parTimeMs: 32000,
    accentColor: '#EF4444',
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 1, 4, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 4, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 4, 1],
      [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [1, 4, 0, 0, 0, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    id: 5,
    name: 'Desafio Mestre',
    subtitle: 'O teste definitivo de equilíbrio, navegação e domínio do acelerômetro.',
    difficulty: 'Especialista',
    rows: 15,
    cols: 11,
    parTimeMs: 40000,
    accentColor: '#8B5CF6',
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 1, 4, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 4, 1],
      [1, 0, 1, 4, 0, 0, 0, 0, 1, 1, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 4, 1, 1, 1, 0, 1],
      [1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 4, 0, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 0, 0, 0, 1, 4, 1, 0, 1],
      [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 4, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
];

export function getLevelById(id: number): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === id);
}

export function findCellByType(
  level: LevelDefinition,
  target: CellCode
): GridCoordinate | null {
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      if (level.grid[r]?.[c] === target) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function countHazards(level: LevelDefinition): number {
  let count = 0;
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      if (level.grid[r]?.[c] === CELL_HAZARD) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Verifica via busca em largura (BFS) se a fase possui posição inicial válida
 * e um caminho livre de paredes e armadilhas até o ponto de chegada.
 */
export function isLevelReachable(level: LevelDefinition): boolean {
  const start = findCellByType(level, CELL_START);
  const goal = findCellByType(level, CELL_GOAL);
  if (!start || !goal) {
    return false;
  }

  const visited = Array.from({ length: level.rows }, () =>
    Array(level.cols).fill(false)
  );
  const queue: GridCoordinate[] = [start];
  visited[start.row][start.col] = true;

  const directions = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.row === goal.row && current.col === goal.col) {
      return true;
    }

    for (const { dr, dc } of directions) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (
        nr >= 0 &&
        nr < level.rows &&
        nc >= 0 &&
        nc < level.cols &&
        !visited[nr][nc]
      ) {
        const cell = level.grid[nr][nc];
        if (cell === CELL_EMPTY || cell === CELL_GOAL || cell === CELL_START) {
          visited[nr][nc] = true;
          queue.push({ row: nr, col: nc });
        }
      }
    }
  }

  return false;
}
