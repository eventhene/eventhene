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
        #s6-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 120px;
        }
        #finder {
          position: relative;
          width: 400px;
          height: 400px;
          flex: none;
          opacity: 0;
        }
        #finder .qr-plate {
          position: absolute;
          inset: 38px;
          border-radius: 16px;
          background: #fffdf6;
          padding: 18px;
          color: var(--accent-ink);
        }
        #finder .qr-plate svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        #finder .cnr {
          position: absolute;
          width: 80px;
          height: 80px;
          border: 7px solid var(--accent);
        }
        #finder .tl {
          top: 0;
          left: 0;
          border-right: 0;
          border-bottom: 0;
          border-radius: 16px 0 0 0;
        }
        #finder .tr {
          top: 0;
          right: 0;
          border-left: 0;
          border-bottom: 0;
          border-radius: 0 16px 0 0;
        }
        #finder .bl {
          bottom: 0;
          left: 0;
          border-right: 0;
          border-top: 0;
          border-radius: 0 0 0 16px;
        }
        #finder .br {
          bottom: 0;
          right: 0;
          border-left: 0;
          border-top: 0;
          border-radius: 0 0 16px 0;
        }
        #band {
          position: absolute;
          left: 26px;
          right: 26px;
          top: 38px;
          height: 7px;
          border-radius: 7px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          box-shadow: 0 0 36px 10px rgba(212, 168, 83, 0.45);
          opacity: 0;
        }
        #verdict {
          width: 600px;
          flex: none;
          border-radius: 28px;
          padding: 42px 44px;
          background: rgba(52, 211, 153, 0.09);
          border: 1px solid rgba(52, 211, 153, 0.3);
          box-shadow: 0 0 92px rgba(52, 211, 153, 0.13);
          opacity: 0;
        }
        #verdict .v-top {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        #verdict .v-check {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: var(--emerald);
          color: #052e20;
          font-size: 27px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #verdict .v-word {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--emerald);
        }
        #verdict .v-name {
          margin-top: 22px;
          font-size: 64px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.05;
        }
        #verdict .v-tier {
          margin-top: 12px;
          font-size: 27px;
          font-weight: 600;
          color: var(--muted);
        }
        #v-ref {
          margin-top: 28px;
          font-size: 25px;
          color: var(--emerald);
          opacity: 0;
        }
      </style>

      <div id="root" data-composition-id="s6" data-width="1920" data-height="1080">
        <div class="w" id="s6-w">
          <div class="col">
            <h2 class="sec-h" id="s6-h">Scan at the gate, instant verdict.</h2>
            <div id="s6-row">
              <div id="finder">
                <div class="qr-plate"><!--QR--></div>
                <span class="cnr tl"></span>
                <span class="cnr tr"></span>
                <span class="cnr bl"></span>
                <span class="cnr br"></span>
                <div id="band"></div>
              </div>
              <div id="verdict">
                <div class="v-top">
                  <span class="v-check">&#10003;</span>
                  <span class="v-word">Welcome</span>
                </div>
                <p class="v-name">Kwame Asante</p>
                <p class="v-tier">VIP &mdash; 20:14</p>
                <p id="v-ref" class="mono">KWA-FIRE-7241089</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script>
        (function () {
          var tl = gsap.timeline({ paused: true });
          var E = "power3.out";
          tl.to("#s6-w", { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0.05);
          tl.fromTo("#s6-h", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.45, ease: E }, 0.55);
          tl.fromTo("#finder", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.5, ease: E }, 1.09);
          // the scan: a band sweeps the code, then the gate answers
          tl.fromTo("#band", { opacity: 0, y: 0 }, { opacity: 1, duration: 0.18 }, 1.64);
          tl.to("#band", { y: 324, duration: 0.9, ease: "none" }, 1.64);
          tl.to("#band", { opacity: 0, duration: 0.14 }, 2.5);
          // beat-locked: the verdict pops on the 37.11s strong cue (slot starts at 33.83s)
          tl.fromTo(
            "#verdict",
            { opacity: 0, scale: 0.92 },
            { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.5)" },
            3.28,
          );
          tl.fromTo("#v-ref", { opacity: 0 }, { opacity: 1, duration: 0.35 }, 4.37);
          tl.to("#s6-w", { opacity: 0, duration: 0.3, ease: "power2.inOut" }, 7.64);
          window.__timelines["s6"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
