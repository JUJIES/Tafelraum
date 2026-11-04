# Prepare a lesson with your own AI agent

Tafelraum lets an assistant work on a real lesson in your local archive. You choose the assistant and model. The assistant needs permission to read files and run commands on your computer. The hosted demo has no agent connection.

## Connect to your local app

1. Start Tafelraum using the [README instructions](../README.md#try-it-on-your-computer). Keep the teacher window open and select the lesson you want to prepare.
2. Open **Settings → Connect agent → Copy starting prompt** and paste the prompt into your assistant. It contains the address of this running app, the Node runtime and the location of the bundled agent kit.
3. Ask the assistant to identify the archive and lesson before making changes. If several lessons match, give it the class, unit or lesson title. If several teacher windows are open, select the intended session.
4. Give it a concrete task. For example:

   > In my map-reading lesson, make a worksheet for pairs. Ask students to compare two routes and justify their choice. Check the worksheet, add it to this lesson, place it beside the map and prepare a numbered clip for the discussion. Leave the presentation stopped.

The app saves the result in the same archive you use when working by hand. You decide when to present. Connecting copies setup instructions to the assistant. It does not install a plugin or sign you into a provider.

## What the agent can do

| Task | How it works |
| --- | --- |
| Find or create a lesson | The [lesson organisation skill](../.agents/skills/tafelraum-unterricht-organisieren/SKILL.md) resolves the class, subject, unit and lesson against the current archive. |
| Create materials | The [teaching material skill](../.agents/skills/tafelraum-unterrichtsmaterial/SKILL.md) helps turn the learning goal into a draft in a separate working folder. |
| Prepare an interactive activity | The [HTML package skill](../.agents/skills/tafelraum-interactive-html/SKILL.md) documents validation, input state, Room Canvas and optional A4 output. Inspect the rendered page as well as the package checks. |
| Arrange the board | The [canvas skill](../.agents/skills/tafelraum-canvas-vorbereiten/SKILL.md) uses the open teacher window to place materials, text and shapes, create clips and confirm that the app saved the lesson. |

Drafting a worksheet, adding it to the archive and placing it on the board are separate actions. You can request all three together. For printable worksheets, review the blank print output as well as the digital version. The kit includes [two integration examples](agent-examples/README.md) and [thirteen worksheet layout references](agent-references/README.md).

## Check the connection from a checkout

From the repository root, the following commands show the available operations:

```sh
node scripts/tafelraum-unterricht.mjs --help
node scripts/tafelraum-canvas-agent.mjs --help
```

Use the address printed by **your** running instance for each command. For example, if it is listening on port 5173:

```sh
node scripts/tafelraum-unterricht.mjs status --url http://127.0.0.1:5173
node scripts/tafelraum-canvas-agent.mjs sessions --url http://127.0.0.1:5173
```

Check that `status` reports your intended archive. Use the returned archive path with `--archive-root` for writes. Canvas operations require an active teacher session. Agents use the validated commands and the app’s save path rather than editing board files directly.

## Compatibility and privacy

The maintainer uses Codex in lesson preparation. The local command and browser workflow has also been exercised in Chromium and WebKit without a model call. Other assistants, including those using locally hosted models, can use the same files and commands if they have suitable permissions. Setup and output quality have not been independently verified for every assistant.

Tafelraum itself stores lessons locally. An assistant with file access can read the files you make available to it. If the assistant uses a cloud model, content it reads may be sent to that provider. Choose the working folder and permissions accordingly.

To reproduce the reference workflow with synthetic data, install the app’s Playwright browsers, then run `npm run test:agent-onboarding` from `prototypes/surface-shell-a-b/`. It exercises lesson creation, material import, canvas edits, clips, saving and reopening the lesson.

Private lesson notes are excluded from normal canvas inspection, not from an
assistant’s separate file-access permission. See [Data, privacy and backups](DATA_AND_PRIVACY.md)
for storage locations, backup contents and external-service boundaries.
