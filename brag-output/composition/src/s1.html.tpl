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
        #s1-kicker {
          opacity: 0;
        }
        #s1-head {
          margin-top: 34px;
          font-size: 150px;
          font-weight: 800;
          line-height: 1.02;
          letter-spacing: -0.035em;
        }
        #s1-head span {
          display: block;
          opacity: 0;
        }
        #s1-l2 {
          color: var(--accent);
        }
      </style>

      <div id="root" data-composition-id="s1" data-width="1920" data-height="1080">
        <div class="w" id="s1-w">
          <div class="pad">
            <div>
              <p id="s1-kicker" class="eyebrow">Now registering events in Ghana</p>
              <h1 id="s1-head">
                <span id="s1-l1">Your events,</span>
                <span id="s1-l2">elevated.</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <script>
        (function () {
          var tl = gsap.timeline({ paused: true });
          var E = "power3.out";
          tl.to("#s1-w", { opacity: 1, duration: 0.01 }, 0);
          tl.fromTo("#s1-kicker", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: E }, 0.25);
          tl.fromTo("#s1-l1", { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.55, ease: E }, 0.95);
          tl.fromTo("#s1-l2", { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.55, ease: E }, 1.1);
          // headline settled 1.65 → 3.0, then a soft crossfade out
          tl.to("#s1-w", { opacity: 0, duration: 0.3, ease: "power2.inOut" }, 3.0);
          window.__timelines["s1"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
