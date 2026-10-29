import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TiltIndicator } from '../components/TiltIndicator';
import { useGame } from '../context/GameContext';
import {
  clampSensitivity,
  MAX_SENSITIVITY,
  MIN_SENSITIVITY,
} from '../sensors/sensorMath';
import { useTiltSensor } from '../sensors/useTiltSensor';

const SENSITIVITY_PRESETS = [
  { label: 'Suave', value: 0.7 },
  { label: 'Padrão', value: 1.0 },
  { label: 'Rápida', value: 1.4 },
  { label: 'Alta', value: 1.8 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, calibratePosition, resetCalibration } =
    useGame();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const { tiltPreview, isSensorAvailable, getCurrentNeutralOffset } =
    useTiltSensor({
      enabled: true,
      settings,
    });

  const showTempMessage = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2400);
  };

  const handleAdjustSensitivity = (delta: number) => {
    const next = clampSensitivity(settings.sensitivity + delta);
    updateSettings({ sensitivity: next });
  };

  const handleCalibrateNow = async () => {
    const offset = getCurrentNeutralOffset();
    await calibratePosition(offset);
    showTempMessage(
      `Posição neutra calibrada (X: ${offset.x.toFixed(2)}, Y: ${offset.y.toFixed(2)})`
    );
  };

  const handleResetCalibration = async () => {
    await resetCalibration();
    showTempMessage('Calibração redefinida para a posição plana padrão (0, 0).');
  };

  const progressRatio =
    (settings.sensitivity - MIN_SENSITIVITY) /
    (MAX_SENSITIVITY - MIN_SENSITIVITY);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Menu</Text>
        </Pressable>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Configurações</Text>
          <Text style={styles.headerSub}>
            Sensibilidade, calibração do sensor e instruções
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {feedbackMsg && (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText}>{feedbackMsg}</Text>
          </View>
        )}

        {/* 1. Sensibilidade do Movimento */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Sensibilidade do Movimento</Text>
            <Text style={styles.sensitivityBadge}>
              {settings.sensitivity.toFixed(1)}x
            </Text>
          </View>
          <Text style={styles.cardDescription}>
            Ajuste a velocidade de resposta da bolinha ao inclinar o smartphone.
            Valores menores facilitam passagens estreitas; valores maiores exigem
            menos inclinação física.
          </Text>

          <View style={styles.sliderRow}>
            <Pressable
              style={({ pressed }) => [
                styles.stepBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => handleAdjustSensitivity(-0.1)}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.max(4, Math.min(100, progressRatio * 100))}%`,
                  },
                ]}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.stepBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => handleAdjustSensitivity(0.1)}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.presetsRow}>
            {SENSITIVITY_PRESETS.map((preset) => {
              const isSelected =
                Math.abs(settings.sensitivity - preset.value) < 0.05;
              return (
                <Pressable
                  key={preset.label}
                  style={[
                    styles.presetChip,
                    isSelected && styles.presetChipActive,
                  ]}
                  onPress={() => updateSettings({ sensitivity: preset.value })}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextActive,
                    ]}
                  >
                    {preset.label} ({preset.value.toFixed(1)}x)
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 2. Calibração do Acelerômetro */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Calibração e Posição Neutra</Text>
            <View
              style={[
                styles.sensorStatusChip,
                {
                  backgroundColor: isSensorAvailable
                    ? 'rgba(16, 185, 129, 0.16)'
                    : 'rgba(245, 158, 11, 0.16)',
                },
              ]}
            >
              <Text
                style={[
                  styles.sensorStatusText,
                  { color: isSensorAvailable ? '#34D399' : '#FBBF24' },
                ]}
              >
                {isSensorAvailable ? 'Sensor Ativo' : 'Sensor Simulado'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Segure o smartphone na posição em que você se sente mais confortável
            para jogar e toque em &quot;Calibrar Posição Atual&quot; para definir
            esse ângulo como o ponto neutro (bolinha parada).
          </Text>

          <View style={styles.calibrationPreviewBox}>
            <TiltIndicator tilt={tiltPreview} size={86} showCoordinates />
            <Text style={styles.offsetMetaText}>
              Offset Neutro Salvo: X = {settings.calibration.x.toFixed(2)} | Y ={' '}
              {settings.calibration.y.toFixed(2)}
            </Text>
          </View>

          <View style={styles.calibrationBtnsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryCalBtn,
                pressed && styles.pressed,
              ]}
              onPress={handleCalibrateNow}
            >
              <Text style={styles.primaryCalBtnText}>
                ⊕ Calibrar Posição Atual
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryCalBtn,
                pressed && styles.pressed,
              ]}
              onPress={handleResetCalibration}
            >
              <Text style={styles.secondaryCalBtnText}>
                Restaurar Padrão (0, 0)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Opções Adicionais de Controle */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Opções de Controle</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>
                Controles Simulados na Tela
              </Text>
              <Text style={styles.toggleSub}>
                Exibe direcionais de inclinação na tela (útil para emulador ou
                testes sem inclinar o aparelho)
              </Text>
            </View>
            <Switch
              value={settings.showVirtualControls}
              onValueChange={(val) =>
                updateSettings({ showVirtualControls: val })
              }
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor="#F8FAFC"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>
                Inverter Eixo Horizontal (Esquerda / Direita)
              </Text>
              <Text style={styles.toggleSub}>
                Inverte a resposta lateral do acelerômetro
              </Text>
            </View>
            <Switch
              value={settings.invertX}
              onValueChange={(val) => updateSettings({ invertX: val })}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor="#F8FAFC"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>
                Inverter Eixo Vertical (Cima / Baixo)
              </Text>
              <Text style={styles.toggleSub}>
                Inverte a resposta frontal/traseira do acelerômetro
              </Text>
            </View>
            <Switch
              value={settings.invertY}
              onValueChange={(val) => updateSettings({ invertY: val })}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor="#F8FAFC"
            />
          </View>
        </View>

        {/* 4. Instruções sobre Como Segurar e Inclinar o Smartphone */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Instruções: Como Segurar e Inclinar
          </Text>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumBadge}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              <Text style={styles.boldText}>Posição Inicial:</Text> Segure o
              smartphone em modo retrato (vertical) com as duas mãos, levemente
              inclinado na sua direção ou paralelo ao chão.
            </Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumBadge}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              <Text style={styles.boldText}>Movimentos Suaves:</Text> Incline
              levemente para a esquerda ou direita para mover na horizontal, e
              incline a ponta superior para frente ou para trás para subir ou
              descer pelo labirinto.
            </Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumBadge}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              <Text style={styles.boldText}>Calibração Rápida:</Text> Se sentir
              que precisa inclinar demais o pulso, use o botão{' '}
              <Text style={styles.boldText}>⊕ Calibrar</Text> aqui ou durante a
              partida para registrar sua postura atual como neutra.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  backButtonText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 36,
  },
  feedbackBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  feedbackText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  sensitivityBadge: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '900',
    backgroundColor: '#0B1120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardDescription: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#0B1120',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  presetChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0B1120',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: '#38BDF8',
  },
  presetChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  presetChipTextActive: {
    color: '#F8FAFC',
  },
  sensorStatusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sensorStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  calibrationPreviewBox: {
    backgroundColor: '#0B1120',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  offsetMetaText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  calibrationBtnsRow: {
    gap: 10,
  },
  primaryCalBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryCalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryCalBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryCalBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 12,
  },
  toggleTextCol: {
    flex: 1,
  },
  toggleLabel: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  stepNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  instructionText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
  boldText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
