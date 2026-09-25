# Overview

- Source: /conventions/module/overview
- Mirror: /llms/pages/conventions/module/overview.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- Module Overview (#module-overview)
- Module File Map (#module-file-map)
- Server To Client Flow (#server-client-flow)
- Role Boundaries (#role-boundaries)
- Recommended Reading Paths (#reading-paths)
- Practical Rules (#practical-rules)

## Content

Overview

The `Light<Model>` class: the few fields a list or card needs. Server and client both hold it.

The `<Model>` class: every field of one record. Detail screens use it.

A server query that fills a list in the client store.

One query, mutation, message or pubsub a caller can reach.

A class that decides whether the caller may run an endpoint.

Wrappers that fill the store from route data and draw the loading and empty states.

What the module owns, the 2–5 rules code cannot show, and any workflow. Read it first.

The data shape: fields, enums, the five model layers, helpers, hidden/secret and resolved fields.

Words users read: fields, insights, queries, sorts, enums, slices, endpoints, errors, UI text.

How stored documents behave: filters, document methods, model helpers, indexes, schema hooks.

Business workflows, built from document methods, injected services and database operations.

Where server work starts: slices, endpoints, message, pubsub, tasks, guards, resolved fields.

Client state: form and list state, generated fetch calls, toasts, and the actions UI calls.

The form. Its fields bind to the store's form state through the generated setters.

One piece of a light model: a card, row, avatar, column or compact summary.

One full model in detail: detail pages, view modals, sections that need every field.

Small client controls: action buttons, toolboxes, dialogs, query panels, navigation helpers.

Write down the business intent and the domain rules that should last.

Define the business shape: fields, enums and the model layers.

Give those fields, actions, errors and UI phrases the names users see.

Describe how stored documents are queried, changed, indexed and loaded.

Build business workflows from document helpers and other services.

Expose server behaviour as typed slices, endpoints, realtime channels and tasks.

Connect the generated fetch API to client state, form state and UI actions.

Draw forms, lists, detail views, actions and page sections.

What

Where

What goes there

Business rules

Service workflows, document methods and constant helpers. Never inside render code.

API and access

Slices, endpoints, guards, internal args, realtime channels and tasks.

Client coordination

Fetch calls, form and list state, toasts and UI actions.

Display

Unit repeats a light model; View shows one full model in detail.

Page sections

Load wrappers, Unit/View, Util controls and the section's layout.

Small controls

Toolboxes, action buttons, dialog triggers, query panels and navigation helpers.

New model

List

Detail/edit

Action

defining a business object from scratch.

a page needs list data, filtering, pagination and cards.

showing a model's full data, or editing an existing one.

a user's click should run a business workflow.

Logic files

Every path starts here, with the rules the change must keep.

The new object's fields and model layers.

Names for the new fields, errors and UI text.

Filters, document methods and indexes for the stored data.

The workflow the new model or the click runs.

A slice for a list, the `get` guard behind `view<Model>` for detail, an endpoint for an action.

The state the screen reads. For an action, the store action a button calls.

UI files

The section that takes the route's data and fills the list or the detail.

One card or row of the list.

The detail of one full record.

The edit form. For an action, the button can live here or in Util.

The action's button when it is a control of its own.

Module Overview

An Akan module is one folder for one business feature. The model's shape, its wording, storage, workflows, API, client state and UI all sit side by side in it.

This page is a map for choosing which file to open next. Syntax and examples live on each file's own page.

An Example Module

Words used on this page

Term

Module File Map

A module's files fall into two groups: seven lowercase logic files and five PascalCase UI files. Each card opens that file's guide.

Logic Files

UI Files

Server To Client Flow

A module usually grows from the data shape to storage, then to the API, client state and UI. Not every feature needs every file, but this order keeps each file's job clear.

As a diagram, the chain ends in UI, which splits into the five UI roles:

One module, data to UI

the form

one row or card

one full record

one control

the section

Role Boundaries

When a module gets confusing, it is usually because logic moved into the wrong file. Check where it belongs before adding code.

Recommended Reading Paths

: when

File, in reading order

Read for this task

Not needed

Practical Rules

Four habits that keep a module easy to follow:

## Code Examples

### libs/shared/lib/banner/

```bash
libs/shared/lib/banner/
├── banner.abstract.md
├── banner.constant.ts
├── banner.dictionary.ts
├── banner.document.ts
├── banner.service.ts
├── banner.signal.ts
├── banner.signal.spec.ts
├── banner.signal.test.ts
├── banner.store.ts
├── Banner.Template.tsx
├── Banner.Unit.tsx
├── Banner.Util.tsx
├── Banner.View.tsx
├── Banner.Zone.tsx
└── index.ts
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

