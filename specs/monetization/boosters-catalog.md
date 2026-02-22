# Boosters and Starter Packs Catalog

## Estado
- **Fase**: Phase 1 - Genesis (Designed, Not Implemented)
- **Estado**: Specification Complete
- **Prioridad**: Medium (Optional Monetization)
- **Última actualización**: 2026-02-21

## Descripción

El catálogo de Boosters y Starter Packs proporciona opciones de monetización opcionales que aceleran la progresión del jugador sin romper el balance del juego. Todos los productos son completamente opcionales - el juego es 100% completable sin gastar dinero.

**Boosters (Consumables):**
- 2x Production Booster ($0.99) - 2x producción por 4 horas, consumable
- 5x Production Booster ($2.99) - 5x producción por 24 horas, consumable
- Permanent 2x Multiplier ($9.99) - 2x producción permanente, non-consumable

**Starter Packs (One-Time):**
- Small Pack ($0.99) - 10K CryptoCoins + $500, one-time
- Medium Pack ($2.99) - 50K CryptoCoins + $2.5K, one-time
- Large Pack ($4.99) - 150K CryptoCoins + $10K, one-time
- Mega Pack ($9.99) - 500K CryptoCoins + $50K, one-time

Todos los boosters stackean multiplicativamente con prestige y rewarded ad boosts. Los starter packs otorgan AMBOS coins y money (no solo dinero), dando flexibilidad al jugador.

## Objetivos
- [ ] Implementar 3 tipos de production boosters (2x, 5x, permanent)
- [ ] Implementar 4 starter packs con recursos balanceados
- [ ] Asegurar que boosters stackean correctamente con otros multipliers
- [ ] Implementar timers de duración para boosters temporales
- [ ] Prevenir stacking de boosters del mismo tipo (reemplazan, no suman)
- [ ] Implementar one-time restrictions para starter packs
- [ ] Mostrar indicadores visuales de boosters activos
- [ ] Balancear precios para value proposition claro
- [ ] Trackear purchases y conversión en Analytics

## Comportamiento Esperado

### PRODUCTION BOOSTERS

### Caso de Uso 1: Ver Boosters en Store
**Dado que** el usuario abre la tienda de IAP
**Cuando** navega a la sección "Boosters"
**Entonces**
- Se muestran 3 cards de boosters:

  **2x Production Booster:**
  - Icono: Lightning bolt dorado
  - Título: "2x Production Booster"
  - Descripción: "Double your production for 4 hours"
  - Beneficio highlight: "Great for quick progress!"
  - Precio: "$0.99"
  - Botón: "Buy" (verde)
  - Si activo: Badge "Active: 2:45:12" (timer)

  **5x Production Booster:**
  - Icono: Lightning bolt violeta (más intenso)
  - Título: "5x Production Booster"
  - Descripción: "5x production for 24 hours"
  - Beneficio highlight: "Best for overnight progress!"
  - Badge: "Best Value" (destacado)
  - Precio: "$2.99"
  - Botón: "Buy" (verde)
  - Si activo: Badge "Active: 18:32:45" (timer)

  **Permanent 2x Multiplier:**
  - Icono: Infinity symbol + lightning (arco iris)
  - Título: "Permanent 2x Multiplier"
  - Descripción: "PERMANENTLY double your production"
  - Beneficio highlight: "Forever boost - best long-term value!"
  - Precio: "$9.99"
  - Botón: "Buy" (verde/dorado)
  - Si comprado: Badge "Active Forever" (verde)

### Caso de Uso 2: Comprar 2x Booster (Sin Booster Activo)
**Dado que** el usuario NO tiene ningún booster activo
**Cuando** presiona "Buy 2x Booster"
**Entonces**
- Mostrar confirmation dialog:
  - Título: "2x Production Booster"
  - Descripción:
    - "Double your production for 4 hours"
    - "Stacks with prestige and ad boosts"
    - "Timer pauses when app is closed (active time only)"
  - Precio: "$0.99"
  - Botones: "Cancel" | "Purchase"
- Si selecciona Purchase:
  - Procesar compra (IAP flow)
  - Al completar exitosamente:
    - Aplicar boost:
      - `booster2x.isActive = true`
      - `booster2x.activatedAt = Date.now()`
      - `booster2x.expiresAt = Date.now() + 4h`
    - Producción se multiplica por 2 inmediatamente
    - Mostrar success notification:
      - "2x Boost Activated!"
      - "Your production is doubled for 4 hours"
    - Top bar muestra badge:
      - "2x" con timer "3:59:58"
      - Color: Dorado
      - Animación: Glow pulsante
    - Guardar en purchase history (consumable)
    - Finalizar transacción
    - Log Analytics: `booster_2x_purchased`

### Caso de Uso 3: Comprar 2x Booster (Ya Tiene 2x Activo)
**Dado que** el usuario YA tiene 2x booster activo (1:30:00 restante)
**Cuando** intenta comprar otro 2x booster
**Entonces**
- Mostrar warning dialog:
  - Título: "Booster Already Active"
  - Descripción:
    - "You already have a 2x boost active (1:30:00 remaining)"
    - "Buying another will RESET the timer to 4 hours, not add to it"
    - "Are you sure you want to continue?"
  - Botones: "Cancel" | "Buy Anyway"
- Si selecciona Cancel: cerrar dialog, no procesar
- Si selecciona Buy Anyway:
  - Procesar compra normalmente
  - Al completar:
    - RESETEAR timer a 4 horas (no sumar):
      - `booster2x.activatedAt = Date.now()`
      - `booster2x.expiresAt = Date.now() + 4h`
    - Mostrar: "Boost refreshed! 4 hours remaining"
    - Log Analytics: `booster_2x_refreshed`

### Caso de Uso 4: Comprar 5x Booster (Ya Tiene 2x Activo)
**Dado que** el usuario tiene 2x booster activo
**Cuando** compra 5x booster
**Entonces**
- Mostrar confirmation (estándar)
- Al completar compra:
  - DESACTIVAR 2x booster:
    - `booster2x.isActive = false`
    - `booster2x.activatedAt = null`
    - `booster2x.expiresAt = null`
  - ACTIVAR 5x booster:
    - `booster5x.isActive = true`
    - `booster5x.activatedAt = Date.now()`
    - `booster5x.expiresAt = Date.now() + 24h`
  - Producción cambia de 2x a 5x inmediatamente
  - Mostrar: "5x Boost Activated! (24 hours)"
  - Top bar badge cambia:
    - "5x" con timer "23:59:58"
    - Color: Violeta
  - Log Analytics: `booster_5x_purchased`, `booster_2x_replaced`

### Caso de Uso 5: Booster Activo Durante Gameplay
**Dado que** el usuario tiene 5x booster activo
**Cuando** está jugando
**Entonces**
- Producción total se calcula con multipliers:
  ```
  baseProduction = 1000 CC/s
  prestigeMultiplier = 1.5x
  permanentMultiplier = 1.0x (no comprado)
  temporaryBooster = 5.0x (5x activo)
  adBoost = 1.0x (no activo)

  finalProduction = 1000 × 1.5 × 1.0 × 5.0 × 1.0 = 7,500 CC/s
  ```
- UI muestra badge en top bar:
  - "5x Boost: 18:32:45" (timer countdown)
  - Timer actualiza cada segundo
  - Color violeta con glow
- Al tocar badge:
  - Mostrar modal con detalles:
    - "5x Production Boost Active"
    - "Time remaining: 18:32:45"
    - "Your production is multiplied by 5!"
    - Progress bar visual del tiempo
    - Botón: "Buy Another" (opcional)

### Caso de Uso 6: Booster Expira Durante Gameplay
**Dado que** el usuario tiene 2x booster activo con 5 segundos restantes
**Cuando** el timer llega a 0
**Entonces**
- Booster se desactiva automáticamente:
  - `booster2x.isActive = false`
  - `booster2x.activatedAt = null`
  - `booster2x.expiresAt = null`
- Producción vuelve a normal (sin el 2x)
- Mostrar notificación:
  - "2x Boost Expired!"
  - "Buy another to keep boosting"
  - Botón: "Buy Again" (link a store)
- Badge en top bar desaparece con animación fade-out
- Log Analytics: `booster_2x_expired`

### Caso de Uso 7: App Cerrada con Booster Activo
**Dado que** el usuario tiene 5x booster activo (12 horas restantes)
**Cuando** cierra la app por 6 horas y la reabre
**Entonces**
- Al reabrir app:
  - Calcular tiempo offline: 6 horas
  - Verificar si booster sigue activo:
    - `Date.now() - booster5x.activatedAt = 18 horas`
    - `24 horas - 18 horas = 6 horas restantes` ✓ Sigue activo
  - Aplicar boost a producción offline:
    - Offline earnings calculados con 5x boost
    - Mostrar: "Earned X CC while away (with 5x boost!)"
  - Badge actualizado con tiempo correcto:
    - "5x Boost: 6:00:00"
  - Continuar countdown normalmente

### Caso de Uso 8: Booster Expira Durante Offline
**Dado que** el usuario tiene 2x booster activo (2 horas restantes)
**Cuando** cierra la app por 4 horas y la reabre
**Entonces**
- Al reabrir app:
  - Calcular que booster expiró hace 2 horas:
    - Primera 2h: producción con 2x boost
    - Últimas 2h: producción sin boost
  - Calcular offline earnings:
    - `earnings = (2h × baseProduction × 2.0) + (2h × baseProduction × 1.0)`
  - Mostrar notificación:
    - "Earned X CC while away"
    - "Your 2x boost expired while you were away"
  - Booster marcado como inactivo
  - Badge no se muestra

### Caso de Uso 9: Comprar Permanent 2x Multiplier
**Dado que** el usuario nunca compró permanent multiplier
**Cuando** presiona "Buy Permanent 2x"
**Entonces**
- Mostrar confirmation dialog especial:
  - Título: "Permanent 2x Multiplier"
  - Descripción:
    - "⚠️ PERMANENT BOOST - NEVER EXPIRES"
    - "Double your production forever"
    - "Stacks with ALL other boosts"
    - "Best long-term investment"
  - Precio: "$9.99" (grande, destacado)
  - Warning: "This is a one-time purchase" (bold)
  - Botones: "Cancel" | "Purchase"
- Si selecciona Purchase:
  - Procesar compra (IAP flow, non-consumable)
  - Al completar:
    - Marcar como comprado:
      - `permanentMultiplierPurchased = true`
      - `permanentMultiplier = 2.0`
    - Producción se multiplica por 2 permanentemente
    - Mostrar celebration dialog:
      - Animación de confetti
      - "Permanent 2x Multiplier Activated!"
      - "Your production is now doubled FOREVER"
      - "This boost stacks with everything else"
    - Top bar muestra badge permanente:
      - "2x Permanent" (sin timer)
      - Color: Arco iris/dorado
      - Icono: Infinity symbol
    - Store card actualizado:
      - Badge: "Purchased"
      - Botón: "Purchased" (deshabilitado)
    - Log Analytics: `permanent_multiplier_purchased`

### Caso de Uso 10: Permanent Multiplier + Temporary Boosters
**Dado que** el usuario tiene permanent 2x multiplier
**Cuando** compra 5x temporary booster
**Entonces**
- Ambos boosters se aplican multiplicativamente:
  ```
  baseProduction = 1000 CC/s
  prestigeMultiplier = 1.5x
  permanentMultiplier = 2.0x (permanent IAP)
  temporaryBooster = 5.0x (5x booster)
  adBoost = 2.0x (rewarded ad activo)

  finalProduction = 1000 × 1.5 × 2.0 × 5.0 × 2.0 = 30,000 CC/s
  ```
- UI muestra AMBOS badges:
  - "2x Permanent" (arco iris, sin timer)
  - "5x Boost: 23:59:58" (violeta, con timer)
  - "2x Ad Boost: 3:45:00" (dorado, con timer)
- Producción display muestra:
  - "Production: 30,000 CC/s"
  - Tooltip: "Base × Prestige (1.5x) × Permanent (2x) × 5x Boost × Ad Boost (2x)"

### STARTER PACKS

### Caso de Uso 11: Ver Starter Packs en Store
**Dado que** el usuario abre la sección "Starter Packs"
**Cuando** la pantalla carga
**Entonces**
- Se muestran 4 cards en grid (2×2):

  **Small Pack:**
  - Icono: Bronze chest
  - Título: "Small Starter Pack"
  - Recursos:
    - "10,000 CryptoCoins"
    - "$500 Real Money"
    - Iconos de CC y $
  - Precio: "$0.99"
  - Botón: "Buy"
  - Si comprado: Badge "Owned" (gris)

  **Medium Pack:**
  - Icono: Silver chest
  - Título: "Medium Starter Pack"
  - Badge: "Most Popular"
  - Recursos:
    - "50,000 CryptoCoins"
    - "$2,500 Real Money"
  - Precio: "$2.99"
  - Botón: "Buy"

  **Large Pack:**
  - Icono: Gold chest
  - Título: "Large Starter Pack"
  - Recursos:
    - "150,000 CryptoCoins"
    - "$10,000 Real Money"
  - Precio: "$4.99"
  - Botón: "Buy"

  **Mega Pack:**
  - Icono: Diamond/Rainbow chest
  - Título: "Mega Starter Pack"
  - Badge: "Best Value" (destacado)
  - Recursos:
    - "500,000 CryptoCoins"
    - "$50,000 Real Money"
  - Precio: "$9.99"
  - Value highlight: "5x more than Medium Pack!"
  - Botón: "Buy"

### Caso de Uso 12: Comprar Small Starter Pack (Primera Vez)
**Dado que** el usuario NO ha comprado Small Pack
**Cuando** presiona "Buy Small Pack"
**Entonces**
- Mostrar confirmation dialog:
  - Título: "Small Starter Pack"
  - Recursos que recibirá:
    - "✓ 10,000 CryptoCoins"
    - "✓ $500 Real Money"
  - Precio: "$0.99"
  - Warning: "⚠️ Can only be purchased ONCE"
  - Botones: "Cancel" | "Purchase"
- Si selecciona Purchase:
  - Procesar compra (IAP flow, one-time)
  - Al completar:
    - Otorgar recursos INMEDIATAMENTE:
      - `cryptoCoins += 10000`
      - `realMoney += 500`
    - Marcar pack como comprado:
      - `starterPacksPurchased.small = true`
    - Mostrar success dialog:
      - "Resources Received!"
      - "✓ 10,000 CryptoCoins"
      - "✓ $500 Real Money"
      - Animación de coins/money cayendo
    - UI actualiza balances con animación:
      - CryptoCoins: 5,000 → 15,000 (animación count-up)
      - Real Money: $100 → $600 (animación count-up)
    - Store card actualizado:
      - Badge: "Owned"
      - Botón: "Owned" (gris, deshabilitado)
    - Guardar en purchase history
    - Finalizar transacción
    - Log Analytics: `starter_pack_purchased` con pack: `small`

### Caso de Uso 13: Intentar Comprar Small Pack (Ya Comprado)
**Dado que** el usuario YA compró Small Pack
**Cuando** intenta comprarlo de nuevo
**Entonces**
- Botón está deshabilitado:
  - Background gris
  - Texto: "Owned"
  - Badge: "Owned"
- Si de alguna forma intenta comprarlo:
  - Mostrar dialog: "You already purchased this pack"
  - "Each starter pack can only be purchased once"
  - Botón: "OK"
  - NO procesar compra
  - Log Analytics: `starter_pack_already_owned`

### Caso de Uso 14: Comprar Múltiples Starter Packs
**Dado que** el usuario quiere varios packs
**Cuando** compra Small, Medium, y Large en secuencia
**Entonces**
- Cada pack se compra independientemente:
  - Small: +10K CC, +$500
  - Medium: +50K CC, +$2.5K
  - Large: +150K CC, +$10K
- Recursos se suman:
  - Total: +210K CC, +$13K
- Cada pack se marca como purchased individualmente
- Solo Mega Pack queda disponible para comprar
- UI muestra progresión:
  - "Packs Owned: 3/4"
  - Solo Mega Pack tiene botón "Buy"

### Caso de Uso 15: Value Comparison (Mega vs Others)
**Dado que** el usuario está decidiendo qué pack comprar
**Cuando** compara los packs
**Entonces**
- Value por dólar:
  - Small: 10K CC + $500 = ~$0.99 value per $0.99 (1x)
  - Medium: 50K CC + $2.5K = ~$2.99 value per $2.99 (1x)
  - Large: 150K CC + $10K = ~$4.99 value per $4.99 (1x)
  - Mega: 500K CC + $50K = ~$16+ value per $9.99 (1.6x)
- Mega Pack es "Best Value":
  - Badge destacado
  - Tooltip: "Most coins and money per dollar!"
- UI puede mostrar comparison chart (opcional):
  - Barras comparando CC received
  - Highlight en Mega Pack

### Caso de Uso 16: Starter Pack en Early Game
**Dado que** el usuario está en early game (0-2 horas jugadas)
**Cuando** compra Small Pack
**Entonces**
- Recursos recibidos (10K CC + $500) son MUY significativos:
  - Puede comprar inmediatamente:
    - ~20 Basic CPUs
    - O 5 Advanced CPUs
    - O 1 Basic GPU
  - Acelera progresión inicial en ~2-3 horas
- Mostrar tip opcional:
  - "Use CryptoCoins to buy hardware"
  - "Use Real Money to unlock advanced features"
- Log Analytics: `starter_pack_early_game` con playtime

### Caso de Uso 17: Starter Pack en Late Game
**Dado que** el usuario está en late game (10+ horas, cerca de prestige)
**Cuando** compra Mega Pack
**Entonces**
- Recursos recibidos (500K CC + $50K) son menos impactantes:
  - Puede comprar:
    - ~2-3 ASIC Gen 3
    - Algunos upgrades finales
  - Acelera progresión final en ~1-2 horas
- Still valuable pero menos game-changing que en early
- Log Analytics: `starter_pack_late_game` con blocks_mined

### Caso de Uso 18: Restore Purchases (Starter Packs)
**Dado que** el usuario reinstala app después de comprar packs
**Cuando** hace Restore Purchases
**Entonces**
- Sistema verifica compras previas
- Para cada starter pack comprado:
  - Marca como purchased: `starterPacksPurchased.X = true`
  - Botón cambia a "Owned"
  - Badge "Owned" aparece
- IMPORTANTE: NO vuelve a otorgar recursos:
  - Los recursos ya fueron usados en sesión anterior
  - Solo se restaura el "flag" de purchased
  - Previene que compre de nuevo
- Mostrar: "Purchases restored (packs already redeemed)"

### Caso de Uso 19: Todos los Boosters y Packs Activos
**Dado que** el usuario compró todo
**Cuando** tiene todos los boosts activos
**Entonces**
- Producción total (ejemplo):
  ```
  baseProduction = 1000 CC/s
  prestigeMultiplier = 2.0x (prestige level 10)
  permanentMultiplier = 2.0x (permanent IAP)
  temporaryBooster = 5.0x (5x booster)
  adBoost = 2.0x (rewarded ad)

  finalProduction = 1000 × 2.0 × 2.0 × 5.0 × 2.0 = 40,000 CC/s
  ```
- UI muestra TODOS los badges:
  - "2x Permanent" (arco iris)
  - "5x Boost: 18:30:00" (violeta)
  - "2x Ad: 2:15:00" (dorado)
- Stats screen muestra:
  - "Total Spent: $25.94" (si compró todo)
  - "Active Boosts: 3"
  - "Starter Packs Owned: 4/4"

## Fórmulas y Cálculos

### Multiplicadores de Boosters
```typescript
function calculateTotalProductionWithAllBoosts(gameState: GameState): number {
  const base = calculateBaseProduction(gameState);
  const prestige = gameState.prestigeProductionMultiplier;
  const permanent = gameState.iapState.permanentMultiplierPurchased ? 2.0 : 1.0;
  const temporary = calculateActiveTemporaryBooster(gameState);
  const ad = calculateRewardedAdBoost(gameState);

  return base * prestige * permanent * temporary * ad;
}

function calculateActiveTemporaryBooster(gameState: GameState): number {
  const now = Date.now();

  // Verificar 5x booster (prioridad)
  if (gameState.iapState.booster5x.isActive) {
    const duration = 24 * 60 * 60 * 1000;
    const elapsed = now - gameState.iapState.booster5x.activatedAt;
    if (elapsed < duration) {
      return 5.0;
    }
  }

  // Verificar 2x booster
  if (gameState.iapState.booster2x.isActive) {
    const duration = 4 * 60 * 60 * 1000;
    const elapsed = now - gameState.iapState.booster2x.activatedAt;
    if (elapsed < duration) {
      return 2.0;
    }
  }

  return 1.0; // Sin booster temporal
}
```

### Value Analysis de Starter Packs
```typescript
function calculatePackValue(pack: 'small' | 'medium' | 'large' | 'mega'): {
  coinsValue: number;
  moneyValue: number;
  totalValue: number;
  valuePerDollar: number;
} {
  const rewards = IAP_CONFIG.starterPackRewards[pack];
  const price = IAP_CONFIG.prices[`starter${capitalize(pack)}`];

  // Estimar valor de coins (usando precio de mercado)
  const coinsValue = rewards.cryptoCoins * 0.001; // $0.001 per CC

  // Money es valor directo
  const moneyValue = rewards.realMoney;

  const totalValue = coinsValue + moneyValue;
  const valuePerDollar = totalValue / price;

  return { coinsValue, moneyValue, totalValue, valuePerDollar };
}

// Small: 10K CC ($10) + $500 = $510 / $0.99 = 515x
// Medium: 50K CC ($50) + $2.5K = $2,550 / $2.99 = 853x
// Large: 150K CC ($150) + $10K = $10,150 / $4.99 = 2,034x
// Mega: 500K CC ($500) + $50K = $50,500 / $9.99 = 5,055x
// → Mega Pack tiene MUCHO mejor value (incentiva big purchase)
```

## Constantes de Configuración

En `src/config/iapConfig.ts`:

```typescript
export const BOOSTER_CONFIG = {
  // 2x Production Booster
  booster2x: {
    productId: 'com.blockchaintycoon.booster2x',
    price: 0.99,
    multiplier: 2.0,
    duration: 4 * 60 * 60, // 4 horas en segundos
    type: 'consumable',
  },

  // 5x Production Booster
  booster5x: {
    productId: 'com.blockchaintycoon.booster5x',
    price: 2.99,
    multiplier: 5.0,
    duration: 24 * 60 * 60, // 24 horas en segundos
    type: 'consumable',
    badge: 'Best Value',
  },

  // Permanent 2x Multiplier
  permanentMultiplier: {
    productId: 'com.blockchaintycoon.permanent2x',
    price: 9.99,
    multiplier: 2.0,
    duration: Infinity, // Permanente
    type: 'non-consumable',
  },
};

export const STARTER_PACK_CONFIG = {
  small: {
    productId: 'com.blockchaintycoon.starter_small',
    price: 0.99,
    rewards: {
      cryptoCoins: 10000,
      realMoney: 500,
    },
    type: 'one-time',
    icon: 'bronze-chest',
  },

  medium: {
    productId: 'com.blockchaintycoon.starter_medium',
    price: 2.99,
    rewards: {
      cryptoCoins: 50000,
      realMoney: 2500,
    },
    type: 'one-time',
    icon: 'silver-chest',
    badge: 'Most Popular',
  },

  large: {
    productId: 'com.blockchaintycoon.starter_large',
    price: 4.99,
    rewards: {
      cryptoCoins: 150000,
      realMoney: 10000,
    },
    type: 'one-time',
    icon: 'gold-chest',
  },

  mega: {
    productId: 'com.blockchaintycoon.starter_mega',
    price: 9.99,
    rewards: {
      cryptoCoins: 500000,
      realMoney: 50000,
    },
    type: 'one-time',
    icon: 'diamond-chest',
    badge: 'Best Value',
  },
};
```

## Estructura de Datos

### Booster State (GameState)
```typescript
interface GameState {
  iapState: {
    // Permanent Multiplier
    permanentMultiplierPurchased: boolean;

    // Temporary Boosters (consumable, con timers)
    booster2x: {
      isActive: boolean;
      activatedAt: number | null;
      expiresAt: number | null;
    };
    booster5x: {
      isActive: boolean;
      activatedAt: number | null;
      expiresAt: number | null;
    };

    // Starter Packs (one-time, flags only)
    starterPacksPurchased: {
      small: boolean;
      medium: boolean;
      large: boolean;
      mega: boolean;
    };

    // Purchase history (includes all consumable purchases)
    purchaseHistory: PurchaseRecord[];
  };
}
```

## Reglas de Negocio

1. **Boosters temporales NO stackean entre sí**: 5x reemplaza 2x, no se suman
2. **Boosters SÍ stackean con otros multipliers**: Permanent × Prestige × Ad × Temporary
3. **Permanent Multiplier es non-consumable**: Solo se puede comprar una vez
4. **Starter Packs son one-time**: Cada pack solo se puede comprar UNA VEZ
5. **Comprar booster mientras activo resetea timer**: No suma, reemplaza
6. **Booster timer pausa durante offline**: Solo cuenta tiempo activo (discutible)
7. **Starter packs otorgan AMBOS coins y money**: No solo dinero
8. **Restore Purchases NO re-otorga starter pack resources**: Solo restaura flag
9. **Mega Pack tiene mejor value**: Incentiva bigger purchase
10. **Boosters consumables se pueden comprar ilimitadamente**: No hay límite

## UI/UX Requirements

### Booster Cards
- [ ] Icono distintivo por tipo:
  - 2x: Lightning dorado
  - 5x: Lightning violeta
  - Permanent: Infinity arco iris
- [ ] Timer visible si activo
- [ ] Badge "Best Value" en 5x
- [ ] Progress bar de tiempo (opcional)
- [ ] Botón CTA: "Buy" o "Active: X:XX:XX"

### Starter Pack Cards
- [ ] Grid layout (2×2)
- [ ] Chest icons (bronze/silver/gold/diamond)
- [ ] Recursos destacados con iconos
- [ ] Badge "Most Popular" en Medium
- [ ] Badge "Best Value" en Mega
- [ ] Si owned: Badge "Owned", botón deshabilitado

### Active Booster Indicators (Top Bar)
- [ ] Badges múltiples si varios activos
- [ ] Colores distintos por tipo
- [ ] Timers en tiempo real
- [ ] Al tocar: Modal con detalles

## Validaciones

Similares a IAP System spec (purchase validations, receipt validation, etc.)

## Dependencias

- `react-native-iap`
- `GameContext`
- `AsyncStorage`
- `Firebase Analytics`
- `Production System` (para aplicar multipliers)

## Criterios de Aceptación

- [ ] Todos los boosters se pueden comprar correctamente
- [ ] Boosters aplican multipliers correctos
- [ ] Timers cuentan regresiva correctamente
- [ ] Boosters temporales NO stackean entre sí
- [ ] Permanent multiplier se puede comprar una vez
- [ ] Todos los starter packs se pueden comprar
- [ ] Starter packs otorgan recursos correctos
- [ ] Starter packs solo se pueden comprar UNA VEZ cada uno
- [ ] Restore Purchases restaura flags correctamente
- [ ] UI muestra badges/timers correctamente

## Notas de Implementación

Ver IAP System spec para implementation details. Los boosters y starter packs usan el mismo IAPService con diferentes product IDs.

## Testing

### Unit Tests
```typescript
describe('Boosters', () => {
  it('should apply 2x multiplier when active', () => {
    const state = {
      iapState: {
        booster2x: { isActive: true, activatedAt: Date.now() },
      },
    };
    expect(calculateActiveTemporaryBooster(state)).toBe(2.0);
  });

  it('should not stack 2x and 5x boosters', () => {
    const state = {
      iapState: {
        booster2x: { isActive: true, activatedAt: Date.now() },
        booster5x: { isActive: true, activatedAt: Date.now() },
      },
    };
    // 5x tiene prioridad
    expect(calculateActiveTemporaryBooster(state)).toBe(5.0);
  });

  it('should stack permanent with temporary', () => {
    const state = {
      iapState: {
        permanentMultiplierPurchased: true,
        booster5x: { isActive: true, activatedAt: Date.now() },
      },
    };
    const base = 1000;
    const production = base * 2.0 * 5.0; // permanent × temporary
    expect(production).toBe(10000);
  });
});

describe('Starter Packs', () => {
  it('should grant resources when purchased', () => {
    const initialState = { cryptoCoins: 1000, realMoney: 100 };
    const newState = purchaseStarterPack(initialState, 'small');

    expect(newState.cryptoCoins).toBe(11000); // +10K
    expect(newState.realMoney).toBe(600); // +500
  });

  it('should mark pack as purchased', () => {
    const state = purchaseStarterPack(initialState, 'medium');
    expect(state.iapState.starterPacksPurchased.medium).toBe(true);
  });

  it('should not allow purchasing same pack twice', () => {
    const state = {
      iapState: { starterPacksPurchased: { small: true } },
    };
    expect(canPurchaseStarterPack('small', state)).toBe(false);
  });
});
```

## Performance Considerations

- Timer updates: 1x per second (efficient)
- Multiplier calculations: < 1ms
- UI badge rendering: Memoized

## Analytics

```typescript
analytics().logEvent('booster_2x_purchased', {
  active_before_purchase: gameState.iapState.booster2x.isActive,
});

analytics().logEvent('booster_5x_purchased', {
  replaced_booster: gameState.iapState.booster2x.isActive ? '2x' : 'none',
});

analytics().logEvent('permanent_multiplier_purchased', {
  prestige_level: gameState.prestigeLevel,
});

analytics().logEvent('starter_pack_purchased', {
  pack_type: 'small' | 'medium' | 'large' | 'mega',
  playtime: totalPlaytime,
  blocks_mined: gameState.blocksMined,
});
```

## Edge Cases

**Edge Case 1: Comprar booster 1 segundo antes de expirar**
- Input: 2x activo con 1s restante, compra otro 2x
- Expected: Timer resetea a 4h completas

**Edge Case 2: Offline durante todo el booster**
- Input: Activa 5x (24h), cierra app por 25h
- Expected: Al reabrir, booster expirado, offline earnings con boost hasta hora 24

**Edge Case 3: Comprar todos los starter packs**
- Input: Compra Small, Medium, Large, Mega
- Expected: Todos marcados como owned, total +710K CC + $63K

**Edge Case 4: Prestige con booster activo**
- Input: Hace prestige con 5x activo (10h restantes)
- Expected: Booster PERSISTE después de prestige (es un boost temporal ganado)

## Preguntas Abiertas

- [ ] **Booster timer pausa offline?**: ¿Timer solo cuenta tiempo activo o tiempo real?
  - **Recomendación**: Tiempo real (más simple, menos explotable)

- [ ] **Click power boosters**: ¿Añadir boosters para click manual?
  - **Recomendación**: Phase 3+, no prioritario

- [ ] **Booster bundles**: ¿"3x boosters por precio de 2"?
  - **Recomendación**: Phase 4+, aumenta complejidad

- [ ] **Custom booster durations**: ¿Permitir comprar "8 horas de 5x"?
  - **Recomendación**: No, mantener simple (4h/24h fijos)

## Referencias

- Idle game booster pricing: https://www.deconstructoroffun.com/blog/2019/1/8/idle-heroes-boosters
- IAP consumables best practices: https://www.revenuecat.com/blog/consumable-iap-guide/
- Starter pack design: https://www.blog.google/products/admob/starter-pack-strategies/
