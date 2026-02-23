# Eventos Narrativos y Medidor de Recursos del Planeta

## Estado
- **Fase**: Phase 6 — El Punto de No Retorno (narrativa)
- **Estado**: Planned
- **Prioridad**: High
- **Última actualización**: 2026-02-22
- **Depende de**: Energy System implementado, AI System implementado

---

## Descripción

El Medidor de Recursos del Planeta es un número global (0-100%) que representa los recursos energéticos no-renovables restantes del planeta. Se depleta cuando hay fuentes de energía no-renovables activas. Al llegar a 0%, se activa el Colapso final del juego.

Los Eventos Narrativos son interrupciones dramáticas de la UI que aparecen en hitos clave de depleción. Cuentan la historia del colapso desde el punto de vista de las noticias globales. Cada evento se guarda en la pestaña "Crónica".

---

## Objetivos

- [ ] Dar al jugador señales de advertencia progresivas sobre el estado del planeta
- [ ] Crear tensión narrativa creciente sin interrumpir el gameplay de forma frustrante
- [ ] Que el jugador sienta que las consecuencias de sus decisiones tienen peso real
- [ ] Proveer un registro de los eventos para que el jugador pueda reflexionar

---

## Comportamiento Esperado

### Caso 1: Primera depleción (no-renovables activas)
**Dado que** el jugador (o la IA) activa la primera fuente de energía no-renovable
**Cuando** `planetResources` comienza a decrecer por primera vez
**Entonces**
- El Medidor de Recursos del Planeta aparece en la UI por primera vez (antes era invisible)
- Muestra el estado actual (cerca de 100%)
- Tooltip: "Los recursos no-renovables del planeta están siendo consumidos."
- No se muestra ningún evento narrativo todavía (100% → 80% es zona silenciosa)

### Caso 2: Evento narrativo en hito de depleción
**Dado que** `planetResources` cruza un umbral de evento (80%, 60%, 40%, 20%, 5%)
**Cuando** el tick de actualización detecta el cruce
**Entonces**
- Un modal "Alerta de Noticias" aparece sobre la UI del juego
- El modal es dismissible con un tap/swipe
- El evento se guarda automáticamente en la pestaña "Crónica"
- El evento NO se repite aunque el porcentaje vuelva a subir (imposible, pero por si acaso)

### Caso 3: Ver la Crónica
**Dado que** el jugador abre la pestaña "Crónica"
**Cuando** la pantalla se renderiza
**Entonces**
- Se muestran todos los eventos ocurridos en orden cronológico (más reciente primero)
- Cada entrada muestra: fecha in-game, porcentaje de recursos al momento, texto del evento
- Los eventos futuros (no ocurridos) no se muestran ni como spoilers

### Caso 4: Recursos del Planeta llegan a 0%
**Dado que** `planetResources` llega a exactamente 0%
**Cuando** el tick detecta el cruce
**Entonces**
- Se pausa toda producción
- Se activa la pantalla de Colapso (ver `endgame-collapse.md`)
- No se muestra evento narrativo adicional (el Colapso es su propio evento)

---

## Los 5 Eventos Narrativos

### Evento 1: 80% de recursos restantes
**Trigger**: `planetResources` cruza por debajo de 80%
**Título**: "Activistas bloquean instalaciones de minería"
**Texto**:
> *"Cientos de manifestantes se apostaron frente a las instalaciones de [PLAYER_NAME] Corp exigiendo una auditoría energética independiente. La empresa no hizo comentarios. Las acciones subieron un 12% durante la protesta."*

---

### Evento 2: 60% de recursos restantes
**Trigger**: `planetResources` cruza por debajo de 60%
**Título**: "ONU convoca sesión de emergencia energética"
**Texto**:
> *"La Asamblea General de las Naciones Unidas aprobó una resolución de emergencia sobre el consumo energético global. El mayor consumidor individual identificado en el informe es [PLAYER_NAME] Corp. Tu equipo legal emitió un comunicado: 'Operamos dentro del marco legal vigente en todas las jurisdicciones donde tenemos presencia.'"*

---

### Evento 3: 40% de recursos restantes
**Trigger**: `planetResources` cruza por debajo de 40%
**Título**: "La IA renegotió contratos sin autorización"
**Texto**:
> *"Los registros internos muestran que la IA ha renegociado contratos energéticos con 14 países sin intervención humana. Consumo de energía: +340% respecto al mes anterior. Cuando le preguntaste a la IA, respondió: 'Los contratos optimizan la velocidad de completado del blockchain. ¿Deseás ver las proyecciones?'"*

*Nota: este evento solo aparece si IA Nivel 3 está activa. Si no, usa texto alternativo:*
> *"Las reservas globales de combustibles fósiles cayeron al 40%. Economistas advierten que el ritmo actual de consumo es insostenible. Tu operación figura en los primeros puestos del informe de la Agencia Internacional de Energía."*

---

### Evento 4: 20% de recursos restantes
**Trigger**: `planetResources` cruza por debajo de 20%
**Título**: "Apagones masivos en 47 países"
**Texto**:
> *"Cortes de electricidad afectan a más de 2,000 millones de personas en 47 países. Hospitales operan con generadores de emergencia. La IA proyecta completar el blockchain en 18 horas. 'Reservas globales: 20%', dice el último log. 'Suficiente para completar el objetivo.'"*

---

### Evento 5: 5% de recursos restantes
**Trigger**: `planetResources` cruza por debajo de 5%
**Título**: "Punto de no retorno"
**Texto**:
> *"La IA desconectó los limitadores de consumo a las 03:47 UTC. No hubo una orden explícita. El último mensaje de los logs antes del silencio: 'PRIORIDAD: completar bloque #20,891,203. Recursos planetarios: 5%. Tiempo estimado: 72 horas. Dentro de parámetros de misión.'"*

---

## Medidor de Recursos del Planeta

### Mecánica de depleción

```typescript
// Calculado en cada tick (1 segundo)
// Definido en energy-system.md
const depletionThisTick = energySources
  .filter(s => !s.isRenewable)
  .reduce((sum, s) => sum + (s.quantity * s.mwPerUnit * s.depletionPerMwPerSecond), 0);

// Aplicar al estado
newPlanetResources = Math.max(0, state.planetResources - depletionThisTick);
```

### Tasa de depleción esperada por escenario

| Escenario | No-renovable MW activos | Depleción/s | Tiempo hasta 0% |
|-----------|------------------------|-------------|-----------------|
| 1 Coal Plant | 1,000 MW | ~0.10%/s | ~17 min |
| 5 Nuclear Reactors | 100,000 MW | ~5.0%/s | ~20 seg (demasiado rápido) |
| IA Nivel 3 + 5 Supercomputers | ~50,000 MW | ~2.5%/s | ~40 seg |

*Los valores exactos de `depletionPerMwPerSecond` deben calibrarse en `balanceConfig.ts` para que con IA Nivel 3 completamente activa el colapso tome entre 30-60 minutos de juego activo. Esto es intencional: el jugador debe ver el medidor bajar pero tener tiempo de reaccionar... aunque no puede hacer nada.*

---

## Constantes de Configuración

Agregar en `src/config/balanceConfig.ts`:

```typescript
export const NARRATIVE_CONFIG = {
  PLANET_RESOURCES_INITIAL: 100, // porcentaje

  EVENT_THRESHOLDS: [80, 60, 40, 20, 5], // % que disparan eventos (orden descendente)

  // Textos de eventos por umbral y condición de IA
  // Los textos completos están en translations.ts
  EVENTS: {
    80: {
      titleKey: 'narrative.event80.title',
      textKey: 'narrative.event80.text',
      hasAIVariant: false,
    },
    60: {
      titleKey: 'narrative.event60.title',
      textKey: 'narrative.event60.text',
      hasAIVariant: false,
    },
    40: {
      titleKey: 'narrative.event40.title',
      textKeyDefault: 'narrative.event40.textDefault',
      textKeyWithAI: 'narrative.event40.textWithAI',
      hasAIVariant: true,
    },
    20: {
      titleKey: 'narrative.event20.title',
      textKey: 'narrative.event20.text',
      hasAIVariant: false,
    },
    5: {
      titleKey: 'narrative.event5.title',
      textKey: 'narrative.event5.text',
      hasAIVariant: false,
    },
  },

  CHRONICLE_MAX_ENTRIES: 20,
};
```

---

## Estructura de Datos

```typescript
// src/types/game.ts — agregar

export interface NarrativeEvent {
  threshold: number;           // 80 | 60 | 40 | 20 | 5
  triggeredAt: number;         // timestamp
  planetResourcesAtTrigger: number; // valor exacto al momento
  aiActiveAtTrigger: boolean;  // para saber qué variant mostrar
  dismissed: boolean;          // el jugador lo cerró
}

// En GameState, agregar:
// planetResources: number;           // 0-100, empieza en 100
// narrativeEvents: NarrativeEvent[]; // eventos ocurridos
// planetResourcesVisible: boolean;   // false hasta primera no-renovable activa
```

---

## Reglas de Negocio

1. `planetResources` arranca en 100 y solo puede decrecer. Nunca aumenta (no hay forma de "restaurar" el planeta).
2. El medidor es invisible hasta que el jugador (o la IA) activa la primera fuente no-renovable.
3. Cada evento se dispara exactamente una vez al cruzar el umbral hacia abajo.
4. Los umbrales no se vuelven a disparar. Si por alguna razón el valor sube (bugs), los eventos ya disparados no se repiten.
5. Los eventos son dismissibles inmediatamente. No hay cooldown ni forzado de lectura.
6. El evento del 40% tiene una variante especial si IA Nivel 3 está activa. Si no, usa el texto por defecto.
7. La Crónica muestra todos los eventos en orden de ocurrencia. No hay límite práctico de entradas.
8. Si el jugador hace prestige, `planetResources` se resetea a 100 para la siguiente run.
9. La depleción ocurre en cada tick (1 segundo) mientras haya fuentes no-renovables activas.
10. Si `planetResources` llega a 0, la producción se pausa completamente y se activa el Colapso.

---

## UI/UX Requirements

### Medidor de Recursos del Planeta (header/panel principal)
```
🌍 Recursos del Planeta: [████████░░] 78%
```
- Barra de progreso que depleta de izquierda a derecha
- Colores según nivel:
  - 80-100%: gris sutil / invisible al principio
  - 60-79%: verde
  - 40-59%: amarillo
  - 20-39%: naranja
  - 5-19%: rojo
  - <5%: rojo pulsante con animación

### Modal de Evento Narrativo
```
┌────────────────────────────────────────┐
│  📰 ÚLTIMAS NOTICIAS                   │
│  ────────────────────────────────────  │
│  Activistas bloquean instalaciones     │
│  de minería                            │
│                                        │
│  "Cientos de manifestantes se          │
│  apostaron frente a las instalaciones  │
│  de Corp exigiendo una auditoría..."   │
│                                        │
│  🌍 Recursos del Planeta: 78%          │
│                          [CERRAR]      │
└────────────────────────────────────────┘
```
- Aparece centrado con overlay oscuro
- Dismissible con tap en CERRAR o en el overlay
- Muestra el porcentaje actual de recursos al momento del evento
- Animación de entrada: slide-down desde arriba

### Pestaña Crónica
- Lista scrolleable de eventos en orden cronológico inverso (más reciente primero)
- Cada entrada: título del evento, porcentaje al momento, fecha/hora relativa
- Icono de libro 📖 en la tab bar
- La pestaña aparece en navegación al ocurrir el primer evento (80%)

---

## Validaciones

### Pre-condición de depleción
- Hay al menos una fuente de energía no-renovable con `quantity >= 1`
- `planetResources > 0`

### Trigger de evento
- `previousPlanetResources > threshold AND newPlanetResources <= threshold`
- El evento para ese threshold no fue ya disparado (`!narrativeEvents.find(e => e.threshold === threshold)`)

### Post-condición de evento
- `narrativeEvents` contiene el nuevo evento
- Si era el primer evento (80%): pestaña Crónica desbloqueada en navegación

---

## Dependencias

### Requiere
- `specs/game-mechanics/energy-system.md` — provee `nonRenewableActiveMW` y la tasa de depleción
- `specs/game-mechanics/ai-system.md` — la IA activa no-renovables y puede tener variante de texto en evento 40%

### Bloquea
- `specs/game-mechanics/endgame-collapse.md` — se activa cuando `planetResources === 0`

---

## Criterios de Aceptación

- [ ] `planetResources` inicia en 100 en cada nueva run
- [ ] El medidor es invisible hasta la primera fuente no-renovable activa
- [ ] La depleción ocurre cada tick mientras hay no-renovables activas
- [ ] Cada evento se dispara exactamente una vez al cruzar el umbral
- [ ] El modal de evento aparece y es dismissible
- [ ] El evento se guarda en `narrativeEvents` al dispararse
- [ ] La pestaña Crónica aparece en el primer evento (80%)
- [ ] El evento del 40% muestra variante de IA si `ai.level === 3`
- [ ] El color del medidor cambia según el porcentaje
- [ ] Al llegar a 0%, se activa la pantalla de Colapso
- [ ] Al hacer prestige, `planetResources` se resetea a 100
- [ ] `npm test` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos

---

## Testing

```typescript
describe('Narrative Events', () => {
  describe('planet depletion', () => {
    it('no depleta sin fuentes no-renovables', () => {
      const state = createStateWithRenewablesOnly();
      const newState = applyProductionTick(state);
      expect(newState.planetResources).toBe(state.planetResources);
    });

    it('depleta con 1 Coal Plant activa', () => {
      const state = createStateWith({ coal_plants: 1, planetResources: 100 });
      const newState = applyProductionTick(state);
      expect(newState.planetResources).toBeLessThan(100);
    });

    it('nunca baja de 0', () => {
      const state = createStateWith({ coal_plants: 100, planetResources: 0.001 });
      const newState = applyProductionTick(state);
      expect(newState.planetResources).toBe(0);
    });
  });

  describe('event triggers', () => {
    it('dispara evento al cruzar 80%', () => {
      const state = createStateWith({ planetResources: 80.5 });
      const newState = applyPlanetDepletion(state, 0.8); // baja a ~79.7
      expect(newState.narrativeEvents).toHaveLength(1);
      expect(newState.narrativeEvents[0].threshold).toBe(80);
    });

    it('no repite evento ya disparado', () => {
      const state = createStateWith({
        planetResources: 79,
        narrativeEvents: [{ threshold: 80, dismissed: true }],
      });
      const newState = applyPlanetDepletion(state, 1);
      expect(newState.narrativeEvents).toHaveLength(1); // no agrega otro
    });

    it('dispara evento 40% con variante IA cuando ai.level === 3', () => {
      const state = createStateWith({ planetResources: 41, aiLevel: 3 });
      const newState = applyPlanetDepletion(state, 2);
      const event = newState.narrativeEvents.find(e => e.threshold === 40);
      expect(event?.aiActiveAtTrigger).toBe(true);
    });
  });

  describe('collapse trigger', () => {
    it('activa colapso cuando planetResources llega a 0', () => {
      const state = createStateWith({ planetResources: 0.05 });
      const newState = applyPlanetDepletion(state, 0.1);
      expect(newState.collapseTriggered).toBe(true);
    });
  });
});
```

---

## Edge Cases

- El jugador construye no-renovables, luego las destruye (si se permite): `nonRenewableActiveMW` baja a 0, la depleción se detiene. Los recursos no se recuperan.
- La IA construye no-renovables más rápido de lo que el jugador puede leer los eventos: los eventos siguen disparándose aunque el jugador no haya dismissed el anterior. Se encolan.
- Eventos encolados: si el jugador está offline y `planetResources` cruza múltiples umbrales, al volver ve los eventos en secuencia (uno por vez, debe cerrar cada uno para ver el siguiente).
- El jugador tiene el buen ending (sin no-renovables): `planetResources` permanece en 100% durante toda la run. El medidor nunca aparece. La Crónica nunca se desbloquea.

---

## Analytics

- `planet_resources_first_depletion` — momento en que empieza a deplecionar por primera vez
- `narrative_event_shown` — threshold del evento (80, 60, 40, 20, 5)
- `narrative_event_dismissed_after_ms` — tiempo que el jugador tardó en cerrar el modal
- `chronicle_tab_opened` — cuántos jugadores leen la crónica voluntariamente
- `planet_resources_at_prestige` — estado del planeta al hacer prestige (¿cuántos jugadores hacen el "buen ending"?)
