# Opción B — Nuevos Tiers de Hardware (Endgame)

## Estado
- **Fase**: Game Length Extension (Pre-Phase 4)
- **Estado**: Implemented & Active
- **Prioridad**: High
- **Última actualización**: 2026-03-04
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
  baseCost: 8_000_000,       // 8M CryptoCoins
  baseProduction: 50_000,    // Hash/s (cosmético)
  blockReward: 15,           // CC por bloque
  miningSpeed: 150,          // Bloques/segundo por unidad
  electricityCost: 300,      // $/segundo por unidad (ciudad entera)
  unlockRequirement: 'asic_gen3 >= 5 owned',
}
```

**Narrativa**: Una instalación industrial dedicada exclusivamente a minar. Consume la energía eléctrica de una ciudad entera. Los periódicos empiezan a hablar de "el apagón cripto".

**Producción por unidad**: 150 × 15 = 2,250 CC/s
**Comparación con ASIC Gen 3 (post-A)**: ASIC Gen 3 hace 60 × 20 = 1,200 CC/s. La Mining Farm hace +87.5% más, pero cuesta 4x más de baseCost.

**Costo acumulado para 5 unidades** (con COST_MULTIPLIER 1.20):
- 1ra: 8,000,000
- 2da: 9,600,000
- 3ra: 11,520,000
- 4ta: 13,824,000
- 5ta: 16,588,800
- **Total: ~59.5M CC**

---

### Nivel 10: Quantum Miner ⚛️

```typescript
{
  id: 'quantum_miner',
  level: 10,
  baseCost: 50_000_000,      // 50M CryptoCoins
  baseProduction: 200_000,   // Hash/s (cosmético)
  blockReward: 10,           // CC por bloque (los bloques fáciles se acabaron)
  miningSpeed: 400,          // Bloques/segundo por unidad
  electricityCost: 900,      // $/segundo (país entero)
  unlockRequirement: 'mining_farm >= 5 owned',
}
```

**Narrativa**: Computadoras cuánticas que explotan la superposición para explorar millones de nonces simultáneamente. Los físicos dicen que es "técnicamente imposible". El jugador lo construyó igual.

**Producción por unidad**: 400 × 10 = 4,000 CC/s
**Comparación con Mining Farm**: +78% más CC/s por unidad, costo baseCost 6.25x mayor.

**Costo acumulado para 5 unidades** (con COST_MULTIPLIER 1.20):
- 1ra: 50,000,000
- 2da: 60,000,000
- 3ra: 72,000,000
- 4ta: 86,400,000
- 5ta: 103,680,000
- **Total: ~372M CC**

---

### Nivel 11: Supercomputer 🌍

```typescript
{
  id: 'supercomputer',
  level: 11,
  baseCost: 300_000_000,     // 300M CryptoCoins
  baseProduction: 1_000_000, // Hash/s (cosmético)
  blockReward: 5,            // CC por bloque (casi no queda nada)
  miningSpeed: 1_000,        // Bloques/segundo por unidad
  electricityCost: 3_000,    // $/segundo (recursos del planeta)
  unlockRequirement: 'quantum_miner >= 5 owned',
}
```

**Narrativa**: Una megaestructura global que convierte la energía del núcleo terrestre en poder de cómputo. Los satélites muestran que las luces de las ciudades se están apagando. El usuario es oficialmente el mayor consumidor de energía en la historia de la humanidad.

**Producción por unidad**: 1,000 × 5 = 5,000 CC/s
**Comparación con Quantum Miner**: +25% CC/s por unidad, pero el verdadero valor está en la `miningSpeed` masiva (2.5x más rápido en minar bloques).

**Costo acumulado para 5 unidades** (con COST_MULTIPLIER 1.20):
- 1ra: 300,000,000
- 2da: 360,000,000
- 3ra: 432,000,000
- 4ta: 518,400,000
- 5ta: 622,080,000
- **Total: ~2.23B CC**

---

## Tabla Completa de Progresión (Hardware Levels 1-11)

| Hardware | Level | baseCost | miningSpeed | blockReward | CC/s por unidad | electricityCost |
|----------|-------|----------|-------------|-------------|-----------------|-----------------|
| manual_mining | 1 | 0 | 0.1 | 50 | 5 | 0 |
| basic_cpu | 2 | 500 | 0.3 | 45 | 13.5 | 0.5 |
| advanced_cpu | 3 | 2,500 | 0.8 | 42 | 33.6 | 1.2 |
| basic_gpu | 4 | 12,000 | 2.5 | 38 | 95 | 3 |
| advanced_gpu | 5 | 45,000 | 6 | 35 | 210 | 7 |
| asic_gen1 | 6 | 180,000 | 12 | 30 | 360 | 20 |
| asic_gen2 | 7 | 600,000 | 30 | 25 | 750 | 45 |
| asic_gen3 | 8 | 2,000,000 | 60 | 20 | 1,200 | 100 |
| mining_farm | 9 | 8,000,000 | 150 | 15 | 2,250 | 300 |
| quantum_miner | 10 | 50,000,000 | 400 | 10 | 4,000 | 900 |
| supercomputer | 11 | 300,000,000 | 1,000 | 5 | 5,000 | 3,000 |

*Nota: Los costos de los niveles 1-8 incluyen el rebalanceo de la Opción A.*

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
  blockReward: 15,
  miningSpeed: 150,
  electricityCost: 300,
},
quantum_miner: {
  baseCost: 50_000_000,
  baseProduction: 200_000,
  blockReward: 10,
  miningSpeed: 400,
  electricityCost: 900,
},
supercomputer: {
  baseCost: 300_000_000,
  baseProduction: 1_000_000,
  blockReward: 5,
  miningSpeed: 1_000,
  electricityCost: 3_000,
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
2. **blockReward decreciente**: Los bloques "fáciles" ya se minaron. Los nuevos tiers tienen blockReward más bajo (15, 10, 5) — se mina más rápido pero cada bloque vale menos CC.
3. **electricityCost como señal narrativa**: Los costos de electricidad escalan agresivamente (300, 900, 3000) para que la Opción C (constraint de electricidad) los afecte dramáticamente.
4. **Sin mecánica nueva**: Esta opción es solo datos (balanceConfig + hardwareData + translations). No requiere cambios en el reducer ni en la lógica.
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
    expect(farm.miningSpeed).toBe(150);
    expect(farm.blockReward).toBe(15);
    expect(farm.electricityCost).toBe(300);
  });

  it('quantum_miner should have correct values', () => {
    const qm = hardwareProgression.find(h => h.id === 'quantum_miner')!;
    expect(qm.level).toBe(10);
    expect(qm.baseCost).toBe(50_000_000);
    expect(qm.miningSpeed).toBe(400);
    expect(qm.blockReward).toBe(10);
  });

  it('supercomputer should have correct values', () => {
    const sc = hardwareProgression.find(h => h.id === 'supercomputer')!;
    expect(sc.level).toBe(11);
    expect(sc.baseCost).toBe(300_000_000);
    expect(sc.miningSpeed).toBe(1_000);
    expect(sc.blockReward).toBe(5);
    expect(sc.electricityCost).toBe(3_000);
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

- [ ] **¿Agregar upgrades específicos para los nuevos tiers?**
  - Un upgrade "Megascale Optimization" que duplique producción de los tiers 9-11.
  - Recomendación: Sí, pero como tarea separada post-implementación de las 4 opciones.

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
