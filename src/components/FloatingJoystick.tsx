import React, { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Vector2D } from '../types/game';

interface FloatingJoystickProps {
  onTiltChange: (tilt: Vector2D) => void;
  disabled?: boolean;
}

const BASE_RADIUS = 48; // Raio da base externa
const KNOB_RADIUS = 22; // Raio da manopla central
const MAX_TRAVEL = BASE_RADIUS - 8;

export function FloatingJoystick({
  onTiltChange,
  disabled = false,
}: FloatingJoystickProps) {
  const [active, setActive] = useState(false);
  const [basePos, setBasePos] = useState({ x: 0, y: 0 });
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });

  const startPosRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: GestureResponderEvent) => {
    if (disabled) return;
    const { locationX, locationY } = e.nativeEvent;
    startPosRef.current = { x: locationX, y: locationY };
    setBasePos({ x: locationX, y: locationY });
    setKnobOffset({ x: 0, y: 0 });
    setActive(true);
    onTiltChange({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    if (disabled || !active) return;
    const { locationX, locationY } = e.nativeEvent;
    const dx = locationX - startPosRef.current.x;
    const dy = locationY - startPosRef.current.y;

    const distance = Math.hypot(dx, dy);
    let clampedDx = dx;
    let clampedDy = dy;

    if (distance > MAX_TRAVEL) {
      const angle = Math.atan2(dy, dx);
      clampedDx = Math.cos(angle) * MAX_TRAVEL;
      clampedDy = Math.sin(angle) * MAX_TRAVEL;
    }

    setKnobOffset({ x: clampedDx, y: clampedDy });

    // Normaliza de -1.0 a +1.0
    const normX = clampedDx / MAX_TRAVEL;
    const normY = clampedDy / MAX_TRAVEL;
    onTiltChange({ x: normX, y: normY });
  };

  const handleTouchEnd = () => {
    setActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onTiltChange({ x: 0, y: 0 });
  };

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
      onResponderRelease={handleTouchEnd}
      onResponderTerminate={handleTouchEnd}
    >
      {!active && (
        <View style={styles.hintContainer} pointerEvents="none">
          <Text style={styles.hintIcon}>🕹️</Text>
          <Text style={styles.hintText}>
            Toque e arraste o dedo aqui para usar o Joystick Flutuante
          </Text>
        </View>
      )}

      {active && (
        <View
          pointerEvents="none"
          style={[
            styles.joystickBase,
            {
              left: basePos.x - BASE_RADIUS,
              top: basePos.y - BASE_RADIUS,
            },
          ]}
        >
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />
          <View
            style={[
              styles.joystickKnob,
              {
                transform: [
                  { translateX: knobOffset.x },
                  { translateY: knobOffset.y },
                ],
              },
            ]}
          >
            <View style={styles.knobInnerGlow} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 110,
    backgroundColor: 'rgba(19, 28, 46, 0.85)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    borderStyle: 'dashed',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  hintIcon: {
    fontSize: 20,
  },
  hintText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  joystickBase: {
    position: 'absolute',
    width: BASE_RADIUS * 2,
    height: BASE_RADIUS * 2,
    borderRadius: BASE_RADIUS,
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairH: {
    position: 'absolute',
    width: BASE_RADIUS * 1.5,
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
  },
  crosshairV: {
    position: 'absolute',
    height: BASE_RADIUS * 1.5,
    width: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
  },
  joystickKnob: {
    width: KNOB_RADIUS * 2,
    height: KNOB_RADIUS * 2,
    borderRadius: KNOB_RADIUS,
    backgroundColor: '#0284C7',
    borderWidth: 2,
    borderColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  knobInnerGlow: {
    width: KNOB_RADIUS * 0.7,
    height: KNOB_RADIUS * 0.7,
    borderRadius: KNOB_RADIUS * 0.35,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
});
