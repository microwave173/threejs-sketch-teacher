# Agent entry point

Read README.md first. This repository generates Three.js teacher trajectories; it does not train or serve a student model.

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
