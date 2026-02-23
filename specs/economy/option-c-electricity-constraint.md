# Opción C — Electricidad como Constraint Real

## Estado
- **Fase**: Game Length Extension (Pre-Phase 4)
- **Estado**: Planned
- **Prioridad**: High
- **Última actualización**: 2026-02-22
- **Objetivo conjunto**: Alcanzar 10-15h por primera run (combinado con Opciones A, B y D)
- **Contribución de esta opción**: Crear una decisión económica activa — si tu gasto de electricidad supera tus ingresos en $, tu hardware se apaga.

## Descripción

Actualmente `electricityCost` existe como campo en cada hardware pero su efecto es casi invisible: simplemente resta de la producción neta de CC. No hay consecuencia real de tener demasiado hardware caro.

Esta opción convierte la electricidad en una **barrera económica real**: si el jugador no puede pagar la factura eléctrica con dinero real ($), el hardware más caro se apaga automáticamente hasta que recupere el balance. El jugador necesita mantener una fuente de ingresos en $ (vendiendo CryptoCoins) proporcional a su consumo eléctrico.

Esto crea un loop de decisión:
```
Comprar más hardware → mayor electricityCost
→ necesito vender más CC para pagar electricidad
→ necesito mayor producción de CC para tener más para vender
→ necesito más hardware (loop)
```

En el endgame (Mining Farm, Quantum Miner, Supercomputer), los costos eléctricos son tan altos que el jugador debe gestionar activamente este balance.

## Mecánica Principal

### Facturación por Segundo

Cada segundo del tick del juego:
1. Se calcula el `totalElectricityCost` = suma de `electricityCost * owned` de todo hardware **online**
2. Se intenta deducir `totalElectricityCost` de `realMoney`
3. Si `realMoney >= totalElectricityCost` → se deduce y todo sigue igual
4. Si `realMoney < totalElectricityCost` → se activa el **modo de apagado de emergencia**

### Modo de Apagado de Emergencia

Cuando no hay suficiente dinero para pagar la electricidad:
1. Se ordena el hardware de mayor a menor `level`
2. Se marca como **offline** el hardware de mayor nivel, uno por uno, hasta que `totalElectricityCost` del hardware restante sea <= `realMoney` disponible
3. El hardware **offline**:
   - No mina bloques (no contribuye a `totalMiningSpeed`)
   - No genera CryptoCoins
   - No consume electricidad (no cuenta en el costo)
   - Se muestra con indicador visual "⚡ Sin energía"
4. La deducción se realiza con el nuevo `totalElectricityCost` ya reducido

### Recuperación Automática

Cada segundo, antes de la facturación:
1. Se revisa si hay hardware offline
2. Para cada hardware offline (de menor a mayor level), se verifica si pagar su electricityCost sería sostenible con el `realMoney` actual
3. Si sí, se vuelve a poner **online** automáticamente
4. El hardware se restaura en orden de menor a mayor cost (primero los más baratos de mantener)

### Ejemplo

```
Estado del jugador:
  realMoney:            $500
  ASIC Gen 3 × 5:       electricityCost = 100 × 5 = $500/s   [online]
  Mining Farm × 2:      electricityCost = 300 × 2 = $600/s   [online]
  totalElectricityCost: $1,100/s

Tick del juego:
  realMoney después de pagar: $500 - $1,100 = -$600 (déficit)

Apagado de emergencia:
  Hardware ordenado por level desc: [Mining Farm (level 9), ASIC Gen 3 (level 8)]
  → Apagar Mining Farm × 2: electricityCost pasa a $500/s
  → $500 - $500 = $0 (balance exacto, puede pagar)
  → Mining Farm queda OFFLINE

Estado resultante:
  ASIC Gen 3 × 5:   [online]   → sigue minando
  Mining Farm × 2:  [offline]  → muestra "⚡ Sin energía", no produce
  realMoney: $0 (deducidos $500)
```

## Estructura de Datos

### Cambio en `Hardware` interface (`src/types/game.ts`)

```typescript
interface Hardware {
  // ... campos existentes ...
  online: boolean;  // NUEVO: true si está activo, false si apagado por falta de electricidad
}
```

### Nuevos campos en `GameState` (`src/types/game.ts`)

```typescript
interface GameState {
  // ... campos existentes ...
  electricityDeficit: boolean;  // NUEVO: true si hay al menos un hardware offline por electricidad
  totalElectricityCost: number; // Ahora también es un campo derivado en el estado (era solo calculado)
  realMoneyPerSecond: number;   // NUEVO: ingresos reales en $ por segundo (promedio rolling 30s)
}
```

### Nueva acción en `GameContext.tsx`

```typescript
type GameAction =
  | // ... acciones existentes ...
  | { type: 'UPDATE_ELECTRICITY_STATUS' }  // NUEVO: evalúa y actualiza online/offline
```

## Fórmulas y Cálculos

### Cálculo de electricityCost total (solo hardware online)

```typescript
function calculateTotalElectricityCost(hardware: Hardware[]): number {
  return hardware
    .filter(hw => hw.online)
    .reduce((total, hw) => total + hw.electricityCost * hw.owned, 0);
}
```

### Algoritmo de apagado de emergencia

```typescript
function resolveElectricityDeficit(
  hardware: Hardware[],
  availableMoney: number
): Hardware[] {
  // Ordenar de mayor a menor level
  const sorted = [...hardware].sort((a, b) => b.level - a.level);
  let totalCost = calculateTotalElectricityCost(hardware);
  const result = hardware.map(hw => ({ ...hw }));

  for (const hw of sorted) {
    if (totalCost <= availableMoney) break;
    if (hw.owned === 0) continue;

    // Apagar este tipo de hardware completo
    const hwInResult = result.find(h => h.id === hw.id)!;
    if (hwInResult.online) {
      hwInResult.online = false;
      totalCost -= hw.electricityCost * hw.owned;
    }
  }

  return result;
}
```

### Algoritmo de recuperación automática

```typescript
function tryRestoreHardware(
  hardware: Hardware[],
  availableMoney: number
): Hardware[] {
  // Ordenar de menor a mayor level (restaurar los más baratos primero)
  const sorted = [...hardware]
    .filter(hw => !hw.online && hw.owned > 0)
    .sort((a, b) => a.level - b.level);

  let currentCost = calculateTotalElectricityCost(hardware);
  const result = hardware.map(hw => ({ ...hw }));

  for (const hw of sorted) {
    const costIfRestored = currentCost + hw.electricityCost * hw.owned;
    if (costIfRestored <= availableMoney) {
      result.find(h => h.id === hw.id)!.online = true;
      currentCost = costIfRestored;
    }
  }

  return result;
}
```

### Integración en el tick del juego (cada segundo)

```typescript
// En el reducer, case 'TICK' o donde se maneja el loop de 1 segundo:

// 1. Calcular costo eléctrico actual (solo online)
const electricityCost = calculateTotalElectricityCost(state.hardware);

// 2. ¿Puede pagar?
if (state.realMoney >= electricityCost) {
  // Pagar y restaurar hardware si había alguno offline
  let newHardware = tryRestoreHardware(state.hardware, state.realMoney - electricityCost);
  return {
    ...state,
    realMoney: state.realMoney - electricityCost,
    hardware: newHardware,
    electricityDeficit: false,
  };
} else {
  // Apagado de emergencia
  const newHardware = resolveElectricityDeficit(state.hardware, state.realMoney);
  const newElectricityCost = calculateTotalElectricityCost(newHardware);
  return {
    ...state,
    realMoney: state.realMoney - newElectricityCost,
    hardware: newHardware,
    electricityDeficit: true,
  };
}
```

### Modificación en `recalculateGameStats`

```typescript
// El miningSpeed total y la producción de CC solo cuenta hardware ONLINE
function recalculateGameStats(state: GameState): GameState {
  let totalMiningSpeed = 0;
  let cryptoCoinsPerSecond = 0;

  for (const hw of state.hardware) {
    if (!hw.online) continue;  // NUEVO: ignorar hardware offline

    const miningSpeed = calculateHardwareMiningSpeed(hw, state.upgrades);
    totalMiningSpeed += miningSpeed;
    cryptoCoinsPerSecond += miningSpeed * hw.blockReward;
  }

  // ... resto igual ...
}
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/types/game.ts` | Agregar `online: boolean` a `Hardware`; `electricityDeficit: boolean` y `realMoneyPerSecond: number` a `GameState` |
| `src/contexts/GameContext.tsx` | Agregar lógica de facturación en el tick; acción `UPDATE_ELECTRICITY_STATUS` |
| `src/utils/gameLogic.ts` | `calculateTotalElectricityCost` solo cuenta online; modificar `recalculateGameStats` |
| `src/utils/electricityLogic.ts` | **NUEVO**: funciones `resolveElectricityDeficit` y `tryRestoreHardware` |
| `src/components/HardwareList.tsx` | Mostrar indicador visual "⚡ Sin energía" en hardware offline |
| `src/data/hardwareData.ts` | Inicializar `online: true` en todos los hardware |
| `src/data/translations.ts` | Claves nuevas para UI de electricidad |

## UI/UX Requirements

### Hardware Card — Estado Offline

Cuando un hardware está offline:
- Mostrar icono "⚡" con texto "Sin energía" / "No power" / "Sem energia"
- Card oscurecida visualmente (opacity 0.5 o similar)
- Los stats de producción muestran "— CC/s" (no 0, sino guiones para indicar que no aplica)
- Botón "Buy" sigue disponible (puede comprar más, pero no producirán hasta restaurar)

### Indicador Global de Déficit Eléctrico

Cuando `electricityDeficit === true`, mostrar en algún lugar visible de la pantalla principal:
- Banner o badge: "⚡ Hardware sin energía — Vendé más monedas"
- Color: Amarillo/naranja (advertencia, no error)

### Panel de Electricidad (en Hardware tab)

Agregar al tope del tab Hardware un resumen:

```
⚡ Electricidad
Consumo: $1,100/s    Disponible: $500
[████████░░] 45% cubierto
```

- Si balance es positivo: barra verde
- Si hay deficit: barra roja con animación de pulso

### Traducciones

```typescript
// EN
'electricity.nopower': 'No power',
'electricity.deficit': 'Hardware offline — Sell more coins',
'electricity.consumption': 'Consumption',
'electricity.available': 'Available',
'electricity.covered': 'covered',

// ES
'electricity.nopower': 'Sin energía',
'electricity.deficit': 'Hardware sin energía — Vendé más monedas',
'electricity.consumption': 'Consumo',
'electricity.available': 'Disponible',
'electricity.covered': 'cubierto',

// PT
'electricity.nopower': 'Sem energia',
'electricity.deficit': 'Hardware offline — Venda mais moedas',
'electricity.consumption': 'Consumo',
'electricity.available': 'Disponível',
'electricity.covered': 'coberto',
```

## Reglas de Negocio

1. **El hardware se apaga por tipo completo**: Si ASIC Gen 3 va offline, todas sus unidades van offline (no solo algunas).
2. **El orden de apagado es de mayor a menor level**: Primero se apaga el hardware más caro/poderoso.
3. **El orden de restauración es de menor a mayor level**: Se restaura primero el hardware más barato de mantener.
4. **Hardware offline no consume electricidad**: El costo se recalcula solo con hardware online.
5. **Hardware offline no produce nada**: No mina bloques, no genera CC.
6. **El apagado es automático**: No requiere acción del jugador; se evalúa cada tick.
7. **La restauración es automática**: En cuanto el jugador tiene suficiente dinero, el hardware se enciende solo.
8. **El jugador siempre puede comprar hardware offline**: La compra no falla aunque esté sin energía.
9. **El Manual Mining nunca se apaga**: No tiene electricityCost = 0, siempre está online.
10. **El balance de realMoney no puede ir negativo por electricidad**: Si solo puede pagar parcialmente, el sistema apaga hardware hasta que el pago sea exacto o cero.

## Criterios de Aceptación

- [ ] `Hardware` interface incluye campo `online: boolean`
- [ ] `GameState` incluye `electricityDeficit: boolean`
- [ ] Cada tick, `totalElectricityCost * 1s` se deduce de `realMoney`
- [ ] Si `realMoney` no alcanza, hardware de mayor level se apaga primero
- [ ] Hardware offline no contribuye a `totalMiningSpeed` ni a `cryptoCoinsPerSecond`
- [ ] Hardware offline se muestra visualmente diferente en HardwareList
- [ ] Hardware offline se restaura automáticamente cuando el jugador tiene fondos
- [ ] `realMoney` nunca va negativo por deducción de electricidad
- [ ] Manual Mining nunca queda offline
- [ ] `npm test` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos

## Testing

```typescript
describe('Electricity Constraint System', () => {
  describe('resolveElectricityDeficit', () => {
    it('should turn off highest level hardware first', () => {
      const hardware = [
        { id: 'asic_gen3', level: 8, owned: 5, electricityCost: 100, online: true },
        { id: 'mining_farm', level: 9, owned: 2, electricityCost: 300, online: true },
      ];
      // totalCost = 500 + 600 = 1100, availableMoney = 200
      const result = resolveElectricityDeficit(hardware, 200);

      // Mining Farm (level 9) debería apagarse primero
      expect(result.find(h => h.id === 'mining_farm')!.online).toBe(false);
      // ASIC Gen 3 debería seguir online (500 <= 200? No... entonces también se apaga)
      // En este caso ambos se apagan porque 500 > 200
      expect(result.find(h => h.id === 'asic_gen3')!.online).toBe(false);
    });

    it('should leave cheap hardware online if affordable', () => {
      const hardware = [
        { id: 'basic_cpu', level: 2, owned: 10, electricityCost: 0.5, online: true },
        { id: 'mining_farm', level: 9, owned: 2, electricityCost: 300, online: true },
      ];
      // totalCost = 5 + 600 = 605, availableMoney = 10
      const result = resolveElectricityDeficit(hardware, 10);

      expect(result.find(h => h.id === 'mining_farm')!.online).toBe(false);
      expect(result.find(h => h.id === 'basic_cpu')!.online).toBe(true); // 5 <= 10
    });

    it('should not make realMoney negative', () => {
      const hardware = [
        { id: 'asic_gen3', level: 8, owned: 5, electricityCost: 100, online: true },
      ];
      const result = resolveElectricityDeficit(hardware, 50);
      // 500 > 50, se apaga todo
      expect(result.find(h => h.id === 'asic_gen3')!.online).toBe(false);
    });
  });

  describe('tryRestoreHardware', () => {
    it('should restore lowest level first', () => {
      const hardware = [
        { id: 'basic_cpu', level: 2, owned: 10, electricityCost: 0.5, online: false },
        { id: 'asic_gen3', level: 8, owned: 5, electricityCost: 100, online: false },
      ];
      // availableMoney = 10: solo puede pagar basic_cpu (5/s)
      const result = tryRestoreHardware(hardware, 10);

      expect(result.find(h => h.id === 'basic_cpu')!.online).toBe(true);
      expect(result.find(h => h.id === 'asic_gen3')!.online).toBe(false); // 5 + 500 = 505 > 10
    });
  });

  describe('Game tick integration', () => {
    it('should deduct electricity cost from realMoney each tick', () => {
      const state = createTestState({ realMoney: 1000, hardware: [basicCpuX10] });
      // basicCpuX10: electricityCost = 0.5 * 10 = 5/s
      const newState = gameReducer(state, { type: 'TICK' });
      expect(newState.realMoney).toBe(995);
    });

    it('should set electricityDeficit when cannot pay', () => {
      const state = createTestState({ realMoney: 0, hardware: [asicGen3X5] });
      const newState = gameReducer(state, { type: 'TICK' });
      expect(newState.electricityDeficit).toBe(true);
    });
  });
});
```

## Edge Cases

**Edge Case 1: realMoney exactamente igual al costo**
- `realMoney = 500`, `electricityCost = 500`
- Resultado: paga, realMoney = 0, todo online. Correcto.

**Edge Case 2: Solo manual mining**
- `manual_mining` tiene `electricityCost = 0`
- Nunca entra en apagado. Correcto.

**Edge Case 3: Comprar hardware mientras hay déficit**
- El jugador compra una Mining Farm adicional mientras hay deficit
- La nueva unidad entra como offline (no hay energía para pagarla)
- Cuando restaure fondos, la compra se activa automáticamente

**Edge Case 4: Apagado total (toda la electricidad inalcanzable)**
- `realMoney = 0`, todo el hardware tiene costo
- Todo se apaga excepto manual_mining
- El jugador debe vender CC manualmente para recuperarse

**Edge Case 5: Prestige con hardware offline**
- Al hacer prestige, el estado se resetea incluyendo hardware
- Todo hardware nuevo arranca `online: true` con 0 units

## Preguntas Abiertas

- [ ] **¿Hay período de gracia antes del apagado?**
  - Ej: antes de apagar, mostrar una advertencia por 10 segundos
  - Recomendación: No. El apagado inmediato es más dramático y enseña la mecánica más rápido.

- [ ] **¿El jugador puede apagar hardware manualmente para ahorrar electricidad?**
  - Un botón "Apagar" manual permitiría estrategias activas
  - Recomendación: No en esta iteración. Se puede agregar como feature de polish.

- [ ] **¿Se notifica con un achievement cuando el jugador experimenta su primer apagado?**
  - "Primera crisis energética" — achievement humorístico
  - Recomendación: Sí, fácil de agregar al achievement system existente.

## Dependencias

### Requiere
- `Opción A` — Los costos de electricidad de ASIC Gen 3 ($100/s) ya son manejables; con los nuevos tiers de Opción B, los costos escalan a $3,000/s, que es donde esta mecánica se vuelve relevante.
- `Opción B` — Sin los nuevos tiers, la electricidad nunca llega a ser un verdadero constraint.

### Relacionado con
- `Market System` — El jugador necesita vender CC para generar $
- `specs/economy/option-a-cost-rebalancing.md`
- `specs/economy/option-b-hardware-tiers.md`
- `specs/economy/option-d-progressive-difficulty.md`
