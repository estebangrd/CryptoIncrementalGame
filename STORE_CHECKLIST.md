# Google Play Store — Checklist de Publicación

## BLOCKERS (obligatorios antes de publicar)

_(todos resueltos — ver sección RESUELTOS)_

## RESUELTOS

- [x] ~~Nombre del app~~ → "Blockchain Tycoon" en `strings.xml`
- [x] ~~Versión~~ → `1.0.0` en `package.json`, `versionCode 1` / `versionName "1.0"` en Android
- [x] ~~Ícono custom~~ → Chip cyberpunk con adaptive icon y fondo `#020810`
- [x] ~~Soporte 32-bit~~ → `armeabi-v7a,arm64-v8a` en `gradle.properties`
- [x] ~~Splash screen~~ → Chip + título + tagline, transición suave con Android 12+
- [x] ~~Upload Keystore~~ → `android/app/blockchain-tycoon-upload.keystore` (gitignored), creds en `~/.gradle/gradle.properties`, `signingConfigs.release` activo en `buildTypes.release`
- [x] ~~AdMob IDs reales~~ → App ID `ca-app-pub-1089639896485629~4464650340`; Banner/Interstitial/Rewarded en `src/config/adConfig.ts` con switch `__DEV__` para test IDs en debug
- [x] ~~Privacy Policy~~ → hosteada en https://sites.google.com/view/solo-studio-legal; fuente en `PRIVACY_POLICY.md` y `PRIVACY_POLICY.html`

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

## NOTAS

- Subir como `.aab` (App Bundle), no `.apk` — Google Play lo requiere para apps nuevas
- El bundle se genera con: `cd android && ./gradlew bundleRelease`
- El `.aab` queda en `android/app/build/outputs/bundle/release/`
