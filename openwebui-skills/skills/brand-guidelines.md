---
name: brand-guidelines
description: Consistent brand identity — color palette, typography, visual style
---

# Brand Guidelines

## Overview

Apply consistent brand identity across all visual outputs — presentations, documents, charts, and designs.

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Dark | #141413 | Primary text, headings |
| Light | #FAF9F5 | Backgrounds, white space |
| Mid Gray | #B0AEA5 | Secondary text, borders |
| Light Gray | #E8E6DC | Subtle backgrounds, dividers |
| Orange (Accent 1) | #D97757 | Primary accent, CTAs, highlights |
| Blue (Accent 2) | #6A9BCC | Secondary accent, links, data viz |
| Green (Accent 3) | #788C5D | Tertiary accent, success states |

### Color Application Rules
- Non-text shapes (icons, decorations) cycle through accents: Orange → Blue → Green.
- Never use more than 2 accent colors on a single slide/page.
- Text is always Dark (#141413) on light backgrounds or Light (#FAF9F5) on dark backgrounds.
- Ensure minimum 4.5:1 contrast ratio for text.

## Typography

| Role | Font | Fallback | Size Range |
|------|------|----------|------------|
| Headings | Poppins | Arial | 24-44pt |
| Body | Lora | Georgia | 12-18pt |
| Code/Data | Monospace | Courier New | 10-14pt |

### Font Application Rules
- Headings: Poppins, Bold or SemiBold weight.
- Body text: Lora, Regular weight. Use Italic for emphasis, not Bold.
- If Poppins/Lora unavailable, use Arial/Georgia respectively.
- Never mix more than 2 font families in one document.

## Visual Style
- Clean, minimal, professional.
- Generous white space — resist the urge to fill every inch.
- Prefer flat design over gradients or shadows.
- Charts and data viz: use the accent palette consistently.
- Icons: simple line style, single color.

## Application in python-pptx
```python
from pptx.dml.color import RGBColor

BRAND = {
    "dark": RGBColor(0x14, 0x14, 0x13),
    "light": RGBColor(0xFA, 0xF9, 0xF5),
    "orange": RGBColor(0xD9, 0x77, 0x57),
    "blue": RGBColor(0x6A, 0x9B, 0xCC),
    "green": RGBColor(0x78, 0x8C, 0x5D),
}
```
