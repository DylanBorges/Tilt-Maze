import { useLocalSearchParams, useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingJoystick } from '../components/FloatingJoystick';
import { MazeBoard } from '../components/MazeBoard';
import { MiniMap } from '../components/MiniMap';
import { TiltIndicator } from '../components/TiltIndicator';
import { VirtualTiltControls } from '../components/VirtualTiltControls';
import { useGame } from '../context/GameContext';
import {
  createInitialBallState,
  formatTimeMs,
  stepBallPhysics,
} from '../game/engine';
import {
  generateProceduralMaze,
  PROCEDURAL_PRESETS,
  ProceduralSize,
} from '../game/mazeGenerator';
import { getLevelById, LEVELS } from '../levels/levelsData';
import { useTiltSensor } from '../sensors/useTiltSensor';
import { BallState, GameStatus, LevelDefinition } from '../types/game';

interface CompletionSummary {
  elapsedMs: number;
  bestTimeMs: number;
  isNewRecord: boolean;
}

export default function GameScreen() {
  const params = useLocalSearchParams<{
    levelId?: string;
    procedural?: string;
    seed?: string;
  }>();

  const level = useMemo<LevelDefinition>(() => {
    if (params.procedural) {
      const presetKey = (params.procedural as ProceduralSize) || 'medium';
      const preset = PROCEDURAL_PRESETS[presetKey] ?? PROCEDURAL_PRESETS.medium;
      const seedNum = params.seed ? Number(params.seed) : undefined;
      return generateProceduralMaze(preset, seedNum);
    }

    const parsedId = Number(params.levelId);
    return getLevelById(Number.isFinite(parsedId) ? parsedId : 1) ?? LEVELS[0];
  }, [params.levelId, params.procedural, params.seed]);

  return <GameSession key={`${level.id}-${params.seed ?? 'std'}`} level={level} />;
}

function GameSession({ level }: { level: LevelDefinition }) {
  const router = useRouter();
  const {
    progress,
    settings,
    recordLevelCompletion,
    calibratePosition,
    updateSettings,
  } = useGame();

  const [joystickActive, setJoystickActive] = useState<boolean>(
    settings.showVirtualControls
  );

  const toggleJoystick = () => {
    setJoystickActive((prev) => {
      const next = !prev;
      updateSettings({ showVirtualControls: next });
      return next;
    });
  };

  const [status, setStatus] = useState<GameStatus>('playing');
  const [ball, setBall] = useState<BallState>(() =>
    createInitialBallState(level)
  );
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [hazardHits, setHazardHits] = useState<number>(0);
  const [hazardFlash, setHazardFlash] = useState<boolean>(false);
  const [calibrationBanner, setCalibrationBanner] = useState<string | null>(
    null
  );
  const [completionSummary, setCompletionSummary] =
    useState<CompletionSummary | null>(null);

  const [arenaSize, setArenaSize] = useState<{ width: number; height: number }>(
    {
      width: 320,
      height: 380,
    }
  );

  const ballRef = useRef<BallState>(createInitialBallState(level));
  const elapsedMsRef = useRef<number>(0);
  const statusRef = useRef<GameStatus>('playing');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const handleAppBackground = useCallback(() => {
    if (statusRef.current === 'playing') {
      setStatus('paused');
    }
  }, []);

  const {
    tiltRef,
    tiltPreview,
    isSensorAvailable,
    setManualTilt,
    getCurrentNeutralOffset,
  } = useTiltSensor({
    enabled: status === 'playing',
    settings,
    onBackground: handleAppBackground,
  });

  const resetCurrentLevel = useCallback(() => {
    const initialBall = createInitialBallState(level);
    ballRef.current = initialBall;
    elapsedMsRef.current = 0;
    statusRef.current = 'playing';
    setBall(initialBall);
    setElapsedMs(0);
    setHazardHits(0);
    setHazardFlash(false);
    setCompletionSummary(null);
    setStatus('playing');
  }, [level]);

  // Loop principal de física e cronômetro (executa somente enquanto status === 'playing')
  useEffect(() => {
    if (status !== 'playing') {
      return;
    }

    let animationFrameId: number | null = null;
    let lastTimestamp = performance.now();
    let flashTimeout: ReturnType<typeof setTimeout> | null = null;

    const loop = (now: number) => {
      if (statusRef.current !== 'playing') {
        return;
      }

      const rawDeltaMs = Math.max(0, now - lastTimestamp);
      lastTimestamp = now;

      // Limita saltos de tempo (ex: travamento de frame) a no máximo 50ms
      const deltaMs = Math.min(rawDeltaMs, 50);
      elapsedMsRef.current += deltaMs;

      const stepResult = stepBallPhysics(
        ballRef.current,
        level,
        tiltRef.current,
        deltaMs / 1000
      );

      ballRef.current = stepResult.ball;
      setBall(stepResult.ball);
      setElapsedMs(elapsedMsRef.current);

      if (stepResult.hitHazard) {
        setHazardHits((prev) => prev + 1);
        setHazardFlash(true);
        if (flashTimeout) clearTimeout(flashTimeout);
        flashTimeout = setTimeout(() => {
          setHazardFlash(false);
        }, 450);
      }

      if (stepResult.reachedGoal) {
        const finalTime = Math.max(100, Math.floor(elapsedMsRef.current));
        statusRef.current = 'completed';
        setStatus('completed');

        recordLevelCompletion(level.id, finalTime).then((report) => {
          setCompletionSummary({
            elapsedMs: finalTime,
            bestTimeMs: report.bestTimeMs,
            isNewRecord: report.isNewRecord,
          });
        });
        return;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (flashTimeout !== null) {
        clearTimeout(flashTimeout);
      }
    };
  }, [status, level, tiltRef, recordLevelCompletion]);

  const handleArenaLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 40 && height > 40) {
      setArenaSize({
        width: Math.max(200, width - 16),
        height: Math.max(200, height - 16),
      });
    }
  };

  const handleQuickCalibrate = async () => {
    const offset = getCurrentNeutralOffset();
    await calibratePosition(offset);
    setCalibrationBanner('Posição neutra recalibrada com sucesso!');
    setTimeout(() => {
      setCalibrationBanner(null);
    }, 2200);
  };

  const savedBestTime = progress.bestTimesMs[level.id];
  const nextLevel = getLevelById(level.id + 1);
  const showVirtualPad = settings.showVirtualControls || !isSensorAvailable;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra Superior (HUD) */}
      <View style={styles.topHud}>
        <View style={styles.levelInfoCol}>
          <Text style={styles.levelTag}>
            FASE {level.id} • {level.difficulty.toUpperCase()}
          </Text>
          <Text style={styles.levelTitle} numberOfLines={1}>
            {level.name}
          </Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>TEMPO</Text>
          <Text style={styles.timerValue}>{formatTimeMs(elapsedMs)}</Text>
          {savedBestTime !== undefined && (
            <Text style={styles.bestSmallText}>
              Recorde: {formatTimeMs(savedBestTime)}
            </Text>
          )}
        </View>

        <View style={styles.hudActions}>
          <TiltIndicator tilt={tiltPreview} size={44} />
          <Pressable
            style={({ pressed }) => [
              styles.pauseButton,
              pressed && styles.pressed,
            ]}
            onPress={() => setStatus('paused')}
            accessibilityLabel="Pausar jogo"
          >
            <Text style={styles.pauseButtonText}>❚❚</Text>
          </Pressable>
        </View>
      </View>

      {/* Barra Secundária de Status e Ações Rápidas */}
      <View style={styles.subStatusBar}>
        <View style={styles.statusPillsRow}>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.sensorDot,
                {
                  backgroundColor: isSensorAvailable ? '#10B981' : '#F59E0B',
                },
              ]}
            />
            <Text style={styles.statusPillText}>
              {isSensorAvailable ? 'Acelerômetro Ativo' : 'Modo Simulado'}
            </Text>
          </View>

          {hazardHits > 0 && (
            <View style={[styles.statusPill, styles.hazardPill]}>
              <Text style={styles.hazardPillText}>
                Armadilhas: {hazardHits}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.quickActionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.quickBtn,
              joystickActive ? styles.quickBtnActive : styles.quickBtnInactive,
              pressed && styles.pressed,
            ]}
            onPress={toggleJoystick}
            accessibilityLabel="Alternar Joystick Flutuante"
          >
            <Text
              style={[
                styles.quickBtnText,
                joystickActive ? styles.quickBtnTextActive : styles.quickBtnTextInactive,
              ]}
            >
              {joystickActive ? '🕹️ Joystick: ON' : '🕹️ Joystick: OFF'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.quickBtn,
              pressed && styles.pressed,
            ]}
            onPress={handleQuickCalibrate}
          >
            <Text style={styles.quickBtnText}>⊕ Calibrar</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.quickBtn,
              pressed && styles.pressed,
            ]}
            onPress={resetCurrentLevel}
          >
            <Text style={styles.quickBtnText}>↺ Reiniciar</Text>
          </Pressable>
        </View>
      </View>

      {calibrationBanner && (
        <View style={styles.bannerAlert}>
          <Text style={styles.bannerAlertText}>{calibrationBanner}</Text>
        </View>
      )}

      {hazardFlash && (
        <View style={styles.hazardBannerAlert}>
          <Text style={styles.hazardBannerText}>
            ⚠ Bolinha caiu na armadilha! Retornando ao início...
          </Text>
        </View>
      )}

      {/* Área Central do Labirinto */}
      <View style={styles.arenaContainer} onLayout={handleArenaLayout}>
        <MazeBoard
          level={level}
          ball={ball}
          maxWidth={arenaSize.width}
          maxHeight={arenaSize.height}
          hazardFlash={hazardFlash}
        />

        {/* Minimapa / Radar para labirintos grandes com câmera móvel */}
        {(level.cols > 11 || level.rows > 11) && (
          <MiniMap level={level} ball={ball} maxSize={76} />
        )}

        {/* Joystick Flutuante cobre a tela da arena quando ativado */}
        {joystickActive && (
          <FloatingJoystick
            overlayMode
            onTiltChange={setManualTilt}
            disabled={status !== 'playing'}
          />
        )}
      </View>

      {/* Controles Simulados Opcionais (Emulador / Web / Acessibilidade) */}
      {showVirtualPad && (
        <View style={styles.virtualControlsFooter}>
          <VirtualTiltControls
            onChangeTilt={setManualTilt}
            isSensorAvailable={isSensorAvailable}
          />
        </View>
      )}

      {/* Modal de Jogo Pausado */}
      <Modal
        visible={status === 'paused'}
        transparent
        animationType="fade"
        onRequestClose={() => setStatus('playing')}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalBadge}>JOGO PAUSADO</Text>
            <Text style={styles.modalTitle}>
              Fase {level.id}: {level.name}
            </Text>
            <Text style={styles.modalSubText}>
              Cronômetro e sensores estão suspensos enquanto o jogo está pausado.
            </Text>

            <View style={styles.pauseStatsBox}>
              <View style={styles.pauseStatCol}>
                <Text style={styles.pauseStatLabel}>Tempo Atual</Text>
                <Text style={styles.pauseStatVal}>
                  {formatTimeMs(elapsedMs)}
                </Text>
              </View>
              <View style={styles.pauseStatCol}>
                <Text style={styles.pauseStatLabel}>Melhor Tempo</Text>
                <Text style={styles.pauseStatVal}>
                  {savedBestTime !== undefined
                    ? formatTimeMs(savedBestTime)
                    : '--:--.--'}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtonsCol}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalPrimaryBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => setStatus('playing')}
              >
                <Text style={styles.modalPrimaryBtnText}>
                  ▶ Retomar Partida
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalSecondaryBtn,
                  pressed && styles.pressed,
                ]}
                onPress={resetCurrentLevel}
              >
                <Text style={styles.modalSecondaryBtnText}>
                  ↺ Reiniciar Fase Atual
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalSecondaryBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.replace('/levels')}
              >
                <Text style={styles.modalSecondaryBtnText}>
                  ☷ Selecionar Outra Fase
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalGhostBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.replace('/')}
              >
                <Text style={styles.modalGhostBtnText}>
                  ← Voltar ao Menu Principal
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Conclusão da Fase */}
      <Modal
        visible={status === 'completed'}
        transparent
        animationType="fade"
        onRequestClose={() => router.replace('/')}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.trophyBadge}>
              <Text style={styles.trophyIcon}>★</Text>
            </View>

            <Text style={styles.completedTag}>FASE CONCLUÍDA!</Text>
            <Text style={styles.modalTitle}>
              Fase {level.id}: {level.name}
            </Text>

            {completionSummary?.isNewRecord && (
              <View style={styles.newRecordBanner}>
                <Text style={styles.newRecordText}>
                  🏆 NOVO RECORDE PESSOAL!
                </Text>
              </View>
            )}

            <View style={styles.pauseStatsBox}>
              <View style={styles.pauseStatCol}>
                <Text style={styles.pauseStatLabel}>Tempo Decorrido</Text>
                <Text style={[styles.pauseStatVal, { color: '#34D399' }]}>
                  {formatTimeMs(completionSummary?.elapsedMs ?? elapsedMs)}
                </Text>
              </View>
              <View style={styles.pauseStatCol}>
                <Text style={styles.pauseStatLabel}>Melhor Tempo</Text>
                <Text style={styles.pauseStatVal}>
                  {formatTimeMs(
                    completionSummary?.bestTimeMs ??
                      savedBestTime ??
                      elapsedMs
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtonsCol}>
              {nextLevel && (
                <Pressable
                  style={({ pressed }) => [
                    styles.modalSuccessBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() =>
                    router.replace({
                      pathname: '/game',
                      params: { levelId: String(nextLevel.id) },
                    })
                  }
                >
                  <Text style={styles.modalPrimaryBtnText}>
                    Próxima Fase (Fase {nextLevel.id}) →
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.modalSecondaryBtn,
                  pressed && styles.pressed,
                ]}
                onPress={resetCurrentLevel}
              >
                <Text style={styles.modalSecondaryBtnText}>
                  ↺ Jogar Fase Novamente
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalSecondaryBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.replace('/levels')}
              >
                <Text style={styles.modalSecondaryBtnText}>
                  ☷ Seleção de Fases
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalGhostBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.replace('/')}
              >
                <Text style={styles.modalGhostBtnText}>
                  ← Menu Principal
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  topHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 10,
  },
  levelInfoCol: {
    flex: 1,
  },
  levelTag: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  levelTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  timerBox: {
    alignItems: 'center',
    backgroundColor: '#0B1120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    minWidth: 110,
  },
  timerLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  timerValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  bestSmallText: {
    color: '#38BDF8',
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  hudActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pauseButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButtonText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
  },
  subStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  statusPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131C2E',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  sensorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  hazardPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  hazardPillText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickBtnActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: '#38BDF8',
  },
  quickBtnInactive: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    opacity: 0.8,
  },
  quickBtnText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  quickBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  quickBtnTextInactive: {
    color: '#94A3B8',
  },
  bannerAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  bannerAlertText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  hazardBannerAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    borderBottomWidth: 1,
    borderBottomColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  hazardBannerText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  arenaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  virtualControlsFooter: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  pressed: {
    opacity: 0.8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#131C2E',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  modalBadge: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  completedTag: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  trophyBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trophyIcon: {
    color: '#34D399',
    fontSize: 28,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  newRecordBanner: {
    marginTop: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  newRecordText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '800',
  },
  pauseStatsBox: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#0B1120',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  pauseStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  pauseStatLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  pauseStatVal: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  modalButtonsCol: {
    width: '100%',
    gap: 10,
  },
  modalPrimaryBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSuccessBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSecondaryBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalSecondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  modalGhostBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalGhostBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
});
