# Google Play Store — Checklist de Publicación

## BLOCKERS (obligatorios antes de publicar)

- [ ] **Upload Keystore** — Generar keystore de release y configurar `signingConfigs.release` en `build.gradle`
  - `keytool -genkeypair -v -storetype PKCS12 -keystore blockchain-tycoon-upload.keystore -alias blockchain-tycoon-upload -keyalg RSA -keysize 2048 -validity 10000`
  - Mover a `android/app/`
  - Configurar credenciales en `~/.gradle/gradle.properties` (NO commitear passwords)
  - Cambiar `signingConfig signingConfigs.debug` → `signingConfigs.release` en buildTypes.release
  - IMPORTANTE: nunca perder el keystore ni el password

- [ ] **AdMob ID real** — Reemplazar test ID por ID de producción
  - Crear app en [admob.google.com](https://admob.google.com) → Apps → Add App → Android
  - Reemplazar App ID en `AndroidManifest.xml` (actualmente `ca-app-pub-3940256099942544~3347511713`)
  - Crear Ad Units (Banner, Rewarded, Interstitial) y reemplazar IDs en `src/config/adConfig.ts`
  - Registrar tu Pixel como test device para no violar políticas durante desarrollo
  - Tip: usar `__DEV__` en código TS para alternar entre test/prod Ad Unit IDs automáticamente

- [ ] **Privacy Policy** — Crear y hostear en URL pública
  - Crear página en Google Sites con el texto de la policy
  - Cubrir: no login, datos locales, AdMob (advertising ID), Google Play Billing, contacto
  - URL va en Google Play Console → Store listing → Privacy Policy

## RESUELTOS

- [x] ~~Nombre del app~~ → "Blockchain Tycoon" en `strings.xml`
- [x] ~~Versión~~ → `1.0.0` en `package.json`, `versionCode 1` / `versionName "1.0"` en Android
- [x] ~~Ícono custom~~ → Chip cyberpunk con adaptive icon y fondo `#020810`
- [x] ~~Soporte 32-bit~~ → `armeabi-v7a,arm64-v8a` en `gradle.properties`
- [x] ~~Splash screen~~ → Chip + título + tagline, transición suave con Android 12+

## RECOMENDADOS (no bloquean pero mejoran la publicación)

- [ ] **Proguard/R8** — Habilitar minificación en release para reducir tamaño de APK
  - Cambiar `enableProguardInReleaseBuilds = false` → `true` en `build.gradle`
  - Compilar release y testear TODO el juego (especialmente IAP, ads, animaciones)
  - Si algo crashea, agregar reglas "keep" en `proguard-rules.pro`
  - Recomendación: hacer esto después del primer release estable

- [ ] **Crash reporting** — Integrar Firebase Crashlytics
  - Sin esto no vas a ver crashes de usuarios reales
  - `npm install @react-native-firebase/app @react-native-firebase/crashlytics`

- [ ] **Store assets** — Preparar material para la listing en Google Play
  - Screenshots del juego (mínimo 2, recomendado 5-8)
  - Feature graphic (1024x500)
  - Descripción corta (máx 80 caracteres)
  - Descripción larga (máx 4000 caracteres)
  - Categoría: Games → Simulation
  - Content rating: completar cuestionario en Google Play Console
  - Tags: idle game, clicker, crypto, mining, tycoon

- [ ] **Ambientes test/release para AdMob** — Separar IDs automáticamente
  - Usar `__DEV__` en `adConfig.ts` para Ad Unit IDs
  - Poner App ID real en manifest siempre + registrar test devices
  - Así nunca mostrás ads reales en desarrollo

## NOTAS

- Subir como `.aab` (App Bundle), no `.apk` — Google Play lo requiere para apps nuevas
- El bundle se genera con: `cd android && ./gradlew bundleRelease`
- El `.aab` queda en `android/app/build/outputs/bundle/release/`
