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
        #s2-left {
          width: 700px;
          opacity: 0;
        }
        #s2-h {
          margin-top: 26px;
          font-size: 90px;
          font-weight: 800;
          line-height: 1.04;
          letter-spacing: -0.03em;
        }
        #s2-p {
          margin-top: 22px;
          font-size: 33px;
          font-weight: 600;
          color: var(--muted);
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
          margin: 30px -44px 0;
          border-top: 3px dashed rgba(26, 20, 7, 0.26);
        }
        #qr-box {
          margin: 32px auto 0;
          width: 268px;
          height: 268px;
          border-radius: 18px;
          background: #fffdf6;
          padding: 18px;
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
          padding-top: 26px;
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

      <div id="root" data-composition-id="s2" data-width="1920" data-height="1080">
        <div class="w" id="s2-w">
          <div class="pad">
            <div id="s2-left">
              <p class="eyebrow">Ticketing</p>
              <h2 id="s2-h">QR-coded tickets</h2>
              <p id="s2-p">Attendees screenshot them.</p>
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
          tl.to("#s2-w", { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0.05);
          // the ticket arrives like something handed over, and settles on a slight tilt
          tl.fromTo(
            "#ticket",
            { opacity: 0, y: 132, rotation: 7 },
            { opacity: 1, y: 0, rotation: 3, duration: 0.75, ease: E },
            0.25,
          );
          tl.fromTo("#s2-left", { opacity: 0, x: -34 }, { opacity: 1, x: 0, duration: 0.55, ease: E }, 0.45);
          tl.fromTo("#qr-box", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4, ease: E }, 1.15);
          // the ticket ref types on in mono
          tl.fromTo(
            "#t-ref",
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "steps(16)" },
            1.7,
          );
          tl.to("#s2-w", { opacity: 0, duration: 0.3, ease: "power2.inOut" }, 4.6);
          window.__timelines["s2"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
