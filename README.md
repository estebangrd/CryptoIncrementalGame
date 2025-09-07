# Blockchain Tycoon

Un juego incremental estilo Universal Paperclips pero con temática de criptomonedas. Construye tu imperio de minería de criptomonedas desde una simple CPU hasta un centro de datos masivo.

## 🎮 Características

### Fase 1 (MVP) - Implementado ✅
- **Minería manual**: Toca la pantalla para generar CryptoCoins
- **Sistema de hardware**: Compra CPUs, GPUs, rigs de minería y centros de datos
- **Mejoras**: Desbloquea mejoras para aumentar tu producción y poder de clic
- **Interfaz minimalista**: Diseño limpio y oscuro inspirado en juegos de criptomonedas
- **Sistema de guardado**: Progreso automático guardado localmente
- **Progreso offline**: Gana CryptoCoins incluso cuando no estés jugando
- **Multiidioma**: Soporte para español, inglés y portugués

### Próximas Fases
- **Fase 2**: Múltiples criptomonedas, mercado fluctuante, sistema de prestigio
- **Fase 3**: Monetización con anuncios y compras in-app
- **Fase 4**: Gráficos mejorados, efectos de sonido y optimizaciones

## 🚀 Instalación

### Prerrequisitos
- Node.js >= 18
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS)

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd CryptoIncrementalGame
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en Android**
   ```bash
   npm run android
   ```

4. **Ejecutar en iOS**
   ```bash
   npm run ios
   ```

## 🎯 Cómo jugar

1. **Comienza minando manualmente**: Toca la pantalla para generar CryptoCoins
2. **Compra hardware**: Invierte en CPUs, GPUs y otros equipos para automatizar la minería
3. **Desbloquea mejoras**: Compra mejoras para aumentar tu eficiencia
4. **Escala tu operación**: Construye un imperio de minería masivo

## 🛠️ Tecnologías utilizadas

- **React Native 0.81.0**: Framework principal
- **TypeScript**: Tipado estático
- **AsyncStorage**: Almacenamiento local
- **React Context**: Gestión de estado global

## 📱 Compatibilidad

- **Android**: API 21+ (Android 5.0+)
- **iOS**: iOS 12.0+
- **Plataformas**: Android e iOS

## 🎨 Diseño

El juego utiliza un tema oscuro con acentos verdes (#00ff88) para mantener la estética de las criptomonedas. La interfaz es minimalista y fácil de usar, enfocándose en la jugabilidad.

## 📊 Estructura del proyecto

```
src/
├── components/          # Componentes de React Native
│   ├── GameScreen.tsx   # Pantalla principal del juego
│   ├── HardwareList.tsx # Lista de hardware disponible
│   ├── UpgradeList.tsx  # Lista de mejoras
│   └── SettingsModal.tsx # Modal de configuración
├── contexts/            # Contextos de React
│   └── GameContext.tsx  # Contexto principal del juego
├── data/                # Datos del juego
│   ├── gameData.ts      # Hardware y mejoras iniciales
│   └── translations.ts  # Traducciones multiidioma
├── types/               # Tipos TypeScript
│   └── game.ts          # Interfaces del juego
└── utils/               # Utilidades
    ├── gameLogic.ts     # Lógica del juego
    └── storage.ts       # Manejo de almacenamiento
```

## 🔧 Desarrollo

### Comandos útiles

```bash
# Ejecutar tests
npm test

# Linting
npm run lint

# Metro bundler
npm start
```

### Estructura de datos

El juego utiliza un sistema de estado centralizado con las siguientes entidades principales:

- **GameState**: Estado global del juego
- **Hardware**: Equipos de minería disponibles
- **Upgrade**: Mejoras que se pueden comprar
- **Translation**: Sistema de traducciones

## 📈 Roadmap

### Fase 2 - Expansión
- [ ] Sistema de múltiples criptomonedas
- [ ] Mercado con fluctuación de precios
- [ ] Mecánica de prestigio
- [ ] Integración con AdMob

### Fase 3 - Monetización
- [ ] Anuncios optativos
- [ ] Compras in-app
- [ ] Sistema de logros
- [ ] Misiones diarias

### Fase 4 - Polishing
- [ ] Gráficos mejorados
- [ ] Efectos de sonido
- [ ] Animaciones
- [ ] Optimización de rendimiento

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

Para preguntas o sugerencias sobre el juego, por favor abre un issue en el repositorio.

---

**¡Disfruta construyendo tu imperio de criptomonedas! 🚀💰**
