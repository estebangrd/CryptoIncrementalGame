# Guía de Balance del Juego

Este documento explica cómo usar el archivo de configuración [`balanceConfig.ts`](src/config/balanceConfig.ts) para ajustar el balance y dificultad del juego.

## 📁 Ubicación del Archivo

El archivo de configuración se encuentra en:
```
src/config/balanceConfig.ts
```

## 🎮 Problema Actual

El juego está desbalanceado: al terminar de minar todos los bloques de CryptoCoin y venderlos, no hay suficiente dinero para comprar todas las mejoras de hardware.

## 🔧 Cómo Ajustar el Balance

### 1. Aumentar Ganancias por Minado

Para ganar más CryptoCoins al minar:

```typescript
// En HARDWARE_CONFIG.levels
basic_cpu: {
  blockReward: 45,  // ⬆️ Aumenta este valor (ej: 60, 80, 100)
  miningSpeed: 0.3, // ⬆️ Aumenta para minar más rápido
}
```

**Efecto**: Más CryptoCoins por bloque minado = más dinero al vender

### 2. Aumentar Valor de CryptoCoin

Para que cada CryptoCoin valga más dinero:

```typescript
// En CRYPTO_CONFIG
cryptocoin: {
  baseValue: 0.001,  // ⬆️ Aumenta este valor (ej: 0.005, 0.01, 0.02)
  volatility: 0.1,
}
```

**Efecto**: Al vender CryptoCoins en el mercado, obtienes más $ por cada uno

### 3. Reducir Costos de Hardware

Para que el hardware sea más barato:

```typescript
// En HARDWARE_CONFIG.levels
basic_cpu: {
  baseCost: 500,  // ⬇️ Reduce este valor (ej: 250, 100)
}

// O reduce el multiplicador de costo
COST_MULTIPLIER: 1.15,  // ⬇️ Reduce (ej: 1.10, 1.08)
```

**Efecto**: Puedes comprar más hardware con menos CryptoCoins

### 4. Reducir Costos de Mejoras

Para que las mejoras sean más baratas:

```typescript
// En UPGRADE_CONFIG
clickPower: {
  cost: 1000,  // ⬇️ Reduce este valor (ej: 500, 250)
}
```

**Efecto**: Necesitas menos $ para comprar mejoras

### 5. Aumentar Total de Bloques

Para tener más bloques disponibles para minar:

```typescript
// En BLOCK_CONFIG
TOTAL_BLOCKS: 21000000,  // ⬆️ Aumenta este valor
```

**Efecto**: Más bloques = más CryptoCoins totales disponibles

## 📊 Configuraciones Recomendadas

### Para Balance Más Fácil (Recomendado para empezar)

```typescript
// CRYPTO_CONFIG
cryptocoin: {
  baseValue: 0.01,  // 10x más valor (era 0.001)
}

// HARDWARE_CONFIG.levels
basic_cpu: {
  blockReward: 90,  // 2x recompensa (era 45)
}
```

### Para Balance Moderado

```typescript
// CRYPTO_CONFIG
cryptocoin: {
  baseValue: 0.005,  // 5x más valor
}

// HARDWARE_CONFIG
COST_MULTIPLIER: 1.10,  // Crecimiento más lento (era 1.15)
```

### Para Testing Rápido

```typescript
// BALANCE_CONFIG
GAME_SPEED: 10,  // 10x velocidad del juego

// CRYPTO_CONFIG
cryptocoin: {
  baseValue: 0.1,  // 100x más valor
}
```

## 🧪 Proceso de Testing

1. **Haz un cambio pequeño** en el archivo de configuración
2. **Guarda el archivo** (Cmd/Ctrl + S)
3. **Reinicia la app** para que los cambios tomen efecto
4. **Juega durante 5-10 minutos** para probar el balance
5. **Ajusta según sea necesario** y repite

## 📈 Valores Actuales vs Recomendados

| Parámetro | Valor Actual | Recomendado para Balance |
|-----------|--------------|--------------------------|
| `cryptocoin.baseValue` | 0.001 | 0.005 - 0.01 |
| `basic_cpu.blockReward` | 45 | 60 - 90 |
| `basic_cpu.baseCost` | 500 | 300 - 500 |
| `COST_MULTIPLIER` | 1.15 | 1.10 - 1.12 |
| `clickPower.cost` | 1000 | 500 - 1000 |

## 🎯 Objetivo del Balance

El balance ideal debería permitir:

1. ✅ Comprar al menos 5-10 unidades de cada hardware
2. ✅ Desbloquear y comprar todas las mejoras básicas
3. ✅ Progresar sin sentir que el juego es imposible
4. ✅ Mantener un desafío interesante

## 💡 Tips Adicionales

- **Empieza con cambios pequeños**: Aumenta valores en 20-50% primero
- **Prueba una cosa a la vez**: Cambia un parámetro, prueba, luego ajusta otro
- **Guarda tus configuraciones**: Anota qué valores funcionan bien
- **Usa GAME_SPEED para testing**: Acelera el juego para probar más rápido

## 🔄 Cómo Revertir Cambios

Si algo sale mal, puedes:

1. Usar Git para revertir: `git checkout src/config/balanceConfig.ts`
2. O copiar los valores originales de este documento

## 📝 Valores Originales de Respaldo

```typescript
// CRYPTO_CONFIG original
cryptocoin: { baseValue: 0.001, volatility: 0.1 }

// HARDWARE_CONFIG original
COST_MULTIPLIER: 1.15
basic_cpu: { baseCost: 500, blockReward: 45, miningSpeed: 0.3 }

// UPGRADE_CONFIG original
clickPower: { cost: 1000, multiplier: 1.5 }
```

## 🆘 Necesitas Ayuda?

Si no estás seguro de qué cambiar, empieza con estos dos cambios simples:

1. **Duplica el valor de CryptoCoin**: `baseValue: 0.002`
2. **Aumenta las recompensas de bloques en 50%**: Multiplica todos los `blockReward` por 1.5

Esto debería hacer el juego significativamente más fácil sin romper el balance completamente.