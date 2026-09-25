# The Metamorphosis — Part One (0:00–10:00), rendered film

Pipeline for the MP4 cut of the first 10 minutes of `../SCREENPLAY.md`.

1. **References** (Nano Banana Pro): creature, Mother, Father, Grete, Chief Clerk, bedroom set, hallway set. `refs.json` holds the job IDs.
2. **Keyframes** (Nano Banana Pro, 16:9): one still per shot (59 shots), each attached to the relevant references for consistency.
3. **Motion** (Minimax Hailuo 2.3 Fast, 768p): 10 s clips, 6 s for short inserts, animated from each keyframe.
4. **Voices** (Seed Audio): Gregor (V.O. and his distorted "animal" voice), Mother, Father, Grete, Chief Clerk.
5. **Edit** (`build_part1.py`, run in the Higgsfield sandbox): 2.39:1 letterbox grade, film grain, vignette, title cards, supers,
   burned-in subtitles, a synthesized drone score with clock ticks and sound effects, voice mix, AAC audio, 24 fps H.264 MP4.

`manifest_part1.json` lists every video and audio job ID.
