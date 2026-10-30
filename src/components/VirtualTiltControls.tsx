import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Vector2D } from '../types/game';
import { FloatingJoystick } from './FloatingJoystick';

interface VirtualTiltControlsProps {
  onChangeTilt: (vector: Vector2D) => void;
  isSensorAvailable: boolean;
  defaultMode?: 'joystick' | 'dpad';
}

export function VirtualTiltControls({
  onChangeTilt,
  isSensorAvailable,
  defaultMode = 'joystick',
}: VirtualTiltControlsProps) {
  const [mode, setMode] = useState<'joystick' | 'dpad'>(defaultMode);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handlePressIn = (key: string, vec: Vector2D) => {
    setActiveKey(key);
    onChangeTilt(vec);
  };

  const handlePressOut = () => {
    setActiveKey(null);
    onChangeTilt({ x: 0, y: 0 });
  };

  return (
    <View style={styles.wrapper}>
      {/* Barra de título e alternador de modo de toque */}
      <View style={styles.headerRow}>
        <View style={styles.infoCol}>
          <Text style={styles.headerTitle}>Controles na Tela</Text>
          <Text style={styles.headerSubtitle}>
            {isSensorAvailable
              ? 'Use o toque na tela ou incline o aparelho'
              : 'Sensor inativo. Controle com o dedo ou setas'}
          </Text>
        </View>

        <View style={styles.modeTabs}>
          <Pressable
            style={[styles.modeTab, mode === 'joystick' && styles.modeTabActive]}
            onPress={() => setMode('joystick')}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'joystick' && styles.modeTabTextActive,
              ]}
            >
              🕹️ Joystick
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'dpad' && styles.modeTabActive]}
            onPress={() => setMode('dpad')}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'dpad' && styles.modeTabTextActive,
              ]}
            >
              🔲 D-Pad
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Exibição condicional: Joystick Flutuante ou D-Pad Clássico */}
      {mode === 'joystick' ? (
        <FloatingJoystick onTiltChange={onChangeTilt} />
      ) : (
        <View style={styles.dpadContainer}>
          <View style={styles.padGrid}>
            <View style={styles.padRow}>
              <Pressable
                onPressIn={() => handlePressIn('UL', { x: -0.7, y: -0.7 })}
                onPressOut={handlePressOut}
                style={[
                  styles.padBtn,
                  styles.cornerBtn,
                  activeKey === 'UL' && styles.padBtnActive,
                ]}
              >
                <Text style={styles.padBtnText}>↖</Text>
              </Pressable>
              <Pressable
                onPressIn={() => handlePressIn('U', { x: 0, y: -1 })}
                onPressOut={handlePressOut}
                style={[styles.padBtn, activeKey === 'U' && styles.padBtnActive]}
              >
                <Text style={styles.padBtnText}>▲</Text>
              </Pressable>
              <Pressable
                onPressIn={() => handlePressIn('UR', { x: 0.7, y: -0.7 })}
                onPressOut={handlePressOut}
                style={[
                  styles.padBtn,
                  styles.cornerBtn,
                  activeKey === 'UR' && styles.padBtnActive,
                ]}
              >
                <Text style={styles.padBtnText}>↗</Text>
              </Pressable>
            </View>

            <View style={styles.padRow}>
              <Pressable
                onPressIn={() => handlePressIn('L', { x: -1, y: 0 })}
                onPressOut={handlePressOut}
                style={[styles.padBtn, activeKey === 'L' && styles.padBtnActive]}
              >
                <Text style={styles.padBtnText}>◀</Text>
              </Pressable>
              <View style={styles.padCenter}>
                <View style={styles.padCenterDot} />
              </View>
              <Pressable
                onPressIn={() => handlePressIn('R', { x: 1, y: 0 })}
                onPressOut={handlePressOut}
                style={[styles.padBtn, activeKey === 'R' && styles.padBtnActive]}
              >
                <Text style={styles.padBtnText}>▶</Text>
              </Pressable>
            </View>

            <View style={styles.padRow}>
              <Pressable
                onPressIn={() => handlePressIn('DL', { x: -0.7, y: 0.7 })}
                onPressOut={handlePressOut}
                style={[
                  styles.padBtn,
                  styles.cornerBtn,
                  activeKey === 'DL' && styles.padBtnActive,
                ]}
              >
                <Text style={styles.padBtnText}>↙</Text>
              </Pressable>
              <Pressable
                onPressIn={() => handlePressIn('D', { x: 0, y: 1 })}
                onPressOut={handlePressOut}
                style={[styles.padBtn, activeKey === 'D' && styles.padBtnActive]}
              >
                <Text style={styles.padBtnText}>▼</Text>
              </Pressable>
              <Pressable
                onPressIn={() => handlePressIn('DR', { x: 0.7, y: 0.7 })}
                onPressOut={handlePressOut}
                style={[
                  styles.padBtn,
                  styles.cornerBtn,
                  activeKey === 'DR' && styles.padBtnActive,
                ]}
              >
                <Text style={styles.padBtnText}>↘</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  modeTab: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: '#0284C7',
  },
  modeTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#F8FAFC',
  },
  dpadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  padGrid: {
    gap: 4,
  },
  padRow: {
    flexDirection: 'row',
    gap: 4,
  },
  padBtn: {
    width: 38,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBtn: {
    backgroundColor: '#162032',
    borderColor: '#334155',
  },
  padBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  padBtnText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  padCenter: {
    width: 38,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padCenterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#475569',
  },
});
