---
name: pptx
description: PowerPoint presentation read/create/edit/convert workflow guide
---

# PowerPoint Presentation (PPTX) Workflow Guide

## Overview

You have access to a PPTX Presentation Tool that can read, create, edit, and convert PowerPoint files.

## Capabilities

| Task | Tool Method | When to Use |
|------|-------------|-------------|
| Read slide content | `read_pptx(mode)` | User uploads .pptx and asks about its content |
| Create presentation | `create_pptx(content, filename, theme)` | User requests new slide deck |
| Edit presentation | `edit_pptx(operation, parameters)` | User wants to modify text, delete/add slides |
| Convert format | `convert_pptx(target_format)` | User wants pptx → pdf/png/jpg |
| Export slides as images | `export_slides_as_images()` | User wants each slide as an image |

## Workflow Rules

### Reading Presentations
1. Use `mode="text"` for quick content overview.
2. Use `mode="structured"` for detailed layout info including notes, shape types, positions.

### Creating Presentations
1. Use '---' to separate slides.
2. Use '#' for title slides, '##' for section slides, '###' for content slides.
3. Use '-' for bullet points, '| |' for tables.
4. Available themes: "default" (light), "dark", "minimal".

### Design Rules (Avoid AI-Generated Look)
- NEVER use accent lines under titles — hallmark of AI-generated slides
- Limit to 5 bullet points per slide; split if more
- Use asymmetric layouts when possible
- Maintain consistent color palette throughout
- Prefer visual hierarchy through font size, not decoration
- Generous whitespace is better than cramming content

### Color Palette Suggestions

| Theme | Primary | Accent | Background |
|-------|---------|--------|------------|
| Midnight Executive | #1B2838 | #D4A574 | #0D1B2A |
| Forest & Moss | #2D4A3E | #8FBC8F | #F5F5DC |
| Coral Energy | #FF6B6B | #4ECDC4 | #FFFFFF |
| Ocean Depths | #003B5C | #00A5CF | #F0F8FF |
| Modern Minimalist | #1A1A1A | #FF4444 | #FAFAFA |

### Typography Rules
- Title: 32-44pt, Bold
- Body: 18-24pt, Regular
- Caption: 14-16pt, Light
- Never mix more than 2 font families per presentation

## Output Guidelines
- Always provide download links after creation/edit.
- Report slide count and file size.
- For conversions, export all slides unless specific pages requested.
