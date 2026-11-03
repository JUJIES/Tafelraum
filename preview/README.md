# Public lesson preview

The hosted preview contains the synthetic Year 7 geography lesson **Volcanoes — Why live so close?** from the narrated demo. It includes the USGS YouTube starter, printable worksheet, separate teacher answers, native text and shapes, and four clips. The fixture in lessons/volcanoes is the saved demonstration lesson, with empty answers and stable public lesson ID volcanoes. No personal archive is required at build time.

Run node preview/build.mjs, then node preview/serve.mjs output/public-preview 5987. Run node preview/check.mjs against that server. The build validates both unchanged HTML packages with --require-print; their original print acceptance belongs to the demo material workflow.

The existing memory-only persistence and read-only static route service remain the boundary. No archive server is exposed. Teacher and Room share live worksheet inputs; separate tabs and reloads start clean. External video loading requires a visitor gesture. Legacy lesson query links open the current example rather than an empty board.

Deploy dist/, routes.json and serve.mjs to the dedicated static preview service. Keep the previous release directory for rollback and verify the HTTPS origin. This is separate from desktop releases and update channels.
