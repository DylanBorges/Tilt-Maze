import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { CalibrationOffset, GameSettings, Vector2D } from '../types/game';
import {
  mapRawAccelerometerToScreenAxes,
  processTiltInput,
} from './sensorMath';

const SENSOR_UPDATE_INTERVAL_MS = 20; // 50 Hz

export interface UseTiltSensorOptions {
  /** Se verdadeiro, mantém o acelerômetro ativo enquanto o app estiver em primeiro plano */
  enabled: boolean;
  /** Configurações atuais de sensibilidade e calibração */
  settings: GameSettings;
  /** Callback opcional disparado quando o aplicativo vai para segundo plano */
  onBackground?: () => void;
}

export interface UseTiltSensorResult {
  /** Referência mutável com o vetor de inclinação combinado (sensor + controle virtual) para leitura no loop de jogo sem re-render */
  tiltRef: React.MutableRefObject<Vector2D>;
  /** Estado de inclinação atualizado em taxa controlada para exibição visual na interface */
  tiltPreview: Vector2D;
  /** Indica se o sensor físico do acelerômetro está disponível e ativo no dispositivo */
  isSensorAvailable: boolean;
  /** Define o vetor de inclinação simulada (botões na tela ou teclado) */
  setManualTilt: (vector: Vector2D) => void;
  /** Retorna a leitura suavizada atual do sensor para salvar como nova posição neutra (calibração) */
  getCurrentNeutralOffset: () => CalibrationOffset;
}

export function useTiltSensor({
  enabled,
  settings,
  onBackground,
}: UseTiltSensorOptions): UseTiltSensorResult {
  const [isSensorAvailable, setIsSensorAvailable] = useState<boolean>(false);
  const [tiltPreview, setTiltPreview] = useState<Vector2D>({ x: 0, y: 0 });
  const [appState, setAppState] = useState<AppStateStatus>(
    (AppState.currentState as AppStateStatus) ?? 'active'
  );

  const settingsRef = useRef<GameSettings>(settings);
  const onBackgroundRef = useRef(onBackground);

  useEffect(() => {
    settingsRef.current = settings;
    onBackgroundRef.current = onBackground;
  }, [settings, onBackground]);

  const smoothedSensorRef = useRef<Vector2D>({ x: 0, y: 0 });
  const sensorTiltRef = useRef<Vector2D>({ x: 0, y: 0 });
  const manualTiltRef = useRef<Vector2D>({ x: 0, y: 0 });
  const combinedTiltRef = useRef<Vector2D>({ x: 0, y: 0 });
  const lastPreviewUpdateRef = useRef<number>(0);

  const updateCombinedTilt = useCallback(() => {
    const sx = sensorTiltRef.current.x;
    const sy = sensorTiltRef.current.y;
    const mx = manualTiltRef.current.x;
    const my = manualTiltRef.current.y;

    // Se o controle por toque/joystick estiver ativo, ele tem prioridade total
    // para que o jogador tenha resposta instantânea sem interferência da postura da mão
    const isManualActive = Math.hypot(mx, my) > 0.02;
    const combinedX = isManualActive ? mx : sx;
    const combinedY = isManualActive ? my : sy;

    combinedTiltRef.current = {
      x: Math.max(-1.8, Math.min(1.8, combinedX)),
      y: Math.max(-1.8, Math.min(1.8, combinedY)),
    };

    const now = Date.now();
    if (now - lastPreviewUpdateRef.current >= 60) {
      lastPreviewUpdateRef.current = now;
      setTiltPreview(combinedTiltRef.current);
    }
  }, []);

  const setManualTilt = useCallback(
    (vector: Vector2D) => {
      const sens = settingsRef.current.sensitivity ?? 1.0;
      const grav = settingsRef.current.gravityMultiplier ?? 1.25;
      const boost = settingsRef.current.downwardBoost ?? 1.2;

      // Resposta ágil e potente no analógico, com reforço de descida quando Y > 0
      const vy = vector.y > 0 ? vector.y * boost : vector.y;

      manualTiltRef.current = {
        x: vector.x * 1.2 * sens * (grav / 1.25),
        y: vy * 1.2 * sens * (grav / 1.25),
      };
      updateCombinedTilt();
    },
    [updateCombinedTilt]
  );

  const getCurrentNeutralOffset = useCallback((): CalibrationOffset => {
    return {
      x: Number(smoothedSensorRef.current.x.toFixed(4)),
      y: Number(smoothedSensorRef.current.y.toFixed(4)),
    };
  }, []);

  // Monitora mudanças de ciclo de vida do aplicativo (segundo plano / inativo)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
      if (nextState !== 'active') {
        sensorTiltRef.current = { x: 0, y: 0 };
        manualTiltRef.current = { x: 0, y: 0 };
        combinedTiltRef.current = { x: 0, y: 0 };
        setTiltPreview({ x: 0, y: 0 });
        onBackgroundRef.current?.();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Suporte opcional a teclado no ambiente Web / Desktop para facilitar testes
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || appState !== 'active') {
      return;
    }

    const pressedKeys = new Set<string>();

    const syncKeyboardVector = () => {
      let kx = 0;
      let ky = 0;
      if (pressedKeys.has('ArrowLeft') || pressedKeys.has('KeyA')) kx -= 1;
      if (pressedKeys.has('ArrowRight') || pressedKeys.has('KeyD')) kx += 1;
      if (pressedKeys.has('ArrowUp') || pressedKeys.has('KeyW')) ky -= 1;
      if (pressedKeys.has('ArrowDown') || pressedKeys.has('KeyS')) ky += 1;
      setManualTilt({ x: kx, y: ky });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'KeyA',
          'KeyD',
          'KeyW',
          'KeyS',
        ].includes(e.code)
      ) {
        pressedKeys.add(e.code);
        syncKeyboardVector();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (pressedKeys.delete(e.code)) {
        syncKeyboardVector();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      manualTiltRef.current = { x: 0, y: 0 };
    };
  }, [enabled, appState, setManualTilt]);

  // Gerencia a assinatura do Acelerômetro com limpeza rigorosa ao pausar ou desmontar
  useEffect(() => {
    let isMounted = true;
    let sensorSub: { remove: () => void } | null = null;

    const shouldListen = enabled && appState === 'active';

    if (!shouldListen) {
      sensorTiltRef.current = { x: 0, y: 0 };
      combinedTiltRef.current = {
        x: manualTiltRef.current.x,
        y: manualTiltRef.current.y,
      };
      setTiltPreview(combinedTiltRef.current);
      return;
    }

    async function startAccelerometer() {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (!isMounted) return;

        setIsSensorAvailable(available);
        if (!available) {
          return;
        }

        Accelerometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS);

        sensorSub = Accelerometer.addListener((data) => {
          if (!isMounted) return;
          const currentSettings = settingsRef.current;
          const mapped = mapRawAccelerometerToScreenAxes(
            data,
            currentSettings.invertX,
            currentSettings.invertY
          );

          const { smoothed, tilt } = processTiltInput(
            mapped,
            smoothedSensorRef.current,
            currentSettings
          );

          smoothedSensorRef.current = smoothed;
          sensorTiltRef.current = tilt;
          updateCombinedTilt();
        });
      } catch {
        if (isMounted) {
          setIsSensorAvailable(false);
        }
      }
    }

    startAccelerometer();

    return () => {
      isMounted = false;
      if (sensorSub) {
        sensorSub.remove();
        sensorSub = null;
      }
      sensorTiltRef.current = { x: 0, y: 0 };
    };
  }, [enabled, appState, updateCombinedTilt]);

  return {
    tiltRef: combinedTiltRef,
    tiltPreview,
    isSensorAvailable,
    setManualTilt,
    getCurrentNeutralOffset,
  };
}
