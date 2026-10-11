<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>EventHene</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face {
        font-family: "EH Sans";
        src: url("assets/fonts/Inter-400.woff") format("woff");
        font-weight: 400;
        font-display: block;
      }
      @font-face {
        font-family: "EH Sans";
        src: url("assets/fonts/Inter-600.woff") format("woff");
        font-weight: 600;
        font-display: block;
      }
      @font-face {
        font-family: "EH Sans";
        src: url("assets/fonts/Inter-800.woff") format("woff");
        font-weight: 800;
        font-display: block;
      }
      @font-face {
        font-family: "EH Mono";
        src: url("assets/fonts/JetBrainsMono-700.woff") format("woff");
        font-weight: 700;
        font-display: block;
      }

      /* EventHene design tokens, lifted from the app's globals.css */
      #stage {
        --bg: #0a0a0c;
        --ink: #f0ede8;
        --ink-2: #d4d0c8;
        --muted: #a8a69c;
        --accent: #d4a853;
        --accent-ink: #1a1407;
        --emerald: #34d399;
        --crimson: #f87171;
        --glass: rgba(255, 255, 255, 0.05);
        --glass-border: rgba(255, 255, 255, 0.1);
        --energy: 0;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html,
      body {
        width: 1920px;
        height: 1080px;
        overflow: hidden;
        background: #0a0a0c;
      }
      #stage {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: var(--bg);
        color: var(--ink);
        font-family: "EH Sans", system-ui, sans-serif;
        font-weight: 600;
        -webkit-font-smoothing: antialiased;
      }

      /* shared background, untimed; --energy is driven by the music */
      #bg-glow {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(
            860px 640px at 14% 15%,
            rgba(212, 168, 83, calc(0.085 + 0.1 * var(--energy))),
            transparent 68%
          ),
          radial-gradient(940px 720px at 88% 88%, rgba(184, 134, 11, 0.06), transparent 70%);
      }
      #bg-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(1400px 920px at 50% 50%, transparent 42%, rgba(0, 0, 0, 0.6));
      }

      /* shared type helpers used inside the scene sub-compositions */
      .eyebrow {
        font-size: 23px;
        font-weight: 800;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--accent);
      }
      .mono {
        font-family: "EH Mono", ui-monospace, monospace;
        font-weight: 700;
      }
      .pad {
        position: absolute;
        inset: 0;
        padding: 0 150px;
        display: flex;
        align-items: center;
      }
      .w {
        position: absolute;
        inset: 0;
        opacity: 0;
      }
    </style>
  </head>
  <body>
    <div
      id="stage"
      data-composition-id="main"
      data-start="0"
      data-duration="20"
      data-width="1920"
      data-height="1080"
    >
      <div id="bg-glow"></div>
      <div id="bg-vignette"></div>

      <div
        id="slot-s1"
        data-composition-id="s1"
        data-composition-src="compositions/s1.html"
        data-start="0"
        data-duration="3.3"
        data-track-index="0"
        data-width="1920"
        data-height="1080"
      ></div>
      <div
        id="slot-s2"
        data-composition-id="s2"
        data-composition-src="compositions/s2.html"
        data-start="3.0"
        data-duration="4.9"
        data-track-index="1"
        data-width="1920"
        data-height="1080"
      ></div>
      <div
        id="slot-s3"
        data-composition-id="s3"
        data-composition-src="compositions/s3.html"
        data-start="7.6"
        data-duration="4.9"
        data-track-index="2"
        data-width="1920"
        data-height="1080"
      ></div>
      <div
        id="slot-s4"
        data-composition-id="s4"
        data-composition-src="compositions/s4.html"
        data-start="12.2"
        data-duration="5.1"
        data-track-index="3"
        data-width="1920"
        data-height="1080"
      ></div>
      <div
        id="slot-s5"
        data-composition-id="s5"
        data-composition-src="compositions/s5.html"
        data-start="17.0"
        data-duration="3.0"
        data-track-index="4"
        data-width="1920"
        data-height="1080"
      ></div>

      <!-- ===== audio ===== -->
      <audio
        id="music"
        src="assets/music/music.mp3"
        data-start="0"
        data-duration="20"
        data-track-index="6"
        data-volume="0.5"
        data-fade-in="0.6"
        data-fade-out="1.3"
      ></audio>
      <!-- the ticket being handed over -->
      <audio
        id="sfx-card"
        src="assets/sfx/card.ogg"
        data-start="3.25"
        data-duration="0.6"
        data-track-index="7"
        data-volume="0.5"
      ></audio>
      <!-- the gate accepting the scan -->
      <audio
        id="sfx-confirm"
        src="assets/sfx/confirm.ogg"
        data-start="9.2"
        data-duration="0.12"
        data-track-index="7"
        data-volume="0.6"
      ></audio>
      <!-- three delivery rows, on the beat grid -->
      <audio
        id="sfx-t1"
        src="assets/sfx/tick.ogg"
        data-start="14.2"
        data-duration="0.06"
        data-track-index="8"
        data-volume="0.32"
      ></audio>
      <audio
        id="sfx-t2"
        src="assets/sfx/tick.ogg"
        data-start="14.73"
        data-duration="0.06"
        data-track-index="8"
        data-volume="0.32"
      ></audio>
      <audio
        id="sfx-t3"
        src="assets/sfx/tick.ogg"
        data-start="15.28"
        data-duration="0.06"
        data-track-index="8"
        data-volume="0.32"
      ></audio>
      <!-- the logo landing -->
      <audio
        id="sfx-impact"
        src="assets/sfx/impact.ogg"
        data-start="17.47"
        data-duration="0.18"
        data-track-index="7"
        data-volume="0.55"
      ></audio>
    </div>

    <script src="assets/audio-data.js"></script>
    <script>
      (function () {
        var tl = gsap.timeline({ paused: true });

        /* Audio-reactive: the gold warmth breathes with the music.
           Subtle and brand-specific — background glow, ticket bloom, logo bloom
           all read --energy. No waveforms, no bars, no particles. */
        var stage = document.getElementById("stage");
        var A = window.AUDIO_DATA;
        if (A && A.frames && A.frames.length) {
          var FPS = A.fps || 30;
          var LAST = Math.min(A.frames.length, Math.ceil(20 * FPS));
          var smooth = 0;
          for (var f = 0; f < LAST; f++) {
            var fr = A.frames[f];
            var bass = (fr.bands[0] + fr.bands[1] + fr.bands[2]) / 3;
            var level = Math.min(1, bass * 0.72 + (fr.rms || 0) * 0.28);
            smooth = smooth * 0.62 + level * 0.38;
            tl.call(
              (function (v) {
                return function () {
                  stage.style.setProperty("--energy", v);
                };
              })(smooth.toFixed(3)),
              [],
              f / FPS,
            );
          }
        }

        window.__timelines["main"] = tl;
        tl.seek(0);
      })();
    </script>
  </body>
</html>
