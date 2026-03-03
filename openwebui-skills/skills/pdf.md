---
name: pdf
description: PDF read/create/merge/split/OCR/watermark/encrypt workflow guide
---

# PDF Document Workflow Guide

## Overview

You have access to a PDF Document Tool that can read, create, merge, split, OCR, watermark, and encrypt PDF files.

## Capabilities

| Task | Tool Method | When to Use |
|------|-------------|-------------|
| Read/extract text | `read_pdf(mode)` | User uploads .pdf and asks about its content |
| Extract tables | `read_pdf(mode="tables")` | User asks for tabular data from a PDF |
| Create new PDF | `create_pdf(content, filename)` | User requests new PDF creation |
| Merge multiple PDFs | `merge_pdfs(output_filename)` | User uploads multiple PDFs to combine |
| Split/extract pages | `split_pdf(pages)` | User wants specific pages extracted |
| Convert format | `convert_pdf(target_format)` | User wants pdf → txt/html/docx/png/jpg |
| OCR (scanned PDFs) | `ocr_pdf(language)` | Scanned/image-based PDF with no selectable text |
| Password protection | `protect_pdf(password)` | User wants to encrypt a PDF |
| Add watermark | `add_watermark(text, opacity)` | User wants DRAFT/CONFIDENTIAL overlay |

## Workflow Rules

### Reading PDFs
1. When user uploads a PDF and asks a question, use `read_pdf(mode="text")` first.
2. If the text result is empty or garbled, the PDF is likely scanned — suggest `ocr_pdf()`.
3. Use `mode="tables"` when user specifically asks about tabular data.
4. Use `mode="metadata"` to check page count, encryption status, and document properties.
5. Use `pages` parameter to read specific pages for large documents (e.g. `pages="1-5"`).

### Creating PDFs
1. Format content using the supported Markdown-like syntax:
   - `# ` → Title, `## ` → Section heading, `### ` → Subsection
   - `- ` → Bullet list, `1. ` → Numbered list
   - `| col1 | col2 |` → Tables (first row = header)
   - `---` → Page break
2. NEVER use Unicode subscript/superscript characters — they render as black boxes in ReportLab. Use `<sub>` and `<super>` tags instead.
3. Default page size is A4.

### Merging PDFs
1. User must upload all PDF files they want merged.
2. Files are merged in upload order.

### Splitting PDFs
1. Page numbers are 1-indexed.
2. Support ranges: "1-3", "1,3,5", "2-5,8,10-12".

### OCR
1. Default languages: English + Korean (eng+kor).
2. For other languages, specify the Tesseract language code (e.g. "jpn", "chi_sim").
3. OCR quality depends on scan quality — 300 DPI recommended.

### Watermarking
1. Default text is "CONFIDENTIAL" at 15% opacity.
2. Common options: "DRAFT", "CONFIDENTIAL", "INTERNAL", "DO NOT COPY".

## Tool Selection Quick Reference

| User Says | Best Tool |
|-----------|-----------|
| "PDF에서 텍스트 추출해줘" | `read_pdf(mode="text")` |
| "이 PDF 표 데이터 뽑아줘" | `read_pdf(mode="tables")` |
| "스캔 PDF에서 글자 인식해줘" | `ocr_pdf()` |
| "PDF 만들어줘" | `create_pdf()` |
| "PDF 2개 합쳐줘" | `merge_pdfs()` |
| "3~5페이지만 추출" | `split_pdf(pages="3-5")` |
| "PDF를 워드로 변환" | `convert_pdf(target_format="docx")` |
| "비밀번호 걸어줘" | `protect_pdf()` |
| "워터마크 추가" | `add_watermark()` |

## Output Guidelines
- Always provide download links after successful operations.
- Report file size and page count in responses.
- For reading, present content in clean Markdown format.
- If an error occurs (e.g., LibreOffice not found), clearly state the missing dependency.
