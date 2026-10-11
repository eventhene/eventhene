<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <template>
      <style>
        #root {
          position: absolute;
          inset: 0;
        }
        #s2-stats {
          display: flex;
          gap: 28px;
        }
        #s2-stats .st {
          width: 348px;
          padding: 46px 40px;
          opacity: 0;
        }
        #s2-stats .v {
          font-size: 86px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
        }
        #s2-stats .l {
          margin-top: 16px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
        }
        #s2-stats .gold .v {
          color: var(--accent);
        }
      </style>

      <div id="root" data-composition-id="s2" data-width="1920" data-height="1080">
        <div class="w" id="s2-w">
          <div class="col">
            <h2 class="sec-h" id="s2-h">Built for organizers.</h2>
            <div id="s2-stats">
              <div class="st card" id="st1"><p class="v">5 min</p><p class="l">to set up</p></div>
              <div class="st card gold" id="st2"><p class="v">GHS 0</p><p class="l">monthly fees</p></div>
              <div class="st card gold" id="st3"><p class="v">8%</p><p class="l">per paid ticket</p></div>
              <div class="st card" id="st4"><p class="v">24/7</p><p class="l">attendance exports</p></div>
            </div>
          </div>
        </div>
      </div>

      <script>
        (function () {
          var tl = gsap.timeline({ paused: true });
          var E = "power3.out";
          tl.to("#s2-w", { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0.05);
          tl.fromTo("#s2-h", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.45, ease: E }, 0.3);
          // beat-grid: cards at 7.09s, 7.64s, 8.19s, 8.74s global (slot starts at 5.74s),
          // then the whole set holds for ~3s so every label is readable
          var ids = ["#st1", "#st2", "#st3", "#st4"];
          var at = [1.35, 1.9, 2.45, 3.0];
          for (var i = 0; i < ids.length; i++) {
            tl.fromTo(ids[i], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: E }, at[i]);
          }
          tl.to("#s2-w", { opacity: 0, duration: 0.28, ease: "power2.inOut" }, 5.6);
          window.__timelines["s2"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
