Agrega un nuevo upgrade al juego siguiendo el flujo definido en CLAUDE.md.

**Upgrade a agregar**: $ARGUMENTS

## Información requerida
Si no se especificó el upgrade, preguntar:
1. Nombre del upgrade
2. Tipo de efecto: `clickPower`, `production`, `costReduction`, o `prestige`
3. Target (si es `production`): ID de hardware específico o categoría (`cpu`, `gpu`, `asic`) o `all`
4. Multiplicador de efecto (ej: 2x, 1.5x)
5. Condición de desbloqueo (qué debe haber comprado/logrado el jugador)

## Proceso de implementación

### Paso 1: Leer archivos existentes
Lee estos archivos antes de modificar cualquiera:
- `src/config/balanceConfig.ts` — para ver el patrón de `UPGRADE_CONFIG`
- `src/data/gameData.ts` — para ver el patrón de `initialUpgrades`
- `src/data/translations.ts` — para ver el patrón de keys de upgrades
- `src/types/game.ts` — para verificar la interfaz `Upgrade`

### Paso 2: Diseñar el balance
Los upgrades cuestan **dinero real ($)**, no CryptoCoins. Para calcular un precio justo:
- Considera el multiplicador de efecto y cuánto produce el jugador en ese punto
- Revisa los precios de upgrades existentes para mantener coherencia
- Si hay duda, usa el agente `idle-game-economy-designer`

### Paso 3: Agregar a balanceConfig.ts
Agrega la entrada bajo `UPGRADE_CONFIG`. **Todos los valores numéricos van aquí**:
- `cost`: Precio en $ reales
- `multiplier`: Factor de mejora
- Cualquier threshold de desbloqueo numérico

### Paso 4: Agregar a gameData.ts
Agrega el objeto upgrade al array `initialUpgrades` en `src/data/gameData.ts`:
```typescript
{
  id: 'unique_id',
  nameKey: 'upgrade.<id>.name',
  descriptionKey: 'upgrade.<id>.description',
  cost: UPGRADE_CONFIG.<ID>.cost,
  effect: {
    type: 'production' | 'clickPower' | 'costReduction' | 'prestige',
    multiplier: UPGRADE_CONFIG.<ID>.multiplier,
    target: 'cpu' | 'gpu' | 'asic' | 'all' | '<hardwareId>'  // si aplica
  },
  unlockCondition: { /* condición */ },
  purchased: false
}
```

### Paso 5: Agregar traducciones
En `src/data/translations.ts`, agregar para los 3 idiomas (ES, EN, PT):
- `upgrade.<id>.name`
- `upgrade.<id>.description` — debe explicar el efecto claramente al jugador

## Verificación final
- [ ] Los valores están en `balanceConfig.ts`, no hardcodeados en `gameData.ts`
- [ ] El `unlockCondition` es alcanzable en el punto correcto de progresión
- [ ] Las 3 traducciones están completas (ES, EN, PT)
- [ ] El costo en $ es coherente con upgrades de nivel similar
- [ ] El `effect.type` es uno de los tipos válidos
- [ ] El upgrade aparece en el orden lógico dentro de `initialUpgrades`
