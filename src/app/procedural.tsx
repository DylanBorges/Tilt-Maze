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
import {
  PROCEDURAL_PRESETS,
  ProceduralSize,
} from '../game/mazeGenerator';

export default function ProceduralMazeScreen() {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<ProceduralSize>('medium');
  const [seed, setSeed] = useState<number>(() =>
    Math.floor(100000 + Math.random() * 900000)
  );

  const currentPreset = PROCEDURAL_PRESETS[selectedSize];

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(100000 + Math.random() * 900000));
  };

  const handleStartGame = () => {
    router.push({
      pathname: '/game',
      params: {
        procedural: selectedSize,
        seed: String(seed),
      },
    });
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
          <Text style={styles.headerTitle}>Labirintos Procedurais</Text>
          <Text style={styles.headerSub}>
            Fases infinitas maiores que a tela com câmera móvel
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Destaque */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroIcon}>🎲</Text>
          <Text style={styles.heroTitle}>Geração Procedural Infinita</Text>
          <Text style={styles.heroDesc}>
            Cada partida cria um labirinto totalmente inédito usando o algoritmo
            matemático <Text style={styles.bold}>DFS Backtracking</Text>.
            Labirintos médios e gigantes ativam a{' '}
            <Text style={styles.bold}>Câmera com Viewport Móvel</Text> e o{' '}
            <Text style={styles.bold}>Minimapa (Radar)</Text>!
          </Text>
        </View>

        {/* Seleção de Tamanho */}
        <Text style={styles.sectionHeader}>ESCOLHA O TAMANHO DO LABIRINTO</Text>

        <View style={styles.sizeOptionsGrid}>
          {(Object.keys(PROCEDURAL_PRESETS) as ProceduralSize[]).map((key) => {
            const preset = PROCEDURAL_PRESETS[key];
            const isSelected = selectedSize === key;

            return (
              <Pressable
                key={key}
                style={[
                  styles.sizeCard,
                  isSelected && styles.sizeCardActive,
                  { borderColor: isSelected ? preset.accentColor : '#1E293B' },
                ]}
                onPress={() => setSelectedSize(key)}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.dimText, { color: preset.accentColor }]}>
                    {preset.cols}×{preset.rows}
                  </Text>
                  <View
                    style={[
                      styles.diffBadge,
                      { backgroundColor: preset.accentColor },
                    ]}
                  >
                    <Text style={styles.diffBadgeText}>{preset.difficulty}</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>
                  {key === 'small' && 'Pequeno'}
                  {key === 'medium' && 'Médio (Câmera Móvel)'}
                  {key === 'large' && 'Grande (Exploração)'}
                  {key === 'titan' && 'Titã (Masmorra Gigante)'}
                </Text>

                <Text style={styles.cardSub}>
                  {key === 'small' && 'Cabe na tela inteira. Rápido e direto.'}
                  {key === 'medium' &&
                    'Câmera dinâmica segue a bolinha suavemente.'}
                  {key === 'large' &&
                    'Exige orientação pelo Minimapa e memória de trajeto.'}
                  {key === 'titan' &&
                    'Desafio épico de 1.089 blocos com múltiplos becos e buracos.'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Painel da Semente (Seed) */}
        <View style={styles.seedCard}>
          <View style={styles.seedHeader}>
            <View>
              <Text style={styles.seedLabel}>SEMENTE GERADORA (SEED)</Text>
              <Text style={styles.seedValue}>#{seed}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.randomBtn,
                pressed && styles.pressed,
              ]}
              onPress={handleRandomizeSeed}
            >
              <Text style={styles.randomBtnText}>🎲 Sortear Outro</Text>
            </Pressable>
          </View>
          <Text style={styles.seedHint}>
            A mesma semente sempre gera exatamente o mesmo labirinto. Você pode
            compartilhar o código da semente com amigos para competir pelo melhor
            tempo!
          </Text>
        </View>

        {/* Resumo da Partida */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Dimensão Total:</Text>
            <Text style={styles.summaryVal}>
              {currentPreset.cols * currentPreset.rows} células (
              {currentPreset.cols}×{currentPreset.rows})
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Câmera Móvel:</Text>
            <Text style={styles.summaryVal}>
              {currentPreset.cols > 11 ? '✓ Ativa (Viewport Dinâmico)' : 'Tela Cheia'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Minimapa (Radar):</Text>
            <Text style={styles.summaryVal}>
              {currentPreset.cols > 11 ? '✓ HUD Superior Direito' : 'Não necessário'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Garantia Matemática:</Text>
            <Text style={[styles.summaryVal, { color: '#34D399' }]}>
              100% Solucionável (Sem becos infinitos)
            </Text>
          </View>
        </View>

        {/* Botão de Iniciar */}
        <Pressable
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.pressed,
            { backgroundColor: currentPreset.accentColor },
          ]}
          onPress={handleStartGame}
        >
          <Text style={styles.playButtonText}>
            JOGAR LABIRINTO {currentPreset.cols}×{currentPreset.rows} ▶
          </Text>
        </Pressable>
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
    gap: 14,
    paddingBottom: 36,
  },
  heroBanner: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    gap: 6,
  },
  heroIcon: {
    fontSize: 32,
  },
  heroTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  heroDesc: {
    color: '#94A3B8',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  bold: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  sizeOptionsGrid: {
    gap: 10,
  },
  sizeCard: {
    backgroundColor: '#0B1120',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  sizeCardActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dimText: {
    fontSize: 16,
    fontWeight: '900',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  seedCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  seedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seedLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  seedValue: {
    color: '#38BDF8',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  randomBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  randomBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  seedHint: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
  },
  summaryBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryKey: {
    color: '#94A3B8',
    fontSize: 12,
  },
  summaryVal: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  playButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    marginTop: 6,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
