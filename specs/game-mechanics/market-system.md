# Market System

## Estado
- **Fase**: Phase 2 - Expansion (Implemented)
- **Estado**: Implemented & Active
- **Prioridad**: High (Monetization Bridge)
- **Última actualización**: 2026-02-21

## Descripción

El Market System permite a los jugadores convertir CryptoCoins en Real Money ($) mediante la venta en un mercado simulado. Los precios de las criptomonedas fluctúan basándose en datos reales obtenidos de CoinGecko API. El dinero real ($) se usa para comprar hardware avanzado y upgrades, creando un loop económico: CryptoCoins → Real Money → Hardware → Más CryptoCoins.

El sistema incluye múltiples criptomonedas (Bitcoin, Ethereum, Dogecoin, Cardano) además del CryptoCoin nativo, cada una con su propia volatilidad y valor de mercado.

## Objetivos
- [x] Crear un puente económico entre progresión gratuita y monetización
- [x] Simular un mercado de criptomonedas realista
- [x] Usar precios reales de API cuando hay conectividad
- [x] Implementar fallback a precios simulados sin conectividad (futuro)
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
- Se verifica si se desbloqueó el Hardware tab ($200 threshold)

### Caso de Uso 2: Actualización de Precios desde API
**Dado que** el usuario tiene conectividad a internet
**Cuando** abre el Market o pasan 5 minutos desde la última actualización
**Entonces**
- Se llama a CoinGecko API para obtener precios actuales
- Se actualizan los valores de `currentValue` para cada criptomoneda
- Se guarda el timestamp de la actualización
- Se actualiza el historial de precios para los charts
- Si la API falla, se mantienen los precios anteriores
- Se muestra "Last updated: X seconds ago"

### Caso de Uso 3: Ver Detalles de Criptomoneda
**Dado que** el jugador abre la lista de criptomonedas en el Market
**Cuando** selecciona una criptomoneda
**Entonces**
- Se muestra el nombre y símbolo (ej: Bitcoin - BTC)
- Se muestra el precio actual en USD
- Se muestra el cambio de precio en 24h (%) - si disponible
- Se muestra un chart de precios históricos
- Se muestra el balance del jugador en esa cripto (si tiene)
- Se muestra un botón "Sell" para vender

### Caso de Uso 4: Desbloqueo del Market
**Dado que** el jugador está en fase inicial del juego
**Cuando** mina 15 bloques Y acumula 1000 CryptoCoins
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
  isNative: true           // No usa API, precio simulado
}
```
**Propósito**: Moneda principal del juego, siempre disponible

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

  // Límite de seguridad para prevenir bugs
  if (value > 100000000) { // $100M
    console.warn('Suspiciously large transaction:', value);
    return 0;
  }

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
  const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos

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
  priceHistory?: {                      // Historial para charts
    [cryptoId: string]: {
      prices: number[];
      lastUpdate: number;
    };
  };
}
```

## Reglas de Negocio

1. **Solo se puede vender CryptoCoin nativo**: Actualmente no se pueden vender BTC, ETH, etc. (son solo referencia de precio)
2. **Los precios se actualizan cada 5 minutos**: No más frecuente para respetar límites de API
3. **La API puede fallar**: Se mantienen precios anteriores si falla
4. **No hay fees de transacción**: Por ahora, futura feature
5. **No se puede vender más de lo que se tiene**: Validación estricta
6. **El dinero real no se puede convertir de vuelta a CryptoCoins**: Solo va en una dirección
7. **Market se desbloquea con 15 bloques + 1000 CC**: Ambas condiciones deben cumplirse
8. **Hardware tab se desbloquea con $200 earned**: No importa el balance actual, sino el total ganado
9. **Los precios persisten offline**: Se guardan con el game state
10. **Transacciones muy grandes son bloqueadas**: Límite de $100M para prevenir bugs. Indicar con un mensaje al usuario para que pueda vender un monto menor.

## Desbloqueo Progresivo

### Market Tab Unlock
```typescript
const UNLOCK_REQUIREMENTS = {
  MARKET_BLOCKS: 15,        // Bloques minados necesarios
  MARKET_COINS: 1000,       // CryptoCoins necesarios
};

function shouldUnlockMarket(gameState: GameState): boolean {
  return gameState.blocksMined >= UNLOCK_REQUIREMENTS.MARKET_BLOCKS &&
         gameState.cryptoCoins >= UNLOCK_REQUIREMENTS.MARKET_COINS;
}
```

### Hardware Tab Unlock
```typescript
const UNLOCK_REQUIREMENTS = {
  HARDWARE_MONEY: 200,      // $ total earned necesarios
};

function shouldUnlockHardware(gameState: GameState): boolean {
  return gameState.totalRealMoneyEarned >= UNLOCK_REQUIREMENTS.HARDWARE_MONEY;
}
```

## UI/UX Requirements

### MarketScreen Component
- [ ] Lista de todas las criptomonedas disponibles
- [ ] Cada cripto muestra:
  - Icono con color específico
  - Nombre y símbolo (ej: "Bitcoin (BTC)")
  - Precio actual en USD
  - Cambio 24h (%) si disponible
  - Mini chart de tendencia (opcional)
- [ ] "Last updated: X seconds ago" en el footer
- [ ] Botón de refresh manual
- [ ] Input para cantidad a vender (solo para CryptoCoin)
- [ ] Botón "Sell" prominente
- [ ] Balance actual de Real Money: "$X.XX"

### Sell Confirmation
- [ ] Modal de confirmación antes de vender
- [ ] Muestra: "Sell X CC for $Y?"
- [ ] Botones: "Confirm" (verde) | "Cancel" (gris)
- [ ] Después de vender: Toast "✅ Sold X CC for $Y"

### Price Chart (PriceChart Component)
- [ ] Gráfico de línea con historial de precios
- [ ] Eje X: Tiempo (últimas 24h o 7 días)
- [ ] Eje Y: Precio en USD
- [ ] Color de línea: Color de la cripto
- [ ] Tooltips al tocar puntos del chart
- [ ] Smoothing para que no se vea muy abrupto

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
- [ ] Verificar que el valor calculado < $100M (límite de seguridad)
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
- `balanceConfig.ts` - Valores base de criptos
- `Block Mining System` - Para generar CryptoCoins
- `CoinGecko API` - Para precios reales

### Bloquea
- `Hardware Tab` - Se desbloquea después de ganar $200
- `Upgrade System` - Muchos upgrades cuestan Real Money

### Relacionado con
- `Progressive Unlock System` - Market tab unlock
- `Price History Service` - Para charts
- `AsyncStorage` - Para persistir precios offline

## Criterios de Aceptación

- [x] El jugador puede vender CryptoCoins por Real Money
- [x] Los precios se actualizan desde CoinGecko API
- [x] El Market se desbloquea con 15 bloques + 1000 CC
- [x] El Hardware tab se desbloquea con $200 earned
- [x] Los precios persisten entre sesiones
- [x] La API tiene fallback si no hay conectividad (mantiene precios anteriores)
- [x] Se muestran charts de tendencias de precio
- [x] Las transacciones tienen validaciones de seguridad
- [x] La UI muestra "Last updated" timestamp
- [x] Las notificaciones de unlock se muestran correctamente

## Notas de Implementación

### Archivos Principales
- `src/components/MarketScreen.tsx` - UI del Market
- `src/components/PriceChart.tsx` - Gráfico de precios
- `src/services/cryptoAPI.ts` - Integración con CoinGecko
- `src/services/priceHistoryService.ts` - Historial de precios
- `src/data/cryptocurrencies.ts` - Definición de criptos
- `src/contexts/GameContext.tsx` - Actions de venta y actualización

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

  if (moneyEarned > 100000000) {
    console.warn('Suspiciously large transaction');
    return state;
  }

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

  it('should unlock hardware tab after $200 earned', () => {
    let state = {
      cryptoCoins: 100000,
      realMoney: 0,
      totalRealMoneyEarned: 0,
      unlockedTabs: { hardware: false }
    };

    // Vender suficiente para ganar $200
    state = gameReducer(state, {
      type: 'SELL_COINS_FOR_MONEY',
      payload: { amount: 100000, price: 0.002 } // $200
    });

    expect(state.totalRealMoneyEarned).toBe(200);
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

- **API calls**: Máximo 1 cada 5 minutos
- **Chart rendering**: Usar react-native-chart-kit o Victory (optimizado)
- **Price updates**: No re-render innecesarios, usar React.memo
- **Storage**: Guardar solo últimos 100 price points (no todo el historial)

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
