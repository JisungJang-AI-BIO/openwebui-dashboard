# DOCX Tool — Ubuntu Server Test Guide

## Overview

이 문서는 Ubuntu 서버에서 DOCX Tool을 단계별로 테스트하기 위한 가이드입니다.
각 단계에서 결과를 확인하고, 오류 발생 시 debugging 정보를 수집하여 보고합니다.

> **모든 명령은 project root (clone한 디렉토리) 에서 실행합니다.**
> ```bash
> cd /path/to/OpenWebUI-Skills
> ```

---

## Pre-requisites Setup

### Step 0.1: Setup Script 실행 (권장)

```bash
# Docker: tests run inside the container
docker compose exec openwebui bash server-setup/setup.sh

# Or bare-metal:
bash server-setup/setup.sh
```

또는 개별 실행:

### Step 0.2: System Dependencies

```bash
bash server-setup/install-system-deps.sh

# 확인
echo "=== Version Check ==="
soffice --version
pandoc --version | head -1
node --version
npm --version
npm list -g docx
echo "=== Done ==="
```

**보고 사항**: 위 명령의 전체 출력을 보고해주세요.

### Step 0.3: Anthropic Scripts 배치

```bash
bash server-setup/clone-anthropic-scripts.sh

# 구조 확인:
# vendor/docx/
#   ├── accept_changes.py
#   ├── comment.py
#   └── office/
#       ├── pack.py, soffice.py, unpack.py, validate.py
#       ├── helpers/
#       ├── validators/
#       └── schemas/
```

### Step 0.4: Python Dependencies

```bash
bash server-setup/install-python-deps.sh --phase docx

# 확인
python -c "
import docx; print(f'python-docx: {docx.__version__}')
import lxml.etree; print(f'lxml: {lxml.etree.__version__}')
import mammoth; print('mammoth: OK')
import defusedxml; print('defusedxml: OK')
print('=== All OK ===')
"
```

**보고 사항**: python -c 명령의 출력을 보고해주세요.

---

## Test 1: Python Import Test

가장 기본적인 테스트 — Tool 파일이 Python module로 정상 import되는지 확인.

```bash
python -c "
import importlib.util
import sys

spec = importlib.util.spec_from_file_location('docx_tool', 'tools/docx_tool.py')
mod = importlib.util.module_from_spec(spec)
try:
    spec.loader.exec_module(mod)
    tool = mod.Tools()
    print('✅ Tool class imported successfully')
    print(f'   Valves: {tool.valves.model_dump()}')
    print(f'   Methods: {[m for m in dir(tool) if not m.startswith(\"_\") and callable(getattr(tool, m))]}')
except Exception as e:
    print(f'❌ Import failed: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
"
```

**Expected output:**
```
✅ Tool class imported successfully
   Valves: {'TEMP_DIR': '/tmp/openwebui-docx', 'MAX_FILE_SIZE_MB': 50, ...}
   Methods: ['convert_docx', 'create_docx', 'create_docx_from_js', 'edit_docx_xml', 'read_docx', 'validate_docx']
```

---

## Test 2: Create DOCX (python-docx)

```bash
python -c "
import asyncio, importlib.util, os, tempfile

spec = importlib.util.spec_from_file_location('docx_tool', 'tools/docx_tool.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

tool = mod.Tools()
tool.valves.TEMP_DIR = tempfile.mkdtemp(prefix='docx_test_')
print(f'Temp dir: {tool.valves.TEMP_DIR}')

events = []
async def emitter(evt): events.append(evt); print(f'  EVENT: {evt[\"type\"]}: {str(evt.get(\"data\",{}))[:100]}')

async def test():
    result = await tool.create_docx(
        content_description='''# Test Document
## Section 1
This is a test paragraph.

- Item one
- Item two
- Item three

| Header A | Header B | Header C |
| Cell 1 | Cell 2 | Cell 3 |
| Cell 4 | Cell 5 | Cell 6 |

## 한글 테스트
이것은 한글 테스트 문단입니다.
''',
        filename='test_create.docx',
        page_size='A4',
        __user__={'name': 'Tester'},
        __event_emitter__=emitter,
    )
    print(f'\nResult: {result}')

    output = os.path.join(tool.valves.TEMP_DIR, 'test_create.docx')
    if os.path.exists(output):
        print(f'✅ File created: {os.path.getsize(output)} bytes')
    else:
        print('❌ File NOT created')

asyncio.run(test())
"
```

**Expected:** `✅ File created: NNNN bytes`

---

## Test 3: Read DOCX

```bash
python -c "
import asyncio, importlib.util, os, tempfile

spec = importlib.util.spec_from_file_location('docx_tool', 'tools/docx_tool.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

tool = mod.Tools()
tool.valves.TEMP_DIR = tempfile.mkdtemp(prefix='docx_test_')

events = []
async def emitter(evt): events.append(evt)

async def test():
    # First create a file
    await tool.create_docx('# Hello World\nTest content\n\n| A | B |\n| 1 | 2 |', 'read_test.docx', __event_emitter__=emitter)
    fpath = os.path.join(tool.valves.TEMP_DIR, 'read_test.docx')

    # Test read (text mode)
    result = await tool.read_docx(mode='text', __files__=[{'path': fpath, 'filename': 'read_test.docx'}], __event_emitter__=emitter)
    print('=== TEXT MODE ===')
    print(result[:500])
    assert 'Hello World' in result, '❌ Expected heading not found'
    print('✅ text mode OK')

    # Test read (structured mode)
    result = await tool.read_docx(mode='structured', __files__=[{'path': fpath, 'filename': 'read_test.docx'}], __event_emitter__=emitter)
    print('\n=== STRUCTURED MODE ===')
    print(result[:500])
    assert 'Sections:' in result, '❌ Sections info not found'
    print('✅ structured mode OK')

    # Test read (xml mode)
    result = await tool.read_docx(mode='xml', __files__=[{'path': fpath, 'filename': 'read_test.docx'}], __event_emitter__=emitter)
    print('\n=== XML MODE ===')
    print(result[:300])
    assert 'w:document' in result, '❌ XML root element not found'
    print('✅ xml mode OK')

asyncio.run(test())
"
```

---

## Test 4: Validate DOCX

```bash
PROJ_DIR=$(pwd)

python -c "
import asyncio, importlib.util, os, tempfile

spec = importlib.util.spec_from_file_location('docx_tool', 'tools/docx_tool.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

tool = mod.Tools()
tool.valves.TEMP_DIR = tempfile.mkdtemp(prefix='docx_test_')
tool.valves.SCRIPTS_DIR = '$PROJ_DIR/vendor/docx'

events = []
async def emitter(evt): events.append(evt)

async def test():
    await tool.create_docx('# Validation Test\nContent.', 'validate_test.docx', __event_emitter__=emitter)
    fpath = os.path.join(tool.valves.TEMP_DIR, 'validate_test.docx')

    result = await tool.validate_docx(__files__=[{'path': fpath, 'filename': 'validate_test.docx'}], __event_emitter__=emitter)
    print(result)
    if 'PASSED' in result:
        print('✅ Validation test OK')
    else:
        print('⚠️ Validation issues found (may be expected if schemas not present)')

asyncio.run(test())
"
```

---

## Test 5: Create DOCX via docx-js (Node.js)

```bash
python -c "
import asyncio, importlib.util, os, tempfile

spec = importlib.util.spec_from_file_location('docx_tool', 'tools/docx_tool.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

tool = mod.Tools()
tool.valves.TEMP_DIR = tempfile.mkdtemp(prefix='docx_test_')

events = []
async def emitter(evt): events.append(evt); print(f'  EVENT: {evt[\"type\"]}: {str(evt.get(\"data\",{}))[:100]}')

async def test():
    js_code = '''
const doc = new Document({
    styles: {
        default: { document: { run: { font: \"Arial\", size: 24 } } }
    },
    sections: [{
        properties: {
            page: {
                size: { width: 11906, height: 16838 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
        },
        children: [
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                children: [new TextRun({ text: \"Document Created via docx-js\", bold: true })]
            }),
            new Paragraph({
                children: [new TextRun(\"This document was created using the docx npm library, executed via Node.js subprocess.\")]
            }),
            new Paragraph({
                children: [new TextRun(\"한글 테스트: 이 문서는 docx-js로 생성되었습니다.\")]
            }),
            new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [4513, 4513],
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(\"Header 1\")], width: { size: 4513, type: WidthType.DXA } }),
                            new TableCell({ children: [new Paragraph(\"Header 2\")], width: { size: 4513, type: WidthType.DXA } }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(\"Cell A\")], width: { size: 4513, type: WidthType.DXA } }),
                            new TableCell({ children: [new Paragraph(\"Cell B\")], width: { size: 4513, type: WidthType.DXA } }),
                        ]
                    }),
                ]
            })
        ]
    }]
});
'''
    result = await tool.create_docx_from_js(
        js_code=js_code,
        filename='docxjs_test.docx',
        __event_emitter__=emitter,
    )
    print(f'\nResult: {result}')

    output = os.path.join(tool.valves.TEMP_DIR, 'docxjs_test.docx')
    if os.path.exists(output):
        print(f'✅ docx-js file created: {os.path.getsize(output)} bytes')
    else:
        print('❌ docx-js file NOT created')

asyncio.run(test())
"
```

**Expected:** `✅ docx-js file created: NNNN bytes`

---

## Test 6: Edit DOCX (XML unpack/replace/repack)

```bash
PROJ_DIR=$(pwd)

python -c "
import asyncio, importlib.util, os, tempfile

spec = importlib.util.spec_from_file_location('docx_tool', 'tools/docx_tool.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

tool = mod.Tools()
tool.valves.TEMP_DIR = tempfile.mkdtemp(prefix='docx_test_')
tool.valves.SCRIPTS_DIR = '$PROJ_DIR/vendor/docx'

events = []
async def emitter(evt): events.append(evt)

async def test():
    # Create source document
    await tool.create_docx('# Original Title\nOriginal content here.', 'edit_source.docx', __event_emitter__=emitter)
    fpath = os.path.join(tool.valves.TEMP_DIR, 'edit_source.docx')

    # Test unpack
    print('=== UNPACK ===')
    result = await tool.edit_docx_xml('unpack', '', __files__=[{'path': fpath, 'filename': 'edit_source.docx'}], __event_emitter__=emitter)
    print(result[:500])
    assert 'unpacked' in result.lower() or 'Unpacked' in result, '❌ Unpack failed'
    print('✅ Unpack OK')

    # Test replace_text
    print('\n=== REPLACE TEXT ===')
    result = await tool.edit_docx_xml('replace_text', 'Original Title|||Modified Title', __files__=[{'path': fpath, 'filename': 'edit_source.docx'}], __event_emitter__=emitter)
    print(result)
    assert 'Error' not in result or 'occurrence' in result, f'❌ Replace failed: {result}'
    print('✅ Replace text OK')

asyncio.run(test())
"
```

---

## Test 7: Convert DOCX → PDF

```bash
python -c "
import asyncio, importlib.util, os, tempfile

spec = importlib.util.spec_from_file_location('docx_tool', 'tools/docx_tool.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

tool = mod.Tools()
tool.valves.TEMP_DIR = tempfile.mkdtemp(prefix='docx_test_')

events = []
async def emitter(evt): events.append(evt); print(f'  EVENT: {evt[\"type\"]}: {str(evt.get(\"data\",{}))[:100]}')

async def test():
    await tool.create_docx('# PDF Test\nContent for PDF conversion.', 'pdf_source.docx', __event_emitter__=emitter)
    fpath = os.path.join(tool.valves.TEMP_DIR, 'pdf_source.docx')

    result = await tool.convert_docx('pdf', __files__=[{'path': fpath, 'filename': 'pdf_source.docx'}], __event_emitter__=emitter)
    print(f'\nResult: {result}')

    pdf_path = os.path.join(tool.valves.TEMP_DIR, 'pdf_source.pdf')
    if os.path.exists(pdf_path):
        print(f'✅ PDF created: {os.path.getsize(pdf_path)} bytes')
    else:
        print('❌ PDF NOT created (LibreOffice may not be working)')

asyncio.run(test())
"
```

---

## Test 8: Anthropic Scripts Direct Test

원본 Anthropic scripts가 서버에서 직접 실행되는지 확인.

```bash
# Test unpack.py
SCRIPTS_DIR="$(pwd)/vendor/docx/office"

# 먼저 test file 준비 (Test 2에서 생성된 파일 사용)
TEST_DOCX="/tmp/docx_test_*/test_create.docx"
ACTUAL_PATH=$(ls $TEST_DOCX 2>/dev/null | head -1)

if [ -z "$ACTUAL_PATH" ]; then
    echo "❌ No test docx found. Run Test 2 first."
    exit 1
fi

echo "=== Testing unpack.py ==="
python "$SCRIPTS_DIR/unpack.py" "$ACTUAL_PATH" /tmp/docx_unpack_test/
echo "Exit code: $?"
ls -la /tmp/docx_unpack_test/word/ 2>/dev/null

echo ""
echo "=== Testing validate.py ==="
python "$SCRIPTS_DIR/validate.py" "$ACTUAL_PATH"
echo "Exit code: $?"

echo ""
echo "=== Testing pack.py ==="
python "$SCRIPTS_DIR/pack.py" /tmp/docx_unpack_test/ /tmp/docx_repacked_test.docx
echo "Exit code: $?"
ls -la /tmp/docx_repacked_test.docx 2>/dev/null
```

---

## Debugging: Common Issues

### Issue: `ModuleNotFoundError: No module named 'defusedxml'`

```bash
# Python 경로 확인
which python
python -c "import sys; print(sys.executable); print(sys.path)"

# 필요 시 재설치
pip install defusedxml
```

### Issue: `validators` import error in Anthropic scripts

```bash
# validators/ 디렉토리 확인
ls -la vendor/docx/office/validators/__init__.py

# PYTHONPATH 설정이 필요할 수 있음
cd vendor/docx/office && python -c "from validators import DOCXSchemaValidator; print('OK')"
```

### Issue: LibreOffice `soffice` not found

```bash
which soffice
soffice --version

# 없으면
sudo apt-get install -y libreoffice
```

### Issue: Node.js `docx` module not found

```bash
node -e "const docx = require('docx'); console.log('docx version:', Object.keys(docx).length, 'exports')"

# 없으면
npm install -g docx

# 또는 project-local
npm init -y && npm install docx
# 이 경우 Valve의 DOCXJS_REQUIRE_PATH를 absolute path로 설정
```

### Issue: File path resolution in OpenWebUI

```bash
# OpenWebUI가 upload file을 어디에 저장하는지 확인
ls -la /app/backend/data/uploads/ 2>/dev/null
ls -la $(python -c "from open_webui.config import UPLOAD_DIR; print(UPLOAD_DIR)" 2>/dev/null)

# 실제 경로를 확인한 후 _resolve_docx_file() 의 candidates 목록에 추가 필요할 수 있음
```

### Issue: EventEmitter / file download not working in OpenWebUI

OpenWebUI에서 base64 data URI 기반 download link가 동작하지 않는 경우:
- File size가 너무 큰 경우 (>5MB) base64 encoding이 비효율적
- OpenWebUI의 message rendering이 data URI를 block할 수 있음
- 대안: OpenWebUI의 file API를 사용하여 서버에 저장 후 URL 반환

---

## Test Summary Template

테스트 완료 후 아래 template으로 결과를 보고해주세요:

```
## Test Results

### Environment
- Ubuntu version:
- Python version:
- Docker image tag:
- Node.js version:
- LibreOffice version:
- Project path:

### Pre-requisites
- [ ] System deps installed (server-setup/install-system-deps.sh)
- [ ] Anthropic scripts in vendor/ (server-setup/clone-anthropic-scripts.sh)
- [ ] Python deps installed (server-setup/install-python-deps.sh)
- [ ] Node.js + docx installed

### Test Results
| Test | Result | Notes |
|------|--------|-------|
| 1. Import | ✅/❌ | |
| 2. Create DOCX | ✅/❌ | |
| 3. Read DOCX | ✅/❌ | |
| 4. Validate | ✅/❌ | |
| 5. docx-js | ✅/❌ | |
| 6. Edit XML | ✅/❌ | |
| 7. Convert PDF | ✅/❌ | |
| 8. Scripts direct | ✅/❌ | |

### Errors (if any)
[전체 error traceback 붙여넣기]
```
