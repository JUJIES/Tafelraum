<p align="center"><img src="prototypes/surface-shell-a-b/public/icons/tafelraum-192.png" alt="" width="76"></p>

# Tafelraum

**An AI-powered local whiteboard for teaching.** Bring your own AI agent to turn a lesson idea into materials, arrange them on the board and prepare what the class will see. Then pick up the pen and teach on that same canvas.

![The teacher’s canvas with an illustrated transport lesson, drawing tools and lesson navigation](docs/images/teacher-canvas.png)

## Why I built it

I liked the way I could organise my teaching materials in OneNote. What I wanted in class was a little different. I wanted to keep a worksheet, a picture and my next question together, write over them with a pen, and show just one of them on the board without rearranging my own view.

That became Tafelraum. I build it, try it in my own lessons and change things when they get in the way. After several months of using it that way, I wanted other teachers to be able to try it too. The name is German: *Tafel* is the classroom board, *Raum* is a room.

What made AI useful to me was being able to ask for something that would be *there when I opened the lesson*. A worksheet in a chat still leaves me with files to move and a board to set up. In Tafelraum, I can ask my agent to make the worksheet, put it in the right lesson and frame the first activity for the projector.

## What you can ask your AI agent to do

Here’s a prompt I could use with the transport lesson above:

> In my “Ways to travel” lesson, make a short activity for pairs. Ask students to choose between the bus and the train and give two reasons in English. Add the activity to the lesson, place it beside the transport picture and make a numbered clip that shows just the task.

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

- **Read and annotate:** bring in an image or a PDF page, mark a detail with the pen or highlighter, and uncover an answer when the class is ready.
- **Listen and watch:** put an audio file, MP4 video or YouTube clip beside the task it belongs to.
- **Try and practise:** use an interactive HTML worksheet or simulation from the teacher or room window. Some worksheets also include a printable A4 layout.
- **Run an activity:** place a timer beside a group task. Course and lesson notes stay in the teacher view.
- **Pick up next week:** reopen the lesson from its class, subject and unit. The board and its materials are kept in your local archive.

</details>

<details>
<summary>How do I get updates?</summary>

Stop the local server. From an unmodified checkout, run `git pull --ff-only`, then `npm ci` and `npm start` in the app directory. This repository distributes source. There is no desktop installer or automatic binary update channel for this edition.

</details>

## Feedback and licence

If something gets in the way during a lesson, I’d like to hear what you were trying to do. [Open an issue](https://github.com/JUJIES/Tafelraum/issues) with a small example you can share publicly.

Tafelraum is **source available** under the [MIT License with Commons Clause 1.0](LICENSE). Third-party components keep their own [licences and notices](THIRD_PARTY_NOTICES.md).
