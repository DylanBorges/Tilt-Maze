# Tilt Maze — Jogo de Labirinto Controlado por Movimento

**Tilt Maze** é um jogo de quebra-cabeça 2D para dispositivos móveis desenvolvido com **React Native**, **Expo**, **TypeScript**, **Expo Router**, **Expo Sensors** (`Accelerometer`) e **AsyncStorage**.

Os jogadores guiam uma bolinha por labirintos progressivamente mais desafiadores inclinando fisicamente o smartphone, desviando de paredes e armadilhas (buracos perigosos) para alcançar o ponto de chegada no menor tempo possível.

---

## Principais Funcionalidades Implementadas

1. **Menu Principal (`src/app/index.tsx`)**
   - Iniciar / Continuar partida na fase mais avançada desbloqueada.
   - Acesso rápido à Seleção de Fases, Recordes e Configurações.
   - Resumo visual de fases concluídas, fase desbloqueada, sensibilidade atual e guia de instruções rápidas.

2. **Movimento por Inclinação e Controlador de Sensores (`src/sensors/useTiltSensor.ts` & `src/sensors/sensorMath.ts`)**
   - Leitura em tempo real do acelerômetro nativo via `expo-sensors` (`Accelerometer`).
   - Filtro passa-baixa exponencial (`applyLowPassFilter`) e zona morta (`applyDeadzone`) para eliminar tremores e ruídos do sensor.
   - Calibração de posição neutra confortável (`calibratePosition`) e ajuste de sensibilidade (`0.4x` a `2.5x`).
   - Controles simulados opcionais na tela (`VirtualTiltControls`) e suporte às setas do teclado (`WASD`/Setas) para facilitar testes em emuladores e navegadores.
   - **Gerenciamento de Ciclo de Vida (RF-12)**: A assinatura do sensor e o cronômetro são imediatamente interrompidos quando o jogo é pausado, concluído, quando a tela é desmontada ou quando o aplicativo vai para segundo plano (`AppState`).

3. **Física 2D, Colisões e Armadilhas (`src/game/engine.ts`)**
   - Simulação contínua em coordenadas normalizadas da grade (independente de resolução de tela) com sub-passos por quadro (`SUB_STEPS = 3`).
   - Detecção de colisão precisa (Círculo vs. AABB das células de parede) com deslizamento suave ao longo dos corredores.
   - Detecção de armadilhas (`CELL_HAZARD`): cair em um buraco vermelho emite alerta visual e reposiciona a bolinha no ponto de partida mantendo o cronômetro ativo.
   - Detecção de chegada (`CELL_GOAL`): aciona imediatamente a conclusão da fase e registra o tempo.

4. **5 Fases Progressivas Validadas (`src/levels/levelsData.ts`)**
   - **Fase 1 — Primeiros Passos** (*Iniciante*, grade 9×9): Corredores largos para praticar a inclinação.
   - **Fase 2 — Curvas de Atenção** (*Fácil*, grade 11×9): Introduz curvas fechadas e as primeiras armadilhas.
   - **Fase 3 — Encruzilhada Perigosa** (*Médio*, grade 13×11): Múltiplos caminhos e armadilhas estratégicas.
   - **Fase 4 — Ziguezague de Precisão** (*Difícil*, grade 13×11): Passagens estreitas exigindo controle fino.
   - **Fase 5 — Desafio Mestre** (*Especialista*, grade 15×11): Labirinto completo de alta complexidade.

5. **Persistência Local Segura (`src/storage/storage.ts` & `src/context/GameContext.tsx`)**
   - Armazena fases concluídas, melhores tempos por fase, maior fase desbloqueada, sensibilidade e calibração via `@react-native-async-storage/async-storage`.
   - Validação e sanitização completa dos dados carregados com inicialização segura de valores padrão caso os dados estejam ausentes ou inválidos.

---

## Estrutura do Projeto

```text
src/
├── app/
│   ├── _layout.tsx               # Configuração de rotas (Expo Router Stack) e provedores
│   ├── index.tsx                 # Tela de Menu Principal
│   ├── levels.tsx                # Tela de Seleção de Fases (com opção de Modo Livre para avaliação)
│   ├── game.tsx                  # Tela de Jogo, HUD, Cronômetro, Modal de Pausa e Conclusão
│   ├── records.tsx               # Tela de Recordes Locais e Estatísticas
│   └── settings.tsx              # Tela de Configurações, Sensibilidade, Calibração e Instruções
├── components/
│   ├── MazeBoard.tsx             # Renderização otimizada do labirinto 2D e da bolinha
│   ├── TiltIndicator.tsx         # Indicador visual de nível/bolha da inclinação atual
│   └── VirtualTiltControls.tsx   # Controles direcionais simulados para emulador/testes
├── context/
│   └── GameContext.tsx           # Estado global de progresso e configurações persistentes
├── game/
│   └── engine.ts                 # Motor de física 2D, colisões AABB, armadilhas e cronômetro
├── levels/
│   └── levelsData.ts             # Definição das 5 fases e validação de caminhos (BFS)
├── sensors/
│   ├── sensorMath.ts             # Filtro passa-baixa, zona morta, calibração e sensibilidade
│   └── useTiltSensor.ts          # Hook do Acelerômetro com controle de AppState e limpeza
├── storage/
│   └── storage.ts                # Persistência e validação com AsyncStorage
├── types/
│   └── game.ts                   # Tipagens TypeScript do domínio do jogo
└── __tests__/
    └── gameLogic.test.ts         # Testes automatizados de lógica, colisões, sensores e fases
```

---

## Como Executar o Projeto

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o servidor de desenvolvimento do Expo
```bash
npx expo start
```
- **Dispositivo físico Android (Recomendado para testar o acelerômetro real)**: Abra o aplicativo **Expo Go** no seu smartphone Android e escaneie o QR Code exibido no terminal.
- **Emulador Android**: Pressione `a` no terminal (ou execute `npm run android`). Use os controles simulados na tela ou o painel *Virtual Sensors* do Android Studio Emulator.
- **Navegador Web**: Pressione `w` no terminal (ou execute `npm run web`). Você pode controlar a inclinação pelos botões na tela ou pelas teclas `W, A, S, D` / Setas do teclado.
