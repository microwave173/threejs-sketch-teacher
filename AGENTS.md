# Agent entry point

Read README.md first. This repository generates Three.js teacher trajectories; it does not train or serve a student model.

- Preserve `prompts/system.txt`, especially minimal strokes, real 3D geometry, simple motion, and deterministic `render(t)`.
- Put user tasks into a JSON list with unique safe IDs. User input is only the animation task; the system prompt defines the API and style.
- Install requirements, Playwright Chromium and the pinned tokenizer with `scripts/setup_tokenizer.py`. Use `DEEPSEEK_API_KEY` from the environment. Never print, commit or embed credentials in requests or browser assets.
- Run `scripts/smoke_test.py` to verify rendering without API use, then run the requested tasks using a fresh `--output` directory. Do not overwrite historical examples.
- Same config/tasks/prompts may resume in the same output directory. Never bypass manifest/cache mismatch checks.
- Use bounded retries; retain failures and do not silently patch generated JS to claim success. Report actual success counts and token usage from output records.
- A rendered GIF passing structural checks is not a semantic or physics quality score. Visually inspect representative results and distinguish observation from automated validation.
- Deliver the output `index.html` path plus GIF/JS links. Do not start SFT unless separately requested.

The bundled historical GIFs were generated before the new simple-motion sentence. Do not present them as fresh results for the updated prompt.
