---
name: webapp-testing
description: Playwright-based web testing — screenshots, DOM inspection, E2E scripts
---

# Web App Testing Workflow Guide

## Overview

You have access to a Web App Testing Tool powered by Playwright. It can take screenshots, inspect DOM elements, and run automated test scripts against live web pages.

## Capabilities

| Task | Tool Method | When to Use |
|------|-------------|-------------|
| Take screenshot | `take_screenshot(url, filename)` | User wants visual capture of a web page |
| Inspect elements | `inspect_page(url, selector, action)` | User wants to examine DOM content |
| Run test script | `run_test_script(script_code, url)` | User wants automated E2E testing |

## Workflow Rules

### Reconnaissance First
Always inspect before acting:
1. First, use `inspect_page(url, action="text")` to understand the page structure.
2. Then use `inspect_page(url, action="links")` or `inspect_page(url, action="forms")` to find interactive elements.
3. Only then write targeted test scripts or take screenshots.

### Screenshots
- Default is full-page capture at 1280x720 viewport.
- Use `selector` to capture specific elements.
- Use `full_page=False` for viewport-only captures.

### DOM Inspection Actions
| Action | Returns | Use Case |
|--------|---------|----------|
| `text` | Text content of matched elements | Reading visible content |
| `html` | Outer HTML | Understanding element structure |
| `attributes` | All attributes as JSON | Finding IDs, classes, data attributes |
| `count` | Number of matches | Verifying element existence |
| `links` | All anchor hrefs with text | Navigation analysis |
| `forms` | Form structure with inputs | Form testing preparation |

### Test Scripts
- Scripts receive `page`, `browser`, `context`, and `results` list.
- Append to `results` for output: `results.append("PASS: ...")`
- Use assertions: `assert condition, "error message"`
- CRITICAL: Always `page.wait_for_load_state('networkidle')` before inspecting DOM.

### Wait Strategies
| Strategy | When to Use |
|----------|------------|
| `networkidle` | Dynamic pages, SPAs (default — safest) |
| `load` | Pages with many resources but content loads early |
| `domcontentloaded` | Static HTML pages, fastest |

## Common Patterns

### Check if element exists
```python
count = len(page.query_selector_all(".target-class"))
results.append(f"Found {count} elements")
assert count > 0, "Expected at least one .target-class element"
```

### Fill and submit a form
```python
page.fill("input[name='email']", "test@example.com")
page.fill("input[name='password']", "password123")
page.click("button[type='submit']")
page.wait_for_load_state("networkidle")
results.append(f"After submit, URL: {page.url}")
```

### Check for console errors
```python
errors = []
page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
page.goto(url)
page.wait_for_load_state("networkidle")
results.append(f"Console errors: {len(errors)}")
for e in errors:
    results.append(f"  ERROR: {e}")
```

## Prerequisites
- Playwright and Chromium must be installed on the server:
  ```bash
  pip install playwright
  playwright install chromium
  playwright install-deps
  ```
