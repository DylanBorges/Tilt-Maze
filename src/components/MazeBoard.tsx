import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BallState,
  CELL_GOAL,
  CELL_HAZARD,
  CELL_START,
  CELL_WALL,
  CellCode,
  LevelDefinition,
} from '../types/game';

interface StaticGridProps {
  level: LevelDefinition;
  cellSize: number;
}

const StaticMazeGrid = memo(function StaticMazeGrid({
  level,
  cellSize,
}: StaticGridProps) {
  return (
    <View
      style={[
        styles.gridContainer,
        {
          width: level.cols * cellSize,
          height: level.rows * cellSize,
        },
      ]}
    >
      {level.grid.map((rowCells, rIdx) => (
        <View key={`row-${rIdx}`} style={[styles.row, { height: cellSize }]}>
          {rowCells.map((cell: CellCode, cIdx: number) => {
            const isWall = cell === CELL_WALL;
            const isStart = cell === CELL_START;
            const isGoal = cell === CELL_GOAL;
            const isHazard = cell === CELL_HAZARD;

            return (
              <View
                key={`cell-${rIdx}-${cIdx}`}
                style={[
                  styles.cell,
                  { width: cellSize, height: cellSize },
                  isWall ? styles.wallCell : styles.pathCell,
                ]}
              >
                {isStart && (
                  <View
                    style={[
                      styles.startMarker,
                      {
                        width: cellSize * 0.68,
                        height: cellSize * 0.68,
                        borderRadius: cellSize * 0.34,
                      },
                    ]}
                  />
                )}

                {isGoal && (
                  <View
                    style={[
                      styles.goalOuter,
                      {
                        width: cellSize * 0.78,
                        height: cellSize * 0.78,
                        borderRadius: cellSize * 0.39,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.goalInner,
                        {
                          width: cellSize * 0.44,
                          height: cellSize * 0.44,
                          borderRadius: cellSize * 0.22,
                        },
                      ]}
                    />
                  </View>
                )}

                {isHazard && (
                  <View
                    style={[
                      styles.hazardOuter,
                      {
                        width: cellSize * 0.74,
                        height: cellSize * 0.74,
                        borderRadius: cellSize * 0.37,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.hazardCore,
                        {
                          width: cellSize * 0.46,
                          height: cellSize * 0.46,
                          borderRadius: cellSize * 0.23,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
});

interface MazeBoardProps {
  level: LevelDefinition;
  ball: BallState;
  maxWidth: number;
  maxHeight: number;
  hazardFlash?: boolean;
}

const MIN_COMFORTABLE_CELL_SIZE = 34;

export function MazeBoard({
  level,
  ball,
  maxWidth,
  maxHeight,
  hazardFlash = false,
}: MazeBoardProps) {
  // Determina se o labirinto precisa do sistema de Câmera Móvel
  const naturalCellSize = Math.floor(
    Math.min(maxWidth / level.cols, maxHeight / level.rows)
  );
  const useCamera = naturalCellSize < MIN_COMFORTABLE_CELL_SIZE;

  const cellSize = useCamera
    ? MIN_COMFORTABLE_CELL_SIZE
    : Math.max(18, naturalCellSize);

  const boardWidth = level.cols * cellSize;
  const boardHeight = level.rows * cellSize;

  // Viewport visível da arena
  const viewportWidth = useCamera ? maxWidth : boardWidth;
  const viewportHeight = useCamera ? maxHeight : boardHeight;

  // Cálculo da Câmera Virtual: centraliza a bolinha e trava nas bordas do labirinto
  const ballPixelX = ball.x * cellSize;
  const ballPixelY = ball.y * cellSize;

  let camX = 0;
  let camY = 0;

  if (useCamera) {
    const rawCamX = viewportWidth / 2 - ballPixelX;
    const rawCamY = viewportHeight / 2 - ballPixelY;
    camX = Math.min(0, Math.max(viewportWidth - boardWidth, rawCamX));
    camY = Math.min(0, Math.max(viewportHeight - boardHeight, rawCamY));
  }

  const ballDiameter = ball.radius * 2 * cellSize;
  const ballLeft = ball.x * cellSize - ballDiameter / 2;
  const ballTop = ball.y * cellSize - ballDiameter / 2;

  return (
    <View
      style={[
        styles.boardWrapper,
        {
          width: viewportWidth + 8,
          height: viewportHeight + 8,
          borderColor: hazardFlash ? '#EF4444' : '#334155',
        },
      ]}
    >
      <View
        style={{
          width: viewportWidth,
          height: viewportHeight,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 8,
        }}
      >
        {/* Container móvel do labirinto com deslocamento de câmera */}
        <View
          style={{
            width: boardWidth,
            height: boardHeight,
            position: 'absolute',
            transform: [{ translateX: camX }, { translateY: camY }],
          }}
        >
          <StaticMazeGrid level={level} cellSize={cellSize} />

          {/* Bolinha controlada pelo jogador */}
          <View
            pointerEvents="none"
            style={[
              styles.ball,
              {
                width: ballDiameter,
                height: ballDiameter,
                borderRadius: ballDiameter / 2,
                backgroundColor: hazardFlash ? '#F87171' : '#38BDF8',
                transform: [{ translateX: ballLeft }, { translateY: ballTop }],
              },
            ]}
          >
            <View
              style={[
                styles.ballHighlight,
                {
                  width: ballDiameter * 0.36,
                  height: ballDiameter * 0.36,
                  borderRadius: ballDiameter * 0.18,
                  top: ballDiameter * 0.16,
                  left: ballDiameter * 0.18,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boardWrapper: {
    padding: 4,
    backgroundColor: '#0B1120',
    borderRadius: 12,
    borderWidth: 2,
    alignSelf: 'center',
    position: 'relative',
  },
  gridContainer: {
    backgroundColor: '#0F172A',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathCell: {
    backgroundColor: '#0F172A',
    borderWidth: 0.5,
    borderColor: 'rgba(51, 65, 85, 0.28)',
  },
  wallCell: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderTopColor: '#334155',
    borderLeftColor: '#334155',
    borderRightColor: '#0F172A',
    borderBottomColor: '#0F172A',
  },
  startMarker: {
    borderWidth: 2,
    borderColor: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
  },
  goalOuter: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInner: {
    backgroundColor: '#34D399',
  },
  hazardOuter: {
    backgroundColor: '#450A0A',
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazardCore: {
    backgroundColor: '#090D16',
  },
  ball: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 1.5,
    borderColor: '#E0F2FE',
    elevation: 5,
  },
  ballHighlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
});
