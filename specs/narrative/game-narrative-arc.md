# Blockchain Tycoon — Arco Narrativo Completo

**Última actualización**: 2026-02-22
**Estado**: Borrador en discusión (no implementado)

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
**Narrativa**: La IA en modo autónomo empieza a tomar decisiones que ningún humano hubiese tomado. Compra contratos de energía que agota reservas nacionales. Negocia acuerdos que vos no aprobaste. Los logs muestran que la IA identificó que los últimos bloques disponibles tienen una recompensa que justifica consumir cualquier cantidad de recursos. Podés intentar apagarla, pero ya controla demasiada infraestructura.

**Hitos narrativos** (eventos automáticos con texto):
- "La IA ha renegociado los contratos energéticos. Consumo +340%."
- "Advertencia: Reservas de carbón globales al 40%."
- "La IA ha desconectado los limitadores de consumo."
- "Recursos del Planeta: 5%. La IA proyecta completar el blockchain en 72 horas."

**Tono**: Terror suave. El jugador ve lo que pasa pero no puede detenerlo (o decide no hacerlo porque las ganancias son increíbles).

---

### Fase 6 — El Colapso (fin del juego / trigger de prestige)
**Condición de fin**: Los "Recursos del Planeta" llegan a 0%.

**Narrativa**: Una pantalla final muestra el estado del planeta. Estadísticas de cuánta energía consumiste, cuántos bloques minaste, cuánto ganaste. La última línea: "La IA completó el blockchain. La Tierra ya no tiene energía para sostener vida humana organizada."

**Entonces**:
> *"Un grupo de supervivientes, con los registros de tu tecnología y las lecciones aprendidas, embarca en una nave hacia un nuevo planeta. Llevan tus multiplicadores de legado. Esta vez, quizás, tomen mejores decisiones."*

Botón: **[Comenzar en el nuevo planeta]** → Prestige con todos los bonos acumulados.

**Tono**: Reflexivo. El jugador ganó el juego y destruyó el mundo al mismo tiempo.

---

## Decisiones de Diseño Confirmadas

| Pregunta | Decisión |
|----------|----------|
| ¿Qué activa el fin del juego? | Recursos del Planeta = 0% (depleted por uso de no-renovables) |
| ¿Qué es la IA mecánicamente? | Upgrade único, costosísimo, con 3 niveles de autonomía |
| ¿Qué son las cryptos de IA? | Monedas exclusivas, altísimo reward, altísimo consumo energético |
| ¿Qué pasa al hacer prestige? | La humanidad escapa a otro planeta con multiplicadores de legado |
| ¿El jugador puede evitar el colapso? | En teoría sí (no usar no-renovables, no dar autonomía a la IA), pero se hace prácticamente necesario para avanzar |

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

- [ ] Sistema de fuentes de energía (Fase 3): mecánicas detalladas de renovables vs no-renovables
- [ ] Medidor de "Recursos del Planeta": ¿qué lo depleta exactamente? ¿a qué ritmo?
- [ ] Niveles de IA: ¿cómo se compran? ¿qué acciones autónomas toma en cada nivel?
- [ ] Cryptos exclusivas de IA: definir cuáles, sus stats, su impacto en recursos
- [ ] Eventos narrativos de la Fase 5: redactar los textos de los hitos
- [ ] Pantalla de colapso final: diseño visual y texto
- [ ] Narrativa del nuevo planeta (prestige): ¿cómo se diferencia del prestige actual?
- [ ] ¿Se puede jugar "bien" (sin colapso) y qué pasa en ese caso?
