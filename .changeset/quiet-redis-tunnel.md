---
"@akanjs/devkit": patch
---

Let non-local single database mode development servers continue when the Redis SSH tunnel is unavailable, warning with the SSH target and underlying connection errors and setting an explicitly unavailable Redis host instead of falling back to a local Redis instance. Working tunnels remain available to custom Redis adaptors, while multiple and cluster modes still require Redis and local development remains unchanged.
