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

The most common page-building primitives for routing, media, page shells, data loading, and model workflows.

Display

Display and feedback helpers for model lists, relative time labels, loading states, empty states, status pills, and tabular UI.

Forms

Form controls and action primitives used by templates, filters, and admin surfaces.

Overlays

Overlay, confirmation, sheet, menu, hint, and copy helpers for focused user actions.

System

Application shell helpers, CSR guards, admin signal tools, tab state, and animation wrappers.

Agent

The in-page agent's surface — one chat in a layout, a subtree with its own conversation, route guidance, and the development dock.

Customization

Re-skin any framework component per route with a `page/**/_overrides.tsx` manifest — drop-in replacements, no call-site changes.

Recipes

The className factories behind the primitives. Consume one, author one in `apps/<app>/ui/Recipe/`, or swap the framework's through the `recipes` manifest key.

Here

akanjs/ui

`akanjs/ui` is the shared UI facet for Akan apps. It provides route-aware links, data loading wrappers, model UI shells, form controls, display helpers, overlays, the in-page agent, and system-level app chrome.

Seven pages cover it, split by the layer you are working in. The export table at the bottom is the whole surface, name by name, with the page that documents each — start there when you know the name and not the page.

Page Map

Open the page that matches the UI layer you are working on. Each detail page uses one `Scroll.Slide` per component, with a props table and the notes that props alone cannot carry.

Every Export

Every name `akanjs/ui` exports, A to Z, and the page that documents it. A row marked Here is documented by its own line and nowhere else — those are the exports a single sentence exhausts.

Type-only exports are left out: they follow the component they type, and a props interface is documented in that component's own table.

Export

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

