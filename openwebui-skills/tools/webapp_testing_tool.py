"""
title: Web App Testing Tool
author: Internal Team
author_url: https://github.com/anthropics/skills
description: Automated web application testing using Playwright.
    Use when user requests web testing, UI testing, E2E testing, screenshot capture,
    or DOM inspection of web pages.
required_open_webui_version: 0.8.5
requirements: playwright
version: 1.0.0
licence: MIT
"""

import asyncio
import base64
import json
import os
import subprocess
from pathlib import Path
from typing import Any, Callable, Optional

from pydantic import BaseModel, Field


# =============================================================================
# EventEmitter Helper
# =============================================================================
class EventEmitter:
    def __init__(self, event_emitter: Callable[[dict], Any] = None):
        self.event_emitter = event_emitter

    async def emit(self, description="Unknown State", status="in_progress", done=False):
        if self.event_emitter:
            await self.event_emitter(
                {"type": "status", "data": {"status": status, "description": description, "done": done}}
            )

    async def progress(self, description: str):
        await self.emit(description)

    async def success(self, description: str):
        await self.emit(description, "success", True)

    async def error(self, description: str):
        await self.emit(description, "error", True)

    async def send_file_link(self, file_path: str, filename: str, mime_type: str = None):
        if not self.event_emitter or not os.path.exists(file_path):
            return
        mime_type = mime_type or "image/png"
        with open(file_path, "rb") as f:
            file_data = base64.b64encode(f.read()).decode("utf-8")
        await self.event_emitter(
            {"type": "message", "data": {"content": f"\n\n📸 **{filename}**\n\n![{filename}](data:{mime_type};base64,{file_data})\n\n[Download {filename}](data:{mime_type};base64,{file_data})\n"}}
        )


# =============================================================================
# Main Tool Class
# =============================================================================
class Tools:
    class Valves(BaseModel):
        TEMP_DIR: str = Field(default="/tmp/openwebui-webtest", description="Temporary file storage path")
        TIMEOUT: int = Field(default=30000, description="Default timeout in milliseconds")
        HEADLESS: bool = Field(default=True, description="Run browser in headless mode")
        BROWSER: str = Field(default="chromium", description="Browser engine: chromium, firefox, webkit")
        SCRIPTS_DIR: str = Field(
            default="",
            description="Path to Anthropic webapp-testing scripts (e.g. /app/OpenWebUI-Skills/vendor/webapp-testing). Leave empty for direct Playwright usage.",
        )

    def __init__(self):
        self.valves = self.Valves()
        self.citation = False

    async def take_screenshot(
        self,
        url: str,
        filename: str = "screenshot.png",
        selector: str = "",
        full_page: bool = True,
        viewport_width: int = 1280,
        viewport_height: int = 720,
        wait_for: str = "networkidle",
        __user__: dict = None,
        __event_emitter__: Callable[[dict], Any] = None,
    ) -> str:
        """
        Take a screenshot of a web page or specific element.

        :param url: URL to navigate to
        :param filename: Output filename (default: screenshot.png)
        :param selector: CSS selector to screenshot a specific element (empty = full page)
        :param full_page: Capture full scrollable page (default: True)
        :param viewport_width: Browser viewport width
        :param viewport_height: Browser viewport height
        :param wait_for: Wait strategy - "networkidle", "load", "domcontentloaded"
        :return: Screenshot with download link
        """
        emitter = EventEmitter(__event_emitter__)
        await emitter.progress(f"Taking screenshot of {url}...")

        try:
            from playwright.sync_api import sync_playwright

            temp_dir = self._ensure_temp_dir()
            output_path = os.path.join(temp_dir, filename)

            with sync_playwright() as p:
                browser = self._launch_browser(p)
                context = browser.new_context(viewport={"width": viewport_width, "height": viewport_height})
                page = context.new_page()

                page.goto(url, timeout=self.valves.TIMEOUT)
                page.wait_for_load_state(wait_for, timeout=self.valves.TIMEOUT)

                if selector:
                    element = page.query_selector(selector)
                    if element:
                        element.screenshot(path=output_path)
                    else:
                        await emitter.error(f"Selector '{selector}' not found")
                        browser.close()
                        return f"Error: Element '{selector}' not found on the page."
                else:
                    page.screenshot(path=output_path, full_page=full_page)

                browser.close()

            await emitter.send_file_link(output_path, filename)
            await emitter.success(f"Screenshot saved: {filename}")
            return f"Screenshot of {url} saved as '{filename}' ({os.path.getsize(output_path):,} bytes)."

        except Exception as e:
            await emitter.error(f"Screenshot error: {str(e)}")
            return f"Error: {str(e)}"

    async def inspect_page(
        self,
        url: str,
        selector: str = "body",
        action: str = "text",
        wait_for: str = "networkidle",
        __user__: dict = None,
        __event_emitter__: Callable[[dict], Any] = None,
    ) -> str:
        """
        Inspect a web page's DOM: extract text, attributes, or HTML of elements.

        Actions:
        - "text": Get text content of matching elements
        - "html": Get outer HTML of matching elements
        - "attributes": Get all attributes of matching elements
        - "count": Count matching elements
        - "links": Extract all links (href) from the page
        - "forms": Extract form structure (inputs, selects, textareas)

        :param url: URL to navigate to
        :param selector: CSS selector to target elements (default: "body")
        :param action: What to extract - "text", "html", "attributes", "count", "links", "forms"
        :param wait_for: Wait strategy - "networkidle", "load", "domcontentloaded"
        :return: Extracted information
        """
        emitter = EventEmitter(__event_emitter__)
        await emitter.progress(f"Inspecting {url}...")

        try:
            from playwright.sync_api import sync_playwright

            with sync_playwright() as p:
                browser = self._launch_browser(p)
                page = browser.new_page()
                page.goto(url, timeout=self.valves.TIMEOUT)
                page.wait_for_load_state(wait_for, timeout=self.valves.TIMEOUT)

                if action == "text":
                    elements = page.query_selector_all(selector)
                    texts = [el.text_content().strip() for el in elements if el.text_content()]
                    result = f"Found {len(texts)} element(s) matching '{selector}':\n\n"
                    for i, t in enumerate(texts[:50]):
                        result += f"{i+1}. {t[:500]}\n"

                elif action == "html":
                    elements = page.query_selector_all(selector)
                    result = f"Found {len(elements)} element(s):\n\n"
                    for i, el in enumerate(elements[:10]):
                        html = el.evaluate("e => e.outerHTML")
                        result += f"### Element {i+1}\n```html\n{html[:2000]}\n```\n\n"

                elif action == "attributes":
                    elements = page.query_selector_all(selector)
                    result = f"Found {len(elements)} element(s):\n\n"
                    for i, el in enumerate(elements[:20]):
                        attrs = el.evaluate("e => Object.fromEntries([...e.attributes].map(a => [a.name, a.value]))")
                        result += f"{i+1}. {json.dumps(attrs, indent=2)}\n"

                elif action == "count":
                    count = len(page.query_selector_all(selector))
                    result = f"Found **{count}** element(s) matching `{selector}`."

                elif action == "links":
                    links = page.evaluate("""
                        () => Array.from(document.querySelectorAll('a[href]')).map(a => ({
                            text: a.textContent.trim().substring(0, 100),
                            href: a.href
                        })).filter(l => l.text)
                    """)
                    result = f"Found {len(links)} links:\n\n"
                    for l in links[:100]:
                        result += f"- [{l['text']}]({l['href']})\n"

                elif action == "forms":
                    forms = page.evaluate("""
                        () => Array.from(document.querySelectorAll('form')).map(f => ({
                            action: f.action,
                            method: f.method,
                            inputs: Array.from(f.querySelectorAll('input,select,textarea')).map(i => ({
                                tag: i.tagName.toLowerCase(),
                                type: i.type || '',
                                name: i.name || '',
                                id: i.id || '',
                                placeholder: i.placeholder || ''
                            }))
                        }))
                    """)
                    result = f"Found {len(forms)} form(s):\n\n"
                    for i, form in enumerate(forms):
                        result += f"### Form {i+1} ({form['method'].upper()} {form['action']})\n"
                        for inp in form["inputs"]:
                            result += f"  - `<{inp['tag']}` type={inp['type']} name={inp['name']}"
                            if inp["placeholder"]:
                                result += f" placeholder=\"{inp['placeholder']}\""
                            result += ">\n"
                else:
                    result = f"Unknown action '{action}'. Available: text, html, attributes, count, links, forms"

                browser.close()

            await emitter.success(f"Inspected {url}")
            return result

        except Exception as e:
            await emitter.error(f"Inspection error: {str(e)}")
            return f"Error: {str(e)}"

    async def run_test_script(
        self,
        script_code: str,
        url: str = "",
        __user__: dict = None,
        __event_emitter__: Callable[[dict], Any] = None,
    ) -> str:
        """
        Execute a Playwright Python test script.

        The script receives these variables:
        - `page`: Playwright Page object (already navigated to `url` if provided)
        - `browser`: Playwright Browser object
        - `context`: Playwright BrowserContext
        - `results`: list — append strings to collect test results

        Example:
        ```
        page.goto("https://example.com")
        title = page.title()
        results.append(f"Page title: {title}")
        assert "Example" in title, "Title should contain 'Example'"
        results.append("PASS: Title check")
        ```

        :param script_code: Python code using Playwright API
        :param url: Optional URL to navigate to before running script
        :return: Test results
        """
        emitter = EventEmitter(__event_emitter__)
        await emitter.progress("Running test script...")

        try:
            from playwright.sync_api import sync_playwright

            temp_dir = self._ensure_temp_dir()

            with sync_playwright() as p:
                browser = self._launch_browser(p)
                context = browser.new_context()
                page = context.new_page()

                if url:
                    page.goto(url, timeout=self.valves.TIMEOUT)
                    page.wait_for_load_state("networkidle", timeout=self.valves.TIMEOUT)

                results = []
                exec_globals = {
                    "page": page, "browser": browser, "context": context,
                    "results": results, "temp_dir": temp_dir,
                }

                try:
                    exec(script_code, exec_globals)
                except AssertionError as ae:
                    results.append(f"FAIL: {str(ae)}")
                except Exception as ex:
                    results.append(f"ERROR: {str(ex)}")

                browser.close()

            output = "\n".join(results) if results else "Script executed with no output."

            passed = sum(1 for r in results if r.startswith("PASS"))
            failed = sum(1 for r in results if r.startswith("FAIL"))
            errors = sum(1 for r in results if r.startswith("ERROR"))

            await emitter.success(f"Tests done: {passed} passed, {failed} failed, {errors} errors")
            return f"## Test Results\n\nPassed: {passed}, Failed: {failed}, Errors: {errors}\n\n```\n{output}\n```"

        except Exception as e:
            await emitter.error(f"Test error: {str(e)}")
            return f"Error: {str(e)}"

    # =========================================================================
    # Internal helpers
    # =========================================================================

    def _launch_browser(self, playwright):
        browser_type = getattr(playwright, self.valves.BROWSER, playwright.chromium)
        return browser_type.launch(headless=self.valves.HEADLESS)

    def _ensure_temp_dir(self) -> str:
        os.makedirs(self.valves.TEMP_DIR, exist_ok=True)
        return self.valves.TEMP_DIR
