Audita el codebase en busca de valores de balance hardcodeados fuera de `balanceConfig.ts` y genera un reporte de violaciones.

## Qué buscar

### 1. Valores numéricos hardcodeados en lógica de juego
Busca números mágicos en estos directorios:
- `src/utils/` — lógica de negocio
- `src/components/` — componentes UI
- `src/data/gameData.ts` — datos de upgrades
- `src/data/hardwareData.ts` — datos de hardware
- `src/contexts/GameContext.tsx` — estado global

**Excepciones aceptables** (no reportar):
- `0` y `1` usados como índices o booleanos
- Valores en `src/config/balanceConfig.ts` (es el archivo correcto)
- IDs de versión, timestamps, coordenadas de UI
- Valores en tests

### 2. Patrones específicos a detectar
- Costos hardcodeados: números seguidos de contexto como `cost`, `price`, `$`
- Multiplicadores: números como `1.5`, `2.0`, `0.5` en cálculos de producción
- Thresholds de desbloqueo: condiciones como `> 200`, `>= 1000`, `=== 15`
- Tasas: porcentajes como `0.1`, `0.05` en lógica de mercado o electricidad
- Tiempos: intervalos en ms/segundos fuera de config

### 3. Verificar coherencia de balanceConfig.ts
Lee `src/config/balanceConfig.ts` y verifica:
- Todos los valores de hardware tienen entrada correspondiente
- Todos los upgrades tienen entrada correspondiente
- No hay valores duplicados o contradictorios entre secciones

## Formato del reporte

```
## Balance Review - [fecha]

### Violaciones encontradas
| Archivo | Línea | Valor | Contexto | Severidad |
|---------|-------|-------|----------|-----------|
| src/utils/marketLogic.ts | 45 | 0.1 | volatility calculation | Alta |

### Resumen
- Total violaciones: X
- Alta severidad: X (afectan mecánicas de juego)
- Media severidad: X (afectan UX pero no balance)

### Recomendaciones
[Lista de constantes a agregar en balanceConfig.ts]

### Estado de balanceConfig.ts
- Hardware levels cubiertos: X/X
- Upgrades cubiertos: X/X
- Inconsistencias: [lista]
```

## Después del reporte
Si se encuentran violaciones, preguntar si el usuario quiere:
1. Corregirlas todas automáticamente (mover a balanceConfig.ts)
2. Corregir solo las de alta severidad
3. Solo el reporte, sin cambios
