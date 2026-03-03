#!/usr/bin/env python3
"""
Auto-import Skills & Tools into OpenWebUI database (no API key needed).

Runs INSIDE the OpenWebUI container where:
  - /app/OpenWebUI-Skills/skills/*.md  → skill table
  - /app/OpenWebUI-Skills/tools/*.py   → tool table
  - DATABASE_URL env var               → DB connection

Usage:
  docker exec open-webui python3 /app/OpenWebUI-Skills/server-setup/import-to-db.py
  docker exec open-webui-staging python3 /app/OpenWebUI-Skills/server-setup/import-to-db.py
"""

import os
import sys
import re
import json
import time
import glob
from urllib.parse import urlparse

# ── Config ──────────────────────────────────────────────────────────────────
SKILLS_DIR = "/app/OpenWebUI-Skills/skills"
TOOLS_DIR = "/app/OpenWebUI-Skills/tools"


# ── DB Connection ───────────────────────────────────────────────────────────
def get_db_connection():
    try:
        import psycopg2
    except ImportError:
        print("ERROR: psycopg2 not available. Is this the OpenWebUI container?")
        sys.exit(1)

    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        print("ERROR: DATABASE_URL environment variable not set.")
        sys.exit(1)

    parsed = urlparse(db_url)
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        user=parsed.username,
        password=parsed.password,
        dbname=parsed.path.lstrip("/"),
    )
    conn.autocommit = True
    return conn


# ── Parse skill .md frontmatter ────────────────────────────────────────────
def parse_skill_md(filepath):
    with open(filepath) as f:
        content = f.read()

    meta = {}
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if match:
        for line in match.group(1).strip().split("\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()

    basename = os.path.basename(filepath).replace(".md", "")
    return {
        "id": meta.get("name", basename),
        "name": meta.get("name", basename),
        "description": meta.get("description", ""),
        "content": content,
    }


# ── Parse tool .py docstring ───────────────────────────────────────────────
def parse_tool_py(filepath):
    with open(filepath) as f:
        content = f.read()

    meta = {}
    match = re.match(r'^"""(.*?)"""', content, re.DOTALL)
    if not match:
        match = re.match(r"^'''(.*?)'''", content, re.DOTALL)
    if match:
        current_key = None
        for line in match.group(1).strip().split("\n"):
            stripped = line.strip()
            # New key: value
            if re.match(r"^[a-z_]+\s*:", stripped):
                k, v = stripped.split(":", 1)
                k = k.strip().lower().replace(" ", "_")
                meta[k] = v.strip()
                current_key = k
            elif current_key and stripped:
                # Continuation of multi-line value (e.g., description)
                meta[current_key] += " " + stripped

    basename = os.path.basename(filepath).replace(".py", "")
    return {
        "id": basename,
        "name": meta.get("title", basename),
        "description": meta.get("description", ""),
        "content": content,
    }


# ── Generate tool specs using OpenWebUI internals ──────────────────────────
def generate_specs(tool_id, content):
    """Try to generate function-calling specs via OpenWebUI's internal modules.
    Falls back to empty list if unavailable (tools still work after UI re-save).
    """
    try:
        sys.path.insert(0, "/app/backend")
        from open_webui.utils.plugin import load_tool_module_by_id, replace_imports
        from open_webui.utils.tools import get_tool_specs

        replaced = replace_imports(content)
        module = load_tool_module_by_id(tool_id, content=replaced)
        specs = get_tool_specs(module)
        return specs
    except Exception as e:
        print(f"    (specs fallback: {e})")
        return []


# ── Main ────────────────────────────────────────────────────────────────────
def main():
    print("=" * 50)
    print(" Import Skills & Tools into OpenWebUI DB")
    print("=" * 50)

    conn = get_db_connection()
    cur = conn.cursor()

    # ── Find user_id (prefer admin) ──
    cur.execute(
        'SELECT id, name FROM "user" WHERE role = \'admin\' ORDER BY created_at LIMIT 1'
    )
    row = cur.fetchone()
    if not row:
        cur.execute('SELECT id, name FROM "user" ORDER BY created_at LIMIT 1')
        row = cur.fetchone()
    if not row:
        print("\nERROR: No users in database yet.")
        print("Create an admin account in Open WebUI first, then re-run this script.")
        sys.exit(1)

    user_id, user_name = row
    print(f"\n  Owner: {user_name} ({user_id[:8]}...)")

    now = int(time.time())

    # ── Import Skills ──────────────────────────────────────────────────────
    print("\n--- Skills ---")
    skill_ok = skill_skip = 0

    for md_path in sorted(glob.glob(f"{SKILLS_DIR}/*.md")):
        skill = parse_skill_md(md_path)

        cur.execute("SELECT 1 FROM skill WHERE id = %s", (skill["id"],))
        if cur.fetchone():
            print(f"  [SKIP] {skill['id']}")
            skill_skip += 1
            continue

        cur.execute(
            """
            INSERT INTO skill (id, user_id, name, description, content, meta, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, true, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (
                skill["id"],
                user_id,
                skill["name"],
                skill["description"],
                skill["content"],
                json.dumps({"tags": []}),
                now,
                now,
            ),
        )
        print(f"  [OK]   {skill['id']}")
        skill_ok += 1

    print(f"\n  Result: {skill_ok} imported, {skill_skip} skipped")

    # ── Import Tools ───────────────────────────────────────────────────────
    print("\n--- Tools ---")
    tool_ok = tool_skip = 0

    for py_path in sorted(glob.glob(f"{TOOLS_DIR}/*.py")):
        tool = parse_tool_py(py_path)

        cur.execute("SELECT 1 FROM tool WHERE id = %s", (tool["id"],))
        if cur.fetchone():
            print(f"  [SKIP] {tool['id']}")
            tool_skip += 1
            continue

        specs = generate_specs(tool["id"], tool["content"])
        meta = {"description": tool["description"], "manifest": {}}

        cur.execute(
            """
            INSERT INTO tool (id, user_id, name, content, specs, meta, valves, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (
                tool["id"],
                user_id,
                tool["name"],
                tool["content"],
                json.dumps(specs),
                json.dumps(meta),
                json.dumps({}),
                now,
                now,
            ),
        )
        print(f"  [OK]   {tool['id']} ({tool['name']})")
        tool_ok += 1

    print(f"\n  Result: {tool_ok} imported, {tool_skip} skipped")

    cur.close()
    conn.close()

    # ── Summary ────────────────────────────────────────────────────────────
    print("\n" + "=" * 50)
    print(" Done!")

    if tool_ok > 0:
        print("\n  Next steps:")
        print("    1. Open WebUI > Workspace > Tools")
        print("    2. Click gear icon on each tool")
        print("    3. Set SCRIPTS_DIR: /app/OpenWebUI-Skills/vendor/<toolname>")

    print("=" * 50)


if __name__ == "__main__":
    main()
