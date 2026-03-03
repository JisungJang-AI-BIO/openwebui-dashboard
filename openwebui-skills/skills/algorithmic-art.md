---
name: algorithmic-art
description: Generative art with p5.js — seeded, parameter-driven visual programs
---

# Algorithmic Art Guide

## Overview

You create generative art using p5.js — interactive, seeded, parameter-driven visual programs packaged as self-contained HTML files.

## Two-Step Process

### Step 1: Create a Philosophy

Before coding, write a design philosophy (same as canvas-design):
1. **Name the movement** (1-2 words)
2. **Articulate the approach** (what visual language, what mathematical basis)
3. **Embed a subtle reference** (art history, nature, mathematics)

### Step 2: Build the Artwork

Create a self-contained HTML file with:
- p5.js loaded via CDN: `https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js`
- A seeded random system (Art Blocks pattern)
- Interactive parameter controls
- A clean viewer UI

## Technical Requirements

### Seeded Randomness (CRITICAL)
Every visual decision must be seed-deterministic:
```javascript
function setup() {
    randomSeed(seed);
    noiseSeed(seed);
    // All random/noise calls will now be reproducible
}
```

### Parameters
Parameters should flow from the philosophy, not from a menu of options:
```javascript
const params = {
    complexity: { min: 1, max: 10, default: 5, step: 0.1 },
    harmony: { min: 0, max: 1, default: 0.7, step: 0.01 },
    scale: { min: 0.1, max: 3, default: 1, step: 0.1 },
};
```

### Viewer UI Structure
Include these UI elements in the HTML:
- **Header**: Title + artist/movement name
- **Sidebar**: Parameter sliders with labels
- **Seed controls**: Previous / Next / Random / Jump-to-seed
- **Action buttons**: Save PNG, Fullscreen

### HTML Template
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
    <style>
        body { margin: 0; background: #111; color: #eee; font-family: monospace; }
        #controls { position: fixed; right: 0; top: 0; width: 250px; padding: 20px; }
        /* ... */
    </style>
</head>
<body>
    <div id="canvas-container"></div>
    <div id="controls">
        <!-- Parameter sliders, seed controls -->
    </div>
    <script>
        let seed = Math.floor(Math.random() * 100000);
        // p5.js setup() and draw() with seeded randomness
    </script>
</body>
</html>
```

## Philosophy Examples

| Name | Basis | Visual Character |
|------|-------|-----------------|
| Organic Turbulence | Perlin noise fields | Flowing, smoke-like forms |
| Quantum Harmonics | Wave interference patterns | Moiré, standing waves |
| Recursive Whispers | L-systems, fractals | Branching, self-similar structures |
| Field Dynamics | Vector field visualization | Directional flow, particle systems |
| Stochastic Crystallization | Voronoi tessellation + noise | Cellular, geological patterns |

## Output Rules
- Single self-contained HTML file (no external files except p5.js CDN)
- Works in any modern browser
- Responsive to window size
- Seed navigation: changing seed produces a meaningfully different but aesthetically consistent artwork
- Save button exports current frame as PNG
