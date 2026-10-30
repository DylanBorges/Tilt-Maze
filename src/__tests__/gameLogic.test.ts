import {
  createInitialBallState,
  formatTimeMs,
  stepBallPhysics,
} from '../game/engine';
import {
  generateProceduralMaze,
  PROCEDURAL_PRESETS,
} from '../game/mazeGenerator';
import {
  countHazards,
  findCellByType,
  isLevelReachable,
  LEVELS,
} from '../levels/levelsData';
import {
  applyDeadzone,
  applyLowPassFilter,
  clampSensitivity,
  mapRawAccelerometerToScreenAxes,
  processTiltInput,
} from '../sensors/sensorMath';
import {
  computeUpdatedProgressOnCompletion,
  DEFAULT_PROGRESS,
  DEFAULT_SETTINGS,
  sanitizeProgress,
  sanitizeSettings,
} from '../storage/storage';
import { CELL_GOAL, CELL_HAZARD, CELL_START } from '../types/game';

function assertOk(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(`Falha na asserção: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      `Falha na igualdade${message ? ` (${message})` : ''}: esperado=${String(expected)}, obtido=${String(actual)}`
    );
  }
}

export function runValidationTests() {
  console.log('Iniciando bateria de testes e validação do Tilt Maze...\n');

  // 1. Validação das Fases (RF-08 e Seção 3.4)
  assertOk(
    LEVELS.length >= 3,
    'Deve haver pelo menos 3 fases jogáveis (5 incluídas).'
  );

  for (const level of LEVELS) {
    assertEqual(
      level.grid.length,
      level.rows,
      `Fase ${level.id} deve ter ${level.rows} linhas.`
    );
    for (const row of level.grid) {
      assertEqual(
        row.length,
        level.cols,
        `Todas as linhas da Fase ${level.id} devem ter ${level.cols} colunas.`
      );
    }

    const start = findCellByType(level, CELL_START);
    const goal = findCellByType(level, CELL_GOAL);
    assertOk(start, `Fase ${level.id} deve possuir posição inicial.`);
    assertOk(goal, `Fase ${level.id} deve possuir ponto de chegada.`);
    assertOk(
      isLevelReachable(level),
      `Fase ${level.id} (${level.name}) deve ter caminho livre alcançável do início ao fim.`
    );
  }
  console.log(
    '✔ [1/6] Todas as 5 fases validadas (início, chegada e caminho alcançável via BFS).'
  );

  // 2. Movimento da bolinha pela inclinação (RF-03)
  const level1 = LEVELS[0];
  const initialBall = createInitialBallState(level1);
  assertEqual(initialBall.x, 1.5);
  assertEqual(initialBall.y, 1.5);

  const movedRight = stepBallPhysics(
    initialBall,
    level1,
    { x: 0.8, y: 0 },
    0.04
  );
  assertOk(
    movedRight.ball.x > initialBall.x,
    'Inclinar para a direita (+x) deve mover a bolinha para a direita.'
  );
  assertEqual(movedRight.reachedGoal, false);
  console.log('✔ [2/6] Movimentação física por inclinação verificada.');

  // 3. Detecção de Colisão com Paredes (RF-04)
  let wallTestBall = createInitialBallState(level1);
  for (let i = 0; i < 60; i++) {
    const res = stepBallPhysics(
      wallTestBall,
      level1,
      { x: -1.5, y: -1.5 },
      0.03
    );
    wallTestBall = res.ball;
  }
  assertOk(
    wallTestBall.x - wallTestBall.radius >= 1.0 - 1e-4,
    'A bolinha não pode atravessar a parede esquerda na coluna 0.'
  );
  assertOk(
    wallTestBall.y - wallTestBall.radius >= 1.0 - 1e-4,
    'A bolinha não pode atravessar a parede superior na linha 0.'
  );
  console.log('✔ [3/6] Detecção de colisões AABB contra paredes verificada.');

  // 4. Detecção de Armadilhas e Ponto de Chegada (RF-05)
  const level2 = LEVELS[1];
  assertOk(countHazards(level2) > 0, 'Fase 2 deve conter armadilhas.');
  const hazardCoord = findCellByType(level2, CELL_HAZARD)!;
  const ballNearHazard = {
    x: hazardCoord.col + 0.5,
    y: hazardCoord.row + 0.5,
    vx: 0.5,
    vy: 0,
    radius: initialBall.radius,
  };
  const hazardStep = stepBallPhysics(
    ballNearHazard,
    level2,
    { x: 0, y: 0 },
    0.016
  );
  assertEqual(
    hazardStep.hitHazard,
    true,
    'Cair em célula de armadilha deve acionar hitHazard.'
  );
  assertEqual(
    hazardStep.ball.x,
    1.5,
    'Queda na armadilha deve reposicionar a bolinha no início.'
  );

  const goalCoord = findCellByType(level1, CELL_GOAL)!;
  const ballAtGoal = {
    x: goalCoord.col + 0.5,
    y: goalCoord.row + 0.5,
    vx: 0.2,
    vy: 0.2,
    radius: initialBall.radius,
  };
  const goalStep = stepBallPhysics(ballAtGoal, level1, { x: 0, y: 0 }, 0.016);
  assertEqual(
    goalStep.reachedGoal,
    true,
    'Alcançar o ponto de chegada deve concluir a fase.'
  );
  console.log('✔ [4/6] Detecção de armadilhas e conclusão de fase verificadas.');

  // 5. Filtragem do Acelerômetro, Sensibilidade, Gravidade e Postura
  assertEqual(
    applyDeadzone(0.01, 0.035),
    0,
    'Ruído dentro da zona morta deve ser zerado.'
  );
  assertEqual(
    applyDeadzone(0.05, 0.035) > 0,
    true,
    'Movimento acima da zona morta deve ser transmitido.'
  );

  const filtered = applyLowPassFilter({ x: 0, y: 0 }, { x: 1, y: -1 }, 0.25);
  assertEqual(filtered.x, 0.25);
  assertEqual(filtered.y, -0.25);

  const mapped = mapRawAccelerometerToScreenAxes(
    { x: -0.5, y: 0.4 },
    false,
    false
  );
  assertEqual(mapped.x, 0.5);
  assertEqual(mapped.y, 0.4);

  const lowSens = processTiltInput(
    { x: 0.5, y: 0 },
    { x: 0.5, y: 0 },
    { ...DEFAULT_SETTINGS, sensitivity: 0.6 }
  );
  const highSens = processTiltInput(
    { x: 0.5, y: 0 },
    { x: 0.5, y: 0 },
    { ...DEFAULT_SETTINGS, sensitivity: 1.8 }
  );
  assertOk(
    highSens.tilt.x > lowSens.tilt.x,
    'Aumentar a sensibilidade deve ampliar a resposta aos movimentos.'
  );

  // Teste de inclinação para frente e descida (eixo Y):
  // Na postura natural 'handheld', inclinar o topo para a frente diminui y no sensor (ex: 0.1),
  // resultando em aceleração positiva para baixo no labirinto (+Y).
  const forwardTilt = processTiltInput(
    { x: 0, y: 0.1 },
    { x: 0, y: 0.1 },
    { ...DEFAULT_SETTINGS, postureMode: 'handheld' }
  );
  assertOk(
    forwardTilt.tilt.y > 0,
    'Inclinar para a frente deve gerar aceleração positiva para baixo (+Y).'
  );

  const normalGrav = processTiltInput(
    { x: 0, y: 0.1 },
    { x: 0, y: 0.1 },
    { ...DEFAULT_SETTINGS, gravityMultiplier: 1.0, downwardBoost: 1.0 }
  );
  const boostedGrav = processTiltInput(
    { x: 0, y: 0.1 },
    { x: 0, y: 0.1 },
    { ...DEFAULT_SETTINGS, gravityMultiplier: 1.8, downwardBoost: 1.4 }
  );
  assertOk(
    boostedGrav.tilt.y > normalGrav.tilt.y,
    'Ajuste de gravidade e reforço para baixo devem acelerar a bolinha no eixo Y.'
  );

  assertEqual(clampSensitivity(99), 2.5);
  assertEqual(clampSensitivity(0.1), 0.4);
  console.log(
    '✔ [5/6] Filtragem de ruído, calibração, postura e gravidade verificadas.'
  );

  // 6. Persistência e Sanitização de Dados (RF-09, RF-10 e Seção 5.4)
  const corruptedProgress = sanitizeProgress({
    completedLevels: [1, 'invalido', 999, 2, 1],
    bestTimesMs: { '1': 14200, '2': -50, '99': 5000 },
    highestUnlockedLevel: -3,
  });
  assertEqual(corruptedProgress.completedLevels.join(','), '1,2');
  assertEqual(corruptedProgress.bestTimesMs[1], 14200);
  assertEqual(corruptedProgress.bestTimesMs[2], undefined);
  assertEqual(corruptedProgress.highestUnlockedLevel, 3);

  const corruptedSettings = sanitizeSettings({
    sensitivity: -10,
    gravityMultiplier: 99,
    downwardBoost: -5,
    deadzone: 999,
    postureMode: 'invalido',
    virtualControlType: 'invalido',
    calibration: { x: 5, y: 'err' },
  });
  assertEqual(corruptedSettings.sensitivity, 0.4);
  assertEqual(corruptedSettings.gravityMultiplier, 2.5);
  assertEqual(corruptedSettings.downwardBoost, 1.0);
  assertEqual(corruptedSettings.deadzone, 0.12);
  assertEqual(corruptedSettings.postureMode, 'handheld');
  assertEqual(corruptedSettings.virtualControlType, 'joystick');
  assertEqual(corruptedSettings.calibration.x, 0.8);
  assertEqual(corruptedSettings.calibration.y, 0);

  const updated1 = computeUpdatedProgressOnCompletion(
    DEFAULT_PROGRESS,
    1,
    15430
  );
  assertEqual(updated1.isNewRecord, true);
  assertEqual(updated1.bestTimeMs, 15430);
  assertEqual(updated1.nextProgress.highestUnlockedLevel, 2);

  const updated2 = computeUpdatedProgressOnCompletion(
    updated1.nextProgress,
    1,
    18000
  );
  assertEqual(
    updated2.isNewRecord,
    false,
    'Tempo maior não deve sobrescrever o melhor tempo anterior.'
  );
  assertEqual(updated2.bestTimeMs, 15430);

  assertEqual(formatTimeMs(65430), '01:05.43');
  console.log(
    '✔ [6/7] Persistência local, recordes e validação de dados verificados.'
  );

  // 7. Geração Procedural e Alcançabilidade Matemática de Labirintos Gigantes
  for (const presetKey of ['small', 'medium', 'large', 'titan'] as const) {
    const preset = PROCEDURAL_PRESETS[presetKey];
    const generated = generateProceduralMaze(preset, 421337);

    assertEqual(
      generated.rows,
      preset.rows,
      `Labirinto procedural deve ter ${preset.rows} linhas.`
    );
    assertEqual(
      generated.cols,
      preset.cols,
      `Labirinto procedural deve ter ${preset.cols} colunas.`
    );

    const start = findCellByType(generated, CELL_START);
    const goal = findCellByType(generated, CELL_GOAL);
    assertOk(start, 'Labirinto procedural deve conter ponto de início.');
    assertOk(goal, 'Labirinto procedural deve conter ponto de chegada.');

    assertOk(
      isLevelReachable(generated),
      `Labirinto procedural ${preset.cols}×${preset.rows} deve ser 100% solucionável via BFS.`
    );
  }
  console.log(
    '✔ [7/7] Geração procedural e alcançabilidade matemática (até 33×33) verificadas.\n'
  );
  console.log('✅ Todos os testes passaram com sucesso!');
}

runValidationTests();
