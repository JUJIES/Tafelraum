# Tafelraum

**An AI-powered local whiteboard for teaching.** Bring your own AI agent to turn a lesson idea into materials, arrange them on the board and prepare what the class will see. Then pick up the pen and teach on that same canvas.

**AI is optional.** Use Tafelraum on its own as a local whiteboard for lessons, workshops and training sessions. Bring your own materials, draw and present without connecting an agent.

## Download Tafelraum

- **[Download for Windows (.exe)](https://github.com/JUJIES/Tafelraum/releases/download/v0.1.95/Tafelraum-Public-0.1.95-Windows-x64-setup.exe)** · Windows x64 · [Installation guide](prototypes/surface-shell-a-b/distribution/public/WINDOWS-INSTALLATION.txt)
- **[Download for Mac (.zip)](https://github.com/JUJIES/Tafelraum/releases/download/v0.1.95/Tafelraum-Public-0.1.95-macOS-arm64.zip)** · Apple Silicon (M-series) · [Installation guide](prototypes/surface-shell-a-b/distribution/public/INSTALLATIONSANLEITUNG.txt)

[All GitHub releases](https://github.com/JUJIES/Tafelraum/releases)

**[Try the live demo](https://tafelraum-demo.jujies.app/?lesson=volcanoes)** · No installation or account needed. Open the volcanoes lesson from the video, try its worksheet and send a numbered clip to Room Canvas. Reload to start fresh.

## Demo video

https://github.com/user-attachments/assets/a8d45d42-2139-4f3f-82cc-1ac0969c1fa5

**From chat to classroom** · 2:34 · English narration · [Watch on YouTube with captions](https://youtu.be/nBQukVA6Bxg).

See a new lesson appear in the library, its materials arrive and the canvas take shape. Then switch numbered clips while keeping separate teacher and classroom views.

<details>
<summary>Try the lesson shown in the video</summary>

**[Volcanoes — Why live so close?](https://tafelraum-demo.jujies.app/?lesson=volcanoes)** is the complete Year 7 geography lesson from the film: a USGS YouTube starter, a fictional family case, a printable HTML worksheet, separate teacher answers, native canvas tasks, consolidation and transfer.

Open **Present → Room Canvas → Start**, then switch clips 1–4. Clip 2 opens just the worksheet. You can also open the [worksheet](https://tafelraum-demo.jujies.app/api/archive/lessons/volcanoes/materials/interactive/volcanoes-field-sheet/index.html) or [teacher answers](https://tafelraum-demo.jujies.app/api/archive/lessons/volcanoes/materials/interactive/volcanoes-teacher-answers/index.html) on their own.

Changes stay in the current tab. Reload to restore the example. Agent connections and importing your own materials require a local installation.

</details>

## Features at a glance

### On the whiteboard

| Feature | What you can do |
| --- | --- |
| Drawing & annotation | Write with a pen, highlight, add text and shapes, zoom in on details and undo edits. Notes drawn on an image move with it. |
| Lesson materials | Arrange images and PDF pages beside audio, MP4 video, YouTube clips and web links. |
| Local lesson archive | Keep boards and original materials together by class, subject, unit and lesson. Copy a lesson for another group or restore it from the trash. |

### For teaching

| Feature | How I use it in class |
| --- | --- |
| AI-assisted preparation | Ask my own agent to create an activity, add it to the right lesson and lay it out on the board before class. |
| Room Canvas & numbered clips | Keep my overview on the laptop while the projector shows one task or diagram. Tap the next clip when the class is ready. |
| Reveal & annotate | Cover an answer while pairs discuss it, then uncover it. A student can write on the room display and keep their working in the lesson. |
| Interactive worksheets | Work through an HTML exercise or simulation from either window. Worksheets with a print layout can also become blank A4 handouts. |
| Media & timing | Control a video from my laptop while it plays on the classroom display, or place a countdown timer beside a group task. |
| Private lesson notes | Jot down who needs a follow-up next time. Student names and lesson notes stay out of the classroom display and canvas exports. |

<details>
<summary>Tools that need extra setup</summary>

The Mac desktop package includes a local Word-to-PDF converter and keeps the original document. DOCX conversion is currently unavailable on Windows; source builds need the documented Mac runtime setup. With your own capture relay, you can scan a QR code on a phone and send a photo straight to the current lesson.

</details>

## Why I built it

I liked the way I could organise my teaching materials in OneNote. What I wanted in class was a little different. I wanted to keep a worksheet, a picture and my next question together, write over them with a pen, and show just one of them on the board without rearranging my own view.

That became Tafelraum. I build it, try it in my own lessons and change things when they get in the way. After several months of using it that way, I wanted other teachers to be able to try it too. The name is German: *Tafel* is the classroom board, *Raum* is a room.

What made AI useful to me was being able to ask for something that would be *there when I opened the lesson*. A worksheet in a chat still leaves me with files to move and a board to set up. In Tafelraum, I can ask my agent to make the worksheet, put it in the right lesson and frame the first activity for the projector.

**Less friction between an idea and a usable lesson.** I want to focus on what my students should learn, which tasks will help them and how we will discuss the results. Keeping materials, the canvas and presentation together, with an agent able to work across them, helps me get from those decisions to a lesson I can teach more quickly. The teaching decisions stay with me.

## What you can ask your AI agent to do

Here’s a follow-up I could ask for after teaching the volcanoes lesson above:

> In “Volcanoes — Why live so close?”, add a follow-up task for pairs: compare a farmer and a hotel worker. Ask how their reasons for staying might differ. Put it beside the worksheet and prepare a clip for our discussion.

The **agent you choose** supplies the AI. Tafelraum gives it tools to work with actual lessons and boards. With the teacher window open, you can ask it to:

- **Organise lessons.** Find a lesson by class, subject or unit, create one when needed and attach materials to the right lesson.
- **Make materials.** Draft a worksheet with answer fields, a quiz or an interactive HTML activity. The kit includes working examples, layout references and checks for the material format.
- **Prepare the board.** Place materials, text and shapes, arrange them together and set up numbered clips. Open the result, move anything by hand and choose when to show each clip.

**Connect your agent:** in Tafelraum, open **Settings → Connect agent → Copy starting prompt**. Paste it into an assistant that can read files and run tools on your computer. Ask it to identify the open lesson first, then give it a task like the one above. The whiteboard works without an AI account. If you use a cloud-backed assistant, its own data settings apply to what you share with it. [Agent setup and supported operations](docs/AGENT_WORKFLOW.md)

## A lesson in three moves

1. **Prepare.** Open a lesson and put a picture or PDF page on the canvas. Add a question beside it, or cover the answer until you need it.
2. **Choose what the class sees.** Make a numbered *clip* around a part of the board or assign one to a single item. Open **Present → Room Canvas** and move that window to the classroom display.
3. **Teach on the same board.** Switch clips as the lesson unfolds. You can annotate a diagram or let someone write on the room display. Their strokes become part of the same lesson.

<details>
<summary>See the classroom view</summary>

![Room Canvas presenting the investigation clip, including the native task and the eclipse model](docs/images/room-canvas.png)

Room Canvas opens a second local window. You can try both windows on one screen before connecting a projector.

</details>

## Try it on your computer

Choose the ready-to-use **[Windows installer or Mac app](#download-tafelraum)**, or run from source below. The Mac ZIP and Windows installer have separate installation guides. Official packages offer future public app updates in the app. Downloading GitHub's source ZIP does not install an app.

The Mac app is ad-hoc signed, **not Apple-notarized**; follow the included
[first-open guide](prototypes/surface-shell-a-b/distribution/public/INSTALLATIONSANLEITUNG.txt).
The Windows installer is **not Authenticode-signed**; Windows may show an
unknown-publisher/SmartScreen warning. Read the [Windows installation guide](prototypes/surface-shell-a-b/distribution/public/WINDOWS-INSTALLATION.txt) and [tested scope and limits](docs/WINDOWS_QA.md). For a walkthrough of the demo or local app, see
[Your first lesson](docs/GETTING_STARTED.md).

To run from source in a browser, you need Git and Node.js 22.18 or newer, with npm. Open a terminal and run:

```sh
git clone https://github.com/JUJIES/Tafelraum.git
cd Tafelraum/prototypes/surface-shell-a-b
npm ci
npm start
```

Open the local address printed in the terminal. Tafelraum creates an empty lesson archive on first launch. If the interface opens in German, choose **Einstellungen → Sprache → English**. For a first lesson, drop a picture onto the board and write a question next to it.

`npm start` builds the current source for browser use, then serves it with the local archive APIs. It does not create a desktop installer. After editing code, stop and start again to rebuild. For development with automatic reload, use `npm run dev`; both commands use the same lesson archive.

On Windows PowerShell, use `npm.cmd ci` and `npm.cmd start` if the PowerShell npm shim is blocked. See [Windows source setup and checks](docs/WINDOWS_SOURCE.md) for browser testing and the distinction from native Windows packaging.

Press **Ctrl+C** in the terminal to stop. Run `npm start` in the same directory next time. Your lessons stay in `local-data/public-lessons/` inside the checkout. Copy that folder before deleting or moving the checkout.

<details>
<summary>How do I get updates?</summary>

**Official Public desktop app:** official packages check for new public releases at startup and periodically in the background. Confirm an update when ready, or use **Settings → Version and updates**. Downloads are served by GitHub. You can also [download the installer for your platform](#download-tafelraum) and replace the app manually. The app has its own archive and never uses the school/colleagues update channel. Early0.1.88 users need one manual installation; read the migration note in the included guide.

**Running from source:** stop the local server. From an unmodified checkout, run `git pull --ff-only`, then `npm ci` and `npm start` in the app directory. Default self-built desktop apps also use manual updates, preserving your own changes. [Build and release details](prototypes/surface-shell-a-b/RELEASE.md).

</details>

For storage locations, private notes, agent access and backup/restore, read
[Data, privacy and backups](docs/DATA_AND_PRIVACY.md).
For setup, agents, worksheet design and developer guides, see the [documentation index](docs/README.md).

## Feedback and licence

If something gets in the way during a lesson, I’d like to hear what you were trying to do. [Open an issue](https://github.com/JUJIES/Tafelraum/issues) with a small example you can share publicly.

Tafelraum is **source available** under the [MIT License with Commons Clause 1.0](LICENSE). Third-party components keep their own [licences and notices](THIRD_PARTY_NOTICES.md).
