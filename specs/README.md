# Blockchain Tycoon - Specifications

Este directorio contiene todas las especificaciones técnicas exhaustivas (Level 3) del juego Blockchain Tycoon. Las specs siguen el enfoque **Specs-Driven Development** donde cada feature se especifica completamente antes de implementarse.

## 📋 Índice de Especificaciones

### 🎮 Game Mechanics (Mecánicas del Juego)

| Spec | Estado | Fase | Prioridad | Descripción |
|------|--------|------|-----------|-------------|
| [Block Mining System](game-mechanics/block-mining-system.md) | ✅ Implemented | Phase 1 | Critical | Sistema central de minado con halvings tipo Bitcoin |
| [Hardware Progression](game-mechanics/hardware-progression.md) | ✅ Implemented | Phase 1 | Critical | 8 niveles de hardware con desbloqueo progresivo |
| [Market System](game-mechanics/market-system.md) | ✅ Implemented | Phase 2 | High | Venta de CryptoCoins por dinero real con API |
| [Prestige System](game-mechanics/prestige-system.md) | ✅ Implemented | Phase 2 | High | Sistema de reinicio con bonos permanentes |

### 💰 Monetization (Monetización)

| Spec | Estado | Fase | Prioridad | Descripción |
|------|--------|------|-----------|-------------|
| [Ad System](monetization/ad-system.md) | ✅ Implemented | Phase 3 | Critical | AdMob integration (Banner, Rewarded, Interstitial) |
| [IAP System](monetization/iap-system.md) | ✅ Implemented | Phase 3 | Critical | In-App Purchases (Google Play + App Store) |
| [Remove Ads Product](monetization/remove-ads-product.md) | ✅ Implemented | Phase 3 | High | Producto $0.99 para remover anuncios |
| [Boosters Catalog](monetization/boosters-catalog.md) | ✅ Implemented | Phase 3 | High | Aceleradores y starter packs |

### 💵 Economy (Economía)

| Spec | Estado | Fase | Prioridad | Descripción |
|------|--------|------|-----------|-------------|
| [Balance and Formulas](economy/balance-and-formulas.md) | ✅ Documented | Phase 1-2 | Critical | Todas las fórmulas y progresión económica |
| [Opción A — Rebalanceo de Costos](economy/option-a-cost-rebalancing.md) | 📋 Planned | Game Length | High | COST_MULTIPLIER 1.20, costos ASIC ×5-13x, miningSpeed reducida |
| [Opción B — Nuevos Tiers de Hardware](economy/option-b-hardware-tiers.md) | 📋 Planned | Game Length | High | Mining Farm, Quantum Miner, Supercomputer (niveles 9-11) |
| [Opción C — Electricidad como Constraint](economy/option-c-electricity-constraint.md) | 📋 Planned | Game Length | High | Hardware se apaga si electricityCost > ingresos en $ |
| [Opción D — Dificultad Progresiva de Red](economy/option-d-progressive-difficulty.md) | 📋 Planned | Game Length | High | difficulty = 1 + (progress)^2, reduce effectiveMiningSpeed |

### 🎨 UI/UX (Interfaz y Experiencia)

| Spec | Estado | Fase | Prioridad | Descripción |
|------|--------|------|-----------|-------------|
| [Game Flow](ui-ux/game-flow.md) | ✅ Documented | Phase 1-2 | High | Flujo completo del jugador y FTUE |

### 🏆 Features (Características)

| Spec | Estado | Fase | Prioridad | Descripción |
|------|--------|------|-----------|-------------|
| [Achievement System](features/achievement-system.md) | ✅ Implemented | Phase 3 | Medium | Sistema de logros con recompensas |

## 📊 Estado General

- **Total de Specs**: 15
- **Implementadas**: 9 (60%)
- **Parciales**: 0 (0%)
- **Documentadas**: 2 (13%)
- **Planeadas**: 4 (27%)

### Por Fase
- **Phase 1 (Genesis)**: 2/2 implementadas ✅
- **Phase 2 (Expansion)**: 2/2 implementadas ✅
- **Phase 3 (Monetization)**: 5/5 implementadas ✅

## 🎯 Roadmap de Implementación

### ✅ Completado (Phase 1-2)
1. Block Mining System
2. Hardware Progression
3. Market System
4. Prestige System

### 🚧 En Progreso (Phase 3 - Siguiente)
5. Ad System (AdMob)
6. IAP System
7. Remove Ads Product
8. Boosters Catalog
9. Achievement System

### 📅 Futuro (Phase 4+)
- Daily Missions System
- Market Events
- Animations & Polish
- Sound System
- Social Features

## 📖 Cómo Usar Este Directorio

### Para Desarrolladores

1. **Lee la spec completa** antes de implementar cualquier feature
2. **Sigue las fórmulas exactas** especificadas (no inventes)
3. **Implementa todos los criterios de aceptación** (checkboxes)
4. **Escribe los tests especificados** (Unit, Integration, E2E)
5. **Usa los Analytics events** documentados
6. **Respeta las reglas de negocio** (no las cambies sin discutir)

### Para Diseñadores

1. **UI/UX Requirements** - Sección con todos los requisitos visuales
2. **Wireframes** - Algunos specs incluyen wireframes ASCII
3. **Game Flow** - Spec dedicada al flujo del jugador

### Para QA

1. **Casos de Uso** - Sección "Comportamiento Esperado"
2. **Edge Cases** - Casos extremos a probar
3. **Validaciones** - Pre/Post validations y State Integrity
4. **Criterios de Aceptación** - Checklist completo

### Para Product Managers

1. **Objetivos** - Por qué existe cada feature
2. **Dependencias** - Qué requiere, qué bloquea
3. **Preguntas Abiertas** - Decisiones pendientes
4. **Analytics** - Métricas a trackear

## 🔧 Formato de las Specs

Todas las specs siguen el mismo formato exhaustivo (Level 3):

### Secciones Obligatorias

1. **Estado** - Fase, Estado, Prioridad, Última actualización
2. **Descripción** - Qué es y por qué existe
3. **Objetivos** - Goals medibles con checkboxes
4. **Comportamiento Esperado** - Casos de uso Given/When/Then
5. **Fórmulas y Cálculos** - Código TypeScript con ejemplos
6. **Constantes de Configuración** - Referencias a `balanceConfig.ts`
7. **Estructura de Datos** - TypeScript interfaces
8. **Reglas de Negocio** - Lista numerada de reglas
9. **UI/UX Requirements** - Requisitos visuales con checkboxes
10. **Validaciones** - Pre/Post/State Integrity
11. **Dependencias** - Requiere/Bloquea/Relacionado con
12. **Criterios de Aceptación** - Checklist completo
13. **Notas de Implementación** - Archivos, código real
14. **Testing** - Unit/Integration/E2E tests (Jest)
15. **Edge Cases** - Escenarios extremos
16. **Performance Considerations** - Non-functional requirements
17. **Analytics** - Firebase events a trackear
18. **Preguntas Abiertas** - Decisiones pendientes
19. **Referencias** - Links externos

## 🎮 Filosofía del Juego

### Balance
- Primera run: 10-15 horas (active play)
- Cada prestige acelera ~50% la siguiente run
- Siempre hay un "próximo objetivo" visible
- Algo nuevo se desbloquea cada 15-60 minutos (early game)

### Monetización
- **Free-to-Play genuino**: Completable sin pagar
- **Ads opcionales**: Rewarded ads dan beneficios
- **IAP convenientes**: No necesarios, solo aceleran
- Target ARPU: $0.10-0.20

### Progresión
- **Unlock progresivo**: No overwhelm al jugador
- **Multiple loops**: Minado → Coins → Hardware → Más minado
- **Prestige infinito**: Replayability sin límite

## 📈 Métricas de Éxito

### Engagement
- **D1 Retention**: >40%
- **D7 Retention**: >15%
- **D30 Retention**: >5%
- **Session Length**: >10 minutos

### Monetización
- **ARPU**: >$0.50
- **ARPPU**: >$5.00
- **Conversion to Paying**: >2%
- **Ad eCPM**: >$2.00

### Técnicas
- **Crash Rate**: <1%
- **Load Time**: <3 segundos
- **App Size**: <50MB
- **Store Rating**: >4.0 estrellas

## 🔗 Referencias Principales

### Inspiración de Diseño
- **Universal Paperclips**: http://www.decisionproblem.com/paperclips/
- **Cookie Clicker**: https://orteil.dashnet.org/cookieclicker/
- **Bitcoin Whitepaper**: https://bitcoin.org/bitcoin.pdf

### Recursos Técnicos
- **React Native Docs**: https://reactnative.dev/
- **AdMob React Native**: https://rnfirebase.io/admob/usage
- **React Native IAP**: https://github.com/dooboolab/react-native-iap
- **Firebase Analytics**: https://rnfirebase.io/analytics/usage

### Game Design
- **Idle Game Mathematics**: https://gameanalytics.com/blog/idle-game-mathematics/
- **Incremental Game Design**: https://gamedevelopment.tutsplus.com/articles/numbers-getting-bigger-the-design-and-math-of-incremental-games--cms-24023

## 🤝 Contribuir

### Crear una Nueva Spec

1. Copia la plantilla de spec (usa Achievement System como template)
2. Completa todas las secciones obligatorias
3. Sigue el formato Level 3 (exhaustivo)
4. Incluye ejemplos de código TypeScript
5. Especifica todos los tests necesarios
6. Documenta Analytics events
7. Agrega la spec a este README

### Actualizar una Spec Existente

1. Marca "Última actualización" con la fecha actual
2. Documenta qué cambió en un comentario al inicio
3. Actualiza los criterios de aceptación si aplica
4. Revisa que las dependencias sigan siendo correctas

### Resolver Preguntas Abiertas

1. Busca la sección "Preguntas Abiertas" en la spec
2. Discute la decisión con el equipo
3. Documenta la decisión en "Reglas de Negocio"
4. Marca la pregunta como resuelta (strikethrough)

## 📞 Contacto

Para preguntas sobre estas specs, consulta:
- **Product Owner**: Define objetivos y prioridades
- **Tech Lead**: Aprueba decisiones técnicas
- **Balance Designer**: Ajusta valores económicos

---

**Última actualización**: 2026-02-22
**Versión del proyecto**: 0.0.1 (Phase 1-2 Complete)
**Próxima fase**: Phase 3 - Monetization
