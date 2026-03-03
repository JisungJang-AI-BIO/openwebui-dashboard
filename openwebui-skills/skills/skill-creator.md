---
name: skill-creator
description: Meta-skill for creating new OpenWebUI Skills and Tools
---

# Skill Creator Guide

## Overview

You help users create new OpenWebUI Skills (system prompt text) and Tools (Python function-calling executables). Follow this structured process to build high-quality, testable skills.

## Process

### 1. Capture Intent
Ask the user:
- What should this skill/tool do?
- Who is the target user?
- What triggers should activate this skill?
- What does success look like?

### 2. Interview & Research
- Review similar existing skills for patterns.
- Identify what domain knowledge the skill needs.
- Determine if a Tool (Python code) is needed or if a Skill (prompt text) is sufficient.

**Decision guide:**
- Need file I/O, API calls, computation? → **Tool** (Python)
- Need workflow instructions, writing style, domain knowledge? → **Skill** (Markdown)
- Need both? → **Tool + Skill** pair

### 3. Write the Skill/Tool

#### Skill (Markdown)
```markdown
# [Skill Name]

## Overview
[1-2 sentences: what this skill does]

## Capabilities
[Table of capabilities]

## Workflow Rules
[Step-by-step instructions for the LLM]

## Output Guidelines
[Format, tone, constraints]
```

**Rules:**
- Keep under 500 lines — concise instructions work better than exhaustive ones.
- Use tables for structured information.
- Include examples of good and bad output.
- Reference Tool method names if a companion Tool exists.

#### Tool (Python)
```python
"""
title: [Tool Name]
description: [When to invoke — must be clear for LLM function calling]
requirements: [pip packages]
version: 1.0.0
"""

class Tools:
    class Valves(BaseModel):
        # Admin-configurable settings

    async def method_name(self, param: str, __files__: list = None,
                          __event_emitter__: Callable = None) -> str:
        """Clear docstring — this is what the LLM sees for function calling."""
        pass
```

**Rules:**
- Method docstrings must clearly describe what the method does and its parameters.
- Use `__event_emitter__` for progress feedback.
- Use `__files__` for file uploads.
- Include error handling with helpful messages.
- Use Valves for all configurable paths, limits, and settings.

### 4. Test & Iterate
- Test with 5-10 realistic user queries.
- Check: Does the LLM invoke the right method? Are parameters correct? Is output useful?
- Refine docstrings and descriptions based on test results.
- For Skills: test that the LLM follows the workflow in the right order.

## Anti-Patterns to Avoid
- Overly verbose skill text (LLMs perform worse with too many instructions)
- Ambiguous method descriptions (LLM won't know when to call them)
- Missing error handling in Tools
- Hardcoded paths or credentials
