# Public lesson preview

The hosted preview uses the public Tafelraum teacher canvas and Room Canvas with three original English sample lessons. Each is an editable board with a starter picture, written tasks, an investigation and quiz, a consolidation area and homework. Four numbered clips follow the lesson phases. The map lesson adds a separate interactive field sheet with an A4 print layout; the eclipse board offers [NASA Space Place’s eclipse video](https://spaceplace.nasa.gov/eclipse-snap/en/) through an explicitly activated YouTube player. Open the [lesson guide](https://tafelraum-demo.jujies.app/guide.html).

## Run a separate preview

Install the app dependencies as described in the main README. From the repository root, use Node 22.18 or later:

```sh
node preview/build.mjs
node preview/serve.mjs output/public-preview 5987
```

Open `http://127.0.0.1:5987/guide.html`. With Chromium installed through the app’s Playwright dependency, run `node preview/check.mjs` in another terminal to exercise all three activities, Room synchronisation, cross-tab isolation and reload.

The build validates the HTML packages and reads only an automatically created temporary sample archive. It uses the normal public app build and substitutes a tab-memory canvas store for this preview only. The HTTP service reads compiled files from `dist/` and an explicit table of synthetic lesson responses from `routes.json`. It accepts GET and HEAD only. For hosting, copy those two outputs and `serve.mjs` to a dedicated static-service directory behind HTTPS. The normal development server and the desktop archive service are unnecessary.

Drawings, preferences and exercise answers in the preview stay in the current page’s memory. The teacher and its Room window can share the current activity. Reload the teacher page to start over. The guide also links directly to each activity for smaller screens.

### Worksheet design references

The trail sheet uses the title hierarchy and numbered assignment bands of *Madeira Basket Sledges*, the diagram-to-answer relationship of *Bauteile des Ottomotors* and the distinct writing boxes and footer of *Words in context*. Its map is the same original survey diagram used in the lesson. The standalone sheet reflows on a phone. Clip 6 uses the portrait paper projection in the teacher and Room views.
