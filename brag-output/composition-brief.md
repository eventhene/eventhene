# Hyperframes Composition Brief: EventHene

## Objective
Create a short, polished launch-style brag video for EventHene that follows one ticket from a registrant's phone through the gate scanner to the organizer's SMS broadcast.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape - 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `C:\Users\worsh\CODE CLAUDE\eventhene`
- Primary files read: `app/(marketing)/page.tsx`, `app/globals.css`, `tailwind.config.ts`, `components/scan/Scanner.tsx`, `components/marketing/TicketCard3D.tsx`, `public/` logos and fonts
- Product name: EventHene
- Tagline / strongest claim: "EventHene is the operating system for event organizers in Africa."
- Key UI moments to recreate: the gold gradient QR ticket, the gate scanner verdict card, the SMS broadcast delivery counts
- Copy that must appear verbatim (all of it is the project's own):
  - "Now registering events in Ghana"
  - "Your events, elevated."
  - "QR-coded tickets"
  - "Attendees screenshot them."
  - "Fire Conference 2026" / "Sat, Nov 14 2026" / "Christ Temple, Ghana" / "KWA-FIRE-7241089"
  - "Instant QR scan verdict."
  - "Welcome" / "Kwame Asante" / "VIP - 20:14"
  - "Hi Kwame, your ticket for Fire Conference 2026 is confirmed. Ref: KWA-FIRE-7241089. Show at the gate. See you there!"
  - "Sent 342" / "Delivered 338" / "Failed 4"
  - "Send instant updates to every registrant with one click."
  - "The operating system for event organizers in Africa."
  - "eventhene.com"

## Creative Direction
- Tone preset: polished
- Creative direction: a quiet premium product film that ends at the gate
- Interpretation: fewer scenes, longer holds, confident restraint. Entrances are fast (0.4-0.6s) then hold. Weighted smooth motion, no bounce, no stacked text, no exclamation beyond the project's own copy.
- Angle: follow one ticket through the real flow instead of selling a dashboard. The product's claim is operational ("Know exactly who showed up"), so the video earns it by showing the gate moment.
- Hook: gold kicker fades up, then the site's real headline "Your events, elevated." slams in with "elevated." in brand gold.
- Outro / punchline: the real crown logo lands on black with "The operating system for event organizers in Africa." then eventhene.com.
- Avoid:
  - Generic SaaS language (nothing beyond the project's own copy)
  - Abstract filler visuals, particles, waveform or equalizer graphics
  - Unrelated visual redesign - this is EventHene's existing gold-on-near-black identity
  - Any real attendee, organizer, phone number, email or live data

## Visual Identity
- Background: `#0a0a0c`, deeper canvas `#060608`
- Text: `#f0ede8`, muted `#8a8880`
- Accent: `#D4A853`, royal gold `#B8860B`, glow `rgba(212,168,83,0.15)`
- Emerald (scan success): `#34D399`; crimson (failed): `#F87171`
- Glass surfaces: `rgba(255,255,255,0.05)` fill on `rgba(255,255,255,0.08)` borders, radius 20-28px
- Display font: Inter 800, letter-spacing -0.03em - use the local `public/fonts/Inter-800.woff`; body Inter 400/600; mono for ticket refs
- Visual references from the project: glassmorphic stat and feature cards, gold gradient ticket with perforation and QR block, scanner viewfinder with gold corner brackets, emerald verdict card
- Logo: copy the real `public/logo-crown.png` (and `logo-full.png` if useful) into the composition assets. Never redraw the mark.

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook: hero headline — 3.4s — gold kicker, then "Your events, elevated." holding settled ~1.5s
2. The ticket — 4.6s — gold QR ticket arrives, QR fades in, mono ref types on; left line "QR-coded tickets"
3. The gate — 5.0s — scan band sweeps the QR, emerald verdict card pops: Welcome / Kwame Asante / VIP - 20:14
4. The broadcast — 4.0s — SMS composer card, three delivery rows on the beat grid, Delivered counts up to 338
5. Logo close — 3.0s — real crown logo lands on the 18.55s strong cue, wordmark, the operating-system line, eventhene.com

## Audio
- Audio role: warm bed with sparse professional accents
- Audio arc: low warm entrance, one physical card arrival, one interface confirm at the gate, build through the broadcast rows to a strong cue, single dry impact on the logo, fade to quiet
- Music: `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` (60s, ~110 BPM)
- Music treatment: start 0, volume ~0.5, fade-in 0.6s, fade out across the final 1.2s under the logo; let the last accent ring over the fade
- Music cue guidance: preset at `<brag-skill-dir>/assets/music/cues/happy-beats-business-moves-vol-10-by-ende-dot-app.music-cues.json`. Strong cues to target: **15.82s** (broadcast payoff) and **18.55s** (logo landing). Beat grid ~0.545s apart; beat-grid window for the three delivery rows: 13.11 / 13.64 / 14.20. Do not put readable sentences on consecutive beats.
- Audio-reactive treatment: subtle - drive the gold glow behind the ticket and the logo bloom from music RMS/bass. No waveforms, equalizers, particles or strobing.
- Audio-coupled moments:
  - Scene 2 ticket card arrival — soft card/whoosh, physical
  - Scene 3 verdict pop — short interface confirm, landing on the same frame as the visual
  - Scene 4 delivery rows — three light ticks on the beat grid; count-up silent
  - Scene 5 logo landing — one dry impact on the 18.55s cue
- SFX selection guidance: at most four cues in 20 seconds. Match motion and interaction: card sound for the card, interface confirm for the scan verdict, light ticks for row arrivals, one dry impact for the logo. Nothing on plain text entrances.
- SFX analysis guidance: use `<brag-skill-dir>/assets/sfx/sfx-analysis.md`; prefer low high-frequency-risk files since the tone is polished and restrained.
- Exact SFX choice: choose filenames, timestamps, density and volume after the visual animation exists.
- Audio files: copy the chosen music and any selected SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). This is the /brag workflow: do not enter the `hyperframes` entry-point intent interview and do not route into the generic promo / launch-video workflow. Prefer native Hyperframes conventions.

Requirements:
- Show at least one real UI, copy, or visual element from EventHene (this brief names several).
- Keep all text readable in the final render: short labels ~0.8s settled, sentences ~0.3s per word.
- Keep the video within 15-25 seconds (target 20.0s).
- Include the planned music/SFX layer.
- Treat the audio notes as guidance; choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints; ignore cues that hurt readability, pacing or the product story.
- Beat-lock 1-3 major reveals within ~0.15s of a strong cue and mark them `// beat-locked`; snap the delivery rows to consecutive beats within ~0.10s and mark `// beat-grid`.
- Use local assets for audio, fonts, logo and any runtime dependency where possible.
- Run `hyperframes check` before render — it is brag's single gate.
- Keep creation and rendering local. No publishing.
