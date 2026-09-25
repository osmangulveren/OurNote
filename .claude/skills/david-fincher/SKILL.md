---
name: david-fincher
description: Adapt any source material (a novel, story, PDF, article, real case, pitch) into a David Fincher–style screenplay, shot list and film treatment — clinical, procedural, dread-soaked, precisely controlled. Use whenever the user asks for something "Fincher-style", "like Se7en / Zodiac / Fight Club / Gone Girl / The Social Network / Mindhunter / The Killer", or wants a dark psychological thriller adaptation with meticulous visual control. Also use when turning a script into a timed, rendered "film" (animated storyboard, browser-played movie, or AI-video shot prompts) in Fincher's visual grammar.
---

# David Fincher — adaptation & filmmaking skill

Fincher's work is about **systems that grind people down** — institutions, obsessions, families, jobs — photographed with the patience of a surveillance camera. The horror is never the monster; it is the procedure around it. Apply that lens to whatever source you are given.

## 1. Find the Fincher story inside the source

Before writing anything, answer these in a short treatment note:

1. **The system.** What machine is the protagonist inside? (a job, a marriage, a police bureaucracy, a family economy). The system is the real antagonist.
2. **The procedure.** What does the protagonist do over and over? Fincher films process: filing, typing, counting, cleaning, checking the clock. Find the repeated action and make it a motif.
3. **The obsession.** What does someone refuse to let go of? (a case, a picture on a wall, a debt, a reputation).
4. **The reveal of cost.** Where is the ledger? Fincher loves money, time, and evidence made physical — receipts, timestamps, case files, bank books.
5. **The cold ending.** No catharsis. The system resets and continues. Sunlight at the end is often the most disturbing image.

Preserve the source's plot beats and meaning; change emphasis, not events. Quote copyrighted translations/text sparingly — write original dialogue that carries the source's intent.

## 2. Voice & structure

- **Cold open before titles.** An intimate, procedural sequence — then a title sequence built from extreme close-ups of objects (the *Se7en* titles: hands, paper, razor, film scratches, jittering type).
- **Voiceover** (optional, *Fight Club* / *The Killer*): first-person, dry, self-lacerating, full of rules and numbers. "I've been awake for 5,110 mornings. I remember none of them."
- **Three movements + coda.** Each ends on a door, a lock, or a clock.
- **Dialogue** is quick, overlapping, understated (Sorkin-cadence in *Social Network*; flat menace in *Zodiac*). People talk *around* the horror. Politeness is a weapon.
- **Scene headings carry timestamps** as supers: `MONDAY — 6:31 A.M.` Fincher tracks time obsessively; so does the audience.
- **Violence is sudden, short, and banal**, followed by silence and cleanup.
- **Humor** is bone-dry and comes from bureaucratic absurdity.

## 3. Visual grammar (write it into every scene)

| Element | Rule |
|---|---|
| Palette | Desaturated. Sick greens and cyan in shadows, sodium-yellow / amber in practicals, crushed blacks. Skin looks slightly ill. Red appears only once or twice — and means something. |
| Light | Motivated practicals only: a lamp, a doorway slit, a window with rain. Faces half in darkness. Light *under* doors is a recurring device. |
| Camera | Locked-off or on a perfectly smooth dolly/Steadicam. **No handheld.** Slow push-ins (imperceptible). Symmetrical frames. Camera moves with the subject exactly, "as if on rails". Top-down inserts of objects. |
| Coverage | Precise inserts: hands, keys, clocks, food on a plate, the lock mechanism. Many takes, perfect repetition. |
| Editing | Clinical, rhythmic. Hard cuts to black. Montage of time passing via repeated framings (same angle, different day). |
| Typography | Supers in small, clean sans or typewriter caps, low in frame. Title sequence: scratchy, hand-lettered, flickering. |
| Texture | Rain, dust in light shafts, film grain, occasional subliminal flash frame. |
| Sound | Industrial drones (Reznor/Ross), low synth pulses, clock ticks mixed loud, silence before violence. Diegetic sound bleeds through walls. |

## 4. Screenplay format

Write in standard screenplay form (sluglines, action, CHARACTER, dialogue) with these additions:

- `SUPER:` lines for timestamps and chapter cards.
- `INSERT —` for procedural close-ups.
- `CAMERA:` notes only where the move is the meaning (e.g. "CAMERA: pushes in over forty seconds, never stopping").
- `SOUND:` notes for drone/tick/silence cues.
- Target **~1 page per minute**. A 20-minute short ≈ 18–22 pages / ~28–40 scenes.
- Track running time in a scene table (scene, start, duration) so the film can be built from it.

## 5. From script to film

When asked to "make the movie", produce a shot list from the script where every shot has:
`id, scene, start, duration, framing (ECU/CU/MS/WS/top-down), subject, lighting, camera move, sound cue, on-screen text/subtitle`.

Then render it in whatever medium is available:

- **Browser-rendered film** (default, no external cost): one timed player, 16:9, shots composed from layered gradients, silhouettes (inline SVG), light slits, rain, grain, flicker; slow CSS push-ins over each shot's duration; burned-in subtitles; supers; a Web Audio drone + clock tick score; chapter scrubbing; play/pause; captions toggle.
- **AI video generation**: turn each shot into a prompt with the palette/camera rules above ("static locked-off camera, slow dolly in, desaturated teal-green shadows, sodium amber practical, 35mm, crushed blacks, film grain"). Confirm cost with the user before generating — 20 minutes is 150+ clips.

## 6. Checklist before delivering

- [ ] Source beats intact; the "system" is visible in every act.
- [ ] Cold open → title sequence → acts → cold coda.
- [ ] Every scene has a timestamp super and a motivated light source.
- [ ] At least one recurring procedural insert (clock, key, plate, door).
- [ ] Red used at most twice.
- [ ] Running time adds up to the requested length.
