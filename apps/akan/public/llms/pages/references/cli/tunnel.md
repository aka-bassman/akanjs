# Tunnel

- Source: /references/cli/tunnel
- Mirror: /llms/pages/references/cli/tunnel.md
- Section: references
- Category: CLI Reference
- Priority: P0

## Headings

- Tunnel CLI (#tunnel-cli)
- Share Or Tunnel (#share-or-tunnel)

## Content

Tunnel

Share a locally running app on a public URL. The control plane issues a hostname and a connector token, and the connector runs inside this process — there is no binary to install and no step between the command and a URL to paste. Because the process is the tunnel, the command blocks until you interrupt it, and closing it hands the hostname back.

Tunnel CLI

A designer wants to see the screen you just built, on their phone, now. A webhook from a payment provider needs to reach the handler you are still editing. Both want a public URL pointing at the dev server on your laptop, and neither is worth a deployment.

Most of the time you want this while already running the app, and `akan start --share` does it as part of the session. `akan tunnel` is the standalone form: it shares an app that is already running and does nothing else.

Share Or Tunnel

They open the same kind of share against the same control plane. What differs is who owns the process, and that decides which one you want.

The dev session opens a share for each app it boots and keeps it for the life of the session. In the full-screen view, `s` copies the selected app's public URL — or every app's from the merged row — and the header carries it ahead of the local one.

A second terminal against an app that is already running — including one you did not start with `--share`, or one on a port that is not the dev port. Stopping it leaves the dev server alone.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use commands from the workspace root unless a page explicitly says otherwise.

