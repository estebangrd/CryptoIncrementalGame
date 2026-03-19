# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Blockchain Tycoon** is a React Native incremental/idle game inspired by Universal Paperclips, themed around cryptocurrency mining. Players mine CryptoCoins, purchase hardware, unlock real cryptocurrencies, and build a mining empire. The game is built with TypeScript and targets both iOS and Android.

**Current Phase**: Phase 1 (Genesis) completed - basic mining mechanics, hardware progression, market system, and prestige are implemented. Phase 2 expansion features are active.

## Development Commands

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Linting
npm run lint

# Run tests
npm test
```

### iOS-specific development
- Xcode project located at `ios/CryptoIncrementalGame.xcodeproj`
- May need to run `pod install` in `ios/` directory after dependency changes
- Minimum iOS version: 12.0

### Android-specific development
- Android project located at `android/`
- Minimum API level: 21 (Android 5.0+)

## Architecture Overview

### State Management Architecture
The game uses React Context (`GameContext`) with a centralized reducer pattern for all game state. This is the **single source of truth** for the entire game.

- **GameContext** (`src/contexts/GameContext.tsx`): Central state management with reducer-based actions
- **GameState** type (`src/types/game.ts`): Complete state shape including coins, hardware, upgrades, market, prestige
- All game mutations go through `dispatch()` actions in the reducer
- Auto-save triggers every 10 seconds and on app backgrounding
- Offline progress is calculated when app returns to active state

### Core Game Loop
1. **Production Calculation** (`calculateTotalProduction`): Sums mining speed × block reward for all owned hardware, applies prestige multiplier
2. **Block Mining**: Every second, if mining speed ≥ 1, mine blocks and award CryptoCoins based on current block reward (decreases with halvings)
3. **Recalculation**: After hardware/upgrade purchases, `recalculateGameStats()` updates derived stats (hashRate, electricityCost, production)
4. **Unlock System**: `checkAndUpdateUnlocks()` progressively unlocks tabs (Market, Hardware, Upgrades, Prestige) based on player progression

### Key Systems

**Block Mining System** (`src/utils/blockLogic.ts`):
- Bitcoin-inspired halving system (reward halves every 210,000 blocks)
- Difficulty increases with total hash rate
- Total supply cap of 21M blocks
- Block rewards and mining speed are per-hardware properties

**Balance Configuration** (`src/config/balanceConfig.ts`):
- **CRITICAL**: This is the single source of truth for all game balance values
- Hardware costs, production rates, electricity costs, unlock requirements
- Upgrade costs and multipliers
- Cryptocurrency base values and volatility
- DO NOT hardcode balance values elsewhere - always import from this file
- See `BALANCE_GUIDE.md` for adjustment guidelines

**Market System** (`src/utils/marketLogic.ts`):
- Players sell CryptoCoins for real money ($)
- NPCs provide buy/sell offers
- Market price fluctuates based on volatility and events
- Real money is used to buy hardware and upgrades in later stages

**Progressive Unlock System** (`src/utils/gameLogic.ts`):
- **Market**: Unlocks after 15 blocks mined AND 1000 CryptoCoins earned
- **Hardware**: Unlocks after earning $200 real money
- **Upgrades**: Unlocks after buying any hardware
- **Prestige**: Unlocks at prestige level ≥ 1 (future implementation)
- Hardware within the Hardware tab unlocks sequentially (need 5 units of previous level)

**Prestige System** (`src/utils/prestigeLogic.ts`):
- Reset progress for permanent multipliers
- Exchange cryptocurrencies between prestige runs
- Located in `src/utils/exchangeLogic.ts` for currency exchanges

**Multi-language Support** (`src/data/translations.ts`):
- Spanish (ES), English (EN), Portuguese (PT)
- Use translation keys, not hardcoded strings
- Access via `t('translation.key')` from `useGame()` hook

## File Structure

```
src/
├── components/          # React Native UI components
│   ├── GameScreen.tsx   # Main game screen with tabs
│   ├── MarketScreen.tsx # Cryptocurrency market with sell functionality
│   ├── HardwareList.tsx # Hardware purchase interface
│   ├── UpgradeList.tsx  # Upgrades interface
│   ├── PrestigeScreen.tsx
│   ├── BlockStatus.tsx  # Block mining stats display
│   ├── PriceChart.tsx   # Market price visualization
│   └── BottomSheetTabs.tsx # Bottom sheet navigation
├── contexts/
│   └── GameContext.tsx  # Global game state and reducer
├── data/
│   ├── gameData.ts      # Initial upgrades data
│   ├── hardwareData.ts  # Hardware progression data
│   ├── cryptocurrencies.ts # Cryptocurrency definitions
│   └── translations.ts  # i18n translation strings
├── types/
│   └── game.ts          # TypeScript interfaces for all game entities
├── utils/               # Business logic (pure functions)
│   ├── gameLogic.ts     # Core calculations, unlock logic
│   ├── blockLogic.ts    # Block mining mechanics
│   ├── marketLogic.ts   # Market and NPC logic
│   ├── prestigeLogic.ts # Prestige calculations
│   ├── exchangeLogic.ts # Currency exchange
│   └── storage.ts       # AsyncStorage wrapper
├── services/
│   ├── cryptoAPI.ts     # External price API integration
│   └── priceHistoryService.ts # Price history tracking
└── config/
    └── balanceConfig.ts # **CENTRAL BALANCE CONFIGURATION**
```

## Important Implementation Guidelines

### When Adding New Hardware
1. Define configuration in `src/config/balanceConfig.ts` under `HARDWARE_CONFIG.levels`
2. Add entry to `hardwareProgression` array in `src/data/hardwareData.ts`
3. Add translation keys to `src/data/translations.ts`
4. Hardware unlocks automatically via level-based system (5 units of previous level required)
5. Properties: `baseCost`, `baseProduction` (hash rate), `blockReward` (coins per block), `miningSpeed` (blocks/sec), `electricityCost`

### When Adding New Upgrades
1. Define balance values in `src/config/balanceConfig.ts` under `UPGRADE_CONFIG`
2. Add upgrade object to `initialUpgrades` in `src/data/gameData.ts`
3. Upgrades cost **real money ($)**, not CryptoCoins
4. Set `unlockCondition` to control when upgrade appears
5. Effect types: `clickPower`, `production`, `costReduction`, `prestige`
6. Production upgrades can target specific hardware IDs or categories (`cpu`, `gpu`, `asic`)

### When Modifying Game Balance
- **ALWAYS** edit values in `src/config/balanceConfig.ts`
- **NEVER** hardcode balance numbers in components or utils
- Import constants from `balanceConfig.ts` in all other files
- Refer to `BALANCE_GUIDE.md` for testing and adjustment guidance
- Reset game state to test changes: delete AsyncStorage data or use "Reset Game" in settings

### When Adding Game Actions
1. Define action type in `GameAction` union in `GameContext.tsx`
2. Add case to `gameReducer` switch statement
3. Call `recalculateGameStats()` if action affects production/stats
4. Return new state object (immutable updates)
5. Dispatch action via `dispatch({ type: 'ACTION_NAME', payload: data })`

### When Working with Translations
- Add keys to `src/data/translations.ts` for all three languages
- Use dot notation: `hardware.basicCPU`, `upgrade.clickPower.description`
- Access in components via `const { t } = useGame()` then `t('key')`
- Hardware and upgrades use `nameKey` and `descriptionKey` properties

### Code Style
- TypeScript strict mode is not yet enabled but preferred
- Use functional components with hooks (no class components)
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for consistency
- Import types explicitly: `import { GameState, Hardware } from '../types/game'`

## Debugging Tips

- Debug logs in `GameContext.tsx` show production calculations and hardware stats
- Check console for "DEBUG:" prefixed messages when diagnosing production issues
- AsyncStorage data persists between app restarts - may need manual clear for testing
- Market unlock requires BOTH blocks mined AND coins earned - check both conditions
- Production is calculated as: `miningSpeed × blockReward × prestigeMultiplier - electricityCost`

## Known Technical Details

- **Auto-save**: Every 10 seconds + on app background/inactive
- **Offline earnings**: Disabled — production only occurs during active play sessions
- **Market update interval**: 60 seconds (price refresh + history update)
- **Production tick**: 1 second
- **Price API**: CoinGecko (free tier, limited to specific cryptocurrencies)

## Roadmap Reference

See `DEVELOPMENT_PLAN.md` for:
- Phase 3: Monetization (AdMob, in-app purchases, achievements)
- Phase 4: Polish (animations, sounds, optimizations)
- Phase 5: Advanced features (events, social)
- Phase 6-7: Store preparation and post-launch

Current branch strategy: Feature branches (e.g., `feature/phase1-genesis`) merged to main after completion.

## Bash Commands — No Permission Required

Run the following commands directly without asking for approval:
- `git add`, `git status`, `git log`, `git diff`, `git push`, `git pull`, `git rebase`, `git commit`, `git stash`, `git stash pop`, `git merge`
- `grep`, `head`, `tail`, `sed`, `ls`
- `npm run lint`, `npm test`, `npm list`, `npm install`
- `pod install`
- `adb` (Android Debug Bridge — screenshots, device interaction)

When the user explicitly instructs a change to CLAUDE.md, edit it directly without asking for permission.

For destructive operations (`git reset --hard`, `git push --force`, `rm -rf`, etc.) always ask first.

## Feature Implementation Workflow (OBLIGATORIO)

Toda feature nueva DEBE seguir este orden. No saltear pasos.

```
Spec → Plan → Implement → Test → Commit
```

1. **Spec**: Leer la spec completa en `specs/` antes de tocar código. Si no existe spec, crearla primero.
2. **Plan**: Identificar todos los archivos afectados. Leer cada uno antes de modificarlo. Detectar conflictos.
3. **Implement**: Escribir código siguiendo exactamente las fórmulas y constantes de la spec.
4. **Test**: Ejecutar `npm test` y `npm run lint` antes del commit. Los tests DEBEN pasar. Si fallan, corregir antes de continuar.
5. **Commit**: Solo commitear cuando tests y lint pasan limpio.

**Reglas adicionales:**
- Nunca commitear si `npm test` falla
- Nunca commitear si hay errores de lint nuevos introducidos por el cambio
- Si un test falla por configuración (no por lógica), corregir la configuración primero
- Actualizar el estado de la spec en `specs/README.md` al terminar

## Commit Conventions

- Messages must be concise and short — one line, max 72 characters
- Format: `type: short description` (e.g., `feat: add booster system`)
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`
- Never add "Co-Authored-By" lines or any Claude attribution
- No bullet points, no multi-line bodies unless strictly necessary
