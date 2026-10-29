import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Vector2D } from '../types/game';

interface VirtualTiltControlsProps {
  onChangeTilt: (vector: Vector2D) => void;
  isSensorAvailable: boolean;
}

export function VirtualTiltControls({
  onChangeTilt,
  isSensorAvailable,
}: VirtualTiltControlsProps) {
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
    <View style={styles.container}>
      <View style={styles.infoColumn}>
        <Text style={styles.title}>Inclinação Simulada</Text>
        <Text style={styles.subtitle}>
          {isSensorAvailable
            ? 'Incline o celular ou use o controle ao lado para testar.'
            : 'Acelerômetro físico não detectado. Use os botões ou setas do teclado.'}
        </Text>
      </View>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  infoColumn: {
    flex: 1,
  },
  title: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  padGrid: {
    gap: 4,
  },
  padRow: {
    flexDirection: 'row',
    gap: 4,
  },
  padBtn: {
    width: 34,
    height: 30,
    borderRadius: 7,
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
    width: 34,
    height: 30,
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
