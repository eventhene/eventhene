<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>EventHene — features</title>
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
        --sky: #60a5fa;
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

      /* shared helpers used inside the scene sub-compositions */
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
      /* persistent brand mark, so the video is identifiable from the first frame */
      #mark {
        position: absolute;
        top: 54px;
        right: 64px;
        width: 188px;
        height: auto;
        display: block;
        opacity: 0;
        z-index: 20;
      }
      /* centred scene column used by most feature scenes */
      .col {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 52px;
      }
      .sec-h {
        max-width: 1400px;
        text-align: center;
        text-wrap: balance;
        font-size: 64px;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.12;
        opacity: 0;
      }
      .card {
        border-radius: 24px;
        background: var(--glass);
        border: 1px solid var(--glass-border);
        box-shadow: 0 32px 72px rgba(0, 0, 0, 0.45);
      }
    </style>
  </head>
  <body>
    <div
      id="stage"
      data-composition-id="main"
      data-start="0"
      data-duration="60"
      data-width="1920"
      data-height="1080"
    >
      <div id="bg-glow"></div>
      <div id="bg-vignette"></div>
      <img id="mark" src="assets/img/logo-full.png" alt="EventHene" />

      <!-- Scene slots. Every boundary sits on a beat of the 110 BPM grid. -->
      <div id="slot-s1" data-composition-id="s1" data-composition-src="compositions/s1.html"
        data-start="0" data-duration="6.0" data-track-index="0" data-width="1920" data-height="1080"></div>
      <div id="slot-s2" data-composition-id="s2" data-composition-src="compositions/s2.html"
        data-start="5.74" data-duration="6.28" data-track-index="1" data-width="1920" data-height="1080"></div>
      <div id="slot-s3" data-composition-id="s3" data-composition-src="compositions/s3.html"
        data-start="11.46" data-duration="7.1" data-track-index="2" data-width="1920" data-height="1080"></div>
      <div id="slot-s4" data-composition-id="s4" data-composition-src="compositions/s4.html"
        data-start="18.02" data-duration="8.72" data-track-index="3" data-width="1920" data-height="1080"></div>
      <div id="slot-s5" data-composition-id="s5" data-composition-src="compositions/s5.html"
        data-start="26.2" data-duration="8.18" data-track-index="0" data-width="1920" data-height="1080"></div>
      <div id="slot-s6" data-composition-id="s6" data-composition-src="compositions/s6.html"
        data-start="33.83" data-duration="8.17" data-track-index="1" data-width="1920" data-height="1080"></div>
      <div id="slot-s7" data-composition-id="s7" data-composition-src="compositions/s7.html"
        data-start="41.47" data-duration="8.17" data-track-index="2" data-width="1920" data-height="1080"></div>
      <div id="slot-s8" data-composition-id="s8" data-composition-src="compositions/s8.html"
        data-start="49.11" data-duration="4.35" data-track-index="3" data-width="1920" data-height="1080"></div>
      <div id="slot-s9" data-composition-id="s9" data-composition-src="compositions/s9.html"
        data-start="53.2" data-duration="6.8" data-track-index="0" data-width="1920" data-height="1080"></div>

      <!-- ===== audio ===== -->
      <audio id="music" src="assets/music/music.mp3" data-start="0" data-duration="60"
        data-track-index="6" data-volume="0.46" data-fade-in="0.8" data-fade-out="1.6"></audio>

      <!-- registration fields arriving, on the beat grid -->
      <audio id="sfx-f1" src="assets/sfx/tick.ogg" data-start="13.11" data-duration="0.06" data-track-index="8" data-volume="0.3"></audio>
      <audio id="sfx-f2" src="assets/sfx/tick.ogg" data-start="13.64" data-duration="0.06" data-track-index="8" data-volume="0.3"></audio>
      <audio id="sfx-f3" src="assets/sfx/tick.ogg" data-start="14.2" data-duration="0.06" data-track-index="8" data-volume="0.3"></audio>
      <audio id="sfx-f4" src="assets/sfx/tick.ogg" data-start="14.73" data-duration="0.06" data-track-index="8" data-volume="0.3"></audio>
      <!-- the ticket being handed over -->
      <audio id="sfx-card" src="assets/sfx/card.ogg" data-start="19.66" data-duration="0.6" data-track-index="7" data-volume="0.5"></audio>
      <!-- delivery rows -->
      <audio id="sfx-t1" src="assets/sfx/tick.ogg" data-start="30.01" data-duration="0.06" data-track-index="8" data-volume="0.3"></audio>
      <audio id="sfx-t2" src="assets/sfx/tick.ogg" data-start="30.56" data-duration="0.06" data-track-index="8" data-volume="0.3"></audio>
      <audio id="sfx-t3" src="assets/sfx/tick.ogg" data-start="31.1" data-duration="0.06" data-track-index="8" data-volume="0.3"></audio>
      <!-- the gate accepting the scan -->
      <audio id="sfx-confirm" src="assets/sfx/confirm.ogg" data-start="37.11" data-duration="0.12" data-track-index="7" data-volume="0.6"></audio>
      <!-- the dashboard filling in -->
      <audio id="sfx-soft" src="assets/sfx/soft.ogg" data-start="42.56" data-duration="0.57" data-track-index="7" data-volume="0.3"></audio>
      <!-- the logo landing -->
      <audio id="sfx-impact" src="assets/sfx/impact.ogg" data-start="56.75" data-duration="0.18" data-track-index="7" data-volume="0.55"></audio>
    </div>

    <script src="assets/audio-data.js"></script>
    <script>
      (function () {
        var tl = gsap.timeline({ paused: true });

        /* The corner mark rides the whole tour, then clears the frame just
           before the full logo lands in the closing scene. */
        tl.fromTo("#mark", { opacity: 0, y: -14 }, { opacity: 0.82, y: 0, duration: 0.5, ease: "power3.out" }, 0.56);
        tl.to("#mark", { opacity: 0, duration: 0.4, ease: "power2.inOut" }, 53.2);

        /* Audio-reactive: the gold warmth breathes with the music.
           Subtle and brand-specific — background glow, ticket bloom and logo
           bloom read --energy. No waveforms, no bars, no particles. */
        var stage = document.getElementById("stage");
        var A = window.AUDIO_DATA;
        if (A && A.frames && A.frames.length) {
          var FPS = A.fps || 30;
          var LAST = Math.min(A.frames.length, Math.ceil(60 * FPS));
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
