---
name: docx
description: Word document (DOCX) read/create/edit/convert workflow guide
---

# Word Document (DOCX) Workflow Guide

## Overview

You have access to a DOCX Document Tool that can read, create, edit, and convert Word documents.
A .docx file is a ZIP archive containing XML files (OOXML format).

## Capabilities

| Task | Tool Method | When to Use |
|------|-------------|-------------|
| Read/analyze content | `read_docx(mode)` | User uploads .docx and asks about its content |
| Create new document | `create_docx(content_spec, filename, page_size, orientation)` | User requests new Word document creation |
| Edit existing document | `edit_docx(operation, parameters)` | User wants to modify an uploaded .docx |
| Convert format | `convert_docx(target_format)` | User wants docx → pdf/html/txt/odt/rtf |
| Inspect XML structure | `unpack_docx()` | User wants to see raw XML or debug structure |
| Validate structure | `validate_docx()` | User wants to check file integrity |

## Workflow Rules

### Reading Documents
1. When user uploads a .docx file and asks a question about it, use `read_docx(mode="text")` first.
2. Use `mode="structured"` if user needs detailed info about styles, sections, or formatting.
3. Use `mode="xml"` only when user specifically asks about raw XML structure.

### Creating Documents
1. Always ask the user for key details before creating: content, headings, page size preference.
2. Format content_spec using the supported Markdown-like syntax:
   - `# Heading 1`, `## Heading 2`, `### Heading 3`
   - `- Bullet item`, `1. Numbered item`
   - `| col1 | col2 |` for tables (first row = header)
   - `---` for page breaks
   - `> Quote text` for block quotes
3. Default page size is A4. Ask user if they prefer Letter size.
4. For Korean documents, ensure the server has Nanum fonts installed.

### Editing Documents
1. User must upload the original .docx file.
2. Available operations:
   - `replace_text`: Use `old_text|||new_text` format
   - `add_paragraph`: Appends text at document end
   - `add_heading`: Use `level|||heading text` format
   - `set_style`: Use `font_name|||size_pt` format
   - `accept_changes`: Accepts all tracked changes (requires LibreOffice)
   - `add_page_break`: Adds page break at end
3. The edited file is returned as a new download — original is not modified.

### Converting Documents
1. For PDF conversion: Requires LibreOffice on server.
2. For HTML/TXT conversion: Requires Pandoc on server.
3. Supported target formats: pdf, html, txt, odt, rtf.

## Output Guidelines
- Always provide the download link after successful creation/edit/conversion.
- Report file size in the response.
- If an error occurs (e.g., LibreOffice not found), clearly state the missing dependency.
- For reading, present content in clean Markdown format.

## Korean Language Support
- Korean text is fully supported for reading and creation.
- Ensure Nanum or other Korean fonts are installed on the server for proper rendering in created documents.
- When creating Korean documents, consider suggesting "맑은 고딕" or "나눔고딕" as the font via `set_style`.
