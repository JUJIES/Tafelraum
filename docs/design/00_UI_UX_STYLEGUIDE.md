# Tafelraum UI and interaction guide

These rules apply to the teacher view, the classroom display, prototypes, mockups and implemented controls. The canvas and its lesson materials should be the first things a teacher notices.

## What to show

Show information when it helps the teacher decide or act. Keep frequent actions immediately available. Show tool or object options in context and put infrequent or consequential operations one level deeper. Diagnostics belong in their own development mode. Do not add placeholder controls for future features or panels to fill space.

Keep core actions in familiar positions. Use recognisable names and icons. Make the active tool and current state clear without requiring hover, a tutorial or an undocumented gesture. Give each area one dominant action. Secondary and destructive actions need distinct visual weight. Prefer undo for easily reversible edits. Ask for confirmation when the consequences are substantial or hard to reverse.

The teacher and Room views share a visual language but have separate tools, shell state and responsibilities. The Room window is the class display. It does not mirror all teacher controls. Use motion to explain a change of state and offer reduced motion.

## Interface text

Before adding persistent text, ask whether the user needs it now and whether it helps with a decision. If position, a label, an icon or the visible state already explains the action, remove the repetition. Retain information about data loss, privacy and consequences. Brief contextual help is preferable to explanatory paragraphs beside every control.

Use short, concrete action labels such as **Add material** and **Fit to content**. Use concise save states. Avoid marketing copy, motivational text, technical jargon, all-caps labels and subtitles that repeat a heading. Give the same action the same name wherever it appears.

A single **Add material** button is enough when its effect is clear. A confirmation about moving a lesson to the trash may need to say that its canvas and materials can be restored. The title and action labels should do most of the work.

## Icons and layout

Use `lucide-react` for shell and contextual actions. The dockable primary toolbar is a deliberate exception. It uses official Microsoft Fluent System Icons with their original 24-pixel geometry. Keep one icon family within a control group. Do not redraw an available standard icon. Semantic colour may be applied to existing separate fills or unchanged masks. A custom product icon needs an identifiable meaning and a documented reason.

Horizontal teaching toolbars use an icon and short label. A narrow vertical toolbar can use familiar icons alone if each has a tooltip, an accessible name and a clear active state. Icon-only global actions such as undo, redo and fullscreen also need accessible names. Keep unfamiliar symbols labelled. Maintain legibility and contrast at classroom viewing distance.

Give the canvas the largest uninterrupted area. Group tools by task and distinguish tool selection from global actions. Show stroke width and colour only where relevant. Keep reset, diagnostics and infrequent settings out of the primary tool group. Use spacing for grouping before adding dividers, headings, shadows or cards.

## Touch, pen and appearance

Touch targets in the prototype have an active area of at least **48 × 48 CSS pixels**, with space between neighbouring actions. No core flow can depend on hovering or on a tiny drag handle as its only input. Indicate selection, disabled state, keyboard focus and pending saves in more than colour alone. Larger displays may need larger targets. Desktop browser tests do not verify reach, pen input or touch on a physical smartboard.

Use readable typography, functional whitespace, neutral surfaces and a restrained accent. Light and dark themes share components, hierarchy and semantic colours. Preserve the original appearance of images, PDFs and subject-specific colours when switching themes. Keep edges, shadows and transitions quiet. Avoid heavy blur, decorative card grids, low-contrast icons, competing accents and promotional hero text in working views.

The exact colour values, default theme, type sizes, radii, shadows, spacing and docking position depend on prototype comparisons and real hardware tests.

## Feedback and help

Keep save feedback concise. Avoid a success toast if the result is already visible. An error should identify what happened and what the user can do next. Empty states need at most a short orientation and a primary action. Avoid unexplained codes and permanent warning banners for conditions that can be shown locally. Attention cues should be brief, interruptible and local to the affected material.

Core interactions must be discoverable without onboarding. Teach unfamiliar concepts in short, optional, contextual help. Help remains available on demand without occupying the working surface permanently.

## Original Surface Lab prototype

The original 0.1 study used a single working shell for the canvas and for testing touch, pen input and toolbar placement. It was not the final planning or presentation interface. It had a central workspace, concise lesson date and save status, and tools for hand, selection, pen, highlighter, eraser, text and shapes. Undo, redo, adding material, finding content and fullscreen had to remain reachable.

The prototype toolbar docks to any of four edges using a sufficiently large handle. Horizontal positions show short labels; vertical positions use one icon column. Light and dark are states of the same shell. Working fullscreen hides browser chrome and does not start a presentation. Docking experiments do not establish a final hardware placement. Later surfaces require their own briefs.

## Briefs, mockups and review

Before building a new surface or major state, write a short [UI brief](UI_BRIEF_TEMPLATE.md). Identify the user and situation, one primary action, one design question, required and excluded elements, exact visible text, real content, the variable under test and what must remain stable. Record acceptance criteria and hardware assumptions. Aim for one page.

ImageGen mockups should identify themselves as UI mockups and test one stated question. Use approved content, realistic touch targets and identical lesson material across variants. Do not invent menus, badges, dashboard cards or future AI or presentation functions to make one option look better. Keep development switches distinct and check generated labels. A selected mockup is a visual reference, not an unchecked implementation specification.

Review the change using the real task. Confirm that the action is discoverable, the main and secondary controls are distinct, text is necessary, focus is visible and the canvas remains dominant. Record anything still unverified on hardware. Iterate on one visual observation at a time, make a focused change and compare the same browser state. Preserve unrelated content and data flow. Screenshots are evidence for visual behaviour only.

## Shared neutral button states

Teacher and Room controls use `src/button-states.css`. On neutral shell, toolbar, settings and dialog buttons, hover and keyboard focus use the same internal `--button-hover-bg` surface. It mixes `--toolbar-strong` with 12% text colour, including on buttons with existing backgrounds. Do not add an external blue ring or focus offset, including on an automatically focused close button. Keyboard focus must stay visible. Active selections, destructive actions, inputs and canvas handles retain their distinct states.
