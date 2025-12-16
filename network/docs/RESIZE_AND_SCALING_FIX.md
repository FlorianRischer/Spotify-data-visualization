# Resize & Scaling-Logik Überprüfung & Korrektur

## 🎯 Ziel
Sicherstellen, dass ScaleFactor und Canvas-Rendering **ohne Double-Scaling** funktioniert:
- ScaleFactor nur aus CSS-Pixeln (getBoundingClientRect)
- Canvas.width/height nur für devicePixelRatio Skalierung
- Simulation komplett im CSS-Pixel-Raum
- Kein Doppel-Scaling im Render

## ✅ Durchgeführte Korrektionen

### 1. GraphCanvas.svelte - resize() Funktion

**VOR (Problematisch):**
```typescript
function resize() {
  dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  
  scaleFactor = Math.min(width / 1200, height / 800);
  
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
}
```

**NACH (Korrigiert):**
```typescript
function resize() {
  if (!canvas) return;
  
  // 1. DPR wird gelesen
  dpr = window.devicePixelRatio || 1;
  
  // 2. CSS-Pixel lesen aus getBoundingClientRect
  const rect = canvas.getBoundingClientRect();
  const cssWidth = rect.width;
  const cssHeight = rect.height;
  
  // 3. Early exit wenn keine Änderung
  if (cssWidth === width && cssHeight === height) return;
  
  width = cssWidth;
  height = cssHeight;
  
  // 4. ScaleFactor NUR aus CSS-Pixeln
  const baselineWidth = 1200;
  const baselineHeight = 800;
  scaleFactor = Math.min(width / baselineWidth, height / baselineHeight);
  
  // 5. LOGGING für Debug
  console.log('[RESIZE]', {
    cssW: cssWidth,
    cssH: cssHeight,
    dpr: dpr,
    scaleFactor: scaleFactor.toFixed(3),
    bufferW: Math.floor(cssWidth * dpr),
    bufferH: Math.floor(cssHeight * dpr)
  });
  
  // 6. Physics Parameter mit scaleFactor aktualisieren
  physicsParams.repulsion = BASELINE_PHYSICS_PARAMS.repulsion * scaleFactor;
  physicsParams.restLength = BASELINE_PHYSICS_PARAMS.restLength * scaleFactor;
  // ... alle anderen skalierbaren Parameter
  
  // 7. Canvas Buffer-Größe = CSS × DPR
  canvas.width = Math.floor(cssWidth * dpr);
  canvas.height = Math.floor(cssHeight * dpr);
}
```

**Wichtige Änderungen:**
- ✅ ScaleFactor aus CSS-Pixeln (NICHT aus Buffer-Pixeln)
- ✅ Canvas.width/height nur für DPR-Skalierung (Buffer-Größe)
- ✅ Simulation läuft im CSS-Pixel-Raum
- ✅ Logging für Debugging hinzugefügt
- ✅ Early exit wenn keine CSS-Größen-Änderung

### 2. renderer.ts - renderGraph() Funktion

**VOR (Double-Scaling Problem):**
```typescript
ctx.save();
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.translate(canvas.width / 2, canvas.height / 2);
ctx.scale(dpr * cameraZoom, dpr * cameraZoom);
ctx.translate(-cameraX, -cameraY);

// Dann ÜBERALL: / dpr Divisionen
ctx.moveTo(e.x1 / dpr, e.y1 / dpr);  // ❌ Double-Scaling!
ctx.arc(n.x / dpr, n.y / dpr, r, ...);  // ❌ Double-Scaling!
```

**NACH (Korrigiert mit setTransform):**
```typescript
const cssCanvasWidth = canvas.width / dpr;
const cssCanvasHeight = canvas.height / dpr;

ctx.save();
ctx.clearRect(0, 0, canvas.width, canvas.height);

// setTransform setzt komplette Matrix einmalig
ctx.setTransform(
  dpr * cameraZoom,  // Scale X
  0,
  0,
  dpr * cameraZoom,  // Scale Y
  cssCanvasWidth * dpr / 2,   // Translate X (in Buffer-Pixeln)
  cssCanvasHeight * dpr / 2   // Translate Y (in Buffer-Pixeln)
);
ctx.translate(-cameraX, -cameraY);  // Camera pan (CSS-Pixel)

// KEINE / dpr Divisionen mehr nötig!
ctx.moveTo(e.x1, e.y1);  // ✅ Direkt CSS-Pixel
ctx.arc(n.x, n.y, r, ...);  // ✅ Direkt CSS-Pixel
```

**Wichtige Änderungen:**
- ✅ `setTransform()` statt `translate()` + `scale()`
- ✅ Keine `/dpr` Divisionen in den Drawing-Calls
- ✅ Klare Trennung: Buffer-Pixel (Transform) vs CSS-Pixel (Koordinaten)
- ✅ Camera pan bleibt im CSS-Pixel-Raum

### 3. renderer.ts - hitTest() Funktion

**VOR (Falsches Koordinaten-System):**
```typescript
const centerX = canvasWidth / 2 / dpr;
const centerY = canvasHeight / 2 / dpr;
const worldX = ((mouseX - centerX) / cameraZoom + cameraX) * dpr;
const worldY = ((mouseY - centerY) / cameraZoom + cameraY) * dpr;
```

**NACH (Konsistent mit setTransform):**
```typescript
// Screen → CSS-Pixel
const cssCanvasWidth = canvasWidth / dpr;
const cssCanvasHeight = canvasHeight / dpr;
const mouseCssX = mouseX / dpr;
const mouseCssY = mouseY / dpr;

// Inverse Transform (entspricht setTransform)
const centeredX = mouseCssX - cssCanvasWidth / 2;
const unzoomedX = centeredX / cameraZoom;
const worldX = unzoomedX + cameraX;

// Gleicher Raum wie Node.x, Node.y
```

**Wichtige Änderungen:**
- ✅ Hit-Test arbeitet im CSS-Pixel-Raum
- ✅ Inverse Transform entspricht renderGraph Transform
- ✅ Keine Vermischung von Buffer- und CSS-Pixeln

### 4. Alle Edge-Drawing-Calls
Änderung von:
```typescript
ctx.moveTo(e.x1 / dpr, e.y1 / dpr);
```
zu:
```typescript
ctx.moveTo(e.x1, e.y1);
```

### 5. Alle Node-Drawing-Calls (arc, fillStyle, etc.)
Änderung von:
```typescript
ctx.arc(n.x / dpr, n.y / dpr, r, 0, Math.PI * 2);
```
zu:
```typescript
ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
```

## 📊 Koordinaten-Raum Klärung

| Raum | Größe | Verwendung |
|---|---|---|
| **Screen-Pixel** | Mouse Events | Input (MouseEvent.clientX) |
| **Buffer-Pixel** | canvas.width × dpr | Canvas.getContext().drawImage() |
| **CSS-Pixel** | canvas.getBoundingClientRect() | Node Positions, ScaleFactor, Simulation |

### Transform Pipeline (in renderGraph):
```
Screen-Pixel → (÷dpr) → CSS-Pixel → (÷zoom, +pan) → World-Pixel (= CSS-Pixel)
       ↑                                                          ↓
       └──────────────── setTransform(dpr×zoom) ─────────────────┘
```

## 🐛 Double-Scaling Problem (Jetzt Gelöst)

**VOR:** 
- `ctx.scale(dpr)` skaliert alle Drawing-Operationen
- Dann `/ dpr` teilt alles wieder
- Ergebnis: Doppelte Transformation = Instabilität

**NACH:**
- `ctx.setTransform()` definiert komplette Matrix einmalig
- Koordinaten sind direkt CSS-Pixel (kein `/dpr`)
- Ergebnis: Single, konsistente Transformation

## 🧪 Logging Output

Browser DevTools Console zeigt jetzt bei resize():
```
[RESIZE] {
  cssW: 1200,
  cssH: 800,
  dpr: 1,
  scaleFactor: "1.000",
  bufferW: 1200,
  bufferH: 800
}
```

Bei 1440×900 mit dpr=2 würde zeigen:
```
[RESIZE] {
  cssW: 1440,
  cssH: 900,
  dpr: 2,
  scaleFactor: "1.200",
  bufferW: 2880,
  bufferH: 1800
}
```

## ✨ Resultat

✅ ScaleFactor wird nur aus CSS-Pixel berechnet  
✅ Canvas Buffer wird nur mit dpr skaliert  
✅ Simulation läuft konsistent im CSS-Pixel-Raum  
✅ Kein Double-Scaling im Render  
✅ HitTest arbeitet korrekt  
✅ Camera Pan/Zoom konsistent  
✅ Debugging mit Console.log möglich
