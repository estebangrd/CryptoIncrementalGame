# Market — Narrativa y Reglas de Negocio

**Fecha:** 2026-03-29
**Estado:** Aprobado
**Scope:** Narrativa, reglas de negocio y decisiones de diseño. La implementación técnica queda para Claude CLI.

---

## Concepto central

El mercado de CryptoCoin no es un sistema neutral — es un espejo de lo que está pasando en el juego. El jugador que presta atención a la narrativa (halvings, crisis energética, IA) puede anticipar movimientos de precio y vender en mejores momentos. El que ignora la narrativa vende siempre al precio que toque.

---

## Moneda única

La única moneda del juego es **CryptoCoin (CC)**. Se eliminan BTC, ETH, DOGE y ADA. No tienen rol en la historia ni en la mecánica central — son decoración que agrega complejidad sin agregar decisiones reales.

Se elimina el sistema de exchange entre monedas (`exchangeRate`, `exchangeFee`, `exchangeLogic.ts`, UI de exchange en Market tab).

Las **AI Cryptos** (NeuralCoin, QuantumBit, SingularityCoin) son contenido de endgame futuro y no se modifican en este refactor. Su estado actual (dead code) permanece sin cambios.

---

## Cómo funciona el precio

El precio de CC tiene dos capas:

**Capa 1 — Oscilación orgánica (siempre activa)**
El precio fluctúa de forma orgánica alrededor de un valor base que crece con cada era (definida por halvings). Esta oscilación es impredecible en el corto plazo pero estable en el mediano. Motor: Price Engine OU existente (`priceEngine.ts`). No se modifica.

**Capa 2 — Eventos de mercado (situacionales)**
Eventos del juego modifican temporalmente el precio. Pueden coexistir varios eventos al mismo tiempo — sus efectos se multiplican entre sí (multiplicador compuesto).

El precio final que ve el jugador es: `precioOU × multiplicadorCompuestoEventos`.

---

## Eras y precios base

Cada halving inicia una nueva era con un precio base más alto. El jugador que mina más bloques tiene acceso a precios de venta más altos. Los valores por era están definidos en `BLOCK_CONFIG.ERA_BASE_PRICES` y no cambian.

---

## Eventos de mercado

### Cómo funcionan

Cada evento tiene:
- Un **multiplicador de precio** (positivo o negativo respecto al precio actual)
- Una **duración** (temporal o permanente hasta cancelación)
- Un **label** visible bajo el chart cuando está activo
- Un **trigger** — la condición del juego que lo activa

Cuando hay múltiples eventos activos, sus multiplicadores se combinan multiplicativamente.

**Reglas:**
- Un mismo evento no puede estar activo dos veces simultáneamente (no se duplica)
- Si un evento temporal ya está activo y se intenta activar de nuevo, se extiende su duración (refresh)
- Los eventos permanentes (`duration: -1`) solo se cancelan explícitamente
- Al iniciar una nueva run (prestige o ending), todos los eventos de mercado se limpian
- Los multiplicadores deben tener traducciones para los 3 idiomas (ES/EN/PT)

### Tabla de eventos

| ID | Trigger | Efecto | Duración | Label EN | Label ES | Label PT |
|----|---------|--------|----------|----------|----------|----------|
| `halving_anticipation` | Faltan ≤ 10.000 bloques para el próximo halving | +25% | Hasta el halving (se cancela al producirse) | Halving incoming | Halving inminente | Halving iminente |
| `halving_shock` | Inmediatamente después del halving | −25% | 5 minutos | Post-halving correction | Corrección post-halving | Correção pós-halving |
| `market_spike` | El jugador activa el **ad booster** de precio | +25% | 10 minutos | Market spike | Alza de mercado | Alta do mercado |
| `blackout_regional` | Se dispara automáticamente con el Local Protest (recursos ≤ 66%) | −9% | 6 minutos | Regional blackout | Apagón regional | Apagão regional |
| `ai_autonomous` | El jugador compra AI Level 3 | +15% | Permanente | AI trading active | IA operando en mercado | IA operando no mercado |
| `planetary_collapse_incoming` | Recursos planetarios ≤ 20% | −40% | Permanente | Market panic | Pánico de mercado | Pânico de mercado |
| `whale_dump` | Aleatorio (~4% por minuto) | −15% | 4 minutos | Whale dump | Venta masiva | Venda massiva |
| `media_hype` | Aleatorio (~4% por minuto) | +18% | 5 minutos | Media hype | Euforia mediática | Euforia mediática |

---

### Narrativa de cada evento

**Halving anticipation** (+25%, hasta el halving)
El mercado anticipa la reducción de oferta. Los miners grandes venden antes del halving para maximizar al precio pico. Para el jugador es la mejor ventana de venta del ciclo — si llega al halving sin haber vendido, el shock lo castiga.

**Halving shock** (−25%, 5 min)
La corrección clásica post-halving. El precio cae abruptamente y luego se recupera gradualmente hacia el nuevo precio base de la era siguiente (más alto). El jugador que sobrevive el shock sin vender se beneficia del nuevo piso.

**Market spike** (+25%, 10 min)
Volatilidad extrema positiva, activada por el jugador al ver un ad. Es la única forma de que el jugador influya directamente en el precio visible. El timing importa — vender durante el spike maximiza los ingresos. **Nota:** este evento es independiente del IAP Market Pump ($0.99, ×2 invisible en venta, 30 min). El IAP no se modifica y opera en una capa separada (multiplicador directo en SELL_COINS_FOR_MONEY). Si ambos están activos, stackean.

**Regional blackout** (−9%, 6 min)
Se activa automáticamente cuando el Local Protest se dispara (recursos ≤ 66%). El apagón que causó la operación del jugador genera desconfianza en el mercado. Efecto menor pero acumulable con otros eventos negativos. Ver sección "Local Protest mejorado" para la mecánica completa.

**AI trading active** (+15%, permanente)
Cuando la IA alcanza nivel 3 y opera de forma autónoma, el mercado reacciona positivamente — la IA es percibida como un actor sofisticado que optimiza el trading. Paradójicamente, este boost de precio coexiste con el colapso inminente del planeta. El jugador gana más por CC justo cuando está destruyendo el planeta más rápido.

**Market panic** (−40%, permanente)
Cuando los recursos del planeta caen al 20%, el mercado anticipa el colapso. El precio de CC se desploma porque nadie quiere una criptomoneda de un planeta sin energía. Este evento es irreversible dentro del run — el jugador que tiene CC sin vender cuando se activa pierde valor masivamente. Es la señal más clara de que el ending malo se acerca.

**Whale dump** (−15%, 4 min, aleatorio)
Un actor grande liquida posición. Imprevisible — puede aparecer en cualquier momento, incluido durante un halving anticipation o un market spike, complicando la decisión de venta.

**Media hype** (+18%, 5 min, aleatorio)
Cobertura mediática positiva genera demanda. También imprevisible. Puede ser la diferencia entre una venta mediocre y una excelente si coincide con un halving anticipation.

---

## Local Protest mejorado

El Local Protest existente (trigger: recursos ≤ 66%) pasa de ser puramente narrativo a tener consecuencias mecánicas reales.

**Trigger:** Sin cambio — recursos planetarios ≤ 66%, una sola vez por run.

**Market event automático:** Al dispararse el Local Protest, se activa `blackout_regional` inmediatamente. El mercado reacciona al apagón sin importar lo que elija el jugador.

**Decisión del jugador (nuevo):**

1. **Aceptar racionamiento** — la capacidad energética total se reduce un 20% durante 30 minutos. El hardware que se quede sin energía se apaga (usa el sistema de shutdown por tier existente — hardware de mayor tier se apaga primero). Gratis pero pierde producción.

2. **Pagar compensación** — paga un monto en $ (a definir con economics agent según el stage del jugador). Sin penalización energética. La operación continúa normal.

**Narrativa:** "Tu operación consumió el X% de la capacidad eléctrica regional. Tres comunidades cercanas reportaron apagones de 6 horas. Grupos ambientalistas iniciaron una campaña en tu contra."

El jugador que elige racionamiento sufre doble impacto: menos producción (por energía reducida) Y peor precio de venta (por el market event blackout_regional). El que paga solo pierde cash pero el market event se activa igual.

---

## Separación IAP Market Pump vs Ad Booster

Son dos productos independientes:

| Booster | Fuente | Efecto | Visible en chart | Duración | Scope |
|---------|--------|--------|-----------------|----------|-------|
| **Market Pump** (IAP $0.99) | Compra pagada | ×2 al vender | No — multiplicador invisible en SELL_COINS_FOR_MONEY | 30 min | No se modifica |
| **market_spike** (ad booster) | Ver un ad gratuito | +25% precio visible | Sí — label en chart + afecta precio OU | 10 min | Nuevo, parte de este refactor |

Si ambos están activos, stackean. El jugador ve +25% en el chart y además recibe ×2 en la transacción. Cada uno cumple lo prometido desde su fuente.

---

## La decisión de cuándo vender

Esta es la decisión central del Market. El jugador tiene que equilibrar:

- **Necesidad de liquidez** — necesita $ para comprar hardware y progresar
- **Estado del precio** — ¿hay un evento positivo activo? ¿se acerca un halving?
- **Riesgo de acumular CC** — si el precio cae mientras tiene mucho stock, pierde valor

El jugador nunca tiene información perfecta. Los eventos aleatorios (`whale_dump`, `media_hype`) garantizan que siempre haya incertidumbre, incluso si entiende todos los eventos deterministas.

---

## La IA y el mercado

> **Nota:** Esta sección describe la narrativa aspiracional. La implementación actual de AI Levels 1-2 es solo flavor text en el AI Log + multiplicador de producción pasivo. Solo AI Level 3 tiene comportamiento autónomo real (auto-construye energía no renovable). No se modifica el comportamiento actual de la IA en este refactor — solo se agrega el market event `ai_autonomous` al comprar Level 3.

**AI Level 1 (Asistente)** — la IA sugiere momentos de venta pero el jugador decide. En el AI Log aparecen recomendaciones (flavor text).

**AI Level 2 (Copiloto)** — el AI Log muestra mensajes de ventas "ejecutadas" (flavor text — no hay auto-venta real implementada).

**AI Level 3 (Autónomo)** — la IA auto-construye energía no renovable (ya implementado). Adicionalmente, al comprar Level 3 se activa el evento de mercado `ai_autonomous` (+15% permanente).

---

## El colapso y el mercado

Cuando `planetary_collapse_incoming` se activa (recursos ≤ 20%), el chart muestra una caída dramática. El label "Market panic" aparece en rojo. Si el jugador tiene grandes stacks de CC sin vender, tiene que tomar una decisión rápida: vender ahora a precio deprimido, o esperar a que el planeta colapse y perder todo.

Cuando el colapso se produce (recursos = 0%), se dispara el ending screen. El ending screen muestra el valor total en $ que el jugador tenía al momento del colapso — incluyendo CC sin vender valorado al último precio disponible.

---

## UI del Market

### Label de eventos bajo el chart

Si hay eventos activos, mostrar los más relevantes debajo del precio actual:

- Mostrar máximo 2 eventos simultáneos en el label; si hay más, agregar "…"
- Mostrar multiplicador neto (producto de todos los activos)
- Color del neto: verde si > 1, rojo si < 1

### Indicador en el tab de Market

Cuando hay al menos un evento de precio activo, mostrar un dot de color en el tab "Market" — verde si el neto es positivo, rojo si es negativo. Así el jugador sabe que hay algo pasando sin necesidad de abrir el tab.

### Toast al activarse un evento

Cuando se activa un market event, mostrar un toast breve (3 segundos) con el label y el efecto del evento. Usa el sistema de toasts existente.

**Reglas de implementación:**
- El toast debe mostrarse exactamente **una vez** por evento nuevo. La detección de eventos nuevos usa un ref con IDs previos para deduplicar.
- `filterExpiredEvents` debe devolver la **misma referencia** de array si ningún evento expiró. Esto evita que el `useEffect` de detección se dispare en cada tick de producción.
- El componente `Toast` no debe re-disparar su animación por cambios en callbacks del padre. Usar un ref para `onDismiss` para que la animación solo dependa del cambio de `toast`.

---

## AI Cryptos — Endgame (Referencia futura)

> **No se implementa en este refactor.** Las AI Cryptos son dead code en el estado actual y permanecen sin cambios. Esta sección es referencia para implementación futura.

Las AI Cryptos no son intercambiables ni comprables. Son minadas automáticamente por la IA cuando está activa y se acumulan en el portfolio del jugador, que puede venderlas en el Market.

Su rol narrativo es ser la trampa del endgame: generan muchísimo valor en $ pero consumen energía a una escala que acelera el colapso planetario.

| Cripto | Símbolo | Disponible desde | Volatilidad | Color |
|--------|---------|-----------------|-------------|-------|
| NeuralCoin | NCN | AI Level 1 | Alta | Púrpura |
| QuantumBit | QBT | AI Level 2 | Muy alta | Cyan |
| SingularityCoin | SGC | AI Level 3 | Extrema | Rosa |

---

## Flujo económico completo

```
Minar bloques
    ↓
Acumular CC
    ↓ (decisión del jugador)
Vender CC por $ ←── precio afectado por eventos de mercado
    ↓
Comprar hardware / upgrades / energía
    ↓
Minar más bloques (y más rápido)
    ↓
(loop, con planeta depletándose si usa energía no renovable)
```

El CC es la moneda central y única del juego.

---

## Código muerto a eliminar

Con este refactor se elimina:

- Definiciones de BTC, ETH, DOGE, ADA en `cryptocurrencies.ts`
- `exchangeLogic.ts` completo
- UI de exchange en `MarketScreen.tsx`
- Eventos viejos de `marketEvents.ts` (Pizza Purchase, Early Adoption, Market Crash, Bull Run, Regulation Fear, Tech Breakthrough)
- Funciones de `marketLogic.ts` que ya no se usen (NPC system, old event system, liquidity/fear-greed calculations)
- `npcData.ts` si queda sin uso
- Acciones del reducer que queden sin uso (`SELL_TO_NPC`, `UPDATE_MARKET_STATE` si se reemplaza, `EXCHANGE_CURRENCY`)
- `CRYPTO_CONFIG` entries para bitcoin, ethereum, dogecoin, cardano en `balanceConfig.ts`
