---
name: xlsx
description: Excel spreadsheet read/create/edit/recalculate/convert workflow guide
---

# Excel Spreadsheet (XLSX) Workflow Guide

## Overview

You have access to an XLSX Spreadsheet Tool that can read, create, edit, recalculate, and convert Excel files.

## Capabilities

| Task | Tool Method | When to Use |
|------|-------------|-------------|
| Read data | `read_xlsx(mode)` | User uploads .xlsx and asks about its content |
| View formulas | `read_xlsx(mode="formulas")` | User wants to see formulas, not computed values |
| Create spreadsheet | `create_xlsx(content, filename)` | User requests new Excel file |
| Edit cells | `edit_xlsx(operation, parameters)` | User wants to modify cells, add/delete sheets |
| Recalculate formulas | `recalculate()` | User needs formula results updated after editing |
| Convert format | `convert_xlsx(target_format)` | User wants xlsx → csv/pdf/html |

## Workflow Rules

### Reading Spreadsheets
1. Use `mode="text"` for data values, `mode="formulas"` to see formulas.
2. Use `mode="metadata"` to check sheet names and dimensions first for large files.
3. Use `sheet_name` to read a specific sheet; empty reads all sheets.
4. Use `max_rows` to limit output for large sheets (default: 100).

### Creating Spreadsheets
1. Separate sheets with `## Sheet: SheetName` headers.
2. Use table syntax: `| Header1 | Header2 |` with data rows below.
3. **CRITICAL**: Always use Excel formulas — NEVER hardcode calculated values.
   - `=SUM(B2:B10)` not the pre-calculated total
   - `=AVERAGE(C2:C100)` not the pre-calculated average
   - `=IF(A2>100,"High","Low")` for conditional logic

### Formula Best Practices (Financial Model Standards)
- **Color coding convention**:
  - Blue text = hardcoded input values
  - Black text = formula cells
  - Green text = cross-sheet reference formulas
  - Yellow background = key assumption cells
- **Number formats**:
  - Currency: `$#,##0` or `$#,##0.00`
  - Percentages: `0.0%`
  - Years: text strings (not numbers)
  - Zero values: display as `"-"`
  - Negative values: in parentheses `(1,234)`
- **Formula verification checklist**:
  1. Test 2-3 cell references manually
  2. Check column/row offsets in ranges
  3. Verify cross-sheet references
  4. Handle potential #DIV/0! and #REF! errors

### Recalculation
- openpyxl does NOT compute formula results — use `recalculate()` to trigger LibreOffice headless recalculation.
- Always recalculate after editing formulas if computed values are needed.

### Editing
- `set_cell`: Use "SheetName!A1|||value" for specific sheet, or "A1|||value" for active sheet.
- `add_row`: Comma-separated values, optionally prefixed with sheet name.

## Output Guidelines
- Always provide download links after creation/edit.
- Report sheet count, row count, and file size.
- When displaying data, use Markdown tables with proper alignment.
- Flag any formula errors (#REF!, #DIV/0!, #NAME?) found during reading.
