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
  clampDeadzone,
  clampDownwardBoost,
  clampGravityMultiplier,
  clampSensitivity,
  MAX_DEADZONE,
  MAX_GRAVITY_MULTIPLIER,
  MAX_SENSITIVITY,
  MIN_DEADZONE,
  MIN_GRAVITY_MULTIPLIER,
  MIN_SENSITIVITY,
} from '../sensors/sensorMath';
import { useTiltSensor } from '../sensors/useTiltSensor';

const SENSITIVITY_PRESETS = [
  { label: 'Suave', value: 0.7 },
  { label: 'Padrão', value: 1.0 },
  { label: 'Rápida', value: 1.4 },
  { label: 'Alta', value: 1.8 },
];

const GRAVITY_PRESETS = [
  { label: 'Lenta', value: 0.8 },
  { label: 'Padrão', value: 1.2 },
  { label: 'Rápida', value: 1.6 },
  { label: 'Máxima', value: 2.2 },
];

const DEADZONE_PRESETS = [
  { label: 'Sensível', value: 0.015 },
  { label: 'Padrão', value: 0.035 },
  { label: 'Firme', value: 0.06 },
  { label: 'Ampla', value: 0.1 },
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

  const handleAdjustGravity = (delta: number) => {
    const next = clampGravityMultiplier(settings.gravityMultiplier + delta);
    updateSettings({ gravityMultiplier: next });
  };

  const handleAdjustDownwardBoost = (delta: number) => {
    const next = clampDownwardBoost(settings.downwardBoost + delta);
    updateSettings({ downwardBoost: next });
  };

  const handleAdjustDeadzone = (delta: number) => {
    const next = clampDeadzone(settings.deadzone + delta);
    updateSettings({ deadzone: next });
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
    showTempMessage('Calibração redefinida para a posição padrão.');
  };

  const sensRatio =
    (settings.sensitivity - MIN_SENSITIVITY) /
    (MAX_SENSITIVITY - MIN_SENSITIVITY);

  const gravRatio =
    (settings.gravityMultiplier - MIN_GRAVITY_MULTIPLIER) /
    (MAX_GRAVITY_MULTIPLIER - MIN_GRAVITY_MULTIPLIER);

  const deadRatio =
    (settings.deadzone - MIN_DEADZONE) / (MAX_DEADZONE - MIN_DEADZONE);

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
            Acessibilidade, física, postura e controles
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

        {/* 1. Postura do Celular (Vertical Natural vs. Deitado) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Postura do Aparelho</Text>
          <Text style={styles.cardDescription}>
            Escolha como você segura o celular para definir a posição neutra
            (onde a bolinha fica totalmente parada).
          </Text>

          <View style={styles.postureOptionsRow}>
            <Pressable
              style={[
                styles.postureCard,
                settings.postureMode === 'handheld' && styles.postureCardActive,
              ]}
              onPress={() => updateSettings({ postureMode: 'handheld' })}
            >
              <Text style={styles.postureIcon}>📱</Text>
              <Text style={styles.postureTitle}>Na Mão / Em Pé</Text>
              <Text style={styles.postureDesc}>
                Inclinado a ~45° (Mais ergonômico e divertido)
              </Text>
              {settings.postureMode === 'handheld' && (
                <View style={styles.postureBadge}>
                  <Text style={styles.postureBadgeText}>✓ Ativo</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.postureCard,
                settings.postureMode === 'table' && styles.postureCardActive,
              ]}
              onPress={() => updateSettings({ postureMode: 'table' })}
            >
              <Text style={styles.postureIcon}>🛌</Text>
              <Text style={styles.postureTitle}>Deitado / Mesa</Text>
              <Text style={styles.postureDesc}>
                Plano a 0° (Celular repousado sobre a mesa)
              </Text>
              {settings.postureMode === 'table' && (
                <View style={styles.postureBadge}>
                  <Text style={styles.postureBadgeText}>✓ Ativo</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* 2. Gravidade e Velocidade (Eixo Y e Descida) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>⚡ Gravidade & Velocidade</Text>
            <Text style={styles.valBadge}>
              {settings.gravityMultiplier.toFixed(1)}x
            </Text>
          </View>
          <Text style={styles.cardDescription}>
            Define a intensidade da força gravitacional sobre a bolinha ao
            inclinar o aparelho.
          </Text>

          <View style={styles.sliderRow}>
            <Pressable
              style={({ pressed }) => [
                styles.stepBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => handleAdjustGravity(-0.1)}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.max(4, Math.min(100, gravRatio * 100))}%`,
                    backgroundColor: '#10B981',
                  },
                ]}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.stepBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => handleAdjustGravity(0.1)}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.presetsRow}>
            {GRAVITY_PRESETS.map((preset) => {
              const isSelected =
                Math.abs(settings.gravityMultiplier - preset.value) < 0.05;
              return (
                <Pressable
                  key={preset.label}
                  style={[
                    styles.presetChip,
                    isSelected && styles.presetChipActive,
                  ]}
                  onPress={() =>
                    updateSettings({ gravityMultiplier: preset.value })
                  }
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

          {/* Reforço de descida / eixo Y */}
          <View style={styles.subConfigRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subConfigTitle}>Reforço de Descida (Eixo Y)</Text>
              <Text style={styles.subConfigDesc}>
                Compensa a inclinação para frente para a bolinha descer mais rápido.
              </Text>
            </View>
            <View style={styles.smallStepControls}>
              <Pressable
                style={styles.smallStepBtn}
                onPress={() => handleAdjustDownwardBoost(-0.1)}
              >
                <Text style={styles.smallStepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.smallStepValue}>
                {settings.downwardBoost.toFixed(1)}x
              </Text>
              <Pressable
                style={styles.smallStepBtn}
                onPress={() => handleAdjustDownwardBoost(0.1)}
              >
                <Text style={styles.smallStepBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* 3. Tamanho da Zona Neutra (Zona Morta / Deadzone) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>🎯 Zona Neutra (Zona Morta)</Text>
            <Text style={styles.valBadge}>
              {(settings.deadzone * 100).toFixed(1)}%
            </Text>
          </View>
          <Text style={styles.cardDescription}>
            O quanto o aparelho pode se mexer sem que a bolinha saia do lugar.
            Aumente para mãos trêmulas ou diminua para resposta instantânea.
          </Text>

          <View style={styles.sliderRow}>
            <Pressable
              style={({ pressed }) => [
                styles.stepBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => handleAdjustDeadzone(-0.01)}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.max(4, Math.min(100, deadRatio * 100))}%`,
                    backgroundColor: '#F59E0B',
                  },
                ]}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.stepBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => handleAdjustDeadzone(0.01)}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.presetsRow}>
            {DEADZONE_PRESETS.map((preset) => {
              const isSelected =
                Math.abs(settings.deadzone - preset.value) < 0.005;
              return (
                <Pressable
                  key={preset.label}
                  style={[
                    styles.presetChip,
                    isSelected && styles.presetChipActive,
                  ]}
                  onPress={() => updateSettings({ deadzone: preset.value })}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextActive,
                    ]}
                  >
                    {preset.label} ({(preset.value * 100).toFixed(0)}%)
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 4. Sensibilidade do Movimento */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>🌀 Sensibilidade do Acelerômetro</Text>
            <Text style={styles.valBadge}>
              {settings.sensitivity.toFixed(1)}x
            </Text>
          </View>
          <Text style={styles.cardDescription}>
            Multiplicador de resposta ao ângulo de rotação do aparelho.
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
                    width: `${Math.max(4, Math.min(100, sensRatio * 100))}%`,
                    backgroundColor: '#38BDF8',
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

        {/* 5. Calibração e Posição Neutra Atual */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Calibração Fina em Tempo Real</Text>
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
            Segure o celular na sua postura preferida e toque abaixo para zerar a
            bolinha exatamente neste ângulo.
          </Text>

          <View style={styles.calibrationPreviewBox}>
            <TiltIndicator tilt={tiltPreview} size={86} showCoordinates />
            <Text style={styles.offsetMetaText}>
              Offset Personalizado: X = {settings.calibration.x.toFixed(2)} | Y ={' '}
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
                ⊕ Calibrar Minha Posição Atual
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
                Restaurar Calibração Padrão
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 6. Opções de Controle e Acessibilidade na Tela */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Opções de Toque na Tela</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>
                Exibir Controles na Tela
              </Text>
              <Text style={styles.toggleSub}>
                Permite mover a bolinha tocando na tela com o dedo
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
                Inverter Eixo Horizontal (X)
              </Text>
              <Text style={styles.toggleSub}>
                Inverte a resposta esquerda/direita
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
                Inverter Eixo Vertical (Y)
              </Text>
              <Text style={styles.toggleSub}>
                Inverte a resposta cima/baixo
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
  valBadge: {
    color: '#38BDF8',
    fontSize: 15,
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
  postureOptionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  postureCard: {
    flex: 1,
    backgroundColor: '#0B1120',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    alignItems: 'center',
    gap: 4,
  },
  postureCardActive: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.14)',
  },
  postureIcon: {
    fontSize: 26,
    marginBottom: 2,
  },
  postureTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  postureDesc: {
    color: '#94A3B8',
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 14,
  },
  postureBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  postureBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
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
    minWidth: '22%',
    backgroundColor: '#0B1120',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
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
    fontSize: 11,
    fontWeight: '700',
  },
  presetChipTextActive: {
    color: '#F8FAFC',
  },
  subConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B1120',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    gap: 8,
  },
  subConfigTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  subConfigDesc: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 2,
  },
  smallStepControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallStepBtnText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  smallStepValue: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'center',
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
  pressed: {
    opacity: 0.8,
  },
});
