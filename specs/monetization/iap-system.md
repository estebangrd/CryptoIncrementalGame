# In-App Purchase System

## Estado
- **Fase**: Phase 1 - Genesis (Designed, Not Implemented)
- **Estado**: Specification Complete
- **Prioridad**: High (Secondary Monetization)
- **Última actualización**: 2026-02-21

## Descripción

El sistema de In-App Purchases (IAP) proporciona monetización secundaria para Blockchain Tycoon a través de compras opcionales que mejoran la experiencia del jugador. El juego es completamente jugable y completable sin gastar dinero (free-to-play genuino), pero las compras ofrecen conveniencia y aceleración.

El sistema implementa tres tipos de productos:
1. **Non-Consumable**: Remove Ads ($0.99) - compra única, permanente
2. **Consumable**: Boosters de producción (2x, 5x, Permanent, Offline Miner, Lucky Block, Market Pump) - pueden comprarse múltiples veces
3. **Dynamic Packs**: Starter Packs - ofertas dinámicas con valores randomizados, timed (20 min) con 8h cooldown. Ver `boosters-catalog.md` para detalles completos.

La integración utiliza `react-native-iap` para soportar tanto iOS (StoreKit 2) como Android (Google Play Billing Library v5), con receipt validation, restore purchases, y manejo robusto de errores.

## Objetivos
- [ ] Integrar Google Play Billing (Android) y StoreKit (iOS)
- [ ] Implementar catálogo de productos (Remove Ads, Boosters, Starter Packs)
- [ ] Implementar flujo de compra completo (select → confirm → verify → deliver)
- [ ] Implementar receipt validation (client-side inicialmente, server-side futuro)
- [ ] Implementar Restore Purchases para non-consumables
- [ ] Manejar errores gracefully (payment failed, cancelled, already owned)
- [ ] Trackear todas las compras en Firebase Analytics
- [ ] Prevenir double-spending y fraud básico
- [ ] Soportar test products para development

## Comportamiento Esperado

### Caso de Uso 1: Inicialización del IAP System
**Dado que** el usuario abre la app por primera vez
**Cuando** el app se inicializa
**Entonces**
- `react-native-iap` se inicializa
- Conexión con App Store (iOS) o Google Play (Android)
- Se carga el catálogo de productos disponibles:
  - `getProducts([product_ids])` → lista de productos con precios localizados
- Si hay productos no consumidos (pending):
  - Se procesan automáticamente (finish transactions)
- Se verifica estado de non-consumables (Restore Purchases automático):
  - Si Remove Ads fue comprado previamente: `removeAdsPurchased = true`
  - Si Permanent Multiplier fue comprado: `permanentMultiplierPurchased = true`
- Estado inicial se guarda en gameState.iapState
- Si inicialización falla:
  - Log error pero continuar gameplay
  - Store deshabilitado, mostrar mensaje "Store unavailable"
- Log evento: `iap_initialized`

### Caso de Uso 2: Ver Store/Shop Screen
**Dado que** el usuario abre la tienda de IAP
**Cuando** la pantalla carga
**Entonces**
- Se muestran todas las categorías de productos:
  - **Remove Ads**: Destacado si no comprado, badge "Purchased" si comprado
  - **Boosters**: Lista de boosters consumables
  - **Starter Packs**: Grid de packs con badge "Purchased" si ya comprados
- Cada producto muestra:
  - Nombre localizado
  - Descripción del beneficio
  - Precio localizado (obtenido de App Store/Play Store)
  - Icono/imagen
  - Badge de estado:
    - "Best Value" (para Mega Pack)
    - "Most Popular" (para Medium Pack o 2x Booster)
    - "Purchased" (si non-consumable ya comprado)
    - "Owned" (si one-time pack ya comprado)
- Si un producto no está disponible (región, configuración):
  - Mostrar "Not available in your region"
- Botón de compra:
  - Habilitado si puede comprar
  - Deshabilitado si ya comprado (non-consumable/one-time)
  - Muestra precio localizado

### Caso de Uso 3: Comprar Remove Ads (Primera Vez)
**Dado que** el usuario NO ha comprado Remove Ads
**Cuando** presiona "Buy Remove Ads ($0.99)"
**Entonces**
- Se muestra confirmation dialog:
  - "Remove Ads"
  - "Remove banner and interstitial ads forever"
  - "Rewarded ads will still be available"
  - "Price: $0.99"
  - Botones: "Cancel" | "Purchase"
- Si selecciona Cancel: cerrar dialog, no procesar
- Si selecciona Purchase:
  - Mostrar loading spinner: "Processing purchase..."
  - Llamar `requestPurchase('remove_ads')`
  - Sistema operativo muestra dialog nativo de confirmación:
    - iOS: Face ID/Touch ID/Password
    - Android: Biometrics/Password
  - Usuario autoriza el pago
  - Se procesa la transacción:
    - Success:
      - Receipt se valida (client-side)
      - Se marca producto como comprado: `removeAdsPurchased = true`
      - Se ocultan todos los banner e interstitial ads
      - Se guarda estado en AsyncStorage
      - Se envía receipt al backend (si implementado)
      - Se finaliza transacción: `finishTransaction()`
      - Mostrar success dialog: "Purchase successful! Ads removed."
      - Log evento: `iap_purchase_success`
    - Error:
      - Mostrar error dialog según tipo de error
      - Log evento: `iap_purchase_failed`

### Caso de Uso 4: Intentar Comprar Remove Ads (Ya Comprado)
**Dado que** el usuario YA compró Remove Ads
**Cuando** intenta comprarlo de nuevo
**Entonces**
- Botón está deshabilitado con badge "Purchased"
- Si de alguna forma intenta comprarlo:
  - Mostrar dialog: "You already own this item"
  - NO procesar compra
  - NO cobrar dinero

### Caso de Uso 5: Comprar 2x Production Booster (Consumable)
**Dado que** el usuario quiere un boost temporal
**Cuando** presiona "Buy 2x Booster ($0.99)"
**Entonces**
- Mostrar confirmation dialog:
  - "2x Production Booster"
  - "Double your production for 4 hours"
  - "This boost can stack with rewarded ad boost"
  - "Price: $0.99"
  - Botones: "Cancel" | "Purchase"
- Si selecciona Purchase:
  - Procesar compra (mismo flujo que Remove Ads)
  - Al completar exitosamente:
    - Aplicar boost: `booster2xActive = true`, `activatedAt = Date.now()`
    - Mostrar notificación: "2x Boost Active! (4 hours)"
    - Guardar transacción en historial
    - Finalizar transacción: `finishTransaction()`
    - Log evento: `iap_booster_purchased`
- El usuario PUEDE comprar este producto múltiples veces:
  - Si ya tiene boost activo: mostrar warning (igual que rewarded ad)
  - Comprar otro reemplaza el timer, no stackea

### Caso de Uso 6: Comprar 5x Production Booster (Consumable)
**Dado que** el usuario quiere un boost más poderoso
**Cuando** presiona "Buy 5x Booster ($2.99)"
**Entonces**
- Mismo flujo que 2x Booster
- Al activarse:
  - Aplica 5x multiplier por 24 horas
  - Si hay boost activo (2x o 5x): reemplaza
  - Mostrar: "5x Boost Active! (24 hours)"
  - Log evento: `iap_booster_5x_purchased`

### Caso de Uso 7: Comprar Permanent 2x Multiplier (Non-Consumable)
**Dado que** el usuario quiere un boost permanente
**Cuando** presiona "Buy Permanent 2x ($9.99)"
**Entonces**
- Mostrar confirmation dialog:
  - "Permanent 2x Multiplier"
  - "PERMANENTLY double your production"
  - "This multiplier stacks with prestige and temporary boosters"
  - "Price: $9.99"
  - "⚠️ This is a one-time purchase, permanent forever"
- Si selecciona Purchase:
  - Procesar compra
  - Al completar:
    - Marcar como comprado: `permanentMultiplierPurchased = true`
    - Aplicar multiplier permanente: `iapPermanentMultiplier = 2.0`
    - Mostrar celebration: "Permanent 2x Multiplier Activated!"
    - Finalizar transacción
    - Guardar en AsyncStorage y backend
    - Log evento: `iap_permanent_multiplier_purchased`
- Producto queda marcado como "Purchased", no se puede volver a comprar

### Caso de Uso 8: Comprar Small Starter Pack (One-Time)
**Dado que** el usuario NO ha comprado Small Pack
**Cuando** presiona "Buy Small Pack ($0.99)"
**Entonces**
- Mostrar confirmation dialog:
  - "Small Starter Pack"
  - "You will receive:"
  - "• 15,000 CryptoCoins"
  - "• $8,000 Real Money"
  - "Price: $0.99"
  - **Nota**: Packs ahora son ofertas dinámicas con valores randomizados dentro de rangos (ver `boosters-catalog.md`). Los valores estáticos en `STARTER_PACK_REWARDS` son fallback.
- Si selecciona Purchase:
  - Procesar compra
  - Al completar:
    - Otorgar recursos (uses dynamic `packCurrentCC`/`packCurrentCash` with static fallback):
      - `cryptoCoins += packCurrentCC` (or 15000 fallback)
      - `realMoney += packCurrentCash` (or 8000 fallback)
    - Mostrar notificación with granted amounts
    - Finalizar transacción
    - Log evento: `iap_starter_pack_purchased`
- Producto queda marcado como "Purchased", no se puede volver a comprar

### Caso de Uso 9: Intentar Comprar Starter Pack Ya Comprado
**Dado que** el usuario YA compró Small Pack
**Cuando** intenta comprarlo de nuevo
**Entonces**
- Botón está deshabilitado con badge "Owned"
- Si intenta comprarlo:
  - Mostrar: "You already purchased this pack"
  - NO procesar compra

### Caso de Uso 10: Comprar Múltiples Starter Packs
**Dado que** el usuario quiere comprar varios packs
**Cuando** compra Small, Medium, Large, y Mega
**Entonces**
- Cada pack se puede comprar UNA VEZ
- Los 4 packs son independientes:
  - Comprar Small NO previene comprar Medium
  - Puede comprar todos si quiere
- Al comprar cada uno:
  - Otorga recursos correspondientes
  - Se marca individualmente como purchased
  - Queda deshabilitado para futuras compras

### Caso de Uso 11: Error de Pago (Payment Failed)
**Dado que** el usuario intenta comprar un producto
**Cuando** el pago falla (tarjeta rechazada, fondos insuficientes)
**Entonces**
- Sistema operativo muestra error nativo
- App detecta error en purchase listener
- Mostrar error dialog:
  - "Purchase Failed"
  - "Your payment could not be processed"
  - "Please check your payment method"
  - Botón: "OK"
- NO otorgar beneficio del producto
- NO marcar como comprado
- NO finalizar transacción (quedará pending)
- Log evento: `iap_purchase_failed` con error code

### Caso de Uso 12: Compra Cancelada por Usuario
**Dado que** el usuario inició una compra
**Cuando** cancela en el dialog del sistema operativo
**Entonces**
- Purchase listener recibe error `E_USER_CANCELLED`
- NO mostrar error dialog (es intencional)
- NO procesar compra
- Volver a store screen normalmente
- Log evento: `iap_purchase_cancelled`

### Caso de Uso 13: Restore Purchases
**Dado que** el usuario reinstala la app (o cambia de device)
**Cuando** presiona "Restore Purchases" en settings
**Entonces**
- Mostrar loading: "Restoring purchases..."
- Llamar `getAvailablePurchases()`
- Sistema verifica compras previas en App Store/Play Store
- Para cada compra encontrada:
  - Si es Remove Ads: `removeAdsPurchased = true`
  - Si es Permanent Multiplier: `permanentMultiplierPurchased = true`
  - Si es Starter Pack: `starterPacksPurchased.X = true`
- Actualizar UI para reflejar productos restaurados
- Mostrar success:
  - "Purchases restored successfully"
  - Lista de productos restaurados
- Si no hay compras previas:
  - "No purchases to restore"
- Log evento: `iap_restore_purchases`

### Caso de Uso 14: Receipt Validation (Client-Side)
**Dado que** una compra fue procesada
**Cuando** se recibe el receipt
**Entonces**
- Validar estructura básica del receipt:
  - Tiene transaction ID válido
  - Product ID coincide con producto comprado
  - Timestamp razonable (no futuro, no muy antiguo)
- Si receipt es válido:
  - Procesar compra normalmente
- Si receipt es inválido:
  - NO otorgar beneficio
  - Mostrar error: "Invalid purchase, please contact support"
  - Log evento: `iap_receipt_invalid`
  - Guardar receipt para investigación

### Caso de Uso 15: Double Purchase Prevention
**Dado que** el usuario compró un producto consumable
**Cuando** intenta comprarlo de nuevo mientras se procesa
**Entonces**
- Verificar si hay transacción pendiente:
  - Si `isPurchasing = true`: mostrar "Processing previous purchase..."
  - NO permitir nueva compra hasta que termine la anterior
- Prevenir doble cobro por clicks repetidos:
  - Deshabilitar botón durante procesamiento
  - Mostrar spinner en botón

### Caso de Uso 16: Pending Transactions (Unfinished)
**Dado que** hay transacciones sin finalizar (app crash durante compra)
**Cuando** el usuario reabre la app
**Entonces**
- Al inicializar IAP:
  - Llamar `getAvailablePurchases()` para pending transactions
  - Para cada pending transaction:
    - Validar receipt
    - Otorgar beneficio si no fue otorgado
    - Finalizar transacción: `finishTransaction()`
- Esto previene que usuario pague pero no reciba beneficio

### Caso de Uso 17: Refund (Usuario Solicita Reembolso)
**Dado que** el usuario solicitó refund en App Store/Play Store
**Cuando** el refund es aprobado
**Entonces**
- App Store/Play Store notifica a la app (server-to-server)
- Si hay backend implementado:
  - Backend recibe notificación
  - Backend revoca beneficio:
    - Si Remove Ads: volver a mostrar ads
    - Si Permanent Multiplier: remover multiplier
    - Si Starter Pack: NO se puede revocar (recursos ya usados)
- Si NO hay backend:
  - Usuario mantiene beneficio (imposible detectar refund client-side)
  - Esto es aceptable para Phase 1 (fraud mínimo esperado)

### Caso de Uso 18: Producto No Disponible (Regional Restrictions)
**Dado que** un producto no está disponible en la región del usuario
**Cuando** intenta verlo en la store
**Entonces**
- Producto se muestra con badge "Not Available"
- Botón de compra deshabilitado
- Tooltip: "This product is not available in your region"
- Log evento: `iap_product_unavailable`

## Fórmulas y Cálculos

### Aplicación de Boosters a la Producción
```typescript
function calculateTotalProductionWithBoosters(gameState: GameState): number {
  // Producción base
  const baseProduction = calculateBaseProduction(gameState);

  // Prestige multiplier
  const prestigeMultiplier = gameState.prestigeProductionMultiplier;

  // IAP permanent multiplier
  const permanentMultiplier = gameState.iapState.permanentMultiplierPurchased ? 2.0 : 1.0;

  // Temporary booster (2x o 5x)
  const temporaryBooster = calculateActiveBooster(gameState);

  // Rewarded ad boost
  const adBoost = calculateRewardedAdBoost(gameState);

  // Todos los multipliers se MULTIPLICAN (no suman)
  const finalProduction = baseProduction *
    prestigeMultiplier *
    permanentMultiplier *
    temporaryBooster *
    adBoost;

  return finalProduction;
}

// Ejemplo con todos los boosters activos:
// Base: 1000 CC/s
// Prestige: 1.5x
// Permanent IAP: 2.0x
// 5x Booster: 5.0x
// Rewarded Ad: 2.0x
// Final: 1000 × 1.5 × 2.0 × 5.0 × 2.0 = 30,000 CC/s
```

### Cálculo de Booster Activo
```typescript
function calculateActiveBooster(gameState: GameState): number {
  const now = Date.now();

  // Verificar 5x booster (prioridad más alta)
  if (gameState.iapState.booster5x.isActive) {
    const duration = 24 * 60 * 60 * 1000; // 24 horas
    const elapsed = now - gameState.iapState.booster5x.activatedAt;

    if (elapsed < duration) {
      return 5.0; // 5x activo
    }
  }

  // Verificar 2x booster
  if (gameState.iapState.booster2x.isActive) {
    const duration = 4 * 60 * 60 * 1000; // 4 horas
    const elapsed = now - gameState.iapState.booster2x.activatedAt;

    if (elapsed < duration) {
      return 2.0; // 2x activo
    }
  }

  return 1.0; // Sin booster activo
}
```

### Verificación de One-Time Purchase
```typescript
function canPurchaseStarterPack(
  packId: 'small' | 'medium' | 'large' | 'mega',
  gameState: GameState
): boolean {
  return !gameState.iapState.starterPacksPurchased[packId];
}
```

### Validación Básica de Receipt (Client-Side)
```typescript
function validateReceiptClientSide(receipt: Receipt): boolean {
  // Verificar que tiene campos requeridos
  if (!receipt.transactionId || !receipt.productId) {
    return false;
  }

  // Verificar que transaction ID no está vacío
  if (receipt.transactionId.length < 10) {
    return false;
  }

  // Verificar que timestamp es razonable
  const purchaseTime = receipt.transactionDate;
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

  if (purchaseTime > now || purchaseTime < oneYearAgo) {
    return false; // Fecha sospechosa
  }

  return true;
}
```

## Constantes de Configuración

En `src/config/iapConfig.ts`:

```typescript
export const IAP_CONFIG = {
  // Product IDs (deben coincidir con App Store Connect y Google Play Console)
  productIds: {
    // Non-Consumable
    removeAds: 'com.blockchaintycoon.removeads',
    permanentMultiplier: 'com.blockchaintycoon.permanent2x',

    // Consumable Boosters
    booster2x: 'com.blockchaintycoon.booster2x',
    booster5x: 'com.blockchaintycoon.booster5x',

    // One-Time Starter Packs
    starterSmall: 'com.blockchaintycoon.starter_small',
    starterMedium: 'com.blockchaintycoon.starter_medium',
    starterLarge: 'com.blockchaintycoon.starter_large',
    starterMega: 'com.blockchaintycoon.starter_mega',
  },

  // Prices (reference only, actual prices from stores)
  prices: {
    removeAds: 0.99,
    permanentMultiplier: 9.99,
    booster2x: 0.99,
    booster5x: 2.99,
    starterSmall: 0.99,
    starterMedium: 2.99,
    starterLarge: 4.99,
    starterMega: 9.99,
  },

  // Booster durations (en segundos)
  boosterDurations: {
    booster2x: 4 * 60 * 60,   // 4 horas
    booster5x: 24 * 60 * 60,  // 24 horas
  },

  // Booster multipliers
  boosterMultipliers: {
    booster2x: 2.0,
    booster5x: 5.0,
    permanent: 2.0,
  },

  // Starter pack rewards (static fallback — dynamic values from PACK_CONFIG ranges)
  // See STARTER_PACK_REWARDS and PACK_CONFIG in balanceConfig.ts
  starterPackRewards: {
    small: {
      cryptoCoins: 15000,
      realMoney: 8000,
    },
    medium: {
      cryptoCoins: 80000,
      realMoney: 20000000,
    },
    large: {
      cryptoCoins: 200000,
      realMoney: 350000000,
    },
    mega: {
      cryptoCoins: 500000,
      realMoney: 4000000000,
    },
  },

  // Validation
  receiptValidation: {
    clientSide: true,         // Validation básica client-side
    serverSide: false,        // TODO: Implementar server-side validation
    serverEndpoint: null,     // URL del backend para validation
  },
};
```

## Estructura de Datos

### IAPState (GameState)
```typescript
interface GameState {
  // ... otros campos

  iapState: {
    // Non-Consumables
    removeAdsPurchased: boolean;
    permanentMultiplierPurchased: boolean;

    // Consumable Boosters (state activo)
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

    // One-Time Starter Packs
    starterPacksPurchased: {
      small: boolean;
      medium: boolean;
      large: boolean;
      mega: boolean;
    };

    // Purchase history (para analytics y support)
    purchaseHistory: PurchaseRecord[];

    // Estado de procesamiento
    isPurchasing: boolean;          // Para prevenir double-purchase
    lastPurchaseTime: number | null;
  };
}
```

### PurchaseRecord (History)
```typescript
interface PurchaseRecord {
  productId: string;                // ID del producto
  transactionId: string;            // ID único de la transacción
  purchaseDate: number;             // Timestamp de compra
  price: number;                    // Precio pagado
  currency: string;                 // Moneda (USD, EUR, etc.)
  platform: 'ios' | 'android';      // Plataforma
  receipt: string;                  // Receipt completo (para validation)
  validated: boolean;               // Si fue validado
  delivered: boolean;               // Si el beneficio fue entregado
}
```

### Product (Store Catalog)
```typescript
interface Product {
  productId: string;
  type: 'non-consumable' | 'consumable' | 'one-time';
  title: string;                    // Título localizado de la store
  description: string;              // Descripción localizada
  price: string;                    // Precio formateado (ej: "$0.99")
  currency: string;                 // Moneda
  localizedPrice: number;           // Precio numérico
  available: boolean;               // Si está disponible en esta región
}
```

## Reglas de Negocio

1. **Remove Ads es non-consumable**: Una vez comprado, nunca se puede comprar de nuevo
2. **Permanent Multiplier es non-consumable**: Una vez comprado, permanente forever
3. **Boosters son consumables**: Se pueden comprar múltiples veces
4. **Starter Packs son one-time**: Solo se pueden comprar UNA VEZ cada uno
5. **Boosters NO stackean entre sí**: 5x reemplaza 2x, no se suman
6. **Boosters SÍ stackean con otros multipliers**: permanent, prestige, ad boost
7. **Starter Pack resources son instantáneos**: Se otorgan inmediatamente al comprar
8. **Starter Pack CC rewards avanzan `blocksMined`**: Usan `creditCryptoCoins()` para convertir CC otorgados a bloques equivalentes según reward actual, respetando halvings y TOTAL_BLOCKS cap. Invariante: toda CC en el sistema tiene bloques minados correspondientes.
9. **No refunds en starter packs**: Recursos ya fueron usados, no se pueden revocar
9. **Restore Purchases solo restaura non-consumables**: Consumables no se restauran
10. **Receipt validation obligatoria**: Toda compra debe validar receipt antes de otorgar
11. **Pending transactions se procesan automáticamente**: Al iniciar app, finish pending
12. **Double purchase prevention**: No permitir comprar mientras hay purchase en progreso

## UI/UX Requirements

### Store/Shop Screen
- [ ] Tabs o secciones:
  - "Remove Ads"
  - "Boosters"
  - "Starter Packs"
- [ ] Cada producto muestra:
  - Icono grande
  - Nombre
  - Descripción del beneficio
  - Precio localizado
  - Botón de compra
  - Badge de estado (si aplicable)
- [ ] Botón "Restore Purchases" en header/settings

### Product Card (Template)
- [ ] Layout:
  - Icono/imagen (top)
  - Nombre (bold)
  - Descripción (2-3 líneas)
  - Beneficio highlight (box con color)
  - Precio (grande, prominente)
  - Botón de compra (CTA)
  - Badge (si purchased/owned)
- [ ] Estados del botón:
  - **Available**: Verde, "Buy for $X.XX"
  - **Purchased**: Gris, "Purchased" (non-consumable)
  - **Owned**: Gris, "Owned" (one-time)
  - **Processing**: Spinner, deshabilitado
  - **Unavailable**: Gris, "Not Available"

### Remove Ads Product Card
- [ ] Destacado visualmente (color especial, "Popular" badge)
- [ ] Icono: Ad blocker symbol
- [ ] Beneficio highlight:
  - "✓ No more banner ads"
  - "✓ No more interstitial ads"
  - "✓ Rewarded ads still available"
- [ ] Si purchased: Badge verde "Ads Removed"

### Booster Product Cards
- [ ] Icono: Lightning bolt / rocket
- [ ] Color: Dorado (2x), Violeta (5x), Arco iris (permanent)
- [ ] Beneficio highlight:
  - "2x production for 4 hours"
  - "5x production for 24 hours"
  - "Permanent 2x multiplier forever"
- [ ] Si booster activo: Badge "Active" con timer

### Starter Pack Product Cards
- [ ] Layout de grid (2 columnas)
- [ ] Badge "Best Value" en Mega Pack
- [ ] Badge "Most Popular" en Medium Pack
- [ ] Beneficio highlight:
  - "10K CryptoCoins + $500"
  - Iconos de coins y money
- [ ] Si purchased: Badge "Owned"

### Purchase Confirmation Dialog
- [ ] Título: Product name
- [ ] Descripción completa del beneficio
- [ ] Precio destacado
- [ ] Warning si es one-time o permanent
- [ ] Botones:
  - "Cancel" (secondary)
  - "Purchase" (primary, verde)

### Purchase Success Dialog
- [ ] Animación de celebración (confetti si es large purchase)
- [ ] Título: "Purchase Successful!"
- [ ] Descripción del beneficio otorgado
- [ ] Si es starter pack: "Received 10K CC + $500!"
- [ ] Botón: "Awesome!"

### Purchase Error Dialog
- [ ] Título: "Purchase Failed"
- [ ] Mensaje de error específico:
  - "Payment was cancelled"
  - "Payment method declined"
  - "Product not available"
  - "Already purchased"
- [ ] Botón: "OK"
- [ ] Link opcional: "Contact Support"

### Restore Purchases Flow
- [ ] Botón en Settings o Store screen
- [ ] Al presionar: Loading overlay "Restoring..."
- [ ] Success: Lista de productos restaurados
- [ ] Si no hay compras: "No purchases to restore"

### Active Booster Indicator (Top Bar)
- [ ] Similar al rewarded ad boost
- [ ] Badge con icono del booster
- [ ] Timer countdown
- [ ] Color según tipo:
  - Dorado: 2x
  - Violeta: 5x
  - Arco iris: Permanent (no timer, solo badge)
- [ ] Al tocar: Modal con detalles

## Validaciones

### Pre-Purchase
- [ ] Verificar que IAP está inicializado
- [ ] Verificar que producto está disponible
- [ ] Verificar que NO hay purchase en progreso (`isPurchasing = false`)
- [ ] Para non-consumable: verificar que NO está purchased
- [ ] Para one-time: verificar que NO está purchased
- [ ] Verificar conexión a internet

### During Purchase
- [ ] Marcar `isPurchasing = true`
- [ ] Deshabilitar botón de compra
- [ ] Timeout de 60 segundos (si no responde, allow retry)

### Post-Purchase
- [ ] Validar receipt (client-side)
- [ ] Verificar que product ID coincide
- [ ] Verificar que transaction ID es único (no duplicado)
- [ ] Otorgar beneficio correspondiente
- [ ] Guardar en purchase history
- [ ] Finalizar transacción: `finishTransaction()`
- [ ] Marcar `isPurchasing = false`
- [ ] Guardar estado en AsyncStorage

### Receipt Validation
- [ ] Transaction ID presente y no vacío
- [ ] Product ID coincide con producto comprado
- [ ] Timestamp razonable (no futuro, no muy antiguo)
- [ ] Platform (iOS/Android) coincide con device
- [ ] Receipt signature válido (si servidor implementado)

### State Integrity
- [ ] `removeAdsPurchased` debe ser boolean
- [ ] `permanentMultiplierPurchased` debe ser boolean
- [ ] `starterPacksPurchased.*` debe ser boolean
- [ ] `booster*.activatedAt` debe ser <= `Date.now()`
- [ ] Si booster activo, debe tener `activatedAt` y `expiresAt`
- [ ] `purchaseHistory` debe ser array (puede estar vacío)

## Dependencias

### NPM Packages
```json
{
  "react-native-iap": "^12.10.0",
  "@react-native-firebase/analytics": "^18.0.0"
}
```

### iOS Setup
- App Store Connect: Configurar productos IAP
- Agregar In-App Purchase capability en Xcode
- Configurar Tax/Banking en App Store Connect
- Crear productos en App Store Connect:
  - Non-Consumable: Remove Ads, Permanent Multiplier
  - Consumable: Boosters
  - Non-Consumable (one-time): Starter Packs (usar non-consumable con one-time flag)

### Android Setup
- Google Play Console: Configurar productos IAP
- Agregar billing permission a `AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="com.android.vending.BILLING" />
  ```
- Configurar productos en Google Play Console:
  - Managed products (non-consumable): Remove Ads, Permanent Multiplier, Starter Packs
  - Consumable products: Boosters

### Requiere
- `GameContext` - Para acceder y modificar iapState
- `AsyncStorage` - Para persistir purchase state
- `Firebase Analytics` - Para trackear purchases
- `Ad System` - Para verificar removeAdsPurchased

### Bloquea
- Ningún sistema (IAP es opcional)

### Relacionado con
- `Ad System` - Remove Ads deshabilita ads
- `Booster System` - IAP boosters son parte del sistema
- `Production System` - Boosters aplican multipliers

## Criterios de Aceptación

- [ ] IAP se inicializa correctamente en iOS y Android
- [ ] Productos se cargan con precios localizados
- [ ] Remove Ads se puede comprar y deshabilita ads
- [ ] Permanent Multiplier se puede comprar y aplica permanentemente
- [ ] Boosters se pueden comprar múltiples veces
- [ ] Starter Packs se pueden comprar solo una vez cada uno
- [ ] Restore Purchases restaura non-consumables correctamente
- [ ] Receipt validation previene fraud básico
- [ ] Purchase history se guarda correctamente
- [ ] Pending transactions se procesan automáticamente
- [ ] Errores se manejan gracefully sin crashes
- [ ] Todas las compras se trackean en Firebase Analytics

## Notas de Implementación

### Inicialización de IAP
```typescript
// src/services/IAPService.ts
import * as RNIap from 'react-native-iap';
import { IAP_CONFIG } from '../config/iapConfig';
import analytics from '@react-native-firebase/analytics';

class IAPService {
  private static instance: IAPService;
  private products: RNIap.Product[] = [];

  static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Connect to store
      await RNIap.initConnection();

      console.log('IAP initialized');

      // Clear transaction queue (iOS)
      if (Platform.OS === 'ios') {
        await RNIap.clearTransactionIOS();
      }

      // Load products
      await this.loadProducts();

      // Process pending transactions
      await this.processPendingTransactions();

      // Setup purchase listener
      this.setupPurchaseListener();

      analytics().logEvent('iap_initialized', {});
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      analytics().logEvent('iap_init_failed', { error: error.message });
    }
  }

  async loadProducts(): Promise<void> {
    try {
      const productIds = Object.values(IAP_CONFIG.productIds);

      const products = await RNIap.getProducts({ skus: productIds });

      this.products = products;

      console.log('Loaded products:', products);

      analytics().logEvent('iap_products_loaded', {
        count: products.length,
      });
    } catch (error) {
      console.error('Failed to load products:', error);
      analytics().logEvent('iap_products_load_failed', {
        error: error.message,
      });
    }
  }

  async processPendingTransactions(): Promise<void> {
    try {
      const availablePurchases = await RNIap.getAvailablePurchases();

      for (const purchase of availablePurchases) {
        console.log('Processing pending purchase:', purchase.productId);

        // Validate and deliver
        await this.validateAndDeliverPurchase(purchase);

        // Finish transaction
        await RNIap.finishTransaction({ purchase, isConsumable: false });
      }

      console.log('Processed pending transactions:', availablePurchases.length);
    } catch (error) {
      console.error('Failed to process pending transactions:', error);
    }
  }

  setupPurchaseListener(): void {
    const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: RNIap.ProductPurchase) => {
        console.log('Purchase updated:', purchase);

        try {
          // Validate receipt
          const isValid = await this.validateReceipt(purchase);

          if (!isValid) {
            throw new Error('Invalid receipt');
          }

          // Deliver purchase
          await this.validateAndDeliverPurchase(purchase);

          // Finish transaction
          const isConsumable = this.isConsumableProduct(purchase.productId);
          await RNIap.finishTransaction({ purchase, isConsumable });

          analytics().logEvent('iap_purchase_success', {
            product_id: purchase.productId,
            transaction_id: purchase.transactionId,
          });
        } catch (error) {
          console.error('Purchase failed:', error);
          analytics().logEvent('iap_purchase_failed', {
            product_id: purchase.productId,
            error: error.message,
          });
        }
      }
    );

    const purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: RNIap.PurchaseError) => {
        console.error('Purchase error:', error);

        if (error.code === 'E_USER_CANCELLED') {
          // User cancelled, don't show error
          analytics().logEvent('iap_purchase_cancelled', {});
        } else {
          // Show error to user
          Alert.alert('Purchase Failed', error.message);

          analytics().logEvent('iap_purchase_error', {
            code: error.code,
            message: error.message,
          });
        }
      }
    );

    // Store subscriptions for cleanup
    this.purchaseUpdateSubscription = purchaseUpdateSubscription;
    this.purchaseErrorSubscription = purchaseErrorSubscription;
  }

  async requestPurchase(productId: string): Promise<void> {
    try {
      await RNIap.requestPurchase({ sku: productId });
    } catch (error) {
      console.error('Failed to request purchase:', error);
      throw error;
    }
  }

  async validateReceipt(purchase: RNIap.ProductPurchase): boolean {
    // Client-side validation (basic)
    if (!purchase.transactionId || purchase.transactionId.length < 10) {
      return false;
    }

    if (!purchase.productId) {
      return false;
    }

    // TODO: Server-side validation
    // const response = await fetch(IAP_CONFIG.receiptValidation.serverEndpoint, {
    //   method: 'POST',
    //   body: JSON.stringify({ receipt: purchase.transactionReceipt }),
    // });

    return true;
  }

  async validateAndDeliverPurchase(purchase: RNIap.ProductPurchase): Promise<void> {
    const { productId } = purchase;

    // Deliver based on product type
    switch (productId) {
      case IAP_CONFIG.productIds.removeAds:
        // Dispatch to GameContext
        // gameContext.dispatch({ type: 'PURCHASE_REMOVE_ADS', purchase });
        break;

      case IAP_CONFIG.productIds.permanentMultiplier:
        // gameContext.dispatch({ type: 'PURCHASE_PERMANENT_MULTIPLIER', purchase });
        break;

      case IAP_CONFIG.productIds.booster2x:
        // gameContext.dispatch({ type: 'PURCHASE_BOOSTER_2X', purchase });
        break;

      case IAP_CONFIG.productIds.booster5x:
        // gameContext.dispatch({ type: 'PURCHASE_BOOSTER_5X', purchase });
        break;

      case IAP_CONFIG.productIds.starterSmall:
      case IAP_CONFIG.productIds.starterMedium:
      case IAP_CONFIG.productIds.starterLarge:
      case IAP_CONFIG.productIds.starterMega:
        // gameContext.dispatch({ type: 'PURCHASE_STARTER_PACK', productId, purchase });
        break;

      default:
        console.warn('Unknown product ID:', productId);
    }

    // Save to purchase history
    // gameContext.dispatch({ type: 'ADD_PURCHASE_TO_HISTORY', purchase });
  }

  isConsumableProduct(productId: string): boolean {
    return (
      productId === IAP_CONFIG.productIds.booster2x ||
      productId === IAP_CONFIG.productIds.booster5x
    );
  }

  async restorePurchases(): Promise<void> {
    try {
      const availablePurchases = await RNIap.getAvailablePurchases();

      if (availablePurchases.length === 0) {
        Alert.alert('Restore Purchases', 'No purchases to restore');
        return;
      }

      // Process each purchase
      for (const purchase of availablePurchases) {
        await this.validateAndDeliverPurchase(purchase);
      }

      Alert.alert(
        'Restore Purchases',
        `Successfully restored ${availablePurchases.length} purchase(s)`
      );

      analytics().logEvent('iap_restore_purchases', {
        count: availablePurchases.length,
      });
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      Alert.alert('Restore Failed', 'Could not restore purchases');

      analytics().logEvent('iap_restore_failed', {
        error: error.message,
      });
    }
  }

  cleanup(): void {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
    }

    RNIap.endConnection();
  }
}

export default IAPService;
```

### GameContext Actions
```typescript
// src/contexts/GameContext.tsx

// Action: PURCHASE_REMOVE_ADS
case 'PURCHASE_REMOVE_ADS':
  return {
    ...state,
    iapState: {
      ...state.iapState,
      removeAdsPurchased: true,
    },
  };

// Action: PURCHASE_PERMANENT_MULTIPLIER
case 'PURCHASE_PERMANENT_MULTIPLIER':
  return {
    ...state,
    iapState: {
      ...state.iapState,
      permanentMultiplierPurchased: true,
    },
  };

// Action: PURCHASE_BOOSTER_2X
case 'PURCHASE_BOOSTER_2X':
  const now2x = Date.now();
  const duration2x = 4 * 60 * 60 * 1000;

  return {
    ...state,
    iapState: {
      ...state.iapState,
      booster2x: {
        isActive: true,
        activatedAt: now2x,
        expiresAt: now2x + duration2x,
      },
      // Deshabilitar 5x si estaba activo (no stackean)
      booster5x: {
        isActive: false,
        activatedAt: null,
        expiresAt: null,
      },
    },
  };

// Action: PURCHASE_BOOSTER_5X
case 'PURCHASE_BOOSTER_5X':
  const now5x = Date.now();
  const duration5x = 24 * 60 * 60 * 1000;

  return {
    ...state,
    iapState: {
      ...state.iapState,
      booster5x: {
        isActive: true,
        activatedAt: now5x,
        expiresAt: now5x + duration5x,
      },
      // Deshabilitar 2x si estaba activo
      booster2x: {
        isActive: false,
        activatedAt: null,
        expiresAt: null,
      },
    },
  };

// Action: PURCHASE_STARTER_PACK
case 'PURCHASE_STARTER_PACK':
  const { productId } = action;
  const packType = productId.split('_')[1]; // 'small', 'medium', etc.
  const rewards = IAP_CONFIG.starterPackRewards[packType];

  return {
    ...state,
    cryptoCoins: state.cryptoCoins + rewards.cryptoCoins,
    realMoney: state.realMoney + rewards.realMoney,
    iapState: {
      ...state.iapState,
      starterPacksPurchased: {
        ...state.iapState.starterPacksPurchased,
        [packType]: true,
      },
    },
  };

// Action: ADD_PURCHASE_TO_HISTORY
case 'ADD_PURCHASE_TO_HISTORY':
  const { purchase } = action;

  const record: PurchaseRecord = {
    productId: purchase.productId,
    transactionId: purchase.transactionId,
    purchaseDate: purchase.transactionDate,
    price: purchase.transactionReceipt.price || 0,
    currency: purchase.transactionReceipt.currency || 'USD',
    platform: Platform.OS,
    receipt: purchase.transactionReceipt,
    validated: true,
    delivered: true,
  };

  return {
    ...state,
    iapState: {
      ...state.iapState,
      purchaseHistory: [...state.iapState.purchaseHistory, record],
    },
  };
```

## Testing

### Unit Tests
```typescript
describe('IAP System', () => {
  describe('canPurchaseStarterPack', () => {
    it('should return true if not purchased', () => {
      const state = {
        iapState: { starterPacksPurchased: { small: false } },
      };
      expect(canPurchaseStarterPack('small', state)).toBe(true);
    });

    it('should return false if already purchased', () => {
      const state = {
        iapState: { starterPacksPurchased: { small: true } },
      };
      expect(canPurchaseStarterPack('small', state)).toBe(false);
    });
  });

  describe('calculateActiveBooster', () => {
    it('should return 1.0 if no booster active', () => {
      const state = {
        iapState: {
          booster2x: { isActive: false },
          booster5x: { isActive: false },
        },
      };
      expect(calculateActiveBooster(state)).toBe(1.0);
    });

    it('should return 5.0 if 5x booster active', () => {
      const now = Date.now();
      const state = {
        iapState: {
          booster5x: { isActive: true, activatedAt: now },
          booster2x: { isActive: false },
        },
      };
      expect(calculateActiveBooster(state)).toBe(5.0);
    });

    it('should prioritize 5x over 2x', () => {
      const now = Date.now();
      const state = {
        iapState: {
          booster5x: { isActive: true, activatedAt: now },
          booster2x: { isActive: true, activatedAt: now },
        },
      };
      expect(calculateActiveBooster(state)).toBe(5.0);
    });
  });
});
```

### Integration Tests
```typescript
describe('IAP Purchase Flow', () => {
  it('should purchase Remove Ads and hide ads', async () => {
    const iapService = IAPService.getInstance();

    jest.spyOn(RNIap, 'requestPurchase').mockResolvedValue({
      productId: 'remove_ads',
      transactionId: 'test_123',
    });

    await iapService.requestPurchase('remove_ads');

    // Wait for purchase to process
    await waitFor(() => {
      expect(gameState.iapState.removeAdsPurchased).toBe(true);
    });

    // Banner should be hidden
    expect(element(by.id('banner-ad'))).not.toBeVisible();
  });
});
```

### E2E Tests
```typescript
describe('IAP E2E', () => {
  it('should complete purchase flow for starter pack', async () => {
    await device.launchApp();

    // Open store
    await element(by.id('store-tab')).tap();

    // Purchase Small Pack
    await element(by.id('buy-starter-small')).tap();

    // Confirm purchase
    await element(by.text('Purchase')).tap();

    // Wait for success
    await waitFor(element(by.text('Purchase Successful!')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify resources received
    const coins = await element(by.id('crypto-coins')).getText();
    expect(parseInt(coins)).toBeGreaterThanOrEqual(10000);

    // Verify pack marked as purchased
    await expect(element(by.text('Owned'))).toBeVisible();
  });
});
```

## Performance Considerations

- **IAP initialization**: < 1s (no bloquear app launch)
- **Product loading**: < 2s
- **Purchase processing**: < 5s (depende de network)
- **Receipt validation**: < 500ms (client-side)
- **Restore purchases**: < 3s

## Analytics

```typescript
analytics().logEvent('iap_purchase_success', {
  product_id: purchase.productId,
  price: purchase.price,
  currency: purchase.currency,
  transaction_id: purchase.transactionId,
});

analytics().logEvent('iap_purchase_failed', {
  product_id: productId,
  error_code: error.code,
  reason: error.message,
});

analytics().logEvent('iap_restore_purchases', {
  count: restoredCount,
});

analytics().logEvent('iap_revenue', {
  value: purchase.price,
  currency: purchase.currency,
  product_id: purchase.productId,
});
```

## Edge Cases

**Edge Case 1: Comprar booster mientras otro está activo**
- Input: 2x activo, compra 5x
- Expected: 5x reemplaza 2x, no stackean

**Edge Case 2: Restore purchases en device nuevo**
- Input: Usuario cambia de iPhone
- Expected: Remove Ads y Permanent Multiplier se restauran, Starter Packs NO

**Edge Case 3: Refund de Remove Ads**
- Input: Usuario solicita refund
- Expected: Sin backend, beneficio persiste (aceptable para Phase 1)

**Edge Case 4: Purchase durante offline**
- Input: Sin conexión, intenta comprar
- Expected: Error "No internet connection"

**Edge Case 5: Múltiples devices con misma cuenta**
- Input: Usuario usa 2 devices
- Expected: Non-consumables sincronizados, consumables independientes

## Preguntas Abiertas

- [ ] **Server-side receipt validation**: ¿Implementar backend para validación?
  - **Recomendación**: Phase 2+, esencial para prevenir fraud serio

- [ ] **Refund handling**: ¿Cómo manejar refunds sin backend?
  - **Recomendación**: Aceptar que algunos usuarios harán refund fraud (bajo impacto esperado)

- [ ] **Promotional pricing**: ¿Ofrecer descuentos temporales?
  - **Recomendación**: Phase 3+, requiere configuración en stores

- [ ] **Bundle deals**: ¿"Buy 3 boosters get 1 free"?
  - **Recomendación**: Phase 4+, complejo de implementar

- [ ] **Subscription model**: ¿"Premium subscription" mensual?
  - **Recomendación**: No, mantener one-time purchases

## Referencias

- react-native-iap Documentation: https://github.com/dooboolab-community/react-native-iap
- iOS StoreKit: https://developer.apple.com/documentation/storekit
- Google Play Billing: https://developer.android.com/google/play/billing
- Receipt Validation: https://developer.apple.com/documentation/appstorereceipts
- IAP Best Practices: https://developer.apple.com/app-store/subscriptions/best-practices/
