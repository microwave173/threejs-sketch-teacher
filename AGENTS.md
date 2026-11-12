# Agent entry point

Read README.md first. The latest release contains the sparse-movement-label4B model, its required full-SFT base, and the exact2000-row training dataset. See models/movement_labels2000_2ep/README.md, data/teachers/movement_labels2000_v1/README.md and docs/ideas/VERIFIABLE_SKETCH_MOTIVATION_ZH.md. Use scripts/download_movement_labels_weights.py and scripts/infer_movement_labels.py for this model. Do not load the adapter on the official untuned Qwen base. Do not start new training unless requested.

The existing root run.py remains the historical teacher-generation CLI. The sections below describe earlier workflows; they do not replace the latest movement-label release.

An earlier idea is storyboard-first, per-object static generation/selection, per-object motion, then composition. Do not substitute whole-scene generation: it is only a comparison baseline. The per-object workflow is an implementation plan, not an already shipped CLI.

- For the new static/motion idea, first read `docs/ideas/PIPELINE_ZH.md` and use `prompts/static_motion_v2/`. The existing `run.py` does NOT implement that workflow; do not silently substitute one-shot. Keep the storyboard-first object workflow marked as future work.
- For the historical one-shot baseline, preserve `prompts/system.txt`, especially minimal strokes, real 3D geometry, simple motion, and deterministic `render(t)`.
- Put user tasks into a JSON list with unique safe IDs. User input is only the animation task; the system prompt defines the API and style.
- For the existing 5,000-task pool, use `data/tasks5000/train4750.json` for training-data generation and retain `validation250.json` as held out. Use `tasks.json` only when the user explicitly wants the whole pool. This is the historical split, not a new semantic-isolation guarantee.
- Install requirements, Playwright Chromium and the pinned tokenizer with `scripts/setup_tokenizer.py`. Use `DEEPSEEK_API_KEY` from the environment. Never print, commit or embed credentials in requests or browser assets.
- Run `scripts/smoke_test.py` to verify rendering without API use, then run the requested tasks using a fresh `--output` directory. Do not overwrite historical examples.
- Same config/tasks/prompts may resume in the same output directory. Never bypass manifest/cache mismatch checks.
- Use bounded retries; retain failures and do not silently patch generated JS to claim success. Report actual success counts and token usage from output records.
- A rendered GIF passing structural checks is not a semantic or physics quality score. Visually inspect representative results and distinguish observation from automated validation.
- Deliver the output `index.html` path plus GIF/JS links. Do not start SFT unless separately requested.

The bundled historical GIFs were generated before the new simple-motion sentence. Do not present them as fresh results for the updated prompt.
