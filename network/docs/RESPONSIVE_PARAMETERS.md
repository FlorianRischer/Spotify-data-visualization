# Vollständig Responsive Parameter - Alle Größen & Physics

## 📊 Implementierte Proportionale Parameter

### 🎯 Physics Parameter (skalieren mit scaleFactor)

```typescript
// Baseline (1200x800)
repulsion: 180 → × scaleFactor
restLength: 200 → × scaleFactor
jitter: 0.05 → × scaleFactor
maxSpeed: 2.2 → × scaleFactor
groupAttraction: 3.5 → × scaleFactor
genreAnchorStrength: 2.5 → × scaleFactor

// Statisch (skalieren NICHT)
spring: 0.005 (bleibt konstant)
damping: 0.75 (wird nur während Transition angepasst)
```

### 🌀 Spiral Animation Parameter (skalieren mit scaleFactor)

```typescript
// Baseline Spiral Parameter
minRadius: 220 → × scaleFactor
maxRadius: 380 → × scaleFactor
radiusVariation: 160 → × scaleFactor
offsetRange: 40 → × scaleFactor
offsetAmount: 20 → × scaleFactor
```

### 📍 Genre Anchor Radius (skaliert mit scaleFactor)

```typescript
// Baseline
genreAnchorRadius: 350 → × scaleFactor
// Verwendet in createCategoryBasedGenreAnchors()
```

### 📏 Node Sizes (skaliert mit scaleFactor)

```typescript
// In loop() - Physics Radii
radii[n.id] = Math.max(8, n.size) * 0.4 * scaleFactor
```

### ⏱️ Animation Parameter (nicht skaliert - Zeit bleibt gleich)

```typescript
// Diese bleiben konstant für flüssige Animationen
START_ANIMATION_DURATION: 10000 // 10 Sekunden
TRANSITION_DURATION: 3000 // 3 Sekunden
```

## 🔢 Beispiel-Berechnung für verschiedene Bildschirme

### MacBook Pro 2019 (2560×1600)
```
Baseline Canvas: 1200×800
Actual Canvas: 2560×1600
Scale Factor: min(2560/1200, 1600/800) = min(2.13, 2.0) = 2.0

Physics Parameter:
- repulsion: 180 × 2.0 = 360
- restLength: 200 × 2.0 = 400
- maxSpeed: 2.2 × 2.0 = 4.4
- genreAnchorStrength: 2.5 × 2.0 = 5.0

Spiral Parameter:
- minRadius: 220 × 2.0 = 440
- maxRadius: 380 × 2.0 = 760
- offsetRange: 40 × 2.0 = 80
- offsetAmount: 20 × 2.0 = 40

Genre Anchor Radius:
- 350 × 2.0 = 700
```

### Standard Desktop (1920×1080)
```
Scale Factor: min(1920/1200, 1080/800) = min(1.6, 1.35) = 1.35

Physics Parameter:
- repulsion: 180 × 1.35 = 243
- restLength: 200 × 1.35 = 270
- maxSpeed: 2.2 × 1.35 = 2.97
```

### Kompakt Desktop (1024×768)
```
Scale Factor: min(1024/1200, 768/800) = min(0.85, 0.96) = 0.85

Physics Parameter:
- repulsion: 180 × 0.85 = 153
- restLength: 200 × 0.85 = 170
- maxSpeed: 2.2 × 0.85 = 1.87
```

## 🔄 Wie die Skalierung funktioniert

### 1. Canvas Resize erkannt
```typescript
resize() wird aufgerufen
→ Canvas-Größe gemessen
→ scaleFactor berechnet (immer zwischen 0.6 und 2.0+)
```

### 2. Physics Parameter aktualisiert
```typescript
physicsParams wird aktualisiert mit:
- repulsion * scaleFactor
- restLength * scaleFactor
- etc.
```

### 3. Spiral Parameter skaliert
```typescript
getSpiralPosition() verwendet:
- minRadius * scaleFactor
- maxRadius * scaleFactor
- offsetRange * scaleFactor
- offsetAmount * scaleFactor
```

### 4. Genre Anchor Radius skaliert
```typescript
createCategoryBasedGenreAnchors(nodes, 350 * scaleFactor)
```

### 5. Node Radii skaliert
```typescript
radii[n.id] = Math.max(8, n.size) * 0.4 * scaleFactor
```

## ✨ Resultat auf jedem Gerät

- **Visuelle Konsistenz**: Alles skaliert proportional
- **Physics überall gleich**: Forces wirken proportional zu den Größen
- **Animationen gleich flüssig**: Timing bleibt konstant
- **Keine visuellen Sprünge**: Sanfte Skalierung

## 📋 Alle skalierenden Parameter (checklist)

- ✅ repulsion (180)
- ✅ restLength (200)
- ✅ jitter (0.05)
- ✅ maxSpeed (2.2)
- ✅ groupAttraction (3.5)
- ✅ genreAnchorStrength (2.5)
- ✅ minRadius (220)
- ✅ maxRadius (380)
- ✅ radiusVariation (160)
- ✅ offsetRange (40)
- ✅ offsetAmount (20)
- ✅ genreAnchorRadius (350)
- ✅ nodeRadii (size * 0.4)

## 🚫 Parameter, die NICHT skalieren

- ❌ spring (0.005) - bleibt konstant
- ❌ damping (0.75) - Basis-Damping, wird nur temporär angepasst
- ❌ START_ANIMATION_DURATION (10000ms)
- ❌ TRANSITION_DURATION (3000ms)
- ❌ Animation Timing

Diese Parameter bleiben konstant, damit die Animationen überall gleich schnell/flüssig sind.

## 🧮 Mathematik dahinter

```
scaleFactor = min(
  actualWidth / baselineWidth,
  actualHeight / baselineHeight
)

scaledParameter = baselineParameter × scaleFactor

→ Lineare Skalierung
→ Konsistent über alle Parameter
→ Proportional zu Canvas-Größe
```

## 📝 Wichtige Baseline-Werte

Alle diese Werte sind für eine 1200×800 Canvas-Größe optimiert:

```typescript
BASELINE_PHYSICS_PARAMS = {
  repulsion: 180,
  spring: 0.005,
  restLength: 200,
  damping: 0.75,
  jitter: 0.05,
  maxSpeed: 2.2,
  groupAttraction: 3.5,
  genreAnchorStrength: 2.5
}

BASELINE_SPIRAL_PARAMS = {
  minRadius: 220,
  maxRadius: 380,
  radiusVariation: 160,
  offsetRange: 40,
  offsetAmount: 20
}
```

Diese werden dann mit `scaleFactor` multipliziert!
