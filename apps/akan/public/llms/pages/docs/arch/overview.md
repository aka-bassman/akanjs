# Architecture Overview

- Source: /docs/arch/overview
- Mirror: /llms/pages/docs/arch/overview.md
- Section: docs
- Category: Architecture
- Priority: P0

## Headings

- Architecture Overview (#architecture-overview)
- One App, Many Surfaces (#many-surfaces)
- The Main Runtime Conversation (#runtime-conversation)
- Architecture Areas (#architecture-areas)
- How To Read The Architecture Docs (#reading-guide)

## Content

Architecture Overview

Why does one product need a frontend repository, a backend repository, a mobile project, and an infra chart before a customer can place a single order? Akan starts from the behavior instead. A customer sees a screen, takes an action, business rules decide what should happen, data changes, other clients may be notified, and the same app is packaged for web, mobile, cloud, or edge.

This page is the map, not the territory. Each area below owns a different kind of decision, and the product stays legible as long as those decisions stay where they belong. Three rules hold across all of them:

Behavior First

Write business behavior first, then let generated helpers reduce API and state glue.

One Service, Many Clients

One business service layer serves every client surface: SSR web, CSR web, admin, partner, and mobile.

Deploy Later

Choose the deployment shape after the product needs it: local first, then cloud, edge, or hybrid.

One App, Many Surfaces

Akan is designed for products that rarely have only one screen. A store customer page, an admin console, a partner client, a mobile app, and an edge device workflow present different interfaces while sharing the same rules and the same data.

Surface map

The point is not to force every client to look the same. The point is to let different clients reuse the same business truth while presenting the right workflow for each audience.

The Main Runtime Conversation

Almost every Akan feature is one conversation between the interface and the business service. The interface shows useful content and captures intent; the business service receives a safe request, decides the rule, changes data, and may trigger background or realtime follow-up work.

One request, end to end

SSR is what makes the first view appear early; client components take over for typing, clicking, filtering, chat, maps, camera, and local state. st holds the client state a response lands in, Model namespaces keep model usage typed, and usePage resolves i18n on both sides. Where that conversation actually executes — one process, a cloud cluster, an edge node, or a mobile package — is a runtime and infra decision, not a change to any of the code above.

Architecture Areas

The detailed architecture pages explain each area more deeply. This overview keeps the map small: each area owns a different kind of decision, and the product becomes clear when those decisions stay in the right place.

Area

UI Architecture

First view, SSR, the rendering boundary, what earns a client component, and the akan quality ssr server-share floor.

UI Composition

Composing a screen from akanjs/ui: Load, Model, Field, the generated store and fetch helpers, and i18n.

Business Service

signal, service, document, request/response work, cron and background work, report generation, and realtime scenarios.

Runtime And Infra

local, cloud cluster, edge, master, traffic paths, database mode, and growth stages.

Mobile App Architecture

CSR web inside Capacitor, multi-client basePath targets, local CSR testing, the page .config() stage, and Android/iOS packaging.

CSS And Styling

Tailwind CSS, semantic design tokens, design system thinking, theme declaration, and font declaration.

UI Recipe Layer

The variant factory between tokens and components: framework recipes, app-level recipes, when to reach for one, and how a route overrides one.

In-Page Agent

The agent that reads the rendered screen and drives it: mounting and securing the relay, the declared surface, zones, and swapping the model.

How To Read The Architecture Docs

You do not need to read every architecture page before building. Start from the decision you are facing, then move to the page that owns that decision.

I need to…

Design the first screen or client behavior

Build a list, a detail view, or a create and edit form

Write server-side rules, APIs, queue, cron, or realtime work

Choose local, cloud, edge, database, or deployment shape

Package a CSR client as Android or iOS

Set consistent component style, theme, or font rules

Stop re-implementing the same card or button look

Let an AI agent read and drive a screen

## Code Examples

No code snippets were extracted from this page.

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

