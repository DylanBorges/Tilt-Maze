import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { formatTimeMs } from '../game/engine';
import { LEVELS } from '../levels/levelsData';

export default function RecordsScreen() {
  const router = useRouter();
  const { progress, resetProgress } = useGame();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const completedCount = progress.completedLevels.length;
  const totalBestMs = LEVELS.reduce((acc, lvl) => {
    const t = progress.bestTimesMs[lvl.id];
    return t !== undefined ? acc + t : acc;
  }, 0);

  const handleConfirmReset = async () => {
    await resetProgress();
    setConfirmingReset(false);
  };

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
          <Text style={styles.headerTitle}>Recordes e Progresso</Text>
          <Text style={styles.headerSub}>
            Dados armazenados localmente no dispositivo
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumo Geral */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>
              {completedCount}/{LEVELS.length}
            </Text>
            <Text style={styles.summaryLbl}>Fases Vencidas</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>
              Fase {progress.highestUnlockedLevel}
            </Text>
            <Text style={styles.summaryLbl}>Maior Desbloqueada</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>
              {completedCount > 0 ? formatTimeMs(totalBestMs) : '--:--.--'}
            </Text>
            <Text style={styles.summaryLbl}>Soma dos Recordes</Text>
          </View>
        </View>

        {/* Tabela de Recordes por Fase */}
        <Text style={styles.sectionTitle}>MELHORES TEMPOS POR FASE</Text>

        <View style={styles.recordsList}>
          {LEVELS.map((level) => {
            const bestTime = progress.bestTimesMs[level.id];
            const isCompleted = progress.completedLevels.includes(level.id);
            const beatPar =
              bestTime !== undefined && bestTime <= level.parTimeMs;

            return (
              <View key={level.id} style={styles.recordItem}>
                <View
                  style={[
                    styles.levelBadge,
                    {
                      backgroundColor: isCompleted
                        ? level.accentColor
                        : '#1E293B',
                    },
                  ]}
                >
                  <Text style={styles.levelBadgeText}>{level.id}</Text>
                </View>

                <View style={styles.recordInfoCol}>
                  <Text style={styles.recordLevelName}>{level.name}</Text>
                  <Text style={styles.recordDifficulty}>
                    {level.difficulty} • Alvo: {formatTimeMs(level.parTimeMs)}
                  </Text>
                </View>

                <View style={styles.timeCol}>
                  <Text
                    style={[
                      styles.bestTimeText,
                      bestTime === undefined && styles.emptyTimeText,
                    ]}
                  >
                    {bestTime !== undefined
                      ? formatTimeMs(bestTime)
                      : '--:--.--'}
                  </Text>
                  {isCompleted && (
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: beatPar ? '#FBBF24' : '#34D399' },
                      ]}
                    >
                      {beatPar ? '★ Abaixo do Alvo' : '✓ Concluída'}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Gerenciamento de Dados Salvos */}
        <View style={styles.resetZone}>
          <Text style={styles.resetZoneTitle}>Armazenamento Local</Text>
          <Text style={styles.resetZoneDesc}>
            Seu progresso, fases desbloqueadas e melhores tempos são salvos
            automaticamente e permanecem disponíveis após fechar o aplicativo.
          </Text>

          {!confirmingReset ? (
            <Pressable
              style={({ pressed }) => [
                styles.resetOutlineBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => setConfirmingReset(true)}
            >
              <Text style={styles.resetOutlineBtnText}>
                Redefinir Progresso e Recordes
              </Text>
            </Pressable>
          ) : (
            <View style={styles.confirmRow}>
              <Pressable
                style={[styles.confirmBtn, styles.cancelBtn]}
                onPress={() => setConfirmingReset(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, styles.dangerBtn]}
                onPress={handleConfirmReset}
              >
                <Text style={styles.dangerBtnText}>Confirmar Exclusão</Text>
              </Pressable>
            </View>
          )}
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
    paddingBottom: 36,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#131C2E',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  summaryVal: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  summaryLbl: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  recordsList: {
    gap: 10,
    marginBottom: 28,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131C2E',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  levelBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  recordInfoCol: {
    flex: 1,
  },
  recordLevelName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  recordDifficulty: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  timeCol: {
    alignItems: 'flex-end',
  },
  bestTimeText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  emptyTimeText: {
    color: '#475569',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  resetZone: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  resetZoneTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  resetZoneDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  resetOutlineBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  resetOutlineBtnText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#1E293B',
  },
  cancelBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  dangerBtn: {
    backgroundColor: '#DC2626',
  },
  dangerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
