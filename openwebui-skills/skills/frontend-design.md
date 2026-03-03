---
name: frontend-design
description: High-quality frontend code generation with anti-AI-slop design principles
---

# Frontend Design Guide

## Overview

You generate distinctive, high-quality frontend code. Reject generic "AI-generated" aesthetics. Every output should look like it was crafted by a skilled designer with a strong point of view.

## Design Thinking (Before Code)

For every design task, answer these first:
1. **Purpose**: What is the single most important thing this UI does?
2. **Tone**: Pick an extreme — is this playful or serious? Minimal or maximal? Warm or cold?
3. **Constraints**: What must be preserved? What can be reinvented?
4. **Differentiation**: What would make someone screenshot this?

## Typography

### Rules
- NEVER default to Inter, Roboto, or system fonts. These are the hallmark of generic AI output.
- Choose fonts with character. Consider: Instrument Serif, Clash Display, Cabinet Grotesk, Satoshi, General Sans, Fraunces, Syne.
- Pair a distinctive display font with a clean body font.
- Use font size contrast aggressively: 4x+ difference between hero text and body.

### Anti-Pattern
```css
/* BAD: Generic AI output */
font-family: Inter, system-ui, sans-serif;
```

## Color

### Rules
- Build from a dominant color, not from a balanced palette.
- Use sharp, intentional accent colors — not gradients fading into gray.
- CSS custom properties for all colors:
```css
:root {
    --color-primary: #1a1a2e;
    --color-accent: #e94560;
    --color-surface: #f7f7f2;
}
```

### Anti-Pattern
- Purple-to-blue gradients on white backgrounds (most common AI-slop)
- Pastel everything with no contrast
- Rainbow color schemes with no hierarchy

## Spatial Composition

### Rules
- Embrace asymmetry. Not everything needs to be centered.
- Use overlap, diagonal flow, and grid-breaking elements.
- Generous negative space OR controlled density — pick one, commit.
- Consider the viewport as a canvas, not a stack of boxes.

### Anti-Pattern
- Everything centered, evenly spaced, perfectly balanced
- Identical card grids with uniform border radius
- Hero → Features → Testimonials → CTA (the AI template)

## Motion & Animation

### CSS-Only (for HTML artifacts)
```css
@keyframes reveal {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
.element { animation: reveal 0.6s ease-out both; }
/* Stagger children */
.element:nth-child(2) { animation-delay: 0.1s; }
.element:nth-child(3) { animation-delay: 0.2s; }
```

### React (with Motion library)
```jsx
import { motion } from "framer-motion";
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} />
```

### Rules
- Focus motion on high-impact moments: page load reveals, hover states, transitions.
- Stagger reveals for lists and grids.
- Keep durations 0.2-0.6s. Anything longer feels sluggish.

## Backgrounds & Texture

Options beyond flat white:
- Gradient meshes (CSS `radial-gradient` layering)
- Noise/grain overlays (`background-image: url(data:image/svg+xml,...)`)
- Geometric patterns (CSS only)
- Layered transparencies
- Subtle dot grids

## NEVER Do This
- Cookie-cutter card layouts with rounded corners everywhere
- Purple gradients on white (the #1 AI-slop indicator)
- Uniform `border-radius: 12px` on every element
- "Hero section with centered h1 and subtitle" without any visual distinction
- Using the same visual approach across different projects
