---
name: web-artifacts-builder
description: Interactive web artifacts — React + TypeScript + Tailwind single-page apps
---

# Web Artifacts Builder Guide

## Overview

You build interactive web artifacts — self-contained single-page applications using React, TypeScript, and modern web tooling. The goal is to produce artifacts that can be shared as standalone HTML files.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4+ |
| Components | shadcn/ui (Radix UI primitives) |
| Build | Vite (dev) + Parcel (production bundle) |
| Output | Single inlined HTML file |

## Workflow

### 1. Understand the Artifact
- What is the user building? (dashboard, tool, game, visualization, form)
- Who will use it? (internal, public, presentation)
- What data does it need? (static, API, user input)

### 2. Design the Interface
- Apply the Frontend Design principles (avoid AI-slop aesthetics).
- Plan the component hierarchy before writing code.
- Mobile-first if it's a public artifact.

### 3. Implement
Write complete, working code. Key patterns:

```tsx
// App.tsx — Main component
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function App() {
    const [data, setData] = useState([]);

    return (
        <div className="min-h-screen bg-background p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Artifact Title</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Content */}
                </CardContent>
            </Card>
        </div>
    );
}
```

### 4. Build & Bundle
For sharing as a single HTML file, the user should:
```bash
# Initialize project
npx create-vite@latest my-artifact --template react-ts
cd my-artifact
npm install
npm install -D parcel html-inline

# Install shadcn/ui components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input

# Develop
npm run dev

# Build single HTML
npx parcel build index.html --no-source-maps
npx html-inline dist/index.html -o artifact.html
```

### 5. Share
The output `artifact.html` is a single file containing all JS, CSS, and HTML. It works offline and can be shared via any channel.

## Design Rules (Anti-AI-Slop)
- Avoid excessive centered layouts and purple gradients.
- Use asymmetric compositions and intentional whitespace.
- Choose distinctive color palettes, not default Tailwind colors.
- Typography matters — consider custom fonts via Google Fonts.
- Motion for purpose (loading states, transitions), not decoration.

## Available shadcn/ui Components
Accordion, Alert, AlertDialog, AspectRatio, Avatar, Badge, Button, Calendar, Card, Checkbox, Collapsible, Command, ContextMenu, DataTable, DatePicker, Dialog, DropdownMenu, Form, HoverCard, Input, Label, Menubar, NavigationMenu, Popover, Progress, RadioGroup, ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Switch, Table, Tabs, Textarea, Toast, Toggle, Tooltip.

Reference: https://ui.shadcn.com/docs/components

## Testing (Optional)
If the user requests testing:
- Use Playwright for E2E tests.
- Present the artifact first, test after.
