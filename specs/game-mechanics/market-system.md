# Market System

## Estado
- **Fase**: Phase 2 - Expansion (Implemented)
- **Estado**: Implemented & Active
- **Prioridad**: High (Monetization Bridge)
- **Última actualización**: 2026-04-18

## Descripción

El Market System permite a los jugadores convertir CryptoCoins en Real Money ($) mediante la venta en un mercado simulado. Los precios de las criptomonedas fluctúan usando un proceso estocástico Ornstein-Uhlenbeck (OU) con regímenes de mercado, sin dependencia de APIs externas ni datasets estáticos. El dinero real ($) se usa para comprar hardware avanzado y upgrades, creando un loop económico: CryptoCoins → Real Money → Hardware → Más CryptoCoins.

El CryptoCoin nativo deriva su precio del precio base de la era actual (`ERA_BASE_PRICES`) multiplicado por `(1 + priceDeviation)`, donde `priceDeviation` es un valor mean-reverting generado por el motor OU (rango -30% a +40%). Las otras criptomonedas (BTC, ETH, DOGE, ADA) son puramente cosméticas/de referencia y solo se usan para dar contexto de mercado.

## Objetivos
- [x] Crear un puente económico entre progresión gratuita y monetización
- [x] Simular un mercado de criptomonedas con fluctuaciones visibles (OU + regímenes)
- [x] Funcionar 100% offline sin dependencias de API o datasets externos
- [x] Proporcionar variabilidad entre partidas mediante proceso estocástico
- [x] Proporcionar información visual de tendencias de precios
- [x] Desbloquear progresivamente para no overwhelm al jugador

## Comportamiento Esperado

### Caso de Uso 1: Vender CryptoCoins por Real Money
**Dado que** el jugador tiene CryptoCoins y el Market está desbloqueado
**Cuando** ingresa una cantidad a vender y presiona "Sell"
**Entonces**
- Se valida que tenga suficientes CryptoCoins
- Se calcula el valor en $ usando el precio actual: `amount × currentPrice`
- Se deduce la cantidad de CryptoCoins
- Se acredita el Real Money ($)
- Se actualiza `totalRealMoneyEarned` (para stats y unlocks)
- Se muestra una confirmación: "Sold X CC for $Y"
- Se verifica si se desbloqueó el Hardware tab ($150 threshold)

### Caso de Uso 2: Actualización de Precios (Motor OU)
**Dado que** el jugador tiene el Market abierto
**Cuando** pasan 5 segundos desde la última actualización (`MARKET_CONFIG.UPDATE_INTERVAL = 5000ms`)
**Entonces**
- Se ejecuta un tick del proceso Ornstein-Uhlenbeck (`tickOU()`)
- El nuevo precio = `ERA_BASE_PRICES[currentEra] × (1 + priceDeviation)`
- `priceDeviation` se actualiza: mean-reversion + volatilidad del régimen + drift
- Se agrega el nuevo precio al chart (ventana deslizante de 120 puntos)
- Se descarta el punto más antiguo del chart
- Si el régimen actual expira (`priceRegimeTicksLeft === 0`), se selecciona uno nuevo

### Caso de Uso 3: Ver Detalles de Criptomoneda
**Dado que** el jugador abre la lista de criptomonedas en el Market
**Cuando** ve la lista
**Entonces**
- CryptoCoin está siempre expandido (chart + sell controls visibles, no colapsable)
- Las demás criptomonedas se expanden/colapsan al tocar la fila
- Se muestra el nombre y símbolo en la fila (ej: CryptoCoin · CC · GENESIS CHAIN)
- El precio actual en USD se muestra en el header del chart (no en la fila)
- Se muestra el cambio % dentro de la ventana de 30 minutos en el header del chart
- Se muestra un botón "Sell" para vender (solo para CryptoCoin nativo)

### Caso de Uso 4: Desbloqueo del Market
**Dado que** el jugador está en fase inicial del juego
**Cuando** mina 10 bloques Y acumula 500 CryptoCoins
**Entonces**
- El tab "Market" se desbloquea en el bottom navigation
- Se muestra un tutorial toast: "🔓 Market Unlocked! Sell your coins for real money"
- El tab aparece junto a "Mining" en la navegación
- Al entrar, se explican las criptomonedas disponibles

## Criptomonedas Disponibles

### CryptoCoin (Nativo del Juego)
```typescript
{
  id: 'cryptocoin',
  symbol: 'CC',
  nameKey: 'crypto.cryptocoin',
  baseValue: 0.001,        // $0.001 por CC (configurable)
  volatility: 0.1,         // 10% de fluctuación
  color: '#00ff88',        // Verde crypto
  icon: 'currency-btc',
  isNative: true           // Precio derivado del historial local de LTC
}
```
**Propósito**: Moneda principal del juego, siempre disponible

**Fórmula de precio**:
```
cryptoCoinPrice = ERA_BASE_PRICES[currentEra] × (1 + priceDeviation)
```
- `priceDeviation`: valor mean-reverting generado por proceso Ornstein-Uhlenbeck, rango **-0.30 a +0.40**
- `ERA_BASE_PRICES`: [0.08, 0.50, 2.00, 5.00, 8.00, 8.00, 8.00] — el precio base sube con cada era
- Parámetros OU: theta=0.12 (velocidad de reversión), sigma=0.055 (volatilidad base)
- 6 regímenes de mercado (normal/bull/bear/volatile/spike/crash) modifican theta/sigma/drift

### Bitcoin (BTC)
```typescript
{
  id: 'bitcoin',
  symbol: 'BTC',
  nameKey: 'crypto.bitcoin',
  baseValue: 10,           // Solo usado si API falla
  volatility: 0.15,
  color: '#F7931A',
  icon: 'bitcoin',
  apiId: 'bitcoin',        // CoinGecko ID
  unlockRequirement: 'Always available'
}
```

### Ethereum (ETH)
```typescript
{
  id: 'ethereum',
  symbol: 'ETH',
  nameKey: 'crypto.ethereum',
  baseValue: 5,
  volatility: 0.2,
  color: '#627EEA',
  icon: 'ethereum',
  apiId: 'ethereum'
}
```

### Dogecoin (DOGE)
```typescript
{
  id: 'dogecoin',
  symbol: 'DOGE',
  nameKey: 'crypto.dogecoin',
  baseValue: 0.01,
  volatility: 0.3,         // Alta volatilidad
  color: '#C2A633',
  icon: 'dog',
  apiId: 'dogecoin'
}
```

### Cardano (ADA)
```typescript
{
  id: 'cardano',
  symbol: 'ADA',
  nameKey: 'crypto.cardano',
  baseValue: 0.05,
  volatility: 0.25,
  color: '#0033AD',
  icon: 'card',
  apiId: 'cardano'
}
```

## Fórmulas y Cálculos

### Cálculo de Valor de Venta
```typescript
function calculateSaleValue(amount: number, price: number): number {
  // Validaciones de seguridad
  if (!price || price <= 0 || !isFinite(price)) {
    console.warn('Invalid price:', price);
    return 0;
  }

  const value = amount * price;

  return value;
}
```

### Actualización de Precios desde API
```typescript
async function fetchCryptoPrices(
  cryptocurrencies: Cryptocurrency[]
): Promise<Cryptocurrency[]> {
  try {
    // IDs de CoinGecko para las criptos que usan API
    const apiIds = cryptocurrencies
      .filter(c => c.apiId)
      .map(c => c.apiId)
      .join(',');

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${apiIds}&vs_currencies=usd`
    );

    const data = await response.json();

    return cryptocurrencies.map(crypto => {
      if (crypto.isNative) {
        // CryptoCoin usa precio simulado
        return {
          ...crypto,
          currentValue: crypto.baseValue,
        };
      }

      // Actualizar con precio de API si está disponible
      const apiPrice = data[crypto.apiId]?.usd;
      return {
        ...crypto,
        currentValue: apiPrice || crypto.currentValue, // Fallback al anterior
      };
    });
  } catch (error) {
    console.warn('Failed to fetch crypto prices:', error);
    return cryptocurrencies; // Mantener precios anteriores
  }
}
```

### Verificación de Necesidad de Actualización
```typescript
function shouldUpdatePrices(lastUpdateTime: number): boolean {
  const now = Date.now();
  const UPDATE_INTERVAL = MARKET_CONFIG.UPDATE_INTERVAL; // 5000ms (5 segundos)

  return (now - lastUpdateTime) >= UPDATE_INTERVAL;
}
```

### Simulación de Precio (Fallback sin API)
```typescript
function simulatePrice(baseValue: number, volatility: number): number {
  // Fluctuación aleatoria dentro del rango de volatilidad
  const fluctuation = (Math.random() - 0.5) * 2 * volatility; // -volatility a +volatility
  return baseValue * (1 + fluctuation);
}

// Ejemplo con BTC (baseValue: 10, volatility: 0.15):
// Precio puede variar entre $8.50 y $11.50
```

## Motor de Precios — Ornstein-Uhlenbeck con Regímenes

### Diseño General
En lugar de consumir APIs externas o datasets estáticos de BTC (que producían variaciones <0.1% por tick, resultando en charts planos), el juego usa un proceso estocástico Ornstein-Uhlenbeck (OU) con regímenes de mercado. Esto provee:
- Fluctuaciones visibles (~2.5% por tick vs 0.04% anterior)
- Tendencias recognizables (bulls, bears, spikes, crashes)
- Funcionamiento 100% offline, sin archivos de datos externos
- Control total del game designer sobre la volatilidad
- Variabilidad natural entre partidas (proceso aleatorio)

### Proceso OU (Mean-Reverting)
```typescript
// Cada tick (5 segundos):
newDeviation = deviation + theta * (0 - deviation) + sigma * gaussianNoise + drift
price = ERA_BASE_PRICES[currentEra] * (1 + newDeviation)
```

- `theta` (0.12): velocidad de reversión a la media — previene que el precio diverga
- `sigma` (0.055): volatilidad base por tick
- `drift`: tendencia direccional (0 en normal, positivo en bull, negativo en bear)
- `deviation` se clampea a [-0.30, +0.40] como safety rails

### Regímenes de Mercado
| Régimen | Peso | Duración | Drift | Sigma | Theta | Efecto |
|---------|:----:|:--------:|:-----:|:-----:|:-----:|--------|
| normal | 40 | 20-60 ticks | 0 | 1.0x | 1.0x | Fluctuación base |
| bull | 18 | 15-40 ticks | +0.008 | 1.2x | 0.8x | Tendencia alcista |
| bear | 18 | 15-40 ticks | -0.008 | 1.2x | 0.8x | Tendencia bajista |
| volatile | 12 | 8-20 ticks | 0 | 2.0x | 0.6x | Alta volatilidad |
| spike | 6 | 3-8 ticks | +0.025 | 2.5x | 0.4x | Subida brusca |
| crash | 6 | 3-8 ticks | -0.030 | 2.5x | 0.4x | Caída brusca |

- **Blocking rules**: spike no puede seguir a spike/crash; crash no puede seguir a crash/spike
- Al expirar un régimen se selecciona uno nuevo por peso ponderado (excluyendo bloqueados)

### Estado Persistente
```typescript
// En GameState (persiste en AsyncStorage)
priceDeviation: number;          // rango -0.30 a +0.40
priceRegime: string;             // 'normal' | 'bull' | 'bear' | 'volatile' | 'spike' | 'crash'
priceRegimeTicksLeft: number;    // ticks restantes en régimen actual
```

### Transición de Era
Cuando `blocksMined` cruza un halving boundary (cambio de era), la desviación se recalcula para mantener continuidad de precio:
```
newDeviation = (oldPrice / newEraBasePrice) - 1
```
Clampeado a [-0.30, +0.40].

### Chart (últimos 30 puntos)
- Ventana deslizante de 30 puntos: cada 5 segundos entra 1 punto nuevo, sale el más viejo
- Inicialización: se ejecutan 30 ticks OU para poblar el chart al crear/cargar partida
- Título en UI: "Price Evolution"

### Configuración
Todos los parámetros están en `balanceConfig.ts` → `PRICE_ENGINE`:
- Parámetros OU: `THETA`, `SIGMA`, `CLAMP_MIN`, `CLAMP_MAX`
- Definiciones de regímenes: `REGIMES` (weight, minTicks, maxTicks, drift, sigma, theta)
- Reglas de bloqueo: `BLOCKED_TRANSITIONS`

## Estructura de Datos

### Cryptocurrency Interface
```typescript
interface Cryptocurrency {
  id: string;               // Identificador único
  name: string;             // Nombre legacy
  nameKey: string;          // Clave de traducción
  symbol: string;           // BTC, ETH, DOGE, etc.
  baseValue: number;        // Valor base en USD
  currentValue: number;     // Precio actual en USD
  volatility: number;       // Nivel de fluctuación (0-1)
  color: string;            // Color hex para UI
  icon: string;             // Icono
  apiId?: string;           // ID en CoinGecko API
  isNative?: boolean;       // true para CryptoCoin
}
```

### GameState (Campos Relevantes)
```typescript
interface GameState {
  cryptocurrencies: Cryptocurrency[];   // Lista de criptos disponibles
  selectedCurrency: string | null;      // Cripto actualmente seleccionada
  marketUpdateTime: number;             // Timestamp de última actualización
  realMoney: number;                    // Balance actual en $
  totalRealMoneyEarned: number;         // Total acumulado (para unlocks)
  currencyBalances: {                   // Balance por cripto (futuro)
    [currencyId: string]: number;
  };
  priceHistory?: {                      // Ventana deslizante de 30 puntos para charts
    [cryptoId: string]: {
      prices: number[];
      lastUpdate: number;
    };
  };
  priceDeviation: number;              // OU deviation from era base (-0.30 to +0.40)
  priceRegime: string;                 // Current market regime name
  priceRegimeTicksLeft: number;        // Ticks remaining in current regime
}
```

## Reglas de Negocio

1. **Solo se puede vender CryptoCoin nativo**: BTC, ETH, etc. son solo referencia cosmética de precio
2. **Los precios se actualizan cada 5 segundos**: Avanzando 1 punto en el historial local de BTC (`MARKET_CONFIG.UPDATE_INTERVAL = 5000ms`)
3. **Sin dependencia de red en runtime**: Todo el historial de precios es local
4. **No hay fees de transacción**: Por ahora, futura feature
5. **No se puede vender más de lo que se tiene**: Validación estricta
6. **El dinero real no se puede convertir de vuelta a CryptoCoins**: Solo va en una dirección
7. **Market se desbloquea con 10 bloques + 500 CC**: Ambas condiciones deben cumplirse (`UNLOCK_CONFIG.market`)
8. **Hardware tab se desbloquea con $150 earned**: No importa el balance actual, sino el total ganado (`UNLOCK_CONFIG.hardware.requiredMoney`)
9. **Los precios persisten offline**: Se guardan con el game state
10. **Validación de transacciones**: Solo se valida `isFinite(moneyEarned) && moneyEarned > 0`. No hay cap explícito de $100M.

## Desbloqueo Progresivo

### Market Tab Unlock
```typescript
// En balanceConfig.ts → UNLOCK_CONFIG.market
const UNLOCK_REQUIREMENTS = {
  MARKET_BLOCKS: 10,        // Bloques minados necesarios
  MARKET_COINS: 500,        // CryptoCoins necesarios
};

function shouldUnlockMarket(gameState: GameState): boolean {
  return gameState.blocksMined >= UNLOCK_REQUIREMENTS.MARKET_BLOCKS &&
         gameState.cryptoCoins >= UNLOCK_REQUIREMENTS.MARKET_COINS;
}
```

### Hardware Tab Unlock
```typescript
// En balanceConfig.ts → UNLOCK_CONFIG.hardware
const UNLOCK_REQUIREMENTS = {
  HARDWARE_MONEY: 150,      // $ total earned necesarios
};

function shouldUnlockHardware(gameState: GameState): boolean {
  return gameState.totalRealMoneyEarned >= UNLOCK_REQUIREMENTS.HARDWARE_MONEY;
}
```

## UI/UX Requirements

### MarketScreen Component
- [x] Lista de todas las criptomonedas disponibles
- [x] Cada fila de cripto muestra solo:
  - Avatar (gradiente dorado con ícono emoji)
  - Nombre y símbolo/ticker (ej: "CryptoCoin / CC · GENESIS CHAIN")
  - **No muestra precio ni badge % en la fila** — solo en el chart header al expandir
- [x] CryptoCoin section is always expanded (chart + sell controls always visible, not collapsible)
- [x] Other currencies expand/collapse on tap, showing chart + exchange section
- [x] Slider de porcentaje (1%–100%) para seleccionar cantidad a vender
- [x] Preview de earnings en USD antes de confirmar
- [x] Botón "Sell" con confirmación de 2 pasos (anti-accidental)

### Sell Confirmation
- [ ] Modal de confirmación antes de vender
- [ ] Muestra: "Sell X CC for $Y?"
- [ ] Botones: "Confirm" (verde) | "Cancel" (gris)
- [ ] Después de vender: Toast "✅ Sold X CC for $Y"

### Price Chart (PriceChart Component)
- [x] Gráfico de línea con historial de precios (últimos 30 minutos, 1 punto por minuto)
- [x] Header del chart muestra precio actual + badge de cambio % en la ventana de 30min
- [x] Precisión del precio en el header:
  - `>= $1000` → `$X.Xk`
  - `$100–$999` → `$X` (sin decimales)
  - `$1–$99.99` → `$X.XXXX` (4 decimales) — necesario para que los cambios minuto-a-minuto del dataset sean visibles
  - `$0.01–$0.99` → `$X.XXXX`
  - `< $0.01` → `$X.XXXXXX`
- [x] Punto animado en el extremo derecho indicando precio en tiempo real
- [x] Gradiente bajo la curva para visualizar tendencia
- [ ] Tooltips al tocar puntos del chart (pendiente)

### Unlock Notification
- [ ] Al desbloquear Market:
  - Modal explicativo o tutorial tooltip
  - Mensaje: "🔓 Market Unlocked! You can now sell CryptoCoins for real money ($). Use money to buy hardware and upgrades!"
  - Botón: "Got it"
  - Highlight del tab Market con animación

## Validaciones

### Pre-Sale Validations
- [ ] Verificar que amount > 0
- [ ] Verificar que amount <= cryptoCoins balance
- [ ] Verificar que price > 0 y sea finito
- [ ] Verificar que el valor calculado es finito y > 0
- [ ] Verificar que gameState no sea null

### Post-Sale Validations
- [ ] Verificar que cryptoCoins se redujo correctamente
- [ ] Verificar que realMoney aumentó correctamente
- [ ] Verificar que totalRealMoneyEarned aumentó
- [ ] Verificar que no haya overflow numérico
- [ ] Verificar que el Hardware tab se desbloqueó si corresponde

### API Response Validations
- [ ] Verificar que la respuesta de API sea válida JSON
- [ ] Verificar que los precios sean números positivos
- [ ] Verificar que no haya valores null o undefined
- [ ] Timeout de 10 segundos para la API call

## Dependencias

### Requiere
- `GameContext` - State management
- `balanceConfig.ts` → `PRICE_ENGINE` - Parámetros OU y regímenes
- `Block Mining System` - Para generar CryptoCoins y determinar era actual
- `src/utils/priceEngine.ts` - Motor de precios OU (tickOU, pickRegime, etc.)

### Bloquea
- `Hardware Tab` - Se desbloquea después de ganar $150
- `Upgrade System` - Muchos upgrades cuestan Real Money

### Relacionado con
- `Progressive Unlock System` - Market tab unlock
- `AsyncStorage` - Para persistir estado OU y ventana de precios

## Criterios de Aceptación

- [x] El jugador puede vender CryptoCoins por Real Money
- [x] Los precios se generan con proceso OU mean-reverting (sin API ni datasets en runtime)
- [x] El Market se desbloquea con 10 bloques + 500 CC
- [x] El Hardware tab se desbloquea con $150 earned
- [x] Los precios persisten entre sesiones
- [x] El juego funciona 100% offline
- [x] Se muestran charts de tendencias de precio (últimos 30 minutos)
- [x] Las transacciones tienen validaciones de seguridad
- [x] El estado del motor OU (deviation, régimen, ticksLeft) persiste entre sesiones
- [x] Las fluctuaciones de precio son visibles en el chart (~2.5% por tick)
- [x] Las notificaciones de unlock se muestran correctamente

## Notas de Implementación

### Archivos Principales
- `src/components/MarketScreen.tsx` - UI del Market
- `src/components/PriceChart.tsx` - Gráfico de precios
- `src/utils/priceEngine.ts` - Motor OU de precios (tickOU, regímenes, chart window)
- `src/config/balanceConfig.ts` → `PRICE_ENGINE` - Parámetros OU y regímenes
- `src/services/cryptoAPI.ts` - Integración con CoinGecko (BTC/ETH/DOGE/ADA cosméticos)
- `src/data/cryptocurrencies.ts` - Definición de criptos
- `src/contexts/GameContext.tsx` - Actions de venta y actualización (ADVANCE_PRICE_INDEX)

### CoinGecko API Integration
```typescript
// src/services/cryptoAPI.ts
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export async function fetchCryptoPrices(
  cryptocurrencies: Cryptocurrency[]
): Promise<Cryptocurrency[]> {
  const apiIds = cryptocurrencies
    .filter(c => c.apiId)
    .map(c => c.apiId)
    .join(',');

  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=${apiIds}&vs_currencies=usd`,
      { timeout: 10000 }
    );

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();

    return cryptocurrencies.map(crypto => {
      if (crypto.isNative) return crypto; // No actualizar CryptoCoin

      const apiPrice = data[crypto.apiId]?.usd;
      if (apiPrice && apiPrice > 0) {
        return { ...crypto, currentValue: apiPrice };
      }
      return crypto; // Mantener precio anterior si no hay data
    });
  } catch (error) {
    console.warn('CoinGecko API failed:', error);
    return cryptocurrencies; // Fallback: mantener precios actuales
  }
}
```

### Reducer Actions
```typescript
// SELL_COINS_FOR_MONEY
case 'SELL_COINS_FOR_MONEY':
  const coinsToSell = Math.min(action.payload.amount, state.cryptoCoins);
  if (coinsToSell <= 0) return state;

  if (!action.payload.price || action.payload.price <= 0 || !isFinite(action.payload.price)) {
    console.warn('Invalid price');
    return state;
  }

  const moneyEarned = coinsToSell * action.payload.price;

  if (!isFinite(moneyEarned) || moneyEarned <= 0) return state;

  return recalculateGameStats({
    ...state,
    cryptoCoins: state.cryptoCoins - coinsToSell,
    realMoney: state.realMoney + moneyEarned,
    totalRealMoneyEarned: state.totalRealMoneyEarned + moneyEarned,
  });

// UPDATE_CRYPTOCURRENCY_PRICES
case 'UPDATE_CRYPTOCURRENCY_PRICES':
  return {
    ...state,
    cryptocurrencies: action.payload,
    marketUpdateTime: Date.now(),
  };
```

## Testing

### Unit Tests
```typescript
describe('Market System', () => {
  describe('calculateSaleValue', () => {
    it('should calculate sale value correctly', () => {
      expect(calculateSaleValue(1000, 0.001)).toBe(1); // 1000 CC × $0.001 = $1
      expect(calculateSaleValue(50000, 0.002)).toBe(100);
    });

    it('should return 0 for invalid price', () => {
      expect(calculateSaleValue(1000, 0)).toBe(0);
      expect(calculateSaleValue(1000, -1)).toBe(0);
      expect(calculateSaleValue(1000, Infinity)).toBe(0);
    });

    it('should block suspiciously large transactions', () => {
      expect(calculateSaleValue(1000000000, 1000)).toBe(0); // $1 billion
    });
  });

  describe('shouldUpdatePrices', () => {
    it('should return true if 5 minutes passed', () => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      expect(shouldUpdatePrices(fiveMinutesAgo)).toBe(true);
    });

    it('should return false if less than 5 minutes', () => {
      const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
      expect(shouldUpdatePrices(twoMinutesAgo)).toBe(false);
    });
  });

  describe('fetchCryptoPrices', () => {
    it('should fetch prices from API', async () => {
      const cryptos = [
        { id: 'bitcoin', apiId: 'bitcoin', currentValue: 0 },
        { id: 'cryptocoin', isNative: true, currentValue: 0.001 },
      ];

      const updated = await fetchCryptoPrices(cryptos);

      expect(updated[0].currentValue).toBeGreaterThan(0); // BTC tiene precio real
      expect(updated[1].currentValue).toBe(0.001); // CC no cambia
    });

    it('should handle API failure gracefully', async () => {
      // Mock fetch to fail
      global.fetch = jest.fn(() => Promise.reject('Network error'));

      const cryptos = [{ id: 'bitcoin', apiId: 'bitcoin', currentValue: 50000 }];
      const updated = await fetchCryptoPrices(cryptos);

      expect(updated[0].currentValue).toBe(50000); // Mantiene precio anterior
    });
  });
});
```

### Integration Tests
```typescript
describe('Market Integration', () => {
  it('should sell coins and earn money', () => {
    const state = {
      cryptoCoins: 10000,
      realMoney: 0,
      totalRealMoneyEarned: 0,
    };

    const action = {
      type: 'SELL_COINS_FOR_MONEY',
      payload: { amount: 5000, price: 0.002 }
    };

    const newState = gameReducer(state, action);

    expect(newState.cryptoCoins).toBe(5000); // 10000 - 5000
    expect(newState.realMoney).toBe(10); // 5000 × 0.002
    expect(newState.totalRealMoneyEarned).toBe(10);
  });

  it('should unlock hardware tab after $150 earned', () => {
    let state = {
      cryptoCoins: 100000,
      realMoney: 0,
      totalRealMoneyEarned: 0,
      unlockedTabs: { hardware: false }
    };

    // Vender suficiente para ganar $150
    state = gameReducer(state, {
      type: 'SELL_COINS_FOR_MONEY',
      payload: { amount: 75000, price: 0.002 } // $150
    });

    expect(state.totalRealMoneyEarned).toBe(150);
    expect(state.unlockedTabs.hardware).toBe(true);
  });
});
```

### E2E Tests
```typescript
describe('Market E2E', () => {
  it('should complete full market flow', async () => {
    await launch();

    // Esperar a minar suficientes bloques
    await waitFor(element(by.id('blocks-mined')))
      .toHaveText('15')
      .withTimeout(30000);

    // Market debería estar desbloqueado
    await expect(element(by.id('market-tab'))).toBeVisible();
    await element(by.id('market-tab')).tap();

    // Vender coins
    await element(by.id('sell-amount-input')).typeText('1000');
    await element(by.id('sell-button')).tap();
    await element(by.id('confirm-sell')).tap();

    // Verificar que se acreditó el dinero
    await expect(element(by.id('real-money-balance'))).not.toHaveText('$0.00');
  });
});
```

## Performance Considerations

- **Sin dataset en memoria**: El motor OU genera precios on-the-fly (sin archivos de 1.6MB)
- **Chart rendering**: Usar react-native-chart-kit o Victory (optimizado)
- **Price updates**: No re-render innecesarios, usar React.memo
- **Storage**: Persistir `priceDeviation`, `priceRegime`, `priceRegimeTicksLeft`, y la ventana de 30 puntos del chart

## Analytics

```typescript
analytics().logEvent('market_unlocked', {
  blocks_mined: gameState.blocksMined,
  coins_earned: gameState.cryptoCoins,
  time_to_unlock: timeSinceStart,
});

analytics().logEvent('coins_sold', {
  amount: coinsToSell,
  price: currentPrice,
  money_earned: moneyEarned,
  total_money_earned: totalRealMoneyEarned,
});

analytics().logEvent('hardware_tab_unlocked', {
  total_money_earned: 200,
  time_to_unlock: timeSinceStart,
});
```

## Preguntas Abiertas

- [ ] **Fees de transacción**: ¿Cobrar 1% de fee al vender?
  - **Recomendación**: Sí, en Phase 3 (añade realismo)

- [ ] **Vender otras criptos**: ¿Permitir minar y vender BTC, ETH?
  - **Recomendación**: Phase 5 (expande gameplay significativamente)

- [ ] **Precio offline**: ¿Simular fluctuaciones mientras app está cerrada?
  - **Recomendación**: No, mantener precio congelado offline

- [ ] **Límites de venta**: ¿Max amount por transacción o por día?
  - **Recomendación**: No, pero mantener límite anti-bug de $100M

## Referencias

- CoinGecko API Docs: https://www.coingecko.com/en/api/documentation
- React Native Chart Kit: https://github.com/indiespirit/react-native-chart-kit
- Incremental game economy design: https://www.gamasutra.com/blogs/
