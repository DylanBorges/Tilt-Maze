import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BallState,
  CELL_GOAL,
  CELL_HAZARD,
  CELL_WALL,
  LevelDefinition,
} from '../types/game';

interface MiniMapProps {
  level: LevelDefinition;
  ball: BallState;
  maxSize?: number;
}

export function MiniMap({ level, ball, maxSize = 76 }: MiniMapProps) {
  const [expanded, setExpanded] = useState(false);

  const displaySize = expanded ? Math.min(140, maxSize * 1.85) : maxSize;
  const scale = displaySize / Math.max(level.cols, level.rows);

  const mapWidth = level.cols * scale;
  const mapHeight = level.rows * scale;

  const ballLeft = ball.x * scale;
  const ballTop = ball.y * scale;

  return (
    <Pressable
      style={[
        styles.container,
        {
          width: mapWidth + 8,
          height: mapHeight + 8,
        },
      ]}
      onPress={() => setExpanded((prev) => !prev)}
      accessibilityLabel="Minimapa do labirinto"
    >
      <View
        style={[
          styles.mapArena,
          {
            width: mapWidth,
            height: mapHeight,
          },
        ]}
      >
        {/* Células de interesse: Paredes compactadas ou destaques */}
        {level.grid.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            if (cell === CELL_WALL) {
              return (
                <View
                  key={`mw-${rIdx}-${cIdx}`}
                  style={[
                    styles.wallDot,
                    {
                      left: cIdx * scale,
                      top: rIdx * scale,
                      width: scale + 0.3,
                      height: scale + 0.3,
                    },
                  ]}
                />
              );
            }
            if (cell === CELL_GOAL) {
              return (
                <View
                  key={`mg-${rIdx}-${cIdx}`}
                  style={[
                    styles.goalMarker,
                    {
                      left: cIdx * scale - 1,
                      top: rIdx * scale - 1,
                      width: scale + 2,
                      height: scale + 2,
                      borderRadius: (scale + 2) / 2,
                    },
                  ]}
                />
              );
            }
            if (cell === CELL_HAZARD && expanded) {
              return (
                <View
                  key={`mh-${rIdx}-${cIdx}`}
                  style={[
                    styles.hazardMarker,
                    {
                      left: cIdx * scale,
                      top: rIdx * scale,
                      width: scale,
                      height: scale,
                    },
                  ]}
                />
              );
            }
            return null;
          })
        )}

        {/* Posição da bolinha no Minimapa */}
        <View
          style={[
            styles.playerMarker,
            {
              left: ballLeft - (expanded ? 4 : 3),
              top: ballTop - (expanded ? 4 : 3),
              width: expanded ? 8 : 6,
              height: expanded ? 8 : 6,
              borderRadius: expanded ? 4 : 3,
            },
          ]}
        />
      </View>

      <Text style={styles.hintText}>{expanded ? 'Toque p/ Encolher' : 'Radar'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(11, 17, 32, 0.88)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    zIndex: 99,
  },
  mapArena: {
    backgroundColor: '#0F172A',
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  wallDot: {
    position: 'absolute',
    backgroundColor: '#334155',
  },
  goalMarker: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    zIndex: 10,
  },
  hazardMarker: {
    position: 'absolute',
    backgroundColor: '#EF4444',
    borderRadius: 2,
    zIndex: 9,
  },
  playerMarker: {
    position: 'absolute',
    backgroundColor: '#38BDF8',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 20,
  },
  hintText: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
