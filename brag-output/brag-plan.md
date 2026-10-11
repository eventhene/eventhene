# Brag Plan: EventHene

## What is this app?
EventHene is the operating system for event organizers in Africa: collect registrations, send bulk SMS to your crowd, scan QR tickets at the gate, and know exactly who showed up.

## The angle
Most ticketing videos sell a dashboard. This one follows one ticket through the real thing: a gold QR ticket lands on a phone, a scanner at the gate says "Welcome", and 338 people get the follow-up SMS. The product's own claim is operational, not aspirational ("Know exactly who showed up"), so the video earns it by showing the gate moment rather than describing it. Gold-on-near-black, the project's actual palette, carries a premium feel that fits gospel conferences and ticketed church events in Ghana.

## Hook (first 2-3 seconds)
Near-black frame. A gold kicker, "NOW REGISTERING EVENTS IN GHANA", fades up, then the site's real headline slams in: "Your events, **elevated.**" with "elevated." in brand gold. The hook is the project's own hero copy, verbatim.

## Key moments (the middle)
- The gold ticket card arriving with a real QR block, "Fire Conference 2026", "Sat, Nov 14 2026", "Christ Temple, Ghana", and ticket ref KWA-FIRE-7241089.
- A scan band sweeping the QR, then the gate verdict card popping: "Welcome / Kwame Asante / VIP - 20:14" in emerald. This is the product's payoff moment.
- The broadcast result counting up: Sent 342, Delivered 338, Failed 4, under the project's own line "Send instant updates to every registrant with one click."

## Outro / punchline
The real EventHene crown logo lands on black with the wordmark and the product's own sentence: "The operating system for event organizers in Africa." Then eventhene.com.

## User flow worth showing
Entry -> key action -> result, exactly as the product works:
1. A registrant gets a gold QR ticket (the ticket card).
2. The gate scans it and gets an instant verdict ("Welcome in", attendee name, tier, time).
3. The organizer broadcasts to every registrant and sees delivery counts.

All on-screen names, refs and counts are the project's own demo placeholders from its landing page (`app/(marketing)/page.tsx`): "Kwame Asante", "KWA-FIRE-7241089", "Sent 342 / Delivered 338 / Failed 4". No real attendee, organizer, phone number or email appears, and no live data was read for this video.

## Tone
- Preset: polished
- Creative direction: a quiet premium product film that ends at the gate
- Interpretation: fewer scenes, longer holds, confident restraint. Motion is smooth and weighted rather than bouncy; every entrance is fast (0.4-0.6s) and then holds. No jokes, no exclamation marks, no stacked text.

## Format: landscape - 1920x1080
## Duration: 20 seconds

## Visual identity (from the project)
- Background: `#0a0a0c` (`--bg`), deeper canvas `#060608`
- Accent: `#D4A853` (`--accent`), royal gold `#B8860B`, glow `rgba(212,168,83,0.15)`
- Text: `#f0ede8` (`--ink`), muted `#8a8880`
- Emerald (scan success): `#34D399`; crimson (failed): `#F87171`
- Display font: Inter 800, letter-spacing -0.03em (local `public/fonts/Inter-800.woff`)
- Body font: Inter 400/600; mono for ticket refs (JetBrains Mono 700 is in the project)
- Strongest visual element: glassmorphic cards (`rgba(255,255,255,0.05)` on 8% white borders) and the gold gradient ticket with its QR block
- Real logo: `public/logo-full.png` / `public/logo-crown.png` / `public/logo-icon.png` - always the real mark, never a redrawn one

## Share copy (draft)
EventHene: the operating system for event organizers in Africa. Gold QR tickets, bulk SMS to your whole crowd, and a scanner at the gate that tells you exactly who showed up.

## Audio direction
- Role: warm bed with sparse professional accents
- Music: `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` (60s, ~110 BPM)
- Music treatment: start at 0, volume ~0.5, 0.6s fade-in, fade out under the final logo; let the last accent ring over the fade
- Music cue guidance: preset read from `assets/music/cues/happy-beats-business-moves-vol-10-...music-cues.md`. Beat grid is ~0.545s apart, so sequential text must not take every beat. Target strong cues: **15.82s** and **18.55s** (both high intensity) for the broadcast payoff and the logo landing. Beat-grid window for the three delivery rows: 13.11 / 13.64 / 14.20 (every beat is fine here because the rows are short numeric labels, held together afterward).
- Audio-reactive treatment: subtle. Drive the gold glow behind the ticket and the logo's bloom from music energy. No waveforms, no equalizer bars, no particles.
- SFX posture: sparse, motion-matched. At most four cues in 20 seconds.
- Audio-coupled moments: ticket card arrival (soft card/whoosh), scan band completing into the verdict (short interface confirm), delivery rows arriving (three light ticks), logo landing (one dry impact on the 18.55s cue).
- Restraint rule: no music swell that drowns the scan confirm, no SFX on plain text entrances, nothing comedic. If a cue would make the edit feel busy, drop it.

## Storyboard

### Scene 1 — Hook: hero headline — 3.4s
Near-black with a faint gold radial glow top-left. Gold uppercase kicker "NOW REGISTERING EVENTS IN GHANA" fades up at 0.3s. At 1.0s the headline "Your events, elevated." slams in from a 24px rise, "elevated." in `#D4A853`. Holds settled from ~1.6s to 3.1s (1.5s for a 3-word read, above the floor).
Sequential/interaction: none
Audio intent: music enters warm and low; the frame should feel like a room before doors open
Audio-coupled idea: none
Music: warm bed, fade in 0.6s
Transition mood: soft crossfade -> Scene 2

### Scene 2 — The ticket — 4.6s
A gold-gradient ticket card rises into frame on the right, perforated edge, QR block at its base. On it: "FIRE CONFERENCE 2026", "Sat, Nov 14 2026", "Christ Temple, Ghana", and in mono "KWA-FIRE-7241089". Left side holds one line of the project's own copy: "QR-coded tickets. Attendees screenshot them." The card settles with a slow 3-degree tilt and a gold glow that breathes with the music.
Sequential/interaction: yes - the card arrives first, then the QR block fades in inside it, then the ticket ref types on in mono
Audio intent: arrival should feel physical, like something handed over
Audio-coupled idea: soft card/whoosh on the card arrival; no sound on the text
Music: continues, unchanged
Transition mood: clean cut -> Scene 3

### Scene 3 — The gate — 5.0s
Scanner framing on near-black: a square QR viewfinder with gold corner brackets, the ticket's QR inside. A scan band sweeps top to bottom over ~0.9s. On completion the emerald verdict card pops in: "Welcome" / "Kwame Asante" / "VIP - 20:14" / mono "KWA-FIRE-7241089", with an emerald glow wash. Small caption under it: "Instant QR scan verdict."
Sequential/interaction: yes - simulated scan: band sweep, then verdict card pop, then the mono ref fading in last
Audio intent: the one moment of tension and release in the video
Audio-coupled idea: short interface confirm exactly on the verdict pop, landing with the visual
Music: continues; nothing should mask the confirm
Transition mood: clean cut -> Scene 4

### Scene 4 — The broadcast — 4.0s
A glass SMS composer card, centered. The message body reads the project's own demo text: "Hi Kwame, your ticket for Fire Conference 2026 is confirmed. Ref: KWA-FIRE-7241089. Show at the gate. See you there!" Under it three delivery rows arrive one by one on the beat grid (13.11 / 13.64 / 14.20): "Sent 342" (muted), "Delivered 338" (emerald), "Failed 4" (crimson). Delivered counts up 0 -> 338. All three hold together until the scene ends. Caption: "Send instant updates to every registrant with one click."
Sequential/interaction: yes - three rows beat-gridded, then held as a set; the delivered number ticks up
Audio intent: momentum, the sense of reach
Audio-coupled idea: three light ticks on the row arrivals; count-up stays silent
Music: builds toward the 15.82s strong cue
Transition mood: soft crossfade -> Scene 5

### Scene 5 — Logo close — 3.0s
Black. The real EventHene crown logo scales in from 0.92 with a gold bloom, beat-locked to the 18.55s strong cue. Wordmark "EventHene" under it, then one line in muted ink: "The operating system for event organizers in Africa." and finally "eventhene.com" in gold. Music fades out under it.
Sequential/interaction: yes - logo, then wordmark, then the line, then the domain
Audio intent: land it and let the room go quiet
Audio-coupled idea: one dry impact on the logo landing, ringing over the music fade
Music: fade out across the last 1.2s
Transition mood: hold to black - end

**Music mood for this video:** polished upbeat business bed, restrained
**Audio summary:** A warm low bed opens the film, carries one physical card arrival and one interface confirm at the gate, builds through the broadcast rows to a strong cue, and fades out under a single dry logo impact.

## Duration check
3.4 + 4.6 + 5.0 + 4.0 + 3.0 = **20.0s** (inside the 15-25s window)
