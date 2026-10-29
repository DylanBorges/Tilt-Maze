import { useRouter } from 'expo-router';
import React from 'react';
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

export default function MainMenuScreen() {
  const router = useRouter();
  const { progress, settings } = useGame();

  const totalLevels = LEVELS.length;
  const completedCount = progress.completedLevels.length;
  const nextLevelId = Math.min(totalLevels, progress.highestUnlockedLevel);
  const nextLevel =
    LEVELS.find((l) => l.id === nextLevelId) ?? LEVELS[0];

  const bestTimeFirstLevel = progress.bestTimesMs[1];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho e Identidade Visual */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <View style={styles.logoOuterRing}>
              <View style={styles.logoInnerBall} />
            </View>
          </View>
          <Text style={styles.appTitle}>TILT MAZE</Text>
          <Text style={styles.appSubtitle}>
            Labirinto Controlado por Movimento
          </Text>
        </View>

        {/* Resumo Rápido de Progresso */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {completedCount}/{totalLevels}
            </Text>
            <Text style={styles.statLabel}>Fases Concluídas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Fase {nextLevelId}</Text>
            <Text style={styles.statLabel}>Desbloqueada</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {settings.sensitivity.toFixed(1)}x
            </Text>
            <Text style={styles.statLabel}>Sensibilidade</Text>
          </View>
        </View>

        {/* Botões Principais do Menu */}
        <View style={styles.menuActions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              router.push({
                pathname: '/game',
                params: { levelId: String(nextLevel.id) },
              })
            }
          >
            <View style={styles.primaryButtonTextCol}>
              <Text style={styles.primaryButtonLabel}>
                {completedCount > 0 ? 'CONTINUAR JOGO' : 'INICIAR JOGO'}
              </Text>
              <Text style={styles.primaryButtonSub}>
                Fase {nextLevel.id}: {nextLevel.name} ({nextLevel.difficulty})
              </Text>
            </View>
            <View style={styles.playArrowBox}>
              <Text style={styles.playArrowText}>▶</Text>
            </View>
          </Pressable>

          {nextLevel.id > 1 && (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryActionBtn,
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/game',
                  params: { levelId: '1' },
                })
              }
            >
              <Text style={styles.secondaryActionTitle}>
                Novo Jogo (Desde a Fase 1)
              </Text>
              {bestTimeFirstLevel !== undefined && (
                <Text style={styles.secondaryActionMeta}>
                  Melhor Fase 1: {formatTimeMs(bestTimeFirstLevel)}
                </Text>
              )}
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.navCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/levels')}
          >
            <View style={[styles.navIconBadge, { backgroundColor: '#1E3A8A' }]}>
              <Text style={styles.navIconText}>☷</Text>
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Selecionar Fase</Text>
              <Text style={styles.navDesc}>
                Escolha entre {totalLevels} labirintos com dificuldade progressiva
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.navCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/records')}
          >
            <View style={[styles.navIconBadge, { backgroundColor: '#065F46' }]}>
              <Text style={styles.navIconText}>★</Text>
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Recordes e Melhores Tempos</Text>
              <Text style={styles.navDesc}>
                Consulte seus tempos salvos localmente no dispositivo
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.navCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/settings')}
          >
            <View style={[styles.navIconBadge, { backgroundColor: '#3730A3' }]}>
              <Text style={styles.navIconText}>⚙</Text>
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Configurações e Calibração</Text>
              <Text style={styles.navDesc}>
                Ajuste a sensibilidade do acelerômetro e calibre o aparelho
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Guia Rápido de Como Jogar */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsHeader}>COMO JOGAR</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
            <Text style={styles.legendText}>
              <Text style={styles.boldText}>Incline o smartphone</Text> para
              movimentar a bolinha azul pelos corredores.
            </Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>
              Alcance o <Text style={styles.boldText}>ponto de chegada verde</Text>{' '}
              no menor tempo possível.
            </Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>
              Evite os <Text style={styles.boldText}>buracos vermelhos</Text>:
              cair neles devolve a bolinha ao início da fase!
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoOuterRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInnerBall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#38BDF8',
    borderWidth: 2,
    borderColor: '#E0F2FE',
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#131C2E',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#38BDF8',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
    textAlign: 'center',
  },
  menuActions: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  primaryButtonTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  primaryButtonSub: {
    color: '#E0F2FE',
    fontSize: 13,
    marginTop: 3,
  },
  playArrowBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playArrowText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    backgroundColor: '#131C2E',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryActionTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionMeta: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  navCard: {
    backgroundColor: '#131C2E',
    borderRadius: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  navIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  navIconText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
  },
  navDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  chevron: {
    color: '#64748B',
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  instructionsCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  instructionsHeader: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  boldText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
});
