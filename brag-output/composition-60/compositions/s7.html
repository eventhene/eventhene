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
        #kpis {
          display: flex;
          gap: 28px;
        }
        #kpis .k {
          width: 348px;
          padding: 46px 40px;
          opacity: 0;
        }
        #kpis .v {
          font-size: 84px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
        }
        #kpis .l {
          margin-top: 16px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
        }
        #kpis .gold .v {
          color: var(--accent);
        }
        #kpis .green .v {
          color: var(--emerald);
        }
        #kpis .pre {
          font-size: 48px;
          letter-spacing: -0.02em;
        }
        #s7-note {
          font-size: 30px;
          font-weight: 600;
          color: var(--muted);
          opacity: 0;
        }
      </style>

      <div id="root" data-composition-id="s7" data-width="1920" data-height="1080">
        <div class="w" id="s7-w">
          <div class="col">
            <h2 class="sec-h" id="s7-h">Live dashboard, export anytime.</h2>
            <div id="kpis">
              <div class="k card" id="k1"><p class="v"><span id="k1n">0</span></p><p class="l">Registered</p></div>
              <div class="k card green" id="k2"><p class="v"><span id="k2n">0</span></p><p class="l">Attended</p></div>
              <div class="k card gold" id="k3">
                <p class="v"><span class="pre">GHS </span><span id="k3n">0</span>k</p>
                <p class="l">Revenue</p>
              </div>
              <div class="k card" id="k4"><p class="v"><span id="k4n">0</span>%</p><p class="l">Show rate</p></div>
            </div>
            <p id="s7-note">Know exactly who showed up.</p>
          </div>
        </div>
      </div>

      <script>
        (function () {
          var tl = gsap.timeline({ paused: true });
          var E = "power3.out";
          tl.to("#s7-w", { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0.05);
          tl.fromTo("#s7-h", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.45, ease: E }, 0.53);

          // beat-grid: KPI cards at 42.56s, 43.65s, 44.74s, 45.84s global — every other
          // beat, so each number has time to read (slot starts at 41.47s)
          var cards = ["#k1", "#k2", "#k3", "#k4"];
          var nodes = ["k1n", "k2n", "k3n", "k4n"];
          var targets = [342, 289, 51, 84];
          var at = [1.09, 2.18, 3.27, 4.37];
          for (var i = 0; i < cards.length; i++) {
            tl.fromTo(cards[i], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: E }, at[i]);
            (function (node, target) {
              var counter = { v: 0 };
              var out = document.getElementById(node);
              tl.to(
                counter,
                {
                  v: target,
                  duration: 1.0,
                  ease: "power2.out",
                  onUpdate: function () {
                    out.textContent = String(Math.round(counter.v));
                  },
                },
                at[i],
              );
            })(nodes[i], targets[i]);
          }
          tl.fromTo("#s7-note", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: E }, 5.99);
          tl.to("#s7-w", { opacity: 0, duration: 0.3, ease: "power2.inOut" }, 7.64);
          window.__timelines["s7"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
