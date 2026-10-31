# Prepare lessons with Tafelraum

This kit belongs to the running local app. The starting prompt from **Settings → Connect agent** identifies the app address, kit folder and Node runtime. Give it to an assistant with file and tool access on this computer.

## First connection

1. Read `AGENTS.md` and `agent-kit.json` in this kit.
2. Run both command-line tools with `--help`. They use Node and do not require extra npm packages.
3. Run `scripts/tafelraum-unterricht.mjs status --url APP_URL` with the Node runtime and app URL from the prompt. Confirm the archive path. Supply it as `--archive-root` for subsequent archive operations.
4. Run `scripts/tafelraum-canvas-agent.mjs sessions --url APP_URL`. The teacher window must be open to prepare its canvas. If multiple sessions exist, identify the intended one.
5. Carry out the teacher’s task. Ask for the class, lesson or desired material only if the target is unclear.

## Choose the workflow

| Task | Instructions in this kit |
| --- | --- |
| Develop teaching materials | `.agents/skills/tafelraum-unterrichtsmaterial/SKILL.md` |
| Create an HTML worksheet, quiz or activity | `.agents/skills/tafelraum-interactive-html/SKILL.md` |
| Find or create lessons and attach materials | `.agents/skills/tafelraum-unterricht-organisieren/SKILL.md` |
| Prepare a canvas and numbered clips | `.agents/skills/tafelraum-canvas-vorbereiten/SKILL.md` |

Use `docs/agent-references/README.md` and its layout guide to select and **view** suitable worksheet references. The two examples in `docs/agent-examples/` demonstrate the integration contract. Copy an example into a separate working directory before changing it. Give a new package its own ID.

## Check and deliver

Validate HTML with `scripts/check-interactive-material.mjs --source-dir PACKAGE`. Add `--require-print` for printable worksheets and inspect the actual blank print output. Review content and appearance before importing.

When the teacher requests archive installation, use `scripts/tafelraum-unterricht.mjs install-html --lesson LESSON --source-dir PACKAGE --mode worksheet` with the confirmed app address and archive path. Use `--mode digital` for a digital activity. Prepare the canvas and its clips if requested. Report which steps the app confirmed.

The kit contains instructions, examples and tools. Lessons belong to the app’s archive. An assistant processes files using the permissions you grant it and, for cloud models, the provider’s own data handling rules. Codex is one tested route. The Chromium and WebKit reference workflow verifies the local tools without making a model call.
