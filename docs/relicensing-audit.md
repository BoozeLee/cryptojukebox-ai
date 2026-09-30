# Dream Script relicensing audit

## Decision

No private source is imported into CryptoJukebox v1. The Dream Script mapper
will be implemented as a clean-room, behavior-level module under Apache-2.0.

## Evidence reviewed

- `BoozeLee/bakery-repopilot` and
  `Bakery-street-project/repopilot` are private proprietary repositories.
- Their tracked `dream_engine_packager.py` at
  `a3b6eaf06d666d07038584145336455e604dde62` describes a packager, not the
  engine itself.
- The packager expects the engine and lexicon at untracked local paths:
  `~/workspace/automation_codex/codex_brick.py` and
  `~/workspace/dream_script_engine_lexicon.yaml`.
- The available neuromorphic/psychedelic repositories contain no tracked
  implementation eligible for a source-level audit.

## Relicensing result

The repository owner authorized Apache-2.0 relicensing in principle, but the
actual engine’s authorship, complete dependency graph, and source commit are
not available to verify. Releasing it would violate CryptoJukebox’s public
provenance requirements.

## Reconsideration gate

An import may be reconsidered only when the candidate engine is committed in a
reviewable repository, every author and dependency license is identified, and
the source can be tied to a specific audited commit. Any approved import must
update `ATTRIBUTION.md` with that evidence and retain required notices.
