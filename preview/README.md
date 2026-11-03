# Public lesson preview

The hosted preview contains the synthetic Year 7 geography lesson **Volcanoes — Why live so close?** from the narrated demo. It includes the USGS YouTube starter, printable worksheet, separate teacher answers, native text and shapes, and four clips. The fixture in lessons/volcanoes is the saved demonstration lesson, with empty answers and stable public lesson ID volcanoes. No personal archive is required at build time.

Run node preview/build.mjs, then node preview/serve.mjs output/public-preview 5987. Run node preview/check.mjs against that server. The build validates both unchanged HTML packages with --require-print; their original print acceptance belongs to the demo material workflow.

The existing memory-only persistence and read-only static route service remain the boundary. No archive server is exposed. Teacher and Room share live worksheet inputs; separate tabs and reloads start clean. External video loading requires a visitor gesture. Legacy lesson query links open the current example rather than an empty board.

Deploy dist/, routes.json and serve.mjs to the dedicated static preview service. Keep the previous release directory for rollback and verify the HTTPS origin. This is separate from desktop releases and update channels.

### High-zoom rendering

Rectangular shapes reuse the native CSS box-shadow rendering path already used by image materials. This avoids Safari rasterising a large SVG SourceAlpha even when the filter is clipped. Ellipse and diamond shadows retain viewport-bounded SVG filters and bounded SVG viewports. The 48px screen-space margin covers the existing blur and offset; rotated viewport corners are mapped into each shape's local SVG coordinates. Offscreen shadows allocate no filter. This preserves the shadow, scene data and exports while avoiding zoom-dependent filter bitmaps several times larger than the object.

Run node preview/check-zoom.mjs [ORIGIN] for a repeatable WebKit/Chromium zoom sequence at Retina density. It reports frame timing and verifies bounded filter regions. Timings depend on hardware; initial frames may still be slower. Geometry coverage is tested in src/canvas/shape-shadow-region.test.ts.
