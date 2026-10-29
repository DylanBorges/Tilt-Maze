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
import { countHazards, LEVELS } from '../levels/levelsData';

export default function LevelSelectScreen() {
  const router = useRouter();
  const { progress } = useGame();
  const [practiceUnlockAll, setPracticeUnlockAll] = useState(false);

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
          <Text style={styles.headerTitle}>Selecionar Fase</Text>
          <Text style={styles.headerSub}>
            {progress.completedLevels.length} de {LEVELS.length} fases
            concluídas
          </Text>
        </View>
        <Pressable
          style={[
            styles.unlockToggle,
            practiceUnlockAll && styles.unlockToggleActive,
          ]}
          onPress={() => setPracticeUnlockAll((prev) => !prev)}
        >
          <Text style={styles.unlockToggleText}>
            {practiceUnlockAll ? 'Modo Livre: ON' : 'Modo Livre'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {LEVELS.map((level) => {
          const isCompleted = progress.completedLevels.includes(level.id);
          const isUnlocked =
            practiceUnlockAll ||
            level.id <= progress.highestUnlockedLevel ||
            isCompleted;
          const bestTime = progress.bestTimesMs[level.id];
          const hazards = countHazards(level);

          return (
            <Pressable
              key={level.id}
              disabled={!isUnlocked}
              onPress={() =>
                router.push({
                  pathname: '/game',
                  params: { levelId: String(level.id) },
                })
              }
              style={({ pressed }) => [
                styles.levelCard,
                !isUnlocked && styles.levelCardLocked,
                pressed && isUnlocked && styles.pressed,
              ]}
            >
              <View style={styles.cardTopRow}>
                <View
                  style={[
                    styles.levelNumberBadge,
                    {
                      backgroundColor: isUnlocked
                        ? level.accentColor
                        : '#334155',
                    },
                  ]}
                >
                  <Text style={styles.levelNumberText}>
                    {isUnlocked ? level.id : '🔒'}
                  </Text>
                </View>

                <View style={styles.titleColumn}>
                  <View style={styles.nameRow}>
                    <Text style={styles.levelName}>{level.name}</Text>
                    {isCompleted && (
                      <View style={styles.completedChip}>
                        <Text style={styles.completedChipText}>✓ Concluída</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.levelSubtitle}>{level.subtitle}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Dificuldade:</Text>
                  <Text
                    style={[styles.metaValue, { color: level.accentColor }]}
                  >
                    {level.difficulty}
                  </Text>
                </View>

                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Grade:</Text>
                  <Text style={styles.metaValue}>
                    {level.cols}×{level.rows}
                  </Text>
                </View>

                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>Armadilhas:</Text>
                  <Text
                    style={[
                      styles.metaValue,
                      hazards > 0 && { color: '#F87171' },
                    ]}
                  >
                    {hazards}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.recordLabel}>Melhor Tempo</Text>
                  <Text style={styles.recordValue}>
                    {bestTime !== undefined
                      ? formatTimeMs(bestTime)
                      : '--:--.--'}
                  </Text>
                </View>

                <View>
                  <Text style={styles.recordLabel}>Tempo Alvo</Text>
                  <Text style={styles.parValue}>
                    {formatTimeMs(level.parTimeMs)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.playBadge,
                    !isUnlocked && styles.playBadgeLocked,
                  ]}
                >
                  <Text style={styles.playBadgeText}>
                    {isUnlocked ? 'Jogar ▶' : 'Bloqueada'}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
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
    gap: 10,
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
  unlockToggle: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  unlockToggleActive: {
    backgroundColor: '#0369A1',
    borderColor: '#38BDF8',
  },
  unlockToggleText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  levelCard: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  levelCardLocked: {
    opacity: 0.55,
    backgroundColor: '#0F1624',
  },
  pressed: {
    opacity: 0.84,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  levelNumberBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  titleColumn: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  levelName: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
    flexShrink: 1,
  },
  completedChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  completedChipText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  levelSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  metaLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  metaValue: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  recordLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  recordValue: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  parValue: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  playBadge: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  playBadgeLocked: {
    backgroundColor: '#1E293B',
  },
  playBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
