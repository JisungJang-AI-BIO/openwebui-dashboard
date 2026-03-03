# Design Decisions: 변환 포인트의 필수성 분석

## 핵심 질문

> "npm→Python 변환은 필수 불가결한가?
> 재현성이나 오류 대응 측면에서 원본 그대로 가는 게 편할 텐데, 굳이 변환한 이유는?"

---

## 결론 먼저

**변환이 필수 불가결한 부분과 그렇지 않은 부분이 혼재한다.**

| 변환 포인트 | 필수 여부 | 이유 |
|------------|----------|------|
| Bash script → Python method | **필수** | OpenWebUI Tool은 Python만 실행 가능, Bash subprocess 불가 |
| Local filesystem → `__files__` | **필수** | OpenWebUI는 upload 기반, 직접 FS access 불가 |
| docx-js (npm) → python-docx | **선택** (아래 분석 참조) | Node.js가 서버에 있으면 subprocess로 호출 가능 |
| pandoc, LibreOffice 호출 | **변환 불필요** | Python subprocess로 동일하게 호출 가능 |
| XML unpack/pack/validate | **변환 불필요** | 원본이 이미 Python, 거의 그대로 사용 가능 |

---

## 변환 포인트별 상세 분석

### 1. Bash script 실행 → Python method (필수)

**원본 동작:**
```
Claude Code → Bash → python scripts/office/unpack.py document.docx unpacked/
```

**OpenWebUI 환경:**
```
OpenWebUI Tool (Python) → subprocess/직접 호출 → unpack logic
```

- OpenWebUI Tool의 실행 환경은 Python process 내부
- Bash 직접 실행은 불가하지만, **`subprocess.run()`으로 Python script를 호출하는 것은 가능**
- 따라서 원본 `scripts/*.py`를 **그대로 서버에 배치**하고, Tool에서 subprocess로 호출하면 변환 최소화 가능

**권장 접근:**
```python
# 변환하지 않고 원본 script를 그대로 호출
result = subprocess.run(
    ["python", "vendor/docx/office/unpack.py", file_path, unpack_dir],
    capture_output=True, text=True
)
```

### 2. docx-js (npm) → python-docx (선택)

**이것이 가장 큰 변환 포인트이자 가장 논쟁적인 부분.**

#### Option A: python-docx로 변환 (현재 구현)

**장점:**
- Python-only dependency, Node.js 설치 불필요
- Docker 컨테이너 내 pip 환경에서 완결
- OpenWebUI Tool 내에서 직접 호출 (subprocess 없음)

**단점:**
- Anthropic SKILL.md의 전체 docx-js reference section이 무용지물
- python-docx API와 docx-js API가 완전히 다름 → LLM이 새로운 API를 학습해야 함
- python-docx의 한계:
  - Table of Contents 생성 제한 (필드만 삽입, 실제 생성은 Word에서)
  - 복잡한 테이블 styling이 docx-js보다 제한적
  - numbering/list의 세밀한 제어가 어려움
- **재현성 없음**: Anthropic이 docx-js로 테스트한 모든 edge case, 워크어라운드가 적용 안 됨

#### Option B: Node.js + docx-js를 subprocess로 호출 (원본 유지)

**장점:**
- **재현성 100%**: Anthropic SKILL.md의 reference가 그대로 유효
- Anthropic이 발견한 모든 pitfall/workaround가 그대로 적용
  - 예: `ShadingType.CLEAR` 사용 (SOLID는 렌더링 이슈)
  - 예: `WidthType.DXA` 필수 (PERCENTAGE는 Google Docs 호환 깨짐)
  - 예: `columnWidths` + cell `width` 이중 설정 필수
- SKILL.md를 OpenWebUI Skill로 **거의 그대로** 이관 가능
- LLM이 JavaScript 코드를 생성 → Tool이 Node.js로 실행
- **오류 대응**: Anthropic의 validation/repair 로직이 그대로 동작

**단점:**
- 서버에 Node.js + npm 설치 필요 (`apt install nodejs npm && npm install -g docx`)
- subprocess 호출의 overhead (무시 가능 수준)
- Two-runtime 환경 관리 (Python + Node.js)

#### Option C: Hybrid (권장)

| 기능 | 사용 기술 | 이유 |
|------|----------|------|
| **Document creation** | **docx-js (Node.js)** | 복잡한 레이아웃, 테이블, 스타일 → docx-js가 우세 |
| **Document reading** | python-docx 또는 pandoc | 읽기는 python-docx로 충분 |
| **XML editing** | 원본 Python scripts (unpack/pack/validate) | 이미 Python, 변환 불필요 |
| **Format conversion** | LibreOffice / Pandoc (subprocess) | 원본과 동일 |
| **Tracked changes** | 원본 accept_changes.py (subprocess) | 이미 Python |

```
OpenWebUI Tool (Python orchestrator)
  ├── read_docx()     → python-docx (direct import)
  ├── create_docx()   → docx-js via Node.js subprocess  ← 원본 유지
  ├── edit_docx()     → unpack.py / pack.py subprocess   ← 원본 유지
  ├── convert_docx()  → LibreOffice / Pandoc subprocess   ← 원본 유지
  └── validate_docx() → validate.py subprocess            ← 원본 유지
```

---

## 권장안: Option C (Hybrid)

### 이유

1. **재현성**: docx-js 기반의 Anthropic reference가 가장 검증된 문서 생성 경로
2. **오류 대응**: Anthropic이 축적한 edge case 대응이 그대로 유효
3. **변환 최소화**: unpack/pack/validate/accept_changes 등 원본 Python script는 변환 없이 사용
4. **실용성**: 서버에 Node.js 설치는 `apt install nodejs npm`으로 간단

### 서버 추가 설치

```bash
# Node.js + npm
sudo apt install -y nodejs npm

# docx library (global)
npm install -g docx

# 또는 project-local
cd vendor/docx
npm init -y
npm install docx
```

### Tool 구조 변경

```python
async def create_docx(self, js_code: str, filename: str, ...) -> str:
    """
    Create a new Word document by executing docx-js JavaScript code.
    The LLM generates JavaScript code using the docx library.

    :param js_code: JavaScript code using docx library to create the document
    :param filename: Output filename
    :return: Status message with download link
    """
    temp_dir = self._ensure_temp_dir()
    js_file = os.path.join(temp_dir, "create_doc.js")
    output_path = os.path.join(temp_dir, filename)

    # Write JS code to temp file
    full_js = f"""
const {{ Document, Packer, ... }} = require('docx');
const fs = require('fs');

{js_code}

// Write output
Packer.toBuffer(doc).then(buffer => {{
    fs.writeFileSync("{output_path.replace(os.sep, '/')}", buffer);
    console.log("SUCCESS");
}});
"""
    with open(js_file, 'w') as f:
        f.write(full_js)

    result = subprocess.run(
        ["node", js_file],
        capture_output=True, text=True, timeout=30
    )
    ...
```

---

## 원본 유지 가능한 Script 목록

Anthropic 원본 scripts 중 **변환 없이 그대로 사용 가능한 것**:

| Script | 변경 사항 | 비고 |
|--------|----------|------|
| `scripts/office/unpack.py` | **없음** | subprocess로 호출 |
| `scripts/office/pack.py` | **없음** | subprocess로 호출 |
| `scripts/office/validate.py` | **없음** | subprocess로 호출 |
| `scripts/office/soffice.py` | **없음** | 원본 그대로 import |
| `scripts/office/helpers/merge_runs.py` | **없음** | unpack이 내부 호출 |
| `scripts/office/helpers/simplify_redlines.py` | **없음** | unpack이 내부 호출 |
| `scripts/office/validators/*` | **없음** | validate/pack이 내부 호출 |
| `scripts/accept_changes.py` | **없음** | subprocess로 호출 |
| `scripts/comment.py` | **없음** | subprocess로 호출 |
| `scripts/templates/*.xml` | **없음** | comment.py가 참조 |

**결론: 16개 Python script 중 변환이 필요한 것은 0개.**
전부 서버에 배치하고 subprocess로 호출하면 됨.

---

## 최종 변환 포인트 요약 (Hybrid 접근 시)

| 원본 | 변환 | 필수 여부 | 변환 범위 |
|------|------|----------|----------|
| SKILL.md → OpenWebUI Skill | Markdown text 정리 | 필수 | 소규모 (content만 정리) |
| scripts/*.py → subprocess 호출 | **변환 불필요** | - | - |
| docx-js → Node.js subprocess | **변환 불필요** | - | Node.js 설치만 필요 |
| allowed-tools: Bash → OpenWebUI Tool wrapper | 필수 | Python wrapper 작성 | Tool orchestration 로직만 |
| `__files__` 연동 | 필수 | File upload/download bridging | 소규모 |

**실질적 신규 작성 코드**: OpenWebUI Tool wrapper (orchestrator) ~200줄 정도.
**변환 대상 코드**: 0줄 (원본 전부 재사용).
