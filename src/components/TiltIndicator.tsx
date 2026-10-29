import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Vector2D } from '../types/game';

interface TiltIndicatorProps {
  tilt: Vector2D;
  size?: number;
  showCoordinates?: boolean;
}

export function TiltIndicator({
  tilt,
  size = 56,
  showCoordinates = false,
}: TiltIndicatorProps) {
  const maxOffset = (size - 16) / 2;
  const clampedX = Math.max(-1, Math.min(1, tilt.x));
  const clampedY = Math.max(-1, Math.min(1, tilt.y));

  const dotX = clampedX * maxOffset;
  const dotY = clampedY * maxOffset;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <View style={[styles.crosshairH, { width: size - 8 }]} />
        <View style={[styles.crosshairV, { height: size - 8 }]} />
        <View
          style={[
            styles.centerRing,
            {
              width: size * 0.34,
              height: size * 0.34,
              borderRadius: size * 0.17,
            },
          ]}
        />
        <View
          style={[
            styles.bubble,
            {
              transform: [{ translateX: dotX }, { translateY: dotY }],
            },
          ]}
        />
      </View>

      {showCoordinates && (
        <Text style={styles.coordText}>
          X: {tilt.x.toFixed(2)} | Y: {tilt.y.toFixed(2)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crosshairH: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  centerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  bubble: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#38BDF8',
    borderWidth: 1.5,
    borderColor: '#E0F2FE',
  },
  coordText: {
    marginTop: 6,
    fontSize: 12,
    color: '#94A3B8',
    fontVariant: ['tabular-nums'],
  },
});
