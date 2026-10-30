import React, { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  View,
} from 'react-native';
import { Vector2D } from '../types/game';

interface FloatingJoystickProps {
  onTiltChange: (tilt: Vector2D) => void;
  disabled?: boolean;
  overlayMode?: boolean;
}

const BASE_RADIUS = 52; // Raio da base externa circular
const KNOB_RADIUS = 24; // Raio da manopla central
const MAX_TRAVEL = BASE_RADIUS - 10;

export function FloatingJoystick({
  onTiltChange,
  disabled = false,
  overlayMode = true,
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

    // Normaliza de -1.0 a +1.0 com precisão
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
      style={overlayMode ? styles.overlayContainer : styles.boxedContainer}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
      onResponderRelease={handleTouchEnd}
      onResponderTerminate={handleTouchEnd}
    >
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
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 50,
  },
  boxedContainer: {
    height: 110,
    backgroundColor: 'rgba(19, 28, 46, 0.85)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystickBase: {
    position: 'absolute',
    width: BASE_RADIUS * 2,
    height: BASE_RADIUS * 2,
    borderRadius: BASE_RADIUS,
    backgroundColor: 'rgba(2, 132, 199, 0.35)',
    borderWidth: 2.5,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  crosshairH: {
    position: 'absolute',
    width: BASE_RADIUS * 1.5,
    height: 1.5,
    backgroundColor: 'rgba(56, 189, 248, 0.45)',
  },
  crosshairV: {
    position: 'absolute',
    height: BASE_RADIUS * 1.5,
    width: 1.5,
    backgroundColor: 'rgba(56, 189, 248, 0.45)',
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
    elevation: 6,
  },
  knobInnerGlow: {
    width: KNOB_RADIUS * 0.7,
    height: KNOB_RADIUS * 0.7,
    borderRadius: KNOB_RADIUS * 0.35,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
});
