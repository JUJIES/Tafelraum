# Minimal local HTML materials

These two original examples demonstrate the package contract. Copy a package into your working directory, choose a new ID and develop your material there.

- [Starter worksheet](starter-worksheet/manifest.json) uses ordinary input fields and a shared A4 screen and print page. The form bridge handles its state.
- [Starter interactive activity](starter-interactive/manifest.json) implements `getState`, `applyState` and `tafelraum:statechange` for teacher and Room Canvas. It is digital only.

Run these checks from the checkout or agent kit root:

```sh
node scripts/check-interactive-material.mjs --source-dir docs/agent-examples/starter-worksheet --require-print
node scripts/check-interactive-material.mjs --source-dir docs/agent-examples/starter-interactive
```

Use the [worksheet references](../agent-references/README.md) for visual design. The minimal examples are technically valid starting points, not classroom or print approval for a new worksheet. They are covered by the project licence and contain no personal data or third-party assets.
