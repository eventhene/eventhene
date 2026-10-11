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
        #s4-col {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 46px;
        }
        #s4-h {
          max-width: 1420px;
          text-align: center;
          text-wrap: balance;
          font-size: 60px;
          font-weight: 800;
          letter-spacing: -0.028em;
          line-height: 1.14;
          opacity: 0;
        }
        #sms {
          width: 1000px;
          border-radius: 28px;
          padding: 38px 42px 34px;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          box-shadow: 0 40px 92px rgba(0, 0, 0, 0.5);
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
          color: var(--accent);
        }
        #sms .s-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: var(--accent);
        }
        #s4-msg {
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
        #s4-rows {
          margin-top: 30px;
          display: flex;
          gap: 56px;
          font-size: 30px;
          font-weight: 800;
        }
        #s4-rows > div {
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

      <div id="root" data-composition-id="s4" data-width="1920" data-height="1080">
        <div class="w" id="s4-w">
          <div id="s4-col">
            <h2 id="s4-h">Send instant updates to every registrant with one click.</h2>
            <div id="sms">
              <p class="s-head"><span class="s-dot"></span>Bulk broadcast</p>
              <p id="s4-msg">Hi Kwame, your ticket for Fire Conference 2026 is confirmed.</p>
              <div id="s4-rows">
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
          tl.to("#s4-w", { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0.05);
          tl.fromTo("#sms", { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.55, ease: E }, 0.2);
          tl.fromTo("#s4-msg", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.7);
          tl.fromTo("#s4-h", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: E }, 1.1);
          // beat-grid: rows at 14.20s, 14.73s, 15.28s global (host starts at 12.2s)
          tl.fromTo("#r1", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, ease: E }, 2.0);
          tl.fromTo("#r2", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, ease: E }, 2.53);
          tl.fromTo("#r3", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, ease: E }, 3.08);
          // beat-locked: the delivered count finishes on the 15.82s strong cue
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
            2.88,
          );
          tl.to("#s4-w", { opacity: 0, duration: 0.3, ease: "power2.inOut" }, 4.8);
          window.__timelines["s4"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
