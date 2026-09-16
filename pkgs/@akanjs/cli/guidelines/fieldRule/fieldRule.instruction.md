# Akan Field Rule Guideline

## Purpose
Use this whenever generating constants or scalar constants. It defines the current `via()` field helper style and field option rules.

## Ownership
- `field(Type)` defines a required public field.
- `field(Type, options)` defines a field with defaults, examples, validation, aggregation, or relation metadata.
- `field(Type).optional()` marks a nullable or optional business value when absence is valid.
- `field.hidden(Type).optional()` is for internal state that should not be treated as a normal public field.
- `field.secret(Type).optional()` is for sensitive values that should not be selected by default.
- Neither survives an endpoint response: both are stripped on the way out and hydration writes `null` over the key, while the generated type still declares the field — so a client holds a deliberate `null` behind a type that promises a value, and only `??` / `== null` catch it. A field a browser has to read is neither.
- `field([Type])` defines arrays; provide empty array defaults when the app expects list operations.

## Current Akan Patterns
- Use `String`, `Boolean`, `Date`, `Int`, `Float`, `ID`, scalar classes, model light classes, or enum classes as field types.
- Use `enumOf()` classes for categorical values that need type-safe values and dictionary entries.
- Use scalar classes for embedded reusable value objects such as price, address, coordinate, or file metadata.
- Use light model classes for embedded resolved references when the parent stores or exposes a compact related model.

## Codegen Rules
- Every generated field should have a clear business reason and a dictionary label/description unless it is hidden or secret.
- Use `example` values when the field appears in APIs or docs.
- Use `default` for stable empty states such as empty string, zero, false, empty list, or date factory.
- Use validation options only for domain invariants, not UI-only preferences.
- Do not create fields only because a UI might someday need them.

## Review Checklist
- The instruction points to current docs pages, not removed docs routes.
- Generated examples use current Akan builder APIs and scanner-friendly filenames.
- The output contract tells the model which file paths to return.
- The guide avoids broad framework essays when a concrete file rule is better.
