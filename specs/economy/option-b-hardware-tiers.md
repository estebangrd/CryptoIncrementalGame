# Opción B — Nuevos Tiers de Hardware (Endgame)

## Estado
- **Fase**: Game Length Extension (Pre-Phase 4)
- **Estado**: Implemented & Active
- **Prioridad**: High
- **Última actualización**: 2026-03-28
- **Objetivo conjunto**: Alcanzar 10-15h por primera run (combinado con Opciones A, C y D)
- **Contribución de esta opción**: Agregar 3 capas de contenido endgame que requieren horas para alcanzar

## Narrativa del Juego (Contexto)

El arco narrativo completo de Blockchain Tycoon es la historia de un minero que empieza de cero y termina consumiendo todos los recursos del planeta:

| Fase | Hardware | Narrativa |
|------|----------|-----------|
| Arranque | Manual, Basic CPU | Minero aficionado en su cuarto |
| Crecimiento | Advanced CPU, GPU | Emprendimiento serio, primera empresa |
| Corporación | ASIC Gen 1-3 | Megacorporación, contratos con gobiernos |
| Dominación | Mining Farm | Operación industrial que consume una ciudad entera |
| Trascendencia | Quantum Miner | Tecnología cuántica, viola las leyes de la física |
| Colapso | Supercomputer | Megaestructura planetaria, usa el núcleo de la Tierra |
| Fin del mundo | 21M bloques minados | "El planeta está agotado. El blockchain está completo." |
| Prestige | — | Reiniciás en un nuevo mundo con los bonus de tu legado |

Los nuevos tiers de esta opción cubren el tramo **Dominación → Colapso**. El "fin del mundo" ya existe (21M bloques = prestige), solo se enriquece narrativamente.

## Descripción

Actualmente el juego termina en ASIC Gen 3 (nivel 8). Una vez que el jugador tiene suficientes ASIC Gen 3, minar 21M bloques es solo esperar. Esta opción agrega 3 nuevos tiers que:
1. Extienden el late game con metas alcanzables pero costosas
2. Refuerzan la narrativa de "conquistar el planeta"
3. Escalan el `electricityCost` para preparar el terreno a la Opción C (donde la electricidad se vuelve un constraint real)
4. Mantienen `blockReward` decreciente (los bloques fáciles ya se minaron — ahora queda la roca más dura)

## Nuevos Tiers

### Nivel 9: Mining Farm 🏭

```typescript
{
  id: 'mining_farm',
  level: 9,
  baseCost: 8_000_000,       // $8M (real money)
  baseProduction: 50_000,    // Hash/s (cosmético)
  blockReward: 0,            // Deprecated: reward is global per era
  miningSpeed: 100,          // Bloques/segundo por unidad
  electricityCost: 4_500,    // CC fee weight
  energyRequired: 500,       // MW per unit
  unlockRequirement: 'asic_gen3 >= 5 owned',
}
```

**Narrativa**: Una instalación industrial dedicada exclusivamente a minar. Consume la energía eléctrica de una ciudad entera. Los periódicos empiezan a hablar de "el apagón cripto".

**Nota**: Requiere energía (500 MW/unidad) — primer hardware que activa el Energy System.

**Costo acumulado para 5 unidades** (con COST_MULTIPLIER 1.35):
- 1ra: $8,000,000
- 5ta: ~$26.5M
- **Total 5 units: ~$79.6M**

---

### Nivel 10: Quantum Miner ⚛️

```typescript
{
  id: 'quantum_miner',
  level: 10,
  baseCost: 50_000_000,      // $50M (real money)
  baseProduction: 200_000,   // Hash/s (cosmético)
  blockReward: 0,            // Deprecated: reward is global per era
  miningSpeed: 200,          // Bloques/segundo por unidad
  electricityCost: 15_000,   // CC fee weight
  energyRequired: 2_000,     // MW per unit
  unlockRequirement: 'mining_farm >= 5 owned',
}
```

**Narrativa**: Computadoras cuánticas que explotan la superposición para explorar millones de nonces simultáneamente. Los físicos dicen que es "técnicamente imposible". El jugador lo construyó igual.

**Costo acumulado para 5 unidades** (con COST_MULTIPLIER 1.35):
- 1ra: $50,000,000
- 5ta: ~$165.6M
- **Total 5 units: ~$497.7M**

---

### Nivel 11: Supercomputer 🌍

```typescript
{
  id: 'supercomputer',
  level: 11,
  baseCost: 500_000_000,     // $500M (real money)
  baseProduction: 1_000_000, // Hash/s (cosmético)
  blockReward: 0,            // Deprecated: reward is global per era
  miningSpeed: 600,          // Bloques/segundo por unidad
  electricityCost: 50_000,   // CC fee weight
  energyRequired: 10_000,    // MW per unit
  unlockRequirement: 'quantum_miner >= 5 owned',
}
```

**Narrativa**: Una megaestructura global que convierte la energía del núcleo terrestre en poder de cómputo. Los satélites muestran que las luces de las ciudades se están apagando. El usuario es oficialmente el mayor consumidor de energía en la historia de la humanidad.

**Costo acumulado para 5 unidades** (con COST_MULTIPLIER 1.35):
- 1ra: $500,000,000
- 5ta: ~$1.66B
- **Total 5 units: ~$4.98B**

---

## Tabla Completa de Progresión (Hardware Levels 1-11)

| Hardware | Level | baseCost ($) | miningSpeed | Electricity Weight | Energy (MW) |
|----------|-------|-------------|-------------|-------------------|-------------|
| manual_mining | 1 | 0 | 0.1 | 0 | — |
| basic_cpu | 2 | 25 | 0.3 | 3 | — |
| advanced_cpu | 3 | 150 | 0.8 | 10 | — |
| basic_gpu | 4 | 800 | 2.5 | 40 | — |
| advanced_gpu | 5 | 5,000 | 6 | 120 | — |
| asic_gen1 | 6 | 35,000 | 12 | 300 | — |
| asic_gen2 | 7 | 200,000 | 30 | 900 | — |
| asic_gen3 | 8 | 1,200,000 | 60 | 2,500 | — |
| mining_farm | 9 | 8,000,000 | 100 | 4,500 | 500 |
| quantum_miner | 10 | 50,000,000 | 200 | 15,000 | 2,000 |
| supercomputer | 11 | 500,000,000 | 600 | 50,000 | 10,000 |

*Nota: Los valores reflejan la implementación actual (`bitcoin-faithful-economy.md`). `blockReward` está deprecated — el reward es global por era. `electricityCost` es un CC fee weight. COST_MULTIPLIER: 1.35.*

## Análisis de Velocidad de Completado (Estimación)

Con 5 unidades de cada tier máximo disponible:

| Escenario | miningSpeed total | Tiempo para 21M bloques |
|-----------|-------------------|------------------------|
| 5× ASIC Gen 3 (sin opción B) | 300 bloques/s | ~19.4h |
| + 5× Mining Farm | 1,050 bloques/s | ~5.6h |
| + 5× Quantum Miner | 3,050 bloques/s | ~1.9h |
| + 5× Supercomputer | 8,050 bloques/s | ~43 min |

Esto muestra que la Opción D (dificultad progresiva) es **crítica** para que los tiers superiores no colapsen el tiempo de juego. Sin ella, el Supercomputer trivializa el endgame igual que lo hacía el ASIC Gen 3 original.

## Archivos a Modificar

### 1. `src/config/balanceConfig.ts`
Agregar bajo `HARDWARE_CONFIG.levels`:

```typescript
mining_farm: {
  baseCost: 8_000_000,
  baseProduction: 50_000,
  blockReward: 0,            // Deprecated: reward is global per era
  miningSpeed: 100,
  electricityCost: 4_500,    // CC fee weight
},
quantum_miner: {
  baseCost: 50_000_000,
  baseProduction: 200_000,
  blockReward: 0,
  miningSpeed: 200,
  electricityCost: 15_000,
},
supercomputer: {
  baseCost: 500_000_000,
  baseProduction: 1_000_000,
  blockReward: 0,
  miningSpeed: 600,
  electricityCost: 50_000,
},
```

### 2. `src/data/hardwareData.ts`
Agregar 3 entradas al array `hardwareProgression`:

```typescript
{
  id: 'mining_farm',
  nameKey: 'hardware.miningFarm',
  descriptionKey: 'hardware.miningFarmDesc',
  baseCost: HARDWARE_CONFIG.levels.mining_farm.baseCost,
  baseProduction: HARDWARE_CONFIG.levels.mining_farm.baseProduction,
  blockReward: HARDWARE_CONFIG.levels.mining_farm.blockReward,
  miningSpeed: HARDWARE_CONFIG.levels.mining_farm.miningSpeed,
  electricityCost: HARDWARE_CONFIG.levels.mining_farm.electricityCost,
  owned: 0,
  costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
  icon: '🏭',
  currencyId: 'cryptocoin',
  level: 9,
},
{
  id: 'quantum_miner',
  nameKey: 'hardware.quantumMiner',
  descriptionKey: 'hardware.quantumMinerDesc',
  baseCost: HARDWARE_CONFIG.levels.quantum_miner.baseCost,
  baseProduction: HARDWARE_CONFIG.levels.quantum_miner.baseProduction,
  blockReward: HARDWARE_CONFIG.levels.quantum_miner.blockReward,
  miningSpeed: HARDWARE_CONFIG.levels.quantum_miner.miningSpeed,
  electricityCost: HARDWARE_CONFIG.levels.quantum_miner.electricityCost,
  owned: 0,
  costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
  icon: '⚛️',
  currencyId: 'cryptocoin',
  level: 10,
},
{
  id: 'supercomputer',
  nameKey: 'hardware.supercomputer',
  descriptionKey: 'hardware.supercomputerDesc',
  baseCost: HARDWARE_CONFIG.levels.supercomputer.baseCost,
  baseProduction: HARDWARE_CONFIG.levels.supercomputer.baseProduction,
  blockReward: HARDWARE_CONFIG.levels.supercomputer.blockReward,
  miningSpeed: HARDWARE_CONFIG.levels.supercomputer.miningSpeed,
  electricityCost: HARDWARE_CONFIG.levels.supercomputer.electricityCost,
  owned: 0,
  costMultiplier: HARDWARE_CONFIG.COST_MULTIPLIER,
  icon: '🌍',
  currencyId: 'cryptocoin',
  level: 11,
},
```

### 3. `src/data/translations.ts`
Agregar en los 3 idiomas (ES, EN, PT):

```typescript
// EN
'hardware.miningFarm': 'Mining Farm',
'hardware.miningFarmDesc': 'An industrial facility consuming an entire city\'s power grid. The newspapers call it "the crypto blackout".',
'hardware.quantumMiner': 'Quantum Miner',
'hardware.quantumMinerDesc': 'Quantum computers exploiting superposition to explore millions of nonces at once. Physicists say it\'s impossible.',
'hardware.supercomputer': 'Supercomputer',
'hardware.supercomputerDesc': 'A planetary megastructure converting Earth\'s core energy into raw compute. The lights of cities are going out.',

// ES
'hardware.miningFarm': 'Granja de Minería',
'hardware.miningFarmDesc': 'Una instalación industrial que consume la red eléctrica de una ciudad entera. Los diarios hablan del "apagón cripto".',
'hardware.quantumMiner': 'Minero Cuántico',
'hardware.quantumMinerDesc': 'Computadoras cuánticas que explotan la superposición para explorar millones de nonces a la vez. Los físicos dicen que es imposible.',
'hardware.supercomputer': 'Supercomputadora',
'hardware.supercomputerDesc': 'Una megaestructura planetaria que convierte la energía del núcleo terrestre en poder de cómputo. Las luces de las ciudades se están apagando.',

// PT
'hardware.miningFarm': 'Fazenda de Mineração',
'hardware.miningFarmDesc': 'Uma instalação industrial que consome a rede elétrica de uma cidade inteira. Os jornais falam do "apagão cripto".',
'hardware.quantumMiner': 'Minerador Quântico',
'hardware.quantumMinerDesc': 'Computadores quânticos explorando superposição para testar milhões de nonces ao mesmo tempo. Físicos dizem que é impossível.',
'hardware.supercomputer': 'Supercomputador',
'hardware.supercomputerDesc': 'Uma megaestrutura planetária convertendo a energia do núcleo terrestre em poder computacional. As luzes das cidades estão se apagando.',
```

## Categoría de Upgrades para los Nuevos Tiers

Para que el sistema de upgrades existente reconozca las nuevas categorías, se debe agregar en `matchesHardware()` (en `gameLogic.ts`):

```typescript
// Categoría 'megascale' para Mining Farm, Quantum Miner, Supercomputer
if (target === 'megascale' && ['mining_farm', 'quantum_miner', 'supercomputer'].includes(hardware.id)) {
  return true;
}
```

Esto permite agregar upgrades futuros que afecten solo a los nuevos tiers.

## Reglas de Negocio

1. **Desbloqueo secuencial**: Mining Farm requiere 5× ASIC Gen 3, Quantum Miner requiere 5× Mining Farm, Supercomputer requiere 5× Quantum Miner.
2. **blockReward deprecated**: El reward es ahora global por era (ERA_BASE_PRICES) — ver `bitcoin-faithful-economy.md`. Todos los hardware tienen `blockReward: 0`.
3. **electricityCost como CC fee weight**: Los weights escalan agresivamente (4,500 / 15,000 / 50,000) y se multiplican por `ELECTRICITY_FEE_CONFIG.RATE_PERCENT` (1.5%) para calcular el CC deducido por tick.
4. **Requieren energía**: Los 3 nuevos tiers requieren MW del Energy System (500 / 2,000 / 10,000 MW por unidad).
5. **Compatibilidad con saves existentes**: Nuevos hardware aparecen en el save como `owned: 0`, se desbloquean normalmente.

## Criterios de Aceptación

- [ ] Los 3 nuevos hardware aparecen en `hardwareProgression` en orden de level (9, 10, 11)
- [ ] Los valores en `hardwareData.ts` leen de `balanceConfig.ts` (no hardcodeados)
- [ ] Mining Farm se desbloquea al tener 5 ASIC Gen 3
- [ ] Quantum Miner se desbloquea al tener 5 Mining Farm
- [ ] Supercomputer se desbloquea al tener 5 Quantum Miner
- [ ] Las traducciones existen en ES, EN y PT
- [ ] `matchesHardware()` reconoce la categoría `'megascale'`
- [ ] `npm test` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos

## Testing

```typescript
describe('New Hardware Tiers', () => {
  it('mining_farm should have correct values', () => {
    const farm = hardwareProgression.find(h => h.id === 'mining_farm')!;
    expect(farm.level).toBe(9);
    expect(farm.baseCost).toBe(8_000_000);
    expect(farm.miningSpeed).toBe(100);
    expect(farm.blockReward).toBe(0);
    expect(farm.electricityCost).toBe(4_500);
  });

  it('quantum_miner should have correct values', () => {
    const qm = hardwareProgression.find(h => h.id === 'quantum_miner')!;
    expect(qm.level).toBe(10);
    expect(qm.baseCost).toBe(50_000_000);
    expect(qm.miningSpeed).toBe(200);
    expect(qm.blockReward).toBe(0);
  });

  it('supercomputer should have correct values', () => {
    const sc = hardwareProgression.find(h => h.id === 'supercomputer')!;
    expect(sc.level).toBe(11);
    expect(sc.baseCost).toBe(500_000_000);
    expect(sc.miningSpeed).toBe(600);
    expect(sc.blockReward).toBe(0);
    expect(sc.electricityCost).toBe(50_000);
  });

  it('should unlock mining_farm after 5 asic_gen3', () => {
    const state = createTestState({ 'asic_gen3': 5 });
    expect(isHardwareUnlocked(state, getHardwareById('mining_farm'))).toBe(true);
  });

  it('should not unlock mining_farm with 4 asic_gen3', () => {
    const state = createTestState({ 'asic_gen3': 4 });
    expect(isHardwareUnlocked(state, getHardwareById('mining_farm'))).toBe(false);
  });

  it('matchesHardware should match megascale category', () => {
    const farm = hardwareProgression.find(h => h.id === 'mining_farm')!;
    expect(matchesHardware(farm, 'megascale')).toBe(true);
    expect(matchesHardware(farm, 'asic')).toBe(false);
  });
});
```

## Preguntas Abiertas

- [ ] **¿El Supercomputer debería tener un flavor text especial en la pantalla de prestige?**
  - Cuando el jugador hace prestige habiendo tenido un Supercomputer, mostrar texto diferente.
  - Recomendación: Sí, en una futura iteración de la spec de prestige.

- [x] **¿Agregar upgrades específicos para los nuevos tiers?**
  - ✅ Implementado (2026-03-14): 3 upgrades individuales en lugar de uno grupal:
    - `miningFarmEfficiency` ($500,000) → desbloquea al tener 10× Mining Farm, ×2 producción
    - `quantumCoherence` ($2,500,000) → desbloquea al tener 10× Quantum Miner, ×2 producción
    - `supercomputerOverclock` ($10,000,000) → desbloquea al tener 10× Supercomputer, ×2 producción
  - Nota: usan `target: 'hardware_id'` en lugar de categoría `'megascale'` (la lógica ya soporta targets por id).

- [ ] **¿El ícono 🌍 para Supercomputer es suficientemente claro?**
  - Alternativas: 🛸 (space-age), 💀 (apocalíptico), 🔮
  - Recomendación: Decidir en la revisión de UI.

## Dependencias

### Requiere
- `Opción A` implementada (para que los `baseCost` base sean correctos antes de agregar estos)
- `balanceConfig.ts` con los niveles de ASIC ya corregidos

### Crítico para
- `Opción D` (Progressive Difficulty): Sin este tier, la dificultad progresiva no tiene suficiente margen para actuar en el endgame

### Relacionado con
- `specs/economy/option-a-cost-rebalancing.md`
- `specs/economy/option-c-electricity-constraint.md`
- `specs/economy/option-d-progressive-difficulty.md`
- `specs/game-mechanics/hardware-progression.md` — Actualizar tabla de progresión
