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
        #s4-left {
          width: 760px;
        }
        #s4-h {
          max-width: 760px;
          text-align: left;
          font-size: 76px;
          line-height: 1.08;
        }
        #tiers {
          margin-top: 44px;
          display: flex;
          gap: 16px;
        }
        #tiers .tier {
          padding: 16px 30px;
          border-radius: 999px;
          border: 1px solid rgba(212, 168, 83, 0.4);
          background: rgba(212, 168, 83, 0.1);
          color: var(--accent);
          font-size: 25px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0;
        }
        #ticket {
          position: absolute;
          top: 187px;
          right: 186px;
          width: 520px;
          height: 706px;
          border-radius: 30px;
          padding: 44px 44px 38px;
          display: flex;
          flex-direction: column;
          color: var(--accent-ink);
          background: linear-gradient(158deg, #e8c377 0%, #d4a853 42%, #b8860b 100%);
          box-shadow:
            0 48px 92px rgba(0, 0, 0, 0.62),
            inset 0 0 0 1px rgba(255, 255, 255, 0.22),
            0 0 70px rgba(212, 168, 83, calc(0.16 + 0.22 * var(--energy)));
          opacity: 0;
        }
        #ticket .t-top {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          opacity: 0.68;
        }
        #ticket .t-name {
          margin-top: 20px;
          font-size: 46px;
          font-weight: 800;
          line-height: 1.04;
          letter-spacing: -0.025em;
        }
        #ticket .t-meta {
          margin-top: 16px;
          font-size: 22px;
          font-weight: 600;
          opacity: 0.74;
          line-height: 1.5;
        }
        #ticket .t-sep {
          opacity: 0.45;
        }
        #ticket .perf {
          margin: 28px -44px 0;
          border-top: 3px dashed rgba(26, 20, 7, 0.26);
        }
        #qr-box {
          margin: 28px auto 0;
          width: 252px;
          height: 252px;
          border-radius: 18px;
          background: #fffdf6;
          padding: 17px;
          color: var(--accent-ink);
          opacity: 0;
        }
        #qr-box svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        #ticket .t-foot {
          margin-top: auto;
          padding-top: 22px;
        }
        #ticket .t-lab {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          opacity: 0.62;
        }
        #t-ref {
          margin-top: 7px;
          font-size: 29px;
          white-space: nowrap;
          clip-path: inset(0 100% 0 0);
        }
      </style>

      <div id="root" data-composition-id="s4" data-width="1920" data-height="1080">
        <div class="w" id="s4-w">
          <div class="pad">
            <div id="s4-left">
              <h2 class="sec-h" id="s4-h">Every ticket feels like a keepsake, not a receipt.</h2>
              <div id="tiers">
                <span class="tier" id="tr1">Regular</span>
                <span class="tier" id="tr2">VIP</span>
                <span class="tier" id="tr3">VVIP</span>
              </div>
            </div>
          </div>
          <div id="ticket">
            <p class="t-top">EventHene ticket</p>
            <p class="t-name">Fire Conference 2026</p>
            <p class="t-meta">Sat, Nov 14 2026<span class="t-sep"> &middot; </span>Christ Temple, Ghana</p>
            <div class="perf"></div>
            <div id="qr-box"><!--QR--></div>
            <div class="t-foot">
              <p class="t-lab">Ticket ID</p>
              <p id="t-ref" class="mono">KWA-FIRE-7241089</p>
            </div>
          </div>
        </div>
      </div>

      <script>
        (function () {
          var tl = gsap.timeline({ paused: true });
          var E = "power3.out";
          tl.to("#s4-w", { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0.05);
          tl.fromTo("#s4-h", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: E }, 0.54);
          // beat-locked: the ticket arrives on the 19.66s strong cue (slot starts at 18.02s)
          tl.fromTo(
            "#ticket",
            { opacity: 0, y: 132, rotation: 7 },
            { opacity: 1, y: 0, rotation: 3, duration: 0.75, ease: E },
            1.64,
          );
          tl.fromTo("#qr-box", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4, ease: E }, 3.26);
          // the HMAC-signed reference types on in mono
          tl.fromTo(
            "#t-ref",
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "steps(16)" },
            4.35,
          );
          // beat-grid: tiers at 23.46s, 24.02s, 24.56s global
          var ids = ["#tr1", "#tr2", "#tr3"];
          var at = [5.44, 6.0, 6.54];
          for (var i = 0; i < ids.length; i++) {
            tl.fromTo(ids[i], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3, ease: E }, at[i]);
          }
          tl.to("#s4-w", { opacity: 0, duration: 0.3, ease: "power2.inOut" }, 8.18);
          window.__timelines["s4"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
