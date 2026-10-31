<p align="center"><img src="prototypes/surface-shell-a-b/public/icons/tafelraum-192.png" alt="" width="76"></p>

# Tafelraum

A local whiteboard for teaching. Prepare a lesson on one canvas, write on it as you teach, and choose exactly which part the class sees on a second screen.

![The teacher’s canvas with an illustrated transport lesson, drawing tools and lesson navigation](docs/images/teacher-canvas.png)

## Why I built it

I liked the way I could organise my teaching materials in OneNote. What I wanted in class was a little different. I wanted to keep a worksheet, a picture and my next question together, write over them with a pen, and show just one of them on the board without rearranging my own view.

That became Tafelraum. I build it, try it in my own lessons and change things when they get in the way. After several months of using it that way, I wanted other teachers to be able to try it too. The name is German: *Tafel* is the classroom board, *Raum* is a room.

## A lesson in three moves

1. **Prepare.** Open a lesson and put a picture or PDF page on the canvas. Add a question beside it, or cover the answer until you need it.
2. **Choose what the class sees.** Make a numbered *clip* around a part of the board or assign one to a single item. Open **Present → Room Canvas** and move that window to the classroom display.
3. **Teach on the same board.** Switch clips as the lesson unfolds. You can annotate a diagram or let someone write on the room display. Their strokes become part of the same lesson.

<details>
<summary>See the classroom view</summary>

![Room Canvas showing the same transport lesson without the teacher’s lesson navigation](docs/images/room-canvas.png)

Room Canvas opens a second local window. You can try both windows on one screen before connecting a projector.

</details>

## Try it on your computer

This first public edition runs from source in a browser. You need Git and Node.js 22.18 or newer, with npm. Open a terminal and run:

```sh
git clone https://github.com/JUJIES/Tafelraum.git
cd Tafelraum/prototypes/surface-shell-a-b
npm ci
npm start
```

Open the local address printed in the terminal. Tafelraum creates an empty lesson archive on first launch. If the interface opens in German, choose **Einstellungen → Sprache → English**. For a first lesson, drop a picture onto the board and write a question next to it.

Press **Ctrl+C** in the terminal to stop. Run `npm start` in the same directory next time. Your lessons stay in `local-data/public-lessons/` inside the checkout. Copy that folder before deleting or moving the checkout.

<details>
<summary>What else can I put on the board?</summary>

Add images, PDF pages, audio, MP4 video and links. Interactive HTML materials can include exercises or simulations that you operate from the teacher or room window. A timer can sit beside an activity. Lessons are organised by class, subject and teaching unit.

</details>

<details>
<summary>Can I use my own AI assistant?</summary>

Yes. The local agent kit includes instructions and tools for finding lessons, adding materials and arranging a canvas. Canvas preparation uses the open teacher window. The board itself works without an AI account or API key. See the [agent guide](docs/AGENT_WORKFLOW.md) for setup and supported operations.

</details>

<details>
<summary>How do I get updates?</summary>

Stop the local server. From an unmodified checkout, run `git pull --ff-only`, then `npm ci` and `npm start` in the app directory. This repository distributes source. There is no desktop installer or automatic binary update channel for this edition.

</details>

## Feedback and licence

If something gets in the way during a lesson, I’d like to hear what you were trying to do. [Open an issue](https://github.com/JUJIES/Tafelraum/issues) with a small example you can share publicly.

Tafelraum is **source available** under the [MIT License with Commons Clause 1.0](LICENSE). Third-party components keep their own [licences and notices](THIRD_PARTY_NOTICES.md).
