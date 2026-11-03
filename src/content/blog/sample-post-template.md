---
title: 'Sample write-up: replace or delete this file'
description: 'Template showing the front matter and formatting available for posts. Set draft to false to publish.'
date: 2026-11-03
tags: ['template']
draft: true
---

Posts are Markdown files in `src/content/blog/`. Commit one and push, and the site redeploys with it. While `draft: true`, a post is visible only in local development.

## Code blocks

Fenced blocks are syntax highlighted at build time.

```python
import requests

r = requests.get("https://target.example/api/v1/users/1", timeout=5)
print(r.status_code)
```

## Images

Put screenshots in `public/img/` and reference them with `![alt text](/img/example.png)`. Always write alt text.

## Suggested structure for a write-up

1. Scope and rules of engagement (or the lab and its authorization)
2. Enumeration
3. Finding and impact
4. Remediation
