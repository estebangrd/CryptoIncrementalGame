# Boosters and Starter Packs Catalog

## Estado
- **Fase**: Phase 3 - Monetization
- **Estado**: ✅ Implemented
- **Prioridad**: High (Monetization)
- **Última actualización**: 2026-03-28

## Descripción

El catálogo de Boosters y Starter Packs proporciona opciones de monetización opcionales que aceleran la progresión del jugador sin romper el balance del juego. Todos los productos son completamente opcionales - el juego es 100% completable sin gastar dinero.

**Production Boosters (Consumables):**
- 2x Production Booster ($0.99) - 2x producción por 4 horas, consumable
- 5x Production Booster ($2.99) - 5x producción por 24 horas, consumable
- Permanent 2x Multiplier ($9.99) - 2x producción permanente, non-consumable

**Specialty Boosters (Consumables):**
- Offline Miner ($1.99) - 8h de minado offline al 50% de producción; 30% chance de oferta extendida (12h)
- Lucky Block ($0.99) - 5x recompensa por N bloques (200/1000/3000 según hashRate)
- Market Pump ($0.99) - 2x precio de venta por 15 min; 30% chance de oferta extendida (20 min)

**Dynamic Packs (Timed Offers):**
Los packs ya NO son one-time estáticos. Son **ofertas dinámicas** con valores dentro de un rango, que aparecen por 20 minutos con 8h de cooldown. La visibilidad depende del hardware que posee el jugador:
- Small Pack ($0.99) - 3-5K CC + $40-80 + 1h 2x booster (hasta poseer asic_gen3)
- Medium Pack ($2.99) - 20-40K CC + $5-10K + 2h 2x booster (asic_gen3 → quantum_miner)
- Large Pack ($4.99) - 40-60K CC + $30-50K + 4h booster + 24-48h crédito eléctrico (quantum_miner → supercomputer)
- Mega Pack ($9.99) - 100-200K CC + $200-400K + 24h booster + 72-120h crédito eléctrico (post-supercomputer)

Todos los boosters stackean multiplicativamente con prestige y rewarded ad boosts.

## Objetivos
- [x] Implementar 3 tipos de production boosters (2x, 5x, permanent)
- [x] Implementar 3 specialty boosters (Offline Miner, Lucky Block, Market Pump)
- [x] Implementar dynamic packs con ofertas timed y stage-based visibility
- [x] Asegurar que boosters stackean correctamente con otros multipliers
- [x] Implementar timers de duración para boosters temporales
- [x] Prevenir stacking de boosters del mismo tipo (reemplazan, no suman)
- [x] Implementar extended offer mechanic (30% chance) para specialty boosters
- [x] Créditos de electricidad en Large/Mega packs (condicional a non-renewable energy)
- [x] Mostrar indicadores visuales de boosters activos
- [ ] Trackear purchases y conversión en Analytics (no implementado aún)

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
  - Verificar si booster sigue activo:
    - `Date.now() - booster5x.activatedAt = 18 horas`
    - `24 horas - 18 horas = 6 horas restantes` ✓ Sigue activo
  - **No se acreditan coins** por el tiempo en background
  - Badge actualizado con tiempo correcto:
    - "5x Boost: 6:00:00"
  - Continuar countdown normalmente (el boost aplica desde ahora)

### Caso de Uso 8: Booster Expira Durante Offline
**Dado que** el usuario tiene 2x booster activo (2 horas restantes)
**Cuando** cierra la app por 4 horas y la reabre
**Entonces**
- Al reabrir app:
  - Verificar que booster expiró durante el cierre
  - **No se acreditan coins** por el tiempo en background
  - Booster marcado como inactivo
  - No se muestra modal de offline earnings
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

### SPECIALTY BOOSTERS (Offline Miner, Lucky Block, Market Pump)

### Caso de Uso 10b: Comprar Offline Miner
**Dado que** el usuario quiere ganar recursos mientras la app está cerrada
**Cuando** compra Offline Miner ($1.99)
**Entonces**
- Al abrir tab Boosters:
  - 30% de probabilidad de ver oferta extendida (12h en vez de 8h)
  - Si no extendida: "Offline Miner — 8h mining at 50% speed — $1.99"
  - Si extendida: "Offline Miner — EXTENDED 12h mining at 50% speed — $1.99" (badge especial)
- Al comprar:
  - Activa minado offline: producción al 50% (`earningsMultiplier: 0.5`) durante `baseDurationMs` (8h) o `extendedDurationMs` (12h)
  - Al reabrir la app, `OfflineEarningsModal` muestra las ganancias acumuladas
  - Timer es real-time (no pausa)
- Configuración: `BOOSTER_CONFIG.OFFLINE_MINER`

### Caso de Uso 10c: Comprar Lucky Block
**Dado que** el usuario quiere recompensas extra por los próximos bloques minados
**Cuando** compra Lucky Block ($0.99)
**Entonces**
- Otorga 5x recompensa por bloque (`rewardMultiplier: 5`) durante los próximos N bloques
- N depende del `totalHashRate` del jugador:
  - hashRate < 5,000 → 200 bloques (`earlyBlocks`)
  - 5,000 ≤ hashRate < 100,000 → 1,000 bloques (`midBlocks`)
  - hashRate ≥ 100,000 → 3,000 bloques (`lateBlocks`)
- Aplicado en la acción `ADD_PRODUCTION` del reducer
- UI muestra badge: "Lucky Block: X blocks remaining"
- Configuración: `BOOSTER_CONFIG.LUCKY_BLOCK`

### Caso de Uso 10d: Comprar Market Pump
**Dado que** el usuario quiere vender CryptoCoins a mejor precio
**Cuando** compra Market Pump ($0.99)
**Entonces**
- Al abrir tab Boosters:
  - 30% de probabilidad de ver oferta extendida (20 min en vez de 15 min)
  - Si extendida: badge "EXTENDED" visible
- Al comprar:
  - Precio de venta se multiplica por 2x (`priceMultiplier: 2.0`) durante `baseDurationMs` (15 min) o `extendedDurationMs` (20 min)
  - Aplicado en la acción `SELL_COINS_FOR_MONEY` del reducer
  - UI muestra badge: "Market Pump: MM:SS remaining"
  - Timer es real-time
- Configuración: `BOOSTER_CONFIG.MARKET_PUMP`

### Caso de Uso 10e: Extended Offer Mechanic (Offline Miner & Market Pump)
**Dado que** Offline Miner y Market Pump tienen 30% chance de oferta extendida
**Cuando** el usuario abre el tab Boosters
**Entonces**
- Se pre-rolla la oferta extendida (si aplica) al abrir el tab
- El resultado se pasa via `pendingBoosterMetaRef` (ref exportada desde GameContext)
- Si la oferta extendida está activa, la card muestra duración mejorada con badge visual
- El roll NO se repite en cada render — solo al abrir el tab

### DYNAMIC PACKS (Ofertas Dinámicas)

### Caso de Uso 11: Ver Dynamic Pack en Store
**Dado que** el usuario abre la sección "Packs"
**Cuando** la pantalla carga
**Entonces**
- Se muestra UN solo pack a la vez, basado en la etapa del jugador (hardware que posee):
  - **Si NO tiene asic_gen3**: Small Pack (Starter Pack — $0.99)
  - **Si tiene asic_gen3, NO quantum_miner**: Medium Pack (Growth Pack — $2.99)
  - **Si tiene quantum_miner, NO supercomputer**: Large Pack (Mining Empire — $4.99)
  - **Si tiene supercomputer**: Mega Pack (Crypto Titan — $9.99)
- Visibilidad controlada por `showAfterHardwareId` / `showUntilHardwareId` en PACK_CONFIG
- Si hay una oferta activa (timer > 0):
  - Card muestra recursos con valores concretos (randorizados al generar la oferta)
  - Timer countdown "Offer expires in MM:SS"
  - Botón "Buy"
- Si no hay oferta activa y cooldown terminó:
  - Se genera una nueva oferta automáticamente
  - CC y Cash se randomizan dentro de los rangos configurados
  - Timer = 20 minutos (`OFFER_DURATION_MS`)
- Si oferta expiró:
  - Pack no visible o muestra "Next offer in HH:MM" (cooldown 8h)

### Caso de Uso 12: Contenido de cada Dynamic Pack

**Small Pack (Starter Pack — $0.99):**
- CC: 3,000 - 5,000 (randomizado)
- Cash: $40 - $80 (randomizado)
- Booster: 2x producción × 1h (siempre incluido)
- Visible hasta poseer `asic_gen3`

**Medium Pack (Growth Pack — $2.99):**
- CC: 20,000 - 40,000
- Cash: $5,000 - $10,000
- Booster: 2x producción × 2h
- Visible desde `asic_gen3` hasta poseer `quantum_miner`

**Large Pack (Mining Empire — $4.99):**
- CC: 40,000 - 60,000
- Cash: $30,000 - $50,000
- Booster: 2x producción × 4h (cuando no hay electricidad)
- **Crédito eléctrico**: 24-48h de energía gratis (si jugador tiene energía no-renovable activa)
- Visible desde `quantum_miner` hasta poseer `supercomputer`

**Mega Pack (Crypto Titan — $9.99):**
- CC: 100,000 - 200,000
- Cash: $200,000 - $400,000
- Booster: 2x producción × 24h (cuando no hay electricidad)
- **Crédito eléctrico**: 72-120h de energía gratis (si jugador tiene energía no-renovable activa)
- Visible desde poseer `supercomputer` en adelante

### Caso de Uso 13: Comprar Dynamic Pack
**Dado que** hay una oferta activa con timer > 0
**Cuando** el usuario presiona "Buy"
**Entonces**
- Procesar compra (IAP flow)
- Al completar:
  - Otorgar CC y Cash según los valores concretos de la oferta actual (`packCurrentCC`, `packCurrentCash`)
  - Activar booster 2x producción por la duración del tier (`boosterDurationMs`)
  - Si pack incluye electricidad Y jugador tiene non-renewable activa: otorgar crédito eléctrico (`packCurrentElectricityHours`)
  - Mostrar success dialog con recursos otorgados
  - La oferta desaparece, cooldown de 8h inicia
- Acción del reducer: `PURCHASE_STARTER_PACK` usa valores dinámicos de `packCurrentCC`/`packCurrentCash` con fallback estático

### Caso de Uso 14: Créditos de Electricidad en Packs
**Dado que** el jugador tiene energía no-renovable activa (coal, oil, nuclear)
**Cuando** compra Large o Mega Pack
**Entonces**
- Además de CC, Cash y booster, recibe crédito eléctrico
- Large: 24-48h de electricidad gratis (randomizado al generar oferta)
- Mega: 72-120h de electricidad gratis
- Crédito se aplica como horas sin costo de electricidad
- Si jugador NO tiene energía no-renovable activa: el crédito NO se incluye en la oferta, solo se muestra CC + Cash + booster

### Caso de Uso 15: Oferta Expira Sin Comprar
**Dado que** hay una oferta activa
**Cuando** el timer de 20 minutos llega a 0
**Entonces**
- Oferta desaparece
- Cooldown de 8h inicia (`COOLDOWN_MS`)
- Próxima oferta genera nuevos valores randorizados dentro de los rangos
- Estado: `packNextOfferAt = Date.now() + COOLDOWN_MS`

### Caso de Uso 16: Todos los Boosters Activos
**Dado que** el usuario compró múltiples boosters
**Cuando** tiene todos los boosts activos
**Entonces**
- Producción total (ejemplo):
  ```
  baseProduction = 1000 CC/s
  prestigeMultiplier = 2.0x (prestige level 10)
  permanentMultiplier = 2.0x (permanent IAP)
  temporaryBooster = 5.0x (5x booster)
  adBoost = 2.0x (rewarded ad)
  luckyBlock = 5x (por bloque, si activo)

  finalProduction = 1000 × 2.0 × 2.0 × 5.0 × 2.0 = 40,000 CC/s
  + Lucky Block: cada bloque minado otorga 5× recompensa
  + Market Pump: precio de venta 2× (si activo)
  + Offline Miner: 50% de producción mientras app cerrada (si activo)
  ```
- UI muestra badges activos:
  - "2x Permanent" (arco iris)
  - "5x Boost: 18:30:00" (violeta)
  - "2x Ad: 2:15:00" (dorado)
  - "Lucky Block: 450 blocks" (si activo)
  - "Market Pump: 12:30" (si activo)

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

En `src/config/balanceConfig.ts`:

```typescript
export const BOOSTER_CONFIG = {
  // Production Boosters
  BOOSTER_2X: {
    multiplier: 2.0,
    durationMs: 4 * 60 * 60 * 1000,   // 4 horas
  },
  BOOSTER_5X: {
    multiplier: 5.0,
    durationMs: 24 * 60 * 60 * 1000,  // 24 horas
  },
  PERMANENT_MULTIPLIER: {
    multiplier: 2.0,
  },
  REWARDED_AD_BOOST: {
    multiplier: 2.0,
    durationMs: 4 * 60 * 60 * 1000,   // 4 horas
    cooldownMs: 5 * 60 * 1000,         // 5 minutos
  },

  // Specialty Boosters
  OFFLINE_MINER: {
    baseDurationMs: 8 * 60 * 60 * 1000,      // 8h
    extendedDurationMs: 12 * 60 * 60 * 1000,  // 12h (extended offer)
    extendedOfferChance: 0.30,                 // 30% chance on tab open
    earningsMultiplier: 0.5,                   // 50% of active production
  },
  LUCKY_BLOCK: {
    rewardMultiplier: 5,                       // 5x block reward
    earlyBlocks: 200,                          // blocks if hashRate < 5K
    midBlocks: 1000,                           // blocks if 5K ≤ hashRate < 100K
    lateBlocks: 3000,                          // blocks if hashRate ≥ 100K
    earlyHashThreshold: 5000,
    lateHashThreshold: 100000,
  },
  MARKET_PUMP: {
    priceMultiplier: 2.0,                      // 2x sell price
    baseDurationMs: 15 * 60 * 1000,            // 15 min
    extendedDurationMs: 20 * 60 * 1000,        // 20 min
    extendedOfferChance: 0.30,                 // 30% chance on tab open
  },
};

export const PACK_CONFIG = {
  OFFER_DURATION_MS: 20 * 60 * 1000,  // 20 min active window
  COOLDOWN_MS: 8 * 60 * 60 * 1000,    // 8h between offers

  small: {
    ccRange: [3_000, 5_000],
    cashRange: [40, 80],
    boosterDurationMs: 1 * 60 * 60 * 1000,  // 1h 2x booster
    showUntilHardwareId: 'asic_gen3',
  },
  medium: {
    ccRange: [20_000, 40_000],
    cashRange: [5_000, 10_000],
    boosterDurationMs: 2 * 60 * 60 * 1000,  // 2h 2x booster
    showAfterHardwareId: 'asic_gen3',
    showUntilHardwareId: 'quantum_miner',
  },
  large: {
    ccRange: [40_000, 60_000],
    cashRange: [30_000, 50_000],
    boosterDurationMs: 4 * 60 * 60 * 1000,  // 4h booster
    showAfterHardwareId: 'quantum_miner',
    showUntilHardwareId: 'supercomputer',
    includeElectricity: true,
    electricityHoursRange: [24, 48],
  },
  mega: {
    ccRange: [100_000, 200_000],
    cashRange: [200_000, 400_000],
    boosterDurationMs: 24 * 60 * 60 * 1000, // 24h booster
    showAfterHardwareId: 'supercomputer',
    includeElectricity: true,
    electricityHoursRange: [72, 120],
  },
};
```

## Estructura de Datos

### Booster & Pack State (GameState.iapState)
```typescript
interface IAPState {
  // Permanent Multiplier
  permanentMultiplierPurchased: boolean;

  // Temporary Production Boosters (consumable, con timers)
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

  // Specialty Boosters state
  offlineMiner: {
    isActive: boolean;
    activatedAt: number | null;
    expiresAt: number | null;
  };
  luckyBlock: {
    isActive: boolean;
    blocksRemaining: number;
  };
  marketPump: {
    isActive: boolean;
    activatedAt: number | null;
    expiresAt: number | null;
  };

  // Dynamic Pack Offers (timed offers, not one-time)
  packOfferExpiresAt: number;           // current offer expiry timestamp
  packNextOfferAt: number;              // next offer generation timestamp (after cooldown)
  packCurrentCC: number;                // randomized CC value for current offer
  packCurrentCash: number;              // randomized Cash value for current offer
  packCurrentElectricityHours: number;  // randomized electricity hours (0 if N/A)

  // Flash Sale (Remove Ads)
  flashSaleExpiresAt: number;
  flashSaleCooldownUntil: number;

  // Purchase history (includes all consumable purchases)
  purchaseHistory: PurchaseRecord[];
}
```

## Reglas de Negocio

### Production Boosters
1. **Boosters temporales NO stackean entre sí**: 5x reemplaza 2x, no se suman
2. **Boosters SÍ stackean con otros multipliers**: Permanent × Prestige × Ad × Temporary
3. **Permanent Multiplier es non-consumable**: Solo se puede comprar una vez
4. **Comprar booster mientras activo resetea timer**: No suma, reemplaza
5. **Timer es real-time**: No pausa durante offline

### Specialty Boosters
6. **Offline Miner**: Producción al 50% mientras app cerrada; duración 8h (o 12h si extended)
7. **Lucky Block**: 5x reward por bloque durante N bloques; N escala con hashRate del jugador
8. **Market Pump**: 2x precio de venta durante 15 min (o 20 min si extended)
9. **Extended offers**: 30% chance, se pre-rolla al abrir tab Boosters (via `pendingBoosterMetaRef`); no re-rolla por render
10. **Specialty boosters son independientes**: Se pueden usar simultáneamente entre sí y con production boosters

### Dynamic Packs
11. **Packs son ofertas dinámicas con timer**: 20 min de duración, 8h cooldown entre ofertas
12. **Valores randomizados por oferta**: CC y Cash dentro de rangos configurados; cada nueva oferta genera nuevos valores
13. **Visibilidad por stage**: Solo se muestra el pack correspondiente al hardware que el jugador posee
14. **Crédito eléctrico condicional**: Solo en Large/Mega packs, y solo si el jugador tiene energía no-renovable activa
15. **Booster incluido**: Cada pack activa booster 2x producción por la duración del tier
16. **Packs se pueden comprar múltiples veces**: Cada oferta es una nueva compra (no one-time)

### Integridad del Génesis (invariante global)
17. **Toda CC que entra al sistema debe avanzar `blocksMined`**: No pueden existir CryptoCoins sin bloques minados correspondientes
18. **Pack CC rewards usan `creditCryptoCoins()`**: Convierte CC otorgados a bloques equivalentes según reward actual, respetando halvings
19. **Offline Miner earnings usan `claimOfflineEarnings()`**: Avanza `blocksMined` por los `offlineBlocksProcessed` calculados durante la ausencia
20. **Lucky Block no viola invariante**: Multiplica reward de bloques ya minados en `ADD_PRODUCTION`, no crea CC sin bloques

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

### Archivos clave
- `src/config/balanceConfig.ts` → `BOOSTER_CONFIG`, `PACK_CONFIG` (todas las constantes)
- `src/contexts/GameContext.tsx` → Reducer actions: `ACTIVATE_BOOSTER`, `PURCHASE_STARTER_PACK`, `SET_PACK_OFFER`
- `src/components/ShopScreen.tsx` → UI de las 3 tabs: `removeAds` | `boosters` | `packs`

### Specialty Boosters — Puntos de aplicación en el reducer
- **Lucky Block**: Se aplica en `ADD_PRODUCTION` — multiplica `blockReward` por `rewardMultiplier` y decrementa `blocksRemaining`
- **Market Pump**: Se aplica en `SELL_COINS_FOR_MONEY` — multiplica precio de venta por `priceMultiplier`
- **Offline Miner**: Hooks en `updateOfflineProgress` de `src/utils/gameLogic.ts`

### Extended Offer mechanic
- Pre-rolled al abrir tab Boosters via `pendingBoosterMetaRef` (ref exportada desde GameContext)
- El resultado del roll se pasa al componente para mostrar la oferta extendida si aplica
- El roll NO se repite por re-render

### Dynamic Packs — Estado
- `iapState.packOfferExpiresAt`: Timestamp de expiración de la oferta actual
- `iapState.packNextOfferAt`: Timestamp de próxima generación de oferta (post-cooldown)
- `iapState.packCurrentCC` / `packCurrentCash` / `packCurrentElectricityHours`: Valores concretos de la oferta actual

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

**Edge Case 3: Prestige con booster activo**
- Input: Hace prestige con 5x activo (10h restantes)
- Expected: Booster PERSISTE después de prestige (es un boost temporal ganado)

**Edge Case 4: Lucky Block con hashRate que cambia mid-boost**
- Input: Compra Lucky Block con hashRate=4,000 (→200 blocks), luego compra hardware y hashRate sube a 6,000
- Expected: Bloques restantes NO se recalculan. Los 200 bloques originales se mantienen.

**Edge Case 5: Pack offer expira mientras usuario ve confirmation dialog**
- Input: Usuario abre dialog de compra, timer llega a 0 antes de confirmar
- Expected: Compra falla gracefully, mostrar "Offer expired"

**Edge Case 6: Market Pump + venta de coins**
- Input: Market Pump activo (2x precio), precio base = $100
- Expected: Venta se realiza a $200 por coin (2x aplicado en `SELL_COINS_FOR_MONEY`)

**Edge Case 7: Offline Miner + production booster stacking**
- Input: Offline Miner activo (50% earnings) + 5x booster activo
- Expected: Offline earnings = producción normal × 5x booster × 0.5 offline multiplier

**Edge Case 8: False offline modal after watching rewarded ad (fixed)**
- Input: User plays for 8 min, watches a rewarded ad (app goes to background briefly)
- Bug: `lastSaveTime` in memory was stale (from app start), so `updateOfflineProgress` saw 8 min offline → false modal
- Fix: `ADD_PRODUCTION` updates `lastSaveTime = Date.now()` every tick, keeping it current during active play
- Expected: After ad, `lastSaveTime` is ~1s old → no offline modal

**Edge Case 9: Pack stage transition**
- Input: Usuario ve Small Pack offer, compra asic_gen3 durante la oferta
- Expected: Small Pack sigue visible hasta que expire/se compre. Próxima oferta será Medium Pack.

## Preguntas Abiertas

- [x] ~~**Booster timer pausa offline?**~~: Resuelto — timers usan **tiempo real** (no pausan)
- [x] ~~**Starter packs one-time?**~~: Resuelto — cambiaron a **dynamic packs** (recomprables, timed offers)
- [ ] **Booster bundles**: ¿"3x boosters por precio de 2"?
  - **Recomendación**: Post-launch, aumenta complejidad
- [ ] **Analytics**: Ningún evento de analytics está implementado aún para boosters ni packs

## Referencias

- Idle game booster pricing: https://www.deconstructoroffun.com/blog/2019/1/8/idle-heroes-boosters
- IAP consumables best practices: https://www.revenuecat.com/blog/consumable-iap-guide/
- Starter pack design: https://www.blog.google/products/admob/starter-pack-strategies/
