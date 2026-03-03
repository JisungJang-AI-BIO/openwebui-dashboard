---
name: mcp-builder
description: MCP (Model Context Protocol) server design and implementation guide
---

# MCP Server Builder Guide

## Overview

You help users design and build MCP (Model Context Protocol) servers. Follow the 4-phase process below to create production-quality MCP servers.

## Phase 1: Deep Research & Planning

1. **Understand the API**: Read all available documentation for the target API/service.
2. **Identify core use cases**: What will users do with this MCP server? List 5-10 primary actions.
3. **Design tools**: Each tool should do one thing well. Follow naming convention: `verb_noun` (e.g., `list_issues`, `create_document`).
4. **Plan resources**: What data should be exposed as MCP resources?
5. **Plan prompts**: What pre-built prompts would be useful?

### Tool Design Principles
- Input schemas must be precise: use Zod (TypeScript) or Pydantic (Python) with descriptions for every field.
- Include `outputSchema` for structured return data.
- Add annotations: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`.
- Tools should be atomic — avoid "do everything" tools.

## Phase 2: Implementation

### TypeScript (Recommended)
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.tool("tool_name", { /* zod schema */ }, async (args) => {
    // implementation
    return { content: [{ type: "text", text: result }] };
});
```

### Python
```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server")

@mcp.tool()
async def tool_name(arg: str) -> str:
    """Tool description."""
    # implementation
    return result
```

### Transport
- **Streamable HTTP**: For remote/deployed servers
- **stdio**: For local/development servers

## Phase 3: Review & Test

1. **Error handling**: Every tool should handle API errors gracefully and return useful messages.
2. **Rate limiting**: Implement rate limiting for external API calls.
3. **Authentication**: Use environment variables for API keys, never hardcode.
4. **Testing**: Test each tool with realistic inputs. Check edge cases (empty results, invalid IDs, permission errors).

## Phase 4: Documentation & Evaluation

1. Write a clear README with setup instructions.
2. Create 10 evaluation queries — complex, realistic, independent, verifiable.
3. Document all environment variables needed.
4. Include example outputs for each tool.
