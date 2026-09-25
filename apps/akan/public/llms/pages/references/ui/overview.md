# Overview

- Source: /references/ui/overview
- Mirror: /llms/pages/references/ui/overview.md
- Section: references
- Category: UI Reference
- Priority: P1

## Headings

- akanjs/ui (#akanjs-ui)
- Page Map (#page-map)
- Every Export (#exports)

## Content

Overview

Core

The parts most pages are built from: routing, images, page shells, data loading, model CRUD.

Display

Showing data and feedback: admin lists, relative times, loading and empty states, badges, tables.

Forms

Form controls and buttons for templates, filters and admin screens.

Overlays

What opens over the page: modals, confirmations, sheets, menus, hints and copy buttons.

System

The app shell, client-only boundaries, the API explorer, tabs and animation.

Agent

The in-page agent: the layout chat, zones with their own conversation, route guidance, the dev dock.

Customization

_overrides.tsx, override(), 46 slots

Swap framework components per route with a `page/**/_overrides.tsx` file; call sites stay.

Recipes

The className factories: use one, add one in `apps/<app>/ui/Recipe/`, or swap one via `recipes`.

Only here

akanjs/ui

By Layer

One page per layer you work in. Pick yours from the Page Map.

By Name

Every export A to Z, each with the page that covers it. Start here when you know the name.

Page Map

Open the page for the layer you are working in. Each component there gets its own section: a props table, then the notes props alone cannot carry.

Every Export

Export

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

