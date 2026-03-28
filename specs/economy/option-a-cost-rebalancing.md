# Opción A — Rebalanceo de Costos y Velocidades

## Estado
- **Fase**: Game Length Extension (Pre-Phase 4)
- **Estado**: ⚠️ Superseded by `bitcoin-faithful-economy.md`
- **Prioridad**: High
- **Última actualización**: 2026-03-28
- **Nota**: Los valores de esta spec fueron **superados** por el Economy Rebalance v2 (2026-03-27). Los valores actuales están en `balanceConfig.ts` y documentados en `bitcoin-faithful-economy.md`. Esta spec se mantiene como referencia histórica. Los costos reales implementados son significativamente menores a los propuestos aquí (ej: basic_cpu=$25 vs $500 propuesto).
- **Objetivo conjunto**: Alcanzar game length significativo por primera run
- **Contribución de esta opción**: ~2-3x slowdown en adquisición de hardware (posteriormente rebalanceado por bitcoin-faithful-economy)

## Descripción

El juego actualmente se completa en <1 hora porque los costos de hardware en `balanceConfig.ts` son significativamente menores que los valores diseñados en la spec de hardware-progression, y el `COST_MULTIPLIER` de 1.15 permite acumular muchas unidades sin barrera económica real.

Esta opción corrige tres problemas independientes:
1. **Costos base incorrectos**: Los valores en código divergieron de los diseñados (ej. `basic_cpu` costaba 100 en lugar de 500).
2. **COST_MULTIPLIER demasiado bajo**: 1.15 hace que unidad #50 cueste solo ~1083x más que la primera. Con 1.20, cuesta ~9100x más.
3. **MiningSpeed del late-game demasiado alta**: ASIC Gen 3 a 100 bloques/s con pocos units ya supera los 21M en tiempo muy corto.

Afecta **todas las partidas** (saves existentes y nuevas).

## Objetivos

- [ ] Corregir todos los `baseCost` en `balanceConfig.ts` para que coincidan con la progresión diseñada
- [ ] Aumentar costos de hardware late-game (ASIC Gen 1-3) ×5-10x sobre los valores corregidos
- [ ] Subir `COST_MULTIPLIER` de 1.15 a 1.20
- [ ] Reducir `miningSpeed` de los ASIC para que 5-10 unidades no trivialicen el endgame
- [ ] No modificar early-game (CPU, GPU) de forma que el arranque se sienta frustrantemente lento
- [ ] Documentar valores anteriores y nuevos para poder hacer rollback

## Valores Actuales vs Nuevos

### HARDWARE_CONFIG.COST_MULTIPLIER

| Parámetro | Valor actual | Valor nuevo | Impacto |
|-----------|-------------|-------------|---------|
| `COST_MULTIPLIER` | 1.15 | 1.20 | Unit #20 pasa de 16x a 38x el precio base |

**Efecto del cambio en costo acumulado** (ejemplo con baseCost 100):

| Unidades compradas | Con 1.15 | Con 1.20 |
|-------------------|----------|----------|
| 5ta unidad | ~175 | ~207 |
| 10ma unidad | ~405 | ~619 |
| 20ma unidad | ~1,637 | ~3,834 |
| 50ma unidad | ~108,366 | ~910,044 |

### HARDWARE_CONFIG.levels — Todos los campos

> **⚠️ NOTA**: Los valores "nuevo" de esta tabla fueron **superados** por `bitcoin-faithful-economy.md`. Los valores reales implementados en `balanceConfig.ts` son los de la columna "Implementado (actual)".

| Hardware | baseCost (esta spec) | Implementado (actual) | miningSpeed (esta spec) | Implementado (actual) |
|----------|---------------------|-----------------------|------------------------|-----------------------|
| manual_mining | 0 | 0 | 0.1 | 0.1 |
| basic_cpu | 500 | **25** | 0.3 | 0.3 |
| advanced_cpu | 2,500 | **150** | 0.8 | 0.8 |
| basic_gpu | 12,000 | **800** | 2.5 | 2.5 |
| advanced_gpu | 45,000 | **5,000** | 6 | 6 |
| asic_gen1 | 180,000 | **35,000** | 12 | 12 |
| asic_gen2 | 600,000 | **200,000** | 30 | 30 |
| asic_gen3 | 2,000,000 | **1,200,000** | 60 | 60 |

**Nota sobre electricityCost**: No se modifica en esta opción. La Opción C diseñará ese sistema por separado.

**Nota sobre blockReward**: No se toca. En Bitcoin real, la dificultad solo afecta el tiempo para encontrar el bloque (miningSpeed), no la recompensa por bloque. Esa es la mecánica que se mantiene aquí.

### Razonamiento por tier

**Early game (CPU, GPU)** — Se corrigen a los valores originales de la spec pero no se aumentan más. El arranque del juego ya funciona bien y no debe sentirse frustrante.

**ASIC Gen 1** (12x más caro, -20% speed)
Para que sea una meta que tome ~30-60 min en acumular las primeras 5 unidades, viniendo de advanced_gpu.

**ASIC Gen 2** (12x más caro, -25% speed)
El mid-late game. Tener 10 ASIC Gen 2 a 30 bloques/s = 300 bloques/s. Con 21M bloques necesitaría 70,000s ≈ 19h solo en esta fase — por eso Options C y D deben colaborar.

**ASIC Gen 3** (13x más caro, -40% speed)
Con 5 ASIC Gen 3 a 60 bloques/s = 300 bloques/s. El costo acumulado de las primeras 5 unidades con COST_MULTIPLIER 1.20:
- 1ra: 2,000,000
- 2da: 2,400,000
- 3ra: 2,880,000
- 4ta: 3,456,000
- 5ta: 4,147,200
- **Total: ~14.9M CryptoCoins**

Eso garantiza que llegar al ASIC Gen 3 sea un logro que tome horas.

## Impacto en Saves Existentes

Cuando un jugador con partida guardada carga el juego:
- Los valores de `owned` se mantienen (no se pierden unidades compradas)
- Los costos de la próxima compra se recalculan con los nuevos valores automáticamente (la fórmula usa `baseCost * multiplier^owned`, que referencia `balanceConfig.ts`)
- La producción (`miningSpeed`, `blockReward`) de units ya compradas refleja los nuevos valores al hacer `recalculateGameStats()`
- **Efecto posible**: Un jugador que ya tiene 20 ASIC Gen 3 se verá afectado en `miningSpeed` (de 100 a 60 por unidad), lo que reducirá su producción. Esto es esperado y aceptable.

## Fórmulas Afectadas

No se introducen nuevas fórmulas. Solo cambian las constantes en `balanceConfig.ts`. Las fórmulas existentes siguen siendo:

```typescript
// Costo de la próxima unidad (sin cambio de fórmula, solo de constantes)
Math.floor(hardware.baseCost * Math.pow(hardware.costMultiplier, hardware.owned))

// Producción total por hardware (sin cambio, miningSpeed nueva)
hardware.miningSpeed * hardware.owned * hardware.blockReward

// Ejemplo post-cambio, ASIC Gen 3 con 5 owned:
// 60 blocks/s * 5 = 300 blocks/s total
// 300 * 20 CC/block = 6,000 CC/s
```

## Archivos a Modificar

Solo un archivo:

```
src/config/balanceConfig.ts
```

Específicamente, las siguientes secciones:
- `HARDWARE_CONFIG.COST_MULTIPLIER`
- `HARDWARE_CONFIG.levels.basic_cpu.baseCost`
- `HARDWARE_CONFIG.levels.advanced_cpu.baseCost`
- `HARDWARE_CONFIG.levels.basic_gpu.baseCost`
- `HARDWARE_CONFIG.levels.advanced_gpu.baseCost`
- `HARDWARE_CONFIG.levels.asic_gen1.baseCost` y `.miningSpeed`
- `HARDWARE_CONFIG.levels.asic_gen2.baseCost` y `.miningSpeed`
- `HARDWARE_CONFIG.levels.asic_gen3.baseCost` y `.miningSpeed`

No se modifican componentes, utils, ni contextos.

## Reglas de Negocio

1. **Solo `balanceConfig.ts` se modifica**: Ningún valor de balance va hardcodeado en componentes.
2. **El early game no debe ser punitivo**: Basic CPU y Advanced CPU se ajustan para corregir errores históricos, no para hacerlos más difíciles.
3. **La forma de la curva se preserva**: Cada nivel cuesta ~5-15x el anterior, no se cambia la jerarquía relativa.
4. **blockReward no cambia**: La dificultad afecta solo miningSpeed (fidelidad al modelo Bitcoin real).
5. **No se introducen nuevas mecánicas**: Esta opción es puramente rebalanceo de constantes.

## Criterios de Aceptación

- [ ] `COST_MULTIPLIER` es 1.20 en `balanceConfig.ts`
- [ ] Todos los `baseCost` coinciden con la tabla de "Valores Actuales vs Nuevos"
- [ ] `asic_gen1.miningSpeed` es 12
- [ ] `asic_gen2.miningSpeed` es 30
- [ ] `asic_gen3.miningSpeed` es 60
- [ ] `npm test` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos
- [ ] Con las nuevas constantes, el costo de la 5ta ASIC Gen 3 es ~4.1M CryptoCoins
- [ ] Un jugador que empieza desde cero tarda más de 30 minutos en llegar a su primera ASIC Gen 1

## Testing

### Unit Tests a Actualizar

Los tests existentes que hardcodeen valores de balance deben actualizarse:

```typescript
// Buscar tests que usen valores hardcodeados y actualizar
describe('Hardware cost calculation', () => {
  it('should use updated COST_MULTIPLIER of 1.20', () => {
    const hardware = {
      baseCost: HARDWARE_CONFIG.levels.basic_cpu.baseCost, // 500
      owned: 10,
      costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,     // 1.20
    };
    const cost = calculateHardwareCost(hardware);
    // 500 * 1.20^10 = 500 * 6.1917 ≈ 3,096
    expect(cost).toBe(3096);
  });

  it('ASIC Gen 3 first unit costs 2,000,000', () => {
    const asic = hardwareProgression.find(h => h.id === 'asic_gen3')!;
    expect(asic.baseCost).toBe(2000000);
    expect(calculateHardwareCost({ ...asic, owned: 0 })).toBe(2000000);
  });

  it('ASIC Gen 3 miningSpeed is 60 per unit', () => {
    const asic = hardwareProgression.find(h => h.id === 'asic_gen3')!;
    expect(asic.miningSpeed).toBe(60);
  });
});
```

### Calibración Manual (Obligatoria Post-Implementación)

Ejecutar el juego con `GAME_SPEED = 10` (en balanceConfig) para simular 10x la velocidad y verificar:

| Checkpoint | Tiempo esperado real | Tiempo con GAME_SPEED=10 |
|-----------|---------------------|--------------------------|
| Primera ASIC Gen 1 | ~1h | ~6 min |
| Primera ASIC Gen 2 | ~3h | ~18 min |
| Primera ASIC Gen 3 | ~5h | ~30 min |
| 21M bloques | 10-15h (con todas las opciones) | ~60-90 min |

Si los tiempos difieren significativamente, ajustar `baseCost` de los ASICs proporcionalmente.

## Preguntas Abiertas

- [ ] **¿Notificar al jugador del rebalanceo?** Si tiene saves existentes, ¿mostrar un mensaje de "balance update"?
  - Recomendación: Solo si la reducción de `miningSpeed` es muy notoria para saves avanzados.

- [ ] **¿Calibración final antes o después de implementar B, C, D?**
  - Recomendación: Implementar A primero, calibrar con GAME_SPEED=10, luego continuar con B.

## Dependencias

### Requiere
- `balanceConfig.ts` (ya existe)

### No bloquea
- Opciones B, C, D son independientes y pueden implementarse en cualquier orden

### Relacionado con
- `specs/game-mechanics/hardware-progression.md` — Esta spec corrige la divergencia entre los valores documentados allí y los implementados
- `specs/economy/option-b-hardware-tiers.md` — Trabajarán juntos para extender el late game
- `specs/economy/option-c-electricity-constraint.md`
- `specs/economy/option-d-progressive-difficulty.md`
