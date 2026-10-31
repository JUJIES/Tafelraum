# Engineering reference

For the current public edition, start with the [documentation index](../README.md). To run or test the app, see [contributing](../../CONTRIBUTING.md) and the [browser test guide](../../scripts/BROWSER_TESTS.md). The public checkout and the binary update channel are separate; [working states](../WORKING_STATES.md) explains the boundary.

The numbered documents in this directory include detailed engineering contracts and dated acceptance records, many in their original German. A historical test result applies to the configuration and date it records. It is not a list of current public features or an installation instruction.

| Area | Detailed reference |
| --- | --- |
| Canvas and material ownership | [Material projection contract](02_VERTRAG_INTERAKTIVE_MATERIALPROJEKTION.md) |
| Local archive, revisions and recovery | [Backup and restore](03_BACKUP_UND_WIEDERHERSTELLUNG_LOKAL.md) · [Stability and persistence](56_APP_STABILITY_AND_PERFORMANCE.md) |
| Interactive HTML and printing | [HTML material contract](04_INTERAKTIVE_HTML_MATERIALIEN.md) · [Shared A4 pages](30_SHARED_A4_PAGES_TEST.md) |
| Classroom presentation | [Room Canvas](21_ROOM_CANVAS_PILOT_PLAN.md) · [Room input](23_ROOM_CANVAS_INPUT_TEST.md) · [Media integration](43_HTML_MEDIA_INTEGRATION_TEST.md) |
| Material and teacher data | [DOCX conversion](39_DOCX_IMPORT_TEST.md) · [Material ordering](40_MATERIAL_ORDER_TEST.md) · [Private lesson notes](46_STUDENT_NOTES.md) |
| Agent tools | [Canvas commands](45_CANVAS_AGENT.md) · [Lesson organisation](47_TEACHING_AGENT.md) · [Agent kit](63_BUNDLED_AGENT_KIT.md) |
| Distribution and evidence | [Public distribution boundary](61_DISTRIBUTION_BOUNDARY.md) · [Third-party inventory](../../THIRD_PARTY_NOTICES.md) · [Source evidence](../../SOURCE_DISTRIBUTION.md) |
| UI localisation | [Interface language](64_UI_LANGUAGE.md) |
| Historical context | [Original prototype plan](00_IMPLEMENTIERUNGSPLAN_PROTOTYP_0_1.md) · [Concept package](../concept/v1.4/00_README.md) · [Decision log](DECISION_LOG.md) |

Changes to a saved material, a canvas command or the presentation protocol must preserve existing lesson data and the normal teacher/Room workflow. Check the applicable contract and its later decisions before changing code.
