# Concept schema examples

These JSON files are design examples rather than supported runtime APIs. The original concept separated semantic activities and optional lesson flow from board views and concrete presentation state.

| Example | Proposed role |
| --- | --- |
| `lesson-v0.3.example.json` | Lesson definition, optional activities, flow, views, presentation steps and import reference. |
| `mirror-v0.1.example.json` | Incremental unit or lesson mirror, with source, evidence and delivery state. |
| `material-manifest-v0.1.example.json` | Material availability, external source, provenance, rights and relationships. |
| `presentation-state-v0.2.example.json` | Teacher, prepared and on-air viewports, LIVE/HELD and transient pointer. |
| `live-session-v0.1.example.json` | A later proposal for temporary, account-free remote sessions. |
| `command-batch-v0.2.example.json` | Commands without mandatory phases, with separate audience and reveal actions. |
| `publication-v0.2.example.json` | A persistent, sanitised read-only publication with a lesson path. |

Earlier lesson v0.1/v0.2, command v0.1 and publication v0.1 files are retained for historical comparison. They are not implementation templates. An optional lesson path groups steps without requiring pedagogical phases. Teacher, on-air and saved viewpoints have different lifetimes. Pointers are transient, original assets remain outside the canvas and public clients receive a prepared projection.
