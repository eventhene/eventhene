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
        #s9-price {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }
        #s9-price .p {
          padding: 34px 48px;
          border-radius: 20px;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          font-size: 44px;
          font-weight: 800;
          letter-spacing: -0.025em;
          opacity: 0;
        }
        #s9-price .gold {
          color: var(--accent);
          border-color: rgba(212, 168, 83, 0.4);
          background: rgba(212, 168, 83, 0.1);
        }
        #s9-end {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 42px;
        }
        #s9-logo {
          width: 460px;
          height: auto;
          display: block;
          opacity: 0;
          filter: drop-shadow(0 0 calc(24px + 38px * var(--energy)) rgba(212, 168, 83, 0.4));
        }
        #s9-foot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
        }
        #s9-rule {
          width: 300px;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0;
        }
        #s9-dom {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0;
        }
      </style>

      <div id="root" data-composition-id="s9" data-width="1920" data-height="1080">
        <div class="w" id="s9-w">
          <div id="s9-price">
            <span class="p" id="p1">Free to publish</span>
            <span class="p gold" id="p2">8% per paid ticket</span>
            <span class="p" id="p3">Zero monthly fees</span>
          </div>
          <div id="s9-end">
            <img id="s9-logo" src="assets/img/logo-full.png" alt="EventHene" />
            <div id="s9-foot">
              <div id="s9-rule"></div>
              <p id="s9-dom">eventhene.com</p>
            </div>
          </div>
        </div>
      </div>

      <script>
        (function () {
          var tl = gsap.timeline({ paused: true });
          var E = "power3.out";
          tl.to("#s9-w", { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0.05);
          // beat-grid: the three price facts at 54.00s, 54.57s, 55.10s global
          // (slot starts at 53.2s), then the set holds for ~1.9s before the close
          var ids = ["#p1", "#p2", "#p3"];
          var at = [0.8, 1.37, 1.9];
          for (var i = 0; i < ids.length; i++) {
            tl.fromTo(ids[i], { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.35, ease: E }, at[i]);
          }
          tl.to("#s9-price", { opacity: 0, duration: 0.35, ease: "power2.inOut" }, 3.1);
          // beat-grid: the logo lands on the 56.75s beat
          tl.fromTo("#s9-logo", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5, ease: E }, 3.55);
          // beat-locked: the rule sweep and the domain land on the 58.38s beat
          tl.fromTo("#s9-rule", { opacity: 0, scaleX: 0.2 }, { opacity: 1, scaleX: 1, duration: 0.45, ease: E }, 5.18);
          tl.fromTo("#s9-dom", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: E }, 5.25);
          window.__timelines["s9"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
