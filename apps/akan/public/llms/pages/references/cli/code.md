# Code Agent

- Source: /references/cli/code
- Mirror: /llms/pages/references/cli/code.md
- Section: references
- Category: CLI Reference
- Priority: P0

## Headings

- Code CLI (#code-cli)
- Profiles (#code-profiles)

## Content

Code Agent

Run the Akan coding agent on a prompt. It is a coding agent that already knows this workspace: the Akan workflow, context, and self-verification tools are wired in, and the akan skill set describes the scaffolding chain, the store surface, and the validation loop. One command, three hosts. Which one runs is decided from the arguments, not from a subcommand.

Code CLI

You want an agent to add a field and run the validation loop, in this repo, tonight — without opening an editor, configuring an MCP client, or explaining the module conventions to it first.

That is what this command is. It is not the MCP server, which lets an editor's agent reach this workspace; it is not `akan agent install`, which writes the rule files those agents read. It is an agent of its own, in your terminal, already carrying both.

Profiles

A profile is what the agent is allowed to be, as one value: which tools are built, whether it asks before writing, where a session is stored, and how much of the project it carries in its window.

Most of it is applied when the agent is assembled: a tool outside the profile is never constructed, so the model cannot call it and it costs no prompt tokens either.

Profile

Naming an app moves the profile's root to that app's folder, which is a narrower boundary than a prompt that politely asks the agent to stay there.

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use commands from the workspace root unless a page explicitly says otherwise.

