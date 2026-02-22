Compara las specs documentadas contra el código implementado y genera un reporte de estado actualizado.

## Proceso

### 1. Leer el estado declarado
Lee `specs/README.md` para obtener la lista de specs y su estado actual declarado.

### 2. Verificar cada spec contra el código
Para cada spec listada, determina su estado real inspeccionando el código:

**Señales de "Implementado":**
- Los tipos/interfaces de la spec existen en `src/types/game.ts`
- Las constantes de la spec existen en `src/config/balanceConfig.ts`
- Los archivos de lógica mencionados en "Notas de Implementación" existen y contienen la lógica
- Las traducciones necesarias están en `src/data/translations.ts`

**Señales de "Parcialmente implementado":**
- Algunos componentes existen pero faltan otros
- La lógica existe pero faltan casos edge
- Faltan traducciones o datos de configuración

**Señales de "No implementado":**
- Los archivos mencionados en la spec no existen
- Los tipos no están definidos
- Las constantes no están en balanceConfig.ts

### 3. Specs a revisar
Verifica estas specs en orden:
- `specs/game-mechanics/block-mining-system.md`
- `specs/game-mechanics/hardware-progression.md`
- `specs/game-mechanics/market-system.md`
- `specs/game-mechanics/prestige-system.md`
- `specs/economy/balance-and-formulas.md`
- `specs/ui-ux/game-flow.md`
- `specs/features/achievement-system.md`
- `specs/monetization/ad-system.md`
- `specs/monetization/iap-system.md`
- `specs/monetization/remove-ads-product.md`
- `specs/monetization/boosters-catalog.md`

### 4. Generar reporte

```
## Spec Status Report - [fecha]

### Estado por spec
| Spec | Estado Declarado | Estado Real | Delta |
|------|-----------------|-------------|-------|
| Block Mining | ✅ Implemented | ✅ Completo | — |
| Achievement System | 📝 Planned | 📝 No iniciado | — |

### Discrepancias encontradas
[Lista de specs donde el estado declarado no coincide con el real]

### Specs con implementación parcial
Para cada spec parcial, listar qué falta:
- **[Spec]**: Falta [componente/función/traducción]

### Próximas specs por implementar (por prioridad)
1. [Spec] — Fase X, Prioridad: Alta — Dependencias: [lista]
2. ...

### Sugerencia de siguiente paso
[Qué spec tiene sentido implementar primero y por qué]
```

### 5. Actualizar specs/README.md
Si se detectan discrepancias entre el estado declarado y el real, preguntar al usuario si quiere actualizar el README con los estados correctos.
