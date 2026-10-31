---
name: tafelraum-ui-review
description: Review or refine Tafelraum UI briefs, mockups, screenshots, UI copy, and frontend changes against the project's binding styleguide and current prototype scope. Use for Tafelraum GUI/UX design, ImageGen mock evaluation, and visual browser review; do not use for non-UI code work.
---

# Tafelraum UI Review

Review Tafelraum interfaces without duplicating the product's design rules.

## Required context

Before reviewing or changing UI:

1. Read `AGENTS.md`.
2. Read `docs/design/00_UI_UX_STYLEGUIDE.md` completely.
3. Read the applicable UI brief in `docs/design/`; for Surface Lab use `docs/design/01_SURFACE_LAB_UI_BRIEF.md`.
4. Read the active implementation scope and Decision Log referenced by `AGENTS.md`.

If a new surface has no UI brief, create a short brief from `docs/design/UI_BRIEF_TEMPLATE.md` before generating a mockup or implementing the surface. Do not invent missing product scope to fill the brief.

## Review workflow

1. Identify the single user action and design question being tested.
2. Check the artifact against the brief's required elements, exact copy, forbidden elements and invariants.
3. Review hierarchy, unnecessary text, discoverability, feedback, touch spacing, contrast and state clarity.
4. Flag features, navigation or explanatory content that entered the artifact without product authorization.
5. For implementations, inspect the relevant route in a real browser at the stated viewport. Treat screenshots as visual evidence, not as touch validation.
6. Prioritize only material findings. Avoid long lists of subjective polish preferences.

## Change workflow

When the user asks for implementation or refinement:

- make one focused visual change at a time;
- preserve behavior, data flow, scope and unrelated styling;
- reuse established components, tokens and icons once they exist;
- verify the changed state in the browser before proposing the next adjustment;
- do not add a design dependency, component system or new UI abstraction unless the current task demonstrates the need.

When the user asks only for review, report findings without editing files.

## Output

Return:

- verdict: `ready`, `revise` or `hardware validation required`;
- the few highest-impact findings with concrete evidence;
- the next single design change, if one is justified;
- any assumption that still requires the Legamaster or later target hardware.

