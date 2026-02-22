Agrega un nuevo nivel de hardware al juego siguiendo el flujo de 5 pasos definido en CLAUDE.md.

**Hardware a agregar**: $ARGUMENTS

## Información requerida
Si no se especificó el nombre del hardware, preguntar:
1. Nombre del hardware (ej: "Quantum ASIC Miner")
2. Nivel en la progresión (qué hardware lo precede)
3. Categoría: `cpu`, `gpu`, o `asic`
4. Estadísticas propuestas (o pedir al agente `idle-game-economy-designer` que las calcule)

## Proceso de implementación

### Paso 1: Leer archivos existentes
Lee estos archivos antes de modificar cualquiera:
- `src/config/balanceConfig.ts` — para ver el patrón de niveles existentes
- `src/data/hardwareData.ts` — para ver el patrón de `hardwareProgression`
- `src/data/translations.ts` — para ver el patrón de keys de hardware
- `src/types/game.ts` — para verificar la interfaz `Hardware`

### Paso 2: Diseñar el balance
Si no se proporcionaron estadísticas, usa el agente `idle-game-economy-designer` para calcular valores consistentes con la curva existente. Los parámetros necesarios son:
- `baseCost`: Costo en $ del primer unit
- `baseProduction`: Hash rate (H/s)
- `blockReward`: CryptoCoins por bloque minado
- `miningSpeed`: Bloques por segundo
- `electricityCost`: Costo eléctrico por segundo
- `unlockRequirement`: Cuántas unidades del hardware anterior se necesitan (default: 5)

### Paso 3: Agregar a balanceConfig.ts
Agrega la entrada bajo `HARDWARE_CONFIG.levels` siguiendo el patrón existente. **Todos los valores numéricos van aquí**.

### Paso 4: Agregar a hardwareData.ts
Agrega la entrada al array `hardwareProgression` usando las constantes de `balanceConfig.ts`. Campos requeridos:
- `id`, `nameKey`, `descriptionKey`
- `baseCost`, `baseProduction`, `blockReward`, `miningSpeed`, `electricityCost`
- `level`, `category`, `unlockRequirement`

### Paso 5: Agregar traducciones
En `src/data/translations.ts`, agregar para los 3 idiomas (ES, EN, PT):
- `hardware.<id>.name`
- `hardware.<id>.description`

## Verificación final
- [ ] Los valores están en `balanceConfig.ts`, no hardcodeados en otros archivos
- [ ] El hardware aparece en `hardwareProgression` en el orden correcto de nivel
- [ ] Las 3 traducciones están completas (ES, EN, PT)
- [ ] El `unlockRequirement` apunta al hardware del nivel anterior
- [ ] La curva de costos es consistente con los niveles adyacentes
