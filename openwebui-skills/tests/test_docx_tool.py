"""
Local test for DOCX Tool — verifies core functionality without OpenWebUI runtime.

Usage:
    python test_docx_tool.py

Requires: python-docx, lxml, mammoth, defusedxml
"""

import asyncio
import os
import sys
import tempfile

# Add parent dir to path so we can import the tool
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# =============================================================================
# Minimal mock for OpenWebUI's event emitter
# =============================================================================
class MockEventLog:
    def __init__(self):
        self.events = []

    async def __call__(self, event: dict):
        self.events.append(event)
        evt_type = event.get("type", "")
        data = event.get("data", {})
        if evt_type == "status":
            status = data.get("status", "in_progress")
            desc = data.get("description", "")
            done = data.get("done", False)
            icon = "✅" if status == "success" else "❌" if status == "error" else "⏳"
            print(f"  {icon} [{status}] {desc}")
        elif evt_type == "message":
            content = data.get("content", "")
            # Truncate base64 data for display
            if "base64," in content:
                content = content[:100] + "...(base64 data truncated)"
            print(f"  📨 [message] {content[:200]}")


# =============================================================================
# Import and instantiate tool
# =============================================================================
def create_tool():
    """Import the Tool class from docx_tool.py and create instance."""
    # We need to import the module dynamically
    import importlib.util

    tool_path = os.path.join(
        os.path.dirname(__file__), "..", "tools", "docx_tool.py"
    )
    spec = importlib.util.spec_from_file_location("docx_tool", tool_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    tool = module.Tools()
    # Override temp dir for Windows testing
    tool.valves.TEMP_DIR = os.path.join(tempfile.gettempdir(), "openwebui-docx-test")
    os.makedirs(tool.valves.TEMP_DIR, exist_ok=True)
    return tool


# =============================================================================
# Test Cases
# =============================================================================
async def test_create_docx(tool):
    """Test: Create a new DOCX document."""
    print("\n" + "=" * 60)
    print("TEST 1: Create DOCX Document")
    print("=" * 60)

    emitter = MockEventLog()

    content_spec = """# Project Status Report

## Executive Summary

This document provides an overview of the current project status,
including key milestones achieved and upcoming deliverables.

## Key Metrics

| Metric | Target | Actual | Status |
| Revenue | $1.2M | $1.35M | Exceeded |
| Users | 10,000 | 9,500 | On Track |
| NPS | 45 | 52 | Exceeded |

## Completed Items

- Backend API v2.0 deployment
- Database migration completed
- Security audit passed
- Performance optimization (30% improvement)

## Next Steps

1. Frontend redesign launch
2. Mobile app beta release
3. Partner integration phase 2

---

## Appendix

> Note: All figures are preliminary and subject to final audit review.
> Contact the project team for detailed breakdowns.

### Document Information

**Author:** Internal Team
**Date:** 2026-02-24
**Classification:** Internal Use Only
"""

    result = await tool.create_docx(
        content_spec=content_spec,
        filename="test_report.docx",
        page_size="A4",
        orientation="portrait",
        __user__={"name": "Test User"},
        __event_emitter__=emitter,
    )

    print(f"\n  Result: {result}")

    # Verify file was created
    output_path = os.path.join(tool.valves.TEMP_DIR, "test_report.docx")
    assert os.path.exists(output_path), "Output file not created!"
    file_size = os.path.getsize(output_path)
    print(f"  File size: {file_size:,} bytes")
    assert file_size > 0, "Output file is empty!"

    return output_path


async def test_read_docx(tool, file_path: str):
    """Test: Read a DOCX document."""
    print("\n" + "=" * 60)
    print("TEST 2: Read DOCX Document (text mode)")
    print("=" * 60)

    emitter = MockEventLog()

    result = await tool.read_docx(
        mode="text",
        __files__=[{"path": file_path, "filename": "test_report.docx"}],
        __event_emitter__=emitter,
    )

    print(f"\n  Content preview (first 500 chars):")
    print(f"  {'-'*40}")
    for line in result[:500].split("\n"):
        print(f"  {line}")
    print(f"  {'-'*40}")

    assert "Project Status Report" in result, "Expected heading not found in content!"
    assert "Revenue" in result, "Expected table content not found!"
    print("  ✅ Content verification passed")


async def test_read_docx_structured(tool, file_path: str):
    """Test: Read a DOCX document in structured mode."""
    print("\n" + "=" * 60)
    print("TEST 3: Read DOCX Document (structured mode)")
    print("=" * 60)

    emitter = MockEventLog()

    result = await tool.read_docx(
        mode="structured",
        __files__=[{"path": file_path, "filename": "test_report.docx"}],
        __event_emitter__=emitter,
    )

    print(f"\n  Structured content preview:")
    print(f"  {'-'*40}")
    for line in result[:600].split("\n"):
        print(f"  {line}")
    print(f"  {'-'*40}")

    assert "Sections:" in result, "Sections info not found!"
    assert "Paragraphs:" in result, "Paragraphs count not found!"
    print("  ✅ Structured read verification passed")


async def test_edit_docx_replace(tool, file_path: str):
    """Test: Edit DOCX - replace text."""
    print("\n" + "=" * 60)
    print("TEST 4: Edit DOCX (replace_text)")
    print("=" * 60)

    emitter = MockEventLog()

    result = await tool.edit_docx(
        operation="replace_text",
        parameters="Executive Summary|||경영진 요약",
        __files__=[{"path": file_path, "filename": "test_report.docx"}],
        __event_emitter__=emitter,
    )

    print(f"\n  Result: {result}")
    assert "Error" not in result, f"Edit failed: {result}"
    print("  ✅ Replace text passed")


async def test_validate_docx(tool, file_path: str):
    """Test: Validate DOCX structure."""
    print("\n" + "=" * 60)
    print("TEST 5: Validate DOCX Structure")
    print("=" * 60)

    emitter = MockEventLog()

    result = await tool.validate_docx(
        __files__=[{"path": file_path, "filename": "test_report.docx"}],
        __event_emitter__=emitter,
    )

    print(f"\n  Result: {result}")
    assert "PASSED" in result, f"Validation should pass for a fresh document: {result}"
    print("  ✅ Validation passed")


async def test_unpack_docx(tool, file_path: str):
    """Test: Unpack DOCX to inspect XML."""
    print("\n" + "=" * 60)
    print("TEST 6: Unpack DOCX (XML inspection)")
    print("=" * 60)

    emitter = MockEventLog()

    result = await tool.unpack_docx(
        __files__=[{"path": file_path, "filename": "test_report.docx"}],
        __event_emitter__=emitter,
    )

    print(f"\n  Result preview (first 400 chars):")
    print(f"  {'-'*40}")
    for line in result[:400].split("\n"):
        print(f"  {line}")
    print(f"  {'-'*40}")

    assert "document.xml" in result, "document.xml not found in output!"
    assert "DOCX Structure" in result, "Structure header not found!"
    print("  ✅ Unpack passed")


async def test_create_korean_docx(tool):
    """Test: Create a DOCX with Korean content."""
    print("\n" + "=" * 60)
    print("TEST 7: Create Korean DOCX")
    print("=" * 60)

    emitter = MockEventLog()

    content_spec = """# 프로젝트 현황 보고서

## 개요

본 문서는 2026년 1분기 프로젝트 진행 현황을 정리한 보고서입니다.

## 주요 성과

| 항목 | 목표 | 실적 | 달성률 |
| 매출 | 12억원 | 13.5억원 | 112.5% |
| 신규 고객 | 100명 | 95명 | 95% |
| 고객 만족도 | 4.5 | 4.7 | 104.4% |

## 완료 항목

- 백엔드 API v2.0 배포 완료
- 데이터베이스 마이그레이션 완료
- 보안 감사 통과
- 성능 최적화 (30% 개선)

## 향후 계획

1. 프론트엔드 리디자인 런칭
2. 모바일 앱 베타 릴리스
3. 파트너 연동 2단계
"""

    result = await tool.create_docx(
        content_spec=content_spec,
        filename="korean_report.docx",
        page_size="A4",
        orientation="portrait",
        __user__={"name": "테스트 사용자"},
        __event_emitter__=emitter,
    )

    print(f"\n  Result: {result}")

    output_path = os.path.join(tool.valves.TEMP_DIR, "korean_report.docx")
    assert os.path.exists(output_path), "Korean DOCX not created!"

    # Verify Korean content is readable
    read_result = await tool.read_docx(
        mode="text",
        __files__=[{"path": output_path, "filename": "korean_report.docx"}],
        __event_emitter__=MockEventLog(),
    )
    assert "프로젝트" in read_result, "Korean text not found in output!"
    assert "매출" in read_result, "Korean table content not found!"
    print("  ✅ Korean DOCX creation and read-back passed")


# =============================================================================
# Main
# =============================================================================
async def main():
    print("=" * 60)
    print("  DOCX Tool Local Test Suite")
    print("=" * 60)

    tool = create_tool()
    print(f"\nTemp directory: {tool.valves.TEMP_DIR}")

    try:
        # Test 1: Create
        file_path = await test_create_docx(tool)

        # Test 2-6: Read, structured, edit, validate, unpack
        await test_read_docx(tool, file_path)
        await test_read_docx_structured(tool, file_path)
        await test_edit_docx_replace(tool, file_path)
        await test_validate_docx(tool, file_path)
        await test_unpack_docx(tool, file_path)

        # Test 7: Korean content
        await test_create_korean_docx(tool)

        print("\n" + "=" * 60)
        print("  ALL TESTS PASSED ✅")
        print("=" * 60)

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
