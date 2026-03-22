# Style Reference — Blockchain Tycoon
Applies to all screens. Extracted from HTML prototypes in `specs/ui-ux/`.

---

## ⚠️ Typography Rules (Android/React Native)

### Font stack

| Role | Font file | `theme.ts` key | HTML equivalent |
|------|-----------|----------------|----------------|
| Display / headings | `Orbitron-Bold.ttf` | `fonts.orbitron` | `font-family:'Orbitron'; font-weight:700` |
| Display / heavy numbers | `Orbitron-Black.ttf` | `fonts.orbitronBlack` | `font-family:'Orbitron'; font-weight:900` |
| Display / light | `Orbitron-Regular.ttf` | `fonts.orbitronRegular` | `font-family:'Orbitron'; font-weight:400` |
| Mono labels / tags | `ShareTechMono-Regular.ttf` | `fonts.mono` | `font-family:'Share Tech Mono'` |
| Body / descriptions | `Rajdhani-Regular.ttf` | `fonts.rajdhani` | `font-family:'Rajdhani'` |

### ⛔ Orbitron weight rule — DO NOT break this

On Android, `fontWeight` is **ignored** when a named font-file variant is specified as `fontFamily`. The weight comes from the TTF file, not the StyleSheet property. Combining both causes Android to apply **synthetic bold on top of the named variant**, producing incorrect character rendering.

**Wrong — causes Android to synthesize bold:**
```ts
// ❌ fontWeight: '700' is ignored / causes double-bold on Orbitron-Bold
fontFamily: fonts.orbitron, fontWeight: '700'

// ❌ fontWeight: '900' is silently ignored — still renders as Bold, not Black
fontFamily: fonts.orbitron, fontWeight: '900'
```

**Correct — weight encoded in the font file:**
```ts
// ✓ Weight 700 (Bold)
fontFamily: fonts.orbitron          // Orbitron-Bold.ttf — never add fontWeight

// ✓ Weight 900 (Black)
fontFamily: fonts.orbitronBlack     // Orbitron-Black.ttf — never add fontWeight

// ✓ Weight 400 (Regular)
fontFamily: fonts.orbitronRegular   // Orbitron-Regular.ttf — never add fontWeight
```

### Mapping HTML `font-weight` → React Native font key

| HTML spec value | React Native key |
|-----------------|-----------------|
| `font-weight: 900` with Orbitron | `fonts.orbitronBlack` (no `fontWeight` prop) |
| `font-weight: 700` with Orbitron | `fonts.orbitron` (no `fontWeight` prop) |
| `font-weight: 400` with Orbitron | `fonts.orbitronRegular` (no `fontWeight` prop) |
| Any weight with Share Tech Mono | `fonts.mono` (single weight, no `fontWeight` prop) |
| Any weight with Rajdhani | use `fonts.rajdhani` / `fonts.rajdhaniBold` / etc. per weight |

### Rajdhani variants (static files, all safe)

| Weight | `theme.ts` key |
|--------|----------------|
| 300 Light | `fonts.rajdhaniLight` |
| 400 Regular | `fonts.rajdhani` |
| 600 SemiBold | `fonts.rajdhaniSemi` |
| 700 Bold | `fonts.rajdhaniBold` |

---

## Color Tokens

| Token | Hex / rgba |
|-------|-----------|
| `--ng` neon green | `#00ff88` |
| `--nc` neon cyan | `#00e5ff` |
| `--ny` neon yellow | `#ffd600` |
| `--nr` neon red | `#ff3d5a` |
| `--bg` background | `#020810` |
| `--dim` dimmed text | `rgba(255,255,255,0.45)` |

---

## Aurora Background

Three blobs. Each: `position:fixed`, `border-radius:50%`, `filter:blur(80px)`.

| Blob | Width | Height | Top | Left/Right | Background | Duration | Delay |
|------|-------|--------|-----|------------|------------|----------|-------|
| a1 | 500px | 400px | -100px | left: -100px | `radial-gradient(ellipse, rgba(0,255,136,0.18) 0%, transparent 70%)` | 8s | 0s |
| a2 | 400px | 500px | -80px | right: -80px | `radial-gradient(ellipse, rgba(0,229,255,0.14) 0%, transparent 70%)` | 11s | -3s |
| a3 | 600px | 300px | bottom: 100px | left: -150px | `radial-gradient(ellipse, rgba(0,255,136,0.10) 0%, transparent 70%)` | 14s | -6s |

**Drift keyframes:** `0%,100% translate(0,0) scale(1)` → `33% translate(40px,-30px) scale(1.05)` → `66% translate(-20px,20px) scale(0.97)`

---

## Grid Background

| Property | Value |
|----------|-------|
| position | fixed, inset: 0, z-index: 0 |
| cell size | 40×40px |
| line color | `rgba(0,255,136,0.025)` |
| line width | 1px |
| animation | translateY(0→40px), 20s linear infinite |

---

## Scanline

| Property | Value |
|----------|-------|
| height | 2px |
| color | `rgba(0,255,136,0.06)` |
| animation | top: 0→100vh, 8s linear infinite |

---

## Particles

| Property | Value |
|----------|-------|
| count | 20 |
| shape | circle (border-radius: 50%) |
| size | random 2–6px |
| colors | `#00ff88`, `#00e5ff`, `#ffd600` |
| box-shadow | `0 0 {size*2}px currentColor` |
| animation duration | random 8–18s |
| animation delay | random 0–8s |
| keyframes | `0%` translateY(100vh) rotate(0deg) opacity:0 → `10%` opacity:1 → `90%` opacity:0.5 → `100%` translateY(-50px) rotate(720deg) opacity:0 |

---

## Confetti

| Property | Value |
|----------|-------|
| count | 60 |
| width | random 3–9px |
| height | random 5–15px |
| border-radius | 2px |
| colors | `#00ff88`, `#00e5ff`, `#ffd600`, `#ff3d5a`, `#fff` |
| animation duration | random 2–4.5s |
| animation delay | random 0–1.5s |
| keyframes | `0%` translateY(-20px) rotateZ(0deg) opacity:1 → `80%` opacity:1 → `100%` translateY(110vh) rotateZ(720deg) opacity:0 |
| cleanup | piece removed from DOM after `(duration+1.5)*1000ms` |

---

## Screen Container

| Property | Value |
|----------|-------|
| max-width | 420px |
| height | 100vh |
| overflow-y | auto (scrollable) |
| padding-bottom | 30px |
| display | flex, flex-direction: column |

---

## Topbar

| Property | Value |
|----------|-------|
| position | **sticky, top: 0**, z-index: 20 |
| flex-shrink | 0 |
| padding | `14px 18px 10px` |
| border-bottom | `1px solid rgba(0,255,136,0.08)` |
| background | `rgba(2,8,16,0.95)` |
| backdrop-filter | `blur(12px)` |

### Logo text
| Property | Value |
|----------|-------|
| font-family | Orbitron |
| font-size | 11px |
| font-weight | 900 |
| letter-spacing | 2px |
| color | `#00ff88` |
| text-shadow | `0 0 14px rgba(0,255,136,0.5)` |
| text-transform | uppercase |
| "CHAIN" span | color: `#00e5ff` |

### Run info text
| Property | Value |
|----------|-------|
| font-family | Share Tech Mono |
| font-size | 9px |
| color | `rgba(255,255,255,0.45)` |
| letter-spacing | 2px |

---

## Hero Section

| Property | Value |
|----------|-------|
| padding | `50px 24px 32px` |
| text-align | center |

### Globe wrap
| Property | Value |
|----------|-------|
| width × height | 120×120px |
| margin | `0 auto 24px` |

### Globe emoji
| Property | Value |
|----------|-------|
| font-size | 72px |
| filter | `drop-shadow(0 0 24px rgba(0,255,136,0.5))` |
| animation | floatGlobe 4s ease-in-out infinite |
| keyframes | `0%,100%` translateY(0) → `50%` translateY(-8px) |

### Orbit ring 1
| Property | Value |
|----------|-------|
| width × height | 140×140px |
| margin-top / margin-left | -70px / -70px |
| border | `1px solid rgba(0,255,136,0.25)` |
| animation | spinOrbit 6s linear infinite |

### Orbit ring 2
| Property | Value |
|----------|-------|
| width × height | 170×170px |
| margin-top / margin-left | -85px / -85px |
| border | `1px solid rgba(0,229,255,0.15)` |
| animation | spinOrbit 10s linear infinite **reverse** |

### Orbit dot (green)
| Property | Value |
|----------|-------|
| width × height | 6×6px |
| border-radius | 50% |
| background | `#00ff88` |
| position | top: -3px, left: 50%, margin-left: -3px |
| box-shadow | `0 0 8px #00ff88` |

### Orbit dot 2 (cyan)
| Property | Value |
|----------|-------|
| background | `#00e5ff` |
| box-shadow | `0 0 8px #00e5ff` |

### Victory subtitle
| Property | Value |
|----------|-------|
| font-family | Share Tech Mono |
| font-size | 9px |
| letter-spacing | 5px |
| color | `#00e5ff` |
| opacity | 0.7 |
| margin-bottom | 20px |
| text-transform | uppercase |

### Victory title
| Property | Value |
|----------|-------|
| font-family | Orbitron |
| font-size | 22px |
| font-weight | 900 |
| letter-spacing | 3px |
| line-height | 1.2 |
| margin-bottom | 6px |
| fill | gradient `linear-gradient(135deg, #00ff88 0%, #00e5ff 50%, #00ff88 100%)` animated (titleShine 3s linear infinite, background-size: 200% auto) |
| text-transform | uppercase |

### Victory quote
| Property | Value |
|----------|-------|
| font-family | Rajdhani |
| font-size | 14px |
| font-weight | 400 |
| color | `rgba(255,255,255,0.6)` |
| line-height | 1.6 |
| font-style | italic |
| max-width | 320px |
| margin | `0 auto` |
| padding | `14px 16px` |
| border-left | `2px solid rgba(0,255,136,0.3)` |
| background | `rgba(0,255,136,0.03)` |
| border-radius | `0 8px 8px 0` |

---

## Stats Section

| Property | Value |
|----------|-------|
| padding | `0 16px` |
| margin-bottom | 16px |

### Section label
| Property | Value |
|----------|-------|
| font-family | Share Tech Mono |
| font-size | 9px |
| letter-spacing | 5px |
| color | `rgba(255,255,255,0.45)` |
| text-transform | uppercase |
| margin-bottom | 12px |
| decorative lines | `linear-gradient(90deg, transparent, rgba(0,255,136,0.25), transparent)`, height: 1px |

### Stat card grid
| Property | Value |
|----------|-------|
| columns | 2 (1fr 1fr) |
| gap | 8px |
| margin-bottom | 8px |

### Stat card (green default)
> **Implemented values** — aligned to match mining screen NodeStat (BlockStatus).

| Property | Value |
|----------|-------|
| background | `rgba(0,255,136,0.04)` |
| border | `1px solid rgba(0,255,136,0.22)` |
| border-radius | 12px |
| padding | 13px (uniform) |
| align-items | center |
| top border (::before) | height: 2px, `linear-gradient(90deg, transparent, #00ff88, transparent)`, opacity: 0.55 |
| animation | cardIn 0.4s ease-out, delays: 0.2s / 0.35s / 0.5s / 0.65s / 0.8s / 0.95s |

### Stat card cyan variant
| Property | Value |
|----------|-------|
| background | `rgba(0,229,255,0.04)` |
| border-color | `rgba(0,229,255,0.18)` |
| top border color | `#00e5ff` |

### Stat card yellow variant
| Property | Value |
|----------|-------|
| background | `rgba(255,214,0,0.04)` |
| border-color | `rgba(255,214,0,0.22)` |
| top border color | `#ffd600` |

### Stat card red variant
| Property | Value |
|----------|-------|
| background | `rgba(255,61,90,0.04)` |
| border-color | `rgba(255,61,90,0.22)` |
| top border color | `#ff3d5a` |

### cardIn animation
| Keyframe | Value |
|----------|-------|
| 0% | opacity: 0, translateY(16px) |
| 100% | opacity: 1, translateY(0) |

### Stat icon (.bs-icon)
| Property | Value |
|----------|-------|
| font-size | 25px |
| margin-bottom | 5px |
| color | `rgba(255,255,255,0.7)` |

### Stat label (.bs-label)
| Property | Value |
|----------|-------|
| font-family | Share Tech Mono |
| font-size | 8px |
| letter-spacing | 2px |
| color | `rgba(255,255,255,0.4)` |
| text-transform | uppercase |
| margin-bottom | 3px |

### Stat value (.bs-value)
| Property | Value |
|----------|-------|
| font-family | Orbitron |
| font-size | 17px (Run Duration: 16px via `smallValue` prop) |
| font-weight | unset |
| color (green) | `#00ff88`, text-shadow: `0 0 6px rgba(0,255,136,0.35)` |
| color (cyan) | `#00e5ff`, text-shadow: `0 0 6px rgba(0,229,255,0.35)` |
| color (yellow) | `#ffd600`, text-shadow: `0 0 6px rgba(255,214,0,0.35)` |
| color (red) | `#ff3d5a`, text-shadow: `0 0 6px rgba(255,61,90,0.35)` |
| line-height | 22px |

### Stat sub (.bs-sub)
| Property | Value |
|----------|-------|
| font-size | 10px |
| color | `rgba(255,255,255,0.4)` |
| margin-top | 2px |

### Check badge (.check-badge)
| Property | Value |
|----------|-------|
| background | `#00ff88` |
| color | `#000` |
| font-family | Orbitron |
| font-size | 9px |
| font-weight | 900 |
| padding | `2px 6px` |
| border-radius | 4px |
| margin-left | 4px |
| letter-spacing | 1px |

---

## Resources Card

| Property | Value |
|----------|-------|
| background | `rgba(0,255,136,0.04)` |
| border | `1px solid rgba(0,255,136,0.18)` |
| border-radius | 14px |
| padding | 14px |
| margin-bottom | 8px |
| top border | same as stat card green |
| animation | cardIn 0.6s ease-out 0.8s both |

### Resources percentage
| Property | Value |
|----------|-------|
| font-family | Orbitron |
| font-size | 22px |
| font-weight | 900 |
| color | `#00ff88` |
| text-shadow | `0 0 14px rgba(0,255,136,0.5)` |

### Resources bar track
| Property | Value |
|----------|-------|
| height | 8px |
| background | `rgba(255,255,255,0.05)` |
| border-radius | 4px |
| margin-bottom | 6px |

### Resources bar fill
| Property | Value |
|----------|-------|
| background | `linear-gradient(90deg, #00ff88, #00e5ff)` |
| border-radius | 4px |
| box-shadow | `0 0 8px #00ff88` |
| transition | `width 2s cubic-bezier(0.4, 0, 0.2, 1)` |

---

## Bonus Section

| Property | Value |
|----------|-------|
| padding | `0 16px` |
| margin-bottom | 16px |
| animation | cardIn 0.6s ease-out **1.1s** both |

### Bonus card
| Property | Value |
|----------|-------|
| background | `linear-gradient(135deg, rgba(0,229,255,0.05), rgba(0,255,136,0.05))` |
| border | `1px solid rgba(0,229,255,0.2)` |
| border-radius | 14px |
| padding | 16px |
| top border | `linear-gradient(90deg, #00e5ff, #00ff88)`, height: 2px |

### Bonus title
| Property | Value |
|----------|-------|
| font-family | Orbitron |
| font-size | 10px |
| font-weight | 700 |
| letter-spacing | 3px |
| color | `#00e5ff` |
| margin-bottom | 10px |
| trailing line | flex: 1, height: 1px, `rgba(0,229,255,0.2)` |

### Bonus run info
| Property | Value |
|----------|-------|
| font-family | Share Tech Mono |
| font-size | 9px |
| color | `rgba(255,255,255,0.45)` |
| letter-spacing | 2px |
| margin-bottom | 12px |

### Bonus quote box
| Property | Value |
|----------|-------|
| font-family | Rajdhani |
| font-size | 13px |
| font-style | italic |
| color | `rgba(255,255,255,0.65)` |
| line-height | 1.6 |
| padding | 12px |
| background | `rgba(0,229,255,0.04)` |
| border | `1px solid rgba(0,229,255,0.1)` |
| border-radius | 8px |

### Bonus star
| Property | Value |
|----------|-------|
| position | absolute, top: 16px, right: 16px |
| font-size | 24px |
| animation | starPulse 2s ease-in-out infinite |
| keyframes | `0%,100%` scale(1) rotate(0deg) drop-shadow(0 0 4px rgba(255,214,0,0.3)) → `50%` scale(1.1) rotate(10deg) drop-shadow(0 0 12px rgba(255,214,0,0.7)) |

---

## Actions

| Property | Value |
|----------|-------|
| padding | `0 16px 16px` |
| gap | 8px |
| animation | cardIn 0.6s ease-out **1.3s** both |

### Start button
| Property | Value |
|----------|-------|
| padding | 18px |
| background | `linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,229,255,0.1))` |
| border | `1px solid #00ff88` |
| border-radius | 14px |
| color | `#00ff88` |
| font-family | Orbitron |
| font-size | 14px |
| font-weight | 700 |
| letter-spacing | 4px |
| text-transform | uppercase |
| box-shadow | `0 0 24px rgba(0,255,136,0.15), inset 0 0 24px rgba(0,255,136,0.05)` |
| active | scale(0.97) |
| shimmer ::before | translateX(-100%→100%), 2.5s infinite |

---

## ⚠️ Button Rules (Android/React Native)

### The Android dark-box artifact

On Android, **two patterns create a visible dark inner rectangle** inside a button — both must be avoided.

#### Pattern 1: `LinearGradient` as inner wrapper ❌
```tsx
// ❌ WRONG — LinearGradient renders a solid colored layer on Android,
// creating a dark box even with low-opacity colors
<TouchableOpacity style={outerStyle}>
  <LinearGradient colors={['rgba(255,61,90,0.18)', 'rgba(255,61,90,0.10)']} style={innerStyle}>
    <Text>BUY</Text>
  </LinearGradient>
</TouchableOpacity>
```

#### Pattern 2: `overflow: 'hidden'` + `elevation` on the same View ❌
```tsx
// ❌ WRONG — elevation creates a shadow layer; overflow:hidden clips it
// into a visible dark rectangle inside the border radius on Android
style={{ borderRadius: 12, overflow: 'hidden', elevation: 3 }}
```

---

### Standard button template ✅

Every action button must follow this exact structure:

```tsx
// 1. Animated.View for press-scale (optional but recommended)
<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>

  {/* 2. TouchableOpacity: flat backgroundColor, overflow:hidden for shimmer,
         NO elevation, iOS-only shadow props are safe */}
  <TouchableOpacity
    style={styles.btn}
    onPress={() => {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 150, useNativeDriver: true }),
      ]).start();
      doAction();
    }}
    activeOpacity={0.85}
  >

    {/* 3. SVG shimmer — must be position:absolute, pointerEvents="none" */}
    <Animated.View
      pointerEvents="none"
      style={[styles.shimmer, { transform: [{ translateX: shimmerAnim }] }]}
    >
      <Svg width={300} height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="shimmer" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={accentColor} stopOpacity="0" />
            <Stop offset="40%"  stopColor={accentColor} stopOpacity="0.12" />
            <Stop offset="60%"  stopColor={accentColor} stopOpacity="0.12" />
            <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="300" height="100%" fill="url(#shimmer)" />
      </Svg>
    </Animated.View>

    {/* 4. Content directly in TouchableOpacity — NO inner View wrapper */}
    <Text style={styles.btnText}>LABEL</Text>

  </TouchableOpacity>
</Animated.View>
```

```ts
// StyleSheet entries
btn: {
  borderRadius: 12,
  overflow: 'hidden',        // needed to clip shimmer — safe without elevation
  borderWidth: 1,
  borderColor: accentColor,
  backgroundColor: 'rgba(R,G,B,0.14)',  // flat color, NO LinearGradient
  paddingVertical: 16,
  alignItems: 'center',
  justifyContent: 'center',
  // iOS shadow only (no elevation — keeps overflow:hidden artifact-free on Android)
  shadowColor: accentColor,
  shadowOpacity: 0.13,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 0 },
},
shimmer: {
  position: 'absolute', top: 0, bottom: 0, width: 300,
},
```

### HTML spec → React Native translation

| HTML CSS | React Native equivalent |
|----------|------------------------|
| `background: linear-gradient(135deg, rgba(R,G,B,0.15), rgba(R,G,B,0.08))` | `backgroundColor: 'rgba(R,G,B,0.14)'` (flat, single value) |
| `box-shadow: 0 0 18px rgba(...)` | iOS-only `shadowColor/Opacity/Radius` — **no `elevation`** |
| `::before` shimmer animation | SVG `LinearGradient` + `Animated.Value` translateX loop |
| `:active { transform: scale(0.97) }` | `Animated.View` wrapping TouchableOpacity, scale 0.96→1 on press |
| `overflow: hidden` | `overflow: 'hidden'` on TouchableOpacity — **only safe without `elevation`** |

### Background opacity by accent color

| Color | `backgroundColor` |
|-------|--------------------|
| Neon green `#00ff88` | `rgba(0,255,136,0.14)` |
| Neon cyan `#00e5ff` | `rgba(0,229,255,0.14)` |
| Neon yellow `#ffd600` | `rgba(255,214,0,0.14)` |
| Neon red `#ff3d5a` | `rgba(255,61,90,0.14)` |
| Purple | `rgba(160,64,255,0.14)` |
| Orange | `rgba(255,107,26,0.14)` |

### Share button
| Property | Value |
|----------|-------|
| padding | 14px |
| background | transparent |
| border | `1px solid rgba(255,255,255,0.12)` |
| border-radius | 12px |
| color | `rgba(255,255,255,0.45)` |
| font-family | Orbitron |
| font-size | 11px |
| font-weight | 700 |
| letter-spacing | 3px |
| active | `background: rgba(255,255,255,0.05)` |

---

## Shop — Remove Ads Unlock Steps

Three cards showing IAP purchase progress (0, 1, 2 purchases). Each card can be `locked`, `active`, or `done`.

### Unlock step card (base)
| Property | Value |
|----------|-------|
| flex | 1 |
| border-radius | 8px |
| padding | 8px 6px |
| text-align | center |
| border | `1px solid rgba(255,255,255,0.08)` |
| background | `rgba(255,255,255,0.03)` |

### Unlock step — done
| Property | Value |
|----------|-------|
| border-color | `rgba(0,255,136,0.3)` |
| background | `rgba(0,255,136,0.06)` |
| check badge | green circle, top-right, `✓` |

### Unlock step — active
| Property | Value |
|----------|-------|
| border-color | `rgba(255,214,0,0.35)` |
| background | `rgba(255,214,0,0.06)` (static, NOT animated) |
| animation | stepGlow — **border glow only** (see below) |

### stepGlow animation
| Property | Value |
|----------|-------|
| type | border/box-shadow pulse — **never** background fill |
| duration | 2s ease-in-out infinite |
| HTML | `@keyframes stepGlow { 0%,100% { box-shadow: none } 50% { box-shadow: 0 0 10px rgba(255,214,0,0.2) } }` |
| React Native | Animated overlay with `borderWidth: 1, borderColor: rgba(255,214,0,0.6)`, opacity 0→1→0. No `backgroundColor`. |

> **IMPORTANT**: React Native does not support `box-shadow` animation. The RN
> equivalent uses an `Animated.View` with `StyleSheet.absoluteFill` that pulses
> opacity on a **border only** (no background color). Never use
> `backgroundColor` on the glow overlay — the static background from
> `na_stepActive` is sufficient.
