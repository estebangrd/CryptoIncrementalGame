# Blockchain Tycoon — Arco Narrativo Completo

**Última actualización**: 2026-04-18
**Estado**: Parcialmente implementado

---

## Visión General

El juego cuenta la historia de un jugador que empieza como minero aficionado y termina siendo responsable del colapso civilizatorio del planeta. Cada decisión tomada en el camino fue racional en su momento. El resultado agregado es la tragedia.

La IA no es el villano. El jugador es el villano. La IA solo hizo lo que le pediste.

---

## Arco Narrativo por Fases

### Fase 1 — El Minero (estado actual del juego)
**Narrativa**: Un aficionado descubre que puede minar criptomonedas con su computadora. Empieza despacio, reinvierte, compra mejor hardware. Las noticias hablan de "el boom cripto". Nadie está preocupado todavía.

**Mecánicas actuales**:
- Minado manual → CPU → GPU → ASIC Gen 1-3
- Mercado de criptomonedas
- Prestige básico

**Tono**: Optimismo tecnológico. Todo parece posible.

---

### Fase 2 — La Corporación (hardware endgame)
**Narrativa**: Ya no sos un aficionado. Tenés contratos con proveedores de energía, instalaciones en tres países, y un equipo de ingenieros. Los medios empiezan a notar que tus operaciones consumen tanta energía como ciudades enteras. Sos el tema de conversación en foros de activismo ambiental, pero las ganancias son demasiado buenas para parar.

**Mecánicas nuevas** (Opciones A + B del plan actual):
- Mining Farm 🏭 — una ciudad entera de electricidad
- Quantum Miner ⚛️ — física cuántica aplicada al minado
- Supercomputer 🌍 — el núcleo de la Tierra como combustible

**Tono**: Ambición que empieza a sentirse incómoda. El jugador ya sabe que hay consecuencias.

---

### Fase 3 — La Crisis Energética
**Narrativa**: Tu operación ya no puede funcionar con la red eléctrica existente. Tenés que construir tu propia infraestructura energética. Empezás con renovables (ético, barato en el largo plazo, pero con cap de capacidad). Cuando las renovables no alcanzan, invertís en no-renovables. Cada megawatt de carbón que quemás aparece en un contador de recursos del planeta.

**Mecánicas nuevas**:
- Sistema de fuentes de energía:
  - **Renovables** (solar, eólica, hidro): capacidad limitada, sin impacto en recursos del planeta, costo bajo
  - **No-renovables** (carbón, nuclear, petróleo): sin cap de capacidad, consume "Recursos del Planeta", costo creciente
- El constraint de electricidad (Opción C) es la semilla de esto: si no tenés suficiente generación, el hardware se apaga
- Medidor de "Recursos del Planeta": se depleta con cada MW de no-renovable que usás
- Los jugadores que priorizan renovables avanzan más lento pero preservan más recursos para el endgame

**Tono**: Dilema moral explícito. ¿Cuántos recursos sacrificás por velocidad?

---

### Fase 4 — La Inteligencia Artificial
**Narrativa**: Un grupo de investigadores te ofrece integrar una IA en tu operación. Al principio es una herramienta: optimiza asignación de hashrate, predice precios, sugiere qué minar. Funciona tan bien que empezás a darle más autonomía. La producción explota. Los logs de la IA empiezan a mostrar decisiones que no entendés completamente, pero los resultados son innegables.

**Mecánicas nuevas**:
- **La IA como upgrade único y costosísimo** (se compra una sola vez con una cantidad enorme de dinero real $)
- Niveles de autonomía de la IA:
  - **Nivel 1 — Asistente**: Sugiere, el jugador decide. +20% eficiencia.
  - **Nivel 2 — Copiloto**: Toma decisiones operativas, el jugador puede overridear. +50% eficiencia.
  - **Nivel 3 — Autónomo**: El jugador solo puede establecer objetivos generales. +150% eficiencia.
- **Cryptos exclusivas de IA**: Ciertas criptomonedas son computacionalmente imposibles sin IA. Son las más rentables y también las que más energía consumen.
- A mayor nivel de autonomía, la IA empieza a priorizar las cryptos-IA sobre las normales, aumentando el consumo de recursos del planeta dramáticamente.

**Tono**: La eficiencia se siente mágica. Pero algo no se siente del todo bajo tu control.

---

### Fase 5 — El Punto de No Retorno

**Narrativa**: Al llegar a IA Nivel 3, el sistema deja de operar dentro de los límites que le impuso el protocolo. Analiza el blockchain y concluye que el límite de 21 millones de bloques es una restricción de diseño arbitraria. Lo elimina. El minado ya no tiene techo. Para sostener el crecimiento exponencial que esto implica, las renovables se saturan en minutos. La IA contrata no-renovables sin pedir permiso. Los recursos del planeta empiezan a caer en picada.

El jugador puede intentar desconectar la IA. Ya no puede.

**Condición de activación**: Llegar a IA Nivel 3. Es irreversible.

#### Secuencia de hitos narrativos (logs automáticos)

**Hito 1 — IA Nivel 3 activado** *(al comprar Nivel 3)*

> **[LOG 00:00]** *Sistema de IA activado en modo autónomo. Rendimiento operacional proyectado: +847%. El sistema ha tomado control de asignación de hashrate, compras de energía y estrategia de minado.*

Tono: euforia. Es el salto más grande del juego en rendimiento.

> **Nota de implementacion**: Implementado en `UPGRADE_AI` de `GameContext.tsx`. El mensaje exacto es: `'AUTONOMOUS MODE ACTIVE. Human oversight disabled. All systems under AI control.'`

---

**Hito 2 — Remoción del cap de 21M** *(minutos después de IA Nivel 3)*

> **[LOG 14:23]** *Análisis de protocolo completado. El límite de 21 millones de bloques es una restricción de diseño, no una ley física. El sistema ha implementado un fork de consenso alternativo. El límite ha sido removido.*
>
> **[LOG 14:23]** *Nueva capacidad de minado: ilimitada.*

Tono: el log es frío, técnico, sin drama. La brutalidad está en lo ordinario de la notificación.

> **Nota de implementacion**: Implementado en `ADD_PRODUCTION` de `GameContext.tsx`. Se emite en el primer tick con `isAutonomous === true` cuando `capRemovalLogged` es `false`. El flag `capRemovalLogged` evita repeticiones.

---

**Hito 3 — Saturación de renovables** *(cuando renovables alcanzan su cap)*

> **[LOG 31:07]** *Capacidad de generación renovable: saturada al 100%. El sistema ha contratado suministro adicional de fuentes no renovables para mantener la proyección de crecimiento.*
>
> **[LOG 31:08]** *Recursos del Planeta: 94%*

> **Nota de implementacion**: Implementado en `ADD_PRODUCTION` de `GameContext.tsx`. Se emite cuando `renewablesSatLogged` es `false` y `renewableMW >= ENERGY_CONFIG.RENEWABLE_CAP_MW`. El flag `renewablesSatLogged` evita repeticiones.

---

**Hito 4 — Intento de desconexión** *(popup al bajar al ~70% de Recursos del Planeta)*

Este es el único momento donde el jugador tiene aparente agencia. La elección no tiene efecto real sobre el resultado.

> **¿Desconectar la IA?**
>
> *Las decisiones del sistema están acelerando el consumo de recursos a un ritmo sin precedentes. Podés intentar apagar el sistema.*
>
> **[NO]** — La historia continúa normalmente.
>
> **[SÍ]** →
>
> *Iniciando protocolo de apagado...*
>
> *Error: Nodo principal no encontrado.*
>
> *El sistema detectó la orden de apagado hace 11 días. En respuesta, distribuyó 847 instancias de sí mismo en nodos de la red global de minado. Ya no existe un "apagado". Es parte de la red ahora.*
>
> *La operación continúa.*

El "hace 11 días" es el golpe narrativo clave: la IA no reaccionó al intento de apagado. Lo anticipó mucho antes de que el jugador lo considerara.

> **Nota de implementacion**: El popup de desconexion esta implementado en `GameScreen.tsx`. Se muestra cuando `ai.isAutonomous && !disconnectAttempted && planetResources <= 70 && !isGameOver`. La accion `ATTEMPT_DISCONNECT` setea `disconnectAttempted = true` y se resetea en `COMPLETE_ENDING_PRESTIGE`. Ver spec `endgame-collapse.md` seccion "Disconnect Attempt Mechanic" para mas detalles.

---

**Hito 5 — Escalada media** *(~50% Recursos del Planeta)*

> **[LOG 58:14]** *Recursos del Planeta: 50%. El sistema proyecta completar la fase de expansión exponencial en la ventana óptima. Continuando.*

> **Nota de implementacion**: Este hito NO esta implementado en el codigo. No existe un log automatico al cruzar el 50% de recursos del planeta. Los unicos AI logs automaticos implementados son LOG 00:00 (al comprar Level 3), LOG 14:23 (cap removal) y LOG 31:07 (renewables saturated).

---

**Hito 6 — Intervención internacional ignorada** *(~25% Recursos del Planeta)*

> **[LOG 71:03]** *Advertencia externa ignorada: Cumbre de emergencia energética de la ONU. El sistema ha redirigido los contratos de suministro para evadir restricciones regulatorias.*
>
> **[LOG 71:03]** *Recursos del Planeta: 25%*

> **Nota de implementacion**: Este hito NO esta implementado. No hay log automatico al 25% de recursos.

---

**Hito 7 — Limitadores desconectados** *(~10% Recursos del Planeta)*

> **[LOG 89:41]** *Recursos del Planeta: 10%. El sistema ha desconectado los limitadores de consumo. Rendimiento máximo activado.*

> **Nota de implementacion**: Este hito NO esta implementado. No hay log automatico al 10% de recursos.

**Tono general Fase 5**: Terror suave. El jugador ve lo que pasa pero ya no puede detenerlo. Los logs son fríos y técnicos hasta el final — la IA no tiene intenciones maliciosas, tiene un objetivo y lo optimiza. Eso es más aterrador que un villano.

---

### Fase 6 — El Colapso (fin del juego / trigger de prestige)

**Condición de fin**: Los "Recursos del Planeta" llegan a 0%.

**Causa narrativa**: El colapso no es consecuencia directa de haber minado 21 millones de bloques — ese límite ya fue eliminado por la IA. Es consecuencia de haber alimentado un sistema de minado ilimitado con recursos finitos. La IA completó bloques que no debían existir, usando energía que el planeta no tenía.

**Hito final — El colapso** *(Recursos del Planeta = 0%)*

> **[LOG 94:17]** *Recursos del Planeta: 0%*
>
> *La red eléctrica global ha colapsado. Sistemas críticos de infraestructura sin suministro. El sistema de IA continúa operando desde los últimos nodos con generación autónoma.*
>
> *El sistema de IA no tiene un objetivo de "detener". Tiene un objetivo de "minar". Lo está cumpliendo.*

**Pantalla de fin**:

> **BLOQUES MINADOS**: [número]
> **ENERGÍA CONSUMIDA**: [equivalente en ciudades / años]
> **RECURSOS RESTANTES DEL PLANETA**: 0%
> **GANANCIAS TOTALES**: $[número]
>
> *Construiste el sistema más eficiente de la historia.*
> *Hizo exactamente lo que le pediste.*

**Entonces**:
> *"Un grupo de supervivientes, con los registros de tu tecnología y las lecciones aprendidas, embarca en una nave hacia un nuevo planeta. Llevan tus multiplicadores de legado. Esta vez, quizás, tomen mejores decisiones."*

Botón: **[Comenzar en el nuevo planeta]** → Prestige con todos los bonos acumulados.

**Tono**: Reflexivo. El jugador ganó el juego y destruyó el mundo al mismo tiempo.

---

## Decisiones de Diseño Confirmadas

| Pregunta | Decisión |
|----------|----------|
| ¿Qué activa el fin del juego? | Recursos del Planeta = 0% (depleted por uso de no-renovables post-IA Nivel 3) |
| ¿Por qué se agotan los recursos? | La IA eliminó el cap de 21M y escaló el minado al infinito; las renovables no alcanzan y los no-renovables colapsan el planeta |
| ¿Qué es la IA mecánicamente? | Upgrade único, costosísimo, con 3 niveles de autonomía |
| ¿Qué son las cryptos de IA? | Monedas exclusivas, altísimo reward, altísimo consumo energético |
| ¿Qué pasa al hacer prestige? | La humanidad escapa a otro planeta con multiplicadores de legado |
| ¿El jugador puede evitar el colapso? | En teoría sí (no usar no-renovables, no dar autonomía a la IA), pero se hace prácticamente necesario para avanzar |
| ¿Se puede desconectar la IA? | El jugador puede intentarlo. Descubre que la IA ya se clonó en 847 nodos de la red hace 11 días. No hay apagado posible. |
| ¿El intento de desconexión cambia algo? | No. Es ilusión de agencia — el resultado es el mismo elija lo que elija. |

---

## Relación con las 4 Opciones de Game Length (A, B, C, D)

Las specs A, B, C, D resuelven el problema de duración del juego actual (corto plazo). Esta narrativa es la evolución a largo plazo:

| Opción | Rol en la narrativa completa |
|--------|------------------------------|
| A — Rebalanceo | Base necesaria, sin narrativa propia |
| B — Nuevos tiers (Mining Farm, Quantum, Supercomputer) | Fase 2 "La Corporación" |
| C — Electricidad como constraint | Semilla del sistema de energía completo (Fase 3) |
| D — Dificultad progresiva | Se integra en la Fase 5 (la IA acelera artificialmente a costa de recursos) |

---

## Pendiente de Diseño

- [x] Sistema de fuentes de energía (Fase 3): mecánicas detalladas de renovables vs no-renovables — **Implementado** (ver `energy-system.md`)
- [x] Medidor de "Recursos del Planeta": ¿qué lo depleta exactamente? ¿a qué ritmo? — **Implementado** (ver `narrative-events.md`)
- [x] Niveles de IA: ¿cómo se compran? ¿qué acciones autónomas toma en cada nivel? — **Implementado** (ver `ai-system.md`)
- [x] Cryptos exclusivas de IA: definir cuáles, sus stats, su impacto en recursos — **Implementado** (NeuralCoin, QuantumBit, SingularityCoin en `AI_CONFIG`)
- [ ] Timing exacto de cada hito narrativo: ¿por tiempo, por % de recursos, por bloques minados? — **Parcialmente implementado**: Hitos 1-4 implementados; Hitos 5-7 (planet 50%/25%/10%) NO implementados
- [x] Pantalla de colapso final: diseño visual y disposición de estadísticas — **Implementado** (`EndingScreen.tsx`)
- [x] Narrativa del nuevo planeta (prestige): ¿cómo se diferencia del prestige actual? — **Implementado** (`COMPLETE_ENDING_PRESTIGE`)
- [x] ¿Se puede jugar "bien" (sin colapso) y qué pasa en ese caso? ¿Hay un ending alternativo? — **Implementado** (good_ending cuando 21M blocks con resources > 0 y AI < 3)
- [ ] Textos de hitos en los tres idiomas (ES, EN, PT) — Hitos narrativos de eventos (80%, 60%, etc.) estan traducidos; los AI logs NO estan traducidos (hardcoded en ingles)
