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
        #sms {
          width: 1000px;
          padding: 38px 42px 34px;
          opacity: 0;
        }
        #sms .s-head {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--emerald);
        }
        #sms .s-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: var(--emerald);
        }
        #s5-msg {
          margin-top: 24px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.07);
          padding: 28px 30px;
          font-size: 33px;
          font-weight: 600;
          line-height: 1.45;
          color: var(--ink-2);
          opacity: 0;
        }
        #s5-rows {
          margin-top: 30px;
          display: flex;
          gap: 56px;
          font-size: 30px;
          font-weight: 800;
        }
        #s5-rows > div {
          opacity: 0;
        }
        .r-sent {
          color: var(--muted);
        }
        .r-del {
          color: var(--emerald);
        }
        .r-fail {
          color: var(--crimson);
        }
      </style>

      <div id="root" data-composition-id="s5" data-width="1920" data-height="1080">
        <div class="w" id="s5-w">
          <div class="col">
            <h2 class="sec-h" id="s5-h">Instant broadcasts to every registrant.</h2>
            <div id="sms" class="card">
              <p class="s-head"><span class="s-dot"></span>EventHene SMS &mdash; 342 recipients</p>
              <p id="s5-msg">Hi Kwame, your ticket for Fire Conference 2026 is confirmed.</p>
              <div id="s5-rows">
                <div id="r1" class="r-sent">Sent 342</div>
                <div id="r2" class="r-del">Delivered <span id="r2n">0</span></div>
                <div id="r3" class="r-fail">Failed 4</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script>
        (function () {
          var tl = gsap.timeline({ paused: true });
          var E = "power3.out";
          tl.to("#s5-w", { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0.05);
          tl.fromTo("#s5-h", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.45, ease: E }, 0.54);
          tl.fromTo("#sms", { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.55, ease: E }, 1.1);
          tl.fromTo("#s5-msg", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 2.17);
          // beat-grid: rows at 30.01s, 30.56s, 31.10s global (slot starts at 26.2s)
          var ids = ["#r1", "#r2", "#r3"];
          var at = [3.81, 4.36, 4.9];
          for (var i = 0; i < ids.length; i++) {
            tl.fromTo(ids[i], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, ease: E }, at[i]);
          }
          // beat-locked: the delivered count finishes on the 32.74s strong cue
          var counter = { v: 0 };
          var out = document.getElementById("r2n");
          tl.to(
            counter,
            {
              v: 338,
              duration: 0.74,
              ease: "power2.out",
              onUpdate: function () {
                out.textContent = String(Math.round(counter.v));
              },
            },
            5.8,
          );
          tl.to("#s5-w", { opacity: 0, duration: 0.3, ease: "power2.inOut" }, 7.63);
          window.__timelines["s5"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
