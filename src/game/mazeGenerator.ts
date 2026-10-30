import {
  CELL_EMPTY,
  CELL_GOAL,
  CELL_HAZARD,
  CELL_START,
  CELL_WALL,
  CellCode,
  GridCoordinate,
  LevelDefinition,
  LevelDifficulty,
} from '../types/game';

export type ProceduralSize = 'small' | 'medium' | 'large' | 'titan';

export interface ProceduralConfig {
  size: ProceduralSize;
  rows: number;
  cols: number;
  difficulty: LevelDifficulty;
  hazardRate: number; // Fração de dead-ends que recebem armadilhas (0.0 a 0.8)
  accentColor: string;
}

export const PROCEDURAL_PRESETS: Record<ProceduralSize, ProceduralConfig> = {
  small: {
    size: 'small',
    rows: 11,
    cols: 11,
    difficulty: 'Fácil',
    hazardRate: 0.25,
    accentColor: '#10B981',
  },
  medium: {
    size: 'medium',
    rows: 17,
    cols: 17,
    difficulty: 'Médio',
    hazardRate: 0.35,
    accentColor: '#3B82F6',
  },
  large: {
    size: 'large',
    rows: 25,
    cols: 25,
    difficulty: 'Difícil',
    hazardRate: 0.45,
    accentColor: '#F59E0B',
  },
  titan: {
    size: 'titan',
    rows: 33,
    cols: 33,
    difficulty: 'Especialista',
    hazardRate: 0.55,
    accentColor: '#8B5CF6',
  },
};

/**
 * Gera um labirinto perfeito (sem ciclos e 100% solucionável) usando
 * o algoritmo DFS com Backtracking e pilha explícita.
 */
export function generateProceduralMaze(
  preset: ProceduralConfig = PROCEDURAL_PRESETS.medium,
  seed?: number
): LevelDefinition {
  // Garante que rows e cols sejam ímpares para o padrão de células/paredes
  const rows = preset.rows % 2 === 0 ? preset.rows + 1 : preset.rows;
  const cols = preset.cols % 2 === 0 ? preset.cols + 1 : preset.cols;

  // Gerador de números pseudo-aleatórios simples (LCG) com seed opcional
  let currentSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
  const random = () => {
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
    return currentSeed / 4294967296;
  };

  // Inicializa matriz 100% preenchida por paredes (CELL_WALL = 1)
  const grid: CellCode[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(CELL_WALL)
  );

  const startCoord: GridCoordinate = { row: 1, col: 1 };
  grid[startCoord.row][startCoord.col] = CELL_START;

  // Pilha explícita para evitar limite de recursão em labirintos gigantes
  const stack: GridCoordinate[] = [startCoord];

  const directions = [
    { dr: -2, dc: 0, wallR: -1, wallC: 0 },
    { dr: 2, dc: 0, wallR: 1, wallC: 0 },
    { dr: 0, dc: -2, wallR: 0, wallC: -1 },
    { dr: 0, dc: 2, wallR: 0, wallC: 1 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];

    // Embaralha as 4 direções
    const shuffledDirs = [...directions].sort(() => random() - 0.5);
    let carved = false;

    for (const dir of shuffledDirs) {
      const nr = current.row + dir.dr;
      const nc = current.col + dir.dc;

      // Verifica limites válidos para células ímpares
      if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1) {
        if (grid[nr][nc] === CELL_WALL) {
          // Abre a parede intermediária e a nova célula
          grid[current.row + dir.wallR][current.col + dir.wallC] = CELL_EMPTY;
          grid[nr][nc] = CELL_EMPTY;
          stack.push({ row: nr, col: nc });
          carved = true;
          break;
        }
      }
    }

    if (!carved) {
      stack.pop();
    }
  }

  // Restaura marcador de início
  grid[startCoord.row][startCoord.col] = CELL_START;

  // 1. Busca em Largura (BFS) para calcular distâncias a partir do início
  // e encontrar a chegada mais distante e os becos sem saída (dead-ends).
  const distances: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(-1)
  );
  distances[startCoord.row][startCoord.col] = 0;

  const queue: GridCoordinate[] = [startCoord];
  let maxDist = 0;
  let farthestCell: GridCoordinate = startCoord;
  const deadEnds: GridCoordinate[] = [];

  const simpleDirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const curDist = distances[curr.row][curr.col];

    let openNeighbors = 0;

    for (const dir of simpleDirs) {
      const nr = curr.row + dir.dr;
      const nc = curr.col + dir.dc;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (grid[nr][nc] !== CELL_WALL) {
          openNeighbors++;
          if (distances[nr][nc] === -1) {
            distances[nr][nc] = curDist + 1;
            if (curDist + 1 > maxDist) {
              maxDist = curDist + 1;
              farthestCell = { row: nr, col: nc };
            }
            queue.push({ row: nr, col: nc });
          }
        }
      }
    }

    // Becos sem saída têm apenas 1 caminho de entrada/saída
    if (
      openNeighbors === 1 &&
      !(curr.row === startCoord.row && curr.col === startCoord.col)
    ) {
      deadEnds.push(curr);
    }
  }

  // 2. A célula mais distante do início vira o ponto de chegada (CELL_GOAL = 3)
  grid[farthestCell.row][farthestCell.col] = CELL_GOAL;

  // 3. Distribuição de Armadilhas nos demais dead-ends
  // Garante distância mínima de 6 passos do ponto de partida para não frustrar o início
  const eligibleDeadEnds = deadEnds.filter(
    (pt) =>
      !(pt.row === farthestCell.row && pt.col === farthestCell.col) &&
      distances[pt.row][pt.col] >= 6
  );

  // Embaralha e preenche com armadilhas segundo a taxa configurada
  const shuffledDeadEnds = [...eligibleDeadEnds].sort(() => random() - 0.5);
  const targetHazardCount = Math.floor(
    shuffledDeadEnds.length * preset.hazardRate
  );

  for (let i = 0; i < targetHazardCount; i++) {
    const pt = shuffledDeadEnds[i];
    grid[pt.row][pt.col] = CELL_HAZARD;
  }

  const estimatedParTimeMs = Math.round(maxDist * 420);

  return {
    id: 99000 + Math.floor(random() * 999),
    name: `Labirinto Procedural ${preset.cols}×${preset.rows}`,
    subtitle: `Gerado aleatoriamente (Semente: #${currentSeed % 100000})`,
    difficulty: preset.difficulty,
    rows,
    cols,
    grid,
    parTimeMs: estimatedParTimeMs,
    accentColor: preset.accentColor,
  };
}
