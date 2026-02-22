Lee y analiza la spec indicada, luego implementa la feature completa siguiendo el proceso specs-driven del proyecto.

**Spec a implementar**: $ARGUMENTS

## Proceso obligatorio

### 1. Leer la spec
- Si se proporcionó una ruta, lee ese archivo
- Si no se proporcionó ruta, lista los archivos en `specs/` y pide al usuario que especifique cuál
- Lee también `specs/README.md` para entender el estado general

### 2. Analizar antes de tocar código
- Identifica todos los archivos que serán afectados según la sección "Notas de Implementación" de la spec
- Lee cada archivo relevante del codebase antes de modificarlo
- Verifica las dependencias declaradas en la spec
- Detecta conflictos con el código existente

### 3. Verificar prerequisites
- Confirma que las dependencias de la spec estén implementadas
- Si hay "Preguntas Abiertas" sin resolver en la spec, listarlas y preguntar antes de continuar

### 4. Implementar siguiendo la spec
Usa el agente `react-native-game-dev` para la implementación. La implementación debe:
- Seguir **exactamente** las fórmulas y constantes de la spec (sin inventar valores)
- Agregar todos los valores numéricos a `src/config/balanceConfig.ts` (NUNCA hardcodear)
- Implementar todas las interfaces TypeScript especificadas
- Seguir los patrones existentes del codebase (GameContext reducer, hooks, etc.)
- Agregar traducciones a `src/data/translations.ts` para ES, EN y PT

### 5. Verificar criterios de aceptación
Revisa cada checkbox de la sección "Criterios de Aceptación" de la spec y confirma cuáles están implementados.

### 6. Actualizar specs/README.md
Cambia el estado de la spec de `📝 Planned` a `🚧 In Progress` o `✅ Implemented` según corresponda.

## Reglas invariables
- **NUNCA** hardcodear valores de balance fuera de `balanceConfig.ts`
- **NUNCA** modificar la arquitectura sin pedirlo explícitamente
- **SIEMPRE** leer los archivos existentes antes de modificarlos
- Si la spec es ambigua en algo crítico, preguntar antes de asumir
